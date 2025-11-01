const { Wishlist, Product } = require("../models");
const { AppError } = require("../middlewares/errorHandler");
const { Op } = require("sequelize");

// Get user wishlist
const getWishlist = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      minPrice,
      maxPrice,
      sort = "createdAt",
      order = "DESC",
    } = req.query;

    //build filter conditions
    const whereConditions = {};

    if (minPrice) {
      whereConditions.price = {
        ...whereConditions.price,
        [Op.gte]: parseFloat(minPrice),
      };
    }

    if (maxPrice) {
      whereConditions.price = {
        ...whereConditions.price,
        [Op.lte]: parseFloat(minPrice),
      };
    }
    const userId = req.user.id;
    const { count, rows: wishlistItems } = await Wishlist.findAndCountAll({
      where: { userId },
      include: [
        {
          model: Product,
          as: "products",
          attributes: [
            "id",
            "name",
            "slug",
            "price",
            "compareAtPrice",
            "thumbnail",
            "inStock",
            "stockQuantity",
          ],
        },
      ],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [[sort, order]],
    });
    //process product wishlist
    const products = wishlistItems.map((item) => item.products);

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

// Add product to wishlist
const addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    // Check if product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      throw new AppError("Sản phẩm không tồn tại", 404);
    }

    // Check if product is already in wishlist
    const existingItem = await Wishlist.findOne({
      where: { userId, productId },
    });

    if (existingItem) {
      const wishlistItems = await Wishlist.findAll({
        where: { userId },
        include: [
          {
            model: Product,
            as: "products",
            attributes: [
              "id",
              "name",
              "slug",
              "price",
              "compareAtPrice",
              "thumbnail",
              "inStock",
              "stockQuantity",
            ],
          },
        ],
        order: [["createdAt", "DESC"]],
      });
      return res.status(200).json({
        status: "success",
        message: "Sản phẩm đã có trong danh sách yêu thích",
        data: wishlistItems.map((item) => item.products),
      });
    }

    // Add to wishlist
    await Wishlist.create({
      userId,
      productId,
    });
    const wishlistItem = await Wishlist.findAll({
      where: { userId },
      include: [
        {
          model: Product,
          as: "products",
          attributes: [
            "id",
            "name",
            "slug",
            "price",
            "compareAtPrice",
            "thumbnail",
            "inStock",
            "stockQuantity",
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(201).json({
      status: "success",
      message: "Đã thêm sản phẩm vào danh sách yêu thích",
      data: wishlistItem.map((item) => item.products),
    });
  } catch (error) {
    next(error);
  }
};

// Remove product from wishlist
const removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    // Check if product is in wishlist
    const wishlistItem = await Wishlist.findOne({
      where: { userId, productId },
    });

    if (!wishlistItem) {
      throw new AppError("Sản phẩm không có trong danh sách yêu thích", 404);
    }

    // Remove from wishlist
    await wishlistItem.destroy();

    res.status(200).json({
      status: "success",
      message: "Đã xóa sản phẩm khỏi danh sách yêu thích",
    });
  } catch (error) {
    next(error);
  }
};

// Check if product is in wishlist
const checkWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id; // Optional auth

    // If no user (guest), product is not in wishlist
    // if (!userId) {
    //   return res.status(200).json({
    //     status: "success",
    //     data: {
    //       inWishlist: false,
    //     },
    //   });
    // }

    // Check if product is in wishlist
    const wishlistItem = await Wishlist.findOne({
      where: { userId, productId },
    });

    res.status(200).json({
      status: "success",
      data: {
        inWishlist: !!wishlistItem,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Clear wishlist
const clearWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Delete all wishlist items
    await Wishlist.destroy({
      where: { userId },
    });

    res.status(200).json({
      status: "success",
      message: "Đã xóa tất cả sản phẩm trong danh sách yêu thích",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist,
  clearWishlist,
};
