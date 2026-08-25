"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // In older DBs, product_variants table was created without core columns.
    // Add missing columns idempotently so later migrations/queries work.
    const table = await queryInterface.describeTable("product_variants");

    if (!table.name) {
      await queryInterface.addColumn("product_variants", "name", {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "",
      });
    }

    if (!table.sku) {
      await queryInterface.addColumn("product_variants", "sku", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!table.attributes) {
      await queryInterface.addColumn("product_variants", "attributes", {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      });
    }

    if (!table.attribute_values) {
      await queryInterface.addColumn("product_variants", "attribute_values", {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      });
    }

    if (!table.price) {
      await queryInterface.addColumn("product_variants", "price", {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      });
    }

    if (!table.stock_quantity) {
      await queryInterface.addColumn("product_variants", "stock_quantity", {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });
    }

    if (!table.images) {
      await queryInterface.addColumn("product_variants", "images", {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        defaultValue: [],
      });
    }

    // Backfill name for existing rows when defaultValue wasn't used
    await queryInterface.sequelize.query(`
      UPDATE product_variants
      SET name = COALESCE(NULLIF(name, ''), display_name, 'Variant')
      WHERE name IS NULL OR name = '';
    `);
  },

  async down(queryInterface, Sequelize) {
    // Best-effort rollback (idempotent)
    const table = await queryInterface.describeTable("product_variants");

    if (table.images) await queryInterface.removeColumn("product_variants", "images");
    if (table.stock_quantity)
      await queryInterface.removeColumn("product_variants", "stock_quantity");
    if (table.price) await queryInterface.removeColumn("product_variants", "price");
    if (table.attribute_values)
      await queryInterface.removeColumn("product_variants", "attribute_values");
    if (table.attributes) await queryInterface.removeColumn("product_variants", "attributes");
    if (table.sku) await queryInterface.removeColumn("product_variants", "sku");
    if (table.name) await queryInterface.removeColumn("product_variants", "name");
  },
};

