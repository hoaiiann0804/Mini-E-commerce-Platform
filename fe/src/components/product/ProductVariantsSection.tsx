import React from 'react';
import { Button, Row, Col, Typography, Table, Space, Tag, Alert } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { ProductVariant } from '@/types/product.types';

const { Title, Text } = Typography;

interface ProductVariantsSectionProps {
  variants: ProductVariant[];
  onAddVariant: () => void;
  onEditVariant: (variant: ProductVariant) => void;
  onDeleteVariant: (id: string) => void;
}

const ProductVariantsSection: React.FC<ProductVariantsSectionProps> = ({
  variants,
  onAddVariant,
  onEditVariant,
  onDeleteVariant,
}) => {
  const variantColumns = [
    {
      title: 'Tên biến thể',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Thuộc tính',
      dataIndex: 'attributes',
      key: 'attributes',
      render: (attributes: Record<string, string>) => {
        if (!attributes || Object.keys(attributes).length === 0) {
          return <Text type="secondary">Không có</Text>;
        }
        return (
          <div>
            {Object.entries(attributes).map(([key, value]) => (
              <Tag key={key} color="blue">
                {key}: {value}
              </Tag>
            ))}
          </div>
        );
      },
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `${price.toLocaleString()}đ`,
    },
    {
      title: 'Tồn kho',
      dataIndex: 'stock',
      key: 'stock',
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 120,
      render: (_: any, record: ProductVariant) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEditVariant(record)}
          />
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDeleteVariant(record.id!)}
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
                Biến thể sản phẩm <Text type="danger">*</Text>
              </Title>
              <Text type="secondary">
                Tạo các biến thể khác nhau của sản phẩm (giá, kích thước, màu
                sắc...)
              </Text>
              <div style={{ marginTop: 8 }}>
                <Text type="warning">
                  <strong>Lưu ý:</strong> Giá và số lượng tồn kho của sản phẩm
                  sẽ phụ thuộc vào các biến thể.
                </Text>
              </div>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onAddVariant}
            >
              Thêm biến thể
            </Button>
          </div>
        </Col>
      </Row>

      {variants.length === 0 && (
        <Alert
          message="Cần có ít nhất 1 biến thể"
          description="Vui lòng thêm ít nhất một biến thể cho sản phẩm trước khi tiếp tục."
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Table
        dataSource={variants}
        columns={variantColumns}
        rowKey="id"
        pagination={false}
        locale={{ emptyText: 'Chưa có biến thể nào' }}
      />
    </div>
  );
};

export default ProductVariantsSection;
