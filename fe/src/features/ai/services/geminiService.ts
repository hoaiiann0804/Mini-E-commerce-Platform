import { GoogleGenerativeAI } from "@google/generative-ai";
import { mockProducts } from "@/data/mockProducts";
import { mockCategories } from "@/data/mockCategories";

// Gemini AI configuration
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "demo-key";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export interface GeminiChatResponse {
  text: string;
  suggestions?: string[];
}

export class GeminiService {
  private model: any;
  private isInitialized = false;

  constructor() {
    this.initializeModel();
  }

  private async initializeModel() {
    const modelsToTry = [
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
    ];

    for (const modelName of modelsToTry) {
      try {
        console.log(`Trying to initialize model: ${modelName}`);
        this.model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.7,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 1024,
          },
        });

        // Test the model with a simple request
        await this.model.generateContent("Hello");

        this.isInitialized = true;
        console.log(
          `Gemini AI model initialized successfully with ${modelName}`
        );
        return;
      } catch (error) {
        console.warn(`Failed to initialize with ${modelName}:`, error);
        continue;
      }
    }

    console.error("Failed to initialize any Gemini AI model");
    this.isInitialized = false;
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
    if (!this.isInitialized || !this.model) {
      throw new Error("Gemini AI chưa được khởi tạo");
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
      const prompt = `${this.createSystemPrompt()}

KHÁCH HÀNG HỎI: "${cleanMessage}"

Hãy trả lời một cách hữu ích và chuyên nghiệp:`;

      console.log("Sending request to Gemini AI...");
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log("Gemini AI response received:", text);

      // Tạo suggestions dựa trên nội dung phản hồi
      const suggestions = this.generateSuggestions(cleanMessage, text);

      return {
        text: text.trim(),
        suggestions,
      };
    } catch (error: any) {
      console.error("Gemini AI error:", error);

      // Detailed error handling
      if (error.message?.includes("API_KEY") || error.status === 400) {
        throw new Error("Cần cấu hình API key cho Gemini AI");
      } else if (error.message?.includes("quota") || error.status === 429) {
        throw new Error("Đã vượt quá giới hạn sử dụng API");
      } else if (error.status === 403) {
        throw new Error("API key không hợp lệ");
      } else if (error.status >= 500) {
        throw new Error("Lỗi server AI. Vui lòng thử lại sau.");
      } else {
        throw new Error("Lỗi kết nối với AI. Vui lòng thử lại sau.");
      }
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
    return this.isInitialized && !!this.model && GEMINI_API_KEY !== "demo-key";
  }

  // Lấy thông tin trạng thái
  getStatus(): { ready: boolean; hasApiKey: boolean; error?: string } {
    return {
      ready: this.isInitialized,
      hasApiKey: GEMINI_API_KEY !== "demo-key",
      error: !this.isInitialized ? "Model chưa được khởi tạo" : undefined,
    };
  }

  // Kiểm tra models có sẵn (debug utility)
  async listAvailableModels() {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`
      );
      const data = await response.json();
      console.log(
        "Available models:",
        data.models?.map((m: any) => m.name)
      );
      return data.models;
    } catch (error) {
      console.error("Error listing models:", error);
      return [];
    }
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
export default geminiService;
