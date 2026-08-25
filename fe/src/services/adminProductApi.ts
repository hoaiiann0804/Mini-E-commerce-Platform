import { api } from './api';

// Types for admin product management
export interface CreateProductRequest {
  name: string;
  baseName?: string;
  description: string;
  shortDescription: string;
  price?: number;
  comparePrice?: number;
  stock?: number;
  sku?: string;
  images: string[];
  status: 'active' | 'inactive' | 'draft';
  featured?: boolean;
  categoryIds: string[];
  condition?: 'new' | 'like-new' | 'used' | 'refurbished';
  warrantyMonths?: number;
  specifications?: Array<{
    name: string;
    value: string;
    category?: string;
  }>;
  attributes?: Array<{
    name: string;
    value: string;
  }>;
  variants?: Array<{
    name: string;
    variantName?: string;
    sku?: string;
    price: number;
    compareAtPrice?: number;
    stockQuantity: number;
    stock?: number;
    isDefault?: boolean;
    isAvailable?: boolean;
    attributes?: Record<string, string>;
    specifications?: Record<string, any>;
    images?: string[];
  }>;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  warrantyPackageIds?: string[];
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: string;
}

export interface AdminProductsFilter {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  priceMin?: number;
  priceMax?: number;
  stockMin?: number;
  stockMax?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface AdminProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  comparePrice?: number;
  stock: number;
  sku: string;
  images: string[];
  status: string;
  Categories: Array<{
    id: string;
    name: string;
  }>;
  attributes?: Array<{
    name: string;
    value: string;
  }>;
  variants?: Array<{
    id: string;
    name: string;
    price: number;
    stock: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProductsResponse {
  status: string;
  data: {
    products: AdminProduct[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
}

export interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

export const adminProductApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get admin products with filters
    getAdminProducts: builder.query<
      AdminProductsResponse,
      AdminProductsFilter | void
    >({
      query: (filters) => ({
        url: '/admin/products',
        params: filters ?? {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.products.map(({ id }) => ({
                type: 'Product' as const,
                id,
              })),
              { type: 'Product', id: 'ADMIN_LIST' },
            ]
          : [{ type: 'Product', id: 'ADMIN_LIST' }],
    }),

    // Create new product
    createProduct: builder.mutation<
      ApiResponse<AdminProduct>,
      CreateProductRequest
    >({
      query: (productData) => ({
        url: '/admin/products',
        method: 'POST',
        body: productData,
      }),
      invalidatesTags: [{ type: 'Product', id: 'ADMIN_LIST' }],
    }),

    // Update product
    updateProduct: builder.mutation<
      ApiResponse<AdminProduct>,
      UpdateProductRequest
    >({
      query: ({ id, ...productData }) => ({
        url: `/admin/products/${id}`,
        method: 'PUT',
        body: productData,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Product', id },
        { type: 'Product', id: 'ADMIN_LIST' },
      ],
    }),

    // Delete product
    deleteProduct: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/admin/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Product', id },
        { type: 'Product', id: 'ADMIN_LIST' },
      ],
    }),

    // Get single product for admin
    getAdminProductById: builder.query<ApiResponse<AdminProduct>, string>({
      query: (id) => `/admin/products/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Product', id }],
    }),
  }),
});

export const {
  useGetAdminProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetAdminProductByIdQuery,
} = adminProductApi;
