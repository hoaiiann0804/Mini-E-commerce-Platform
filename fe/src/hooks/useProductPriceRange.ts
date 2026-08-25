import { useMemo } from 'react';
import { calculatePriceRange } from '@/utils/priceUtils';

export const useProductPriceRange = (basePrice: number, variants?: any[]) => {
  const priceInfo = useMemo(() => {
    if (variants && variants.length > 0) {
      const processedVariants = variants.map((variant: any) => ({
        id: variant.id,
        name: variant.name,
        sku: variant.sku,
        price: parseFloat(variant.price),
        stockQuantity: variant.stockQuantity,
        attributes: variant.attributes,
      }));

      return {
        ...calculatePriceRange(basePrice, processedVariants),
        hasVariants: true,
      };
    }

    return {
      ...calculatePriceRange(basePrice),
      hasVariants: false,
    };
  }, [basePrice, variants]);

  return {
    priceInfo,
    isLoading: false,
    hasVariants: priceInfo.hasVariants,
  };
};
