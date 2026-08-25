"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.addColumn("users", "stripe_customer_id", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    } catch (error) {
      // Bỏ qua lỗi nếu cột đã tồn tại
      if (error.message.includes("already exists")) {
        //console.log('Column stripe_customer_id already exists, skipping...');
      } else {
        throw error;
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("users", "stripe_customer_id");
  },
};
