import React from 'react';
import { Form, Select, Input, Row, Col, Alert } from 'antd';
import { Category } from '@/types/category.types';

const { TextArea } = Input;
const { Option } = Select;

interface ProductCategoryFormProps {
  categories: Category[];
  isLoading: boolean;
}

const ProductCategoryForm: React.FC<ProductCategoryFormProps> = ({
  categories,
  isLoading,
}) => {
  return (
    <Row gutter={[24, 16]}>
      <Col span={24}>
        <Form.Item
          name="categoryIds"
          label="Danh mục"
          rules={[
            {
              required: true,
              message: 'Vui lòng chọn ít nhất một danh mục!',
            },
          ]}
        >
          <Select
            mode="multiple"
            placeholder="Chọn danh mục sản phẩm"
            loading={isLoading}
            showSearch
            optionFilterProp="children"
          >
            {categories.map((category) => (
              <Option key={category.id} value={category.id}>
                {category.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Col>

      <Col span={24}>
        <Form.Item name="searchKeywords" label="Từ khóa tìm kiếm">
          <TextArea
            rows={2}
            placeholder="Nhập các từ khóa liên quan, cách nhau bằng dấu phẩy"
            showCount
            maxLength={500}
          />
        </Form.Item>
      </Col>

      <Col span={24}>
        <Alert
          message="Lưu ý danh mục"
          description="Chọn danh mục phù hợp để khách hàng dễ dàng tìm thấy sản phẩm. Có thể chọn nhiều danh mục."
          type="info"
          showIcon
        />
      </Col>
    </Row>
  );
};

export default ProductCategoryForm;
