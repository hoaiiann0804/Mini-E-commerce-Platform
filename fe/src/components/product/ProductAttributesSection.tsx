import React from 'react';
import { Button, Row, Col, Typography, Table, Space, Alert } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { ProductAttribute } from '@/types/product.types';

const { Title, Text } = Typography;

interface ProductAttributesSectionProps {
  attributes: ProductAttribute[];
  onAddAttribute: () => void;
  onEditAttribute: (attribute: ProductAttribute) => void;
  onDeleteAttribute: (id: string) => void;
}

const ProductAttributesSection: React.FC<ProductAttributesSectionProps> = ({
  attributes,
  onAddAttribute,
  onEditAttribute,
  onDeleteAttribute,
}) => {
  const attributeColumns = [
    {
      title: 'Tên thuộc tính',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Giá trị',
      dataIndex: 'value',
      key: 'value',
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 120,
      render: (_: any, record: ProductAttribute) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEditAttribute(record)}
          />
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDeleteAttribute(record.id!)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <Title level={5}>
                Thuộc tính sản phẩm <Text type="danger">*</Text>
              </Title>
              <Text type="secondary">
                Thêm thuộc tính để mô tả chi tiết sản phẩm (màu sắc, kích thước,
                chất liệu...)
              </Text>
              <div style={{ marginTop: 8 }}>
                <Text type="warning">
                  <strong>Lưu ý:</strong> Thuộc tính sẽ được sử dụng để tạo biến
                  thể sản phẩm ở bước tiếp theo.
                </Text>
              </div>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onAddAttribute}
            >
              Thêm thuộc tính
            </Button>
          </div>
        </Col>
      </Row>

      {attributes.length === 0 && (
        <Alert
          message="Cần có ít nhất 1 thuộc tính"
          description="Vui lòng thêm ít nhất một thuộc tính cho sản phẩm trước khi tiếp tục."
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Table
        dataSource={attributes}
        columns={attributeColumns}
        rowKey="id"
        pagination={false}
        locale={{ emptyText: 'Chưa có thuộc tính nào' }}
      />
    </div>
  );
};

export default ProductAttributesSection;
