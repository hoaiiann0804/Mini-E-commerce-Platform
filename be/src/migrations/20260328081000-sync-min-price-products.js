"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(
      `UPDATE products p
    SET min_variant_price = sub.min_price
    FROM(
      SELECT product_id, MIN(price) as min_price
      FROM product_variants
      WHERE is_available = true
      GROUP BY product_id
    )sub
    WHERE p.id = sub.product_id
    `
    );
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkUpdate('products',{min_variant_price: null})
  },
};
