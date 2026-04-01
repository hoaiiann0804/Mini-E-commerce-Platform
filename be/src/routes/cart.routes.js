const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { validateRequest } = require('../middlewares/validateRequest');
const {
  addToCartSchema,
  updateCartItemSchema,
  syncCartSchema,
} = require('../validators/cart.validator');
const { optionalAuthenticate } = require('../middlewares/authenticate');

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Shopping cart management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CartItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Cart item ID
 *         cartId:
 *           type: string 
 *           description: Cart ID
 *         productId:
 *           type: string
 *           description: Product ID
 *         variantId:
 *           type: string
 *           description: Product variant ID
 *         quantity:
 *           type: integer
 *           description: Quantity of the product
 *         price:
 *           type: number
 *           description: Price at the time of adding to cart
 *         Product:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *             slug:
 *               type: string
 *             price:
 *               type: number
 *             thumbnail:
 *               type: string
 *             inStock:
 *               type: boolean
 *             stockQuantity:
 *               type: integer
 *         ProductVariant:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *             price:
 *               type: number
 *             stockQuantity:
 *               type: integer
 */

// All routes use optional authentication to handle both guest and logged-in users
router.use(optionalAuthenticate);

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Get user's cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart details
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
 *                       type: integer
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CartItem'
 *                     totalItems:
 *                       type: integer
 *                     subtotal:
 *                       type: number
 */
router.get('/', cartController.getCart);

/**
 * @swagger
 * /api/cart/count:
 *   get:
 *     summary: Get cart item count
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart item count
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
 *                     count:
 *                       type: integer
 */
router.get('/count', cartController.getCartCount);

/**
 * @swagger
 * /api/cart:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: integer
 *               variantId:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *                 default: 1
 *     responses:
 *       200:
 *         description: Item added to cart
 *       400:
 *         description: Invalid input or product out of stock
 *       404:
 *         description: Product not found
 */
router.post('/', validateRequest(addToCartSchema), cartController.addToCart);

/**
 * @swagger
 * /api/cart/sync:
 *   post:
 *     summary: Sync cart from local storage to server
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                   properties:
 *                     productId:
 *                       type: integer
 *                     variantId:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     price:
 *                       type: number
 *                     image:
 *                       type: string
 *                     attributes:
 *                       type: object
 *     responses:
 *       200:
 *         description: Cart synced successfully
 *       400:
 *         description: Invalid input
 */
router.post('/sync', validateRequest(syncCartSchema), cartController.syncCart);

/**
 * @swagger
 * /api/cart/merge:
 *   post:
 *     summary: Merge guest cart with user cart after login
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart merged successfully
 *       401:
 *         description: User not authenticated
 */
router.post('/merge', cartController.mergeCart);

/**
 * @swagger
 * /api/cart/items/{id}:
 *   put:
 *     summary: Update cart item quantity
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Cart item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Cart item updated
 *       400:
 *         description: Invalid quantity or product out of stock
 *       403:
 *         description: Not authorized to update this cart
 *       404:
 *         description: Cart item not found
 */
router.put(
  '/items/:id',
  validateRequest(updateCartItemSchema),
  cartController.updateCartItem
);

/**
 * @swagger
 * /api/cart/items/{id}:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Cart item ID
 *     responses:
 *       200:
 *         description: Item removed from cart
 *       403:
 *         description: Not authorized to update this cart
 *       404:
 *         description: Cart item not found
 */
router.delete('/items/:id', cartController.removeCartItem);

/**
 * @swagger
 * /api/cart:
 *   delete:
 *     summary: Clear cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared
 */
router.delete('/', cartController.clearCart);

module.exports = router;
