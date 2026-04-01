require('dotenv').config();
const app = require('./app');
const sequelize = require('./config/sequelize');
const logger = require('./utils/logger');

// Load all models first (without relationships)
const models = [
  require('./models/user'),
  require('./models/address'),
  require('./models/category'),
  require('./models/product'),
  require('./models/productCategory'),
  require('./models/productAttribute'),
  require('./models/productVariant'),
  require('./models/review'),
  require('./models/reviewFeedback'),
  require('./models/cart'),
  require('./models/cartItem'),
  require('./models/order'),
  require('./models/orderItem'),
  require('./models/wishlist'),
  require('./models/image'),
];

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(err.name, err.message);
  logger.error(err.stack);
  process.exit(1);
});

// Test database connection and sync models
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');

    // Load models and relationships
    require('./models');
    logger.info('Database models loaded successfully.');

    // Sync models with database
    if (
      process.env.NODE_ENV === 'development' &&
      process.env.DB_SYNC === 'true'
    ) {
      // Use alter: true instead of force: true to preserve data
      // force: true will DROP and recreate tables (DELETES ALL DATA)
      // alter: true will modify existing tables to match models
      await sequelize.sync();
      logger.info(
        'Database tables synchronized successfully (preserving data).'
      );
    }
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    logger.error('Error details:', error.message);
    logger.error('Stack trace:', error.stack);
    process.exit(1);
  }
};

// Add stripe column if not exists
const addStripeColumn = async () => {
  try {
    await sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
    `);
    logger.info('✅ stripe_customer_id column ensured');
  } catch (error) {
    logger.error('Error adding stripe column:', error.message);
  }
};

// Start server
const startServer = async () => {
  await connectDB();
  await addStripeColumn();

  const PORT = process.env.PORT || 8888;
  const server = app.listen(PORT, () => {
    logger.info(
      `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
    );
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
    logger.error(err.name, err.message);
    server.close(() => {
      process.exit(1);
    });
  });

  // Handle SIGTERM signal
  process.on('SIGTERM', () => {
    logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
    server.close(() => {
      logger.info('💥 Process terminated!');
    });
  });
};

startServer();
