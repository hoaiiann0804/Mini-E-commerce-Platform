import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { useAuth } from "./useAuth";
import { useGetCartQuery, useSyncCartMutation } from "@/services/cartApi";
import { setServerCart, clearCart } from "@/features/cart/cartSlice";

/**
 * Hook to sync cart data between local storage and server
 * Handles cart syncing when user logs in/out
 */
export const useCartSync = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const localCartItems = useSelector((state: RootState) => state.cart.items);

  // Get server cart for authenticated users
  const {
    data: serverCart,
    isLoading: isLoadingCart,
    error: cartError,
  } = useGetCartQuery(undefined, {
    skip: !isAuthenticated,
    // Remove polling - cart will update via invalidatesTags when mutations happen
    // pollingInterval: 30000, // Disabled to prevent API spam
  });

  // Sync cart mutation
  const [syncCart, { isLoading: isSyncing }] = useSyncCartMutation();

  // Sync local cart to server when user logs in
  useEffect(() => {
    const syncLocalCartToServer = async () => {
      if (isAuthenticated && localCartItems.length > 0) {
        try {
          // Convert local cart items to server format
          const itemsToSync = localCartItems.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            name: item.name,
            price: item.price,
            image: item.image,
            attributes: item.attributes,
          }));

          // Sync to server
          const syncedCart = await syncCart({ items: itemsToSync }).unwrap();

          // Update Redux store with server response
          dispatch(setServerCart(syncedCart));

          //console.log('✅ Cart synced to server successfully');
        } catch (error) {
          console.error("❌ Failed to sync cart to server:", error);
        }
      }
    };

    syncLocalCartToServer();
  }, [isAuthenticated, dispatch, syncCart]); // Don't include localCartItems to avoid infinite loops

  // Update Redux store when server cart changes
  useEffect(() => {
    if (isAuthenticated && serverCart && !isSyncing) {
      dispatch(setServerCart(serverCart));
    }
  }, [serverCart, isAuthenticated, dispatch, isSyncing]);

  // Clear cart when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      // Only clear server cart data, keep local cart for guest users
      dispatch(
        setServerCart({
          id: null,
          items: [],
          totalItems: 0,
          subtotal: 0,
        })
      );
    }
  }, [isAuthenticated, dispatch]);

  return {
    isLoadingCart,
    isSyncing,
    cartError,
    serverCart,
  };
};

export default useCartSync;
