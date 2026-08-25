import { Order, OrderStatus } from '@/types/order.types';

export const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    userId: 'user1',
    items: [
      {
        productId: '1',
        name: 'Premium Wireless Headphones',
        price: 129.99,
        quantity: 1,
        subtotal: 129.99,
        image: 'https://placehold.co/600x400?text=Headphones',
      },
      {
        productId: '3',
        name: 'Portable Bluetooth Speaker',
        price: 99.99,
        quantity: 1,
        subtotal: 99.99,
        image: 'https://placehold.co/600x400?text=Bluetooth+Speaker',
      },
    ],
    shippingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      address1: '123 Main St',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'US',
      phone: '555-123-4567',
    },
    billingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      address1: '123 Main St',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'US',
      phone: '555-123-4567',
    },
    paymentMethod: 'credit_card',
    shippingMethod: 'standard',
    subtotal: 229.98,
    shippingCost: 5.99,
    tax: 16.1,
    total: 252.07,
    status: OrderStatus.DELIVERED,
    createdAt: '2023-05-15T10:30:00Z',
    updatedAt: '2023-05-20T14:20:00Z',
    trackingNumber: '1Z999AA10123456784',
    estimatedDelivery: '2023-05-20T00:00:00Z',
    notes: '',
  },
  {
    id: 'ORD-002',
    userId: 'user1',
    items: [
      {
        productId: '4',
        name: 'Ultra-Slim Laptop',
        price: 899.99,
        quantity: 1,
        subtotal: 899.99,
        image: 'https://placehold.co/600x400?text=Laptop',
      },
    ],
    shippingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      address1: '123 Main St',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'US',
      phone: '555-123-4567',
    },
    billingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      address1: '123 Main St',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'US',
      phone: '555-123-4567',
    },
    paymentMethod: 'paypal',
    shippingMethod: 'express',
    subtotal: 899.99,
    shippingCost: 12.99,
    tax: 63.0,
    total: 975.98,
    status: OrderStatus.SHIPPED,
    createdAt: '2023-06-10T15:45:00Z',
    updatedAt: '2023-06-11T09:30:00Z',
    trackingNumber: '1Z999AA10123456785',
    estimatedDelivery: '2023-06-13T00:00:00Z',
    notes: 'Please leave at the front door',
  },
  {
    id: 'ORD-003',
    userId: 'user1',
    items: [
      {
        productId: '2',
        name: 'Smart Fitness Watch',
        price: 149.99,
        quantity: 1,
        subtotal: 149.99,
        image: 'https://placehold.co/600x400?text=Fitness+Watch',
      },
      {
        productId: '5',
        name: 'Wireless Charging Pad',
        price: 49.99,
        quantity: 2,
        subtotal: 99.98,
        image: 'https://placehold.co/600x400?text=Charging+Pad',
      },
    ],
    shippingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      address1: '123 Main St',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'US',
      phone: '555-123-4567',
    },
    billingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      address1: '123 Main St',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'US',
      phone: '555-123-4567',
    },
    paymentMethod: 'credit_card',
    shippingMethod: 'free',
    subtotal: 249.97,
    shippingCost: 0,
    tax: 17.5,
    total: 267.47,
    status: OrderStatus.PROCESSING,
    createdAt: '2023-06-18T11:20:00Z',
    updatedAt: '2023-06-18T11:20:00Z',
    trackingNumber: null,
    estimatedDelivery: '2023-06-25T00:00:00Z',
    notes: '',
  },
];

export const getOrdersByUserId = (userId: string): Order[] => {
  return mockOrders.filter((order) => order.userId === userId);
};

export const getOrderById = (orderId: string): Order | undefined => {
  return mockOrders.find((order) => order.id === orderId);
};

export const createOrder = (
  order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>
): Order => {
  const newOrder: Order = {
    ...order,
    id: `ORD-${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0')}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockOrders.unshift(newOrder);
  return newOrder;
};
