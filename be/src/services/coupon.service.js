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

/**
 * Hoàn lại 1 lượt dùng coupon khi đơn hàng bị hủy hoặc hết hạn
 *
 * TƯ DUY NGHIỆP VỤ & KỸ THUẬT (SAGA / COMPENSATION PATTERN):
 * - Khi đơn hàng ở trạng thái pending bị timeout giữ kho (15 phút) hoặc khách/admin hủy đơn:
 *   Cần giải phóng tài nguyên coupon để khách hàng có thể tái sử dụng và không làm hao hụt quota của shop.
 * - Atomic & Defensive: Dùng decrement() với điều kiện usedCount > 0 để chống underflow (số âm).
 *
 * @param {string} couponId - ID coupon cần hoàn lượt
 * @param {object} transaction - Sequelize transaction (bắt buộc)
 */
const rollbackCoupon = async (couponId, transaction) => {
  if (!couponId) return;

  await Coupon.decrement('usedCount', {
    by: 1,
    where: {
      id: couponId,
      usedCount: { [Op.gt]: 0 },
    },
    transaction,
  });
};

/**
 * getAvailableCoupons — Giải quyết bài toán "Coupon Discovery"
 *
 * VẤN ĐỀ NGHIỆP VỤ:
 * Nếu khách hàng không biết mã nào đang tồn tại thì ô nhập mã
 * trở thành "hộp đen" gây friction — họ hoặc bỏ qua, hoặc mở tab
 * khác tìm mã (Cart Abandonment Risk).
 *
 * GIẢI PHÁP: "Phòng Voucher" — Liệt kê tất cả mã đang hiệu lực
 * (công khai) và phân loại trạng thái khả dụng cho user hiện tại.
 *
 * TƯ DUY THIẾT KẾ RESPONSE:
 * Thay vì trả về list phẳng, chúng ta enrich từng coupon với
 * trường `eligible` và `reason` để Frontend phân loại hiển thị:
 *   - eligible=true  → Thẻ xanh "Có thể dùng" → Click chọn
 *   - eligible=false → Thẻ xám "Cần thêm X.000đ" → Gợi ý mua thêm
 *
 * CHIẾN LƯỢC BỘC LỘ THÔNG TIN (Information Architecture):
 * - KHÔNG ẩn mã không đủ điều kiện → Thay vào đó hiện & giải thích lý do
 * - Lý do: Mã xám với tooltip "Cần thêm 50K" kích thích khách
 *   mua thêm 1 sản phẩm nhỏ để đủ điều kiện (Upsell trigger).
 *
 * @param {string} userId    — ID user đang xem checkout
 * @param {number} subtotal  — Tổng tiền hàng hiện tại (để tính eligibility)
 */
const getAvailableCoupons = async (userId, subtotal) => {
  const now = new Date();

  // Truy vấn các coupon CÔNG KHAI đang trong thời gian hiệu lực.
  // TƯ DUY: Lọc tại DB (không fetch hết rồi filter JS)
  // → Giảm data transfer, tránh expose mã private (nếu sau này có loại targeted).
  const coupons = await Coupon.findAll({
    where: {
      isActive: true,
      startDate: { [Op.lte]: now },  // Đã bắt đầu hiệu lực
      expiresAt: { [Op.gt]: now },   // Chưa hết hạn
      // Còn lượt: usageLimit IS NULL (unlimited) HOẶC usedCount < usageLimit
      [Op.or]: [
        { usageLimit: null },
        // Sequelize không có col-to-col comparison trực tiếp, dùng raw query nhỏ:
        { usedCount: { [Op.lt]: Coupon.sequelize.col('usage_limit') } },
      ],
    },
    order: [
      // Ưu tiên hiển thị: mã gần hết hạn nhất lên đầu
      // → Tạo urgency ("Còn 2 ngày!"), thúc đẩy hành động ngay
      ['expiresAt', 'ASC'],
    ],
  });

  // Kiểm tra lịch sử dùng coupon của user hiện tại (1 query duy nhất).
  // TƯ DUY HIỆU NĂNG: Không query từng coupon một (N+1 problem).
  // Lấy tất cả couponId mà user đã dùng đủ quota → nhóm lại trong Map.
  const userUsages = await Order.findAll({
    attributes: ['couponId'],
    where: {
      userId,
      couponId: { [Op.ne]: null },
      status: { [Op.notIn]: ['cancelled', 'expired'] },
    },
    raw: true,
  });

  // Map: couponId → số lần user đã dùng (để check usagePerUser)
  const usageMap = {};
  for (const row of userUsages) {
    usageMap[row.couponId] = (usageMap[row.couponId] || 0) + 1;
  }

  // Enrich từng coupon với trạng thái khả dụng của user cụ thể
  const enrichedCoupons = coupons.map((coupon) => {
    const c = coupon.toJSON();
    const userUsedCount = usageMap[c.id] || 0;
    const sub = parseFloat(subtotal) || 0;
    const minAmount = parseFloat(c.minOrderAmount) || 0;

    // Phân tích lý do không đủ điều kiện (theo thứ tự ưu tiên)
    let eligible = true;
    let reason = null;

    if (userUsedCount >= c.usagePerUser) {
      // User đã dùng hết quota cá nhân → Ẩn hẳn thì gây khó chịu,
      // vẫn show nhưng báo rõ để user hiểu quy tắc.
      eligible = false;
      reason = `Bạn đã sử dụng hết ${c.usagePerUser} lượt của mã này`;
    } else if (sub < minAmount) {
      // Chưa đủ giá trị đơn → Cơ hội Upsell!
      // Báo chính xác cần thêm bao nhiêu → Khuyến khích mua thêm
      const missing = minAmount - sub;
      eligible = false;
      reason = `Cần thêm ${missing.toLocaleString('vi-VN')}đ để đạt mức tối thiểu`;
    }

    // Preview số tiền giảm nếu đủ điều kiện (cho UX tốt hơn)
    const discountPreview = eligible
      ? calculateDiscount(coupon, subtotal)
      : null;

    // Tính % lượt đã dùng để hiển thị progress bar (social proof)
    // "Còn 3/10 lượt" → Tạo cảm giác khan hiếm (Scarcity Effect)
    const usageInfo =
      c.usageLimit !== null
        ? { used: c.usedCount, limit: c.usageLimit, unlimited: false }
        : { unlimited: true };

    return {
      id: c.id,
      code: c.code,
      description: c.description,
      type: c.type,
      value: parseFloat(c.value),
      minOrderAmount: parseFloat(c.minOrderAmount),
      maxDiscount: c.maxDiscount ? parseFloat(c.maxDiscount) : null,
      expiresAt: c.expiresAt,
      startDate: c.startDate,
      usageInfo,
      eligible,
      reason,          // null nếu eligible, string giải thích nếu không
      discountPreview, // Tiền giảm thực tế nếu áp dụng (null nếu không đủ điều kiện)
    };
  });

  return enrichedCoupons;
};

module.exports = {
  validateCoupon,
  calculateDiscount,
  applyCoupon,
  rollbackCoupon,
  getAvailableCoupons,
};
