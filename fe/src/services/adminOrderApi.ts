import { api } from './api';

export interface AdminOrder {
  id: string;
  number: string;
  userId: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: string;
  paymentTransactionId?: string;
  paymentProvider?: string;
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
  notes?: string;
  trackingNumber?: string;
  shippingProvider?: string;
  estimatedDelivery?: string;
  createdAt: string;
  updatedAt: string;
  // Shipping info
  shippingFirstName?: string;
  shippingLastName?: string;
  shippingEmail?: string;
  shippingPhone?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingCountry?: string;
  User: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    price: number;
    Product: {
      id: string;
      name: string;
      images: string[];
      price: number;
    };
  }>;
}

export interface AdminOrdersResponse {
  status: string;
  data: {
    orders: AdminOrder[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
}

export interface AdminOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  startDate?: string;
  endDate?: string;
}

export interface UpdateOrderStatusRequest {
  status: string;
  note?: string;
}

// Sử dụng api.injectEndpoints để thêm các endpoints vào API service chính
export const adminOrderApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get all orders for admin
    getAdminOrders: builder.query<AdminOrdersResponse, AdminOrdersParams>({
      query: (params) => ({
        url: '/admin/orders',
        params,
      }),
      providesTags: ['AdminOrder'],
    }),

    // Update order status
    updateOrderStatus: builder.mutation<
      { status: string; data: { order: AdminOrder } },
      { id: string; data: UpdateOrderStatusRequest }
    >({
      query: ({ id, data }) => ({
        url: `/admin/orders/${id}/status`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['AdminOrder'],
    }),
  }),
});

export const { useGetAdminOrdersQuery, useUpdateOrderStatusMutation } =
  adminOrderApi;
