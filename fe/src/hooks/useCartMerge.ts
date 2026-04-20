import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  useMergeCartMutation,
  useAddToCartMutation,
  useGetCartQuery,
} from '@/services/cartApi';
import { setServerCart } from '@/features/cart/cartSlice';
import { addNotification } from '@/features/ui/uiSlice';
import { clearJustLoggedIn } from '@/features/auth/authSlice';
import { RootState } from '@/store';

export const useCartMerge = (
  isAuthenticated: boolean,
  justLoggedIn: boolean
) => {
  const dispatch = useDispatch();
  const [mergeCart] = useMergeCartMutation();
  const [addToCart] = useAddToCartMutation();

  // Get cart items from Redux store
  const { items } = useSelector((state: RootState) => state.cart);

  // Get current server cart - don't skip when authenticated and just logged in
  const { data: serverCart, refetch } = useGetCartQuery(undefined, {
    skip: !isAuthenticated,
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    const performCartMerge = async () => {
      if (isAuthenticated && justLoggedIn) {
        try {
          //console.log('🔄 Checking for local cart items to merge...');

          // Check if there are items in localStorage
          const localItems = JSON.parse(
            localStorage.getItem('cartItems') || '[]'
          );

          if (localItems.length > 0) {
            //console.log('🛒 Found local cart items:', localItems);

            // First, get the current server cart
            await refetch();

            // Add each local item to the server cart one by one
            //console.log('🔄 Adding local items to server cart...');

            // Keep track of added items for notification
            let addedItemsCount = 0;

            // Add items one by one to preserve existing cart items
            for (const item of localItems) {
              try {
                await addToCart({
                  productId: item.productId,
                  variantId: item.variantId,
                  quantity: item.quantity,
                }).unwrap();

                addedItemsCount += item.quantity;
                //console.log(`✅ Added item ${item.name} to cart`);
              } catch (itemError) {
                console.error(
                  `❌ Failed to add item ${item.name} to cart:`,
                  itemError
                );
              }
            }

            // Get the final updated cart
            try {
              const result = await refetch();
              if (result && result.data) {
                // Update Redux store with the final cart
                dispatch(setServerCart(result.data));
                //console.log('✅ Cart merge successful:', result.data);
              } else if (serverCart) {
                // Fallback to current serverCart if refetch doesn't return new data
                dispatch(setServerCart(serverCart));
                //console.log(
                //   '✅ Cart merge successful (using current data):',
                //   serverCart
                // );
              }
            } catch (refetchError) {
              console.error('❌ Failed to refetch cart:', refetchError);
              // Still try to use the current serverCart if available
              if (serverCart) {
                dispatch(setServerCart(serverCart));
              }
            }

            // Show notification about merged items
            if (addedItemsCount > 0) {
              dispatch(
                addNotification({
                  message: `Đã thêm ${addedItemsCount} sản phẩm vào giỏ hàng của bạn`,
                  type: 'success',
                  duration: 3000,
                })
              );
            }
          } else {
            // If no local items, just merge any session cart on the server
            //console.log(
            //   '🔄 No local items, checking for session cart on server...'
            // );
            const mergedCart = await mergeCart().unwrap();

            // Update Redux store with merged cart
            dispatch(setServerCart(mergedCart));

            //console.log('✅ Server cart merge successful:', mergedCart);

            // Show notification if items were merged
            if (mergedCart.totalItems > 0) {
              dispatch(
                addNotification({
                  message: `Đã gộp ${mergedCart.totalItems} sản phẩm vào giỏ hàng của bạn`,
                  type: 'success',
                  duration: 3000,
                })
              );
            }
          }

          // Clear localStorage to prevent duplicate items
          localStorage.removeItem('cartItems');

          // Reset justLoggedIn flag to prevent re-merging on reload
          dispatch(clearJustLoggedIn());
        } catch (error: any) {
          console.error('❌ Cart merge failed:', error);

          // Reset justLoggedIn even if merge fails to prevent retry loops
          dispatch(clearJustLoggedIn());

          // Show error to user
          dispatch(
            addNotification({
              message: 'Không thể gộp giỏ hàng. Vui lòng thử lại sau.',
              type: 'error',
              duration: 3000,
            })
          );
        }
      }
    };

    performCartMerge();
  }, [
    isAuthenticated,
    justLoggedIn,
    mergeCart,
    addToCart,
    refetch,
    dispatch,
    items,
  ]);
};
