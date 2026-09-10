"use strict";

/**
 * ============================================================
 * MIGRATION: Thêm view_count và sold_count vào bảng products
 * ============================================================
 *
 * TƯ DUY NGHIỆP VỤ - TẠI SAO CẦN 2 CỘT NÀY?
 *
 * 1. view_count (Lượt xem):
 *    - Đo lường mức độ quan tâm của khách hàng
 *    - Shopee/Lazada dùng để: rank sản phẩm, phân tích hành vi, gợi ý sản phẩm
 *    - Tăng social proof: "Sản phẩm được xem 10.000 lần" → khách tin tưởng hơn
 *
 * 2. sold_count (Đã bán):
 *    - Chỉ số quan trọng nhất của TMĐT: bao nhiêu người đã mua?
 *    - Là "social proof" mạnh nhất: "Đã bán 5.000+" → khách yên tâm mua
 *    - Dùng để sắp xếp "Bán chạy", "Best seller"
 *    - Làm input cho thuật toán gợi ý sản phẩm
 *
 * TẠI SAO LƯU DENORMALIZED (trùng lặp) THAY VÌ TÍNH TRỰC TIẾP?
 *
 *   Cách chậm (không dùng):
 *     SELECT SUM(quantity) FROM order_items
 *     JOIN orders ON ... WHERE product_id = ? AND status = 'delivered'
 *     → Mỗi lần load trang sản phẩm phải JOIN 2 bảng lớn → chậm
 *
 *   Cách nhanh (dùng): Lưu luôn vào cột sold_count trên bảng products
 *     SELECT sold_count FROM products WHERE id = ?
 *     → Chỉ query 1 bảng, 1 cột → cực nhanh
 *
 *   Đánh đổi: sold_count có thể không realtime 100%,
 *   nhưng với TMĐT điều này hoàn toàn chấp nhận được
 *
 * BACKFILL - Tại sao cần?
 *   Khi thêm cột mới vào hệ thống đang chạy, giá trị mặc định = 0
 *   Nhưng đã có hàng ngàn đơn hàng cũ → sold_count sai!
 *   → Phải chạy script tính lại từ dữ liệu lịch sử
 * ============================================================
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable("products");

    /**
     * Thêm cột view_count
     * Tại sao DEFAULT 0? Sản phẩm mới tạo chưa có ai xem → 0 là hợp lý
     * Tại sao NOT NULL? Không cho phép NULL để tránh lỗi khi tính toán tổng hợp
     */
    if (!tableDescription.view_count) {
      await queryInterface.addColumn("products", "view_count", {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment:
          "Tổng số lượt xem sản phẩm (dedup theo userId/IP trong 24h bởi Redis)",
      });
    }

    /**
     * Thêm cột sold_count
     * Chỉ tính từ đơn hàng có status = 'delivered' (đã giao thành công)
     * Không tính: pending, processing, shipped, cancelled
     */
    if (!tableDescription.sold_count) {
      await queryInterface.addColumn("products", "sold_count", {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment:
          "Tổng số lượng đã bán thành công (chỉ tính từ đơn status=delivered)",
      });
    }

    /**
     * BACKFILL sold_count từ dữ liệu lịch sử
     *
     * TƯ DUY KỸ THUẬT:
     * Dùng SQL thuần thay vì Sequelize ORM vì:
     * 1. Hiệu suất: Chạy 1 câu SQL duy nhất trên DB thay vì N queries từ Node.js
     * 2. Atomicity: Toàn bộ cập nhật xảy ra trong 1 transaction
     * 3. Đơn giản: Không cần load hàng ngàn record vào memory Node.js
     *
     * Câu SQL giải thích:
     *   - Subquery: Tính tổng quantity của từng product từ order_items
     *     khi đơn hàng tương ứng có status = 'delivered'
     *   - COALESCE(..., 0): Nếu product chưa có đơn delivered nào → 0
     *   - UPDATE ... FROM ...: PostgreSQL syntax để JOIN trong UPDATE
     */
    await queryInterface.sequelize.query(`
      UPDATE products AS p
      SET sold_count = COALESCE(sales.total_sold, 0)
      FROM (
        SELECT
          oi.product_id,
          SUM(oi.quantity) AS total_sold
        FROM order_items oi
        INNER JOIN orders o ON oi.order_id = o.id
        WHERE o.status = 'delivered'
        GROUP BY oi.product_id
      ) AS sales
      WHERE p.id = sales.product_id
    `);

    console.log(
      "[Migration] ✅ Đã thêm view_count, sold_count và backfill sold_count thành công"
    );
  },

  async down(queryInterface, Sequelize) {
    /**
     * Rollback: Xóa 2 cột nếu cần hoàn tác migration
     * Cẩn thận: Dữ liệu view_count và sold_count sẽ bị mất
     */
    const tableDescription = await queryInterface.describeTable("products");

    if (tableDescription.sold_count) {
      await queryInterface.removeColumn("products", "sold_count");
    }
    if (tableDescription.view_count) {
      await queryInterface.removeColumn("products", "view_count");
    }

    console.log("[Migration] ↩️  Đã rollback: xóa view_count và sold_count");
  },
};
