import React, { useState } from "react";
import { useCreateProductMutation } from "@/services/adminProductApi";
import { useGetCategoriesQuery } from "@/services/categoryApi";

// Kiểm tra xem một chuỗi có phải là URL hình ảnh hay không
const isImageUrl = (url: string): boolean => {
  // Chấp nhận tất cả các URL
  return true;
};
import {
  Steps,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Button,
  Space,
  Row,
  Col,
  Card,
  message,
  Divider,
  Typography,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  BulbOutlined,
} from "@ant-design/icons";
import { generateSearchKeywords } from "@/utils/textUtils";

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Step } = Steps;

interface CreateProductWizardContentProps {
  onSuccess?: () => void;
}

const statusOptions = [
  { value: "active", label: "Đang bán" },
  { value: "inactive", label: "Tạm dừng" },
  { value: "draft", label: "Bản nháp" },
];

interface Attribute {
  id: string;
  name: string;
  value: string;
}

interface Variant {
  id: string;
  name: string;
  price: number;
  stock: number;
}

const CreateProductWizardContent: React.FC<CreateProductWizardContentProps> = ({
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [createProduct, { isLoading }] = useCreateProductMutation();
  const { data: categories, isLoading: isCategoriesLoading } =
    useGetCategoriesQuery();

  const [currentStep, setCurrentStep] = useState(0);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);

  // State để lưu trữ dữ liệu form giữa các bước
  const [formState, setFormState] = useState<Record<string, any>>({
    name: "",
    sku: "",
    shortDescription: "",
    description: "",
    price: 0,
    comparePrice: undefined,
    stock: 0,
    categoryIds: [],
    status: "active",
    featured: false,
    images: "",
    thumbnail: "",
    searchKeywords: "",
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
  });

  // Effect để cập nhật form khi chuyển bước
  React.useEffect(() => {
    console.log("Current step changed to:", currentStep);
    console.log("Current formState:", formState);

    // Cập nhật form với dữ liệu đã lưu trong formState
    form.setFieldsValue(formState);
  }, [currentStep]);

  // Effect để lưu lại giá trị form khi có thay đổi
  React.useEffect(() => {
    const subscription = form.getFieldsValue(true);
    return () => {
      // Lưu lại giá trị form khi component unmount hoặc re-render
      const values = form.getFieldsValue(true);
      setFormState((prev) => ({ ...prev, ...values }));
    };
  }, []);

  const steps = [
    {
      title: "Thông tin cơ bản",
      description: "Nhập thông tin cơ bản về sản phẩm",
    },
    {
      title: "Giá & Kho hàng",
      description: "Thiết lập giá bán và số lượng tồn kho",
    },
    {
      title: "Phân loại",
      description: "Chọn danh mục và trạng thái sản phẩm",
    },
    {
      title: "Hình ảnh",
      description: "Thêm hình ảnh sản phẩm",
    },
    {
      title: "Thuộc tính & Biến thể",
      description: "Thêm thuộc tính và biến thể sản phẩm (tùy chọn)",
    },
    {
      title: "SEO & Hoàn tất",
      description: "Tối ưu SEO và hoàn tất tạo sản phẩm",
    },
  ];

  // Auto-fill SEO fields
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const currentValues = form.getFieldsValue();

    if (name && !currentValues.seoTitle) {
      form.setFieldValue("seoTitle", name);
    }
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const description = e.target.value;
    const currentValues = form.getFieldsValue();

    if (description && !currentValues.seoDescription) {
      form.setFieldValue("seoDescription", description.substring(0, 160));
    }
    if (description && !currentValues.shortDescription) {
      form.setFieldValue("shortDescription", description.substring(0, 200));
    }
  };

  // Attribute handlers
  const addAttribute = () => {
    setAttributes([
      ...attributes,
      { id: Date.now().toString(), name: "", value: "" },
    ]);
  };

  const updateAttribute = (id: string, field: string, value: string) => {
    setAttributes(
      attributes.map((attr) =>
        attr.id === id ? { ...attr, [field]: value } : attr
      )
    );
  };

  const removeAttribute = (id: string) => {
    setAttributes(attributes.filter((attr) => attr.id !== id));
  };

  // Variant handlers
  const addVariant = () => {
    setVariants([
      ...variants,
      { id: Date.now().toString(), name: "", price: 0, stock: 0 },
    ]);
  };

  const updateVariant = (id: string, field: string, value: string | number) => {
    setVariants(
      variants.map((variant) =>
        variant.id === id ? { ...variant, [field]: value } : variant
      )
    );
  };

  const removeVariant = (id: string) => {
    setVariants(variants.filter((variant) => variant.id !== id));
  };

  const handleNext = async () => {
    try {
      // Lưu giá trị hiện tại của form trước khi chuyển bước
      const currentFormValues = form.getFieldsValue();
      console.log("Current form values before validation:", currentFormValues);

      // Cập nhật formState với dữ liệu hiện tại
      setFormState((prevState) => ({
        ...prevState,
        ...currentFormValues,
      }));

      // Validate fields for current step
      const fieldsToValidate = getFieldsForStep(currentStep);
      if (fieldsToValidate.length > 0) {
        try {
          // Lấy giá trị hiện tại của form
          const currentValues = form.getFieldsValue();
          console.log(`Step ${currentStep} values:`, currentValues);

          // Kiểm tra từng trường cụ thể dựa trên bước hiện tại
          if (currentStep === 0) {
            // Thông tin cơ bản
            if (!currentValues.name || !currentValues.name.trim()) {
              message.error("Tên sản phẩm không được để trống");
              return;
            }
            if (!currentValues.sku || !currentValues.sku.trim()) {
              message.error("Mã SKU không được để trống");
              return;
            }
            if (
              !currentValues.shortDescription ||
              !currentValues.shortDescription.trim()
            ) {
              message.error("Mô tả ngắn không được để trống");
              return;
            }
            if (
              !currentValues.description ||
              !currentValues.description.trim()
            ) {
              message.error("Mô tả chi tiết không được để trống");
              return;
            }
          } else if (currentStep === 1) {
            // Giá & Kho hàng
            if (!currentValues.price || currentValues.price <= 0) {
              message.error("Giá sản phẩm phải lớn hơn 0");
              return;
            }
            if (currentValues.stock === undefined || currentValues.stock < 0) {
              message.error("Số lượng tồn kho không hợp lệ");
              return;
            }
          } else if (currentStep === 2) {
            // Phân loại
            if (
              !currentValues.categoryIds ||
              currentValues.categoryIds.length === 0
            ) {
              message.error("Vui lòng chọn ít nhất một danh mục");
              return;
            }
          }

          // Nếu không có lỗi, tiếp tục validate thông qua Ant Design Form
          await form.validateFields(fieldsToValidate);

          // Lưu lại giá trị của form hiện tại
          const currentFormData = form.getFieldsValue();
          console.log("Form data after validation:", currentFormData);

          // Cập nhật formState với dữ liệu mới
          setFormState((prevState) => ({
            ...prevState,
            ...currentFormData,
          }));
          console.log("Updated form state:", {
            ...formState,
            ...currentFormData,
          });

          // Nếu validation thành công, chuyển sang bước tiếp theo
          setCurrentStep(currentStep + 1);
        } catch (validationError) {
          console.log("Field validation failed:", validationError);
          message.error(
            "Vui lòng điền đầy đủ thông tin bắt buộc trước khi tiếp tục"
          );
          return;
        }
      } else {
        // Lưu lại giá trị của form hiện tại trước khi chuyển bước
        const currentFormData = form.getFieldsValue();
        setFormState((prevState) => ({
          ...prevState,
          ...currentFormData,
        }));

        // Nếu không có trường nào cần validate, chuyển sang bước tiếp theo
        setCurrentStep(currentStep + 1);
      }
    } catch (error) {
      console.log("Validation failed:", error);
      message.error(
        "Vui lòng điền đầy đủ thông tin bắt buộc trước khi tiếp tục"
      );
    }
  };

  const getFieldsForStep = (step: number): string[] => {
    switch (step) {
      case 0: // Basic Info
        return ["name", "sku", "shortDescription", "description"];
      case 1: // Pricing
        return ["price", "stock"];
      case 2: // Categories
        return ["categoryIds"];
      case 3: // Images
        return []; // No required fields
      case 4: // Attributes & Variants
        return []; // No required fields
      case 5: // SEO
        return []; // No required fields
      default:
        return [];
    }
  };

  const handlePrev = () => {
    // Lưu giá trị hiện tại của form trước khi quay lại bước trước
    const currentFormValues = form.getFieldsValue();
    console.log("Current form values before going back:", currentFormValues);

    // Cập nhật formState với dữ liệu hiện tại
    setFormState((prevState) => ({
      ...prevState,
      ...currentFormValues,
    }));

    // Chuyển về bước trước
    setCurrentStep(currentStep - 1);
  };

  const handleGenerateKeywords = () => {
    const currentValues = form.getFieldsValue();
    const allValues = { ...formState, ...currentValues };

    const keywords = generateSearchKeywords(
      allValues.name || "",
      allValues.description || "",
      allValues.shortDescription || "",
      15
    );

    const keywordsString = keywords.join(", ");
    form.setFieldValue("searchKeywords", keywordsString);

    message.success(`Đã tạo ${keywords.length} từ khóa tự động!`);
  };

  const handleSubmit = async () => {
    try {
      // Lấy giá trị form hiện tại và kết hợp với formState
      const currentFormValues = form.getFieldsValue();

      // Cập nhật formState với dữ liệu mới nhất từ bước cuối cùng
      setFormState((prevState) => ({
        ...prevState,
        ...currentFormValues,
      }));

      // Đợi state cập nhật
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Sử dụng formState đã được cập nhật
      console.log("Form values before validation:", formState);
      console.log("Current form values:", currentFormValues);
      console.log("Combined form values:", {
        ...formState,
        ...currentFormValues,
      });

      // Kết hợp dữ liệu từ tất cả các bước
      const combinedValues = {
        ...formState,
        ...currentFormValues,
      };

      // Kiểm tra các trường bắt buộc
      if (!combinedValues.name || !combinedValues.name.trim()) {
        message.error("Tên sản phẩm không được để trống");
        setCurrentStep(0);
        return;
      }

      if (!combinedValues.sku || !combinedValues.sku.trim()) {
        message.error("Mã SKU không được để trống");
        setCurrentStep(0);
        return;
      }

      if (
        !combinedValues.shortDescription ||
        !combinedValues.shortDescription.trim()
      ) {
        message.error("Mô tả ngắn không được để trống");
        setCurrentStep(0);
        return;
      }

      if (!combinedValues.description || !combinedValues.description.trim()) {
        message.error("Mô tả chi tiết không được để trống");
        setCurrentStep(0);
        return;
      }

      if (!combinedValues.price || combinedValues.price <= 0) {
        message.error("Giá sản phẩm phải lớn hơn 0");
        setCurrentStep(1);
        return;
      }

      if (combinedValues.stock === undefined || combinedValues.stock < 0) {
        message.error("Số lượng tồn kho không hợp lệ");
        setCurrentStep(1);
        return;
      }

      if (
        !combinedValues.categoryIds ||
        combinedValues.categoryIds.length === 0
      ) {
        message.error("Vui lòng chọn ít nhất một danh mục");
        setCurrentStep(2);
        return;
      }

      // Lấy tất cả giá trị form sau khi validate
      const allValues = combinedValues;

      console.log("All validations passed!");

      // Chuẩn bị dữ liệu sản phẩm để gửi đi
      console.log("Preparing product data with name:", allValues.name);
      console.log("All values to be used:", allValues);

      // Đảm bảo name là string trước khi gọi trim()
      const productName =
        typeof allValues.name === "string"
          ? allValues.name.trim()
          : String(allValues.name);
      console.log("Product name after processing:", productName);

      // Trước khi tạo productData, log ra giá trị của images và thumbnail
      console.log("Raw images value:", allValues.images);
      console.log("Raw thumbnail value:", allValues.thumbnail);

      // Xử lý images
      let processedImages = [];
      if (allValues.images && typeof allValues.images === "string") {
        if (allValues.images.includes(",")) {
          // Nhiều URL
          processedImages = allValues.images
            .split(",")
            .map((img: string) => img.trim())
            .filter((img: string) => img);
        } else {
          // URL đơn
          const singleUrl = allValues.images.trim();
          if (singleUrl) {
            processedImages = [singleUrl];
          }
        }
      }

      // Xử lý thumbnail
      let processedThumbnail = "";
      if (allValues.thumbnail && typeof allValues.thumbnail === "string") {
        processedThumbnail = allValues.thumbnail.trim();
      } else if (processedImages.length > 0) {
        processedThumbnail = processedImages[0];
      }

      console.log("Processed images:", processedImages);
      console.log("Processed thumbnail:", processedThumbnail);

      const productData = {
        name: productName,
        description:
          typeof allValues.description === "string"
            ? allValues.description.trim()
            : String(allValues.description),
        shortDescription:
          (typeof allValues.shortDescription === "string"
            ? allValues.shortDescription.trim()
            : String(allValues.shortDescription)) ||
          (typeof allValues.description === "string"
            ? allValues.description.substring(0, 200)
            : ""),
        price: Number(allValues.price),
        comparePrice: allValues.comparePrice
          ? Number(allValues.comparePrice)
          : undefined,
        stock: Number(allValues.stock),
        sku:
          typeof allValues.sku === "string"
            ? allValues.sku.trim()
            : String(allValues.sku),
        status: allValues.status || "active",
        categoryIds: allValues.categoryIds || [],
        images: processedImages,
        thumbnail: processedThumbnail,
        featured: Boolean(allValues.featured),
        searchKeywords:
          allValues.searchKeywords &&
          typeof allValues.searchKeywords === "string"
            ? allValues.searchKeywords
                .split(",")
                .map((kw: string) => kw.trim())
                .filter((kw) => kw)
            : [],
        seoTitle:
          allValues.seoTitle || (allValues.name ? allValues.name.trim() : ""),
        seoDescription: (() => {
          // Nếu seoDescription không phải là URL hình ảnh, sử dụng nó
          if (
            allValues.seoDescription &&
            !isImageUrl(allValues.seoDescription)
          ) {
            return allValues.seoDescription;
          }

          // Nếu không, sử dụng shortDescription hoặc cắt description
          if (allValues.shortDescription) {
            return allValues.shortDescription.trim();
          }

          if (allValues.description) {
            return allValues.description.substring(0, 160);
          }

          return "";
        })(),
        seoKeywords:
          allValues.seoKeywords && typeof allValues.seoKeywords === "string"
            ? allValues.seoKeywords
                .split(",")
                .map((kw: string) => kw.trim())
                .filter((kw) => kw)
            : [],
        attributes: attributes
          .filter((attr) => attr.name.trim() && attr.value.trim())
          .map((attr) => ({
            name: attr.name.trim(),
            value: attr.value.trim(),
          })),
        variants: variants
          .filter((variant) => variant.name.trim())
          .map((variant) => ({
            name: variant.name.trim(),
            price: Number(variant.price) || 0,
            stock: Number(variant.stock) || 0,
          })),
      };

      console.log("Product data to be sent:", productData); // Debug log
      await createProduct(productData).unwrap();
      message.success("Tạo sản phẩm thành công!");

      // Reset form
      form.resetFields();
      setAttributes([]);
      setVariants([]);
      setCurrentStep(0);

      onSuccess?.();
    } catch (error: any) {
      console.error("Failed to create product:", error);

      // Log chi tiết lỗi để debug
      if (error.errorFields) {
        console.log("Validation error fields:", error.errorFields);
        // Hiển thị lỗi cụ thể từ trường đầu tiên bị lỗi
        if (error.errorFields.length > 0) {
          const firstError = error.errorFields[0];
          message.error(
            `Lỗi ở trường ${firstError.name.join(".")}: ${firstError.errors.join(", ")}`
          );

          // Chuyển về bước tương ứng với trường lỗi
          if (
            firstError.name.includes("name") ||
            firstError.name.includes("sku") ||
            firstError.name.includes("description") ||
            firstError.name.includes("shortDescription")
          ) {
            setCurrentStep(0);
          } else if (
            firstError.name.includes("price") ||
            firstError.name.includes("stock")
          ) {
            setCurrentStep(1);
          } else if (firstError.name.includes("categoryIds")) {
            setCurrentStep(2);
          }
          return;
        }
      }

      // Nếu không phải lỗi validation, hiển thị thông báo chung
      message.error("Tạo sản phẩm thất bại. Vui lòng thử lại.");
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return (
          <div>
            <Card
              size="small"
              style={{ marginBottom: 16, backgroundColor: "#f0f9ff" }}
            >
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <InfoCircleOutlined
                  style={{ color: "#3b82f6", marginRight: 8, marginTop: 4 }}
                />
                <div>
                  <Text strong style={{ color: "#1e40af" }}>
                    Mẹo nhỏ
                  </Text>
                  <div style={{ color: "#3730a3", fontSize: "14px" }}>
                    Hãy đặt tên sản phẩm ngắn gọn, dễ nhớ và chứa từ khóa quan
                    trọng. Mô tả ngắn nên nêu bật lợi ích chính của sản phẩm.
                  </div>
                </div>
              </div>
            </Card>

            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name="name"
                  label="Tên sản phẩm"
                  rules={[
                    { required: true, message: "Vui lòng nhập tên sản phẩm" },
                  ]}
                >
                  <Input
                    placeholder="Nhập tên sản phẩm"
                    onChange={handleNameChange}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="sku"
                  label="Mã SKU"
                  rules={[{ required: true, message: "Vui lòng nhập mã SKU" }]}
                >
                  <Input placeholder="Nhập mã SKU" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="featured"
                  label="Sản phẩm nổi bật"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="shortDescription"
                  label="Mô tả ngắn"
                  rules={[
                    { required: true, message: "Vui lòng nhập mô tả ngắn" },
                  ]}
                >
                  <TextArea
                    rows={2}
                    placeholder="Nhập mô tả ngắn về sản phẩm"
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="description"
                  label="Mô tả chi tiết"
                  rules={[
                    { required: true, message: "Vui lòng nhập mô tả chi tiết" },
                  ]}
                >
                  <TextArea
                    rows={4}
                    placeholder="Nhập mô tả chi tiết về sản phẩm"
                    onChange={handleDescriptionChange}
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>
        );

      case 1: // Pricing
        return (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="price"
                label="Giá bán"
                rules={[
                  { required: true, message: "Vui lòng nhập giá bán" },
                  { type: "number", min: 0, message: "Giá phải lớn hơn 0" },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="0"
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
                  addonAfter="VND"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="comparePrice" label="Giá so sánh">
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="0"
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
                  addonAfter="VND"
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="stock"
                label="Số lượng tồn kho"
                rules={[
                  { required: true, message: "Vui lòng nhập số lượng tồn kho" },
                  { type: "number", min: 0, message: "Số lượng không được âm" },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="0"
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>
        );

      case 2: // Categories
        return (
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="categoryIds"
                label="Danh mục"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng chọn ít nhất một danh mục",
                  },
                ]}
              >
                <Select
                  mode="multiple"
                  placeholder="Chọn danh mục"
                  loading={isCategoriesLoading}
                  options={categories?.map((cat: any) => ({
                    value: cat.id,
                    label: cat.name,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="status" label="Trạng thái" initialValue="active">
                <Select options={statusOptions} />
              </Form.Item>
            </Col>
          </Row>
        );

      case 3: // Images
        return (
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="images"
                label="URL hình ảnh (phân cách bằng dấu phẩy)"
              >
                <TextArea
                  rows={3}
                  placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="thumbnail" label="URL hình đại diện">
                <Input placeholder="https://example.com/thumbnail.jpg" />
              </Form.Item>
            </Col>
          </Row>
        );

      case 4: // Attributes & Variants
        return (
          <div>
            <Title level={5}>Thuộc tính sản phẩm</Title>
            <Space
              direction="vertical"
              style={{ width: "100%", marginBottom: 24 }}
            >
              {attributes.map((attr) => (
                <Row key={attr.id} gutter={8} align="middle">
                  <Col span={10}>
                    <Input
                      placeholder="Tên thuộc tính"
                      value={attr.name}
                      onChange={(e) =>
                        updateAttribute(attr.id, "name", e.target.value)
                      }
                    />
                  </Col>
                  <Col span={10}>
                    <Input
                      placeholder="Giá trị"
                      value={attr.value}
                      onChange={(e) =>
                        updateAttribute(attr.id, "value", e.target.value)
                      }
                    />
                  </Col>
                  <Col span={4}>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeAttribute(attr.id)}
                    />
                  </Col>
                </Row>
              ))}
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={addAttribute}
              >
                Thêm thuộc tính
              </Button>
            </Space>

            <Divider />

            <Title level={5}>Biến thể sản phẩm</Title>
            <Space direction="vertical" style={{ width: "100%" }}>
              {variants.map((variant) => (
                <Row key={variant.id} gutter={8} align="middle">
                  <Col span={8}>
                    <Input
                      placeholder="Tên biến thể"
                      value={variant.name}
                      onChange={(e) =>
                        updateVariant(variant.id, "name", e.target.value)
                      }
                    />
                  </Col>
                  <Col span={6}>
                    <InputNumber
                      style={{ width: "100%" }}
                      placeholder="Giá"
                      value={variant.price}
                      onChange={(value) =>
                        updateVariant(variant.id, "price", value || 0)
                      }
                    />
                  </Col>
                  <Col span={6}>
                    <InputNumber
                      style={{ width: "100%" }}
                      placeholder="Kho"
                      value={variant.stock}
                      onChange={(value) =>
                        updateVariant(variant.id, "stock", value || 0)
                      }
                    />
                  </Col>
                  <Col span={4}>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeVariant(variant.id)}
                    />
                  </Col>
                </Row>
              ))}
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={addVariant}
              >
                Thêm biến thể
              </Button>
            </Space>
          </div>
        );

      case 5: // SEO
        return (
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="searchKeywords"
                label={
                  <Space>
                    Từ khóa tìm kiếm (phân cách bằng dấu phẩy)
                    <Button
                      type="link"
                      size="small"
                      icon={<BulbOutlined />}
                      onClick={handleGenerateKeywords}
                    >
                      Tự động tạo
                    </Button>
                  </Space>
                }
              >
                <Input placeholder="từ khóa 1, từ khóa 2, từ khóa 3" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="seoTitle" label="Tiêu đề SEO">
                <Input placeholder="Tiêu đề tối ưu cho SEO" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="seoDescription" label="Mô tả SEO">
                <TextArea
                  rows={3}
                  placeholder="Mô tả tối ưu cho SEO (tối đa 160 ký tự)"
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="seoKeywords"
                label="Từ khóa SEO (phân cách bằng dấu phẩy)"
              >
                <Input placeholder="seo keyword 1, seo keyword 2" />
              </Form.Item>
            </Col>
          </Row>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <Steps current={currentStep} size="small" style={{ marginBottom: 24 }}>
        {steps.map((step, index) => (
          <Step key={index} title={step.title} description={step.description} />
        ))}
      </Steps>

      <Form
        form={form}
        layout="vertical"
        style={{ minHeight: 400 }}
        initialValues={{
          status: "active",
          featured: false,
          searchKeywords: "",
          seoKeywords: "",
          images: "",
          thumbnail: "",
          stock: 0,
          price: 0,
        }}
        onValuesChange={(changedValues, allValues) => {
          console.log("Form values changed:", changedValues);
          console.log("All form values:", allValues);

          // Cập nhật formState khi giá trị form thay đổi
          setFormState((prevState) => ({
            ...prevState,
            ...changedValues,
          }));
        }}
        preserve={true}
      >
        {renderStepContent()}
      </Form>

      <div style={{ marginTop: 24, textAlign: "right" }}>
        <Space>
          {currentStep > 0 && <Button onClick={handlePrev}>Quay lại</Button>}
          {currentStep < steps.length - 1 && (
            <Button type="primary" onClick={handleNext}>
              Tiếp theo
            </Button>
          )}
          {currentStep === steps.length - 1 && (
            <Button type="primary" loading={isLoading} onClick={handleSubmit}>
              Tạo sản phẩm
            </Button>
          )}
        </Space>
      </div>
    </div>
  );
};

export default CreateProductWizardContent;
