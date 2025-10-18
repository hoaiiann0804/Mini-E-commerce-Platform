import { api } from './api';

export interface ChatbotMessage {
  message: string;
  userId?: string;
  sessionId?: string;
  context?: Record<string, any>;
}

export interface ChatbotResponse {
  status: string;
  data: {
    response: string;
    products?: Array<{
      id: string;
      name: string;
      price: number;
      compareAtPrice?: number;
      thumbnail?: string;
      inStock: boolean;
      rating?: number;
    }>;
    suggestions?: string[];
    intent?: string;
    actions?: Array<{
      type: string;
      label: string;
      url?: string;
    }>;
  };
}

export interface AddToCartRequest {
  productId: string;
  variantId?: string;
  quantity?: number;
  sessionId?: string;
}

export interface AddToCartResponse {
  status: string;
  message: string;
  data: {
    cartItem: any;
  };
}

export const chatbotApi = {
  /**
   * Gửi tin nhắn đến chatbot
   */
  async sendMessage(data: ChatbotMessage): Promise<ChatbotResponse> {
    const response = await fetch('/api/chatbot/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to send message to chatbot');
    }

    return response.json();
  },

  /**
   * Thêm sản phẩm vào giỏ hàng qua chatbot
   */
  async addToCart(data: AddToCartRequest): Promise<AddToCartResponse> {
    const response = await fetch('/api/chatbot/cart/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to add product to cart');
    }

    return response.json();
  },

  /**
   * Tìm kiếm sản phẩm qua AI
   */
  async searchProducts(query: string, userId?: string, limit = 10) {
    const response = await fetch('/api/chatbot/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ query, userId, limit }),
    });

    if (!response.ok) {
      throw new Error('Failed to search products');
    }

    return response.json();
  },

  /**
   * Lấy gợi ý sản phẩm cá nhân hóa
   */
  async getRecommendations(userId?: string, limit = 5, type = 'personal') {
    const params = new URLSearchParams({
      limit: limit.toString(),
      type,
    });
    
    if (userId) {
      params.append('userId', userId);
    }

    const response = await fetch(`/api/chatbot/recommendations?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get recommendations');
    }

    return response.json();
  },

  /**
   * Track analytics cho chatbot
   */
  async trackAnalytics(event: string, userId?: string, sessionId?: string, productId?: string, value?: any, metadata?: Record<string, any>) {
    const response = await fetch('/api/chatbot/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        event,
        userId,
        sessionId,
        productId,
        value,
        metadata,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to track analytics');
    }

    return response.json();
  },
};
