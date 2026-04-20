import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { refreshTokenIfNeeded, isTokenExpired } from "@/utils/tokenManager";
import { logout } from "@/features/auth/authSlice";

export const useTokenRefresh = () => {
  const dispatch = useDispatch();
  const { token, refreshToken, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    if (!isAuthenticated || !token || !refreshToken) {
      return;
    }

    // Check token validity every 5 minutes
    const checkTokenValidity = async () => {
      if (isTokenExpired(token)) {
        //console.log('🔄 Token expired, attempting refresh...');
        const newToken = await refreshTokenIfNeeded();

        if (!newToken) {
          //console.log('❌ Token refresh failed, logging out...');
          dispatch(logout());
        }
      }
    };

    // Check immediately
    checkTokenValidity();

    // Set up interval to check every 5 minutes
    const interval = setInterval(checkTokenValidity, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [token, refreshToken, isAuthenticated, dispatch]);

  // Also check when the page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && isAuthenticated && token) {
        if (isTokenExpired(token)) {
          await refreshTokenIfNeeded();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [token, isAuthenticated]);
};
