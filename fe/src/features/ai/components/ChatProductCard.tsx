import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ProductRecommendation } from "../services/chatbotApi";
import {
  useTrackChatbotAnalyticsMutation,
  useAddToCartViaChatbotMutation,
} from "../services/chatbotApi";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

interface ChatProductCardProps {
  product: ProductRecommendation;
  sessionId: string;
  onProductClick?: (product: ProductRecommendation) => void;
}

const ChatProductCard: React.FC<ChatProductCardProps> = ({
  product,
  sessionId,
  onProductClick,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [trackAnalytics] = useTrackChatbotAnalyticsMutation();
  const [addToCart] = useAddToCartViaChatbotMutation();

  const handleProductClick = async () => {
    // Track product click
    await trackAnalytics({
      event: "product_clicked",
      userId: user?.id,
      sessionId,
      productId: product.id,
      metadata: { source: "chatbot_recommendation" },
    });

    onProductClick?.(product);
    navigate(`/products/${product.id}`);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      await addToCart({
        productId: product.id,
        quantity: 1,
        sessionId,
      }).unwrap();

      // Track add to cart
      await trackAnalytics({
        event: "product_added_to_cart",
        userId: user?.id,
        sessionId,
        productId: product.id,
        value: product.price,
        metadata: { source: "chatbot_recommendation" },
      });

      // Show success message (you could add a toast notification here)
      //console.log('Product added to cart successfully');
    } catch (error) {
      console.error("Failed to add product to cart:", error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-sm ${
          i < Math.floor(rating) ? "text-yellow-400" : "text-gray-300"
        }`}
      >
        ★
      </span>
    ));
  };

  return (
    <div
      className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group transform hover:scale-102"
      onClick={handleProductClick}
    >
      {/* Product Image */}
      <div className="relative overflow-hidden">
        <img
          src={product.thumbnail || "/images/placeholder-product.jpg"}
          alt={product.name}
          className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-300"
        />

        {/* Discount Badge */}
        {product.discount > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            -{product.discount}%
          </div>
        )}

        {/* Stock Status */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {t("product.outOfStock")}
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3">
        <h4 className="font-semibold text-sm text-neutral-800 dark:text-neutral-200 line-clamp-2 mb-2">
          {product.name}
        </h4>

        {/* Rating */}
        <div className="flex items-center mb-2">
          {renderStars(product.rating)}
          <span className="text-xs text-neutral-500 ml-1">
            ({product.rating})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-1">
            <span className="font-bold text-primary-600 dark:text-primary-400 text-sm">
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice &&
              product.compareAtPrice > product.price && (
                <span className="text-xs text-neutral-500 line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={handleProductClick}
            className="flex-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 px-3 py-2 rounded-lg text-xs font-medium hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
          >
            {t("product.viewDetails")}
          </button>

          {product.inStock && (
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-primary-500 hover:bg-primary-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            >
              🛒 {t("product.addToCart")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatProductCard;
