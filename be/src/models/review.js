const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");
const { updateProductReviewStats } = require("../utils/productHooks");

class Review extends Model {
  static associate(models) {}
}

Review.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    likes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    dislikes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
  },
  {
    sequelize,
    modelName: "Review",
    tableName: "reviews",
    timestamps: true,
    hooks: {
      afterSave: async (review, options) => {
        await updateProductReviewStats(review.productId, options.transaction);
      },

      afterDestroy: async (review, options) => {
        await updateProductReviewStats(review.productId, options.transaction);
      },

      afterBulkCreate: async (reviews, options) => {
        const productIds = [...new Set(reviews.map((r) => r.productId))];
        for (const productId of productIds) {
          await updateProductReviewStats(productId, options.transaction);
        }
      },
    },
  }
);

module.exports = Review;
