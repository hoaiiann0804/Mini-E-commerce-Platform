import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { PremiumButton } from '@/components/common';
import Input from '@/components/common/Input';
import { useRegisterMutation } from '@/services/authApi';

const RegisterPage: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    phone?: string;
  }>({});
  const [successMessage, setSuccessMessage] = useState<string>('');

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [register, { isLoading, error }] = useRegisterMutation();

  const validateForm = () => {
    const newErrors: {
      firstName?: string;
      lastName?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
      phone?: string;
    } = {};
    let isValid = true;

    if (!firstName.trim()) {
      newErrors.firstName = 'Tên không được để trống';
      isValid = false;
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Họ không được để trống';
      isValid = false;
    }

    if (!email) {
      newErrors.email = 'Email không được để trống';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email không hợp lệ';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'Mật khẩu không được để trống';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
      isValid = false;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
      isValid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      // //console.log('🚀 Attempting registration with:', {
      //   email,
      //   firstName: firstName.trim(),
      //   lastName: lastName.trim(),
      // });

      const result = await register({
        email,
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || '', // Phone is optional
      }).unwrap();

      //console.log('✅ Registration successful:', result);

      // Show success message to user
      setSuccessMessage(
        'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.'
      );

      // Clear form
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setPhone('');
      setErrors({});

      // Auto redirect after 3 seconds to give user time to read the message
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
    } catch (err: any) {
      //console.log('❌ Registration failed:', err);
      // Clear any previous success message
      setSuccessMessage('');
      // Error is already handled by RTK Query and displayed in UI
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto">
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">
              Tạo tài khoản mới
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Đăng ký để trở thành thành viên và nhận nhiều ưu đãi
            </p>
          </div>

          {successMessage && (
            <div className="mb-6 p-4 bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400 rounded-lg">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="font-medium">{successMessage}</p>
                  <p className="text-sm mt-1">
                    Bạn sẽ được chuyển đến trang đăng nhập sau 3 giây...
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && !successMessage && (
            <div className="mb-6 p-4 bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-400 rounded-lg">
              {typeof error === 'string'
                ? error
                : (error as any)?.data?.message ||
                  (error as any)?.message ||
                  'Đăng ký thất bại. Vui lòng thử lại!'}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Input
                  type="text"
                  label="Tên *"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Nhập tên của bạn"
                  error={errors.firstName}
                  required
                />
              </div>
              <div>
                <Input
                  type="text"
                  label="Họ *"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Nhập họ của bạn"
                  error={errors.lastName}
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <Input
                type="email"
                label="Email *"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập địa chỉ email"
                error={errors.email}
                required
              />
            </div>

            <div className="mb-6">
              <Input
                type="tel"
                label="Số điện thoại"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Nhập số điện thoại (không bắt buộc)"
                error={errors.phone}
              />
            </div>

            <div className="mb-6">
              <Input
                type="password"
                label="Mật khẩu *"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu tối thiểu 6 ký tự"
                error={errors.password}
                required
              />
            </div>

            <div className="mb-6">
              <Input
                type="password"
                label="Xác nhận mật khẩu *"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                error={errors.confirmPassword}
                required
              />
            </div>

            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                  required
                />
                <span className="ml-2 text-sm text-neutral-600 dark:text-neutral-400">
                  Tôi đồng ý với{' '}
                  <Link
                    to="/terms"
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                  >
                    Điều khoản dịch vụ
                  </Link>{' '}
                  và{' '}
                  <Link
                    to="/privacy-policy"
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                  >
                    Chính sách bảo mật
                  </Link>
                </span>
              </label>
            </div>

            <div className="mb-6">
              <PremiumButton
                variant="success"
                size="large"
                iconType="check"
                isProcessing={isLoading}
                processingText="Đang tạo tài khoản..."
                onClick={handleSubmit}
                className="w-full h-12"
              >
                Tạo tài khoản
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
                Hoặc đăng ký nhanh với
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
              Đã có tài khoản?{' '}
              <Link
                to="/login"
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
              >
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
