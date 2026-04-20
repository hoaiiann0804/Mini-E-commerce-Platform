import React, { useState, useCallback } from 'react';
import {
  Table,
  Card,
  Input,
  Select,
  Button,
  Tag,
  Modal,
  Form,
  Space,
  Divider,
  Row,
  Col,
  Descriptions,
  List,
  Image,
  Typography,
  Alert,
  Spin,
  Pagination,
  message,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  ReloadOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

import dayjs from 'dayjs';
import {
  useGetAdminOrdersQuery,
  useUpdateOrderStatusMutation,
  AdminOrder,
} from '@/services/adminOrderApi';
import styles from './OrdersPage.module.css';
import { useTranslation } from 'react-i18next';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

// Status configuration with colors and icons
const STATUS_CONFIG = {
  pending: { color: 'orange', icon: '⏳' },
  processing: { color: 'blue', icon: '🔄' },
  shipped: { color: 'purple', icon: '🚚' },
  delivered: { color: 'green', icon: '✅' },
  cancelled: { color: 'red', icon: '❌' },
};

const PAYMENT_STATUS_CONFIG = {
  pending: { color: 'orange', icon: '⏳' },
  paid: { color: 'green', icon: '✅' },
  failed: { color: 'red', icon: '❌' },
  refunded: { color: 'gray', icon: '🔄' },
};

const OrdersPage: React.FC = () => {
  //console.log('OrdersPage: Component rendering');
  const { t } = useTranslation();
  const [form] = Form.useForm();

  // State management
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // API queries
  const {
    data: ordersData,
    isLoading,
    error,
    refetch,
  } = useGetAdminOrdersQuery({
    page,
    limit: pageSize,
    search: searchTerm,
    status: statusFilter,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  });

  const [updateOrderStatus, { isLoading: isUpdating }] =
    useUpdateOrderStatusMutation();

  // Format currency
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }, []);

  // Format date
  const formatDate = useCallback((dateString: string) => {
    return dayjs(dateString).format('DD/MM/YYYY HH:mm');
  }, []);

  // Status options for filters and forms
  const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'pending', label: 'Chờ xử lý' },
    { value: 'processing', label: 'Đang xử lý' },
    { value: 'shipped', label: 'Đã giao cho vận chuyển' },
    { value: 'delivered', label: 'Đã giao hàng' },
    { value: 'cancelled', label: 'Đã hủy' },
  ];

  const updateStatusOptions = statusOptions.filter(
    (option) => option.value !== ''
  );

  // Handle view order details
  const handleViewDetails = useCallback((order: AdminOrder) => {
    setSelectedOrder(order);
    setIsDetailsModalOpen(true);
  }, []);

  // Handle update order status
  const handleUpdateStatus = useCallback(
    (order: AdminOrder) => {
      setSelectedOrder(order);
      form.setFieldsValue({
        status: order.status,
        note: '',
      });
      setIsUpdateModalOpen(true);
    },
    [form]
  );

  // Submit status update
  const handleStatusUpdate = useCallback(
    async (values: any) => {
      if (!selectedOrder) return;

      try {
        await updateOrderStatus({
          id: selectedOrder.id,
          data: {
            status: values.status,
            note: values.note || undefined,
          },
        }).unwrap();

        message.success(t('admin.orders.messages.updateSuccess'));
        setIsUpdateModalOpen(false);
        form.resetFields();
        setSelectedOrder(null);
        refetch();
      } catch (error: any) {
        console.error('Failed to update order status:', error);
        message.error(t('admin.orders.messages.updateError'));
      }
    },
    [selectedOrder, updateOrderStatus, t, form, refetch]
  );

  // Handle search
  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    setPage(1);
  }, []);

  // Handle status filter change
  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value);
    setPage(1);
  }, []);

  // Handle pagination change
  const handlePageChange = useCallback(
    (newPage: number, newPageSize?: number) => {
      setPage(newPage);
      if (newPageSize && newPageSize !== pageSize) {
        // Handle page size change if needed
      }
    },
    [pageSize]
  );

  // Table columns configuration
  const columns: ColumnsType<AdminOrder> = [
    {
      title: 'Mã đơn hàng',
      dataIndex: 'number',
      key: 'number',
      width: 120,
      render: (number: string, record: AdminOrder) => (
        <div>
          <Text strong>#{number}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {`${record.items?.length || 0} sản phẩm`}
          </Text>
        </div>
      ),
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      width: 200,
      render: (_, record: AdminOrder) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserOutlined style={{ color: '#666' }} />
            <Text strong>
              {record.User?.firstName} {record.User?.lastName}
            </Text>
          </div>
          <Text style={{ fontSize: '12px', color: '#666' }}>
            {record.User?.email}
          </Text>
        </div>
      ),
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (date: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarOutlined style={{ color: '#666' }} />
          <Text>{formatDate(date)}</Text>
        </div>
      ),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total',
      key: 'total',
      width: 120,
      render: (total: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DollarOutlined style={{ color: '#666' }} />
          <Text strong style={{ color: '#1890ff' }}>
            {formatCurrency(total)}
          </Text>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
        return (
          <Tag color={config?.color} className={styles.statusTag}>
            {config?.icon}{' '}
            {statusOptions.find((opt) => opt.value === status)?.label || status}
          </Tag>
        );
      },
    },
    {
      title: 'Thanh toán',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      width: 120,
      render: (paymentStatus: string) => {
        const config =
          PAYMENT_STATUS_CONFIG[
            paymentStatus as keyof typeof PAYMENT_STATUS_CONFIG
          ];
        return (
          <Tag color={config?.color} style={{ borderRadius: '16px' }}>
            {config?.icon}{' '}
            {paymentStatus === 'pending'
              ? 'Chờ thanh toán'
              : paymentStatus === 'paid'
                ? 'Đã thanh toán'
                : paymentStatus === 'failed'
                  ? 'Thanh toán thất bại'
                  : paymentStatus === 'refunded'
                    ? 'Đã hoàn tiền'
                    : paymentStatus}
          </Tag>
        );
      },
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record: AdminOrder) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
            title={t('admin.orders.actions.view')}
            size="small"
          />
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleUpdateStatus(record)}
            title={t('admin.orders.actions.update')}
            size="small"
          />
        </Space>
      ),
    },
  ];

  // Get orders and pagination from API response
  const orders = ordersData?.data?.orders || [];
  const pagination = ordersData?.data?.pagination;

  //console.log('OrdersPage: Render state', {
    isLoading,
    error,
    orders,
    pagination,
  });

  // Loading component
  if (isLoading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>
          <Text>Đang tải đơn hàng...</Text>
        </div>
      </div>
    );
  }

  // Error component
  if (error) {
    console.error('OrdersPage: API Error', error);
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Lỗi khi tải đơn hàng"
          description="Không thể tải danh sách đơn hàng. Vui lòng thử lại."
          type="error"
          showIcon
          action={
            <Button size="small" danger onClick={() => refetch()}>
              Thử lại
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div
      className={`${styles.ordersPage} dark:bg-neutral-900 dark:!bg-neutral-900`}
    >
      {/* Header */}
      <div className={styles.pageHeader}>
        <Title level={2} className={`${styles.pageTitle} dark:text-white`}>
          <ShoppingCartOutlined />
          Quản lý đơn hàng
        </Title>
        <Text type="secondary" className="dark:text-neutral-400">
          Quản lý danh sách đơn hàng của khách hàng
        </Text>
      </div>

      {/* Filters */}
      <Card className={`${styles.filterCard} dark:bg-neutral-800`}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              placeholder="Tìm kiếm đơn hàng..."
              allowClear
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: '100%' }}
              className="dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200"
              suffix={
                <SearchOutlined
                  style={{ color: 'rgba(0,0,0,.45)' }}
                  className="dark:text-neutral-400"
                />
              }
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="Lọc theo trạng thái"
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={handleStatusFilterChange}
              allowClear
              className="dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200"
            >
              {statusOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={24} md={8} lg={12} style={{ textAlign: 'right' }}>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => refetch()}
              loading={isLoading}
              className="dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-700"
            >
              Làm mới
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Orders Table */}
      <Card className={`${styles.tableCard} dark:bg-neutral-800`}>
        <div className="overflow-x-auto">
          <Table<AdminOrder>
            columns={columns}
            dataSource={orders}
            rowKey="id"
            loading={isLoading}
            pagination={false}
            scroll={{ x: 800 }}
            className="dark:bg-neutral-800 dark-table-fixed-columns"
            locale={{
              emptyText: t('admin.orders.noOrdersFound'),
            }}
          />
        </div>

        {/* Custom Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div
            className={`${styles.paginationContainer} dark:border-neutral-700`}
          >
            <Pagination
              current={page}
              total={pagination.totalItems}
              pageSize={pageSize}
              showSizeChanger={false}
              showQuickJumper
              showTotal={(total, range) =>
                `${t('admin.orders.pagination.showing')} ${range[0]}-${range[1]} ${t('admin.orders.pagination.of')} ${total} ${t('admin.orders.pagination.results')}`
              }
              onChange={handlePageChange}
              className="dark:text-neutral-300"
            />
          </div>
        )}
      </Card>

      {/* Order Details Modal */}
      <Modal
        title={
          <div className={styles.modalHeader}>
            <EyeOutlined />
            {t('admin.orders.details.title')}
          </div>
        }
        className={styles.orderDetailsModal}
        open={isDetailsModalOpen}
        onCancel={() => setIsDetailsModalOpen(false)}
        footer={null}
        width={800}
      >
        {selectedOrder && (
          <div>
            {/* Order Basic Info */}
            <Descriptions column={2} bordered style={{ marginBottom: '24px' }}>
              <Descriptions.Item label={t('admin.orders.details.orderNumber')}>
                <Text strong>#{selectedOrder.number}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={t('admin.orders.details.orderDate')}>
                {formatDate(selectedOrder.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label={t('admin.orders.details.orderStatus')}>
                <Tag
                  color={
                    STATUS_CONFIG[
                      selectedOrder.status as keyof typeof STATUS_CONFIG
                    ]?.color
                  }
                >
                  {
                    STATUS_CONFIG[
                      selectedOrder.status as keyof typeof STATUS_CONFIG
                    ]?.icon
                  }{' '}
                  {t(`admin.orders.status.${selectedOrder.status}`)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item
                label={t('admin.orders.details.paymentStatus')}
              >
                <Tag
                  color={
                    PAYMENT_STATUS_CONFIG[
                      selectedOrder.paymentStatus as keyof typeof PAYMENT_STATUS_CONFIG
                    ]?.color
                  }
                >
                  {
                    PAYMENT_STATUS_CONFIG[
                      selectedOrder.paymentStatus as keyof typeof PAYMENT_STATUS_CONFIG
                    ]?.icon
                  }{' '}
                  {t(
                    `admin.orders.paymentStatus.${selectedOrder.paymentStatus}`
                  )}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            {/* Customer Information */}
            <Card
              title={
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <UserOutlined />
                  {t('admin.orders.details.customer.title')}
                </div>
              }
              size="small"
              style={{ marginBottom: '16px' }}
            >
              <Descriptions column={1}>
                <Descriptions.Item
                  label={t('admin.orders.details.customer.name')}
                >
                  {selectedOrder.User?.firstName} {selectedOrder.User?.lastName}
                </Descriptions.Item>
                <Descriptions.Item
                  label={t('admin.orders.details.customer.email')}
                >
                  {selectedOrder.User?.email}
                </Descriptions.Item>
                {selectedOrder.User?.phone && (
                  <Descriptions.Item
                    label={t('admin.orders.details.customer.phone')}
                  >
                    {selectedOrder.User.phone}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            {/* Order Items */}
            <Card
              title={t('admin.orders.details.items.title')}
              size="small"
              style={{ marginBottom: '16px' }}
            >
              <List
                dataSource={selectedOrder.items}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        item.Product?.images?.[0] && (
                          <Image
                            src={item.Product.images[0]}
                            alt={item.Product.name}
                            width={60}
                            height={60}
                            style={{ borderRadius: '8px' }}
                          />
                        )
                      }
                      title={
                        <Text strong>
                          {item.Product?.name || t('admin.orders.noItemsFound')}
                        </Text>
                      }
                      description={
                        <div>
                          <Text type="secondary">
                            {t('admin.orders.details.items.quantity')}:{' '}
                            {item.quantity} × {formatCurrency(item.price)}
                          </Text>
                        </div>
                      }
                    />
                    <div style={{ textAlign: 'right' }}>
                      <Text strong style={{ fontSize: '16px' }}>
                        {formatCurrency(item.quantity * item.price)}
                      </Text>
                    </div>
                  </List.Item>
                )}
              />
            </Card>

            {/* Order Summary */}
            <Card title={t('admin.orders.details.summary.title')} size="small">
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                <div
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <Text>{t('admin.orders.details.summary.subtotal')}:</Text>
                  <Text>{formatCurrency(selectedOrder.subtotal)}</Text>
                </div>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <Text>{t('admin.orders.details.summary.tax')}:</Text>
                  <Text>{formatCurrency(selectedOrder.tax)}</Text>
                </div>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <Text>{t('admin.orders.details.summary.shipping')}:</Text>
                  <Text>{formatCurrency(selectedOrder.shippingCost)}</Text>
                </div>
                {selectedOrder.discount > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      color: '#52c41a',
                    }}
                  >
                    <Text>{t('admin.orders.details.summary.discount')}:</Text>
                    <Text>-{formatCurrency(selectedOrder.discount)}</Text>
                  </div>
                )}
                <Divider style={{ margin: '8px 0' }} />
                <div
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <Text strong style={{ fontSize: '16px' }}>
                    {t('admin.orders.details.summary.total')}:
                  </Text>
                  <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                    {formatCurrency(selectedOrder.total)}
                  </Text>
                </div>
              </div>
            </Card>
          </div>
        )}
      </Modal>

      {/* Update Status Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <EditOutlined />
            {t('admin.orders.updateStatus.title')}
          </div>
        }
        open={isUpdateModalOpen}
        onCancel={() => {
          setIsUpdateModalOpen(false);
          form.resetFields();
          setSelectedOrder(null);
        }}
        onOk={() => form.submit()}
        confirmLoading={isUpdating}
        okText={t('admin.orders.updateStatus.update')}
        cancelText={t('admin.orders.updateStatus.cancel')}
      >
        {selectedOrder && (
          <Form form={form} layout="vertical" onFinish={handleStatusUpdate}>
            <Alert
              message={`${t('admin.orders.details.orderNumber')}: #${selectedOrder.number}`}
              description={`${t('admin.orders.updateStatus.currentStatus')}: ${t(`admin.orders.status.${selectedOrder.status}`)}`}
              type="info"
              style={{ marginBottom: '16px' }}
            />

            <Form.Item
              name="status"
              label={t('admin.orders.updateStatus.newStatus')}
              rules={[
                {
                  required: true,
                  message: t('admin.orders.updateStatus.selectNewStatus'),
                },
              ]}
            >
              <Select
                placeholder={t('admin.orders.updateStatus.selectNewStatus')}
              >
                {updateStatusOptions.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="note" label={t('admin.orders.updateStatus.note')}>
              <TextArea
                rows={3}
                placeholder={t('admin.orders.updateStatus.notePlaceholder')}
              />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default OrdersPage;
