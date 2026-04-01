const {
  Review,
  Product,
  User,
  Order,
  OrderItem,
  ReviewFeedback,
  sequelize,
} = require("../models");
const { AppError } = require("../middlewares/errorHandler");
const { Op } = require("sequelize");

// Create review
const createReview = async (req, res, next) => {
  try {
    const { productId, rating, title, comment, images } = req.body;
    const userId = req.user.id;

    // Check if product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      throw new AppError("Sản phẩm không tồn tại", 404);
    }

    // Check if user has purchased the product
    const hasPurchased = await Order.findOne({
      where: {
        userId,
        status: "delivered", // Only delivered orders can be reviewed
      },
      include: [
        {
          model: OrderItem,
          as: "items",
          where: { productId },
          required: true,
        },
      ],
    });

    if (!hasPurchased) {
      throw new AppError("Bạn cần mua sản phẩm trước khi đánh giá", 403);
    }

    // Check if user has already reviewed this product
    const existingReview = await Review.findOne({
      where: { userId, productId },
    });

    if (existingReview) {
      throw new AppError("Bạn đã đánh giá sản phẩm này rồi", 400);
    }

    // Create review
    const review = await Review.create({
      productId,
      userId,
      rating,
      title,
      content: comment,
      images: images || [],
      isVerified: true, // Auto-verify since we checked purchase
    });

    // Get review with user info
    const createdReview = await Review.findByPk(review.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName", "avatar"],
        },
      ],
    });

    res.status(201).json({
      status: "success",
    });
  } catch (error) {
    next(error);
  }
};

// Update review
const updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, title, comment, images } = req.body;
    const userId = req.user.id;

    // Find review
    const review = await Review.findOne({
      where: { id, userId },
    });

    if (!review) {
      throw new AppError("Không tìm thấy đánh giá", 404);
    }

    // Update review
    await review.update({
      rating: rating !== undefined ? rating : review.rating,
      title: title !== undefined ? title : review.title,
      content: comment !== undefined ? comment : review.content,
      images: images !== undefined ? images : review.images,
      isVerified: true,
    });

    // Get updated review with user info
    const updatedReview = await Review.findByPk(review.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName", "avatar"],
        },
      ],
    });

    res.status(200).json({
      status: "success",
    });
  } catch (error) {
    next(error);
  }
};

// Delete review
const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find review
    const review = await Review.findOne({
      where: { id, userId },
    });

    if (!review) {
      throw new AppError("Không tìm thấy đánh giá", 404);
    }

    const productId = review.productId;

    // Delete review
    await review.destroy();

    res.status(200).json({
      status: "success",
      message: "Xóa đánh giá thành công",
    });
  } catch (error) {
    next(error);
  }
};

// Get product reviews
const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const {
      page = 1,
      limit = 10,
      sort = "newest",
      rating,
      verified,
      withImages,
    } = req.query;

    // Map sort options to actual database columns
    const sortMapping = {
      newest: ["createdAt", "DESC"],
      oldest: ["createdAt", "ASC"],
      highest_rating: ["rating", "DESC"],
      lowest_rating: ["rating", "ASC"],
      most_helpful: ["likes", "DESC"],
    };

    const [sortColumn, sortOrder] = sortMapping[sort] || ["createdAt", "DESC"];

    // Check if product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      throw new AppError("Sản phẩm không tồn tại", 404);
    }

    // Build where clause with filters
    const whereClause = { productId };

    if (rating) {
      whereClause.rating = parseInt(rating);
    }

    if (verified !== undefined) {
      whereClause.isVerified = verified === "true";
    }

    // Get reviews
    const { count, rows: reviews } = await Review.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName", "avatar"],
        },
      ],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [[sortColumn, sortOrder]],
    });

    res.status(200).json({
      status: "success",
      data: {
        total: count,
        pages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        reviews,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get user reviews
const getUserReviews = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    // Get reviews
    const { count, rows: reviews } = await Review.findAndCountAll({
      where: { userId },
      include: [
        {
          model: Product,
          attributes: ["id", "name", "slug", "thumbnail"],
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
        reviews,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get all reviews
const getAllReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, verified } = req.query;

    const whereConditions = {};
    if (verified !== undefined) {
      whereConditions.isVerified = verified === "true";
    }

    // Get reviews
    const { count, rows: reviews } = await Review.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName", "email"],
        },
        {
          model: Product,
          attributes: ["id", "name", "slug"],
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
        reviews,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Verify review
const verifyReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;

    // Find review
    const review = await Review.findByPk(id);
    if (!review) {
      throw new AppError("Không tìm thấy đánh giá", 404);
    }

    // Update review
    await review.update({ isVerified });

    res.status(200).json({
      status: "success",
      message: isVerified
        ? "Đánh giá đã được xác nhận"
        : "Đánh giá đã bị từ chối",
      data: {
        id: review.id,
        isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Mark review as helpful or not
const markReviewHelpful = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { helpful } = req.body;
    const userId = req.user.id;

    // Find review
    const review = await Review.findByPk(id);
    if (!review) {
      throw new AppError("Không tìm thấy đánh giá", 404);
    }

    // Check if user is not reviewing their own review
    if (review.userId === userId) {
      throw new AppError("Bạn không thể đánh giá đánh giá của chính mình", 400);
    }

    // Find existing review feedback
    const reviewFeedback = await ReviewFeedback.findOne({
      where: { reviewId: id, userId },
    });

    if (reviewFeedback) {
      // Update existing feedback
      if (reviewFeedback.isHelpful !== helpful) {
        // Update review counts
        if (helpful) {
          // Change from dislike to like
          await review.increment("likes");
          await review.decrement("dislikes");
        } else {
          // Change from like to dislike
          await review.decrement("likes");
          await review.increment("dislikes");
        }

        // Update feedback
        await reviewFeedback.update({ isHelpful: helpful });
      }
    } else {
      // Create new feedback
      await ReviewFeedback.create({
        reviewId: id,
        userId,
        isHelpful: helpful,
      });

      // Update review counts
      if (helpful) {
        await review.increment("likes");
      } else {
        await review.increment("dislikes");
      }
    }

    // Get updated review
    const updatedReview = await Review.findByPk(id);

    res.status(200).json({
      status: "success",
      message: helpful
        ? "Đã đánh dấu đánh giá là hữu ích"
        : "Đã đánh dấu đánh giá là không hữu ích",
      data: {
        id: updatedReview.id,
        likes: updatedReview.likes,
        dislikes: updatedReview.dislikes,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  updateReview,
  deleteReview,
  getProductReviews,
  getUserReviews,
  getAllReviews,
  verifyReview,
  markReviewHelpful,
};
