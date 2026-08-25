import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import {
  setPriceRange,
  setCategories,
  setAttributes,
  clearFilters,
} from '../productsSlice';
import { Category } from '@/types/category.types';
import Button from '@/components/common/Button';

interface ProductFiltersProps {
  categories: Category[];
  attributes?: Record<string, string[]>;
  isMobile?: boolean;
  onClose?: () => void;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
  categories,
  attributes = {},
  isMobile = false,
  onClose,
}) => {
  const dispatch = useDispatch();
  const filters = useSelector((state: RootState) => state.products.filters);

  // Local state for price range
  const [priceRange, setPriceRangeLocal] = useState<[number, number]>(
    filters.priceRange
  );

  // Local state for selected categories
  const [selectedCategories, setSelectedCategoriesLocal] = useState<string[]>(
    filters.categories
  );

  // Local state for selected attributes
  const [selectedAttributes, setSelectedAttributesLocal] = useState<
    Record<string, string[]>
  >(filters.attributes);

  // Handle price range change
  const handlePriceChange = (index: 0 | 1, value: number) => {
    const newRange = [...priceRange] as [number, number];
    newRange[index] = value;
    setPriceRangeLocal(newRange);
  };

  // Handle category selection
  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    if (checked) {
      setSelectedCategoriesLocal([...selectedCategories, categoryId]);
    } else {
      setSelectedCategoriesLocal(
        selectedCategories.filter((id) => id !== categoryId)
      );
    }
  };

  // Handle attribute selection
  const handleAttributeChange = (
    name: string,
    value: string,
    checked: boolean
  ) => {
    const currentValues = selectedAttributes[name] || [];

    if (checked) {
      setSelectedAttributesLocal({
        ...selectedAttributes,
        [name]: [...currentValues, value],
      });
    } else {
      setSelectedAttributesLocal({
        ...selectedAttributes,
        [name]: currentValues.filter((v) => v !== value),
      });
    }
  };

  // Apply filters
  const applyFilters = () => {
    dispatch(setPriceRange(priceRange));
    dispatch(setCategories(selectedCategories));
    dispatch(setAttributes(selectedAttributes));

    if (isMobile && onClose) {
      onClose();
    }
  };

  // Reset filters
  const resetFilters = () => {
    setPriceRangeLocal([0, 10000000]);
    setSelectedCategoriesLocal([]);
    setSelectedAttributesLocal({});
    dispatch(clearFilters());

    if (isMobile && onClose) {
      onClose();
    }
  };

  // Format price for display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className={`${isMobile ? 'p-4' : ''}`}>
      <div className="space-y-6">
        {/* Price Range Filter */}
        <div>
          <h3 className="text-lg font-medium mb-3">Giá</h3>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>{formatPrice(priceRange[0])}</span>
              <span>{formatPrice(priceRange[1])}</span>
            </div>

            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="0"
                max="10000000"
                step="100000"
                value={priceRange[0]}
                onChange={(e) => handlePriceChange(0, Number(e.target.value))}
                className="w-full"
              />
              <input
                type="range"
                min="0"
                max="10000000"
                step="100000"
                value={priceRange[1]}
                onChange={(e) => handlePriceChange(1, Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Categories Filter */}
        <div>
          <h3 className="text-lg font-medium mb-3">Danh mục</h3>
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`category-${category.id}`}
                  checked={selectedCategories.includes(category.id)}
                  onChange={(e) =>
                    handleCategoryChange(category.id, e.target.checked)
                  }
                  className="mr-2"
                />
                <label htmlFor={`category-${category.id}`} className="text-sm">
                  {category.name} ({category.productCount})
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Attributes Filters */}
        {Object.entries(attributes).map(([name, values]) => (
          <div key={name}>
            <h3 className="text-lg font-medium mb-3">{name}</h3>
            <div className="space-y-2">
              {values.map((value) => (
                <div key={`${name}-${value}`} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`attr-${name}-${value}`}
                    checked={(selectedAttributes[name] || []).includes(value)}
                    onChange={(e) =>
                      handleAttributeChange(name, value, e.target.checked)
                    }
                    className="mr-2"
                  />
                  <label htmlFor={`attr-${name}-${value}`} className="text-sm">
                    {value}
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Filter Actions */}
        <div className="flex flex-col space-y-2">
          <Button variant="primary" fullWidth onClick={applyFilters}>
            Áp dụng
          </Button>
          <Button variant="outline" fullWidth onClick={resetFilters}>
            Đặt lại
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;
