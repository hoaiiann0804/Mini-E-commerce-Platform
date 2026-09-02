import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { loginSuccess } from "@/features/auth/authSlice";

const OAuthCallbackPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [statusMessage, setStatusMessage] = useState<string>("Đang hoàn tất đăng nhập...");
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    const handleOAuth = async () => {
      const token = searchParams.get("token");
      const refreshToken = searchParams.get("refreshToken");
      const error = searchParams.get("error");

      if (error || !token || !refreshToken) {
        setHasError(true);
        setStatusMessage(
          error === "oauth_failed"
            ? "Đăng nhập bằng mạng xã hội thất bại. Vui lòng thử lại."
            : error || "Không nhận được thông tin xác thực."
        );
        setTimeout(() => {
          navigate(`/login?error=${encodeURIComponent(error || "oauth_failed")}`, {
            replace: true,
          });
        }, 2000);
        return;
      }

      try {
        setStatusMessage("Đang đồng bộ dữ liệu tài khoản...");

        // Fetch current user info using the token
        const rawBase =
          import.meta.env.VITE_API_URL || "http://localhost:8888";
        const baseUrl = rawBase.endsWith("/api") ? rawBase : `${rawBase}/api`;

        const response = await fetch(`${baseUrl}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        const data = await response.json();

        if (!response.ok || data.status !== "success") {
          throw new Error(data.message || "Failed to fetch user profile");
        }

        const user = data.data;

        // Dispatch loginSuccess to Redux store & localStorage
        dispatch(
          loginSuccess({
            token,
            refreshToken,
            user,
          })
        );

        setStatusMessage("Đăng nhập thành công! Đang chuyển hướng...");

        setTimeout(() => {
          navigate("/", { replace: true });
        }, 800);
      } catch (err: any) {
        setHasError(true);
        setStatusMessage(err.message || "Xảy ra lỗi khi lấy thông tin tài khoản.");
        setTimeout(() => {
          navigate("/login?error=fetch_user_failed", { replace: true });
        }, 2000);
      }
    };

    handleOAuth();
  }, [searchParams, navigate, dispatch, t]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
      <div className="bg-white dark:bg-neutral-800 p-8 rounded-2xl shadow-xl border border-neutral-100 dark:border-neutral-700 max-w-md w-full text-center">
        {!hasError ? (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-6" />
            <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">
              Xác thực OAuth
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm">
              {statusMessage}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-error-100 dark:bg-error-900/30 text-error-600 rounded-full flex items-center justify-center text-3xl font-bold mb-6">
              ✕
            </div>
            <h2 className="text-xl font-bold text-error-600 mb-2">
              Đăng nhập thất bại
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-4">
              {statusMessage}
            </p>
            <p className="text-xs text-neutral-400">Đang quay lại trang đăng nhập...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OAuthCallbackPage;
