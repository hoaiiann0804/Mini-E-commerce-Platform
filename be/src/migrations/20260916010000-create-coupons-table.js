'use strict';

/**
 * Migration: Tạo bảng coupons
 *
 * TƯ DUY THIẾT KẾ:
 * 1. code UNIQUE + UPPER INDEX: Mã coupon không trùng lặp, tra cứu case-insensitive.
 *    User nhập "firstbuy10" hay "FIRSTBUY10" đều tìm được cùng 1 record.
 *
 * 2. type ENUM('percentage', 'fixed'): Chỉ 2 loại giảm giá:
 *    - percentage: Giảm X% giá trị đơn (VD: value=10 → giảm 10%)
 *    - fixed: Giảm số tiền cố định (VD: value=500000 → giảm 500K VND)
 *
 * 3. max_discount: Cap trần cho coupon percentage. Ví dụ: giảm 50% nhưng max 1 triệu.
 *    Không có max_discount → coupon 50% cho đơn 100 triệu sẽ giảm 50 triệu (nguy hiểm!).
 *
 * 4. usage_per_user: Chống abuse - 1 user chỉ dùng được N lần.
 *    Khác với usage_limit (tổng lượt toàn hệ thống).
 *
 * 5. is_active: Admin toggle on/off nhanh mà không cần xóa coupon.
 *    Xóa coupon sẽ mất lịch sử đối soát.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if table already exists (idempotent migration)
    let tableExists = false;
    try {
      await queryInterface.describeTable('coupons');
      tableExists = true;
    } catch (error) {
      tableExists = false;
    }

    if (tableExists) {
      console.log('[migration] coupons table already exists, skipping...');
      return;
    }

    await queryInterface.createTable('coupons', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      type: {
        type: Sequelize.ENUM('percentage', 'fixed'),
        allowNull: false,
      },
      value: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      min_order_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      max_discount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true, // null = không giới hạn (chỉ áp dụng cho percentage)
      },
      usage_limit: {
        type: Sequelize.INTEGER,
        allowNull: true, // null = unlimited
      },
      usage_per_user: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1, // Mặc định mỗi user dùng được 1 lần
      },
      used_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // INDEX trên code (UPPER) để tra cứu nhanh case-insensitive
    // PostgreSQL: CREATE UNIQUE INDEX ... ON coupons (UPPER(code))
    await queryInterface.sequelize.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "unique_coupon_code_upper" ON "coupons" (UPPER("code"))'
    );

    // INDEX trên is_active + expires_at — query coupon đang hoạt động
    await queryInterface.addIndex('coupons', ['is_active', 'expires_at'], {
      name: 'idx_coupons_active_expiry',
    });

    console.log('[migration] coupons table created successfully');
  },

  async down(queryInterface) {
    await queryInterface.dropTable('coupons');
  },
};
