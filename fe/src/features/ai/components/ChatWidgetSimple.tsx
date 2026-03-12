import { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState } from '../../../store';
import { geminiService } from '../services/geminiService';
import './ChatWidget.css';

import { Message } from '../types/Message';

// Component ChatWidget đơn giản hóa
const ChatWidgetSimple: React.FC = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const {  } = useSelector(
    (state: RootState) => state.auth
  );

  // Hiển thị tin nhắn chào mừng khi mở chatbot
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greetingText =
        'Chào bạn! Tôi là trợ lý AI của Shopmini! 😊 Tôi có thể giúp bạn tìm sản phẩm, xem khuyến mãi và hỗ trợ mua hàng. Bạn cần gì nhỉ?';

      const greeting = {
        id: Date.now().toString(),
        text: greetingText,
        sender: 'ai' as const,
        suggestions: [
          'Tìm sản phẩm hot 🔥',
          'Xem khuyến mãi 🎉',
          'Sản phẩm bán chạy ⭐',
          'Hỗ trợ mua hàng 💬',
        ],
      };
      setMessages([greeting]);
    }
  }, [isOpen, messages.length]);

  // Cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Thêm class vào body và ngăn chặn các sự kiện click bên ngoài khi chatbot mở
  useEffect(() => {
    if (isOpen) {
      // Thêm class vào body
      document.body.classList.add('chat-widget-open');

      // Ngăn chặn sự kiện click bên ngoài
      const handleClickOutside = (e: Event) => {
        // Ngăn chặn tất cả các sự kiện click trên document
        e.stopPropagation();

        // Nếu click bên ngoài chatContainerRef, không làm gì cả
        if (
          chatContainerRef.current &&
          !chatContainerRef.current.contains(e.target as Node)
        ) {
          e.preventDefault();
        }
      };

      // Ngăn chặn phím Escape đóng chatbot
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          e.preventDefault();
        }
      };

      // Thêm event listener với capturing phase để bắt sự kiện sớm
      document.addEventListener('click', handleClickOutside, true);
      document.addEventListener('mousedown', handleClickOutside, true);
      document.addEventListener('touchstart', handleClickOutside, true);
      document.addEventListener('keydown', handleKeyDown, true);

      // Thêm một lớp bảo vệ khác: ngăn chặn các sự kiện scroll
      const handleScroll = (e: Event) => {
        // Cho phép scroll trong chatbot
        if (
          chatContainerRef.current &&
          chatContainerRef.current.contains(e.target as Node)
        ) {
          return;
        }
      };

      // Cleanup khi component unmount hoặc khi isOpen thay đổi
      return () => {
        document.removeEventListener('click', handleClickOutside, true);
        document.removeEventListener('mousedown', handleClickOutside, true);
        document.removeEventListener('touchstart', handleClickOutside, true);
        document.removeEventListener('keydown', handleKeyDown, true);
        document.removeEventListener('scroll', handleScroll, true);
        document.body.classList.remove('chat-widget-open');
      };
    } else {
      document.body.classList.remove('chat-widget-open');
    }
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

    // Thêm tin nhắn "đang nhập" tạm thời
    const loadingId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      {
        id: loadingId,
        text: '...',
        sender: 'ai',
      },
    ]);

    try {
      // Gọi API AI để lấy phản hồi
      const aiResponse = await geminiService.sendMessage(text);
      const response = aiResponse.text;

      // Xóa tin nhắn "đang nhập" và thêm phản hồi từ AI
      setMessages((prev) => {
        const filtered = prev.filter((msg) => msg.id !== loadingId);
        return [
          ...filtered,
          {
            id: (Date.now() + 2).toString(),
            text: response,
            sender: 'ai' as const,
            suggestions: aiResponse.suggestions || ['Tìm thêm sản phẩm', 'Xem giỏ hàng', 'Hỏi thêm'],
          },
        ];
      });
    } catch (error: unknown) {
      console.error('Error generating AI response:', error);

      // Xử lý lỗi
      let errorMessage = 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.';

      // Xóa tin nhắn "đang nhập" và thêm thông báo lỗi
      setMessages((prev) => {
        const filtered = prev.filter((msg) => msg.id !== loadingId);
        return [
          ...filtered,
          {
            id: (Date.now() + 2).toString(),
            text: errorMessage,
            sender: 'ai',
            suggestions: ['Thử lại', 'Tìm sản phẩm', 'Liên hệ hỗ trợ'],
          },
        ];
      });
    }
  };

  // Xử lý khi người dùng nhấn vào gợi ý
  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  // Mở chatbot
  const openChat = () => {
    setIsOpen(true);
  };

  // Đóng chatbot
  const closeChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // Xóa tất cả các event listener trước khi đóng chatbot
    const cleanupEvents = () => {
      const handleClickOutside = () => {};
      const handleKeyDown = () => {};
      const handleScroll = () => {};

      document.removeEventListener('click', handleClickOutside, true);
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('scroll', handleScroll, true);
      document.body.classList.remove('chat-widget-open');
    };

    cleanupEvents();
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 select-none">
      {/* Nút mở chatbot */}
      {!isOpen && (
        <button
          onClick={openChat}
          className="chat-toggle-button group relative bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 hover:from-primary-600 hover:via-primary-700 hover:to-primary-800 text-white rounded-full p-4 shadow-2xl hover:shadow-primary-500/25 transform hover:scale-110 transition-all duration-300 flex items-center justify-center ring-4 ring-primary-500/20 hover:ring-primary-500/40"
          aria-label={t('chat.openChat')}
        >
          {/* Hiệu ứng nhấp nháy */}
          <div className="absolute inset-0 rounded-full bg-primary-400 animate-ping opacity-30"></div>
          <div className="absolute inset-0 rounded-full bg-primary-300 animate-ping opacity-20 animation-delay-75"></div>

          {/* Chỉ báo trạng thái AI */}
          <div
            className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-3 border-white shadow-lg ${
              geminiService.isReady()
                ? 'bg-gradient-to-r from-green-400 to-green-500'
                : 'bg-gradient-to-r from-yellow-400 to-orange-500'
            }`}
          >
            <div
              className={`absolute inset-1 rounded-full ${
                geminiService.isReady()
                  ? 'bg-green-300 animate-pulse'
                  : 'bg-yellow-300 animate-pulse'
              }`}
            ></div>
          </div>

          {/* Biểu tượng chat */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </button>
      )}

      {/* Chatbot mở */}
      {isOpen && (
        <>
          {/* Overlay để ngăn chặn các sự kiện click bên ngoài */}
          <div
            className="fixed inset-0 bg-black/5 z-40"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          />

          {/* Container chatbot */}
          <div
            ref={chatContainerRef}
            className="fixed bottom-24 right-24 z-50 w-[400px] h-[600px] bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-neutral-200/50 dark:border-neutral-700/50 transform animate-in slide-in-from-bottom-4 duration-500 transition-all chat-widget-active"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Trợ lý AI</h3>
                    <p className="text-xs text-white/80">
                      Hỗ trợ trực tuyến 24/7
                    </p>
                  </div>
                </div>

                {/* Nút đóng */}
                <button
                  onClick={closeChat}
                  className="chat-close-button w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:scale-110"
                  title={t('chat.close')}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Thông tin trạng thái AI */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {geminiService.isReady() ? (
                    <>
                      <div className="flex items-center space-x-2 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
                        <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                        <span className="text-xs font-semibold">Gemini AI</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center space-x-2 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
                        <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full animate-pulse shadow-lg"></div>
                        <span className="text-xs font-semibold">
                          Đang kết nối...
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Phần tin nhắn */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-messages">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 chat-bubble ${
                      message.sender === 'user'
                        ? 'bg-primary-500 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                    }`}
                  >
                    {message.text === '...' ? (
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    ) : (
                      <>
                        <p className="whitespace-pre-wrap">{message.text}</p>
                        {message.suggestions &&
                          message.suggestions.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {message.suggestions.map((suggestion, index) => (
                                <button
                                  key={index}
                                  onClick={() =>
                                    handleSuggestionClick(suggestion)
                                  }
                                  className="text-xs bg-white/20 hover:bg-white/30 dark:bg-neutral-700 dark:hover:bg-neutral-600 rounded-full px-3 py-1 transition-all duration-200"
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          )}
                      </>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Phần nhập tin nhắn */}
            <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const input = e.currentTarget.elements.namedItem(
                    'message'
                  ) as HTMLInputElement;
                  if (input.value.trim()) {
                    handleSendMessage(input.value);
                    input.value = '';
                  }
                }}
                className="flex items-center space-x-2"
              >
                <input
                  type="text"
                  name="message"
                  placeholder="Nhập tin nhắn..."
                  className="chat-input flex-1 bg-neutral-100 dark:bg-neutral-800 border-none rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  className="chat-button bg-primary-500 hover:bg-primary-600 text-white rounded-full p-2 transition-all duration-200"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatWidgetSimple;
