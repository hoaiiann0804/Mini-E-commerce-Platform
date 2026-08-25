import { store } from "@/store";
import { logout } from "@/features/auth/authSlice";
import { toast } from "@/utils/toast";

// Navigation function - will be set by App component
let navigateToLogin: (() => void) | null = null;

export const setNavigateFunction = (navigate: () => void) => {
  navigateToLogin = navigate;
};

// Singleton to manage logout state
class LogoutManager {
  private static instance: LogoutManager;
  private _isLoggingOut = false;

  static getInstance(): LogoutManager {
    if (!LogoutManager.instance) {
      LogoutManager.instance = new LogoutManager();
    }
    return LogoutManager.instance;
  }

  get isLoggingOut(): boolean {
    return this._isLoggingOut;
  }

  setLoggingOut(value: boolean): void {
    this._isLoggingOut = value;
  }
}

const logoutManager = LogoutManager.getInstance();

/**
 * Handle automatic logout when user account is deactivated or unauthorized
 * @param errorMessage - Custom error message to display
 * @param redirectDelay - Delay before redirecting to login page (in milliseconds)
 */
export const handleAutoLogout = (
  errorMessage: string = "Phiên đăng nhập đã hết hạn",
  redirectDelay: number = 1000
) => {
  //console.log('🚪 handleAutoLogout called with:', errorMessage);

  // Prevent duplicate logout
  if (logoutManager.isLoggingOut) {
    //console.log('⏸️ Already logging out, skipping');
    return;
  }

  //console.log('🔄 Starting logout process');
  logoutManager.setLoggingOut(true);

  // Show notification to user
  toast.warning(errorMessage, 4);

  // Dispatch logout action to clear auth state
  store.dispatch(logout());

  // Clear data immediately
  localStorage.clear();
  sessionStorage.clear();

  // Navigate after a short delay to ensure Redux state is updated
  setTimeout(() => {
    // Reset flag
    logoutManager.setLoggingOut(false);

    // Force page reload to login to avoid React Router state issues
    window.location.href = "/login";
  }, 100); // Reduced delay to 100ms
};

// Export logout manager for use in other modules
export { logoutManager };

/**
 * Check if error is 401 Unauthorized and handle auto logout
 * @param error - Error object from API response
 * @returns boolean - true if 401 error was handled
 */
export const handleUnauthorizedError = (error: any): boolean => {
  //console.log('🔍 handleUnauthorizedError called with:', error);

  if (error?.status === 401) {
    //console.log('✅ 401 confirmed, calling handleAutoLogout');
    const errorMessage =
      error?.data?.message ||
      "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên";

    handleAutoLogout(errorMessage);
    return true;
  }

  //console.log('❌ Not 401, status:', error?.status);
  return false;
};

/**
 * Extract error message from various error formats
 * @param error - Error object
 * @returns string - Formatted error message
 */
export const getErrorMessage = (error: any): string => {
  if (typeof error === "string") {
    return error;
  }

  if (error?.data?.message) {
    return error.data.message;
  }

  if (error?.message) {
    return error.message;
  }

  return "Đã xảy ra lỗi không xác định";
};
