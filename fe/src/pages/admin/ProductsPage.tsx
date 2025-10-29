import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  useGetAdminProductsQuery,
  useDeleteProductMutation,
} from "@/services/adminProductApi";
import { useGetAllCategoriesQuery } from "@/services/categoryApi";
import { calculatePriceRange } from "@/utils/priceUtils";
import {
  Table,
  Button,
  Input,
  Select,
  Modal,
  Card,
  Space,
  Tag,
  Pagination,
  Row,
  Col,
  Typography,
  Image,
  Popconfirm,
  message,
  Spin,
  Alert,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

// Status options
const statusOptions = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "active", label: "Hoạt động" },
  { value: "inactive", label: "Không hoạt động" },
  { value: "draft", label: "Bản nháp" },
];

const ProductsPage: React.FC = () => {
  const navigate = useNavigate();

  // State for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  // State for modals
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  // Fetch categories from API
  const { data: categoriesResponse, isLoading: isCategoriesLoading } =
    useGetAllCategoriesQuery();

  // API queries and mutations
  const {
    data: productsResponse,
    error,
    isLoading,
    refetch,
  } = useGetAdminProductsQuery({
    page: currentPage,
    limit: 10,
    search: searchTerm || undefined,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    sortBy,
    sortOrder,
  });

  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();

  // Xử lý dữ liệu sản phẩm từ API
  const products = productsResponse?.data?.products || [];
  const pagination = productsResponse?.data?.pagination;

  // Xử lý dữ liệu danh mục từ API
  const apiCategories = categoriesResponse?.data || [];

  // Tạo options cho dropdown danh mục
  const categoryOptions = [
    { value: "all", label: "Tất cả danh mục" },
    ...(Array.isArray(apiCategories)
      ? apiCategories.map((cat: any) => ({
          value: cat.id,
          label: cat.name,
        }))
      : []),
  ];

  // Log dữ liệu sản phẩm để debug
  useEffect(() => {
    if (products.length > 0) {
      console.log("Products data:", products);
      // Kiểm tra xem sản phẩm có biến thể không
      const hasVariants = products.some(
        (product) => product.variants && product.variants.length > 0
      );
      console.log("Products have variants:", hasVariants);
      if (hasVariants) {
        // Log sản phẩm đầu tiên có biến thể
        const productWithVariants = products.find(
          (product) => product.variants && product.variants.length > 0
        );
        console.log("Example product with variants:", productWithVariants);
      }
    }
  }, [products]);

  // Log dữ liệu danh mục để debug
  useEffect(() => {
    if (apiCategories.length > 0) {
      console.log("Categories data:", apiCategories);
    }
  }, [apiCategories]);

  // Handle delete product
  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteProduct(productId).unwrap();
      message.success("Xóa sản phẩm thành công");
      refetch();
    } catch (error) {
      message.error("Xóa sản phẩm thất bại");
      console.error("Failed to delete product:", error);
    }
  };

  // Open quick view modal
  const openQuickView = (product: any) => {
    setSelectedProduct(product);
    setIsQuickViewOpen(true);
  };

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, categoryFilter, statusFilter]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Calculate lowest price from variants or base price
  const calculateDisplayPrice = (product: any) => {
    // Nếu sản phẩm có variants, hiển thị giá thấp nhất
    if (product.variants && product.variants.length > 0) {
      const prices = product.variants.map((variant: any) =>
        parseFloat(variant.price)
      );
      const minPrice = Math.min(...prices);

      // Chỉ hiển thị giá thấp nhất (không hiển thị range)
      return formatCurrency(minPrice);
    }

    // Nếu không có variants, dùng giá cơ bản
    return formatCurrency(product.price);
  };

  // Get status tag color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "green";
      case "inactive":
        return "orange";
      case "draft":
        return "red";
      default:
        return "default";
    }
  };

  // Table columns
  const columns = [
    {
      title: "Hình ảnh",
      dataIndex: "images",
      key: "images",
      width: 80,
      render: (images: string[]) => (
        <Image
          width={50}
          height={50}
          src={images?.[0] || "/placeholder-image.jpg"}
          alt="Product"
          style={{ objectFit: "cover", borderRadius: 4 }}
          fallback="/placeholder-image.jpg"
        />
      ),
    },
    {
      title: "Tên sản phẩm",
      dataIndex: "name",
      key: "name",
      sorter: true,
      render: (text: string) => (
        <div style={{ maxWidth: 200 }}>
          <div style={{ fontWeight: 500 }}>{text}</div>
        </div>
      ),
    },
    {
      title: "Danh mục",
      dataIndex: "categories",
      key: "categories",
      render: (categories: any[]) => (
        <>
          {categories && categories.length > 0 ? (
            categories.map((cat, index) => (
              <Tag color="blue" key={index}>
                {cat.name}
              </Tag>
            ))
          ) : (
            <span>-</span>
          )}
        </>
      ),
    },
    {
      title: "Giá",
      dataIndex: "price",
      key: "price",
      sorter: true,
      render: (price: number, record: any) => (
        <span style={{ fontWeight: 500, color: "#52c41a" }}>
          {calculateDisplayPrice(record)}
        </span>
      ),
    },
    {
      title: "Kho",
      dataIndex: "stockQuantity",
      key: "stock",
      sorter: true,
      render: (stockQuantity: number, record: any) => {
        // Sử dụng stockQuantity từ API hoặc fallback về stock nếu có
        const stock =
          stockQuantity !== undefined ? stockQuantity : record.stock;
        return (
          <span style={{ color: stock > 0 ? "#52c41a" : "#ff4d4f" }}>
            {stock}
          </span>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {statusOptions.find((s) => s.value === status)?.label || status}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      width: 150,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => openQuickView(record)}
            title="Xem chi tiết"
            size="small"
          />
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              console.log("Edit button clicked, record.id:", record.id);
              navigate(`/admin/products/edit/${record.id}`);
            }}
            title="Chỉnh sửa"
            size="small"
          />
          <Popconfirm
            title="Xóa sản phẩm"
            description="Bạn có chắc chắn muốn xóa sản phẩm này?"
            onConfirm={() => handleDeleteProduct(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              title="Xóa"
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Handle table change (sorting, pagination)
  const handleTableChange = (
    paginationInfo: any,
    filters: any,
    sorter: any
  ) => {
    if (sorter.field) {
      setSortBy(sorter.field);
      setSortOrder(sorter.order === "ascend" ? "ASC" : "DESC");
    }
  };

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="Lỗi tải dữ liệu"
          description="Không thể tải danh sách sản phẩm. Vui lòng thử lại."
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => refetch()}>
              Thử lại
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 md:p-6">
      {/* Header */}
      <Card className="mb-4 md:mb-6">
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Title
              level={2}
              style={{ margin: 0 }}
              className="text-xl md:text-2xl"
            >
              Quản lý sản phẩm
            </Title>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              {pagination?.totalItems
                ? `${pagination.totalItems} sản phẩm • ${pagination.totalPages} trang`
                : "Quản lý danh sách sản phẩm của bạn"}
            </p>
          </Col>
          <Col xs={24} sm={12} className="flex justify-start sm:justify-end">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate("/admin/products/create")}
              size="large"
            >
              Thêm sản phẩm
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Filters */}
      <Card className="mb-4 md:mb-6">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={10} lg={8}>
            <Input
              placeholder="Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
              suffix={<SearchOutlined style={{ color: "rgba(0,0,0,.45)" }} />}
            />
          </Col>
          <Col xs={12} md={7} lg={4}>
            <Select
              style={{ width: "100%" }}
              placeholder="Danh mục"
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={categoryOptions}
              loading={isCategoriesLoading}
            />
          </Col>
          <Col xs={12} md={7} lg={4}>
            <Select
              style={{ width: "100%" }}
              placeholder="Trạng thái"
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
            />
          </Col>
        </Row>
      </Card>

      {/* Products Table */}
      <Card>
        <Spin spinning={isLoading}>
          <div className="overflow-x-auto">
            <Table
              columns={columns}
              dataSource={products}
              rowKey="id"
              pagination={false}
              onChange={handleTableChange}
              scroll={{ x: 800 }}
              className="min-w-full dark-table-fixed-columns"
            />
          </div>
        </Spin>

        {/* Pagination */}
        {pagination && (
          <div className="mt-4 text-center">
            <Pagination
              current={currentPage}
              total={pagination.totalItems}
              pageSize={pagination.limit}
              onChange={setCurrentPage}
              showSizeChanger={false}
              showQuickJumper
              responsive
              showTotal={(total, range) =>
                `${range[0]}-${range[1]} của ${total} sản phẩm`
              }
            />
          </div>
        )}
      </Card>

      {/* Quick View Modal */}
      <Modal
        title="Chi tiết sản phẩm"
        open={isQuickViewOpen}
        onCancel={() => setIsQuickViewOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsQuickViewOpen(false)}>
            Đóng
          </Button>,
          <Button
            key="edit"
            type="primary"
            onClick={() => {
              setIsQuickViewOpen(false);
              navigate(`/admin/products/edit/${selectedProduct?.id}`);
            }}
          >
            Chỉnh sửa
          </Button>,
        ]}
        width={600}
      >
        {selectedProduct && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Image
                  width="100%"
                  src={selectedProduct.images?.[0] || "/placeholder-image.jpg"}
                  alt={selectedProduct.name}
                  fallback="/placeholder-image.jpg"
                />
              </Col>
              <Col span={16}>
                <Space
                  direction="vertical"
                  size="middle"
                  style={{ width: "100%" }}
                >
                  <div>
                    <strong>Tên sản phẩm:</strong> {selectedProduct.name}
                  </div>
                  <div>
                    <strong>Danh mục:</strong>{" "}
                    {selectedProduct.categories &&
                    selectedProduct.categories.length > 0 ? (
                      selectedProduct.categories.map(
                        (cat: any, index: number) => (
                          <Tag color="blue" key={index}>
                            {cat.name}
                          </Tag>
                        )
                      )
                    ) : (
                      <span>-</span>
                    )}
                  </div>
                  <div>
                    <strong>Giá:</strong>{" "}
                    <span style={{ fontWeight: 500, color: "#52c41a" }}>
                      {
                        calculatePriceRange(
                          selectedProduct.price,
                          selectedProduct.variants
                        ).priceText
                      }
                    </span>
                  </div>
                  <div>
                    <strong>Kho:</strong>{" "}
                    <span
                      style={{
                        color:
                          (selectedProduct.stockQuantity ||
                            selectedProduct.stock) > 0
                            ? "#52c41a"
                            : "#ff4d4f",
                      }}
                    >
                      {selectedProduct.stockQuantity !== undefined
                        ? selectedProduct.stockQuantity
                        : selectedProduct.stock}
                    </span>
                  </div>
                  <div>
                    <strong>Trạng thái:</strong>{" "}
                    <Tag color={getStatusColor(selectedProduct.status)}>
                      {statusOptions.find(
                        (s) => s.value === selectedProduct.status
                      )?.label || selectedProduct.status}
                    </Tag>
                  </div>
                  {selectedProduct.description && (
                    <div>
                      <strong>Mô tả:</strong>
                      <p style={{ marginTop: 8 }}>
                        {selectedProduct.description}
                      </p>
                    </div>
                  )}
                </Space>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductsPage;
