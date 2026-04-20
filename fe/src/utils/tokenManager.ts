import { store } from "@/store";
import { updateTokens, logout } from "@/features/auth/authSlice";
import { handleAutoLogout, logoutManager } from "@/utils/authUtils";

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

export const refreshTokenIfNeeded = async (): Promise<string | null> => {
  const state = store.getState();
  const { refreshToken } = state.auth;

  if (!refreshToken) {
    store.dispatch(logout());
    return null;
  }

  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;

  try {
    // Determine the correct API URL
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8888/api";
    const apiUrl = baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
    //console.log('Refreshing token using URL:', `${apiUrl}/auth/refresh`);

    const response = await fetch(`${apiUrl}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      // Handle specific 401 error (account locked/deactivated)
      if (response.status === 401) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData?.message ||
          "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên";

        // Use centralized auto logout handler
        handleAutoLogout(errorMessage);

        throw new Error(errorMessage);
      }

      throw new Error("Token refresh failed");
    }

    const data = await response.json();

    if (data.status === "success") {
      const { token, refreshToken: newRefreshToken } = data;

      store.dispatch(
        updateTokens({
          token,
          refreshToken: newRefreshToken,
        })
      );

      processQueue(null, token);
      return token;
    } else {
      throw new Error("Token refresh failed");
    }
  } catch (error) {
    console.error("Token refresh failed:", error);
    processQueue(error, null);

    // Only dispatch logout if not already handled by auto logout
    if (!logoutManager.isLoggingOut) {
      store.dispatch(logout());
    }

    return null;
  } finally {
    isRefreshing = false;
  }
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    return true;
  }
};

export const getValidToken = async (): Promise<string | null> => {
  const state = store.getState();
  const { token } = state.auth;

  if (!token) {
    return null;
  }

  if (isTokenExpired(token)) {
    //console.log('🔄 Access token expired, refreshing...');
    return await refreshTokenIfNeeded();
  }

  return token;
};
