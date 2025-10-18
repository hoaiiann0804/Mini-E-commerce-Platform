import React, { useState } from 'react';
import { chatbotApi } from '../services/chatbotApi';

interface Product {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  thumbnail?: string;
  inStock: boolean;
  rating?: number;
}

const ChatbotExample: React.FC = () => {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [cartMessage, setCartMessage] = useState('');

  // Gửi tin nhắn đến chatbot
  const handleSendMessage = async () => {
    if (!message.trim()) return;

    setLoading(true);
    try {
      const result = await chatbotApi.sendMessage({
        message,
        userId: 'user123', // Thay bằng ID user thực tế
        sessionId: 'session456', // Thay bằng session ID thực tế
        context: {
          currentPage: 'product-list',
          userPreferences: ['nike', 'thể thao'],
        },
      });

      setResponse(result.data);
    } catch (error) {
      console.error('Error sending message:', error);
      setResponse({
        response: 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.',
        suggestions: ['Tìm sản phẩm khác', 'Liên hệ hỗ trợ'],
      });
    } finally {
      setLoading(false);
    }
  };

  // Thêm sản phẩm vào giỏ hàng
  const handleAddToCart = async (product: Product) => {
    try {
      const result = await chatbotApi.addToCart({
        productId: product.id,
        quantity: 1,
        sessionId: 'session456',
      });

      setCartMessage(`✅ Đã thêm "${product.name}" vào giỏ hàng!`);
      
      // Track analytics
      await chatbotApi.trackAnalytics(
        'product_added_to_cart',
        'user123',
        'session456',
        product.id,
        product.price,
        { source: 'chatbot', productName: product.name }
      );

      // Clear message after 3 seconds
      setTimeout(() => setCartMessage(''), 3000);
    } catch (error) {
      console.error('Error adding to cart:', error);
      setCartMessage('❌ Không thể thêm vào giỏ hàng. Vui lòng thử lại.');
      setTimeout(() => setCartMessage(''), 3000);
    }
  };

  // Xử lý gợi ý từ chatbot
  const handleSuggestion = (suggestion: string) => {
    setMessage(suggestion);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">🤖 Chatbot Demo</h1>
      
      {/* Chat Input */}
      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Nhập tin nhắn cho chatbot..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button
            onClick={handleSendMessage}
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Đang gửi...' : 'Gửi'}
          </button>
        </div>
      </div>

      {/* Cart Message */}
      {cartMessage && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {cartMessage}
        </div>
      )}

      {/* Chatbot Response */}
      {response && (
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h3 className="font-semibold mb-3">🤖 Chatbot Response:</h3>
          <p className="mb-4">{response.response}</p>

          {/* Products */}
          {response.products && response.products.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold mb-2">📦 Sản phẩm gợi ý:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {response.products.map((product: Product) => (
                  <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                    {product.thumbnail && (
                      <img
                        src={product.thumbnail}
                        alt={product.name}
                        className="w-full h-32 object-cover rounded mb-2"
                      />
                    )}
                    <h5 className="font-medium text-sm mb-1">{product.name}</h5>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-red-600 font-bold">
                        {product.price.toLocaleString('vi-VN')}đ
                      </span>
                      {product.compareAtPrice && (
                        <span className="text-gray-500 line-through text-sm">
                          {product.compareAtPrice.toLocaleString('vi-VN')}đ
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="w-full px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                    >
                      🛒 Thêm vào giỏ
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {response.suggestions && response.suggestions.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold mb-2">💡 Gợi ý:</h4>
              <div className="flex flex-wrap gap-2">
                {response.suggestions.map((suggestion: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestion(suggestion)}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {response.actions && response.actions.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">⚡ Hành động:</h4>
              <div className="flex flex-wrap gap-2">
                {response.actions.map((action: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (action.url) {
                        window.open(action.url, '_blank');
                      }
                    }}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Example Messages */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">💬 Thử các câu hỏi này:</h4>
        <div className="flex flex-wrap gap-2">
          {[
            'Tôi muốn mua áo Nike',
            'Tìm giày thể thao giá dưới 2 triệu',
            'Balo nào đang có khuyến mãi?',
            'Gợi ý sản phẩm hot nhất',
            'Thêm áo thun Nike vào giỏ hàng',
          ].map((example, index) => (
            <button
              key={index}
              onClick={() => setMessage(example)}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatbotExample;
