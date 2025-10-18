export interface WishlistItem {
    id: string;
    name: string;
    price: number;
    thumbnail: string;
    slug: string;
    dateAdded: string;
  }
  
  export interface WishlistState {
    items: WishlistItem[];
  }
  
  export interface AddtoWishlist{
    productId: string
  }

//   export interface RemoveIteminWishList{
//     sucess: boolean,
//     message: string
//   }