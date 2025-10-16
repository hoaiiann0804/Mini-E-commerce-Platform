const nodemailer = require("nodemailer");

// Create transporter
const createTransporter = () => {
  // For development, use a test account
  if (process.env.NODE_ENV === "development") {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // For production, use configured email service
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Send email
const sendEmail = async (options) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  await transporter.sendMail(mailOptions);
};

// Send verification email
const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;

  await sendEmail({
    email,
    subject: "Xác thực tài khoản của bạn",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Xác thực tài khoản</h2>
        <p>Cảm ơn bạn đã đăng ký tài khoản. Vui lòng nhấp vào liên kết bên dưới để xác thực email của bạn:</p>
        <p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">
            Xác thực email
          </a>
        </p>
        <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
        <p>Liên kết này sẽ hết hạn sau 24 giờ.</p>
      </div>
    `,
  });
};

// Send reset password email
const sendResetPasswordEmail = async (email, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

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
        <p>Liên kết này sẽ hết hạn sau 1 giờ.</p>
      </div>
    `,
  });
};

// Send order confirmation email
const sendOrderConfirmationEmail = async (email, order) => {
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
    `
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
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendOrderCancellationEmail,
};
