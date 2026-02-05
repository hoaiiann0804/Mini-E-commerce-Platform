import React, { useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Space,
  message,
  Popconfirm,
  Tag,
  Avatar,
  Card,
  Typography,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  MailOutlined,
  PhoneOutlined,
  CrownOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import {
  useGetAllUsersQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  type User,
  type UserFilters,
} from '@/services/adminUserApi';

const { Title } = Typography;
const { Option } = Select;

interface UserFormData {
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'customer' | 'admin' | 'manager';
  isEmailVerified: boolean;
  isActive: boolean;
}

const UsersPage: React.FC = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    limit: 10,
    search: '',
    role: '',
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  });

  // API hooks
  const { data: usersData, isLoading, refetch } = useGetAllUsersQuery(filters);

  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();

  const users = usersData?.data?.users || [];
  const pagination = usersData?.data?.pagination;

  // Handle user update
  const handleSubmit = async (values: UserFormData) => {
    if (!editingUser) return;

    try {
      await updateUser({
        id: editingUser.id,
        ...values,
      }).unwrap();

      message.success('Cập nhật người dùng thành công!');
      setIsModalVisible(false);
      setEditingUser(null);
      form.resetFields();
    } catch (error: any) {
      message.error(error?.data?.message || 'Có lỗi xảy ra!');
    }
  };

  // Handle user delete
  const handleDelete = async (id: string) => {
    try {
      await deleteUser(id).unwrap();
      message.success('Xóa người dùng thành công!');
    } catch (error: any) {
      message.error(error?.data?.message || 'Không thể xóa người dùng!');
    }
  };

  // Open edit modal
  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsModalVisible(true);
    form.setFieldsValue({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
    });
  };

  // Handle search
  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  // Handle filter change
  const handleFilterChange = (key: keyof UserFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  // Handle pagination change
  const handleTableChange = (page: number, pageSize: number) => {
    setFilters((prev) => ({ ...prev, page, limit: pageSize }));
  };

  // Get role color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'red';
      case 'manager':
        return 'orange';
      case 'customer':
        return 'blue';
      default:
        return 'default';
    }
  };

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <CrownOutlined />;
      case 'manager':
        return <TeamOutlined />;
      case 'customer':
        return <UserOutlined />;
      default:
        return <UserOutlined />;
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Người dùng',
      key: 'user',
      render: (_:any, record: User) => (
        <div className="flex items-center gap-3">
          <Avatar src={record.avatar} icon={<UserOutlined />} size={48} />
          <div>
            <div className="font-medium">
              {record.firstName} {record.lastName}
            </div>
            <div className="text-sm text-gray-500 flex items-center gap-1">
              <MailOutlined className="text-xs" />
              {record.email}
            </div>
            {record.phone && (
              <div className="text-sm text-gray-500 flex items-center gap-1">
                <PhoneOutlined className="text-xs" />
                {record.phone}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: string) => (
        <Tag color={getRoleColor(role)} icon={getRoleIcon(role)}>
          {role === 'admin'
            ? 'Quản trị viên'
            : role === 'manager'
              ? 'Quản lý'
              : 'Khách hàng'}
        </Tag>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 150,
      render: (_:any, record: User) => (
        <div className="space-y-1">
          <div>
            <Tag color={record.isActive ? 'success' : 'error'}>
              {record.isActive ? 'Hoạt động' : 'Bị khóa'}
            </Tag>
          </div>
          <div>
            <Tag color={record.isEmailVerified ? 'processing' : 'warning'}>
              {record.isEmailVerified ? 'Email đã xác minh' : 'Chưa xác minh'}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 120,
      render: (_:any, record: User) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          />
          <Popconfirm
            title="Xóa người dùng"
            description="Bạn có chắc chắn muốn xóa người dùng này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" icon={<DeleteOutlined />} danger size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Calculate statistics
  const totalUsers = pagination?.totalItems || 0;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const customerCount = users.filter((u) => u.role === 'customer').length;
  const verifiedCount = users.filter((u) => u.isEmailVerified).length;

  return (
    <div className="p-2 sm:p-4 md:p-6">
      <Card className="dark:bg-neutral-800">
        <div className="mb-6">
          <Title
            level={2}
            className="!mb-1 text-xl md:text-2xl dark:text-white"
          >
            Quản lý người dùng
          </Title>
          <p className="text-neutral-600 dark:text-neutral-400">
            Quản lý tất cả người dùng trong hệ thống
          </p>
        </div>

        {/* Statistics */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} md={6}>
            <Card className="dark:bg-neutral-700">
              <Statistic
                title={
                  <span className="dark:text-neutral-300">Tổng người dùng</span>
                }
                value={totalUsers}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="dark:bg-neutral-700">
              <Statistic
                title={
                  <span className="dark:text-neutral-300">Quản trị viên</span>
                }
                value={adminCount}
                prefix={<CrownOutlined />}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="dark:bg-neutral-700">
              <Statistic
                title={
                  <span className="dark:text-neutral-300">Khách hàng</span>
                }
                value={customerCount}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="dark:bg-neutral-700">
              <Statistic
                title={
                  <span className="dark:text-neutral-300">
                    Đã xác minh email
                  </span>
                }
                value={verifiedCount}
                prefix={<MailOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <div className="mb-4 p-4 bg-gray-50 dark:bg-neutral-700 rounded-lg">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={12} lg={8}>
              <Input
                placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                suffix={<SearchOutlined style={{ color: 'rgba(0,0,0,.45)' }} />}
                allowClear
              />
            </Col>
            <Col xs={12} sm={8} md={6} lg={4}>
              <Select
                placeholder="Vai trò"
                value={filters.role}
                onChange={(value) => handleFilterChange('role', value)}
                style={{ width: '100%' }}
                allowClear
              >
                <Option value="">Tất cả</Option>
                <Option value="admin">Quản trị viên</Option>
                <Option value="manager">Quản lý</Option>
                <Option value="customer">Khách hàng</Option>
              </Select>
            </Col>
            <Col xs={12} sm={8} md={6} lg={4}>
              <Select
                placeholder="Sắp xếp theo"
                value={filters.sortBy}
                onChange={(value) => handleFilterChange('sortBy', value)}
                style={{ width: '100%' }}
              >
                <Option value="createdAt">Ngày tạo</Option>
                <Option value="firstName">Tên</Option>
                <Option value="email">Email</Option>
              </Select>
            </Col>
            <Col xs={12} sm={8} md={6} lg={4}>
              <Select
                placeholder="Thứ tự"
                value={filters.sortOrder}
                onChange={(value) => handleFilterChange('sortOrder', value)}
                style={{ width: '100%' }}
              >
                <Option value="DESC">Giảm dần</Option>
                <Option value="ASC">Tăng dần</Option>
              </Select>
            </Col>
            <Col xs={12} sm={8} md={6} lg={4}>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => refetch()}
                loading={isLoading}
                style={{ width: '100%' }}
                className="dark:text-neutral-300"
              >
                Làm mới
              </Button>
            </Col>
          </Row>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table
            columns={columns}
            dataSource={users}
            className="dark-table-fixed-columns"
            rowKey="id"
            loading={isLoading}
            pagination={{
              current: pagination?.currentPage,
              total: pagination?.totalItems,
              pageSize: pagination?.itemsPerPage,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} người dùng`,
              onChange: handleTableChange,
            }}
            scroll={{ x: 800 }}
          />
        </div>

        {/* Edit Modal */}
        <Modal
          title="Chỉnh sửa người dùng"
          open={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false);
            setEditingUser(null);
            form.resetFields();
          }}
          footer={null}
          width={600}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="firstName"
                  label="Tên"
                  rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}
                >
                  <Input placeholder="Nhập tên" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="lastName"
                  label="Họ"
                  rules={[{ required: true, message: 'Vui lòng nhập họ!' }]}
                >
                  <Input placeholder="Nhập họ" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="phone" label="Số điện thoại">
              <Input placeholder="Nhập số điện thoại" />
            </Form.Item>

            <Form.Item
              name="role"
              label="Vai trò"
              rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
            >
              <Select placeholder="Chọn vai trò">
                <Option value="customer">Khách hàng</Option>
                <Option value="manager">Quản lý</Option>
                <Option value="admin">Quản trị viên</Option>
              </Select>
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="isEmailVerified"
                  label="Trạng thái email"
                  valuePropName="checked"
                >
                  <Switch
                    checkedChildren="Đã xác minh"
                    unCheckedChildren="Chưa xác minh"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="isActive"
                  label="Trạng thái tài khoản"
                  valuePropName="checked"
                >
                  <Switch
                    checkedChildren="Hoạt động"
                    unCheckedChildren="Bị khóa"
                  />
                </Form.Item>
              </Col>
            </Row>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                onClick={() => {
                  setIsModalVisible(false);
                  setEditingUser(null);
                  form.resetFields();
                }}
              >
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={isUpdating}>
                Cập nhật
              </Button>
            </div>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default UsersPage;
