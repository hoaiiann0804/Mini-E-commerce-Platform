# BÁO CÁO ĐÁNH GIÁ DỰ ÁN & KẾ HOẠCH TÁI CẤU TRÚC

**Dự án:** E-Commerce Mini (`be/` + `fe/`)
**Ngày lập:** 2026-11-12
**Phiên bản:** 1.0 (Proposed — chờ chủ dự án review)
**Phạm vi:** toàn bộ backend, frontend, database, hạ tầng, quy trình
**Phương pháp:** đọc mã nguồn + đối chiếu migration + kiểm chứng trực tiếp các luồng rủi ro cao

---

## 0. CÁCH ĐỌC TÀI LIỆU

Tài liệu gồm 3 phần:

1. **Đánh giá** (mục 1–5): hiện trạng, điểm mạnh/yếu, lỗi đã kiểm chứng.
2. **Quyết định kiến trúc** (mục 6–7): Modular Monolith + Clean Architecture chọn lọc.
3. **Kế hoạch triển khai** (mục 8–12): phase, tiêu chí nghiệm thu, AI Agent, KPI.

Mỗi phát hiện nghiêm trọng đều có cột **Trạng thái bằng chứng**:

- `Verified`: đã đọc trực tiếp file và xác nhận.
- `Cần xác nhận`: đọc qua khảo sát/đường code, cần chạy lệnh kiểm chứng ở Phụ lục A trước khi sửa.

> **Cảnh báo:** tài liệu này không chứa giá trị secret. Không dán nội dung `.env` vào báo cáo, issue, PR hay chat.

---

## 1. TÓM TẮT ĐIỀU HÀNH

### 1.1 Kết luận

Dự án có **tư duy nghiệp vụ tốt hơn mặt bằng chung** (transaction, pessimistic lock, inventory ledger, idempotency, graceful degradation). Tuy nhiên dự án **chưa đạt mức production** vì:

- Còn lỗi tài chính có thể gây **mất tiền thật** (webhook, refund, bank transfer).
- **Dữ liệu production và secret từng nằm trong git**.
- Tồn tại lỗ hổng **IDOR/leo thang quyền**.
- Kiến trúc đang ở trạng thái **hai mô hình chồng nhau**, thiếu ranh giới module.
- Không có gate chất lượng: test gần như không có, CI luôn xanh.

### 1.2 Scorecard

| Trục | Điểm | Nhận xét ngắn |
|---|---:|---|
| Nghiệp vụ & correctness | 7/10 | Tư duy đúng, nhưng lỗi biên (webhook/refund/bank transfer) |
| Thiết kế database | 5/10 | Nhiều FK/index tốt; thiếu soft delete, FK, index, đa nguồn sự thật |
| Bảo mật | 3/10 | Backup + secret trong git, chatbot IDOR, upload mở, leo thang quyền |
| Hiệu năng | 4/10 | Không cache, N+1, thiếu index, pool 5, bundle lớn |
| Frontend / UI-UX | 5/10 | Nền tốt (lazy route, token, dark mode), nhiều dead code, tính tiền sai |
| Design system | 4/10 | Có token nhưng bị phá vỡ bởi palette thô và 5 hệ UI |
| Kiến trúc | 4/10 | Layer-first + 1 feature module lẻ, không có dependency rule |
| Testing & CI | 2/10 | `jest --passWithNoTests`, CI không gate |
| Observability | 2/10 | 0 request-id, 0 metrics, health check giả |
| Tài liệu | 8/10 | README + docs phong phú, nhưng đã lệch code |

**Tổng: ~4,8/10 — prototype tốt, chưa production-ready.**

### 1.3 Năm rủi ro hàng đầu

1. **Mất tiền**: webhook Stripe không verify được, refund sai đơn vị tiền, đơn chuyển khoản tự hủy sau 15 phút.
2. **Lộ dữ liệu**: `backup.dump` / `backup.custom` đang được track trong git; secret từng nằm trong lịch sử.
3. **Chatbot IDOR + upload không auth**: ghi/đọc giỏ hàng user khác, lạm dụng storage.
4. **Leo thang quyền**: `manager` tự nâng thành `admin`.
5. **Toàn vẹn dữ liệu**: thiếu FK/index, `order_items` CASCADE phá lịch sử, nhiều nguồn sự thật cho stock/price/rating.

---

## 2. PHƯƠNG PHÁP & PHẠM VI

- Đọc toàn bộ `be/src`, `be/src/migrations`, `fe/src`, `ops/`, `.github/`, `render.yaml`.
- Đối chiếu model ↔ migration ↔ truy vấn thực tế.
- Kiểm chứng trực tiếp các luồng: checkout, payment, coupon, inventory, auth, chatbot, upload.
- Không chạy thay đổi nào lên database hay môi trường production.
- Không đọc/in giá trị secret; chỉ kiểm tra sự tồn tại và vị trí.

**Ngoài phạm vi:** pentest chuyên sâu, load test thực tế, đánh giá pháp lý (PCI-DSS, nghị định dữ liệu cá nhân), đánh giá chất lượng nội dung sản phẩm.

---

## 3. ĐIỂM MẠNH (GIỮ VÀ PHÁT HUY)

| # | Điểm mạnh | Bằng chứng |
|---|---|---|
| 1 | Checkout có transaction bao trùm cart → stock → coupon → order; khóa pessimistic theo thứ tự id ổn định; giá lấy live từ DB | `be/src/controllers/order.controller.js:60-108`, `be/src/services/inventory.service.js:19-44` |
| 2 | Inventory ledger ở tầng DB: `CHECK` cân bằng kho, append-only, bắt buộc context khi đổi kho | `be/src/migrations/20260921090000-inventory-ledger.js` |
| 3 | Idempotency cho thao tác kho admin bằng `pg_advisory_xact_lock` + fingerprint | `be/src/services/inventory.service.js:90-118` |
| 4 | Graceful degradation Redis: Redis chết app vẫn chạy | `be/src/config/redis.js:52-107` |
| 5 | Keyset pagination cho danh sách sản phẩm | `be/src/controllers/product.controller.js:47-113` |
| 6 | Coupon chống race đúng: `FOR UPDATE` + increment atomic | `be/src/services/coupon.service.js:69-166` |
| 7 | Bảo mật cơ bản: helmet, CORS whitelist, login rate-limit, account lock, verify email, bcrypt, refresh token lưu DB | `be/src/app.js:26-99`, `be/src/modules/auth/auth.helper.js:39-49` |
| 8 | Docker multi-stage, non-root, dumb-init, healthcheck | `be/Dockerfile` |
| 9 | FE: lazy route, `strict: true`, bộ Loading/Error state, token teal/cam, dark mode phủ rộng, i18n key gần parity | `fe/src/routes/AppRoutes.tsx`, `fe/src/components/common/*`, `fe/tailwind.config.js` |
| 10 | Tài liệu phong phú: README song ngữ + Mermaid, 15 file `docs/` | `README.md`, `docs/` |

---

## 4. ĐIỂM YẾU THEO 6 TRỤC

### 4.1 Yêu cầu phi chức năng (NFR)

| Trục NFR | Hiện trạng | Đánh giá |
|---|---|---|
| Correctness tài chính | Webhook Stripe luôn 400 do sai path; refund sai đơn vị tiền; thanh toán muộn sau expire không refund; bank transfer tự hủy 15 phút | Nghiêm trọng |
| Availability | Health check không kiểm DB/Redis; `unhandledRejection` → `process.exit(1)`; Render free 1 instance 512MB | Kém |
| Bảo mật | Backup DB trong git; secret trong lịch sử; chatbot IDOR; upload không auth; manager nâng quyền; OAuth thiếu `state` | Nghiêm trọng |
| Scalability | Pool 5 connection; không cache; cleanup job 60s không distributed lock; rate-limit in-memory | Trung bình |
| Maintainability | 3 kiểu kiến trúc BE; 2 thư mục migration; ~5.600 dòng form FE chết; 5 bản rich text editor | Kém |
| Testability | `jest --passWithNoTests`; 1 test thật; integration test không chạy; CI `|| echo` | Nghiêm trọng |
| Observability | 242 `console.*`; 0 request-id; 0 metrics; 0 tracing; log file ephemeral | Kém |
| i18n / Accessibility | 34/53 page không dùng `useTranslation`; modal/select/rating không dùng được bằng bàn phím | Trung bình |

### 4.2 Thiết kế database

**Mạnh:** UUID PK, phần lớn tiền `DECIMAL(12,2)`, nhiều FK hợp lý, index `products` đầu tư, ledger bất biến.

**Yếu:**

| # | Vấn đề | Dẫn chứng | Sửa |
|---|---|---|---|
| 1 | `orders.user_id` không có FK | `be/src/migrations/20251101045620-create-orders-table.js:17-20` | Thêm FK + index `(user_id, created_at DESC)` |
| 2 | `order_items.product_id ON DELETE CASCADE` phá lịch sử đơn | `be/src/migrations/20260408090700-create-order-items-table.js:22-31` | Đổi `RESTRICT` + soft delete sản phẩm |
| 3 | `orders` gần như không có index, cleanup quét mỗi 60s | migration orders + `be/src/jobs/orderCleanup.job.js:39-54` | Partial index `(status, expires_at) WHERE payment_status='pending'` |
| 4 | `refresh_tokens` không index `token`, lưu plaintext | migration 20260527071928 + `be/src/modules/auth/auth.repository.js:66-77` | Unique index + lưu SHA-256 |
| 5 | `reviews` không unique `(product_id, user_id)` | `be/src/migrations/20260408090500-create-reviews-table.js` | Unique index + `(product_id, created_at DESC)` |
| 6 | Đa nguồn sự thật cho stock/price/rating/sold | `be/src/models/productVariant.js:157-256`, `be/src/models/hooks.js` (dead) | Chọn 1 write-path, còn lại là read model |
| 7 | Cart 2 nguồn (DB + localStorage), không unique cart active | `fe/src/features/cart/cartSlice.ts:13`, `be/src/controllers/cart.controller.js:15-27` | Server authoritative + partial unique index |
| 8 | Migration trùng/lặp, 1 thư mục migration chết | `.sequelizerc` chỉ trỏ `src/migrations` | Gộp, xóa `src/database`, đánh dấu no-op |
| 9 | Lạm dụng JSON/ARRAY cho ảnh/thuộc tính/specs | `product.js`, `productVariant.js`, `productSpecification.js` | Chuẩn hóa bảng quan hệ, JSONB chỉ cho snapshot |
| 10 | Không soft delete; 18 cột shipping + 18 cột billing trùng | các model | Thêm `deleted_at`, tách `order_addresses` |
| 11 | Thiếu CHECK cho rating/quantity/total | migrations | Thêm CHECK constraint |
| 12 | `products.slug` regenerate mỗi lần validate → URL đổi | `be/src/models/product.js:249-261` | Chỉ tạo slug khi insert hoặc khi đổi tên có chủ đích |

### 4.3 UI/UX

| Vấn đề | Bằng chứng | Tác động |
|---|---|---|
| Tính tiền client sai & lẫn USD/VND | `fe/src/pages/CartPage.tsx:70-76` (ship 5.99 USD) vs BE ship 30.000 VND | Khách thấy tổng khác BE |
| Mock data chạy production | `fe/src/pages/CategoryPage.tsx:3-41` dùng `mockProducts` + `setTimeout` | Trang danh mục hiển thị dữ liệu giả |
| ~5.600 dòng dead code vẫn build | 5 bản CreateProduct*, 5 bản RichTextEditor, 2 LoginPage, 3 chat widget | Bundle phình, bảo trì nhầm |
| Trang test lọt router production | `fe/src/routes/AppRoutes.tsx:61-63` | Lộ trang test |
| 4 cơ chế gọi API | RTKQ `api` + RTKQ `attributeApi` (không token) + Axios + `fetch('/api/...')` | Admin CRUD thuộc tính lỗi 401 |
| Không có ErrorBoundary toàn cục | chỉ có `EditorErrorBoundary` | 1 lỗi render = trắng app |
| Accessibility kém | Modal không focus trap; Rating không keyboard; Input thiếu `id`; `<html lang="en">` | Không đạt WCAG |
| i18n phủ 19/53 page | ShopPage/admin hardcode VI/EN | Trải nghiệm không nhất quán |
| Mobile nav là dropdown absolute | `fe/src/components/layout/Header.tsx:360-502` | UX mobile kém |

### 4.4 Cách giải quyết bài toán

**Mạnh:** "never trust the client", ledger, idempotency, fallback.

**Yếu:**

- Không có tầng domain/service thống nhất: logic rải ở `controllers/`, `services/`, `shared/services/`, `modules/`.
- Lỗi "một ký tự" gây hỏng chức năng: `/api/payments/webhook` vs `/api/payment/webhook`; `resetPassword(token,password)` vs `resetPassword({token,password})`; `forgotPassword` thiếu `await`.
- Payment I/O nằm trong transaction giữ row lock → giữ connection qua network, pool 5 dễ nghẽn.
- Không có compensation khi thanh toán muộn.
- `requireSuperAdmin` được viết nhưng không dùng.
- State machine thiếu `returned/refunded`; sold_count không đối soát.
- Hai nguồn auth: `be/src/controllers/auth.controller.js` bị comment toàn bộ 383 dòng.

### 4.5 Hiệu năng

| # | Hotspot | Bằng chứng | Sửa |
|---|---|---|---|
| 1 | 4× `ILIKE %q%` + cast JSONB, `findAndCountAll`, limit không cap | `be/src/controllers/product.controller.js:1136-1159` | `tsvector`/trigram, cap limit 100, bỏ COUNT hoặc cache |
| 2 | Include toàn bộ reviews để tính avg dù có `avg_rating` | product controller list/featured/related/best-sellers | Dùng cột denormalized; tách endpoint review |
| 3 | Dashboard 13 query tuần tự | `be/src/controllers/admin.controller.js:47-116` | Gộp query `FILTER`, cache 60s |
| 4 | Không cache product list/filter/detail | toàn BE | Cache-aside Redis 30–120s + version key |
| 5 | Pool 5, `acquire: 60s`, không `statement_timeout` | `be/src/config/database.js:55-59` | Pool 10–20, `statement_timeout=5s` |
| 6 | Body limit 50MB cho mọi API | `be/src/app.js:106-116` | 1MB + route upload riêng |
| 7 | Trigger stock `SUM` mỗi row + hook + controller cùng ghi | `be/src/migrations/20260330103652-add-stock-sync-trigger.js` | Incremental update, bỏ hook |
| 8 | view_count UPDATE cùng 1 row mỗi lượt xem | `be/src/shared/services/product/productAnalytics.service.js:155-158` | Redis INCR + flush batch |
| 9 | Bundle entry 675KB, Dashboard 442KB, AddressPage 277KB | `fe/dist` | `manualChunks` cho antd/mui/quill/recharts/leaflet |
| 10 | 46 `<img>`, chỉ 5 lazy, 0 srcset | FE | Lazy + responsive images + Cloudinary transform |

### 4.6 Design system

**Hiện trạng:** có token (primary teal `#2AACA7`, secondary cam `#FF755E`, neutral, spacing, radius, shadow) nhưng bị phá vỡ:

- 2.872 chỗ dùng token vs **1.377 chỗ dùng palette thô**; 470 inline `style=`.
- **5 kiểu button**, 2 modal, 2 theme provider, 5 rich text editor.
- Class Tailwind không tồn tại bị bỏ qua im lặng: `sm:pt-18` (`fe/src/components/layout/MainLayout.tsx:26`), `neutral-750`, `neutral-950`.
- Trộn 5 hệ UI: AntD + MUI + Tailwind + SCSS + CSS Module.

**Đề xuất:** Tailwind + Radix UI (headless) + CVA; token 3 tầng primitive → semantic → component; ESLint cấm palette thô/inline style; Storybook + visual regression; chỉ giữ 1 Button/Modal/Select/Input/RichTextEditor. Giữ AntD **chỉ trong admin** nếu cần tốc độ.

---

## 5. LỖI NGHIÊM TRỌNG ĐÃ KIỂM CHỨNG (P0)

> P0 = có thể gây mất tiền, lộ dữ liệu, hoặc leo thang quyền. Phải xử lý trước mọi việc kiến trúc.

| ID | Vấn đề | Bằng chứng | Trạng thái | Cách sửa | Effort |
|---|---|---|---|---|---|
| P0-01 | Webhook Stripe luôn 400 do sai path (`/api/payments/webhook` vs `/api/payment/webhook`) | `be/src/app.js:111`, `be/src/routes/index.js:34`, `be/src/routes/payment.routes.js:8-12` | Verified | Sửa path + test `stripe listen` | 0.5 ngày |
| P0-02 | Reset password hỏng do sai signature | `be/src/modules/auth/auth.controller.js:106` vs `be/src/modules/auth/auth.service.js:160` | Verified | Gọi `resetPassword({ token, password })` | 0.5 ngày |
| P0-03 | `forgotPassword` thiếu `await` → có thể `unhandledRejection` giết process | `be/src/modules/auth/auth.service.js:153` | Verified | Thêm `await`; đổi unhandledRejection sang log + alert | 0.5 ngày |
| P0-04 | Chatbot IDOR: route không auth, tin `userId` từ body, ghi/đọc giỏ user khác | `be/src/routes/chatbot.routes.js:74`, `be/src/controllers/chatbot.controller.js:32-58` | Verified | Bắt buộc auth, `userId` từ `req.user`, validate cartAction | 1 ngày |
| P0-05 | Upload test endpoint không auth | `be/src/routes/image.routes.js:172-173` | Cần xác nhận | Xóa hoặc chặn production + rate limit | 0.5 ngày |
| P0-06 | Manager tự nâng quyền admin | `be/src/middlewares/adminAuth.js:63-75` (không dùng), `be/src/routes/admin.routes.js:54-58` | Verified | `requireSuperAdmin` + cấm tự đổi role | 0.5 ngày |
| P0-07 | Backup DB production bị track trong git | `git ls-files` → `backup.dump`, `backup.custom` | Verified | `git rm --cached`, `filter-repo`, rotate secret, `.gitignore` | 1 ngày |
| P0-08 | CORS wildcard `*.vercel.app` + credentials | `be/src/app.js:65-68` | Verified | Whitelist chính xác; wildcard chỉ ở dev | 0.5 ngày |
| P0-09 | `confirmPayment` thiếu ownership + không so amount | `be/src/controllers/payment.controller.js:108-112` | Verified | Thêm `userId`, so `paymentTransactionId` + amount | 0.5 ngày |
| P0-10 | Đơn bank transfer tự hủy sau 15 phút | `be/src/jobs/orderCleanup.job.js:39-54` | Cần xác nhận | Không set `expiresAt` 15m cho bank transfer; thêm `mark-paid` | 1 ngày |
| P0-11 | Refund sai đơn vị tiền (VND → USD), không idempotent, không hoàn kho | `be/src/controllers/payment.controller.js:509-544`, `be/src/shared/services/payment/stripe.service.js:165-188` | Cần xác nhận | Tính theo quote, `idempotencyKey`, check `amount <= paid`, hoàn kho/coupon | 1.5 ngày |
| P0-12 | Lộ sản phẩm draft qua API public (`?status=`) | `be/src/controllers/product.controller.js:117` | Verified | Bỏ tham số `status` khỏi public | 0.5 ngày |
| P0-13 | OAuth thiếu `state`, token lộ qua query string | `be/src/config/passport.js:11-33`, `be/src/modules/auth/auth.controller.js:136-140` | Cần xác nhận | Bật `state:true`, set refresh token bằng httpOnly cookie | 1 ngày |

**Tổng P0: ~8–10 ngày công.**

---

## 6. QUYẾT ĐỊNH KIẾN TRÚC (ADR)

### 6.1 Bối cảnh

- Monolith Express + Sequelize, 1 database PostgreSQL, 1 team nhỏ.
- Checkout là use case xuyên 6 domain (cart, catalog, inventory, coupon, order, payment, notification) cần **ACID**.
- Đã bật `Sequelize.useCLS` → transaction lan xuyên module.
- Hiện trạng: layer-first cho 15 domain + feature module lẻ cho `auth`; model gọi service; 2 cây code song song.

### 6.2 Quyết định

**Chọn Modular Monolith + Clean Architecture chọn lọc (Selective Clean / Hexagonal at the edges).**

- **Một deployable duy nhất.**
- **Ranh giới theo domain** (module), mỗi module có public API qua `index.js`.
- **Bên trong module:** 3 lớp thực dụng `controller → application service → repository → model`, cộng domain functions cho invariant.
- **Full Clean/Hexagonal chỉ ở:** `payments`, `inventory`, `checkout` (và ports cho `notifications`, `ai`, `storage`).
- **Admin là delivery layer**, không phải domain.

### 6.3 Vì sao không chọn full Clean cho mọi module

- Team nhỏ; +40–60% file và +20–30% thời gian mỗi feature.
- Nút thắt hiện tại là **correctness và nhất quán**, không phải domain isolation.
- Nguy cơ "Clean Architecture cosplay": interface 1 implementation, use case 1 method, entity anemic, DTO map 3 lớp không lý do.

### 6.4 Vì sao không chọn microservices

- Checkout cần ACID; tách sớm = saga + eventual consistency + hạ tầng mới.
- Team chưa có test, chưa có observability, chưa có CI gate.
- Ranh giới module là **đường cắt chuẩn bị sẵn**; chỉ tách khi thật cần.

### 6.5 Vì sao không giữ layer-first

- Controller god object (2.021 dòng), import chéo model, circular dependency.
- Không có nơi nào enforce ranh giới.
- Thêm feature mới càng làm coupling tăng.

### 6.6 Nguyên tắc one-way door / two-way door

| Quyết định | Tính chất | Thời điểm |
|---|---|---|
| Module map + data ownership | One-way door | **Trước khi viết code** |
| Dependency rule + public API | One-way door | **Trước** |
| Ports cho Stripe/email/storage/AI | One-way door | **Trước, ít nhất interface** |
| Domain model tiền/kho/state machine | One-way door | **Trong lúc viết module rủi ro** |
| Full Clean layers (entity/usecase/DTO/mapper) | Two-way door | **Sau, từng module** |
| Test doubles / architecture tests | Two-way door | **Sau** |
| Microservices | Rất đắt | **Rất sau** |

**Kết luận về thời điểm:** không chờ codebase xong mới áp kiến trúc. Phần one-way door phải chốt trước; phần two-way door có thể nâng dần.

---

## 7. KIẾN TRÚC ĐÍCH

### 7.1 Module map

| Module | Chủ sở hữu dữ liệu | Trạng thái hiện tại |
|---|---|---|
| `identity` | `users`, `refresh_tokens`, `addresses` | `modules/auth` + `modules/user` (gộp ở Phase 3) |
| `catalog` | `products`, `product_variants`, `categories`, `attribute_*`, `product_specifications`, `images`, `warranty_packages` | `controllers/product|category|attribute|warranty*` |
| `cart` | `carts`, `cart_items` | `controllers/cart.controller.js` |
| `checkout` | Không sở hữu bảng (orchestrator) | logic nằm trong `order.controller.js` |
| `orders` | `orders`, `order_items` | `controllers/order.controller.js` |
| `payments` | `payment_events` (mới), mapping payment intent | `controllers/payment.controller.js` |
| `inventory` | `inventory_transactions`, `inventory_requests` | `services/inventory.service.js` |
| `coupons` | `coupons` | `services/coupon.service.js` |
| `reviews` | `reviews`, `review_feedback`, `review_reply` | `controllers/review.controller.js` |
| `wishlist` | `wishlists` | `controllers/wishlist.controller.js` |
| `notifications` | Không sở hữu bảng (email/outbox) | `shared/services/email` |
| `ai` | Không sở hữu bảng | `shared/services/chatbot` |
| `admin` | Không sở hữu bảng (delivery layer) | `controllers/admin.controller.js` (2.021 dòng) |

### 7.2 Cây thư mục đích

```text
be/src/
├── bootstrap/
│   ├── server.js
│   ├── app.js
│   └── container.js              # composition root, không logic
├── shared/                       # CHỈ hạ tầng generic
│   ├── db/{sequelize.js, associations.js, transaction.js}
│   ├── http/{errorHandler.js, validate.js, authenticate.js, rateLimit.js}
│   ├── errors/AppError.js
│   ├── logger/
│   ├── events/eventBus.js
│   └── utils/{money.js, ids.js, pagination.js}
├── modules/
│   ├── identity/
│   │   ├── index.js
│   │   ├── identity.routes.js
│   │   ├── identity.controller.js
│   │   ├── application/identity.service.js
│   │   ├── domain/passwordPolicy.js
│   │   ├── infra/{user.model.js, refreshToken.model.js, identity.repository.js}
│   │   ├── identity.validator.js
│   │   └── __tests__/
│   ├── catalog/
│   ├── cart/
│   ├── checkout/application/checkout.service.js
│   ├── orders/
│   ├── payments/
│   │   ├── application/payment.service.js
│   │   ├── domain/paymentStateMachine.js
│   │   ├── ports/paymentGateway.js
│   │   └── infra/{stripe.gateway.js, bankTransfer.gateway.js, paymentEvent.model.js}
│   ├── inventory/
│   ├── coupons/
│   ├── reviews/
│   ├── wishlist/
│   ├── notifications/
│   └── ai/
└── admin/                        # delivery layer
    ├── admin.routes.js
    └── controllers/{users,products,orders,reviews,coupons}.controller.js
```

### 7.3 Quy tắc phụ thuộc (bắt buộc)

```text
routes → controller → application service → repository → model
                  ↘ domain (pure, không import DB)
```

| ID | Quy tắc |
|---|---|
| R1 | Controller chỉ parse HTTP, không query DB, không gọi vendor. |
| R2 | Model **không** import application/domain/service. |
| R3 | Module khác chỉ import qua `index.js`; cấm import `infra/` của module khác. |
| R4 | Mỗi bảng có đúng **1 module ghi**; module khác đọc qua query service/read model. |
| R5 | `shared/` chỉ chứa hạ tầng generic; nếu tên file có domain → sai chỗ. |
| R6 | Không gọi Stripe/email/AI trong transaction DB. |
| R7 | Side effect qua domain event hoặc outbox. |
| R8 | `admin` là delivery layer, không phải domain. |

### 7.4 Transaction & event

- Application service mở transaction; CLS lan truyền xuống repository.
- External I/O (Stripe, Resend, Gemini, Cloudinary) **ngoài** transaction.
- Side effect sau commit qua `eventBus` (in-process) hoặc `outbox_events` (bền vững).
- Payment dùng `payment_events(event_id UNIQUE)` để chống trùng và làm compensation.

### 7.5 Mức Clean theo module

| Module | Mức |
|---|---|
| `payments` | Full Hexagonal (port + adapter + state machine + events) |
| `inventory` | Domain thuần + repository + ledger invariant |
| `checkout` | Application orchestrator, không sở hữu bảng |
| `catalog`, `orders`, `cart`, `identity`, `reviews` | 3 lớp + domain functions |
| `coupons`, `wishlist`, category/attribute/warranty | Thin CRUD |

### 7.6 Enforce

- `dependency-cruiser` chặn vi phạm R1–R5.
- ESLint config BE (hiện chưa có) + FE (hiện chưa có).
- Mỗi module có `__tests__` chạy độc lập.
- ADR ghi lý do; không để 6 tháng sau có người thêm Clean layer tùy tiện.

---

## 8. KẾ HOẠCH TRIỂN KHAI

### 8.1 Tổng quan

| Phase | Thời lượng | Mục tiêu | Kết quả |
|---|---|---|---|
| **P0 — Chặn mất tiền & lộ dữ liệu** | 1–2 tuần | Sửa 13 lỗi P0 | Không còn lỗi tài chính/bảo mật nghiêm trọng |
| **P1 — Ổn định dữ liệu & gate chất lượng** | 2 tuần | FK/index/constraint, CI gate, health check, pricing server-side | Nền dữ liệu đúng, CI có tác dụng |
| **P2 — Kiến trúc: module rủi ro cao** | 2–3 tuần | Tách `orders`, `payments`, `inventory`, `checkout` | Ranh giới đầu tiên, test được tiền/kho |
| **P3 — Kiến trúc: catalog & cart** | 2–3 tuần | Tách `catalog`, `cart`; xé `product.controller` 1.740 dòng | Domain lớn nhất vào khuôn |
| **P4 — Hoàn thiện & khóa cứng** | 2 tuần | `identity`, `reviews`, `coupons`, `wishlist`, `notifications`, `ai`; tách admin; enforce CI | Đồng nhất 100%, kiến trúc tự bảo vệ |

> Nếu là đồ án có deadline: làm P0 → P1 → demo; P2–P4 có thể chạy song song sau khi bảo vệ.

### 8.2 P0 — Chi tiết

1. Sửa webhook path + test bằng Stripe CLI.
2. Sửa reset password + `await` + revoke refresh token khi đổi mật khẩu.
3. Chatbot: auth bắt buộc, `userId` từ `req.user`, validate cartAction, quota + max length.
4. Upload `/test-upload`: xóa hoặc chặn production.
5. `requireSuperAdmin` cho user management; cấm tự đổi role.
6. CORS: bỏ wildcard production.
7. Git hygiene: `git rm --cached` backup, `filter-repo`, rotate toàn bộ secret, `.gitignore`, `gitleaks`.
8. `confirmPayment`: ownership + amount + payment intent match.
9. Bank transfer: TTL riêng + `mark-paid` idempotent.
10. Refund: tính theo quote, idempotency, hoàn kho/coupon.
11. OAuth: `state: true`, token qua httpOnly cookie.
12. Bỏ `?status=` khỏi API public.

**Tiêu chí nghiệm thu P0:**

- [ ] Stripe CLI gửi webhook → 200, đơn chuyển `paid` không cần FE confirm.
- [ ] Reset password chạy end-to-end; token cũ bị revoke.
- [ ] Chatbot không thể đọc/ghi giỏ của user khác khi không có JWT.
- [ ] `manager` gọi đổi role → 403.
- [ ] `git log --all -- backup.dump backup.custom` không còn; secret đã rotate.
- [ ] Không còn route upload không auth trong production.

### 8.3 P1 — Chi tiết

- Migration: FK `orders.user_id`, `order_items.product_id RESTRICT`, index orders/refresh_tokens/reviews, unique reviews, partial unique carts.
- Đưa pricing về server: `POST /orders/preview`; FE chỉ hiển thị.
- Xóa dead code & mock khỏi production.
- Global ErrorBoundary + sửa route 404.
- CI: `npm ci`, lint fail cứng, test bắt buộc, `npm audit`, build Docker.
- Health check thật `/api/ready` (SELECT 1 + redis.ping).
- Hợp nhất API client FE; xóa `attributeApi` thứ 2.
- ESLint config BE/FE.

### 8.4 P2 — Chi tiết

- Tạo `modules/payments` với port `PaymentGateway`, adapter Stripe/BankTransfer, `payment_events`.
- Tạo `modules/inventory` từ `services/inventory.service.js`, giữ ledger.
- Tạo `modules/checkout/application/checkout.service.js` orchestrate.
- Tạo `modules/orders` từ `order.controller.js`.
- Route cũ chuyển dần sang module mới (strangler).
- Test: oversell, coupon race, webhook trùng, refund, thanh toán muộn.

**Tiêu chí nghiệm thu P2:**

- [ ] Controller orders < 150 dòng.
- [ ] Không còn `require("../models")` trong controller.
- [ ] dependency-cruiser pass cho 4 module mới.
- [ ] Test tích hợp checkout chạy trong CI.

### 8.5 P3 — Chi tiết

- `catalog`: product/category/attribute/variant/warranty; chuyển `shared/services/product/*` vào `catalog/application`.
- `cart`: server authoritative; bỏ localStorage persist.
- Xé `product.controller.js` (1.740 dòng) thành controller + service + repository.
- Tách admin product controller.

### 8.6 P4 — Chi tiết

- `identity` gộp auth + user + address; xóa controller auth bị comment.
- `reviews`, `coupons`, `wishlist`, `notifications`, `ai`.
- Tách `admin.controller.js` theo domain.
- Bật dependency-cruiser `error`; xóa đường cũ; cập nhật docs.

### 8.7 Mapping old → new

| Hiện tại | Đích |
|---|---|
| `controllers/product.controller.js` (1.740) | `modules/catalog/*` |
| `controllers/admin.controller.js` (2.021) | `admin/controllers/*` + gọi service module |
| `services/inventory.service.js` | `modules/inventory/application` |
| `services/coupon.service.js` | `modules/coupons/application` |
| `shared/services/payment/*` | `modules/payments/{ports,infra}` |
| `shared/services/product/*` | `modules/catalog/application` |
| `shared/services/email/*` | `modules/notifications` |
| `shared/services/chatbot/*` | `modules/ai` |
| `modules/auth` + `modules/user` | `modules/identity` |
| `be/models/`, `be/src/database/migrations/` | Xóa (dead) |
| `controllers/auth.controller.js` (comment) | Xóa |

---

## 9. KẾ HOẠCH AI AGENT

### 9.1 Nguyên tắc

- Read-only mặc định; mọi hành động ghi qua `approval_queue`.
- Tool scoped, không cho SQL tùy ý.
- Chạy staging trước; cost cap + timeout + `AbortController`.
- Chống prompt injection: system instruction tách biệt; coi nội dung user/DB là data.
- Idempotency + dry-run cho mọi tool ghi.
- Audit log đầy đủ.

### 9.2 Danh mục agent

| Agent | Việc lặp lại được thay thế | ROI |
|---|---|---|
| Catalog Ops | SEO title/description, chuẩn hóa biến thể, keyword, alt-text, phát hiện trùng | Cao |
| Data Reconciliation | So `sold_count` vs `order_items`, stock vs ledger, avg_rating vs reviews; mở issue | Cao |
| Migration & Index Advisor | Đọc `pg_stat_statements` + slow log → đề xuất index/migration, mở PR | Cao |
| Test Generation | Sinh test từ OpenAPI + controller cho checkout/coupon/refund | Cao |
| Design System Refactor | Codemod palette thô → token, xóa dead code bằng import graph | Cao |
| i18n | Quét chuỗi hardcode → tạo key vi/en, mở PR | Trung bình |
| Support RAG | Trả lời trạng thái đơn, chính sách, tra cứu sản phẩm | Cao |
| Incident Copilot | Đọc Sentry/log → nhóm lỗi, tìm commit, draft runbook | Trung bình |
| Content Moderation | Phân loại review spam/độc hại | Trung bình |

### 9.3 Kiến trúc tối giản

```text
Scheduler (cron/queue)
  → Agent Worker (Gemini + tool registry, read-only)
  → Đề xuất (diff/PR/JSON)
  → approval_queue (DB)
  → Admin duyệt
  → Thực thi qua service có idempotency key
  → audit_log + metrics
```

Schema tối thiểu:

```sql
agent_jobs(id uuid pk, agent_type, input jsonb, status, cost_tokens, created_at);
agent_proposals(id uuid pk, job_id, action, payload jsonb, diff text, status,
                reviewed_by uuid, reviewed_at, applied_at);
agent_audit(id bigserial, proposal_id, actor, action, result jsonb, created_at);
```

---

## 10. KPI & CÁCH ĐO

| KPI | Hiện tại | Mục tiêu |
|---|---|---|
| Tỷ lệ đơn paid không cần FE confirm | 0% (webhook hỏng) | 100% |
| Oversell / tháng | Chưa đo | 0 |
| Webhook 400 rate | ~100% | < 0.1% |
| p95 API list sản phẩm | Chưa đo | < 300ms |
| p95 checkout | Chưa đo | < 800ms |
| Test coverage module tiền/kho | ~0% | > 70% |
| Số dòng dead code FE | ~5.600 | 0 |
| Bundle entry | 675KB | < 300KB |
| Thời gian restore DB | Chưa có runbook | < 1h, diễn tập hàng tháng |
| Số secret từng lộ chưa rotate | Không rõ | 0 |

---

## 11. RỦI RO & CÂU HỎI MỞ

| # | Câu hỏi | Mặc định đề xuất |
|---|---|---|
| 1 | Team bao nhiêu người, deadline khi nào? | Nếu ≤ 3 người + deadline gần: P0 → P1 → demo; P2–P4 sau |
| 2 | Database production có dữ liệu thật không? | Nếu có: backup + restore drill trước khi migration |
| 3 | Có thể rotate toàn bộ secret không? | Có — bắt buộc sau khi lộ backup |
| 4 | Có chấp nhận downtime ngắn cho migration index? | Dùng `CREATE INDEX CONCURRENTLY` để tránh |
| 5 | Giữ AntD trong admin hay hợp nhất về Tailwind? | Giữ AntD admin ở Phase 1, hợp nhất sau |
| 6 | Có cần hỗ trợ đa tiền tệ thật không? | Nếu không, bỏ tỷ giá; nếu có, lưu minor units + currency |
| 7 | Ai duyệt agent proposal? | Admin/owner; bắt buộc human-in-the-loop |

---

## 12. CHECKLIST REVIEW CHO CHỦ DỰ ÁN

### 12.1 Chốt quyết định

- [ ] Đồng ý Modular Monolith + Selective Clean (không full Clean, không microservices).
- [ ] Đồng ý module map 13 module.
- [ ] Đồng ý quy tắc R1–R8.
- [ ] Đồng ý thứ tự P0 → P1 → P2 → P3 → P4.
- [ ] Đồng ý xóa cây code chết (`be/models`, `be/src/database`, controller auth comment).
- [ ] Đồng ý rotate toàn bộ secret và xử lý git history.

### 12.2 Trước khi chạy script

- [ ] Đã commit/stash thay đổi hiện tại.
- [ ] Đã đọc `scripts/apply-architecture-plan.sh`.
- [ ] Chạy `bash scripts/apply-architecture-plan.sh` (dry-run) và review output.
- [ ] Chạy `bash scripts/apply-architecture-plan.sh --apply` khi đồng ý.
- [ ] Cài `dependency-cruiser` trong `be/`.

### 12.3 Sau khi áp P0

- [ ] Chạy checklist Phụ lục A.
- [ ] Chạy lại test checkout + Stripe CLI.
- [ ] Xác nhận không còn backup trong git.
- [ ] Xác nhận secret mới đã được set trên Render/Vercel.

---

## PHỤ LỤC A — LỆNH KIỂM CHỨNG

> Chạy từ root repo. Không thay đổi dữ liệu.

```bash
# P0-07: backup có bị track không
git ls-files | grep -E 'backup\.(dump|custom)$'

# P0-01: webhook path
grep -n "payments/webhook\|payment/webhook" be/src/app.js be/src/routes/*.js

# P0-02/03: reset password
sed -n '150,175p' be/src/modules/auth/auth.service.js
sed -n '100,115p' be/src/modules/auth/auth.controller.js

# P0-04: chatbot auth
sed -n '70,80p' be/src/routes/chatbot.routes.js
sed -n '30,60p' be/src/controllers/chatbot.controller.js

# P0-06: super admin
grep -rn "requireSuperAdmin" be/src
sed -n '50,65p' be/src/routes/admin.routes.js

# P0-08: CORS wildcard
sed -n '56,75p' be/src/app.js

# P0-09: confirmPayment ownership
sed -n '100,120p' be/src/controllers/payment.controller.js

# P0-12: product status leak
sed -n '110,122p' be/src/controllers/product.controller.js

# DB: index orders
grep -n "addIndex\|unique" be/src/migrations/20251101045620-create-orders-table.js

# DB: reviews unique
grep -n "unique\|addIndex" be/src/migrations/20260408090500-create-reviews-table.js

# FE: bundle
find fe/dist/assets -name '*.js' -printf '%s %p\n' | sort -rn | head -10
```

---

## PHỤ LỤC B — QUYẾT ĐỊNH CẦN GHI THÀNH ADR

Khi chốt, tạo thêm:

- `docs/adr/0001-modular-monolith-selective-clean.md`
- `docs/adr/0002-money-and-payment-model.md`
- `docs/adr/0003-data-ownership-and-soft-delete.md`
- `docs/adr/0004-ai-agent-guardrails.md`

Mỗi ADR gồm: Context, Decision, Alternatives, Consequences, Status, Date.

---

**Hết tài liệu.**
