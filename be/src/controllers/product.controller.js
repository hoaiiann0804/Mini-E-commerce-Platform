const {
  Product,
  Category,
  ProductAttribute,
  ProductVariant,
  ProductSpecification,
  Review,
  sequelize,
} = require("../models");
const { AppError } = require("../middlewares/errorHandler");
const { Op } = require("sequelize");

// Get all products with pagination
const getAllProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = "createdAt",
      order = "DESC",
      category,
      search,
      minPrice,
      maxPrice,
      inStock,
      featured,
      status,
    } = req.query;

    // Build filter conditions
    const whereConditions = {};
    const includeConditions = [];

    // Search filter
    if (search) {
      whereConditions[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { shortDescription: { [Op.iLike]: `%${search}%` } },
        { searchKeywords: { [Op.contains]: [search] } },
      ];
    }

    // Price filter
    if (minPrice) {
      whereConditions.price = {
        ...whereConditions.price,
        [Op.gte]: parseFloat(minPrice),
      };
    }

    if (maxPrice) {
      whereConditions.price = {
        ...whereConditions.price,
        [Op.lte]: parseFloat(maxPrice),
      };
    }

    // Stock filter
    if (inStock !== undefined) {
      whereConditions.inStock = inStock === "true";
    }

    // Featured filter
    if (featured !== undefined) {
      whereConditions.featured = featured === "true";
    }

    // Status filter - mặc định chỉ lấy sản phẩm active
    if (status !== undefined) {
      whereConditions.status = status;
    } else {
      whereConditions.status = "active";
    }

    // Category filter
    if (category) {
      // Kiểm tra xem category có phải là UUID hợp lệ không
      const isValidUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          category
        );

      if (isValidUUID) {
        // Nếu là UUID, tìm theo ID
        includeConditions.push({
          association: "categories",
          where: { id: category },
          through: { attributes: [] },
        });
      } else {
        // Nếu không phải UUID, tìm theo slug
        includeConditions.push({
          association: "categories",
          where: { slug: category },
          through: { attributes: [] },
        });
      }
    } else {
      includeConditions.push({
        association: "categories",
        through: { attributes: [] },
      });
    }

    // Include attributes for product details (not for filtering)
    includeConditions.push({
      association: "attributes",
      required: false,
    });

    // Include variants for price range calculation
    includeConditions.push({
      association: "variants",
      required: false,
    });

    // Include reviews for ratings
    includeConditions.push({
      association: "reviews",
      attributes: ["rating"],
    });

    // Get products
    const { count, rows: productsRaw } = await Product.findAndCountAll({
      where: whereConditions,
      include: includeConditions,
      distinct: true,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [[sort, order]],
    });

    // Process products to add ratings
    const products = productsRaw.map((product) => {
      const productJson = product.toJSON();

      // Calculate average rating
      const ratings = {
        average: 0,
        count: 0,
      };

      if (productJson.reviews && productJson.reviews.length > 0) {
        const totalRating = productJson.reviews.reduce(
          (sum, review) => sum + review.rating,
          0
        );
        ratings.average = parseFloat(
          (totalRating / productJson.reviews.length).toFixed(1)
        );
        ratings.count = productJson.reviews.length;
      }

      // Use variant price if available, otherwise use product price
      let displayPrice = parseFloat(productJson.price) || 0;
      let compareAtPrice = parseFloat(productJson.compareAtPrice) || null;

      if (productJson.variants && productJson.variants.length > 0) {
        // Sort variants by price (ascending) to get the lowest price first
        const sortedVariants = productJson.variants.sort(
          (a, b) => parseFloat(a.price) - parseFloat(b.price)
        );
        displayPrice = parseFloat(sortedVariants[0].price) || displayPrice;
      }

      // Replace backslashes with forward slashes in images for URL compatibility
      const processedImages = productJson.images
        ? productJson.images.map((img) => img.replace(/\\/g, "/"))
        : [];

      // Add ratings and remove reviews from response
      delete productJson.reviews;

      return {
        ...productJson,
        images: processedImages,
        price: displayPrice,
        compareAtPrice,
        ratings,
      };
    });

    res.status(200).json({
      status: "success",
      data: {
        total: count,
        pages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        products,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get product by ID
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id, {
      include: [
        {
          association: "categories",
          through: { attributes: [] },
        },
        {
          association: "attributes",
        },
        {
          association: "variants",
        },
        {
          association: "productSpecifications",
        },
        {
          association: "reviews",
          include: [
            {
              association: "user",
              attributes: ["id", "firstName", "lastName", "avatar"],
            },
          ],
        },
        {
          association: "warrantyPackages",
          through: {
            attributes: ["isDefault"],
            as: "productWarranty",
          },
          where: { isActive: true },
          required: false,
        },
        {
          association: "productImages",
          where: { isActive: true },
          required: false,
          attributes: [
            "id",
            "originalName",
            "fileName",
            "filePath",
            "fileSize",
            "mimeType",
            "width",
            "height",
            "category",
          ],
        },
      ],
    });

    if (!product) {
      throw new AppError("Không tìm thấy sản phẩm", 404);
    }

    // Process product to add ratings calculation and construct image URLs
    const productJson = product.toJSON();

    // Calculate average rating
    const ratings = {
      average: 0,
      count: 0,
    };

    if (productJson.reviews && productJson.reviews.length > 0) {
      const totalRating = productJson.reviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      ratings.average = parseFloat(
        (totalRating / productJson.reviews.length).toFixed(1)
      );
      ratings.count = productJson.reviews.length;
    }

    // Construct image URLs for productImages
    const productImagesWithUrls = productJson.productImages
      ? productJson.productImages.map((image) => ({
        ...image,
        url: `/uploads/${image.filePath.replace(/\\/g, "/")}`,
      }))
      : [];

    // Also fix images array in product data
    const processedImages = productJson.images
      ? productJson.images.map((img) => img.replace(/\\/g, "/"))
      : [];

    // Add ratings and processed images to product data
    const productWithRatings = {
      ...productJson,
      ratings,
      productImages: productImagesWithUrls,
    };

    res.status(200).json({
      status: "success",
      data: productWithRatings,
    });
  } catch (error) {
    next(error);
  }
};

// Get product by slug
const getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { skuId } = req.query;

    const product = await Product.findOne({
      where: { slug },
      include: [
        {
          association: "categories",
          through: { attributes: [] },
        },
        {
          association: "attributes",
        },
        {
          association: "variants",
          where: { isAvailable: true },
          required: false,
        },
        {
          association: "reviews",
          include: [
            {
              association: "user",
              attributes: ["id", "firstName", "lastName", "avatar"],
            },
          ],
        },
        {
          association: "warrantyPackages",
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

    // Process product to add ratings calculation
    const productJson = product.toJSON();

    // Calculate average rating
    const ratings = {
      average: 0,
      count: 0,
    };

    if (productJson.reviews && productJson.reviews.length > 0) {
      const totalRating = productJson.reviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      ratings.average = parseFloat(
        (totalRating / productJson.reviews.length).toFixed(1)
      );
      ratings.count = productJson.reviews.length;
    }

    // Handle variant-based product
    let responseData = {
      ...productJson,
      ratings,
    };

    if (
      productJson.isVariantProduct &&
      productJson.variants &&
      productJson.variants.length > 0
    ) {
      // Find selected variant
      let selectedVariant = null;

      if (skuId) {
        selectedVariant = productJson.variants.find((v) => v.id === skuId);
      }

      // If no variant found by skuId, use default or first variant
      if (!selectedVariant) {
        selectedVariant =
          productJson.variants.find((v) => v.isDefault) ||
          productJson.variants[0];
      }

      if (selectedVariant) {
        // Override product data with variant data
        responseData = {
          ...responseData,
          // Current variant info
          currentVariant: {
            id: selectedVariant.id,
            name: selectedVariant.variantName,
            fullName: `${productJson.baseName || productJson.name} - ${selectedVariant.variantName}`,
            price: selectedVariant.price,
            compareAtPrice: selectedVariant.compareAtPrice,
            sku: selectedVariant.sku,
            stockQuantity: selectedVariant.stockQuantity,
            specifications: {
              ...productJson.specifications,
              ...selectedVariant.specifications,
            },
            images:
              selectedVariant.images && selectedVariant.images.length > 0
                ? selectedVariant.images
                : productJson.images,
          },
          // All available variants
          availableVariants: productJson.variants.map((v) => ({
            id: v.id,
            name: v.variantName,
            price: v.price,
            compareAtPrice: v.compareAtPrice,
            stockQuantity: v.stockQuantity,
            isDefault: v.isDefault,
            sku: v.sku,
          })),
          // Override main product fields with selected variant
          name: `${productJson.baseName || productJson.name} - ${selectedVariant.variantName}`,
          price: selectedVariant.price,
          compareAtPrice: selectedVariant.compareAtPrice,
          stockQuantity: selectedVariant.stockQuantity,
          sku: selectedVariant.sku,
          specifications: {
            ...productJson.specifications,
            ...selectedVariant.specifications,
          },
          images:
            selectedVariant.images && selectedVariant.images.length > 0
              ? selectedVariant.images
              : productJson.images,
        };
      }
    }

    res.status(200).json({
      status: "success",
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
};

// Create product
const createProduct = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      name,
      baseName,
      description,
      shortDescription,
      price,
      compareAtPrice,
      images,
      thumbnail,
      categoryIds,
      inStock,
      stockQuantity,
      featured,
      searchKeywords,
      seoTitle,
      seoDescription,
      seoKeywords,
      specifications,
      parentAttributes,
      attributes,
      variants,
      warrantyPackageIds,
    } = req.body;

    // Determine if this is a variant product
    const isVariantProduct = variants && variants.length > 0;

    // Create product
    const product = await Product.create(
      {
        name,
        baseName: baseName || name,
        description,
        shortDescription,
        price: isVariantProduct ? 0 : price, // Set to 0 if using variants
        compareAtPrice: isVariantProduct ? null : compareAtPrice,
        images: images || [],
        thumbnail,
        inStock: isVariantProduct ? true : inStock, // Always true for variant products
        stockQuantity: isVariantProduct ? 0 : stockQuantity, // Set to 0 if using variants
        featured,
        searchKeywords: searchKeywords || [],
        seoTitle,
        seoDescription,
        seoKeywords: seoKeywords || [],
        isVariantProduct,
        specifications: specifications || {},
      },
      { transaction }
    );

    // Add categories
    if (categoryIds && categoryIds.length > 0) {
      const categories = await Category.findAll({
        where: { id: { [Op.in]: categoryIds } },
      });

      if (categories.length !== categoryIds.length) {
        throw new AppError("Một hoặc nhiều danh mục không tồn tại", 400);
      }

      await product.setCategories(categories, { transaction });
    }

    // Add specifications
    if (specifications && specifications.length > 0) {
      const productSpecifications = specifications.map((spec, index) => ({
        productId: product.id,
        name: spec.name,
        value: spec.value,
        category: spec.category || "General",
        sortOrder: index,
      }));

      await ProductSpecification.bulkCreate(productSpecifications, {
        transaction,
      });
    }

    // Add parent attributes
    if (parentAttributes && parentAttributes.length > 0) {
      const productParentAttributes = parentAttributes.map((attr, index) => ({
        productId: product.id,
        name: attr.name,
        type: attr.type,
        values: attr.values,
        required: attr.required,
        sortOrder: index,
      }));

      await ProductAttribute.bulkCreate(productParentAttributes, {
        transaction,
      });
    }

    // Add legacy attributes (for backward compatibility)
    if (attributes && attributes.length > 0) {
      const productAttributes = attributes.map((attr) => ({
        ...attr,
        productId: product.id,
      }));

      await ProductAttribute.bulkCreate(productAttributes, { transaction });
    }

    // Add variants
    if (variants && variants.length > 0) {
      const productVariants = variants.map((variant, index) => ({
        productId: product.id,
        sku: variant.sku || `${product.id}-VAR-${index + 1}`,
        variantName: variant.name || variant.variantName,
        price: parseFloat(variant.price) || 0,
        compareAtPrice: variant.compareAtPrice
          ? parseFloat(variant.compareAtPrice)
          : null,
        stockQuantity: parseInt(variant.stockQuantity || variant.stock) || 0,
        isDefault: variant.isDefault || index === 0, // First variant is default
        isAvailable: variant.isAvailable !== false,
        attributes: variant.attributes || {},
        attributeValues: variant.attributeValues || {},
        specifications: variant.specifications || {},
        images: variant.images || [],
        displayName: variant.displayName || variant.name || variant.variantName,
        sortOrder: variant.sortOrder || index,
      }));

      await ProductVariant.bulkCreate(productVariants, { transaction });
    }

    // Add warranty packages
    if (warrantyPackageIds && warrantyPackageIds.length > 0) {
      const { WarrantyPackage } = require("../models");
      const warranties = await WarrantyPackage.findAll({
        where: { id: { [Op.in]: warrantyPackageIds } },
      });

      if (warranties.length !== warrantyPackageIds.length) {
        throw new AppError("Một hoặc nhiều gói bảo hành không tồn tại", 400);
      }

      await product.setWarrantyPackages(warranties, { transaction });
    }

    await transaction.commit();

    // Get complete product with associations
    const createdProduct = await Product.findByPk(product.id, {
      include: [
        {
          association: "categories",
          through: { attributes: [] },
        },
        {
          association: "attributes",
        },
        {
          association: "variants",
        },
        {
          association: "productSpecifications",
        },
        {
          association: "warrantyPackages",
          through: {
            attributes: ["isDefault"],
            as: "productWarranty",
          },
          where: { isActive: true },
          required: false,
        },
      ],
    });

    res.status(201).json({
      status: "success",
      data: createdProduct,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// Update product
const updateProduct = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const {
      name,
      description,
      shortDescription,
      price,
      compareAtPrice,
      images,
      thumbnail,
      categoryIds,
      inStock,
      stockQuantity,
      featured,
      searchKeywords,
      seoTitle,
      seoDescription,
      seoKeywords,
      attributes,
      variants,
      warrantyPackageIds,
    } = req.body;

    // Debug request body
    console.log("UpdateProduct request body:", {
      compareAtPrice,
      hasCompareAtPrice: req.body.hasOwnProperty("compareAtPrice"),
      // Note: comparePrice is not a valid field in the Product model
    });

    // Find product
    const product = await Product.findByPk(id);
    if (!product) {
      throw new AppError("Không tìm thấy sản phẩm", 404);
    }

    // Update product - chỉ cập nhật các trường có trong request
    const updateData = {};

    // Chỉ cập nhật các trường có trong request body
    if (req.body.hasOwnProperty("name")) updateData.name = name;
    if (req.body.hasOwnProperty("description"))
      updateData.description = description;
    if (req.body.hasOwnProperty("shortDescription"))
      updateData.shortDescription = shortDescription;
    if (req.body.hasOwnProperty("price")) updateData.price = price;
    if (req.body.hasOwnProperty("compareAtPrice"))
      updateData.compareAtPrice = compareAtPrice;
    // Removed comparePrice update as it's not in the Product model
    if (req.body.hasOwnProperty("images")) updateData.images = images;
    if (req.body.hasOwnProperty("thumbnail")) updateData.thumbnail = thumbnail;
    if (req.body.hasOwnProperty("inStock")) updateData.inStock = inStock;
    if (req.body.hasOwnProperty("stockQuantity"))
      updateData.stockQuantity = stockQuantity;
    if (req.body.hasOwnProperty("featured")) updateData.featured = featured;
    if (req.body.hasOwnProperty("searchKeywords"))
      updateData.searchKeywords = searchKeywords;
    if (req.body.hasOwnProperty("seoTitle")) updateData.seoTitle = seoTitle;
    if (req.body.hasOwnProperty("seoDescription"))
      updateData.seoDescription = seoDescription;
    if (req.body.hasOwnProperty("seoKeywords"))
      updateData.seoKeywords = seoKeywords;

    // Cập nhật sản phẩm với dữ liệu mới
    await product.update(updateData, { transaction });

    // Update categories - chỉ khi categoryIds được gửi trong request
    if (req.body.hasOwnProperty("categoryIds") && categoryIds) {
      const categories = await Category.findAll({
        where: { id: { [Op.in]: categoryIds } },
      });

      if (categories.length !== categoryIds.length) {
        throw new AppError("Một hoặc nhiều danh mục không tồn tại", 400);
      }

      await product.setCategories(categories, { transaction });
    }

    // Update attributes - chỉ khi attributes được gửi trong request
    if (req.body.hasOwnProperty("attributes")) {
      // Delete existing attributes
      await ProductAttribute.destroy({
        where: { productId: id },
        transaction,
      });

      // Create new attributes
      if (attributes && attributes.length > 0) {
        const productAttributes = attributes.map((attr) => ({
          ...attr,
          productId: id,
        }));

        await ProductAttribute.bulkCreate(productAttributes, { transaction });
      }
    }

    // Update variants - chỉ khi variants được gửi trong request
    if (req.body.hasOwnProperty("variants")) {
      // Delete existing variants
      await ProductVariant.destroy({
        where: { productId: id },
        transaction,
      });

      // Create new variants
      if (variants && variants.length > 0) {
        const productVariants = variants.map((variant) => ({
          ...variant,
          productId: id,
        }));

        await ProductVariant.bulkCreate(productVariants, { transaction });
      }
    }

    // Update warranty packages - chỉ khi warrantyPackageIds được gửi trong request
    if (req.body.hasOwnProperty("warrantyPackageIds")) {
      console.log("🛡️ Processing warranty packages:", warrantyPackageIds);

      if (warrantyPackageIds && warrantyPackageIds.length > 0) {
        // Verify warranty packages exist
        const { WarrantyPackage } = require("../models");
        const warranties = await WarrantyPackage.findAll({
          where: { id: { [Op.in]: warrantyPackageIds } },
        });

        console.log(
          "✅ Found warranties:",
          warranties.map((w) => ({ id: w.id, name: w.name }))
        );
        console.log(
          "📊 Expected:",
          warrantyPackageIds.length,
          "Found:",
          warranties.length
        );

        if (warranties.length !== warrantyPackageIds.length) {
          console.log("❌ Warranty package count mismatch!");
          throw new AppError("Một hoặc nhiều gói bảo hành không tồn tại", 400);
        }

        await product.setWarrantyPackages(warranties, { transaction });
        console.log("💾 Warranty packages updated successfully");
      } else {
        // Remove all warranty packages if empty array is sent
        console.log("🗑️ Removing all warranty packages");
        await product.setWarrantyPackages([], { transaction });
      }
    } else {
      console.log(
        "⏭️ No warrantyPackageIds in request, skipping warranty update"
      );
    }

    await transaction.commit();

    // Get updated product with associations
    const updatedProduct = await Product.findByPk(id, {
      include: [
        {
          association: "categories",
          through: { attributes: [] },
        },
        {
          association: "attributes",
        },
        {
          association: "variants",
        },
        {
          association: "warrantyPackages",
          through: {
            attributes: ["isDefault"],
            as: "productWarranty",
          },
          where: { isActive: true },
          required: false,
        },
      ],
    });

    res.status(200).json({
      status: "success",
      data: updatedProduct,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// Delete product
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find product
    const product = await Product.findByPk(id);
    if (!product) {
      throw new AppError("Không tìm thấy sản phẩm", 404);
    }

    // Delete product
    await product.destroy();

    res.status(200).json({
      status: "success",
      message: "Xóa sản phẩm thành công",
    });
  } catch (error) {
    next(error);
  }
};

// Get featured products
const getFeaturedProducts = async (req, res, next) => {
  try {
    const { limit = 8 } = req.query;

    const productsRaw = await Product.findAll({
      where: { featured: true },
      include: [
        {
          association: "categories",
          through: { attributes: [] },
        },
        {
          association: "reviews",
          attributes: ["rating"],
        },
        {
          association: "variants",
          attributes: ["id", "name", "price", "stockQuantity", "sku"],
        },
      ],
      limit: parseInt(limit),
      order: [["createdAt", "DESC"]],
    });

    // Process products to add ratings
    const products = productsRaw.map((product) => {
      const productJson = product.toJSON();

      // Calculate average rating
      const ratings = {
        average: 0,
        count: 0,
      };

      if (productJson.reviews && productJson.reviews.length > 0) {
        const totalRating = productJson.reviews.reduce(
          (sum, review) => sum + review.rating,
          0
        );
        ratings.average = parseFloat(
          (totalRating / productJson.reviews.length).toFixed(1)
        );
        ratings.count = productJson.reviews.length;
      }

      // Use variant price if available, otherwise use product price
      let displayPrice = parseFloat(productJson.price) || 0;
      let compareAtPrice = parseFloat(productJson.compareAtPrice) || null;

      if (productJson.variants && productJson.variants.length > 0) {
        // Sort variants by price (ascending) to get the lowest price first
        const sortedVariants = productJson.variants.sort(
          (a, b) => parseFloat(a.price) - parseFloat(b.price)
        );
        displayPrice = parseFloat(sortedVariants[0].price) || displayPrice;
      }

      // Add ratings and remove reviews from response
      delete productJson.reviews;

      return {
        ...productJson,
        price: displayPrice,
        compareAtPrice,
        ratings,
      };
    });

    res.status(200).json({
      status: "success",
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// Get related products
const getRelatedProducts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 4 } = req.query;

    // Find product
    const product = await Product.findByPk(id, {
      include: [
        {
          association: "categories",
          through: { attributes: [] },
        },
      ],
    });

    if (!product) {
      throw new AppError("Không tìm thấy sản phẩm", 404);
    }

    // Get category IDs
    const categoryIds = product.categories.map((category) => category.id);

    let relatedProductsRaw = [];

    // Nếu sản phẩm có danh mục, tìm sản phẩm liên quan theo danh mục
    if (categoryIds.length > 0) {
      relatedProductsRaw = await Product.findAll({
        include: [
          {
            association: "categories",
            where: { id: { [Op.in]: categoryIds } },
            through: { attributes: [] },
          },
          {
            association: "reviews",
            attributes: ["rating"],
          },
        ],
        where: {
          id: { [Op.ne]: id }, // Exclude current product
        },
        limit: parseInt(limit),
        order: [["createdAt", "DESC"]],
      });
    }

    // Nếu không tìm thấy sản phẩm liên quan theo danh mục hoặc sản phẩm không có danh mục
    // Trả về các sản phẩm mới nhất hoặc sản phẩm nổi bật
    if (relatedProductsRaw.length === 0) {
      console.log(
        `No related products found for product ${id}. Returning recent products instead.`
      );

      relatedProductsRaw = await Product.findAll({
        include: [
          {
            association: "reviews",
            attributes: ["rating"],
          },
        ],
        where: {
          id: { [Op.ne]: id }, // Exclude current product
          status: "active", // Chỉ lấy sản phẩm đang hoạt động
        },
        limit: parseInt(limit),
        order: [
          ["featured", "DESC"], // Ưu tiên sản phẩm nổi bật
          ["createdAt", "DESC"], // Sau đó là sản phẩm mới nhất
        ],
      });
    }

    // Process products to add ratings
    const relatedProducts = relatedProductsRaw.map((product) => {
      const productJson = product.toJSON();

      // Calculate average rating
      const ratings = {
        average: 0,
        count: 0,
      };

      if (productJson.reviews && productJson.reviews.length > 0) {
        const totalRating = productJson.reviews.reduce(
          (sum, review) => sum + review.rating,
          0
        );
        ratings.average = parseFloat(
          (totalRating / productJson.reviews.length).toFixed(1)
        );
        ratings.count = productJson.reviews.length;
      }

      // Add ratings and remove reviews from response
      delete productJson.reviews;

      return {
        ...productJson,
        ratings,
      };
    });

    res.status(200).json({
      status: "success",
      data: relatedProducts,
    });
  } catch (error) {
    next(error);
  }
};

// Search products
const searchProducts = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q) {
      throw new AppError("Từ khóa tìm kiếm là bắt buộc", 400);
    }

    // Build search condition for array field
    const searchCondition = sequelize.where(
      sequelize.cast(sequelize.col("search_keywords"), "TEXT"),
      { [Op.iLike]: `%${q}%` }
    );

    const { count, rows: products } = await Product.findAndCountAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${q}%` } },
          { description: { [Op.iLike]: `%${q}%` } },
          { shortDescription: { [Op.iLike]: `%${q}%` } },
          searchCondition,
        ],
      },
      include: [
        {
          association: "categories",
          through: { attributes: [] },
        },
      ],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      status: "success",
      data: {
        total: count,
        pages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        products,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get new arrivals
const getNewArrivals = async (req, res, next) => {
  try {
    const { limit = 8 } = req.query;

    const productsRaw = await Product.findAll({
      include: [
        {
          association: "categories",
          through: { attributes: [] },
        },
        {
          association: "reviews",
          attributes: ["rating"],
        },
      ],
      limit: parseInt(limit),
      order: [["createdAt", "DESC"]],
    });

    // Process products to add ratings
    const products = productsRaw.map((product) => {
      const productJson = product.toJSON();

      // Calculate average rating
      const ratings = {
        average: 0,
        count: 0,
      };

      if (productJson.reviews && productJson.reviews.length > 0) {
        const totalRating = productJson.reviews.reduce(
          (sum, review) => sum + review.rating,
          0
        );
        ratings.average = parseFloat(
          (totalRating / productJson.reviews.length).toFixed(1)
        );
        ratings.count = productJson.reviews.length;
      }

      // Add ratings and remove reviews from response
      delete productJson.reviews;

      return {
        ...productJson,
        ratings,
      };
    });

    res.status(200).json({
      status: "success",
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// Get best sellers
const getBestSellers = async (req, res, next) => {
  try {
    const { limit = 10, period = "month" } = req.query;

    // Calculate date range based on period
    const now = new Date();
    let startDate;

    switch (period) {
      case "week":
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case "month":
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case "year":
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    // Get best selling products based on order items
    const bestSellers = await sequelize.query(
      `
      SELECT 
        p.id, 
        p.name, 
        p.slug, 
        p.price, 
        p.compare_at_price, 
        p.thumbnail, 
        p.in_stock,
        p.stock_quantity,
        p.featured,
        COUNT(oi.product_id) as sales_count,
        SUM(oi.quantity) as units_sold
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'cancelled'
      AND o.created_at >= :startDate
      GROUP BY p.id
      ORDER BY units_sold DESC
      LIMIT :limit
      `,
      {
        replacements: { startDate, limit: parseInt(limit) },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // If no best sellers found, return newest products
    if (bestSellers.length === 0) {
      return await getNewArrivals(req, res, next);
    }

    // Get product IDs
    const productIds = bestSellers.map((product) => product.id);

    // Get full product details
    const products = await Product.findAll({
      where: { id: { [Op.in]: productIds } },
      include: [
        {
          association: "categories",
          through: { attributes: [] },
        },
      ],
      order: [
        [
          sequelize.literal(
            `CASE ${productIds
              .map((id, index) => `WHEN "Product"."id" = '${id}' THEN ${index}`)
              .join(" ")} END`
          ),
        ],
      ],
    });

    res.status(200).json({
      status: "success",
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// Get deals (products with discounts)
const getDeals = async (req, res, next) => {
  try {
    const { minDiscount = 5, limit = 12, sort = "discount_desc" } = req.query;

    // Get all products with a compareAtPrice
    const allProducts = await Product.findAll({
      where: {
        compareAtPrice: { [Op.ne]: null },
      },
      include: [
        {
          association: "categories",
          through: { attributes: [] },
        },
        {
          association: "reviews",
          attributes: ["rating"],
        },
      ],
    });

    // Calculate discount percentage and filter products
    const discountedProducts = allProducts
      .map((product) => {
        const price = parseFloat(product.price);
        const compareAtPrice = parseFloat(product.compareAtPrice);
        const discountPercentage =
          ((compareAtPrice - price) / compareAtPrice) * 100;

        // Calculate average rating
        const ratings = {
          average: 0,
          count: 0,
        };

        if (product.reviews && product.reviews.length > 0) {
          const totalRating = product.reviews.reduce(
            (sum, review) => sum + review.rating,
            0
          );
          ratings.average = parseFloat(
            (totalRating / product.reviews.length).toFixed(1)
          );
          ratings.count = product.reviews.length;
        }

        return {
          ...product.toJSON(),
          discountPercentage,
          ratings,
        };
      })
      .filter(
        (product) => product.discountPercentage >= parseFloat(minDiscount)
      );

    // Sort products
    let sortedProducts;
    switch (sort) {
      case "price_asc":
        sortedProducts = discountedProducts.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        sortedProducts = discountedProducts.sort((a, b) => b.price - a.price);
        break;
      case "discount_desc":
      default:
        sortedProducts = discountedProducts.sort(
          (a, b) => b.discountPercentage - a.discountPercentage
        );
    }

    // Apply limit
    const limitedProducts = sortedProducts.slice(0, parseInt(limit));

    res.status(200).json({
      status: "success",
      data: limitedProducts,
    });
  } catch (error) {
    next(error);
  }
};

// Get product variants
const getProductVariants = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find product
    const product = await Product.findByPk(id);
    if (!product) {
      throw new AppError("Không tìm thấy sản phẩm", 404);
    }

    // Get variants
    const variants = await ProductVariant.findAll({
      where: { productId: id },
    });

    res.status(200).json({
      status: "success",
      data: {
        variants,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get product reviews summary
const getProductReviewsSummary = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find product
    const product = await Product.findByPk(id);
    if (!product) {
      throw new AppError("Không tìm thấy sản phẩm", 404);
    }

    // Get reviews
    const reviews = await Review.findAll({
      where: { productId: id },
      attributes: ["rating"],
    });

    // Calculate summary
    const count = reviews.length;
    const average =
      count > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / count
        : 0;

    // Calculate distribution
    const distribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    reviews.forEach((review) => {
      distribution[review.rating]++;
    });

    res.status(200).json({
      status: "success",
      data: {
        average,
        count,
        distribution,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get product filters
const getProductFilters = async (req, res, next) => {
  try {
    const { categoryId } = req.query;

    console.log("Getting product filters with categoryId:", categoryId);

    // Build where condition
    const whereCondition = {};
    const includeCondition = [];

    if (categoryId) {
      // Kiểm tra xem categoryId có phải là UUID hợp lệ không
      const isValidUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          categoryId
        );

      if (isValidUUID) {
        includeCondition.push({
          association: "categories",
          where: { id: categoryId },
          through: { attributes: [] },
          required: false, // Đặt required: false để tránh lỗi khi không tìm thấy danh mục
        });
      } else {
        // Nếu không phải UUID, có thể là slug
        const category = await Category.findOne({
          where: { slug: categoryId },
        });
        if (category) {
          includeCondition.push({
            association: "categories",
            where: { id: category.id },
            through: { attributes: [] },
            required: false,
          });
        }
      }
    }

    // Get price range
    const priceRange = await Product.findAll({
      attributes: [
        [sequelize.fn("MIN", sequelize.col("price")), "min"],
        [sequelize.fn("MAX", sequelize.col("price")), "max"],
      ],
      where: whereCondition,
      include: includeCondition,
      raw: true,
    });

    // Lấy category ID thực tế nếu có
    let actualCategoryId = null;
    if (categoryId) {
      const isValidUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          categoryId
        );
      if (isValidUUID) {
        actualCategoryId = categoryId;
      } else {
        const category = await Category.findOne({
          where: { slug: categoryId },
        });
        if (category) {
          actualCategoryId = category.id;
        }
      }
    }

    // Xây dựng điều kiện lọc sản phẩm theo danh mục
    let productFilter = {};
    if (actualCategoryId) {
      productFilter = {
        productId: {
          [Op.in]: sequelize.literal(
            `(SELECT product_id FROM product_categories WHERE category_id = '${actualCategoryId}')`
          ),
        },
      };
    }

    // Get brands
    const brands = await ProductAttribute.findAll({
      attributes: ["values"],
      where: {
        name: "brand",
        ...(actualCategoryId ? productFilter : {}),
      },
      raw: true,
    });

    // Get colors
    const colors = await ProductAttribute.findAll({
      attributes: ["values"],
      where: {
        name: "color",
        ...(actualCategoryId ? productFilter : {}),
      },
      raw: true,
    });

    // Get sizes
    const sizes = await ProductAttribute.findAll({
      attributes: ["values"],
      where: {
        name: "size",
        ...(actualCategoryId ? productFilter : {}),
      },
      raw: true,
    });

    // Get other attributes
    const otherAttributes = await ProductAttribute.findAll({
      attributes: ["name", "values"],
      where: {
        name: { [Op.notIn]: ["brand", "color", "size"] },
        ...(actualCategoryId ? productFilter : {}),
      },
      group: ["name", "values"],
      raw: true,
    });

    // Xử lý dữ liệu trả về
    const uniqueBrands = new Set();
    brands.forEach((brand) => {
      if (brand.values && Array.isArray(brand.values)) {
        brand.values.forEach((value) => uniqueBrands.add(value));
      }
    });

    const uniqueColors = new Set();
    colors.forEach((color) => {
      if (color.values && Array.isArray(color.values)) {
        color.values.forEach((value) => uniqueColors.add(value));
      }
    });

    const uniqueSizes = new Set();
    sizes.forEach((size) => {
      if (size.values && Array.isArray(size.values)) {
        size.values.forEach((value) => uniqueSizes.add(value));
      }
    });

    res.status(200).json({
      status: "success",
      data: {
        priceRange: {
          min: parseFloat(priceRange[0]?.min || 0),
          max: parseFloat(priceRange[0]?.max || 0),
        },
        brands: Array.from(uniqueBrands),
        colors: Array.from(uniqueColors),
        sizes: Array.from(uniqueSizes),
        attributes: otherAttributes.map((attr) => ({
          name: attr.name,
          values: attr.values || [],
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getRelatedProducts,
  searchProducts,
  getNewArrivals,
  getBestSellers,
  getDeals,
  getProductVariants,
  getProductReviewsSummary,
  getProductFilters,
};
