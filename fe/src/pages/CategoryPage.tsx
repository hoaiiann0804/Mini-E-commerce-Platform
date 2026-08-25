import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { mockProducts } from "@/data/mockProducts";
import { Product } from "@/types/product.types";
import ProductCard from "@/components/features/ProductCard";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { getCategoryBySlug } from "@/data/mockCategories";

const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      navigate("/not-found");
      return;
    }

    // Trực tiếp lấy category từ dữ liệu mock để tránh vấn đề với API
    const directCategory = getCategoryBySlug(slug);

    if (!directCategory) {
      console.error(`Category with slug "${slug}" not found`);
      navigate("/not-found");
      return;
    }

    setIsLoading(true);

    // Filter products by category ID
    const filteredProducts = mockProducts.filter(
      (product) => product.categoryId === directCategory.id
    );

    // Simulate API delay
    setTimeout(() => {
      setProducts(filteredProducts);
      setIsLoading(false);
    }, 500);
  }, [slug, navigate]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Lấy thông tin danh mục trực tiếp từ dữ liệu mock
  const categoryInfo = getCategoryBySlug(slug || "");

  if (!categoryInfo) {
    return null; // Sẽ được xử lý trong useEffect
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4">
          {categoryInfo.name}
        </h1>
        {categoryInfo.description && (
          <p className="text-neutral-600 dark:text-neutral-400 max-w-3xl">
            {categoryInfo.description}
          </p>
        )}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
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
          <p className="text-neutral-500 dark:text-neutral-400">
            There are no products in this category yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryPage;
