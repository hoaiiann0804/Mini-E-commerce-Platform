import { api } from "./api";
import { User } from "@/types/user.types";
import {
  AuthResponse,
  LoginCredentials,
  RegisterData,
} from "@/types/auth.types";
import { authenticateUser, getUserByEmail } from "@/data/mockUsers";

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginCredentials>({
      query: ({ email, password }) => ({
        url: "/auth/login",
        method: "POST",
        body: { email, password },
      }),
      transformResponse: (response: any) => {
        console.log("Login response:", response);

        // Xử lý response từ API theo format thật từ backend
        if (response?.status === "success") {
          return {
            user: response.user,
            token: response.token,
            refreshToken: response.refreshToken,
          };
        }

        // Fallback nếu format khác
        return response;
      },
      transformErrorResponse: (response: any) => {
        console.log("Login error:", response);

        // Xử lý error response
        if (response?.data?.message) {
          return response.data.message;
        }

        return response?.data || "Login failed";
      },
    }),

    verifyEmail: builder.mutation<{ message: string }, string>({
      queryFn: async (token, { signal }) => {
        try {
          console.log("🚀 Starting verifyEmail with token:", token);

          const baseUrl =
            import.meta.env.VITE_API_URL || "http://localhost:3000/api";
          const url = `${baseUrl}/auth/verify-email/${token}`;

          console.log("🔗 Making request to:", url);

          const response = await fetch(url, {
            method: "GET",
            signal,
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          });

          const data = await response.json();
          console.log("📨 Raw response:", {
            status: response.status,
            ok: response.ok,
            data,
          });

          if (!response.ok) {
            console.log("❌ Response not OK:", response.status, data);

            // Nếu lỗi là token đã được sử dụng, có thể coi như đã verify thành công
            if (
              response.status === 400 &&
              (data?.message?.includes("đã được xác thực") ||
                data?.message?.includes("already verified") ||
                data?.message?.includes("đã được sử dụng"))
            ) {
              console.log("🔄 Token already used, treating as success");
              return {
                data: {
                  message: "Email đã được xác thực thành công trước đó",
                },
              };
            }

            return {
              error: {
                status: response.status,
                data: data?.message || data || "Verification failed",
              },
            };
          }

          // Kiểm tra nếu response có status: 'success'
          if (data?.status === "success") {
            console.log("✅ Success response detected");
            return {
              data: {
                message: data.message || "Email verified successfully",
              },
            };
          }

          console.log("🤔 Unexpected response format:", data);
          return {
            data: {
              message: data?.message || "Email verified successfully",
            },
          };
        } catch (error) {
          console.log("💥 Fetch error:", error);
          return {
            error: {
              status: "FETCH_ERROR",
              data: error instanceof Error ? error.message : "Network error",
            },
          };
        }
      },
    }),

    register: builder.mutation<AuthResponse, RegisterData>({
      query: (userData) => ({
        url: "/auth/register",
        method: "POST",
        body: userData,
      }),
      transformResponse: (response: any) => {
        console.log("Register response:", response);

        // Xử lý response từ API theo format thật từ backend
        if (response?.status === "success") {
          return {
            user: response.user,
            token: response.token,
            refreshToken: response.refreshToken,
          };
        }

        // Fallback nếu format khác
        return response;
      },
      transformErrorResponse: (response: any) => {
        console.log("Register error:", response);

        // Xử lý error response
        if (response?.data?.message) {
          return response.data.message;
        }

        return response?.data || "Registration failed";
      },
    }),

    refreshToken: builder.mutation<
      { token: string; refreshToken: string },
      void
    >({
      query: () => ({
        url: "/auth/refresh",
        method: "POST",
        body: { refreshToken: localStorage.getItem("refreshToken") },
      }),
      transformResponse: (response: any) => {
        console.log("Refresh token response:", response);

        if (response?.status === "success") {
          return {
            token: response.token,
            refreshToken: response.refreshToken,
          };
        }

        return response;
      },
      transformErrorResponse: (response: any) => {
        console.log("Refresh token error:", response);

        // Clear tokens nếu refresh token expired
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");

        return response?.data || "Token refresh failed";
      },
    }),

    logout: builder.mutation<void, void>({
      queryFn: () => {
        try {
          // Clear localStorage
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");

          return { data: undefined };
        } catch (error) {
          return { error: { status: 500, data: "Logout failed" } };
        }
      },
    }),

    getCurrentUser: builder.query<User, void>({
      query: () => ({
        url: "/auth/me",
        method: "GET",
      }),
      transformResponse: (response: any) => {
        console.log("Get current user response:", response);

        // Xử lý response từ API theo format thật từ backend
        if (response?.status === "success") {
          console.log("✅ Returning user data:", response.data);
          return response.data; // API trả về user trong response.data
        }

        // Fallback nếu format khác
        return response;
      },
      transformErrorResponse: (response: any) => {
        console.log("Get current user error:", response);
        // Let the global interceptor handle 401 errors
        return response?.data || "Failed to fetch user";
      },
      providesTags: ["CurrentUser"],
    }),
    forgotPassword: builder.mutation<{ message: string },{email: string}>({
      query: ({email})=>({
      url: '/auth/forgot-password',
      method:"POST",
      body:{email},
  }), 
    transformResponse: (res: any)=>{
      if(res?.status === "success") return {message: res.message || 'OK'}
      return res;
    },
    transformErrorResponse: (res: any) => res.data?.message || 'Send reset link failed',
  }),

//Reset Password
  resetPassword:builder.mutation<{message: string}, {token: string; password: string; confirmPassword: string}>({
    query: ({token, password, confirmPassword})=>({
      url: '/auth/reset-password',
      method:"POST",
      body:{token, password, confirmPassword},
    }),
    transformResponse: (res: any)=>{
      if(res?.status === "success") return {message:res?.message || "OK"} 
      return res
    },
    transformErrorResponse: (res: any)=> res?.data?.message ||  'Reset password failed',
  })


  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useRefreshTokenMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
  useVerifyEmailMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation
  

} = authApi;
