import { useState } from "react";
import { toast } from "@/utils/toast";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useCreateReviewMutation } from "@/services/reviewApi";

interface ReviewFormProps {
  productId: string;
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  productId,
  onSubmitSuccess,
  onCancel,
}) => {
  const { isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth
  );
  const [createReview, { isLoading }] = useCreateReviewMutation();

  const [formData, setFormData] = useState({
    rating: 0,
    title: "",
    comment: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Validate form
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (formData.rating === 0) {
      newErrors.rating = "Vui lòng chọn số sao đánh giá";
    }

    if (!formData.title.trim()) {
      newErrors.title = "Vui lòng nhập tiêu đề đánh giá";
    } else if (formData.title.length < 5 || formData.title.length > 100) {
      newErrors.title = "Tiêu đề phải từ 5-100 ký tự";
    }

    if (!formData.comment.trim()) {
      newErrors.comment = "Vui lòng nhập nội dung đánh giá";
    } else if (formData.comment.length < 10 || formData.comment.length > 1000) {
      newErrors.comment = "Nội dung phải từ 10-1000 ký tự";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await createReview({
        productId,
        rating: formData.rating,
        title: formData.title,
        comment: formData.comment,
      }).unwrap();

      toast.success("Đánh giá của bạn đã được gửi thành công!");

      // Reset form
      setFormData({
        rating: 0,
        title: "",
        comment: "",
      });
      setErrors({});

      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (error: any) {
      console.error("Error creating review:", error);

      // Handle specific error messages
      if (error?.data?.message) {
        toast.error(error.data.message);
      } else if (error?.message) {
        toast.error(error.message);
      } else {
        toast.error("Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại.");
      }
    }
  };

  // If user is not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-6 text-center">
        <div className="text-neutral-500 dark:text-neutral-400 mb-4">
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
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
            Đăng nhập để đánh giá sản phẩm
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
            Bạn cần đăng nhập để có thể viết đánh giá cho sản phẩm này
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                // Navigate to login page
                window.location.href = "/login";
              }}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
            >
              Đăng nhập
            </button>
            <button
              onClick={() => {
                // Navigate to register page
                window.location.href = "/register";
              }}
              className="px-6 py-2 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors font-medium"
            >
              Đăng ký
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-6 mb-8">
      <h3 className="text-xl font-semibold mb-4 text-neutral-900 dark:text-white">
        Viết đánh giá của bạn
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Đánh giá sao *
          </label>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => {
                  setFormData({ ...formData, rating: star });
                  // Xóa lỗi khi người dùng chọn rating
                  setErrors((prev) => ({ ...prev, rating: undefined }));
                }}
                className={`w-8 h-8 ${
                  star <= formData.rating
                    ? "text-yellow-400"
                    : "text-neutral-300 dark:text-neutral-600"
                } hover:text-yellow-400 transition-colors`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-full w-full"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
            <span className="ml-3 text-sm text-neutral-600 dark:text-neutral-400">
              {formData.rating > 0 && (
                <>
                  {formData.rating} sao
                  {formData.rating === 1 && " - Rất tệ"}
                  {formData.rating === 2 && " - Tệ"}
                  {formData.rating === 3 && " - Trung bình"}
                  {formData.rating === 4 && " - Tốt"}
                  {formData.rating === 5 && " - Tuyệt vời"}
                </>
              )}
            </span>
          </div>
          {errors.rating && (
            <p className="text-red-500 text-sm mt-1">{errors.rating}</p>
          )}
        </div>

        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
          >
            Tiêu đề đánh giá *
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => {
              setFormData({ ...formData, title: e.target.value });
              // Xóa lỗi khi người dùng nhập title
              setErrors((prev) => ({ ...prev, title: undefined }));
            }}
            placeholder="Nhập tiêu đề cho đánh giá của bạn"
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-neutral-700 dark:text-white"
            maxLength={100}
          />
          <div className="flex justify-between items-center mt-1">
            {errors.title && (
              <p className="text-red-500 text-sm">{errors.title}</p>
            )}
            <p className="text-xs text-neutral-500 dark:text-neutral-400 ml-auto">
              {formData.title.length}/100
            </p>
          </div>
        </div>

        {/* Comment */}
        <div>
          <label
            htmlFor="comment"
            className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
          >
            Nội dung đánh giá *
          </label>
          <textarea
            id="comment"
            value={formData.comment}
            onChange={(e) => {
              setFormData({ ...formData, comment: e.target.value });
              // Xóa lỗi khi người dùng nhập comment
              setErrors((prev) => ({ ...prev, comment: undefined }));
            }}
            placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
            rows={4}
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-neutral-700 dark:text-white resize-none"
            maxLength={1000}
          />
          <div className="flex justify-between items-center mt-1">
            {errors.comment && (
              <p className="text-red-500 text-sm">{errors.comment}</p>
            )}
            <p className="text-xs text-neutral-500 dark:text-neutral-400 ml-auto">
              {formData.comment.length}/1000
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Đang gửi...
              </span>
            ) : (
              "Gửi đánh giá"
            )}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors font-medium"
            >
              Hủy
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;
