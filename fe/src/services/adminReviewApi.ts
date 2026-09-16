import { api } from './api';

// ---- Types ----

export interface ReviewUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
}

export interface ReviewProduct {
  id: string;
  name: string;
  slug: string;
  images?: string[];
}

export interface ReviewReply {
  id: string;
  reviewId: string;
  adminId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  admin?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  content: string;
  isVerified: boolean;
  likes: number;
  dislikes: number;
  images: string[];
  createdAt: string;
  updatedAt: string;
  user?: ReviewUser;
  Product?: ReviewProduct;
  reply?: ReviewReply | null; // Phản hồi của Shop (null nếu chưa có)
}

export interface ReviewPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface ReviewListResponse {
  status: string;
  data: {
    reviews: Review[];
    pagination: ReviewPagination;
  };
}

export interface ReviewFilters {
  page?: number;
  limit?: number;
  productId?: string;
  rating?: number | '';
  isVerified?: boolean | '';
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// ---- API Service ----

export const adminReviewApi = api.injectEndpoints({
  endpoints: (builder) => ({

    /**
     * GET /api/admin/reviews — Lấy danh sách review với filter
     */
    getAdminReviews: builder.query<ReviewListResponse, ReviewFilters>({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
        return `/admin/reviews?${queryParams.toString()}`;
      },
      providesTags: ['Review'],
    }),

    /**
     * DELETE /api/admin/reviews/:id — Xóa review vi phạm
     */
    deleteAdminReview: builder.mutation<{ status: string; message: string }, string>({
      query: (id) => ({
        url: `/admin/reviews/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Review'],
    }),

    /**
     * POST /api/admin/reviews/:id/reply — Tạo hoặc cập nhật phản hồi (upsert)
     * Endpoint này vừa xử lý create vừa update — FE không cần biết đã có reply chưa
     */
    replyToReview: builder.mutation<
      { status: string; message: string; data: { reply: ReviewReply } },
      { reviewId: string; content: string }
    >({
      query: ({ reviewId, content }) => ({
        url: `/admin/reviews/${reviewId}/reply`,
        method: 'POST',
        body: { content },
      }),
      invalidatesTags: ['Review'],
    }),

    /**
     * DELETE /api/admin/reviews/replies/:replyId — Xóa phản hồi
     */
    deleteReviewReply: builder.mutation<{ status: string; message: string }, string>({
      query: (replyId) => ({
        url: `/admin/reviews/replies/${replyId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Review'],
    }),
  }),
});

export const {
  useGetAdminReviewsQuery,
  useDeleteAdminReviewMutation,
  useReplyToReviewMutation,
  useDeleteReviewReplyMutation,
} = adminReviewApi;
