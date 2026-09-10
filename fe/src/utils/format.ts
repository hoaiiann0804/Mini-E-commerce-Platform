/**
 * Format price to Vietnamese currency
 * @param price - The price to format (can be string or number)
 * @returns Formatted price string
 */
export const formatPrice = (price: string | number): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;

  // Handle invalid prices
  if (isNaN(numPrice)) {
    return '0đ';
  }

  return `${numPrice.toLocaleString('vi-VN')}đ`;
};

/**
 * Format price to USD currency
 * @param price - The price to format (can be string or number)
 * @returns Formatted price string
 */
export const formatPriceUSD = (price: string | number): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;

  // Handle invalid prices
  if (isNaN(numPrice)) {
    return '$0.00';
  }

  return `$${numPrice.toFixed(2)}`;
};

/**
 * Format number to Vietnamese locale
 * @param num - The number to format
 * @returns Formatted number string
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString('vi-VN');
};

/**
 * Parse price from string to number
 * @param price - The price string to parse
 * @returns Parsed number or 0 if invalid
 */
export const parsePrice = (price: string | number): number => {
  if (typeof price === 'number') {
    return price;
  }

  const parsed = parseFloat(price);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Format count in compact format for social proof (e.g., 1.2k, 15k, 1.5M)
 * Used for viewCount and soldCount like Shopee/Lazada
 * @param count - The count to format
 * @returns Compact formatted string
 */
export const formatCompactNumber = (count: number = 0): string => {
  const num = Number(count) || 0;
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return num.toLocaleString('vi-VN');
};
