'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_variants', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      display_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      sort_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      is_default: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      is_available: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add indexes
    // Always name indexes explicitly to avoid cross-schema name collisions in Postgres
    // (and to keep names stable across environments).
    await queryInterface.addIndex('product_variants', ['product_id'], {
      name: 'idx_product_variants_product_id',
    });
    await queryInterface.addIndex('product_variants', ['is_default'], {
      name: 'idx_product_variants_is_default',
    });
    await queryInterface.addIndex('product_variants', ['is_available'], {
      name: 'idx_product_variants_is_available',
    });
  },

  async down(queryInterface, Sequelize) {
    // Defensive: in some dialects dropping the table might fail if indexes are in a bad state.
    // These calls are safe to ignore if the indexes don't exist.
    try {
      await queryInterface.removeIndex('product_variants', 'idx_product_variants_product_id');
    } catch (e) {}
    try {
      await queryInterface.removeIndex('product_variants', 'idx_product_variants_is_default');
    } catch (e) {}
    try {
      await queryInterface.removeIndex('product_variants', 'idx_product_variants_is_available');
    } catch (e) {}
    await queryInterface.dropTable('product_variants');
  },
};
