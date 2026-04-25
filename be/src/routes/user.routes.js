const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { validateRequest } = require('../middlewares/validateRequest');
const {
  updateUserSchema,
  changePasswordSchema,
} = require('../validators/user.validator');
const { addressSchema } = require('../validators/address.validator');
const { authenticate } = require('../middlewares/authenticate');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile and address management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UserAddress:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           nullable: true
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         company:
 *           type: string
 *           nullable: true
 *         address1:
 *           type: string
 *         address2:
 *           type: string
 *           nullable: true
 *         province:
 *           type: string
 *         ward:
 *           type: string
 *         provinceCode:
 *           type: string
 *           nullable: true
 *         wardCode:
 *           type: string
 *           nullable: true
 *         city:
 *           type: string
 *         state:
 *           type: string
 *         zip:
 *           type: string
 *         country:
 *           type: string
 *         phone:
 *           type: string
 *           nullable: true
 *         lat:
 *           type: number
 *           nullable: true
 *         lng:
 *           type: number
 *           nullable: true
 *         isDefault:
 *           type: boolean
 *     AddressRequest:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - address1
 *         - province
 *         - ward
 *         - city
 *         - state
 *         - zip
 *         - country
 *       properties:
 *         name:
 *           type: string
 *           nullable: true
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         company:
 *           type: string
 *           nullable: true
 *         address1:
 *           type: string
 *         address2:
 *           type: string
 *           nullable: true
 *         province:
 *           type: string
 *         ward:
 *           type: string
 *         provinceCode:
 *           type: string
 *           nullable: true
 *         wardCode:
 *           type: string
 *           nullable: true
 *         lat:
 *           type: number
 *           nullable: true
 *         lng:
 *           type: number
 *           nullable: true
 *         city:
 *           type: string
 *         state:
 *           type: string
 *         zip:
 *           type: string
 *         country:
 *           type: string
 *         phone:
 *           type: string
 *           nullable: true
 *         isDefault:
 *           type: boolean
 *           default: false
 *     ChangePasswordRequest:
 *       type: object
 *       required:
 *         - currentPassword
 *         - newPassword
 *       properties:
 *         currentPassword:
 *           type: string
 *         newPassword:
 *           type: string
 *           minLength: 6
 */

// All routes require authentication
router.use(authenticate);

// Profile routes
/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: User not found
 */
router.put(
  '/profile',
  validateRequest(updateUserSchema),
  userController.updateProfile
);

/**
 * @swagger
 * /api/users/change-password:
 *   post:
 *     summary: Change current user's password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authenticated or current password is incorrect
 *       404:
 *         description: User not found
 */
router.post(
  '/change-password',
  validateRequest(changePasswordSchema),
  userController.changePassword
);

// Address routes
/**
 * @swagger
 * /api/users/addresses:
 *   get:
 *     summary: Get current user's addresses
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of addresses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserAddress'
 *       401:
 *         description: Not authenticated
 */
router.get('/addresses', userController.getAddresses);

/**
 * @swagger
 * /api/users/addresses:
 *   post:
 *     summary: Add a new address for current user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddressRequest'
 *     responses:
 *       201:
 *         description: Address created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authenticated
 */
router.post(
  '/addresses',
  validateRequest(addressSchema),
  userController.addAddress
);

/**
 * @swagger
 * /api/users/addresses/{id}:
 *   put:
 *     summary: Update an existing address
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Address ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddressRequest'
 *     responses:
 *       200:
 *         description: Address updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Address not found
 */
router.put(
  '/addresses/:id',
  validateRequest(addressSchema),
  userController.updateAddress
);

/**
 * @swagger
 * /api/users/addresses/{id}:
 *   delete:
 *     summary: Delete an address
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Address ID
 *     responses:
 *       200:
 *         description: Address deleted successfully
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Address not found
 */
router.delete('/addresses/:id', userController.deleteAddress);

/**
 * @swagger
 * /api/users/addresses/{id}/default:
 *   patch:
 *     summary: Set an address as default
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Address ID
 *     responses:
 *       200:
 *         description: Default address updated successfully
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Address not found
 */
router.patch('/addresses/:id/default', userController.setDefaultAddress);

module.exports = router;
