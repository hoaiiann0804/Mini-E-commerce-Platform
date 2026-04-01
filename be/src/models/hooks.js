const { sequelize } = require("./index");

/**
 * Updates the reviewCount and avgRating for a product.
 * @param {string} productId - The ID of the product to update.
 * @param {object} transaction - The Sequelize transaction.
 */
const updateProductReviewStats = async (productId, transaction) => {
  if (!productId) return;

  const { Product, Review } = sequelize.models;

  const stats = await Review.findOne({
    where: { productId },
    attributes: [
      [sequelize.fn("AVG", sequelize.col("rating")), "avgRating"],
      [sequelize.fn("COUNT", sequelize.col("id")), "reviewCount"],
    ],
    raw: true,
    transaction,
  });

  await Product.update(
    {
      avgRating: stats && stats.avgRating ? parseFloat(stats.avgRating) : 0,
      reviewCount: stats && stats.reviewCount ? parseInt(stats.reviewCount) : 0,
    },
    {
      where: { id: productId },
      transaction,
    }
  );
};

/**
 * Updates the minVariantPrice for a product.
 * @param {string} productId - The ID of the product to update.
 * @param {object} transaction - The Sequelize transaction.
 */
const updateProductVariantStats = async (productId, transaction) => {
  if (!productId) return;

  const { Product, ProductVariant } = sequelize.models;

  const result = await ProductVariant.findOne({
    where: { productId },
    attributes: [
      [sequelize.fn("MIN", sequelize.col("price")), "minVariantPrice"],
    ],
    raw: true,
    transaction,
  });

  await Product.update(
    {
      minVariantPrice:
        result && result.minVariantPrice !== null
          ? parseFloat(result.minVariantPrice)
          : null,
    },
    {
      where: { id: productId },
      transaction,
    }
  );
};

/**
 * Attaches hooks to Sequelize models to keep product stats updated.
 * @param {object} sequelize - The Sequelize instance.
 */
module.exports = (sequelize) => {
  const { Review, ProductVariant } = sequelize.models;

  // --- Review Hooks ---
  const reviewHook = async (instance, options) => {
    const productId =
      instance.productId || (instance.where && instance.where.productId);
    if (productId) {
      await updateProductReviewStats(productId, options.transaction);
    }
  };

  Review.afterSave("updateProductReviewStats", reviewHook);
  Review.afterDestroy("updateProductReviewStats", reviewHook);
  Review.afterBulkCreate(
    "updateProductReviewStatsOnBulk",
    async (instances, options) => {
      if (instances.length > 0) {
        const productIds = [...new Set(instances.map((i) => i.productId))];
        await Promise.all(
          productIds.map((id) =>
            updateProductReviewStats(id, options.transaction)
          )
        );
      }
    }
  );
  Review.afterBulkDestroy("updateProductReviewStatsOnBulk", reviewHook);

  // --- ProductVariant Hooks ---
  const variantHook = async (instance, options) => {
    const productId =
      instance.productId || (instance.where && instance.where.productId);
    if (productId) {
      await updateProductVariantStats(productId, options.transaction);
    }
  };

  ProductVariant.afterSave("updateProductVariantStats", variantHook);
  ProductVariant.afterDestroy("updateProductVariantStats", variantHook);
  ProductVariant.afterBulkCreate(
    "updateProductVariantStatsOnBulk",
    async (instances, options) => {
      if (instances.length > 0) {
        const productIds = [...new Set(instances.map((i) => i.productId))];
        await Promise.all(
          productIds.map((id) =>
            updateProductVariantStats(id, options.transaction)
          )
        );
      }
    }
  );
  ProductVariant.afterBulkDestroy(
    "updateProductVariantStatsOnBulk",
    variantHook
  );
};
