const couponService = require('../services/coupon.service');
const { AppError } = require('../middlewares/errorHandler');

/**
 * Controller Coupon — API cho khách hàng
 *
 * Endpoint duy nhất: POST /api/coupons/validate
 * Mục đích: Preview mã giảm giá trước khi đặt hàng
 *
 * TƯ DUY UX:
 * User nhập mã ở Checkout → bấm "Áp dụng" → thấy ngay:
 * - Mã hợp lệ: "Giảm 150.000đ" (xanh lá)
 * - Mã sai: "Mã giảm giá không tồn tại" (đỏ)
 * - Đơn chưa đủ: "Đơn tối thiểu 500.000đ" (vàng)
 *
 * QUAN TRỌNG: Endpoint này KHÔNG tăng usedCount.
 * Chỉ khi createOrder thành công mới increment.
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
  validateCoupon,
};
