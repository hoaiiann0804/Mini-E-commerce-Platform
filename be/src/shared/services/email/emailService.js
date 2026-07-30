const nodemailer = require("nodemailer");
const { Resend } = require("resend");

const getFrontendBaseUrl = () => {
  const frontendUrl =
    process.env.FRONTEND_URL ||
    "https://mini-e-commerce-platform-eight.vercel.app";

  return frontendUrl.replace(/\/+$/, "");
};

// Check email configuration
const emailServiceType = (process.env.EMAIL_SERVICE || "resend").toLowerCase();

const missingEmailEnv = ["EMAIL_FROM", "EMAIL_FROM_NAME"].filter(
  (key) => !process.env[key],
);
if (missingEmailEnv.length > 0) {
  throw new Error(`Missing ${missingEmailEnv.join(", ")}`);
}

let resend = null;

if (emailServiceType === "smtp") {
  const missingSmtpEnv = ["EMAIL_HOST", "EMAIL_PORT"].filter(
    (key) => !process.env[key],
  );
  if (missingSmtpEnv.length > 0) {
    throw new Error(`Missing SMTP configuration: ${missingSmtpEnv.join(", ")}`);
  }
} else {
  // Default: resend
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY");
  }
  resend = new Resend(process.env.RESEND_API_KEY);
}

// Create transporter for SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === "true",
    auth: process.env.EMAIL_USERNAME
      ? {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        }
      : undefined,
    tls: {
      rejectUnauthorized: process.env.EMAIL_IGNORE_TLS === "true" ? false : undefined,
    },
  });
};

// Send email
const sendEmail = async (options) => {
  try {
    if (!options.email) {
      throw new Error("Missing email recipient");
    }

    if (!options.subject) {
      throw new Error("Missing email subject");
    }

    if (!options.html) {
      throw new Error("Missing email html");
    }

    if (emailServiceType === "smtp") {
      const transporter = createTransporter();
      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
        to: options.email,
        subject: options.subject,
        html: options.html,
      };
      const info = await transporter.sendMail(mailOptions);
      return info;
    }

    const result = await resend.emails.send({
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
      to: options.email,
      subject: options.subject,
      html: options.html,
    });

    const error = result?.error;
    if (error) {
      const message =
        typeof error === "string"
          ? error
          : error.message || JSON.stringify(error);
      const err = new Error(`Resend email failed: ${message}`);
      err.cause = error;
      throw err;
    }

    // Success shape can be { data, error } or just a data-like object depending on SDK/version
    return result?.data ?? result;
  } catch (error) {
    console.error("SEND EMAIL ERROR:", error);
    throw error;
  }
};

// Send verification email
const sendVerificationEmail = async (email, token, type = "register") => {
  const frontendBaseUrl = getFrontendBaseUrl();

  const verificationUrl = `${frontendBaseUrl}/verify-email/${encodeURIComponent(
    token,
  )}`;

  const introText =
    type === "resend"
      ? "Bạn vừa yêu cầu gửi lại email xác thực tài khoản."
      : "Cảm ơn bạn đã đăng ký tài khoản.";

  await sendEmail({
    email,
    subject: "Xác thực tài khoản của bạn",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Xác thực tài khoản</h2>

        <p>${introText}</p>

        <p>Vui lòng nhấp vào nút bên dưới để xác thực email của bạn:</p>

        <p>
          <a href="${verificationUrl}" 
             style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">
            Xác thực email
          </a>
        </p>

        <p>Liên kết này sẽ hết hạn sau <strong>30 phút</strong>.</p>

        <p>Nếu nút không hoạt động, hãy sao chép liên kết sau và dán vào trình duyệt:</p>

        <p style="word-break: break-all;">
          ${verificationUrl}
        </p>

        <p>Nếu liên kết đã hết hạn, bạn có thể yêu cầu gửi lại email xác thực trên website.</p>

        <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
      </div>
    `,
  });
};

// Send reset password email
const sendResetPasswordEmail = async (email, token) => {
  const frontendBaseUrl = getFrontendBaseUrl();
  const resetUrl = `${frontendBaseUrl}/reset-password?token=${encodeURIComponent(
    token,
  )}`;

  await sendEmail({
    email,
    subject: "Đặt lại mật khẩu của bạn",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Đặt lại mật khẩu</h2>
        <p>Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng nhấp vào liên kết bên dưới để đặt lại mật khẩu của bạn:</p>
        <p>
          <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">
            Đặt lại mật khẩu
          </a>
        </p>
        <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
        <p>Liên kết này sẽ hết hạn sau <strong>15 phút</strong>.</p>
      </div>
    `,
  });
};

// Send order pending payment email (gửi ngay sau khi tạo đơn, trước khi Stripe thanh toán)
// Mục đích: thông báo khách có 15 phút để hoàn tất thanh toán, nếu không đơn sẽ tự động hủy
const sendOrderPendingPaymentEmail = async (email, order) => {
  const {
    orderNumber,
    orderDate,
    total,
    items,
    shippingAddress,
    expiresAt,
  } = order;

  const expiresAtText = expiresAt
    ? new Date(expiresAt).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "15 phút";

  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${Number(item.price).toLocaleString("vi-VN")}đ</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${Number(item.subtotal).toLocaleString("vi-VN")}đ</td>
      </tr>
    `
    )
    .join("");

  await sendEmail({
    email,
    subject: `Đơn hàng #${orderNumber} - Chờ thanh toán`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e67e22;">Đơn hàng đang chờ thanh toán</h2>
        <p>Cảm ơn bạn đã đặt hàng. Chúng tôi đã giữ chỗ sản phẩm cho bạn.</p>

        <div style="background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #856404;">
            ⏱️ <strong>Vui lòng hoàn tất thanh toán trước ${expiresAtText}.</strong>
            Nếu không, đơn hàng sẽ tự động bị hủy và sản phẩm sẽ được trả lại kho.
          </p>
        </div>

        <div style="background-color: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p><strong>Mã đơn hàng:</strong> #${orderNumber}</p>
          <p><strong>Ngày đặt hàng:</strong> ${new Date(orderDate).toLocaleDateString("vi-VN")}</p>
          <p><strong>Tổng tiền:</strong> ${Number(total).toLocaleString("vi-VN")}đ</p>
        </div>

        <h3>Chi tiết đơn hàng</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="padding: 10px; text-align: left;">Sản phẩm</th>
              <th style="padding: 10px; text-align: center;">Số lượng</th>
              <th style="padding: 10px; text-align: right;">Đơn giá</th>
              <th style="padding: 10px; text-align: right;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding: 10px; text-align: right;"><strong>Tổng cộng:</strong></td>
              <td style="padding: 10px; text-align: right;"><strong>${Number(total).toLocaleString("vi-VN")}đ</strong></td>
            </tr>
          </tfoot>
        </table>

        <h3>Địa chỉ giao hàng</h3>
        <div style="background-color: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p>${shippingAddress.name}</p>
          <p>${shippingAddress.address1}</p>
          ${shippingAddress.address2 ? `<p>${shippingAddress.address2}</p>` : ""}
          <p>${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}</p>
          <p>${shippingAddress.country}</p>
        </div>

        <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
      </div>
    `,
  });
};

// Send order confirmation email (chỉ gửi khi Stripe thanh toán thành công)
// paymentStatus: 'paid', status: 'processing'
const sendOrderConfirmationEmail = async (email, order) => {
  // console.log("CALL sendOrderConfirmationEmail");

  // console.log("EMAIL:", email);
  // console.log("ORDER:", JSON.stringify(order, null, 2));
  // console.log("ITEMS:", order?.items);
  // console.log("SHIPPING:", order?.shippingAddress);
  const { orderNumber, orderDate, total, items, shippingAddress } = order;
  // Format items HTML
  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.price.toLocaleString("vi-VN")}đ</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.subtotal.toLocaleString("vi-VN")}đ</td>
      </tr>
    `,
    )
    .join("");

  await sendEmail({
    email,
    subject: `Xác nhận đơn hàng #${orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Xác nhận đơn hàng</h2>
        <p>Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đã được xác nhận.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p><strong>Mã đơn hàng:</strong> #${orderNumber}</p>
          <p><strong>Ngày đặt hàng:</strong> ${new Date(orderDate).toLocaleDateString("vi-VN")}</p>
          <p><strong>Tổng tiền:</strong> ${total.toLocaleString("vi-VN")}đ</p>
        </div>
        
        <h3>Chi tiết đơn hàng</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="padding: 10px; text-align: left;">Sản phẩm</th>
              <th style="padding: 10px; text-align: center;">Số lượng</th>
              <th style="padding: 10px; text-align: right;">Đơn giá</th>
              <th style="padding: 10px; text-align: right;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding: 10px; text-align: right;"><strong>Tổng cộng:</strong></td>
              <td style="padding: 10px; text-align: right;"><strong>${total.toLocaleString("vi-VN")}đ</strong></td>
            </tr>
          </tfoot>
        </table>
        
        <h3>Địa chỉ giao hàng</h3>
        <div style="background-color: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p>${shippingAddress.name}</p>
          <p>${shippingAddress.address1}</p>
          ${shippingAddress.address2 ? `<p>${shippingAddress.address2}</p>` : ""}
          <p>${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}</p>
          <p>${shippingAddress.country}</p>
        </div>
        
        <p>Chúng tôi sẽ thông báo cho bạn khi đơn hàng được giao.</p>
        <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
      </div>
    `,
  });
};

// Send order status update email
const sendOrderStatusUpdateEmail = async (email, order) => {
  const { orderNumber, orderDate, status } = order;

  // Map status to Vietnamese
  const statusMap = {
    pending: "Chờ xử lý",
    processing: "Đang xử lý",
    shipped: "Đã giao cho đơn vị vận chuyển",
    delivered: "Đã giao hàng",
    cancelled: "Đã hủy",
    completed: "Hoàn thành",
    expired: "Đã hết hạn thanh toán",
  };

  const statusText = statusMap[status] || status;

  await sendEmail({
    email,
    subject: `Cập nhật trạng thái đơn hàng #${orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Cập nhật trạng thái đơn hàng</h2>
        <p>Đơn hàng của bạn đã được cập nhật.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p><strong>Mã đơn hàng:</strong> #${orderNumber}</p>
          <p><strong>Ngày đặt hàng:</strong> ${new Date(orderDate).toLocaleDateString("vi-VN")}</p>
          <p><strong>Trạng thái mới:</strong> ${statusText}</p>
        </div>
        
        <p>Bạn có thể theo dõi đơn hàng của mình trong tài khoản của bạn.</p>
        <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
      </div>
    `,
  });
};

// Send order cancellation email
const sendOrderCancellationEmail = async (email, order) => {
  const { orderNumber, orderDate } = order;

  await sendEmail({
    email,
    subject: `Đơn hàng #${orderNumber} đã bị hủy`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Đơn hàng đã bị hủy</h2>
        <p>Đơn hàng của bạn đã bị hủy theo yêu cầu của bạn.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p><strong>Mã đơn hàng:</strong> #${orderNumber}</p>
          <p><strong>Ngày đặt hàng:</strong> ${new Date(orderDate).toLocaleDateString("vi-VN")}</p>
        </div>
        
        <p>Nếu bạn đã thanh toán cho đơn hàng này, khoản tiền sẽ được hoàn lại trong vòng 5-7 ngày làm việc.</p>
        <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
      </div>
    `,
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendResetPasswordEmail,
  sendOrderPendingPaymentEmail,  // Gửi sau khi tạo đơn pending (trước Stripe)
  sendOrderConfirmationEmail,    // Gửi sau khi Stripe thanh toán thành công
  sendOrderStatusUpdateEmail,
  sendOrderCancellationEmail,
};
