# Kế hoạch và triển khai tỷ giá Stripe

1. Lấy tỷ giá USD/VND tại backend bằng ExchangeRate-API Open Access.
2. Chốt báo giá từ tổng đơn trong database, lưu trước khi gọi Stripe.
3. Tái sử dụng PaymentIntent và hiển thị số tiền backend trả về.
4. Kiểm tra chuyển đổi, retry, quyền sở hữu và lỗi nhà cung cấp.

## Tư duy nghiệp vụ

- Đơn hàng lưu VND; PaymentIntent thu USD. `payment_quote` lưu tổng VND, tỷ giá,
  thời điểm nguồn cập nhật và số cent đã làm tròn. Không nhận giá do client gửi.
- Một đơn đã được báo giá giữ nguyên số tiền khi tải lại trang. Tỷ giá mới chỉ áp dụng
  cho đơn chưa có báo giá. Frontend hiển thị amount thực tế của PaymentIntent.
- Nguồn https://www.exchangerate-api.com/docs/free không cần API key, cập nhật hàng ngày,
  yêu cầu attribution (đã thêm vào form). Kết quả không đảm bảo giống Wise.

## Tư duy giải quyết vấn đề

- Cache trong mỗi tiến trình tối đa một giờ; gộp các request đồng thời. Timeout 8 giây.
- Từ chối nguồn sai cấu trúc, tỷ giá không dương hoặc dữ liệu quá 48 giờ.
  Không dùng tỷ giá cố định dự phòng; UI có nút thử lại.
- Khóa dòng đơn để chống request đồng thời. Commit báo giá trước khi gọi Stripe;
  idempotency key theo mã đơn giúp retry cùng tham số nếu mất response mạng.
- Lưu paymentTransactionId để lần sau lấy lại intent; chỉ đơn pending chưa thanh toán,
  chưa hết hạn và thuộc người dùng hiện tại mới được tạo/tải form thanh toán.

## Áp dụng

Chạy migration trước khi khởi động backend mới, tại thư mục `be`:

```sh
npx sequelize-cli db:migrate
```

Migration mới: `src/migrations/20260920080000-add-order-payment-quote.js`.
Backend cần Node 18+ và kết nối HTTPS đến `open.er-api.com` và Stripe.

## Kiểm tra

```sh
# Trong be
node node_modules/jest/bin/jest.js --runInBand test/payment-quote.test.js
# Trong fe
node node_modules/typescript/bin/tsc --noEmit
```

Trong Stripe test mode, tạo đơn mới; kiểm tra response create-payment-intent chứa
amount, currency, exchangeRate. Nút thanh toán phải khớp amount và PaymentIntent
phải có amount bằng số USD nhân 100. Tải lại cùng đơn phải giữ nguyên intent/tỷ giá.
Các intent cũ chưa được liên kết với đơn bởi phiên bản trước không thể tự nhận diện
qua paymentTransactionId; khi nghiệm thu nên tạo đơn mới.
