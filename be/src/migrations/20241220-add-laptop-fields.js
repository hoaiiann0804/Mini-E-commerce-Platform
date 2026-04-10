'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if columns already exist before adding them
    const tableDescription = await queryInterface.describeTable('products');

    // Add new fields to products table
    if (!tableDescription.brand) {
      await queryInterface.addColumn('products', 'brand', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!tableDescription.model) {
      await queryInterface.addColumn('products', 'model', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!tableDescription.warranty_months) {
      await queryInterface.addColumn('products', 'warranty_months', {
        type: Sequelize.INTEGER,
        defaultValue: 12,
      });
    }

    if (!tableDescription.specifications) {
      await queryInterface.addColumn('products', 'specifications', {
        type: Sequelize.JSONB,
        defaultValue: {},
      });
    }

    // Check if product_variants table exists and add columns if needed
    let variantsTableDescription;
    try {
      variantsTableDescription = await queryInterface.describeTable('product_variants');
    } catch (error) {
      // Table doesn't exist, skip adding columns
      variantsTableDescription = null;
    }

    if (variantsTableDescription) {
      // Add new fields to product_variants table
      if (!variantsTableDescription.display_name) {
        await queryInterface.addColumn('product_variants', 'display_name', {
          type: Sequelize.STRING,
          allowNull: true,
        });
      }

      if (!variantsTableDescription.sort_order) {
        await queryInterface.addColumn('product_variants', 'sort_order', {
          type: Sequelize.INTEGER,
          defaultValue: 0,
        });
      }

      if (!variantsTableDescription.is_default) {
        await queryInterface.addColumn('product_variants', 'is_default', {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        });
      }

      if (!variantsTableDescription.is_available) {
        await queryInterface.addColumn('product_variants', 'is_available', {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
        });
      }
    }

    // Create warranty_packages table (if not exists)
    let warrantyPackagesTableDescription;
    try {
      warrantyPackagesTableDescription =
        await queryInterface.describeTable('warranty_packages');
    } catch (error) {
      warrantyPackagesTableDescription = null;
    }

    if (!warrantyPackagesTableDescription) {
      await queryInterface.createTable('warranty_packages', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        duration_months: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        price: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 0,
        },
        terms: {
          type: Sequelize.JSONB,
          defaultValue: {},
        },
        coverage: {
          type: Sequelize.ARRAY(Sequelize.STRING),
          defaultValue: [],
        },
        is_active: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
        },
        sort_order: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
        },
      });
    }

    // Create product_warranties junction table (if not exists)
    let productWarrantiesTableDescription;
    try {
      productWarrantiesTableDescription =
        await queryInterface.describeTable('product_warranties');
    } catch (error) {
      productWarrantiesTableDescription = null;
    }

    if (!productWarrantiesTableDescription) {
      await queryInterface.createTable('product_warranties', {
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
        warranty_package_id: {
          type: Sequelize.UUID,
w          allowNull: false,
          references: {
            model: 'warranty_packages',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        is_default: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
        },
      });
    }

    // Add indexes if they don't exist
    try {
      await queryInterface.addIndex('products', ['brand']);
    } catch (error) {
      // Index might already exist
    }

    try {
      await queryInterface.addIndex('products', ['model']);
    } catch (error) {
      // Index might already exist
    }

    if (variantsTableDescription) {
      try {
        await queryInterface.addIndex('product_variants', ['is_default']);
      } catch (error) {
        // Index might already exist
      }

      try {
        await queryInterface.addIndex('product_variants', ['is_available']);
      } catch (error) {
        // Index might already exist
      }
    }

    // Check if product_warranties table exists before adding indexes
    try {
      await queryInterface.describeTable('product_warranties');
      await queryInterface.addIndex('product_warranties', ['product_id']);
      await queryInterface.addIndex('product_warranties', ['warranty_package_id']);
    } catch (error) {
      // Table might not exist yet
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Check if tables exist before trying to modify them
    const productsTableDescription = await queryInterface.describeTable('products');

    // Remove indexes if they exist
    if (productsTableDescription.brand) {
      try {
        await queryInterface.removeIndex('products', ['brand']);
      } catch (error) {
        // Index might not exist, continue
      }
    }

    if (productsTableDescription.model) {
      try {
        await queryInterface.removeIndex('products', ['model']);
      } catch (error) {
        // Index might not exist, continue
      }
    }

    // Check product_variants table
    let variantsTableDescription;
    try {
      variantsTableDescription = await queryInterface.describeTable('product_variants');
    } catch (error) {
      variantsTableDescription = null;
    }

    if (variantsTableDescription) {
      if (variantsTableDescription.is_default) {
        try {
          await queryInterface.removeIndex('product_variants', ['is_default']);
        } catch (error) {
          // Index might not exist, continue
        }
      }

      if (variantsTableDescription.is_available) {
        try {
          await queryInterface.removeIndex('product_variants', ['is_available']);
        } catch (error) {
          // Index might not exist, continue
        }
      }
    }

    // Check if product_warranties table exists
    try {
      await queryInterface.describeTable('product_warranties');
      await queryInterface.removeIndex('product_warranties', ['product_id']);
      await queryInterface.removeIndex('product_warranties', ['warranty_package_id']);
      await queryInterface.dropTable('product_warranties');
    } catch (error) {
      // Table might not exist, continue
    }

    // Check if warranty_packages table exists
    try {
      await queryInterface.describeTable('warranty_packages');
      await queryInterface.dropTable('warranty_packages');
    } catch (error) {
      // Table might not exist, continue
    }

    // Remove columns from product_variants if table exists
    if (variantsTableDescription) {
      if (variantsTableDescription.display_name) {
        await queryInterface.removeColumn('product_variants', 'display_name');
      }
      if (variantsTableDescription.sort_order) {
        await queryInterface.removeColumn('product_variants', 'sort_order');
      }
      if (variantsTableDescription.is_default) {
        await queryInterface.removeColumn('product_variants', 'is_default');
      }
      if (variantsTableDescription.is_available) {
        await queryInterface.removeColumn('product_variants', 'is_available');
      }
    }

    // Remove columns from products
    if (productsTableDescription.brand) {
      await queryInterface.removeColumn('products', 'brand');
    }
    if (productsTableDescription.model) {
      await queryInterface.removeColumn('products', 'model');
    }
    if (productsTableDescription.warranty_months) {
      await queryInterface.removeColumn('products', 'warranty_months');
    }
    if (productsTableDescription.specifications) {
      await queryInterface.removeColumn('products', 'specifications');
    }
  },
};
