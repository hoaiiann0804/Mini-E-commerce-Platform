const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const RefreshToken = sequelize.define(
  "RefreshToken",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "user_id",
    },

    token: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "expires_at",
    },

    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "revoked_at",
    },
  },
  {
    tableName: "refresh_tokens",
    timestamps: true,
    underscored: true,
  },
);

module.exports = RefreshToken;