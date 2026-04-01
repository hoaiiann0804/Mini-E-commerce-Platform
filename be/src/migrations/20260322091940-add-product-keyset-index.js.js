"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Using a raw query is safer for creating complex indexes with specific sort orders per column.
      // This index is optimized for filtering by status/featured and then sorting by creation date.
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_products_keyset_pagination 
        ON "products" ("status", "featured", "created_at" DESC, "id" DESC);
      `, { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      console.error("Error creating keyset pagination index:", err);
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex(
      "products",
      "idx_products_keyset_pagination"
    );
  },
};
