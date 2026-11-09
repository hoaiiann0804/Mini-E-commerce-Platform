const { QueryTypes } = require("sequelize");
const { createHash } = require("node:crypto");
const sequelize = require("../config/sequelize");
const { AppError } = require("../middlewares/errorHandler");
const Inventory = require("../models/inventoryTransaction");
const models = () => require("../models");

function actor(user) {
  return { createdBy: user?.id || null, actorName: user ? (user.email || user.id) : "System" };
}

async function context(transaction, data) {
  if (!transaction) throw new Error("Inventory requires a transaction");
  await sequelize.query("SELECT set_config('app.inventory_context', :context, true)", {
    replacements: { context: JSON.stringify(data) }, transaction,
  });
}

async function lockProducts(items, transaction) {
  const ids = [...new Set(items.map((item) => item.productId))].sort();
  for (const id of ids) {
    await models().Product.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
  }
}

async function change(data, transaction) {
  const { Product, ProductVariant } = models();
  const product = await Product.findByPk(data.productId, { transaction, lock: transaction.LOCK.UPDATE });
  if (!product) throw new AppError("Không tìm thấy sản phẩm", 404);
  let target = product;
  if (data.variantId) {
    target = await ProductVariant.findOne({ where: { id: data.variantId, productId: product.id }, transaction, lock: transaction.LOCK.UPDATE });
    if (!target) throw new AppError("Biến thể không thuộc sản phẩm", 400);
  } else if (product.isVariantProduct) {
    throw new AppError("Hãy chọn biến thể để thay đổi kho", 400);
  }
  const delta = Number(data.quantityChange);
  if (!Number.isSafeInteger(delta) || delta === 0 || Math.abs(delta) > 2147483647) throw new AppError("Biến động phải là số nguyên khác 0", 400);
  const next = target.stockQuantity + delta;
  if (next < 0 || next > 2147483647) throw new AppError("Không đủ tồn kho hoặc vượt giới hạn số lượng", 409);
  await context(transaction, data);
  // SQL trigger owns audit and derived totals; avoid model hooks that also recompute totals.
  await target.update({ stockQuantity: next, ...(!data.variantId ? { inStock: next > 0 } : {}) }, { transaction, hooks: false });
  return { previousStock: next - delta, newStock: next };
}

async function orderMovement(order, items, type, user, transaction, reason) {
  await lockProducts(items, transaction);
  const sorted = [...items].sort((a, b) => `${a.productId}/${a.variantId || ''}`.localeCompare(`${b.productId}/${b.variantId || ''}`));
  for (const item of sorted) {
    await change({ productId: item.productId, variantId: item.variantId,
      quantityChange: type === "OUT" ? -item.quantity : item.quantity,
      type, ...actor(user), source: type === "OUT" ? "CHECKOUT" : "ORDER",
      reason, orderId: order.id, orderItemId: item.id,
    }, transaction);
  }
}

// Used by both Admin order endpoints and customer cancellation.
async function transitionOrder(id, status, user, { customer = false, note } = {}) {
  const { Order, OrderItem, Product } = models();
  return sequelize.transaction(async (transaction) => {
    const order = await Order.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!order || (customer && order.userId !== user.id)) throw new AppError("Không tìm thấy đơn hàng", 404);
    if (customer && status !== "cancelled") throw new AppError("Thao tác không hợp lệ", 403);
    if (order.status === status) return order;
    const allowed = {
      pending: ["processing", "cancelled"], processing: ["shipped", "cancelled"],
      shipped: ["delivered"], delivered: [], cancelled: [], expired: [],
    };
    if (!allowed[order.status]?.includes(status)) throw new AppError(`Không thể chuyển ${order.status} sang ${status}`, 409);
    const items = await OrderItem.findAll({ where: { orderId: id }, transaction });
    await lockProducts(items, transaction);
    if (status === "cancelled") {
      await orderMovement(order, items, "RELEASE", user, transaction, "Hoàn kho do hủy đơn");
      if (order.couponId) await require("./coupon.service").rollbackCoupon(order.couponId, transaction);
    }
    if (status === "delivered") {
      for (const item of items) await Product.increment("soldCount", { by: item.quantity, where: { id: item.productId }, transaction });
    }
    await order.update({ status, ...(note ? { notes: note } : {}), ...(status !== "pending" ? { expiresAt: null } : {}) }, { transaction });
    return order;
  });
}

async function manual(data, user) {
  const payload = { productId: data.productId, variantId: data.variantId || null, type: data.type,
    quantityChange: data.quantityChange, reason: data.reason.trim(), unitCost: data.unitCost ?? null,
    orderItemId: data.orderItemId || null, createdBy: user.id };
  const fingerprint = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  return sequelize.transaction(async (transaction) => {
    // Transaction-scoped advisory lock serializes retries even before the request row exists.
    await sequelize.query("SELECT pg_advisory_xact_lock(hashtext(:key))", { replacements: { key: data.requestKey }, transaction });
    const [existing] = await sequelize.query("SELECT fingerprint,result FROM inventory_requests WHERE request_key=:key", {
      replacements: { key: data.requestKey }, type: QueryTypes.SELECT, transaction,
    });
    if (existing) {
      if (existing.fingerprint !== fingerprint) throw new AppError("Mã yêu cầu đã dùng với nội dung khác", 409);
      return existing.result;
    }
    let orderId = null;
    if (data.type === "RETURN") {
      const { Order, OrderItem } = models();
      const item = await OrderItem.findByPk(data.orderItemId, { transaction });
      if (!item || item.productId !== data.productId || (item.variantId || null) !== (data.variantId || null)) throw new AppError("Dòng đơn hàng không khớp hàng hóa", 400);
      const order = await Order.findByPk(item.orderId, { transaction, lock: transaction.LOCK.UPDATE });
      if (order.status !== "delivered") throw new AppError("Chỉ nhận trả hàng từ đơn đã giao", 409);
      const returned = Number(await Inventory.sum("quantityChange", { where: { orderItemId: item.id, type: "RETURN" }, transaction })) || 0;
      if (returned + data.quantityChange > item.quantity) throw new AppError("Số trả vượt số lượng còn có thể hoàn", 409);
      orderId = order.id;
    }
    await change({ ...payload, orderId, ...actor(user), source: "ADMIN", requestKey: data.requestKey }, transaction);
    const result = (await Inventory.findOne({ where: { requestKey: data.requestKey }, transaction })).toJSON();
    await sequelize.query("INSERT INTO inventory_requests(request_key,fingerprint,result) VALUES(:key,:fingerprint,CAST(:result AS jsonb))", {
      replacements: { key: data.requestKey, fingerprint, result: JSON.stringify(result) }, transaction,
    });
    return result;
  });
}

// Catalog writes participate in one managed transaction via AsyncLocalStorage.
// Delay the HTTP body until COMMIT succeeds: no success response for rolled-back data.
function catalogMutation(handler) {
  return async (req, res, next) => {
    const originalJson = res.json;
    let body;
    res.json = function(value) { body = value; return this; };
    try {
      await sequelize.transaction(async (transaction) => {
        await context(transaction, { ...actor(req.user), source: "CATALOG", type: "ADJUSTMENT", reason: "Khởi tạo hoặc cập nhật danh mục" });
        await handler(req, res, (error) => { if (error) throw error; });
        if (res.statusCode >= 400) throw new AppError(body?.message || "Cập nhật thất bại", res.statusCode);
      });
    } finally { res.json = originalJson; }
    return res.json(body);
  };
}

async function saveVariants(productId, incoming, transaction) {
  const { Product, ProductVariant } = models();
  const product = await Product.findByPk(productId, { transaction, lock: transaction.LOCK.UPDATE });
  if (!product.isVariantProduct) throw new AppError("Không thể đổi sản phẩm đơn thành sản phẩm biến thể", 409);
  const existing = await ProductVariant.findAll({ where: { productId }, transaction });
  const used = new Set();
  const result = [];
  for (const entry of incoming) {
    // Older forms carry SKU but omit id. Match exact SKU only; never infer by position.
    const old = entry.id ? existing.find(v => v.id === entry.id) : existing.find(v => entry.sku && v.sku === entry.sku);
    if (entry.id && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(entry.id) && !old) throw new AppError("ID biến thể không thuộc sản phẩm", 400);
    if (old && used.has(old.id)) throw new AppError("Biến thể bị lặp", 400);
    const values = {};
    for (const key of ["name","sku","price","attributes","attributeValues","images","displayName","sortOrder","isDefault","isAvailable","compareAtPrice","specifications"]) {
      if (entry[key] !== undefined) values[key] = entry[key];
    }
    if (old) {
      // A stale catalog form must never overwrite stock changed by checkout.
      used.add(old.id);
      await old.update(values, { transaction });
      result.push(old);
    } else {
      if (Number(entry.stockQuantity ?? entry.stock ?? 0) !== 0) throw new AppError("Biến thể mới cần tồn 0; nhập hàng tại trang Tồn kho", 400);
      const created = await ProductVariant.create({ ...values, productId, stockQuantity: 0 }, { transaction });
      used.add(created.id);
      result.push(created);
    }
  }
  for (const old of existing) if (!used.has(old.id)) await old.update({ isAvailable: false }, { transaction });
  return result;
}

module.exports = { actor, context, change, lockProducts, orderMovement, transitionOrder, manual, catalogMutation, saveVariants };
