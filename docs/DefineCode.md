Keyword Record trong const [mappedAttributes, setMappedAttributes] = useState<Record<string, string>>({}) có ý nghĩa quan trọng:

Nó định nghĩa mappedAttributes là một đối tượng với key và value là chuỗi, phù hợp để lưu trữ thuộc tính sản phẩm (như { Color: "Red", Size: "M" }).
Trong TypeScript, Record đảm bảo an toàn kiểu dữ liệu, tránh lỗi khi xử lý thuộc tính sản phẩm, rất cần thiết trong ứng dụng thương mại điện tử.
Nó giúp code rõ ràng, dễ bảo trì, và hỗ trợ hiển thị tiêu đề động (qua SimpleDynamicTitle) một cách chính xác.

Nếu bạn muốn tối ưu code, có thể cân nhắc thay mappedAttributes bằng selectedAttributes để giảm dư thừa, nhưng Record<string, string> vẫn nên được giữ để đảm bảo kiểu dữ liệu cho trạng thái thuộc tính.
Hành động gợi ý:

Giữ Record<string, string> để đảm bảo an toàn kiểu.
Nếu bạn muốn kiểm tra vai trò của mappedAttributes, thêm log hoặc thử thay bằng selectedAttributes trong SimpleDynamicTitle và test kỹ.