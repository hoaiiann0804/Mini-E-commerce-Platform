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
const emailService = require("../shared/services/email/emailService");
/**
 * Import service xử lý analytics (view count, sold count)
 *
 * TƯ DUY KIẾN TRÚC:
 * Tách biệt business logic: Order controller chỉ quản lý
 * vòng đời đơn hàng, còn việc cập nhật sold_count
 * là "side effect" được ủy thác cho analytics service
 */

// Thời gian giữ chỗ tồn kho (phút)
const HOLD_MINUTES = 15;

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
          400,
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
        }),
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
        status: "pending",
        subtotal,
        tax,
        shippingCost,
        discount,
        total,
        notes,
        // Giữ chỗ tồn kho tạm thời: 15 phút
        // Sau khi Stripe thanh toán thành công -> expiresAt = null (chốt vĩnh viễn)
        // Cleanup job sẽ hoàn kho nếu quá 15 phút
        //  mà chưa thanh toán
        expiresAt: new Date(Date.now() + HOLD_MINUTES * 60 * 1000),
      },
      { transaction },
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
        { transaction },
      ),

      // Clear cart items
      CartItem.destroy({
        where: { cartId: cart.id },
        transaction,
      }),
    ]);

    await transaction.commit();

    // Gửi email thông báo đơn hàng chờ thanh toán (SAU khi commit transaction)
    // Email này không ảnh hưởng đến việc tạo đơn - nếu gửi lỗi chỉ log, không rollback
    try {
      await emailService.sendOrderPendingPaymentEmail(req.user.email, {
        orderNumber: order.number,
        orderDate: order.createdAt,
        total: order.total,
        expiresAt: order.expiresAt,
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
      // Email thất bại không ảnh hưởng đến đơn hàng đã tạo thành công
      console.error("[email] order pending payment email failed", {
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
      { transaction },
    );

    // Restore stock
    for (const item of order.items) {
      if (item.variantId) {
        const variant = item.ProductVariant;
        await variant.update(
          {
            stockQuantity: variant.stockQuantity + item.quantity,
          },
          { transaction },
        );
      } else {
        const product = item.Product;
        await product.update(
          {
            stockQuantity: product.stockQuantity + item.quantity,
          },
          { transaction },
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

    /**
     * Lưu trạng thái cũ trước khi cập nhật
     *
     * TƯ DUY NGHIỆP VỤ:
     * Cần biết trạng thái cũ để xác định đây có phải là lần ĐẦU TIÊN
     * chuyển sang 'delivered' hay không.
     *
     * Tại sao cần check? Nếu admin vô tình click 'delivered' 2 lần:
     *   - Lần 1: pending → delivered → soldCount += N (đúng)
     *   - Lần 2: delivered → delivered → soldCount += N nữa (ĐỤC ĐÔI, sai!)
     * → Phải kiểm tra previousStatus ≠ 'delivered' mới cập nhật soldCount
     */
    const previousStatus = order.status;

    /**
     * ═══════════════════════════════════════════════════════════════
     * DATABASE TRANSACTION — All-or-Nothing Consistency
     * ═══════════════════════════════════════════════════════════════
     *
     * TƯ DUY KỸ THUẬT - TẠI SAO DÙNG TRANSACTION?
     *
     * Vấn đề cũ (Fire-and-Forget):
     *   await order.update({ status });     ← Commit vào DB
     *   updateSoldCount().catch(...)        ← Chạy ngầm, không đảm bảo
     *   → Nếu Node.js crash sau commit nhưng trước khi updateSoldCount chạy:
     *     orders.status = 'delivered' ✅  (đã commit)
     *     products.sold_count = cũ    ❌  (mất vĩnh viễn, không khôi phục)
     *
     * Giải pháp (Transaction):
     *   BEGIN TRANSACTION
     *     UPDATE orders SET status = 'delivered'       ← Atomic
     *     UPDATE products SET sold_count += N          ← Atomic, cùng transaction
     *   COMMIT  ← Cả 2 thành công cùng lúc
     *   ROLLBACK ← Cả 2 thất bại cùng lúc nếu có lỗi
     *
     * → Không bao giờ có trạng thái bất đối xứng
     *
     * Lưu ý: Email gửi NGOÀI transaction vì:
     *   - Email là non-critical side effect (không ảnh hưởng dữ liệu)
     *   - Gửi email trong transaction = giữ DB lock lâu hơn (không cần)
     *   - Email lỗi không được rollback order (đơn vẫn phải delivered)
     * ═══════════════════════════════════════════════════════════════
     */
    const transaction = await sequelize.transaction();

    try {
      // BƯỚC 1: Cập nhật status đơn hàng trong transaction
      await order.update({ status }, { transaction });

      /**
       * BƯỚC 2: Cập nhật soldCount KHI VÀ CHỈ KHI đơn chuyển sang 'delivered'
       *
       * Điều kiện kép:
       *   (1) status === 'delivered': Trạng thái mới phải là delivered
       *   (2) previousStatus !== 'delivered': Trạng thái cũ không được là delivered
       *       → Chỉ tăng soldCount 1 lần duy nhất cho mỗi đơn hàng
       *
       * Ví dụ các trường hợp:
       *   processing → delivered : (1)=true, (2)=true  → Cập nhật soldCount ✅
       *   shipped    → delivered : (1)=true, (2)=true  → Cập nhật soldCount ✅
       *   delivered  → delivered : (1)=true, (2)=false → Bỏ qua              ❌
       *   delivered  → cancelled : (1)=false           → Bỏ qua              ❌
       */
      if (status === "delivered" && previousStatus !== "delivered") {
        /**
         * Lấy tất cả items trong đơn hàng, group theo productId
         *
         * Tại sao GROUP BY productId?
         * Đơn hàng có thể có nhiều variant của cùng 1 sản phẩm
         * (vd: iPhone 15 đen qty=1 + iPhone 15 trắng qty=1 → cộng lại = 2)
         * SUM(quantity) = tổng số lượng thực sự của sản phẩm đó trong đơn
         */
        const itemGroups = await OrderItem.findAll({
          attributes: [
            "productId",
            [sequelize.fn("SUM", sequelize.col("quantity")), "totalQuantity"],
          ],
          where: { orderId: id },
          group: ["productId"],
          raw: true,
          transaction, // ← Phải nằm trong cùng transaction!
        });

        if (itemGroups && itemGroups.length > 0) {
          /**
           * Cập nhật soldCount song song cho tất cả sản phẩm
           *
           * TƯ DUY KỸ THUẬT:
           * - Promise.all: chạy song song, nhanh hơn sequential await
           * - Product.increment: SQL "SET sold_count = sold_count + N"
           *   → Atomic tại tầng DB, không race condition
           * - transaction: đảm bảo cùng transaction với order.update()
           */
          await Promise.all(
            itemGroups.map(({ productId, totalQuantity }) =>
              Product.increment("soldCount", {
                by: parseInt(totalQuantity),
                where: { id: productId },
                transaction, // ← Cùng transaction!
              })
            )
          );

          console.log(
            `[updateOrderStatus] ✅ soldCount đã cập nhật cho ${itemGroups.length} sản phẩm (order: ${id})`
          );
        }
      }

      // COMMIT: Cả 2 bước trên thành công → ghi vào DB
      await transaction.commit();
    } catch (txError) {
      // ROLLBACK: Bất kỳ bước nào lỗi → hoàn tác cả 2
      await transaction.rollback();
      console.error("[updateOrderStatus] Transaction rollback:", txError.message);
      throw txError; // Re-throw để catch bên ngoài xử lý
    }

    // ─── Ngoài transaction: Email (non-critical side effect) ───────────
    // Gửi email KHÔNG nằm trong transaction vì:
    // - Email lỗi không nên ảnh hưởng đến trạng thái đơn hàng
    // - Giữ DB lock ngắn nhất có thể (performance)
    emailService
      .sendOrderStatusUpdateEmail(order.user.email, {
        orderNumber: order.number,
        orderDate: order.createdAt,
        status,
      })
      .catch((error) => {
        console.error("[email] order status update failed", {
          orderId: order.id,
          orderNumber: order.number,
          email: order.user?.email,
          status,
          message: error?.message,
        });
      });

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
      paymentUrl: paymentUrl,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mua lại đơn hàng (Re-order / Buy Again)
 * NGHIỆP VỤ: Đơn cũ (expired/cancelled) giữ nguyên làm chứng từ lịch sử (bất biến).
 * Hệ thống tự động copy các items của đơn cũ vào Giỏ hàng (Cart) active để khách Checkout tạo đơn MỚI.
 */
const reorder = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 1. Lấy đơn hàng cũ cùng danh sách sản phẩm
    const order = await Order.findOne({
      where: { id, userId },
      include: [{ association: "items" }],
      transaction,
    });

    if (!order) {
      throw new AppError("Không tìm thấy đơn hàng", 404);
    }

    // 2. Tìm hoặc tạo mới Giỏ hàng đang hoạt động (active cart) của người dùng
    let [cart] = await Cart.findOrCreate({
      where: { userId, status: "active" },
      defaults: { userId, status: "active" },
      transaction,
    });

    // 3. Sao chép từng sản phẩm từ đơn cũ vào giỏ hàng
    for (const item of order.items) {
      const [cartItem, created] = await CartItem.findOrCreate({
        where: {
          cartId: cart.id,
          productId: item.productId,
          variantId: item.variantId || null,
        },
        defaults: {
          cartId: cart.id,
          productId: item.productId,
          variantId: item.variantId || null,
          quantity: item.quantity,
          price: item.price,
        },
        transaction,
      });

      // Nếu sản phẩm đã có sẵn trong giỏ thì cộng dồn số lượng
      if (!created) {
        await cartItem.increment("quantity", {
          by: item.quantity,
          transaction,
        });
      }
    }

    await transaction.commit();

    res.status(200).json({
      status: "success",
      message: "Đã thêm sản phẩm vào giỏ hàng để mua lại",
      data: { cartId: cart.id },
    });
  } catch (error) {
    await transaction.rollback();
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
  reorder, // Export hàm mua lại
};
