// Order Types
import { Address } from './user.types';

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export interface OrderItem {
  id?: string;
  productId: string;
  variantId?: string;
  name: string;
  sku?: string;
  price: number;
  quantity: number;
  subtotal?: number;
  image: string;
  attributes?: Record<string, string>;
}

export interface PaymentDetails {
  transactionId: string;
  provider: string;
  amount: number;
  currency: string;
  date: string;
}

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod =
  | 'credit_card'
  | 'paypal'
  | 'bank_transfer'
  | 'cash_on_delivery';

export interface Order {
  id: string;
  number?: string;
  userId: string;
  status: OrderStatus;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paymentDetails?: PaymentDetails;
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount?: number;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  trackingNumber?: string | null;
  estimatedDelivery?: string | null;
  shippingMethod?: string;
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OrderFilters {
  status?: OrderStatus;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CheckoutData {
  items: OrderItem[];
  shipping: Address;
  billing: Address;
  paymentMethod: PaymentMethod;
  notes?: string;
}
