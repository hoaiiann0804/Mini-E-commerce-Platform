import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getValidToken } from "@/utils/tokenManager";
import { handleUnauthorizedError } from "@/utils/authUtils";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";

/**
 * API Configuration
 */
const API_CONFIG = {
  DEFAULT_URL: "http://localhost:8888/api",
  TIMEOUT: 10000,
  HEADERS: {
    ACCEPT: "application/json",
    CONTENT_TYPE: "application/json",
  },
} as const;

/**
 * Get the base API URL
 */
const getBaseUrl = (): string => {
  const apiBaseUrl = import.meta.env.VITE_API_URL || API_CONFIG.DEFAULT_URL;
  return apiBaseUrl.endsWith("/api") ? apiBaseUrl : `${apiBaseUrl}/api`;
};

/**
 * Log API configuration in development
 */
const logApiConfig = (): void => {
  if (import.meta.env.DEV) {
    console.group("🔧 API Configuration");
    console.log("Base URL:", getBaseUrl());
    console.log(
      "Environment:",
      import.meta.env.DEV ? "Development" : "Production"
    );
    console.log("VITE_API_URL:", import.meta.env.VITE_API_URL || "Not set");
    console.groupEnd();
  }
};

// Initialize API configuration
logApiConfig();

/**
 * Prepare headers for API requests
 */
const prepareHeaders = async (headers: Headers): Promise<Headers> => {
  // Get valid token (auto-refresh if needed)
  const token = await getValidToken();

  // Add authorization header if token exists
  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  } else {
    // Fallback to localStorage token
    const localToken = localStorage.getItem("token");
    if (localToken) {
      headers.set("authorization", `Bearer ${localToken}`);
    }
  }

  // Add standard headers
  headers.set("Accept", API_CONFIG.HEADERS.ACCEPT);
  headers.set("Content-Type", API_CONFIG.HEADERS.CONTENT_TYPE);

  return headers;
};

/**
 * Base query for API requests
 */
const baseQuery = fetchBaseQuery({
  baseUrl: getBaseUrl(),
  prepareHeaders,
  timeout: API_CONFIG.TIMEOUT,
});

/**
 * Check if error is 401 Unauthorized
 */
const isUnauthorizedError = (error: any): boolean => {
  return error?.status === 401 || error?.data?.error?.statusCode === 401;
};

/**
 * Log API errors in development
 */
const logApiError = (args: string | FetchArgs, error: any): void => {
  if (import.meta.env.DEV) {
    console.group("🚨 API Error");
    console.log("Endpoint:", typeof args === "string" ? args : args.url);
    console.log("Status:", error.status);
    console.log("Data:", error.data);
    console.groupEnd();
  }
};

/**
 * Enhanced base query with automatic logout on 401
 */
const baseQueryWithAutoLogout: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  try {
    const result = await baseQuery(args, api, extraOptions);

    if (result.error) {
      logApiError(args, result.error);

      // Handle 401 errors
      if (isUnauthorizedError(result.error)) {
        const normalizedError = {
          status: 401,
          data: result.error?.data || result.error,
        };
        handleUnauthorizedError(normalizedError);
      }
    }

    return result;
  } catch (error) {
    console.error("💥 Unexpected API error:", error);
    return {
      error: {
        status: "FETCH_ERROR",
        error: String(error),
      },
    };
  }
};

// Create the API service
export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithAutoLogout,
  tagTypes: [
    "Product",
    "Category",
    "User",
    "CurrentUser",
    "Addresses",
    "Cart",
    "CartCount",
    "Order",
    "Review",
    "PaymentMethod",
    "AdminDashboard",
    "AdminStats",
    "AdminOrder",
    "AdminProduct",
    "AdminUser",
    "Upload",
    "WarrantyPackages",
    "Images",
    "Wishlist",
  ],
  endpoints: () => ({}),
});

// Factory function để tạo baseQuery với prefix URL tùy chỉnh
export const createPrefixedBaseQuery = (
  prefix: string = ""
): BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> => {
  return async (args, api, extraOptions) => {
    // Thêm prefix vào URL
    const adjustedArgs =
      typeof args === "string"
        ? `${prefix}${args}`
        : { ...args, url: `${prefix}${args.url}` };

    // Sử dụng baseQueryWithAutoLogout để xử lý request và lỗi 401
    return baseQueryWithAutoLogout(adjustedArgs, api, extraOptions);
  };
};

// Export the baseQueryWithAutoLogout for reuse in other API services
export { baseQueryWithAutoLogout };

// Export hooks for usage in components
export const {
  // No endpoints defined yet
} = api;
