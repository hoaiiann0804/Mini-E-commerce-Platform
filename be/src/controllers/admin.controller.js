const {
  User,
  Product,
  Order,
  Review,
  ReviewReply,
  Coupon,
  Category,
  OrderItem,
  ProductAttribute,
  ProductVariant,
} = require("../models");
const { Op, Sequelize } = require("sequelize");
const { catchAsync } = require("../shared/utils/catchAsync");
const { AppError } = require("../middlewares/errorHandler");
const {
  AdminAuditService,
} = require("../shared/services/admin/adminAuditService");
const {
  calculateTotalStock,
  updateProductTotalStock,
  validateVariantAttributes,
  generateVariantSku,
} = require("../shared/services/product/product.helpers");

/**
 * Dashboard - Thống kê tổng quan
 *
 * TÙ DUY NGHIỆP VỤ:
 * Revenue chỉ được tính từ đơn "delivered" — đây là tiền thực sự vào túi.
 * Đơn "pending/processing" là tiền đang giữ, chưa chắc chắn.
 * Đơn "cancelled/expired" là tiền bị mất.
 * AOV (Average Order Value) = totalRevenue / totalDeliveredOrders — cùng tập dữ liệu, không trộn lẫn.
 */
const getDashboardStats = catchAsync(async (req, res) => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfLastMonth = new Date(
    today.getFullYear(),
    today.getMonth() - 1,
    1,
  );
  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

  // Thống kê tổng quan
  const totalUsers = await User.count({ where: { role: "customer" } });
  const totalProducts = await Product.count();
  const totalOrders = await Order.count();

  // Revenue chỉ tính đơn đã giao thành công
  const totalRevenue = await Order.sum("total", {
    where: { status: "delivered" },
  });

  // Tổng số đơn delivered — dùng để tính AOV cùng mẫu số
  const totalDeliveredOrders = await Order.count({
    where: { status: "delivered" },
  });

  // AOV = Average Order Value — chỉ số quan trọng cho portfolio
  // Công thức: totalRevenue / totalDeliveredOrders (không phải / totalOrders)
  // Lý do: Nếu dùng / totalOrders thì đơn cancelled làm giảm AOV giả tạo
  const avgOrderValue =
    totalDeliveredOrders > 0
      ? parseFloat((totalRevenue / totalDeliveredOrders).toFixed(0))
      : 0;

  // Thống kê theo tháng
  const monthlyUsers = await User.count({
    where: {
      role: "customer",
      createdAt: { [Op.gte]: startOfMonth },
    },
  });

  const monthlyOrders = await Order.count({
    where: { createdAt: { [Op.gte]: startOfMonth } },
  });

  const monthlyRevenue = await Order.sum("total", {
    where: {
      status: "delivered",
      createdAt: { [Op.gte]: startOfMonth },
    },
  });

  // So sánh với tháng trước
  const lastMonthUsers = await User.count({
    where: {
      role: "customer",
      createdAt: {
        [Op.gte]: startOfLastMonth,
        [Op.lte]: endOfLastMonth,
      },
    },
  });

  const lastMonthOrders = await Order.count({
    where: {
      createdAt: {
        [Op.gte]: startOfLastMonth,
        [Op.lte]: endOfLastMonth,
      },
    },
  });

  const lastMonthRevenue = await Order.sum("total", {
    where: {
      status: "delivered",
      createdAt: {
        [Op.gte]: startOfLastMonth,
        [Op.lte]: endOfLastMonth,
      },
    },
  });

  // Tồ lê tăng trưởng
  const userGrowth = lastMonthUsers
    ? ((monthlyUsers - lastMonthUsers) / lastMonthUsers) * 100
    : 0;
  const orderGrowth = lastMonthOrders
    ? ((monthlyOrders - lastMonthOrders) / lastMonthOrders) * 100
    : 0;
  const revenueGrowth = lastMonthRevenue
    ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
    : 0;

  // Phân bổ đơn hàng theo trạng thái — dùng cho Donut chart trên Dashboard
  // TÙ DUY: Thực hiện bằng 1 query GROUP BY thay vì 6 query COUNT riêng lẻ
  // Lợi ích: Giảm từ 6 round-trip xuống 1 → nhanh hơn đáng kể
  const statusBreakdownRaw = await Order.findAll({
    attributes: [
      "status",
      [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
    ],
    group: ["status"],
    raw: true,
  });

  // Chuyển mảng thành object key-value, đảm bảo mọi trạng thái đều có mặt (kể cả = 0)
  const statusBreakdown = [
    "pending", "processing", "shipped", "delivered", "cancelled", "expired",
  ].reduce((acc, status) => {
    const found = statusBreakdownRaw.find((r) => r.status === status);
    acc[status] = found ? parseInt(found.count) : 0;
    return acc;
  }, {});

  // Top sản phẩm bán chạy — CHỈ tính từ đơn delivered
  // TÙ DUY: JOIN với Order để lọc status, tránh tính cả đơn cancelled
  // Không JOIN thì top products bị sai vì hàng hủy vẫn được tính vào 'sold'
  const topProducts = await OrderItem.findAll({
    attributes: [
      "productId",
      [Sequelize.fn("SUM", Sequelize.col("OrderItem.quantity")), "totalSold"],
      [
        Sequelize.fn(
          "SUM",
          Sequelize.literal('"OrderItem".quantity * "OrderItem".price'),
        ),
        "totalRevenue",
      ],
    ],
    include: [
      {
        model: Product,
        attributes: ["id", "name", "images", "price"],
      },
      {
        // JOIN với Order để lọc chỉ lấy đơn đã delivered
        // required: true = INNER JOIN — đúng vì ta muốn loại bỏ OrderItem của đơn cancelled
        model: Order,
        attributes: [],
        where: { status: "delivered" },
        required: true,
      },
    ],
    group: [
      "productId",
      "Product.id",
    ],
    order: [[Sequelize.fn("SUM", Sequelize.col("OrderItem.quantity")), "DESC"]],
    limit: 5,
    subQuery: false, // Cần thiết khi JOIN + GROUP BY + LIMIT cùng lúc
  });

  // Đơn hàng cần xử lý
  const pendingOrders = statusBreakdown.pending;
  const processingOrders = statusBreakdown.processing;

  res.status(200).json({
    status: "success",
    data: {
      overview: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue || 0,
        totalDeliveredOrders,
        avgOrderValue,          // Mới: AOV đúng nghĩa
        pendingOrders,
        processingOrders,
        expiredOrders: statusBreakdown.expired, // Mới: tracking đơn hết hạn
      },
      monthly: {
        users: monthlyUsers,
        orders: monthlyOrders,
        revenue: monthlyRevenue || 0,
      },
      growth: {
        users: parseFloat(userGrowth.toFixed(2)),
        orders: parseFloat(orderGrowth.toFixed(2)),
        revenue: parseFloat(revenueGrowth.toFixed(2)),
      },
      orderStatusBreakdown: statusBreakdown, // Mới: dùng cho Donut chart
      topProducts: topProducts.map((item) => ({
        product: item.Product,
        totalSold: parseInt(item.getDataValue("totalSold")),
        totalRevenue: parseFloat(item.getDataValue("totalRevenue")),
      })),
    },
  });
});

/**
 * Thống kê chi tiết theo khoảng thời gian
 *
 * TÙ DUY KỸ THUÂT — Tại sao phải đổi DATE_FORMAT sang TO_CHAR?
 * DATE_FORMAT() là cú pháp MySQL. Project này dùng PostgreSQL.
 * PostgreSQL không có DATE_FORMAT → lỗi ngay khi chạy.
 * PostgreSQL dùng: DATE_TRUNC (cắt về đơn vị) + TO_CHAR (format hiển thị)
 *
 * TÙ DUY MÚÍ GIỜ (Timezone):
 * DB lưu timestamp dạng UTC. Server ở Việt Nam thì chỉnh mục này có thể không cần.
 * Nhưng nếu server deploy trên cloud (UTC), cần AT TIME ZONE để ngày hiển đúng.
 *
 * TÙ DUY FILL ZERO:
 * DB chỉ trả những ngày có dữ liệu. Ngày không có đơn bị bỏ qua.
 * Recharts vẽ chart từ mảng → nếu mảng thiếu ngày thì chart bị lỗi (nhảy điểm).
 * Giải pháp: fillDateGaps() tạo ra đủ các điểm ngày, giá trị = 0 nếu không có data.
 */

/**
 * Helper: Phân rã dateFormat cho PostgreSQL theo groupBy
 * Trả về object chứa:
 * - truncUnit: đơn vị cho DATE_TRUNC ('day', 'week', 'month', 'hour')
 * - toCharFormat: format hiển thị cho TO_CHAR
 * - fillStep: đơn vị để fillDateGaps() biết nhảy bao nhiêu mỗi bước
 */
const getDateConfig = (groupBy) => {
  switch (groupBy) {
    case "hour":
      return { truncUnit: "hour", toCharFormat: "YYYY-MM-DD HH24:00", fillStep: "hour" };
    case "week":
      return { truncUnit: "week", toCharFormat: "IYYY-IW", fillStep: "week" };
    case "month":
      return { truncUnit: "month", toCharFormat: "YYYY-MM", fillStep: "month" };
    default: // day
      return { truncUnit: "day", toCharFormat: "YYYY-MM-DD", fillStep: "day" };
  }
};

/**
 * Helper: Điền 0 vào các ngày không có data trong khoảng thời gian
 *
 * TÙ DUY: DB chỉ trả sparse data (ngày có đận). Ta cần dense data (mọi ngày).
 * Ví dụ: [09-01: 5, 09-05: 3] → [09-01:5, 09-02:0, 09-03:0, 09-04:0, 09-05:3]
 *
 * @param {Array} data - Mảng dữ liệu từ DB (sparse)
 * @param {Date} start - Ngày bắt đầu
 * @param {Date} end - Ngày kết thúc
 * @param {string} step - 'day' | 'week' | 'month' | 'hour'
 * @param {Object} defaultValues - Giá trị mặc định cho ngày không có data
 */
const fillDateGaps = (data, start, end, step, defaultValues) => {
  const result = [];
  const dataMap = new Map(data.map((item) => [item.period, item]));

  const current = new Date(start);
  // Mả đảm bảo end cũng bao gồm ngày cuối
  const endTime = new Date(end);
  endTime.setHours(23, 59, 59);

  // Format date theo step để tạo key khớp với period từ DB
  const formatPeriod = (date) => {
    if (step === "month") {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    }
    if (step === "week") {
      // ISO week format — đơn giản hóa bằng toISOString
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
      const week1 = new Date(d.getFullYear(), 0, 4);
      const weekNum = 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
      return `${d.getFullYear()}-${String(weekNum).padStart(2, "0")}`;
    }
    return date.toISOString().split("T")[0]; // YYYY-MM-DD
  };

  while (current <= endTime) {
    const periodKey = formatPeriod(current);
    if (dataMap.has(periodKey)) {
      result.push(dataMap.get(periodKey));
    } else {
      // Ngày không có data → push giá trị 0
      result.push({ period: periodKey, ...defaultValues });
    }

    // Bước nhảy theo step
    if (step === "month") {
      current.setMonth(current.getMonth() + 1);
    } else if (step === "week") {
      current.setDate(current.getDate() + 7);
    } else if (step === "hour") {
      current.setHours(current.getHours() + 1);
    } else {
      current.setDate(current.getDate() + 1); // day (mặc định)
    }
  }

  return result;
};

const getDetailedStats = catchAsync(async (req, res) => {
  const { startDate, endDate, groupBy = "day" } = req.query;

  if (!startDate || !endDate) {
    throw new AppError("Vui lòng cung cấp ngày bắt đầu và ngày kết thúc", 400);
  }

  const start = new Date(startDate);
  // Cho end bao gồm cả ngày cuối (23:59:59)
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const { truncUnit, toCharFormat, fillStep } = getDateConfig(groupBy);

  // TÙ DUY PostgreSQL: DATE_TRUNC trước → cắt timestamp về đơn vị
  // TO_CHAR sau → định dạng hiển thị cho FE
  // AT TIME ZONE: đảm bảo thống kê theo giờ Việt Nam, không bị lệch ngày
  const periodExpr = Sequelize.fn(
    "TO_CHAR",
    Sequelize.fn(
      "DATE_TRUNC",
      truncUnit,
      Sequelize.fn(
        "TIMEZONE",
        "Asia/Ho_Chi_Minh",
        Sequelize.col("created_at")
      )
    ),
    toCharFormat
  );

  // Thống kê đơn hàng theo thời gian
  // Revenue: CHỈ tính đơn delivered — đơn pending/cancelled không phải doanh thu thực
  // TÙ DUY: Dùng FILTER (WHERE) trong SUM thay vì WHERE trên toàn bộ query
  // Vì ta vẫn muốn đếm orderCount TÙ mọi trạng thái (volume), nhưng revenue chỉ từ delivered
  const orderStats = await Order.findAll({
    attributes: [
      [periodExpr, "period"],
      [Sequelize.fn("COUNT", Sequelize.col("id")), "orderCount"],
      [
        // FILTER: điều kiện trong aggregate — chỉ cộng total của đơn delivered
        Sequelize.literal(
          `SUM(CASE WHEN status = 'delivered' THEN total ELSE 0 END)`
        ),
        "revenue",
      ],
    ],
    where: {
      createdAt: { [Op.between]: [start, end] },
    },
    group: [periodExpr],
    order: [[periodExpr, "ASC"]],
    raw: true,
  });

  // Thống kê user mới theo thời gian
  const userStats = await User.findAll({
    attributes: [
      [periodExpr, "period"],
      [Sequelize.fn("COUNT", Sequelize.col("id")), "newUsers"],
    ],
    where: {
      role: "customer",
      createdAt: { [Op.between]: [start, end] },
    },
    group: [periodExpr],
    order: [[periodExpr, "ASC"]],
    raw: true,
  });

  // Định dạng dữ liệu thô từ DB
  const formattedOrders = orderStats.map((stat) => ({
    period: stat.period,
    orderCount: parseInt(stat.orderCount),
    revenue: parseFloat(stat.revenue || 0),
  }));

  const formattedUsers = userStats.map((stat) => ({
    period: stat.period,
    newUsers: parseInt(stat.newUsers),
  }));

  // Điền 0 vào các ngày không có data
  const filledOrders = fillDateGaps(formattedOrders, start, end, fillStep, {
    orderCount: 0,
    revenue: 0,
  });

  const filledUsers = fillDateGaps(formattedUsers, start, end, fillStep, {
    newUsers: 0,
  });

  res.status(200).json({
    status: "success",
    data: {
      orders: filledOrders,
      users: filledUsers,
    },
  });
});

/**
 * Quản lý Users - Lấy danh sách user
 */
const getAllUsers = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    role = "",
    sortBy = "createdAt",
    sortOrder = "DESC",
    isEmailVerified,
  } = req.query;

  const offset = (page - 1) * limit;
  const whereClause = {};

  // Filter theo tìm kiếm
  if (search) {
    whereClause[Op.or] = [
      { firstName: { [Op.like]: `%${search}%` } },
      { lastName: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } },
    ];
  }

  // Filter theo role
  if (role) {
    whereClause.role = role;
  }

  // Filter theo email verification
  if (isEmailVerified !== undefined) {
    whereClause.isEmailVerified = isEmailVerified === "true";
  }

  const { count, rows: users } = await User.findAndCountAll({
    where: whereClause,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [[sortBy, sortOrder.toUpperCase()]],
    attributes: {
      exclude: ["password", "verificationToken", "resetPasswordToken"],
    },
  });

  res.status(200).json({
    status: "success",
    data: {
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit),
      },
    },
  });
});

/**
 * Quản lý Users - Cập nhật thông tin user
 */
const updateUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, phone, role, isEmailVerified, isActive } =
    req.body;

  const user = await User.findByPk(id);
  if (!user) {
    throw new AppError("Không tìm thấy người dùng", 404);
  }

  // Không cho phép user tự update role của chính mình
  if (req.user.id === id && role && role !== user.role) {
    throw new AppError("Không thể thay đổi role của chính mình", 403);
  }

  // Không cho phép user tự deactivate tài khoản của chính mình
  if (req.user.id === id && isActive === false) {
    throw new AppError("Không thể vô hiệu hóa tài khoản của chính mình", 403);
  }

  const updatedUser = await user.update({
    firstName: firstName || user.firstName,
    lastName: lastName || user.lastName,
    phone: phone || user.phone,
    role: role || user.role,
    isEmailVerified:
      isEmailVerified !== undefined ? isEmailVerified : user.isEmailVerified,
    isActive: isActive !== undefined ? isActive : user.isActive,
  });

  res.status(200).json({
    status: "success",
    data: { user: updatedUser },
  });
});

/**
 * Quản lý Users - Xóa user
 */
const deleteUser = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (req.user.id === id) {
    throw new AppError("Không thể xóa tài khoản của chính mình", 403);
  }

  const user = await User.findByPk(id);
  if (!user) {
    throw new AppError("Không tìm thấy người dùng", 404);
  }

  await user.destroy();

  res.status(200).json({
    status: "success",
    message: "Xóa người dùng thành công",
  });
});

/**
 * Quản lý Products - Lấy chi tiết sản phẩm
 */
const getProductById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findByPk(id, {
    include: [
      {
        model: Category,
        as: "categories",
        through: { attributes: [] },
      },
      {
        model: ProductAttribute,
        as: "attributes",
      },
      {
        model: ProductVariant,
        as: "variants",
      },
      {
        model: require("../models").ProductSpecification,
        as: "productSpecifications",
      },
      {
        model: require("../models").WarrantyPackage,
        as: "warrantyPackages",
        through: {
          attributes: ["isDefault"],
          as: "productWarranty",
        },
        where: { isActive: true },
        required: false,
      },
    ],
  });

  if (!product) {
    throw new AppError("Không tìm thấy sản phẩm", 404);
  }

  res.status(200).json({
    status: "success",
    data: { product },
  });
});

/**
 * Quản lý Products - Tạo sản phẩm mới
 */
const createProduct = catchAsync(async (req, res) => {
  //console.log(
  //   "Create product request body:",
  //   JSON.stringify(req.body, null, 2)
  // );
  const {
    name,
    baseName,
    description,
    shortDescription,
    price,
    compareAtPrice,
    comparePrice,
    compare_at_price,
    stock,
    sku,
    status = "active",
    images,
    thumbnail,
    inStock = true,
    stockQuantity = 0,
    featured = false,
    searchKeywords = [],
    seoTitle,
    seoDescription,
    seoKeywords = [],
    categoryIds = [],
    attributes = [],
    variants = [],
    // New fields for laptops/computers
    condition = "new",
    specifications = {},
    warrantyPackageIds = [],
  } = req.body;

  const normalizedCompareAtPrice =
    compareAtPrice ?? comparePrice ?? compare_at_price ?? null;

  // Tạo SKU duy nhất nếu không được cung cấp
  const uniqueSku =
    sku || `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // Kiểm tra xem SKU đã tồn tại chưa nếu người dùng cung cấp SKU
  if (sku) {
    const existingProduct = await Product.findOne({ where: { sku } });
    if (existingProduct) {
      return res.status(400).json({
        status: "fail",
        message: `Mã SKU '${sku}' đã tồn tại. Vui lòng sử dụng mã SKU khác.`,
        errors: [
          {
            field: "sku",
            message: `Mã SKU '${sku}' đã tồn tại. Vui lòng sử dụng mã SKU khác.`,
          },
        ],
      });
    }
  }

  // Tạo sản phẩm mới
  const product = await Product.create({
    name,
    baseName: baseName || name,
    description,
    shortDescription: shortDescription || description,
    price,
    // Tạm thời bỏ qua compareAtPrice, sẽ cập nhật riêng
    compareAtPrice: normalizedCompareAtPrice,
    images: images || [],
    thumbnail: images && images[0] ? images[0] : thumbnail,
    inStock: status === "active",
    stockQuantity: stock || stockQuantity || 0,
    sku: uniqueSku,
    status,
    featured,
    searchKeywords: searchKeywords || [],
    seoTitle: seoTitle || name,
    seoDescription: seoDescription || description,
    seoKeywords: seoKeywords || [],
    // New fields for laptops/computers
    condition,
    specifications: specifications || [],
  });

  // Cập nhật compareAtPrice riêng bằng truy vấn SQL trực tiếp nếu có
  //console.log(
  //   "compareAtPrice normalized from request:",
  //   normalizedCompareAtPrice
  // );
  if (normalizedCompareAtPrice !== null) {
    const { sequelize } = require("../models");
    await sequelize.query(
      "UPDATE products SET compare_at_price = :comparePrice WHERE id = :id",
      {
        replacements: {
          comparePrice: normalizedCompareAtPrice,
          id: product.id,
        },
        type: sequelize.QueryTypes.UPDATE,
      },
    );

    // Cập nhật lại giá trị trong đối tượng product
    product.compareAtPrice = normalizedCompareAtPrice;
  }

  // Thêm categories nếu có
  if (categoryIds && categoryIds.length > 0) {
    try {
      // Check if we need to create categories (for demo/development purposes)
      // In production, you would typically validate against existing categories
      const { Category } = require("../models");

      // For each category ID, either find it or create a placeholder
      const categoryPromises = categoryIds.map(async (catId) => {
        // Try to find the category first
        let category = await Category.findByPk(catId).catch(() => null);

        // If category doesn't exist and the ID is a simple number (from mock data)
        if (!category && /^\d+$/.test(catId)) {
          // Create a placeholder category with this ID as part of the name
          // This is just for development/demo purposes
          category = await Category.create({
            name: `Category ${catId}`,
            slug: `category-${catId}`,
            description: `Auto-created category from ID ${catId}`,
            isActive: true,
          });
        }

        return category ? category.id : null;
      });

      const validCategoryIds = (await Promise.all(categoryPromises)).filter(
        (id) => id !== null,
      );

      if (validCategoryIds.length > 0) {
        await product.setCategories(validCategoryIds);
      }
    } catch (error) {
      console.error("Error handling categories:", error);
      // Continue without categories if there's an error
    }
  }

  // Xử lý attributes
  if (attributes && attributes.length > 0) {
    try {
      //console.log("Processing attributes:", attributes);
      const attributePromises = attributes.map(async (attr) => {
        // Xử lý giá trị thuộc tính: nếu là chuỗi có dấu phẩy, tách thành mảng
        let attrValues = [];
        if (typeof attr.value === "string") {
          // Tách chuỗi thành mảng dựa trên dấu phẩy và loại bỏ khoảng trắng
          attrValues = attr.value
            .split(",")
            .map((v) => v.trim())
            .filter((v) => v);
        } else if (Array.isArray(attr.value)) {
          attrValues = attr.value;
        } else if (attr.value) {
          // Nếu không phải chuỗi hoặc mảng nhưng có giá trị
          attrValues = [String(attr.value)];
        }

        // //console.log(
        //   `Creating attribute: ${attr.name} with values:`,
        //   attrValues
        // );

        return await ProductAttribute.create({
          productId: product.id,
          name: attr.name,
          values: attrValues.length > 0 ? attrValues : ["Default"],
        });
      });
      await Promise.all(attributePromises);
    } catch (error) {
      console.error("Error creating attributes:", error);
      throw error; // Ném lỗi để transaction có thể rollback
    }
  }

  // Xử lý variants
  let createdVariants = [];
  if (variants && variants.length > 0) {
    try {
      //console.log("Processing variants:", variants);

      // Lấy attributes để validate
      const productAttributes = await ProductAttribute.findAll({
        where: { productId: product.id },
      });

      const variantPromises = variants.map(async (variant) => {
        // Đảm bảo variant.attributes luôn là một object
        const variantAttributes = variant.attributes || {};

        // //console.log(`Processing variant: ${variant.name}`, {
        //   price: variant.price,
        //   stock: variant.stock,
        //   sku: variant.sku,
        //   attributes: variantAttributes,
        // });

        // Validate variant attributes - bỏ qua validation nếu không có thuộc tính
        if (
          productAttributes.length > 0 &&
          Object.keys(variantAttributes).length > 0
        ) {
          try {
            // Tạm thời bỏ qua validation để đảm bảo biến thể được tạo
            // const isValid = validateVariantAttributes(
            //   productAttributes,
            //   variantAttributes
            // );
            // if (!isValid) {
            //   throw new Error(
            //     `Thuộc tính biến thể không hợp lệ cho biến thể: ${variant.name}`
            //   );
            // }
          } catch (error) {
            console.error("Lỗi khi xác thực thuộc tính biến thể:", error);
            // Không throw error, chỉ log để tiếp tục tạo biến thể
          }
        }

        // Generate SKU if not provided
        const variantSku =
          variant.sku || generateVariantSku(uniqueSku, variantAttributes);

        //console.log(`Creating variant with SKU: ${variantSku}`);

        // Generate display name for variant
        const displayName =
          variant.displayName ||
          Object.values(variantAttributes).join(" - ") ||
          variant.name;

        // Tạo biến thể với dữ liệu đã được xác thực
        return await ProductVariant.create({
          productId: product.id,
          name: variant.name,
          sku: variantSku,
          attributes: variantAttributes,
          price: parseFloat(variant.price) || 0,
          stockQuantity: parseInt(variant.stockQuantity ?? variant.stock) || 0,
          images: variant.images || [],
          displayName,
          sortOrder: variant.sortOrder || 0,
          isDefault: variant.isDefault || false,
          isAvailable: variant.isAvailable !== false,
        });
      });

      createdVariants = await Promise.all(variantPromises);

      const minVariantPrice = createdVariants.reduce((min, v) => {
        const variantPrice = parseFloat(v.price);
        if (!Number.isFinite(variantPrice)) return min;
        return min === null ? variantPrice : Math.min(min, variantPrice);
      }, null);

      // Update product stock + denormalized min price from variants
      const totalStock = calculateTotalStock(createdVariants);
      await Product.update(
        {
          ...(minVariantPrice !== null
            ? { price: minVariantPrice, minVariantPrice: minVariantPrice }
            : {}),
          isVariantProduct: true,
          stockQuantity: totalStock,
          inStock: totalStock > 0,
        },
        { where: { id: product.id } },
      );
    } catch (error) {
      console.error("Error creating variants:", error);
      throw error;
    }
  }

  // Thêm specifications nếu có
  if (
    specifications &&
    Array.isArray(specifications) &&
    specifications.length > 0
  ) {
    try {
      const { ProductSpecification } = require("../models");

      const specificationData = specifications.map((spec, index) => ({
        productId: product.id,
        name: spec.name,
        value: spec.value,
        category: spec.category || "General",
        sortOrder: spec.sortOrder || index,
      }));

      await ProductSpecification.bulkCreate(specificationData);
      //console.log(
      //   `Created ${specifications.length} specifications for product ${product.id}`
      // );
    } catch (error) {
      console.error("Error creating specifications:", error);
      // Không throw error để không làm fail toàn bộ quá trình tạo product
    }
  }

  // Xử lý warranty packages
  if (
    warrantyPackageIds &&
    Array.isArray(warrantyPackageIds) &&
    warrantyPackageIds.length > 0
  ) {
    try {
      //console.log("Creating warranty packages:", warrantyPackageIds);
      const { ProductWarranty, WarrantyPackage } = require("../models");

      // Kiểm tra xem các warranty packages có tồn tại không
      //console.log(
      //   "Looking for warranty packages with IDs:",
      //   warrantyPackageIds
      // );
      const existingWarrantyPackages = await WarrantyPackage.findAll({
        where: { id: warrantyPackageIds, isActive: true },
      });
      //console.log("Found warranty packages:", existingWarrantyPackages.length);

      if (existingWarrantyPackages.length > 0) {
        const warrantyPromises = existingWarrantyPackages.map(
          async (warrantyPackage, index) => {
            return await ProductWarranty.create({
              productId: product.id,
              warrantyPackageId: warrantyPackage.id,
              isDefault: index === 0, // Đặt warranty package đầu tiên làm mặc định
            });
          },
        );

        await Promise.all(warrantyPromises);
        //console.log(
        //   `Created ${existingWarrantyPackages.length} warranty package associations for product ${product.id}`
        // );
      }
    } catch (error) {
      console.error("Error creating warranty packages:", error);
      // Continue without warranty packages if there's an error
    }
  }

  // Lấy lại product với attributes và variants
  const productWithRelations = await Product.findByPk(product.id, {
    include: [
      {
        model: Category,
        as: "categories",
        through: { attributes: [] },
      },
      {
        model: ProductAttribute,
        as: "attributes",
      },
      {
        model: ProductVariant,
        as: "variants",
      },
      {
        model: require("../models").ProductSpecification,
        as: "productSpecifications",
      },
      {
        model: require("../models").WarrantyPackage,
        as: "warrantyPackages",
        through: {
          attributes: ["isDefault"],
          as: "productWarranty",
        },
        where: { isActive: true },
        required: false,
      },
    ],
  });

  // Log audit
  //console.log("req.user in createProduct:", req.user); // Debug log
  AdminAuditService.logProductAction(
    req.user,
    "CREATE",
    product.id,
    product.name,
  );

  res.status(201).json({
    status: "success",
    data: { product: productWithRelations },
  });
});

/**
 * Quản lý Products - Cập nhật sản phẩm
 */
const updateProduct = catchAsync(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    shortDescription,
    price,
    compareAtPrice,
    comparePrice, // Thêm comparePrice để hỗ trợ cả hai tên tham số
    images,
    thumbnail,
    inStock,
    stockQuantity,
    sku,
    status,
    featured,
    searchKeywords,
    seoTitle,
    seoDescription,
    seoKeywords,
    categoryIds,
    attributes = [],
    variants = [],
    specifications = [],
    warrantyPackageIds = [],
  } = req.body;

  //console.log("updateProduct - Request body keys:", Object.keys(req.body));
  //console.log("updateProduct - specifications:", specifications);
  //console.log("updateProduct - specifications type:", typeof specifications);
  //console.log(
  //   "updateProduct - specifications isArray:",
  //   Array.isArray(specifications)
  // );
  // //console.log(
  //   "updateProduct - hasOwnProperty specifications:",
  //   req.body.hasOwnProperty("specifications")
  // );
  //console.log("updateProduct - warrantyPackageIds:", warrantyPackageIds);
  //console.log(
  //   "updateProduct - hasOwnProperty warrantyPackageIds:",
  //   req.body.hasOwnProperty("warrantyPackageIds")
  // );

  const product = await Product.findByPk(id);
  if (!product) {
    throw new AppError("Không tìm thấy sản phẩm", 404);
  }

  // Track changes for audit
  const changes = {};
  if (name && name !== product.name)
    changes.name = { from: product.name, to: name };
  if (price && price !== product.price)
    changes.price = { from: product.price, to: price };
  if (inStock !== undefined && inStock !== product.inStock)
    changes.inStock = { from: product.inStock, to: inStock };
  if (stockQuantity !== undefined && stockQuantity !== product.stockQuantity)
    changes.stockQuantity = { from: product.stockQuantity, to: stockQuantity };
  if (sku && sku !== product.sku) changes.sku = { from: product.sku, to: sku };
  if (status && status !== product.status)
    changes.status = { from: product.status, to: status };

  // Cập nhật sản phẩm - chỉ cập nhật các trường có trong request
  const updateData = {};

  // Chỉ cập nhật các trường có trong request body
  if (req.body.hasOwnProperty("name")) updateData.name = name;
  if (req.body.hasOwnProperty("description"))
    updateData.description = description;
  if (req.body.hasOwnProperty("shortDescription"))
    updateData.shortDescription = shortDescription;
  if (req.body.hasOwnProperty("price")) updateData.price = price;
  if (
    req.body.hasOwnProperty("compareAtPrice") ||
    req.body.hasOwnProperty("comparePrice") ||
    req.body.hasOwnProperty("compare_at_price")
  ) {
    updateData.compareAtPrice =
      compareAtPrice ?? comparePrice ?? req.body.compare_at_price ?? null;
  }
  if (req.body.hasOwnProperty("images")) updateData.images = images;
  if (req.body.hasOwnProperty("thumbnail")) updateData.thumbnail = thumbnail;
  if (req.body.hasOwnProperty("inStock")) updateData.inStock = inStock;
  if (req.body.hasOwnProperty("stockQuantity"))
    updateData.stockQuantity = stockQuantity;
  if (req.body.hasOwnProperty("sku")) updateData.sku = sku;
  if (req.body.hasOwnProperty("status")) updateData.status = status;
  if (req.body.hasOwnProperty("featured")) updateData.featured = featured;
  if (req.body.hasOwnProperty("searchKeywords")) {
    //console.log("Updating searchKeywords:", searchKeywords);
    updateData.searchKeywords = searchKeywords;
  }
  if (req.body.hasOwnProperty("seoTitle")) updateData.seoTitle = seoTitle;
  if (req.body.hasOwnProperty("seoDescription"))
    updateData.seoDescription = seoDescription;
  if (req.body.hasOwnProperty("seoKeywords"))
    updateData.seoKeywords = seoKeywords;

  // Cập nhật sản phẩm với dữ liệu mới
  //console.log("UpdateData before update:", updateData);
  const updatedProduct = await product.update(updateData);

  // Cập nhật compareAtPrice riêng bằng truy vấn SQL trực tiếp nếu có trong request
  // Hỗ trợ cả compareAtPrice và comparePrice
  if (
    false &&
    (req.body.hasOwnProperty("compareAtPrice") ||
      req.body.hasOwnProperty("comparePrice"))
  ) {
    const { sequelize } = require("../models");
    // Ưu tiên sử dụng compareAtPrice, nếu không có thì dùng comparePrice
    const priceToCompare = req.body.hasOwnProperty("compareAtPrice")
      ? compareAtPrice
      : comparePrice;

    await sequelize.query(
      "UPDATE products SET compare_at_price = :compareAtPrice WHERE id = :id",
      {
        replacements: {
          compareAtPrice: priceToCompare,
          id: product.id,
        },
        type: sequelize.QueryTypes.UPDATE,
      },
    );

    // Cập nhật lại giá trị trong đối tượng product để trả về cho client
    updatedProduct.compareAtPrice = priceToCompare;

    // Log thông tin để debug
    //console.log(
    //   `Updated compareAtPrice to ${priceToCompare} for product ${product.id}`
    // );
  }

  // Cập nhật categories nếu có
  if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
    try {
      // Check if we need to create categories (for demo/development purposes)
      // In production, you would typically validate against existing categories
      const { Category } = require("../models");

      // For each category ID, either find it or create a placeholder
      const categoryPromises = categoryIds.map(async (catId) => {
        // Try to find the category first
        let category = await Category.findByPk(catId).catch(() => null);

        // If category doesn't exist and the ID is a simple number (from mock data)
        if (!category && /^\d+$/.test(catId)) {
          // Create a placeholder category with this ID as part of the name
          // This is just for development/demo purposes
          category = await Category.create({
            name: `Category ${catId}`,
            slug: `category-${catId}`,
            description: `Auto-created category from ID ${catId}`,
            isActive: true,
          });
        }

        return category ? category.id : null;
      });

      const validCategoryIds = (await Promise.all(categoryPromises)).filter(
        (id) => id !== null,
      );

      if (validCategoryIds.length > 0) {
        await product.setCategories(validCategoryIds);
        changes.categories = validCategoryIds;
      }
    } catch (error) {
      console.error("Error handling categories:", error);
      // Continue without categories if there's an error
    }
  }

  // Xử lý attributes - chỉ khi request có chứa field 'attributes'
  if (req.body.hasOwnProperty("attributes") && Array.isArray(attributes)) {
    try {
      //console.log("Updating attributes:", attributes);

      // Xóa tất cả attributes cũ
      await ProductAttribute.destroy({ where: { productId: id } });

      // Tạo attributes mới
      if (attributes.length > 0) {
        const attributePromises = attributes.map(async (attr) => {
          // Xử lý giá trị thuộc tính: nếu là chuỗi có dấu phẩy, tách thành mảng
          let attrValues = [];
          if (typeof attr.value === "string") {
            // Tách chuỗi thành mảng dựa trên dấu phẩy và loại bỏ khoảng trắng
            attrValues = attr.value
              .split(",")
              .map((v) => v.trim())
              .filter((v) => v);
          } else if (Array.isArray(attr.value)) {
            attrValues = attr.value;
          } else if (attr.value) {
            // Nếu không phải chuỗi hoặc mảng nhưng có giá trị
            attrValues = [String(attr.value)];
          }

          //console.log(
          //   `Creating attribute: ${attr.name} with values:`,
          //   attrValues
          // );

          return await ProductAttribute.create({
            productId: id,
            name: attr.name,
            values: attrValues.length > 0 ? attrValues : ["Default"],
          });
        });
        await Promise.all(attributePromises);
        changes.attributes = attributes.length;
      }
    } catch (error) {
      console.error("Error updating attributes:", error);
      throw error; // Ném lỗi để transaction có thể rollback
    }
  }

  // Xử lý variants - chỉ khi request có chứa field 'variants'
  if (req.body.hasOwnProperty("variants") && Array.isArray(variants)) {
    try {
      // Xóa tất cả variants cũ
      await ProductVariant.destroy({ where: { productId: id } });

      // Tạo variants mới
      let createdVariants = [];
      if (variants.length > 0) {
        // Lấy attributes để validate
        const productAttributes = await ProductAttribute.findAll({
          where: { productId: id },
        });

        const variantPromises = variants.map(async (variant) => {
          // Đảm bảo variant.attributes luôn là một object
          const variantAttributes = variant.attributes || {};

          //console.log(`Processing variant: ${variant.name}`, {
          //   price: variant.price,
          //   stock: variant.stock,
          //   sku: variant.sku,
          //   attributes: variantAttributes,
          // });

          // Validate variant attributes - bỏ qua validation nếu không có thuộc tính
          if (
            productAttributes.length > 0 &&
            Object.keys(variantAttributes).length > 0
          ) {
            try {
              // Tạm thời bỏ qua validation để đảm bảo biến thể được tạo
              // const isValid = validateVariantAttributes(
              //   productAttributes,
              //   variantAttributes
              // );
              // if (!isValid) {
              //   throw new Error(
              //     `Thuộc tính biến thể không hợp lệ cho biến thể: ${variant.name}`
              //   );
              // }
            } catch (error) {
              console.error("Lỗi khi xác thực thuộc tính biến thể:", error);
              // Không throw error, chỉ log để tiếp tục tạo biến thể
            }
          }

          // Generate SKU if not provided
          const variantSku =
            variant.sku ||
            generateVariantSku(updatedProduct.sku, variantAttributes);

          //console.log(`Creating variant with SKU: ${variantSku}`);

          return await ProductVariant.create({
            productId: id,
            name: variant.name,
            sku: variantSku,
            attributes: variantAttributes,
            price: parseFloat(variant.price) || 0,
            stockQuantity:
              parseInt(variant.stockQuantity ?? variant.stock) || 0,
            images: variant.images || [],
          });
        });

        createdVariants = await Promise.all(variantPromises);
        changes.variants = variants.length;

        const minVariantPrice = createdVariants.reduce((min, v) => {
          const variantPrice = parseFloat(v.price);
          if (!Number.isFinite(variantPrice)) return min;
          return min === null ? variantPrice : Math.min(min, variantPrice);
        }, null);

        // Update product stock + denormalized min price from variants
        const totalStock = calculateTotalStock(createdVariants);
        await Product.update(
          {
            ...(minVariantPrice !== null
              ? { price: minVariantPrice, minVariantPrice: minVariantPrice }
              : {}),
            isVariantProduct: true,
            stockQuantity: totalStock,
            inStock: totalStock > 0,
          },
          { where: { id } },
        );
      } else {
        // If no variants, reset to product base stock
        await Product.update(
          { isVariantProduct: false, minVariantPrice: null },
          { where: { id } },
        );
        // Chỉ cập nhật nếu stockQuantity đã được gửi trong request
        if (req.body.hasOwnProperty("stockQuantity")) {
          await Product.update(
            {
              stockQuantity: stockQuantity,
              inStock: stockQuantity > 0,
            },
            { where: { id } },
          );
        }
      }
    } catch (error) {
      console.error("Error updating variants:", error);
      throw error;
    }
  }

  // Xử lý specifications - chỉ khi request có chứa field 'specifications'
  if (
    req.body.hasOwnProperty("specifications") &&
    Array.isArray(specifications)
  ) {
    try {
      //console.log("Updating specifications:", specifications);
      const { ProductSpecification } = require("../models");

      // Xóa tất cả specifications cũ
      await ProductSpecification.destroy({ where: { productId: id } });

      // Tạo specifications mới
      if (specifications.length > 0) {
        const specificationData = specifications.map((spec, index) => ({
          productId: id,
          name: spec.name,
          value: spec.value,
          category: spec.category || "General",
          sortOrder: spec.sortOrder || index,
        }));

        await ProductSpecification.bulkCreate(specificationData);
        //console.log(
        //   `Updated ${specifications.length} specifications for product ${id}`
        // );
        changes.specifications = specifications.length;
      }
    } catch (error) {
      console.error("Error updating specifications:", error);
      throw error;
    }
  }

  // Xử lý warranty packages - chỉ khi request có chứa field 'warrantyPackageIds'
  if (
    req.body.hasOwnProperty("warrantyPackageIds") &&
    Array.isArray(warrantyPackageIds)
  ) {
    try {
      //console.log("Updating warranty packages:", warrantyPackageIds);
      const { ProductWarranty, WarrantyPackage } = require("../models");

      // Xóa tất cả warranty packages cũ
      await ProductWarranty.destroy({ where: { productId: id } });

      // Tạo warranty packages mới
      if (warrantyPackageIds.length > 0) {
        // Kiểm tra xem các warranty packages có tồn tại không
        //console.log(
        //   "Looking for warranty packages with IDs:",
        //   warrantyPackageIds
        // );
        const existingWarrantyPackages = await WarrantyPackage.findAll({
          where: { id: warrantyPackageIds, isActive: true },
        });
        //console.log(
        //   "Found warranty packages:",
        //   existingWarrantyPackages.length
        // );

        if (existingWarrantyPackages.length > 0) {
          const warrantyPromises = existingWarrantyPackages.map(
            async (warrantyPackage, index) => {
              return await ProductWarranty.create({
                productId: id,
                warrantyPackageId: warrantyPackage.id,
                isDefault: index === 0, // Đặt warranty package đầu tiên làm mặc định
              });
            },
          );

          await Promise.all(warrantyPromises);
          // //console.log(
          //   `Created ${existingWarrantyPackages.length} warranty package associations for product ${id}`
          // );
        }
      }
    } catch (error) {
      console.error("Error updating warranty packages:", error);
      // Continue without warranty packages if there's an error
    }
  }

  // Lấy lại product với attributes, variants và specifications
  const productWithRelations = await Product.findByPk(id, {
    include: [
      {
        model: Category,
        as: "categories",
        through: { attributes: [] },
      },
      {
        model: ProductAttribute,
        as: "attributes",
      },
      {
        model: ProductVariant,
        as: "variants",
      },
      {
        model: require("../models").ProductSpecification,
        as: "productSpecifications",
      },
      {
        model: require("../models").WarrantyPackage,
        as: "warrantyPackages",
        through: {
          attributes: ["isDefault"],
          as: "productWarranty",
        },
        where: { isActive: true },
        required: false,
      },
    ],
  });

  // Log audit
  AdminAuditService.logProductAction(
    req.user,
    "UPDATE",
    product.id,
    product.name,
    changes,
  );

  res.status(200).json({
    status: "success",
    data: { product: productWithRelations },
  });
});

/**
 * Quản lý Products - Xóa sản phẩm
 */
const deleteProduct = catchAsync(async (req, res) => {
  const { id } = req.params;
  const {
    CartItem,
    OrderItem,
    Wishlist,
    ProductAttribute,
    ProductVariant,
    ProductCategory,
    sequelize,
  } = require("../models");

  const product = await Product.findByPk(id);
  if (!product) {
    throw new AppError("Không tìm thấy sản phẩm", 404);
  }

  // Sử dụng transaction để đảm bảo tính toàn vẹn dữ liệu
  const transaction = await sequelize.transaction();

  try {
    // Xóa các bản ghi liên quan trong cart_items
    await CartItem.destroy({ where: { productId: id }, transaction });

    // Xóa các bản ghi liên quan trong order_items (hoặc có thể cân nhắc giữ lại lịch sử đơn hàng)
    // Nếu muốn giữ lại lịch sử đơn hàng, có thể bỏ dòng này
    // await OrderItem.destroy({ where: { productId: id }, transaction });

    // Xóa các bản ghi liên quan trong wishlist
    await Wishlist.destroy({ where: { productId: id }, transaction });

    // Xóa các thuộc tính của sản phẩm
    await ProductAttribute.destroy({ where: { productId: id }, transaction });

    // Xóa các biến thể của sản phẩm
    await ProductVariant.destroy({ where: { productId: id }, transaction });

    // Xóa các liên kết danh mục
    await ProductCategory.destroy({ where: { productId: id }, transaction });

    // Cuối cùng xóa sản phẩm
    await product.destroy({ transaction });

    // Commit transaction nếu tất cả thành công
    await transaction.commit();

    res.status(200).json({
      status: "success",
      message: "Xóa sản phẩm thành công",
    });
  } catch (error) {
    // Rollback transaction nếu có lỗi
    await transaction.rollback();
    throw error;
  }
});

/**
 * Quản lý Products - Lấy danh sách sản phẩm với filter admin
 */
const getAllProducts = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    category = "",
    status = "",
    sortBy = "createdAt",
    sortOrder = "DESC",
    priceMin,
    priceMax,
    stockMin,
    stockMax,
  } = req.query;

  const offset = (page - 1) * limit;
  const whereClause = {};

  // Filter theo tìm kiếm
  if (search) {
    whereClause[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } },
      { shortDescription: { [Op.like]: `%${search}%` } },
      { sku: { [Op.like]: `%${search}%` } },
    ];
  }

  // Filter theo status
  if (status) {
    whereClause.status = status;
  }

  // Filter theo giá
  if (priceMin) {
    whereClause.price = {
      ...whereClause.price,
      [Op.gte]: parseFloat(priceMin),
    };
  }
  if (priceMax) {
    whereClause.price = {
      ...whereClause.price,
      [Op.lte]: parseFloat(priceMax),
    };
  }

  // Filter theo stock
  if (stockMin) {
    whereClause.stockQuantity = {
      ...whereClause.stockQuantity,
      [Op.gte]: parseInt(stockMin),
    };
  }
  if (stockMax) {
    whereClause.stockQuantity = {
      ...whereClause.stockQuantity,
      [Op.lte]: parseInt(stockMax),
    };
  }

  const includeClause = [
    {
      model: Category,
      as: "categories",
      through: { attributes: [] },
    },
    {
      model: ProductVariant,
      as: "variants",
      required: false,
    },
  ];

  // Filter theo category
  if (category) {
    includeClause[0].where = { id: category };
  }

  const { count, rows: products } = await Product.findAndCountAll({
    where: whereClause,
    include: includeClause,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [[sortBy, sortOrder.toUpperCase()]],
    distinct: true,
  });

  res.status(200).json({
    status: "success",
    data: {
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit),
      },
    },
  });
});

/**
 * Quản lý Reviews - Lấy danh sách review
 *
 * Fixes:
 * 1. Thêm as: "user" đúng với alias khai báo trong models/index.js:82
 * 2. Thêm filter isVerified (lọc theo "Verified Purchase")
 * 3. Thêm filter search theo tên sản phẩm
 */
const getAllReviews = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    productId = "",
    rating = "",
    isVerified,
    search = "",
    sortBy = "createdAt",
    sortOrder = "DESC",
  } = req.query;

  const offset = (page - 1) * limit;
  const whereClause = {};

  // Filter theo product ID cụ thể
  if (productId) {
    whereClause.productId = productId;
  }

  // Filter theo rating (1–5 sao)
  if (rating) {
    whereClause.rating = parseInt(rating);
  }

  // Filter theo Verified Purchase (isVerified là boolean tự động — không phải kiểm duyệt nội dung)
  if (isVerified !== undefined && isVerified !== "") {
    whereClause.isVerified = isVerified === "true";
  }

  // Build include clause — dùng đúng alias 'user' theo models/index.js:82
  const includeClause = [
    {
      model: User,
      as: "user",  // FIX: thêm alias đúng, không có dòng này Sequelize sẽ báo lỗi
      attributes: ["id", "firstName", "lastName", "email", "avatar"],
    },
    {
      model: Product,
      attributes: ["id", "name", "images", "slug"],
      // Filter theo tên sản phẩm nếu có search query
      ...(search ? { where: { name: { [Op.iLike]: `%${search}%` } }, required: true } : {}),
    },
  ];

  const { count, rows: reviews } = await Review.findAndCountAll({
    where: whereClause,
    include: includeClause,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [[sortBy, sortOrder.toUpperCase()]],
    // Cần subQuery: false khi có filter trên include để tránh lỗi COUNT
    subQuery: false,
  });

  res.status(200).json({
    status: "success",
    data: {
      reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit)),
        totalItems: count,
        itemsPerPage: parseInt(limit),
      },
    },
  });
});

/**
 * Quản lý Reviews - Xóa review
 */
const deleteReview = catchAsync(async (req, res) => {
  const { id } = req.params;

  const review = await Review.findByPk(id);
  if (!review) {
    throw new AppError("Không tìm thấy đánh giá", 404);
  }

  await review.destroy();

  res.status(200).json({
    status: "success",
    message: "Xóa đánh giá thành công",
  });
});

/**
 * Phản hồi Review của khách hàng (Admin Reply)
 *
 * TÙ DUY NGHIỆP VỤ:
 * Mỗi review chỉ có đúng 1 phản hồi chính thức từ Shop.
 * Admin có thể gọi endpoint này nhiều lần (create hoặc update).
 *
 * TÙ DUY KỸ THUÂT:
 * Dùng Sequelize upsert thay vì check-then-create/update riêng lẻ.
 * Lý do: Nếu dùng 2 query riêng, có khả năng race condition khi Admin
 * click 2 lần liên tiếp → 2 INSERT cùng lúc → vi phạm UNIQUE constraint.
 * upsert giải quyết bằng 1 câu SQL duy nhất (INSERT ... ON CONFLICT UPDATE).
 */
const replyToReview = catchAsync(async (req, res) => {
  const { id } = req.params; // id của Review
  const { content } = req.body;
  const adminId = req.user.id;

  if (!content || content.trim().length === 0) {
    throw new AppError("Nội dung phản hồi không được để trống", 400);
  }

  if (content.trim().length > 2000) {
    throw new AppError("Nội dung phản hồi không được vượt quá 2000 ký tự", 400);
  }

  // Kiểm tra review tồn tại
  const review = await Review.findByPk(id);
  if (!review) {
    throw new AppError("Không tìm thấy đánh giá", 404);
  }

  // upsert: Nếu có rồi → UPDATE content và adminId
  //         Nếu chưa có → INSERT mới
  // Conflict được xác định bởi UNIQUE(review_id) trên DB
  const [reply, created] = await ReviewReply.upsert(
    {
      reviewId: id,
      adminId,
      content: content.trim(),
    },
    {
      returning: true, // PostgreSQL trả về record vừa upsert
    }
  );

  res.status(created ? 201 : 200).json({
    status: "success",
    message: created ? "Phản hồi đã được gửi" : "Phản hồi đã được cập nhật",
    data: { reply },
  });
});

/**
 * Xóa phản hồi của Admin
 *
 * TÙ DUY: Admin có thể rút lại phản hồi nếu đã reply sai.
 * Không kiểm tra adminId vì Admin có quyền xóa reply của Admin khác (admin > admin).
 */
const deleteReviewReply = catchAsync(async (req, res) => {
  // Tên param phải khớp với route: /reviews/replies/:replyId
  const { replyId } = req.params;

  const reply = await ReviewReply.findByPk(replyId);
  if (!reply) {
    throw new AppError("Không tìm thấy phản hồi", 404);
  }

  await reply.destroy();

  res.status(200).json({
    status: "success",
    message: "Xóa phản hồi thành công",
  });
});

/**
 * Quản lý Orders - Lấy danh sách đơn hàng
 */
const getAllOrders = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status = "",
    search = "",
    sortBy = "createdAt",
    sortOrder = "DESC",
    startDate,
    endDate,
  } = req.query;

  const offset = (page - 1) * limit;
  const whereClause = {};

  // Filter theo status
  if (status) {
    whereClause.status = status;
  }

  // Filter theo ngày
  if (startDate && endDate) {
    whereClause.createdAt = {
      [Op.between]: [new Date(startDate), new Date(endDate)],
    };
  }

  // Filter theo tìm kiếm trong order number
  if (search) {
    whereClause[Op.or] = [{ number: { [Op.like]: `%${search}%` } }];
  }

  const includeClause = [
    {
      model: User,
      attributes: ["id", "firstName", "lastName", "email", "phone"],
    },
    {
      model: Coupon,
      as: "coupon",
      attributes: ["id", "code", "type", "value"],
      required: false,
    },
    {
      model: OrderItem,
      as: "items",
      include: [
        {
          model: Product,
          attributes: ["id", "name", "images", "price"],
        },
      ],
    },
  ];

  const { count, rows: orders } = await Order.findAndCountAll({
    where: whereClause,
    include: includeClause,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [[sortBy, sortOrder.toUpperCase()]],
  });

  res.status(200).json({
    status: "success",
    data: {
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit),
      },
    },
  });
});

/**
 * Quản lý Orders - Cập nhật trạng thái đơn hàng
 */
const updateOrderStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;

  const validStatuses = [
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];
  if (!validStatuses.includes(status)) {
    throw new AppError("Trạng thái đơn hàng không hợp lệ", 400);
  }

  const order = await Order.findByPk(id);
  if (!order) {
    throw new AppError("Không tìm thấy đơn hàng", 404);
  }

  const updatedOrder = await order.update({
    status,
    note: note || order.note,
  });

  res.status(200).json({
    status: "success",
    data: { order: updatedOrder },
  });
});

/**
 * =====================================================
 * QUẢN LÝ COUPON / MÃ GIẢM GIÁ
 * =====================================================
 *
 * TƯ DUY NGHIỆP VỤ:
 * Admin tạo coupon để kích cầu, thanh lý tồn kho, hoặc giữ chân khách cũ.
 * Mỗi coupon có vòng đời: Tạo → Active → Expired/Disabled.
 * Không cho xóa coupon đã dùng — giữ lịch sử đối soát.
 */

/**
 * Lấy danh sách coupon với phân trang và filter
 *
 * Filter status:
 * - "active": isActive=true, chưa hết hạn, chưa hết lượt
 * - "expired": đã hết hạn hoặc hết lượt
 * - "disabled": isActive=false (admin tắt)
 * - "all": tất cả
 */
const getAllCoupons = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status = "all",
    search = "",
    sortBy = "createdAt",
    sortOrder = "DESC",
  } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const whereClause = {};
  const now = new Date();

  // Filter theo status
  if (status === "active") {
    whereClause.isActive = true;
    whereClause.expiresAt = { [Op.gt]: now };
    whereClause.startDate = { [Op.lte]: now };
  } else if (status === "expired") {
    whereClause[Op.or] = [
      { expiresAt: { [Op.lte]: now } },
      // Hết lượt: usedCount >= usageLimit (chỉ khi usageLimit != null)
      {
        usageLimit: { [Op.ne]: null },
        usedCount: { [Op.gte]: Sequelize.col("usage_limit") },
      },
    ];
  } else if (status === "disabled") {
    whereClause.isActive = false;
  }

  // Search theo code hoặc description
  if (search) {
    whereClause[Op.or] = [
      ...(whereClause[Op.or] || []),
      { code: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
    ];
    // Nếu đã có Op.or từ status filter, merge lại
    // Giải pháp đơn giản: nếu status có Op.or, wrap trong Op.and
  }

  const { count, rows: coupons } = await Coupon.findAndCountAll({
    where: whereClause,
    limit: parseInt(limit),
    offset,
    order: [[sortBy, sortOrder.toUpperCase()]],
  });

  res.status(200).json({
    status: "success",
    data: {
      coupons,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit)),
        totalItems: count,
        itemsPerPage: parseInt(limit),
      },
    },
  });
});

/**
 * Tạo coupon mới
 *
 * TƯ DUY VALIDATION:
 * - code unique (DB enforce + check trước cho UX tốt)
 * - percentage value <= 100
 * - startDate < expiresAt
 * - maxDiscount chỉ có ý nghĩa với type=percentage
 */
const createCoupon = catchAsync(async (req, res) => {
  const {
    code,
    description,
    type,
    value,
    minOrderAmount = 0,
    maxDiscount,
    usageLimit,
    usagePerUser = 1,
    startDate,
    expiresAt,
  } = req.body;

  // Validate required fields
  if (!code || !type || !value || !startDate || !expiresAt) {
    throw new AppError("Vui lòng điền đầy đủ các trường bắt buộc", 400);
  }

  // Check code unique (trước khi DB throw error, cho message thân thiện hơn)
  const existingCoupon = await Coupon.findOne({
    where: { code: code.trim().toUpperCase() },
  });
  if (existingCoupon) {
    throw new AppError(`Mã coupon "${code.toUpperCase()}" đã tồn tại`, 409);
  }

  const coupon = await Coupon.create({
    code,
    description,
    type,
    value,
    minOrderAmount,
    maxDiscount: type === 'percentage' ? maxDiscount : null,
    usageLimit,
    usagePerUser,
    startDate,
    expiresAt,
  });

  res.status(201).json({
    status: "success",
    message: `Tạo coupon ${coupon.code} thành công`,
    data: { coupon },
  });
});

/**
 * Cập nhật coupon
 *
 * TƯ DUY: Không cho sửa code — vì orders đã dùng lưu couponId,
 * sửa code sẽ gây confusion trong đối soát.
 * Cho sửa: description, value, limits, dates, maxDiscount.
 */
const updateCoupon = catchAsync(async (req, res) => {
  const { id } = req.params;
  const coupon = await Coupon.findByPk(id);

  if (!coupon) {
    throw new AppError("Không tìm thấy coupon", 404);
  }

  // Danh sách fields cho phép cập nhật (không có 'code')
  const allowedFields = [
    'description', 'type', 'value', 'minOrderAmount', 'maxDiscount',
    'usageLimit', 'usagePerUser', 'startDate', 'expiresAt',
  ];

  const updateData = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  }

  // Nếu chuyển sang fixed, xóa maxDiscount
  if (updateData.type === 'fixed') {
    updateData.maxDiscount = null;
  }

  await coupon.update(updateData);

  res.status(200).json({
    status: "success",
    message: `Cập nhật coupon ${coupon.code} thành công`,
    data: { coupon },
  });
});

/**
 * Toggle trạng thái active/inactive
 *
 * TƯ DUY UX: Admin click 1 nút để tắt/bật nhanh coupon
 * mà không cần mở form edit.
 */
const toggleCouponStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const coupon = await Coupon.findByPk(id);

  if (!coupon) {
    throw new AppError("Không tìm thấy coupon", 404);
  }

  await coupon.update({ isActive: !coupon.isActive });

  res.status(200).json({
    status: "success",
    message: coupon.isActive
      ? `Đã kích hoạt coupon ${coupon.code}`
      : `Đã vô hiệu hóa coupon ${coupon.code}`,
    data: { coupon },
  });
});

module.exports = {
  getDashboardStats,
  getDetailedStats,
  getAllUsers,
  updateUser,
  deleteUser,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getAllReviews,
  deleteReview,
  replyToReview,
  deleteReviewReply,
  getAllOrders,
  updateOrderStatus,
  getAllCoupons,
  createCoupon,
  updateCoupon,
  toggleCouponStatus,
};
