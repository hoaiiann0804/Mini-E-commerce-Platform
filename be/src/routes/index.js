const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const categoryRoutes = require('./category.routes');
const productRoutes = require('./product.routes');
const cartRoutes = require('./cart.routes');
const orderRoutes = require('./order.routes');
const reviewRoutes = require('./review.routes');
const wishlistRoutes = require('./wishlist.routes');
const adminRoutes = require('./admin.routes');
const uploadRoutes = require('./upload.routes');
const paymentRoutes = require('./payment.routes');
const chatbotRoutes = require('./chatbot.routes');
const warrantyPackageRoutes = require('./warrantyPackages.route');
const attributeRoutes = require('./attribute.routes');
const imageRoutes = require('./image.routes');

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/reviews', reviewRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/upload', uploadRoutes);
router.use('/admin', adminRoutes);
router.use('/payment', paymentRoutes);
router.use('/chatbot', chatbotRoutes);
router.use('/warranty-packages', warrantyPackageRoutes);
router.use('/attributes', attributeRoutes);
router.use('/images', imageRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
