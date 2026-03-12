import { useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { RootState } from "@/store";
import { Rnd } from "react-rnd";

// Components
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import ChatSuggestions from "./ChatSuggestions";
import ChatProductList from "./ChatProductList";
import ChatToggleButton from "./ChatToggleButton";
import ChatHeaderContent from "./ChatHeaderContent";
import ChatQuickActions from "./ChatQuickActions";
import ChatEmptyState from "./ChatEmptyState";
import ChatResizeIndicator from "./ChatResizeIndicator";

// Services & API
import {
  useSendChatbotMessageMutation,
  useTrackChatbotAnalyticsMutation,
  ChatbotResponse,
  ProductRecommendation,
} from "../services/chatbotApi";

// Hooks & Constants
import { useChatWidget } from "../hooks/useChatWidget";
import {
  CHAT_WIDGET_CONFIG,
  RESIZE_HANDLE_STYLES,
  RESIZE_HANDLE_CLASSES,
} from "../constants/chatWidget";

// Styles
import "./ChatWidget.css";

export interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  isLoading?: boolean;
  suggestions?: string[];
  products?: ProductRecommendation[];
  actions?: Array<{
    type: string;
    label: string;
    url?: string;
    data?: Record<string, any>;
  }>;
}

const ChatWidget: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useSelector((state: RootState) => state.auth);

  // Custom hook for chat widget state management
  const {
    isOpen,
    position,
    size,
    messages,
    messagesEndRef,
    chatWidgetRef,
    chatWidgetDomRef,
    toggleChat,
    closeChat,
    addMessage,
    removeMessage,
    applyChanges,
    setSize,
  } = useChatWidget();

  // API hooks
  const [sendMessage, { isLoading }] = useSendChatbotMessageMutation();
  const [trackAnalytics] = useTrackChatbotAnalyticsMutation();

  // Session ID
  const [sessionId] = useState(
    () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  );

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: "user",
    };

    addMessage(userMessage);

    // Add loading message
    const loadingId = (Date.now() + 1).toString();
    addMessage({
      id: loadingId,
      text: "",
      sender: "ai",
      isLoading: true,
    });

    try {
      console.log("Sending message to AI:", text);

      // Track analytics
      await trackAnalytics({
        event: "message_sent",
        userId: user?.id,
        sessionId,
        metadata: { message: text },
      });

      // Get current page context for better responses
      const context = {
        currentUrl: window.location.href,
        currentPage: window.location.pathname,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      };

      // Call enhanced chatbot API
      const apiResponse = await sendMessage({
        message: text,
        userId: user?.id,
        sessionId,
        context,
      }).unwrap();

      console.log("Received AI response:", apiResponse);

      // Handle different response structures
      let response: ChatbotResponse;
      if (
        (apiResponse as any).status === "success" &&
        (apiResponse as any).data
      ) {
        // New API structure
        const newApiResponse = apiResponse as any;
        response = {
          response: newApiResponse.data.response,
          suggestions: newApiResponse.data.suggestions,
          products: newApiResponse.data.products,
          actions: newApiResponse.data.actions,
          sessionId: newApiResponse.data.sessionId,
        };
      } else {
        // Legacy structure
        response = apiResponse as any as ChatbotResponse;
      }

      // Remove loading message and add AI response
      removeMessage(loadingId);
      addMessage({
        id: (Date.now() + 2).toString(),
        text: response.response,
        sender: "ai",
        suggestions: response.suggestions,
        products: response.products,
        actions: response.actions,
      });
    } catch (error: any) {
      console.error("Error sending message:", error);

      // Determine appropriate error message
      let errorMessage = t("chat.errors.general");

      if (error.message === "Request timeout") {
        errorMessage = t("chat.errors.timeout");
      } else if (error.status === 404) {
        errorMessage = t("chat.errors.notFound");
      } else if (error.status === 429) {
        errorMessage = t("chat.errors.tooManyRequests");
      } else if (error.status >= 500) {
        errorMessage = t("chat.errors.serverError");
      }

      // Remove loading message and add error message
      removeMessage(loadingId);
      addMessage({
        id: (Date.now() + 2).toString(),
        text: errorMessage,
        sender: "ai" as const,
        suggestions: [
          t("chat.suggestions.tryAgain"),
          t("chat.suggestions.findProducts"),
          t("chat.suggestions.contactSupport"),
        ],
      });
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  // Handle resize with react-rnd
  const handleResize = (
    e: MouseEvent | TouchEvent,
    direction: any,
    ref: HTMLElement,
    delta: any,
    position: any
  ) => {
    // Add resize-feedback class for visual feedback
    ref.classList.add("resize-feedback");

    // Remove the class after animation completes
    setTimeout(() => {
      ref.classList.remove("resize-feedback");
    }, CHAT_WIDGET_CONFIG.ANIMATION_DURATION.RESIZE);
  };

  // Handle resize stop to save final dimensions
  const handleResizeStop = (
    e: MouseEvent | TouchEvent,
    direction: any,
    ref: HTMLElement,
    delta: any,
    position: any
  ) => {
    setSize({
      width: ref.offsetWidth,
      height: ref.offsetHeight,
    });
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 select-none">
      {/* Chat toggle button */}
      <ChatToggleButton isOpen={isOpen} onClick={toggleChat} />

      {/* Overlay to prevent clicks outside from closing the chat */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-transparent z-40"
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
      )}

      {/* Chat widget with react-rnd - drag disabled, only resize enabled */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-24 z-50 w-[500px] h-[700px]"
          onClick={(e) => {
            e.stopPropagation();
          }}
          ref={chatWidgetDomRef}
        >
          <Rnd
            ref={chatWidgetRef}
            size={{ width: size.width, height: size.height }}
            position={position}
            minWidth={CHAT_WIDGET_CONFIG.MIN_SIZE.width}
            minHeight={CHAT_WIDGET_CONFIG.MIN_SIZE.height}
            maxWidth={CHAT_WIDGET_CONFIG.MAX_SIZE.width}
            maxHeight={CHAT_WIDGET_CONFIG.MAX_SIZE.height}
            disableDragging={true}
            enableUserSelectHack={false}
            bounds="window"
            onResize={handleResize}
            onResizeStop={handleResizeStop}
            className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-neutral-200/50 dark:border-neutral-700/50 transform animate-in slide-in-from-bottom-4 duration-500 transition-all chat-widget-resize-transition chat-widget-active"
            resizeHandleStyles={RESIZE_HANDLE_STYLES}
            resizeHandleClasses={RESIZE_HANDLE_CLASSES}
          >
            {/* Chat header */}
            <ChatHeaderContent
              onApplyChanges={applyChanges}
              onClose={closeChat}
            />

            {/* Chat messages */}
            <div className="chat-messages flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gradient-to-b from-neutral-50/80 via-white/50 to-neutral-50/80 dark:from-neutral-800/80 dark:via-neutral-900/50 dark:to-neutral-800/80 min-h-[300px] max-h-[50vh] sm:max-h-[400px]">
              {messages.length === 0 && <ChatEmptyState />}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className="animate-in slide-in-from-bottom-2 duration-500"
                >
                  <ChatMessage message={message} />
                  {message.sender === "ai" && (
                    <>
                      {/* Show products if available */}
                      {message.products && message.products.length > 0 && (
                        <div className="ml-12 mt-4 mb-2">
                          <ChatProductList
                            products={message.products}
                            sessionId={sessionId}
                            title="🛍️ Sản phẩm gợi ý cho bạn"
                          />
                        </div>
                      )}

                      {/* Show suggestions if available */}
                      {message.suggestions &&
                        message.suggestions.length > 0 && (
                          <div className="ml-12 mt-4 mb-2">
                            <ChatSuggestions
                              suggestions={message.suggestions}
                              onSuggestionClick={handleSuggestionClick}
                            />
                          </div>
                        )}
                    </>
                  )}
                </div>
              ))}

              <div ref={messagesEndRef} />
            </div>

            {/* Chat input */}
            <div className="border-t border-neutral-200/60 dark:border-neutral-700/60 bg-gradient-to-r from-white via-neutral-50/50 to-white dark:from-neutral-900 dark:via-neutral-800/50 dark:to-neutral-900 p-4 sm:p-5 backdrop-blur-sm">
              <ChatInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
              />

              {/* Quick actions */}
              <ChatQuickActions onSendMessage={handleSendMessage} />
            </div>

            {/* Resize indicator with tooltip */}
            <ChatResizeIndicator />
          </Rnd>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
