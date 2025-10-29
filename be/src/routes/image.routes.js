const express = require("express");
const router = express.Router();
const imageController = require("../controllers/imageController");
const { authenticate } = require("../middlewares/authenticate");
const { adminAuthenticate } = require("../middlewares/adminAuth");

/**
 * @swagger
 * tags:
 *   name: Images
 *   description: Enhanced image management with optimization and database tracking
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Image:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique image identifier
 *         originalName:
 *           type: string
 *           description: Original filename
 *         fileName:
 *           type: string
 *           description: Generated unique filename
 *         filePath:
 *           type: string
 *           description: Relative file path
 *         fileSize:
 *           type: number
 *           description: File size in bytes
 *         mimeType:
 *           type: string
 *           description: MIME type
 *         width:
 *           type: number
 *           description: Image width in pixels
 *         height:
 *           type: number
 *           description: Image height in pixels
 *         category:
 *           type: string
 *           enum: [product, thumbnail, user, review]
 *           description: Image category
 *         productId:
 *           type: string
 *           format: uuid
 *           description: Associated product ID
 *         userId:
 *           type: string
 *           format: uuid
 *           description: Associated user ID
 *         url:
 *           type: string
 *           description: Public URL to access the image
 *         thumbnails:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               size:
 *                 type: string
 *                 enum: [small, medium, large]
 *               path:
 *                 type: string
 *               fileName:
 *                 type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/images/upload:
 *   post:
 *     summary: Upload a single image with optimization
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload
 *               category:
 *                 type: string
 *                 enum: [product, user, review]
 *                 default: product
 *                 description: Image category
 *               productId:
 *                 type: string
 *                 format: uuid
 *                 description: Product ID if this is a product image
 *               generateThumbs:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to generate thumbnails
 *               optimize:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to optimize the image
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Image uploaded successfully
 *                 data:
 *                   $ref: '#/components/schemas/Image'
 *       400:
 *         description: Invalid file or upload error
 *       401:
 *         description: Not authenticated
 */
/**
 * @swagger
 * /api/images/health:
 *   get:
 *     summary: Health check for image service
 *     tags: [Images]
 *     responses:
 *       200:
 *         description: Image service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Image service is healthy
 *                 data:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     version:
 *                       type: string
 *                       example: "1.0.0"
 */
router.get("/health", imageController.healthCheck);

router.post("/upload", authenticate, imageController.uploadSingle);

// Test endpoint without auth (for development only)
router.post("/test-upload", imageController.uploadSingle);

/**
 * @swagger
 * /api/images/upload-multiple:
 *   post:
 *     summary: Upload multiple images with optimization
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Image files to upload (max 10)
 *               category:
 *                 type: string
 *                 enum: [product, user, review]
 *                 default: product
 *                 description: Image category
 *               productId:
 *                 type: string
 *                 format: uuid
 *                 description: Product ID if these are product images
 *               generateThumbs:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to generate thumbnails
 *               optimize:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to optimize the images
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: 5 images uploaded successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     successful:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Image'
 *                     failed:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           fileName:
 *                             type: string
 *                           error:
 *                             type: string
 *                     count:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         successful:
 *                           type: number
 *                         failed:
 *                           type: number
 *       400:
 *         description: Invalid files or upload error
 *       401:
 *         description: Not authenticated
 */
router.post("/upload-multiple", authenticate, imageController.uploadMultiple);

/**
 * @swagger
 * /api/images/{id}:
 *   get:
 *     summary: Get image by ID
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Image ID
 *     responses:
 *       200:
 *         description: Image retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Image'
 *       404:
 *         description: Image not found
 */
router.get("/:id", imageController.getImageById);

/**
 * @swagger
 * /api/images/product/{productId}:
 *   get:
 *     summary: Get all images for a product
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product images retrieved successfully
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
 *                     images:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Image'
 *                     count:
 *                       type: number
 *       404:
 *         description: Product not found
 */
router.get("/product/:productId", imageController.getImagesByProductId);

/**
 * @swagger
 * /api/images/{id}:
 *   delete:
 *     summary: Delete an image
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Image ID
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Image deleted successfully
 *       404:
 *         description: Image not found
 *       401:
 *         description: Not authenticated
 */
router.delete("/:id", authenticate, imageController.deleteImage);

/**
 * @swagger
 * /api/images/convert/base64:
 *   post:
 *     summary: Convert base64 string to file
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               base64Data:
 *                 type: string
 *                 description: Base64 encoded image data
 *                 example: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..."
 *               category:
 *                 type: string
 *                 enum: [product, user, review]
 *                 default: product
 *                 description: Image category
 *               productId:
 *                 type: string
 *                 format: uuid
 *                 description: Product ID if this is a product image
 *             required:
 *               - base64Data
 *     responses:
 *       200:
 *         description: Base64 converted to file successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Base64 converted to file successfully
 *                 data:
 *                   $ref: '#/components/schemas/Image'
 *       400:
 *         description: Invalid base64 data
 *       401:
 *         description: Not authenticated
 */
router.post("/convert/base64", authenticate, imageController.convertBase64);

/**
 * @swagger
 * /api/images/admin/cleanup:
 *   post:
 *     summary: Cleanup orphaned files (Admin only)
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Orphaned files cleaned up successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Orphaned files cleaned up successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalFiles:
 *                       type: number
 *                     activeFiles:
 *                       type: number
 *                     orphanedFiles:
 *                       type: number
 *                     deletedFiles:
 *                       type: number
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (Admin only)
 */
router.post(
  "/admin/cleanup",
  authenticate,
  adminAuthenticate,
  imageController.cleanupOrphanedFiles
);

module.exports = router;
