"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Thêm cột expires_at vào bảng orders
    try {
      await queryInterface.addColumn("orders", "expires_at", {
        type: Sequelize.DATE,
        allowNull: true,
        comment: "Thời gian hết hạn giữ chỗ tồn kho (15 phút sau khi tạo đơn)",
      });
      console.log("--> Đã thêm thành công cột expires_at vào bảng orders");
    } catch (error) {
      if (error.message.includes("already exists")) {
        console.log("Cột expires_at đã tồn tại, bỏ qua...");
      } else {
        throw error;
      }
    }

    // 2. Thêm giá trị 'expired' vào ENUM status của bảng orders
    // Đối với PostgreSQL, cần alter type trực tiếp
    try {
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_orders_status" ADD VALUE IF NOT EXISTS 'expired';
      `);
      console.log("--> Đã thêm giá trị 'expired' vào enum_orders_status");
    } catch (error) {
      if (
        error.message.includes("already exists") ||
        error.message.includes("does not exist")
      ) {
        console.log(
          "Giá trị expired đã tồn tại hoặc enum không cần sửa, bỏ qua..."
        );
      } else {
        throw error;
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Xóa cột expires_at khi rollback
    await queryInterface.removeColumn("orders", "expires_at");
    // Lưu ý: PostgreSQL không hỗ trợ DROP VALUE từ ENUM trong production
    // Enum rollback cần xử lý thủ công nếu cần
  },
};
