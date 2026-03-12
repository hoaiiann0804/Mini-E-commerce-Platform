import React from 'react';
import { Product } from '@/types';
import ProductCard from '@/components/features/ProductCard';

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  columns?: 2 | 3 | 4;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  loading = false,
  columns = 3,
}) => {
  // Determine grid columns class
  const gridClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }[columns];

  // Loading skeleton
  if (loading) {
    return (
      <div className={`grid ${gridClass} gap-4 md:gap-6`}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-4 animate-pulse"
          >
            <div className="w-full h-48 bg-neutral-200 dark:bg-neutral-700 rounded-md mb-4"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  // No products found
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 mx-auto text-neutral-400 dark:text-neutral-500 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-lg font-medium text-neutral-700 dark:text-neutral-300 mb-1">
          Không tìm thấy sản phẩm
        </h3>
        <p className="text-neutral-500 dark:text-neutral-400">
          Vui lòng thử lại với bộ lọc khác
        </p>
      </div>
    );
  }

  // Product grid
  return (
    <div className={`grid ${gridClass} gap-4 md:gap-6`}>
      {products.map((product) => (
        <ProductCard key={product.id} {...product} />
      ))}
    </div>
  );
};

export default ProductGrid;
