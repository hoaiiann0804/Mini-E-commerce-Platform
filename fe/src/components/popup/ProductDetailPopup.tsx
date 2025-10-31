import React, { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Minus, Plus } from "lucide-react";
import { Rating } from "../common/Rating";
import { formatPrice } from "@/utils/format";
import { useAddToCartMutation } from "@/services/cartApi";
import { useDispatch, useSelector } from "react-redux";
import { productApi } from "@/services/productApi";

interface Variant {
  attributes: Record<string, string>;
  stock: number;
  stockQuantity?: number;
  sku: string;
  id?: string;
}

interface Product {
  id: string | number;
  name: string;
  images?: string[];
  shortDescription?: string;
  rating?: number;
  price: number;
  compareAtPrice?: number;
  variants?: Variant[];
  thumbnail?: string;
}

interface ProductDetailPopupProps {
  product: Product;
  onClose: () => void;
}

const ProductDetailPopup: React.FC<ProductDetailPopupProps> = ({
  product: initialProduct,
  onClose,
}) => {
  const [selectAttrs, setSelectAttrs] = useState<Record<string, string>>({});
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { productId } = useParams<{ productId: string }>();

  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const skuId = searchParams.get("skuId") || undefined;

  const [mappedAttributes, setMappedAttributes] = useState<
    Record<string, string>
  >({});
  const [qty, setQty] = useState<number>(1);



  // lay thong tin dang nhap tu reudx store
  const isAuthenticated = useSelector(
    (state: any) => state.auth.isAuthenticated
  );

  //API hooks - fetch full product data if we have an ID
  const {
    data: productData,
    isLoading,
    refetch,
  } = productApi.useGetProductByIdQuery(
    { id: (productId || initialProduct.id || "").toString(), skuId },
    {
      skip: !productId && !initialProduct.id,
    }
  );

  const [addToCart, { isLoading: isAddingToCart }] = useAddToCartMutation();

  const product = productData?.data || initialProduct;
  const originalPrice = product.compareAtPrice;

  // Auto-select first variant when product loads
  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      const firstVariant = product.variants[0];
      setSelectedVariant(firstVariant);
      setSelectAttrs(firstVariant.attributes);
      setQty(1);
    }
  }, [product]);

  const handleSelectAttrs = (attrname: string, value: string) => {
    const newAttrs = { ...selectAttrs, [attrname]: value };
    setSelectAttrs(newAttrs);
    setError(null);

    // Find variant that matches all selected attributes
    const matchingVariant = product?.variants?.find((variant: Variant) =>
      Object.keys(newAttrs).every(
        (key) => variant.attributes[key] === newAttrs[key]
      )
    );

    if (matchingVariant) {
      setSelectedVariant(matchingVariant);
      setQty(1); // reset qty when variant changes
    } else {
      setSelectedVariant(null);
      setError("No matching variant found for selected attributes");
    }
  };

  const handleDecrease = () => {
    if (qty > 1) {
      setQty(qty - 1);
      setError(null);
    } else {
      setError("Quantity cannot be less than 1");
    }
  };

  const handleIncrease = () => {
    const maxStock = selectedVariant?.stockQuantity || selectedVariant?.stock || 0;
    if (selectedVariant && qty < maxStock) {
      setQty(qty + 1);
      setError(null);
    } else {
      setError("Cannot increase quantity beyond available stock");
    }
  };

  const handleAddToCart = () => {
    if (!selectedVariant) {
      setError("Please select a variant");
      return;
    }
    const maxStock = selectedVariant.stockQuantity || selectedVariant.stock;
    if (qty > maxStock) {
      setError("Quantity exceeds available stock");
      return;
    }
    // Integrate with cart logic
    addToCart({
      productId: product.id,
      variantId: selectedVariant.id || selectedVariant.sku,
      quantity: qty,
    });
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center py-3 px-4 border-b">
          <h3 className="text-2xl font-bold text-gray-800">{product.name}</h3>
          <button
            onClick={onClose}
            className="size-8 flex justify-center items-center rounded-full bg-gray-100 hover:bg-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto max-h-96">
          <img
            src={product.thumbnail}
            alt={product.name}
            className="w-60 h-60 object-cover mb-4 rounded"
          />
          <p className="text-gray-700 mb-2">{product.shortDescription}</p>
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
          {product.price && product.price > 0 ? (
            <>
              <div className="mt-4 flex items-center justify-between gap-4 mb-1">
                <p className="text-2xl font-extrabold leading-tight text-gray-900 dark:text-white">
                  {formatPrice(
                    product.price > 0
                      ? product.price
                      : product.compareAtPrice || 0
                  )}
                </p>
              </div>
              <div className=" flex items-center justify-between">
                {product.compareAtPrice &&
                  product.price > 0 &&
                  product.compareAtPrice > product.price && (
                    <span className="text-base text-neutral-400 dark:text-neutral-500 line-through font-medium">
                      {formatPrice(product.compareAtPrice)}
                    </span>
                  )}
              </div>
            </>
          ) : (
            <>
              <p className="text-lg font-bold">{formatPrice(originalPrice)}</p>
            </>
          )}
          {(() => {
            const variants = product.variants;
            if (
              !variants ||
              variants.length === 0 ||
              !variants[0]?.attributes
            )
              return null;
            return Object.keys(variants[0].attributes).map(
              (attrname: string) => {
                const value = [
                  ...new Set(
                    variants
                      .map((v: Variant) => v.attributes?.[attrname])
                      .filter(Boolean)
                  ),
                ] as string[];
                return (
                  <div key={attrname}>
                    <p className="text-foreground font-medium mb-6">
                      {attrname} :
                    </p>
                    <div className="flex space-x-2 mb-6">
                      {value.map((item) => (
                        <button
                          key={item}
                          onClick={() => handleSelectAttrs(attrname, item)}
                          className={`px-4 py-2 border border-md transition-colors mb-5
                          ${selectAttrs[attrname] === item ? "bg-blue-500 text-white border-blue-500" : "bg-background text-foreground border-border"}
                          hover:border-gray-500 `}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                    {error && <p className="text-red-500">{error}</p>}
                  </div>
                );
              }
            );
          })()}
          {selectedVariant && (
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                Available Stock: {selectedVariant.stock}
              </p>
            </div>
          )}
          <div>
            <div className="flex items-center space-x-4 mt-1">
              <div className="flex items-center border border-border rounded-md">
                <button
                  className="p-2 hover:bg-muted transition-colors"
                  onClick={handleDecrease}
                  disabled={qty <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>

                <span className="px-4 py-2 border border-border rounded-md transition-colors text-foreground">
                  {qty} / {(selectedVariant?.stockQuantity || selectedVariant?.stock) || 0}
                </span>
                <button
                  className="p-2 hover:bg-muted transition-colors"
                  onClick={handleIncrease}
                  disabled={!selectedVariant || qty >= (selectedVariant.stockQuantity || selectedVariant.stock)}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end items-center gap-x-2 py-3 px-4 border-t">
          <Link to={`/products/${product.id}`}>
            <button className="py-2 px-3 rounded-lg border bg-white hover:bg-gray-50">
              View
            </button>
          </Link>
          <button
            onClick={handleAddToCart}
            className="py-2 px-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPopup;
