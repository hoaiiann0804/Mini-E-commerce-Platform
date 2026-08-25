# Hướng dẫn thiết lập Database và Migrate dữ liệu

Tài liệu này hướng dẫn cách thiết lập database mới và migrate dữ liệu mẫu cho dự án websitebanhangmini.

## 1. Thiết lập Database

### 1.1. Cài đặt PostgreSQL (nếu chưa có)

- Tải và cài đặt PostgreSQL từ trang chủ: https://www.postgresql.org/download/
- Hoặc sử dụng Docker:
  ```bash
  docker run --name postgres -e POSTGRES_PASSWORD=your_password -p 5432:5432 -d postgres
  ```

### 1.2. Tạo Database

- Mở PostgreSQL command line hoặc sử dụng công cụ như pgAdmin
- Tạo database mới:
  ```sql
  CREATE DATABASE websitebanhangmini;
  ```

### 1.3. Cấu hình kết nối

- Sao chép file `.env.example` thành `.env`:

  ```bash
  cp backend/.env.example backend/.env
  ```

- Chỉnh sửa thông tin kết nối database trong file `.env`:
  ```
  DB_HOST=localhost
  DB_PORT=5432
  DB_NAME=websitebanhangmini
  DB_USER=postgres
  DB_PASSWORD=your_database_password
  ```

## 2. Migrate dữ liệu

### 2.1. Cài đặt dependencies

```bash
cd backend
npm install
# hoặc
pnpm install
```

### 2.2. Tạo cấu trúc database

Khi khởi động lần đầu, Sequelize sẽ tự động tạo các bảng dựa trên models đã định nghĩa. Đảm bảo `DB_SYNC=true` trong file `.env` khi chạy lần đầu.

```bash
# Khởi động server để tạo cấu trúc database
node src/server.js
```

Sau khi đã tạo cấu trúc database, bạn có thể đặt `DB_SYNC=false` để tránh việc sync lại database mỗi khi khởi động.

### 2.3. Import dữ liệu sản phẩm mẫu

Sử dụng script `import-hybrid-products.js` để import dữ liệu sản phẩm mẫu:

```bash
node scripts/import-hybrid-products.js
```

Script này sẽ:

- Xóa dữ liệu cũ (nếu có)
- Tạo các danh mục sản phẩm
- Tạo các sản phẩm với thuộc tính và biến thể

## 3. Tạo tài khoản Admin

Để tạo tài khoản admin, sử dụng script `create-admin-user.js`:

```bash
node scripts/create-admin-user.js
```

Script này sẽ tạo một tài khoản admin với thông tin:

- Email: admin@example.com
- Mật khẩu: Admin@123
- Quyền: admin

Nếu tài khoản admin đã tồn tại, script sẽ thông báo và không thay đổi mật khẩu hiện tại.

## 4. Kiểm tra

### 4.1. Kiểm tra kết nối database

```bash
# Khởi động server
node src/server.js
```

### 4.2. Đăng nhập vào trang Admin

- Truy cập: http://localhost:5175/admin-login.html
- Đăng nhập với tài khoản admin đã tạo

## 5. Xử lý sự cố

### 5.1. Lỗi kết nối database

- Kiểm tra thông tin kết nối trong file `.env`
- Đảm bảo PostgreSQL đang chạy
- Kiểm tra quyền truy cập của user database

### 5.2. Lỗi khi chạy script

- Đảm bảo đã cài đặt đầy đủ dependencies
- Kiểm tra logs để xác định nguyên nhân lỗi

### 5.3. Reset database

Nếu muốn xóa toàn bộ dữ liệu và tạo lại từ đầu:

```bash
# Xóa và tạo lại database
DROP DATABASE websitebanhangmini;
CREATE DATABASE websitebanhangmini;

# Sau đó thực hiện lại các bước migrate và tạo admin
```

## 6. Lưu ý

- Đảm bảo backup dữ liệu trước khi thực hiện các thao tác xóa hoặc reset
- Trong môi trường production, nên sử dụng mật khẩu mạnh hơn cho tài khoản admin
- Các script import dữ liệu mẫu chỉ nên sử dụng trong môi trường development
