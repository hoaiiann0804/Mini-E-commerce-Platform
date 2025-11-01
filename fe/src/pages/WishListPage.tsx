import React, { useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import WishListCard from "@/components/features/WishListCard";
import {
  clearWishlist,
  initiaLizeWishlist,
} from "@/features/wishlist/wishlistSlice";
import { useSearchParams } from "react-router-dom";
import Pagination from "@/components/common/Pagination";
import { Trash2 } from "lucide-react";
import { useClearWishlistMutation } from "@/services/wishlistApi";
import { WishlistItem } from "@/types";
import { addNotification } from "@/features/ui/uiSlice";

const WishListPage = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = searchParams.get("page") ? Number(searchParams.get("page")) : 1;
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const limit = 8;

  const wishlistItems = useSelector((state: RootState) => state.wishlist.items);
  console.log("WishList: ", wishlistItems);

  useEffect(() => {
    dispatch(initiaLizeWishlist());
  }, [dispatch]);

  
  // Calculate pagination
  const totalPages = Math.ceil(wishlistItems.length / limit);
  const paginatedItems = useMemo(() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return wishlistItems.slice(startIndex, endIndex);
  }, [wishlistItems, page, limit]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    const updatedParams = new URLSearchParams(searchParams);
    updatedParams.set("page", String(newPage));
    setSearchParams(updatedParams);
  };

  // Force re-render when items change
  useEffect(() => {
    // This effect ensures the component re-renders when wishlist items change
  }, [wishlistItems]);

  return (
    <section className="bg-gray-50 py-8 antialiased dark:bg-gray-900 md:py-12">
 
      <div className="mx-auto max-w-screen-xl 2xl:px-0 mt-2">
        <WishListCard items={paginatedItems} />
      </div>
      {totalPages > 1 && (
        <div className="mt-12 flex justify-center">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </section>
  );
};

export default WishListPage;
