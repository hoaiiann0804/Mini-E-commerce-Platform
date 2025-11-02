import { PremiumButton } from '@/components/common';
import { Product } from '@/types/product.types';

// Define the product item type from the API response
interface ProductItem {
  id: string;
  name: string;
  price: number;
  thumbnail: string;
  slug: string;
  images?: string[];
  description?: string;
  categoryId?: string;
  categoryName?: string;
  rating?: number;
  reviewCount?: number;
  stock?: number;
  [key: string]: any; // For any additional properties
}

import ProductCard from '@/components/features/ProductCard';
import { HeroSection } from '@/components/sections';
import {
  SectionLoading,
  ProductCardSkeleton,
  CategoryCardSkeleton,
} from '@/components/common/LoadingState';
import { ErrorState, EmptyState } from '@/components/common/ErrorState';
import { ProductGrid, CategoryGrid } from '@/components/layout/Grid';
import { PageLayout, PageSection } from '@/components/layout/PageLayout';
import { useGetCategoriesQuery } from '@/services/categoryApi';
import {
  useGetFeaturedProductsQuery,
  useGetBestSellersQuery,
  useGetNewArrivalsQuery
} from '@/services/productApi';
import { useApiState } from '@/hooks/useApiState';
import {
  getCategoryImage,
  createCategoryImageErrorHandler,
} from '@/utils/imageUtils';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

/**
 * HomePage component - Main landing page with hero, featured products, and categories
 */
const HomePage: React.FC = () => {
  const { t } = useTranslation();

  // API queries with enhanced state management
  const featuredProductsQuery = useGetFeaturedProductsQuery({ limit: 4 });
  const bestSellersQuery = useGetBestSellersQuery({ limit: 4 });
  const newArrivalsQuery = useGetNewArrivalsQuery({ limit: 4 });
  const categoriesQuery = useGetCategoriesQuery();

  const featuredProducts = useApiState<{ data: ProductItem[] }>({
    data: featuredProductsQuery.data,
    isLoading: featuredProductsQuery.isLoading,
    error: featuredProductsQuery.error as Error | undefined,
    isArray: true,
  });

  const bestSellers = useApiState<{ data: ProductItem[] }>({
    data: bestSellersQuery.data,
    isLoading: bestSellersQuery.isLoading,
    error: bestSellersQuery.error as Error | undefined,
    isArray: true,
  });

  const newArrivals = useApiState<{ data: ProductItem[] }>({
    data: newArrivalsQuery.data,
    isLoading: newArrivalsQuery.isLoading,
    error: newArrivalsQuery.error as Error | undefined,
    isArray: true,
  });

  const categories = useApiState({
    data: categoriesQuery.data,
    isLoading: categoriesQuery.isLoading,
    error: categoriesQuery.error,
    refetch: categoriesQuery.refetch,
    isArray: true,
  });

  // Transform categories for display
  const displayCategories =
    categories.data?.slice(0, 6).map((category) => ({
      id: category.id,
      name: category.name,
      image: category.image || getCategoryImage(category.name, category.slug),
      count: category.productCount || 0,
      slug: category.slug,
    })) || [];

  return (
    <PageLayout
      title="Trang chủ"
      description="Khám phá các sản phẩm chất lượng với giá cả tốt nhất"
      keywords="mua sắm, sản phẩm chất lượng, giá tốt"
      showContainer={false}
    >
      {/* Hero Section */}
      <HeroSection />

      {/* Featured Products */}
      <PageSection
        title={t('homepage.featuredProducts.title')}
        className="py-16 bg-neutral-50 dark:bg-neutral-900"
        headerActions={
          <Link
            to="/shop?sort=featured"
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center"
          >
            {t('homepage.featuredProducts.viewAll')}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 ml-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        }
      >
        {featuredProducts.isLoading ? (
          <ProductGrid>
            {Array.from({ length: 4 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </ProductGrid>
        ) : featuredProducts.isError ? (
          <ErrorState
            error={featuredProducts.error?.message || 'Lỗi tải sản phẩm nổi bật'}
            onRetry={() => featuredProductsQuery.refetch()}
            retryText="Thử lại"
          />
        ) : featuredProducts.data?.data && featuredProducts.data.data.length > 0 ? (
          <ProductGrid>
            {featuredProducts.data?.data?.map((product: ProductItem) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={product.price}
                thumbnail={product.thumbnail}
                slug={product.slug}
                images={product.images || [product.thumbnail]}
                description={product.description || ''}
                categoryId={product.categoryId || ''}
                categoryName={product.categoryName || ''}
                rating={product.rating || 0}
                reviewCount={product.reviewCount || 0}
                stock={product.stock || 0}
              />
            ))}
          </ProductGrid>
        ) : (
          <EmptyState
            title="Không có sản phẩm nổi bật"
            description="Hiện tại chưa có sản phẩm nổi bật nào."
            actionLabel="Tải lại"
            onAction={() => featuredProductsQuery.refetch()}
          />
        )}
      </PageSection>

      {/* Bestsellers Section */}
      <PageSection
        title="Sản phẩm bán chạy"
        className="py-16 bg-white dark:bg-neutral-800"
        headerActions={
          <Link
            to="/shop?sort=bestselling"
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center"
          >
            Xem tất cả
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 ml-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        }
      >
        {bestSellers.isLoading ? (
          <ProductGrid>
            {Array.from({ length: 4 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </ProductGrid>
        ) : bestSellers.isError ? (
          <ErrorState
            error={bestSellers.error?.message || 'Lỗi tải sản phẩm bán chạy'}
            onRetry={() => bestSellersQuery.refetch()}
            retryText="Thử lại"
          />
        ) : bestSellers.data?.data && bestSellers.data.data.length > 0 ? (
          <ProductGrid>
            {bestSellers.data?.data?.map((product: ProductItem) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={product.price}
                thumbnail={product.thumbnail}
                slug={product.slug}
                images={product.images || [product.thumbnail]}
                description={product.description || ''}
                categoryId={product.categoryId || ''}
                categoryName={product.categoryName || ''}
                rating={product.rating || 0}
                reviewCount={product.reviewCount || 0}
                stock={product.stock || 0}
              />
            ))}
          </ProductGrid>
        ) : (
          <EmptyState
            title="Không có sản phẩm bán chạy"
            description="Hiện tại chưa có thông tin sản phẩm bán chạy."
            actionLabel="Tải lại"
            onAction={() => bestSellersQuery.refetch()}
          />
        )}
      </PageSection>

      {/* New Arrivals Section */}
      <PageSection
        title="Sản phẩm mới về"
        className="py-16 bg-neutral-50 dark:bg-neutral-900"
        headerActions={
          <Link
            to="/shop?sort=newest"
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center"
          >
            Xem tất cả
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 ml-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        }
      >
        {newArrivals.isLoading ? (
          <ProductGrid>
            {Array.from({ length: 4 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </ProductGrid>
        ) : newArrivals.isError ? (
          <ErrorState
            error={newArrivals.error?.message || 'Lỗi tải sản phẩm mới về'}
            onRetry={() => newArrivalsQuery.refetch()}
            retryText="Thử lại"
          />
        ) : newArrivals.data?.data && newArrivals.data.data.length > 0 ? (
          <ProductGrid>
            {newArrivals.data?.data?.map((product: ProductItem) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={product.price}
                thumbnail={product.thumbnail}
                slug={product.slug}
                images={product.images || [product.thumbnail]}
                description={product.description || ''}
                categoryId={product.categoryId || ''}
                categoryName={product.categoryName || ''}
                rating={product.rating || 0}
                reviewCount={product.reviewCount || 0}
                stock={product.stock || 0}
              />
            ))}
          </ProductGrid>
        ) : (
          <EmptyState
            title="Không có sản phẩm mới"
            description="Hiện tại chưa có sản phẩm mới nào."
            actionLabel="Tải lại"
            onAction={() => newArrivalsQuery.refetch()}
          />
        )}
      </PageSection>

      {/* Categories */}
      <PageSection
        title={t('homepage.categories.title')}
        className="py-16 bg-white dark:bg-neutral-800"
      >
        {categories.isLoading ? (
          <CategoryGrid>
            {Array.from({ length: 6 }).map((_, index) => (
              <CategoryCardSkeleton key={index} />
            ))}
          </CategoryGrid>
        ) : categories.isError ? (
          <ErrorState
            error={categories.error}
            onRetry={categories.retry}
            retryText="Thử lại"
          />
        ) : categories.isEmpty ? (
          <EmptyState
            title="Không có danh mục"
            description="Hiện tại chưa có danh mục nào để hiển thị."
          />
        ) : (
          <CategoryGrid>
            {displayCategories.map((category) => (
              <Link
                key={category.id}
                to={`/shop?category=${category.slug}`}
                className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="aspect-w-3 aspect-h-2 bg-neutral-100 dark:bg-neutral-700">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={createCategoryImageErrorHandler(category.name)}
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6">
                  <h3 className="text-xl font-bold text-white mb-1 drop-shadow-md">
                    {category.name}
                  </h3>
                  <p className="text-white text-sm drop-shadow-md">
                    {category.count} {t('homepage.categories.productsCount')}
                  </p>
                </div>
              </Link>
            ))}
          </CategoryGrid>
        )}
      </PageSection>

      {/* Promotion Banner */}
      <PageSection className="py-16 bg-primary-50 dark:bg-primary-900/30">
        <div className="bg-white dark:bg-neutral-800 rounded-xl overflow-hidden shadow-lg">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/2">
              <img
                src="https://images.unsplash.com/photo-1607083206968-13611e3d76db?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2215&q=80"
                alt={t('homepage.promotion.imageAlt')}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
              <span className="text-secondary-500 font-semibold text-sm uppercase tracking-wider mb-2">
                {t('homepage.promotion.badge')}
              </span>
              <h2 className="text-2xl md:text-4xl font-bold text-neutral-800 dark:text-neutral-100 mb-4">
                {t('homepage.promotion.title')}
              </h2>
              <p className="text-neutral-600 dark:text-neutral-300 mb-8">
                {t('homepage.promotion.description')}{' '}
                <strong>{t('homepage.promotion.promoCode')}</strong>{' '}
                {t('homepage.promotion.atCheckout')}
              </p>
              <div>
                <Link
                  to="/shop?sort=newest"
                  className="bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 px-6 py-4 text-lg rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
                  </svg>
                  {t('homepage.promotion.shopNewArrivals')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </PageSection>

      {/* Newsletter */}
      <PageSection
        className="py-16 bg-white dark:bg-neutral-800 relative overflow-hidden"
        containerized={false}
      >
        <div className="absolute inset-0 opacity-10">
          <img
            src="https://images.unsplash.com/photo-1607082349566-187342175e2f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
            alt={t('homepage.newsletter.backgroundAlt')}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="container mx-auto px-4 max-w-3xl text-center relative z-10">
          <h2 className="text-2xl md:text-3xl font-bold text-neutral-800 dark:text-neutral-100 mb-3">
            {t('homepage.newsletter.title')}
          </h2>
          <p className="text-neutral-600 dark:text-neutral-300 mb-8">
            {t('homepage.newsletter.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder={t('homepage.newsletter.emailPlaceholder')}
              className="flex-grow px-4 py-3 rounded-lg sm:rounded-r-none border border-neutral-300 dark:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
            />
            <PremiumButton
              variant="primary"
              size="large"
              iconType="arrow-right"
              className="px-6 py-3 sm:rounded-l-none"
            >
              {t('homepage.newsletter.subscribe')}
            </PremiumButton>
          </div>
        </div>
      </PageSection>
    </PageLayout>
  );
};

export default HomePage;
