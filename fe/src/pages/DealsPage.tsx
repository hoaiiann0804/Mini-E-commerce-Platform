import { useState, useMemo } from "react";
import { useGetDealsQuery } from "@/services/productApi";
import ProductCard from "@/components/features/ProductCard";
import ProductListCard from "@/components/features/ProductListCard";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Select from "@/components/common/Select";
import { Product } from "@/types/product.types";

const DealsPage: React.FC = () => {
  const [sortOption, setSortOption] = useState("discount_desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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
  const formattedProducts = useMemo<Product[]>(() => {
    if (!dealsData?.data) return [];

    return dealsData.data.map((item: any) => {
      // Chuyển đổi chuỗi giá thành số
      const price =
        typeof item.price === "string" ? parseFloat(item.price) : item.price;
      const compareAtPrice =
        typeof item.compareAtPrice === "string"
          ? parseFloat(item.compareAtPrice)
          : item.compareAtPrice;

      // Tính discountPercentage từ compareAtPrice và price
      const discountPercentage =
        compareAtPrice && compareAtPrice > price
          ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
          : 0;

      // Tạo đối tượng ratings nếu không có
      const ratings = {
        average: 4.5,
        count: 10,
      };

      return {
        ...item,
        price,
        compareAtPrice,
        discountPercentage,
        ratings,
        isNew:
          item.createdAt &&
          new Date(item.createdAt) >
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Sản phẩm mới nếu được tạo trong 7 ngày qua
        categoryName: item.categories?.[0]?.name || "Uncategorized",
        stock: item.stockQuantity || item.stock || 0,
      } as Product;
    });
  }, [dealsData]);

  const sortOptions = [
    { value: "discount_desc", label: "Giảm giá cao nhất" },
    { value: "price_asc", label: "Giá: Thấp đến cao" },
    { value: "price_desc", label: "Giá: Cao đến thấp" },
    { value: "newest", label: "Mới nhất" },
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
          Không thể tải dữ liệu ưu đãi
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Đã có lỗi xảy ra khi tải danh sách ưu đãi. Vui lòng thử lại sau.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      {/* Hero section */}
      <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-xl p-8 mb-12 text-white text-center">
        <h1 className="text-4xl font-bold mb-4">Siêu Ưu Đãi & Giảm Giá</h1>
        <p className="text-lg max-w-2xl mx-auto mb-6">
          Khám phá các ưu đãi tốt nhất của chúng tôi với mức giảm giá từ 50% trở lên.
        </p>
        <div className="inline-block bg-white text-red-600 font-bold py-3 px-6 rounded-full text-lg">
          Giảm giá tới 70%
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {/* Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <span className="text-neutral-600 dark:text-neutral-400">
              Tìm thấy {formattedProducts.length} sản phẩm
            </span>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-neutral-700 shadow-sm"
                    : "text-neutral-500"
                }`}
                title="Dạng lưới"
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
                onClick={() => setViewMode("list")}
                className={`p-2 rounded ${
                  viewMode === "list"
                    ? "bg-white dark:bg-neutral-700 shadow-sm"
                    : "text-neutral-500"
                }`}
                title="Dạng danh sách"
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
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10 auto-rows-fr"
                : "space-y-8"
            }
          >
            {formattedProducts.map((product: Product) =>
              viewMode === "grid" ? (
                <ProductCard
                  key={product.id}
                  {...product}
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
                <ProductListCard key={product.id} {...product} />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DealsPage;
