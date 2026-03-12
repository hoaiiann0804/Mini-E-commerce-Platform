import { useState, useMemo } from 'react';
import { useGetDealsQuery } from '@/services/productApi';
import ProductCard from '@/components/features/ProductCard';
import ProductListCard from '@/components/features/ProductListCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Select from '@/components/common/Select';
import { Product } from '@/types/product.types';

const DealsPage: React.FC = () => {
  const [sortOption, setSortOption] = useState('discount_desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const limit = 12;

  // Get products with discount > 50%, sorted by discount percentage
  const {
    data: dealsData,
    isLoading,
    error,
  } = useGetDealsQuery({
    minDiscount: 50, // Only products with at least 50% discount
    sort: sortOption,
    limit,
  });

  // Chuyển đổi dữ liệu từ API thành định dạng phù hợp với component ProductCard
  const formattedProducts = useMemo(() => {
    if (!dealsData?.data) return [];

    return dealsData.data.map((item: Product) => {
      // Chuyển đổi chuỗi giá thành số
      const price =
        typeof item.price === 'string' ? parseFloat(item.price) : item.price;
      const compareAtPrice =
        typeof item.compareAtPrice === 'string'
          ? parseFloat(item.compareAtPrice)
          : item.compareAtPrice;

      // Tính discountPercentage từ compareAtPrice và price
      const discountPercentage =
        compareAtPrice && compareAtPrice > price
          ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
          : 0;

      // Tạo đối tượng ratings nếu không có
      const ratings = {
        average: 4.5, // Giá trị mặc định
        count: 10,
      };

      // Trả về đối tượng phù hợp với interface Product
      return {
        ...item,
        price,
        compareAtPrice,
        ratings,
        isNew:
          item.createdAt &&
          new Date(item.createdAt) >
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Sản phẩm mới nếu được tạo trong 7 ngày qua
        // Sử dụng categoryName thay vì categories
        stock: item.stock || 0,
      } as Product;
    });
  }, [dealsData]);

  const sortOptions = [
    { value: 'discount_desc', label: 'Giảm giá cao nhất' },
    { value: 'price_asc', label: 'Giá: Thấp đến cao' },
    { value: 'price_desc', label: 'Giá: Cao đến thấp' },
    { value: 'newest', label: 'Mới nhất' },
  ];

  const handleSortChange = (value: string) => {
    setSortOption(value);
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
          Lỗi khi tải sản phẩm giảm giá
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Đã xảy ra lỗi khi tải danh sách sản phẩm giảm giá. Vui lòng thử lại
          sau.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950">
      <div className="container mx-auto px-4 py-8 animate-fadeIn">
        {/* Hero section */}
        <div className="bg-gradient-to-r from-primary-600 to-secondary-500 rounded-xl p-8 mb-8 text-white text-center">
          <h1 className="text-4xl font-bold mb-4">
            Siêu Giảm Giá - Trên 50% OFF
          </h1>
          <p className="text-lg max-w-2xl mx-auto mb-6">
            Khám phá các sản phẩm giảm giá sốc với mức giảm trên 50%. Cơ hội có
            hạn, mua ngay kẻo lỡ!
          </p>
          <div className="inline-block bg-white text-primary-600 font-bold py-3 px-6 rounded-full text-lg">
            GIẢM GIÁ TRÊN 50%
          </div>
        </div>

        {/* Page header - Removed duplicate title */}
        <div className="mb-8 text-center">
          <p className="text-neutral-600 dark:text-neutral-400 text-lg">
            {formattedProducts.length > 0
              ? `Hiển thị ${formattedProducts.length} sản phẩm giảm giá trên 50%`
              : 'Khám phá các sản phẩm giảm giá sốc'}
          </p>
        </div>

        {/* Sort and view controls */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-white dark:bg-neutral-800 rounded-lg p-1 border border-neutral-200 dark:border-neutral-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-primary-500 text-white'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
                aria-label="Grid view"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-primary-500 text-white'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
                aria-label="List view"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="w-full md:w-48">
            <Select
              options={sortOptions}
              value={sortOption}
              onChange={handleSortChange}
              placeholder="Sắp xếp theo"
            />
          </div>
        </div>

        {/* Products grid */}
        {formattedProducts.length === 0 ? (
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
              Không có sản phẩm giảm giá trên 50%
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 mb-6">
              Vui lòng quay lại sau để xem các ưu đãi mới
            </p>
          </div>
        ) : (
          <>
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10 auto-rows-fr'
                  : 'space-y-8'
              }
            >
              {formattedProducts.map((product: Product) =>
                viewMode === 'grid' ? (
                  <ProductCard
                    key={product.id}
                    {...product}
                    // Tính discountPercentage từ compareAtPrice và price
                    discountPercentage={
                      product.compareAtPrice && product.compareAtPrice > product.price
                        ? Math.round(
                            ((product.compareAtPrice - product.price) /
                              product.compareAtPrice) *
                              100
                          )
                        : 0
                    }
                  />
                ) : (
                  <ProductListCard
                    key={product.id}
                    {...product}
                  />
                )
              )}
            </div>

            {/* Pagination - Note: The deals API doesn't support pagination yet */}
          </>
        )}
      </div>
    </div>
  );
};

export default DealsPage;
