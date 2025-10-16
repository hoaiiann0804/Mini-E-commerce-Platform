import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import { useResetPasswordMutation } from "@/services/authApi";

const ResetPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { token: tokenFromParams } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [reserPassword, { isLoading }] = useResetPasswordMutation();
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  const token = tokenFromParams || searchParams.get("token");
  console.log(token);

  useEffect(() => {
    // Check if token exists, if not redirect to forgot password
    if (!token) {
      navigate("/forgot-password");
    }
  }, [token, navigate]);

  const validateForm = () => {
    const newErrors: {
      password?: string;
      confirmPassword?: string;
    } = {};
    let isValid = true;

    if (!password) {
      newErrors.password = t("auth.resetPassword.validation.passwordRequired");
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = t("auth.resetPassword.validation.passwordMinLength");
      isValid = false;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = t(
        "auth.resetPassword.validation.confirmPasswordRequired"
      );
      isValid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = t(
        "auth.resetPassword.validation.passwordsNotMatch"
      );
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setError("");
    try {
      await reserPassword({ token: token as string, password, confirmPassword });
      // Mock success - in real app, call your API here with token and new password
      setIsSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(
        t(
          typeof err === "string"
            ? err
            : err?.data || "Đặt lại mật khẩu thất bại"
        )
      );
    }
  };

  if (isSuccess) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-success-100 dark:bg-success-900/30 mb-4">
                <svg
                  className="h-6 w-6 text-success-600 dark:text-success-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">
                {t("common.success")}
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400 mb-8">
                {t("auth.resetPassword.successMessage")}
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                Redirecting to login page...
              </p>
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/30 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
              >
                <svg
                  className="h-4 w-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                {t("auth.resetPassword.backToLogin")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto">
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/30 mb-4">
              <svg
                className="h-6 w-6 text-primary-600 dark:text-primary-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">
              {t("auth.resetPassword.title")}
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              {t("auth.resetPassword.subtitle")}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-400 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <Input
                type="password"
                label={t("auth.resetPassword.passwordLabel")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.resetPassword.passwordPlaceholder")}
                error={errors.password}
                required
              />
            </div>

            <div className="mb-6">
              <Input
                type="password"
                label={t("auth.resetPassword.confirmPasswordLabel")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("auth.resetPassword.confirmPasswordPlaceholder")}
                error={errors.confirmPassword}
                required
              />
            </div>

            <div className="mb-6">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                fullWidth
              >
                {t("auth.resetPassword.resetPasswordButton")}
              </Button>
            </div>
          </form>

          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            >
              <svg
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              {t("auth.resetPassword.backToLogin")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
