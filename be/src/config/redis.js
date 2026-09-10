/**
 * ============================================================
 * CẤU HÌNH REDIS CLIENT
 * ============================================================
 *
 * TƯ DUY NGHIỆP VỤ:
 * Redis (Remote Dictionary Server) là một in-memory database.
 * Nó hoạt động như một "bộ nhớ đệm siêu nhanh" nằm trước PostgreSQL.
 *
 * Trong dự án này, Redis được dùng để giải quyết bài toán:
 *   "Làm sao đếm lượt xem CHÍNH XÁC mà KHÔNG bị spam khi traffic cao?"
 *
 * Ví dụ nghiệp vụ thực tế:
 *   - 1 user reload trang 10 lần → chỉ đếm 1 lượt xem (trong 24h)
 *   - 10.000 user xem sản phẩm → 10.000 lượt xem, KHÔNG phải 100.000
 *   - Bot/crawler → bị lọc bởi IP rate-limit
 *
 * TẠI SAO DÙNG REDIS THAY VÌ POSTGRESQL CHO DEDUPLICATION?
 *   - PostgreSQL: Mỗi check phải query DB → chậm (10-50ms/query)
 *   - Redis: Lấy dữ liệu từ RAM → cực nhanh (<1ms/query)
 *   - Redis TTL (Time To Live): Tự động xóa key sau 24h mà không cần cron job
 *
 * KIẾN TRÚC LUỒNG DỮ LIỆU:
 *   User xem sản phẩm
 *       ↓
 *   [Redis] Kiểm tra key "view:{productId}:{identifier}" có tồn tại?
 *       ↓ Không có                    ↓ Có rồi
 *   Set key TTL 24h              Bỏ qua (đã xem)
 *       ↓
 *   [PostgreSQL] UPDATE products SET view_count = view_count + 1
 * ============================================================
 */

const { createClient } = require("redis");

// ============================================================
// KHỞI TẠO REDIS CLIENT
// Dùng Singleton Pattern: chỉ tạo 1 instance dùng chung toàn app
// Tránh tạo quá nhiều connection tốn tài nguyên
// ============================================================
let redisClient = null;
let isConnected = false;

/**
 * Khởi tạo và kết nối Redis client
 * Được gọi 1 lần khi server khởi động
 *
 * QUAN TRỌNG: Dùng "graceful degradation" - nếu Redis bị lỗi,
 * ứng dụng vẫn hoạt động bình thường (chỉ mất tính năng dedup view)
 * → Tránh Single Point Of Failure cho hệ thống
 */
const connectRedis = async () => {
  try {
    redisClient = createClient({
      socket: {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT) || 6379,

        // Thời gian tối đa chờ kết nối (ms)
        // Nếu Redis chưa sẵn sàng khi app start (Docker), tự thử lại
        connectTimeout: 5000,

        // Tự động reconnect khi mất kết nối
        // Chiến lược: exponential backoff (thử lại 1s, 2s, 4s, 8s...)
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            // Sau 10 lần thử → bỏ cuộc, không reconnect nữa
            console.error("[Redis] Không thể kết nối sau 10 lần thử. Bỏ qua.");
            return false;
          }
          // Tăng dần thời gian chờ: min(retry * 500ms, 5000ms)
          return Math.min(retries * 500, 5000);
        },
      },
      password: process.env.REDIS_PASSWORD || undefined,
    });

    // Lắng nghe sự kiện lỗi để không crash ứng dụng
    // Nếu không handle event "error", Node.js sẽ throw uncaught exception
    redisClient.on("error", (err) => {
      console.error("[Redis] Lỗi kết nối:", err.message);
      isConnected = false;
    });

    redisClient.on("connect", () => {
      console.log("[Redis] ✅ Đã kết nối Redis thành công");
      isConnected = true;
    });

    redisClient.on("reconnecting", () => {
      console.log("[Redis] 🔄 Đang thử kết nối lại...");
      isConnected = false;
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error("[Redis] ❌ Không thể kết nối Redis:", error.message);
    console.warn("[Redis] ⚠️  Hệ thống vẫn hoạt động nhưng view dedup bị tắt");
    // KHÔNG throw error → app vẫn chạy bình thường
    isConnected = false;
    return null;
  }
};

/**
 * Lấy Redis client instance
 * Trả về null nếu Redis chưa kết nối (graceful degradation)
 */
const getRedisClient = () => {
  if (!isConnected || !redisClient) return null;
  return redisClient;
};

/**
 * Kiểm tra Redis có sẵn sàng không
 */
const isRedisReady = () => isConnected;

/**
 * Đóng kết nối Redis khi app shutdown
 * Quan trọng để tránh memory leak khi restart server
 */
const disconnectRedis = async () => {
  if (redisClient && isConnected) {
    await redisClient.quit();
    console.log("[Redis] Đã đóng kết nối.");
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  isRedisReady,
  disconnectRedis,
};
