const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

/**
 * Model ReviewReply — Phản hồi chính thức từ Shop
 *
 * TƯ DUY THIẾT KẾ:
 * - Không có nhiều reply: quan hệ 1-1 với Review (hasOne/belongsTo)
 * - adminId nullable: Admin có thể bị xóa nhưng reply vẫn tồn tại
 * - content là TEXT để Admin viết phản hồi dài mà không bị cắt
 */
const ReviewReply = sequelize.define(
  'ReviewReply',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    reviewId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'review_id',
    },
    adminId: {
      type: DataTypes.UUID,
      allowNull: true, // SET NULL khi Admin bị xóa
      field: 'admin_id',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Nội dung phản hồi không được để trống' },
        len: {
          args: [1, 2000],
          msg: 'Nội dung phản hồi không được vượt quá 2000 ký tự',
        },
      },
    },
  },
  {
    tableName: 'review_replies',
    timestamps: true,
  }
);

module.exports = ReviewReply;
