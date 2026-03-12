import React, { useState } from "react";
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
  List,
} from "antd";
import {
  ThunderboltOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import SimpleDynamicTitle from "@/components/product/SimpleDynamicTitle";
import SimpleAttributeSelector from "@/components/product/SimpleAttributeSelector";

const { Title, Text, Paragraph } = Typography;

const SimpleNamingTestPage: React.FC = () => {
  const [baseName, setBaseName] = useState("ThinkPad");
  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, string>
  >({});
  const [previewName, setPreviewName] = useState("");

  const testScenarios = [
    {
      name: "Gaming Laptop",
      baseName: "ROG Strix",
      attributes: {
        CPU: "Intel Core i9-13900H",
        GPU: "NVIDIA RTX 4080",
        RAM: "32GB DDR5",
      },
    },
    {
      name: "Business Laptop",
      baseName: "ThinkPad T14",
      attributes: {
        CPU: "Intel Core i7-13700H",
        RAM: "16GB DDR5",
        Storage: "512GB SSD",
      },
    },
    {
      name: "Budget Laptop",
      baseName: "IdeaPad 3",
      attributes: { CPU: "Intel Core i5-13500H", RAM: "8GB DDR5" },
    },
    {
      name: "Workstation",
      baseName: "MacBook Pro",
      attributes: {
        CPU: "Intel Core i9-13900H",
        RAM: "64GB DDR5",
        Storage: "2TB SSD",
      },
    },
  ];

  const handleAttributeChange = (attributes: Record<string, string>) => {
    setSelectedAttributes(attributes);
  };

  const handleNamePreview = (name: string) => {
    setPreviewName(name);
  };

  const runTestScenario = (scenario: (typeof testScenarios)[0]) => {
    setBaseName(scenario.baseName);
    // Filter out undefined values to match Record<string, string>
    const filteredAttributes = Object.fromEntries(
      Object.entries(scenario.attributes).filter(
        ([, value]) => value !== undefined
      )
    ) as Record<string, string>;
    setSelectedAttributes(filteredAttributes);
  };

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <Card style={{ marginBottom: 24 }}>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <div>
              <Title level={2}>
                <Space>
                  <ThunderboltOutlined style={{ color: "#52c41a" }} />
                  Simple Dynamic Product Naming
                </Space>
              </Title>
              <Paragraph>
                Hệ thống đơn giản để tạo tên sản phẩm tự động. Chỉ cần thêm từng
                thuộc tính vào tên gốc theo thứ tự ưu tiên.
              </Paragraph>
            </div>

            <Alert
              message="✨ Simple & Effective!"
              description="Không cần AI, không cần API phức tạp. Chỉ cần logic đơn giản: Base + CPU + GPU + RAM + Storage"
              type="success"
              showIcon
            />
          </Space>
        </Card>

        <Row gutter={[24, 24]}>
          {/* Left Column - Demo */}
          <Col span={14}>
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              {/* Dynamic Title Demo */}
              <Card title="🎯 Dynamic Product Title">
                <SimpleDynamicTitle
                  baseName={baseName}
                  selectedAttributes={selectedAttributes}
                  level={2}
                  showAddedParts={true}
                  onNameChange={setPreviewName}
                />
              </Card>

              {/* Attribute Selector */}
              <Card title="🏷️ Attribute Selector">
                <SimpleAttributeSelector
                  onAttributeChange={handleAttributeChange}
                  onNamePreview={handleNamePreview}
                />
              </Card>
            </Space>
          </Col>

          {/* Right Column - Controls */}
          <Col span={10}>
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              {/* Base Name Control */}
              <Card title="⚙️ Controls" size="small">
                <Space
                  direction="vertical"
                  size="middle"
                  style={{ width: "100%" }}
                >
                  <div>
                    <Text strong>Base Name:</Text>
                    <Input
                      value={baseName}
                      onChange={(e) => setBaseName(e.target.value)}
                      placeholder="Nhập tên cơ bản..."
                      style={{ marginTop: 8 }}
                    />
                  </div>

                  <Divider />

                  <div>
                    <Text strong>Quick Test:</Text>
                    <div style={{ marginTop: 8 }}>
                      <Space
                        direction="vertical"
                        size="small"
                        style={{ width: "100%" }}
                      >
                        {testScenarios.map((scenario, index) => (
                          <Button
                            key={index}
                            block
                            size="small"
                            icon={<PlayCircleOutlined />}
                            onClick={() => runTestScenario(scenario)}
                          >
                            {scenario.name}
                          </Button>
                        ))}
                      </Space>
                    </div>
                  </div>
                </Space>
              </Card>

              {/* Live Preview */}
              <Card
                title="📺 Live Preview"
                size="small"
                style={{
                  borderColor: previewName !== baseName ? "#52c41a" : undefined,
                }}
              >
                <Space
                  direction="vertical"
                  size="small"
                  style={{ width: "100%" }}
                >
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Generated Name:
                    </Text>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: previewName !== baseName ? "#1890ff" : undefined,
                        marginTop: 4,
                      }}
                    >
                      {previewName || baseName}
                    </div>
                  </div>

                  {Object.keys(selectedAttributes).length > 0 && (
                    <div>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        Parts:
                      </Text>
                      <List
                        size="small"
                        dataSource={[
                          `Base: ${baseName}`,
                          ...Object.entries(selectedAttributes).map(
                            ([type, value]) => `${type}: ${value}`
                          ),
                        ]}
                        renderItem={(item) => (
                          <List.Item style={{ padding: "2px 0", fontSize: 11 }}>
                            <CheckCircleOutlined
                              style={{ color: "#52c41a", marginRight: 4 }}
                            />
                            {item}
                          </List.Item>
                        )}
                      />
                    </div>
                  )}
                </Space>
              </Card>

              {/* How it works */}
              <Card title="💡 How It Works" size="small">
                <List
                  size="small"
                  dataSource={[
                    "Start với Base Name",
                    "Thêm CPU code (i5, i7, i9...)",
                    "Thêm GPU code (RTX4070...)",
                    "Thêm RAM size (16GB, 32GB...)",
                    "Thêm Storage (512GB, 1TB...)",
                    "Tự động theo thứ tự ưu tiên",
                  ]}
                  renderItem={(item, index) => (
                    <List.Item style={{ padding: "4px 0", fontSize: 12 }}>
                      <Text type="secondary">
                        {index + 1}. {item}
                      </Text>
                    </List.Item>
                  )}
                />
              </Card>
            </Space>
          </Col>
        </Row>

        {/* Examples */}
        <Card style={{ marginTop: 24 }} title="📋 Examples">
          <Row gutter={16}>
            {testScenarios.map((scenario, index) => (
              <Col key={index} span={6}>
                <Card size="small" style={{ backgroundColor: "#fafafa" }}>
                  <Space direction="vertical" size="small">
                    <Text strong style={{ fontSize: 12 }}>
                      {scenario.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: "#666" }}>
                      {scenario.baseName} → {scenario.baseName}{" "}
                      {Object.values(scenario.attributes)
                        .map((val) => {
                          // Simulate short names
                          if (val.includes("i9")) return "i9";
                          if (val.includes("i7")) return "i7";
                          if (val.includes("i5")) return "i5";
                          if (val.includes("RTX 4080")) return "RTX4080";
                          if (val.includes("RTX 4070")) return "RTX4070";
                          if (val.includes("32GB")) return "32GB";
                          if (val.includes("16GB")) return "16GB";
                          if (val.includes("8GB")) return "8GB";
                          if (val.includes("2TB")) return "2TB";
                          if (val.includes("1TB")) return "1TB";
                          if (val.includes("512GB")) return "512GB";
                          return val;
                        })
                        .join(" ")}
                    </Text>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      </div>
    </div>
  );
};

export default SimpleNamingTestPage;
