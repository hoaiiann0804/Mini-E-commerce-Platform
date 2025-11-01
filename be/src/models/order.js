const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Order = sequelize.define(
  'Order',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    number: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(
        'pending',
        'processing',
        'shipped',
        'delivered',
        'cancelled'
      ),
      defaultValue: 'pending',
    },
    shippingFirstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    shippingLastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    shippingCompany: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    shippingAddress1: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    shippingAddress2: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    shippingCity: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    shippingState: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    shippingZip: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    shippingCountry: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    shippingPhone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    billingFirstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    billingLastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    billingCompany: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    billingAddress1: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    billingAddress2: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    billingCity: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    billingState: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    billingZip: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    billingCountry: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    billingPhone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
      defaultValue: 'pending',
    },
    paymentTransactionId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    paymentProvider: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    tax: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    shippingCost: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    discount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    trackingNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    shippingProvider: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    estimatedDelivery: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'orders',
    timestamps: true,
  }
);

module.exports = Order;
