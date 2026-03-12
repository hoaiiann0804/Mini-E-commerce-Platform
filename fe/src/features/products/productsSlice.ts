import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '@/types';

interface ProductsState {
  recentlyViewed: Product[];
  compareList: Product[];
  filters: {
    priceRange: [number, number];
    categories: string[];
    attributes: Record<string, string[]>;
    sortBy: string;
  };
}

const MAX_RECENTLY_VIEWED = 10;

const initialState: ProductsState = {
  recentlyViewed: [],
  compareList: [],
  filters: {
    priceRange: [0, 10000000], // Default price range in VND
    categories: [],
    attributes: {},
    sortBy: 'newest',
  },
};

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    addToRecentlyViewed: (state, action: PayloadAction<Product>) => {
      // Remove if already exists
      state.recentlyViewed = state.recentlyViewed.filter(
        (product) => product.id !== action.payload.id
      );

      // Add to the beginning
      state.recentlyViewed.unshift(action.payload);

      // Limit to MAX_RECENTLY_VIEWED items
      if (state.recentlyViewed.length > MAX_RECENTLY_VIEWED) {
        state.recentlyViewed = state.recentlyViewed.slice(
          0,
          MAX_RECENTLY_VIEWED
        );
      }

      // Save to localStorage
      localStorage.setItem(
        'recentlyViewed',
        JSON.stringify(state.recentlyViewed)
      );
    },

    clearRecentlyViewed: (state) => {
      state.recentlyViewed = [];
      localStorage.removeItem('recentlyViewed');
    },

    addToCompareList: (state, action: PayloadAction<Product>) => {
      // Check if already in compare list
      if (
        !state.compareList.some((product) => product.id === action.payload.id)
      ) {
        // Limit to 4 products for comparison
        if (state.compareList.length < 4) {
          state.compareList.push(action.payload);
        }
      }
    },

    removeFromCompareList: (state, action: PayloadAction<string>) => {
      state.compareList = state.compareList.filter(
        (product) => product.id !== action.payload
      );
    },

    clearCompareList: (state) => {
      state.compareList = [];
    },

    setPriceRange: (state, action: PayloadAction<[number, number]>) => {
      state.filters.priceRange = action.payload;
    },

    setCategories: (state, action: PayloadAction<string[]>) => {
      state.filters.categories = action.payload;
    },

    setAttributes: (state, action: PayloadAction<Record<string, string[]>>) => {
      state.filters.attributes = action.payload;
    },

    setSortBy: (state, action: PayloadAction<string>) => {
      state.filters.sortBy = action.payload;
    },

    clearFilters: (state) => {
      state.filters = initialState.filters;
    },

    // Load recently viewed from localStorage on app init
    loadRecentlyViewed: (state) => {
      const saved = localStorage.getItem('recentlyViewed');
      if (saved) {
        try {
          state.recentlyViewed = JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse recently viewed products', e);
          state.recentlyViewed = [];
        }
      }
    },
  },
});

export const {
  addToRecentlyViewed,
  clearRecentlyViewed,
  addToCompareList,
  removeFromCompareList,
  clearCompareList,
  setPriceRange,
  setCategories,
  setAttributes,
  setSortBy,
  clearFilters,
  loadRecentlyViewed,
} = productsSlice.actions;

export default productsSlice.reducer;
