import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { logout as logoutAction } from '@/features/auth/authSlice';
import { useLogoutMutation } from '@/services/authApi';

/**
 * Custom hook để quản lý authentication
 *
 * Cung cấp:
 * - Thông tin authentication state
 * - Helper functions
 * - Easy access cho components
 */
export const useAuth = () => {
  const dispatch = useDispatch();
  const [logoutMutation] = useLogoutMutation();

  // Lấy auth state từ Redux
  const authState = useSelector((state: RootState) => state.auth);

  /**
   * Logout function với error handling
   */
  const logout = async () => {
    try {
      //console.log('🔐 Logging out...');

      // Gọi API logout (optional, có thể skip nếu server không cần)
      await logoutMutation().unwrap();

      // Clear Redux state
      dispatch(logoutAction());

      //console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);

      // Force logout ngay cả khi API call failed
      dispatch(logoutAction());
    }
  };

  /**
   * Kiểm tra user có role cụ thể không
   */
  const hasRole = (role: string): boolean => {
    return authState.user?.role === role;
  };

  /**
   * Kiểm tra user có phải admin không
   */
  const isAdmin = (): boolean => {
    const result = hasRole('admin');
    // //console.log('🔍 isAdmin check:', {
    //   user: authState.user,
    //   userRole: authState.user?.role,
    //   isAdmin: result,
    //   isAuthenticated: authState.isAuthenticated,
    // });
    return result;
  };

  /**
   * Kiểm tra user có phải manager không
   */
  const isManager = (): boolean => {
    return hasRole('manager');
  };

  /**
   * Lấy full name của user
   */
  const getUserFullName = (): string => {
    if (authState.user?.firstName && authState.user?.lastName) {
      return `${authState.user.firstName} ${authState.user.lastName}`;
    }
    return authState.user?.name || authState.user?.email || 'User';
  };

  return {
    // Auth state
    ...authState,

    // Helper functions
    logout,
    hasRole,
    isAdmin,
    isManager,
    getUserFullName,

    // Computed values
    isLoggedIn: authState.isAuthenticated && !!authState.user,
    hasToken: !!authState.token,
    needsUserInfo: authState.isAuthenticated && !authState.user,
  };
};

export default useAuth;
