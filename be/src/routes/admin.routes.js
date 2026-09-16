const express = require("express");
const router = express.Router();

// Import controllers
const adminController = require("../controllers/admin.controller");

// Import middlewares
const { adminAuthenticate } = require("../middlewares/adminAuth");
const { validate } = require("../middlewares/validateRequest");
const {
  auditMiddleware,
} = require("../shared/services/admin/adminAuditService");

// Import validators
const {
  createProductValidation,
  updateProductValidation,
  updateUserValidation,
  updateOrderStatusValidation,
  paginationValidation,
  statsValidation,
  deleteValidation,
  getByIdValidation,
} = require("../validators/admin.validator");

// Middleware cho tất cả admin routes
router.use(adminAuthenticate);
router.use(auditMiddleware);

/**
 * DASHBOARD & STATISTICS ROUTES
 */
// GET /api/admin/dashboard - Thống kê tổng quan
router.get("/dashboard", adminController.getDashboardStats);

// GET /api/admin/stats - Thống kê chi tiết theo thời gian
router.get(
  "/stats",
  validate(statsValidation),
  adminController.getDetailedStats,
);

/**
 * USER MANAGEMENT ROUTES
 */
// GET /api/admin/users - Lấy danh sách user với filter
router.get(
  "/users",
  validate(paginationValidation),
  adminController.getAllUsers,
);

// PUT /api/admin/users/:id - Cập nhật thông tin user
router.put(
  "/users/:id",
  validate(updateUserValidation),
  adminController.updateUser,
);

// DELETE /api/admin/users/:id - Xóa user
router.delete(
  "/users/:id",
  validate(deleteValidation),
  adminController.deleteUser,
);

/**
 * PRODUCT MANAGEMENT ROUTES
 */
// GET /api/admin/products - Lấy danh sách sản phẩm với filter admin
router.get(
  "/products",
  validate(paginationValidation),
  adminController.getAllProducts,
);

// GET /api/admin/products/:id - Lấy chi tiết sản phẩm
router.get(
  "/products/:id",
  validate(getByIdValidation),
  adminController.getProductById,
);

// POST /api/admin/products - Tạo sản phẩm mới
router.post(
  "/products",
  validate(createProductValidation),
  adminController.createProduct,
);

// PUT /api/admin/products/:id - Cập nhật sản phẩm
router.put(
  "/products/:id",
  validate(updateProductValidation),
  adminController.updateProduct,
);

// DELETE /api/admin/products/:id - Xóa sản phẩm
router.delete(
  "/products/:id",
  validate(deleteValidation),
  adminController.deleteProduct,
);

/**
 * REVIEW MANAGEMENT ROUTES
 */
// GET /api/admin/reviews - Lấy danh sách review
router.get(
  "/reviews",
  validate(paginationValidation),
  adminController.getAllReviews,
);

// DELETE /api/admin/reviews/:id - Xóa review
router.delete(
  "/reviews/:id",
  validate(deleteValidation),
  adminController.deleteReview,
);

/**
 * REVIEW REPLY ROUTES
 * TÙ DUY: Dùng POST/:id/reply thay vì PATCH để rõ ý "hành động reply"
 * Cùng endpoint POST xử lý cả create lẫn update (upsert) → API đơn giản hơn cho FE
 */
// POST /api/admin/reviews/:id/reply - Tạo hoặc cập nhật phản hồi cho review
router.post(
  "/reviews/:id/reply",
  adminController.replyToReview,
);

// DELETE /api/admin/reviews/replies/:replyId - Xóa phản hồi
router.delete(
  "/reviews/replies/:replyId",
  adminController.deleteReviewReply,
);

/**
 * ORDER MANAGEMENT ROUTES
 */
// GET /api/admin/orders - Lấy danh sách đơn hàng
router.get(
  "/orders",
  validate(paginationValidation),
  adminController.getAllOrders,
);

// PUT /api/admin/orders/:id/status - Cập nhật trạng thái đơn hàng
router.put(
  "/orders/:id/status",
  validate(updateOrderStatusValidation),
  adminController.updateOrderStatus,
);

module.exports = router;
