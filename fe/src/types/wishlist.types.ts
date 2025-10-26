export interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  compareAtPrice: number;
  thumbnail: string;
  slug: string;
  //dateAdded: string;
}

export interface WishlistState {
  items: WishlistItem[];
  serverWishlist: ServerWishlist | null;
}

export interface AddtoWishlist {
  productId: string;
}

export interface ServerWishlist {
  id: string | null;
  items: WishlistItem[];
}

//   export interface RemoveIteminWishList{
//     sucess: boolean,
//     message: string
