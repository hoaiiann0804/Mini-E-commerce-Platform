/**
 * ============================================================
 * PRODUCT ANALYTICS SERVICE
 * Xử lý lượt xem (viewCount) và lượt mua (soldCount)
 * ============================================================
 *
 * TƯ DUY KIẾN TRÚC - TẠI SAO TÁCH RA SERVICE RIÊNG?
 *
 * Nguyên tắc Single Responsibility:
 *   - Controller: Nhận request, trả response
 *   - Service: Chứa business logic phức tạp
 *   - Repository/Model: Tương tác với DB
 *
 * "Tracking view" là business logic phức tạp (cần Redis + DB + dedup logic)
 * → Để ở controller sẽ làm controller phình to, khó test, khó maintain
 * → Tách ra service: dễ unit test, dễ thay đổi logic sau này
 *
 * VÍ DỤ THỰC TẾ:
 * Nếu sau này muốn đổi từ Redis sang database hoặc thêm analytics event,
 * chỉ cần sửa file này, KHÔNG đụng vào controller hay route
 * ============================================================
 */

const { getRedisClient, isRedisReady } = require("../../../config/redis");
const { Product, OrderItem, sequelize } = require("../../../models");
const { Op } = require("sequelize");

// ============================================================
// CONSTANTS - Các hằng số nghiệp vụ
// ============================================================

/**
 * TTL (Time To Live) cho key deduplication trong Redis
 *
 * TƯ DUY NGHIỆP VỤ:
 * Tại sao 24 giờ?
 * - Nếu 1h: User xem buổi sáng, buổi tối xem lại → đếm 2 lần (quá ít)
 * - Nếu 7 ngày: User quay lại sau 1 tuần → vẫn không đếm (quá nhiều)
 * - 24h = 1 ngày: Cân bằng hợp lý, phù hợp với chu kỳ mua sắm
 * Shopee/Lazada dùng khoảng 24h theo phân tích ngành
 */
const VIEW_DEDUP_TTL_SECONDS = 24 * 60 * 60; // 24 giờ = 86400 giây

/**
 * Prefix cho Redis key
 * Naming convention: "{domain}:{entity}:{id}:{identifier}"
 * Dễ debug, dễ tìm kiếm khi cần inspect Redis
 */
const REDIS_VIEW_PREFIX = "product:view";

// ============================================================
// HÀM CHÍNH: TRACK VIEW
// ============================================================

/**
 * Theo dõi lượt xem sản phẩm với deduplication qua Redis
 *
 * LUỒNG XỬ LÝ (Flow):
 * ┌─────────────────────────────────────────────────────┐
 * │  1. Tạo unique identifier (userId hoặc IP)          │
 * │  2. Tạo Redis key: "product:view:{prodId}:{ident}"  │
 * │  3. Kiểm tra key trong Redis:                       │
 * │     - Đã có → RETURN (đã xem, không đếm thêm)      │
 * │     - Chưa có → SET key TTL 24h + tăng count DB    │
 * │  4. Cập nhật view_count trong PostgreSQL            │
 * └─────────────────────────────────────────────────────┘
 *
 * @param {string} productId - UUID của sản phẩm
 * @param {Object} options - { userId, ip } - dùng userId nếu đăng nhập, ip nếu không
 * @returns {Promise<{counted: boolean, viewCount: number}>}
 *   counted: true nếu thực sự tăng count, false nếu bị dedup
 */
const trackProductView = async (productId, { userId, ip }) => {
  /**
   * BƯỚC 1: Xác định "identifier" - ai đang xem?
   *
   * TƯ DUY NGHIỆP VỤ:
   * - Đã đăng nhập → dùng userId: chính xác hơn, 1 user = 1 account
   * - Chưa đăng nhập → dùng IP: best-effort, 1 IP có thể nhiều user
   *   (vd: cùng wifi) nhưng đây là trade-off chấp nhận được
   *
   * Tại sao không LUÔN dùng IP?
   * - User đổi mạng wifi → IP đổi → bị đếm lại dù cùng 1 người
   * - userId ổn định hơn, chính xác hơn
   */
  const identifier = userId ? `user:${userId}` : `ip:${ip}`;

  /**
   * BƯỚC 2: Tạo Redis key
   * Format: "product:view:{productId}:{identifier}"
   * Ví dụ: "product:view:abc-123:user:xyz-456"
   *         "product:view:abc-123:ip:192.168.1.1"
   *
   * Mỗi cặp (sản phẩm, user/IP) = 1 key riêng biệt
   * → Sau 24h, Redis tự động xóa key (do TTL) → user có thể xem lại
   */
  const redisKey = `${REDIS_VIEW_PREFIX}:${productId}:${identifier}`;

  try {
    const redis = getRedisClient();

    /**
     * BƯỚC 3: Kiểm tra Redis (Deduplication logic)
     *
     * TƯ DUY KỸ THUẬT - REDIS SET NX (Not eXist):
     * - SET key value EX ttl NX:
     *   NX = "chỉ set nếu key CHƯA tồn tại"
     * - Nếu key đã tồn tại → trả về null (không làm gì)
     * - Nếu key chưa có → set key + trả về "OK"
     *
     * Tại sao dùng SET NX thay vì GET rồi SET?
     * - GET → SET: 2 operations riêng biệt → Race condition!
     *   (2 request cùng GET thấy key chưa có → cả 2 đều SET → đếm 2 lần)
     * - SET NX: Atomic operation (1 bước duy nhất) → Không có race condition
     * - Đây là pattern "Check-Then-Act" được giải quyết bằng atomic operation
     */
    if (redis) {
      const wasSet = await redis.set(redisKey, "1", {
        EX: VIEW_DEDUP_TTL_SECONDS, // Hết hạn sau 24h
        NX: true, // Chỉ set nếu chưa có
      });

      if (!wasSet) {
        /**
         * Key đã tồn tại → user/IP này đã xem trong 24h
         * → KHÔNG tăng count → return false
         *
         * TƯ DUY NGHIỆP VỤ:
         * "User refresh trang 5 lần" → chỉ đếm 1 lần
         * Đây là behavior đúng chuẩn enterprise
         */
        return { counted: false };
      }
    }
    // Nếu Redis không sẵn sàng: bỏ qua dedup, vẫn tăng count
    // → Graceful degradation: chấp nhận đếm không chính xác hơn là sập tính năng

    /**
     * BƯỚC 4: Tăng view_count trong PostgreSQL
     *
     * TƯ DUY KỸ THUẬT - TẠI SAO DÙNG INCREMENT THAY VÌ UPDATE?
     *
     * Cách KHÔNG tốt (read-modify-write):
     *   const product = await Product.findByPk(id);
     *   await product.update({ viewCount: product.viewCount + 1 });
     *   → 2 queries: SELECT + UPDATE
     *   → Race condition: nếu 2 request đọc cùng value → mất 1 lần đếm
     *
     * Cách TỐT (atomic increment):
     *   Product.increment('viewCount', { where: { id } })
     *   → Tương đương: UPDATE products SET view_count = view_count + 1 WHERE id = ?
     *   → 1 query duy nhất, atomic → không race condition
     *   → Nếu 1000 request cùng lúc → view_count tăng đúng 1000
     */
    await Product.increment("viewCount", {
      by: 1,
      where: { id: productId },
    });

    return { counted: true };
  } catch (error) {
    /**
     * Bắt lỗi mà KHÔNG throw để tránh ảnh hưởng đến trải nghiệm người dùng
     *
     * TƯ DUY NGHIỆP VỤ:
     * "Tracking view" là tính năng phụ (non-critical)
     * Nếu nó lỗi, KHÔNG được làm hỏng tính năng chính (hiển thị sản phẩm)
     * → Log lỗi để debug, nhưng không throw
     */
    console.error("[ProductAnalytics] Lỗi khi track view:", {
      productId,
      identifier,
      error: error.message,
    });
    return { counted: false };
  }
};

// ============================================================
// HÀM: CẬP NHẬT SOLD COUNT KHI ĐƠN HÀNG DELIVERED
// ============================================================

/**
 * Cập nhật soldCount cho tất cả sản phẩm trong đơn hàng vừa delivered
 *
 * TƯ DUY NGHIỆP VỤ:
 * Khi admin chuyển đơn hàng sang "delivered":
 * → Đây là thời điểm DOANH THU ĐƯỢC GHI NHẬN
 * → soldCount phải được cập nhật NGAY LÚC ĐÓ
 * → Không delay, không batch job → đảm bảo tính nhất quán dữ liệu
 *
 * Ví dụ: 1 đơn có 3 sản phẩm:
 *   - iPhone 15: quantity = 2 → soldCount += 2
 *   - AirPods: quantity = 1  → soldCount += 1
 *   - Case: quantity = 3     → soldCount += 3
 *
 * @param {string} orderId - UUID của đơn hàng vừa được delivered
 */
const updateSoldCountOnDelivered = async (orderId) => {
  try {
    /**
     * BƯỚC 1: Lấy tất cả items trong đơn hàng
     *
     * Tại sao GROUP BY productId?
     * - 1 đơn có thể có nhiều variant của cùng 1 sản phẩm
     *   (vd: iPhone 15 màu đen qty=1 + iPhone 15 màu trắng qty=1)
     * - Cần cộng tất cả quantity của cùng productId
     * - SUM(quantity) = tổng số lượng của sản phẩm đó trong đơn
     */
    const itemGroups = await OrderItem.findAll({
      attributes: [
        "productId",
        [sequelize.fn("SUM", sequelize.col("quantity")), "totalQuantity"],
      ],
      where: { orderId },
      group: ["productId"],
      raw: true, // Trả về plain object thay vì Sequelize instance → nhẹ hơn
    });

    if (!itemGroups || itemGroups.length === 0) {
      console.warn(
        `[ProductAnalytics] Không tìm thấy items cho order ${orderId}`
      );
      return;
    }

    /**
     * BƯỚC 2: Cập nhật soldCount cho từng sản phẩm
     *
     * TƯ DUY KỸ THUẬT - PARALLEL vs SEQUENTIAL:
     * - Sequential (await từng cái): chậm hơn (tổng thời gian = sum of each)
     * - Parallel (Promise.all): nhanh hơn nhiều (tổng thời gian = max of each)
     *
     * Tại sao dùng Promise.all an toàn ở đây?
     * - Các update độc lập nhau (không phụ thuộc kết quả nhau)
     * - Mỗi update là atomic increment → không race condition
     * - Nếu 1 cái lỗi → Promise.all sẽ reject → được catch bên ngoài
     */
    await Promise.all(
      itemGroups.map(({ productId, totalQuantity }) =>
        /**
         * Dùng INCREMENT thay vì UPDATE để đảm bảo tính atomic
         * SQL tương đương: UPDATE products SET sold_count = sold_count + N WHERE id = ?
         * → An toàn khi nhiều đơn delivered cùng lúc
         */
        Product.increment("soldCount", {
          by: parseInt(totalQuantity),
          where: { id: productId },
        })
      )
    );

    console.log(
      `[ProductAnalytics] ✅ Đã cập nhật soldCount cho ${itemGroups.length} sản phẩm (order: ${orderId})`
    );
  } catch (error) {
    /**
     * Log lỗi nhưng KHÔNG throw
     *
     * TƯ DUY NGHIỆP VỤ:
     * "Cập nhật soldCount" là side effect của "delivered order"
     * Nếu nó lỗi, đơn hàng vẫn đã được delivered thành công
     * → Không nên rollback đơn hàng chỉ vì soldCount update lỗi
     * → Log để admin biết, có thể backfill lại sau
     */
    console.error(
      `[ProductAnalytics] ❌ Lỗi khi cập nhật soldCount cho order ${orderId}:`,
      error.message
    );
  }
};

// ============================================================
// HÀM TIỆN ÍCH: LẤY THỐNG KÊ SẢN PHẨM
// ============================================================

/**
 * Lấy thống kê view và sold của một sản phẩm
 * Dùng trong admin dashboard hoặc API chi tiết sản phẩm
 */
const getProductStats = async (productId) => {
  const product = await Product.findByPk(productId, {
    attributes: ["id", "name", "viewCount", "soldCount"],
  });

  if (!product) return null;

  /**
   * Tính tỷ lệ chuyển đổi (Conversion Rate)
   *
   * TƯ DUY NGHIỆP VỤ:
   * Conversion Rate = (Đã mua / Lượt xem) * 100%
   * - CR cao (>5%): Sản phẩm hấp dẫn, mô tả tốt, giá hợp lý
   * - CR thấp (<1%): Cần cải thiện ảnh, mô tả, hoặc xem lại giá
   * Shopee target CR ~2-5% cho sản phẩm trung bình
   */
  const conversionRate =
    product.viewCount > 0
      ? ((product.soldCount / product.viewCount) * 100).toFixed(2)
      : 0;

  return {
    productId: product.id,
    productName: product.name,
    viewCount: product.viewCount,
    soldCount: product.soldCount,
    conversionRate: parseFloat(conversionRate), // % khách xem → mua
  };
};

module.exports = {
  trackProductView,
  updateSoldCountOnDelivered,
  getProductStats,
};
