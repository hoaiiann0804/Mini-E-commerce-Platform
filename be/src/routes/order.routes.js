const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { validateRequest } = require('../middlewares/validateRequest');
const {
  createOrderSchema,
  updateOrderStatusSchema,
} = require('../validators/order.validator');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         orderId:
 *           type: string
 *         productId:
 *           type: string
 *         variantId:
 *           type: string
 *           nullable: true
 *         name:
 *           type: string
 *         sku:
 *           type: string
 *         price:
 *           type: number
 *         quantity:
 *           type: integer
 *         subtotal:
 *           type: number
 *         image:
 *           type: string
 *         attributes:
 *           type: object
 *     Order:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         number:
 *           type: string
 *         userId:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled]
 *         paymentStatus:
 *           type: string
 *           enum: [pending, paid, failed, refunded]
 *         shippingFirstName:
 *           type: string
 *         shippingLastName:
 *           type: string
 *         shippingCompany:
 *           type: string
 *         shippingAddress1:
 *           type: string
 *         shippingAddress2:
 *           type: string
 *         shippingCity:
 *           type: string
 *         shippingState:
 *           type: string
 *         shippingZip:
 *           type: string
 *         shippingCountry:
 *           type: string
 *         shippingPhone:
 *           type: string
 *         billingFirstName:
 *           type: string
 *         billingLastName:
 *           type: string
 *         billingCompany:
 *           type: string
 *         billingAddress1:
 *           type: string
 *         billingAddress2:
 *           type: string
 *         billingCity:
 *           type: string
 *         billingState:
 *           type: string
 *         billingZip:
 *           type: string
 *         billingCountry:
 *           type: string
 *         billingPhone:
 *           type: string
 *         paymentMethod:
 *           type: string
 *         subtotal:
 *           type: number
 *         tax:
 *           type: number
 *         shippingCost:
 *           type: number
 *         discount:
 *           type: number
 *         total:
 *           type: number
 *         notes:
 *           type: string
 *         trackingNumber:
 *           type: string
 *         shippingProvider:
 *           type: string
 *         estimatedDelivery:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 */

// User routes (authenticated)
router.use(authenticate);

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create order from active cart
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shippingFirstName
 *               - shippingLastName
 *               - shippingAddress1
 *               - shippingCity
 *               - shippingState
 *               - shippingZip
 *               - shippingCountry
 *               - billingFirstName
 *               - billingLastName
 *               - billingAddress1
 *               - billingCity
 *               - billingState
 *               - billingZip
 *               - billingCountry
 *               - paymentMethod
 *             properties:
 *               shippingFirstName:
 *                 type: string
 *               shippingLastName:
 *                 type: string
 *               shippingCompany:
 *                 type: string
 *               shippingAddress1:
 *                 type: string
 *               shippingAddress2:
 *                 type: string
 *               shippingCity:
 *                 type: string
 *               shippingState:
 *                 type: string
 *               shippingZip:
 *                 type: string
 *               shippingCountry:
 *                 type: string
 *               shippingPhone:
 *                 type: string
 *               billingFirstName:
 *                 type: string
 *               billingLastName:
 *                 type: string
 *               billingCompany:
 *                 type: string
 *               billingAddress1:
 *                 type: string
 *               billingAddress2:
 *                 type: string
 *               billingCity:
 *                 type: string
 *               billingState:
 *                 type: string
 *               billingZip:
 *                 type: string
 *               billingCountry:
 *                 type: string
 *               billingPhone:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     order:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         number:
 *                           type: string
 *                         status:
 *                           type: string
 *                         total:
 *                           type: number
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Invalid input or cart empty
 *       401:
 *         description: Not authenticated
 */
router.post(
  '/',
  validateRequest(createOrderSchema),
  orderController.createOrder
);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get user's orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of user's orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                     orders:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Order'
 *       401:
 *         description: Not authenticated
 */
router.get('/', orderController.getUserOrders);

/**
 * @swagger
 * /api/orders/number/{number}:
 *   get:
 *     summary: Get order by number
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: number
 *         required: true
 *         schema:
 *           type: string
 *         description: Order number
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Order not found
 */
router.get('/number/:number', orderController.getOrderByNumber);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Order not found
 */
router.get('/:id', orderController.getOrderById);

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   post:
 *     summary: Cancel an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order cancelled
 *       400:
 *         description: Order cannot be cancelled
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Order not found
 */
router.post('/:id/cancel', orderController.cancelOrder);

/**
 * @swagger
 * /api/orders/{id}/repay:
 *   post:
 *     summary: Repay a pending or failed order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order ready for repayment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     number:
 *                       type: string
 *                     status:
 *                       type: string
 *                     paymentStatus:
 *                       type: string
 *                     total:
 *                       type: number
 *                     paymentUrl:
 *                       type: string
 *       400:
 *         description: Order cannot be repaid
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Order not found
 */
router.post('/:id/repay', orderController.repayOrder);

// Admin routes

/**
 * @swagger
 * /api/orders/admin/all:
 *   get:
 *     summary: Get all orders (admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled]
 *         description: Filter by order status
 *     responses:
 *       200:
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                     orders:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Order'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
router.get('/admin/all', authorize('admin'), orderController.getAllOrders);

/**
 * @swagger
 * /api/orders/admin/{id}/status:
 *   patch:
 *     summary: Update order status (admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, shipped, delivered, cancelled]
 *     responses:
 *       200:
 *         description: Order status updated
 *       400:
 *         description: Invalid status
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Order not found
 */
router.patch(
  '/admin/:id/status',
  authorize('admin'),
  validateRequest(updateOrderStatusSchema),
  orderController.updateOrderStatus
);

module.exports = router;
