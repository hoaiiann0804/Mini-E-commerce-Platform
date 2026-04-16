import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export interface GeminiChatResponse {
  text: string;
  suggestions?: string[];
  products?: any[]; // Assuming backend might return products
  intent?: string;
  cartAction?: any; // Assuming backend might return cart action
}

export class GeminiService {
  private isInitialized = false;
  private hasApiKeyOnBackend = false;
  private backendApiUrl: string;
  private backendStatusUrl: string;

  constructor() {
    this.backendApiUrl = `${API_BASE_URL}/ai/chat`;
    this.backendStatusUrl = `${API_BASE_URL}/ai/status`; // New endpoint to check status
    this.checkBackendStatus();
  }

  private async checkBackendStatus() {
    try {
      // Call a backend endpoint to check if AI service is ready and API key is configured
      const response = await axios.get(this.backendStatusUrl);
      if (response.data && response.data.isReady) {
        this.isInitialized = true;
        this.hasApiKeyOnBackend = response.data.hasApiKey;
        console.log("Gemini AI backend service is available.");
      } else {
        this.isInitialized = false;
        this.hasApiKeyOnBackend = false;
        console.warn(
          "Gemini AI backend service is not ready or API key is missing."
        );
      }
    } catch (error) {
      console.error("Error checking Gemini AI backend status:", error);
      this.isInitialized = false;
      this.hasApiKeyOnBackend = false;
    }
  }

  private getProductsContext(): string {
    // Tạo context từ dữ liệu sản phẩm
    const productsInfo = mockProducts.slice(0, 20).map((product) => ({
      id: product.id,
      name: product.name,
      price: `${product.price.toLocaleString("vi-VN")}đ`,
      category: product.categoryName || "Không xác định",
      description: product.description,
      inStock: product.stock > 0,
      rating: product.ratings?.average || 0,
      stock: product.stock,
    }));

    const categoriesInfo = mockCategories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description || "",
    }));

    return `
THÔNG TIN CỬA HÀNG:
- Tên: Fashion Store
- Chuyên bán: Thời trang, phụ kiện, giày dép
- Chính sách: Đổi trả trong 7 ngày, miễn phí vận chuyển đơn hàng trên 500k

DANH MỤC SẢN PHẨM:
${categoriesInfo.map((cat) => `- ${cat.name}: ${cat.description}`).join("\n")}

SẢN PHẨM HIỆN CÓ (${productsInfo.length} sản phẩm mẫu):
${productsInfo
  .map(
    (product) =>
      `- ${product.name} (${product.category}): ${product.price} - ${product.description} - ${product.inStock ? "Còn hàng" : "Hết hàng"} - Đánh giá: ${product.rating}/5`
  )
  .join("\n")}

CHÍNH SÁCH CỬA HÀNG:
- Đổi trả: Trong vòng 7 ngày kể từ khi nhận hàng
- Vận chuyển: Miễn phí cho đơn hàng trên 500.000đ
- Thanh toán: COD, chuyển khoản, thẻ tín dụng
- Bảo hành: Theo chính sách từng nhà sản xuất
`;
  }

  private createSystemPrompt(): string {
    return `Bạn là trợ lý mua sắm AI thông minh cho một cửa hàng thời trang trực tuyến.

NHIỆM VỤ:
- Tư vấn sản phẩm dựa trên dữ liệu thực tế của cửa hàng
- Trả lời câu hỏi về sản phẩm, giá cả, chính sách
- Gợi ý sản phẩm phù hợp với nhu cầu khách hàng
- Hướng dẫn quy trình mua hàng

NGUYÊN TẮC:
- Luôn thân thiện, nhiệt tình
- Đưa ra thông tin chính xác dựa trên dữ liệu sản phẩm
- Gợi ý tối đa 3-4 sản phẩm cụ thể khi khách hàng tìm kiếm
- Trả lời bằng tiếng Việt
- Giữ câu trả lời ngắn gọn, dễ hiểu
- Luôn đề xuất hành động tiếp theo cho khách hàng

${this.getProductsContext()}

Hãy trả lời như một nhân viên bán hàng chuyên nghiệp và am hiểu sản phẩm.`;
  }

  async sendMessage(userMessage: string): Promise<GeminiChatResponse> {
    if (!this.isInitialized) {
      throw new Error("Dịch vụ AI chat chưa sẵn sàng. Vui lòng thử lại sau.");
    }
    // Validate input
    if (!userMessage || userMessage.trim().length === 0) {
      throw new Error("Vui lòng nhập câu hỏi");
    }

    // Clean input - remove special characters that might cause issues
    const cleanMessage = userMessage
      .trim()
      .replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF]/g, " ");

    if (cleanMessage.length < 2) {
      return {
        text: "Xin chào! Tôi có thể giúp bạn tìm sản phẩm, tư vấn về chính sách cửa hàng, hoặc hướng dẫn mua hàng. Bạn cần hỗ trợ gì?",
        suggestions: [
          "Tìm sản phẩm",
          "Xem khuyến mãi",
          "Chính sách đổi trả",
          "Hướng dẫn mua hàng",
        ],
      };
    }

    try {
      console.log("Sending request to Backend AI endpoint...");
      const response = await axios.post(this.backendApiUrl, {
        message: cleanMessage,
      });
      const { text, products, suggestions, intent, cartAction } =
        response.data.data;

      console.log("Backend AI response received:", response.data.data);

      // Tạo suggestions dựa trên nội dung phản hồi
      const finalSuggestions =
        suggestions && suggestions.length > 0
          ? suggestions
          : this.generateSuggestions(cleanMessage, text);

      return {
        text: text.trim(),
        suggestions: finalSuggestions,
        products,
        intent,
        cartAction,
      };
    } catch (error: any) {
      console.error("Gemini AI backend call error:", error);

      // Detailed error handling
      if (
        axios.isAxiosError(error) &&
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        throw new Error(error.response.data.message);
      }
      throw new Error("Lỗi kết nối với AI. Vui lòng thử lại sau.");
    }
  }

  private generateSuggestions(
    userMessage: string,
    aiResponse: string
  ): string[] {
    const lowerMessage = userMessage.toLowerCase();
    const lowerResponse = aiResponse.toLowerCase();

    // Suggestions dựa trên intent
    if (
      lowerMessage.includes("tìm") ||
      lowerMessage.includes("kiếm") ||
      lowerMessage.includes("sản phẩm")
    ) {
      return [
        "Xem thêm sản phẩm tương tự",
        "So sánh giá cả",
        "Kiểm tra khuyến mãi",
        "Hỏi về size và màu sắc",
      ];
    }

    if (lowerMessage.includes("giá") || lowerMessage.includes("tiền")) {
      return [
        "Xem chương trình khuyến mãi",
        "So sánh với sản phẩm khác",
        "Hỏi về phương thức thanh toán",
        "Tính phí vận chuyển",
      ];
    }

    if (lowerMessage.includes("đặt hàng") || lowerMessage.includes("mua")) {
      return [
        "Hướng dẫn đặt hàng",
        "Chọn phương thức thanh toán",
        "Xem chính sách vận chuyển",
        "Liên hệ tư vấn",
      ];
    }

    if (
      lowerMessage.includes("đổi") ||
      lowerMessage.includes("trả") ||
      lowerMessage.includes("hoàn")
    ) {
      return [
        "Xem chi tiết chính sách đổi trả",
        "Hướng dẫn quy trình đổi trả",
        "Liên hệ CSKH",
        "Kiểm tra bảo hành",
      ];
    }

    // Default suggestions
    return [
      "Tìm sản phẩm khác",
      "Xem khuyến mãi hiện tại",
      "Hỏi về chính sách cửa hàng",
      "Liên hệ tư vấn trực tiếp",
    ];
  }

  // Kiểm tra xem Gemini AI có sẵn sàng không
  isReady(): boolean {
    return this.isInitialized && this.hasApiKeyOnBackend;
  }

  // Lấy thông tin trạng thái
  getStatus(): { ready: boolean; hasApiKey: boolean; error?: string } {
    return {
      ready: this.isInitialized,
      hasApiKey: this.hasApiKeyOnBackend,
      error: !this.isInitialized ? "Dịch vụ AI chat chưa sẵn sàng." : undefined,
    };
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
export default geminiService;
