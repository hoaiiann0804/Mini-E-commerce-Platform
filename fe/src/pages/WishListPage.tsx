import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import WishListCard from "@/components/features/WishListCard";
import { initiaLizeWishlist } from "@/features/wishlist/wishlistSlice";

const WishListPage = () => {
  const dispatch = useDispatch();
  const wishlistItems = useSelector((state: RootState) => state.wishlist.items);
  console.log("WishList: ", wishlistItems);

  useEffect(() => {
    dispatch(initiaLizeWishlist());
  }, [dispatch]);

  // Force re-render when items change
  useEffect(() => {
    // This effect ensures the component re-renders when wishlist items change
  }, [wishlistItems]);

  return (
    <section className="bg-gray-50 py-8 antialiased dark:bg-gray-900 md:py-12">
      <div className="mx-auto max-w-screen-xl 2xl:px-0">
        <WishListCard items={wishlistItems} />
      </div>
      {/* </div> */}

      {/* Filter modal */}
    </section>
  );
};

export default WishListPage;
