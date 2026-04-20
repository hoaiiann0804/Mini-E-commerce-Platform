import React, { useEffect } from "react";
import { Modal, Form, Input, Button, Space, Alert, Divider } from "antd";
import {
  SaveOutlined,
  CloseOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

const { TextArea } = Input;

interface Attribute {
  id?: string;
  name: string;
  value: string;
}

interface AttributeModalProps {
  visible: boolean;
  onClose: () => void;
  attribute?: Attribute | null;
  onSave: (attribute: Attribute) => void;
}

const AttributeModal: React.FC<AttributeModalProps> = ({
  visible,
  onClose,
  attribute,
  onSave,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (attribute) {
      form.setFieldsValue({
        name: attribute.name || "",
        value: attribute.value || "",
      });
    } else {
      form.resetFields();
    }
  }, [attribute, form, visible]);

  const handleSubmit = (values: any) => {
    // Đảm bảo giá trị thuộc tính được xử lý đúng cách
    // Nếu người dùng nhập nhiều giá trị cách nhau bằng dấu phẩy, chúng ta vẫn giữ nguyên dạng chuỗi
    // vì backend sẽ xử lý việc chuyển đổi thành mảng
    const attributeData: Attribute = {
      id: attribute?.id,
      name: values.name.trim(),
      value: values.value.trim(),
    };

    // Lưu vào localStorage để debug
    const savedAttributes = JSON.parse(
      localStorage.getItem("debug_attributes") || "[]"
    );
    savedAttributes.push(attributeData);
    localStorage.setItem("debug_attributes", JSON.stringify(savedAttributes));

    //console.log('Saving attribute:', attributeData);
    onSave(attributeData);
    handleClose();
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={attribute ? "🏷️ Chỉnh sửa thuộc tính" : "🏷️ Thêm thuộc tính mới"}
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={700}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          name: "",
          value: "",
        }}
      >
        <Form.Item
          label="🏷️ Tên thuộc tính"
          name="name"
          rules={[{ required: true, message: "Vui lòng nhập tên thuộc tính" }]}
          tooltip="Tên mô tả loại thuộc tính (VD: Màu sắc, Size, Chất liệu)"
        >
          <Input placeholder="VD: Màu sắc, Chất liệu, Kích thước" />
        </Form.Item>

        <Form.Item
          label="📝 Giá trị thuộc tính"
          name="value"
          rules={[
            { required: true, message: "Vui lòng nhập giá trị thuộc tính" },
          ]}
          tooltip="Nhập các giá trị có thể có, cách nhau bởi dấu phẩy"
        >
          <TextArea
            rows={3}
            placeholder="VD: Đỏ, Xanh, Đen (cách nhau bởi dấu phẩy)"
          />
        </Form.Item>

        <Divider />

        {/* Hướng dẫn */}
        <Alert
          message="💡 Gợi ý tạo thuộc tính"
          description={
            <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
              <li>
                <strong>Tên thuộc tính:</strong> Nên rõ ràng, dễ hiểu (VD: "Màu
                sắc", "Kích thước")
              </li>
              <li>
                <strong>Giá trị:</strong> Liệt kê tất cả các tùy chọn có thể có
              </li>
              <li>
                <strong>Cách nhau bởi dấu phẩy:</strong> "Đỏ, Xanh, Đen" hoặc
                "S, M, L, XL"
              </li>
              <li>Thuộc tính này sẽ được sử dụng khi tạo biến thể sản phẩm</li>
            </ul>
          }
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          style={{ marginBottom: 16 }}
        />

        {/* Ví dụ minh họa */}
        <Alert
          message="📖 Ví dụ minh họa"
          description={
            <div style={{ marginBottom: 0 }}>
              <div>
                <strong>Tên:</strong> "Màu sắc" → <strong>Giá trị:</strong> "Đỏ,
                Xanh dương, Đen, Trắng"
              </div>
              <div>
                <strong>Tên:</strong> "Kích thước" → <strong>Giá trị:</strong>{" "}
                "S, M, L, XL, XXL"
              </div>
              <div>
                <strong>Tên:</strong> "Chất liệu" → <strong>Giá trị:</strong>{" "}
                "Cotton, Polyester, Linen"
              </div>
            </div>
          }
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />

        {/* Submit buttons */}
        <div style={{ textAlign: "right" }}>
          <Space>
            <Button onClick={handleClose} icon={<CloseOutlined />}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
              {attribute ? "Cập nhật thuộc tính" : "Thêm thuộc tính"}
            </Button>
          </Space>
        </div>
      </Form>
    </Modal>
  );
};

export default AttributeModal;
