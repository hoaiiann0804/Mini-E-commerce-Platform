import { addNotification } from "@/features/ui/uiSlice";
import { Product } from "@/types/product.types";
import { calculatePriceRange } from "@/utils/priceUtils";
import React from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";

// Mở rộng interface Product để hỗ trợ discountPercentage từ API
interface ProductCardProps extends Product {
  discountPercentage?: number;
  enableVariantPricing?: boolean; // Option để bật/tắt việc load variants
}

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  thumbnail,
  price,
  compareAtPrice,
  shortDescription,
  ratings,
  isNew,
  slug,
  discountPercentage,
  variants,
  enableVariantPricing = false, // Mặc định tắt để tránh quá nhiều API calls
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Luôn sử dụng ID để đảm bảo API sản phẩm liên quan hoạt động đúng
  const productUrl = `/products/${id}`;

  // Sử dụng utility calculatePriceRange
  const priceInfo = calculatePriceRange(price, variants);

  // Sử dụng discountPercentage từ API nếu có, nếu không thì tính toán từ giá
  const discount =
    discountPercentage !== undefined
      ? Math.round(discountPercentage)
      : compareAtPrice
        ? Math.round(
            ((compareAtPrice - priceInfo.basePrice) / compareAtPrice) * 100
          )
        : 0;

  // Handle view details
  const handleViewDetails = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(productUrl);
  };

  return (
    <div className="group relative bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden transition-all duration-300 ease-out hover:shadow-lg border border-neutral-100/50 dark:border-neutral-800/50 hover:border-primary-200/30 dark:hover:border-primary-800/30 h-full flex flex-col">
      {/* Image container with enhanced aspect ratio */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900">
        {/* Enhanced badges with better positioning */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
          {compareAtPrice && compareAtPrice > priceInfo.basePrice && (
            <div className="bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xl backdrop-blur-sm border border-white/20">
              <span className="drop-shadow-sm">-{discount}%</span>
            </div>
          )}
          {isNew && (
            <div className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xl backdrop-blur-sm border border-white/20">
              <span className="drop-shadow-sm">MỚI</span>
            </div>
          )}
        </div>

        {/* Enhanced product image with better hover effects */}
        <Link to={productUrl} className="block w-full h-full">
          <div className="w-full h-full overflow-hidden">
            <img
              src={thumbnail}
              alt={name}
              className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-300 ease-out"
              loading="lazy"
            />
          </div>
        </Link>

        {/* Premium overlay with gradient effect only */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      {/* Enhanced product info section */}
      <div className="p-6 space-y-4 flex-grow flex flex-col">
        {/* Rating positioned at top */}
        <div className="flex items-center">
          {ratings && (
            <div className="flex items-center bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30 px-3 py-1.5 rounded-xl border border-amber-200/50 dark:border-amber-800/50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-amber-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm text-amber-700 dark:text-amber-300 ml-1.5 font-semibold">
                {ratings.average}
              </span>
            </div>
          )}
        </div>

        {/* Enhanced title */}
        <Link to={productUrl} className="block mt-2">
          <h3 className="text-neutral-900 dark:text-neutral-100 font-bold text-lg leading-tight hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 line-clamp-2 min-h-[3rem] group-hover:text-primary-600 dark:group-hover:text-primary-400">
            {name}
          </h3>
        </Link>

        {/* Enhanced description */}
        {shortDescription && (
          <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed line-clamp-2 group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors duration-200">
            {shortDescription}
          </p>
        )}

        {/* Enhanced price section */}
        <div className="space-y-3 pt-2 mt-auto">
          <div className="flex flex-col space-y-1">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
                {priceInfo.priceText}
              </span>
              {compareAtPrice && compareAtPrice > priceInfo.basePrice && (
                <span className="text-base text-neutral-400 dark:text-neutral-500 line-through font-medium">
                  {compareAtPrice.toLocaleString("vi-VN")}đ
                </span>
              )}
            </div>
            {compareAtPrice && compareAtPrice > priceInfo.basePrice && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
                  Tiết kiệm{" "}
                  {(compareAtPrice - priceInfo.basePrice).toLocaleString(
                    "vi-VN"
                  )}
                  đ
                </span>
                <div className="h-1 w-1 bg-neutral-300 dark:bg-neutral-600 rounded-full"></div>
                <span className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
                  {discount}% OFF
                </span>
              </div>
            )}
          </div>

          {/* Enhanced view details button */}
          <button
            className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-xl py-3.5 px-5 transition-colors duration-200 shadow-lg font-semibold text-sm tracking-wide flex items-center justify-center gap-3 group/btn"
            onClick={handleViewDetails}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <span className="whitespace-nowrap">XEM CHI TIẾT</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
