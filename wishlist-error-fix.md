# Wishlist Persistence Error Fix

## Problem Description

When reloading the web UI, the wishlist page showed "Your wishlist is empty" even though items were previously added. This occurred because of inconsistent localStorage key usage in the Redux slice.

## Root Cause

In `fe/src/features/wishlist/wishlistSlice.ts`:

- The initial state was reading from localStorage using key `"wishlistItem"` (singular)
- All other operations (add, remove, clear) were using key `"wishlistItems"` (plural)
- This mismatch caused the initial state to always load an empty array on page reload
- Additionally, the `initiaLizeWishlist` action was defined but never called in the component

## Solution Applied

### 1. Fixed localStorage Key Consistency

**File:** `fe/src/features/wishlist/wishlistSlice.ts`

Changed the initial state to use the correct key:

```typescript
// Before
items: JSON.parse(localStorage.getItem("wishlistItem") || "[]"),

// After
items: JSON.parse(localStorage.getItem("wishlistItems") || "[]"),
```

Also fixed the `clearWishlist` reducer:

```typescript
// Before
localStorage.removeItem("wishlistItem");

// After
localStorage.removeItem("wishlistItems");
```

### 2. Added Initialization Logic

**File:** `fe/src/pages/WishListPage.tsx`

Added `useEffect` to dispatch `initiaLizeWishlist` on component mount:

```typescript
import { initiaLizeWishlist } from "@/features/wishlist/wishlistSlice";

const WishListPage = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(initiaLizeWishlist());
  }, [dispatch]);

  // ... rest of component
};
```

## Files Modified

- `fe/src/features/wishlist/wishlistSlice.ts`
- `fe/src/pages/WishListPage.tsx`

## Testing

- Add items to wishlist
- Reload the page
- Verify items persist and display correctly

## Additional Fixes Applied

### 3. Fixed API Definition and Response Handling

**File:** `fe/src/services/wishlistApi.ts`

- Fixed `removeWishlistItem` mutation to accept `string` parameter instead of `void`
- Fixed all `transformResponse` functions to return proper `BackendWishlist` objects with required `items` array

### 4. Fixed Remove Item Functionality

**File:** `fe/src/components/features/WishListCard.tsx`

- Fixed `handleRemove` function to properly call `removeWishlistItem(item.id)` with the item ID
- Removed server response handling that was causing UI to show empty wishlist
- Now directly updates local state after successful API call

### 5. Fixed Redux Reducer Logic

**File:** `fe/src/features/wishlist/wishlistSlice.ts`

- Fixed `removeItemWishlist` reducer to filter by `item.id` instead of `item.productId`
- Fixed `convertServerWishlist` helper to use `serverItem.productId` for the productId field

### 6. Fixed Price Display for Products Without Discounts

**File:** `fe/src/components/features/WishListCard.tsx`

**Problem:** Products without discounts were showing "0.00 đ" instead of the correct price.

**Solution:** Updated the price display logic to handle cases where `item.price` is 0 or invalid:

```typescript
// Before
{item.price.toLocaleString("vi-VN")}đ

// After
{(item.price > 0 ? item.price : item.compareAtPrice || 0).toLocaleString("vi-VN")}đ
```

Also updated the strikethrough price condition to only show when there's a valid discount:

```typescript
// Before
{item.compareAtPrice && item.compareAtPrice > item.price && (

// After
{item.compareAtPrice && item.price > 0 && item.compareAtPrice > item.price && (
```

**Result:** Products now display correct prices whether they have discounts or not, and the strikethrough price only appears for valid discounted items.

## Files Modified

- `fe/src/features/wishlist/wishlistSlice.ts`
- `fe/src/pages/WishListPage.tsx`
- `fe/src/services/wishlistApi.ts`
- `fe/src/components/features/WishListCard.tsx`

## Testing

- Add items to wishlist
- Reload the page
- Verify items persist and display correctly
- Remove individual items and verify only that item is removed (not all items)
- Check price display for products with and without discounts

## Status

✅ Fixed - Wishlist items now persist across page reloads, remove functionality works correctly, and price display is accurate for all product types
