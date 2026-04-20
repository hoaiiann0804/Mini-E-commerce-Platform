"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Cập nhật độ chính xác của trường price và compareAtPrice trong bảng products
      await queryInterface.sequelize.query(`
        ALTER TABLE products 
        ALTER COLUMN price TYPE DECIMAL(12,2),
        ALTER COLUMN compare_at_price TYPE DECIMAL(12,2);
      `);

      // Cập nhật độ chính xác của trường price trong bảng product_variants
      await queryInterface.sequelize.query(`
        ALTER TABLE product_variants 
        ALTER COLUMN price TYPE DECIMAL(12,2);
      `);

      //console.log('Successfully updated price precision to DECIMAL(12,2)');
    } catch (error) {
      console.error("Error updating price precision:", error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      // Khôi phục lại độ chính xác ban đầu
      await queryInterface.sequelize.query(`
        ALTER TABLE products 
        ALTER COLUMN price TYPE DECIMAL(10,2),
        ALTER COLUMN compare_at_price TYPE DECIMAL(10,2);
      `);

      await queryInterface.sequelize.query(`
        ALTER TABLE product_variants 
        ALTER COLUMN price TYPE DECIMAL(10,2);
      `);
    } catch (error) {
      console.error("Error reverting price precision:", error);
      throw error;
    }
  },
};
