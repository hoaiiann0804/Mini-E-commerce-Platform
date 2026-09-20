const couponService = require('../services/coupon.service');
const { AppError } = require('../middlewares/errorHandler');

/**
 * Controller Coupon — API cho khách hàng
 *
 * ========================================================
 * Kiến trúc 2 Pha (Two-Phase Coupon Pattern):
 * ========================================================
 *
 * PHA 1 — DISCOVERY (Khám phá mã): GET /api/coupons/available
 *   Mục đích: Giải quyết "Coupon Discovery Problem"
 *   → Khách hàng biết mã nào tồn tại, đủ/thiếu điều kiện gì
 *   → Không ghi gì vào DB, hoàn toàn read-only
 *
 * PHA 2 — PREVIEW (Xem trước): POST /api/coupons/validate
 *   Mục đích: Xác nhận mã hợp lệ sau khi user gõ/chọn
 *   → Trả về số tiền giảm chính xác trước khi đặt hàng
 *   → Không ghi gì vào DB
 *
 * PHA 3 — COMMIT (Chốt hạ): Nằm trong POST /api/orders
 *   Mục đích: Áp dụng mã thật sự trong DB Transaction
 *   → Tăng usedCount (atomic), ghi couponId vào order
 *   → Dùng SELECT FOR UPDATE để chống race condition
 */

/**
 * GET /api/coupons/available?subtotal=XXX
 *
 * TƯ DUY NGHIỆP VỤ — "Phòng Voucher":
 * Tương tự như Shopee/Lazada hiển thị danh sách voucher trước khi
 * thanh toán, nhưng thông minh hơn: server tự phân loại voucher nào
 * user "dùng được ngay" vs "cần thêm bao nhiêu để đủ".
 *
 * Điều này tạo ra 2 hiệu ứng tâm lý quan trọng:
 *   1. CONVENIENCE: Không cần nhớ/tìm mã, thấy ngay danh sách
 *   2. UPSELL TRIGGER: Thấy mã "Cần thêm 50K" → khách mua thêm
 *      1 sản phẩm nhỏ để đủ điều kiện (tăng AOV - Average Order Value)
 *
 * Yêu cầu: User đã đăng nhập (authenticate) vì cần userId để
 * check user đã dùng mã đó chưa (usagePerUser limit).
 */
const getAvailableCoupons = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // subtotal từ query param: ?subtotal=500000
    // Nếu không truyền (user chưa có giỏ hàng) → mặc định 0
    // → Tất cả mã có minOrderAmount > 0 sẽ hiển thị dạng "chưa đủ điều kiện"
    const subtotal = parseFloat(req.query.subtotal) || 0;

    const coupons = await couponService.getAvailableCoupons(userId, subtotal);

    res.status(200).json({
      status: 'success',
      data: {
        coupons,
        total: coupons.length,
        // Đếm nhanh bao nhiêu mã user có thể dùng ngay
        eligibleCount: coupons.filter((c) => c.eligible).length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/coupons/validate
 *
 * QUAN TRỌNG: Endpoint này KHÔNG tăng usedCount.
 * Chỉ khi createOrder thành công mới increment.
 *
 * TƯ DUY UX:
 * User nhập mã ở Checkout → bấm "Áp dụng" → thấy ngay:
 * - Mã hợp lệ: "Giảm 150.000đ" (xanh lá)
 * - Mã sai: "Mã giảm giá không tồn tại" (đỏ)
 * - Đơn chưa đủ: "Đơn tối thiểu 500.000đ" (vàng)
 */
const validateCoupon = async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;
    const userId = req.user.id;

    if (!code || !subtotal) {
      throw new AppError('Vui lòng cung cấp mã giảm giá và giá trị đơn hàng', 400);
    }

    const result = await couponService.validateCoupon(code, subtotal, userId);

    res.status(200).json({
      status: 'success',
      data: {
        valid: true,
        code: result.coupon.code,
        type: result.coupon.type,
        discountAmount: result.discountAmount,
        message: result.coupon.type === 'percentage'
          ? `Giảm ${parseFloat(result.coupon.value)}% (tối đa ${result.coupon.maxDiscount ? parseFloat(result.coupon.maxDiscount).toLocaleString('vi-VN') + 'đ' : 'không giới hạn'})`
          : `Giảm ${result.discountAmount.toLocaleString('vi-VN')}đ`,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAvailableCoupons,
  validateCoupon,
};

