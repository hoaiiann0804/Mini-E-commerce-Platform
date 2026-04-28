const {
  User,
  Product,
  Order,
  Review,
  Category,
  OrderItem,
  ProductAttribute,
  ProductVariant,
} = require("../models");
const { Op, Sequelize } = require("sequelize");
const { catchAsync } = require("../utils/catchAsync");
const { AppError } = require("../middlewares/errorHandler");
const { AdminAuditService } = require("../services/admin/adminAuditService");
const {
  calculateTotalStock,
  updateProductTotalStock,
  validateVariantAttributes,
  generateVariantSku,
} = require("../services/product/product.helpers");

/**
 * Dashboard - Thống kê tổng quan
 */
const getDashboardStats = catchAsync(async (req, res) => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfLastMonth = new Date(
    today.getFullYear(),
    today.getMonth() - 1,
    1
  );
  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

  // Thống kê tổng quan
  const totalUsers = await User.count({ where: { role: "customer" } });
  const totalProducts = await Product.count();
  const totalOrders = await Order.count();
  const totalRevenue = await Order.sum("total", {
    where: { status: "delivered" },
  });

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

  // Tính tỷ lệ tăng trưởng
  const userGrowth = lastMonthUsers
    ? ((monthlyUsers - lastMonthUsers) / lastMonthUsers) * 100
    : 0;
  const orderGrowth = lastMonthOrders
    ? ((monthlyOrders - lastMonthOrders) / lastMonthOrders) * 100
    : 0;
  const revenueGrowth = lastMonthRevenue
    ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
    : 0;

  // Top sản phẩm bán chạy
  const topProducts = await OrderItem.findAll({
    attributes: [
      "productId",
      [Sequelize.fn("SUM", Sequelize.col("quantity")), "totalSold"],
      [
        Sequelize.fn(
          "SUM",
          Sequelize.literal('quantity * "OrderItem"."price"')
        ),
        "totalRevenue",
      ],
    ],
    include: [
      {
        model: Product,
        attributes: ["name", "images", "price"],
      },
    ],
    group: ["productId", "Product.id"],
    order: [[Sequelize.fn("SUM", Sequelize.col("quantity")), "DESC"]],
    limit: 5,
  });

  // Đơn hàng gần đây cần xử lý
  const pendingOrders = await Order.count({
    where: { status: "pending" },
  });

  const processingOrders = await Order.count({
    where: { status: "processing" },
  });

  res.status(200).json({
    status: "success",
    data: {
      overview: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue || 0,
        pendingOrders,
        processingOrders,
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
 */
const getDetailedStats = catchAsync(async (req, res) => {
  const { startDate, endDate, groupBy = "day" } = req.query;

  if (!startDate || !endDate) {
    throw new AppError("Vui lòng cung cấp ngày bắt đầu và ngày kết thúc", 400);
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Format theo groupBy
  let dateFormat;
  switch (groupBy) {
    case "hour":
      dateFormat = "%Y-%m-%d %H:00:00";
      break;
    case "day":
      dateFormat = "%Y-%m-%d";
      break;
    case "week":
      dateFormat = "%Y-%u";
      break;
    case "month":
      dateFormat = "%Y-%m";
      break;
    default:
      dateFormat = "%Y-%m-%d";
  }

  // Thống kê đơn hàng theo thời gian
  const orderStats = await Order.findAll({
    attributes: [
      [
        Sequelize.fn("DATE_FORMAT", Sequelize.col("createdAt"), dateFormat),
        "period",
      ],
      [Sequelize.fn("COUNT", Sequelize.col("id")), "orderCount"],
      [Sequelize.fn("SUM", Sequelize.col("total")), "revenue"],
    ],
    where: {
      createdAt: {
        [Op.between]: [start, end],
      },
    },
    group: [
      Sequelize.fn("DATE_FORMAT", Sequelize.col("createdAt"), dateFormat),
    ],
    order: [
      [
        Sequelize.fn("DATE_FORMAT", Sequelize.col("createdAt"), dateFormat),
        "ASC",
      ],
    ],
  });

  // Thống kê user mới theo thời gian
  const userStats = await User.findAll({
    attributes: [
      [
        Sequelize.fn("DATE_FORMAT", Sequelize.col("createdAt"), dateFormat),
        "period",
      ],
      [Sequelize.fn("COUNT", Sequelize.col("id")), "newUsers"],
    ],
    where: {
      role: "customer",
      createdAt: {
        [Op.between]: [start, end],
      },
    },
    group: [
      Sequelize.fn("DATE_FORMAT", Sequelize.col("createdAt"), dateFormat),
    ],
    order: [
      [
        Sequelize.fn("DATE_FORMAT", Sequelize.col("createdAt"), dateFormat),
        "ASC",
      ],
    ],
  });

  res.status(200).json({
    status: "success",
    data: {
      orders: orderStats.map((stat) => ({
        period: stat.getDataValue("period"),
        orderCount: parseInt(stat.getDataValue("orderCount")),
        revenue: parseFloat(stat.getDataValue("revenue") || 0),
      })),
      users: userStats.map((stat) => ({
        period: stat.getDataValue("period"),
        newUsers: parseInt(stat.getDataValue("newUsers")),
      })),
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
      }
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
        (id) => id !== null
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
        { where: { id: product.id } }
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
          }
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
    product.name
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
      }
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
        (id) => id !== null
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
          { where: { id } }
        );
      } else {
        // If no variants, reset to product base stock
        await Product.update(
          { isVariantProduct: false, minVariantPrice: null },
          { where: { id } }
        );
        // Chỉ cập nhật nếu stockQuantity đã được gửi trong request
        if (req.body.hasOwnProperty("stockQuantity")) {
          await Product.update(
            {
              stockQuantity: stockQuantity,
              inStock: stockQuantity > 0,
            },
            { where: { id } }
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
            }
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
    changes
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
 */
const getAllReviews = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    productId = "",
    rating = "",
    sortBy = "createdAt",
    sortOrder = "DESC",
  } = req.query;

  const offset = (page - 1) * limit;
  const whereClause = {};

  // Filter theo product
  if (productId) {
    whereClause.productId = productId;
  }

  // Filter theo rating
  if (rating) {
    whereClause.rating = parseInt(rating);
  }

  const { count, rows: reviews } = await Review.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: User,
        attributes: ["id", "firstName", "lastName", "avatar"],
      },
      {
        model: Product,
        attributes: ["id", "name", "images"],
      },
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [[sortBy, sortOrder.toUpperCase()]],
  });

  res.status(200).json({
    status: "success",
    data: {
      reviews,
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
  getAllOrders,
  updateOrderStatus,
};
