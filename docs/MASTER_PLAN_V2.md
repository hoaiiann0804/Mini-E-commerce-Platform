# MASTER PLAN V2 — Ưu tiên, Kiến trúc Modular, Tích hợp AI đa nhà cung cấp

**Dự án:** E-Commerce Mini · **Ngày:** 2026-11-13 · **Trạng thái:** Proposed
**Kế thừa:** `docs/ASSESSMENT_AND_PLAN.md` (v1.0). Tài liệu này **ghi đè phần ưu tiên & thứ tự**, bổ sung phát hiện mới, và thay Mục 9 (AI) bằng thiết kế chi tiết.

> Quy ước bằng chứng: **[V]** = đã đọc code xác nhận · **[?]** = cần chạy lệnh/đọc thêm trước khi sửa.

---

## 1. Thay đổi so với v1.0

| # | Thay đổi | Lý do |
|---|---|---|
| 1 | Thêm **P0-14**: đơn **COD cũng bị tự hủy sau 15 phút** | **[V]** `order.controller.js:221-236` gán `paymentStatus=pending` + `expiresAt=now+15m` cho *mọi* phương thức; `orderCleanup.job.js:39-46` không lọc `paymentMethod`. v1.0 chỉ nói bank transfer. |
| 2 | Thêm **P0-15**: gọi Stripe **bên trong** transaction giữ `FOR UPDATE` | **[V]** `payment.controller.js:35-64`. Pool = 5 → nghẽn toàn hệ thống khi Stripe chậm. v1.0 để ở P2. |
| 3 | Thêm **P0-16**: `createRefund` không check quyền sở hữu/amount/idempotency | **[V]** `payment.controller.js:509-544` chỉ `findByPk`; **[?]** cần xác nhận route có `adminAuth` không (`payment.routes.js`). |
| 4 | Thêm **UX-01**: checkout xóa giỏ ngay khi tạo đơn → đơn hết hạn/thanh toán lỗi là mất giỏ | **[V]** `order.controller.js:246-259`. |
| 5 | Nâng **CartPage/CategoryPage** (giá sai, mock data) lên P1 đầu | **[V]** `CartPage.tsx:70-76` (ship 5.99 kiểu USD), `CategoryPage.tsx:3-41` (mock). Đập thẳng vào người dùng. |
| 6 | Kiến trúc: **dựng khung module ngay, Clean sâu chỉ ở payments/inventory/checkout**; không chờ code xong | Tránh big-bang refactor khi chưa có test. |
| 7 | AI: chuyển trọng tâm sang **end-user**, thêm **LLM Gateway đa nhà cung cấp** | Yêu cầu dùng OpenRouter / Gemini / Cloudflare Workers AI / Groq để tránh hết quota. |

---

## 2. Nguyên tắc ưu tiên

Thứ tự quyết định bằng câu hỏi lần lượt:

1. **Có mất tiền / lộ dữ liệu / leo quyền không?** → P0.
2. **Có làm khách hàng không mua được hoặc mất niềm tin không?** → P1.
3. **Có khiến sửa sau này đắt hơn nhiều không (one-way door)?** → làm sớm (khung kiến trúc).
4. **Có tạo giá trị lặp lại cho người dùng cuối không?** → AI (P3+), *sau khi* nền ổn.
5. Còn lại (đẹp code, đồng bộ design system, tối ưu bundle) → P4+.

**Quy tắc cứng:** không làm AI ghi dữ liệu trước khi P0 xong; không di chuyển file kiến trúc đại trà trước khi có test cho checkout/payment.

---

## 3. Roadmap tổng

| Phase | Thời lượng ước tính | Mục tiêu | Cổng nghiệm thu |
|---|---|---|---|
| **P0** Chặn mất tiền & lộ dữ liệu | 1–2 tuần | 16 lỗi P0 | Checklist §4.1 |
| **P1** Đúng đắn dữ liệu & trải nghiệm mua hàng | 2 tuần | FK/index, pricing server-side, giỏ hàng, CI gate, ready-check | Checklist §4.2 |
| **P2** Khung Modular + module rủi ro cao | 2–3 tuần | `payments`, `inventory`, `checkout`, `orders` | dep-cruiser pass, test checkout trong CI |
| **P3** AI nền tảng + AI người dùng cuối (read-only) | 2–3 tuần | LLM Gateway, Shopper Advisor, Order Assistant (đọc) | Checklist §6.7 |
| **P4** Catalog/Cart + AI có hành động (có xác nhận) | 3 tuần | `catalog`, `cart`; Cart Optimizer, tự sửa đơn | Eval AI đạt ngưỡng |
| **P5** Hoàn thiện, admin AI, design system | 2–3 tuần | `identity`, reviews…; Product Onboarding Agent; hợp nhất UI | KPI §8 |

> Nếu là đồ án có deadline: **P0 → P1 → (P2 phần payments/checkout) → P3 bản tối thiểu (Shopper Advisor + Gateway)** là bộ demo đủ ấn tượng và an toàn.

---

## 4. Chi tiết P0 và P1

### 4.1 P0 — Danh sách (xếp theo rủi ro tiền → dữ liệu → quyền)

| Thứ tự | ID | Việc | Ghi chú |
|---:|---|---|---|
| 1 | P0-01 | Sửa path webhook (`/api/payments/webhook` ↔ `/api/payment/...`) | Test bằng Stripe CLI |
| 2 | P0-14 | Tách TTL theo phương thức: `stripe` 15 phút, `bank_transfer` 24h + `mark-paid`, `cod` không expire (vào `processing`) | Lọc `paymentMethod` trong cleanup job |
| 3 | P0-15 | Tách I/O Stripe ra khỏi transaction `FOR UPDATE` (reserve → commit → gọi Stripe → ghi lại intent id; idempotency key giữ nguyên) | Giảm giữ connection |
| 4 | P0-11/16 | Refund: quyền admin, tính theo `paymentQuote`, `amount ≤ paid`, idempotency key, hoàn kho/coupon, state `refunded` | Thêm `payment_events` |
| 5 | P0-09 | `confirmPayment`: ownership + so `paymentTransactionId` + amount | |
| 6 | P0-07 | Gỡ `backup.dump`/`backup.custom` khỏi git, `filter-repo`, rotate **toàn bộ** secret, `.gitignore`, `gitleaks` | Thực tế đã `git ls-files` thấy 2 file này **[V]** |
| 7 | P0-04 | Chatbot: bắt buộc auth, `userId` từ JWT, validate `cartAction`, giới hạn độ dài/quota | Xem thêm `/test-message`, `/simple-message` (route test) **[V]** có tồn tại |
| 8 | P0-06 | `requireSuperAdmin` cho quản lý role; cấm tự nâng quyền | |
| 9 | P0-02/03 | Sửa `resetPassword({token,password})`, thêm `await` ở `forgotPassword`, revoke refresh token | **[V]** |
| 10 | P0-08/12/13/05 | CORS whitelist, bỏ `?status=` public, OAuth `state`, khóa route upload test | |

### 4.2 P1 — Danh sách

**Dữ liệu (migration, dùng `CREATE INDEX CONCURRENTLY`, backup + restore drill trước):**
- FK `orders.user_id`; `order_items.product_id` → `RESTRICT`; index `orders(user_id, created_at DESC)`, partial index cho cleanup `(expires_at) WHERE payment_status='pending'`.
- Unique `reviews(product_id, user_id)`; unique index `refresh_tokens.token_hash` (lưu SHA-256); partial unique cart `active` theo user.
- CHECK: `rating 1..5`, `quantity > 0`, `total >= 0`.
- Order number: bỏ `Math.random()` (`order.controller.js:190`), dùng sequence/ULID để tránh va chạm.

**Trải nghiệm mua hàng (end-user):**
- `POST /orders/preview`: server trả subtotal/ship/tax/discount/total (VND); FE chỉ hiển thị. Xóa công thức client trong `CartPage.tsx`.
- **Không xóa giỏ khi tạo đơn**; chỉ chuyển `converted` khi *thanh toán thành công* (hoặc COD xác nhận). Đơn hết hạn → khôi phục giỏ.
- Thay `CategoryPage` bằng API thật; xóa `mockProducts`/`mockCategories` khỏi production bundle; xóa route test.
- Global `ErrorBoundary`, trang 404 đúng.
- Trang theo dõi đơn có timeline trạng thái + nút "Thanh toán lại".

**Chất lượng:**
- CI: bỏ `|| echo`, `lint` + `test` bắt buộc, `npm audit`, build Docker.
- `/api/ready` thật (`SELECT 1` + `redis.ping`).
- Request-id + logger có cấu trúc (pino) thay `console.*`.
- Pool 10–20, `statement_timeout`, body limit 1MB (upload riêng).

---

## 5. Kiến trúc Modular (chốt)

### 5.1 Quyết định
**Modular Monolith + Selective Clean.** Một deployable, ranh giới theo domain, Clean/Hexagonal sâu chỉ ở nơi có tiền/kho/vendor.

### 5.2 Module & mức Clean

| Module | Sở hữu bảng | Mức |
|---|---|---|
| `payments` | `payment_events` (mới) | **Hexagonal** (port `PaymentGateway`; adapter Stripe/BankTransfer/COD) |
| `inventory` | `inventory_transactions`, `inventory_requests` | **Domain + repository**, giữ ledger |
| `checkout` | — (orchestrator) | **Application service**, điều phối cart→inventory→coupon→order |
| `orders` | `orders`, `order_items` | 3 lớp + state machine |
| `catalog` | products, variants, categories, attributes… | 3 lớp |
| `cart` | carts, cart_items | 3 lớp, server authoritative |
| `identity` | users, refresh_tokens, addresses | 3 lớp |
| `coupons`, `reviews`, `wishlist` | tương ứng | Thin CRUD |
| `notifications` | `outbox_events` | Port email + outbox |
| **`ai`** | `ai_*` (mới, §6.6) | **Hexagonal** (port `LlmGateway`, `Tool registry`) |
| `admin` | — | Delivery layer |

### 5.3 Quy tắc (giữ R1–R8 của v1.0, bổ sung)
- **R9** Module khác chỉ gọi qua `index.js`; AI tools **chỉ** gọi service công khai của module, **không** truy vấn model trực tiếp.
- **R10** Mọi tool AI ghi dữ liệu phải đi qua service có idempotency key + kiểm tra quyền như API thường.
- **R11** Không gọi LLM/Stripe/email trong transaction DB.

### 5.4 Chiến lược chuyển đổi (strangler, không big-bang)
1. Chạy `scripts/apply-architecture-plan.sh --apply` (chỉ tạo khung, không sửa code chạy).
2. Viết **test đặc tả (characterization test)** cho checkout/payment/coupon *trước* khi di chuyển.
3. Mỗi lần di chuyển 1 module: tạo module mới → route cũ gọi sang → xóa code cũ → bật dep-cruiser cho module đó.
4. Module **mới** (payments, ai) viết đúng khuôn ngay từ đầu.

---

## 6. Tích hợp AI (đa nhà cung cấp)

### 6.1 Mục tiêu
- Giải quyết việc **phức tạp/lặp lại cho người dùng cuối** trước, admin sau.
- **Không phụ thuộc 1 nhà cung cấp**: hết quota/lỗi → tự chuyển.
- An toàn: read-only mặc định, hành động ghi cần xác nhận của người dùng.

### 6.2 Phân vai nhà cung cấp (đề xuất, cần kiểm chứng khi thực thi)

> Hạn mức/giá/mô hình của các dịch vụ miễn phí **thay đổi thường xuyên**. Đừng hardcode số liệu; để cấu hình + đo thực tế.

| Nhà cung cấp | Vai trò đề xuất | Tác vụ phù hợp |
|---|---|---|
| **Groq** | Đường nhanh, độ trễ thấp | Chat tương tác, phân loại ý định, trích xuất ngắn, tool-calling nhanh |
| **Gemini API** | Chính cho tác vụ nặng/đa phương thức | Đọc ảnh/PDF báo giá, ngữ cảnh dài, tạo nội dung sản phẩm, structured output |
| **OpenRouter** | Lớp dự phòng đa mô hình | Fallback khi 2 bên trên lỗi/hết quota; thử mô hình khác nhau |
| **Cloudflare Workers AI** | Tác vụ rẻ ở edge | **Embeddings**, phân loại spam review, moderation, tóm tắt ngắn |

### 6.3 LLM Gateway (module `ai`)

```text
Caller (use case)  ──►  LlmGateway.run({ task, input, schema, userId })
                              │
        ┌─────────────────────┼──────────────────────────┐
        ▼                     ▼                          ▼
   Policy/Router        Quota & Circuit            Cache (Redis)
 (task → danh sách       Breaker (Redis)         exact + semantic
  provider theo ưu tiên)  per provider                 │
        │                     │                          │
        └──► Adapter: groq | gemini | openrouter | cfworkers
                              │
                    Validate (zod) → Redact PII → Audit log
```

**Hợp đồng port:**
```js
// ports/llmProvider.js
// complete({ messages, tools?, schema?, maxTokens, timeoutMs, signal }) -> { text, toolCalls?, usage }
// embed({ texts }) -> number[][]
```

**Bảng định tuyến theo tác vụ (cấu hình, không hardcode):**

| Task | Thứ tự thử | Timeout | Ghi chú |
|---|---|---|---|
| `chat.shopper` | groq → gemini → openrouter | 8s | stream, tool-calling |
| `intent.classify` | cfworkers → groq | 3s | rẻ, có cache |
| `extract.product` (ảnh/PDF) | gemini → openrouter | 30s | structured output |
| `embed` | cfworkers → gemini | 5s | batch, cache vĩnh viễn theo hash |
| `moderate.review` | cfworkers → groq | 3s | chạy nền |
| `content.seo` | gemini → groq | 20s | chạy nền, admin duyệt |

**Cơ chế chống hết quota:**
1. **Quota tracker** (Redis): đếm request/token theo provider theo phút/ngày; vượt ngưỡng cấu hình (vd. 80%) → bỏ qua provider đó tạm thời.
2. **Circuit breaker:** N lỗi 429/5xx liên tiếp → mở mạch X giây, thử nửa mở.
3. **Fallback tự động** theo bảng định tuyến; đảm bảo schema đầu ra giống nhau (zod) bất kể provider.
4. **Cache:** exact-match theo hash(prompt+tools+model-class); semantic cache cho câu hỏi FAQ/chính sách.
5. **Giảm tải:** rút gọn ngữ cảnh, giới hạn `maxTokens`, tool trả dữ liệu tối thiểu.
6. **Hàng đợi** cho tác vụ nền (moderation, SEO, embedding) để làm mượt tải; chạy giờ thấp điểm.
7. **Degrade có kiểm soát:** hết mọi provider → trả tìm kiếm thường + thông báo, không báo lỗi trắng.
8. **Rate limit theo người dùng** (và theo IP cho khách vãng lai) + trần chi phí/ngày.

**Bí mật:** API key chỉ ở env server; **không** để FE gọi trực tiếp nhà cung cấp. Cloudflare Worker nếu dùng làm proxy phải xác thực bằng khóa dịch vụ, không mở công khai.

### 6.4 Tính năng AI cho người dùng cuối (xếp ưu tiên)

| Ưu tiên | Tính năng | Vấn đề giải quyết | Loại | Phase |
|---:|---|---|---|---|
| 1 | **Shopper Advisor** (tư vấn/so sánh theo nhu cầu + ngân sách) | Khách ngợp thông số laptop/đồ công nghệ, phải mở nhiều tab | Read-only | P3 |
| 2 | **Order Assistant** (tra trạng thái đơn, chính sách đổi trả, bảo hành) | Việc lặp của CSKH; khách chờ | Read-only (RAG) | P3 |
| 3 | **Smart Search** (hiểu ngôn ngữ tự nhiên → filter + embeddings) | Tìm "laptop code mỏng nhẹ dưới 20tr" | Read-only | P3 |
| 4 | **Cart Optimizer** (gợi ý mã giảm tốt nhất, "mua thêm X để freeship") | Khách không biết mã nào áp được | Gợi ý → bấm xác nhận | P4 |
| 5 | **Self-service đơn** (sửa SĐT/địa chỉ khi còn `pending/processing`, khôi phục giỏ từ đơn hết hạn, yêu cầu hủy) | Phải gọi hotline | **Ghi, cần xác nhận** | P4 |
| 6 | **Review helper** (tóm tắt review, phát hiện spam) | Đọc hàng trăm review | Nền | P4 |

**Ràng buộc bắt buộc cho tool ghi (Self-service, Cart):**
- `userId` lấy từ JWT, **không** nhận từ body/prompt.
- Dry-run → hiển thị thay đổi → người dùng bấm xác nhận → gọi service có `idempotencyKey`.
- Kiểm tra trạng thái hợp lệ ở server (state machine), không tin lời LLM.
- Audit log đầy đủ (ai, tool, tham số, kết quả).

### 6.5 AI cho admin / vận hành (sau)

| Agent | Việc lặp thay thế | Phase |
|---|---|---|
| **Product Onboarding** (text/ảnh báo giá → product + variants + specs + SEO, **điền sẵn form, admin bấm Lưu**) | Nhập tay hàng chục trường | P5 |
| **Data Reconciliation** (`sold_count`, stock vs ledger, `avg_rating` vs reviews) | Đối soát thủ công | P5 |
| **Index/Migration Advisor**, **Test Generator**, **Codemod design system** | Việc dev lặp lại | Song song, ngoài runtime |

Mô hình duyệt: `agent_proposals` → admin duyệt → thực thi qua service (như v1.0 §9.3).

### 6.6 Dữ liệu AI (tối thiểu)

```sql
ai_conversations(id uuid pk, user_id uuid null, channel, created_at);
ai_messages(id bigserial pk, conversation_id, role, content_redacted text, tool_calls jsonb, provider, model, tokens_in, tokens_out, latency_ms, created_at);
ai_usage_daily(day, provider, requests, tokens, errors, primary key(day, provider));
ai_proposals(id uuid pk, job_type, payload jsonb, status, reviewed_by, applied_at);  -- admin agents
ai_audit(id bigserial pk, actor, tool, params jsonb, result jsonb, created_at);
product_embeddings(product_id pk, model, vector, content_hash, updated_at);       -- pgvector nếu có, hoặc lưu bảng riêng
```

> `pgvector` trên Neon/Render: **[?]** cần xác nhận extension được bật; nếu không, dùng embeddings từ Cloudflare + lưu `float4[]` và tính tương đồng ở app cho catalog nhỏ.

### 6.7 An toàn & chất lượng AI

- **Prompt injection:** nội dung user/sản phẩm/review là *dữ liệu*, không phải chỉ dẫn; tool output gắn nhãn; không để LLM tự chọn `userId`/`orderId` ngoài phạm vi user.
- **PII:** ẩn email/SĐT/địa chỉ trước khi gửi LLM nếu không cần; log đã redact.
- **Ground truth:** giá, tồn kho, trạng thái đơn **luôn lấy từ tool/DB**, không để LLM "nhớ" hay bịa. Trả lời phải trích nguồn (sản phẩm/chính sách).
- **Eval trước khi bật:** bộ ~50–100 câu hỏi vàng (tư vấn, tra đơn, chính sách) + test chống injection + test fallback (giả lập 429). Ngưỡng nghiệm thu: ≥ 90% đúng dữ kiện; 0 trường hợp rò dữ liệu user khác.
- **Kill switch** bằng feature flag theo tính năng và theo provider.
- Hiển thị rõ "AI hỗ trợ", cho phép chuyển sang người thật.

---

## 7. Ưu tiên tính năng sản phẩm (ngoài AI)

| Mức | Tính năng/vấn đề |
|---|---|
| Must | Thanh toán tin cậy (webhook, refund, COD/bank TTL); giỏ hàng không mất; giá nhất quán; theo dõi đơn |
| Should | Tìm kiếm/lọc nhanh (tsvector/trigram + cache); ảnh responsive; i18n các trang chính; mobile nav; email giao dịch qua outbox |
| Could | Wishlist nâng cao, gợi ý sản phẩm liên quan (embeddings), thông báo giảm giá |
| Later | Đa tiền tệ thật, marketplace nhiều người bán, tách microservice |

---

## 8. KPI

| KPI | Mục tiêu |
|---|---|
| Đơn Stripe tự chuyển `paid` qua webhook | 100% |
| Đơn COD bị hủy nhầm | 0 |
| Webhook lỗi | < 0.1% |
| p95 danh sách sản phẩm / checkout | < 300ms / < 800ms |
| Coverage module tiền/kho | > 70% |
| Tỷ lệ AI trả lời thành công (kể cả fallback) | > 99% |
| AI: tỷ lệ fallback/quota-hit theo provider | Theo dõi hằng ngày |
| AI: rò dữ liệu liên-user | 0 |
| Chi phí AI/ngày | ≤ trần cấu hình |
| Bundle entry | < 300KB |

---

## 9. Rủi ro & câu hỏi cần bạn chốt

| # | Câu hỏi | Mặc định đề xuất |
|---|---|---|
| 1 | Deadline và số người? | ≤3 người + deadline gần → P0→P1→P2(payments/checkout)→P3 tối thiểu |
| 2 | DB production có dữ liệu thật? | Có → backup + restore drill trước migration |
| 3 | Rotate toàn bộ secret được không? | Bắt buộc |
| 4 | Dùng free-tier AI cho production thật? | Chỉ cho demo/đồ án; production cần gói trả phí hoặc trần chi phí + fallback |
| 5 | Có dùng Cloudflare Worker làm AI proxy? | Chỉ khi cần edge/ẩn key; nếu không, gọi thẳng từ BE |
| 6 | Cần đa tiền tệ? | Không → bỏ tỷ giá USD cho Stripe, hoặc lưu minor units + currency |
| 7 | AI có được tự ghi dữ liệu? | Không; chỉ với xác nhận người dùng |
| 8 | pgvector có sẵn? | Xác nhận trên Neon trước khi chọn thiết kế semantic search |

---

## 10. Việc làm ngay (7 ngày đầu, theo thứ tự)

1. Gỡ backup khỏi git + rotate secret.
2. Sửa webhook path; chạy Stripe CLI xác nhận 200.
3. Tách TTL theo phương thức thanh toán; sửa cleanup job lọc `paymentMethod`.
4. Tách Stripe I/O khỏi transaction khóa dòng.
5. Khóa refund (admin + amount + idempotency).
6. Sửa reset password, chatbot auth, `requireSuperAdmin`.
7. Viết test đặc tả: checkout, coupon race, webhook trùng, đơn hết hạn, refund.
8. Chạy `scripts/apply-architecture-plan.sh` (dry-run → `--apply`) để dựng khung module.

---

## 11. ADR cần tạo

`0001` Modular monolith + selective clean · `0002` Money & payment model · `0003` Data ownership & soft delete · `0004` AI guardrails · **`0005` LLM gateway & provider routing** · **`0006` Order/payment TTL theo phương thức**

