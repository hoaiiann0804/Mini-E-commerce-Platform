import React, { useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Switch,
  Tag,
  Space,
  message,
  Tooltip,
  Typography,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  SearchOutlined,
  GiftOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";
import {
  useGetCouponsQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useToggleCouponStatusMutation,
  type Coupon,
  type CouponQueryParams,
} from "@/services/adminCouponApi";

const { Title } = Typography;
const { RangePicker } = DatePicker;

/**
 * Xác định trạng thái hiển thị của coupon
 *
 * TƯ DUY UX: Admin cần nhìn 1 cái là biết coupon còn dùng được không.
 * Không để admin phải tự so sánh ngày tháng trong đầu.
 */
const getCouponStatus = (coupon: Coupon) => {
  const now = new Date();
  if (!coupon.isActive) return { color: "default", text: "Đã tắt" };
  if (new Date(coupon.expiresAt) < now) return { color: "red", text: "Hết hạn" };
  if (new Date(coupon.startDate) > now) return { color: "blue", text: "Chưa bắt đầu" };
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
    return { color: "orange", text: "Hết lượt" };
  return { color: "green", text: "Đang hoạt động" };
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
};

const CouponsPage: React.FC = () => {
  // ---- State ----
  const [queryParams, setQueryParams] = useState<CouponQueryParams>({
    page: 1,
    limit: 10,
    status: "all",
    search: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [form] = Form.useForm();

  // ---- API Hooks ----
  const { data, isLoading, refetch } = useGetCouponsQuery(queryParams);
  const [createCoupon, { isLoading: isCreating }] = useCreateCouponMutation();
  const [updateCoupon, { isLoading: isUpdating }] = useUpdateCouponMutation();
  const [toggleStatus] = useToggleCouponStatusMutation();

  const coupons = data?.data?.coupons || [];
  const pagination = data?.data?.pagination;

  // ---- Handlers ----

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    form.resetFields();
    form.setFieldsValue({
      type: "percentage",
      usagePerUser: 1,
      minOrderAmount: 0,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    form.setFieldsValue({
      ...coupon,
      dateRange: [dayjs(coupon.startDate), dayjs(coupon.expiresAt)],
      value: parseFloat(String(coupon.value)),
      minOrderAmount: parseFloat(String(coupon.minOrderAmount)),
      maxDiscount: coupon.maxDiscount ? parseFloat(String(coupon.maxDiscount)) : undefined,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const [startDate, expiresAt] = values.dateRange;

      const payload = {
        code: values.code,
        description: values.description,
        type: values.type,
        value: values.value,
        minOrderAmount: values.minOrderAmount || 0,
        maxDiscount: values.type === "percentage" ? values.maxDiscount : null,
        usageLimit: values.usageLimit || null,
        usagePerUser: values.usagePerUser || 1,
        startDate: startDate.toISOString(),
        expiresAt: expiresAt.toISOString(),
      };

      if (editingCoupon) {
        await updateCoupon({ id: editingCoupon.id, data: payload }).unwrap();
        message.success("Cập nhật coupon thành công");
      } else {
        await createCoupon(payload).unwrap();
        message.success("Tạo coupon thành công");
      }

      setIsModalOpen(false);
      form.resetFields();
    } catch (error: any) {
      if (error?.data?.message) {
        message.error(error.data.message);
      }
    }
  };

  const handleToggle = async (coupon: Coupon) => {
    try {
      await toggleStatus(coupon.id).unwrap();
      message.success(
        coupon.isActive
          ? `Đã vô hiệu hóa ${coupon.code}`
          : `Đã kích hoạt ${coupon.code}`
      );
    } catch (error: any) {
      message.error(error?.data?.message || "Lỗi khi thay đổi trạng thái");
    }
  };

  // ---- Table Columns ----

  const columns: ColumnsType<Coupon> = [
    {
      title: "Mã",
      dataIndex: "code",
      key: "code",
      width: 150,
      render: (code: string) => (
        <span style={{ fontFamily: "monospace", fontWeight: 600, fontSize: 14 }}>
          {code}
        </span>
      ),
    },
    {
      title: "Loại & Giá trị",
      key: "typeValue",
      width: 180,
      render: (_: unknown, record: Coupon) => (
        <div>
          <Tag color={record.type === "percentage" ? "purple" : "blue"}>
            {record.type === "percentage" ? "Phần trăm" : "Cố định"}
          </Tag>
          <div style={{ marginTop: 4, fontWeight: 600 }}>
            {record.type === "percentage"
              ? `${parseFloat(String(record.value))}%`
              : formatCurrency(parseFloat(String(record.value)))}
            {record.maxDiscount && (
              <span style={{ fontSize: 12, color: "#888", marginLeft: 4 }}>
                (max {formatCurrency(parseFloat(String(record.maxDiscount)))})
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Đơn tối thiểu",
      dataIndex: "minOrderAmount",
      key: "minOrderAmount",
      width: 130,
      render: (val: number) =>
        parseFloat(String(val)) > 0 ? formatCurrency(parseFloat(String(val))) : "—",
    },
    {
      title: "Sử dụng",
      key: "usage",
      width: 110,
      render: (_: unknown, record: Coupon) => (
        <div>
          <span style={{ fontWeight: 600 }}>{record.usedCount}</span>
          <span style={{ color: "#888" }}>
            {" / "}
            {record.usageLimit !== null ? record.usageLimit : "∞"}
          </span>
          <div style={{ fontSize: 12, color: "#888" }}>
            {record.usagePerUser} lần/user
          </div>
        </div>
      ),
    },
    {
      title: "Thời gian",
      key: "dates",
      width: 200,
      render: (_: unknown, record: Coupon) => (
        <div style={{ fontSize: 12 }}>
          <div>Từ: {dayjs(record.startDate).format("DD/MM/YYYY HH:mm")}</div>
          <div>Đến: {dayjs(record.expiresAt).format("DD/MM/YYYY HH:mm")}</div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 130,
      render: (_: unknown, record: Coupon) => {
        const status = getCouponStatus(record);
        return <Tag color={status.color}>{status.text}</Tag>;
      },
    },
    {
      title: "Hành động",
      key: "actions",
      width: 150,
      render: (_: unknown, record: Coupon) => (
        <Space>
          <Tooltip title="Sửa">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleOpenEdit(record)}
            />
          </Tooltip>
          <Tooltip title={record.isActive ? "Tắt" : "Bật"}>
            <Switch
              checked={record.isActive}
              onChange={() => handleToggle(record)}
              size="small"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // ---- Watched form type ----
  const couponType = Form.useWatch("type", form);

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          <GiftOutlined style={{ marginRight: 8 }} />
          Quản lý Mã giảm giá
        </Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Làm mới
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
            Tạo Coupon
          </Button>
        </Space>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: 16, display: "flex", gap: 12 }}>
        <Input
          placeholder="Tìm theo mã hoặc mô tả..."
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
          value={queryParams.search}
          onChange={(e) =>
            setQueryParams({ ...queryParams, search: e.target.value, page: 1 })
          }
          allowClear
        />
        <Select
          value={queryParams.status}
          onChange={(val) =>
            setQueryParams({ ...queryParams, status: val, page: 1 })
          }
          style={{ width: 180 }}
          options={[
            { value: "all", label: "Tất cả" },
            { value: "active", label: "Đang hoạt động" },
            { value: "expired", label: "Hết hạn/Hết lượt" },
            { value: "disabled", label: "Đã tắt" },
          ]}
        />
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={coupons}
        loading={isLoading}
        rowKey="id"
        pagination={{
          current: pagination?.currentPage || 1,
          total: pagination?.totalItems || 0,
          pageSize: pagination?.itemsPerPage || 10,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} coupon`,
          onChange: (page, pageSize) =>
            setQueryParams({ ...queryParams, page, limit: pageSize }),
        }}
        scroll={{ x: 1050 }}
      />

      {/* Create/Edit Modal */}
      <Modal
        title={editingCoupon ? `Sửa coupon: ${editingCoupon.code}` : "Tạo Coupon mới"}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        confirmLoading={isCreating || isUpdating}
        okText={editingCoupon ? "Cập nhật" : "Tạo"}
        cancelText="Hủy"
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          {/* Code — chỉ cho nhập khi tạo mới */}
          <Form.Item
            name="code"
            label="Mã Coupon"
            rules={[
              { required: true, message: "Vui lòng nhập mã coupon" },
              { min: 3, message: "Tối thiểu 3 ký tự" },
              { max: 50, message: "Tối đa 50 ký tự" },
            ]}
            tooltip="Mã sẽ được tự động chuyển thành chữ IN HOA"
          >
            <Input
              placeholder="VD: FIRSTBUY10"
              disabled={!!editingCoupon}
              style={{ textTransform: "uppercase", fontFamily: "monospace" }}
            />
          </Form.Item>

          <Form.Item name="description" label="Mô tả (nội bộ)">
            <Input.TextArea placeholder="VD: Giảm giá cho khách hàng mới" rows={2} />
          </Form.Item>

          {/* Type + Value */}
          <div style={{ display: "flex", gap: 16 }}>
            <Form.Item
              name="type"
              label="Loại giảm giá"
              rules={[{ required: true }]}
              style={{ flex: 1 }}
            >
              <Select
                options={[
                  { value: "percentage", label: "Phần trăm (%)" },
                  { value: "fixed", label: "Số tiền cố định (VND)" },
                ]}
              />
            </Form.Item>

            <Form.Item
              name="value"
              label={couponType === "percentage" ? "Giá trị (%)" : "Giá trị (VND)"}
              rules={[
                { required: true, message: "Vui lòng nhập giá trị" },
                {
                  type: "number",
                  min: 0.01,
                  message: "Phải lớn hơn 0",
                },
                ...(couponType === "percentage"
                  ? [{ type: "number" as const, max: 100, message: "Không vượt quá 100%" }]
                  : []),
              ]}
              style={{ flex: 1 }}
            >
              <InputNumber
                style={{ width: "100%" }}
                formatter={(value) =>
                  couponType === "fixed"
                    ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    : `${value}`
                }
                placeholder={couponType === "percentage" ? "VD: 10" : "VD: 500000"}
              />
            </Form.Item>
          </div>

          {/* Min order + Max discount */}
          <div style={{ display: "flex", gap: 16 }}>
            <Form.Item
              name="minOrderAmount"
              label="Đơn tối thiểu (VND)"
              style={{ flex: 1 }}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                placeholder="0 = không giới hạn"
              />
            </Form.Item>

            {couponType === "percentage" && (
              <Form.Item
                name="maxDiscount"
                label="Giảm tối đa (VND)"
                style={{ flex: 1 }}
                tooltip="Cap trần: VD giảm 50% nhưng max 1 triệu"
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  placeholder="Để trống = không giới hạn"
                />
              </Form.Item>
            )}
          </div>

          {/* Usage limits */}
          <div style={{ display: "flex", gap: 16 }}>
            <Form.Item
              name="usageLimit"
              label="Tổng lượt (toàn hệ thống)"
              style={{ flex: 1 }}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={1}
                placeholder="Để trống = không giới hạn"
              />
            </Form.Item>

            <Form.Item
              name="usagePerUser"
              label="Lượt/user"
              rules={[{ required: true, message: "Bắt buộc" }]}
              style={{ flex: 1 }}
            >
              <InputNumber style={{ width: "100%" }} min={1} placeholder="1" />
            </Form.Item>
          </div>

          {/* Date range */}
          <Form.Item
            name="dateRange"
            label="Thời gian hiệu lực"
            rules={[{ required: true, message: "Vui lòng chọn thời gian" }]}
          >
            <RangePicker
              showTime
              format="DD/MM/YYYY HH:mm"
              style={{ width: "100%" }}
              placeholder={["Bắt đầu", "Kết thúc"]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CouponsPage;
