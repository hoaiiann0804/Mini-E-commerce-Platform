import { api } from './api';

// Order types based on backend API
export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string;
  name: string;
  sku?: string;
  price: number;
  quantity: number;
  subtotal: number;
  image?: string;
  attributes?: Record<string, any>;
  Product?: {
    id?: string;
    name?: string;
    thumbnail?: string;
    images?: string[];
    price?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  number: string;
  userId: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingFirstName: string;
  shippingLastName: string;
  shippingCompany?: string;
  shippingAddress1: string;
  shippingAddress2?: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  shippingCountry: string;
  shippingPhone?: string;
  billingFirstName: string;
  billingLastName: string;
  billingCompany?: string;
  billingAddress1: string;
  billingAddress2?: string;
  billingCity: string;
  billingState: string;
  billingZip: string;
  billingCountry: string;
  billingPhone?: string;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
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
  items?: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrdersResponse {
  status: string;
  data: {
    total: number;
    pages: number;
    currentPage: number;
    orders: Order[];
  };
}

export interface CreateOrderRequest {
  shippingFirstName: string;
  shippingLastName: string;
  shippingCompany?: string;
  shippingAddress1: string;
  shippingAddress2?: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  shippingCountry: string;
  shippingPhone?: string;
  billingFirstName: string;
  billingLastName: string;
  billingCompany?: string;
  billingAddress1: string;
  billingAddress2?: string;
  billingCity: string;
  billingState: string;
  billingZip: string;
  billingCountry: string;
  billingPhone?: string;
  paymentMethod: string;
  notes?: string;
}

export interface CreateOrderResponse {
  status: string;
  data: {
    order: {
      id: string;
      number: string;
      status: string;
      total: number;
      createdAt: string;
    };
  };
}

export const orderApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get user orders with pagination
    getUserOrders: builder.query<
      OrdersResponse,
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 10 } = {}) => ({
        url: '/orders',
        method: 'GET',
        params: { page, limit },
      }),
      providesTags: (result) =>
        result?.data.orders
          ? [
              ...result.data.orders.map(({ id }) => ({
                type: 'Order' as const,
                id,
              })),
              { type: 'Order', id: 'LIST' },
            ]
          : [{ type: 'Order', id: 'LIST' }],
    }),

    // Get order by ID
    getOrderById: builder.query<{ status: string; data: Order }, string>({
      query: (id) => ({
        url: `/orders/${id}`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Order', id }],
    }),

    // Get order by number
    getOrderByNumber: builder.query<{ status: string; data: Order }, string>({
      query: (number) => ({
        url: `/orders/number/${number}`,
        method: 'GET',
      }),
      providesTags: (result, error, number) => [{ type: 'Order', id: number }],
    }),

    // Create order
    createOrder: builder.mutation<CreateOrderResponse, CreateOrderRequest>({
      query: (orderData) => ({
        url: '/orders',
        method: 'POST',
        body: orderData,
      }),
      invalidatesTags: [
        { type: 'Order', id: 'LIST' },
        { type: 'Cart', id: 'LIST' },
      ],
    }),

    // Cancel order
    cancelOrder: builder.mutation<
      { status: string; message: string; data: any },
      string
    >({
      query: (id) => ({
        url: `/orders/${id}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Order', id },
        { type: 'Order', id: 'LIST' },
      ],
    }),

    // Repay order
    repayOrder: builder.mutation<
      { status: string; message: string; data: any },
      string
    >({
      query: (id) => ({
        url: `/orders/${id}/repay`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Order', id },
        { type: 'Order', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetUserOrdersQuery,
  useGetOrderByIdQuery,
  useGetOrderByNumberQuery,
  useCreateOrderMutation,
  useCancelOrderMutation,
  useRepayOrderMutation,
} = orderApi;
