import { api } from './api';

// ---- Types ----

export interface ValidateCouponRequest {
  code: string;
  subtotal: number;
}

export interface ValidateCouponResponse {
  status: string;
  data: {
    valid: boolean;
    code: string;
    type: 'percentage' | 'fixed';
    discountAmount: number;
    message: string;
  };
}

// ---- API Endpoints ----

export const couponApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // POST /api/coupons/validate — Preview coupon trước khi đặt hàng
    validateCoupon: builder.mutation<ValidateCouponResponse, ValidateCouponRequest>({
      query: (body) => ({
        url: '/coupons/validate',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useValidateCouponMutation,
} = couponApi;
