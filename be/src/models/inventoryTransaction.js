const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

module.exports = sequelize.define("InventoryTransaction", {
  id: { type: DataTypes.UUID, primaryKey: true },
  productId: DataTypes.UUID,
  variantId: DataTypes.UUID,
  type: DataTypes.STRING,
  quantityChange: DataTypes.INTEGER,
  previousStock: DataTypes.INTEGER,
  newStock: DataTypes.INTEGER,
  createdBy: DataTypes.UUID,
  actorName: DataTypes.TEXT,
  source: DataTypes.STRING,
  reason: DataTypes.TEXT,
  unitCost: DataTypes.DECIMAL(14, 2),
  currency: DataTypes.STRING,
  orderId: DataTypes.UUID,
  orderItemId: DataTypes.UUID,
  sku: DataTypes.TEXT,
  productName: DataTypes.TEXT,
  requestKey: DataTypes.STRING,
  createdAt: DataTypes.DATE,
}, { tableName: "inventory_transactions", timestamps: false, underscored: true });
