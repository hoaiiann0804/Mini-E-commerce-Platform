import { useRef, useState } from "react";
import { Alert, Button, Card, Col, DatePicker, Form, Input, InputNumber, Modal, Row, Select, Space, Statistic, Switch, Table, Tag, Tabs, Typography, message } from "antd";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useGetInventoryStockQuery, useGetInventoryHistoryQuery, useGetInventoryStatsQuery, useCreateInventoryMovementMutation, StockRow, InventoryEntry, InventoryInput } from "@/services/inventoryApi";

const labels: Record<string, string> = { OPENING: "Đầu kỳ", IN: "Nhập hàng", OUT: "Trừ theo đơn", RELEASE: "Hoàn do hủy/hết hạn", RETURN: "Khách trả hàng", ADJUSTMENT: "Điều chỉnh" };
type MovementForm = { type: InventoryInput["type"]; quantityChange: number; reason: string; unitCost?: number; orderItemId?: string };
export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [lowStock, setLowStock] = useState(false);
  const [page, setPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [type, setType] = useState<string>();
  const [dates, setDates] = useState<{ from?: string; to?: string }>({});
  const [selected, setSelected] = useState<StockRow | null>(null);
  const [form] = Form.useForm<MovementForm>();
  const movementType = Form.useWatch("type", form);
  const pending = useRef<{ fingerprint: string; key: string }>();
  const stock = useGetInventoryStockQuery({ page, search, lowStock }, { pollingInterval: 30000, refetchOnFocus: true });
  const history = useGetInventoryHistoryQuery({ page: historyPage, search, type, ...dates }, { pollingInterval: 30000 });
  const stats = useGetInventoryStatsQuery(dates, { pollingInterval: 30000 });
  const [createMovement, mutation] = useCreateInventoryMovementMutation();
  const open = (row: StockRow) => { setSelected(row); pending.current = undefined; form.resetFields(); form.setFieldsValue({ type: "IN", quantityChange: 1 }); };
  const submit = async (values: MovementForm) => {
    if (!selected) return;
    const payload = { productId: selected.productId, variantId: selected.variantId, type: values.type, quantityChange: values.quantityChange,
      reason: values.reason.trim(), ...(values.type === "IN" ? { unitCost: values.unitCost } : {}),
      ...(values.type === "RETURN" ? { orderItemId: values.orderItemId?.trim() } : {}) };
    const fingerprint = JSON.stringify(payload);
    // Keep the key after a network failure: retrying the same form must not apply twice.
    if (pending.current?.fingerprint !== fingerprint) pending.current = { fingerprint, key: crypto.randomUUID() };
    try {
      await createMovement({ ...payload, requestKey: pending.current.key }).unwrap();
      message.success("Đã cập nhật kho và ghi lịch sử"); setSelected(null); pending.current = undefined;
    } catch (error) {
      message.error((error as { data?: { message?: string } })?.data?.message || "Không thể cập nhật. Bạn có thể thử lại cùng nội dung.");
    }
  };
  const stockColumns = [
    { title: "Hàng hóa / SKU", key: "name", render: (_: unknown, row: StockRow) => <><Typography.Text strong>{row.name}</Typography.Text><br /><Typography.Text type="secondary">{row.sku || "Chưa có SKU"}</Typography.Text>{!row.isAvailable && <Tag>Ngừng bán</Tag>}</> },
    { title: "Có thể bán", dataIndex: "stockQuantity", key: "stock", render: (value: number) => <Tag color={value <= 5 ? "red" : "green"}>{value === 0 ? "Hết hàng" : value <= 5 ? `${value} — Tồn thấp` : value}</Tag> },
    { title: "Thao tác", key: "actions", render: (_: unknown, row: StockRow) => <Button onClick={() => open(row)}>Nhập / điều chỉnh / trả</Button> },
  ];
  const historyColumns = [
    { title: "Thời điểm", dataIndex: "createdAt", key: "time", render: (v: string) => new Date(v).toLocaleString("vi-VN") },
    { title: "Hàng hóa", key: "product", render: (_: unknown, row: InventoryEntry) => <>{row.productName}<br /><Typography.Text type="secondary">{row.sku}</Typography.Text></> },
    { title: "Loại", dataIndex: "type", key: "type", render: (v: string) => <Tag>{labels[v] || v}</Tag> },
    { title: "+/−", dataIndex: "quantityChange", key: "change", render: (v: number) => <Typography.Text type={v < 0 ? "danger" : "success"}>{v > 0 ? "+" : ""}{v}</Typography.Text> },
    { title: "Trước → Sau", key: "balance", render: (_: unknown, row: InventoryEntry) => `${row.previousStock} → ${row.newStock}` },
    { title: "Đơn giá nhập", dataIndex: "unitCost", key: "cost", render: (v: string | null) => v === null ? "—" : `${Number(v).toLocaleString("vi-VN")} ₫` },
    { title: "Người thực hiện", dataIndex: "actorName", key: "actor" },
    { title: "Lý do / Chứng từ", key: "reason", render: (_: unknown, row: InventoryEntry) => <>{row.reason}{row.orderId && <><br /><Link to="/admin/orders">Đơn: {row.orderId}</Link><br /><Typography.Text copyable>{row.orderItemId}</Typography.Text></>}</> },
  ];
  return <Space direction="vertical" size="large" style={{ width: "100%" }}>
    <div><Typography.Title level={2}>Tồn kho & lịch sử biến động</Typography.Title><Typography.Paragraph type="secondary">Theo dõi số lượng khả dụng: trừ khi tạo đơn, hoàn khi hủy hoặc hết hạn. Mỗi biến thể được quản lý riêng.</Typography.Paragraph></div>
    <Space wrap><Input.Search allowClear placeholder="Tìm tên hoặc SKU" onSearch={value => { setSearch(value); setPage(1); setHistoryPage(1); }} style={{ width: 300 }} /><Button onClick={() => { stock.refetch(); history.refetch(); stats.refetch(); }}>Làm mới</Button></Space>
    {(stock.isError || history.isError || stats.isError) && <Alert type="error" showIcon message="Không tải được dữ liệu kho" description="Thử làm mới. Nếu lỗi vẫn còn, kiểm tra kết nối và cấu hình máy chủ." />}
    <Row gutter={16}><Col xs={24} md={8}><Card><Statistic title="Hàng hóa theo bộ lọc kho" value={stock.data?.data.total ?? 0} /></Card></Col><Col xs={24} md={8}><Card><Statistic title="Tồn thấp (≤ 5) theo bộ lọc" value={stock.data?.data.lowStock ?? 0} valueStyle={{ color: "#cf1322" }} /></Card></Col><Col xs={24} md={8}><Card><Statistic title="Tổng số lượng theo bộ lọc" value={stock.data?.data.units ?? 0} /></Card></Col></Row>
    <Tabs items={[
      { key: "stock", label: "Kho hiện tại", children: <Space direction="vertical" style={{ width: "100%" }}><Space><Switch checked={lowStock} onChange={value => { setLowStock(value); setPage(1); }} />Chỉ hiện tồn thấp</Space><Table<StockRow> rowKey={r => r.variantId || r.productId} columns={stockColumns} dataSource={stock.data?.data.rows} loading={stock.isFetching} scroll={{ x: 650 }} pagination={{ current: page, pageSize: 20, total: stock.data?.data.total, showSizeChanger: false, onChange: setPage }} /></Space> },
      { key: "history", label: "Lịch sử & biểu đồ", children: <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Space wrap><Select allowClear placeholder="Loại giao dịch" style={{ width: 210 }} value={type} onChange={value => { setType(value); setHistoryPage(1); }} options={Object.entries(labels).map(([value,label]) => ({ value,label }))} /><DatePicker.RangePicker onChange={value => { setDates(value?.[0] && value?.[1] ? { from: value[0].startOf("day").toISOString(), to: value[1].endOf("day").toISOString() } : {}); setHistoryPage(1); }} /></Space>
        <Card title="Biến động toàn kho theo ngày (mặc định 30 ngày; không gồm đầu kỳ)"><ResponsiveContainer width="100%" height={280}><BarChart data={stats.data?.data || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" /><YAxis allowDecimals={false} /><Tooltip /><Legend /><Bar name="Nhập" dataKey="incoming" fill="#389e0d" /><Bar name="Trừ theo đơn" dataKey="outgoing" fill="#cf1322" /><Bar name="Hoàn kho" dataKey="restored" fill="#1677ff" /><Bar name="Điều chỉnh" dataKey="adjustments" fill="#d48806" /></BarChart></ResponsiveContainer></Card>
        <Table<InventoryEntry> rowKey="id" columns={historyColumns} dataSource={history.data?.data.rows} loading={history.isFetching} scroll={{ x: 1250 }} pagination={{ current: historyPage, pageSize: 20, total: history.data?.data.total, showSizeChanger: false, onChange: setHistoryPage }} />
      </Space> },
    ]} />
    <Modal title={selected?.name} open={!!selected} onCancel={() => { if (!mutation.isLoading) setSelected(null); }} footer={null} destroyOnClose maskClosable={!mutation.isLoading} closable={!mutation.isLoading}>
      <Typography.Paragraph>Tồn hiện tại: <strong>{selected?.stockQuantity}</strong>. Số tồn được kiểm tra lại khi lưu.</Typography.Paragraph>
      <Form form={form} layout="vertical" onFinish={submit} preserve={false}>
        <Form.Item name="type" label="Nghiệp vụ" rules={[{ required: true }]}><Select options={["IN","ADJUSTMENT","RETURN"].map(value => ({ value, label: labels[value] }))} /></Form.Item>
        <Form.Item name="quantityChange" label={movementType === "ADJUSTMENT" ? "Chênh lệch (+ tăng, − giảm)" : "Số lượng nhập lại kho"} rules={[{ required: true }, { validator: (_, v) => Number.isInteger(v) && v !== 0 && (movementType === "ADJUSTMENT" || v > 0) ? Promise.resolve() : Promise.reject(new Error("Nhập số nguyên hợp lệ, khác 0")) }]}><InputNumber precision={0} min={movementType === "ADJUSTMENT" ? -2147483647 : 1} max={2147483647} style={{ width: "100%" }} /></Form.Item>
        {movementType === "IN" && <Form.Item name="unitCost" label="Đơn giá nhập (VND / sản phẩm)" rules={[{ required: true }]}><InputNumber min={0} max={999999999999.99} precision={2} style={{ width: "100%" }} /></Form.Item>}
        {movementType === "RETURN" && <><Alert type="info" message="Chỉ nhập lại hàng đã nhận và còn bán được. Hoàn tiền được xử lý riêng." /><Form.Item name="orderItemId" label="Mã dòng hàng của đơn đã giao" rules={[{ required: true }]} extra="Có thể sao chép từ giao dịch trừ kho của đơn trong bảng lịch sử."><Input /></Form.Item></>}
        <Form.Item name="reason" label="Lý do / chứng từ nhập" rules={[{ required: true, whitespace: true }, { min: 3, max: 1000 }]}><Input.TextArea rows={3} maxLength={1000} showCount /></Form.Item>
        <Button type="primary" htmlType="submit" loading={mutation.isLoading} block>Ghi nhận biến động</Button>
      </Form>
    </Modal>
  </Space>;
}
