import React, { useState, useEffect, useCallback } from "react";
import {
  Form,
  Steps,
  Card,
  Button,
  Space,
  message,
  Typography,
  Row,
  Col,
  Alert,
  Modal,
  Tag,
} from "antd";
import {
  SaveOutlined,
  EyeOutlined,
  BulbOutlined,
  RocketOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

// Import our enhanced components
import EnhancedProductBasicForm from "../product/EnhancedProductBasicForm";
import DynamicAttributeSelector from "../product/DynamicAttributeSelector";
import ProductPricingForm from "../product/ProductPricingForm";
import ProductImagesForm from "../product/ProductImagesForm";
import ProductSeoForm from "../product/ProductSeoForm";
import ProductCategoryForm from "../product/ProductCategoryForm";
import { ProductVariant } from "@/types/product.types";

// Import services
import { useCreateProductMutation } from "@/services/adminProductApi";
import { useGetCategoriesQuery } from "@/services/categoryApi";

const { Step } = Steps;
const { Title, Text, Paragraph } = Typography;

interface ProductFormData {
  // Basic info
  name: string;
  baseName?: string;
  description: string;
  shortDescription: string;
  status: "active" | "inactive" | "draft";
  featured: boolean;
  isVariantProduct: boolean;

  // Variants
  variants?: ProductVariant[];

  // Pricing
  price: number;
  compareAtPrice?: number;

  // Inventory
  stockQuantity: number;
  sku?: string;
  inStock: boolean;

  // Media
  images: string[];
  thumbnail?: string;

  // Categories
  categoryIds: string[];

  // SEO
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords: string[];

  // Search
  searchKeywords: string[];

  // Specifications
  specifications: any[];

  // Dynamic attributes
  selectedAttributes: Record<string, string>;
}

interface DynamicProductCreateFormProps {
  onSuccess?: (product: any) => void;
  onCancel?: () => void;
  initialData?: Partial<ProductFormData>;
}

const DynamicProductCreateForm: React.FC<DynamicProductCreateFormProps> = ({
  onSuccess,
  onCancel,
  initialData,
}) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [createProduct] = useCreateProductMutation();
  const { data: categories = [], isLoading: isCategoriesLoading } =
    useGetCategoriesQuery();

  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, string>
  >({});
  const [generatedName, setGeneratedName] = useState<string>("");
  const [nameDetails, setNameDetails] = useState<any>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [formData, setFormData] = useState<Partial<ProductFormData>>(
    initialData || {}
  );

  // Initialize form with default values
  useEffect(() => {
    form.setFieldsValue({
      status: "draft",
      featured: false,
      isVariantProduct: true,
      inStock: true,
      stockQuantity: 0,
      price: 0,
      images: [],
      categoryIds: [],
      seoKeywords: [],
      searchKeywords: [],
      specifications: [],
      selectedAttributes: {},
      ...initialData,
    });
  }, [form, initialData]);

  const steps = [
    {
      title: "📝 Thông tin cơ bản",
      description: "Tên, mô tả, trạng thái",
      key: "basic",
    },
    {
      title: "🏷️ Thuộc tính động",
      description: "Chọn CPU, GPU, RAM, v.v.",
      key: "attributes",
    },
    {
      title: "💰 Giá & Kho",
      description: "Định giá và quản lý kho",
      key: "pricing",
    },
    {
      title: "📸 Hình ảnh",
      description: "Upload ảnh sản phẩm",
      key: "media",
    },
    {
      title: "📂 Danh mục",
      description: "Phân loại sản phẩm",
      key: "category",
    },
    {
      title: "🎯 SEO",
      description: "Tối ưu tìm kiếm",
      key: "seo",
    },
  ];

  // Handle attribute changes and dynamic naming
  const handleAttributeChange = useCallback(
    (
      attributeValues: Record<string, string>,
      affectingNameOnly: Record<string, string>
    ) => {
      setSelectedAttributes(attributeValues);
      form.setFieldValue("selectedAttributes", attributeValues);

      // Update form data
      setFormData((prev) => ({
        ...prev,
        selectedAttributes: attributeValues,
      }));
    },
    [form]
  );

  // Handle name generation
  const handleNameGenerated = useCallback(
    (name: string, details: any) => {
      setGeneratedName(name);
      setNameDetails(details);

      // Auto-update form data
      setFormData((prev) => ({
        ...prev,
        name,
      }));

      // Auto-generate SEO fields if empty
      if (!form.getFieldValue("seoTitle")) {
        form.setFieldValue("seoTitle", name);
      }

      if (
        !form.getFieldValue("shortDescription") &&
        details?.affectingAttributes
      ) {
        const attributeText = details.affectingAttributes
          .map((attr: any) => `${attr.groupName}: ${attr.name}`)
          .join(", ");
        const autoShortDesc = `${name} với cấu hình ${attributeText}`;
        form.setFieldValue("shortDescription", autoShortDesc);
      }
    },
    [form]
  );

  // Handle form data changes
  const handleFormChange = useCallback((changedValues: any, allValues: any) => {
    setFormData((prev) => ({ ...prev, ...allValues }));
  }, []);

  // Fill example data
  const fillExampleData = useCallback(() => {
    const exampleData: Partial<ProductFormData> = {
      name: "ThinkPad X1 Carbon Gen 11",
      baseName: "ThinkPad X1 Carbon",
      shortDescription:
        "Laptop doanh nhân cao cấp, siêu mỏng nhẹ với hiệu năng mạnh mẽ",
      description: `
        <h3>ThinkPad X1 Carbon Gen 11 - Định nghĩa mới về laptop doanh nhân</h3>
        
        <p><strong>Thiết kế siêu mỏng nhẹ:</strong> Chỉ 1.12kg và 14.95mm, ThinkPad X1 Carbon là người bạn đồng hành lý tưởng cho doanh nhân năng động.</p>
        
        <p><strong>Hiệu năng vượt trội:</strong> Trang bị bộ vi xử lý Intel Core thế hệ 13 mới nhất, mang đến sức mạnh xử lý đỉnh cao cho mọi tác vụ.</p>
        
        <p><strong>Bảo mật đẳng cấp:</strong> Tích hợp chip bảo mật dTPM 2.0, Windows Hello, và nhiều tính năng bảo mật tiên tiến.</p>
      `,
      price: 35000000,
      compareAtPrice: 42000000,
      stockQuantity: 10,
      sku: "TPX1C-2024",
      featured: true,
      isVariantProduct: true,
      status: "active",
      seoTitle: "ThinkPad X1 Carbon Gen 11 - Laptop Doanh Nhân Cao Cấp",
      seoDescription:
        "Mua ThinkPad X1 Carbon Gen 11 với giá tốt nhất. Laptop doanh nhân siêu mỏng nhẹ, hiệu năng mạnh, bảo mật tuyệt đối.",
      seoKeywords: ["thinkpad", "x1 carbon", "laptop doanh nhân", "lenovo"],
      searchKeywords: [
        "thinkpad x1 carbon",
        "laptop lenovo",
        "laptop doanh nhân",
      ],
    };

    form.setFieldsValue(exampleData);
    setFormData((prev) => ({ ...prev, ...exampleData }));
    message.success("Đã điền dữ liệu mẫu ThinkPad X1 Carbon!");
  }, [form]);

  // Navigation handlers
  const handleNext = () => {
    form
      .validateFields()
      .then(() => {
        setCurrentStep(currentStep + 1);
      })
      .catch(() => {
        message.error("Vui lòng điền đầy đủ thông tin bắt buộc!");
      });
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  // Submit handler
  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      const productData = {
        ...values,
        selectedAttributes,
        generatedName,
        price: Number(values.price) || 0,
        compareAtPrice: values.compareAtPrice
          ? Number(values.compareAtPrice)
          : undefined,
        stockQuantity: Number(values.stockQuantity) || 0,
      };

      console.log("Submitting product:", productData);

      // Create the product
      const response = await createProduct(productData).unwrap();

      if (response?.data) {
        message.success("Tạo sản phẩm thành công!");
        if (onSuccess) {
          onSuccess(response.data);
        } else {
          navigate("/admin/products");
        }
      }
    } catch (error: any) {
      console.error("Create product error:", error);
      message.error(error.message || "Có lỗi xảy ra khi tạo sản phẩm!");
    } finally {
      setLoading(false);
    }
  };

  // Preview handler
  const handlePreview = () => {
    setPreviewVisible(true);
  };

  // Render step content
  const renderStepContent = () => {
    const currentStepKey = steps[currentStep]?.key;

    switch (currentStepKey) {
      case "basic":
        return (
          <EnhancedProductBasicForm
            fillExampleData={fillExampleData}
            selectedAttributes={selectedAttributes}
            onNameGenerated={handleNameGenerated}
          />
        );

      case "attributes":
        return (
          <DynamicAttributeSelector
            baseName={formData.baseName || formData.name}
            onAttributeChange={handleAttributeChange}
            onNameGenerated={handleNameGenerated}
            showNamePreview={true}
          />
        );

      case "pricing":
        return (
          <ProductPricingForm
            hasVariants={Boolean(formData?.variants?.length)}
            variants={formData?.variants || []}
          />
        );

      case "media":
        return <ProductImagesForm form={form} />;

      case "category":
        return (
          <ProductCategoryForm
            categories={categories}
            isLoading={isCategoriesLoading}
          />
        );

      case "seo":
        return <ProductSeoForm />;

      default:
        return null;
    }
  };

  const currentStepInfo = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
      }}
    >
      <Card
        style={{ maxWidth: 1200, margin: "0 auto" }}
        title={
          <Space>
            <RocketOutlined style={{ color: "#1890ff" }} />
            <Title level={3} style={{ margin: 0 }}>
              Tạo sản phẩm với tính năng tên động
            </Title>
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<EyeOutlined />}
              onClick={handlePreview}
              disabled={!generatedName}
            >
              Xem trước
            </Button>
            {onCancel && <Button onClick={onCancel}>Hủy</Button>}
          </Space>
        }
      >
        {/* Progress Steps */}
        <Steps current={currentStep} style={{ marginBottom: 32 }}>
          {steps.map((step, index) => (
            <Step
              key={step.key}
              title={step.title}
              description={step.description}
              icon={currentStep === index ? <SettingOutlined /> : undefined}
            />
          ))}
        </Steps>

        {/* Current Name Display */}
        {generatedName && (
          <Alert
            message="Tên sản phẩm hiện tại"
            description={
              <Space direction="vertical" style={{ width: "100%" }}>
                <Title level={4} style={{ margin: 0, color: "#1890ff" }}>
                  {generatedName}
                </Title>
                {nameDetails?.affectingAttributes && (
                  <Space wrap>
                    {nameDetails.affectingAttributes.map((attr: any) => (
                      <Tag key={attr.id} color="blue">
                        {attr.groupName}: {attr.nameTemplate || attr.name}
                      </Tag>
                    ))}
                  </Space>
                )}
              </Space>
            }
            type="info"
            icon={<BulbOutlined />}
            style={{ marginBottom: 24 }}
          />
        )}

        {/* Form */}
        <Form
          form={form}
          layout="vertical"
          onValuesChange={handleFormChange}
          requiredMark={false}
        >
          {/* Step Content */}
          <Card
            title={currentStepInfo.title}
            style={{ marginBottom: 24 }}
            bodyStyle={{ minHeight: 400 }}
          >
            {renderStepContent()}
          </Card>

          {/* Navigation */}
          <Row justify="space-between" align="middle">
            <Col>
              {!isFirstStep && (
                <Button size="large" onClick={handlePrev}>
                  ← Bước trước
                </Button>
              )}
            </Col>

            <Col>
              <Text type="secondary">
                Bước {currentStep + 1} / {steps.length}
              </Text>
            </Col>

            <Col>
              <Space>
                {!isLastStep ? (
                  <Button type="primary" size="large" onClick={handleNext}>
                    Bước tiếp theo →
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    size="large"
                    icon={<SaveOutlined />}
                    loading={loading}
                    onClick={handleSubmit}
                  >
                    Tạo sản phẩm
                  </Button>
                )}
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Preview Modal */}
      <Modal
        title="👀 Xem trước sản phẩm"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={800}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Title level={3}>{generatedName || formData.name}</Title>

          {formData.shortDescription && (
            <Paragraph>{formData.shortDescription}</Paragraph>
          )}

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Text strong>Giá:</Text> {formData.price?.toLocaleString()} VNĐ
            </Col>
            <Col span={12}>
              <Text strong>Tồn kho:</Text> {formData.stockQuantity}
            </Col>
          </Row>

          {Object.keys(selectedAttributes).length > 0 && (
            <div>
              <Text strong>Thuộc tính đã chọn:</Text>
              <div style={{ marginTop: 8 }}>
                <Space wrap>
                  {Object.entries(selectedAttributes).map(
                    ([groupId, valueId]) => (
                      <Tag key={`${groupId}-${valueId}`} color="blue">
                        {valueId}
                      </Tag>
                    )
                  )}
                </Space>
              </div>
            </div>
          )}
        </Space>
      </Modal>
    </div>
  );
};

export default DynamicProductCreateForm;
