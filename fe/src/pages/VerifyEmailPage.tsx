import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVerifyEmailMutation } from '@/services/authApi';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Button from '@/components/common/Button';

const VerifyEmailPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [verifyEmail, { isLoading, isSuccess, isError, error }] =
    useVerifyEmailMutation();
  const hasVerified = useRef(false);

  useEffect(() => {
    if (token && !hasVerified.current) {
      hasVerified.current = true;
      //console.log('Attempting to verify email with token:', token);
      verifyEmail(token);
    }
  }, [token, verifyEmail]);

  // Debug logging
  useEffect(() => {
    // console.log('VerifyEmailPage state:', {
    //   isLoading,
    //   isSuccess,
    //   isError,
    //   error,
    //   token,
    //   hasVerified: hasVerified.current,
    // });
  }, [isLoading, isSuccess, isError, error, token]);

  const handleGoToLogin = () => {
    navigate('/login');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <LoadingSpinner size="large" />
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Đang xác thực email...
          </h2>
          <p className="mt-2 text-gray-600">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Xác thực thành công!
          </h2>
          <p className="mt-2 text-gray-600">
            Email của bạn đã được xác thực thành công. Bạn có thể đăng nhập vào
            tài khoản của mình.
          </p>
          <div className="mt-8 space-y-3">
            <Button
              onClick={handleGoToLogin}
              className="w-full"
              variant="primary"
            >
              Đăng nhập ngay
            </Button>
            <Button onClick={handleGoHome} className="w-full" variant="outline">
              Về trang chủ
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    let errorMessage = 'Có lỗi xảy ra khi xác thực email';

    if (error && typeof error === 'object' && 'data' in error) {
      const errorData = error.data as any;
      if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (typeof errorData === 'string') {
        errorMessage = errorData;
      }
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = (error as any).message;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Xác thực thất bại
          </h2>
          <p className="mt-2 text-gray-600">{errorMessage}</p>
          <div className="mt-8 space-y-3">
            <Button
              onClick={handleGoToLogin}
              className="w-full"
              variant="primary"
            >
              Đăng nhập
            </Button>
            <Button onClick={handleGoHome} className="w-full" variant="outline">
              Về trang chủ
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Fallback nếu không có token
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
            <svg
              className="h-6 w-6 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5C3.498 16.333 4.46 18 6 18z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Liên kết không hợp lệ
          </h2>
          <p className="mt-2 text-gray-600">
            Liên kết xác thực email không hợp lệ hoặc đã hết hạn.
          </p>
          <div className="mt-8 space-y-3">
            <Button
              onClick={handleGoToLogin}
              className="w-full"
              variant="primary"
            >
              Đăng nhập
            </Button>
            <Button onClick={handleGoHome} className="w-full" variant="outline">
              Về trang chủ
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default VerifyEmailPage;
