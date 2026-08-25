import { api } from './api';

export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title: string;
  content: string;
  images?: string[];
  isVerified: boolean;
  likes: number;
  dislikes: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

export interface ReviewFilters {
  page?: number;
  limit?: number;
  rating?: number;
  verified?: boolean;
  withImages?: boolean;
  sort?:
    | 'newest'
    | 'oldest'
    | 'highest_rating'
    | 'lowest_rating'
    | 'most_helpful';
}

export interface CreateReviewData {
  productId: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
}

export const reviewApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get reviews for a product
    getProductReviews: builder.query<
      any,
      { productId: string } & ReviewFilters
    >({
      query: ({ productId, ...filters }) => {
        const params = new URLSearchParams();

        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());
        if (filters.rating) params.append('rating', filters.rating.toString());
        if (filters.verified !== undefined)
          params.append('verified', filters.verified.toString());
        if (filters.withImages !== undefined)
          params.append('withImages', filters.withImages.toString());
        if (filters.sort) params.append('sort', filters.sort);

        return {
          url: `/reviews/product/${productId}?${params.toString()}`,
          method: 'GET',
        };
      },
      providesTags: (_result, _error, { productId }) => [
        { type: 'Review' as const, id: `product-${productId}` },
      ],
    }),

    // Create a review
    createReview: builder.mutation<any, CreateReviewData>({
      query: (reviewData) => ({
        url: '/reviews',
        method: 'POST',
        body: reviewData,
      }),
      invalidatesTags: (_result, _error, { productId }) => [
        { type: 'Review' as const, id: `product-${productId}` },
        { type: 'Product' as const, id: productId },
      ],
    }),

    // Update a review
    updateReview: builder.mutation<
      any,
      { id: string } & Partial<CreateReviewData>
    >({
      query: ({ id, ...reviewData }) => ({
        url: `/reviews/${id}`,
        method: 'PUT',
        body: reviewData,
      }),
      invalidatesTags: (_result, _error, { productId }) => [
        { type: 'Review' as const, id: `product-${productId}` },
        ...(productId ? [{ type: 'Product' as const, id: productId }] : []),
      ],
    }),

    // Delete a review
    deleteReview: builder.mutation<any, string>({
      query: (id) => ({
        url: `/reviews/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, _id) => [{ type: 'Review' as const, id: 'LIST' }],
    }),

    // Mark review as helpful
    markReviewHelpful: builder.mutation<
      any,
      { id: string; helpful: boolean; productId?: string }
    >({
      query: ({ id, helpful }) => ({
        url: `/reviews/${id}/helpful`,
        method: 'PUT',
        body: { helpful },
      }),
      invalidatesTags: (_result, _error, { id, productId }) => [
        { type: 'Review' as const, id },
        ...(productId ? [{ type: 'Review' as const, id: `product-${productId}` }] : []),
      ],
    }),

    // Get user's reviews
    getUserReviews: builder.query<any, { page?: number; limit?: number }>({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());

        return {
          url: `/reviews/user?${queryParams.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['Review'],
    }),
  }),
});

export const {
  useGetProductReviewsQuery,
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
  useMarkReviewHelpfulMutation,
  useGetUserReviewsQuery,
} = reviewApi;
