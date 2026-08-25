import React, { useState, useMemo } from "react";
import {
  Card,
  Typography,
  Button,
  Table,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Tag,
  Alert,
  Checkbox,
  Row,
  Col,
  message,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { AttributeGroup, AttributeValue } from "@/services/attributeApi";

const { Title, Text } = Typography;
const { Option } = Select;

interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  attributeValues: Record<string, string>; // groupId -> valueId
  isDefault: boolean;
  isAvailable: boolean;
}

interface HierarchicalVariantsFormProps {
  attributeGroups: AttributeGroup[];
  variants: ProductVariant[];
  onVariantsChange: (variants: ProductVariant[]) => void;
}

const HierarchicalVariantsForm: React.FC<HierarchicalVariantsFormProps> = ({
  attributeGroups,
  variants,
  onVariantsChange,
}) => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(
    null
  );
  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, string>
  >({});

  // Generate all possible combinations
  const generateCombinations = () => {
    const combinations: Array<Record<string, string>> = [];

    const generateRecursive = (
      groupIndex: number,
      currentCombination: Record<string, string>
    ) => {
      if (groupIndex >= attributeGroups.length) {
        combinations.push({ ...currentCombination });
        return;
      }

      const group = attributeGroups[groupIndex];
      if (!group.values || group.values.length === 0) {
        generateRecursive(groupIndex + 1, currentCombination);
        return;
      }

      group.values.forEach((value) => {
        currentCombination[group.id] = value.id;
        generateRecursive(groupIndex + 1, currentCombination);
      });
    };

    generateRecursive(0, {});
    return combinations;
  };

  const handleGenerateVariants = () => {
    if (attributeGroups.length === 0) {
      message.warning("Vui lòng tạo thuộc tính trước khi tạo biến thể!");
      return;
    }

    const combinations = generateCombinations();
    const newVariants: ProductVariant[] = combinations.map(
      (combination, index) => {
        const attributeNames: string[] = [];
        let basePrice = 0;

        Object.entries(combination).forEach(([groupId, valueId]) => {
          const group = attributeGroups.find((g) => g.id === groupId);
          const value = group?.values?.find((v) => v.id === valueId);
          if (value) {
            attributeNames.push(value.name);
            basePrice += value.priceAdjustment;
          }
        });

        return {
          id: `variant-${Date.now()}-${index}`,
          name: attributeNames.join(" - "),
          sku: `VAR-${Date.now()}-${index}`,
          price: basePrice,
          stock: 0,
          attributeValues: combination,
          isDefault: index === 0,
          isAvailable: true,
        };
      }
    );

    onVariantsChange(newVariants);
    message.success(`Đã tạo ${newVariants.length} biến thể!`);
  };

  const handleAddVariant = () => {
    setEditingVariant(null);
    setSelectedAttributes({});
    setIsModalVisible(true);
    form.resetFields();
  };

  const handleEditVariant = (variant: ProductVariant) => {
    setEditingVariant(variant);
    setSelectedAttributes(variant.attributeValues);
    setIsModalVisible(true);
    form.setFieldsValue({
      name: variant.name,
      sku: variant.sku,
      price: variant.price,
      stock: variant.stock,
      isDefault: variant.isDefault,
      isAvailable: variant.isAvailable,
      attributeValues: variant.attributeValues,
    });
  };

  const handleDeleteVariant = (variantId: string) => {
    const newVariants = variants.filter((v) => v.id !== variantId);
    onVariantsChange(newVariants);
    message.success("Đã xóa biến thể!");
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Generate name from selected attributes
      const attributeNames: string[] = [];
      Object.entries(selectedAttributes).forEach(([groupId, valueId]) => {
        const group = attributeGroups.find((g) => g.id === groupId);
        const value = group?.values?.find((v) => v.id === valueId);
        if (value) {
          attributeNames.push(value.name);
        }
      });

      const variant: ProductVariant = {
        id: editingVariant?.id || `variant-${Date.now()}`,
        name: values.name || attributeNames.join(" - "),
        sku: values.sku || `VAR-${Date.now()}`,
        price: values.price || 0,
        stock: values.stock || 0,
        attributeValues: selectedAttributes,
        isDefault: values.isDefault || false,
        isAvailable: values.isAvailable ?? true,
      };

      if (editingVariant) {
        // Update existing variant
        const newVariants = variants.map((v) =>
          v.id === editingVariant.id ? variant : v
        );
        onVariantsChange(newVariants);
        message.success("Cập nhật biến thể thành công!");
      } else {
        // Add new variant
        onVariantsChange([...variants, variant]);
        message.success("Thêm biến thể thành công!");
      }

      setIsModalVisible(false);
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  const getAttributeDisplayName = (groupId: string, valueId: string) => {
    const group = attributeGroups.find((g) => g.id === groupId);
    const value = group?.values?.find((v) => v.id === valueId);
    return value ? `${group?.name}: ${value.name}` : "N/A";
  };

  const columns = [
    {
      title: "Tên biến thể",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: ProductVariant) => (
        <div>
          <div>{name}</div>
          {record.isDefault && <Tag color="gold">Mặc định</Tag>}
          {!record.isAvailable && <Tag color="red">Không khả dụng</Tag>}
        </div>
      ),
    },
    {
      title: "Thuộc tính",
      dataIndex: "attributeValues",
      key: "attributeValues",
      render: (attributeValues: Record<string, string>) => (
        <div>
          {Object.entries(attributeValues).map(([groupId, valueId]) => (
            <Tag key={`${groupId}-${valueId}`} color="blue">
              {getAttributeDisplayName(groupId, valueId)}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: "SKU",
      dataIndex: "sku",
      key: "sku",
    },
    {
      title: "Giá",
      dataIndex: "price",
      key: "price",
      render: (price: number) => `${price.toLocaleString()}đ`,
    },
    {
      title: "Tồn kho",
      dataIndex: "stock",
      key: "stock",
    },
    {
      title: "Hành động",
      key: "actions",
      width: 120,
      render: (_: any, record: ProductVariant) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditVariant(record)}
          />
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteVariant(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Title level={4}>Tạo biến thể sản phẩm</Title>

      <Alert
        message="Thông tin"
        description="Biến thể sản phẩm được tạo dựa trên các thuộc tính đã định nghĩa. Mỗi biến thể có thể có giá và tồn kho riêng."
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 16 }}
      />

      <Space style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleGenerateVariants}
        >
          Tạo tất cả biến thể tự động
        </Button>
        <Button icon={<PlusOutlined />} onClick={handleAddVariant}>
          Thêm biến thể thủ công
        </Button>
      </Space>

      {variants.length === 0 ? (
        <Alert
          message="Chưa có biến thể nào"
          description="Vui lòng tạo biến thể để tiếp tục."
          type="warning"
          showIcon
        />
      ) : (
        <Table
          dataSource={variants}
          columns={columns}
          rowKey="id"
          pagination={false}
          scroll={{ x: 800 }}
        />
      )}

      {/* Modal for adding/editing variant */}
      <Modal
        title={editingVariant ? "Sửa biến thể" : "Thêm biến thể"}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        okText={editingVariant ? "Cập nhật" : "Thêm"}
        cancelText="Hủy"
        width={800}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Tên biến thể"
                rules={[
                  { required: true, message: "Vui lòng nhập tên biến thể!" },
                ]}
              >
                <Input placeholder="Tên biến thể" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="sku"
                label="SKU"
                rules={[{ required: true, message: "Vui lòng nhập SKU!" }]}
              >
                <Input placeholder="SKU" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="price"
                label="Giá"
                rules={[{ required: true, message: "Vui lòng nhập giá!" }]}
              >
                <InputNumber<number>
                  style={{ width: "100%" }}
                  placeholder="Giá"
                  min={0}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) =>
                    Number((value ?? "").replace(/\$\s?|(,*)/g, "")) || 0
                  }
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="stock"
                label="Tồn kho"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập số lượng tồn kho!",
                  },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="Tồn kho"
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="isDefault" valuePropName="checked">
                <Checkbox>Biến thể mặc định</Checkbox>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="isAvailable"
                valuePropName="checked"
                initialValue={true}
              >
                <Checkbox>Có sẵn</Checkbox>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Thuộc tính">
            {attributeGroups.map((group) => (
              <div key={group.id} style={{ marginBottom: 16 }}>
                <Text strong>{group.name}:</Text>
                <Select
                  style={{ width: "100%", marginTop: 8 }}
                  placeholder={`Chọn ${group.name}`}
                  value={selectedAttributes[group.id]}
                  onChange={(value) => {
                    setSelectedAttributes((prev) => ({
                      ...prev,
                      [group.id]: value,
                    }));
                  }}
                >
                  {group.values?.map((value) => (
                    <Option key={value.id} value={value.id}>
                      {value.name}
                      {value.priceAdjustment !== 0 && (
                        <span
                          style={{
                            color: value.priceAdjustment > 0 ? "green" : "red",
                          }}
                        >
                          {" "}
                          ({value.priceAdjustment > 0 ? "+" : ""}
                          {value.priceAdjustment.toLocaleString()}đ)
                        </span>
                      )}
                    </Option>
                  ))}
                </Select>
              </div>
            ))}
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default HierarchicalVariantsForm;
