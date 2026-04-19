import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '@/components/features/ProductCard';
import ProductListCard from '@/components/features/ProductListCard';
import FilterPanel from '@/components/features/FilterPanel';
import Select from '@/components/common/Select';
import { PremiumButton } from '@/components/common';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Product, ProductFilters } from '@/types/product.types';
import { useLazyGetProductsQuery } from '@/services/productApi';
import { useGetCategoriesQuery } from '@/services/categoryApi';
import { ProductCardSkeleton } from '@/components/common/LoadingState';

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Popularity' },
];

const ShopPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Get filter values from URL
  const categoryId = searchParams.get('category') || undefined;
  const search = searchParams.get('search') || undefined;
  const minPrice = searchParams.get('minPrice')
    ? Number(searchParams.get('minPrice'))
    : undefined;
  const maxPrice = searchParams.get('maxPrice')
    ? Number(searchParams.get('maxPrice'))
    : undefined;
  const sort = (searchParams.get('sort') as ProductFilters['sort']) || 'newest';
  const limit = 12;

  const [products, setProducts] = useState<Product[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Selected filters for filter panel
  const [selectedFilters, setSelectedFilters] = useState<
    Record<string, string[]>
  >({
    categories: categoryId ? [categoryId] : [],
  });

  // Price range for filter panel
  const [priceRange, setPriceRange] = useState({
    min: minPrice || 0,
    max: maxPrice || 10000000, // 10 triệu VND
  });

  const [triggerGetProducts, getProductsState] = useLazyGetProductsQuery();

  const { data: categoriesData, isLoading: isCategoriesLoading } =
    useGetCategoriesQuery();

  // Update selected filters when URL params change
  useEffect(() => {
    setSelectedFilters({
      categories: categoryId ? [categoryId] : [],
    });

    setPriceRange({
      min: minPrice || 0,
      max: maxPrice || 10000000, // 10 triệu VND
    });
  }, [categoryId, minPrice, maxPrice, searchParams]);

  const baseFilters = useMemo(() => {
    return {
      categoryId,
      search,
      minPrice,
      maxPrice,
      sort: sort as ProductFilters['sort'],
      limit,
    } satisfies ProductFilters;
  }, [categoryId, search, minPrice, maxPrice, sort, limit]);

  const mergeUniqueById = useCallback(
    (existing: Product[], incoming: Product[]) => {
      if (existing.length === 0) return incoming;
      const seen = new Set(existing.map((p) => p.id));
      const merged = [...existing];
      for (const item of incoming) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          merged.push(item);
        }
      }
      return merged;
    },
    []
  );

  const fetchProductsPage = useCallback(
    async (cursor?: string | null) => {
      try {
        const result = await triggerGetProducts({
          ...baseFilters,
          cursor: cursor || undefined,
        }).unwrap();

        const pageProducts: Product[] = result?.data?.products || [];
        const pageNextCursor: string | null = result?.data?.nextCursor ?? null;

        setProducts((prev) =>
          cursor ? mergeUniqueById(prev, pageProducts) : pageProducts
        );
        setNextCursor(pageNextCursor);
        setInitialLoadDone(true);
        return true;
      } catch {
        setInitialLoadDone(true);
        setNextCursor(null);
        return false;
      }
    },
    [baseFilters, triggerGetProducts, mergeUniqueById]
  );

  const resetAndFetchFirstPage = useCallback(async () => {
    setProducts([]);
    setNextCursor(null);
    setInitialLoadDone(false);
    await fetchProductsPage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchProductsPage]);

  // Initial fetch + refetch when filters change
  useEffect(() => {
    void resetAndFetchFirstPage();
  }, [resetAndFetchFirstPage]);

  const handleLoadMore = useCallback(async () => {
    if (!nextCursor) return;
    if (isLoadingMore || getProductsState.isFetching) return;

    setIsLoadingMore(true);
    try {
      await fetchProductsPage(nextCursor);
    } finally {
      setIsLoadingMore(false);
    }
  }, [nextCursor, isLoadingMore, getProductsState.isFetching, fetchProductsPage]);

  // Infinite scroll: observe sentinel at bottom
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (!nextCursor) return;
        if (isLoadingMore || getProductsState.isFetching) return;
        handleLoadMore();
      },
      { root: null, rootMargin: '300px', threshold: 0.01 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [nextCursor, isLoadingMore, getProductsState.isFetching, handleLoadMore]);

  // Update URL when filters change
  const updateFilters = (newFilters: Partial<ProductFilters>) => {
    const updatedParams = new URLSearchParams(searchParams);

    // Update or remove each filter parameter
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined || value === '') {
        updatedParams.delete(key);
      } else {
        updatedParams.set(key, String(value));
      }
    });

    // Cursor/page should not be in URL for ShopPage
    updatedParams.delete('page');
    updatedParams.delete('cursor');

    setSearchParams(updatedParams);
  };

  // Handle sort change
  const handleSortChange = (value: string) => {
    updateFilters({ sort: value as ProductFilters['sort'] });
  };

  // Cursor-based infinite loading (no page param)

  // Handle price range change
  const handlePriceRangeChange = (range: { min: number; max: number }) => {
    updateFilters({ minPrice: range.min, maxPrice: range.max });
  };

  // Handle filter change
  const handleFilterChange = (
    groupId: string,
    optionId: string,
    isSelected: boolean
  ) => {
    const updatedParams = new URLSearchParams(searchParams);

    if (groupId === 'categories') {
      if (isSelected) {
        updatedParams.set('category', optionId);
      } else {
        updatedParams.delete('category');
      }
    }

    updatedParams.delete('page');
    updatedParams.delete('cursor');

    setSearchParams(updatedParams);
  };

  // Handle clear filters
  const handleClearFilters = () => {
    const updatedParams = new URLSearchParams();
    if (search) updatedParams.set('search', search);
    updatedParams.set('sort', 'newest');
    setSearchParams(updatedParams);
  };

  // Determine if we're loading
  const isInitialLoading =
    !initialLoadDone &&
    (getProductsState.isFetching || getProductsState.isLoading);
  const isLoading = isInitialLoading || isCategoriesLoading;

  // Prepare filter groups for filter panel
  const filterGroups = [
    {
      id: 'categories',
      name: 'Danh mục',
      options:
        categoriesData?.map((category) => ({
          id: category.id,
          name: `${category.name} (${category.productCount || 0})`,
        })) || [],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950">
      <div className="container mx-auto px-4 py-8 animate-fadeIn">
        {/* Page header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-neutral-800 dark:text-neutral-100 mb-3">
            Cửa Hàng Sản Phẩm
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 text-lg">
            {products.length > 0
              ? `Hiển thị ${products.length} sản phẩm`
              : 'Khám phá bộ sưu tập sản phẩm của chúng tôi'}
          </p>
        </div>

        {/* Mobile filter button */}
        <div className="lg:hidden mb-4">
          <PremiumButton
            variant="outline"
            size="large"
            iconType="settings"
            onClick={() => setIsMobileFilterOpen(true)}
            className="w-full"
          >
            Bộ lọc sản phẩm
          </PremiumButton>
        </div>

        {/* Mobile controls */}
        <div className="lg:hidden mb-6 space-y-4">
          {/* View Mode Toggle - Mobile */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Chế độ xem:
            </span>
            <div className="flex items-center bg-white dark:bg-neutral-800 rounded-lg p-1 border border-neutral-200 dark:border-neutral-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-primary-500 text-white'
                    : 'text-neutral-600 dark:text-neutral-400'
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
                    : 'text-neutral-600 dark:text-neutral-400'
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

          <Select
            options={sortOptions}
            value={sort || 'newest'}
            onChange={handleSortChange}
            label="Sắp xếp theo"
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters - Desktop */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <FilterPanel
              priceRange={priceRange}
              onPriceRangeChange={handlePriceRangeChange}
              filterGroups={filterGroups}
              selectedFilters={selectedFilters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
            />
          </div>

          {/* Filters - Mobile */}
          {isMobileFilterOpen && (
            <div className="lg:hidden">
              <FilterPanel
                priceRange={priceRange}
                onPriceRangeChange={handlePriceRangeChange}
                filterGroups={filterGroups}
                selectedFilters={selectedFilters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                isMobile
                onCloseMobile={() => setIsMobileFilterOpen(false)}
              />
            </div>
          )}

          {/* Products */}
          <div className="flex-grow">
            {/* Sort and results count - Desktop */}
            <div className="hidden lg:flex justify-between items-center mb-6">
              <p className="text-neutral-600 dark:text-neutral-400">
                {products.length > 0
                  ? `Hiển thị ${products.length} sản phẩm`
                  : 'Khám phá bộ sưu tập sản phẩm của chúng tôi'}
              </p>

              <div className="flex items-center gap-4">
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

                <div className="w-48">
                  <Select
                    options={sortOptions}
                    value={sort || 'newest'}
                    onChange={handleSortChange}
                    placeholder="Sắp xếp"
                  />
                </div>
              </div>
            </div>

            {/* Products grid */}
            {isLoading ? (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10 auto-rows-fr'
                    : 'space-y-8'
                }
              >
                {Array.from({ length: limit }).map((_, index) => (
                  <ProductCardSkeleton key={index} />
                ))}
              </div>
            ) : getProductsState.isError && products.length === 0 ? (
              <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                <h3 className="text-xl font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Không thể tải sản phẩm
                </h3>
                <p className="text-neutral-500 dark:text-neutral-400 mb-6">
                  Vui lòng thử lại.
                </p>
                <PremiumButton
                  variant="primary"
                  size="large"
                  onClick={() => void resetAndFetchFirstPage()}
                >
                  Thử lại
                </PremiumButton>
              </div>
            ) : products.length === 0 ? (
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
                  No products found
                </h3>
                <p className="text-neutral-500 dark:text-neutral-400 mb-6">
                  Try adjusting your filters or search term
                </p>
                <PremiumButton
                  variant="primary"
                  size="large"
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </PremiumButton>
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
                  {products.map((product: Product) =>
                    viewMode === 'grid' ? (
                      <ProductCard key={product.id} {...product} />
                    ) : (
                      <ProductListCard key={product.id} {...product} />
                    )
                  )}
                </div>

                {/* Load more */}
                <div className="mt-10 flex flex-col items-center gap-4">
                  {nextCursor ? (
                    <>
                      <PremiumButton
                        variant="outline"
                        size="large"
                        onClick={handleLoadMore}
                        disabled={isLoadingMore || getProductsState.isFetching}
                      >
                        {isLoadingMore ? 'Loading...' : 'Load more'}
                      </PremiumButton>
                      <div ref={sentinelRef} className="h-1 w-full" />
                      {(isLoadingMore || getProductsState.isFetching) && (
                        <div className="py-2">
                          <LoadingSpinner size="md" />
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div ref={sentinelRef} className="h-1 w-full" />
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        You&#39;ve reached the end.
                      </p>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopPage;
