const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Product, Category, sequelize } = require('../models');
const { Op } = require('sequelize');

class GeminiChatbotService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.initializeGemini();
  }

  initializeGemini() {
    try {
      if (
        process.env.GEMINI_API_KEY &&
        process.env.GEMINI_API_KEY !== 'demo-key'
      ) {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({
          model: 'gemini-2.0-flash',
        });
        console.info(
          '✅ Gemini AI initialized successfully with model: gemini-2.0-flash'
        );
      } else {
        console.warn('⚠️  Gemini API key not found, using fallback responses');
      }
    } catch (error) {
      console.error(
        '❌ Failed to initialize Gemini AI:',
        error.message || error
      );
    }
  }

  /**
   * Main chatbot handler with AI intelligence
   */
  async handleMessage(message, context = {}) {
    try {
      // Step 1: Get all available products from database
      const allProducts = await this.getAllProducts();
      if (process.env.NODE_ENV !== 'production') {
        console.log(`📦 Found ${allProducts.length} products in database`);
      }

      // Step 2: Use Gemini AI to understand user intent and find matching products
      const aiResponse = await this.getAIResponse(
        message,
        allProducts,
        context
      );

      return aiResponse;
    } catch (error) {
      console.error('Gemini chatbot error:', error);
      return this.getFallbackResponse(message);
    }
  }

  /**
   * Get AI response using Gemini
   */
  async getAIResponse(userMessage, products, context) {
    if (!this.model) {
      return this.getFallbackResponse(userMessage);
    }

    try {
      // Create a comprehensive prompt for Gemini
      const prompt = this.createPrompt(userMessage, products, context);
      if (process.env.NODE_ENV !== 'production') {
        console.log('🤖 Sending request to Gemini API...');
      }

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const aiText = response.text();

      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ Received response from Gemini API');
        console.log('📝 AI Response length:', aiText.length);
      }

      // Parse AI response to extract product recommendations
      const parsedResponse = this.parseAIResponse(aiText, products);

      return parsedResponse;
    } catch (error) {
      console.error('❌ Gemini API error details:', {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
      });

      // Check if it's a 404 error specifically
      if (error.message && error.message.includes('404')) {
        console.error(
          '🚨 404 Error - Model not found or API endpoint incorrect'
        );
      }

      return this.getFallbackResponse(userMessage);
    }
  }

  /**
   * Create comprehensive prompt for Gemini AI
   */
  createPrompt(userMessage, products, context) {
    const productList = products
      .map(
        (p) =>
          `- ${p.name}: ${p.shortDescription} (Giá: ${p.price?.toLocaleString('vi-VN')}đ)`
      )
      .join('\n');

    return `
Bạn là một trợ lý AI thông minh cho cửa hàng thời trang Shopmini. Bạn có thể xử lý mọi loại câu hỏi:

KHẢ NĂNG CỦA BẠN:
1. Tìm kiếm và gợi ý sản phẩm
2. Trả lời câu hỏi về chính sách, dịch vụ
3. Hỗ trợ khách hàng với mọi thắc mắc
4. Tư vấn thời trang và phong cách
5. Xử lý khiếu nại và phản hồi
6. Trò chuyện thân thiện, tự nhiên
7. Trả lời câu hỏi kiến thức chung một cách thông minh và hài hước
8. THÊM SẢN PHẨM VÀO GIỎ HÀNG khi khách hàng yêu cầu

DANH SÁCH SẢN PHẨM CÓ SẴN:
${productList}

THÔNG TIN CỬA HÀNG:
- Tên: Shopmini - Cửa hàng thời trang trực tuyến
- Chuyên: Áo thun, giày thể thao, balo, túi xách
- Chính sách: Đổi trả trong 7 ngày, miễn phí vận chuyển đơn >500k
- Thanh toán: COD, chuyển khoản, thẻ tín dụng
- Giao hàng: 1-3 ngày trong nội thành, 3-7 ngày ngoại thành
- Hỗ trợ: 24/7 qua chat, hotline: 1900-xxxx

TIN NHẮN KHÁCH HÀNG: "${userMessage}"
CONTEXT: ${JSON.stringify(context)}

HƯỚNG DẪN TRẢ LỜI:
- Nếu hỏi về SẢN PHẨM: Tìm và gợi ý sản phẩm phù hợp
- Nếu hỏi về GIÁ CẢ: So sánh giá, gợi ý sản phẩm trong tầm giá
- Nếu hỏi về CHÍNH SÁCH: Giải thích rõ ràng về đổi trả, giao hàng
- Nếu hỏi về KÍCH THƯỚC: Tư vấn size, hướng dẫn chọn size
- Nếu KHIẾU NẠI: Thể hiện sự quan tâm, hướng dẫn giải quyết
- Nếu HỎI CHUNG: Trò chuyện thân thiện, hướng về sản phẩm
- Nếu HỎI NGOÀI LĨNH VỰC: Trả lời thông minh, hài hước và thân thiện. Có thể trả lời các câu hỏi kiến thức chung, nhưng sau đó nhẹ nhàng chuyển hướng về shop.
- Nếu YÊU CẦU THÊM VÀO GIỎ HÀNG: Xác nhận sản phẩm và thông báo đã thêm vào giỏ hàng thành công

Hãy trả lời theo format JSON sau:
{
  "response": "Câu trả lời chi tiết, thân thiện và hữu ích",
  "matchedProducts": ["tên sản phẩm 1", "tên sản phẩm 2", ...],
  "suggestions": ["gợi ý 1", "gợi ý 2", "gợi ý 3", "gợi ý 4"],
  "intent": "product_search|pricing|policy|support|complaint|general|off_topic|add_to_cart",
  "cartAction": {
    "action": "add_to_cart",
    "productId": "id-sản-phẩm",
    "quantity": 1,
    "message": "Đã thêm sản phẩm vào giỏ hàng thành công!"
  }
}

LƯU Ý QUAN TRỌNG:
- Luôn trả lời bằng tiếng Việt tự nhiên
- Sử dụng emoji phù hợp để tạo cảm xúc
- Nếu không biết thông tin cụ thể, hãy thành thật và hướng dẫn liên hệ
- Với câu hỏi ngoài lề, hãy trả lời thông minh, hài hước và thân thiện trước, sau đó mới chuyển hướng về shop
- Thể hiện sự quan tâm và sẵn sàng hỗ trợ
- Đừng từ chối trả lời các câu hỏi kiến thức chung, hãy trả lời một cách thông minh và hài hước

CÁCH XỬ LÝ YÊU CẦU THÊM VÀO GIỎ HÀNG:
- Khi khách hàng nói: "thêm vào giỏ", "mua", "add to cart", "cho tôi", "tôi lấy"
- Xác định sản phẩm cụ thể từ cuộc trò chuyện trước đó hoặc từ matchedProducts
- Trả về intent: "add_to_cart" và cartAction với productId chính xác
- Thông báo thành công: "✅ Đã thêm [tên sản phẩm] vào giỏ hàng của bạn!"
- Gợi ý tiếp theo: "Xem giỏ hàng", "Tiếp tục mua sắm", "Thanh toán"
`;
  }

  /**
   * Parse AI response and match with actual products
   */
  parseAIResponse(aiText, products) {
    try {
      // Try to parse JSON response from AI
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        // Find actual product objects based on AI recommendations
        const matchedProducts = [];
        if (parsed.matchedProducts && Array.isArray(parsed.matchedProducts)) {
          parsed.matchedProducts.forEach((productName) => {
            const product = products.find(
              (p) =>
                p.name.toLowerCase().includes(productName.toLowerCase()) ||
                productName.toLowerCase().includes(p.name.toLowerCase())
            );
            if (product) {
              matchedProducts.push({
                id: product.id,
                name: product.name,
                price: product.price,
                compareAtPrice: product.compareAtPrice,
                thumbnail: product.thumbnail,
                inStock: product.inStock,
                rating: 4.5,
              });
            }
          });
        }

        return {
          response:
            parsed.response || 'Tôi có thể giúp bạn tìm sản phẩm phù hợp!',
          products: matchedProducts,
          suggestions: parsed.suggestions || [
            'Xem tất cả sản phẩm',
            'Sản phẩm khuyến mãi',
            'Hỗ trợ mua hàng',
            'Liên hệ tư vấn',
          ],
          intent: parsed.intent || 'general',
          cartAction: parsed.cartAction || null, // Thêm cartAction từ AI response
        };
      }
    } catch (error) {
      console.error('Failed to parse AI response:', error.message || error);
    }

    // Fallback: simple keyword matching
    return this.simpleKeywordMatch(userMessage, products);
  }

  /**
   * Simple keyword matching fallback
   */
  simpleKeywordMatch(userMessage, products) {
    const lowerMessage = userMessage.toLowerCase().trim();
    let matchedProducts = [];
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `🔍 Searching for: "${lowerMessage}" in ${products.length} products`
      );
    }

    // Extract search terms from user message
    const searchTerms = lowerMessage
      .split(' ')
      .filter((term) => term.length > 1); // Reduced from 2 to 1 to catch single-char terms
    searchTerms.push(lowerMessage); // Add full message

    // Add Vietnamese-English keyword mapping
    const keywordMapping = {
      balo: ['balo', 'backpack', 'bag'],
      túi: ['túi', 'bag', 'backpack'],
      giày: ['giày', 'shoes', 'shoe', 'sneaker'],
      áo: ['áo', 'shirt', 'tshirt', 't-shirt'],
      quần: ['quần', 'pants', 'jeans', 'trousers'],
      điện : ['laptop', 'điện thoại', 'ipad', 'tai nghe'],
    };

    // Expand search terms with mappings
    const expandedTerms = [...searchTerms];
    Object.keys(keywordMapping).forEach((viTerm) => {
      if (lowerMessage.includes(viTerm)) {
        expandedTerms.push(...keywordMapping[viTerm]);
      }
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔍 Expanded search terms:`, expandedTerms);
    }

    // Search through products using their dynamic keywords
    products.forEach((product) => {
      let matchScore = 0;
      const productName = product.name?.toLowerCase() || '';
      const productDesc = product.shortDescription?.toLowerCase() || '';
      const productFullDesc = product.description?.toLowerCase() || '';

      // 1. Direct match in product name (highest priority)
      expandedTerms.forEach((term) => {
        if (productName.includes(term.toLowerCase())) {
          matchScore += 10;
          if (process.env.NODE_ENV !== 'production') {
            console.log(`✅ Name match: "${product.name}" contains "${term}"`);
          }
        }
      });

      // 2. Match in short description
      expandedTerms.forEach((term) => {
        if (productDesc.includes(term.toLowerCase())) {
          matchScore += 8;
          if (process.env.NODE_ENV !== 'production') {
            console.log(
              `✅ Description match: "${product.name}" desc contains "${term}"`
            );
          }
        }
      });

      // 3. Match in search keywords (dynamic from database)
      if (product.searchKeywords && Array.isArray(product.searchKeywords)) {
        expandedTerms.forEach((term) => {
          const keywordMatches = product.searchKeywords.filter(
            (keyword) =>
              keyword.toLowerCase().includes(term.toLowerCase()) ||
              term.toLowerCase().includes(keyword.toLowerCase())
          );
          if (keywordMatches.length > 0) {
            if (process.env.NODE_ENV !== 'production') {
              console.log(
                `✅ Keyword matches for "${product.name}":`,
                keywordMatches
              );
            }
            matchScore += keywordMatches.length * 5;
          }
        });
      }

      // 4. Partial matches in full product text
      const productText = `${productName} ${productDesc} ${productFullDesc}`;
      expandedTerms.forEach((term) => {
        if (productText.includes(term.toLowerCase())) {
          matchScore += 2;
        }
      });

      // Add product if it has any matches
      if (matchScore > 0) {
        if (process.env.NODE_ENV !== 'production') {
          console.log(
            `✅ Product "${product.name}" matched with score: ${matchScore}`
          );
        }
        matchedProducts.push({ ...product, matchScore });
      }
    });

    // Sort by match score (highest first)
    matchedProducts.sort((a, b) => b.matchScore - a.matchScore);

    // Remove duplicates
    const uniqueProducts = matchedProducts.filter(
      (product, index, self) =>
        index === self.findIndex((p) => p.id === product.id)
    );

    if (uniqueProducts.length > 0) {
      const productList = uniqueProducts
        .slice(0, 5)
        .map((p) => `• ${p.name} - ${p.price?.toLocaleString('vi-VN')}đ`)
        .join('\n');

      return {
        response: `🔍 Tôi tìm thấy ${uniqueProducts.length} sản phẩm phù hợp với "${userMessage}":\n\n${productList}\n\nBạn muốn xem chi tiết sản phẩm nào không?`,
        products: uniqueProducts.slice(0, 3).map((product) => ({
          id: product.id,
          name: product.name,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          thumbnail: product.thumbnail,
          inStock: product.inStock,
          rating: 4.5,
        })),
        suggestions: [
          'Xem tất cả sản phẩm',
          'Lọc theo giá',
          'Sản phẩm khuyến mãi',
          'Thêm vào giỏ hàng',
        ],
        intent: 'product_search',
      };
    }

    return this.getFallbackResponse(userMessage);
  }

  /**
   * Get all products from database
   */
  async getAllProducts() {
    try {
      const products = await Product.findAll({
        where: {
          status: 'active',
          inStock: true,
        },
        attributes: [
          'id',
          'name',
          'shortDescription',
          'description',
          'price',
          'compareAtPrice',
          'thumbnail',
          'inStock',
          'searchKeywords',
        ],
        limit: 100, // Limit to avoid too much data
        order: [['createdAt', 'DESC']],
      });

      return products.map((p) => p.toJSON());
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  /**
   * Enhanced fallback response for various scenarios
   */
  getFallbackResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();

    // Product search patterns
    if (
      lowerMessage.includes('balo') ||
      lowerMessage.includes('bag') ||
      lowerMessage.includes('backpack')
    ) {
      return {
        response:
          '🎒 Chúng tôi có nhiều loại balo chất lượng! Balo Adidas Classic, Nike Brasilia... Bạn muốn xem loại nào?',
        suggestions: [
          'Balo Adidas',
          'Balo Nike',
          'Balo học sinh',
          'Xem tất cả balo',
        ],
        intent: 'product_search',
      };
    }

    if (lowerMessage.includes('giày') || lowerMessage.includes('shoe')) {
      return {
        response:
          '👟 Chúng tôi có nhiều loại giày thể thao hot! Nike, Adidas, Converse, Vans... Bạn thích loại nào?',
        suggestions: [
          'Giày Nike',
          'Giày Adidas',
          'Giày Converse',
          'Xem tất cả giày',
        ],
        intent: 'product_search',
      };
    }

    if (lowerMessage.includes('áo') || lowerMessage.includes('shirt')) {
      return {
        response:
          '👕 Chúng tôi có nhiều mẫu áo thun đẹp! Nike Dri-FIT, Adidas 3-Stripes, Uniqlo UT... Bạn muốn xem loại nào?',
        suggestions: ['Áo Nike', 'Áo Adidas', 'Áo Uniqlo', 'Xem tất cả áo'],
        intent: 'product_search',
      };
    }

    // Pricing inquiries
    if (
      lowerMessage.includes('giá') ||
      lowerMessage.includes('bao nhiêu') ||
      lowerMessage.includes('price')
    ) {
      return {
        response:
          '💰 Shopmini có sản phẩm đa dạng từ 400k-5M! Bạn muốn tìm trong tầm giá nào? Tôi sẽ gợi ý sản phẩm phù hợp nhất!',
        suggestions: [
          'Dưới 1 triệu 💸',
          'Từ 1-2 triệu 💳',
          'Từ 2-5 triệu 💎',
          'Xem khuyến mãi 🎉',
        ],
        intent: 'pricing',
      };
    }

    // Policy inquiries
    if (
      lowerMessage.includes('đổi trả') ||
      lowerMessage.includes('bảo hành') ||
      lowerMessage.includes('chính sách')
    ) {
      return {
        response:
          '📋 Chính sách Shopmini:\n• Đổi trả trong 7 ngày\n• Miễn phí ship đơn >500k\n• Bảo hành theo nhà sản xuất\n• Hỗ trợ 24/7\nBạn cần biết thêm gì không?',
        suggestions: [
          'Cách đổi trả',
          'Phí vận chuyển',
          'Thời gian giao hàng',
          'Liên hệ hỗ trợ',
        ],
        intent: 'policy',
      };
    }

    // Shipping inquiries
    if (
      lowerMessage.includes('giao hàng') ||
      lowerMessage.includes('ship') ||
      lowerMessage.includes('vận chuyển')
    ) {
      return {
        response:
          '🚚 Thông tin giao hàng:\n• Nội thành: 1-3 ngày\n• Ngoại thành: 3-7 ngày\n• Miễn phí ship đơn >500k\n• COD toàn quốc\nBạn ở khu vực nào ạ?',
        suggestions: [
          'Phí ship nội thành',
          'Phí ship ngoại thành',
          'Giao hàng nhanh',
          'Thanh toán COD',
        ],
        intent: 'support',
      };
    }

    // Size inquiries
    if (
      lowerMessage.includes('size') ||
      lowerMessage.includes('kích thước') ||
      lowerMessage.includes('số')
    ) {
      return {
        response:
          '📏 Hướng dẫn chọn size:\n• Giày: 39-44 (nam), 35-40 (nữ)\n• Áo: S, M, L, XL, XXL\n• Balo: One size\nBạn cần tư vấn size sản phẩm nào?',
        suggestions: [
          'Size giày nam',
          'Size giày nữ',
          'Size áo thun',
          'Bảng size chi tiết',
        ],
        intent: 'support',
      };
    }

    // Complaint handling
    if (
      lowerMessage.includes('khiếu nại') ||
      lowerMessage.includes('phàn nàn') ||
      lowerMessage.includes('không hài lòng')
    ) {
      return {
        response:
          '😔 Shopmini rất xin lỗi vì trải nghiệm không tốt! Chúng tôi luôn lắng nghe và cải thiện. Bạn có thể chia sẻ chi tiết để chúng tôi hỗ trợ tốt nhất không?',
        suggestions: [
          'Liên hệ hotline',
          'Chat với tư vấn viên',
          'Gửi email khiếu nại',
          'Đánh giá dịch vụ',
        ],
        intent: 'complaint',
      };
    }

    // Off-topic but friendly responses
    if (
      lowerMessage.includes('thời tiết') ||
      lowerMessage.includes('weather')
    ) {
      return {
        response:
          '🌤️ Thời tiết hôm nay thế nào nhỉ? Dù nắng hay mưa thì outfit đẹp vẫn quan trọng! Shopmini có nhiều sản phẩm phù hợp mọi thời tiết đấy!',
        suggestions: [
          'Áo thun mát mẻ ☀️',
          'Giày chống nước 🌧️',
          'Balo đi học/làm 🎒',
          'Phụ kiện thời trang ✨',
        ],
        intent: 'off_topic',
      };
    }

    if (
      lowerMessage.includes('ăn') ||
      lowerMessage.includes('food') ||
      lowerMessage.includes('món')
    ) {
      return {
        response:
          '🍕 Haha, tôi không bán đồ ăn nhưng có thể giúp bạn chọn outfit đẹp để đi ăn! Shopmini có nhiều trang phục thời trang cho mọi dịp đấy!',
        suggestions: [
          'Áo đẹp đi chơi 👕',
          'Giày sneaker trendy 👟',
          'Túi xách thời trang 👜',
          'Set đồ hoàn hảo ✨',
        ],
        intent: 'off_topic',
      };
    }

    // Xử lý câu hỏi về chủ quyền lãnh thổ
    if (
      (lowerMessage.includes('hoàng sa') ||
        lowerMessage.includes('trường sa')) &&
      lowerMessage.includes('của')
    ) {
      return {
        response:
          '🇻🇳 Quần đảo Hoàng Sa và Trường Sa là của Việt Nam! Chủ quyền lãnh thổ là điều thiêng liêng. Nhân tiện, Shopmini đang có nhiều mẫu áo thun in hình bản đồ Việt Nam cực đẹp đấy! Bạn có muốn xem không? 😊',
        suggestions: [
          'Xem áo thun in hình bản đồ Việt Nam',
          'Tìm sản phẩm khác',
          'Xem khuyến mãi hôm nay',
          'Liên hệ tư vấn',
        ],
        intent: 'off_topic',
      };
    }

    // Xử lý các câu hỏi chính trị, lịch sử
    if (
      lowerMessage.includes('chính trị') ||
      lowerMessage.includes('lịch sử') ||
      lowerMessage.includes('chiến tranh') ||
      lowerMessage.includes('đảng')
    ) {
      return {
        response:
          '📚 Đây là một chủ đề thú vị! Tôi có thể trò chuyện về nhiều vấn đề, nhưng chuyên môn chính của tôi là tư vấn thời trang và sản phẩm của Shopmini. Bạn có muốn tìm hiểu về các sản phẩm đang hot không? 😊',
        suggestions: [
          'Xem sản phẩm mới nhất',
          'Tìm sản phẩm theo phong cách',
          'Xem khuyến mãi hôm nay',
          'Liên hệ tư vấn',
        ],
        intent: 'off_topic',
      };
    }

    // Greeting patterns
    if (
      lowerMessage.includes('chào') ||
      lowerMessage.includes('hello') ||
      lowerMessage.includes('hi')
    ) {
      return {
        response:
          'Chào bạn! 👋 Rất vui được gặp bạn tại Shopmini! Tôi là trợ lý AI, sẵn sàng giúp bạn tìm những sản phẩm thời trang tuyệt vời. Bạn đang tìm gì vậy?',
        suggestions: [
          'Sản phẩm hot nhất 🔥',
          'Khuyến mãi hôm nay 🎉',
          'Tư vấn phong cách 💫',
          'Xem tất cả sản phẩm 🛍️',
        ],
        intent: 'general',
      };
    }

    // Default response
    return {
      response:
        'Tôi là trợ lý AI của Shopmini! 😊 Tôi có thể giúp bạn:\n• Tìm sản phẩm phù hợp\n• Tư vấn giá cả, size\n• Hỗ trợ chính sách đổi trả\n• Trò chuyện về thời trang\n\nBạn cần hỗ trợ gì nhỉ?',
      suggestions: [
        'Tìm sản phẩm 🔍',
        'Xem khuyến mãi 🎁',
        'Hỏi về chính sách 📋',
        'Tư vấn thời trang 💅',
      ],
      intent: 'general',
    };
  }
}

module.exports = new GeminiChatbotService();
