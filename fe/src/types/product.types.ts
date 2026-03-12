// Product Types
export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  thumbnail: string;
  images: string[];
  description: string;
  shortDescription?: string;
  categoryId: string;
  categoryName: string;
  stock: number;
  ratings?: {
    average: number;
    count: number;
  };
  attributes?: Record<string, string>;
  variants?: ProductVariant[];
  isNew?: boolean;
  isFeatured?: boolean;
  // New laptop-specific fields
  brand?: string;
  model?: string;
  condition?: "new" | "like-new" | "used" | "refurbished";
  warrantyMonths?: number;
  specifications?: Record<string, any>;
  warrantyPackages?: WarrantyPackage[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id?: string;
  name: string;
  sku?: string;
  price: number;
  compareAtPrice?: number;
  stockQuantity: number;
  stock?: number;
  attributes: Record<string, string>;
  specifications?: Record<string, any>;
  images?: string[];
  // New fields
  displayName?: string;
  sortOrder?: number;
  isDefault?: boolean;
  isAvailable?: boolean;
}

export interface ProductAttribute {
  id: string;
  productId: string;
  name: string;
  values: string[];
  // Added for form/modal compatibility - stores comma-separated string
  value: string;
  createdAt: string;
  updatedAt: string;
}

export interface WarrantyPackage {
  id: string;
  name: string;
  description?: string;
  durationMonths: number;
  price: number;
  terms?: Record<string, any>;
  coverage?: string[];
  isActive?: boolean;
  sortOrder?: number;
  productWarranty?: {
    isDefault: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductFilters {
  categoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "price_asc" | "price_desc" | "newest" | "popular";
  page?: number;
  limit?: number;
  brand?: string[];
  color?: string[];
  size?: string[];
  [key: string]: any; // For dynamic attribute filters
}

// Form data for creating/editing products
export interface ProductFormData {
  // Basic info
  name: string;
  baseName?: string;
  description: string;
  shortDescription: string;
  sku?: string;

  // Pricing (for non-variant products)
  price?: number;
  compareAtPrice?: number;

  // Stock (for non-variant products)
  stockQuantity?: number;
  inStock?: boolean;

  // Media
  images: string[];
  thumbnail?: string;

  // Categories
  categoryIds: string[];

  // Product settings
  status: "active" | "inactive" | "draft";
  featured: boolean;
  condition: "new" | "like-new" | "used" | "refurbished";

  // SEO
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  searchKeywords?: string[];

  // Specifications
  specifications?: ProductSpecification[];

  // Attributes & Variants
  attributes?: Record<string, string>;
  variants?: ProductVariantFormData[];

  // Warranty
  warrantyMonths?: number;
  warrantyPackageIds?: string[];

  // Variant product flag
  isVariantProduct?: boolean;
}

export interface ProductVariantFormData {
  id?: string;
  name: string;
  variantName?: string;
  sku?: string;
  price: number;
  compareAtPrice?: number;
  stockQuantity: number;
  stock?: number; // alias for stockQuantity
  isDefault?: boolean;
  isAvailable?: boolean;
  attributes?: Record<string, string>;
  attributeValues?: Record<string, string>;
  specifications?: Record<string, any>;
  images?: string[];
  displayName?: string;
  sortOrder?: number;
}

export interface ProductSpecification {
  id?: string;
  name: string;
  value: string;
  category?: string;
  sortOrder?: number;
}

// Enhanced Product interface for variant support
export interface ProductWithVariants extends Product {
  baseName?: string;
  isVariantProduct?: boolean;
  currentVariant?: {
    id: string;
    name: string;
    fullName: string;
    price: number;
    compareAtPrice?: number;
    sku: string;
    stockQuantity: number;
    specifications: Record<string, any>;
    images: string[];
  };
  availableVariants?: Array<{
    id: string;
    name: string;
    price: number;
    compareAtPrice?: number;
    stockQuantity: number;
    isDefault: boolean;
    sku: string;
  }>;
}
