"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.addColumn("orders", "expires_at", {
        type: Sequelize.DATE,
        allowNull: true,
      });
      console.log("--> Đã thêm thành công cột expires_at vào bảng orders!");
    } catch (error) {
      if (error.message.includes("already exists")) {
        console.log("Cột expires_at đã tồn tại, bỏ qua...");
      } else {
        throw error;
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("orders", "expires_at");
  },
};
