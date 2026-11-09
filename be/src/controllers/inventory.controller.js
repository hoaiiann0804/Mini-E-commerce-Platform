const { validateInventoryQuery, validateInventoryMovement } = require("../validators/inventory.validator");
const { Op, QueryTypes } = require("sequelize");
const sequelize = require("../config/sequelize");
const Inventory = require("../models/inventoryTransaction");
const service = require("../services/inventory.service");
const { catchAsync } = require("../shared/utils/catchAsync");
const { AppError } = require("../middlewares/errorHandler");

const getStock = catchAsync(async (req, res) => {
  const q = validateInventoryQuery(req.query);
  /**
   * BUSINESS LOGIC - TỒN KHO & TÌM KIẾM HÀNG HÓA:
   * 1. Hàng hóa đơn (không biến thể): tìm theo tên sản phẩm hoặc SKU sản phẩm.
   * 2. Hàng hóa có biến thể: mỗi biến thể quản lý tồn riêng (vd: 16GB-1TB có tồn 20).
   *    Cho phép tìm kiếm theo:
   *    - Tên đầy đủ ("Tên SP / Tên biến thể")
   *    - SKU của chính biến thể đó (v.sku)
   *    - SKU của sản phẩm cha (p.sku) -> Giúp thủ kho gõ mã SKU gốc của máy vẫn tìm ra toàn bộ biến thể.
   */
  const where = `WHERE (name ILIKE :search OR COALESCE(sku,'') ILIKE :search OR COALESCE("parentSku",'') ILIKE :search)
    AND (:low = false OR "stockQuantity" <= 5)`;
  const cte = `WITH stock AS (
    SELECT p.id AS "productId", NULL::uuid AS "variantId", p.name, p.sku, NULL::varchar AS "parentSku",
      p.stock_quantity AS "stockQuantity", p.status='active' AS "isAvailable"
    FROM products p WHERE NOT COALESCE(p.is_variant_product,false)
    UNION ALL
    SELECT p.id,v.id,p.name || ' / ' || v.name,v.sku,p.sku AS "parentSku",v.stock_quantity,(v.is_available AND p.status='active')
    FROM product_variants v JOIN products p ON p.id=v.product_id
  )`;
  const replacements = { search: `%${q.search}%`, low: q.lowStock, limit: q.limit, offset: (q.page-1)*q.limit };
  const [rows, counts] = await Promise.all([
    sequelize.query(`${cte} SELECT *, "stockQuantity" <= 5 AS "lowStock" FROM stock ${where} ORDER BY "stockQuantity", "productId", "variantId" NULLS FIRST LIMIT :limit OFFSET :offset`, { replacements, type: QueryTypes.SELECT }),
    sequelize.query(`${cte} SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE "stockQuantity"<=5)::int AS "lowStock", COALESCE(SUM("stockQuantity"),0)::bigint AS units FROM stock ${where}`, { replacements, type: QueryTypes.SELECT }),
  ]);
  res.json({ status: "success", data: { rows, ...counts[0], page: q.page } });
});

function historyWhere(q) {
  const where = {};
  for (const key of ["productId","variantId","type"]) if (q[key]) where[key] = q[key];
  if (q.search) where[Op.or] = [ { sku: { [Op.iLike]: `%${q.search}%` } }, { productName: { [Op.iLike]: `%${q.search}%` } } ];
  if (q.from || q.to) where.createdAt = { ...(q.from ? { [Op.gte]: q.from } : {}), ...(q.to ? { [Op.lte]: q.to } : {}) };
  return where;
}
const getTransactions = catchAsync(async (req, res) => {
  const q = validateInventoryQuery(req.query);
  const { rows, count } = await Inventory.findAndCountAll({ where: historyWhere(q), order: [["createdAt","DESC"],["id","DESC"]], limit: q.limit, offset: (q.page-1)*q.limit });
  res.json({ status: "success", data: { rows, total: count, page: q.page } });
});

const getStats = catchAsync(async (req, res) => {
  const q = validateInventoryQuery(req.query);
  // Calendar buckets in Vietnam time; OPENING is excluded from operational flows.
  const from = q.from || new Date(Date.now()-30*86400000);
  const to = q.to || new Date();
  if (to < from || to-from > 366*86400000) throw new AppError("Chọn khoảng tối đa 366 ngày", 400);
  const rows = await sequelize.query(`SELECT to_char(created_at AT TIME ZONE 'Asia/Ho_Chi_Minh','YYYY-MM-DD') AS day,
    SUM(CASE WHEN type='IN' THEN quantity_change ELSE 0 END)::bigint AS incoming,
    SUM(CASE WHEN type='OUT' THEN -quantity_change ELSE 0 END)::bigint AS outgoing,
    SUM(CASE WHEN type IN ('RETURN','RELEASE') THEN quantity_change ELSE 0 END)::bigint AS restored,
    SUM(CASE WHEN type='ADJUSTMENT' THEN quantity_change ELSE 0 END)::bigint AS adjustments
    FROM inventory_transactions WHERE created_at BETWEEN :from AND :to AND type <> 'OPENING'
    AND (:productId IS NULL OR product_id=CAST(:productId AS uuid))
    GROUP BY day ORDER BY day`, { replacements: { from, to, productId: q.productId || null }, type: QueryTypes.SELECT });
  res.json({ status: "success", data: rows.map(row => ({ ...row, incoming: Number(row.incoming), outgoing: Number(row.outgoing), restored: Number(row.restored), adjustments: Number(row.adjustments) })) });
});

const createTransaction = catchAsync(async (req, res) => {
  const data = validateInventoryMovement(req.body);
  const result = await service.manual(data, req.user);
  res.status(201).json({ status: "success", data: result });
});

module.exports = { getStock, getTransactions, getStats, createTransaction };
