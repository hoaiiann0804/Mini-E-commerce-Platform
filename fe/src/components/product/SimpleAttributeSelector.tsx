import React, { useState } from 'react';
import { Card, Button, Space, Typography, Tag, Divider, Alert } from 'antd';
import { CheckOutlined, PlusOutlined } from '@ant-design/icons';
import { simpleNamingService } from '@/services/simpleNamingService';

const { Text, Title } = Typography;

interface SimpleAttributeSelectorProps {
  onAttributeChange: (attributes: Record<string, string>) => void;
  onNamePreview?: (name: string) => void;
  disabled?: boolean;
}

const SimpleAttributeSelector: React.FC<SimpleAttributeSelectorProps> = ({
  onAttributeChange,
  onNamePreview,
  disabled = false,
}) => {
  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, string>
  >({});

  // Mock attribute options - In real app, this would come from API
  const attributeOptions = {
    CPU: [
      'Intel Core i3-13100',
      'Intel Core i5-13500H',
      'Intel Core i7-13700H',
      'Intel Core i9-13900H',
      'AMD Ryzen 5 7600U',
      'AMD Ryzen 7 7800U',
      'AMD Ryzen 9 7900U',
    ],
    GPU: [
      'Integrated Graphics',
      'NVIDIA RTX 4050',
      'NVIDIA RTX 4060',
      'NVIDIA RTX 4070',
      'NVIDIA RTX 4080',
      'AMD Radeon RX 7600M',
      'AMD Radeon RX 7700M',
    ],
    RAM: [
      '8GB DDR4',
      '16GB DDR4',
      '32GB DDR4',
      '8GB DDR5',
      '16GB DDR5',
      '32GB DDR5',
      '64GB DDR5',
    ],
    Storage: ['256GB SSD', '512GB SSD', '1TB SSD', '2TB SSD'],
  };

  const handleAttributeSelect = (attributeType: string, value: string) => {
    const updatedAttributes = { ...selectedAttributes };

    // Toggle selection
    if (updatedAttributes[attributeType] === value) {
      delete updatedAttributes[attributeType];
    } else {
      updatedAttributes[attributeType] = value;
    }

    setSelectedAttributes(updatedAttributes);
    onAttributeChange(updatedAttributes);

    // Preview name if callback provided
    if (onNamePreview) {
      const previewName = simpleNamingService.previewName(
        'ThinkPad',
        updatedAttributes
      );
      onNamePreview(previewName);
    }
  };

  const clearAllAttributes = () => {
    setSelectedAttributes({});
    onAttributeChange({});
    if (onNamePreview) {
      onNamePreview('ThinkPad');
    }
  };

  const getShortName = (attributeType: string, value: string): string => {
    const templates = simpleNamingService.getNameTemplates(attributeType);
    return templates[value] || value;
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      {Object.keys(selectedAttributes).length > 0 && (
        <Alert
          message={
            <div>
              <Text strong>Đã chọn: </Text>
              <Space wrap size="small" style={{ marginTop: 4 }}>
                {Object.entries(selectedAttributes).map(([type, value]) => {
                  const shortName = getShortName(type, value);
                  return (
                    <Tag
                      key={type}
                      color="blue"
                      closable
                      onClose={() => handleAttributeSelect(type, value)}
                    >
                      <Space size={2}>
                        <Text strong>{type}:</Text>
                        <Text>{shortName}</Text>
                      </Space>
                    </Tag>
                  );
                })}
                <Button
                  type="text"
                  size="small"
                  onClick={clearAllAttributes}
                  style={{ padding: 0, height: 'auto' }}
                >
                  Xóa tất cả
                </Button>
              </Space>
            </div>
          }
          type="info"
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Attribute Selection */}
      {Object.entries(attributeOptions).map(([attributeType, options]) => (
        <Card key={attributeType} size="small" style={{ marginBottom: 16 }}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <Title level={5} style={{ margin: 0 }}>
                {attributeType}
              </Title>
              {selectedAttributes[attributeType] && (
                <Tag color="green"  style={{ fontSize: 11 }}>
                  ✓{' '}
                  {getShortName(
                    attributeType,
                    selectedAttributes[attributeType]
                  )}
                </Tag>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {options.map((option) => {
                const isSelected = selectedAttributes[attributeType] === option;
                const shortName = getShortName(attributeType, option);
                const isHidden = shortName === ''; // Don't show options that don't add to name

                if (isHidden && !isSelected) return null;

                return (
                  <Button
                    key={option}
                    size="small"
                    type={isSelected ? 'primary' : 'default'}
                    disabled={disabled}
                    icon={isSelected ? <CheckOutlined /> : undefined}
                    onClick={() => handleAttributeSelect(attributeType, option)}
                    style={{
                      borderColor: isSelected ? '#1890ff' : undefined,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Space size={4}>
                      <span>{option}</span>
                      {!isSelected && shortName && (
                        <Text type="secondary" style={{ fontSize: 10 }}>
                          →{shortName}
                        </Text>
                      )}
                    </Space>
                  </Button>
                );
              })}
            </div>
          </div>
        </Card>
      ))}

      {/* Preview */}
      {Object.keys(selectedAttributes).length === 0 && (
        <Alert
          message="💡 Chọn các thuộc tính để tạo tên sản phẩm tự động"
          description="Tên sẽ được tạo theo thứ tự: CPU → GPU → RAM → Storage"
          type="info"
          showIcon
        />
      )}
    </div>
  );
};

export default SimpleAttributeSelector;
