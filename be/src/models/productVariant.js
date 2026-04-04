const { DataTypes, where } = require("sequelize");
const sequelize = require("../config/sequelize");

const ProductVariant = sequelize.define(
  "ProductVariant",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "product_id",
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sku: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    attributes: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    // New field for hierarchical attributes
    attributeValues: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      field: "attribute_values",
    },
    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    stockQuantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "stock_quantity",
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    // Display name for variant (auto-generated)
    displayName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "display_name",
    },
    // Sort order for variants
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "sort_order",
    },
    // Whether this is the default variant
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_default",
    },
    // Availability status
    isAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_available",
    },
    // Compare at price for variant
    compareAtPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      field: "compare_at_price",
    },
    // Variant specifications (override product specs)
    specifications: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  },
  {
    tableName: "product_variants",
    timestamps: true,
    hooks: {
      beforeCreate: async (variant) => {
        // Auto-generate display name based on attributes
        if (!variant.displayName && variant.attributeValues) {
          const productNameService = require("../services/productNameGenerator.service");
          const Product = require("./product");

          try {
            const product = await Product.findByPk(variant.productId);
            if (product && product.baseName) {
              const attributeValueIds = Object.values(
                variant.attributeValues
              ).filter((id) => id);
              if (attributeValueIds.length > 0) {
                const generatedName =
                  await productNameService.generateProductName(
                    product.baseName,
                    attributeValueIds
                  );
                variant.displayName = generatedName
                  .replace(product.baseName, "")
                  .trim();
                variant.name = generatedName;
              }
            }
          } catch (error) {
            console.log("Could not auto-generate variant name:", error.message);
          }
        }
      },
      beforeUpdate: async (variant) => {
        // Auto-regenerate display name if attributes changed
        if (variant.changed("attributeValues") && variant.attributeValues) {
          const productNameService = require("../services/productNameGenerator.service");
          const Product = require("./product");

          try {
            const product = await Product.findByPk(variant.productId);
            if (product && product.baseName) {
              const attributeValueIds = Object.values(
                variant.attributeValues
              ).filter((id) => id);
              if (attributeValueIds.length > 0) {
                const generatedName =
                  await productNameService.generateProductName(
                    product.baseName,
                    attributeValueIds
                  );
                variant.displayName = generatedName
                  .replace(product.baseName, "")
                  .trim();
                variant.name = generatedName;
              }
            }
          } catch (error) {
            console.log(
              "Could not auto-regenerate variant name:",
              error.message
            );
          }
        }
      },
      afterSave: async (variant, options) => {
        const Product = require("./product");
        try {
          const minPrice = await ProductVariant.min("price", {
            where: {
              productId: variant.productId,
              isAvailable: true,
            },
            transaction: options.transaction,
          });
          await Product.update(
            {
              minVariantPrice: minPrice || 0,
            },
            {
              where: {
                id: variant.productId,
                transaction: options.transaction,
              },
            }
          );
          console.log(
            `>>> Auto-updated minPrice for Product ${variant.productId}: ${minPrice}`
          );
        } catch (error) {
          console.log("Hook afterSave (Price) error", error.message);
        }

        try {
          const totalShock = await ProductVariant.sum("stock_quantity", {
            where: {
              productId: variant.productId,
            },
            transaction: options.transaction,
          });
          await Product.update({
            stockQuantity: totalShock || 0,
            inStock: (totalShock || 0) > 0,
          });
        } catch (error) {
          console.error("Hook afterSave (Stock) error:", error.message);
        }
      },
      afterDestroy: async (variant, options) => {
        const Product = require("./product");
        try {
          const minPrice = await ProductVariant.min("price", {
            where: {
              productId: variant.productId,
              isAvailable: true,
            },
            transaction: options.transaction,
          });
          await Product.update(
            {
              minVariantPrice: minPrice || 0,
            },
            {
              where: {
                id: variant.productId,
                transaction: options.transaction,
              },
            }
          );
        } catch (error) {
          console.error("Hook afterDestroy (Price) error:", error.message);
        }

        try {
          const totalShock = await ProductVariant.sum("stock_quantity", {
            where: {
              productId: variant.productId,
            },
            transaction: options.transaction,
          });
          await Product.update(
            {
              stockQuantity: totalShock || 0,
              inStock: (totalShock || 0) > 0,
            },
            {
              where: {
                productId: variant.productId,
              },
              transaction: options.transaction,
            }
          );
        } catch (error) {
          console.error("Hook afterDestroy (Stock) error:", error.message);
        }
      },
    },
  }
);

module.exports = ProductVariant;
