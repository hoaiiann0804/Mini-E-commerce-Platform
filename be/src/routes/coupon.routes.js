const express = require('express');
const router = express.Router();
const couponController = require('../controllers/coupon.controller');
const { authenticate } = require('../middlewares/authenticate');

/**
 * Routes Coupon — Kiến trúc 3 Pha (Three-Phase Coupon Architecture)
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  PHA 1: DISCOVERY  →  GET  /api/coupons/available              │
 * │  PHA 2: PREVIEW    →  POST /api/coupons/validate               │
 * │  PHA 3: COMMIT     →  Nằm bên trong POST /api/orders           │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * Tại sao tách thành 3 pha?
 *
 * THAY VÌ: User gõ mã → đặt hàng → biết mã đúng hay sai (UX tệ)
 * MÀ: Discovery → Preview (biết kết quả ngay) → Đặt hàng tự tin
 *
 * Analogy: Như đi siêu thị:
 *   1. Xem bảng "Khuyến mãi hôm nay" (Discovery)
 *   2. Hỏi nhân viên "Mã SALE10 có được không?" (Preview)
 *   3. Ra quầy tính tiền, nhân viên áp mã (Commit)
 */

/**
 * PHA 1 — DISCOVERY
 * GET /api/coupons/available?subtotal=500000
 *
 * Trả về danh sách coupon đang hiệu lực, đã enrich với trạng thái
 * eligible (có thể dùng ngay) hoặc lý do không đủ điều kiện.
 *
 * Bảo mật: Cần đăng nhập (authenticate) vì:
 * - Cần userId để check usagePerUser của user đó
 * - Tránh bots crawl toàn bộ danh sách mã giảm giá
 */
router.get('/available', authenticate, couponController.getAvailableCoupons);

/**
 * PHA 2 — PREVIEW
 * POST /api/coupons/validate
 * Body: { code: "FIRSTBUY10", subtotal: 1200000 }
 *
 * User gõ thủ công hoặc chọn từ danh sách Discovery.
 * Read-only: KHÔNG tăng usedCount, KHÔNG tạo bất kỳ record nào.
 */
router.post('/validate', authenticate, couponController.validateCoupon);

module.exports = router;

