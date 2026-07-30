"use strict";

/**
 * Order Cleanup Job - Tự động hoàn kho cho đơn hàng quá hạn thanh toán
 *
 * Mục đích:
 * - Tìm các đơn hàng pending đã quá 15 phút mà chưa thanh toán Stripe
 * - Cộng lại tồn kho cho Product / ProductVariant tương ứng
 * - Đổi trạng thái đơn hàng thành 'expired'
 *
 * Race Condition đã được ngăn chặn:
 * - Mỗi đơn hàng được khóa bằng `transaction.LOCK.UPDATE` trước khi xử lý
 * - Sau khi lock, kiểm tra lại paymentStatus và status để bảo đảm idempotent
 * - Nếu Stripe Webhook đã cập nhật order thành 'paid' trước khi cleanup job chạy,
 *   cleanup job sẽ bỏ qua đơn đó và KHÔNG hoàn kho
 */

const { Op } = require("sequelize");
const {
  Order,
  OrderItem,
  Product,
  ProductVariant,
  sequelize,
} = require("../models");
const emailService = require("../shared/services/email/emailService");

/**
 * Tìm và xử lý các đơn hàng hết hạn thanh toán
 */
const cleanupExpiredOrders = async () => {
  let expiredOrders = [];

  try {
    // Tìm tất cả đơn hàng thỏa mãn điều kiện hết hạn
    // Không lock ở bước này để tránh giữ lock quá lâu trên nhiều records
    expiredOrders = await Order.findAll({
      where: {
        paymentStatus: "pending",
        status: "pending",
        expiresAt: {
          [Op.lte]: new Date(), // expiresAt <= thời gian hiện tại
          [Op.ne]: null,        // Chỉ lấy đơn có expiresAt (tránh lock paid orders)
        },
      },
      include: [
        {
          model: OrderItem,
          as: "items",
        },
      ],
    });

    if (expiredOrders.length === 0) {
      return; // Không có đơn hàng nào cần xử lý
    }

    console.log(
      `[OrderCleanup] Tìm thấy ${expiredOrders.length} đơn hàng cần xử lý`
    );
  } catch (error) {
    console.error("[OrderCleanup] Lỗi khi truy vấn đơn hàng hết hạn:", error.message);
    return;
  }

  // Xử lý từng đơn hàng một để kiểm soát lỗi riêng lẻ
  for (const expiredOrder of expiredOrders) {
    await processExpiredOrder(expiredOrder);
  }
};

/**
 * Xử lý một đơn hàng hết hạn - đây là nơi race condition được ngăn chặn
 * bằng cách dùng pessimistic lock (LOCK.UPDATE) và kiểm tra lại sau khi lock
 */
const processExpiredOrder = async (expiredOrder) => {
  const transaction = await sequelize.transaction();

  try {
    // Bước 1: Khóa bản ghi Order để tránh race condition với Stripe Webhook
    // Nếu Webhook vừa cập nhật order thành 'paid' thì lock sẽ đợi Webhook xong
    const lockedOrder = await Order.findOne({
      where: { id: expiredOrder.id },
      lock: transaction.LOCK.UPDATE,
      transaction,
    });

    if (!lockedOrder) {
      // Đơn hàng không tồn tại (hiếm xảy ra)
      await transaction.rollback();
      return;
    }

    // Bước 2: Kiểm tra lại sau khi lock - đây là bước quan trọng nhất
    // Bảo đảm cleanup job chỉ xử lý đơn vẫn còn pending và đã thực sự hết hạn
    // Nếu Stripe Webhook đã cập nhật thành 'paid' trong khoảng thời gian chờ lock,
    // điều kiện này sẽ fail và cleanup job bỏ qua đơn này - kho KHÔNG bị hoàn
    if (
      lockedOrder.paymentStatus !== "pending" ||
      lockedOrder.status !== "pending" ||
      !lockedOrder.expiresAt ||
      new Date(lockedOrder.expiresAt) > new Date()
    ) {
      console.log(
        `[OrderCleanup] Bỏ qua đơn ${lockedOrder.number} - không còn điều kiện hết hạn` +
        ` (paymentStatus=${lockedOrder.paymentStatus}, status=${lockedOrder.status})`
      );
      await transaction.rollback();
      return;
    }

    // Bước 3: Lấy danh sách items để hoàn kho
    const orderItems = await OrderItem.findAll({
      where: { orderId: lockedOrder.id },
      transaction,
    });

    // Bước 4: Hoàn kho cho từng sản phẩm/variant
    for (const item of orderItems) {
      if (item.variantId) {
        // Hoàn kho cho ProductVariant
        await ProductVariant.increment("stockQuantity", {
          by: item.quantity,
          where: { id: item.variantId },
          transaction,
        });
      } else if (item.productId) {
        // Hoàn kho cho Product (không có variant)
        await Product.increment("stockQuantity", {
          by: item.quantity,
          where: { id: item.productId },
          transaction,
        });
      }
    }

    // Bước 5: Đổi trạng thái đơn hàng thành 'expired'
    // expiresAt giữ nguyên để biết thời điểm hết hạn (audit trail)
    await lockedOrder.update(
      {
        status: "expired",
      },
      { transaction }
    );

    // Bước 6: Commit - tất cả thay đổi kho và trạng thái đơn được ghi lại cùng lúc
    await transaction.commit();

    console.log(
      `[OrderCleanup] ✅ Đã xử lý đơn hàng hết hạn: ${lockedOrder.number}` +
      ` (${orderItems.length} sản phẩm được hoàn kho)`
    );

    // Bước 7: Gửi email thông báo đơn hàng hết hạn (NẰM NGOÀI transaction)
    // Nếu email lỗi không ảnh hưởng đến việc hoàn kho đã commit
    try {
      await emailService.sendOrderCancellationEmail(
        // Cần load user email - lấy từ order relationship nếu có
        // Tạm thời skip nếu chưa có User eager loaded
        lockedOrder.dataValues?.user?.email || null,
        {
          orderNumber: lockedOrder.number,
          orderDate: lockedOrder.createdAt,
        }
      );
    } catch (emailError) {
      console.error(
        `[OrderCleanup] [email] Gửi email hết hạn thất bại cho đơn ${lockedOrder.number}:`,
        emailError.message
      );
    }
  } catch (error) {
    await transaction.rollback();
    console.error(
      `[OrderCleanup] ❌ Lỗi khi xử lý đơn ${expiredOrder.number}:`,
      error.message
    );
  }
};

/**
 * Khởi động cleanup job
 * Chạy định kỳ mỗi 1 phút để kiểm tra đơn hàng hết hạn
 * Được gọi từ server.js khi ứng dụng khởi động
 */
const startOrderCleanupJob = () => {
  const INTERVAL_MS = 60 * 1000; // 1 phút

  console.log(
    `[OrderCleanup] 🚀 Khởi động job kiểm tra đơn hàng hết hạn (mỗi ${INTERVAL_MS / 1000}s)`
  );

  // Chạy ngay lần đầu khi khởi động
  cleanupExpiredOrders();

  // Sau đó chạy định kỳ
  const intervalId = setInterval(cleanupExpiredOrders, INTERVAL_MS);

  // Trả về intervalId để có thể dừng job khi cần (graceful shutdown)
  return intervalId;
};

module.exports = { startOrderCleanupJob, cleanupExpiredOrders };
