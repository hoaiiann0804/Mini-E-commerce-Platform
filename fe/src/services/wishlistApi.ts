import { url } from "inspector";
import { api } from "./api";
import { RootState } from "@/store";

export interface BackendWishlistItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  compareAtPrice: number;
  thumbnail: string;
  slug: string;
  //dateAdded: string;
}

export interface BackendWishlist {
  id: string | null;
  items: BackendWishlistItem[];
  message?: string;
}

export interface AddToWishlist {
  productId: string;
}

export interface WishListResponse {
  status: string;
  data?: BackendWishlistItem[];
  message?: string;
}
export const WishlsitApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getWishlist: builder.query<BackendWishlist, void>({
      query: () => "/wishlist",
      transformResponse: (response: WishListResponse) => {
        return {
          id: null,
          items: response.data || [],
          message: response.message,
        };
      },
      providesTags: ["Wishlist"],
    }),

    addToWishlist: builder.mutation<BackendWishlist, AddToWishlist>({
      query: (data) => ({
        url: "/wishlist",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: WishListResponse) => {
        console.log("Raw API response:", response);
        return {
          id: null,
          items: response.data || [],
          message: response.message,
        };
      },
      invalidatesTags: ["Wishlist"],
    }),

    removeWishlistItem: builder.mutation<BackendWishlist, string>({
      query: (id) => ({
        url: `wishlist/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: WishListResponse) => ({
        id: null,
        items: response.data || [],
        message: response.message,
      }),
      invalidatesTags: ["Wishlist"],
    }),
    clearWishlist: builder.mutation<BackendWishlist, void>({
      query: () => ({
        url: "/wishlist",
        method: "DELETE",
      }),
      transformResponse: (response: WishListResponse) => ({
        id: null,
        items: response.data || [],
        message: response.message,
      }),
      invalidatesTags: ["Wishlist"],
    }),
  }),
});

export const {
  useGetWishlistQuery,
  useAddToWishlistMutation,
  useClearWishlistMutation,
  useRemoveWishlistItemMutation,
} = WishlsitApi;
