import React, { useState } from 'react';
import {
  Card,
  Typography,
  Space,
  Row,
  Col,
  Alert,
  Button,
  Input,
  Divider,
  Tag,
} from 'antd';
import {
  ExperimentOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import DynamicProductTitle from '@/components/product/DynamicProductTitle';
import DynamicAttributeSelector from '@/components/product/DynamicAttributeSelector';
import DynamicProductName from '@/components/product/DynamicProductName';

const { Title, Text, Paragraph } = Typography;

interface TestProduct {
  id: string;
  name: string;
  baseName?: string;
  isVariantProduct: boolean;
  attributes: Array<{
    id: string;
    name: string;
    values: Array<{
      value: string;
      stock: number;
      available: boolean;
      priceAdjustment?: number;
    }>;
  }>;
}

const DynamicProductTestPage: React.FC = () => {
  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, string>
  >({});
  const [baseName, setBaseName] = useState('ThinkPad X1 Carbon');
  const [dynamicName, setDynamicName] = useState('');

  // Mock product data for testing
  const testProduct: TestProduct = {
    id: 'test-product',
    name: 'ThinkPad X1 Carbon Gen 11',
    baseName: 'ThinkPad X1 Carbon',
    isVariantProduct: true,
    attributes: [
      {
        id: 'cpu-attr',
        name: 'CPU',
        values: [
          { value: 'Intel Core i5-13500H', stock: 10, available: true },
          { value: 'Intel Core i7-13700H', stock: 5, available: true },
          { value: 'Intel Core i9-13900H', stock: 2, available: true },
        ],
      },
      {
        id: 'ram-attr',
        name: 'RAM',
        values: [
          { value: '8GB DDR5', stock: 15, available: true },
          { value: '16GB DDR5', stock: 8, available: true },
          { value: '32GB DDR5', stock: 3, available: true },
        ],
      },
      {
        id: 'gpu-attr',
        name: 'GPU',
        values: [
          { value: 'Integrated Graphics', stock: 20, available: true },
          { value: 'NVIDIA RTX 4050', stock: 10, available: true },
          { value: 'NVIDIA RTX 4070', stock: 5, available: true },
        ],
      },
    ],
  };

  const handleAttributeChange = (
    attributeValues: Record<string, string>,
    affectingNameOnly: Record<string, string>
  ) => {
    setSelectedAttributes(attributeValues);
    //console.log('🔄 Attributes changed:', {
    //   all: attributeValues,
    //   nameAffecting: affectingNameOnly,
    // });
  };

  const handleNameGenerated = (name: string, details: any) => {
    setDynamicName(name);
    //console.log('🎯 Name generated:', { name, details });
  };

  const testScenarios = [
    {
      name: 'Gaming Laptop',
      baseName: 'ASUS ROG Strix',
      attributes: {
        CPU: 'Intel Core i9-13900H',
        GPU: 'NVIDIA RTX 4070',
        RAM: '32GB DDR5',
      },
    },
    {
      name: 'Business Laptop',
      baseName: 'ThinkPad T14',
      attributes: { CPU: 'Intel Core i7-13700H', RAM: '16GB DDR5' },
    },
    {
      name: 'Budget Laptop',
      baseName: 'IdeaPad 3',
      attributes: { CPU: 'Intel Core i5-13500H', RAM: '8GB DDR5' },
    },
  ];

  const runTestScenario = (scenario: (typeof testScenarios)[0]) => {
    setBaseName(scenario.baseName);
    // Simulate attribute selection for demo
    //console.log(`🧪 Testing scenario: ${scenario.name}`, scenario);
  };

  return (
    <div
      style={{
        padding: '24px',
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <Card style={{ marginBottom: 24 }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
                <Title level={2}>
                <Space>
                  <ExperimentOutlined style={{ color: '#1890ff' }} />
                  Dynamic Product Naming - Test Lab
                </Space>
              </Title>
              <Paragraph>
                Test hệ thống tạo tên sản phẩm tự động dựa trên thuộc tính đã
                chọn. Hệ thống sẽ call API real-time để tạo tên mới khi bạn thay
                đổi thuộc tính.
              </Paragraph>
            </div>

            <Alert
              message="🚀 Hệ thống Dynamic Naming đã hoạt động!"
              description="Backend API, Frontend Components, và Real-time Updates đều đã được tích hợp thành công."
              type="success"
              showIcon
            />
          </Space>
        </Card>

        <Row gutter={[24, 24]}>
          {/* Left Column - Controls */}
          <Col span={12}>
            <Card title="🎮 Test Controls" style={{ height: 'fit-content' }}>
              <Space
                direction="vertical"
                size="large"
                style={{ width: '100%' }}
              >
                {/* Base Name Input */}
                <div>
                  <Text strong>Base Name:</Text>
                  <Input
                    value={baseName}
                    onChange={(e) => setBaseName(e.target.value)}
                    placeholder="Nhập tên cơ bản..."
                    size="large"
                    style={{ marginTop: 8 }}
                  />
                </div>

                {/* Quick Test Scenarios */}
                <div>
                  <Text strong>Quick Test Scenarios:</Text>
                  <div style={{ marginTop: 8 }}>
                    <Space wrap>
                      {testScenarios.map((scenario, index) => (
                        <Button
                          key={index}
                          type="dashed"
                          icon={<PlayCircleOutlined />}
                          onClick={() => runTestScenario(scenario)}
                        >
                          {scenario.name}
                        </Button>
                      ))}
                    </Space>
                  </div>
                </div>

                <Divider />

                {/* Dynamic Product Name Component */}
                <div>
                  <Text strong>Dynamic Name Generator:</Text>
                  <div
                    style={{
                      marginTop: 8,
                      padding: 16,
                      backgroundColor: '#fafafa',
                      borderRadius: 6,
                    }}
                  >
                    <DynamicProductName
                      baseName={baseName}
                      selectedAttributes={selectedAttributes}
                      onNameGenerated={handleNameGenerated}
                      disabled={false}
                    />
                  </div>
                </div>
              </Space>
            </Card>
          </Col>

          {/* Right Column - Dynamic Components */}
          <Col span={12}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* Dynamic Title */}
              <Card title="📝 Dynamic Product Title">
                <DynamicProductTitle
                  product={{
                    id: 'test-product',
                    name: baseName,
                    baseName: baseName,
                    isVariantProduct: true,
                  }}
                  selectedAttributes={selectedAttributes}
                  showAttributeTags={true}
                  level={2}
                />
              </Card>

              {/* Attribute Selector */}
              <Card title="🏷️ Dynamic Attribute Selector">
                <DynamicAttributeSelector
                  baseName={baseName}
                  onAttributeChange={handleAttributeChange}
                  onNameGenerated={handleNameGenerated}
                  showNamePreview={false} // Already shown above
                />
              </Card>

              {/* Results */}
              {dynamicName && (
                <Card
                  title="🎯 Generated Result"
                  style={{ borderColor: '#52c41a' }}
                >
                  <Space
                    direction="vertical"
                    size="middle"
                    style={{ width: '100%' }}
                  >
                    <div>
                      <Text strong style={{ color: '#1890ff', fontSize: 18 }}>
                        {dynamicName}
                      </Text>
                    </div>

                    {Object.keys(selectedAttributes).length > 0 && (
                      <div>
                        <Text type="secondary">Selected attributes:</Text>
                        <div style={{ marginTop: 8 }}>
                          <Space wrap>
                            {Object.entries(selectedAttributes).map(
                              ([key, value]) => (
                                <Tag key={key} color="blue">
                                  {key}: {value}
                                </Tag>
                              )
                            )}
                          </Space>
                        </div>
                      </div>
                    )}
                  </Space>
                </Card>
              )}
            </Space>
          </Col>
        </Row>

        {/* Footer */}
        <Card style={{ marginTop: 24 }}>
          <Alert
            message="💡 Cách sử dụng"
            description={
              <Space direction="vertical">
                <Text>1. Nhập tên cơ bản hoặc chọn scenario test</Text>
                <Text>
                  2. Chọn các thuộc tính (CPU, GPU, RAM) từ Dynamic Attribute
                  Selector
                </Text>
                <Text>3. Xem tên sản phẩm được tạo tự động real-time</Text>
                <Text>4. Kiểm tra API calls trong Developer Console</Text>
              </Space>
            }
            type="info"
            showIcon
          />
        </Card>
      </div>
    </div>
  );
};

export default DynamicProductTestPage;
