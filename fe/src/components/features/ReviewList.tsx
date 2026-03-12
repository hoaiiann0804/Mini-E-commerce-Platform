import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import {
  useGetProductReviewsQuery,
  useMarkReviewHelpfulMutation,
  Review,
  ReviewFilters,
} from '@/services/reviewApi';
import { Rating } from '@/components/common/Rating';

interface ReviewListProps {
  productId: string;
}

const ReviewList: React.FC<ReviewListProps> = ({ productId }) => {
  const { isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth
  );
  const [markReviewHelpful] = useMarkReviewHelpfulMutation();

  const [filters, setFilters] = useState<ReviewFilters>({
    page: 1,
    limit: 10,
    sort: 'newest',
  });

  const {
    data: reviewsData,
    isLoading,
    error,
  } = useGetProductReviewsQuery(
    { productId, ...filters },
    {
      skip: !productId || productId === 'undefined',
    }
  );

  const handleFilterChange = (newFilters: Partial<ReviewFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleLoadMore = () => {
    const currentPage = filters.page ?? 1;
    if (reviewsData && currentPage < reviewsData.data.pages) {
      setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }));
    }
  };

  const handleMarkHelpful = async (reviewId: string, helpful: boolean) => {
    if (!isAuthenticated) {
      // Redirect to login
      window.location.href = '/login';
      return;
    }

    try {
      // Truyền productId vào mutation để invalidate cache cho danh sách review của sản phẩm
      await markReviewHelpful({
        id: reviewId,
        helpful,
        productId,
      }).unwrap();
    } catch (error) {
      console.error('Error marking review helpful:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-1/4"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="h-10 w-10 bg-neutral-200 dark:bg-neutral-700 rounded-full"></div>
                <div className="space-y-1">
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-24"></div>
                  <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-32"></div>
                </div>
              </div>
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
              <div className="h-16 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-6">
        <div className="text-center text-red-600 dark:text-red-400">
          <p>Có lỗi xảy ra khi tải đánh giá. Vui lòng thử lại sau.</p>
        </div>
      </div>
    );
  }

  const reviews = reviewsData?.data?.reviews || [];
  const totalReviews = reviewsData?.data?.total || 0;

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-neutral-900 dark:text-white">
          Đánh giá sản phẩm ({totalReviews})
        </h3>

        {/* Filter controls */}
        <div className="flex items-center space-x-4">
          <select
            value={filters.sort}
            onChange={(e) =>
              handleFilterChange({ sort: e.target.value as any })
            }
            className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white text-sm"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="highest_rating">Đánh giá cao nhất</option>
            <option value="lowest_rating">Đánh giá thấp nhất</option>
            <option value="most_helpful">Hữu ích nhất</option>
          </select>

          <select
            value={filters.rating || ''}
            onChange={(e) =>
              handleFilterChange({
                rating: e.target.value ? parseInt(e.target.value) : undefined,
              })
            }
            className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white text-sm"
          >
            <option value="">Tất cả sao</option>
            <option value="5">5 sao</option>
            <option value="4">4 sao</option>
            <option value="3">3 sao</option>
            <option value="2">2 sao</option>
            <option value="1">1 sao</option>
          </select>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 mx-auto mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z"
            />
          </svg>
          <p>Chưa có đánh giá nào cho sản phẩm này.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review: Review) => (
            <div
              key={review.id}
              className="border-b border-neutral-200 dark:border-neutral-700 pb-6 last:border-b-0"
            >
              <div className="flex items-start space-x-4">
                {/* User avatar */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium">
                    {review.user?.firstName?.charAt(0) || 'U'}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  {/* User info and rating */}
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-sm font-medium text-neutral-900 dark:text-white">
                        {review.user?.firstName} {review.user?.lastName}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Rating value={review.rating} size="small" readonly />
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          {formatDate(review.createdAt)}
                        </span>
                        {review.isVerified && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <svg
                              className="w-3 h-3 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Đã mua hàng
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Review title */}
                  {review.title && (
                    <h5 className="text-sm font-medium text-neutral-900 dark:text-white mb-2">
                      {review.title}
                    </h5>
                  )}

                  {/* Review content */}
                  <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-3">
                    {review.content}
                  </p>

                  {/* Review images */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {review.images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Review image ${index + 1}`}
                          className="w-16 h-16 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => {
                            // Open image in modal or new tab
                            window.open(image, '_blank');
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Helpful buttons */}
                  <div className="flex items-center space-x-4 text-sm">
                    <button
                      onClick={() => handleMarkHelpful(review.id, true)}
                      className="flex items-center space-x-1 text-neutral-500 dark:text-neutral-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                        />
                      </svg>
                      <span>Hữu ích ({review.likes})</span>
                    </button>

                    <button
                      onClick={() => handleMarkHelpful(review.id, false)}
                      className="flex items-center space-x-1 text-neutral-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10H5a2 2 0 00-2 2v6a2 2 0 002 2h2.5"
                        />
                      </svg>
                      <span>Không hữu ích ({review.dislikes})</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Load more button */}
          {reviewsData && (filters.page ?? 1) < reviewsData.data.pages && (
            <div className="text-center pt-4">
              <button
                onClick={handleLoadMore}
                className="px-6 py-2 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
              >
                Xem thêm đánh giá
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewList;
