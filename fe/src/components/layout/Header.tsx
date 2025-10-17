import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ThemeToggle from "@/components/common/ThemeToggle";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import SearchBar from "@/components/features/SearchBar";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { toggleMobileMenu, toggleSearch } from "@/features/ui/uiSlice";
import { useAuth } from "@/hooks/useAuth";
import { useGetCartCountQuery } from "@/services/cartApi";
import { initializeCart } from "@/features/cart/cartSlice";
import {
  NAVIGATION_ICONS,
  NavigationIconKey,
  ShopIcon,
  UserIcon,
  CartIcon,
  AdminIcon,
  MenuIcon,
  CloseIcon,
} from "@/components/icons";

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  // Auth hook
  const {
    isAuthenticated,
    user,
    logout: handleLogout,
    isAdmin,
    getUserFullName,
  } = useAuth();

  // Debug logging for admin panel visibility
  console.log("🔍 Header render:", {
    isAuthenticated,
    user,
    userRole: user?.role,
    isAdminResult: isAdmin(),
  });

  // Get UI state from Redux store
  const isMobileMenuOpen = useSelector(
    (state: RootState) => state.ui.isMobileMenuOpen
  );
  const isSearchOpen = useSelector((state: RootState) => state.ui.isSearchOpen);

  // Get cart count from server API (only for authenticated users)
  const { data: serverCartCount } = useGetCartCountQuery(undefined, {
    // Only call API if user is authenticated
    skip: !isAuthenticated,
    // Only refetch when needed, not on every focus/reconnect
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });
  const localCartCount = useSelector(
    (state: RootState) => state.cart?.totalItems || 0
  );

  // Use server count for authenticated users, local count for guests
  const cartItemsCount = isAuthenticated
    ? serverCartCount !== undefined
      ? serverCartCount
      : localCartCount
    : localCartCount;

  // Debug logging for cart count
  console.log("🛒 Cart count debug:", {
    isAuthenticated,
    serverCartCount,
    localCartCount,
    cartItemsCount,
  });

  // Xóa localStorage khi server trả về count = 0 và cập nhật state Redux (chỉ cho authenticated users)
  useEffect(() => {
    if (isAuthenticated && serverCartCount === 0) {
      localStorage.removeItem("cartItems");
      // Cập nhật state Redux để đồng bộ với localStorage
      dispatch(initializeCart());
    }
  }, [isAuthenticated, serverCartCount, dispatch]);

  // Detect scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle user profile click
  const handleUserClick = () => {
    if (isAuthenticated) {
      setShowUserDropdown(!showUserDropdown);
    } else {
      navigate("/login");
    }
  };

  // Handle logout with navigation
  const handleLogoutClick = async () => {
    await handleLogout();
    navigate("/", { replace: true });
  };

  // Handle cart click
  const handleCartClick = () => {
    navigate("/cart");
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || isSearchOpen
          ? "bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-lg border-b border-neutral-200/20 dark:border-neutral-700/20 py-2"
          : "bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm py-3"
      }`}
    >
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center group flex-shrink-0">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg blur opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
            <div className="relative bg-gradient-to-r from-primary-500 to-secondary-500 p-1.5 rounded-lg">
              <ShopIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
          </div>
          <div className="ml-2 sm:ml-3">
            <span className="font-heading font-bold text-base sm:text-lg bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              {t("header.brand")}
            </span>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium hidden sm:block">
              E-Commerce
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-1">
          {[
            { key: "home" as NavigationIconKey, path: "/" },
            { key: "shop" as NavigationIconKey, path: "/shop" },
            { key: "categories" as NavigationIconKey, path: "/categories" },
            { key: "deals" as NavigationIconKey, path: "/deals" },
            { key: "about" as NavigationIconKey, path: "/about" },
          ].map((item) => {
            const IconComponent = NAVIGATION_ICONS[item.key];
            return (
              <Link
                key={item.key}
                to={item.path}
                className="group relative px-4 py-2 rounded-xl font-medium text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-300 hover:bg-primary-50 dark:hover:bg-primary-900/10"
              >
                <div className="flex items-center space-x-2">
                  <IconComponent className="h-4 w-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                  <span>{t(`header.navigation.${item.key}`)}</span>
                </div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-primary-500 to-secondary-500 group-hover:w-full transition-all duration-300"></div>
              </Link>
            );
          })}

          {/* Admin Link - visible to admin users */}
          {isAdmin() && (
            <Link
              to="/admin/dashboard"
              className="group relative px-4 py-2 rounded-xl font-medium bg-gradient-to-r from-info-100 to-info-50 dark:from-info-900/20 dark:to-info-800/10 text-info-700 dark:text-info-300 hover:from-info-200 hover:to-info-100 dark:hover:from-info-900/30 dark:hover:to-info-800/20 transition-all duration-300 flex items-center space-x-2 border border-info-200/50 dark:border-info-700/30"
            >
              <AdminIcon className="h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
              <span>Admin</span>
              <div className="absolute inset-0 bg-gradient-to-r from-info-500/10 to-info-400/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
          )}
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Search */}
          <div className="hidden md:block">
            <SearchBar
              isExpanded={isSearchOpen}
              onClose={() => dispatch(toggleSearch())}
              className="text-neutral-700 dark:text-neutral-300"
            />
          </div>

          {/* Language Switcher - Hidden on mobile */}
          <div className="hidden sm:block p-1 sm:p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <LanguageSwitcher />
          </div>

          {/* Theme Toggle */}
          <div className="p-1 sm:p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <ThemeToggle />
          </div>

          {/* User */}
          <div className="relative" ref={userDropdownRef}>
            <button
              onClick={handleUserClick}
              className={`group relative p-1.5 sm:p-2 rounded-xl transition-all duration-300 ${
                isAuthenticated
                  ? "bg-gradient-to-r from-primary-100 to-primary-50 dark:from-primary-900/20 dark:to-primary-800/10 text-primary-600 dark:text-primary-400 hover:from-primary-200 hover:to-primary-100 dark:hover:from-primary-900/30 dark:hover:to-primary-800/20 border border-primary-200/50 dark:border-primary-700/30"
                  : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700"
              }`}
              aria-label={t("header.actions.userAccount")}
            >
              <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform duration-300" />
              {isAuthenticated && (
                <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gradient-to-r from-success-500 to-success-400 rounded-full border-2 border-white dark:border-neutral-800 animate-pulse"></span>
              )}
              {isAuthenticated && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-primary-400/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              )}
            </button>

            {/* User Dropdown */}
            {isAuthenticated && showUserDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 z-50">
                <div className="py-2">
                  <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-700">
                    <p className="font-semibold text-neutral-800 dark:text-neutral-100">
                      {getUserFullName()}
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {user?.email}
                    </p>
                  </div>

                  <Link
                    to="/user"
                    className="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                    onClick={() => setShowUserDropdown(false)}
                  >
                    {t("header.dropdown.profile")}
                  </Link>

                  <Link
                    to="/orders"
                    className="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                    onClick={() => setShowUserDropdown(false)}
                  >
                    {t("header.dropdown.orders")}
                  </Link>

                  {/* Wishlist link removed */}

                  {/* Admin Panel Link - only for admin users */}
                  {isAdmin() && (
                    <>
                      <div className="border-t border-neutral-200 dark:border-neutral-700 my-2"></div>
                      <Link
                        to="/admin/dashboard"
                        className="block px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors font-medium"
                        onClick={() => setShowUserDropdown(false)}
                      >
                        <div className="flex items-center space-x-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                          </svg>
                          <span>{t("header.dropdown.adminPanel")}</span>
                        </div>
                      </Link>
                    </>
                  )}

                  <div className="border-t border-neutral-200 dark:border-neutral-700 mt-2">
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        handleLogoutClick();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                    >
                      {t("header.dropdown.logout")}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Cart */}
          <button
            onClick={handleCartClick}
            className={`group relative p-1.5 sm:p-2 rounded-xl transition-all duration-300 ${
              cartItemsCount > 0
                ? "bg-gradient-to-r from-secondary-100 to-secondary-50 dark:from-secondary-900/20 dark:to-secondary-800/10 text-secondary-600 dark:text-secondary-400 hover:from-secondary-200 hover:to-secondary-100 dark:hover:from-secondary-900/30 dark:hover:to-secondary-800/20 border border-secondary-200/50 dark:border-secondary-700/30"
                : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700"
            }`}
            aria-label={t("header.actions.shoppingCart")}
          >
            <CartIcon className="h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform duration-300" />
            {cartItemsCount > 0 && (
              <>
                <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-gradient-to-r from-secondary-500 to-warning-500 text-white text-xs font-bold rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center shadow-lg animate-bounce">
                  {cartItemsCount > 99 ? "99+" : cartItemsCount}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-secondary-500/10 to-secondary-400/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </>
            )}
          </button>

          {/* Mobile menu button */}
          <button
            className="lg:hidden group p-1.5 sm:p-2 rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-300 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700"
            onClick={() => dispatch(toggleMobileMenu())}
            aria-label={
              isMobileMenuOpen
                ? t("header.actions.closeMenu")
                : t("header.actions.openMenu")
            }
          >
            {isMobileMenuOpen ? (
              <CloseIcon className="h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform duration-300" />
            ) : (
              <MenuIcon className="h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform duration-300" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-white dark:bg-neutral-900 shadow-lg py-4 px-4 sm:px-6 space-y-4 animate-slideInTop border-b border-neutral-200 dark:border-neutral-700">
          {[
            { key: "home", path: "/" },
            { key: "shop", path: "/shop" },
            { key: "categories", path: "/categories" },
            { key: "deals", path: "/deals" },
            { key: "about", path: "/about" },
          ].map((item) => (
            <Link
              key={item.key}
              to={item.path}
              className="block font-medium text-neutral-700 dark:text-neutral-300 hover:text-primary-500 dark:hover:text-primary-400 transition-colors py-2"
              onClick={() => dispatch(toggleMobileMenu())}
            >
              {t(`header.navigation.${item.key}`)}
            </Link>
          ))}

          {/* Mobile Admin Link - visible to admin users */}
          {isAdmin() && (
            <Link
              to="/admin/dashboard"
              className="block font-medium px-3 py-3 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
              onClick={() => dispatch(toggleMobileMenu())}
            >
              <div className="flex items-center space-x-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <span>Admin Panel</span>
              </div>
            </Link>
          )}

          {/* Mobile search */}
          <div className="pt-2 pb-4 md:hidden">
            <div className="relative">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const input = e.currentTarget.querySelector("input");
                  const searchTerm = input?.value?.trim();
                  if (searchTerm) {
                    // Save to localStorage
                    try {
                      const recentSearches =
                        localStorage.getItem("recentSearches");
                      const searches = recentSearches
                        ? JSON.parse(recentSearches)
                        : [];
                      const updatedSearches = [
                        searchTerm,
                        ...searches.filter((s: string) => s !== searchTerm),
                      ].slice(0, 5);
                      localStorage.setItem(
                        "recentSearches",
                        JSON.stringify(updatedSearches)
                      );
                      console.log(
                        "Mobile search - saved searches:",
                        updatedSearches
                      );
                    } catch (error) {
                      console.error("Error saving search term:", error);
                    }

                    // Navigate to search results
                    navigate(`/shop?search=${encodeURIComponent(searchTerm)}`);
                    dispatch(toggleMobileMenu());
                  }
                }}
              >
                <input
                  type="text"
                  placeholder={t("header.actions.searchPlaceholder")}
                  className="w-full py-2.5 pl-10 pr-4 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  onFocus={() => {
                    dispatch(toggleMobileMenu());
                    dispatch(toggleSearch());
                  }}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 dark:text-neutral-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>
              </form>
            </div>
          </div>

          {/* Mobile Language Switcher */}
          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {t("header.actions.changeLanguage")}
              </span>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
