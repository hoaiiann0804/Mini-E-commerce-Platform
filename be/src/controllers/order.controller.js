const {
  Order,
  OrderItem,
  Cart,
  CartItem,
  Product,
  ProductVariant,
  sequelize,
} = require("../models");
const { AppError } = require("../middlewares/errorHandler");
const emailService = require("../services/email/emailService");

// Create order from cart
const createOrder = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const userId = req.user.id;
    const {
      shippingFirstName,
      shippingLastName,
      shippingCompany,
      shippingAddress1,
      shippingAddress2,
      shippingCity,
      shippingState,
      shippingZip,
      shippingCountry,
      shippingPhone,
      billingFirstName,
      billingLastName,
      billingCompany,
      billingAddress1,
      billingAddress2,
      billingCity,
      billingState,
      billingZip,
      billingCountry,
      billingPhone,
      paymentMethod,
      notes,
    } = req.body;

    // Get active cart
    const cart = await Cart.findOne({
      where: {
        userId,
        status: "active",
      },
      include: [
        {
          association: "items",
          // include: [
          //   {
          //     model: Product,
          //     attributes: [
          //       "id",
          //       "name",
          //       "slug",
          //       "price",
          //       "thumbnail",
          //       "inStock",
          //       "stockQuantity",
          //       "sku",
          //     ],
          //   },
          //   {
          //     model: ProductVariant,
          //     attributes: ["id", "name", "price", "stockQuantity", "sku"],
          //   },
          // ],
        },
      ],
      transaction,
    });

    if (!cart || cart.items.length === 0) {
      throw new AppError("Giỏ hàng trống", 400);
    }

    // Check stock and calculate totals
    let subtotal = 0;
    // Create order items
    const orderItemsToCreate = [];
    const stockUpdatePromises = [];
    for (const item of cart.items) {
      let targetModel;
      let variant = null;
      let variantProduct = null;
      targetModel = item.variantId
        ? await ProductVariant.findByPk(item.variantId, {
            lock: transaction.LOCK.UPDATE,
            transaction,
          })
        : await Product.findByPk(item.productId, {
            lock: transaction.LOCK.UPDATE,
            transaction,
          });
      if (item.variantId) variant = targetModel;
      if (variant) {
        variantProduct = await Product.findByPk(variant.productId, {
          attributes: ["id", "name", "thumbnail", "images"],
          transaction,
        });
      }
      if (!targetModel) throw new AppError("Sản phẩm không tồn tại", 404);
      if (targetModel.stockQuantity < item.quantity)
        throw new AppError(
          `Sản phẩm ${targetModel.name} không đủ tồn kho (Còn: ${targetModel.stockQuantity})`,
          400
        );

      const itemPrice = targetModel.price;
      const itemSubtotal = itemPrice * item.quantity;
      subtotal += itemSubtotal;
      const variantImage =
        variant?.images && variant.images.length > 0 ? variant.images[0] : null;
      const productFallbackImage = variantProduct
        ? variantProduct.thumbnail || variantProduct.images?.[0]
        : null;
      const productImage = !variant
        ? targetModel.thumbnail || targetModel.images?.[0]
        : null;
      const itemName = variantProduct?.name || targetModel.name;
      orderItemsToCreate.push({
        productId: item.productId,
        variantId: item.variantId || null,
        name: itemName,
        sku: targetModel.sku,
        price: itemPrice,
        quantity: item.quantity,
        subtotal: itemSubtotal,
        image: variantImage || productFallbackImage || productImage,
        attributes: variant ? { variant: variant.name } : {},
        // attributes: targetModel.attributes,
      });

      stockUpdatePromises.push(
        targetModel.decrement("stockQuantity", {
          by: item.quantity,
          transaction,
        })
      );
    }
    const tax = 0;
    const shippingCost = 0;
    const discount = 0;
    const total = subtotal + tax + shippingCost - discount;

    // Generate order number
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    // const count = await Order.count();
    const randomSuffix = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
    const orderNumber = `ORD-${year}${month}-${randomSuffix}`;

    // Create order
    const order = await Order.create(
      {
        number: orderNumber,
        userId,
        shippingFirstName,
        shippingLastName,
        shippingCompany,
        shippingAddress1,
        shippingAddress2,
        shippingCity,
        shippingState,
        shippingZip,
        shippingCountry,
        shippingPhone,
        billingFirstName,
        billingLastName,
        billingCompany,
        billingAddress1,
        billingAddress2,
        billingCity,
        billingState,
        billingZip,
        billingCountry,
        billingPhone,
        paymentMethod,
        paymentStatus: "pending",
        subtotal,
        tax,
        shippingCost,
        discount,
        total,
        notes,
      },
      { transaction }
    );
    const orderItemsWithId = orderItemsToCreate.map((item) => ({
      ...item,
      orderId: order.id,
    }));
    await Promise.all([
      OrderItem.bulkCreate(orderItemsWithId, { transaction }),
      ...stockUpdatePromises,
      cart.update(
        {
          status: "converted",
        },
        { transaction }
      ),

      // Clear cart items
      CartItem.destroy({
        where: { cartId: cart.id },
        transaction,
      }),
    ]);

    await transaction.commit();

    // Send order confirmation email
    try {
      await emailService.sendOrderConfirmationEmail(req.user.email, {
        orderNumber: order.number,
        orderDate: order.createdAt,
        total: order.total,
        items: orderItemsToCreate.map((item) => {
          const variantName = item.attributes?.variant;
          const displayName = variantName
            ? `${item.name} (${variantName})`
            : item.name;
          return {
            name: displayName,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal,
          };
        }),
        shippingAddress: {
          name: `${order.shippingFirstName} ${order.shippingLastName}`,
          address1: order.shippingAddress1,
          address2: order.shippingAddress2,
          city: order.shippingCity,
          state: order.shippingState,
          zip: order.shippingZip,
          country: order.shippingCountry,
        },
      });
    } catch (error) {
      console.error("[email] order confirmation failed", {
        orderId: order.id,
        orderNumber: order.number,
        email: req.user?.email,
        message: error?.message,
      });
    }

    res.status(201).json({
      status: "success",
      data: {
        // order: {
        //   // id: order.id,
        //   // number: order.number,
        //   // status: order.status,
        //   // total: order.total,
        //   // createdAt: order.createdAt,
        // },
        order,
      },
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// Get user orders
const getUserOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const { count, rows: orders } = await Order.findAndCountAll({
      where: { userId },
      include: [
        {
          association: "items",
          include: [
            {
              model: Product,
              attributes: ["id", "name", "thumbnail", "images", "price"],
            },
          ],
        },
      ],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [["createdAt", "DESC"]],
    });

    const ordersWithImages = orders.map((order) => {
      const orderJson = order.toJSON();
      if (orderJson.items && orderJson.items.length > 0) {
        orderJson.items = orderJson.items.map((item) => {
          if (!item.image && item.Product) {
            item.image = item.Product.thumbnail || item.Product.images?.[0];
          }
          return item;
        });
      }
      return orderJson;
    });

    res.status(200).json({
      status: "success",
      data: {
        total: count,
        pages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        orders: ordersWithImages,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get order by ID
const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({
      where: { id, userId },
      include: [
        {
          association: "items",
          include: [
            {
              model: Product,
              attributes: ["id", "name", "thumbnail", "images", "price"],
            },
          ],
        },
      ],
    });

    if (!order) {
      throw new AppError("Không tìm thấy đơn hàng", 404);
    }

    const orderJson = order.toJSON();
    if (orderJson.items && orderJson.items.length > 0) {
      orderJson.items = orderJson.items.map((item) => {
        if (!item.image && item.Product) {
          item.image = item.Product.thumbnail || item.Product.images?.[0];
        }
        return item;
      });
    }

    res.status(200).json({
      status: "success",
      data: orderJson,
    });
  } catch (error) {
    next(error);
  }
};

// Get order by number
const getOrderByNumber = async (req, res, next) => {
  try {
    const { number } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({
      where: { number, userId },
      include: [
        {
          association: "items",
          include: [
            {
              model: Product,
              attributes: ["id", "name", "thumbnail", "images", "price"],
            },
          ],
        },
      ],
    });

    if (!order) {
      throw new AppError("Không tìm thấy đơn hàng", 404);
    }

    const orderJson = order.toJSON();
    if (orderJson.items && orderJson.items.length > 0) {
      orderJson.items = orderJson.items.map((item) => {
        if (!item.image && item.Product) {
          item.image = item.Product.thumbnail || item.Product.images?.[0];
        }
        return item;
      });
    }

    res.status(200).json({
      status: "success",
      data: orderJson,
    });
  } catch (error) {
    next(error);
  }
};

// Cancel order
const cancelOrder = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({
      where: { id, userId },
      include: [
        {
          association: "items",
          include: [
            {
              model: Product,
            },
            {
              model: ProductVariant,
            },
          ],
        },
      ],
    });

    if (!order) {
      throw new AppError("Không tìm thấy đơn hàng", 404);
    }

    // Check if order can be cancelled
    if (order.status !== "pending" && order.status !== "processing") {
      throw new AppError("Không thể hủy đơn hàng này", 400);
    }

    // Update order status
    await order.update(
      {
        status: "cancelled",
      },
      { transaction }
    );

    // Restore stock
    for (const item of order.items) {
      if (item.variantId) {
        const variant = item.ProductVariant;
        await variant.update(
          {
            stockQuantity: variant.stockQuantity + item.quantity,
          },
          { transaction }
        );
      } else {
        const product = item.Product;
        await product.update(
          {
            stockQuantity: product.stockQuantity + item.quantity,
          },
          { transaction }
        );
      }
    }

    await transaction.commit();

    // Send cancellation email
    try {
      await emailService.sendOrderCancellationEmail(req.user.email, {
        orderNumber: order.number,
        orderDate: order.createdAt,
      });
    } catch (error) {
      console.error("[email] order cancellation failed", {
        orderId: order.id,
        orderNumber: order.number,
        email: req.user?.email,
        message: error?.message,
      });
    }

    res.status(200).json({
      status: "success",
      message: "Đơn hàng đã được hủy",
      data: {
        id: order.id,
        number: order.number,
        status: "cancelled",
      },
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// Admin: Get all orders
const getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const whereConditions = {};
    if (status) {
      whereConditions.status = status;
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereConditions,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [["createdAt", "DESC"]],
      include: [
        {
          association: "user",
          attributes: ["id", "firstName", "lastName", "email"],
        },
      ],
    });

    res.status(200).json({
      status: "success",
      data: {
        total: count,
        pages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        orders,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Update order status
const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findByPk(id, {
      include: [
        {
          association: "user",
          attributes: ["id", "firstName", "lastName", "email"],
        },
      ],
    });

    if (!order) {
      throw new AppError("Không tìm thấy đơn hàng", 404);
    }

    // Update order status
    await order.update({ status });

    // Send status update email
    try {
      await emailService.sendOrderStatusUpdateEmail(order.user.email, {
        orderNumber: order.number,
        orderDate: order.createdAt,
        status,
      });
    } catch (error) {
      console.error("[email] order status update failed", {
        orderId: order.id,
        orderNumber: order.number,
        email: order.user?.email,
        status,
        message: error?.message,
      });
    }

    res.status(200).json({
      status: "success",
      message: "Cập nhật trạng thái đơn hàng thành công",
      data: {
        id: order.id,
        number: order.number,
        status: order.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Thanh toán lại đơn hàng
 */
const repayOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Tìm đơn hàng
    const order = await Order.findOne({
      where: { id, userId },
    });

    if (!order) {
      throw new AppError("Không tìm thấy đơn hàng", 404);
    }

    // Kiểm tra trạng thái đơn hàng
    if (
      order.status !== "pending" &&
      order.status !== "cancelled" &&
      order.paymentStatus !== "failed"
    ) {
      throw new AppError("Đơn hàng này không thể thanh toán lại", 400);
    }

    // Cập nhật trạng thái đơn hàng
    await order.update({
      status: "pending",
      paymentStatus: "pending",
    });

    // Lấy origin từ request header để tạo URL thanh toán động
    const origin = req.get("origin") || "http://localhost:5175";

    // Tạo URL thanh toán giả lập
    // Trong thực tế, bạn sẽ tích hợp với cổng thanh toán thực tế ở đây
    const paymentUrl = `${origin}/checkout?repayOrder=${order.id}&amount=${order.total}`;

    res.status(200).json({
      status: "success",
      message: "Đơn hàng đã được cập nhật để thanh toán lại",
      data: {
        id: order.id,
        number: order.number,
        status: order.status,
        paymentStatus: order.paymentStatus,
        total: order.total,
        paymentUrl: paymentUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  getOrderByNumber,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  repayOrder,
};
