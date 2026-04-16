/**
 * Product transformation utilities
 * Centralizes product data transformation logic to avoid code duplication
 */

export interface RawProduct {
  id: string;
  name: string;
  price: string | number;
  compareAtPrice?: string | number;
  stockQuantity: number;
  categories?: Array<{ id: string; name: string }>;
  featured?: boolean;
  ratings?: {
    average: number;
    count: number;
  };
  [key: string]: any;
}

export interface TransformedProduct {
  id: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  categoryId: string;
  categoryName: string;
  isFeatured: boolean;
  ratings: {
    average: number;
    count: number;
  };
  [key: string]: any;
}

/**
 * Transform a single product from backend format to frontend format
 */
export const transformProduct = (product: RawProduct): TransformedProduct => {
  const isAbsoluteUrl = (url: unknown): url is string => {
    if (typeof url !== 'string') return false;
    const trimmed = url.trim();
    return (
      /^https?:\/\//i.test(trimmed) ||
      trimmed.startsWith('data:') ||
      trimmed.startsWith('blob:')
    );
  };

  const isLegacyLocalUploadUrl = (url: unknown): boolean => {
    if (typeof url !== 'string') return false;
    const trimmed = url.trim();
    return (
      trimmed.startsWith('/uploads/') ||
      trimmed.startsWith('uploads/') ||
      trimmed.startsWith('images/') ||
      trimmed.includes('localhost:8888/uploads')
    );
  };

  const coerceStringArray = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.filter((v) => typeof v === 'string');
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed)
          ? parsed.filter((v) => typeof v === 'string')
          : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  // Prefer relational images (productImages) if backend provides them (Cloudinary URLs)
  const relationalImageUrls: string[] = Array.isArray((product as any).productImages)
    ? (product as any).productImages
        .map((img: any) => img?.url || img?.filePath)
        .filter((u: any) => isAbsoluteUrl(u) && !isLegacyLocalUploadUrl(u))
    : [];

  const rawImages = coerceStringArray((product as any).images);
  const cleanedImages = rawImages
    .map((u) => (typeof u === 'string' ? u.trim() : ''))
    .filter((u) => isAbsoluteUrl(u) && !isLegacyLocalUploadUrl(u));

  const finalImages =
    relationalImageUrls.length > 0 ? relationalImageUrls : cleanedImages;

  const rawThumbnail = typeof (product as any).thumbnail === 'string' ? (product as any).thumbnail.trim() : '';
  const finalThumbnail =
    rawThumbnail && isAbsoluteUrl(rawThumbnail) && !isLegacyLocalUploadUrl(rawThumbnail)
      ? rawThumbnail
      : finalImages[0] || '';

  const fallbackThumbnail = `https://placehold.co/400x400/f1f5f9/64748b?text=${encodeURIComponent(
    (product as any)?.name || 'Product'
  )}`;
  const thumbnailWithFallback = finalThumbnail || fallbackThumbnail;
  const imagesWithFallback = finalImages.length > 0 ? finalImages : [thumbnailWithFallback];

  return {
    ...product,
    images: imagesWithFallback,
    thumbnail: thumbnailWithFallback,
    price: parseFloat(String(product.price)),
    compareAtPrice: product.compareAtPrice
      ? parseFloat(String(product.compareAtPrice))
      : null,
    stock: product.stockQuantity,
    categoryId: product.categories?.[0]?.id || '',
    categoryName: product.categories?.[0]?.name || '',
    isFeatured: product.featured || false,
    ratings: product.ratings || {
      average: 0,
      count: 0,
    },
    // Ensure variants and attributes are passed through
    variants: product.variants || [],
    attributes: product.attributes || [],
  };
};

/**
 * Transform an array of products
 */
export const transformProducts = (
  products: RawProduct[]
): TransformedProduct[] => {
  return products.map(transformProduct);
};

/**
 * Transform API response with products array
 */
export const transformProductsResponse = (response: any): any => {
  if (!response?.data) return response;

  // Handle array response (e.g., featured products)
  if (Array.isArray(response.data)) {
    return {
      ...response,
      data: transformProducts(response.data),
    };
  }

  // Handle paginated response
  if (response.data.products && Array.isArray(response.data.products)) {
    return {
      ...response,
      data: {
        ...response.data,
        products: transformProducts(response.data.products),
      },
    };
  }

  // Handle single product response
  if (response.data.id) {
    return {
      ...response,
      data: transformProduct(response.data),
    };
  }

  return response;
};

/**
 * Create URL search params from filters
 */
export const createProductFiltersParams = (
  filters: any = {}
): URLSearchParams => {
  const params = new URLSearchParams();

  // Basic filters
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.categoryId) params.append('category', filters.categoryId);
  if (filters.search) params.append('search', filters.search);
  if (filters.minPrice !== undefined)
    params.append('minPrice', filters.minPrice.toString());
  if (filters.maxPrice !== undefined)
    params.append('maxPrice', filters.maxPrice.toString());

  // Mặc định chỉ lấy sản phẩm active (không inactive)
  if (filters.status !== undefined) {
    params.append('status', filters.status);
  } else {
    params.append('status', 'active');
  }

  // Array filters
  const arrayFilters = ['brand', 'color', 'size'];
  arrayFilters.forEach((filter) => {
    if (filters[filter] && Array.isArray(filters[filter])) {
      filters[filter].forEach((value: string) => {
        params.append(filter, value);
      });
    }
  });

  // Dynamic attribute filters
  Object.keys(filters).forEach((key) => {
    if (key.startsWith('attr_') && Array.isArray(filters[key])) {
      filters[key].forEach((value: string) => {
        params.append(key, value);
      });
    }
  });

  // Sorting
  if (filters.sort) {
    const sortMap: Record<string, string> = {
      price_asc: 'price',
      price_desc: 'price',
      newest: 'createdAt',
      popular: 'rating',
    };

    const orderMap: Record<string, string> = {
      price_desc: 'DESC',
      newest: 'DESC',
      popular: 'DESC',
    };

    params.append('sort', sortMap[filters.sort] || 'createdAt');
    params.append('order', orderMap[filters.sort] || 'ASC');
  }

  return params;
};

/**
 * Generate provide tags for RTK Query caching
 */
export const generateProductTags = (
  result: any,
  tagType: string = 'LIST'
): Array<{ type: 'Product'; id: string | number }> => {
  if (!result?.data) return [{ type: 'Product', id: tagType }];

  // Handle array response
  if (Array.isArray(result.data)) {
    return [
      ...result.data.map(({ id }: any) => ({
        type: 'Product' as const,
        id,
      })),
      { type: 'Product', id: tagType },
    ];
  }

  // Handle paginated response
  if (result.data.products && Array.isArray(result.data.products)) {
    return [
      ...result.data.products.map(({ id }: any) => ({
        type: 'Product' as const,
        id,
      })),
      { type: 'Product', id: tagType },
    ];
  }

  // Handle single product response
  if (result.data.id) {
    return [{ type: 'Product', id: result.data.id }];
  }

  return [{ type: 'Product', id: tagType }];
};
