import React, { useState, useEffect, useMemo } from 'react';
import {
  Form,
  Alert,
  Skeleton,
  Tag,
  Space,
  Typography,
  Divider,
} from 'antd';
import {
  BulbOutlined,
  SyncOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useDebounce } from '@/hooks/useDebounce';
import {
  attributeService,
  type NamePreviewResponse,
} from '@/services/attributeService';

const { Text, Title } = Typography;

interface DynamicProductNameProps {
  baseName?: string;
  selectedAttributes?: Record<string, string>;
  productId?: string;
  onNameGenerated?: (name: string, details: any) => void;
  disabled?: boolean;
}

const DynamicProductName: React.FC<DynamicProductNameProps> = ({
  baseName,
  selectedAttributes = {},
  productId,
  onNameGenerated,
  disabled = false,
}) => {
  const form = Form.useFormInstance();
  const [loading, setLoading] = useState(false);
  const [namePreview, setNamePreview] = useState<NamePreviewResponse | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  // Debounce the inputs to avoid too many API calls
  const debouncedBaseName = useDebounce(baseName, 300);
  const debouncedAttributes = useDebounce(selectedAttributes, 500);

  // Generate name whenever inputs change
  const shouldGenerateName = useMemo(() => {
    return (
      debouncedBaseName &&
      Object.values(debouncedAttributes).some((value) => value) &&
      !disabled
    );
  }, [debouncedBaseName, debouncedAttributes, disabled]);

  const generateName = async () => {
    const safeBaseName = debouncedBaseName?.trim();
    if (!shouldGenerateName || !safeBaseName) {
      setNamePreview(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await attributeService.generateNameRealTime({
        baseName: safeBaseName,
        attributeValues: debouncedAttributes,
        productId,
      });

      if (response.success && response.data) {
        setNamePreview(response.data);

        // Notify parent component
        if (onNameGenerated) {
          onNameGenerated(response.data.generatedName, response.data);
        }

        // Auto-update form field if different from current value
        const currentName = form.getFieldValue('name');
        if (currentName !== response.data.generatedName) {
          form.setFieldValue('name', response.data.generatedName);
        }
      }
    } catch (err: any) {
      console.error('Error generating name:', err);
      setError(err.message || 'Failed to generate product name');
    } finally {
      setLoading(false);
    }
  };

  // Effect to generate name when inputs change
  useEffect(() => {
    generateName();
  }, [shouldGenerateName]);

  // Reset when disabled
  useEffect(() => {
    if (disabled) {
      setNamePreview(null);
      setError(null);
    }
  }, [disabled]);

  if (!baseName && !disabled) {
    return (
      <Alert
        message="Tên cơ bản bắt buộc"
        description="Vui lòng nhập tên cơ bản (Base Name) để sử dụng tính năng tạo tên tự động"
        type="info"
        icon={<BulbOutlined />}
        style={{ marginBottom: 16 }}
      />
    );
  }

  if (disabled) {
    return null;
  }

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Generated Name Preview */}
      {loading ? (
        <div
          style={{
            padding: '12px 16px',
            background: '#f5f5f5',
            borderRadius: 6,
            marginBottom: 16,
          }}
        >
          <Space>
            <SyncOutlined spin />
            <Text>Đang tạo tên sản phẩm...</Text>
          </Space>
          <Skeleton.Input
            style={{ width: 300, marginLeft: 16 }}
            active
            size="small"
          />
        </div>
      ) : namePreview ? (
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              padding: '16px',
              background: namePreview.hasChanges ? '#f6ffed' : '#f5f5f5',
              borderRadius: 8,
              border: namePreview.hasChanges
                ? '1px solid #b7eb8f'
                : '1px solid #d9d9d9',
            }}
          >
            <Space size="small" style={{ marginBottom: 8 }}>
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
              <Text strong>Tên được tạo tự động:</Text>
            </Space>

            <Title level={5} style={{ margin: 0, color: '#1890ff' }}>
              {namePreview.generatedName}
            </Title>

            {namePreview.hasChanges && (
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Gốc: {namePreview.originalName}
                </Text>
              </div>
            )}
          </div>

          {/* Name Parts Breakdown */}
          {namePreview.parts.length > 1 && (
            <div style={{ marginTop: 12 }}>
              <Text
                type="secondary"
                style={{ fontSize: 12, marginBottom: 8, display: 'block' }}
              >
                Thành phần tên:
              </Text>
              <Space wrap size="small">
                {namePreview.parts.map((part, index) => (
                  <Tag
                    key={index}
                    color={index === 0 ? 'blue' : 'green'}
                    style={{ fontSize: 11 }}
                  >
                    {part}
                  </Tag>
                ))}
              </Space>
            </div>
          )}

          {/* Affecting Attributes */}
          {namePreview.affectingAttributes &&
            namePreview.affectingAttributes.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <Text
                  type="secondary"
                  style={{ fontSize: 12, marginBottom: 8, display: 'block' }}
                >
                  Thuộc tính ảnh hưởng:
                </Text>
                <Space wrap size="small">
                  {namePreview.affectingAttributes.map((attr) => (
                    <Tag
                      key={attr.id}
                      color="orange"
                      style={{ fontSize: 11 }}
                      title={`${attr.groupName}: ${attr.name}`}
                    >
                      {attr.nameTemplate || attr.name}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}
        </div>
      ) : null}

      {/* Error State */}
      {error && (
        <Alert
          message="Lỗi tạo tên sản phẩm"
          description={error}
          type="error"
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Suggestions (if available) */}
      {namePreview?.suggestions && namePreview.suggestions.length > 0 && (
        <div>
          <Divider style={{ margin: '12px 0' }} />
          <Text
            type="secondary"
            style={{ fontSize: 12, marginBottom: 8, display: 'block' }}
          >
            💡 Gợi ý từ các variant khác:
          </Text>
          <Space wrap size="small">
            {namePreview.suggestions.slice(0, 3).map((suggestion, index) => (
              <Tag
                key={index}
                style={{ fontSize: 11, cursor: 'pointer' }}
                onClick={() => {
                  // Could implement click to apply suggestion
                }}
              >
                {suggestion}
              </Tag>
            ))}
          </Space>
        </div>
      )}

      {/* Helper Text */}
      {!Object.values(selectedAttributes).some((v) => v) && baseName && (
        <Alert
          message="Chọn thuộc tính để tạo tên tự động"
          description="Tên sản phẩm sẽ được tạo tự động dựa trên thuộc tính bạn chọn (CPU, GPU, RAM, v.v.)"
          type="info"
          icon={<BulbOutlined />}
          style={{ marginTop: 16 }}
        />
      )}
    </div>
  );
};

export default DynamicProductName;
