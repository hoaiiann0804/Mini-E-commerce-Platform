import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Form,
  Card,
  Tabs,
  Divider,
  Typography,
  Row,
  Col,
  Button,
  message,
  Spin,
  Result,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";

// Custom hooks
import { useProductForm } from "@/hooks/useProductForm";
import { useProductAttributes } from "@/hooks/useProductAttributes";
import { useProductVariants } from "@/hooks/useProductVariants";

// API hooks
import { useGetProductByIdQuery } from "@/services/productApi";
import { useUpdateProductMutation } from "@/services/adminProductApi";
import { useGetAllCategoriesQuery } from "@/services/categoryApi";
import { useConvertBase64ToImageMutation } from "@/services/imageApi";

// Components
import ProductBasicInfoForm from "@/components/product/ProductBasicInfoForm";
import ProductPricingForm from "@/components/product/ProductPricingForm";
import ProductCategoryForm from "@/components/product/ProductCategoryForm";
import ProductImagesForm from "@/components/product/ProductImagesForm";
import ProductAttributesSection from "@/components/product/ProductAttributesSection";
import ProductVariantsSection from "@/components/product/ProductVariantsSection";
import ProductWarrantyForm from "@/components/product/ProductWarrantyForm";
import ProductSeoForm from "@/components/product/ProductSeoForm";
import ProductSpecificationsForm from "@/components/product/ProductSpecificationsForm";
import ValidationAlerts from "@/components/product/ValidationAlerts";
import FormActions from "@/components/product/FormActions";
import AttributeModal from "@/components/modals/AttributeModal";
import VariantModal from "@/components/modals/VariantModal";

// Types
import { ProductFormData, ProductAttribute, ProductVariant } from "@/types";

// Utils
import {
  processDescriptionImages,
  hasBase64Images,
} from "@/utils/descriptionImageProcessor";

const { Title, Text } = Typography;

const EditProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // API hooks
  const {
    data: productResponse,
    isLoading: isLoadingProduct,
    error: productError,
  } = useGetProductByIdQuery(id || "", { skip: !id });

  const { data: categoriesResponse, isLoading: isCategoriesLoading } =
    useGetAllCategoriesQuery();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [convertBase64ToImage] = useConvertBase64ToImageMutation();

  // Custom hooks
  const {
    attributes,
    setAttributes,
    attributeModalVisible,
    editingAttribute,
    handleAddAttribute,
    handleDeleteAttribute,
    openAttributeModal,
    closeAttributeModal,
  } = useProductAttributes();

  const {
    variants,
    setVariants,
    variantModalVisible,
    editingVariant,
    handleAddVariant,
    handleDeleteVariant,
    openVariantModal,
    closeVariantModal,
  } = useProductVariants([], form);

  // State for specifications
  const [specifications, setSpecifications] = useState<any[]>([]);

  const {
    isFormValid,
    setIsFormValid,
    activeTab,
    setActiveTab,
    validateForm,
    getMissingFields,
    fillExampleData,
    handleSubmit,
  } = useProductForm({
    form,
    isEditMode: true, // Thêm prop để báo là edit mode
    attributes,
    variants,
    onSubmit: async (values: ProductFormData) => {
      if (!id) return;

      try {
        // Lấy tất cả các giá trị từ form
        const formValues = form.getFieldsValue(true);
        // Lấy các trường đã được chạm vào (touched)
        const touchedFields = Object.keys(
          form.getFieldsValue(true, (meta) => meta.touched)
        );

        // Khởi tạo object chứa dữ liệu cần cập nhật
        const productData: any = { id };

        // Process description to convert base64 images if needed
        if (touchedFields.includes("description") && formValues.description) {
          let processedDescription = formValues.description;

          if (hasBase64Images(processedDescription)) {
            const result = await processDescriptionImages(
              processedDescription,
              {
                productId: id,
                category: "product",
                uploadImageFn: async ({ base64Data, options }) => {
                  return await convertBase64ToImage({
                    base64Data,
                    options,
                  }).unwrap();
                },
              }
            );

            if (result.hasChanges) {
              processedDescription = result.processedDescription;
            }
          }

          productData.description = processedDescription;
        }

        // Chỉ thêm các trường đã được chỉnh sửa vào productData
        touchedFields.forEach((key) => {
          // Skip description as it's already processed above
          if (key === "description") {
            return;
          } else if (key === "price" && formValues[key] !== undefined) {
            // For price, ensure it's a number and not a string with formatting
            let priceValue = formValues[key];

            // If it's already a number, use it directly
            if (typeof priceValue === 'number') {
              productData[key] = priceValue;
            }
            // If it's a string, clean it up and convert to number
            else if (typeof priceValue === 'string') {
              // Remove all non-numeric characters except decimal point and minus
              const cleanedValue = priceValue.replace(/[^\d.-]/g, '');
              const numericValue = parseFloat(cleanedValue);
              if (!isNaN(numericValue)) {
                productData[key] = numericValue;
              }
            }
          } else if (
            key === "compareAtPrice" &&
            formValues[key] !== undefined &&
            formValues[key] !== ''
          ) {
            // For compareAtPrice, ensure it's a number or null/undefined
            const value = formValues[key];
            if (typeof value === 'number') {
              productData["comparePrice"] = value > 0 ? value : null;
            } else if (typeof value === 'string' && value.trim() !== '') {
              const cleanedValue = value.replace(/[^\d.]/g, '');
              const numericValue = parseFloat(cleanedValue);
              if (!isNaN(numericValue) && numericValue > 0) {
                productData["comparePrice"] = numericValue;
              } else {
                productData["comparePrice"] = null;
              }
            }
          } else if (key === "stockQuantity" && formValues[key] !== undefined) {
            productData["stock"] = parseInt(formValues[key].toString()) || 0;
          } else if (key === "images" && formValues[key] !== undefined) {
            const processedImages =
              typeof formValues[key] === "string"
                ? formValues[key]
                  .split("\n")
                  .filter((img: string) => img.trim())
                : Array.isArray(formValues[key])
                  ? formValues[key]
                  : [];

            productData[key] = processedImages;
          } else if (
            key === "searchKeywords" &&
            formValues[key] !== undefined
          ) {
            productData[key] =
              typeof formValues[key] === "string"
                ? formValues[key]
                  .split(",")
                  .map((kw: string) => kw.trim())
                  .filter((kw) => kw.length > 0)
                : Array.isArray(formValues[key])
                  ? formValues[key]
                  : [];
          } else if (key === "seoKeywords" && formValues[key] !== undefined) {
            productData[key] =
              typeof formValues[key] === "string"
                ? formValues[key].split(",").map((kw: string) => kw.trim())
                : Array.isArray(formValues[key])
                  ? formValues[key]
                  : [];
          } else if (formValues[key] !== undefined) {
            productData[key] = formValues[key];
          }
        });

        // Always include warranty packages in edit mode to ensure sync
        const currentWarrantyPackageIds = formValues.warrantyPackageIds || [];
        productData.warrantyPackageIds = currentWarrantyPackageIds;

        // Always include comparePrice in edit mode to ensure it's saved
        if (formValues.compareAtPrice !== undefined) {
          const compareAtPrice = parseFloat(
            formValues.compareAtPrice.toString()
          );
          productData.compareAtPrice =
            compareAtPrice > 0 ? compareAtPrice : null;
          productData.comparePrice = compareAtPrice > 0 ? compareAtPrice : null;
        }

        // Kiểm tra xem attributes có thay đổi không
        const originalAttributes = productResponse?.data?.attributes || [];
        const attributesChanged =
          JSON.stringify(originalAttributes) !== JSON.stringify(attributes);

        // Chỉ thêm attributes vào request nếu chúng đã thay đổi
        if (attributesChanged) {
          productData.attributes = attributes.map((attr) => ({
            name: attr.name,
            value: attr.value,
          }));
        }

        // Kiểm tra xem variants có thay đổi không
        const originalVariants = productResponse?.data?.variants || [];
        const variantsChanged =
          JSON.stringify(originalVariants) !== JSON.stringify(variants);

        // Chỉ thêm variants vào request nếu chúng đã thay đổi
        if (variantsChanged) {
          productData.variants = variants.map((variant) => ({
            id: variant.id,
            name: variant.name,
            price: variant.price || 0,
            stock: variant.stock,
            sku:
              variant.sku ||
              `VAR-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            attributes: variant.attributes || {},
          }));
        }

        // Kiểm tra xem specifications có thay đổi không
        const originalSpecifications =
          productResponse?.data?.productSpecifications || [];
        const currentSpecifications = formValues.specifications || [];
        const specificationsChanged =
          JSON.stringify(originalSpecifications) !==
          JSON.stringify(currentSpecifications);

        // Chỉ thêm specifications vào request nếu chúng đã thay đổi
        if (specificationsChanged || touchedFields.includes("specifications")) {
          productData.specifications = currentSpecifications.map(
            (spec: any) => ({
              name: spec.name,
              value: spec.value,
              category: spec.category || "General",
            })
          );
        }

        await updateProduct(productData).unwrap();
        message.success("Cập nhật sản phẩm thành công!");
        navigate("/admin/products");
      } catch (error: any) {
        console.error("Failed to update product:", error);
        const errorMessage = formatErrorMessage(error);
        message.error(errorMessage);
      }
    },
    isSubmitting: isUpdating,
  });

  // State để theo dõi quá trình tải dữ liệu
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Load product data into form
  useEffect(() => {
    if (productResponse?.data) {
      const product = productResponse.data;

      // Process description to handle base64 images
      let processedDescription = product.description || "";

      // If description is a JSON string, parse it
      if (
        typeof processedDescription === "string" &&
        processedDescription.startsWith("[")
      ) {
        try {
          const parsedDescription = JSON.parse(processedDescription);
          if (Array.isArray(parsedDescription)) {
            processedDescription = parsedDescription.join("");
          }
        } catch (e) {
          // If parsing fails, use as is
        }
      }

      // Alternative: If description is empty but we have images array, try to construct from images
      if (
        !processedDescription &&
        product.images &&
        Array.isArray(product.images)
      ) {
        const imageElements = product.images
          .filter((img) => img.includes("data:image"))
          .map(
            (img) =>
              `<img src="${img}" alt="Product image" style="max-width: 100%; height: auto;" />`
          )
          .join("<br/>");

        if (imageElements) {
          processedDescription = imageElements;
        }
      }

      // Set form values
      form.setFieldsValue({
        name: product.name,
        description: processedDescription,
        shortDescription: product.shortDescription,
        price: parseFloat(product.price) || 0,
        compareAtPrice: parseFloat(product.compareAtPrice) || 0,
        stockQuantity: product.stockQuantity || 0,
        sku: product.sku,
        status: product.status,
        featured: product.featured,
        categoryIds: product.categories?.map((cat: any) => cat.id) || [],
        images: product.images?.join("\n") || "",
        thumbnail: product.thumbnail || "",
        searchKeywords: Array.isArray(product.searchKeywords)
          ? product.searchKeywords.join(", ")
          : product.searchKeywords || "",
        seoTitle: product.seoTitle || "",
        seoDescription: product.seoDescription || "",
        seoKeywords: product.seoKeywords || "",
        warrantyPackageIds:
          product.warrantyPackages?.map((wp: any) => wp.id) || [],
        specifications: (() => {
          // Load specifications from productSpecifications table
          if (
            product.productSpecifications &&
            Array.isArray(product.productSpecifications)
          ) {
            const specs = product.productSpecifications.map(
              (spec: any, index: number) => ({
                id: spec.id || `spec-${index}`,
                name: spec.name,
                value: spec.value,
                category: spec.category || "General",
              })
            );

            return specs;
          }
          return [];
        })(),
      });

      // Set specifications state
      if (
        product.productSpecifications &&
        product.productSpecifications.length > 0
      ) {
        setSpecifications(product.productSpecifications);
      }

      // Set attributes and variants
      if (product.attributes) {
        const formattedAttributes: ProductAttribute[] = product.attributes.map(
          (attr: any, index: number) => ({
            id: attr.id || `attr-${index}`,
            name: attr.name,
            // Nếu values là mảng, chuyển thành chuỗi ngăn cách bởi dấu phẩy
            value: Array.isArray(attr.values)
              ? attr.values.join(", ")
              : attr.value || "",
          })
        );
        setAttributes(formattedAttributes);
      }

      if (product.variants) {
        const formattedVariants: ProductVariant[] = product.variants.map(
          (variant: any, index: number) => ({
            id: variant.id || `var-${index}`,
            name: variant.name,
            price: parseFloat(variant.price) || 0,
            // Sử dụng stockQuantity thay vì stock để đúng với dữ liệu API
            stock: variant.stockQuantity || variant.stock || 0,
            sku: variant.sku || "",
            attributes: variant.attributes || {},
          })
        );
        setVariants(formattedVariants);
      }

      // Validate form after loading data - but don't include validateForm in dependencies
      setTimeout(() => {
        // Manually validate without using the validateForm function
        const values = form.getFieldsValue();
        const errors = form.getFieldsError();

        // Check if all required fields are filled
        const requiredFields = [
          "name",
          "shortDescription",
          "description",
          "price",
          "stockQuantity",
          "categoryIds",
        ];

        const isFieldsFilled = requiredFields.every((field) => {
          const value = values[field];
          if (field === "categoryIds") {
            return value && Array.isArray(value) && value.length > 0;
          }
          if (field === "price" || field === "stockQuantity") {
            return (
              value !== undefined &&
              value !== null &&
              value !== "" &&
              value >= 0
            );
          }
          return (
            value !== undefined &&
            value !== null &&
            value !== "" &&
            value.toString().trim() !== ""
          );
        });

        // Check if there are any validation errors
        const hasErrors = errors.some(
          (error) => error.errors && error.errors.length > 0
        );

        const isValid = isFieldsFilled && !hasErrors;
        setIsFormValid(isValid);
      }, 100);
    }
  }, [productResponse, form, setAttributes, setVariants, setIsFormValid]);

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

    return "Cập nhật sản phẩm thất bại. Vui lòng thử lại.";
  };

  const categories = categoriesResponse?.data || [];

  // Handle loading and error states
  if (isLoadingProduct) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <Spin size="large" tip="Đang tải thông tin sản phẩm..." />
      </div>
    );
  }

  if (productError || !id) {
    return (
      <Result
        status="error"
        title="Không thể tải thông tin sản phẩm"
        subTitle="Có lỗi xảy ra khi tải thông tin sản phẩm hoặc sản phẩm không tồn tại."
        extra={[
          <Button
            type="primary"
            key="back"
            onClick={() => navigate("/admin/products")}
          >
            Quay lại danh sách
          </Button>,
        ]}
      />
    );
  }

  const tabItems = [
    {
      key: "basic",
      label: "1. Thông tin cơ bản",
      children: <ProductBasicInfoForm fillExampleData={fillExampleData} />,
    },
    {
      key: "attributes",
      label: "2. Thuộc tính",
      children: (
        <ProductAttributesSection
          attributes={attributes}
          onAddAttribute={() => openAttributeModal()}
          onEditAttribute={(attribute) => openAttributeModal(attribute)}
          onDeleteAttribute={handleDeleteAttribute}
        />
      ),
    },
    {
      key: "variants",
      label: "3. Biến thể",
      children: (
        <ProductVariantsSection
          variants={variants}
          onAddVariant={() => openVariantModal()}
          onEditVariant={(variant) => openVariantModal(variant)}
          onDeleteVariant={handleDeleteVariant}
        />
      ),
    },
    {
      key: "specifications",
      label: "4. Thông số kỹ thuật",
      children: (
        <ProductSpecificationsForm initialSpecifications={specifications} />
      ),
    },
    {
      key: "pricing",
      label: "5. Giá & Kho hàng",
      children: <ProductPricingForm hasVariants={variants.length > 0} />,
    },
    {
      key: "category",
      label: "6. Phân loại",
      children: (
        <ProductCategoryForm
          categories={categories}
          isLoading={isCategoriesLoading}
        />
      ),
    },
    {
      key: "images",
      label: "7. Hình ảnh",
      children: <ProductImagesForm form={form} />,
    },
    {
      key: "warranty",
      label: "8. Bảo hành",
      children: <ProductWarrantyForm form={form} />,
    },
    {
      key: "seo",
      label: "9. SEO",
      children: <ProductSeoForm />,
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <Card style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              Chỉnh sửa sản phẩm
            </Title>
            <Text type="secondary">Cập nhật thông tin sản phẩm</Text>
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
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            style={{ minHeight: 400 }}
          />

          <Divider />

          <ValidationAlerts
            isFormValid={isFormValid}
            missingFields={getMissingFields()}
          />

          <FormActions
            isFormValid={isFormValid}
            isSubmitting={isUpdating}
            submitText="Cập nhật sản phẩm"
            loadingText="Đang cập nhật..."
            onCancel={() => navigate("/admin/products")}
          />
        </Form>
      </Card>

      {/* Modals */}
      {attributeModalVisible && (
        <AttributeModal
          visible={attributeModalVisible}
          onClose={closeAttributeModal}
          attribute={editingAttribute}
          onSave={handleAddAttribute}
        />
      )}

      {variantModalVisible && (
        <VariantModal
          visible={variantModalVisible}
          onClose={closeVariantModal}
          variant={editingVariant}
          onSave={handleAddVariant}
          attributes={attributes}
        />
      )}
    </div>
  );
};

export default EditProductPage;
