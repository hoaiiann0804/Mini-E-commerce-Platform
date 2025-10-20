import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { WishlistItem, WishlistState } from "@/types/wishlist.types";
const initialState: WishlistState = {
  items: JSON.parse(localStorage.getItem("wishlistItem") || "[]"),
};

//Helper function to covert server wishlist item to local wishlist item
const convertServerWishlist = (serverItem: any): WishlistItem => ({
  id: serverItem.id,
  productId: serverItem.productId,
  name: serverItem.name,
  price: serverItem.price,
  thumbnail: serverItem.thumbnail,
  slug: serverItem.slug,
  dateAdded: serverItem.dateAdded,
});

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    addItemWishlist: (state, action: PayloadAction<WishlistItem>) => {
      const existingItemIndex = state.items.findIndex(
        (item) => item.productId === action.payload.productId
      );
      // Nếu chưa có (index === -1 ) thì thêm mới
      if (existingItemIndex === -1) {
        state.items.push(action.payload);
      }
      localStorage.setItem("wishlistItems", JSON.stringify(state.items));
    },
    removeItemWishlist: (state, action: PayloadAction<WishlistItem>) => {
      state.items = state.items.filter(
        (item) => item.productId !== action.payload.productId
      );
      localStorage.setItem("wishlistItems", JSON.stringify(state.items));
    },
  },
});

export const { addItemWishlist } = wishlistSlice.actions;

export default wishlistSlice.reducer;
