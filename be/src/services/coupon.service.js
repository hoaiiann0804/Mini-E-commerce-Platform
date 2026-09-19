const { Coupon, Order } = require('../models');
const { Op } = require('sequelize');
const { AppError } = require('../middlewares/errorHandler');

/**
 * Coupon Service — Tách biệt toàn bộ logic nghiệp vụ coupon
 *
 * TƯ DUY KIẾN TRÚC:
 * - Controller chỉ lo nhận request/trả response
 * - Service lo validate rules, tính toán, và side effects
 * - Dễ test, dễ reuse (checkout, cart preview, admin tools)
 *
 * TƯ DUY NGHIỆP VỤ:
 * - Mọi tính toán discount đều server-side → "Never trust the client"
 * - Race condition khi coupon sắp hết lượt → SELECT FOR UPDATE (Pessimistic Lock)
 * - Cross-check user usage → COUNT orders có couponId + userId
 */

/**
 * Tính số tiền giảm giá dựa trên loại coupon và subtotal
 *
 * RULES:
 * - percentage: giảm X% nhưng cap bởi maxDiscount (nếu có)
 * - fixed: giảm số tiền cố định nhưng không vượt quá subtotal
 *
 * Ví dụ:
 *   percentage 20%, maxDiscount 500K, subtotal 3 triệu → giảm 500K (cap)
 *   percentage 10%, no maxDiscount, subtotal 1 triệu → giảm 100K
 *   fixed 300K, subtotal 200K → giảm 200K (không giảm vượt giá trị đơn)
 */
const calculateDiscount = (coupon, subtotal) => {
  const value = parseFloat(coupon.value);
  const sub = parseFloat(subtotal);

  if (coupon.type === 'percentage') {
    let discountAmount = sub * (value / 100);
    // Cap bởi maxDiscount nếu có
    if (coupon.maxDiscount) {
      discountAmount = Math.min(discountAmount, parseFloat(coupon.maxDiscount));
    }
    return Math.round(discountAmount * 100) / 100; // Làm tròn 2 chữ số
  }

  if (coupon.type === 'fixed') {
    // Không giảm nhiều hơn giá trị đơn hàng
    return Math.min(value, sub);
  }

  return 0;
};

/**
 * Validate coupon có hợp lệ với đơn hàng hiện tại không
 *
 * LUỒNG KIỂM TRA (thứ tự quan trọng — fail fast):
 * 1. Coupon tồn tại?
 * 2. Coupon đang active?
 * 3. Coupon trong khung thời gian hiệu lực?
 * 4. Coupon chưa hết lượt toàn hệ thống?
 * 5. User chưa vượt quota cá nhân?
 * 6. Subtotal đủ điều kiện minOrderAmount?
 *
 * @param {string} code - Mã coupon user nhập
 * @param {number} subtotal - Tổng tiền hàng trước giảm giá
 * @param {string} userId - ID user đang đặt hàng
 * @param {object|null} transaction - Sequelize transaction (nếu đang trong createOrder)
 * @returns {{ valid: boolean, coupon: object, discountAmount: number }}
 */
const validateCoupon = async (code, subtotal, userId, transaction = null) => {
  const normalizedCode = code.trim().toUpperCase();

  // --- Bước 1: Tìm coupon theo code ---
  // Nếu đang trong transaction (createOrder), dùng SELECT FOR UPDATE
  // để lock record, chống race condition khi coupon sắp hết lượt
  const queryOptions = {
    where: { code: normalizedCode },
  };

  if (transaction) {
    queryOptions.transaction = transaction;
    queryOptions.lock = transaction.LOCK.UPDATE; // Pessimistic Lock
  }

  const coupon = await Coupon.findOne(queryOptions);

  if (!coupon) {
    throw new AppError('Mã giảm giá không tồn tại', 404);
  }

  // --- Bước 2: Kiểm tra isActive ---
  if (!coupon.isActive) {
    throw new AppError('Mã giảm giá đã bị vô hiệu hóa', 400);
  }

  // --- Bước 3: Kiểm tra khung thời gian ---
  const now = new Date();

  if (now < new Date(coupon.startDate)) {
    throw new AppError('Mã giảm giá chưa đến thời gian áp dụng', 400);
  }

  if (now > new Date(coupon.expiresAt)) {
    throw new AppError('Mã giảm giá đã hết hạn', 400);
  }

  // --- Bước 4: Kiểm tra tổng lượt sử dụng ---
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    throw new AppError('Mã giảm giá đã hết lượt sử dụng', 400);
  }

  // --- Bước 5: Kiểm tra lượt sử dụng của user ---
  // Đếm số order của user này đã dùng coupon này
  // Chỉ đếm order chưa bị cancelled/expired (đơn hủy nên hoàn lại lượt)
  const userUsageCount = await Order.count({
    where: {
      userId,
      couponId: coupon.id,
      status: { [Op.notIn]: ['cancelled', 'expired'] },
    },
    ...(transaction ? { transaction } : {}),
  });

  if (userUsageCount >= coupon.usagePerUser) {
    throw new AppError(
      `Bạn đã sử dụng mã này ${userUsageCount}/${coupon.usagePerUser} lần`,
      400
    );
  }

  // --- Bước 6: Kiểm tra giá trị đơn tối thiểu ---
  const minAmount = parseFloat(coupon.minOrderAmount);
  if (parseFloat(subtotal) < minAmount) {
    throw new AppError(
      `Đơn hàng tối thiểu ${minAmount.toLocaleString('vi-VN')}đ để sử dụng mã này`,
      400
    );
  }

  // --- Tính discount ---
  const discountAmount = calculateDiscount(coupon, subtotal);

  return {
    valid: true,
    coupon,
    discountAmount,
  };
};

/**
 * Áp dụng coupon: tăng usedCount
 *
 * TƯ DUY KỸ THUẬT:
 * Dùng increment() thay vì update({ usedCount: usedCount + 1 })
 * vì increment() dịch thành SQL: UPDATE SET used_count = used_count + 1
 * → Atomic ở tầng DB, an toàn trong concurrent requests.
 *
 * @param {string} couponId - ID coupon cần tăng usedCount
 * @param {object} transaction - Sequelize transaction (bắt buộc)
 */
const applyCoupon = async (couponId, transaction) => {
  await Coupon.increment('usedCount', {
    by: 1,
    where: { id: couponId },
    transaction,
  });
};

module.exports = {
  validateCoupon,
  calculateDiscount,
  applyCoupon,
};
