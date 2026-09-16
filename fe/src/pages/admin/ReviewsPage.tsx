import React, { useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Input,
  Select,
  Space,
  message,
  Popconfirm,
  Tag,
  Avatar,
  Rate,
  Image,
  Typography,
  Row,
  Col,
  Card,
  Tooltip,
  Divider,
  Alert,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  StarFilled,
  EyeOutlined,
  SafetyCertificateOutlined,
  MessageOutlined,
  EditOutlined,
  SendOutlined,
} from '@ant-design/icons';
import {
  useGetAdminReviewsQuery,
  useDeleteAdminReviewMutation,
  useReplyToReviewMutation,
  useDeleteReviewReplyMutation,
  type Review,
  type ReviewFilters,
} from '@/services/adminReviewApi';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ReviewsPage: React.FC = () => {
  const [filters, setFilters] = useState<ReviewFilters>({
    page: 1,
    limit: 10,
    search: '',
    rating: '',
    isVerified: '',
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  });

  const [searchInput, setSearchInput] = useState('');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isEditingReply, setIsEditingReply] = useState(false);

  // API Hooks
  const { data, isLoading, refetch } = useGetAdminReviewsQuery(filters);
  const [deleteReview, { isLoading: isDeleting }] = useDeleteAdminReviewMutation();
  const [replyToReview, { isLoading: isReplying }] = useReplyToReviewMutation();
  const [deleteReviewReply, { isLoading: isDeletingReply }] = useDeleteReviewReplyMutation();

  const reviews = data?.data?.reviews || [];
  const pagination = data?.data?.pagination;

  // ---- Handlers ----

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }));
  };

  const handleFilterChange = (key: keyof ReviewFilters, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleDelete = async (id: string, productName?: string) => {
    try {
      await deleteReview(id).unwrap();
      message.success(`Đã xóa review${productName ? ` cho "${productName}"` : ''}`);
    } catch {
      message.error('Xóa review thất bại. Vui lòng thử lại.');
    }
  };

  const handleViewDetail = (review: Review) => {
    setSelectedReview(review);
    setIsDetailModalVisible(true);
    // Pre-fill textarea nếu đã có reply — sẵn sàng cho Admin chỉnh sửa
    setReplyContent(review.reply?.content || '');
    setIsEditingReply(false);
  };

  const handleSubmitReply = async () => {
    if (!selectedReview || !replyContent.trim()) return;
    try {
      await replyToReview({
        reviewId: selectedReview.id,
        content: replyContent.trim(),
      }).unwrap();
      message.success(selectedReview.reply ? 'Cập nhật phản hồi thành công' : 'Phản hồi đã được gửi');
      setIsEditingReply(false);
      // Reload để lấy data mới từ server
      refetch();
      // Cập nhật selectedReview local cho UX mượt
      setSelectedReview((prev) => prev ? {
        ...prev,
        reply: { id: '', reviewId: prev.id, adminId: '', content: replyContent.trim(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      } : null);
    } catch {
      message.error('Gửi phản hồi thất bại');
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    try {
      await deleteReviewReply(replyId).unwrap();
      message.success('Xóa phản hồi thành công');
      setReplyContent('');
      setIsEditingReply(false);
      refetch();
      setSelectedReview((prev) => prev ? { ...prev, reply: null } : null);
    } catch {
      message.error('Xóa phản hồi thất bại');
    }
  };

  const handleTableChange = (pag: { current?: number; pageSize?: number }) => {
    setFilters((prev) => ({
      ...prev,
      page: pag.current ?? 1,
      limit: pag.pageSize ?? 10,
    }));
  };

  // ---- Render helpers ----

  const renderStars = (rating: number) => (
    <Rate disabled value={rating} style={{ fontSize: 14, color: '#faad14' }} />
  );

  const renderUserAvatar = (review: Review) => {
    const user = review.user;
    const fullName = user ? `${user.firstName} ${user.lastName}` : 'Người dùng ẩn';
    return (
      <Space>
        <Avatar src={user?.avatar} size={36}>
          {fullName.charAt(0).toUpperCase()}
        </Avatar>
        <div style={{ lineHeight: 1.3 }}>
          <div style={{ fontWeight: 500, fontSize: 13 }}>{fullName}</div>
          <div style={{ fontSize: 12, color: '#888' }}>{user?.email}</div>
        </div>
      </Space>
    );
  };

  const renderVerifiedBadge = (isVerified: boolean) =>
    isVerified ? (
      <Tooltip title="Đây là đánh giá từ người đã mua và nhận hàng thành công">
        <Tag
          icon={<SafetyCertificateOutlined />}
          color="green"
          style={{ fontSize: 11 }}
        >
          Verified Purchase
        </Tag>
      </Tooltip>
    ) : (
      <Tag color="default" style={{ fontSize: 11 }}>
        Chưa xác minh
      </Tag>
    );

  // ---- Table Columns ----

  const columns: ColumnsType<Review> = [
    {
      title: 'Người đánh giá',
      key: 'user',
      width: 200,
      render: (_, record) => renderUserAvatar(record),
    },
    {
      title: 'Sản phẩm',
      key: 'product',
      width: 200,
      render: (_, record) => {
        const product = record.Product;
        return product ? (
          <Space>
            {product.images?.[0] && (
              <Image
                src={product.images[0]}
                width={40}
                height={40}
                style={{ objectFit: 'cover', borderRadius: 6 }}
                preview={false}
              />
            )}
            <Text style={{ fontSize: 13, fontWeight: 500 }} ellipsis={{ tooltip: product.name }}>
              {product.name}
            </Text>
          </Space>
        ) : (
          <Text type="secondary" italic>
            Sản phẩm đã bị xóa
          </Text>
        );
      },
    },
    {
      title: 'Đánh giá',
      key: 'rating',
      width: 160,
      sorter: true,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          {renderStars(record.rating)}
          <Text type="secondary" style={{ fontSize: 11 }}>
            {record.likes} lượt thích · {record.dislikes} không thích
          </Text>
        </Space>
      ),
    },
    {
      title: 'Nội dung',
      key: 'content',
      render: (_, record) => (
        <div>
          {record.title && (
            <Text strong style={{ display: 'block', fontSize: 13 }}>
              {record.title}
            </Text>
          )}
          <Text
            type="secondary"
            style={{ fontSize: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
          >
            {record.content}
          </Text>
          {record.images && record.images.length > 0 && (
            <Tag color="blue" style={{ marginTop: 4, fontSize: 11 }}>
              {record.images.length} ảnh
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'isVerified',
      width: 160,
      filters: [
        { text: 'Verified Purchase', value: true },
        { text: 'Chưa xác minh', value: false },
      ],
      render: (_, record) => renderVerifiedBadge(record.isVerified),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      sorter: true,
      render: (date: string) =>
        new Date(date).toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          <Tooltip title="Xóa review vi phạm">
            <Popconfirm
              title="Xóa đánh giá?"
              description={
                <span>
                  Hành động này không thể hoàn tác.
                  <br />
                  Review sẽ bị xóa vĩnh viễn.
                </span>
              }
              onConfirm={() => handleDelete(record.id, record.Product?.name)}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true, loading: isDeleting }}
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // ---- Statistics summary ----

  const totalVerified = pagination
    ? undefined // Không có dữ liệu verified count riêng, hiển thị từ danh sách
    : undefined;

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            Quản lý Đánh giá sản phẩm
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Xem, lọc và xóa các đánh giá vi phạm từ khách hàng
          </Text>
        </Col>
        <Col>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            loading={isLoading}
          >
            Làm mới
          </Button>
        </Col>
      </Row>

      {/* Quick stats */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={8}>
          <Card size="small" bodyStyle={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <StarFilled style={{ color: '#faad14', fontSize: 20 }} />
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>
                  {pagination?.totalItems ?? 0}
                </div>
                <div style={{ fontSize: 12, color: '#888' }}>Tổng đánh giá</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" bodyStyle={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <SafetyCertificateOutlined style={{ color: '#52c41a', fontSize: 20 }} />
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>
                  {reviews.filter((r) => r.isVerified).length}
                </div>
                <div style={{ fontSize: 12, color: '#888' }}>Verified Purchase (trang này)</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" bodyStyle={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <StarFilled style={{ color: '#1890ff', fontSize: 20 }} />
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>
                  {reviews.length > 0
                    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                    : '—'}
                </div>
                <div style={{ fontSize: 12, color: '#888' }}>Điểm TB (trang này)</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={10} md={8}>
            <Input.Search
              placeholder="Tìm theo tên sản phẩm..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onSearch={handleSearch}
              onPressEnter={handleSearch}
              enterButton={<SearchOutlined />}
              allowClear
              onClear={() => {
                setSearchInput('');
                setFilters((prev) => ({ ...prev, search: '', page: 1 }));
              }}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="Rating"
              allowClear
              style={{ width: '100%' }}
              onChange={(val) => handleFilterChange('rating', val ?? '')}
            >
              {[5, 4, 3, 2, 1].map((star) => (
                <Option key={star} value={star}>
                  {'★'.repeat(star)} ({star} sao)
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={5}>
            <Select
              placeholder="Trạng thái"
              allowClear
              style={{ width: '100%' }}
              onChange={(val) => handleFilterChange('isVerified', val ?? '')}
            >
              <Option value={true}>✅ Verified Purchase</Option>
              <Option value={false}>⬜ Chưa xác minh</Option>
            </Select>
          </Col>
          <Col xs={24} sm={4} md={3}>
            <Button
              onClick={() => {
                setFilters({
                  page: 1,
                  limit: 10,
                  search: '',
                  rating: '',
                  isVerified: '',
                  sortBy: 'createdAt',
                  sortOrder: 'DESC',
                });
                setSearchInput('');
              }}
            >
              Xóa lọc
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Table<Review>
        columns={columns}
        dataSource={reviews}
        rowKey="id"
        loading={isLoading}
        scroll={{ x: 1000 }}
        pagination={{
          current: pagination?.currentPage ?? 1,
          pageSize: pagination?.itemsPerPage ?? 10,
          total: pagination?.totalItems ?? 0,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} đánh giá`,
          pageSizeOptions: ['10', '20', '50'],
        }}
        onChange={(pag) => handleTableChange(pag)}
      />

      {/* Detail Modal */}
      <Modal
        title={
          <Space>
            <StarFilled style={{ color: '#faad14' }} />
            Chi tiết đánh giá
          </Space>
        }
        open={isDetailModalVisible}
        onCancel={() => {
          setIsDetailModalVisible(false);
          setSelectedReview(null);
        }}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
            Đóng
          </Button>,
          <Popconfirm
            key="delete"
            title="Xóa đánh giá này?"
            description="Hành động này không thể hoàn tác."
            onConfirm={async () => {
              if (selectedReview) {
                await handleDelete(selectedReview.id, selectedReview.Product?.name);
                setIsDetailModalVisible(false);
                setSelectedReview(null);
              }
            }}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />}>
              Xóa review
            </Button>
          </Popconfirm>,
        ]}
        width={640}
      >
        {selectedReview && (
          <div>
            {/* User info */}
            <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
              <Row gutter={16} align="middle">
                <Col>{renderUserAvatar(selectedReview)}</Col>
                <Col flex={1}>
                  <div>{renderStars(selectedReview.rating)}</div>
                  <div style={{ marginTop: 4 }}>
                    {renderVerifiedBadge(selectedReview.isVerified)}
                  </div>
                </Col>
                <Col style={{ textAlign: 'right', color: '#888', fontSize: 12 }}>
                  {new Date(selectedReview.createdAt).toLocaleString('vi-VN')}
                </Col>
              </Row>
            </Card>

            {/* Product */}
            {selectedReview.Product && (
              <Card size="small" style={{ marginBottom: 16 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Sản phẩm: </Text>
                <Text strong>{selectedReview.Product.name}</Text>
              </Card>
            )}

            {/* Review content */}
            {selectedReview.title && (
              <Title level={5} style={{ marginBottom: 8 }}>
                {selectedReview.title}
              </Title>
            )}
            <Paragraph style={{ marginBottom: 16 }}>{selectedReview.content}</Paragraph>

            {/* Images */}
            {selectedReview.images && selectedReview.images.length > 0 && (
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Ảnh đính kèm ({selectedReview.images.length}):
                </Text>
                <Image.PreviewGroup>
                  <Space wrap style={{ marginTop: 8 }}>
                    {selectedReview.images.map((img, idx) => (
                      <Image
                        key={idx}
                        src={img}
                        width={80}
                        height={80}
                        style={{ objectFit: 'cover', borderRadius: 6, border: '1px solid #eee' }}
                      />
                    ))}
                  </Space>
                </Image.PreviewGroup>
              </div>
            )}

            {/* Engagement */}
            <div style={{ marginTop: 16, color: '#888', fontSize: 12 }}>
              👍 {selectedReview.likes} lượt thích · 👎 {selectedReview.dislikes} không thích
            </div>

            {/* ── REPLY SECTION ───────────────────────────────────────── */}
            <Divider />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <MessageOutlined style={{ color: '#1890ff' }} />
                <Text strong>Phản hồi từ Shop</Text>
                {selectedReview.reply && (
                  <Tag color="blue" style={{ marginLeft: 4 }}>Đã phản hồi</Tag>
                )}
              </div>

              {/* Hiển thị reply hiện tại nếu có */}
              {selectedReview.reply && !isEditingReply && (
                <Alert
                  message={
                    <div>
                      <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                        {selectedReview.reply.content}
                      </div>
                      <div style={{ fontSize: 11, color: '#888', marginTop: 6 }}>
                        {selectedReview.reply.admin
                          ? `${selectedReview.reply.admin.firstName} ${selectedReview.reply.admin.lastName}`
                          : 'Admin'}
                        {' · '}
                        {new Date(selectedReview.reply.createdAt).toLocaleString('vi-VN')}
                      </div>
                    </div>
                  }
                  type="info"
                  style={{ marginBottom: 10 }}
                  action={
                    <Space direction="vertical" size={4}>
                      <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => {
                          setReplyContent(selectedReview.reply!.content);
                          setIsEditingReply(true);
                        }}
                      >
                        Sửa
                      </Button>
                      <Popconfirm
                        title="Xóa phản hồi này?"
                        onConfirm={() => handleDeleteReply(selectedReview.reply!.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true, loading: isDeletingReply }}
                      >
                        <Button size="small" danger icon={<DeleteOutlined />}>
                          Xóa
                        </Button>
                      </Popconfirm>
                    </Space>
                  }
                />
              )}

              {/* Form nhập reply mới hoặc edit */}
              {(!selectedReview.reply || isEditingReply) && (
                <div>
                  <TextArea
                    placeholder="Nhập phản hồi chính thức từ Shop cho khách hàng..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    rows={4}
                    maxLength={2000}
                    showCount
                    style={{ marginBottom: 8 }}
                  />
                  <Space>
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      loading={isReplying}
                      disabled={!replyContent.trim()}
                      onClick={handleSubmitReply}
                    >
                      {selectedReview.reply ? 'Cập nhật phản hồi' : 'Gửi phản hồi'}
                    </Button>
                    {isEditingReply && (
                      <Button onClick={() => setIsEditingReply(false)}>Hủy</Button>
                    )}
                  </Space>
                </div>
              )}
            </div>
            {/* ── END REPLY SECTION ──────────────────────────────────── */}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReviewsPage;
