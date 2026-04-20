import { ProductFilters } from '@/types/product.types';
import { api } from './api';
import {
  createProductFiltersParams,
  transformProductsResponse,
  generateProductTags,
} from '@/utils/productTransform';

export const productApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<any, ProductFilters | void>({
      query: (filters = {}) => {
        const params = createProductFiltersParams(filters);
        return {
          url: `/products?${params.toString()}`,
          method: 'GET',
        };
      },
      transformResponse: transformProductsResponse,
      providesTags: (result) => generateProductTags(result, 'LIST'),
    }),

    getProductById: builder.query<any, string | { id: string; skuId?: string }>(
      {
        query: (arg) => {
          const id = typeof arg === 'string' ? arg : arg.id;
          const skuId = typeof arg === 'object' ? arg.skuId : undefined;

          const params = new URLSearchParams();
          if (skuId) params.append('skuId', skuId);

          return {
            url: `/products/${id}${params.toString() ? `?${params.toString()}` : ''}`,
            method: 'GET',
          };
        },
        transformResponse: transformProductsResponse,
        providesTags: (result, error, arg) => {
          const id = typeof arg === 'string' ? arg : arg.id;
          return [{ type: 'Product', id }];
        },
      }
    ),

    getProductBySlug: builder.query<any, { slug: string; skuId?: string }>({
      query: ({ slug, skuId }) => {
        const params = new URLSearchParams();
        if (skuId) params.append('skuId', skuId);

        return {
          url: `/products/slug/${slug}${params.toString() ? `?${params.toString()}` : ''}`,
          method: 'GET',
        };
      },
      transformResponse: transformProductsResponse,
      providesTags: (result) => generateProductTags(result, 'SLUG'),
    }),

    getFeaturedProducts: builder.query<any, { limit?: number } | void>({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params?.limit) queryParams.append('limit', params.limit.toString());

        return {
          url: `/products/featured?${queryParams.toString()}`,
          method: 'GET',
        };
      },
      transformResponse: transformProductsResponse,
      providesTags: (_result) => generateProductTags(_result, 'FEATURED'),
    }),

    getNewArrivals: builder.query<any, { limit?: number } | void>({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params?.limit) queryParams.append('limit', params.limit.toString());

        return {
          url: `/products/new-arrivals?${queryParams.toString()}`,
          method: 'GET',
        };
      },
      transformResponse: transformProductsResponse,
      providesTags: (_result) => generateProductTags(_result, 'NEW_ARRIVALS'),
    }),

    getBestSellers: builder.query<
      any,
      { limit?: number; period?: string } | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.period) queryParams.append('period', params.period);

        return {
          url: `/products/best-sellers?${queryParams.toString()}`,
          method: 'GET',
        };
      },
      transformResponse: transformProductsResponse,
      providesTags: (result) => generateProductTags(result, 'BEST_SELLERS'),
    }),

    getDeals: builder.query<
      any,
      { minDiscount?: number; limit?: number; sort?: string } | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.minDiscount)
          queryParams.append('minDiscount', params.minDiscount.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.sort) queryParams.append('sort', params.sort);

        return {
          url: `/products/deals?${queryParams.toString()}`,
          method: 'GET',
        };
      },
      transformResponse: transformProductsResponse,
      providesTags: (result) => generateProductTags(result, 'DEALS'),
    }),

    getRelatedProducts: builder.query<any, string>({
      query: (productId) => ({
        url: `/products/${productId}/related`,
        method: 'GET',
      }),
      transformResponse: transformProductsResponse,
      providesTags: (result) => generateProductTags(result, 'RELATED'),
    }),

    getProductVariants: builder.query<any, string>({
      query: (productId) => ({
        url: `/products/${productId}/variants`,
        method: 'GET',
      }),
      providesTags: (_result, _error, productId) => [
        { type: 'Product', id: `${productId}_VARIANTS` },
      ],
    }),

    getProductReviewsSummary: builder.query<any, string>({
      query: (productId) => ({
        url: `/products/${productId}/reviews-summary`,
        method: 'GET',
      }),
      providesTags: (_result, _error, productId) => [
        { type: 'Product', id: `${productId}_REVIEWS` },
      ],
    }),

    searchProducts: builder.query<
      any,
      { q: string; page?: number; limit?: number }
    >({
      query: ({ q, page = 1, limit = 10 }) => {
        const params = new URLSearchParams();
        params.append('q', q);
        params.append('page', page.toString());
        params.append('limit', limit.toString());

        return {
          url: `/products/search?${params.toString()}`,
          method: 'GET',
        };
      },
      transformResponse: transformProductsResponse,
      providesTags: (result) => generateProductTags(result, 'SEARCH'),
    }),

    getProductFilters: builder.query<any, { categoryId?: string }>({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.categoryId)
          queryParams.append('categoryId', params.categoryId);

        //console.log(
          'Fetching product filters with params:',
          queryParams.toString()
        );
        return {
          url: `/products/filters?${queryParams.toString()}`,
          method: 'GET',
        };
      },
      transformResponse: (response: any) => {
        return response.data;
      },
      providesTags: ['Product'],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useLazyGetProductsQuery,
  useGetProductByIdQuery,
  useGetProductBySlugQuery,
  useGetFeaturedProductsQuery,
  useGetNewArrivalsQuery,
  useGetBestSellersQuery,
  useGetDealsQuery,
  useGetRelatedProductsQuery,
  useGetProductVariantsQuery,
  useGetProductReviewsSummaryQuery,
  useSearchProductsQuery,
  useGetProductFiltersQuery,
} = productApi;
