/**
 * Updates the denormalized review statistics (avgRating, reviewCount) on the Product model.
 * This should be triggered by hooks on the Review model.
 * @param {string} productId - The ID of the product to update.
 * @param {object} [transaction] - The Sequelize transaction object.
 */
const updateProductReviewStats = async (productId, transaction) => {
  if (!productId) return;

  const { Product, Review, sequelize } = require("../../models");

  const stats = await Review.findOne({
    where: { productId },
    attributes: [
      [sequelize.fn("AVG", sequelize.col("rating")), "avgRating"],
      [sequelize.fn("COUNT", sequelize.col("id")), "reviewCount"],
    ],
    raw: true,
    transaction,
  });

  const avgRating = stats?.avgRating
    ? parseFloat(stats.avgRating).toFixed(2)
    : 0;
  const reviewCount = stats?.reviewCount ? parseInt(stats.reviewCount, 10) : 0;

  await Product.update(
    { avgRating, reviewCount },
    { where: { id: productId }, transaction }
  );
};

/**
 * Updates the denormalized price and stock statistics on the Product model from its variants.
 * This should be triggered by hooks on the ProductVariant model.
 * @param {string} productId - The ID of the product to update.
 * @param {object} [transaction] - The Sequelize transaction object.
 */
const updateProductVariantStats = async (productId, transaction) => {
  if (!productId) return;

  const { Product, ProductVariant, sequelize } = require("../../models");

  const stats = await ProductVariant.findOne({
    where: { productId },
    attributes: [
      [sequelize.fn("MIN", sequelize.col("price")), "minVariantPrice"],
      [sequelize.fn("SUM", sequelize.col("stock_quantity")), "totalStock"],
    ],
    raw: true,
    transaction,
  });

  const minVariantPrice = stats?.minVariantPrice
    ? parseFloat(stats.minVariantPrice)
    : null;
  const totalStock = stats?.totalStock ? parseInt(stats.totalStock, 10) : 0;

  await Product.update(
    {
      minVariantPrice,
      stockQuantity: totalStock,
      inStock: totalStock > 0,
    },
    { where: { id: productId }, transaction }
  );
};

module.exports = {
  updateProductReviewStats,
  updateProductVariantStats,
};
