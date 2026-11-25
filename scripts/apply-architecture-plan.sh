#!/usr/bin/env bash
#
# apply-architecture-plan.sh
# Bootstrap Phase 0 cho kế hoạch tái cấu trúc E-Commerce Mini.
#
# Nguyên tắc:
#   - KHÔNG xóa file nào.
#   - KHÔNG sửa code đang chạy.
#   - KHÔNG gọi API/DB/secret.
#   - Idempotent: chạy nhiều lần không ghi đè file đã có.
#   - Mặc định DRY-RUN. Chỉ ghi khi truyền --apply.
#
# Tài liệu đầy đủ: docs/ASSESSMENT_AND_PLAN.md
#
# Cách dùng:
#   bash scripts/apply-architecture-plan.sh              # dry-run (mặc định)
#   bash scripts/apply-architecture-plan.sh --apply      # tạo file/thư mục
#   bash scripts/apply-architecture-plan.sh --check      # kiểm tra hiện trạng
#   bash scripts/apply-architecture-plan.sh --help
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
MODE="dry-run"

usage() {
  cat <<'EOF'
apply-architecture-plan.sh — Bootstrap Phase 0 (Modular Monolith + Selective Clean)

CÁCH DÙNG
  bash scripts/apply-architecture-plan.sh [--dry-run | --apply | --check | --help]

CHẾ ĐỘ
  --dry-run   (mặc định) In ra những gì sẽ tạo, không ghi gì.
  --apply     Tạo thư mục/file còn thiếu. Không ghi đè file đã có.
  --check     Kiểm tra hiện trạng: backup trong git, .gitignore, AGENTS.md,
              dependency-cruiser, eslint config.
  --help      In hướng dẫn này.

NHỮNG GÌ SẼ ĐƯỢC TẠO (--apply)
  docs/adr/0001-modular-monolith-selective-clean.md
  AGENTS.md
  be/.dependency-cruiser.cjs
  be/src/shared/{db,http,errors,events}/README.md
  be/src/modules/<module>/{README.md,index.js}  (chỉ module chưa tồn tại)
  .gitignore: thêm *.dump, *.custom, *.sql.gz, .local-backups/

NHỮNG GÌ KHÔNG LÀM (cần làm tay, có chủ đích)
  - git rm --cached backup.dump backup.custom
  - git filter-repo (viết lại lịch sử)
  - rotate secret
  - npm install dependency-cruiser
  - sửa/xóa code hiện có

Xem checklist đầy đủ: docs/ASSESSMENT_AND_PLAN.md
EOF
}

log() { printf '%s\n' "$*"; }

ensure_dir() {
  local dir="$1"
  if [ -d "$dir" ]; then
    return 0
  fi
  if [ "$MODE" = "dry-run" ]; then
    log "DRY-RUN mkdir: ${dir#"$ROOT_DIR"/}"
    return 0
  fi
  mkdir -p "$dir"
  log "MKDIR: ${dir#"$ROOT_DIR"/}"
}

# write_block <path> : đọc nội dung từ stdin, chỉ ghi nếu file chưa tồn tại.
write_block() {
  local path="$1"
  if [ -e "$path" ]; then
    log "SKIP (đã tồn tại): ${path#"$ROOT_DIR"/}"
    cat >/dev/null
    return 0
  fi
  if [ "$MODE" = "dry-run" ]; then
    log "DRY-RUN create: ${path#"$ROOT_DIR"/}"
    cat >/dev/null
    return 0
  fi
  mkdir -p "$(dirname "$path")"
  cat >"$path"
  log "CREATE: ${path#"$ROOT_DIR"/}"
}

add_gitignore() {
  local pattern="$1"
  local file="$ROOT_DIR/.gitignore"
  if [ -f "$file" ] && grep -qxF "$pattern" "$file"; then
    return 0
  fi
  if [ "$MODE" = "dry-run" ]; then
    log "DRY-RUN append .gitignore: $pattern"
    return 0
  fi
  if [ ! -f "$file" ]; then
    : >"$file"
  fi
  printf '\n%s\n' "$pattern" >>"$file"
  log "APPEND .gitignore: $pattern"
}

print_p0() {
  cat <<'EOF'

──────────────────────────────────────────────────────────────
P0 — BẮT BUỘC LÀM TAY (script KHÔNG tự động)
──────────────────────────────────────────────────────────────
  1. Stripe webhook path: be/src/app.js:111
     -> sửa thành /api/payment/webhook, test bằng: stripe listen

  2. Reset password: be/src/modules/auth/auth.controller.js:106
     -> gọi resetPassword({ token, password })

  3. forgotPassword thiếu await: be/src/modules/auth/auth.service.js:153
     -> thêm await

  4. Chatbot IDOR: be/src/routes/chatbot.routes.js:74
     -> bắt buộc authenticate, userId lấy từ req.user

  5. Upload test không auth: be/src/routes/image.routes.js:172-173
     -> xóa hoặc chặn production

  6. Manager nâng quyền admin: be/src/routes/admin.routes.js:54-58
     -> dùng requireSuperAdmin, cấm tự đổi role

  7. Backup DB trong git:
     git rm --cached backup.dump backup.custom
     -> git filter-repo + rotate toàn bộ secret

  8. CORS wildcard: be/src/app.js:65-68
     -> bỏ *.vercel.app ở production

  9. confirmPayment thiếu ownership: be/src/controllers/payment.controller.js:108-112
     -> thêm userId + so amount/paymentIntent

 10. Bank transfer tự hủy 15 phút: be/src/jobs/orderCleanup.job.js:39-54
     -> TTL riêng + endpoint mark-paid idempotent

 11. Refund sai đơn vị tiền: be/src/controllers/payment.controller.js:509-544
     -> tính theo paymentQuote, idempotency key, hoàn kho/coupon

 12. OAuth thiếu state: be/src/config/passport.js:11-33
     -> state:true + refresh token qua httpOnly cookie

 13. Product draft lộ qua API public: be/src/controllers/product.controller.js:117
     -> bỏ tham số status khỏi public API
EOF
}

run_check() {
  log "== ARCHITECTURE CHECK =="
  log ""

  log "[1] Backup DB có bị git track không?"
  if git -C "$ROOT_DIR" ls-files 2>/dev/null | grep -qE 'backup\.(dump|custom)$'; then
    log "  !! CÓ: backup.dump / backup.custom đang được track."
    log "     -> git rm --cached + filter-repo + rotate secret"
  else
    log "  OK: không thấy backup trong git."
  fi

  log ""
  log "[2] .gitignore patterns"
  for p in '*.dump' '*.custom' '*.sql.gz' '.local-backups/'; do
    if grep -qxF "$p" "$ROOT_DIR/.gitignore" 2>/dev/null; then
      log "  OK: $p"
    else
      log "  THIẾU: $p"
    fi
  done

  log ""
  log "[3] AGENTS.md"
  if [ -f "$ROOT_DIR/AGENTS.md" ]; then
    log "  OK: AGENTS.md tồn tại"
  else
    log "  THIẾU: AGENTS.md (chạy --apply để tạo)"
  fi

  log ""
  log "[4] dependency-cruiser"
  if [ -x "$ROOT_DIR/be/node_modules/.bin/depcruise" ]; then
    log "  OK: đã cài"
    (cd "$ROOT_DIR/be" && ./node_modules/.bin/depcruise --config .dependency-cruiser.cjs src) || true
  else
    log "  CHƯA CÀI: cd be && npm i -D dependency-cruiser"
  fi

  log ""
  log "[5] ESLint config backend"
  if ls "$ROOT_DIR"/be/.eslintrc* >/dev/null 2>&1 || ls "$ROOT_DIR"/be/eslint.config.* >/dev/null 2>&1; then
    log "  OK: có eslint config"
  else
    log "  THIẾU: be/.eslintrc.cjs hoặc be/eslint.config.cjs"
  fi

  log ""
  log "[6] Số console.* trong backend (mục tiêu giảm)"
  local n
  n=$(grep -rE "console\.(log|error|warn|info)" "$ROOT_DIR/be/src" 2>/dev/null | wc -l | tr -d ' ')
  log "  console.*: ${n}"

  print_p0
}

run_scaffold() {
  log "== SCAFFOLD ARCHITECTURE (mode: $MODE) =="
  log "Root: $ROOT_DIR"
  log ""

  # 1) ADR
  write_block "$ROOT_DIR/docs/adr/0001-modular-monolith-selective-clean.md" <<'EOF'
# ADR 0001 — Modular Monolith + Selective Clean Architecture

- Status: Proposed
- Date: 2026-11-12
- Deciders: chủ dự án (review)

## Context

- Monolith Express + Sequelize, 1 database PostgreSQL, team nhỏ.
- Checkout là use case xuyên 6 domain, cần ACID.
- Đã bật Sequelize CLS -> transaction lan xuyên module.
- Hiện trạng: layer-first cho 15 domain + feature module lẻ cho auth;
  model gọi service; 2 cây code song song.

## Decision

Chọn Modular Monolith + Clean Architecture chọn lọc:

- 1 deployable duy nhất.
- Ranh giới theo domain; mỗi module có public API qua index.js.
- Bên trong module: controller -> application service -> repository -> model,
  cộng domain functions cho invariant.
- Full Hexagonal chỉ ở payments, inventory, checkout.
- Ports cho notifications, ai, storage.
- Admin là delivery layer, không phải domain.

## Alternatives considered

1. Full Clean cho mọi module: chi phí +40-60% file, team nhỏ, không đáng.
2. Microservices: checkout cần ACID, team chưa có test/observability.
3. Giữ layer-first: coupling tăng, controller god object.

## Consequences

Positive:

- Ranh giới rõ, test được module tiền/kho.
- Có thể tách service sau này bằng strangler.
- Transaction xuyên module vẫn ACID.

Negative:

- Cần enforce bằng dependency-cruiser, nếu không sẽ thoái hoá.
- Cần thời gian migrate từng phase, không big-bang.

## References

- docs/ASSESSMENT_AND_PLAN.md
- be/.dependency-cruiser.cjs
EOF

  # 2) AGENTS.md
  write_block "$ROOT_DIR/AGENTS.md" <<'EOF'
# AGENTS.md — Hợp đồng kiến trúc cho AI Agent & contributor

Dự án: E-Commerce Mini (be/ + fe/).
Kiến trúc đích: Modular Monolith + Selective Clean/Hexagonal.
Tài liệu đầy đủ: docs/ASSESSMENT_AND_PLAN.md

## 6 quy tắc bắt buộc

1. Controller chỉ parse HTTP, không query DB, không gọi vendor.
2. Model không import application/domain/service.
3. Module khác chỉ import qua index.js; cấm import infra/ của module khác.
4. Mỗi bảng có đúng 1 module ghi.
5. Không gọi Stripe/email/AI/Cloudinary trong transaction DB.
6. Side effect qua domain event hoặc outbox.

## Phân tầng trong module

    routes -> controller -> application service -> repository -> model
                      \-> domain (pure, không import DB)

## Trước khi viết code mới

- Xác định module sở hữu (xem module map trong docs/ASSESSMENT_AND_PLAN.md).
- Nếu là use case xuyên module: đặt ở modules/checkout/application,
  gọi public API của các module khác.
- Nếu cần gọi vendor mới: tạo port + adapter, không import SDK trực tiếp vào domain.

## Definition of Done

- [ ] Không vi phạm dependency-cruiser.
- [ ] Có test cho invariant chính (tiền, kho, trạng thái đơn).
- [ ] Không thêm console.* (dùng logger).
- [ ] Không hardcode secret/URL.
- [ ] Cập nhật docs nếu thay đổi hợp đồng module.

## Không được làm

- Không sửa/xóa backup.dump, backup.custom, .env.
- Không commit secret.
- Không thêm dependency nặng (MUI/antd) vào storefront nếu không được duyệt.
- Không gọi I/O ngoài trong transaction DB.

## Lệnh

    cd be && npm run dev
    cd be && npm test
    cd be && npx depcruise --config .dependency-cruiser.cjs src
    cd fe && npm run build
    bash scripts/apply-architecture-plan.sh --check
EOF

  # 3) dependency-cruiser config
  write_block "$ROOT_DIR/be/.dependency-cruiser.cjs" <<'EOF'
/**
 * Ranh giới kiến trúc — Modular Monolith + Selective Clean.
 * Chạy: npx depcruise --config .dependency-cruiser.cjs src
 *
 * Giai đoạn đầu để severity = "warn" để không chặn CI.
 * Sau Phase 2 đổi các rule lõi sang "error".
 */
module.exports = {
  forbidden: [
    {
      name: "model-khong-goi-service",
      severity: "warn",
      comment: "Tầng data không được phụ thuộc business logic.",
      from: { path: "^src/(models|modules/[^/]+/infra)/.*\\.model\\.js$" },
      to: { path: "^src/(services|shared/services|modules/[^/]+/(application|domain))/" },
    },
    {
      name: "controller-khong-goi-model",
      severity: "warn",
      comment: "Controller chỉ parse HTTP, không query DB.",
      from: { path: "controller\\.js$" },
      to: { path: "(^src/models/|^src/modules/[^/]+/infra/)" },
    },
    {
      name: "module-khac-khong-import-infra",
      severity: "warn",
      comment: "Chỉ import module khác qua index.js (best-effort regex).",
      from: { path: "^src/modules/([^/]+)/" },
      to: {
        path: "^src/modules/",
        pathNot: "^src/modules/$1/",
      },
    },
    {
      name: "shared-khong-chua-domain",
      severity: "warn",
      comment: "shared/ chỉ chứa hạ tầng generic.",
      from: { path: "^src/shared/" },
      to: { path: "(^src/models/|^src/modules/)" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: {
      path: "(node_modules|uploads|logs|dist|coverage|__tests__|/test/)",
    },
    tsPreCompilationDeps: false,
    reporterOptions: {
      dot: { collapsePattern: "node_modules/[^/]+" },
    },
  },
};
EOF

  # 4) shared README + dirs
  ensure_dir "$ROOT_DIR/be/src/shared/db"
  ensure_dir "$ROOT_DIR/be/src/shared/http"
  ensure_dir "$ROOT_DIR/be/src/shared/errors"
  ensure_dir "$ROOT_DIR/be/src/shared/events"

  write_block "$ROOT_DIR/be/src/shared/README.md" <<'EOF'
# shared/

Chỉ chứa hạ tầng generic:

- db/        sequelize, associations, transaction/unit-of-work
- http/      errorHandler, validate, authenticate, rateLimit
- errors/    AppError và error types
- events/    eventBus/outbox
- logger/    logging
- utils/     helper thuần, không phụ thuộc domain

## Không được đặt ở đây

- Logic domain (product, order, coupon, inventory, ...).
- Truy vấn model của một domain cụ thể.

Nếu tên file chứa tên domain -> nó phải nằm trong modules/.
EOF

  # 5) module placeholders
  while IFS='|' read -r name owns note; do
    [ -z "${name:-}" ] && continue
    case "$name" in \#*) continue ;; esac

    if [ "$name" = "identity" ] && { [ -d "$ROOT_DIR/be/src/modules/auth" ] || [ -d "$ROOT_DIR/be/src/modules/user" ]; }; then
      log "SKIP module identity (đã có auth/user; gộp ở Phase 4)"
      continue
    fi
    if [ "$name" = "users" ] && [ -d "$ROOT_DIR/be/src/modules/user" ]; then
      log "SKIP module users (đã có modules/user; đổi tên ở Phase 4)"
      continue
    fi
    if [ -d "$ROOT_DIR/be/src/modules/$name" ]; then
      log "SKIP module $name (đã tồn tại)"
      continue
    fi

    ensure_dir "$ROOT_DIR/be/src/modules/$name"

    write_block "$ROOT_DIR/be/src/modules/$name/README.md" <<EOF
# Module: ${name}

- Trạng thái: CHƯA migrate (placeholder).
- Chủ sở hữu dữ liệu: ${owns}
- Ghi chú: ${note}

## Public API

Chỉ file index.js được module khác import.

## Quy tắc

- Chỉ import module khác qua index.js của module đó.
- Không import infra/ của module khác.
- Model không import application/domain.
- Không gọi Stripe/email/AI trong transaction DB.
- Mỗi bảng chỉ do module này ghi.

## Việc cần làm khi migrate

1. Chuyển model liên quan vào infra/.
2. Tách controller hiện tại thành controller mỏng + application service.
3. Viết test cho invariant chính.
4. Export public API qua index.js.
EOF

    write_block "$ROOT_DIR/be/src/modules/$name/index.js" <<EOF
// Public API của module ${name}.
// Chỉ export những gì module khác được phép dùng.
// TODO: thay thế khi migrate xong.
module.exports = {};
EOF
  done <<'MODULES'
# name|owns|note
catalog|products, product_variants, categories, attribute_groups, attribute_values, product_specifications, images, warranty_packages|đang nằm rải ở controllers/product|category|attribute|warranty
cart|carts, cart_items|controllers/cart.controller.js
checkout|không sở hữu bảng (orchestrator)|logic hiện nằm trong controllers/order.controller.js
orders|orders, order_items|controllers/order.controller.js
payments|payment_events (mới), mapping payment intent|controllers/payment.controller.js + shared/services/payment
inventory|inventory_transactions, inventory_requests|services/inventory.service.js
coupons|coupons|services/coupon.service.js
reviews|reviews, review_feedback, review_reply|controllers/review.controller.js
wishlist|wishlists|controllers/wishlist.controller.js
notifications|không sở hữu bảng|shared/services/email
ai|không sở hữu bảng|shared/services/chatbot
MODULES

  # 6) .gitignore
  add_gitignore '*.dump'
  add_gitignore '*.custom'
  add_gitignore '*.sql.gz'
  add_gitignore '.local-backups/'

  log ""
  log "== XONG (mode: $MODE) =="
  if [ "$MODE" = "dry-run" ]; then
    log "Chưa ghi gì. Chạy lại với --apply khi đã review."
  else
    log "Đã tạo khung. Bước tiếp theo:"
    log "  1. cd be && npm i -D dependency-cruiser"
    log "  2. bash scripts/apply-architecture-plan.sh --check"
    log "  3. Làm checklist P0 ở trên / trong docs/ASSESSMENT_AND_PLAN.md"
  fi
  print_p0
}

while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) MODE="dry-run" ;;
    --apply) MODE="apply" ;;
    --check) MODE="check" ;;
    -h | --help) usage; exit 0 ;;
    *)
      log "Tham số không hợp lệ: $1"
      usage
      exit 1
      ;;
  esac
  shift
done

if [ "$MODE" = "check" ]; then
  run_check
else
  run_scaffold
fi
