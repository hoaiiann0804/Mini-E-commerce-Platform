import { api } from './api';

export interface CreatePaymentIntentRequest {
  orderId: string;
}

export interface CreatePaymentIntentResponse {
  status: string;
  data: {
    clientSecret: string;
    paymentIntentId: string;
    amount: number;
    currency: string;
    exchangeRate: number | null;
    rateUpdatedAt: string | null;
  };
}

export interface ConfirmPaymentRequest {
  paymentIntentId: string;
}

export interface ConfirmPaymentResponse {
  status: string;
  data: {
    paymentIntent: {
      id: string;
      status: string;
      amount: number;
      currency: string;
    };
  };
}

export interface CreateCustomerResponse {
  status: string;
  data: {
    customer: {
      id: string;
      email: string;
      name: string;
    };
  };
}

export interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

export interface GetPaymentMethodsResponse {
  status: string;
  data: {
    paymentMethods: PaymentMethod[];
  };
}

export interface CreateSetupIntentResponse {
  status: string;
  data: {
    clientSecret: string;
    setupIntentId: string;
  };
}

export const stripeApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Create payment intent
    createPaymentIntent: builder.mutation<
      CreatePaymentIntentResponse,
      CreatePaymentIntentRequest
    >({
      query: (data) => ({
        url: '/payment/create-payment-intent',
        method: 'POST',
        body: data,
      }),
    }),

    // Confirm payment
    confirmPayment: builder.mutation<
      ConfirmPaymentResponse,
      ConfirmPaymentRequest
    >({
      query: (data) => ({
        url: '/payment/confirm-payment',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Order', id: 'LIST' }],
    }),

    // Create customer
    createCustomer: builder.mutation<CreateCustomerResponse, void>({
      query: () => ({
        url: '/payment/create-customer',
        method: 'POST',
      }),
    }),

    // Get payment methods
    getPaymentMethods: builder.query<GetPaymentMethodsResponse, void>({
      query: () => ({
        url: '/payment/payment-methods',
        method: 'GET',
      }),
      providesTags: [{ type: 'PaymentMethod', id: 'LIST' }],
    }),

    // Create setup intent for saving payment methods
    createSetupIntent: builder.mutation<CreateSetupIntentResponse, void>({
      query: () => ({
        url: '/payment/create-setup-intent',
        method: 'POST',
      }),
    }),
  }),
});

export const {
  useCreatePaymentIntentMutation,
  useConfirmPaymentMutation,
  useCreateCustomerMutation,
  useGetPaymentMethodsQuery,
  useCreateSetupIntentMutation,
} = stripeApi;
