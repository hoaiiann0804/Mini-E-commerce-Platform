import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import ReviewForm from "./ReviewForm";
import ReviewList from "./ReviewList";
import { useNavigate } from "react-router-dom";

interface ReviewSectionProps {
  productId: string;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({ productId }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();

  const handleReviewSubmitSuccess = () => {
    setShowReviewForm(false);
    // Trigger refresh of review list
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Write Review Section */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Đánh giá sản phẩm
          </h3>

          {isAuthenticated && !showReviewForm && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
            >
              Viết đánh giá
            </button>
          )}
        </div>

        {/* Review Form */}
        {showReviewForm && (
          <ReviewForm
            productId={productId}
            onSubmitSuccess={handleReviewSubmitSuccess}
            onCancel={() => setShowReviewForm(false)}
          />
        )}

        {/* If not authenticated and not showing form, show login prompt */}
        {!isAuthenticated && !showReviewForm && (
          <div className="text-center py-6 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg">
            <div className="text-neutral-500 dark:text-neutral-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 mx-auto mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              <p className="text-sm mb-3">
                Đăng nhập để viết đánh giá cho sản phẩm này
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <button
                  onClick={() => {
                    navigate("/login");
                  }}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => {
                    navigate("/register");
                  }}
                  className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors text-sm"
                >
                  Đăng ký
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reviews List */}
      <ReviewList key={refreshKey} productId={productId} />
    </div>
  );
};

export default ReviewSection;
