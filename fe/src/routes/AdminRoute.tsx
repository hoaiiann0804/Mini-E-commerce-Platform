import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useGetCurrentUserQuery } from "@/services/authApi";
import LoadingSpinner from "@/components/common/LoadingSpinner";

interface AdminRouteProps {
  children: ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { isAuthenticated, user, token } = useSelector(
    (state: RootState) => state.auth
  );
  const location = useLocation();

  // If no token, redirect to login
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If we have token but no user info, fetch user info
  const shouldFetchUser = token && !user;
  const {
    data: currentUser,
    isLoading,
    error,
  } = useGetCurrentUserQuery(undefined, {
    skip: !shouldFetchUser,
  });

  // Show loading if we're fetching user info
  if (shouldFetchUser && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-neutral-600 dark:text-neutral-400">
            Đang xác thực quyền truy cập...
          </p>
        </div>
      </div>
    );
  }

  // If fetch failed, redirect to login
  if (error) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Use currentUser from API if available, otherwise use user from state
  const userToCheck = currentUser || user;

  if (!isAuthenticated && !currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user is an admin or manager
  if (userToCheck?.role !== "admin" && userToCheck?.role !== "manager") {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
