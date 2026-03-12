import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import type { RootState } from '@/store';
import { Message } from '../types/Message';
import { useSendChatbotMessageMutation } from '../services/chatbotApi';
import type { ChatbotApiResponse } from '../services/chatbotApi';
import { useGetCartQuery } from '@/services/cartApi';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/store';
import { setServerCart } from '@/features/cart/cartSlice';
import type { BackendCart, BackendCartItem } from '@/services/cartApi';
import type { ServerCart } from '@/types/cart.types';
import { geminiService } from '../services/geminiService';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
// Import trực tiếp từ file icon
import ChatIcon from './icons/ChatIcon';
import CloseIcon from './icons/CloseIcon';
import './ChatWidget.css';

/**
 * Component ChatWidget không sử dụng Portal để tránh các vấn đề về vị trí
 * Thiết kế theo tiêu chuẩn senior developer với clean code
 */
const ChatWidgetPortal: React.FC = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth
  );

  // Hooks
  const dispatch = useDispatch<AppDispatch>();
  const [sendChatbotMessage, { isLoading }] = useSendChatbotMessageMutation();
  const { refetch: refetchCart } = useGetCartQuery(undefined, {
    skip: !isAuthenticated, // Only fetch cart if user is authenticated
  });

  // Tạo session ID cho chat
  const [sessionId] = useState<string>(
    () => `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  );

  // Hiển thị tin nhắn chào mừng khi mở chatbot
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greetingText =
        isAuthenticated && user
          ? t('chat.greetingWithName', { name: user.name }) ||
          `Chào ${user.name}! Tôi là trợ lý AI của Shopmini! 😊 Tôi có thể giúp bạn tìm sản phẩm, xem khuyến mãi và hỗ trợ mua hàng. Bạn cần gì nhỉ?`
          : t('chat.greeting') ||
          'Chào bạn! Tôi là trợ lý AI của Shopmini! 😊 Tôi có thể giúp bạn tìm sản phẩm, xem khuyến mãi và hỗ trợ mua hàng. Bạn cần gì nhỉ?';

      const greeting = {
        id: Date.now().toString(),
        text: greetingText,
        sender: 'ai' as const,
        suggestions: [
          t('chat.suggestions.findProducts') || 'Tìm sản phẩm hot 🔥',
          t('chat.suggestions.viewPromotions') || 'Xem khuyến mãi 🎉',
          t('chat.suggestions.howToOrder') || 'Hướng dẫn mua hàng',
          t('chat.suggestions.returnPolicy') || 'Chính sách đổi trả',
        ],
      };
      setMessages([greeting]);
    }
  }, [isOpen, messages.length, isAuthenticated, user, t]);

  // Cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Thêm class vào body khi chatbot mở
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('chat-widget-open');
    } else {
      document.body.classList.remove('chat-widget-open');
    }

    return () => {
      document.body.classList.remove('chat-widget-open');
    };
  }, [isOpen]);

  // Xử lý gửi tin nhắn
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Thêm tin nhắn của người dùng
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
    };

    setMessages((prev) => [...prev, userMessage]);

    // Thêm tin nhắn "đang nhập" tạm thời - chỉ hiển thị một dấu ba chấm
    const loadingId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      {
        id: loadingId,
        text: '',
        sender: 'ai',
        isLoading: true,
      },
    ]);

    try {
      console.log('Sending message to AI:', text);

      // Thêm timeout để tránh treo UI nếu API quá chậm
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000);
      });

      // Call API với timeout và xử lý lỗi
      const apiResponse = await Promise.race([
        sendChatbotMessage({
          message: text,
          userId: user?.id,
          sessionId: sessionId,
          context: {
            isAuthenticated,
            currentPage: window.location.pathname,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
          },
        }).unwrap(),
        timeoutPromise,
      ]);

      const response = apiResponse as ChatbotApiResponse;

      console.log('Received AI response:', response);

      // Xóa tin nhắn "đang nhập" và thêm phản hồi từ API
      if (response.status === 'success' && response.data) {
        // Nếu có dữ liệu giỏ hàng mới (khi thêm sản phẩm thành công)
        if ('cart' in response.data && response.data.cart) {
          const cartData = response.data.cart as BackendCart;
          const { items, totalItems, subtotal } = cartData;

          // Tạo cấu trúc dữ liệu giỏ hàng phù hợp với Redux store
          const serverCart: ServerCart = {
            id: cartData.id || 'guest-cart',
            items: items.map((item: BackendCartItem) => ({
              id: item.id,
              cartId: cartData.id || 'guest-cart',
              productId: item.productId,
              variantId: item.variantId || undefined,
              quantity: item.quantity,
              price: item.ProductVariant?.price || item.Product?.price || 0,
              Product: {
                id: item.productId,
                name: item.Product?.name || 'Unknown Product',
                slug: item.Product?.slug || '',
                price: item.Product?.price || 0,
                thumbnail: item.Product?.thumbnail || '',
                inStock: item.Product?.inStock || false,
                stockQuantity: item.Product?.stockQuantity || 0,
              },
              ProductVariant: item.ProductVariant ? {
                id: item.ProductVariant.id,
                name: item.ProductVariant.name,
                price: item.ProductVariant.price,
                stockQuantity: item.ProductVariant.stockQuantity,
              } : undefined,
            })),
            totalItems,
            subtotal,
          };

          // Cập nhật Redux store
          dispatch(setServerCart(serverCart));

          // Đồng bộ với server nếu cần
          if (isAuthenticated) {
            await refetchCart();
          }
        }

        setMessages((prev) => {
          const filtered = prev.filter((msg) => msg.id !== loadingId);
          return [
            ...filtered,
            {
              id: (Date.now() + 2).toString(),
              text: response.data?.response || '',
              sender: 'ai' as const,
              suggestions: response.data?.suggestions || [
                t('chat.suggestions.findProducts') || 'Tìm thêm sản phẩm',
                t('chat.suggestions.viewCart') || 'Xem giỏ hàng',
                t('chat.suggestions.askMore') || 'Hỏi thêm',
              ],
              products: response.data?.products,
              actions: response.data?.actions,
            },
          ];
        });
      } else {
        throw new Error(response.message || 'Lỗi không xác định');
      }
    } catch (error: unknown) {
      console.error('Error generating AI response:', error);

      // Xác định thông báo lỗi phù hợp
      let errorMessage =
        t('chat.errors.general') ||
        'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.';

      // Type guard for error handling
      const err = error as { message?: string; status?: number };
      
      if (err.message === 'Request timeout') {
        errorMessage =
          t('chat.errors.timeout') ||
          'Yêu cầu đã hết thời gian chờ. Vui lòng thử lại.';
      } else if (err.status === 404) {
        errorMessage =
          t('chat.errors.notFound') ||
          'Không tìm thấy dịch vụ AI. Vui lòng thử lại sau.';
      } else if (err.status === 429) {
        errorMessage =
          t('chat.errors.tooManyRequests') ||
          'Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.';
      } else if (err.status && err.status >= 500) {
        errorMessage =
          t('chat.errors.serverError') || 'Lỗi máy chủ. Vui lòng thử lại sau.';
      }

      // Xóa tin nhắn "đang nhập" và thêm thông báo lỗi
      setMessages((prev) => {
        const filtered = prev.filter((msg) => msg.id !== loadingId);
        return [
          ...filtered,
          {
            id: (Date.now() + 2).toString(),
            text: errorMessage,
            sender: 'ai',
            suggestions: [
              t('chat.suggestions.tryAgain') || 'Thử lại',
              t('chat.suggestions.findProducts') || 'Tìm sản phẩm',
              t('chat.suggestions.contactSupport') || 'Liên hệ hỗ trợ',
            ],
          },
        ];
      });
    }
  };

  // Xử lý khi người dùng nhấn vào gợi ý
  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  // Xóa tất cả tin nhắn
  const handleClearChat = () => {
    setMessages([]);
  };

  // Mở/đóng chatbot
  const toggleChat = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 select-none">
      {/* Chat toggle button - Thiết kế hiện đại hơn */}
      <button
        onClick={toggleChat}
        className="group relative bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 hover:from-primary-600 hover:via-primary-700 hover:to-primary-800 text-white rounded-full p-4 shadow-[0_8px_25px_rgba(59,130,246,0.35)] hover:shadow-[0_12px_30px_rgba(59,130,246,0.45)] transform hover:scale-110 transition-all duration-300 flex items-center justify-center ring-4 ring-primary-500/20 hover:ring-primary-500/40"
        aria-label={isOpen ? t('chat.closeChat') : t('chat.openChat')}
      >
        {/* Pulse animation when closed - Hiệu ứng mượt mà hơn */}
        {!isOpen && (
          <>
            <div
              className="absolute inset-0 rounded-full bg-primary-400 animate-ping opacity-25"
              style={{ animationDuration: '2s' }}
            ></div>
            <div
              className="absolute inset-0 rounded-full bg-primary-300 animate-ping opacity-15 animation-delay-75"
              style={{ animationDuration: '2.5s' }}
            ></div>
          </>
        )}

        {/* AI Status indicator - Thiết kế đẹp hơn */}
        <div
          className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white shadow-lg ${geminiService.isReady()
              ? 'bg-gradient-to-r from-green-400 to-green-500'
              : 'bg-gradient-to-r from-yellow-400 to-orange-500'
            }`}
        >
          <div
            className={`absolute inset-0.5 rounded-full ${geminiService.isReady()
                ? 'bg-green-300 animate-pulse'
                : 'bg-yellow-300 animate-pulse'
              }`}
            style={{ animationDuration: '1.5s' }}
          ></div>
        </div>

        {isOpen ? (
          <CloseIcon className="h-7 w-7 transform transition-transform duration-300 rotate-0 hover:rotate-90" />
        ) : (
          <div className="relative">
            <ChatIcon className="transform transition-transform duration-300 group-hover:scale-110" />
            {/* Đã loại bỏ AI sparkle effect */}
          </div>
        )}
      </button>

      {/* Chat widget */}
      {isOpen && (
        <>
          {/* Overlay để ngăn chặn các sự kiện click bên ngoài */}
          <div
            className="fixed inset-0 bg-black/5 z-[9998]"
            onClick={(e) => {
              // Chỉ đóng chat khi click trực tiếp vào overlay
              if (e.target === e.currentTarget) {
                toggleChat();
              }
            }}
          />

          {/* Container chatbot - Modern design với hiệu ứng glassmorphism */}
          <div
            ref={chatContainerRef}
            className="fixed inset-x-4 bottom-20 sm:absolute sm:bottom-20 sm:right-0 sm:inset-x-auto w-auto sm:w-96 md:max-w-md lg:max-w-lg xl:max-w-xl bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col border border-white/20 dark:border-neutral-700/30 transform animate-in slide-in-from-bottom-4 duration-500 max-h-[85vh] sm:max-h-[75vh] md:max-h-[70vh] chat-widget-active z-[9999] hover:shadow-[0_10px_40px_rgba(0,0,0,0.18)] transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Chat header */}
            <ChatHeader onClose={toggleChat} geminiService={geminiService} />

            {/* Chat messages */}
            <ChatMessages
              messages={messages}
              onSuggestionClick={handleSuggestionClick}
              messagesEndRef={messagesEndRef}
              user={user}
            />

            {/* Chat input */}
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              onClearChat={handleClearChat}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ChatWidgetPortal;
