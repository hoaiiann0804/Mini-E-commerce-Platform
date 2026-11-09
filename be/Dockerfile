# ==========================================
# Stage 1: Install Production Dependencies
# ==========================================
FROM node:20-alpine AS deps
WORKDIR /app

# Cài đặt thư viện hệ thống cần thiết cho native addons (bcrypt, sharp)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
# Cài đặt chính xác theo package-lock.json và bỏ qua devDependencies
RUN npm ci --omit=dev && npm cache clean --force

# ==========================================
# Stage 2: Production Runner
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app

# Cài dumb-init để xử lý PID 1 và forward tín hiệu SIGTERM chuẩn xác
RUN apk add --no-cache dumb-init

ENV NODE_ENV=production
ENV PORT=8888

# Tạo thư mục logs/uploads và phân quyền cho user node
RUN mkdir -p /app/logs /app/uploads && chown -R node:node /app

# Copy node_modules từ stage deps
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
# Copy toàn bộ mã nguồn
COPY --chown=node:node . .

# Chuyển sang non-root user vì lý do bảo mật
USER node

EXPOSE 8888

# Healthcheck nội bộ gọi route /api/health
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 8888) + '/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
# Dùng exec để node process thay thế shell và nhận trực tiếp signal từ dumb-init
CMD ["sh", "-c", "npx sequelize-cli db:migrate && exec node src/server.js"]
