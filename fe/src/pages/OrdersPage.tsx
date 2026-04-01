import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '@/components/common/Button';
import { PremiumButton } from '@/components/common';
import Badge, { BadgeVariant } from '@/components/common/Badge';
import {
  useGetUserOrdersQuery,
  useCancelOrderMutation,
  useRepayOrderMutation,
  OrderItem,
} from '@/services/orderApi';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { toast } from '@/utils/toast';

// Order status badge variants
const statusVariants: Record<string, { variant: BadgeVariant; label: string }> =
  {
    pending: { variant: 'warning', label: 'Pending' },
    processing: { variant: 'info', label: 'Processing' },
    shipped: { variant: 'primary', label: 'Shipped' },
    delivered: { variant: 'success', label: 'Delivered' },
    cancelled: { variant: 'error', label: 'Cancelled' },
  };

// Payment status colors
const paymentStatusColors: Record<string, string> = {
  pending:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
};

const OrdersPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useSelector((state: RootState) => state.auth);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);
  const [repayingOrder, setRepayingOrder] = useState<string | null>(null);

  // Fetch orders
  const {
    data: ordersResponse,
    isLoading,
    isError,
    refetch,
  } = useGetUserOrdersQuery({ page: currentPage, limit: 10 }, { skip: !user });

  // Cancel order mutation
  const [cancelOrder] = useCancelOrderMutation();

  // Repay order mutation
  const [repayOrder] = useRepayOrderMutation();

  // Toggle order details
  const toggleOrderDetails = (orderId: string) => {
    setSelectedOrder(selectedOrder === orderId ? null : orderId);
  };

  // Handle cancel order
  const handleCancelOrder = async (orderId: string) => {
    if (!confirm(t('orders.cancelConfirm'))) return;

    setCancellingOrder(orderId);
    try {
      await cancelOrder(orderId).unwrap();
      refetch();
    } catch (error) {
      console.error('Failed to cancel order:', error);
      toast.error(t('common.error'));
    } finally {
      setCancellingOrder(null);
    }
  };

  // Handle repay order
  const handleRepayOrder = async (orderId: string) => {
    if (!confirm(t('orders.repayConfirm'))) return;

    setRepayingOrder(orderId);
    try {
      const response = await repayOrder(orderId).unwrap();
      // Redirect to payment page or show success message
      if (response.data?.paymentUrl) {
        window.location.href = response.data.paymentUrl;
      } else {
        // If no payment URL is returned, stay on orders page and show success message
        toast.success(t('payment.initializingPayment'));
        // Refresh orders list
        refetch();
      }
    } catch (error) {
      console.error('Failed to repay order:', error);
      toast.error(t('payment.errors.initializationFailed'));
    } finally {
      setRepayingOrder(null);
    }
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedOrder(null);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getItemDisplayName = (item: OrderItem) => {
    const productName = item.Product?.name || item.name || 'Unknown Product';
    const variantName = item.attributes?.variant;
    return variantName ? `${productName} (${variantName})` : productName;
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="max-w-md mx-auto bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-8">
          <div className="text-primary-500 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-4">
            {t('orders.loginRequired')}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            {t('orders.loginMessage')}
          </p>
          <PremiumButton
            variant="primary"
            size="large"
            iconType="arrow-right"
            onClick={() => (window.location.href = '/login')}
            className="w-full"
          >
            {t('auth.login')}
          </PremiumButton>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-neutral-800 dark:text-neutral-100 mb-8">
          {t('orders.title')}
        </h1>
        <div className="space-y-6">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-6 animate-pulse"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-24"></div>
                </div>
                <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-20"></div>
              </div>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-700 rounded-md mr-4"></div>
                <div>
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-20 mb-1"></div>
                  <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="max-w-md mx-auto bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-8">
          <div className="text-error-500 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
            {t('orders.error.title')}
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 mb-6">
            {t('orders.error.message')}
          </p>
          <Button variant="primary" onClick={() => refetch()}>
            {t('orders.tryAgain')}
          </Button>
        </div>
      </div>
    );
  }

  const orders = ordersResponse?.data.orders || [];
  const totalPages = ordersResponse?.data.pages || 1;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-neutral-800 dark:text-neutral-100">
          {t('orders.title')}
        </h1>
        <div className="text-sm text-neutral-500 dark:text-neutral-400">
          {ordersResponse?.data.total || 0} {t('orders.ordersTotal')}
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-12 text-center">
          <div className="text-neutral-400 mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-20 w-20 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
            {t('orders.empty.title')}
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 mb-8 max-w-md mx-auto">
            {t('orders.empty.message')}
          </p>
          <Button variant="primary" as={Link} to="/shop" size="lg">
            {t('orders.empty.startShopping')}
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Order Header */}
                <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
                            {t('orders.orderNumber', { number: order.number })}
                          </h2>
                          <Badge variant={statusVariants[order.status].variant}>
                            {t(`orders.status.${order.status}`)}
                          </Badge>
                        </div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          {t('orders.placedOn', {
                            date: formatDate(order.createdAt),
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            {t('orders.total')}
                          </p>
                          <p className="text-xl font-bold text-neutral-800 dark:text-neutral-100">
                            {formatCurrency(order.total)}
                          </p>
                        </div>
                        {order.paymentStatus && (
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              paymentStatusColors[order.paymentStatus]
                            }`}
                          >
                            {t(`orders.paymentStatus.${order.paymentStatus}`)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleOrderDetails(order.id)}
                        className="dark:text-primary-300"
                      >
                        {selectedOrder === order.id
                          ? t('orders.hideDetails')
                          : t('orders.viewDetails')}
                      </Button>
                      {order.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={cancellingOrder === order.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                        >
                          {cancellingOrder === order.id
                            ? t('orders.cancelling')
                            : t('orders.cancelOrder')}
                        </Button>
                      )}
                      {order.paymentStatus === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRepayOrder(order.id)}
                          disabled={repayingOrder === order.id}
                          className="text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:text-primary-400 dark:hover:text-primary-300 dark:hover:bg-primary-900/20"
                        >
                          {repayingOrder === order.id
                            ? t('orders.repaying')
                            : t('orders.repayOrder')}
                        </Button>
                      )}
                      {order.trackingNumber && (
                        <Button
                          variant="ghost"
                          size="sm"
                          as={Link}
                          to={`/track-order/${order.number}`}
                        >
                          {t('orders.track')}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Items Preview */}
                <div className="p-6">
                  {order.items && order.items.length > 0 ? (
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-2">
                        {order.items.slice(0, 4).map((item, index) => (
                          <div
                            key={item.id}
                            className="w-12 h-12 rounded-lg border-2 border-white dark:border-neutral-800 overflow-hidden bg-neutral-100 dark:bg-neutral-700 flex-shrink-0"
                            style={{ zIndex: 10 - index }}
                          >
                            {(() => {
                              const displayName = getItemDisplayName(item);
                              return item.image ? (
                                <img
                                  src={item.image}
                                  alt={displayName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs font-medium text-neutral-500">
                                  {displayName?.charAt(0) || '?'}
                                </div>
                              );
                            })()}
                          </div>
                        ))}
                        {order.items.length > 4 && (
                          <div className="w-12 h-12 rounded-lg border-2 border-white dark:border-neutral-800 bg-neutral-200 dark:bg-neutral-600 flex items-center justify-center text-xs font-medium text-neutral-600 dark:text-neutral-300">
                            +{order.items.length - 4}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                          {order.items.length}{' '}
                          {order.items.length === 1 ? 'item' : 'items'}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {order.items
                            .slice(0, 2)
                            .map((item) => getItemDisplayName(item))
                            .join(', ')}
                          {order.items.length > 2 && '...'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-neutral-500 dark:text-neutral-400">
                        No items found
                      </p>
                    </div>
                  )}

                  {/* Shipping Info */}
                  {(order.trackingNumber || order.estimatedDelivery) && (
                    <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm">
                        {order.trackingNumber && (
                          <div>
                            <span className="text-neutral-500 dark:text-neutral-400">
                              Tracking:{' '}
                            </span>
                            <span className="font-medium text-neutral-800 dark:text-neutral-200">
                              {order.trackingNumber}
                            </span>
                          </div>
                        )}
                        {order.estimatedDelivery && (
                          <div>
                            <span className="text-neutral-500 dark:text-neutral-400">
                              Est. Delivery:{' '}
                            </span>
                            <span className="font-medium text-neutral-800 dark:text-neutral-200">
                              {formatDate(order.estimatedDelivery)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Expandable Order Details */}
                {selectedOrder === order.id && (
                  <div className="border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/30">
                    <div className="p-6">
                      {/* Order Items */}
                      {order.items && order.items.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">
                            Order Items
                          </h3>
                          <div className="space-y-4">
                            {order.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center gap-4 p-4 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700"
                              >
                                {(() => {
                                  const displayName = getItemDisplayName(item);
                                  return (
                                    <>
                                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-100 dark:bg-neutral-700">
                                        {item.image ? (
                                          <img
                                            src={item.image}
                                            alt={displayName}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-neutral-500">
                                            {displayName?.charAt(0) || '?'}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-neutral-800 dark:text-neutral-100 truncate">
                                          {displayName}
                                        </h4>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                          <span>Qty: {item.quantity}</span>
                                          <span>
                                            Price: {formatCurrency(item.price)}
                                          </span>
                                        </div>
                                      </div>
                                    </>
                                  );
                                })()}
                                <div className="text-right">
                                  <p className="font-semibold text-neutral-800 dark:text-neutral-100">
                                    {formatCurrency(item.quantity * item.price)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Order Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Shipping Address */}
                        <div>
                          <h4 className="font-semibold text-neutral-800 dark:text-neutral-100 mb-3">
                            Shipping Address
                          </h4>
                          <div className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
                            <p className="font-medium text-neutral-800 dark:text-neutral-200">
                              {order.shippingFirstName} {order.shippingLastName}
                            </p>
                            {order.shippingCompany && (
                              <p>{order.shippingCompany}</p>
                            )}
                            <p>{order.shippingAddress1}</p>
                            {order.shippingAddress2 && (
                              <p>{order.shippingAddress2}</p>
                            )}
                            <p>
                              {order.shippingCity}, {order.shippingState}{' '}
                              {order.shippingZip}
                            </p>
                            <p>{order.shippingCountry}</p>
                            {order.shippingPhone && (
                              <p>Phone: {order.shippingPhone}</p>
                            )}
                          </div>
                        </div>

                        {/* Order Summary */}
                        <div>
                          <h4 className="font-semibold text-neutral-800 dark:text-neutral-100 mb-3">
                            Order Summary
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-neutral-600 dark:text-neutral-400">
                                Subtotal:
                              </span>
                              <span className="text-neutral-800 dark:text-neutral-200">
                                {formatCurrency(order.subtotal)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-neutral-600 dark:text-neutral-400">
                                Shipping:
                              </span>
                              <span className="text-neutral-800 dark:text-neutral-200">
                                {formatCurrency(order.shippingCost)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-neutral-600 dark:text-neutral-400">
                                Tax:
                              </span>
                              <span className="text-neutral-800 dark:text-neutral-200">
                                {formatCurrency(order.tax)}
                              </span>
                            </div>
                            {order.discount > 0 && (
                              <div className="flex justify-between text-green-600">
                                <span>Discount:</span>
                                <span>-{formatCurrency(order.discount)}</span>
                              </div>
                            )}
                            <div className="flex justify-between pt-2 border-t border-neutral-200 dark:border-neutral-600 font-semibold text-lg">
                              <span className="text-neutral-800 dark:text-neutral-200">
                                Total:
                              </span>
                              <span className="text-neutral-800 dark:text-neutral-200">
                                {formatCurrency(order.total)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (page) =>
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 2
                  )
                  .map((page, index, array) => (
                    <div key={page} className="flex items-center">
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2 text-neutral-400">...</span>
                      )}
                      <Button
                        variant={page === currentPage ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    </div>
                  ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrdersPage;
