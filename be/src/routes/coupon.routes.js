const express = require('express');
const router = express.Router();
const couponController = require('../controllers/coupon.controller');
const { authenticate } = require('../middlewares/authenticate');

/**
 * Routes Coupon — API cho khách hàng
 *
 * POST /api/coupons/validate — Preview mã giảm giá
 * Yêu cầu: User đã đăng nhập (authenticate)
 * Body: { code: "FIRSTBUY10", subtotal: 1200000 }
 */
router.post('/validate', authenticate, couponController.validateCoupon);

module.exports = router;
