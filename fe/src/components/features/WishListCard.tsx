import { WishlistItem } from "@/types";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  removeItemWishlist,
  setServerWishList,
} from "@/features/wishlist/wishlistSlice";
import { useRemoveWishlistItemMutation } from "@/services/wishlistApi";
import { addNotification } from "@/features/ui/uiSlice";
import { RootState } from "@/store";
interface WishListCardProps {
  items: WishlistItem[];
}

const WishListCard: React.FC<WishListCardProps> = ({ items }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const [removeWishlistItem, { isLoading: isRemoving }] =
    useRemoveWishlistItemMutation();

  //handle Remove from Wishlist
  const handleRemove = async (item: WishlistItem) => {
    if (isAuthenticated) {
      try {
        await removeWishlistItem(item.id).unwrap();
        console.log("✅ Remove API success");
        // Remove from local state
        dispatch(removeItemWishlist(item));
        dispatch(
          addNotification({
            message: `${item.name} đã được xóa khỏi danh sách yêu thích`,
            type: "success",
            duration: 3000,
          })
        );
      } catch (err: any) {
        console.error("❌ Remove API thất bại", err);
        // Fallback to local state management
        dispatch(removeItemWishlist(item));
        dispatch(
          addNotification({
            message:
              "Không thể xóa khỏi danh sách yêu thích, đã cập nhật cục bộ",
            type: "error",
            duration: 3000,
          })
        );
      }
    } else {
      // For unauthenticated users, use local state management
      dispatch(removeItemWishlist(item));
      dispatch(
        addNotification({
          message: `${item.name} đã được xóa khỏi yêu thích`,
          type: "success",
          duration: 3000,
        })
      );
    }
  };

  // Force re-render when items prop changes
  React.useEffect(() => {
    // This effect ensures the component re-renders when items prop changes
  }, [items]);
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          Your wishlist is empty
        </p>
      </div>
    );
  }

  return (
    <div className="mb-4 grid gap-4 sm:grid-cols-2 md:mb-8 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.productId}
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="block w-full h-full">
            <div>
              <a href="#">
                <img
                  className="mx-auto h-full dark:hidden"
                  src={item.thumbnail}
                  alt={item.name}
                />
                <img
                  className="mx-auto hidden h-full dark:block"
                  src={item.thumbnail}
                  alt={item.name}
                />
              </a>
            </div>
            <div className="pt-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                {item.compareAtPrice && item.compareAtPrice > item.price && (
                  <span className="me-2 rounded bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800 dark:bg-primary-900 dark:text-primary-300">
                    Tiết kiệm {(item.compareAtPrice - item.price).toLocaleString("vi-VN")}đ
                  </span>
                )}
                <div className="flex items-center justify-end gap-1">
                  <Link to={`/products/${item.id}`}>
                    <button
                      type="button"
                      data-tooltip-target="tooltip-quick-look"
                      className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                    >
                      <span className="sr-only"> Quick look </span>
                      <svg
                        className="h-5 w-5"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        width={24}
                        height={24}
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke="currentColor"
                          strokeWidth={2}
                          d="M21 12c0 1.2-4.03 6-9 6s-9-4.8-9-6c0-1.2 4.03-6 9-6s9 4.8 9 6Z"
                        />
                        <path
                          stroke="currentColor"
                          strokeWidth={2}
                          d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                        />
                      </svg>
                    </button>
                  </Link>
                  <div
                    id="tooltip-quick-look"
                    role="tooltip"
                    className="tooltip invisible absolute z-10 inline-block rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white opacity-0 shadow-sm transition-opacity duration-300 dark:bg-gray-700"
                    data-popper-placement="top"
                  >
                    Quick look
                    <div className="tooltip-arrow" data-popper-arrow />
                  </div>
                  <button
                    type="button"
                    data-tooltip-target="tooltip-remove-from-favorites"
                    className="rounded-lg p-2 text-red-500 hover:bg-gray-100 hover:text-red-600 dark:text-red-400 dark:hover:bg-gray-700 dark:hover:text-red-500"
                    onClick={() => handleRemove(item)}
                  >
                    <span className="sr-only">Remove from Favorites</span>
                    <svg
                      className="h-5 w-5"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5A5.5 5.5 0 017.5 3 5.5 5.5 0 0112 6.09 5.5 5.5 0 0116.5 3 5.5 5.5 0 0122 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </button>

                  <div
                    id="tooltip-add-to-favorites"
                    role="tooltip"
                    className="tooltip invisible absolute z-10 inline-block rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white opacity-0 shadow-sm transition-opacity duration-300 dark:bg-gray-700"
                    data-popper-placement="top"
                  >
                    Remove from Favorites
                    <div className="tooltip-arrow" data-popper-arrow />
                  </div>
                  <button
                    type="button"
                    data-tooltip-target="tooltip-add-to-cart"
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                    // onClick={() => handleAddToCart(item)} // đổi hàm xử lý
                  >
                    <span className="sr-only">Add to Cart</span>
                    <svg
                      className="h-5 w-5"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9h14l-2-9M9 21a1 1 0 11-2 0 1 1 0 012 0zm10 0a1 1 0 11-2 0 1 1 0 012 0z"
                      />
                    </svg>
                  </button>

                  <div
                    id="tooltip-add-to-cart"
                    role="tooltip"
                    className="tooltip invisible absolute z-10 inline-block rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white opacity-0 shadow-sm transition-opacity duration-300 dark:bg-gray-700"
                    data-popper-placement="top"
                  >
                    Add to Cart
                    <div className="tooltip-arrow" data-popper-arrow />
                  </div>
                </div>
              </div>
              <a
                href="#"
                className="text-lg font-semibold leading-tight text-gray-900 hover:underline dark:text-white"
              >
                {item.name}
              </a>
              {/* <div className="mt-2 flex items-center gap-2">
                <div className="flex items-center">
                  <svg
                    className="h-4 w-4 text-yellow-400"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M13.8 4.2a2 2 0 0 0-3.6 0L8.4 8.4l-4.6.3a2 2 0 0 0-1.1 3.5l3.5 3-1 4.4c-.5 1.7 1.4 3 2.9 2.1l3.9-2.3 3.9 2.3c1.5 1 3.4-.4 3-2.1l-1-4.4 3.4-3a2 2 0 0 0-1.1-3.5l-4.6-.3-1.8-4.2Z" />
                  </svg>
                  <svg
                    className="h-4 w-4 text-yellow-400"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M13.8 4.2a2 2 0 0 0-3.6 0L8.4 8.4l-4.6.3a2 2 0 0 0-1.1 3.5l3.5 3-1 4.4c-.5 1.7 1.4 3 2.9 2.1l3.9-2.3 3.9 2.3c1.5 1 3.4-.4 3-2.1l-1-4.4 3.4-3a2 2 0 0 0-1.1-3.5l-4.6-.3-1.8-4.2Z" />
                  </svg>
                  <svg
                    className="h-4 w-4 text-yellow-400"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M13.8 4.2a2 2 0 0 0-3.6 0L8.4 8.4l-4.6.3a2 2 0 0 0-1.1 3.5l3.5 3-1 4.4c-.5 1.7 1.4 3 2.9 2.1l3.9-2.3 3.9 2.3c1.5 1 3.4-.4 3-2.1l-1-4.4 3.4-3a2 2 0 0 0-1.1-3.5l-4.6-.3-1.8-4.2Z" />
                  </svg>
                  <svg
                    className="h-4 w-4 text-yellow-400"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M13.8 4.2a2 2 0 0 0-3.6 0L8.4 8.4l-4.6.3a2 2 0 0 0-1.1 3.5l3.5 3-1 4.4c-.5 1.7 1.4 3 2.9 2.1l3.9-2.3 3.9 2.3c1.5 1 3.4-.4 3-2.1l-1-4.4 3.4-3a2 2 0 0 0-1.1-3.5l-4.6-.3-1.8-4.2Z" />
                  </svg>
                  <svg
                    className="h-4 w-4 text-yellow-400"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M13.8 4.2a2 2 0 0 0-3.6 0L8.4 8.4l-4.6.3a2 2 0 0 0-1.1 3.5l3.5 3-1 4.4c-.5 1.7 1.4 3 2.9 2.1l3.9-2.3 3.9 2.3c1.5 1 3.4-.4 3-2.1l-1-4.4 3.4-3a2 2 0 0 0-1.1-3.5l-4.6-.3-1.8-4.2Z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  5.0
                </p>

                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  (455)
                </p>
              </div> */}
              <ul className="mt-2 flex items-center gap-4">
                <li className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 text-gray-500 dark:text-gray-400"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h6l2 4m-8-4v8m0-8V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v9h2m8 0H9m4 0h2m4 0h2v-4m0 0h-5m3.5 5.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm-10 0a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z"
                    />
                  </svg>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Fast Delivery
                  </p>
                </li>
                <li className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 text-gray-500 dark:text-gray-400"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth={2}
                      d="M8 7V6c0-.6.4-1 1-1h11c.6 0 1 .4 1 1v7c0 .6-.4 1-1 1h-1M3 18v-7c0-.6.4-1 1-1h11c.6 0 1 .4 1 1v7c0 .6-.4 1-1 1H4a1 1 0 0 1-1-1Zm8-3.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"
                    />
                  </svg>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Best Price
                  </p>
                </li>
              </ul>
              <div className="mt-4 flex items-center justify-between gap-4 mb-1">
                <p className="text-2xl font-extrabold leading-tight text-gray-900 dark:text-white">
                  {(item.price > 0 ? item.price : item.compareAtPrice || 0).toLocaleString("vi-VN")}đ
                </p>
              </div>
              <div className=" flex items-center justify-between">
                {item.compareAtPrice && item.price > 0 && item.compareAtPrice > item.price && (
                  <span className="text-base text-neutral-400 dark:text-neutral-500 line-through font-medium">
                    {item.compareAtPrice.toLocaleString("vi-VN")}đ
                  </span>
                )}
              </div>
            </div>
            {/* <div className="flex items-center justify-between">
              <button
                type="button"
                className="inline-flex items-center rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-4  focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
              >
                <svg
                  className="-ms-2 me-2 h-5 w-5"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width={24}
                  height={24}
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4h1.5L8 16m0 0h8m-8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm.75-3H7.5M11 7H6.312M17 4v6m-3-3h6"
                  />
                </svg>
                Add to cart
              </button>
            </div> */}
          </div>
        </div>
      ))}
    </div>
  );
};

export default WishListCard;
