import { PremiumButton } from "@/components/common";
import Badge from "@/components/common/Badge";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { Rating } from "@/components/common/Rating";
import ProductCard from "@/components/features/ProductCard";
import ProductReviews from "@/components/features/ProductReviews";
import WarrantySelection from "@/components/product/WarrantySelection";
import ProductVariantSelector from "@/components/product/ProductVariantSelector";
import DynamicProductTitle from "@/components/product/DynamicProductTitle";
import SimpleDynamicTitle from "@/components/product/SimpleDynamicTitle";
import ProductDetailsSection from "@/components/product/ProductDetailsSection";
import { useAddToWishlistMutation } from "@/services/wishlistApi";
import { productApi } from "@/services/productApi";
import { useGetWarrantyPackagesQuery } from "@/services/warrantyApi";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { Heart } from "lucide-react";

import { useMemo } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { RootState } from "@/store";
import { v4 as uuidv4 } from "uuid";
import { LeftOutlined, RightOutlined, EyeOutlined } from "@ant-design/icons";
import { Image, message } from "antd";

import { addItem, setServerCart } from "@/features/cart/cartSlice";
import { addNotification } from "@/features/ui/uiSlice";
import { useAddToCartMutation } from "@/services/cartApi";
import {
  getVariantStock,
  findVariantByAttributes,
  getAttributeValuesWithStock,
  areAllAttributesSelected,
  getVariantPrice,
  formatStockText,
  getStockStatusColor,
  hasVariants,
} from "@/utils/productHelpers";
import {
  setServerWishList,
  addItemWishlist,
  removeItemWishlist,
} from "@/features/wishlist/wishlistSlice";

const ProductDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { productId } = useParams<{ productId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Lấy thông tin đăng nhập từ Redux store
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  // Lấy danh sách sách wishlist từ redux store

  // Get skuId from URL params
  const skuId = searchParams.get("skuId") || undefined;

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, string>
  >({});
  const [selectedWarranties, setSelectedWarranties] = useState<string[]>([]);
  const [dynamicProductName, setDynamicProductName] = useState<string>("");
  const [mappedAttributes, setMappedAttributes] = useState<
    Record<string, string>
  >({});

  // API hooks
  const {
    data: productData,
    isLoading,
    error,
    refetch,
  } = productApi.useGetProductByIdQuery(
    { id: productId || "", skuId },
    {
      skip: !productId,
    }
  );

  const [addToCart, { isLoading: isAddingToCart }] = useAddToCartMutation();
  const [addtoWishList, { isLoading: isAddingtoWishList }] =
    useAddToWishlistMutation();
  const { data: relatedProductsData } = productApi.useGetRelatedProductsQuery(
    productData?.data?.id || "",
    {
      skip: !productData?.data?.id,
    }
  );

  const product = productData?.data;
  const relatedProducts = relatedProductsData?.data || [];
  const warrantyPackages = product?.warrantyPackages || [];
  const wishlist = useSelector((state: RootState) => state.wishlist.items);
  const isWishlisted = useMemo(
    () => wishlist.some((items) => items.productId === product?.id),
    [wishlist, product]
  );
  useEffect(() => {
    if (error) {
      navigate("/404");
    }
  }, [error, navigate]);

  // Auto-select first variant when product loads
  useEffect(() => {
    // console.log("Product: ", product);
    // console.log("Selected", selectedAttributes);
    if (product && product.attributes && product.attributes.length > 0) {
      const firstAttribute = product.attributes[0];
      if (firstAttribute.values && firstAttribute.values.length > 0) {
        const firstValue = firstAttribute.values[0];

        // Only auto-select if nothing is selected yet
        if (Object.keys(selectedAttributes).length === 0) {
          const initialAttributes = { [firstAttribute.name]: firstValue };
          setSelectedAttributes(initialAttributes);
          setMappedAttributes(initialAttributes);
          // console.log("MappedAttributes", initialAttributes);
        }
      }
    }
  }, [product]);

  // Set default warranty
  useEffect(() => {
    // Khởi tạo mảng rỗng để không chọn gói bảo hành nào mặc định
    setSelectedWarranties([]);
  }, [warrantyPackages]);

  // Handle quantity change
  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 99)) {
      // console.log("Qantity", newQuantity);
      setQuantity(newQuantity);
    }
  };

  // Handle image navigation
  const handlePrevImage = () => {
    if (!product?.images.length) return;
    setSelectedImage((prev) =>
      prev === 0 ? product.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    // if the product doesn't exist or has no images, stop and don't do anything
    if (!product?.images.length) return;
    // is the  product has images, move to the next image
    setSelectedImage((prev) =>
      //if it's the last image, start again from the first one
      prev === product.images.length - 1 ? 0 : prev + 1
    );
  };

  // Handle attribute selection with toggle functionality
  const handleAttributeChange = (name: string, value: string) => {
    // console.log("handleAttributeChange, name:", name, "value:", value); // name: CPU value: AMD Ryzen 5 PRO 6650U
    // console.log("mappedAttributes trước:", mappedAttributes); // {CPU: 'AMD Ryzen 5 PRO 6650U'}
    //
    setSelectedAttributes((prev) => {
      const newAttributes = { ...prev };

      // If clicking on the same value, unselect it
      if (newAttributes[name] === value) {
        delete newAttributes[name];
      } else {
        // Otherwise, select the new value
        newAttributes[name] = value;
      }

      // Directly use the selected attributes for title generation
      // No need for complex mapping - just pass the selected values as-is
      setMappedAttributes(newAttributes);

      return newAttributes;
    });

    // Reset quantity to 1 when changing attributes
    setQuantity(1);
    // console.log(quantity);
  };

  const handleDynamicNameUpdate = (newName: string, details: any) => {
    setDynamicProductName(newName);
  };

  // Handle warranty selection
  const handleWarrantyChange = (packageIds: string[]) => {
    setSelectedWarranties(packageIds);
  };

  // Handle variant selection
  const handleVariantChange = (variantId: string) => {
    // Update URL with new skuId
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("skuId", variantId);
    setSearchParams(newSearchParams);

    // Reset quantity and image selection
    setQuantity(1);
    setSelectedImage(0);

    // Refetch product data with new variant
    refetch();
  };

  // Add to cart
  const handleAddToCart = async () => {
    if (!product) return <LoadingSpinner />;

    // For variant products, use current variant
    let variantId: string | undefined;
    let availableStock: number;

    if (product.isVariantProduct && product.currentVariant) {
      // Use current variant from API response
      variantId = product.currentVariant.id;
      availableStock = product.currentVariant.stockQuantity;
    } else {
      // Legacy attribute-based variant selection
      if (product.attributes && product.attributes.length > 0) {
        const allSelected = areAllAttributesSelected(
          product.attributes,
          selectedAttributes
        );
        if (!allSelected) {
          const missingAttributes = product.attributes
            .filter((attr) => !selectedAttributes[attr.name])
            .map((attr) => attr.name);

          dispatch(
            addNotification({
              type: "error",
              message: `Vui lòng chọn: ${missingAttributes.join(", ")}`,
            })
          );
          return;
        }
      }

      // Check stock availability for legacy products
      availableStock = getVariantStock(product, selectedAttributes);

      if (hasVariants(product) && Object.keys(selectedAttributes).length > 0) {
        const selectedVariant = findVariantByAttributes(
          product.variants!,
          selectedAttributes
        );
        variantId = selectedVariant?.id;
      }
    }

    // Check stock availability
    if (availableStock === 0) {
      dispatch(
        addNotification({
          type: "error",
          message: "Sản phẩm này đã hết hàng",
        })
      );
      return;
    }

    if (quantity > availableStock) {
      dispatch(
        addNotification({
          type: "error",
          message: `Chỉ còn ${availableStock} sản phẩm trong kho`,
        })
      );
      return;
    }

    console.log("🔐 isAuthenticated trong handleAddToCart:", isAuthenticated);

    if (isAuthenticated) {
      // Nếu đã đăng nhập, sử dụng API
      try {
        // console.log("🚀 Đã đăng nhập, gọi API để thêm vào giỏ hàng:", {
        //   productId: product.id,
        //   variantId,
        //   quantity,
        // });

        const serverCart = await addToCart({
          productId: product.id,
          variantId,
          quantity,
          warrantyPackageIds: selectedWarranties,
        }).unwrap();

        console.log("✅ API success, server cart:", serverCart);

        // Update Redux store with server response
        dispatch(setServerCart(serverCart));

        dispatch(
          addNotification({
            message: `${product.name} đã được thêm vào giỏ hàng`,
            type: "success",
            duration: 3000,
          })
        );
      } catch (error: any) {
        console.error("❌ API thất bại:", error);

        // Fallback to localStorage if API fails
        const newItem = {
          id: uuidv4(),
          productId: product.id,
          name: product.name,
          price: getVariantPrice(product, selectedAttributes),
          quantity,
          image: product.thumbnail,
          variantId,
          attributes:
            Object.keys(selectedAttributes).length > 0
              ? selectedAttributes
              : undefined,
          warrantyPackageIds: selectedWarranties,
        };

        dispatch(addItem(newItem));

        dispatch(
          addNotification({
            message:
              error?.data?.message ||
              `${product.name} đã được thêm vào giỏ hàng (offline)`,
            type: error?.data?.message ? "error" : "success",
            duration: 3000,
          })
        );
      }
    } else {
      // Nếu chưa đăng nhập, KHÔNG gọi API, chỉ lưu vào localStorage
      console.log("🔐 Chưa đăng nhập, chỉ lưu vào localStorage");

      const newItem = {
        id: uuidv4(),
        productId: product.id,
        name: product.name,
        price: getVariantPrice(product, selectedAttributes),
        quantity,
        image: product.thumbnail,
        variantId,
        attributes:
          Object.keys(selectedAttributes).length > 0
            ? selectedAttributes
            : undefined,
        warrantyPackageIds: selectedWarranties,
      };

      // Chỉ thêm vào Redux store, cartSlice sẽ tự động cập nhật localStorage
      dispatch(addItem(newItem));

      // Debug: Check if localStorage was updated
      console.log(
        "🔍 localStorage after add:",
        localStorage.getItem("cartItems")
      );

      dispatch(
        addNotification({
          message: `${product.name} đã được thêm vào giỏ hàng`,
          type: "success",
          duration: 3000,
        })
      );
    }
  };
  const handletoWishList = async () => {
    if (!product) return;

    if (isAuthenticated) {
      // For authenticated users, always call the API since it acts as a toggle
      try {
        const response = await addtoWishList({
          productId: product.id,
        }).unwrap();
        console.log("✅ API success, server wishlist:", response);
        // Update Redux store with server response
        dispatch(setServerWishList(response));
        // Show notification based on API response message
        dispatch(
          addNotification({
            type: response.message?.includes("đã có trong danh sách yêu thích")
              ? "info"
              : "success",
            message:
              response.message || `${product.name} đã được thêm vào yêu thích`,
            duration: 3000,
          })
        );
      } catch (err: any) {
        console.error("❌ API thất bại", err);
        // Fallback to local state management
        const newItem = {
          id: uuidv4(),
          productId: product.id,
          name: product.name,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          thumbnail: product.thumbnail,
          slug: product.slug,
        };
        dispatch(addItemWishlist(newItem));
        dispatch(
          addNotification({
            message: "Không thể thêm vào danh sách yêu thích, đã lưu cục bộ",
            type: "error",
            duration: 3000,
          })
        );
      }
    } else {
      // For unauthenticated users, use local state management
      if (isWishlisted) {
        dispatch(removeItemWishlist({ productId: product.id } as any));
        dispatch(
          addNotification({
            message: `${product.name} đã được xóa khỏi yêu thích`,
            type: "success",
            duration: 3000,
          })
        );
      } else {
        const newItem = {
          id: uuidv4(),
          productId: product.id,
          name: product.name,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          thumbnail: product.thumbnail,
          slug: product.slug,
        };
        dispatch(addItemWishlist(newItem));
        dispatch(
          addNotification({
            message: `${product.name} đã được thêm vào yêu thích (offline)`,
            type: "success",
            duration: 3000,
          })
        );
      }
    }
  };

  // Buy now
  const handleBuyNow = async () => {
    try {
      if (!product) return;

      // Tìm variant ID dựa trên thuộc tính đã chọn
      let variantId: string | undefined;
      if (product.variants && Object.keys(selectedAttributes).length > 0) {
        const selectedVariant = product.variants.find((variant) => {
          if (!variant.attributes) return false;
          return Object.entries(selectedAttributes).every(
            ([key, value]) => variant.attributes[key] === value
          );
        });
        variantId = selectedVariant?.id;
      }

      // Thêm sản phẩm vào giỏ hàng và đợi hoàn thành
      if (isAuthenticated) {
        // Nếu đã đăng nhập, sử dụng API
        await addToCart({
          productId: product.id,
          variantId: variantId,
          quantity,
          warrantyPackageIds: selectedWarranties,
        }).unwrap();
      } else {
        // Nếu chưa đăng nhập, thêm vào local cart
        dispatch(
          addItem({
            id: uuidv4(),
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity,
            image: product.thumbnail,
            attributes:
              Object.keys(selectedAttributes).length > 0
                ? selectedAttributes
                : undefined,
            warrantyPackageIds: selectedWarranties,
          })
        );
      }

      // Thông báo thành công
      dispatch(
        addNotification({
          message: `${product.name} đã được thêm vào giỏ hàng`,
          type: "success",
          duration: 3000,
        })
      );

      // Tạo một đối tượng chứa thông tin sản phẩm để mua ngay
      const buyNowItem = {
        id: uuidv4(),
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity,
        image: product.thumbnail,
        attributes:
          Object.keys(selectedAttributes).length > 0
            ? selectedAttributes
            : undefined,
        warrantyPackageIds: selectedWarranties,
      };

      // Lưu thông tin sản phẩm vào sessionStorage
      sessionStorage.setItem("buyNowItem", JSON.stringify(buyNowItem));
      sessionStorage.setItem("buyNowAction", "true");

      // Đảm bảo localStorage được cập nhật ngay lập tức nếu không đăng nhập
      if (!isAuthenticated) {
        // Lưu giỏ hàng vào localStorage ngay lập tức
        const cartItems = JSON.parse(localStorage.getItem("cartItems") || "[]");

        // Kiểm tra xem sản phẩm đã tồn tại trong giỏ hàng chưa
        const existingItemIndex = cartItems.findIndex(
          (item: any) =>
            item.productId === product.id &&
            JSON.stringify(item.attributes || {}) ===
              JSON.stringify(selectedAttributes || {})
        );

        if (existingItemIndex >= 0) {
          // Nếu sản phẩm đã tồn tại, cập nhật số lượng
          cartItems[existingItemIndex].quantity += quantity;
        } else {
          // Nếu sản phẩm chưa tồn tại, thêm mới
          cartItems.push(buyNowItem);
        }

        // Lưu giỏ hàng vào localStorage
        localStorage.setItem("cartItems", JSON.stringify(cartItems));
      }

      // Chuyển hướng ngay lập tức, không cần setTimeout
      navigate("/checkout?buyNow=true");
    } catch (error: any) {
      console.error("Error buying now:", error);
      dispatch(
        addNotification({
          message:
            error?.data?.message || "Có lỗi xảy ra khi thêm vào giỏ hàng",
          type: "error",
          duration: 3000,
        })
      );
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-4">
          Product Not Found
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mb-8">
          The product you're looking for doesn't exist or has been removed.
        </p>
        <PremiumButton
          variant="primary"
          size="large"
          iconType="arrow-right"
          onClick={() => navigate("/shop")}
        >
          Continue Shopping
        </PremiumButton>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="mb-8">
        <ol className="flex text-sm">
          <li className="flex items-center">
            <Link
              to="/"
              className="text-neutral-500 dark:text-neutral-400 hover:text-primary-500 dark:hover:text-primary-400"
            >
              Home
            </Link>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mx-2 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </li>
          <li className="flex items-center">
            <Link
              to={`/categories/${product.categoryId}`}
              className="text-neutral-500 dark:text-neutral-400 hover:text-primary-500 dark:hover:text-primary-400"
            >
              {product.categoryName}
            </Link>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mx-2 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </li>
          <li className="text-neutral-800 dark:text-neutral-200 truncate">
            {product.name}
          </li>
        </ol>
      </nav>

      {/* Product details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {/* Product images */}
        <div>
          <div className="relative mb-4">
            {/* Main image container with white background */}
            <div className="relative bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden group">
              <div className="aspect-square flex justify-center items-center p-6">
                <Image
                  src={product.images[selectedImage] || product.thumbnail}
                  alt={product.name}
                  className="max-w-full max-h-[500px] object-contain cursor-pointer transition-transform duration-300 group-hover:scale-105"
                  preview={{
                    mask: (
                      <div className="flex items-center justify-center">
                        <EyeOutlined className="text-white text-xl mr-2" />
                        <span className="text-white">Xem ảnh</span>
                      </div>
                    ),
                    src: product.images[selectedImage] || product.thumbnail,
                  }}
                />
              </div>

              {/* Navigation buttons */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110 border border-gray-200"
                    aria-label="Previous image"
                  >
                    <LeftOutlined className="text-lg text-gray-700" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110 border border-gray-200"
                    aria-label="Next image"
                  >
                    <RightOutlined className="text-lg text-gray-700" />
                  </button>
                </>
              )}

              {/* Image counter */}
              {product.images.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                  {selectedImage + 1} / {product.images.length}
                </div>
              )}
            </div>
          </div>

          {/* Thumbnail gallery */}
          {product.images.length > 1 && (
            <div className="grid grid-cols-5 gap-3">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-105 ${
                    selectedImage === index
                      ? "border-primary-500 shadow-lg ring-2 ring-primary-200"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedImage(index)}
                >
                  <div className="bg-white w-full h-full flex items-center justify-center p-2">
                    <img
                      src={image}
                      alt={`${product.name} - Image ${index + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {selectedImage === index && (
                    <div className="absolute inset-0 bg-primary-500/10 flex items-center justify-center">
                      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div>
          <div className="mb-6">
            {/* Simple Dynamic Product Title */}
            <SimpleDynamicTitle
              baseName={product.baseName || product.name}
              selectedAttributes={mappedAttributes}
              level={1}
              style={{ marginBottom: 8 }}
            />

            {/* Price */}
            <div className="flex items-center mb-4">
              {(() => {
                // Use current variant price if available, otherwise fallback to legacy logic
                let currentPrice: number;
                let comparePrice: number | null = null;

                if (product.isVariantProduct && product.currentVariant) {
                  currentPrice = product.currentVariant.price;
                  comparePrice = product.currentVariant.compareAtPrice || null;
                } else {
                  currentPrice = getVariantPrice(product, selectedAttributes);
                  comparePrice = product.compareAtPrice || null;
                }

                return (
                  <>
                    <span className="text-2xl font-bold text-neutral-900 dark:text-white">
                      {parseFloat(currentPrice.toString()).toLocaleString(
                        "vi-VN"
                      )}
                      đ
                    </span>

                    {comparePrice && comparePrice > currentPrice && (
                      <span className="ml-3 text-lg text-neutral-500 dark:text-neutral-400 line-through">
                        {parseFloat(comparePrice.toString()).toLocaleString(
                          "vi-VN"
                        )}
                        đ
                      </span>
                    )}

                    {comparePrice && comparePrice > currentPrice && (
                      <Badge variant="secondary" className="ml-3">
                        {Math.round(
                          ((comparePrice - currentPrice) / comparePrice) * 100
                        )}
                        % OFF
                      </Badge>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Ratings */}
            {product.ratings && (
              <div className="flex items-center mb-4">
                <Rating
                  value={product.ratings.average}
                  showCount={true}
                  count={product.ratings.count}
                />
                <Link
                  to="#reviews"
                  className="ml-2 text-sm text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  Xem đánh giá
                </Link>
              </div>
            )}

            {/* Stock status */}
            <div className="mb-4">
              {(() => {
                // Use current variant stock if available, otherwise fallback to legacy logic
                let availableStock: number;

                if (product.isVariantProduct && product.currentVariant) {
                  availableStock = product.currentVariant.stockQuantity;
                } else {
                  availableStock = getVariantStock(product, selectedAttributes);
                }

                const stockText = formatStockText(availableStock);
                const stockColor = getStockStatusColor(availableStock);

                return (
                  <div className="flex items-center gap-2">
                    <Badge variant={availableStock > 0 ? "success" : "error"}>
                      {availableStock > 0 ? "Còn hàng" : "Hết hàng"}
                    </Badge>
                    <span className={`text-sm font-medium ${stockColor}`}>
                      {stockText}
                    </span>
                    {product.isVariantProduct && product.currentVariant && (
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        SKU: {product.currentVariant.sku}
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Short description */}
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              {product.shortDescription ||
                product.description.substring(0, 150) + "..."}
            </p>
          </div>

          {/* Product Variant Selector */}
          {product.isVariantProduct && (
            <div className="mb-6">
              <ProductVariantSelector
                product={product}
                selectedVariantId={skuId}
                onVariantChange={handleVariantChange}
              />
            </div>
          )}

          {/* Dynamic Attributes Selector */}
          {product.attributes && product.attributes.length > 0 && (
            <div className="mb-6">
              {product.attributes.map((attribute) => {
                const attributeValuesWithStock = getAttributeValuesWithStock(
                  product,
                  attribute.name,
                  selectedAttributes
                );

                return (
                  <div key={attribute.id} className="mb-4">
                    <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      {attribute.name}
                    </h3>

                    <div className="flex flex-wrap gap-2">
                      {attributeValuesWithStock.map(
                        ({ value, stock, available }) => {
                          const isSelected =
                            selectedAttributes[attribute.name] === value;

                          return (
                            <button
                              key={value}
                              onClick={() =>
                                handleAttributeChange(attribute.name, value)
                              }
                              disabled={!available}
                              className={`
                                px-4 py-2 text-sm border rounded-lg transition-all duration-200 font-medium
                                ${
                                  isSelected
                                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                                    : available
                                      ? "bg-white border-gray-300 text-gray-800 hover:border-blue-500 hover:text-blue-600 hover:shadow-sm"
                                      : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                                }
                              `}
                            >
                              {value}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quantity */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Số lượng
            </h3>
            {(() => {
              const maxStock = getVariantStock(product, selectedAttributes);

              return (
                <div className="flex items-center">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    className="w-10 h-10 flex items-center justify-center rounded-l-md border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={quantity <= 1}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 12H4"
                      />
                    </svg>
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={maxStock}
                    value={quantity}
                    onChange={(e) =>
                      handleQuantityChange(parseInt(e.target.value) || 1)
                    }
                    className="w-16 h-10 border-t border-b border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-center focus:outline-none focus:ring-0"
                  />
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center rounded-r-md border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={quantity >= maxStock}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </button>
                  <div className="flex justify-between ml-10">
                    <PremiumButton
                      // variant="outline"
                      variant="success"
                      isProcessing={isAddingtoWishList}
                      processingText="Đang thêm..."
                      onClick={handletoWishList}
                      iconType={isWishlisted ? "heart-filled" : "heart"}
                      title={
                        isWishlisted
                          ? "Xóa khỏi yêu thích"
                          : "Thêm vào yêu thích"
                      }
                    >
                      {/* <Heart size={20} /> */}
                    </PremiumButton>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Warranty Selection */}
          <WarrantySelection
            warrantyPackages={warrantyPackages}
            onWarrantyChange={handleWarrantyChange}
            selectedPackages={selectedWarranties}
          />

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <PremiumButton
              variant="primary"
              size="large"
              iconType="cart"
              isProcessing={isAddingToCart}
              processingText="Đang thêm..."
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className="w-full h-14"
            >
              {t("product.addToCart")}
            </PremiumButton>
            <PremiumButton
              variant="secondary"
              size="large"
              iconType="check"
              onClick={handleBuyNow}
              disabled={product.stock <= 0}
              className="w-full h-14"
            >
              {t("product.buyNow")}
            </PremiumButton>
          </div>

          {/* Additional info */}
          {/* <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6 space-y-4">
            <div className="flex">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-primary-500 dark:text-primary-400 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                Secure payment
              </span>
            </div>
            <div className="flex">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-primary-500 dark:text-primary-400 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                Free shipping on orders over $50
              </span>
            </div>
            <div className="flex">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-primary-500 dark:text-primary-400 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                30-day return policy
              </span>
            </div>
          </div> */}
        </div>
      </div>

      {/* Product Details Section */}
      <ProductDetailsSection
        description={product.description}
        specifications={product.productSpecifications || []}
      />

      {/* Reviews section */}
      <div id="reviews" className="mb-16 mt-20 scroll-mt-24">
        <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-6">
          Đánh giá từ khách hàng
        </h2>

        {/* Reviews section */}
        {product?.id && (
          <ProductReviews
            productId={product.id}
            averageRating={product.ratings?.average || 0}
            totalReviews={product.ratings?.count || 0}
          />
        )}
      </div>

      {/* Related products */}
      {relatedProducts && relatedProducts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-6">
            Sản phẩm liên quan
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default ProductDetailPage;
