import React, { useState, useEffect } from "react";
import { Modal, Form, Input, InputNumber, Select, Button, Space } from "antd";
import { SaveOutlined, CloseOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

interface Attribute {
  id: string;
  name: string;
  value: string;
}

interface Variant {
  id?: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  stock?: number;
  stockQuantity: number;
  sku?: string;
  attributes: Record<string, string>;
  specifications?: Record<string, any>;
  value?: string;
}

interface VariantModalProps {
  visible: boolean;
  onClose: () => void;
  variant?: Variant | null;
  onSave: (variant: Variant) => void;
  attributes: Attribute[];
}

const VariantModal: React.FC<VariantModalProps> = ({
  visible,
  onClose,
  variant,
  onSave,
  attributes,
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  useEffect(() => {
    if (variant) {
      form.setFieldsValue({
        name: variant.name || "",
        price: variant.price || 0,
        stock: variant.stock || 0,
        sku: variant.sku || "",
        ...variant.attributes,
      });
    } else {
      form.resetFields();
    }
  }, [variant, form, visible]);

  const handleSubmit = (values: any) => {
    const { name, price, stock, sku, ...attributeValues } = values;

    // Lọc ra các thuộc tính có giá trị (không null/undefined)
    const filteredAttributes: Record<string, string> = {};
    Object.keys(attributeValues).forEach((key) => {
      if (
        attributeValues[key] !== undefined &&
        attributeValues[key] !== null &&
        attributeValues[key] !== ""
      ) {
        filteredAttributes[key] = attributeValues[key];
      }
    });

    const variantData: Variant = {
      id: variant?.id,
      name: name.trim(),
      price: price || 0,
      stock: stock || 0,
      stockQuantity: stock || 0,
      sku: sku ? sku.trim() : undefined,
      attributes: filteredAttributes,
    };

    //console.log('Saving variant:', variantData);
    onSave(variantData);
    handleClose();
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={
        variant
          ? t("admin.products.variantModal.titleEdit")
          : t("admin.products.variantModal.titleCreate")
      }
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={800}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          name: "",
          price: 0,
          stock: 0,
          sku: "",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}
        >
          <Form.Item
            label={t("admin.products.variantModal.fields.name")}
            name="name"
            rules={[
              {
                required: true,
                message: t("admin.products.variantModal.validation.nameRequired"),
              },
            ]}
          >
            <Input placeholder={t("admin.products.variantModal.placeholders.name")} />
          </Form.Item>

          <Form.Item
            label={t("admin.products.variantModal.fields.sku")}
            name="sku"
            tooltip={t("admin.products.variantModal.tooltips.sku")}
          >
            <Input placeholder={t("admin.products.variantModal.placeholders.sku")} />
          </Form.Item>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}
        >
          <Form.Item
            label={t("admin.products.variantModal.fields.price")}
            name="price"
            rules={[
              {
                required: true,
                message: t("admin.products.variantModal.validation.priceRequired"),
              },
              {
                type: "number",
                min: 0,
                message: t("admin.products.variantModal.validation.priceMin"),
              },
            ]}
          >
            <InputNumber<number>
              placeholder={t("admin.products.variantModal.placeholders.price")}
              min={0}
              step={1000}
              style={{ width: "100%" }}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) =>
                Number((value ?? "").replace(/\$\s?|(,*)/g, "")) || 0
              }
              addonAfter="₫"
            />
          </Form.Item>

          <Form.Item
            label={t("admin.products.variantModal.fields.stock")}
            name="stock"
            rules={[
              {
                required: true,
                message: t("admin.products.variantModal.validation.stockRequired"),
              },
              {
                type: "number",
                min: 0,
                message: t("admin.products.variantModal.validation.stockMin"),
              },
            ]}
          >
            <InputNumber
              placeholder={t("admin.products.variantModal.placeholders.stock")}
              min={0}
              style={{ width: "100%" }}
              addonAfter="sp"
            />
          </Form.Item>
        </div>

        {/* Thuộc tính biến thể */}
        {attributes.length > 0 && (
          <div
            style={{
              borderTop: "1px solid #f0f0f0",
              paddingTop: "16px",
              marginTop: "16px",
            }}
          >
            <h3 style={{ marginBottom: "16px" }}>
              {t("admin.products.variantModal.sections.attributes")}
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              {attributes.map((attr) => {
                // Kiểm tra attr.value có tồn tại không trước khi gọi split
                const values = attr.value
                  ? attr.value
                      .split(",")
                      .map((v) => v.trim())
                      .filter((v) => v)
                  : [];
                return (
                  <Form.Item key={attr.id} label={attr.name} name={attr.name}>
                    <Select
                      placeholder={t(
                        "admin.products.variantModal.placeholders.attributeSelect",
                        { name: attr.name }
                      )}
                      allowClear
                    >
                      {values.map((value) => (
                        <Select.Option key={value} value={value}>
                          {value}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                );
              })}
            </div>
          </div>
        )}

        {/* Submit buttons */}
        <div style={{ textAlign: "right", marginTop: "24px" }}>
          <Space>
            <Button onClick={handleClose} icon={<CloseOutlined />}>
              {t("common.cancel")}
            </Button>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
              {variant
                ? t("admin.products.variantModal.actions.update")
                : t("admin.products.variantModal.actions.create")}
            </Button>
          </Space>
        </div>
      </Form>
    </Modal>
  );
};

export default VariantModal;
