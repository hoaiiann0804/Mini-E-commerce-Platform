'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn('products', 'min_variant_price', {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      }, { transaction });

      await queryInterface.addColumn('products', 'avg_rating', {
        type: Sequelize.FLOAT,
        defaultValue: 0,
        allowNull: false,
      }, { transaction });

      await queryInterface.addColumn('products', 'review_count', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      }, { transaction });

      // Optional: Add an index to find products that need updating
      // (Reviews table may be created by later migrations in a fresh DB)
      try {
        await queryInterface.describeTable('reviews', { transaction });
        await queryInterface.addIndex('reviews', ['product_id'], {
          name: 'idx_reviews_product_id_for_recalc',
          transaction,
        });
      } catch (_) {
        // skip when table doesn't exist yet
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      console.error('Error adding denormalized fields:', err);
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('products', 'min_variant_price', { transaction });
      await queryInterface.removeColumn('products', 'avg_rating', { transaction });
      await queryInterface.removeColumn('products', 'review_count', { transaction });
      try {
        await queryInterface.describeTable('reviews', { transaction });
        await queryInterface.removeIndex('reviews', 'idx_reviews_product_id_for_recalc', { transaction });
      } catch (_) {
        // table/index doesn't exist
      }
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
