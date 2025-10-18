# 🤖 Chatbot Prompt Examples - Tự động thêm sản phẩm vào giỏ hàng

## 🎯 **Các câu hỏi để kích hoạt thêm vào giỏ hàng**

### **1. Câu hỏi trực tiếp**
```
User: "Thêm áo Nike vào giỏ hàng"
User: "Tôi muốn mua giày này"
User: "Add to cart"
User: "Cho tôi cái áo này"
User: "Tôi lấy đôi giày này"
```

### **2. Câu hỏi sau khi xem sản phẩm**
```
User: "Tôi muốn mua áo Nike Dri-FIT"
User: "Giày Nike Air Max 270 này có size 42 không? Tôi lấy luôn"
User: "Balo Adidas Classic này đẹp, tôi mua"
```

### **3. Câu hỏi với số lượng**
```
User: "Thêm 2 cái áo Nike vào giỏ"
User: "Tôi lấy 3 đôi giày này"
User: "Cho tôi 1 cái balo và 2 cái áo"
```

## 📋 **Response mẫu từ AI**

### **1. Response thành công**
```json
{
  "response": "✅ Đã thêm Áo thun Nike Dri-FIT vào giỏ hàng của bạn! Sản phẩm này có giá 450.000đ và đang được giảm giá từ 600.000đ. Bạn có muốn tiếp tục mua sắm không?",
  "matchedProducts": ["Áo thun Nike Dri-FIT"],
  "suggestions": [
    "Xem giỏ hàng 🛒",
    "Tiếp tục mua sắm 🛍️",
    "Thanh toán ngay 💳",
    "Tìm sản phẩm tương tự 🔍"
  ],
  "intent": "add_to_cart",
  "cartAction": {
    "action": "add_to_cart",
    "productId": "nike-dri-fit-uuid",
    "quantity": 1,
    "message": "✅ Đã thêm Áo thun Nike Dri-FIT vào giỏ hàng thành công!"
  }
}
```

### **2. Response khi không tìm thấy sản phẩm**
```json
{
  "response": "Xin lỗi, tôi không thể tìm thấy sản phẩm bạn muốn thêm vào giỏ hàng. Bạn có thể cho tôi biết tên sản phẩm cụ thể không? Hoặc tôi có thể gợi ý một số sản phẩm phù hợp:",
  "matchedProducts": ["Áo thun Nike Dri-FIT", "Giày Nike Air Max 270"],
  "suggestions": [
    "Xem tất cả sản phẩm Nike",
    "Tìm sản phẩm theo giá",
    "Gợi ý sản phẩm hot",
    "Liên hệ tư vấn"
  ],
  "intent": "product_search",
  "cartAction": null
}
```

### **3. Response khi sản phẩm hết hàng**
```json
{
  "response": "Rất tiếc, sản phẩm Áo thun Nike Dri-FIT hiện đang hết hàng. Tôi có thể gợi ý một số sản phẩm tương tự đang còn hàng:",
  "matchedProducts": ["Áo thun Adidas 3-Stripes", "Áo thun Uniqlo UT"],
  "suggestions": [
    "Xem sản phẩm tương tự",
    "Đăng ký thông báo khi có hàng",
    "Tìm sản phẩm khác",
    "Liên hệ hỗ trợ"
  ],
  "intent": "product_search",
  "cartAction": null
}
```

## 🔧 **Cách test prompt**

### **1. Test với câu hỏi đơn giản**
```bash
# Gửi request đến API
curl -X POST http://localhost:3000/api/chatbot/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "Thêm áo Nike vào giỏ hàng",
    "userId": "user123",
    "sessionId": "session456"
  }'
```

### **2. Test với context sản phẩm**
```bash
curl -X POST http://localhost:3000/api/chatbot/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "Tôi muốn mua áo Nike Dri-FIT",
    "userId": "user123",
    "sessionId": "session456",
    "context": {
      "previousProducts": ["Áo thun Nike Dri-FIT"],
      "currentPage": "product-detail"
    }
  }'
```

## 🎨 **Cải thiện prompt**

### **1. Thêm từ khóa nhận diện**
```javascript
// Trong prompt, thêm các từ khóa:
CÁCH XỬ LÝ YÊU CẦU THÊM VÀO GIỎ HÀNG:
- Khi khách hàng nói: "thêm vào giỏ", "mua", "add to cart", "cho tôi", "tôi lấy", "tôi cần", "tôi muốn mua", "đặt hàng", "order"
- Xác định sản phẩm cụ thể từ cuộc trò chuyện trước đó hoặc từ matchedProducts
- Trả về intent: "add_to_cart" và cartAction với productId chính xác
- Thông báo thành công: "✅ Đã thêm [tên sản phẩm] vào giỏ hàng của bạn!"
- Gợi ý tiếp theo: "Xem giỏ hàng", "Tiếp tục mua sắm", "Thanh toán"
```

### **2. Thêm xử lý số lượng**
```javascript
// Trong prompt, thêm hướng dẫn xử lý số lượng:
- Nếu khách hàng nói số lượng cụ thể: "2 cái", "3 đôi", "1 chiếc"
- Trích xuất số lượng và cập nhật cartAction.quantity
- Thông báo: "✅ Đã thêm [số lượng] [tên sản phẩm] vào giỏ hàng!"
```

### **3. Thêm xử lý lỗi**
```javascript
// Trong prompt, thêm xử lý các trường hợp lỗi:
- Nếu không tìm thấy sản phẩm: Gợi ý sản phẩm tương tự
- Nếu sản phẩm hết hàng: Thông báo và gợi ý sản phẩm khác
- Nếu không xác định được sản phẩm: Hỏi lại để làm rõ
```

## 🚀 **Kết quả mong đợi**

Sau khi cập nhật prompt, chatbot sẽ có thể:

1. ✅ **Nhận diện** yêu cầu thêm vào giỏ hàng
2. ✅ **Xác định** sản phẩm cụ thể
3. ✅ **Trích xuất** số lượng (nếu có)
4. ✅ **Thêm vào giỏ hàng** tự động
5. ✅ **Thông báo** thành công
6. ✅ **Gợi ý** hành động tiếp theo
7. ✅ **Track analytics** cho việc thêm vào giỏ hàng

## 📊 **Analytics được track**

- `product_added_to_cart` - Khi thêm sản phẩm vào giỏ hàng
- `source: 'chatbot_auto'` - Đánh dấu từ chatbot tự động
- `quantity` - Số lượng sản phẩm
- `productId` - ID sản phẩm
- `userId` - ID người dùng
- `sessionId` - ID phiên
