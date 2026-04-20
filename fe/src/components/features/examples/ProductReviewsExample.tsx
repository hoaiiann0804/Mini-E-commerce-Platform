import { useState } from "react";
import ProductReviews from "../ProductReviews";
import ReviewForm from "../ReviewForm";
import ReviewList from "../ReviewList";
import ReviewSummary from "../ReviewSummary";

/**
 * Example component showing how to use the review system
 * This component demonstrates different ways to integrate review components
 */
const ProductReviewsExample: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState("product-1");
  const [showForm, setShowForm] = useState(false);

  // Mock product data
  const products = [
    { id: "product-1", name: "iPhone 15 Pro", rating: 4.5, reviews: 123 },
    { id: "product-2", name: "Samsung Galaxy S24", rating: 4.2, reviews: 89 },
    { id: "product-3", name: "Google Pixel 8", rating: 4.7, reviews: 156 },
  ];

  const selectedProductData = products.find((p) => p.id === selectedProduct);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
          Review System Demo
        </h1>

        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
          Hệ thống đánh giá tích hợp với authentication và backend API. Chọn sản
          phẩm để xem demo các component khác nhau.
        </p>

        {/* Product Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Chọn sản phẩm:
          </label>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
          >
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} - {product.rating}⭐ ({product.reviews} reviews)
              </option>
            ))}
          </select>
        </div>

        {/* Component Examples */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              Individual Components
            </h3>

            <div className="space-y-4">
              <button
                onClick={() => setShowForm(!showForm)}
                className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                {showForm ? "Ẩn" : "Hiện"} Review Form
              </button>

              {showForm && (
                <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg">
                  <ReviewForm
                    productId={selectedProduct}
                    onSubmitSuccess={() => {
                      setShowForm(false);
                      //console.log('Review submitted successfully!');
                    }}
                    onCancel={() => setShowForm(false)}
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              Usage Examples
            </h3>

            <div className="space-y-3 text-sm">
              <div className="p-3 bg-neutral-50 dark:bg-neutral-700 rounded">
                <strong>ProductReviews:</strong> Component chính với tabs
              </div>
              <div className="p-3 bg-neutral-50 dark:bg-neutral-700 rounded">
                <strong>ReviewSection:</strong> Form + List combined
              </div>
              <div className="p-3 bg-neutral-50 dark:bg-neutral-700 rounded">
                <strong>ReviewSummary:</strong> Overview với rating distribution
              </div>
              <div className="p-3 bg-neutral-50 dark:bg-neutral-700 rounded">
                <strong>ReviewList:</strong> Danh sách review với filter
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Component Demo */}
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
          Complete Review System cho {selectedProductData?.name}
        </h2>

        <ProductReviews
          productId={selectedProduct}
          averageRating={selectedProductData?.rating || 0}
          totalReviews={selectedProductData?.reviews || 0}
        />
      </div>

      {/* Individual Components Demo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            Review Summary
          </h3>
          <ReviewSummary
            productId={selectedProduct}
            averageRating={selectedProductData?.rating || 0}
            totalReviews={selectedProductData?.reviews || 0}
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            Review List với Filters
          </h3>
          <ReviewList productId={selectedProduct} />
        </div>
      </div>

      {/* Implementation Notes */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
          Implementation Notes
        </h3>
        <ul className="space-y-2 text-blue-800 dark:text-blue-200 text-sm">
          <li>• Review system tích hợp với Redux auth state</li>
          <li>• Chỉ user đã đăng nhập mới có thể review</li>
          <li>• Backend check user đã mua sản phẩm chưa</li>
          <li>• Auto-refresh review list sau khi submit</li>
          <li>• Support image upload (tối đa 3 ảnh)</li>
          <li>• Form validation với error messages</li>
          <li>• Toast notifications cho user feedback</li>
          <li>• Responsive design với dark mode</li>
        </ul>
      </div>
    </div>
  );
};

export default ProductReviewsExample;
