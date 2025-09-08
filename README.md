# 🛍️ Website Bán Hàng Mini

[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0.2-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.x-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Project Status](https://img.shields.io/badge/status-active_development-yellowgreen)](https://github.com/hoaiiann0804/WebsiteE-Commerce-Mini-with-AI-Chatbot)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🌟 Giới thiệu

**Website Bán Hàng Mini** là một ứng dụng thương mại điện tử full-stack, tích hợp chatbot AI (Gemini) và thanh toán Stripe, mang đến trải nghiệm mua sắm trực tuyến mượt mà, an toàn và responsive.

**Vai trò của tôi**:

- Phát triển toàn bộ frontend (React, TypeScript, Zustand) và backend (Node.js, Express, PostgreSQL).
- Tích hợp Stripe cho thanh toán và Gemini AI cho chatbot.
- Tối ưu hiệu suất với lazy loading, database indexing, và API caching.

## 🎯 Tính năng chính

### Phía người dùng

- 🔐 **Xác thực**: Đăng ký/đăng nhập với JWT, hỗ trợ vai trò khách hàng và admin.
- 🔍 **Quản lý sản phẩm**: Tìm kiếm, lọc sản phẩm theo danh mục, giá, và thuộc tính.
- 🛒 **Giỏ hàng**: Thêm/xóa sản phẩm, tính toán tổng tiền.
- 💳 **Thanh toán**: Tích hợp Stripe với webhook để xử lý giao dịch an toàn.
- 📱 **Responsive**: Giao diện tương thích mọi thiết bị, hỗ trợ đa ngôn ngữ (i18n).
- 🤖 **Chatbot AI**: Hỗ trợ khách hàng với Gemini AI, có chế độ fallback khi API không khả dụng.

### Phía quản trị

- 📊 **Dashboard**: Thống kê doanh thu và phân tích dữ liệu.
- 📦 **Quản lý sản phẩm**: CRUD sản phẩm, danh mục, và thuộc tính.
- 📝 **Quản lý đơn hàng**: Theo dõi và cập nhật trạng thái đơn hàng.
- 👥 **Quản lý người dùng**: Phân quyền admin và khách hàng.

## 🚀 Công nghệ sử dụng

- **Frontend**: React 18.2.0, TypeScript 5.0.2, Zustand, Tailwind CSS, Vite
- **Backend**: Node.js 18.x, Express, PostgreSQL 15.x, Sequelize
- **Dịch vụ bên ngoài**: Stripe (thanh toán), Gemini AI (chatbot)
- **Khác**: JWT, i18n, lazy loading, database indexing, RESTful API

## 📸 Hình ảnh demo

![Trang chủ](https://github.com/hoaiiann0804/E-Commerce-Mini-with-AI-Chatbot/raw/main/screenshots/homepage.png)
![Trang chủ](https://github.com/hoaiiann0804/E-Commerce-Mini-with-AI-Chatbot/raw/main/screenshots/ProductList_homepage.png)

_Trang chủ với danh sách sản phẩm và thanh tìm kiếm_

![Chi tiết sản phẩm](https://github.com/hoaiiann0804/E-Commerce-Mini-with-AI-Chatbot/raw/main/screenshots/product-detail.png)

_Thông tin sản phẩm, variants, và đánh giá_

![Giỏ hàng](https://github.com/hoaiiann0804/E-Commerce-Mini-with-AI-Chatbot/raw/main/screenshots/cart.png)

_Quản lý sản phẩm trong giỏ hàng_

![Thanh toán](https://github.com/hoaiiann0804/E-Commerce-Mini-with-AI-Chatbot/raw/main/screenshots/payment.png)
![Tích hợp stripe](https://github.com/hoaiiann0804/E-Commerce-Mini-with-AI-Chatbot/raw/main/screenshots/payment_stripe.png)

_Thanh toán an toàn với Stripe_

![Đơn hàng](https://github.com/hoaiiann0804/E-Commerce-Mini-with-AI-Chatbot/raw/main/screenshots/order.png)

_Xem chi tiết đơn hàng, cập nhật trạng thái, và thanh toán_

![Admin Dashboard](https://github.com/hoaiiann0804/E-Commerce-Mini-with-AI-Chatbot/raw/main/screenshots/admin_home.png)
_Dashboard quản trị với thống kê doanh thu_

![Admin Dashboard](https://github.com/hoaiiann0804/E-Commerce-Mini-with-AI-Chatbot/raw/main/screenshots/admin_product.png)

_Dashboard quản trị với danh sách sản phẩm_

![Admin Dashboard](https://github.com/hoaiiann0804/E-Commerce-Mini-with-AI-Chatbot/raw/main/screenshots/admin_categories.png)
\*Dashboard quản trị với danh sách danh mục

![Admin Dashboard](https://github.com/hoaiiann0804/E-Commerce-Mini-with-AI-Chatbot/raw/main/screenshots/admin_order.png)

_Dashboard quản trị với danh sách đơn hàng_

![Admin Dashboard](https://github.com/hoaiiann0804/E-Commerce-Mini-with-AI-Chatbot/raw/main/screenshots/admin_user.png)

_Dashboard quản trị với danh sách ngườin dùng_

![Admin Dashboard](https://github.com/hoaiiann0804/E-Commerce-Mini-with-AI-Chatbot/raw/main/screenshots/admin_warranty.png)

_Dashboard quản trị với danh sách gói bảo hành_

![Chatbot AI](https://github.com/hoaiiann0804/E-Commerce-Mini-with-AI-Chatbot/raw/main/screenshots/chatbot.png)

_Tương tác với Gemini AI_

## 🛠️ Cài đặt và chạy local

### Yêu cầu

- Node.js >= 18.x
- PostgreSQL >= 15.x
- Yarn hoặc npm
- API keys: [Stripe](https://stripe.com), [Gemini AI](https://ai.google.dev)

### Các bước cài đặt

1. **Clone repository**
   ```bash
   git clone https://github.com/hoaiiann0804/WebsiteE-Commerce-Mini-with-AI-Chatbot.git
   cd WebsiteE-Commerce-Mini-with-AI-Chatbot
   ```

Cài đặt dependencies
bash# Frontend
cd frontend
yarn install

# Backend

cd ../backend
yarn install

Cấu hình môi trường

Copy frontend/.env.example và backend/.env.example thành .env.
Cập nhật biến môi trường trong backend/.env:
```
envDB_URL=postgres://user:password@localhost:5432/ecommerce
STRIPE_KEY=your_stripe_key
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret
```

Khởi tạo database
bash# Tạo database
psql -U postgres -c "CREATE DATABASE ecommerce;"

# Chạy migrations

cd backend
yarn migrate

# (Tùy chọn) Seed dữ liệu

yarn seed

Khởi động ứng dụng
bash# Backend
cd backend
yarn start

# Frontend

cd ../frontend
yarn dev

Truy cập

Website: http://localhost:3000
Admin dashboard: http://localhost:3000/admin
Tài khoản thử nghiệm:

Khách hàng: user@example.com / password123
Admin: admin@example.com / admin123

Lưu ý

Đảm bảo PostgreSQL chạy trên localhost:5432 hoặc cập nhật DB_URL.
Nếu thiếu API keys, ứng dụng chạy ở chế độ demo (thanh toán giả lập, chatbot fallback).
Để kiểm tra webhook Stripe trên local, sử dụng ngrok:
bashngrok http 3000

🔍 Kết quả đạt được

Tải trang dưới 2 giây nhờ lazy loading và API caching.
Chatbot AI trả lời trong <1 giây, cải thiện trải nghiệm người dùng.
Giao dịch thanh toán an toàn với Stripe và webhook.
Database tối ưu với indexing, giảm thời gian truy vấn.

📚 Bài học rút ra

Thành thạo tích hợp API bên thứ ba (Stripe, Gemini AI) và thiết kế RESTful API.
Học cách tối ưu hiệu suất với lazy loading, database indexing, và caching.
Giải quyết thách thức đa ngôn ngữ (i18n) với lazy loading translations.
Nâng cao kỹ năng debug trong môi trường full-stack.

📂 Cấu trúc dự án

### Frontend Architecture

```
src/
├── components/          # UI Components tái sử dụng
│   ├── common/         # Button, Input, Modal...
│   ├── layout/         # Header, Footer, Sidebar
│   └── forms/          # Form components
├── pages/              # Các trang chính
│   ├── auth/           # Login, Register
│   ├── shop/           # Product listing, detail
│   ├── admin/          # Admin dashboard
│   └── checkout/       # Cart, Payment
├── store/              # Zustand state management
├── services/           # API calls
├── hooks/              # Custom React hooks
├── utils/              # Helper functions
└── types/              # TypeScript definitions
```

### Backend Architecture

```
src/
├── controllers/        # Route handlers
│   ├── auth.js        # Authentication
│   ├── products.js    # Product management
│   ├── orders.js      # Order processing
│   └── chat.js        # Chatbot
├── middlewares/        # Express middlewares
│   ├── auth.js        # JWT verification
│   ├── upload.js      # File upload
│   └── validation.js  # Input validation
├── models/            # Database models
├── services/          # Business logic
├── routes/            # API routes
└── utils/             # Helper functions
🚀 Triển khai

Lưu ý: Triển khai hiện cần API keys hợp lệ cho Stripe và Gemini AI.

Triển khai Backend

Deploy trên Render hoặc Heroku.
Cấu hình PostgreSQL trên dịch vụ như Neon.
Cập nhật DB_URL và các biến môi trường trong dashboard của dịch vụ.

Triển khai Frontend

Build production:
bashcd frontend
yarn build

Deploy thư mục dist lên Vercel hoặc Netlify.

🤝 Đóng góp
Chúng tôi hoan nghênh mọi đóng góp! Để tham gia:

Fork repository này.
Tạo branch mới: git checkout -b feature/your-feature.
Commit thay đổi: git commit -m "feat: mô tả thay đổi".
Push branch: git push origin feature/your-feature.
Tạo Pull Request với mô tả chi tiết.

📞 Liên hệ
Tên: Nguyễn Hoài An
GitHub: github.com/hoaiiann0804
Email: hoaiiann0804@gmail.com

```
