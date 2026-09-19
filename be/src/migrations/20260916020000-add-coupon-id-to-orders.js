'use strict';

/**
 * Migration: Thêm coupon_id vào bảng orders
 *
 * TƯ DUY THIẾT KẾ:
 * 1. ON DELETE SET NULL: Nếu admin xóa coupon (dù plan không cho xóa, nhưng phòng thủ),
 *    order vẫn giữ lại giá trị discount đã tính. Chỉ mất reference đến coupon nào.
 *
 * 2. coupon_id nullable: Phần lớn đơn hàng không dùng coupon.
 *    Field này chỉ có giá trị khi khách hàng nhập mã thành công.
 *
 * 3. INDEX trên coupon_id: Phục vụ query "Coupon X đã được dùng ở những đơn nào?"
 *    và "User Y đã dùng coupon Z bao nhiêu lần?" (đếm usagePerUser).
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if column already exists (idempotent)
    const tableDesc = await queryInterface.describeTable('orders');
    if (tableDesc.coupon_id) {
      console.log('[migration] coupon_id column already exists on orders, skipping...');
      return;
    }

    await queryInterface.addColumn('orders', 'coupon_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'coupons',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    // INDEX cho query: "User X đã dùng coupon Y bao nhiêu lần?"
    await queryInterface.addIndex('orders', ['coupon_id'], {
      name: 'idx_orders_coupon_id',
    });

    console.log('[migration] coupon_id added to orders table');
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('orders', 'idx_orders_coupon_id');
    await queryInterface.removeColumn('orders', 'coupon_id');
  },
};
