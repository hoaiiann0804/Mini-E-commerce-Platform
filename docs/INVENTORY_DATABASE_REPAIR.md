# Khắc phục migration Inventory — 2026-09-22

## Nguyên nhân và bằng chứng

API lịch sử/thống kê lỗi 42P01 vì bảng inventory_transactions chưa tồn tại. Migration trước bị hủy khi đồng bộ in_stock; vì toàn bộ migration trong transaction, CREATE TABLE cũng rollback. Log đã chạy bước tạo bảng không đồng nghĩa đã commit.

Database có 10.001 sản phẩm và 2.462 index trên products. Trong đó có 1.149 constraint UNIQUE sku và 1.299 constraint UNIQUE slug. Có 9.986 sản phẩm cần đồng bộ in_stock. Việc cập nhật diện rộng trên bảng có hàng nghìn index dư là điểm nghẽn; chạy lại đồng thời chỉ tạo thêm phiên chờ khóa.

Chưa xác định được thao tác lịch sử tạo index dư. Code server hiện dùng sequelize.sync() không có alter. Không quy kết nguyên nhân cho code hiện tại khi chưa có bằng chứng. Không thêm sync({ alter: true }) vào startup; thay đổi schema qua migration có phiên bản.

## Cách xử lý

1. Kiểm tra không còn migration đang chạy và sao lưu đầy đủ bằng pg_dump -Fc.
2. Backup local: `.local-backups/inventory-before-index-repair-20260922.dump` (được loại khỏi Git). pg_restore --list đọc archive thành công; chưa diễn tập restore toàn bộ.
3. Chạy dry-run `be/scripts/repair-product-unique-indexes.sql` với `apply=false`.
4. Script nhóm constraint theo cột, chế độ deferred và định nghĩa index. Chỉ chọn UNIQUE btree đơn cột sku/slug trùng; giữ bản cần thiết và index được FK tham chiếu. Không đụng primary key, index biểu thức/partial/include, replica identity hoặc clustered index. DROP CONSTRAINT dùng RESTRICT, không CASCADE; mọi thao tác cùng transaction, có lock timeout.
5. Áp dụng với `apply=true`: bỏ 2.446 constraint/index dư, còn 16 index. Cả sku và slug vẫn còn một constraint UNIQUE.
6. Chạy migration Inventory: hoàn tất trong 6,784 giây.

## Kết quả kiểm tra

- SequelizeMeta ghi nhận migration Inventory hoàn thành.
- public.inventory_transactions tồn tại; có 10.031 dòng OPENING.
- Số sản phẩm vẫn là 10.001.
- Không có sản phẩm lệch in_stock so với stock_quantity.
- Không có tổng kho sản phẩm lệch tổng các biến thể.
- Gọi trực tiếp controller trong container backend, đọc DB thật: getStock success (20 dòng), getTransactions success (20 dòng), getStats success (0 dòng).
- Stats trống là đúng: hiện chỉ có OPENING và thống kê chủ động loại OPENING. Đây chưa phải kiểm thử HTTP xác thực hoặc toàn bộ vòng đời đơn hàng.

## Tư duy xử lý

Tách lỗi bề mặt (API thiếu bảng) khỏi nguyên nhân khiến bảng chưa được tạo (migration rollback), rồi đo điểm nghẽn từng bước thay vì sửa SQL controller hoặc chạy migrate lặp lại. Giữ UNIQUE và dữ liệu nghiệp vụ, chỉ loại metadata dư đã đối chiếu. Backup trước, dry-run trước, transaction khi sửa, kiểm chứng dữ liệu sau commit.
