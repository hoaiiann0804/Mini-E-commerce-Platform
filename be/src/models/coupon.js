const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

/**
 * Model Coupon — Mã giảm giá
 *
 * TƯ DUY THIẾT KẾ:
 * - code tự động UPPERCASE qua hook beforeValidate: tránh duplicate do case mismatch
 * - type chỉ nhận 'percentage' hoặc 'fixed': enforce business rule ở cả Model lẫn DB
 * - value phải > 0: không cho tạo coupon "giảm 0 đồng"
 * - percentage value phải <= 100: không cho giảm 150%
 * - Timestamps true: audit trail tự động
 */
const Coupon = sequelize.define(
  'Coupon',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'Mã coupon không được để trống' },
        len: {
          args: [3, 50],
          msg: 'Mã coupon phải từ 3 đến 50 ký tự',
        },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('percentage', 'fixed'),
      allowNull: false,
      validate: {
        isIn: {
          args: [['percentage', 'fixed']],
          msg: 'Loại coupon phải là percentage hoặc fixed',
        },
      },
    },
    value: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: {
          args: [0.01],
          msg: 'Giá trị giảm phải lớn hơn 0',
        },
      },
    },
    minOrderAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'min_order_amount',
    },
    maxDiscount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      field: 'max_discount',
    },
    usageLimit: {
      type: DataTypes.INTEGER,
      allowNull: true, // null = unlimited
      field: 'usage_limit',
    },
    usagePerUser: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      field: 'usage_per_user',
    },
    usedCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'used_count',
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'start_date',
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
  },
  {
    tableName: 'coupons',
    timestamps: true,
    hooks: {
      // Auto-uppercase code trước khi validate/save
      // Đảm bảo "firstbuy10" và "FIRSTBUY10" luôn trở thành "FIRSTBUY10"
      beforeValidate: (coupon) => {
        if (coupon.code) {
          coupon.code = coupon.code.trim().toUpperCase();
        }
      },
    },
    validate: {
      // Cross-field validation: percentage không được > 100
      percentageMax() {
        if (this.type === 'percentage' && parseFloat(this.value) > 100) {
          throw new Error('Coupon percentage không được vượt quá 100%');
        }
      },
      // startDate phải trước expiresAt
      dateRange() {
        if (this.startDate && this.expiresAt && this.startDate >= this.expiresAt) {
          throw new Error('Ngày bắt đầu phải trước ngày hết hạn');
        }
      },
    },
  }
);

module.exports = Coupon;
