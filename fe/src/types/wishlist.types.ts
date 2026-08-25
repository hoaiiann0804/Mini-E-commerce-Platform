export interface WishlistItem {
  id: string; // This is the wishlist item ID from backend
  productId: string; // product ID
  name: string;
  price: number;
  compareAtPrice?: number;
  thumbnail: string;
  slug: string;
  dateAdded: string; // Added dateAdded property
}

export interface ServerWishlistItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  thumbnail: string;
  slug: string;
  dateAdded: string;
}

export interface ServerWishlist {
  id: string;
  userId: string;
  items: ServerWishlistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface WishlistState {
  items: WishlistItem[];
  serverWishlist: ServerWishlist | null;
}
