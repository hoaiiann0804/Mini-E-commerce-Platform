import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import UserLayout from "@/components/layout/UserLayout";
import AdminLayout from "@/components/admin/AdminLayout";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PublicOnlyRoute from "@/components/auth/PublicOnlyRoute";
import AdminRoute from "./AdminRoute";
import SideBarPerson from "@/pages/SideBarPerson";
import WishListPage from "@/pages/WishListPage";
import ProductReviews from "@/components/features/ProductReviews";
import ReviewSection from "@/components/features/ReviewSection";
import AddressPage from "@/pages/AddressPage";
// import SideBarPerson from "@/pages/SideBarPerson";

// Lazy-loaded pages
const HomePage = lazy(() => import("@/pages/HomePage"));
const ShopPage = lazy(() => import("@/pages/ShopPage"));
const ProductDetailPage = lazy(() => import("@/pages/ProductDetailPage"));
const CartPage = lazy(() => import("@/pages/CartPage"));
const CheckoutPage = lazy(() => import("@/pages/CheckoutPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const VerifyEmailPage = lazy(() => import("@/pages/VerifyEmailPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const OrdersPage = lazy(() => import("@/pages/OrdersPage"));
// Wishlist feature removed
const CategoriesPage = lazy(() => import("@/pages/CategoriesPage"));
const CategoryPage = lazy(() => import("@/pages/CategoryPage"));
const DealsPage = lazy(() => import("@/pages/DealsPage"));
const NewArrivalsPage = lazy(() => import("@/pages/NewArrivalsPage"));
const BestSellersPage = lazy(() => import("@/pages/BestSellersPage"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const FAQsPage = lazy(() => import("@/pages/FAQsPage"));
const ShippingReturnsPage = lazy(() => import("@/pages/ShippingReturnsPage"));
const TrackOrderPage = lazy(() => import("@/pages/TrackOrderPage"));
const PrivacyPolicyPage = lazy(() => import("@/pages/PrivacyPolicyPage"));
const TermsPage = lazy(() => import("@/pages/TermsPage"));

// Admin pages
const AdminDashboardPage = lazy(() => import("@/pages/admin/DashboardPage"));
const AdminProductsPage = lazy(() => import("@/pages/admin/ProductsPage"));
const CreateProductPage = lazy(() => import("@/pages/admin/CreateProductPage"));
const EditProductPage = lazy(() => import("@/pages/admin/EditProductPage"));
const AdminOrdersPage = lazy(() => import("@/pages/admin/OrdersPage"));
const AdminUsersPage = lazy(() => import("@/pages/admin/UsersPage"));
const AdminCategoriesPage = lazy(() => import("@/pages/admin/CategoriesPage"));
const AdminWarrantyPackagesPage = lazy(
  () => import("@/pages/admin/WarrantyPackagesPage")
);
const SimpleNamingTestPage = lazy(
  () => import("@/pages/admin/SimpleNamingTestPage")
);

// Test components
const TestComponents = lazy(() => import("@/test-components"));
const TestBasicForm = lazy(() => import("@/test-basic-form"));

// Error pages
const UnauthorizedPage = lazy(() => import("@/pages/UnauthorizedPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <Routes>
        {/* Main Layout Routes */}
        <Route path="/" element={<MainLayout />}>
          {/* Public routes */}
          <Route index element={<HomePage />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="products/:productId" element={<ProductDetailPage />} />
          <Route path="cart" element={<CartPage />} />

          {/* Category pages */}
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="categories/:slug" element={<CategoryPage />} />

          {/* Shop sections */}
          <Route path="deals" element={<DealsPage />} />
          <Route path="new-arrivals" element={<NewArrivalsPage />} />
          <Route path="best-sellers" element={<BestSellersPage />} />

          {/* Static pages */}
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="faqs" element={<FAQsPage />} />
          <Route path="shipping-returns" element={<ShippingReturnsPage />} />
          <Route path="track-order" element={<TrackOrderPage />} />
          <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="terms" element={<TermsPage />} />

          {/* Public-only routes (redirect to home if authenticated) */}
          <Route
            path="login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="register"
            element={
              <PublicOnlyRoute>
                <RegisterPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="forgot-password"
            element={
              <PublicOnlyRoute>
                <ForgotPasswordPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="reset-password"
            element={
              <PublicOnlyRoute>
                <ResetPasswordPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="reset-password/:token"
            element={
              <PublicOnlyRoute>
                <ResetPasswordPage />
              </PublicOnlyRoute>
            }
          />
          <Route path="verify-email/:token" element={<VerifyEmailPage />} />

          {/* Protected routes (require authentication) */}
          <Route
            path="checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="checkout/payment"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          {/* <Route
            path="profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          /> */}
          {/* User routes with nested layout */}
          <Route
            path="user"
            element={
              <ProtectedRoute>
                <UserLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/user/profile" replace />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="wishlist" element={<WishListPage />} />
            <Route path="address" element={<AddressPage />} />

            <Route
              path="notifications"
              element={<div>Notifications Coming Soon</div>}
            />
            <Route path="setting" element={<div>Settings Coming Soon</div>} />
          </Route>
          <Route
            path="orders"
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          {/* Wishlist route removed */}

          {/* Error pages */}
          <Route path="unauthorized" element={<UnauthorizedPage />} />

          {/* 404 route */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Admin routes */}
        <Route
          path="admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />

          {/* Product management */}
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="products/create" element={<CreateProductPage />} />
          <Route path="products/edit/:id" element={<EditProductPage />} />

          {/* Other admin sections */}
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route
            path="warranty-packages"
            element={<AdminWarrantyPackagesPage />}
          />

          {/* Test Pages */}
          <Route path="test-simple-naming" element={<SimpleNamingTestPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
