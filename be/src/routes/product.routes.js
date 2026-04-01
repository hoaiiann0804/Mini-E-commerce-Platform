const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");
const { validateRequest } = require("../middlewares/validateRequest");
const { productSchema } = require("../validators/product.validator");
const { authenticate } = require("../middlewares/authenticate");
const { authorize } = require("../middlewares/authorize");

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Product ID
 *         name:
 *           type: string
 *           description: Product name
 *         slug:
 *           type: string
 *           description: Product slug for SEO-friendly URLs
 *         description:
 *           type: string
 *           description: Detailed product description
 *         shortDescription:
 *           type: string
 *           description: Short product description
 *         price:
 *           type: number
 *           description: Product price
 *         compareAtPrice:
 *           type: number
 *           description: Original price for comparison (sale price)
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of product image URLs
 *         thumbnail:
 *           type: string
 *           description: Product thumbnail image URL
 *         inStock:
 *           type: boolean
 *           description: Whether the product is in stock
 *         stockQuantity:
 *           type: integer
 *           description: Available quantity in stock
 *         featured:
 *           type: boolean
 *           description: Whether the product is featured
 *         rating:
 *           type: number
 *           description: Average product rating
 *         reviewCount:
 *           type: integer
 *           description: Number of reviews
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation date
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update date
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products with pagination and filters
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page (max 100)
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Base64 encoded cursor for pagination (lastValue and lastId of the previous page's last item)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category slug
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: boolean
 *         description: Filter by stock status
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *         description: Filter by featured status
 *     responses:
 *       200:
 *         description: List of products
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
 *                     nextCursor:
 *                       type: string
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 */
router.get("/", productController.getAllProducts);

/**
 * @swagger
 * /api/products/featured:
 *   get:
 *     summary: Get featured products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 8
 *         description: Number of products to return
 *     responses:
 *       200:
 *         description: List of featured products
 */
router.get("/featured", productController.getFeaturedProducts);

/**
 * @swagger
 * /api/products/new-arrivals:
 *   get:
 *     summary: Get new arrival products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 8
 *         description: Number of products to return
 *     responses:
 *       200:
 *         description: List of new arrival products
 */
router.get("/new-arrivals", productController.getNewArrivals);

/**
 * @swagger
 * /api/products/best-sellers:
 *   get:
 *     summary: Get best selling products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of products to return
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, year]
 *           default: month
 *         description: Time period for best sellers
 *     responses:
 *       200:
 *         description: List of best selling products
 */
router.get("/best-sellers", productController.getBestSellers);

/**
 * @swagger
 * /api/products/deals:
 *   get:
 *     summary: Get products with discounts
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: minDiscount
 *         schema:
 *           type: number
 *           default: 5
 *         description: Minimum discount percentage
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *         description: Number of products to return
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [discount_desc, price_asc, price_desc]
 *           default: discount_desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of discounted products
 */
router.get("/deals", productController.getDeals);

/**
 * @swagger
 * /api/products/filters:
 *   get:
 *     summary: Get available product filters
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Category ID to filter by
 *     responses:
 *       200:
 *         description: Available filters for products
 */
router.get("/filters", productController.getProductFilters);

/**
 * @swagger
 * /api/products/search:
 *   get:
 *     summary: Search products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
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
 *         description: Search results
 *       400:
 *         description: Missing search query
 */
router.get("/search", productController.searchProducts);

/**
 * @swagger
 * /api/products/slug/{slug}:
 *   get:
 *     summary: Get product by slug
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Product slug
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 */
router.get("/slug/:slug", productController.getProductBySlug);

/**
 * @swagger
 * /api/products/{id}/related:
 *   get:
 *     summary: Get related products
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 4
 *         description: Number of related products to return
 *     responses:
 *       200:
 *         description: List of related products
 *       404:
 *         description: Product not found
 */
router.get("/:id/related", productController.getRelatedProducts);

/**
 * @swagger
 * /api/products/{id}/variants:
 *   get:
 *     summary: Get product variants
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: List of product variants
 *       404:
 *         description: Product not found
 */
router.get("/:id/variants", productController.getProductVariants);

/**
 * @swagger
 * /api/products/{id}/reviews-summary:
 *   get:
 *     summary: Get product reviews summary
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product reviews summary
 *       404:
 *         description: Product not found
 */
router.get("/:id/reviews-summary", productController.getProductReviewsSummary);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 */
router.get("/:id", productController.getProductById);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               shortDescription:
 *                 type: string
 *               price:
 *                 type: number
 *               compareAtPrice:
 *                 type: number
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               thumbnail:
 *                 type: string
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *               inStock:
 *                 type: boolean
 *                 default: true
 *               stockQuantity:
 *                 type: integer
 *                 default: 0
 *               featured:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
router.post(
  "/",
  authenticate,
  authorize("admin"),
  validateRequest(productSchema),
  productController.createProduct
);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               shortDescription:
 *                 type: string
 *               price:
 *                 type: number
 *               compareAtPrice:
 *                 type: number
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               thumbnail:
 *                 type: string
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *               inStock:
 *                 type: boolean
 *               stockQuantity:
 *                 type: integer
 *               featured:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Product not found
 */
router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  validateRequest(productSchema),
  productController.updateProduct
);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Product not found
 */
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  productController.deleteProduct
);

module.exports = router;
