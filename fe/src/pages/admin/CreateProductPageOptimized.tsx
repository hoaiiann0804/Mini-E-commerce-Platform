import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateProductMutation } from "@/services/adminProductApi";
import { useGetCategoriesQuery } from "@/services/categoryApi";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Select from "@/components/common/Select";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  TagIcon,
  PhotoIcon,
  SwatchIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface ProductFormData {
  // Core fields
  name: string;
  baseName: string;
  description: string;
  shortDescription: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  thumbnail: string;

  // Stock & Status
  inStock: boolean;
  stockQuantity: number;
  sku: string;
  status: "active" | "inactive" | "draft";
  featured: boolean;
  condition: "new" | "like-new" | "used" | "refurbished";

  // Categories
  categoryIds: string[];

  // SEO
  searchKeywords: string[];
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];

  // Specifications
  specifications: Specification[];

  // Attributes & Variants
  isVariantProduct: boolean;
  parentAttributes: ParentAttribute[];
  variants: ProductVariant[];
}

interface Specification {
  id: string;
  name: string;
  value: string;
  category: string;
}

interface ParentAttribute {
  id: string;
  name: string;
  type: "color" | "size" | "material" | "custom";
  values: string[];
  required: boolean;
}

interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  stockQuantity: number;
  attributeValues: Record<string, string>;
  images: string[];
  isDefault: boolean;
  isAvailable: boolean;
}

const STEPS = [
  {
    id: "basic",
    title: "Thông tin cơ bản",
    icon: <DocumentTextIcon className="w-5 h-5" />,
    description: "Thông tin sản phẩm chính",
  },
  {
    id: "pricing",
    title: "Giá & Kho hàng",
    icon: <CurrencyDollarIcon className="w-5 h-5" />,
    description: "Giá bán và tồn kho",
  },
  {
    id: "categories",
    title: "Danh mục",
    icon: <TagIcon className="w-5 h-5" />,
    description: "Phân loại sản phẩm",
  },
  {
    id: "specifications",
    title: "Thông số kỹ thuật",
    icon: <SwatchIcon className="w-5 h-5" />,
    description: "Chi tiết kỹ thuật",
  },
  {
    id: "variants",
    title: "Biến thể",
    icon: <SwatchIcon className="w-5 h-5" />,
    description: "Thuộc tính và biến thể",
  },
  {
    id: "media",
    title: "Hình ảnh",
    icon: <PhotoIcon className="w-5 h-5" />,
    description: "Hình ảnh sản phẩm",
  },
  {
    id: "seo",
    title: "SEO",
    icon: <MagnifyingGlassIcon className="w-5 h-5" />,
    description: "Tối ưu hóa SEO",
  },
];

const SPEC_CATEGORIES = [
  "Bộ xử lý",
  "Bộ nhớ",
  "Màn hình",
  "Đồ họa",
  "Lưu trữ",
  "Kết nối",
  "Pin & Sạc",
  "Thiết kế",
  "Hệ điều hành",
  "Khác",
];

const CreateProductPageOptimized: React.FC = () => {
  const navigate = useNavigate();
  const [createProduct, { isLoading }] = useCreateProductMutation();
  const { data: categories, isLoading: isCategoriesLoading } =
    useGetCategoriesQuery();

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    baseName: "",
    description: "",
    shortDescription: "",
    price: 0,
    compareAtPrice: undefined,
    images: [],
    thumbnail: "",
    inStock: true,
    stockQuantity: 0,
    sku: "",
    status: "active",
    featured: false,
    condition: "new",
    categoryIds: [],
    searchKeywords: [],
    seoTitle: "",
    seoDescription: "",
    seoKeywords: [],
    specifications: [],
    isVariantProduct: false,
    parentAttributes: [],
    variants: [],
  });

  // Auto-fill fields
  useEffect(() => {
    if (formData.name && !formData.baseName) {
      setFormData((prev) => ({ ...prev, baseName: prev.name }));
    }
    if (formData.name && !formData.seoTitle) {
      setFormData((prev) => ({ ...prev, seoTitle: prev.name }));
    }
    if (formData.shortDescription && !formData.seoDescription) {
      setFormData((prev) => ({
        ...prev,
        seoDescription: prev.shortDescription,
      }));
    }
  }, [formData.name, formData.shortDescription]);

  // Validation
  const validateStep = (stepId: string): boolean => {
    const newErrors: Record<string, string> = {};

    switch (stepId) {
      case "basic":
        if (!formData.name.trim()) newErrors.name = "Tên sản phẩm bắt buộc";
        if (!formData.description.trim())
          newErrors.description = "Mô tả bắt buộc";
        if (!formData.shortDescription.trim())
          newErrors.shortDescription = "Mô tả ngắn bắt buộc";
        break;

      case "pricing":
        if (!formData.isVariantProduct) {
          if (formData.price <= 0) newErrors.price = "Giá phải lớn hơn 0";
          if (formData.stockQuantity < 0)
            newErrors.stockQuantity = "Tồn kho không được âm";
        }
        break;

      case "categories":
        if (formData.categoryIds.length === 0)
          newErrors.categoryIds = "Chọn ít nhất 1 danh mục";
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    const currentStepId = STEPS[currentStep].id;
    if (validateStep(currentStepId)) {
      setCompletedSteps((prev) => new Set(prev).add(currentStepId));
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(STEPS[currentStep].id)) return;

    try {
      const payload = {
        name: formData.name,
        baseName: formData.baseName || formData.name,
        description: formData.description,
        shortDescription: formData.shortDescription,
        price: formData.isVariantProduct ? 0 : formData.price,
        comparePrice: formData.isVariantProduct
          ? undefined
          : formData.compareAtPrice,
        images: formData.images,
        thumbnail: formData.thumbnail || formData.images[0],
        inStock: formData.isVariantProduct ? true : formData.inStock,
        stock: formData.isVariantProduct ? 0 : formData.stockQuantity,
        sku: formData.isVariantProduct ? undefined : formData.sku,
        status: formData.status,
        featured: formData.featured,
        condition: formData.condition,
        categoryIds: formData.categoryIds,
        searchKeywords: formData.searchKeywords,
        seoTitle: formData.seoTitle,
        seoDescription: formData.seoDescription,
        seoKeywords: formData.seoKeywords,
        specifications: formData.specifications.map((spec) => ({
          name: spec.name,
          value: spec.value,
          category: spec.category,
        })),
        isVariantProduct: formData.isVariantProduct,
        attributes: formData.parentAttributes.map((attr) => ({
          name: attr.name,
          value: attr.values.join(","),
        })),
        variants: formData.variants.map((variant) => ({
          name: variant.name,
          sku: variant.sku,
          price: variant.price,
          compareAtPrice: variant.compareAtPrice,
          stockQuantity: variant.stockQuantity,
          attributes: variant.attributeValues,
          images: variant.images,
          isDefault: variant.isDefault,
          isAvailable: variant.isAvailable,
        })),
      };

      await createProduct(payload).unwrap();
      navigate("/admin/products");
    } catch (error) {
      console.error("Error creating product:", error);
    }
  };

  // Specification handlers
  const addSpecification = (category: string = "Khác") => {
    const newSpec: Specification = {
      id: Date.now().toString(),
      name: "",
      value: "",
      category,
    };
    setFormData((prev) => ({
      ...prev,
      specifications: [...prev.specifications, newSpec],
    }));
  };

  const updateSpecification = (
    id: string,
    field: keyof Specification,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      specifications: prev.specifications.map((spec) =>
        spec.id === id ? { ...spec, [field]: value } : spec
      ),
    }));
  };

  const removeSpecification = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      specifications: prev.specifications.filter((spec) => spec.id !== id),
    }));
  };

  // Attribute handlers
  const addAttribute = () => {
    const newAttr: ParentAttribute = {
      id: Date.now().toString(),
      name: "",
      type: "custom",
      values: [],
      required: false,
    };
    setFormData((prev) => ({
      ...prev,
      parentAttributes: [...prev.parentAttributes, newAttr],
    }));
  };

  const updateAttribute = (
    id: string,
    field: keyof ParentAttribute,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      parentAttributes: prev.parentAttributes.map((attr) =>
        attr.id === id ? { ...attr, [field]: value } : attr
      ),
    }));
  };

  const removeAttribute = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      parentAttributes: prev.parentAttributes.filter((attr) => attr.id !== id),
    }));
  };

  // Variant handlers
  const generateVariants = () => {
    if (formData.parentAttributes.length === 0) return;

    const combinations = generateCombinations(formData.parentAttributes);
    const variants: ProductVariant[] = combinations.map((combo, index) => ({
      id: Date.now().toString() + index,
      name: Object.values(combo).join(" - "),
      sku: `${formData.sku || "PROD"}-${index + 1}`,
      price: formData.price,
      compareAtPrice: formData.compareAtPrice,
      stockQuantity: 0,
      attributeValues: combo,
      images: [],
      isDefault: index === 0,
      isAvailable: true,
    }));

    setFormData((prev) => ({ ...prev, variants }));
  };

  const generateCombinations = (
    attributes: ParentAttribute[]
  ): Record<string, string>[] => {
    if (attributes.length === 0) return [{}];

    const [first, ...rest] = attributes;
    const restCombinations = generateCombinations(rest);

    return first.values.flatMap((value) =>
      restCombinations.map((combo) => ({
        [first.name]: value,
        ...combo,
      }))
    );
  };

  const renderStepContent = () => {
    const step = STEPS[currentStep];

    switch (step.id) {
      case "basic":
        return (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Thông tin cơ bản
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Nhập thông tin chính của sản phẩm
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Tên sản phẩm <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Nhập tên sản phẩm"
                  error={errors.name}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Tên gốc (Base Name)
                </label>
                <Input
                  value={formData.baseName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      baseName: e.target.value,
                    }))
                  }
                  placeholder="Tên gốc cho biến thể"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Mô tả ngắn <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.shortDescription}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      shortDescription: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                  placeholder="Mô tả ngắn gọn về sản phẩm"
                />
                {errors.shortDescription && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.shortDescription}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Mô tả chi tiết <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                  placeholder="Mô tả chi tiết về sản phẩm"
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.description}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Tình trạng
                </label>
                <Select
                  value={formData.condition}
                  onChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      condition: value as "new" | "like-new" | "used" | "refurbished",
                    }))
                  }
                  options={[
                    { value: "new", label: "Mới" },
                    { value: "like-new", label: "Như mới" },
                    { value: "used", label: "Đã sử dụng" },
                    { value: "refurbished", label: "Tân trang" },
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Trạng thái
                </label>
                <Select
                  value={formData.status}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, status: value as "active" | "inactive" | "draft" }))
                  }
                  options={[
                    { value: "active", label: "Đang bán" },
                    { value: "inactive", label: "Tạm dừng" },
                    { value: "draft", label: "Bản nháp" },
                  ]}
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      featured: e.target.checked,
                    }))
                  }
                  className="mr-2"
                />
                Sản phẩm nổi bật
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isVariantProduct}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isVariantProduct: e.target.checked,
                    }))
                  }
                  className="mr-2"
                />
                Sản phẩm có biến thể
              </label>
            </div>
          </div>
        );

      case "pricing":
        return (
          <div className="space-y-6">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">
                Giá & Tồn kho
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                {formData.isVariantProduct
                  ? "Giá sẽ được thiết lập cho từng biến thể"
                  : "Thiết lập giá bán và số lượng tồn kho"}
              </p>
            </div>

            {!formData.isVariantProduct ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Giá bán <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        price: Number(e.target.value),
                      }))
                    }
                    placeholder="0"
                    error={errors.price}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Giá so sánh
                  </label>
                  <Input
                    type="number"
                    value={formData.compareAtPrice || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        compareAtPrice: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      }))
                    }
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Mã SKU
                  </label>
                  <Input
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, sku: e.target.value }))
                    }
                    placeholder="Mã sản phẩm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Số lượng tồn kho
                  </label>
                  <Input
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        stockQuantity: Number(e.target.value),
                      }))
                    }
                    placeholder="0"
                    error={errors.stockQuantity}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.inStock}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          inStock: e.target.checked,
                        }))
                      }
                      className="mr-2"
                    />
                    Còn hàng
                  </label>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex items-center">
                  <InformationCircleIcon className="w-5 h-5 text-yellow-600 mr-2" />
                  <p className="text-yellow-800 dark:text-yellow-200">
                    Giá và tồn kho sẽ được thiết lập cho từng biến thể ở bước
                    tiếp theo
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      case "categories":
        return (
          <div className="space-y-6">
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <h3 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                Danh mục sản phẩm
              </h3>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Chọn danh mục phù hợp cho sản phẩm
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Danh mục <span className="text-red-500">*</span>
              </label>
              <div className="border border-gray-300 dark:border-gray-600 rounded-md p-3 max-h-60 overflow-y-auto">
                {isCategoriesLoading ? (
                  <div className="text-center py-4">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {categories?.map((category) => (
                      <label key={category.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.categoryIds.includes(category.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData((prev) => ({
                                ...prev,
                                categoryIds: [...prev.categoryIds, category.id],
                              }));
                            } else {
                              setFormData((prev) => ({
                                ...prev,
                                categoryIds: prev.categoryIds.filter(
                                  (id) => id !== category.id
                                ),
                              }));
                            }
                          }}
                          className="mr-2"
                        />
                        {category.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {errors.categoryIds && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.categoryIds}
                </p>
              )}
            </div>

            {formData.categoryIds.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Danh mục đã chọn:</h4>
                <div className="flex flex-wrap gap-2">
                  {formData.categoryIds.map((categoryId) => {
                    const category = categories?.find(
                      (c) => c.id === categoryId
                    );
                    return category ? (
                      <span
                        key={categoryId}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      >
                        {category.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        );

      case "specifications":
        return (
          <div className="space-y-6">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <h3 className="font-medium text-indigo-900 dark:text-indigo-100 mb-2">
                Thông số kỹ thuật
              </h3>
              <p className="text-sm text-indigo-700 dark:text-indigo-300">
                Thêm thông số kỹ thuật chi tiết cho sản phẩm
              </p>
            </div>

            <div className="flex justify-between items-center">
              <h4 className="font-medium">Thông số kỹ thuật</h4>
              <div className="flex gap-2">
                {SPEC_CATEGORIES.map((category) => (
                  <Button
                    key={category}
                    variant="outline"
                    size="sm"
                    onClick={() => addSpecification(category)}
                  >
                    + {category}
                  </Button>
                ))}
              </div>
            </div>

            {formData.specifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <SwatchIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Chưa có thông số kỹ thuật</p>
                <Button
                  variant="outline"
                  onClick={() => addSpecification()}
                  className="mt-4"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Thêm thông số đầu tiên
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {SPEC_CATEGORIES.map((category) => {
                  const categorySpecs = formData.specifications.filter(
                    (spec) => spec.category === category
                  );
                  if (categorySpecs.length === 0) return null;

                  return (
                    <div
                      key={category}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <h5 className="font-medium mb-3 text-gray-900 dark:text-gray-100">
                        {category} ({categorySpecs.length})
                      </h5>
                      <div className="space-y-3">
                        {categorySpecs.map((spec) => (
                          <div key={spec.id} className="flex gap-3 items-start">
                            <div className="flex-1">
                              <Input
                                value={spec.name}
                                onChange={(e) =>
                                  updateSpecification(
                                    spec.id,
                                    "name",
                                    e.target.value
                                  )
                                }
                                placeholder="Tên thông số"
                              />
                            </div>
                            <div className="flex-1">
                              <Input
                                value={spec.value}
                                onChange={(e) =>
                                  updateSpecification(
                                    spec.id,
                                    "value",
                                    e.target.value
                                  )
                                }
                                placeholder="Giá trị"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSpecification(spec.id)}
                              className="text-red-500 hover:bg-red-50"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case "variants":
        return (
          <div className="space-y-6">
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <h3 className="font-medium text-orange-900 dark:text-orange-100 mb-2">
                Thuộc tính & Biến thể
              </h3>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                {formData.isVariantProduct
                  ? "Tạo thuộc tính và biến thể cho sản phẩm"
                  : "Chỉ áp dụng cho sản phẩm có biến thể"}
              </p>
            </div>

            {!formData.isVariantProduct ? (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-2" />
                  <p className="text-yellow-800 dark:text-yellow-200">
                    Sản phẩm này không sử dụng biến thể. Bạn có thể bỏ qua bước
                    này.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Parent Attributes */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium">Thuộc tính sản phẩm</h4>
                    <Button variant="outline" onClick={addAttribute}>
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Thêm thuộc tính
                    </Button>
                  </div>

                  {formData.parentAttributes.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                      <p>Chưa có thuộc tính nào</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.parentAttributes.map((attr) => (
                        <div
                          key={attr.id}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                Tên thuộc tính
                              </label>
                              <Input
                                value={attr.name}
                                onChange={(e) =>
                                  updateAttribute(
                                    attr.id,
                                    "name",
                                    e.target.value
                                  )
                                }
                                placeholder="Ví dụ: Màu sắc"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                Loại
                              </label>
                              <Select
                                value={attr.type}
                                onChange={(value) =>
                                  updateAttribute(attr.id, "type", value as "color" | "size" | "material" | "custom")
                                }
                                options={[
                                  { value: "color", label: "Màu sắc" },
                                  { value: "size", label: "Kích thước" },
                                  { value: "material", label: "Chất liệu" },
                                  { value: "custom", label: "Tuỳ chỉnh" },
                                ]}
                              />
                            </div>
                            <div className="flex items-end gap-2">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={attr.required}
                                  onChange={(e) =>
                                    updateAttribute(
                                      attr.id,
                                      "required",
                                      e.target.checked
                                    )
                                  }
                                  className="mr-2"
                                />
                                Bắt buộc
                              </label>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAttribute(attr.id)}
                                className="text-red-500 hover:bg-red-50"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Giá trị
                            </label>
                            <Input
                              value={attr.values.join(", ")}
                              onChange={(e) =>
                                updateAttribute(
                                  attr.id,
                                  "values",
                                  e.target.value.split(",").map((v) => v.trim())
                                )
                              }
                              placeholder="Nhập giá trị, cách nhau bởi dấu phẩy"
                            />
                          </div>
                        </div>
                      ))}

                      <div className="text-center">
                        <Button
                          variant="primary"
                          onClick={generateVariants}
                          disabled={formData.parentAttributes.length === 0}
                        >
                          Tạo biến thể
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Generated Variants */}
                {formData.variants.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-4">
                      Biến thể đã tạo ({formData.variants.length})
                    </h4>
                    <div className="space-y-4">
                      {formData.variants.map((variant) => (
                        <div
                          key={variant.id}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                Tên biến thể
                              </label>
                              <Input
                                value={variant.name}
                                onChange={(e) => {
                                  const newVariants = formData.variants.map(
                                    (v) =>
                                      v.id === variant.id
                                        ? { ...v, name: e.target.value }
                                        : v
                                  );
                                  setFormData((prev) => ({
                                    ...prev,
                                    variants: newVariants,
                                  }));
                                }}
                                placeholder="Tên biến thể"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                SKU
                              </label>
                              <Input
                                value={variant.sku}
                                onChange={(e) => {
                                  const newVariants = formData.variants.map(
                                    (v) =>
                                      v.id === variant.id
                                        ? { ...v, sku: e.target.value }
                                        : v
                                  );
                                  setFormData((prev) => ({
                                    ...prev,
                                    variants: newVariants,
                                  }));
                                }}
                                placeholder="SKU"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                Giá
                              </label>
                              <Input
                                type="number"
                                value={variant.price}
                                onChange={(e) => {
                                  const newVariants = formData.variants.map(
                                    (v) =>
                                      v.id === variant.id
                                        ? {
                                            ...v,
                                            price: Number(e.target.value),
                                          }
                                        : v
                                  );
                                  setFormData((prev) => ({
                                    ...prev,
                                    variants: newVariants,
                                  }));
                                }}
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                Tồn kho
                              </label>
                              <Input
                                type="number"
                                value={variant.stockQuantity}
                                onChange={(e) => {
                                  const newVariants = formData.variants.map(
                                    (v) =>
                                      v.id === variant.id
                                        ? {
                                            ...v,
                                            stockQuantity: Number(
                                              e.target.value
                                            ),
                                          }
                                        : v
                                  );
                                  setFormData((prev) => ({
                                    ...prev,
                                    variants: newVariants,
                                  }));
                                }}
                                placeholder="0"
                              />
                            </div>
                          </div>

                          <div className="mt-4 flex items-center gap-4">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={variant.isDefault}
                                onChange={(e) => {
                                  const newVariants = formData.variants.map(
                                    (v) =>
                                      v.id === variant.id
                                        ? { ...v, isDefault: e.target.checked }
                                        : v
                                  );
                                  setFormData((prev) => ({
                                    ...prev,
                                    variants: newVariants,
                                  }));
                                }}
                                className="mr-2"
                              />
                              Mặc định
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={variant.isAvailable}
                                onChange={(e) => {
                                  const newVariants = formData.variants.map(
                                    (v) =>
                                      v.id === variant.id
                                        ? {
                                            ...v,
                                            isAvailable: e.target.checked,
                                          }
                                        : v
                                  );
                                  setFormData((prev) => ({
                                    ...prev,
                                    variants: newVariants,
                                  }));
                                }}
                                className="mr-2"
                              />
                              Có sẵn
                            </label>
                          </div>

                          <div className="mt-3 text-sm text-gray-600">
                            <strong>Thuộc tính:</strong>{" "}
                            {Object.entries(variant.attributeValues)
                              .map(([key, value]) => `${key}: ${value}`)
                              .join(", ")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case "media":
        return (
          <div className="space-y-6">
            <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
              <h3 className="font-medium text-teal-900 dark:text-teal-100 mb-2">
                Hình ảnh sản phẩm
              </h3>
              <p className="text-sm text-teal-700 dark:text-teal-300">
                Thêm hình ảnh chất lượng cao cho sản phẩm
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                URLs hình ảnh
              </label>
              <textarea
                value={formData.images.join("\n")}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    images: e.target.value
                      .split("\n")
                      .filter((url) => url.trim()),
                  }))
                }
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                placeholder="Nhập URLs hình ảnh, mỗi dòng một URL"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Hình ảnh đại diện
              </label>
              <Input
                value={formData.thumbnail}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    thumbnail: e.target.value,
                  }))
                }
                placeholder="URL hình ảnh đại diện"
              />
            </div>

            {formData.images.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Xem trước hình ảnh</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.images.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://via.placeholder.com/200x200?text=Error";
                        }}
                      />
                      {formData.thumbnail === url && (
                        <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                          Đại diện
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case "seo":
        return (
          <div className="space-y-6">
            <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
              <h3 className="font-medium text-pink-900 dark:text-pink-100 mb-2">
                Tối ưu hóa SEO
              </h3>
              <p className="text-sm text-pink-700 dark:text-pink-300">
                Cải thiện khả năng tìm kiếm của sản phẩm
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Tiêu đề SEO
                </label>
                <Input
                  value={formData.seoTitle}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      seoTitle: e.target.value,
                    }))
                  }
                  placeholder="Tiêu đề tối ưu cho SEO"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Mô tả SEO
                </label>
                <textarea
                  value={formData.seoDescription}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      seoDescription: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                  placeholder="Mô tả ngắn gọn cho SEO"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Từ khóa SEO
                </label>
                <Input
                  value={formData.seoKeywords.join(", ")}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      seoKeywords: e.target.value
                        .split(",")
                        .map((k) => k.trim())
                        .filter((k) => k),
                    }))
                  }
                  placeholder="Từ khóa, cách nhau bởi dấu phẩy"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Từ khóa tìm kiếm
                </label>
                <Input
                  value={formData.searchKeywords.join(", ")}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      searchKeywords: e.target.value
                        .split(",")
                        .map((k) => k.trim())
                        .filter((k) => k),
                    }))
                  }
                  placeholder="Từ khóa tìm kiếm, cách nhau bởi dấu phẩy"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin/products")}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Tạo sản phẩm mới
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Thêm sản phẩm mới vào cửa hàng
            </p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  index === currentStep
                    ? "border-blue-500 bg-blue-500 text-white"
                    : completedSteps.has(step.id)
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-gray-300 bg-white text-gray-400"
                }`}
              >
                {completedSteps.has(step.id) ? (
                  <CheckCircleIcon className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <div className="ml-3 text-sm">
                <div className="font-medium text-gray-900 dark:text-white">
                  {step.title}
                </div>
                <div className="text-gray-500 dark:text-gray-400">
                  {step.description}
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div className="flex-1 mx-4 h-0.5 bg-gray-200 dark:bg-gray-700" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Quay lại
        </Button>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            Bước {currentStep + 1} / {STEPS.length}
          </span>

          {currentStep === STEPS.length - 1 ? (
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? <LoadingSpinner size="sm" /> : "Tạo sản phẩm"}
            </Button>
          ) : (
            <Button variant="primary" onClick={handleNext}>
              Tiếp theo
              <ArrowRightIcon className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateProductPageOptimized;
