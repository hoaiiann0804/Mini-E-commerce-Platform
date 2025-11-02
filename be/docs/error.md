Lỗi "column reference 'id' is ambiguous" xảy ra khi câu lệnh SQL của chúng ta tham chiếu đến cột 'id' mà không chỉ rõ nó thuộc bảng nào, trong khi có nhiều bảng trong câu truy vấn đều có cột 'id'.

Trong trường hợp này:

Nguyên nhân:
Chúng ta đang thực hiện JOIN giữa bảng 
Product
 và bảng categories (thông qua bảng trung gian)
Cả hai bảng đều có cột 
id
Khi viết id = '...', SQL không biết chúng ta đang muốn so sánh với cột 
id
 của bảng nào
Cách khắc phục:
javascript
// Trước khi sửa (gây lỗi)
.map((id, index) => `WHEN id = '${id}' THEN ${index}`)

// Sau khi sửa (đã fix)
.map((id, index) => `WHEN "Product"."id" = '${id}' THEN ${index}`)
Giải thích fix:
Thêm "Product"."id" thay vì chỉ 
id
 để chỉ rõ chúng ta muốn so sánh với cột 
id
 của bảng 
Product
Dấu ngoặc kép " được sử dụng để đảm bảo tên bảng và cột được hiểu chính xác, đặc biệt khi tên có chứa ký tự đặc biệt hoặc là từ khóa SQL
Lỗi này thường xảy ra khi làm việc với các câu truy vấn phức tạp có nhiều bảng. Cách tốt nhất là luôn chỉ rõ tên bảng khi tham chiếu đến các cột để tránh nhầm lẫn.