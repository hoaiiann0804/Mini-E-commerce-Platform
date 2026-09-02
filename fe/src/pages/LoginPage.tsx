import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import { PremiumButton } from "@/components/common";
import Input from "@/components/common/Input";
import { useLoginMutation } from "@/services/authApi";
import { loginSuccess } from "@/features/auth/authSlice";

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [login, { isLoading, error }] = useLoginMutation();

  // Get the redirect path from location state or default to home
  const from = (location.state as any)?.from?.pathname || "/";

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    let isValid = true;

    if (!email) {
      newErrors.email = t("auth.login.validation.emailRequired");
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t("auth.login.validation.emailInvalid");
      isValid = false;
    }

    if (!password) {
      newErrors.password = t("auth.login.validation.passwordRequired");
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = t("auth.login.validation.passwordMinLength");
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      //console.log('🚀 Attempting login with:', { email, password: '***' });

      const result = await login({ email, password }).unwrap();

      //console.log('✅ Login successful:', result);

      // Dispatch success to Redux store
      dispatch(loginSuccess(result));

      // Redirect to the page they were trying to access
      navigate(from, { replace: true });
    } catch (err: any) {
      //console.log('❌ Login failed:', err);
      // Error is already handled by RTK Query and displayed in UI
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto">
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">
              {t("auth.login.title")}
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              {t("auth.login.subtitle")}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-400 rounded-lg">
              {typeof error === "string"
                ? error
                : (error as any)?.data?.message ||
                  (error as any)?.message ||
                  t("auth.login.errors.invalidCredentials")}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <Input
                type="email"
                label={t("auth.login.emailLabel")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.login.emailPlaceholder")}
                error={errors.email}
                required
              />
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-1">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                  {t("auth.login.passwordLabel")}
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                >
                  {t("auth.login.forgotPassword")}
                </Link>
              </div>
              <Input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.login.passwordPlaceholder")}
                error={errors.password}
                required
              />
            </div>

            <div className="mb-6">
              <PremiumButton
                variant="primary"
                size="large"
                iconType="arrow-right"
                isProcessing={isLoading}
                processingText="Signing In..."
                onClick={handleSubmit}
                className="w-full h-12"
              >
                {t("auth.login.signInButton")}
              </PremiumButton>
            </div>
          </form>

          {/* OAuth Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200 dark:border-neutral-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-neutral-800 px-3 text-neutral-500 dark:text-neutral-400 font-medium">
                Hoặc tiếp tục với
              </span>
            </div>
          </div>

          {/* OAuth Social Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => {
                const rawBase =
                  import.meta.env.VITE_API_URL || "http://localhost:8888";
                const baseUrl = rawBase.endsWith("/api") ? rawBase : `${rawBase}/api`;
                window.location.href = `${baseUrl}/auth/google`;
              }}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-750 transition-all shadow-sm hover:shadow active:scale-[0.98]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Google
            </button>

            <button
              type="button"
              onClick={() => {
                const rawBase =
                  import.meta.env.VITE_API_URL || "http://localhost:8888";
                const baseUrl = rawBase.endsWith("/api") ? rawBase : `${rawBase}/api`;
                window.location.href = `${baseUrl}/auth/facebook`;
              }}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-750 transition-all shadow-sm hover:shadow active:scale-[0.98]"
            >
              <svg className="w-4 h-4" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </button>
          </div>

          <div className="text-center">
            <p className="text-neutral-600 dark:text-neutral-400">
              {t("auth.login.noAccount")}{" "}
              <Link
                to="/register"
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
              >
                {t("auth.login.signUpLink")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
