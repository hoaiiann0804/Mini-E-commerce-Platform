'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Alter the decimal precision for order financial fields
    await queryInterface.changeColumn('orders', 'subtotal', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
    });

    await queryInterface.changeColumn('orders', 'tax', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
    });

    await queryInterface.changeColumn('orders', 'shipping_cost', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
    });

    await queryInterface.changeColumn('orders', 'discount', {
      type: Sequelize.DECIMAL(12, 2),
      defaultValue: 0,
    });

    await queryInterface.changeColumn('orders', 'total', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert the decimal precision back to original
    await queryInterface.changeColumn('orders', 'subtotal', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
    });

    await queryInterface.changeColumn('orders', 'tax', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
    });

    await queryInterface.changeColumn('orders', 'shipping_cost', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
    });

    await queryInterface.changeColumn('orders', 'discount', {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0,
    });

    await queryInterface.changeColumn('orders', 'total', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
    });
  }
};
