import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  WishlistItem,
  WishlistState,
  ServerWishlist,
} from "@/types/wishlist.types";
//Khởi tạo trạng thái ban đầu  cho wishlist (danh sách yêu thích)
const initialState: WishlistState = {
  //Lấy danh sách sản phẩm yêu thích từ localStorage (bộ nhớ trình duyệt)
  // Nếu không có dữ liệu, trả về mảng rỗng []

  items: JSON.parse(localStorage.getItem("wishlistItems") || "[]"),
  serverWishlist: null,
};

//Helper function to covert server wishlist item to local wishlist item
const convertServerWishlist = (serverItem: any): WishlistItem => ({
  id: serverItem.id, // This is the wishlist item ID from backend
  productId: serverItem.productId, // product ID
  name: serverItem.name,
  price: serverItem.price,
  compareAtPrice: serverItem.compareAtPrice,
  thumbnail: serverItem.thumbnail,
  slug: serverItem.slug,
  //dateAdded: serverItem.//dateAdded,
});

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    //Khởi tạo wishlist từ data
    setServerWishList: (state, action: PayloadAction<ServerWishlist>) => {
      state.serverWishlist = action.payload;
      state.items = action.payload.items
        ? action.payload.items.map(convertServerWishlist)
        : [];
      localStorage.setItem("wishlistItems", JSON.stringify(state.items));
    },
    addItemWishlist: (state, action: PayloadAction<WishlistItem>) => {
      const existingItemIndex = state.items.findIndex(
        (item) => item.productId === action.payload.productId
      );
      // Nếu chưa có (index === -1 ) thì thêm mới
      if (existingItemIndex === -1) {
        state.items.push(action.payload);
        console.log("Wishlist Updated", state.items);
      }
      localStorage.setItem("wishlistItems", JSON.stringify(state.items));
    },
    removeItemWishlist: (state, action: PayloadAction<WishlistItem>) => {
      state.items = state.items.filter(
        (item) => item.id !== action.payload.id
      );
      localStorage.setItem("wishlistItems", JSON.stringify(state.items));
    },
    clearWishlist: (state) => {
      state.items = [];
      state.serverWishlist = null;
      localStorage.removeItem("wishlistItems");
    },
    // Async clear wishlist (for backend sync)
    clearWishlistAsync: (state) => {
      state.items = [];
      state.serverWishlist = null;
      localStorage.removeItem("wishlistItems");
    },
    //Làm mới danh sách từ localStorange
    initiaLizeWishlist: (state) => {
      //Lấy dữ liệu từ localStorage với key "WishlistItems", nếu không có thì dùng mảng rỗng
      const items = JSON.parse(localStorage.getItem("wishlistItems") || "[]");
      // Kiểm tra xem dữ liệu lấy được có phải là mảng hợp lệ không
      if (Array.isArray(items)) {
        //Nếu hợp lệ , gán mảng đó vào state.items (danh sách yêu thích )
        state.items = items;
      } else {
        // Nếu dữ liệu bị hỏng (không phải mảng), xóa key "wishlistItems" khỏi localStorage
        localStorage.removeItem("wishlistItems");
        state.items = [];
      }
    },
    //Thay thế wishlist cục bộ bằng dữ liệu server.

    // // Đồng bộ wishist từ server
    // setServerWishList: (state, action: PayloadAction<ServerWishlist>) => {
    //   //Chuyển dữ liệu server thành định dạng cục bộ gán vào state.item
    //   state.items = action.payload.items.map(convertServerWishlist);
    //   //Cập nhật localStorange
    //   localStorage.setItem("wishlistItems", JSON.stringify(state.items));
    // },

    // Hợp nhất wishlist cục bộ với server (khi đăng nhập)
    mergeWithLocalWishlist: (state, action: PayloadAction<ServerWishlist>) => {
      // Sao chép danh sách cục bộ
      const localItems = [...state.items];
      const serverWishlist = action.payload;
      // chuyển đổi danh sách server thành định dạng cục bộ
      const serverItems = action.payload.items.map(convertServerWishlist);
      //Bắt đầu với danh sách server(là mảng sẽ chứa danh sách hợp nhát cuối cùng)

      const mergedItems = [...serverItems];
      //Duyệt qua danh sách cục bộ
      localItems.forEach((localItem) => {
        // kiểm tra sản phẩm cục bộ có trong danh sách server hay không
        const existingServerItem = mergedItems.find(
          (serverItem) => localItem.productId === serverItem.productId
        );
        // Nếu không có thì thêm sản phẩm cục bộ vòa danh sách đã hợp nhất
        if (!existingServerItem) {
          mergedItems.push(localItem);
        }
      });
      // cập nhật lại state vào danh sách
      state.serverWishlist = {
        ...serverWishlist,
        items: mergedItems.map((item) => ({
          id: item.id,
          productId: item.productId,
          name: item.name,
          price: item.price,
          compareAtPrice: item.compareAtPrice,
          thumbnail: item.thumbnail,
          slug: item.slug,
          //dateAdded: item.//dateAdded,
        })),
      };

      // cập nhật state vào danh sách hợp nhấtnhất
      state.items = mergedItems;
      //luư danh sách hợp nhất vào localStorage
      localStorage.setItem("wishlistItems", JSON.stringify(state.items));
    },
  },
});

export const {
  addItemWishlist,
  removeItemWishlist,
  clearWishlist,
  clearWishlistAsync,
  setServerWishList,
  mergeWithLocalWishlist,
  initiaLizeWishlist,
} = wishlistSlice.actions;

export default wishlistSlice.reducer;
