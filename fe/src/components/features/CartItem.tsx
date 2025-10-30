import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from '@/utils/toast';
import { updateQuantity, removeItem } from '@/features/cart/cartSlice';
import {
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
} from '@/services/cartApi';
import { RootState } from '@/store';
import type { CartItem as CartItemType } from '@/types/cart.types';
import { formatPrice, parsePrice } from '@/utils/format';

interface CartItemProps {
  item: CartItemType;
  isCheckout?: boolean;
}

const CartItem: React.FC<CartItemProps> = ({ item, isCheckout = false }) => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [updateCartItem, { isLoading: isUpdating }] =
    useUpdateCartItemMutation();
  const [removeCartItem, { isLoading: isRemoving }] =
    useRemoveCartItemMutation();

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity <= 0 || newQuantity > 99) return;

    // Check stock limits
    if (item.stockQuantity && newQuantity > item.stockQuantity) {
      toast.error(`Chỉ còn ${item.stockQuantity} sản phẩm trong kho`);
      return;
    }

    try {
      // Always try server API first (works for both guest and authenticated users)
      if (item.id && typeof item.id === 'string') {
        await updateCartItem({
          id: item.id,
          data: { quantity: newQuantity },
        }).unwrap();
        toast.success('Đã cập nhật số lượng');
      } else {
        // Fallback to local cart for items without server ID
        dispatch(updateQuantity({ id: item.id, quantity: newQuantity }));
        toast.success('Đã cập nhật số lượng (offline)');
      }
    } catch (error: any) {
      console.error('Error updating cart item:', error);
      // Fallback to local cart
      dispatch(updateQuantity({ id: item.id, quantity: newQuantity }));
      toast.error('Không thể cập nhật trên server. Đã cập nhật local.');
    }
  };

  const handleRemove = async () => {
    try {
      // Always try server API first (works for both guest and authenticated users)
      if (item.id && typeof item.id === 'string') {
        await removeCartItem(item.id).unwrap();
        toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
      } else {
        // Fallback to local cart for items without server ID
        dispatch(removeItem(item.id));
        toast.success('Đã xóa sản phẩm khỏi giỏ hàng (offline)');
      }
    } catch (error: any) {
      console.error('Error removing cart item:', error);
      // Fallback to local cart
      dispatch(removeItem(item.id));
      toast.error('Không thể xóa trên server. Đã xóa local.');
    }
  };

  return (
    <div className="flex py-4 border-b border-neutral-200 dark:border-neutral-700 last:border-b-0">
      {/* Product image */}
      <div className="w-20 h-20 flex-shrink-0">
        
        <Link to={`/products/${item.productId}`}>
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover rounded-md"
          />
        </Link>
      </div>

      {/* Product details */}
      <div className="ml-4 flex-grow">
        <div className="flex justify-between">
          <Link
            to={`/products/${item.productId}`}
            className="text-neutral-800 dark:text-neutral-100 font-medium hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            {item.name}
          </Link>
          <span className="text-neutral-900 dark:text-white font-semibold">
            {formatPrice(parsePrice(item.price) * item.quantity)}
          </span>
        </div>

        {/* Product attributes if any */}
        {item.attributes && Object.keys(item.attributes).length > 0 && (
          <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {Object.entries(item.attributes).map(([key, value]) => (
              <span key={key} className="mr-3">
                {key}: {value}
              </span>
            ))}
          </div>
        )}

        {/* Price per item */}
        <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {formatPrice(item.price)} mỗi sản phẩm
        </div>

        {/* Stock status */}
        {item.inStock === false && (
          <div className="mt-1 text-sm text-red-500">Out of stock</div>
        )}
        {item.stockQuantity && item.stockQuantity <= 5 && item.inStock && (
          <div className="mt-1 text-sm text-yellow-600">
            Only {item.stockQuantity} left in stock
          </div>
        )}

        {/* Quantity controls */}
        <div className="mt-2 flex justify-between items-center">
          {!isCheckout ? (
            <div className="flex items-center">
              <button
                onClick={() => handleQuantityChange(item.quantity - 1)}
                disabled={isUpdating || item.quantity <= 1}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Decrease quantity"
              >
                {isUpdating ? (
                  <div className="w-3 h-3 border border-neutral-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 12H4"
                    />
                  </svg>
                )}
              </button>
              <span className="mx-3 w-8 text-center">{item.quantity}</span>
              <button
                onClick={() => handleQuantityChange(item.quantity + 1)}
                disabled={
                  isUpdating ||
                  !!(item.stockQuantity && item.quantity >= item.stockQuantity)
                }
                className="w-8 h-8 flex items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Increase quantity"
              >
                {isUpdating ? (
                  <div className="w-3 h-3 border border-neutral-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                )}
              </button>
            </div>
          ) : (
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              Quantity: {item.quantity}
            </div>
          )}

          {!isCheckout && (
            <button
              onClick={handleRemove}
              disabled={isRemoving}
              className="text-neutral-500 dark:text-neutral-400 hover:text-error dark:hover:text-error transition-colors disabled:opacity-50"
              aria-label="Remove item"
            >
              {isRemoving ? (
                <div className="w-5 h-5 border border-neutral-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartItem;
