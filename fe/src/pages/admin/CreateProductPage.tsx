import { ArrowLeftOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  message,
  Row,
  Tabs,
  Typography,
} from "antd";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Custom hooks
import { useProductAttributes } from "@/hooks/useProductAttributes";
import { useProductForm } from "@/hooks/useProductForm";
import { useProductVariants } from "@/hooks/useProductVariants";

// API hooks
import { useCreateProductMutation } from "@/services/adminProductApi";
import { useGetAllCategoriesQuery } from "@/services/categoryApi";
import { useConvertBase64ToImageMutation } from "@/services/imageApi";
import { useGetWarrantyPackagesQuery } from "@/services/warrantyApi";

// Components
import AttributeModal from "@/components/modals/AttributeModal";
import VariantModal from "@/components/modals/VariantModal";
import ProductAttributesSection from "@/components/product/ProductAttributesSection";
import ProductBasicInfoForm from "@/components/product/ProductBasicInfoForm";
import ProductCategoryForm from "@/components/product/ProductCategoryForm";
import ProductImagesForm from "@/components/product/ProductImagesForm";
import ProductPricingForm from "@/components/product/ProductPricingForm";
import ProductSeoForm from "@/components/product/ProductSeoForm";
import ProductSpecificationsForm from "@/components/product/ProductSpecificationsForm";
import ProductVariantsSection from "@/components/product/ProductVariantsSection";
import ProductWarrantyForm from "@/components/product/ProductWarrantyForm";
import TabNavigation from "@/components/product/TabNavigation";
import ValidationAlerts from "@/components/product/ValidationAlerts";

// Types
import { AttributeGroup } from "@/services/attributeApi";
import { ProductFormData, ProductAttribute } from "@/types";

// Types for attribute modal conversion
interface Attribute {
  id?: string;
  name: string;
  value: string;
}

// Convert ProductAttribute (from hook) to Attribute (for modal)
const toAttribute = (
  productAttr: ProductAttribute | null | undefined
): Attribute | null => {
  if (!productAttr) return null;
  return {
    id: productAttr.id,
    name: productAttr.name,
    value: productAttr.value || productAttr.values.join(", "), // Use string version if available, otherwise convert from array
  };
};

// Convert Attribute (from modal) to ProductAttribute (for hook)
const toProductAttribute = (attr: Attribute): ProductAttribute => {
  return {
    id:
      attr.id ||
      `attr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    productId: "",
    name: attr.name,
    value: attr.value, // Store the string version for form/modal compatibility
    values: attr.value
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

// Convert ProductAttribute[] to Attribute[] for VariantModal
const toAttributeArray = (productAttrs: ProductAttribute[]): Attribute[] => {
  return productAttrs.map((attr) => ({
    id: attr.id,
    name: attr.name,
    value: attr.value || attr.values.join(", "), // Use string version if available, otherwise convert from array
  }));
};

// Utils
import {
  hasBase64Images,
  processDescriptionImages,
} from "@/utils/descriptionImageProcessor";

const { Title, Text } = Typography;

const CreateProductPage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // State để theo dõi các bước đã hoàn thành
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>(
    {
      basic: false,
      specifications: false,
      attributes: false,
      variants: false,
      pricing: false,
      category: false,
      images: false,
      warranty: false,
      seo: false,
    }
  );

  // State cho hierarchical attributes và variants
  const [attributeGroups, setAttributeGroups] = useState<AttributeGroup[]>([]);
  const [hierarchicalVariants, setHierarchicalVariants] = useState<any[]>([]);
  const [specifications, setSpecifications] = useState<any[]>([]);

  // API hooks
  const { data: categoriesResponse, isLoading: isCategoriesLoading } =
    useGetAllCategoriesQuery();
  const { isLoading: isWarrantyLoading } = useGetWarrantyPackagesQuery({
    isActive: true,
  });
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [convertBase64ToImage] = useConvertBase64ToImageMutation();

  const {
    attributes,
    attributeModalVisible,
    editingAttribute,
    handleAddAttribute,
    handleDeleteAttribute,
    openAttributeModal,
    closeAttributeModal,
  } = useProductAttributes();

  const {
    variants,
    variantModalVisible,
    editingVariant,
    handleAddVariant,
    handleDeleteVariant,
    openVariantModal,
    closeVariantModal,
  } = useProductVariants([], form);

  // Wrapper for opening attribute modal - convert ProductAttribute to Attribute
  const openAttributeModalWrapper = (attribute?: ProductAttribute) => {
    const converted = toAttribute(attribute);
    openAttributeModal(converted as any);
  };

  // Wrapper for handling attribute save - convert Attribute to ProductAttribute
  const handleAddAttributeWrapper = (attribute: Attribute) => {
    const converted = toProductAttribute(attribute);
    handleAddAttribute(converted);
  };

  // Wrapper for passing attributes to VariantModal - convert ProductAttribute[] to Attribute[]
  const variantModalAttributes = toAttributeArray(attributes);

  // Wrapper to convert ProductVariant to Variant for VariantModal
  const handleEditVariant = (variant: any) => {
    openVariantModal(variant);
  };

  // Debug: Log attributes whenever they change
  useEffect(() => {
    //console.log("Current attributes in CreateProductPage:", attributes);
  }, [attributes]);

  // Debug: Log variants whenever they change
  useEffect(() => {
    //console.log("Current variants in CreateProductPage:", variants);

    // Tự động set price = 0 khi có variants
    if (variants.length > 0) {
      form.setFieldValue("price", 0);
    }
  }, [variants, form]);

  // Set default values for form
  useEffect(() => {
    form.setFieldsValue({
      price: 0,
      stockQuantity: 0,
      status: "active",
      featured: false,
      categoryIds: [],
      specifications: [],
      warrantyPackageIds: [],
      seoKeywords: "",
      images: "",
      thumbnail: "",
      condition: "new",
    });
  }, [form]);

  // Custom hooks
  const {
    isFormValid,
    activeTab,
    setActiveTab,
    validateForm,
    getMissingFields,
    fillExampleData,
    handleSubmit,
  } = useProductForm({
    form,
    initialValues: {
      status: "active",
      featured: false,
      stockQuantity: 0,
      price: 0,
    },
    attributes,
    variants,
    onStepComplete: (step, isComplete) => {
      setCompletedSteps((prev) => ({
        ...prev,
        [step]: isComplete,
      }));
    },
    onSubmit: async (values: ProductFormData) => {
      try {
        // Lấy tất cả giá trị từ form để đảm bảo không bị thiếu
        const allFormValues = form.getFieldsValue();
        //console.log("Form values received:", values);
        //console.log("All form values:", allFormValues);

        const hasVariants = variants.length > 0;

        // Process description to convert base64 images to uploaded files
        let processedDescription =
          allFormValues.description || values.description || "";

        if (hasBase64Images(processedDescription)) {
          //console.log("Found base64 images in description, converting...");

          const result = await processDescriptionImages(processedDescription, {
            productId: undefined, // Will be set after product creation
            category: "product",
            uploadImageFn: async ({ base64Data, options }) => {
              return await convertBase64ToImage({
                base64Data,
                options,
              }).unwrap();
            },
          });

          if (result.hasChanges) {
            processedDescription = result.processedDescription;
            //console.log(
            //   `Converted ${result.uploadedImages.length} base64 images to uploaded files`
            // );
          }
        }

        const productData = {
          name: allFormValues.name || values.name,
          baseName:
            allFormValues.baseName ||
            values.baseName ||
            allFormValues.name ||
            values.name,
          shortDescription:
            allFormValues.shortDescription || values.shortDescription,
          description: processedDescription,
          // For variant products, set price to 0
          price: hasVariants
            ? 0
            : parseFloat(
                (allFormValues.price || values.price || "0").toString()
              ) || 0,
          comparePrice: (() => {
            const compareAtPrice =
              allFormValues.compareAtPrice || values.compareAtPrice;
            return compareAtPrice && parseFloat(compareAtPrice.toString()) > 0
              ? parseFloat(compareAtPrice.toString())
              : undefined;
          })(),
          compareAtPrice: (() => {
            const compareAtPrice =
              allFormValues.compareAtPrice || values.compareAtPrice;
            return compareAtPrice && parseFloat(compareAtPrice.toString()) > 0
              ? parseFloat(compareAtPrice.toString())
              : undefined;
          })(),
          // For variant products, set stock to 0
          stock: hasVariants
            ? 0
            : parseInt(
                (
                  allFormValues.stockQuantity ||
                  values.stockQuantity ||
                  "0"
                ).toString()
              ) || 0,
          stockQuantity: hasVariants
            ? 0
            : parseInt(
                (
                  allFormValues.stockQuantity ||
                  values.stockQuantity ||
                  "0"
                ).toString()
              ) || 0,
          sku: hasVariants
            ? undefined
            : allFormValues.sku || values.sku || `PROD-${Date.now()}`,
          status: allFormValues.status || values.status || "active",
          featured: allFormValues.featured || values.featured || false,
          categoryIds: allFormValues.categoryIds || values.categoryIds || [],
          images: (() => {
            const images = allFormValues.images || values.images;
            if (!images) return [];
            if (typeof images === "string") {
              return images
                .split("\n")
                .map((img) => img.trim())
                .filter((img) => img);
            }
            if (Array.isArray(images)) {
              return images;
            }
            return [];
          })(),
            thumbnail: (
            allFormValues.thumbnail ||
            values.thumbnail ||
            ""
          ).substring(0, 1000),
          // Additional fields
          condition: allFormValues.condition || values.condition || "new",
          inStock: hasVariants
            ? true
            : allFormValues.inStock !== undefined
              ? allFormValues.inStock
              : values.inStock !== undefined
                ? values.inStock
                : true,
          specifications: (() => {
            const specs = allFormValues.specifications || values.specifications;
            if (!specs) return [];
            if (Array.isArray(specs)) {
              return specs.map((spec) => ({
                name: spec.name || "",
                value: spec.value || "",
              }));
            }
            return [];
          })(),
          warrantyPackageIds:
            allFormValues.warrantyPackageIds || values.warrantyPackageIds || [],
          searchKeywords: (() => {
            const keywords =
              allFormValues.searchKeywords || values.searchKeywords;
            if (!keywords) return [];
            if (typeof keywords === "string") {
              return keywords
                .split(",")
                .map((kw) => kw.trim())
                .filter((kw) => kw.length > 0);
            }
            if (Array.isArray(keywords)) {
              return keywords;
            }
            return [];
          })(),
          attributes:
            attributes.length > 0
              ? attributes.map((attr) => ({
                  name: attr.name,
                  value: attr.values.join(", "), // Convert array to comma-separated string
                }))
              : [],
          variants: hasVariants
            ? variants.map((variant, index) => ({
                name: variant.name,
                variantName: variant.name,
                price: parseFloat(variant.price?.toString() || "0") || 0,
                compareAtPrice: variant.compareAtPrice
                  ? parseFloat(variant.compareAtPrice.toString())
                  : undefined,
                stockQuantity:
                  parseInt(variant.stockQuantity?.toString() || "0") || 0,
                stock: parseInt(variant.stockQuantity?.toString() || "0") || 0,
                sku: variant.sku || `VAR-${Date.now()}-${index + 1}`,
                isDefault: index === 0, // First variant is default
                isAvailable: true,
                attributes: variant.attributes || {},
                specifications: variant.specifications || {},
                images: variant.images || [],
              }))
            : [],
          // Thêm các trường SEO - chỉ thêm nếu có giá trị
          ...(allFormValues.seoTitle || values.seoTitle
            ? {
                seoTitle: (allFormValues.seoTitle || values.seoTitle).substring(
                  0,
                  500
                ),
              }
            : {}),
          ...(allFormValues.seoDescription || values.seoDescription
            ? {
                seoDescription:
                  allFormValues.seoDescription || values.seoDescription,
              }
            : {}),
          seoKeywords: (() => {
            const keywords = allFormValues.seoKeywords || values.seoKeywords;
            if (!keywords) return [];
            if (typeof keywords === "string") {
              return keywords
                .split(",")
                .map((kw) => kw.trim())
                .filter((kw) => kw);
            }
            if (Array.isArray(keywords)) {
              return keywords;
            }
            return [];
          })(),
        };

        //console.log("Sending product data to server:", productData);
        //console.log("Product data type check:", {
          // searchKeywords: {
          //   type: typeof productData.searchKeywords,
          //   isArray: Array.isArray(productData.searchKeywords),
          // },
          // seoKeywords: {
          //   type: typeof productData.seoKeywords,
          //   isArray: Array.isArray(productData.seoKeywords),
          // },
          // specifications: {
          //   type: typeof productData.specifications,
          //   isArray: Array.isArray(productData.specifications),
          // },
          // categoryIds: {
          //   type: typeof productData.categoryIds,
          //   isArray: Array.isArray(productData.categoryIds),
          // },
          // warrantyPackageIds: {
          //   type: typeof productData.warrantyPackageIds,
          //   isArray: Array.isArray(productData.warrantyPackageIds),
          // },
          // attributes: {
          //   type: typeof productData.attributes,
          //   isArray: Array.isArray(productData.attributes),
          // },
          // variants: {
          //   type: typeof productData.variants,
          //   isArray: Array.isArray(productData.variants),
          // },
          // images: {
          //   type: typeof productData.images,
          //   isArray: Array.isArray(productData.images),
          // },
          // thumbnail: {
          //   type: typeof productData.thumbnail,
          //   value: productData.thumbnail,
          // },
        // });
        await createProduct(productData).unwrap();
        message.success("Tạo sản phẩm thành công!");
        navigate("/admin/products");
      } catch (error: any) {
        console.error("Failed to create product:", error);
        const errorMessage = formatErrorMessage(error);
        message.error(errorMessage);
      }
    },
    isSubmitting: isCreating,
  });

  // Helper function to format error messages
  const formatErrorMessage = (error: any): string => {
    if (error?.data?.message) {
      return error.data.message;
    }

    if (error?.data?.errors && error.data.errors.length > 0) {
      if (error.data.errors.length === 1) {
        return (
          error.data.errors[0].message ||
          `${error.data.errors[0].field}: Lỗi validation`
        );
      }

      // Multiple errors - format nicely
      const errorList = error.data.errors
        .map((err: any) => err.message || `${err.field}: Lỗi validation`)
        .join("\n• ");
      return `Có ${error.data.errors.length} lỗi cần khắc phục:\n• ${errorList}`;
    }

    if (error?.message) {
      return error.message;
    }

    return "Tạo sản phẩm thất bại. Vui lòng thử lại.";
  };

  const categories = Array.isArray(categoriesResponse?.data)
    ? categoriesResponse.data
    : categoriesResponse?.data
      ? [categoriesResponse.data]
      : [];

  // Tab order constant
  const TAB_ORDER = [
    "basic",
    "specifications",
    "attributes",
    "variants",
    "pricing",
    "category",
    "images",
    "warranty",
    "seo",
  ];

  // Hàm kiểm tra xem tab có được phép truy cập không
  const isTabAccessible = (tabKey: string): boolean => {
    const targetIndex = TAB_ORDER.indexOf(tabKey);

    // Tab đầu tiên luôn có thể truy cập
    if (targetIndex === 0) return true;

    // Kiểm tra xem tất cả các tab trước đó đã hoàn thành chưa
    for (let i = 0; i < targetIndex; i++) {
      const stepKey = TAB_ORDER[i];
      if (!completedSteps[stepKey]) {
        return false;
      }
    }

    return true;
  };

  // Hàm xử lý khi thay đổi tab
  const handleTabChange = (key: string) => {
    if (!isTabAccessible(key)) {
      // Hiển thị thông báo nếu tab chưa được phép truy cập
      alert("Vui lòng hoàn thành các bước trước đó trước khi truy cập tab này");
      return;
    }
    setActiveTab(key);
  };

  const tabItems = [
    {
      key: "basic",
      label: (
        <span
          style={{
            color: completedSteps.basic
              ? "#52c41a"
              : isTabAccessible("basic")
                ? "#000"
                : "#999",
          }}
        >
          1. Thông tin cơ bản {completedSteps.basic ? "✓" : ""}
        </span>
      ),
      disabled: !isTabAccessible("basic"),
      children: (
        <>
          <ProductBasicInfoForm
            fillExampleData={fillExampleData}
            productId={undefined}
          />
          <TabNavigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            tabOrder={TAB_ORDER}
            completedSteps={completedSteps}
          />
        </>
      ),
    },
    {
      key: "specifications",
      label: (
        <span
          style={{
            color: completedSteps.specifications
              ? "#52c41a"
              : isTabAccessible("specifications")
                ? "#000"
                : "#999",
          }}
        >
          2. Thông số kỹ thuật <span style={{ color: "#ff4d4f" }}>*</span>{" "}
          {completedSteps.specifications ? "✓" : ""}
        </span>
      ),
      disabled: !isTabAccessible("specifications"),
      children: (
        <>
          <ProductSpecificationsForm initialSpecifications={[]} />
          <TabNavigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            tabOrder={TAB_ORDER}
            completedSteps={completedSteps}
          />
        </>
      ),
    },
    {
      key: "attributes",
      label: (
        <span
          style={{
            color: completedSteps.attributes
              ? "#52c41a"
              : isTabAccessible("attributes")
                ? "#000"
                : "#999",
          }}
        >
          3. Thuộc tính <span style={{ color: "#ff4d4f" }}>*</span>{" "}
          {completedSteps.attributes ? "✓" : ""}
        </span>
      ),
      disabled: !isTabAccessible("attributes"),
      children: (
        <>
          <ProductAttributesSection
            attributes={attributes}
            onAddAttribute={() => openAttributeModal()}
            onEditAttribute={(attribute) => openAttributeModal(attribute)}
            onDeleteAttribute={handleDeleteAttribute}
          />
          <TabNavigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            tabOrder={TAB_ORDER}
            completedSteps={completedSteps}
          />
        </>
      ),
    },
    {
      key: "variants",
      label: (
        <span
          style={{
            color: completedSteps.variants
              ? "#52c41a"
              : isTabAccessible("variants")
                ? "#000"
                : "#999",
          }}
        >
          4. Biến thể <span style={{ color: "#ff4d4f" }}>*</span>{" "}
          {completedSteps.variants ? "✓" : ""}
        </span>
      ),
      disabled: !isTabAccessible("variants"),
      children: (
        <>
          <ProductVariantsSection
            variants={variants}
            onAddVariant={() => openVariantModal()}
            onEditVariant={handleEditVariant}
            onDeleteVariant={handleDeleteVariant}
          />
          <TabNavigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            tabOrder={TAB_ORDER}
            completedSteps={completedSteps}
          />
        </>
      ),
    },
    {
      key: "pricing",
      label: (
        <span
          style={{
            color: completedSteps.pricing
              ? "#52c41a"
              : isTabAccessible("pricing")
                ? "#000"
                : "#999",
          }}
        >
          5. Giá & Kho hàng {completedSteps.pricing ? "✓" : ""}
        </span>
      ),
      disabled: !isTabAccessible("pricing"),
      children: (
        <>
          <ProductPricingForm hasVariants={variants.length > 0} />
          <TabNavigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            tabOrder={TAB_ORDER}
            completedSteps={completedSteps}
          />
        </>
      ),
    },
    {
      key: "category",
      label: (
        <span
          style={{
            color: completedSteps.category
              ? "#52c41a"
              : isTabAccessible("category")
                ? "#000"
                : "#999",
          }}
        >
          6. Phân loại {completedSteps.category ? "✓" : ""}
        </span>
      ),
      disabled: !isTabAccessible("category"),
      children: (
        <>
          <ProductCategoryForm
            categories={categories}
            isLoading={isCategoriesLoading}
          />
          <TabNavigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            tabOrder={TAB_ORDER}
            completedSteps={completedSteps}
          />
        </>
      ),
    },
    {
      key: "images",
      label: (
        <span
          style={{
            color: completedSteps.images
              ? "#52c41a"
              : isTabAccessible("images")
                ? "#000"
                : "#999",
          }}
        >
          7. Hình ảnh {completedSteps.images ? "✓" : ""}
        </span>
      ),
      disabled: !isTabAccessible("images"),
      children: (
        <>
          <ProductImagesForm form={form} />
          <TabNavigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            tabOrder={TAB_ORDER}
            completedSteps={completedSteps}
          />
        </>
      ),
    },
    {
      key: "warranty",
      label: (
        <span
          style={{
            color: completedSteps.warranty
              ? "#52c41a"
              : isTabAccessible("warranty")
                ? "#000"
                : "#999",
          }}
        >
          8. Bảo hành {completedSteps.warranty ? "✓" : ""}
        </span>
      ),
      disabled: !isTabAccessible("warranty"),
      children: (
        <>
          <ProductWarrantyForm form={form} />
          <TabNavigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            tabOrder={TAB_ORDER}
            completedSteps={completedSteps}
          />
        </>
      ),
    },
    {
      key: "seo",
      label: (
        <span
          style={{
            color: completedSteps.seo
              ? "#52c41a"
              : isTabAccessible("seo")
                ? "#000"
                : "#999",
          }}
        >
          9. SEO {completedSteps.seo ? "✓" : ""}
        </span>
      ),
      disabled: !isTabAccessible("seo"),
      children: (
        <>
          <ProductSeoForm />
          <TabNavigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            tabOrder={TAB_ORDER}
            completedSteps={completedSteps}
            isLastTab={true}
            onSubmit={handleSubmit}
            isSubmitting={isCreating}
            submitText="Tạo sản phẩm"
            loadingText="Đang tạo..."
          />
        </>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <Card style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              Tạo sản phẩm mới
            </Title>
            <Text type="secondary">
              Tạo sản phẩm mới với thông tin chi tiết
            </Text>
          </Col>
          <Col>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/admin/products")}
              style={{ marginRight: 8 }}
            >
              Quay lại
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Form */}
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onFieldsChange={validateForm}
          initialValues={{
            status: "active",
            featured: false,
            stockQuantity: 0,
            price: 0,
          }}
        >
          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            items={tabItems}
            style={{ minHeight: 400 }}
          />

          <Divider />

          <ValidationAlerts
            isFormValid={isFormValid}
            missingFields={getMissingFields()}
          />

          {/* FormActions bị ẩn vì button tạo sản phẩm đã được chuyển vào TabNavigation */}
        </Form>
      </Card>

      {/* Modals */}
      {attributeModalVisible && (
        <AttributeModal
          visible={attributeModalVisible}
          onClose={closeAttributeModal}
          attribute={toAttribute(editingAttribute)}
          onSave={handleAddAttributeWrapper}
        />
      )}

      {variantModalVisible && (
        <VariantModal
          visible={variantModalVisible}
          onClose={closeVariantModal}
          variant={editingVariant}
          onSave={handleAddVariant}
          attributes={variantModalAttributes as any}
        />
      )}
    </div>
  );
};

export default CreateProductPage;
