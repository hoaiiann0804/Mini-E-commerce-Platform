const { DataTypes } = require("sequelize");
const slugify = require("slugify");
const sequelize = require("../config/sequelize");

const Product = sequelize.define(
  "Product",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    slug: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    shortDescription: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    compareAtPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    images: {
      type: DataTypes.TEXT,
      defaultValue: "[]",
      get() {
        const value = this.getDataValue("images");
        if (!value) return [];
        try {
          return typeof value === "string" ? JSON.parse(value) : value;
        } catch (error) {
          return [];
        }
      },
      set(value) {
        this.setDataValue(
          "images",
          Array.isArray(value)
            ? JSON.stringify(value)
            : JSON.stringify(value || [])
        );
      },
    },
    thumbnail: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    inStock: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    stockQuantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    sku: {
      type: DataTypes.TEXT,
      allowNull: true,
      unique: true,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive", "draft"),
      defaultValue: "active",
    },
    featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    searchKeywords: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: "[]",
      field: "search_keywords",
      get() {
        const value = this.getDataValue("searchKeywords");
        if (!value) return [];
        try {
          return typeof value === "string" ? JSON.parse(value) : value;
        } catch (error) {
          return [];
        }
      },
      set(value) {
        this.setDataValue("searchKeywords", Array.isArray(value) ? value : []);
      },
    },
    seoTitle: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "seo_title",
    },
    seoDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "seo_description",
    },
    seoKeywords: {
      type: DataTypes.TEXT,
      defaultValue: "[]",
      field: "seo_keywords",
      get() {
        const value = this.getDataValue("seoKeywords");
        if (!value) return [];
        try {
          return typeof value === "string" ? JSON.parse(value) : value;
        } catch (error) {
          return [];
        }
      },
      set(value) {
        this.setDataValue(
          "seoKeywords",
          Array.isArray(value)
            ? JSON.stringify(value)
            : JSON.stringify(value || [])
        );
      },
    },
    // Technical specifications for laptops/computers
    specifications: {
      type: DataTypes.TEXT,
      defaultValue: "[]",
      field: "specifications",
      get() {
        const value = this.getDataValue("specifications");
        if (!value) return [];
        try {
          return typeof value === "string" ? JSON.parse(value) : value;
        } catch (error) {
          return [];
        }
      },
      set(value) {
        this.setDataValue(
          "specifications",
          typeof value === "object"
            ? JSON.stringify(value)
            : JSON.stringify(value || [])
        );
      },
    },
    // Product condition
    condition: {
      type: DataTypes.ENUM("new", "like-new", "used", "refurbished"),
      defaultValue: "new",
    },
    // Base name for variant products
    baseName: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "base_name",
    },
    // Whether this product uses variants
    isVariantProduct: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_variant_product",
    },
    avgRating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0,
      field: "avg_rating",
    },
    reviewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "review_count",
    },
    minVariantPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      field: "min_variant_price",
    },
  },
  {
    tableName: "products",
    timestamps: true,
    hooks: {
      beforeValidate: (product) => {
        if (product.name) {
          // Tạo slug với một chuỗi ngẫu nhiên để đảm bảo tính duy nhất
          const randomString = Math.random().toString(36).substring(2, 8);
          product.slug =
            slugify(product.name, {
              lower: true,
              strict: true,
            }) +
            "-" +
            randomString;
        }
      },
      beforeCreate: async (product) => {
        // Auto-generate search keywords when creating new product
        if (!product.searchKeywords || product.searchKeywords.length === 0) {
          const keywordGeneratorService = require("../services/chatbot/keywordGenerator.service");
          product.searchKeywords = keywordGeneratorService.generateKeywords({
            name: product.name,
            shortDescription: product.shortDescription,
            description: product.description,
            category: product.category,
          });
        }
      },
      beforeUpdate: async (product) => {
        // Auto-regenerate search keywords when updating product
        if (
          product.changed("name") ||
          product.changed("shortDescription") ||
          product.changed("description") ||
          product.changed("category")
        ) {
          const keywordGeneratorService = require("../services/chatbot/keywordGenerator.service");
          product.searchKeywords = keywordGeneratorService.generateKeywords({
            name: product.name,
            shortDescription: product.shortDescription,
            description: product.description,
            category: product.category,
          });
        }
      },
    },
  }
);

module.exports = Product;
