import chatReducer from '@/features/ai/store/chatSlice';
import authReducer from '@/features/auth/authSlice';
import cartReducer from '@/features/cart/cartSlice'
import productsReducer from '@/features/products/productsSlice';
import uiReducer from '@/features/ui/uiSlice';
import wishlishReducer from "@/features/wishlist/wishlistSlice"
// Wishlist feature removed
import { api } from '@/services/api';
import { attributeApi } from '@/services/attributeApi';
import { configureStore } from '@reduxjs/toolkit';

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    [attributeApi.reducerPath]: attributeApi.reducer,
    auth: authReducer,
    cart: cartReducer,
    ui: uiReducer,
    chat: chatReducer,
    products: productsReducer,
    wishlist: wishlishReducer,
    // wishlist: wishlistReducer, // Removed
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware, attributeApi.middleware),
});

// Disable auto-refetch to prevent unnecessary API calls
// setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
