const stripeService = require("../shared/services/payment/stripe.service");
const { Order, OrderItem, User, sequelize } = require("../models");
const { AppError } = require("../middlewares/errorHandler");
const emailService = require("../shared/services/email/emailService");

// Create payment intent
const createPaymentIntent = async (req, res, next) => {
  try {
    const { amount, currency = "usd", orderId } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      throw new AppError("Invalid amount", 400);
    }

    // Create payment intent with metadata
    //console.log('Creating payment intent with metadata:', {
    //   userId,
    //   orderId: orderId || '',
    // });

    const paymentIntent = await stripeService.createPaymentIntent({
      amount,
      currency,
      metadata: {
        userId,
        orderId: orderId || "",
      },
    });

    //console.log('Payment intent created:', {
    //   id: paymentIntent.paymentIntentId,
    //   metadata: paymentIntent.metadata,
    // });

    res.status(200).json({
      status: "success",
      data: paymentIntent,
    });
  } catch (error) {
    next(error);
  }
};

// Confirm payment (gọi từ Frontend sau khi Stripe Element thanh toán xong)
// Đây là luồng fallback từ client - luồng chính nên là Stripe Webhook
// Cả 2 luồng đều phải xử lý idempotent để tránh double-update
const confirmPayment = async (req, res, next) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      throw new AppError("Payment intent ID is required", 400);
    }

    // Lấy trạng thái PaymentIntent từ Stripe
    const paymentIntent = await stripeService.confirmPaymentIntent(paymentIntentId);

    const orderId = paymentIntent.metadata?.orderId;

    // Nếu không có orderId trong metadata thì chỉ trả về trạng thái Stripe
    if (!orderId || paymentIntent.status !== "succeeded") {
      return res.status(200).json({
        status: "success",
        data: {
          paymentIntent: {
            id: paymentIntent.id,
            status: paymentIntent.status,
            amount:
              paymentIntent.currency === "vnd"
                ? paymentIntent.amount
                : paymentIntent.amount / 100,
            currency: paymentIntent.currency,
          },
        },
      });
    }

    // Mở transaction để cập nhật order với lock
    const transaction = await sequelize.transaction();

    try {
      // LOCK.UPDATE: tránh race condition với Stripe Webhook hoặc Cleanup Job
      const order = await Order.findOne({
        where: { id: orderId },
        lock: transaction.LOCK.UPDATE,
        transaction,
      });

      if (!order) {
        await transaction.rollback();
        throw new AppError("Không tìm thấy đơn hàng", 404);
      }

      // IDEMPOTENCY: nếu Stripe Webhook đã cập nhật paid trước rồi, bỏ qua
      if (order.paymentStatus === "paid") {
        await transaction.rollback();
        return res.status(200).json({
          status: "success",
          data: {
            paymentIntent: {
              id: paymentIntent.id,
              status: paymentIntent.status,
              amount:
                paymentIntent.currency === "vnd"
                  ? paymentIntent.amount
                  : paymentIntent.amount / 100,
              currency: paymentIntent.currency,
            },
          },
        });
      }

      // EDGE CASE: Cleanup job đã hủy đơn (quá 15 phút)
      // Cần admin xem xét refund thủ công
      if (order.status === "expired") {
        await transaction.rollback();
        console.error(
          `[confirmPayment] ⚠️ CẢNH BÁO: Đơn hàng ${order.number} đã EXPIRED` +
          ` nhưng Stripe báo thanh toán thành công! PaymentIntent: ${paymentIntent.id}.` +
          ` Cần xem xét refund thủ công.`
        );
        throw new AppError(
          "Đơn hàng đã hết hạn thanh toán. Vui lòng liên hệ hỗ trợ để được hoàn tiền.",
          400
        );
      }

      // Cập nhật order: paid + processing + xóa expiresAt
      await order.update(
        {
          status: "processing",
          paymentStatus: "paid",
          paymentTransactionId: paymentIntent.id,
          paymentProvider: "stripe",
          expiresAt: null, // Chốt kho vĩnh viễn
        },
        { transaction }
      );

      await transaction.commit();

      // Gửi email xác nhận thanh toán thành công (NGOÀI transaction)
      try {
        const user = await User.findByPk(order.userId);
        const orderItems = await OrderItem.findAll({ where: { orderId: order.id } });

        if (user?.email) {
          await emailService.sendOrderConfirmationEmail(user.email, {
            orderNumber: order.number,
            orderDate: order.createdAt,
            total: order.total,
            items: orderItems.map((item) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.subtotal,
            })),
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
        }
      } catch (emailError) {
        // Email thất bại không rollback - đơn đã paid thành công rồi
        console.error(
          `[confirmPayment] [email] Gửi email xác nhận thất bại cho đơn ${order.number}:`,
          emailError.message
        );
      }
    } catch (innerError) {
      // Nếu chưa commit (transaction vẫn mở) thì rollback
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      throw innerError;
    }

    return res.status(200).json({
      status: "success",
      data: {
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount:
            paymentIntent.currency === "vnd"
              ? paymentIntent.amount
              : paymentIntent.amount / 100,
          currency: paymentIntent.currency,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create customer
const createCustomer = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Check if user already has a Stripe customer ID
    if (user.stripeCustomerId) {
      const customer = await stripeService.getCustomer(user.stripeCustomerId);
      return res.status(200).json({
        status: "success",
        data: { customer },
      });
    }

    // Create new Stripe customer
    const customer = await stripeService.createCustomer({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      metadata: {
        userId: user.id,
      },
    });

    // Save Stripe customer ID to user
    await user.update({ stripeCustomerId: customer.id });

    res.status(201).json({
      status: "success",
      data: { customer },
    });
  } catch (error) {
    next(error);
  }
};

// Get payment methods
const getPaymentMethods = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user || !user.stripeCustomerId) {
      return res.status(200).json({
        status: "success",
        data: { paymentMethods: [] },
      });
    }

    const paymentMethods = await stripeService.getPaymentMethods(
      user.stripeCustomerId,
    );

    res.status(200).json({
      status: "success",
      data: { paymentMethods },
    });
  } catch (error) {
    next(error);
  }
};

// Create setup intent for saving payment methods
const createSetupIntent = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Create customer if doesn't exist
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripeService.createCustomer({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await user.update({ stripeCustomerId: customerId });
    }

    const setupIntent = await stripeService.createSetupIntent(customerId);

    res.status(200).json({
      status: "success",
      data: setupIntent,
    });
  } catch (error) {
    next(error);
  }
};

// Handle Stripe webhooks
// Route phải nhận raw body (Buffer) - không qua express.json()
// Xem payment.routes.js: express.raw({ type: 'application/json' })
const handleWebhook = async (req, res, next) => {
  const signature = req.headers["stripe-signature"];

  // Bước 1: Xác thực chữ ký Stripe webhook
  // Bảo đảm request thực sự đến từ Stripe, không phải ai giả mạo
  let event;
  try {
    event = await stripeService.handleWebhook(req.body, signature);
  } catch (error) {
    console.error("[Webhook] Xác thực chữ ký thất bại:", error.message);
    // Trả về 400 để Stripe biết webhook không hợp lệ
    return res.status(400).json({ error: error.message });
  }

  // Bước 2: Xử lý event theo loại
  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event.data.object);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentFailed(event.data.object);
        break;
      default:
        // Các event khác không cần xử lý
        console.log(`[Webhook] Bỏ qua event không xử lý: ${event.type}`);
    }

    // Trả về 200 cho Stripe biết đã nhận webhook thành công
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error(`[Webhook] Lỗi khi xử lý event ${event.type}:`, error.message);
    // Trả về 500 để Stripe retry webhook
    return res.status(500).json({ error: "Webhook processing failed" });
  }
};

// Xử lý khi Stripe thanh toán thành công
// Race Condition được ngăn chặn bằng LOCK.UPDATE + kiểm tra idempotent
const handlePaymentSucceeded = async (paymentIntent) => {
  const orderId = paymentIntent.metadata?.orderId;

  if (!orderId) {
    console.log("[Webhook] payment_intent.succeeded không có orderId trong metadata, bỏ qua");
    return;
  }

  const transaction = await sequelize.transaction();

  try {
    // Bước 1: Khóa bản ghi Order - ngăn cleanup job và webhook chạy đồng thời
    const order = await Order.findOne({
      where: { id: orderId },
      lock: transaction.LOCK.UPDATE,
      include: [{ association: "items" }],
      transaction,
    });

    if (!order) {
      await transaction.rollback();
      console.error(`[Webhook] Không tìm thấy đơn hàng ID: ${orderId}`);
      return;
    }

    // Bước 2: Kiểm tra Idempotent
    // Nếu đơn đã được đánh dấu paid trước đó (webhook gửi 2 lần), bỏ qua
    if (order.paymentStatus === "paid") {
      await transaction.rollback();
      console.log(`[Webhook] Đơn hàng ${order.number} đã paid, bỏ qua webhook trùng lặp`);
      return;
    }

    // Bước 3: Kiểm tra đơn đã bị expired (cleanup job đã hoàn kho rồi)
    // Đây là trường hợp khách nhập thẻ chậm hơn 15 phút
    if (order.status === "expired") {
      await transaction.rollback();
      // TODO: Cần xử lý refund thủ công hoặc tự động
      // RỦI RO: Stripe đã trừ tiền của khách nhưng đơn hàng đã hết hạn
      // Cần admin xem xét và ra quyết định: hoàn tiền cho khách hoặc tái kích hoạt đơn
      console.error(
        `[Webhook] ⚠️ CẢNH BÁO: Đơn hàng ${order.number} đã EXPIRED nhưng Stripe báo thanh toán thành công!` +
        ` PaymentIntent: ${paymentIntent.id}. Cần xem xét refund thủ công.`
      );
      return;
    }

    // Bước 4: Cập nhật trạng thái đơn hàng thành paid
    // Không cần trừ kho vì đã trừ ở createOrder
    // Chỉ cần xóa expiresAt để "chốt" vĩnh viễn
    await order.update(
      {
        status: "processing",
        paymentStatus: "paid",
        paymentTransactionId: paymentIntent.id,
        paymentProvider: "stripe",
        expiresAt: null, // Xóa mốc hết hạn - đơn đã được thanh toán vĩnh viễn
      },
      { transaction }
    );

    // Bước 5: Commit - tất cả thay đổi được ghi lại
    await transaction.commit();

    console.log(`[Webhook] ✅ Đơn hàng ${order.number} thanh toán thành công - PaymentIntent: ${paymentIntent.id}`);

    // Bước 6: Gửi email xác nhận thanh toán thành công (NẰM NGOÀI transaction)
    // Nếu email lỗi không ảnh hưởng đến trạng thái đơn đã commit
    try {
      const user = await User.findByPk(order.userId);
      const orderItems = await OrderItem.findAll({ where: { orderId: order.id } });

      if (user?.email) {
        await emailService.sendOrderConfirmationEmail(user.email, {
          orderNumber: order.number,
          orderDate: order.createdAt,
          total: order.total,
          items: orderItems.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal,
          })),
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
        console.log(`[Webhook] ✅ Đã gửi email xác nhận thanh toán cho ${user.email}`);
      }
    } catch (emailError) {
      console.error(
        `[Webhook] [email] Gửi email xác nhận thanh toán thất bại cho đơn ${order.number}:`,
        emailError.message
      );
    }
  } catch (error) {
    await transaction.rollback();
    console.error(`[Webhook] ❌ Lỗi khi xử lý payment_intent.succeeded cho đơn ${orderId}:`, error.message);
    throw error; // Ném lại để handleWebhook trả về 500 cho Stripe retry
  }
};

// Xử lý khi Stripe báo thanh toán thất bại
const handlePaymentFailed = async (paymentIntent) => {
  const orderId = paymentIntent.metadata?.orderId;

  if (!orderId) {
    return;
  }

  try {
    // Chỉ cập nhật paymentStatus, không thay đổi status hay kho
    // Đơn hàng vẫn giữ status 'pending' và expiresAt còn hiệu lực
    // Khách có thể thử thanh toán lại trong thời hạn còn lại
    await Order.update(
      {
        paymentStatus: "failed",
        paymentTransactionId: paymentIntent.id,
        paymentProvider: "stripe",
      },
      {
        where: {
          id: orderId,
          paymentStatus: "pending", // Chỉ cập nhật nếu chưa paid (an toàn)
        },
      }
    );
    console.log(`[Webhook] Đánh dấu thanh toán thất bại cho đơn ID: ${orderId}`);
  } catch (error) {
    console.error("[Webhook] Lỗi khi xử lý payment_intent.payment_failed:", error.message);
  }
};

// Create refund
const createRefund = async (req, res, next) => {
  try {
    const { orderId, amount, reason } = req.body;

    if (!orderId) {
      throw new AppError("Order ID is required", 400);
    }

    const order = await Order.findByPk(orderId);
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    if (!order.paymentTransactionId) {
      throw new AppError("No payment transaction found for this order", 400);
    }

    const refund = await stripeService.createRefund({
      paymentIntentId: order.paymentTransactionId,
      amount,
      reason,
    });

    // Update order payment status
    await order.update({
      paymentStatus: "refunded",
    });

    res.status(200).json({
      status: "success",
      data: { refund },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  createCustomer,
  getPaymentMethods,
  createSetupIntent,
  handleWebhook,
  createRefund,
};
