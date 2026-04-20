import React, { useEffect } from "react";
import {
  Form,
  Card,
  Typography,
  Checkbox,
  Row,
  Col,
  Alert,
  Space,
  Spin,
} from "antd";
import {
  SafetyOutlined,
  CheckCircleOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { useGetWarrantyPackagesQuery } from "@/services/warrantyApi";
import { WarrantyPackage } from "@/types/product.types";

const { Title, Text } = Typography;

interface ProductWarrantyFormProps {
  form?: any; // Optional form instance passed from parent
}

const ProductWarrantyForm: React.FC<ProductWarrantyFormProps> = ({
  form: parentForm,
}) => {
  const {
    data: warrantyData,
    isLoading,
    error,
  } = useGetWarrantyPackagesQuery({
    isActive: true,
  });

  const warrantyPackages = warrantyData?.data?.warrantyPackages || [];

  // Auto-select free warranty packages
  useEffect(() => {
    if (warrantyPackages.length > 0 && parentForm) {
      const currentValue = parentForm.getFieldValue("warrantyPackageIds") || [];
      const freePackageIds = warrantyPackages
        .filter((pkg) => pkg.price === 0)
        .map((pkg) => pkg.id);

      // Only update if current value doesn't already include free packages
      const needsUpdate = freePackageIds.some(
        (id) => !currentValue.includes(id)
      );
      if (needsUpdate) {
        const newValue = Array.from(
          new Set([...currentValue, ...freePackageIds])
        );
        parentForm.setFieldValue("warrantyPackageIds", newValue);
        //console.log('Auto-selected free warranty packages:', freePackageIds);
      }
    }
  }, [warrantyPackages, parentForm]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDuration = (months: number) => {
    if (months === 0) return "Theo sản phẩm";
    if (months < 12) return `${months} tháng`;
    if (months === 12) return "1 năm";
    return `${Math.floor(months / 12)} năm ${months % 12 > 0 ? `${months % 12} tháng` : ""}`;
  };

  if (isLoading) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Đang tải gói bảo hành...</div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Alert
          message="Lỗi tải dữ liệu"
          description="Không thể tải danh sách gói bảo hành. Vui lòng thử lại sau."
          type="error"
          showIcon
        />
      </Card>
    );
  }

  return (
    <Card>
      <Title level={4}>
        <SafetyOutlined /> Gói bảo hành
      </Title>

      <Alert
        message="Thông tin bảo hành"
        description="Khách hàng có thể chọn nhiều gói bảo hành để tăng cường bảo vệ sản phẩm"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {warrantyPackages.length === 0 ? (
        <Alert
          message="Chưa có gói bảo hành"
          description="Hiện tại chưa có gói bảo hành nào được cấu hình. Vui lòng liên hệ quản trị viên để thêm gói bảo hành."
          type="warning"
          showIcon
        />
      ) : (
        <Form.Item name="warrantyPackageIds" label="Chọn gói bảo hành">
          <Checkbox.Group style={{ width: "100%" }}>
            <Row gutter={[16, 16]}>
              {warrantyPackages.map((pkg: WarrantyPackage) => (
                <Col span={12} key={pkg.id}>
                  <Card
                    size="small"
                    hoverable
                    style={{
                      border:
                        pkg.price === 0
                          ? "2px solid #1890ff"
                          : "1px solid #d9d9d9",
                      backgroundColor: pkg.price === 0 ? "#f0f9ff" : "white",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                      }}
                    >
                      <Checkbox value={pkg.id} style={{ marginTop: 4 }} />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Text strong>{pkg.name}</Text>
                          <Text type="success" strong>
                            {pkg.price === 0
                              ? "Miễn phí"
                              : formatPrice(pkg.price)}
                          </Text>
                        </div>

                        <div style={{ marginBottom: 8 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Thời hạn: {formatDuration(pkg.durationMonths)}
                          </Text>
                        </div>

                        {pkg.description && (
                          <Text
                            type="secondary"
                            style={{ display: "block", marginBottom: 8 }}
                          >
                            {pkg.description}
                          </Text>
                        )}

                        {pkg.coverage && pkg.coverage.length > 0 && (
                          <Space direction="vertical" size={4}>
                            {pkg.coverage.map((coverage, index) => (
                              <div
                                key={index}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                <CheckCircleOutlined
                                  style={{ color: "#52c41a", fontSize: 12 }}
                                />
                                <Text style={{ fontSize: 12 }}>{coverage}</Text>
                              </div>
                            ))}
                          </Space>
                        )}
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Checkbox.Group>
        </Form.Item>
      )}

      <Alert
        message="Lưu ý"
        description="Gói bảo hành cơ bản được bao gồm mặc định. Các gói khác là tùy chọn bổ sung."
        type="warning"
        showIcon
        style={{ marginTop: 16 }}
      />
    </Card>
  );
};

export default ProductWarrantyForm;
