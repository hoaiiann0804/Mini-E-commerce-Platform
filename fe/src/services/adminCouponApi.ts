import { api } from './api';

// ---- Types ----

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usagePerUser: number;
  usedCount: number;
  startDate: string;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CouponsResponse {
  status: string;
  data: {
    coupons: Coupon[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
}

export interface CouponQueryParams {
  page?: number;
  limit?: number;
  status?: 'all' | 'active' | 'expired' | 'disabled';
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface CreateCouponRequest {
  code: string;
  description?: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  usagePerUser?: number;
  startDate: string;
  expiresAt: string;
}

export interface UpdateCouponRequest {
  description?: string;
  type?: 'percentage' | 'fixed';
  value?: number;
  minOrderAmount?: number;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  usagePerUser?: number;
  startDate?: string;
  expiresAt?: string;
}

// ---- API Endpoints ----

export const adminCouponApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/admin/coupons
    getCoupons: builder.query<CouponsResponse, CouponQueryParams>({
      query: (params) => ({
        url: '/admin/coupons',
        method: 'GET',
        params,
      }),
      providesTags: ['Coupon'],
    }),

    // POST /api/admin/coupons
    createCoupon: builder.mutation<
      { status: string; message: string; data: { coupon: Coupon } },
      CreateCouponRequest
    >({
      query: (body) => ({
        url: '/admin/coupons',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Coupon'],
    }),

    // PUT /api/admin/coupons/:id
    updateCoupon: builder.mutation<
      { status: string; message: string; data: { coupon: Coupon } },
      { id: string; data: UpdateCouponRequest }
    >({
      query: ({ id, data }) => ({
        url: `/admin/coupons/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Coupon'],
    }),

    // PATCH /api/admin/coupons/:id/toggle
    toggleCouponStatus: builder.mutation<
      { status: string; message: string; data: { coupon: Coupon } },
      string
    >({
      query: (id) => ({
        url: `/admin/coupons/${id}/toggle`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Coupon'],
    }),
  }),
});

export const {
  useGetCouponsQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useToggleCouponStatusMutation,
} = adminCouponApi;
