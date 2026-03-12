/**
 * Product Helper Functions for Frontend
 * Utilities for managing product variants and stock
 */

import {
  Product,
  ProductVariant,
} from "@/types/product.types";
/**
 * Get available stock for specific attribute combination
 */
export const getVariantStock = (
  product: Product,
  selectedAttributes: Record<string, string>
): number => {
  // If no variants, return product stock
  if (!product.variants || product.variants.length === 0) {
    return product.stock || 0;
  }

  // If no attributes selected, return total stock
  if (Object.keys(selectedAttributes).length === 0) {
    return product.stock || 0;
  }

  // Find variants that match selected attributes
  const matchingVariants = product.variants.filter((variant) => {
    if (!variant.attributes) return false;
    return Object.entries(selectedAttributes).every(
      ([key, value]) => variant.attributes[key] === value
    );
  });

  // If we have exactly one variant match, return its stock
  if (matchingVariants.length === 1) {
    return matchingVariants[0].stockQuantity;
  }

  // If we have multiple matches (partial attribute selection), return total stock
  if (matchingVariants.length > 1) {
    return matchingVariants.reduce(
      (total, variant) => total + variant.stockQuantity,
      0
    );
  }

  // No matching variants
  return 0;
};

/**
 * Find variant by selected attributes
 */
export const findVariantByAttributes = (
  variants: ProductVariant[],
  selectedAttributes: Record<string, string>
): ProductVariant | null => {
  if (!variants || variants.length === 0) return null;

  return (
    variants.find((variant) => {
      if (!variant.attributes) return false;
      return Object.entries(selectedAttributes).every(
        ([key, value]) => variant.attributes[key] === value
      );
    }) || null
  );
};

/**
 * Get stock for a specific attribute value
 */
export const getAttributeValueStock = (
  product: Product,
  attributeName: string,
  attributeValue: string
): number => {
  if (!product.variants || product.variants.length === 0) {
    return product.stock || 0;
  }

  const matchingVariants = product.variants.filter((variant) => {
    return (
      variant.attributes && variant.attributes[attributeName] === attributeValue
    );
  });

  return matchingVariants.reduce(
    (total, variant) => total + variant.stockQuantity,
    0
  );
};

/**
 * Check if product has variants
 */
export const hasVariants = (product: Product): boolean => {
  return !!(product.variants && product.variants.length > 0);
};

/**
 * Get all available combinations of attributes
 */
export const getAvailableAttributeCombinations = (
  product: Product
): Record<string, string>[] => {
  if (!product.variants || product.variants.length === 0) return [];

  return product.variants
    .filter((variant) => variant.stockQuantity > 0)
    .map((variant) => variant.attributes);
};

/**
 * Check if a specific attribute combination is available
 */
export const isAttributeCombinationAvailable = (
  product: Product,
  selectedAttributes: Record<string, string>
): boolean => {
  if (!product.variants || product.variants.length === 0) {
    return product.stock > 0;
  }

  const stock = getVariantStock(product, selectedAttributes);
  return stock > 0;
};

/**
 * Get price for selected attributes
 */
export const getVariantPrice = (
  product: Product,
  selectedAttributes: Record<string, string>
): number => {
  if (!product.variants || product.variants.length === 0) {
    return product.price;
  }

  const variant = findVariantByAttributes(product.variants, selectedAttributes);
  return variant ? variant.price : product.price;
};

/**
 * Check if all required attributes are selected
 */
export const areAllAttributesSelected = (
  attributes: Record<string, string>,
  selectedAttributes: Record<string, string>
): boolean => {
  if (!attributes || Object.keys(attributes).length === 0) return true;

  return Object.keys(attributes).every((attrName) => selectedAttributes[attrName]);
};

/**
 * Get attribute values with stock information considering selected attributes
 */
export const getAttributeValuesWithStock = (
  product: Product,
  attributeName: string,
  selectedAttributes: Record<string, string> = {}
): Array<{ value: string; stock: number; available: boolean }> => {
  // With Record<string, string> attributes, we can't determine all possible values
  // from the attributes alone. This function would need product.variants to work properly.
  // For now, return a single value based on the attribute name if it exists
  const attributeValue = product.attributes?.[attributeName];
  if (!attributeValue) return [];

  // If product has variants, get stock for this specific combination
  const tempAttributes = { ...selectedAttributes, [attributeName]: attributeValue };
  const stock = getVariantStock(product, tempAttributes);

  return [{
    value: attributeValue,
    stock,
    available: stock > 0,
  }];
};

/**
 * Get available stock for a specific attribute value considering other selected attributes
 */
export const getAttributeValueStockWithContext = (
  product: Product,
  attributeName: string,
  attributeValue: string,
  otherSelectedAttributes: Record<string, string> = {}
): number => {
  if (!product.variants || product.variants.length === 0) {
    return product.stock || 0;
  }

  // Combine other selected attributes with this specific value
  const combinedAttributes = {
    ...otherSelectedAttributes,
    [attributeName]: attributeValue,
  };

  // Find matching variants
  const matchingVariants = product.variants.filter((variant) => {
    if (!variant.attributes) return false;
    return Object.entries(combinedAttributes).every(
      ([key, value]) => variant.attributes[key] === value
    );
  });

  return matchingVariants.reduce(
    (total, variant) => total + variant.stockQuantity,
    0
  );
};

/**
 * Format stock display text
 */
export const formatStockText = (stock: number): string => {
  if (stock === 0) return "Hết hàng";
  if (stock < 10) return `Chỉ còn ${stock} sản phẩm`;
  return `Còn ${stock} sản phẩm`;
};

/**
 * Get stock status color
 */
export const getStockStatusColor = (stock: number): string => {
  if (stock === 0) return "text-red-500";
  if (stock < 10) return "text-orange-500";
  return "text-green-500";
};
