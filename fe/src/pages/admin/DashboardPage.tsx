import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGetDashboardStatsQuery } from '@/services/adminDashboardApi';
import { useGetAdminOrdersQuery } from '@/services/adminOrderApi';
import { formatPrice } from '@/utils/format';

// Status badge colors
const statusColors: Record<string, string> = {
  pending:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  processing:
    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  shipped:
    'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
  delivered:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const DashboardPage: React.FC = () => {
  const { t, i18n } = useTranslation();

  // Debug logging
  console.log('DashboardPage - i18n ready:', i18n.isInitialized);
  console.log('DashboardPage - current language:', i18n.language);
  console.log('DashboardPage - test translation:', t('admin.dashboard.title'));

  // Fetch dashboard stats
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    isError: isDashboardError,
  } = useGetDashboardStatsQuery();

  // Fetch recent orders
  const { data: ordersData, isLoading: isOrdersLoading } =
    useGetAdminOrdersQuery({ page: 1, limit: 5 });

  // Format currency
  const formatCurrency = (amount: number) => {
    const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
    const currency = i18n.language === 'vi' ? 'VND' : 'USD';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // Format growth percentage
  const formatGrowth = (growth: number) => {
    const isPositive = growth >= 0;
    return {
      value: Math.abs(growth).toFixed(1),
      isPositive,
      color: isPositive
        ? 'text-green-600 dark:text-green-400'
        : 'text-red-600 dark:text-red-400',
      icon: isPositive ? 'up' : 'down',
    };
  };

  if (isDashboardLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-neutral-800 dark:text-neutral-100 mb-8">
          {t('admin.dashboard.title')}
        </h1>

        {/* Loading Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-6 animate-pulse"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-24"></div>
                <div className="w-10 h-10 bg-neutral-200 dark:bg-neutral-700 rounded-full"></div>
              </div>
              <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-20 mb-2"></div>
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-32"></div>
            </div>
          ))}
        </div>

        {/* Loading Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[...Array(2)].map((_, index) => (
            <div
              key={index}
              className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-6 animate-pulse"
            >
              <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-32 mb-4"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded"
                  ></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isDashboardError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-neutral-800 dark:text-neutral-100 mb-8">
          {t('admin.dashboard.title')}
        </h1>
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-8 text-center">
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
            {t('admin.dashboard.errors.loadingDashboard')}
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400">
            {t('admin.dashboard.errors.failedToLoad')}
          </p>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.data;
  const recentOrders = ordersData?.data.orders || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-neutral-800 dark:text-neutral-100">
          {t('admin.dashboard.title')}
        </h1>
        <div className="text-sm text-neutral-500 dark:text-neutral-400">
          {t('admin.dashboard.lastUpdated')}:{' '}
          {new Date().toLocaleString(
            i18n.language === 'vi' ? 'vi-VN' : 'en-US'
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Revenue */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-6 border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              {t('admin.dashboard.stats.totalRevenue')}
            </h2>
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-primary-600 dark:text-primary-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
            {formatCurrency(stats?.overview?.totalRevenue || 0)}
          </div>
          {stats?.growth.revenue !== undefined && (
            <div
              className={`mt-2 text-sm flex items-center ${formatGrowth(stats.growth.revenue).color}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    formatGrowth(stats.growth.revenue).isPositive
                      ? 'M5 10l7-7m0 0l7 7m-7-7v18'
                      : 'M19 14l-7 7m0 0l-7-7m7 7V3'
                  }
                />
              </svg>
              <span>
                {formatGrowth(stats.growth.revenue).value}%{' '}
                {t('admin.dashboard.stats.fromLastMonth')}
              </span>
            </div>
          )}
        </div>

        {/* Total Orders */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-6 border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              {t('admin.dashboard.stats.totalOrders')}
            </h2>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-blue-600 dark:text-blue-400"
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
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
            {stats?.overview?.totalOrders || 0}
          </div>
          {stats?.growth.orders !== undefined && (
            <div
              className={`mt-2 text-sm flex items-center ${formatGrowth(stats.growth.orders).color}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    formatGrowth(stats.growth.orders).isPositive
                      ? 'M5 10l7-7m0 0l7 7m-7-7v18'
                      : 'M19 14l-7 7m0 0l-7-7m7 7V3'
                  }
                />
              </svg>
              <span>
                {formatGrowth(stats.growth.orders).value}%{' '}
                {t('admin.dashboard.stats.fromLastMonth')}
              </span>
            </div>
          )}
        </div>

        {/* Total Users */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-6 border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              {t('admin.dashboard.stats.totalUsers')}
            </h2>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
            {stats?.overview?.totalUsers || 0}
          </div>
          {stats?.growth.users !== undefined && (
            <div
              className={`mt-2 text-sm flex items-center ${formatGrowth(stats.growth.users).color}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    formatGrowth(stats.growth.users).isPositive
                      ? 'M5 10l7-7m0 0l7 7m-7-7v18'
                      : 'M19 14l-7 7m0 0l-7-7m7 7V3'
                  }
                />
              </svg>
              <span>
                {formatGrowth(stats.growth.users).value}%{' '}
                {t('admin.dashboard.stats.fromLastMonth')}
              </span>
            </div>
          )}
        </div>

        {/* Total Products */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-6 border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              {t('admin.dashboard.stats.totalProducts')}
            </h2>
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-yellow-600 dark:text-yellow-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
            {stats?.overview?.totalProducts || 0}
          </div>
          <div className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            {t('admin.dashboard.stats.activeProducts')}
          </div>
        </div>
      </div>

      {/* Pending Orders Alert */}
      {(stats?.overview?.pendingOrders ?? 0) > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-8">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <span className="text-yellow-800 dark:text-yellow-200 font-medium">
              {t('admin.dashboard.alerts.pendingOrders', {
                count: stats?.overview?.pendingOrders ?? 0,
              })}
            </span>
            <Link
              to="/admin/orders?status=pending"
              className="ml-auto text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 font-medium text-sm"
            >
              {t('admin.dashboard.alerts.viewOrders')} →
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
              {t('admin.dashboard.sections.recentOrders')}
            </h2>
            <Link
              to="/admin/orders"
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
            >
              {t('admin.dashboard.sections.viewAll')}
            </Link>
          </div>
          <div className="overflow-x-auto">
            {isOrdersLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, index) => (
                  <div
                    key={index}
                    className="animate-pulse flex items-center space-x-4"
                  >
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-20"></div>
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-32"></div>
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-24"></div>
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-16"></div>
                  </div>
                ))}
              </div>
            ) : recentOrders.length > 0 ? (
              <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                <thead className="bg-neutral-50 dark:bg-neutral-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      {t('admin.dashboard.table.order')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      {t('admin.dashboard.table.customer')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      {t('admin.dashboard.table.date')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      {t('admin.dashboard.table.total')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      {t('admin.dashboard.table.status')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
                  {recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-800 dark:text-neutral-100">
                        #{order.number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-300">
                        {order.shippingFirstName} {order.shippingLastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-300">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-300">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            statusColors[order.status]
                          }`}
                        >
                          {t(`admin.dashboard.orderStatus.${order.status}`)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-center text-neutral-500 dark:text-neutral-400">
                {t('admin.dashboard.table.noRecentOrders')}
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
              {t('admin.dashboard.sections.topProducts')}
            </h2>
            <Link
              to="/admin/products"
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
            >
              {t('admin.dashboard.sections.viewAll')}
            </Link>
          </div>
          <div className="p-6">
            {stats?.topProducts && stats.topProducts.length > 0 ? (
              <div className="space-y-4">
                {stats.topProducts.map((item, index) => (
                  <div
                    key={item.product.id}
                    className="flex items-center space-x-4"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-700">
                      {item.product.images?.[0] ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-500">
                          {item.product.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100 truncate">
                        {item.product.name}
                      </p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          {item.totalSold} {t('admin.dashboard.table.sold')}
                        </span>
                        <span className="text-xs font-medium text-green-600 dark:text-green-400">
                          {formatCurrency(item.totalRevenue)}
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700 rounded-full">
                        {index + 1}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-neutral-500 dark:text-neutral-400">
                {t('admin.dashboard.table.noProductData')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
