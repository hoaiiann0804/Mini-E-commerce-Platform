import { ProductVariant } from "@/types/product";
import { useEffect, useState } from "react";

export const useProductVariants = (
  initialVariants: ProductVariant[] = [],
  form?: any
) => {
  const [variants, setVariants] = useState<ProductVariant[]>(initialVariants);
  const [variantModalVisible, setVariantModalVisible] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(
    null
  );

  // Tự động cập nhật tổng số lượng tồn kho và giá trung bình khi variants thay đổi
  useEffect(() => {
    if (form && variants.length > 0) {
      // Tính tổng số lượng tồn kho từ tất cả các biến thể
      const totalStock = variants.reduce((total, variant) => {
        const stock = parseInt(variant.stockQuantity?.toString() || "0");
        return total + (isNaN(stock) ? 0 : stock);
      }, 0);

      // Tính giá trung bình có trọng số (dựa trên stock)
      let weightedPriceSum = 0;
      let totalWeightedStock = 0;

      variants.forEach((variant) => {
        const stock = parseInt(variant.stockQuantity?.toString() || "0");
        const price = Math.min(
          parseFloat(variant.price?.toString() || "0"),
          99999999.99
        );
        if (stock > 0 && price > 0) {
          weightedPriceSum += price * stock;
          totalWeightedStock += stock;
        }
      });

      const averagePrice =
        totalWeightedStock > 0 ? weightedPriceSum / totalWeightedStock : 0;

      // Cập nhật giá trị vào form
      form.setFieldsValue({
        stockQuantity: totalStock,
        price:
          averagePrice > 0
            ? Math.round(averagePrice)
            : form.getFieldValue("price") || 0,
      });
    }
  }, [variants, form]);

  // Variant handlers
  const handleAddVariant = (variant: ProductVariant) => {
    if (editingVariant) {
      setVariants(
        variants.map((v) =>
          v.id === editingVariant.id ? { ...variant, id: editingVariant.id } : v
        )
      );
    } else {
      // Sử dụng một ID ổn định hơn, không phụ thuộc vào thời gian
      const newId = `var-${variants.length}-${Math.random().toString(36).substring(2, 9)}`;
      setVariants([...variants, { ...variant, id: variant.id || newId }]);
    }
    setVariantModalVisible(false);
    setEditingVariant(null);
  };

  const handleDeleteVariant = (id: string) => {
    setVariants(variants.filter((v) => v.id !== id));
  };

  const openVariantModal = (variant?: ProductVariant) => {
    setEditingVariant(variant || null);
    setVariantModalVisible(true);
  };

  const closeVariantModal = () => {
    setVariantModalVisible(false);
    setEditingVariant(null);
  };

  return {
    variants,
    setVariants,
    variantModalVisible,
    editingVariant,
    handleAddVariant,
    handleDeleteVariant,
    openVariantModal,
    closeVariantModal,
  };
};
