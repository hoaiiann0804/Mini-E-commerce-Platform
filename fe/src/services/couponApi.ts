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

/**
 * AvailableCoupon — Response shape từ GET /api/coupons/available
 *
 * Server enrich sẵn trạng thái eligible để Frontend
 * chỉ cần render, không cần tính toán lại phía client.
 *
 * eligible=true  → Thẻ xanh, có thể click "Dùng ngay"
 * eligible=false → Thẻ xám, hiển thị reason (Upsell trigger)
 */
export interface AvailableCoupon {
  id: string;
  code: string;
  description: string | null;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  expiresAt: string;
  startDate: string;
  usageInfo: { unlimited: true } | { unlimited: false; used: number; limit: number };
  /** true nếu user đủ điều kiện dùng ngay với đơn hiện tại */
  eligible: boolean;
  /** null nếu eligible, chuỗi giải thích lý do nếu không đủ điều kiện */
  reason: string | null;
  /** Số tiền giảm preview (chỉ có khi eligible=true) */
  discountPreview: number | null;
}

export interface AvailableCouponsResponse {
  status: string;
  data: {
    coupons: AvailableCoupon[];
    total: number;
    eligibleCount: number;
  };
}

// ---- API Endpoints ----

export const couponApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * PHA 1 — DISCOVERY
     * GET /api/coupons/available?subtotal=XXX
     *
     * Dùng `query` (không phải `mutation`) vì đây là thao tác đọc dữ liệu.
     * RTK Query sẽ cache kết quả và tự refetch khi subtotal thay đổi.
     */
    getAvailableCoupons: builder.query<AvailableCouponsResponse, number>({
      query: (subtotal) => ({
        url: `/coupons/available?subtotal=${subtotal}`,
        method: 'GET',
      }),
      // Không cache lâu — subtotal thay đổi khi user sửa giỏ hàng
      keepUnusedDataFor: 30,
    }),

    /**
     * PHA 2 — PREVIEW
     * POST /api/coupons/validate
     * Dùng `mutation` vì user chủ động trigger (bấm nút "Áp dụng").
     */
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
  useGetAvailableCouponsQuery,
  useValidateCouponMutation,
} = couponApi;

