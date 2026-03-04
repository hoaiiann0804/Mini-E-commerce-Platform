# E-Commerce Mini | Bilingual README (English / Tiếng Việt)

> Last synchronized with source code on **March 4, 2026**

## 1. Project Overview | Tổng quan dự án

| English | Tiếng Việt |
|---|---|
| **E-Commerce Mini** is a full-stack e-commerce platform with AI chatbot integration (Gemini), Stripe payment, admin management, and multilingual UI. | **E-Commerce Mini** là nền tảng thương mại điện tử full-stack, tích hợp chatbot AI (Gemini), thanh toán Stripe, trang quản trị và giao diện đa ngôn ngữ. |
| The codebase is split into `fe/` (React + TypeScript + Vite) and `be/` (Node.js + Express + Sequelize + PostgreSQL). | Mã nguồn được tách thành `fe/` (React + TypeScript + Vite) và `be/` (Node.js + Express + Sequelize + PostgreSQL). |
| Development now supports Docker Compose with dedicated scripts at root and backend levels. | Luồng phát triển hiện hỗ trợ Docker Compose với các script ở cả root và backend. |

## 2. Core Features | Tính năng chính

| English | Tiếng Việt |
|---|---|
| Authentication with JWT for customer and admin roles. | Xác thực JWT cho vai trò khách hàng và admin. |
| Product browsing with search, filters, sorting, and variants. | Duyệt sản phẩm với tìm kiếm, lọc, sắp xếp và biến thể. |
| Cart and checkout flow with Stripe payment integration. | Luồng giỏ hàng và thanh toán với tích hợp Stripe. |
| AI chatbot assistant powered by Gemini (with fallback behavior). | Trợ lý chatbot AI dùng Gemini (có cơ chế fallback). |
| Admin dashboard for users, products, orders, reviews, and warranty packages. | Dashboard admin quản lý người dùng, sản phẩm, đơn hàng, đánh giá và gói bảo hành. |
| Responsive and multilingual UI with i18n support. | Giao diện responsive và đa ngôn ngữ với i18n. |

## 3. Code-Synced Changes | Thay đổi đã đồng bộ theo mã nguồn

| Change (EN) | Thay đổi (VI) | Impact |
|---|---|---|
| Added Docker scripts in `be/package.json` and root `package.json`. | Đã thêm script Docker trong `be/package.json` và `package.json` ở root. | Faster local setup and standardized dev operations. |
| PostgreSQL host port in development config moved from `5432` to `5438` (`be/config/config.json`). | Cổng PostgreSQL phía host ở cấu hình dev đổi từ `5432` sang `5438` (`be/config/config.json`). | Avoids local port conflicts with existing PostgreSQL instances. |
| `docker-compose.dev.yml` defines `db` + `api` services with resource limits and health check. | `docker-compose.dev.yml` định nghĩa 2 service `db` + `api` với giới hạn tài nguyên và health check. | More stable local environment, services start in dependency order. |
| Admin routes remain functionally the same; formatting was normalized. | Route admin giữ nguyên hành vi; thay đổi chủ yếu là chuẩn hoá format code. | No API behavior regression from this formatting update. |

## 4. Tech Stack | Công nghệ sử dụng

| Layer | English | Tiếng Việt |
|---|---|---|
| Frontend | React 18, TypeScript, Vite, Redux Toolkit, Tailwind CSS, i18next | React 18, TypeScript, Vite, Redux Toolkit, Tailwind CSS, i18next |
| Backend | Node.js, Express, Sequelize, PostgreSQL, JWT, Swagger | Node.js, Express, Sequelize, PostgreSQL, JWT, Swagger |
| Payments | Stripe | Stripe |
| AI | Gemini API | Gemini API |
| DevOps (Local) | Docker Compose (`db`, `api`) | Docker Compose (`db`, `api`) |

## 5. Project Structure | Cấu trúc thư mục

```text
E-commrce Mini/
├─ fe/                     # Frontend (Vite + React + TS)
├─ be/                     # Backend API (Express + Sequelize)
├─ docs/                   # Supporting documentation
├─ screenshots/            # UI screenshots
├─ docker-compose.dev.yml  # Local Docker services
└─ package.json            # Root-level docker helper scripts
```

## 6. Demo Images | Hình ảnh demo

### 6.1 Home & Product Listing | Trang chủ & danh sách sản phẩm

![Home](screenshots/homepage.png)
![Product List](screenshots/ProductList_homepage.png)

### 6.2 Product Detail | Chi tiết sản phẩm

![Product Detail](screenshots/product-detail.png)

### 6.3 Cart | Giỏ hàng

![Cart](screenshots/cart.png)

### 6.4 Checkout & Stripe | Thanh toán & Stripe

![Payment](screenshots/payment.png)
![Stripe Payment](screenshots/payment_stripe.png)

### 6.5 Orders | Đơn hàng

![Order](screenshots/order.png)

### 6.6 AI Chatbot | Chatbot AI

![Chatbot](screenshots/chatbot.png)
![Chatbot 2](screenshots/chatbot2.png)

### 6.7 Admin | Quản trị

![Admin Home](screenshots/admin_home.png)
![Admin Product](screenshots/admin_product.png)
![Admin Categories](screenshots/admin_categories.png)
![Admin Order](screenshots/admin_order.png)
![Admin User](screenshots/admin_user.png)
![Admin Warranty](screenshots/admin_warranty.png)

## 7. Run Locally (Without Docker) | Chạy local (không dùng Docker)

### 7.1 Requirements | Yêu cầu

| English | Tiếng Việt |
|---|---|
| Node.js >= 18 | Node.js >= 18 |
| PostgreSQL >= 15 | PostgreSQL >= 15 |
| npm / pnpm / yarn | npm / pnpm / yarn |

### 7.2 Install & Start | Cài đặt và chạy

```bash
# Backend
cd be
npm install
npm run dev

# Frontend (new terminal)
cd fe
npm install
npm run dev
```

| English | Tiếng Việt |
|---|---|
| Frontend default URL: `http://localhost:5173` | URL mặc định frontend: `http://localhost:5173` |
| Backend default URL: `http://localhost:8888` | URL mặc định backend: `http://localhost:8888` |
| API docs: `http://localhost:8888/api-docs` | Tài liệu API: `http://localhost:8888/api-docs` |

## 8. Run with Docker Compose | Chạy bằng Docker Compose

### 8.1 Root scripts | Script ở root

```bash
npm run docker:up
npm run docker:up:build
npm run docker:logs
npm run docker:logs:api
npm run docker:ps
npm run docker:down
npm run docker:down:v
```

### 8.2 Backend scripts | Script trong `be/`

```bash
cd be
npm run docker:up
npm run docker:up:build
npm run docker:logs
npm run docker:down
```

### 8.3 Service Mapping | Ánh xạ service

| Service | Container Port | Host Port | Notes |
|---|---:|---:|---|
| db (PostgreSQL) | 5432 | 5438 | Host uses 5438 to prevent collision |
| api (Backend) | 8888 | 8888 | Depends on healthy db service |

## 9. Environment Variables | Biến môi trường

### 9.1 Root `.env` (Docker compose db bootstrap)

| Variable | Type | English | Tiếng Việt |
|---|---|---|---|
| DB_HOST | string | Database host for compose/network setup | Host CSDL cho cấu hình compose/network |
| DB_PORT | number | Database port | Cổng CSDL |
| DB_NAME | string | Database name | Tên CSDL |
| DB_USER | string | Database user | Tài khoản CSDL |
| DB_PASSWORD | string | Database password | Mật khẩu CSDL |

### 9.2 Backend `be/.env`

| Variable | Type | English | Tiếng Việt |
|---|---|---|---|
| NODE_ENV | enum | development / test / production | Môi trường chạy |
| PORT | number | Backend listen port (default 8888) | Cổng backend (mặc định 8888) |
| API_URL | string | Public API URL | URL public của API |
| DB_HOST DB_PORT DB_NAME DB_USER DB_PASSWORD | string/number | PostgreSQL connection settings | Cấu hình kết nối PostgreSQL |
| DB_SYNC | boolean string | Auto-sync Sequelize models in development | Tự đồng bộ model Sequelize ở development |
| JWT_SECRET JWT_REFRESH_SECRET | string | JWT signing secrets | Khóa ký JWT |
| JWT_EXPIRES_IN JWT_REFRESH_EXPIRES_IN | string | Token TTL | Thời gian sống token |
| EMAIL_* | string/number/bool | SMTP email configuration | Cấu hình SMTP email |
| FRONTEND_URL | string | Allowed frontend origin for production CORS | Origin frontend cho CORS ở production |
| REDIS_* | string/number | Redis settings (if enabled) | Cấu hình Redis (nếu bật) |
| STRIPE_SECRET_KEY | string | Stripe secret key | Khóa bí mật Stripe |
| STRIPE_WEBHOOK_SECRET | string | Stripe webhook verification secret | Khóa xác thực webhook Stripe |
| GEMINI_API_KEY | string | Gemini API key | API key Gemini |
| UPLOAD_DIR | string | Upload directory path | Thư mục upload |
| MAX_FILE_SIZE | number | Upload file size limit | Giới hạn kích thước tệp |
| DATABASE_URL | string | Optional full DB connection URI | URI kết nối DB đầy đủ (tuỳ chọn) |

### 9.3 Frontend `fe/.env`

| Variable | Type | English | Tiếng Việt |
|---|---|---|---|
| VITE_API_URL | string | Backend API base URL | URL API backend |
| VITE_BASE_URL | string | Frontend base URL | URL gốc frontend |
| VITE_APP_NAME | string | App display name | Tên hiển thị ứng dụng |
| VITE_APP_VERSION | string | App version metadata | Phiên bản ứng dụng |
| VITE_BUILD_SOURCEMAP | boolean string | Generate source maps for build | Bật/tắt source map khi build |
| VITE_STRIPE_PUBLISHABLE_KEY | string | Stripe publishable key | Khóa public Stripe |
| VITE_GEMINI_API_KEY | string | Gemini key used client-side features | Gemini key cho tính năng phía client |

## 10. Admin API (Validated Parameters) | API Admin (tham số đã validate)

Base path: `/api/admin`  
Auth: `adminAuthenticate` middleware required for all routes.

### 10.1 Query Parameters (list endpoints)

| Parameter | Type | Rules | English | Tiếng Việt |
|---|---|---|---|---|
| page | integer | >= 1 | Page index for pagination | Trang hiện tại phân trang |
| limit | integer | 1..100 | Items per page | Số phần tử mỗi trang |
| sortBy | string | optional | Sort field | Trường sắp xếp |
| sortOrder | enum | ASC / DESC (case-insensitive) | Sort direction | Chiều sắp xếp |

### 10.2 Stats Endpoint

`GET /api/admin/stats`

| Parameter | Type | Rules | English | Tiếng Việt |
|---|---|---|---|---|
| startDate | ISO 8601 string | required in controller flow | Start date for analytics range | Ngày bắt đầu thống kê |
| endDate | ISO 8601 string | required in controller flow | End date for analytics range | Ngày kết thúc thống kê |
| groupBy | enum | hour / day / week / month | Aggregation granularity | Độ hạt tổng hợp dữ liệu |

### 10.3 Update Order Status

`PUT /api/admin/orders/:id/status`

| Field | Type | Rules | English | Tiếng Việt |
|---|---|---|---|---|
| id | UUID | path param | Order identifier | Mã đơn hàng |
| status | enum | pending processing shipped delivered cancelled | Target status | Trạng thái cần cập nhật |
| note | string | max length 500 | Admin note | Ghi chú của admin |

### 10.4 Update User

`PUT /api/admin/users/:id`

| Field | Type | Rules | English | Tiếng Việt |
|---|---|---|---|---|
| id | UUID | path param | User identifier | Mã người dùng |
| firstName | string | 2..50 | Given name | Tên |
| lastName | string | 2..50 | Family name | Họ |
| phone | string | optional | Phone number | Số điện thoại |
| role | enum | customer / admin / manager | User role | Vai trò người dùng |
| isEmailVerified | boolean | optional | Email verification flag | Cờ xác thực email |
| isActive | boolean | optional | Activation flag | Cờ kích hoạt tài khoản |

## 11. Frontend Data Types (Core) | Kiểu dữ liệu frontend (chính)

### 11.1 ProductFilters (from `fe/src/types/product.types.ts`)

| Field | Type | English | Tiếng Việt |
|---|---|---|---|
| categoryId | string | Filter by category | Lọc theo danh mục |
| search | string | Search keyword | Từ khóa tìm kiếm |
| minPrice / maxPrice | number | Price range filter | Lọc theo khoảng giá |
| sort | 'price_asc' \| 'price_desc' \| 'newest' \| 'popular' | Sorting mode | Chế độ sắp xếp |
| page / limit | number | Pagination controls | Điều khiển phân trang |
| brand / color / size | string[] | Attribute-based filters | Bộ lọc theo thuộc tính |
| [key: string] | any | Dynamic attribute filters | Bộ lọc động mở rộng |

### 11.2 ProductFormData (admin product form)

| Field | Type | English | Tiếng Việt |
|---|---|---|---|
| name, description, shortDescription | string | Core product content | Nội dung sản phẩm cơ bản |
| price, compareAtPrice | number | Pricing fields | Trường giá |
| stockQuantity, inStock | number, boolean | Stock control | Quản lý tồn kho |
| status | 'active' \| 'inactive' \| 'draft' | Product publish status | Trạng thái sản phẩm |
| condition | 'new' \| 'like-new' \| 'used' \| 'refurbished' | Product condition | Tình trạng sản phẩm |
| categoryIds | string[] | Category associations | Liên kết danh mục |
| attributes, variants, specifications | structured arrays | Variant-capable product model | Mô hình sản phẩm có biến thể |
| warrantyPackageIds | string[] | Linked warranty plans | Liên kết gói bảo hành |

## 12. Runtime Logic Notes | Ghi chú logic vận hành

| English | Tiếng Việt |
|---|---|
| Backend starts by authenticating DB connection, loading models, and optionally syncing schema (`DB_SYNC=true` in development). | Backend khởi động bằng cách xác thực kết nối DB, nạp model, và có thể đồng bộ schema (`DB_SYNC=true` ở development). |
| Docker Compose runs `db` and `api` concurrently, with `api` waiting until DB health check passes. | Docker Compose chạy `db` và `api` đồng thời (concurrent), `api` chỉ chạy sau khi health check của DB thành công. |
| CORS in development allows localhost ports 3000, 5173, 5174, 5175; production uses `FRONTEND_URL`. | CORS ở development cho phép localhost 3000, 5173, 5174, 5175; production dùng `FRONTEND_URL`. |
| Uploaded files are served via `/uploads` static route. | Tệp upload được public qua route tĩnh `/uploads`. |

## 13. Useful Endpoints | Endpoint hữu ích

| Endpoint | English | Tiếng Việt |
|---|---|---|
| GET /api/health | API health check | Kiểm tra trạng thái API |
| GET /api-docs | Swagger UI | Giao diện Swagger |
| GET /api-docs.json | OpenAPI JSON spec | Đặc tả OpenAPI dạng JSON |

## 14. Notes | Lưu ý

| English | Tiếng Việt |
|---|---|
| Do not commit real secrets in `.env` files. | Không commit secret thật vào file `.env`. |
| If local PostgreSQL already uses 5432, keep Docker mapped to 5438 as configured. | Nếu máy đã dùng PostgreSQL ở 5432, giữ mapping Docker ở 5438 như hiện tại. |
| The admin API is protected; test with a valid admin token/session. | API admin được bảo vệ; cần token/session admin hợp lệ để test. |

## 15. License | Giấy phép

MIT License.
