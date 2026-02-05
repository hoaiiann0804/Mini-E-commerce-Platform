import React, { useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  message,
  Popconfirm,
  Space,
  Tag,
  Card,
  Row,
  Col,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SafetyOutlined,
  DollarOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";
import {
  useGetWarrantyPackagesQuery,
  useCreateWarrantyPackageMutation,
  useUpdateWarrantyPackageMutation,
  useDeleteWarrantyPackageMutation,
} from "@/services/warrantyApi";
import { WarrantyPackage } from "@/types/product.types";

const { TextArea } = Input;

const WarrantyPackagesPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<WarrantyPackage | null>(
    null
  );
  const [form] = Form.useForm();

  // API hooks
  const { data: warrantyPackagesData, isLoading } = useGetWarrantyPackagesQuery(
    { isActive: undefined }
  );
  const [createWarrantyPackage, { isLoading: isCreating }] =
    useCreateWarrantyPackageMutation();
  const [updateWarrantyPackage, { isLoading: isUpdating }] =
    useUpdateWarrantyPackageMutation();
  const [deleteWarrantyPackage] = useDeleteWarrantyPackageMutation();

  const warrantyPackages = warrantyPackagesData?.data?.warrantyPackages || [];

  const handleCreate = () => {
    setEditingPackage(null);
    form.resetFields();
    form.setFieldsValue({
      isActive: true,
      sortOrder: 0,
      price: 0,
      coverage: [],
    });
    setIsModalOpen(true);
  };

  const handleEdit = (record: WarrantyPackage) => {
    setEditingPackage(record);
    form.setFieldsValue({
      ...record,
      coverage: record.coverage?.join("\n") || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWarrantyPackage(id).unwrap();
      message.success("Xóa gói bảo hành thành công");
    } catch (error: any) {
      message.error(
        error?.data?.message || "Có lỗi xảy ra khi xóa gói bảo hành"
      );
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const coverageArray = values.coverage
        ? values.coverage.split("\n").filter((item: string) => item.trim())
        : [];

      const data = {
        ...values,
        coverage: coverageArray,
      };

      if (editingPackage) {
        await updateWarrantyPackage({
          id: editingPackage.id,
          ...data,
        }).unwrap();
        message.success("Cập nhật gói bảo hành thành công");
      } else {
        await createWarrantyPackage(data).unwrap();
        message.success("Tạo gói bảo hành thành công");
      }

      setIsModalOpen(false);
      form.resetFields();
      setEditingPackage(null);
    } catch (error: any) {
      message.error(error?.data?.message || "Có lỗi xảy ra");
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const columns = [
    {
      title: "Tên gói",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: WarrantyPackage) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-sm text-gray-500">{record.description}</div>
        </div>
      ),
    },
    {
      title: "Thời hạn",
      dataIndex: "durationMonths",
      key: "durationMonths",
      render: (months: number) => (
        <div className="flex items-center gap-1">
          <CalendarOutlined className="text-blue-500" />
          <span>{months} tháng</span>
        </div>
      ),
    },
    {
      title: "Giá",
      dataIndex: "price",
      key: "price",
      render: (price: number) => (
        <div className="flex items-center gap-1">
          <DollarOutlined className="text-green-500" />
          <span className={price === 0 ? "text-green-600 font-medium" : ""}>
            {price === 0 ? "Miễn phí" : formatPrice(price)}
          </span>
        </div>
      ),
    },
    {
      title: "Quyền lợi",
      dataIndex: "coverage",
      key: "coverage",
      render: (coverage: string[]) => (
        <div>
          {coverage?.slice(0, 2).map((item, index) => (
            <div key={index} className="flex items-center gap-1 text-sm">
              <CheckCircleOutlined className="text-green-500" />
              <span>{item}</span>
            </div>
          ))}
          {coverage?.length > 2 && (
            <div className="text-sm text-gray-500">
              +{coverage.length - 2} quyền lợi khác
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) => (
        <Tag
          color={isActive ? "green" : "red"}
          icon={isActive ? <CheckCircleOutlined /> : <StopOutlined />}
        >
          {isActive ? "Hoạt động" : "Tạm dừng"}
        </Tag>
      ),
    },
    {
      title: "Thứ tự",
      dataIndex: "sortOrder",
      key: "sortOrder",
      render: (sortOrder: number) => (
        <span className="font-mono">{sortOrder}</span>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_: unknown, record: WarrantyPackage) => (
        <Space>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="primary"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa gói bảo hành này?"
              onConfirm={() => handleDelete(record.id)}
              okText="Xóa"
              cancelText="Hủy"
            >
              <Button
                type="primary"
                danger
                icon={<DeleteOutlined />}
                size="small"
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    <SafetyOutlined className="text-blue-500" />
                    Quản lý gói bảo hành
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Tạo và quản lý các gói bảo hành cho sản phẩm
                  </p>
                </div>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreate}
                  size="large"
                >
                  Tạo gói bảo hành
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={warrantyPackages}
          rowKey="id"
          loading={isLoading}
          pagination={{
            total: warrantyPackagesData?.data?.pagination?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} gói bảo hành`,
          }}
        />
      </Card>

      <Modal
        title={
          editingPackage ? "Chỉnh sửa gói bảo hành" : "Tạo gói bảo hành mới"
        }
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setEditingPackage(null);
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Tên gói bảo hành"
                rules={[
                  { required: true, message: "Vui lòng nhập tên gói bảo hành" },
                ]}
              >
                <Input placeholder="Ví dụ: Bảo hành mở rộng 12 tháng" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="durationMonths"
                label="Thời hạn (tháng)"
                rules={[{ required: true, message: "Vui lòng nhập thời hạn" }]}
              >
                <InputNumber
                  min={1}
                  max={120}
                  placeholder="12"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Mô tả"
            rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
          >
            <TextArea rows={2} placeholder="Mô tả ngắn gọn về gói bảo hành" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="price"
                label="Giá (VND)"
                rules={[{ required: true, message: "Vui lòng nhập giá" }]}
              >
                <InputNumber<number>
                  min={0}
                  placeholder="0"
                  style={{ width: "100%" }}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => Number(value?.replace(/\$\s?|(,*)/g, "") ?? 0)}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="sortOrder"
                label="Thứ tự hiển thị"
                rules={[{ required: true, message: "Vui lòng nhập thứ tự" }]}
              >
                <InputNumber
                  min={0}
                  placeholder="0"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="coverage"
            label="Quyền lợi bảo hành"
            rules={[{ required: true, message: "Vui lòng nhập quyền lợi" }]}
          >
            <TextArea
              rows={4}
              placeholder="Mỗi dòng là một quyền lợi. Ví dụ:&#10;Sửa chữa lỗi phần cứng&#10;Thay thế linh kiện lỗi&#10;Hỗ trợ kỹ thuật 24/7"
            />
          </Form.Item>

          <Form.Item name="isActive" label="Trạng thái" valuePropName="checked">
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Tạm dừng" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={isCreating || isUpdating}
              >
                {editingPackage ? "Cập nhật" : "Tạo mới"}
              </Button>
              <Button
                onClick={() => {
                  setIsModalOpen(false);
                  form.resetFields();
                  setEditingPackage(null);
                }}
              >
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WarrantyPackagesPage;
