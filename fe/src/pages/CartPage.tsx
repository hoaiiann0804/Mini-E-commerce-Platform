import { PremiumButton } from '@/components/common';
import Button from '@/components/common/Button';
import CartItem from '@/components/features/CartItem';
import CheckCircleIcon from '@/components/icons/CheckCircleIcon';
import PlusCircleIcon from '@/components/icons/PlusCircleIcon';
import {
  clearCart,
  initializeCart,
  setServerCart,
} from '@/features/cart/cartSlice';
import { useClearCartMutation, useGetCartQuery } from '@/services/cartApi';
import { RootState } from '@/store';
import { formatPrice } from '@/utils/format';
import { toast } from '@/utils/toast';
import { skipToken } from '@reduxjs/toolkit/query';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';

const CartPage: React.FC = () => {
  const { t } = useTranslation();
  const { items, subtotal, totalItems, isLoading } = useSelector(
    (state: RootState) => state.cart
  );
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // API hooks - only call when authenticated
  const {
    data: serverCart,
    error: cartError,
    isLoading: cartLoading,
  } = useGetCartQuery(isAuthenticated ? undefined : skipToken);

  // Debug logging
  console.log('🛒 CartPage Debug:', {
    serverCart,
    cartError,
    cartLoading,
    isAuthenticated,
    localItems: items,
  });
  const [clearServerCart, { isLoading: clearingCart }] = useClearCartMutation();

  // Initialize cart on mount
  useEffect(() => {
    if (isAuthenticated && serverCart) {
      // Use server cart when authenticated and server data is available
      dispatch(setServerCart(serverCart));
    } else if (!isAuthenticated || (!cartLoading && !serverCart)) {
      // Use localStorage when not authenticated or when server cart is not available
      dispatch(initializeCart());
    }
  }, [dispatch, isAuthenticated, serverCart, cartLoading]);

  // Handle cart errors
  useEffect(() => {
    if (cartError) {
      console.error('Cart error:', cartError);
      // Show error toast
      toast.error(t('cart.notifications.loadError'));
      // Fallback to localStorage if server cart fails
      dispatch(initializeCart());
    }
  }, [cartError, dispatch, t]);

  // Calculate shipping (free over $50)
  const shipping = subtotal >= 50 || subtotal === 0 ? 0 : 5.99;

  // Calculate tax (7%)
  const tax = subtotal * 0.07;

  // Calculate total
  const total = subtotal + shipping + tax;

  // Handle checkout
    const handleCheckout = () => {
      navigate('/checkout');
    };

  // Handle clear cart
  const handleClearCart = async () => {
    if (!window.confirm(t('cart.clearCartConfirm'))) {
      return;
    }

    try {
      if (isAuthenticated) {
        // Only call API if user is authenticated
        await clearServerCart().unwrap();
        toast.success(t('cart.notifications.cleared'));
      } else {
        // If not authenticated, just clear local cart
        dispatch(clearCart());
        toast.success(t('cart.notifications.cleared'));
      }
    } catch (error: any) {
      console.error('Error clearing cart:', error);
      // Fallback to local cart
      dispatch(clearCart());
      toast.error(t('cart.notifications.serverError'));
    }
  };

  // Show loading state - only when authenticated and cart is loading
  if ((isAuthenticated && cartLoading) || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-neutral-800 dark:text-neutral-100 mb-8">
        {t('cart.title')}
      </h1>

      {/* Cart status indicator - only show when authenticated and has server cart */}
      {isAuthenticated && serverCart && serverCart.id && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center text-green-700 dark:text-green-300">
            <CheckCircleIcon />
            <span className="text-sm">{t('cart.syncedWithAccount')}</span>
          </div>
        </div>
      )}

      {/* Local storage indicator - show when not authenticated */}
      {!isAuthenticated && items.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center text-blue-700 dark:text-blue-300">
            <PlusCircleIcon />
            <span className="text-sm">{t('cart.savedLocally')}</span>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-8 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 mx-auto text-neutral-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          <h2 className="text-xl font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
            {t('cart.emptyCart.title')}
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 mb-6">
            {t('cart.emptyCart.message')}
          </p>
          <Button variant="primary" as={Link} to="/shop">
            {t('cart.emptyCart.startShopping')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart items */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100">
                  {t('cart.cartItems')} ({totalItems})
                </h2>
                <PremiumButton
                  variant="danger"
                  size="small"
                  isProcessing={clearingCart}
                  processingText={t('common.loading')}
                  onClick={handleClearCart}
                >
                  {t('cart.clearCart')}
                </PremiumButton>
              </div>

              <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {items.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 mb-6">
                {t('cart.orderSummary')}
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">
                    {t('cart.subtotal')}
                  </span>
                  <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">
                    {t('cart.shipping')}
                  </span>
                  <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                    {shipping === 0 ? t('cart.free') : formatPrice(shipping)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">
                    {t('cart.tax')} (7%)
                  </span>
                  <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                    {formatPrice(tax)}
                  </span>
                </div>

                <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4 flex justify-between">
                  <span className="text-neutral-800 dark:text-neutral-200 font-semibold">
                    {t('cart.total')}
                  </span>
                  <span className="text-neutral-900 dark:text-white font-bold">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              <PremiumButton
                variant="primary"
                size="large"
                iconType="arrow-right"
                onClick={handleCheckout}
                className="w-full h-12 mb-4"
              >
                {t('cart.proceedToCheckout')}
              </PremiumButton>

              <PremiumButton
                variant="outline"
                size="large"
                onClick={() => navigate('/shop')}
                className="w-full h-12"
              >
                {t('cart.continueShopping')}
              </PremiumButton>

              <div className="mt-6 text-sm text-neutral-500 dark:text-neutral-400">
                <p className="flex items-center mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2 text-primary-500 dark:text-primary-400"
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
                  {t('cart.benefits.freeShipping')}
                </p>
                <p className="flex items-center mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2 text-primary-500 dark:text-primary-400"
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
                  {t('cart.benefits.secureCheckout')}
                </p>
                <p className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2 text-primary-500 dark:text-primary-400"
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
                  {t('cart.benefits.returnPolicy')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
