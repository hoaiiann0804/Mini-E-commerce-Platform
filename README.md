
Website Bán Hàng Mini
Giới Thiệu
Website Bán Hàng Mini là một ứng dụng thương mại điện tử full-stack, tích hợp chatbot AI (Gemini) và thanh toán Stripe, được thiết kế để cung cấp trải nghiệm mua sắm mượt mà, an toàn và responsive.
Vai trò của tôi:

Phát triển toàn bộ frontend (React, TypeScript, Zustand) và backend (Node.js, Express, PostgreSQL).
Tích hợp Stripe cho thanh toán và Gemini AI cho chatbot.
Tối ưu hiệu suất với lazy loading, database indexing, và API caching.

Tính Năng Chính

Xác thực người dùng: Đăng ký/đăng nhập với JWT, hỗ trợ vai trò khách hàng và admin.
Quản lý sản phẩm: Xem, tìm kiếm, lọc sản phẩm, hỗ trợ variants và attributes.
Giỏ hàng & Thanh toán: Thêm/xóa sản phẩm, thanh toán qua Stripe với webhook.
Quản lý admin: CRUD sản phẩm, quản lý đơn hàng, xem báo cáo doanh thu.
Chatbot AI: Hỗ trợ khách hàng với Gemini AI, fallback mode khi API không khả dụng.
Responsive & i18n: Giao diện tương thích mọi thiết bị, hỗ trợ đa ngôn ngữ.

Công Nghệ Sử Dụng

Frontend: React, TypeScript, Zustand, Tailwind CSS, Vite
Backend: Node.js, Express, PostgreSQL, Sequelize
Dịch vụ bên ngoài: Stripe (thanh toán), Gemini AI (chatbot)
Khác: JWT, i18n, lazy loading, database indexing, RESTful API

Kết Quả Đạt Được

Tối ưu hiệu suất tải trang dưới 2 giây với lazy loading và caching.
Xử lý giao dịch thanh toán an toàn qua Stripe, tích hợp webhook.
Chatbot AI trả lời trong <1 giây, nâng cao trải nghiệm người dùng.
Database tối ưu với indexing cho truy vấn nhanh.

Hướng Dẫn Cài Đặt và Chạy Local
Yêu Cầu

Node.js >= 18.x
PostgreSQL >= 15.x
Yarn hoặc npm
API keys: Stripe (stripe.com), Gemini AI (ai.google.dev)

Cài Đặt

Clone repository:git clone https://github.com/your-username/your-repo.git

Cài đặt dependencies:
Frontend: cd frontend && yarn install
Backend: cd backend && yarn install

Cấu hình environment:
Copy frontend/.env.example và backend/.env.example thành .env.
Điền biến môi trường:# backend/.env
DB_URL=postgres://user:password@localhost:5432/ecommerce
STRIPE_KEY=your_stripe_key
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret

Khởi tạo database:
Tạo database: psql -U postgres -c "CREATE DATABASE ecommerce;"
Chạy migrations: cd backend && yarn migrate
(Tùy chọn) Seed dữ liệu: cd backend && yarn seed

Khởi động ứng dụng:
Backend: cd backend && yarn start
Frontend: cd frontend && yarn dev

Truy cập:
Website: http://localhost:3000
Admin dashboard: http://localhost:3000/admin
Tài khoản thử nghiệm:
Khách hàng: user@example.com / password123
Admin: admin@example.com / admin123

Lưu Ý

Đảm bảo PostgreSQL chạy trên localhost:5432 hoặc cập nhật DB_URL.
Nếu thiếu API keys, ứng dụng chạy ở chế độ demo (thanh toán giả lập, chatbot fallback).

Minh Họa
Dưới đây là các giao diện chính của dự án:

## Minh Họa

Dưới đây là các giao diện chính của Website Bán Hàng Mini:

- **Trang chủ**: Hiển thị danh sách sản phẩm và thanh tìm kiếm.  
  ![Giao diện trang chủ voi thanh tim kiếm](screenshots/homepage.png),
  ![Giao diện trang chủ danh sách sản phẩm](screenshots/ProductList_homepage.png)

  - **Chi tiết sản phẩm**: Thông tin sản phẩm, variants, và đánh giá.  
    ![Chi tiết sản phẩm](screenshots/product-detail.png) ,
    ![Bài viết đánh giá](screenshots/product-review.png),

- **Giỏ hàng**: Quản lý sản phẩm trong giỏ và tính toán tổng tiền.  
  ![Giỏ hàng](screenshots/cart.png)

- **Thanh toán**: Tích hợp Stripe cho thanh toán an toàn.  
  ![Thanh toán](screenshots/payment.png)
  ![Tích hợp stripe](screenshots/payment_stripe.png)

- **Đơn hàng**: Xem chi tiết đơn hàng, cập nhật trạng thái, và thanh toán.  
  ![Đơn hàng](screenshots/order.png)

- **Admin Dashboard**: Quản lý sản phẩm, đơn hàng, người dùng, gói bảo hành và báo cáo.  
  ![Admin Dashboard trang thống kê doanh thu](screenshots/admin_home.png)
  ![Admin Dashboard quản lý sản phẩm ](screenshots/admin_product.png)
  ![Admin Dashboard quản lý đơn hàng](screenshots/admin_categories.png)
  ![Admin Dashboard quản lý đơn hàng](screenshots/admin_order.png)
  ![Admin Dashboard quản lý người dùng](screenshots/admin_user.png)
  ![Admin Dashboard quản lý gói bảo hành](screenshots/admin_warranty.png)

  - **Chatbot AI**: Tương tác với Gemini AI.  
    ![Chatbot AI](screenshots/chatbot.png)
    ![chatbox AI](screenshots/chatbot2.png)

Trang chủ: Hiển thị danh sách sản phẩm và thanh tìm kiếm.
Chi tiết sản phẩm: Thông tin sản phẩm, variants, và đánh giá.
Giỏ hàng: Quản lý sản phẩm và tính toán tổng tiền.
Thanh toán: Tích hợp Stripe cho thanh toán an toàn.
Admin Dashboard: Quản lý sản phẩm và đơn hàng.
Chatbot AI: Tương tác với Gemini AI.

Bài Học Rút Ra

Thành thạo tích hợp API bên thứ ba (Stripe, Gemini AI) và thiết kế RESTful API.
Học cách tối ưu hiệu suất với lazy loading, database indexing, và caching.
Giải quyết thách thức đa ngôn ngữ (i18n) bằng lazy loading translations.
Nâng cao kỹ năng debug trong môi trường full-stack.

Liên Hệ

GitHub: https://github.com/hoaiiann0804
Email: hoaiiann0804@gmail.com

