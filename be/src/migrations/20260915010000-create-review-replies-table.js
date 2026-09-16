'use strict';

/**
 * Migration: Tạo bảng review_replies
 *
 * TƯ DUY THIẾT KẾ:
 * 1. UNIQUE(review_id): Mỗi review chỉ được phép có đúng 1 phản hồi chính thức
 *    từ phía Shop. Constraint này được enforce ở tầng DB, không chỉ code.
 *    → Nếu Admin gửi 2 request cùng lúc, DB sẽ reject cái thứ 2 thay vì tạo duplicate.
 *
 * 2. ON DELETE CASCADE: Review bị xóa → Reply tự động xóa theo.
 *    → Không bao giờ có "reply mồ côi" (orphan records).
 *
 * 3. admin_id ON DELETE SET NULL: Admin bị xóa khỏi hệ thống → Reply vẫn còn,
 *    chỉ mất thông tin "ai đã reply". Giữ lại nội dung vì nó có giá trị với khách hàng.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('review_replies', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      review_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'reviews',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // Reply bị xóa khi review bị xóa
      },
      admin_id: {
        type: Sequelize.UUID,
        allowNull: true, // SET NULL khi admin bị xóa, reply vẫn còn
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
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

    // INDEX trên review_id để query nhanh khi load reviews kèm reply
    await queryInterface.addIndex('review_replies', ['review_id']);

    // UNIQUE constraint — enforce nghiệp vụ: 1 reply / review
    // Thay vì check bằng code (dễ bị race condition), để DB xử lý
    await queryInterface.addIndex('review_replies', ['review_id'], {
      unique: true,
      name: 'unique_reply_per_review',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('review_replies');
  },
};
