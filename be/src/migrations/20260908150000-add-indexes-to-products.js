"use strict";

/**
 * ============================================================
 * MIGRATION: Thêm indexes cho sold_count và view_count
 * ============================================================
 *
 * TƯ DUY KỸ THUẬT — TẠI SAO CẦN INDEX?
 *
 * Hãy tưởng tượng bảng `products` như một cuốn sách 1000 trang.
 * Khi query "TOP 10 sản phẩm bán chạy nhất":
 *
 *   KHÔNG CÓ INDEX:
 *   PostgreSQL phải đọc TOÀN BỘ 1000 trang → sắp xếp → lấy 10 dòng đầu
 *   → Chi phí: O(N log N) với N = số sản phẩm
 *   → 1000 sản phẩm: cần sort 1000 dòng
 *   → 100.000 sản phẩm: cần sort 100.000 dòng (chậm dần theo thời gian)
 *
 *   CÓ INDEX (B-tree):
 *   Index là "mục lục đã sắp xếp sẵn" của cột sold_count
 *   → PostgreSQL tra mục lục → lấy 10 entry đầu tiên → fetch row tương ứng
 *   → Chi phí: O(log N + 10) ≈ O(log N) — gần như không đổi dù data tăng
 *
 * KHI NÀO NÊN THÊM INDEX?
 *   ✅ Cột thường xuất hiện trong ORDER BY của query quan trọng
 *   ✅ Bảng có nhiều dữ liệu (> 1000 dòng)
 *   ✅ Query này chạy thường xuyên (trang chủ, API bán chạy)
 *
 * ĐÁNH ĐỔI (Trade-off):
 *   + SELECT nhanh hơn nhiều (index scan thay vì full table scan)
 *   - INSERT/UPDATE chậm hơn một chút (phải cập nhật index)
 *   - Tốn thêm ~5-20% dung lượng ổ đĩa
 *
 *   → Hoàn toàn chấp nhận được cho bài toán này:
 *     WRITE: hiếm (chỉ khi có đơn delivered)
 *     READ:  thường xuyên (mỗi lần user vào trang chủ)
 *
 * VERIFY sau khi chạy migration:
 *   EXPLAIN ANALYZE
 *   SELECT * FROM products ORDER BY sold_count DESC LIMIT 10;
 *   → Phải thấy: "Index Scan Backward using idx_products_sold_count"
 *   → Không được thấy: "Seq Scan on products" (full scan)
 * ============================================================
 */
module.exports = {
  async up(queryInterface) {
    // Kiểm tra xem index đã tồn tại chưa trước khi tạo
    // (tránh lỗi nếu chạy migration 2 lần)
    const tableIndexes = await queryInterface.showIndex("products");
    const indexNames = tableIndexes.map((idx) => idx.name);

    /**
     * Index 1: sold_count DESC
     *
     * Dùng cho query:
     *   SELECT * FROM products ORDER BY sold_count DESC LIMIT 10
     *   (Trang "Bán chạy" / Best Sellers)
     *
     * DESC: Vì luôn lấy sản phẩm bán NHIỀU NHẤT trước
     * → Index DESC phù hợp với ORDER BY sold_count DESC
     * → Tránh việc DB phải đọc ngược index ASC
     */
    if (!indexNames.includes("idx_products_sold_count")) {
      await queryInterface.addIndex("products", ["sold_count"], {
        name: "idx_products_sold_count",
        // Sequelize không hỗ trợ DESC index trực tiếp → dùng raw SQL
      });
      console.log("[Migration] ✅ Đã tạo index idx_products_sold_count");
    } else {
      console.log("[Migration] ⏩ Index idx_products_sold_count đã tồn tại, bỏ qua");
    }

    /**
     * Index 2: view_count DESC
     *
     * Dùng cho query:
     *   SELECT * FROM products ORDER BY view_count DESC LIMIT 10
     *   (Trang "Được xem nhiều nhất" / Most Viewed)
     *
     * Chuẩn bị cho tính năng "Trending" sau này
     */
    if (!indexNames.includes("idx_products_view_count")) {
      await queryInterface.addIndex("products", ["view_count"], {
        name: "idx_products_view_count",
      });
      console.log("[Migration] ✅ Đã tạo index idx_products_view_count");
    } else {
      console.log("[Migration] ⏩ Index idx_products_view_count đã tồn tại, bỏ qua");
    }

    console.log("[Migration] ✅ Hoàn thành: indexes cho sold_count và view_count");
  },

  async down(queryInterface) {
    /**
     * Rollback: Xóa indexes khi cần hoàn tác migration
     * Lưu ý: Xóa index KHÔNG xóa dữ liệu trong cột
     */
    const tableIndexes = await queryInterface.showIndex("products");
    const indexNames = tableIndexes.map((idx) => idx.name);

    if (indexNames.includes("idx_products_sold_count")) {
      await queryInterface.removeIndex("products", "idx_products_sold_count");
      console.log("[Migration] ↩️  Đã xóa index idx_products_sold_count");
    }

    if (indexNames.includes("idx_products_view_count")) {
      await queryInterface.removeIndex("products", "idx_products_view_count");
      console.log("[Migration] ↩️  Đã xóa index idx_products_view_count");
    }
  },
};
