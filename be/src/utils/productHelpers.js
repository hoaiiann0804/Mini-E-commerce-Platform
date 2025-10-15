/**
 * Product Helper Functions
 * Utilities for managing product stock and variants
 */

const { ProductVariant } = require("../models");

/**
 * Calculate total stock from variants
 * @param {Array} variants - Array of product variants
 * @returns {number} Total stock quantity
 */
const calculateTotalStock = (variants) => {
  if (!variants || variants.length === 0) return 0;
  return variants.reduce(
    (total, variant) => total + (variant.stockQuantity || 0),
    0
  );
};

/**
 * Update product total stock based on variants
 * @param {string} productId - Product ID
 * @param {Object} Product - Product model
 * @returns {Promise<number>} Updated total stock
 */
const updateProductTotalStock = async (productId, Product) => {
  try {
    const variants = await ProductVariant.findAll({
      where: { productId },
      attributes: ["stockQuantity"],
    });

    const totalStock = calculateTotalStock(variants);

    await Product.update(
      {
        stockQuantity: totalStock,
        inStock: totalStock > 0,
      },
      { where: { id: productId } }
    );

    return totalStock;
  } catch (error) {
    console.error("Error updating product total stock:", error);
    throw error;
  }
};

/**
 * Validate variant attributes against product attributes
 * @param {Array} productAttributes - Product attributes
 * @param {Object} variantAttributes - Variant attributes
 * @returns {boolean} Is valid
 */
const validateVariantAttributes = (productAttributes, variantAttributes) => {
  // Nếu không có thuộc tính sản phẩm hoặc không có thuộc tính biến thể, trả về true
  if (!productAttributes || productAttributes.length === 0) return true;
  if (!variantAttributes) return true;

  // Kiểm tra từng thuộc tính sản phẩm
  for (const productAttr of productAttributes) {
    // Kiểm tra nếu thuộc tính này có trong biến thể
    const variantValue = variantAttributes[productAttr.name];

    // Nếu không có giá trị biến thể cho thuộc tính này, bỏ qua
    if (!variantValue) continue;

    // Kiểm tra nếu values tồn tại và là mảng
    if (productAttr.values && Array.isArray(productAttr.values)) {
      // Kiểm tra nếu giá trị biến thể không nằm trong danh sách giá trị cho phép
      if (!productAttr.values.includes(variantValue)) {
        console.log(
          `Giá trị biến thể không hợp lệ: ${variantValue} không nằm trong ${productAttr.values.join(", ")}`
        );
        return false;
      }
    }
  }

  return true;
};

/**
 * Generate variant SKU
 * @param {string} productSku - Base product SKU
 * @param {Object} attributes - Variant attributes
 * @returns {string} Generated SKU
 */
const generateVariantSku = (productSku, attributes) => {
  const suffix = Object.values(attributes)
    .map((value) => value.toUpperCase().replace(/\s+/g, ""))
    .join("-");

  return `${productSku}-${suffix}`;
};

/**
 * Check if product has variants
 * @param {Object} product - Product with variants
 * @returns {boolean} Has variants
 */
const hasVariants = (product) => {
  return product.variants && product.variants.length > 0;
};

/**
 * Get available stock for specific attribute combination
 * @param {Array} variants - Product variants
 * @param {Object} selectedAttributes - Selected attributes
 * @returns {number} Available stock
 */
const getVariantStock = (variants, selectedAttributes) => {
  if (!variants || variants.length === 0) return 0;

  const matchingVariant = variants.find((variant) => {
    return Object.entries(selectedAttributes).every(
      ([key, value]) => variant.attributes[key] === value
    );
  });

  return matchingVariant ? matchingVariant.stockQuantity : 0;
};

/**
 * Get variant by attributes
 * @param {Array} variants - Product variants
 * @param {Object} selectedAttributes - Selected attributes
 * @returns {Object|null} Matching variant
 */
const findVariantByAttributes = (variants, selectedAttributes) => {
  if (!variants || variants.length === 0) return null;

  return variants.find((variant) => {
    return Object.entries(selectedAttributes).every(
      ([key, value]) => variant.attributes[key] === value
    );
  });
};

module.exports = {
  calculateTotalStock,
  updateProductTotalStock,
  validateVariantAttributes,
  generateVariantSku,
  hasVariants,
  getVariantStock,
  findVariantByAttributes,
};
