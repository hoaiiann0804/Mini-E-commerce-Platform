import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Row,
  Col,
  Space,
  Typography,
  Divider,
  Select,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface Specification {
  id: string;
  name: string;
  value: string;
  category?: string;
}

interface ProductSpecificationsFormProps {
  initialSpecifications?: Specification[];
}

const ProductSpecificationsForm: React.FC<ProductSpecificationsFormProps> = ({
  initialSpecifications = [],
}) => {
  const [specifications, setSpecifications] = useState<Specification[]>(
    initialSpecifications
  );
  const form = Form.useFormInstance();

  //console.log(initialSpecifications);

  // Load initial specifications when prop changes
  useEffect(() => {
    if (initialSpecifications && initialSpecifications.length > 0) {
      // //console.log(
      //   'ProductSpecificationsForm - Loading initial specifications:',
      //   initialSpecifications
      // );
      // Ensure each spec has a unique ID
      const specsWithIds = initialSpecifications.map((spec, index) => ({
        ...spec,
        id: spec.id || `spec-${Date.now()}-${index}`,
      }));
      //console.log('ProductSpecificationsForm - Specs with IDs:', specsWithIds);
      setSpecifications(specsWithIds);
    }
  }, [initialSpecifications]);

  // Predefined categories for specifications
  const specificationCategories = [
    'Hiệu năng',
    'Màn hình',
    'Thiết kế',
    'Kết nối',
    'Pin & Nguồn',
    'Hệ điều hành',
    'Bảo mật',
    'Âm thanh',
    'Bàn phím',
    'Camera',
    'Thông số chung',
    'Khác',
  ];

  // Sync specifications with form
  useEffect(() => {
    form.setFieldValue('specifications', specifications);
  }, [specifications, form]);

  // Load specifications when form field changes

  // Fallback: Check form values periodically (for timing issues)
  useEffect(() => {
    const interval = setInterval(() => {
      const currentSpecs = form.getFieldValue('specifications');
      if (
        currentSpecs &&
        Array.isArray(currentSpecs) &&
        currentSpecs.length > 0
      ) {
        if (JSON.stringify(currentSpecs) !== JSON.stringify(specifications)) {
          // //console.log(
          //   'ProductSpecificationsForm - Interval check found specifications:',
          //   currentSpecs
          // );
          setSpecifications(currentSpecs);
          clearInterval(interval); // Stop checking once found
        }
      }
    }, 500); // Check every 500ms

    // Clear interval after 10 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []); // Only run once on mount

  const addSpecification = () => {
    const newSpec: Specification = {
      id: Date.now().toString(),
      name: '',
      value: '',
      category: 'Thông số chung',
    };
    setSpecifications([...specifications, newSpec]);
  };

  const updateSpecification = (
    id: string,
    field: keyof Specification,
    value: string
  ) => {
    // //console.log(
    //   `Updating specification ${id}, field: ${field}, value: ${value}`
    // );
    setSpecifications((specs) => {
      const updated = specs.map((spec) =>
        spec.id === id ? { ...spec, [field]: value } : spec
      );
      //console.log('Updated specifications:', updated);
      return updated;
    });
  };

  const removeSpecification = (id: string) => {
    setSpecifications((specs) => specs.filter((spec) => spec.id !== id));
  };

  const addSampleSpecifications = () => {
    const sampleSpecs: Specification[] = [
      {
        id: `sample-${Date.now()}-1`,
        name: 'CPU',
        value: 'Intel Core i5-1235U',
        category: 'Hiệu năng',
      },
      {
        id: `sample-${Date.now()}-2`,
        name: 'RAM',
        value: '8GB DDR4 3200MHz',
        category: 'Hiệu năng',
      },
      {
        id: `sample-${Date.now()}-3`,
        name: 'Ổ cứng',
        value: '512GB SSD NVMe',
        category: 'Hiệu năng',
      },
      {
        id: `sample-${Date.now()}-4`,
        name: 'Màn hình',
        value: '14 inch Full HD IPS',
        category: 'Màn hình',
      },
      {
        id: `sample-${Date.now()}-5`,
        name: 'Trọng lượng',
        value: '1.4kg',
        category: 'Thiết kế',
      },
      {
        id: `sample-${Date.now()}-6`,
        name: 'Pin',
        value: '39WHrs 3-cell',
        category: 'Pin & Nguồn',
      },
      {
        id: `sample-${Date.now()}-7`,
        name: 'Hệ điều hành',
        value: 'Windows 11 Home',
        category: 'Hệ điều hành',
      },
    ];

    setSpecifications([...specifications, ...sampleSpecs]);
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={3}>
        <InfoCircleOutlined style={{ marginRight: 8 }} />
        Thông số kỹ thuật sản phẩm
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        Thêm các thông số kỹ thuật chi tiết để khách hàng có thể so sánh và đánh
        giá sản phẩm
      </Text>

      {/* Add Specification Button */}
      <div style={{ marginBottom: 24 }}>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={addSpecification}
            size="large"
          >
            Thêm thông số kỹ thuật
          </Button>
          <Button type="default" onClick={addSampleSpecifications} size="large">
            Thêm mẫu laptop
          </Button>
        </Space>
      </div>

      {/* Specifications List */}
      {specifications.length > 0 && (
        <Card title="📋 Danh sách thông số" style={{ marginBottom: 24 }}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {specifications.map((spec, index) => (
              <Card
                key={`${spec.id}-${index}`}
                size="small"
                style={{ backgroundColor: '#fafafa' }}
              >
                <Row gutter={16} align="middle">
                  <Col span={6}>
                    <Input
                      placeholder="Tên thông số (VD: CPU, RAM...)"
                      value={spec.name}
                      onChange={(e) =>
                        updateSpecification(spec.id, 'name', e.target.value)
                      }
                    />
                  </Col>
                  <Col span={10}>
                    <TextArea
                      placeholder="Giá trị thông số (VD: Intel Core i5, 8GB DDR4...)"
                      value={spec.value}
                      onChange={(e) =>
                        updateSpecification(spec.id, 'value', e.target.value)
                      }
                      rows={1}
                      autoSize={{ minRows: 1, maxRows: 3 }}
                    />
                  </Col>
                  <Col span={6}>
                    <Select
                      placeholder="Chọn danh mục"
                      value={spec.category}
                      onChange={(value) =>
                        updateSpecification(spec.id, 'category', value)
                      }
                      style={{ width: '100%' }}
                    >
                      {specificationCategories.map((category) => (
                        <Select.Option key={category} value={category}>
                          {category}
                        </Select.Option>
                      ))}
                    </Select>
                  </Col>
                  <Col span={2}>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeSpecification(spec.id)}
                    />
                  </Col>
                </Row>
              </Card>
            ))}
          </Space>
        </Card>
      )}

      {/* Empty State */}
      {specifications.length === 0 && (
        <Card
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            border: '2px dashed #d9d9d9',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: 16 }}>📋</div>
          <Title level={4} style={{ color: '#999' }}>
            Chưa có thông số kỹ thuật nào
          </Title>
          <Text type="secondary">
            Nhấn nút "Thêm thông số kỹ thuật" để bắt đầu thêm thông số cho sản
            phẩm
          </Text>
        </Card>
      )}

      {/* Hidden Form Field to store specifications */}
      <Form.Item name="specifications" style={{ display: 'none' }}>
        <Input />
      </Form.Item>

      {/* Summary */}
      {specifications.length > 0 && (
        <Card title="📊 Tổng quan" style={{ marginTop: 24 }} size="small">
          <Text strong>
            Tổng cộng: {specifications.length} thông số kỹ thuật
          </Text>
        </Card>
      )}
    </div>
  );
};

export default ProductSpecificationsForm;
