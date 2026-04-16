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
