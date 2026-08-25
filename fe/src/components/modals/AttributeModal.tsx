import React, { useEffect } from "react";
import { Modal, Form, Input, Button, Space, Alert, Divider } from "antd";
import {
  SaveOutlined,
  CloseOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";

const { TextArea } = Input;

interface Attribute {
  id?: string;
  name: string;
  value: string;
}

interface AttributeModalProps {
  visible: boolean;
  onClose: () => void;
  attribute?: Attribute | null;
  onSave: (attribute: Attribute) => void;
}

const AttributeModal: React.FC<AttributeModalProps> = ({
  visible,
  onClose,
  attribute,
  onSave,
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  useEffect(() => {
    if (attribute) {
      form.setFieldsValue({
        name: attribute.name || "",
        value: attribute.value || "",
      });
    } else {
      form.resetFields();
    }
  }, [attribute, form, visible]);

  const handleSubmit = (values: any) => {
    // Đảm bảo giá trị thuộc tính được xử lý đúng cách
    // Nếu người dùng nhập nhiều giá trị cách nhau bằng dấu phẩy, chúng ta vẫn giữ nguyên dạng chuỗi
    // vì backend sẽ xử lý việc chuyển đổi thành mảng
    const attributeData: Attribute = {
      id: attribute?.id,
      name: values.name.trim(),
      value: values.value.trim(),
    };

    // Lưu vào localStorage để debug
    const savedAttributes = JSON.parse(
      localStorage.getItem("debug_attributes") || "[]"
    );
    savedAttributes.push(attributeData);
    localStorage.setItem("debug_attributes", JSON.stringify(savedAttributes));

    //console.log('Saving attribute:', attributeData);
    onSave(attributeData);
    handleClose();
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={
        attribute
          ? t("admin.products.attributeModal.titleEdit")
          : t("admin.products.attributeModal.titleCreate")
      }
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={700}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          name: "",
          value: "",
        }}
      >
        <Form.Item
          label={t("admin.products.attributeModal.fields.name")}
          name="name"
          rules={[
            {
              required: true,
              message: t("admin.products.attributeModal.validation.nameRequired"),
            },
          ]}
          tooltip={t("admin.products.attributeModal.tooltips.name")}
        >
          <Input placeholder={t("admin.products.attributeModal.placeholders.name")} />
        </Form.Item>

        <Form.Item
          label={t("admin.products.attributeModal.fields.value")}
          name="value"
          rules={[
            {
              required: true,
              message: t("admin.products.attributeModal.validation.valueRequired"),
            },
          ]}
          tooltip={t("admin.products.attributeModal.tooltips.value")}
        >
          <TextArea
            rows={3}
            placeholder={t("admin.products.attributeModal.placeholders.value")}
          />
        </Form.Item>

        <Divider />

        {/* Hướng dẫn */}
        <Alert
          message={t("admin.products.attributeModal.hints.title")}
          description={
            <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
              <li>{t("admin.products.attributeModal.hints.bullet1")}</li>
              <li>{t("admin.products.attributeModal.hints.bullet2")}</li>
              <li>{t("admin.products.attributeModal.hints.bullet3")}</li>
              <li>{t("admin.products.attributeModal.hints.bullet4")}</li>
            </ul>
          }
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          style={{ marginBottom: 16 }}
        />

        {/* Ví dụ minh họa */}
        <Alert
          message={t("admin.products.attributeModal.examples.title")}
          description={
            <div style={{ marginBottom: 0 }}>
              <div>{t("admin.products.attributeModal.examples.line1")}</div>
              <div>{t("admin.products.attributeModal.examples.line2")}</div>
              <div>{t("admin.products.attributeModal.examples.line3")}</div>
            </div>
          }
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />

        {/* Submit buttons */}
        <div style={{ textAlign: "right" }}>
          <Space>
            <Button onClick={handleClose} icon={<CloseOutlined />}>
              {t("common.cancel")}
            </Button>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
              {attribute
                ? t("admin.products.attributeModal.actions.update")
                : t("admin.products.attributeModal.actions.create")}
            </Button>
          </Space>
        </div>
      </Form>
    </Modal>
  );
};

export default AttributeModal;
