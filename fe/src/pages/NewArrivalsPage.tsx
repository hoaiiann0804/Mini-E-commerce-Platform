import { useState } from 'react';
import { useGetProductsQuery } from '@/services/productApi';
import ProductCard from '@/components/features/ProductCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Select from '@/components/common/Select';
import Pagination from '@/components/common/Pagination';
import { Product } from '@/types/product.types';

type SortOption = 'popular' | 'price_asc' | 'price_desc' | 'newest';

const NewArrivalsPage: React.FC = () => {
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 12;

  // Get newest products
  const {
    data: productsData,
    isLoading,
    error,
  } = useGetProductsQuery({
    sort: sortOption,
    page: currentPage,
    limit,
    newArrivals: true, // This would be a parameter in a real API to filter for new arrivals
  });

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Popular' },
  ];

  const handleSortChange = (value: string) => {
    setSortOption(value as SortOption);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when changing page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Error Loading Products
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          We encountered an error while loading the new arrivals. Please try
          again later.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      {/* Hero section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-500 rounded-xl p-8 mb-12 text-white text-center">
        <h1 className="text-4xl font-bold mb-4">New Arrivals</h1>
        <p className="text-lg max-w-2xl mx-auto mb-6">
          Discover our latest products and stay ahead of the trends with our
          newest collection.
        </p>
        <div className="inline-block bg-white text-blue-600 font-bold py-3 px-6 rounded-full text-lg">
          Fresh & Exciting
        </div>
      </div>

      {/* Sort and results count */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <p className="text-neutral-600 dark:text-neutral-400 mb-4 md:mb-0">
          {productsData?.total
            ? `Showing ${productsData.products.length} of ${productsData.total} products`
            : 'Browse our newest products'}
        </p>
        <div className="w-full md:w-48">
          <Select
            options={sortOptions}
            value={sortOption}
            onChange={handleSortChange}
            placeholder="Sort By"
          />
        </div>
      </div>

      {/* Products grid */}
      {productsData?.products.length === 0 ? (
        <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 mx-auto text-neutral-400 mb-4"
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
          <h3 className="text-xl font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
            No new products available
          </h3>
          <p className="text-neutral-500 dark:text-neutral-400 mb-6">
            Check back soon for new arrivals
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {productsData?.products.map((product: Product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>

          {/* Pagination */}
          {productsData && productsData.totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={productsData.totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
};

export default NewArrivalsPage;
