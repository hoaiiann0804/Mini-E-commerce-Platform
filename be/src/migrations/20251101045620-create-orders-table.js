'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM(
          'pending',
          'processing',
          'shipped',
          'delivered',
          'cancelled'
        ),
        defaultValue: 'pending',
      },
      shipping_first_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      shipping_last_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      shipping_company: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      shipping_address1: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      shipping_address2: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      shipping_city: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      shipping_state: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      shipping_zip: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      shipping_country: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      shipping_phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      billing_first_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      billing_last_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      billing_company: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      billing_address1: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      billing_address2: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      billing_city: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      billing_state: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      billing_zip: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      billing_country: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      billing_phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      payment_method: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      payment_status: {
        type: Sequelize.ENUM('pending', 'paid', 'failed', 'refunded'),
        defaultValue: 'pending',
      },
      payment_transaction_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      payment_provider: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      subtotal: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      tax: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      shipping_cost: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      discount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
      },
      total: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      tracking_number: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      shipping_provider: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      estimated_delivery: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('orders');
  },
};
