import React, { useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  InputNumber,
  Space,
  message,
  Popconfirm,
  Tag,
  Image,
  Card,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FolderOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  useGetAllCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from '@/services/categoryApi';
import type { Category } from '@/types/category.types';

const { Title } = Typography;
const { TextArea } = Input;

interface CategoryFormData {
  name: string;
  description?: string;
  image?: string;
  parentId?: string | null;
  isActive: boolean;
  sortOrder: number;
}

const CategoriesPage: React.FC = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // API hooks
  const {
    data: categoriesData,
    isLoading,
    refetch,
  } = useGetAllCategoriesQuery();

  const [createCategory, { isLoading: isCreating }] =
    useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] =
    useUpdateCategoryMutation();
  const [deleteCategory] =
    useDeleteCategoryMutation();

  const categories = Array.isArray(categoriesData?.data)
    ? categoriesData.data
    : categoriesData?.data
      ? [categoriesData.data]
      : [];

  // Build parent category options
  const getParentOptions = (excludeId?: string) => {
    return categories
      .filter((cat) => cat.id !== excludeId && !cat.parentId) // Only root categories
      .map((cat) => ({
        value: cat.id,
        label: cat.name,
      }));
  };

  // Handle create/edit category
  const handleSubmit = async (values: CategoryFormData) => {
    try {
      if (editingCategory) {
        await updateCategory({
          id: editingCategory.id,
          ...values,
        }).unwrap();
        message.success('Cập nhật danh mục thành công!');
      } else {
        await createCategory(values).unwrap();
        message.success('Tạo danh mục thành công!');
      }

      setIsModalVisible(false);
      setEditingCategory(null);
      form.resetFields();
      refetch();
    } catch (error: any) {
      message.error(error?.data?.message || 'Có lỗi xảy ra!');
    }
  };

  // Handle delete category
  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id).unwrap();
      message.success('Xóa danh mục thành công!');
      refetch();
    } catch (error: any) {
      message.error(error?.data?.message || 'Không thể xóa danh mục!');
    }
  };

  // Open create modal
  const handleCreate = () => {
    setEditingCategory(null);
    setIsModalVisible(true);
    form.resetFields();
    form.setFieldsValue({
      isActive: true,
      sortOrder: 0,
    });
  };

  // Open edit modal
  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsModalVisible(true);
    form.setFieldsValue({
      name: category.name,
      description: category.description,
      image: category.image,
      parentId: category.parentId,
      isActive: category.isActive,
      sortOrder: category.sortOrder || 0,
    });
  };

  // Table columns
  const columns = [
    {
      title: 'Hình ảnh',
      dataIndex: 'image',
      key: 'image',
      width: 80,
      render: (image: string, record: Category) =>
        image ? (
          <Image
            src={image}
            alt={record.name}
            width={50}
            height={50}
            style={{ objectFit: 'cover', borderRadius: 4 }}
            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
            <FolderOutlined className="text-gray-400" />
          </div>
        ),
    },
    {
      title: 'Tên danh mục',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Category) => (
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-sm text-gray-500">{record.slug}</div>
        </div>
      ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      render: (description: string) =>
        description ? (
          <div className="max-w-xs truncate" title={description}>
            {description}
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      title: 'Danh mục cha',
      dataIndex: 'parentId',
      key: 'parentId',
      render: (parentId: string | null) => {
        if (!parentId) {
          return <Tag color="green">Danh mục gốc</Tag>;
        }
        const parent = categories.find((cat) => cat.id === parentId);
        return parent ? (
          <Tag color="blue">{parent.name}</Tag>
        ) : (
          <span className="text-gray-400">—</span>
        );
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'error'}>
          {isActive ? 'Hoạt động' : 'Ẩn'}
        </Tag>
      ),
    },
    {
      title: 'Thứ tự',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80,
      render: (sortOrder: number) => sortOrder || 0,
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: Category) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          />
          <Popconfirm
            title="Xóa danh mục"
            description="Bạn có chắc chắn muốn xóa danh mục này?"
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

  return (
    <div className="p-2 sm:p-4 md:p-6">
      <Card className="dark:bg-neutral-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <Title
              level={2}
              className="!mb-1 text-xl md:text-2xl dark:text-white"
            >
              Quản lý danh mục
            </Title>
            <p className="text-neutral-600 dark:text-neutral-400">
              Quản lý danh mục sản phẩm của cửa hàng
            </p>
          </div>
          <Space className="flex-wrap">
            <Button
              icon={<ReloadOutlined />}
              onClick={() => refetch()}
              loading={isLoading}
              className="dark:text-neutral-300"
            >
              Làm mới
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Thêm danh mục
            </Button>
          </Space>
        </div>

        <div className="overflow-x-auto">
          <Table
            columns={columns}
            dataSource={categories}
            rowKey="id"
            loading={isLoading}
            scroll={{ x: 800 }}
            className="dark-table-fixed-columns"
            pagination={{
              total: categories.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              responsive: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} danh mục`,
            }}
          />
        </div>

        <Modal
          title={editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
          open={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false);
            setEditingCategory(null);
            form.resetFields();
          }}
          footer={null}
          width={600}
          className="dark:ant-modal-dark"
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              isActive: true,
              sortOrder: 0,
            }}
            className="dark:text-neutral-300"
          >
            <Form.Item
              name="name"
              label={
                <span className="dark:text-neutral-300">Tên danh mục</span>
              }
              rules={[
                { required: true, message: 'Vui lòng nhập tên danh mục!' },
                { min: 2, message: 'Tên danh mục phải có ít nhất 2 ký tự!' },
              ]}
            >
              <Input placeholder="Nhập tên danh mục" />
            </Form.Item>

            <Form.Item
              name="description"
              label={<span className="dark:text-neutral-300">Mô tả</span>}
            >
              <TextArea
                rows={3}
                placeholder="Nhập mô tả cho danh mục (không bắt buộc)"
              />
            </Form.Item>

            <Form.Item
              name="image"
              label={<span className="dark:text-neutral-300">Hình ảnh</span>}
            >
              <Input placeholder="Nhập URL hình ảnh (không bắt buộc)" />
            </Form.Item>

            <Form.Item
              name="parentId"
              label={
                <span className="dark:text-neutral-300">Danh mục cha</span>
              }
            >
              <Select
                placeholder="Chọn danh mục cha (để trống nếu là danh mục gốc)"
                allowClear
                options={getParentOptions(editingCategory?.id)}
              />
            </Form.Item>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Form.Item
                name="sortOrder"
                label={
                  <span className="dark:text-neutral-300">Thứ tự sắp xếp</span>
                }
              >
                <InputNumber min={0} placeholder="0" className="w-full" />
              </Form.Item>

              <Form.Item
                name="isActive"
                label={
                  <span className="dark:text-neutral-300">Trạng thái</span>
                }
                valuePropName="checked"
              >
                <Switch checkedChildren="Hoạt động" unCheckedChildren="Ẩn" />
              </Form.Item>
            </div>

            <div className="flex flex-wrap justify-end gap-2 mt-6">
              <Button
                onClick={() => {
                  setIsModalVisible(false);
                  setEditingCategory(null);
                  form.resetFields();
                }}
              >
                Hủy
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isCreating || isUpdating}
              >
                {editingCategory ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </div>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default CategoriesPage;
