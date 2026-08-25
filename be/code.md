const pageInt = Math.max(1, parseInt(page));
const limitInt = Math.min(100, parseInt(limit) || 10); // cap limit for safety
const offset = (pageInt - 1) * limitInt;

// Validate sort fields to avoid SQL injection and ensure index usage
const ALLOWED_SORT_FIELDS = new Set([
  "createdAt",
  "price",
  "name",
  "featured",
  "updatedAt",
]);
const sortField = ALLOWED_SORT_FIELDS.has(sort) ? sort : "createdAt";
const sortOrder = String(order).toUpperCase() === "ASC" ? "ASC" : "DESC";

// Build simple where for products (do NOT include heavy joins here)
const whereConditions = {};
if (inStock !== undefined) whereConditions.inStock = inStock === "true";
if (featured !== undefined) whereConditions.featured = featured === "true";
if (status !== undefined) whereConditions.status = status;
else whereConditions.status = "active";

// Search: only use iLike on name/shortDescription/description (still may be slow without indexes)
if (search) {
  whereConditions[Op.or] = [
    { name: { [Op.iLike]: `%${search}%` } },
    { description: { [Op.iLike]: `%${search}%` } },
    { shortDescription: { [Op.iLike]: `%${search}%` } },
  ];
  // Note: searchKeywords array search removed from main where to avoid expensive operations here.
}

// Price filtering: apply only to product.price here (variant-aware filtering requires different approach)
if (minPrice !== undefined || maxPrice !== undefined) {
  whereConditions.price = {};
  if (minPrice !== undefined) whereConditions.price[Op.gte] = parseFloat(minPrice);
  if (maxPrice !== undefined) whereConditions.price[Op.lte] = parseFloat(maxPrice);
}

// Handle category filter by limiting to product IDs matching category via a lightweight join/subquery
let productIdFilter = null;
if (category) {     
  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      category
    );

  // Use raw query to get product ids for category to avoid multiplying rows in main query
  const categoryIdCondition = isUUID
    ? `pc.category_id = '${category}'`
    : `c.slug = '${category.replace("'", "''")}'`;

  const productIdsResult = await sequelize.query(
    `
    SELECT DISTINCT pc.product_id
    FROM product_categories pc         
    JOIN categories c ON c.id = pc.category_id
    WHERE ${categoryIdCondition}
    `,
    { type: sequelize.QueryTypes.SELECT }
  );

  const ids = productIdsResult.map((r) => r.product_id);
  if (ids.length === 0) {
    // no products for category -> short-circuit
    return res.status(200).json({
      status: "success",
      data: { total: 0, pages: 0, currentPage: pageInt, products: [] },
    });
  }
  productIdFilter = ids;
}

// 1) Count total (lightweight). If productIdFilter exists, count WHERE id IN (...)
const total = await Product.count({
  where: {
    ...whereConditions,
    ...(productIdFilter ? { id: { [Op.in]: productIdFilter } } : {}),
  },
});

// 2) Fetch product rows for the page (minimal columns)
const productsRaw = await Product.findAll({
  attributes: [
    "id",
    "name",
    "baseName",
    "price",
    "compareAtPrice",
    "images",
    "thumbnail",
    "inStock",
    "stockQuantity",
    "featured",
    "slug",
    "createdAt",
  ],
  where: {
    ...whereConditions,
    ...(productIdFilter ? { id: { [Op.in]: productIdFilter } } : {}),
  },
  include: [
    {
      association: "categories",
      through: { attributes: [] },
      attributes: ["id", "name", "slug"],
      required: false,
    },
  ],
  limit: limitInt,
  offset,
  order: [[sortField, sortOrder]],
  subQuery: false,
});

const productIds = productsRaw.map((p) => p.id);
if (productIds.length === 0) {
  return res.status(200).json({
    status: "success",
    data: {
      total,
      pages: Math.ceil(total / limitInt),
      currentPage: pageInt,
      products: [],
    },
  });
}

// 3) Get min variant price per product (aggregate) for only returned page products
const minVariantPrices = await ProductVariant.findAll({
  attributes: [
    "productId",
    [sequelize.fn("MIN", sequelize.col("price")), "minPrice"],
  ],
  where: { productId: { [Op.in]: productIds } },
  group: ["productId"],
  raw: true,
});
const minPriceMap = {};
minVariantPrices.forEach((r) => {
  minPriceMap[r.productId] = parseFloat(r.minPrice);
});

// 4) Get ratings aggregates per product
const ratingsAgg = await Review.findAll({
  attributes: [
    "productId",
    [sequelize.fn("AVG", sequelize.col("rating")), "avgRating"],
    [sequelize.fn("COUNT", sequelize.col("id")), "count"],
  ],
  where: { productId: { [Op.in]: productIds } },
  group: ["productId"],
  raw: true,
});
const ratingsMap = {};
ratingsAgg.forEach((r) => {
  ratingsMap[r.productId] = {
    average: parseFloat(parseFloat(r.avgRating || 0).toFixed(1)),
    count: parseInt(r.count || 0),
  };
});

// 5) Assemble final product list in memory
const products = productsRaw.map((p) => {
  const pj = p.toJSON();

  // Prefer min variant price if exists, otherwise product.price
  const variantMin = minPriceMap[pj.id];
  const displayPrice = typeof variantMin === "number" && !isNaN(variantMin)
    ? variantMin
    : parseFloat(pj.price) || 0;

  // Process images
  const processedImages = pj.images
    ? pj.images.map((img) => img.replace(/\\/g, "/"))
    : [];

  // Ratings
  const ratings = ratingsMap[pj.id] || { average: 0, count: 0 };

  return {
    ...pj,
    images: processedImages,
    price: displayPrice,
    compareAtPrice: pj.compareAtPrice ? parseFloat(pj.compareAtPrice) : null,
    ratings,
  };
});

res.status(200).json({
  status: "success",
  data: {
    total,
    pages: Math.ceil(total / limitInt),
    currentPage: pageInt,
    products,
  },
});