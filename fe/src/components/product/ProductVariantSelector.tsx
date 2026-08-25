import React from "react";
import { Card, Button, Space, Typography, Tag, Divider } from "antd";
import { CheckOutlined } from "@ant-design/icons";
import { ProductWithVariants } from "@/types/product.types";

const { Text, Title } = Typography;

interface ProductVariantSelectorProps {
  product: ProductWithVariants;
  selectedVariantId?: string;
  onVariantChange: (variantId: string) => void;
  className?: string;
}

const ProductVariantSelector: React.FC<ProductVariantSelectorProps> = ({
  product,
  selectedVariantId,
  onVariantChange,
  className,
}) => {
  if (
    !product.isVariantProduct ||
    !product.availableVariants ||
    product.availableVariants.length <= 1
  ) {
    return null;
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const currentVariant = product.currentVariant;
  const availableVariants = product.availableVariants;

  return (
    <Card
      className={className}
      title={
        <Space>
          <span>🔧</span>
          <span>Chọn phiên bản</span>
        </Space>
      }
      size="small"
    >
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        {/* Current Selection Display */}
        {currentVariant && (
          <div
            style={{
              padding: "12px",
              backgroundColor: "#f0f9ff",
              borderRadius: "8px",
              border: "1px solid #0ea5e9",
            }}
          >
            <Space direction="vertical" size="small">
              <Text strong style={{ color: "#0ea5e9" }}>
                <CheckOutlined style={{ marginRight: 4 }} />
                Đã chọn: {currentVariant.name}
              </Text>
              <Space>
                <Text strong style={{ fontSize: "16px", color: "#dc2626" }}>
                  {formatPrice(currentVariant.price)}
                </Text>
                {currentVariant.compareAtPrice &&
                  currentVariant.compareAtPrice > currentVariant.price && (
                    <Text delete style={{ color: "#6b7280" }}>
                      {formatPrice(currentVariant.compareAtPrice)}
                    </Text>
                  )}
              </Space>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                SKU: {currentVariant.sku} | Còn lại:{" "}
                {currentVariant.stockQuantity}
              </Text>
            </Space>
          </div>
        )}

        <Divider style={{ margin: "8px 0" }} />

        {/* Variant Options */}
        <div>
          <Text strong style={{ marginBottom: 8, display: "block" }}>
            Các phiên bản có sẵn:
          </Text>
          <Space direction="vertical" style={{ width: "100%" }} size="small">
            {availableVariants.map((variant) => {
              const isSelected =
                selectedVariantId === variant.id ||
                (!selectedVariantId && variant.isDefault);
              const isOutOfStock = variant.stockQuantity <= 0;

              return (
                <Button
                  key={variant.id}
                  onClick={() => onVariantChange(variant.id)}
                  disabled={isOutOfStock}
                  style={{
                    width: "100%",
                    height: "auto",
                    padding: "12px 16px",
                    textAlign: "left",
                    border: isSelected
                      ? "2px solid #0ea5e9"
                      : "1px solid #d1d5db",
                    backgroundColor: isSelected ? "#f0f9ff" : "white",
                    opacity: isOutOfStock ? 0.5 : 1,
                  }}
                >
                  <div style={{ width: "100%" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 4,
                      }}
                    >
                      <Text
                        strong
                        style={{
                          color: isSelected ? "#0ea5e9" : "#374151",
                          fontSize: "14px",
                        }}
                      >
                        {isSelected && (
                          <CheckOutlined style={{ marginRight: 4 }} />
                        )}
                        {variant.name}
                      </Text>
                      <Space>
                        {variant.isDefault && (
                          <Tag color="blue" style={{ fontSize: 11 }}>
                            Mặc định
                          </Tag>
                        )}
                        {isOutOfStock && (
                          <Tag color="red" style={{ fontSize: 11 }}>
                            Hết hàng
                          </Tag>
                        )}
                      </Space>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Space>
                        <Text
                          strong
                          style={{
                            color: "#dc2626",
                            fontSize: "14px",
                          }}
                        >
                          {formatPrice(variant.price)}
                        </Text>
                        {variant.compareAtPrice &&
                          variant.compareAtPrice > variant.price && (
                            <Text
                              delete
                              style={{
                                color: "#6b7280",
                                fontSize: "12px",
                              }}
                            >
                              {formatPrice(variant.compareAtPrice)}
                            </Text>
                          )}
                      </Space>

                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        Còn: {variant.stockQuantity}
                      </Text>
                    </div>
                  </div>
                </Button>
              );
            })}
          </Space>
        </div>

        {/* Price Comparison */}
        {availableVariants.length > 1 && (
          <>
            <Divider style={{ margin: "8px 0" }} />
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              <Text type="secondary">
                Giá từ{" "}
                {formatPrice(
                  Math.min(...availableVariants.map((v) => v.price))
                )}{" "}
                đến{" "}
                {formatPrice(
                  Math.max(...availableVariants.map((v) => v.price))
                )}
              </Text>
            </div>
          </>
        )}
      </Space>
    </Card>
  );
};

export default ProductVariantSelector;
