import { api } from "@/services/api";
import i18n from "@/config/i18n";
import { geminiService } from "./geminiService";
import {
  getProductSuggestionPrompt,
  getGeneralHelpPrompt,
} from "./promptTemplates";

export interface ChatResponse {
  text: string;
  suggestions?: string[];
}

// Simple intent detection
function determineIntent(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("tìm") ||
    lowerMessage.includes("kiếm") ||
    lowerMessage.includes("mua") ||
    lowerMessage.includes("sản phẩm") ||
    lowerMessage.includes("hàng")
  ) {
    return "product_search";
  }

  if (
    lowerMessage.includes("đơn hàng") ||
    lowerMessage.includes("đặt hàng") ||
    lowerMessage.includes("mua hàng") ||
    lowerMessage.includes("thanh toán")
  ) {
    return "order_help";
  }

  if (
    lowerMessage.includes("trả lại") ||
    lowerMessage.includes("đổi") ||
    lowerMessage.includes("hoàn tiền") ||
    lowerMessage.includes("bảo hành")
  ) {
    return "return_policy";
  }

  return "general";
}

// Mock chat service - không cần backend API
const enhancedChatService = {
  async sendMessage(message: string): Promise<ChatResponse> {
    //console.log('Processing message with enhanced chat service:', message);

    // Kiểm tra xem Gemini AI có sẵn sàng không
    const geminiStatus = geminiService.getStatus();
    //console.log('Gemini AI status:', geminiStatus);

    if (geminiStatus.ready && geminiStatus.hasApiKey) {
      try {
        //console.log('Using Gemini AI for response...');
        const geminiResponse = await geminiService.sendMessage(message);

        return {
          text: geminiResponse.text,
          suggestions: geminiResponse.suggestions,
        };
      } catch (error: any) {
        console.error("Gemini AI error, falling back to mock:", error);

        // Nếu lỗi API key hoặc quota, thông báo cho user
        if (
          error.message?.includes("API key") ||
          error.message?.includes("quota")
        ) {
          return {
            text: `⚠️ ${error.message}\n\nTôi đang chuyển sang chế độ demo. Bạn vẫn có thể chat với tôi nhưng sẽ nhận được phản hồi mẫu.`,
            suggestions: [
              "Tiếp tục với chế độ demo",
              "Tìm sản phẩm",
              "Hỏi về chính sách",
              "Liên hệ hỗ trợ",
            ],
          };
        }

        // Fallback to mock service for other errors
        return this.getMockResponse(message);
      }
    } else {
      //console.log('Gemini AI not ready, using mock response...');

      if (!geminiStatus.hasApiKey) {
        //console.log('No Gemini API key configured, using demo mode');
      }

      return this.getMockResponse(message);
    }
  },

  getMockResponse(message: string): ChatResponse {
    //console.log('Using mock response for message:', message);

    // Thêm delay để mô phỏng thời gian xử lý thực tế
    // await new Promise((resolve) =>
    //   setTimeout(resolve, 1000 + Math.random() * 1000)
    // );

    // Mock response based on message content
    const intent = determineIntent(message);
    let mockResponse: ChatResponse;

    switch (intent) {
      case "product_search":
        mockResponse = {
          text: i18n.t("chat.responses.productSearch", { query: message }),
          suggestions: [
            "Xem áo thun",
            "Xem quần jean",
            "Xem giày sneaker",
            "Tìm sản phẩm khác",
          ],
        };
        break;
      case "order_help":
        mockResponse = {
          text: i18n.t("chat.responses.orderHelp"),
          suggestions: [
            "Phương thức thanh toán",
            "Phí vận chuyển",
            "Thời gian giao hàng",
            "Mã giảm giá",
          ],
        };
        break;
      case "return_policy":
        mockResponse = {
          text: i18n.t("chat.responses.returnPolicy"),
          suggestions: [
            "Cách thức đổi trả",
            "Hoàn tiền như thế nào",
            "Sản phẩm lỗi",
            "Liên hệ bộ phận CSKH",
          ],
        };
        break;
      default:
        mockResponse = {
          text: i18n.t("chat.responses.general"),
          suggestions: [
            i18n.t("chat.suggestions.findProducts"),
            i18n.t("chat.suggestions.howToOrder"),
            i18n.t("chat.suggestions.returnPolicy"),
            "Khuyến mãi hiện có",
          ],
        };
    }

    return mockResponse;
  },
};

export const chatApi = api.injectEndpoints({
  endpoints: (builder) => ({
    sendMessage: builder.mutation<ChatResponse, string>({
      // Sử dụng queryFn thay vì query để bypass RTK Query's fetch logic
      async queryFn(message) {
        try {
          const response = await enhancedChatService.sendMessage(message);
          return { data: response };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "Enhanced chat service error",
              data: error,
            },
          };
        }
      },
    }),
  }),
});

export const { useSendMessageMutation } = chatApi;
