# Hướng dẫn nhanh thiết lập database từ đầu

Tài liệu này hướng dẫn các bước thiết lập database từ đầu khi chưa có bảng nào, tạo tài khoản admin và import dữ liệu sản phẩm.

## 1. Thiết lập môi trường

### 1.1. Cài đặt dependencies

```bash
cd backend
npm install
# hoặc
pnpm install
```

### 1.2. Cấu hình file .env

Sao chép file `.env.example` thành `.env`:

```bash
cp backend/.env.example backend/.env
```

Chỉnh sửa thông tin kết nối database trong file `.env`:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=websitebanhangmini
DB_USER=postgres
DB_PASSWORD=your_database_password
DB_SYNC=true  # Quan trọng: Đặt thành true để tạo bảng tự động
```

## 2. Tạo cấu trúc database và import dữ liệu

### 2.1. Tạo cấu trúc database

Khởi động server để Sequelize tự động tạo các bảng:

```bash
node src/server.js
```

Sau khi thấy thông báo server đã khởi động thành công, bạn có thể dừng server bằng `Ctrl+C`.

### 2.2. Tạo tài khoản admin

```bash
node scripts/create-admin-user.js
```

Thông tin tài khoản admin:

- Email: admin@example.com
- Mật khẩu: Admin@123

### 2.3. Import dữ liệu sản phẩm

```bash
node scripts/import-hybrid-products.js
```

Script này sẽ:

- Tạo các danh mục sản phẩm
- Tạo các sản phẩm với thuộc tính và biến thể

## 3. Kiểm tra kết quả

### 3.1. Khởi động lại server

```bash
node src/server.js
```

### 3.2. Đăng nhập vào trang admin

- Truy cập: http://localhost:5175/admin-login.html
- Đăng nhập với tài khoản admin đã tạo:
  - Email: admin@example.com
  - Mật khẩu: Admin@123

### 3.3. Kiểm tra dữ liệu

- Kiểm tra các danh mục sản phẩm
- Kiểm tra các sản phẩm đã được import

## 4. Lưu ý

- Sau khi đã tạo cấu trúc database thành công, bạn nên đặt `DB_SYNC=false` trong file `.env` để tránh việc sync lại database mỗi khi khởi động server.
- Nếu gặp lỗi khi chạy script, hãy kiểm tra logs để xác định nguyên nhân.
- Đảm bảo PostgreSQL đang chạy trước khi thực hiện các bước trên.
