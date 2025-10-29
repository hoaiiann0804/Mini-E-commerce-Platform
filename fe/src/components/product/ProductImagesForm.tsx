import React from "react";
import { Form, Input, Row, Col, Alert } from "antd";
import type { FormInstance } from "antd/es/form";
import ImageUploader from "../upload/ImageUploader";
type Props = { form?: FormInstance };

const ProductImagesForm: React.FC<Props> = ({ form }) => {
  return (
    <Row gutter={[24, 16]}>
      <Col span={24}>
        <Form.Item label="Tải ảnh" tooltip="Tối đa 10 ảnh, 10MB mỗi ảnh">
          <ImageUploader
            productId={form?.getFieldValue("id")}
            onUrlsChange={(urls) => {
              if (!form) return;
              const current: string = form.getFieldValue("images") || "";
              const merged = Array.from(
                new Set([...(current ? current.split("\n") : []), ...urls])
              );
              form.setFieldsValue({ images: merged.join("\n") });
            }}
          />
        </Form.Item>
        <Form.Item name="images" label="Hoặc dán URL (mỗi dòng một URL)">
          <Input.TextArea rows={6} />
        </Form.Item>
      </Col>

      <Col span={24}>
        <Form.Item name="thumbnail" label="Ảnh đại diện">
          <Input placeholder="Nhập URL ảnh đại diện" />
        </Form.Item>
      </Col>

      <Col span={24}>
        <Alert
          message="Hướng dẫn hình ảnh"
          description={
            <div>
              <p>
                <strong>📝 Cách nhập:</strong> Mỗi URL hình ảnh trên một dòng
                riêng biệt
              </p>
              <p>
                <strong>🖼️ Yêu cầu:</strong> Tỷ lệ 1:1 hoặc 4:3, tối thiểu
                400x400px
              </p>
              <p>
                <strong>📁 Định dạng:</strong> JPG, PNG, WebP
              </p>
              <p>
                <strong>🎯 Ảnh đại diện:</strong> Hiển thị trong danh sách sản
                phẩm
              </p>
              <p>
                <strong>🔗 Backend:</strong> Sử dụng
                http://localhost:8888/uploads cho local images (KHÔNG dùng
                /api/uploads)
              </p>
            </div>
          }
          type="info"
          showIcon
        />
      </Col>
    </Row>
  );
};

export default ProductImagesForm;
