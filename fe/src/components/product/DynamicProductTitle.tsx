import React, { useState, useEffect } from 'react';
import { Typography, Space, Tag, Skeleton, Alert } from 'antd';
import { BulbOutlined, LoadingOutlined } from '@ant-design/icons';
import { useDebounce } from '@/hooks/useDebounce';
import { attributeService } from '@/services/attributeService';

const { Title } = Typography;

interface Product {
  id: string;
  name: string;
  baseName?: string;
  isVariantProduct?: boolean;
}

interface DynamicProductTitleProps {
  product: Product;
  selectedAttributes: Record<string, string>;
  showAttributeTags?: boolean;
  level?: 1 | 2 | 3 | 4 | 5;
  style?: React.CSSProperties;
}

const DynamicProductTitle: React.FC<DynamicProductTitleProps> = ({
  product,
  selectedAttributes,
  showAttributeTags = true,
  level = 1,
  style,
}) => {
  const [dynamicName, setDynamicName] = useState<string>(product.name);
  const [loading, setLoading] = useState(false);
  const [attributeDetails, setAttributeDetails] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Debounce selected attributes to avoid too many API calls
  const debouncedAttributes = useDebounce(selectedAttributes, 500);

  const shouldGenerateDynamicName = React.useMemo(() => {
    return (
      product.isVariantProduct &&
      Object.values(debouncedAttributes).some((value) => value) &&
      (product.baseName || product.name)
    );
  }, [product, debouncedAttributes]);

  const generateDynamicName = async () => {
    if (!shouldGenerateDynamicName) {
      setDynamicName(product.name);
      setAttributeDetails([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const baseName = product.baseName || product.name;
      const response = await attributeService.generateNameRealTime({
        baseName,
        attributeValues: debouncedAttributes,
        productId: product.id,
      });

      if (response.success && response.data) {
        setDynamicName(response.data.generatedName);
        setAttributeDetails(response.data.affectingAttributes || []);
      }
    } catch (err: any) {
      console.error('Error generating dynamic name:', err);
      setError('Không thể tạo tên động');
      setDynamicName(product.name); 
    } finally {
      setLoading(false);
    }
  };

  // Generate dynamic name when attributes change
  useEffect(() => {
    generateDynamicName();
  }, [shouldGenerateDynamicName, debouncedAttributes]);

  // Show loading state
  if (loading) {
    return (
      <div style={style}>
        <Space>
          <Skeleton.Input
            style={{ width: 400, height: level === 1 ? 32 : 24 }}
            active
          />
          <LoadingOutlined style={{ color: '#1890ff' }} />
        </Space>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div style={style}>
        <Title level={level} style={{ margin: 0, color: '#ff4d4f' }}>
          {product.name}
        </Title>
        <Alert
          message={error}
          type="error"
          showIcon
          style={{ marginTop: 8 }}
        />
      </div>
    );
  }

  const hasAttributeChanges = dynamicName !== product.name;

  return (
    <div style={style}>
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {/* Main Title */}
        <div style={{ position: 'relative' }}>
          <Title
            level={level}
            style={{
              margin: 0,
              color: hasAttributeChanges ? '#1890ff' : undefined,
              transition: 'color 0.3s ease',
            }}
          >
            {dynamicName}
          </Title>

          {hasAttributeChanges && (
            <Tag
              color="blue"
              icon={<BulbOutlined />}
              style={{
                position: 'absolute',
                top: -8,
                right: -8,
                fontSize: 10,
              }}
            >
              AUTO
            </Tag>
          )}
        </div>

        {/* Attribute Tags */}
        {showAttributeTags && attributeDetails.length > 0 && (
          <Space wrap size="small">
            {attributeDetails.map((attr: any) => (
              <Tag
                key={attr.id}
                color="blue"
                style={{ fontSize: 11, margin: 2 }}
              >
                <Space size={4}>
                  <span>{attr.groupName}:</span>
                  <strong>{attr.nameTemplate || attr.name}</strong>
                </Space>
              </Tag>
            ))}
          </Space>
        )}

        {/* Original Name (if different) */}
        {hasAttributeChanges && (
          <Typography.Text
            type="secondary"
            style={{
              fontSize: 12,
              fontStyle: 'italic',
              display: 'block',
            }}
          >
            Tên gốc: {product.name}
          </Typography.Text>
        )}
      </Space>
    </div>
  );
};

export default DynamicProductTitle;
