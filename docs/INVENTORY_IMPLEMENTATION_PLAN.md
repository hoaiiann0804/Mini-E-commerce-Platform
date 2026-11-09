# Inventory Management & Audit Log

## Quyết định nghiệp vụ

Phiên bản này quản lý **số lượng khả dụng**, giữ hành vi trừ kho khi tạo đơn pending. Chưa tách on-hand/reserved. OUT vì thế không phải chứng từ giao hàng vật lý. Thanh toán thành công không trừ lần nữa.

- IN: nhập hàng, số dương, bắt buộc đơn giá nhập VND và lý do.
- OUT: số âm khi tạo đơn, liên kết đơn và dòng hàng.
- RELEASE: số dương khi hủy/hết hạn, khác khách trả hàng.
- RETURN: nhận lại hàng bán được từ đơn delivered, hỗ trợ từng phần, không vượt lượng mua trừ lượng đã trả. Refund tiền là nghiệp vụ riêng.
- ADJUSTMENT: chênh lệch có dấu khi kiểm kê/hỏng/thất thoát, lý do bắt buộc.
- OPENING: số dư ban đầu, không suy diễn ngày nhập hoặc giá vốn lịch sử.

Sản phẩm đơn quản lý trực tiếp; sản phẩm có biến thể quản lý từng variant ID. Tổng sản phẩm cha chỉ để hiển thị. Ngưỡng cảnh báo <= 5 áp dụng từng đơn vị bán.

## Kiến trúc và tính toàn vẹn

Service khóa đơn trước, sau đó khóa sản phẩm cha rồi biến thể theo thứ tự ổn định. Tồn kho, audit, trạng thái đơn và coupon cùng transaction. PostgreSQL trigger lấy OLD/NEW để số trước/sau chính xác và dùng transaction-local context cho actor, lý do, nguồn, đơn giá, chứng từ. Thiếu context khi thay đổi kho sẽ bị từ chối. Lịch sử append-only, ngăn sửa/xóa và xóa hàng hóa đã có lịch sử.

Transaction context tự hết khi commit/rollback, không rò rỉ người thực hiện sang connection pool. Catalog được bao transaction để mọi thay đổi có actor. Cập nhật biến thể theo ID ổn định; biến thể bỏ khỏi form sẽ ngừng bán thay vì xóa. Không tự xóa stock của hàng ngừng bán.

Idempotency cho thao tác Admin: request key duy nhất và fingerprint nội dung; cùng key cùng nội dung trả kết quả cũ, khác nội dung trả conflict. Hủy/hết hạn khóa và kiểm tra lại trạng thái. Không cho mở lại đơn đã hoàn kho.

## Các hạng mục triển khai

1. Migration ledger, ràng buộc, baseline, audit trigger; model và service.
2. Tích hợp checkout, khách/Admin hủy, job hết hạn và các API catalog; giữ ID variant.
3. API Admin: danh sách kho/cảnh báo, giao dịch nhập/điều chỉnh/trả, lịch sử và thống kê.
4. UI Inventory: tìm SKU, low stock, nhập/điều chỉnh/trả, lịch sử, biểu đồ; menu và cache refresh.
5. Kiểm tra syntax/build, test nghiệp vụ và integration PostgreSQL khi môi trường cho phép; cập nhật kết quả thực tế.

## Tiêu chí nghiệm thu

- Hai request tranh món cuối: chỉ một thành công; không âm kho.
- Retry nhập hàng/hủy/hết hạn không cộng hai lần.
- Audit insert lỗi thì thay đổi kho rollback.
- Sửa metadata không làm mất variant ID hoặc ghi đè số kho từ form cũ.
- Nhận trả từng phần đúng giới hạn; refund không tự hoàn kho.
- Tổng kho cha bằng tổng variants; mỗi biến động chỉ một ledger row.
- Người dùng thường không được sửa kho; created_by lấy từ token.
- Lịch sử có thể đối chiếu số dư đầu kỳ + tổng biến động = tồn hiện tại.

## Vận hành

Migration cần chạy trong maintenance window: baseline phản ánh thời điểm bật audit. Không chạy reset DB. Chưa tính FIFO/bình quân giá vốn, đa kho, nhà cung cấp hoặc kế toán lợi nhuận. Unit cost chỉ là giá nhập ghi nhận của giao dịch.
