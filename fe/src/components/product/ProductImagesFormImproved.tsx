import React, { useState } from 'react';
import { Form, Input, Row, Col, Alert, Tabs, Button, Space, message } from 'antd';
import {
  UploadOutlined,
  LinkOutlined,
  DeleteOutlined,
  StarFilled,
  StarOutlined,
} from '@ant-design/icons';
import { Upload } from 'antd';
import type { UploadFile, UploadProps } from 'antd';
import { useUploadMultipleImagesMutation } from '@/services/imageApi';
import Image from 'antd/es/image';

const { TextArea } = Input;
const { TabPane } = Tabs;

interface ProductImagesFormImprovedProps {
  productId?: string;
}

const ProductImagesFormImproved: React.FC<ProductImagesFormImprovedProps> = ({ productId }) => {
  const [activeTab, setActiveTab] = useState('upload');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [thumbnailIndex, setThumbnailIndex] = useState<number>(0);
  const [uploadImages, { isLoading: isUploading }] = useUploadMultipleImagesMutation();

  const uploadProps: UploadProps = {
    name: 'images',
    multiple: true,
    accept: 'image/*',
    listType: 'picture-card',
    maxCount: 10,
    beforeUpload: () => false, // Prevent auto upload
    onChange: ({ fileList: newFileList }) => setFileList(newFileList),
    fileList,
  };

  const handleUpload = async () => {
    const filesToUpload = fileList
      .filter((file) => file.originFileObj)
      .map((file) => file.originFileObj!);

    if (filesToUpload.length === 0) return;

    try {
      const result = await uploadImages({
        files: filesToUpload,
        options: { category: 'product', productId },
      }).unwrap();

      if (result.data.successful.length > 0) {
        message.success(`Đã upload ${result.data.successful.length} ảnh!`);
        const newFileList = fileList.map((file) => {
          const uploaded = result.data.successful.find((sf) => sf.originalName === file.name);
          return uploaded ? { ...file, url: uploaded.url, status: 'done' as const } : file;
        });
        setFileList(newFileList);
      }
    } catch (error: any) {
      message.error('Upload thất bại!');
    }
  };

  return (
    <Row gutter={[24, 16]}>
      <Col span={24}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
          {/* Tab 1: Upload từ máy */}
          <TabPane
            tab={
              <span>
                <UploadOutlined /> Upload từ máy
              </span>
            }
            key="upload"
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Alert
                message="📤 Cách upload ảnh"
                description="Kéo thả ảnh vào đây hoặc click để chọn. Có thể upload nhiều ảnh cùng lúc."
                type="info"
                showIcon
              />

              <Upload {...uploadProps}>
                {fileList.length >= 10 ? null : (
                  <div style={{ padding: 50 }}>
                    <UploadOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                    <div style={{ marginTop: 8 }}>Click hoặc kéo thả để upload</div>
                  </div>
                )}
              </Upload>

              {fileList.length > 0 && (
                <Button type="primary" onClick={handleUpload} loading={isUploading} block>
                  Upload {fileList.length} ảnh lên server
                </Button>
              )}

              {/* Preview ảnh đã upload */}
              {fileList.filter((f) => f.url).length > 0 && (
                <Alert
                  message="✅ Ảnh đã upload thành công!"
                  description="Click vào ảnh để đặt làm ảnh đại diện"
                  type="success"
                  showIcon
                />
              )}
            </Space>
          </TabPane>

          {/* Tab 2: Nhập URL */}
          <TabPane
            tab={
              <span>
                <LinkOutlined /> Nhập URL
              </span>
            }
            key="url"
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Alert
                message="🔗 Nhập URL ảnh"
                description="Paste URL ảnh vào ô bên dưới. Mỗi URL trên một dòng."
                type="info"
                showIcon
              />

              <Form.Item
                name="images"
                label="URL hình ảnh (mỗi URL một dòng)"
                rules={[{ required: false }]}
              >
                <TextArea
                  rows={8}
                  placeholder={`https://images.unsplash.com/photo-xxx-1?w=800&h=600
https://images.unsplash.com/photo-xxx-2?w=800&h=600
https://images.unsplash.com/photo-xxx-3?w=800&h=600`}
                  showCount
                  maxLength={3000}
                />
              </Form.Item>

              <Form.Item name="thumbnail" label="URL ảnh đại diện">
                <Input
                  placeholder="https://images.unsplash.com/photo-xxx?w=400&h=400"
                  allowClear
                />
              </Form.Item>
            </Space>
          </TabPane>
        </Tabs>
      </Col>

      {/* Preview Section */}
      {fileList.filter((f) => f.url).length > 0 && (
        <Col span={24}>
          <Alert
            message="Chọn ảnh đại diện"
            description="Click vào ảnh để đặt làm ảnh đại diện"
            type="info"
            style={{ marginBottom: 16 }}
          />
          <Row gutter={[16, 16]}>
            {fileList
              .filter((f) => f.url)
              .map((file, index) => (
                <Col span={4} key={file.uid}>
                  <div
                    style={{
                      position: 'relative',
                      cursor: 'pointer',
                      border: thumbnailIndex === index ? '3px solid #1890ff' : '1px solid #d9d9d9',
                      borderRadius: 8,
                      overflow: 'hidden',
                    }}
                    onClick={() => setThumbnailIndex(index)}
                  >
                    <Image
                      src={file.url}
                      preview={false}
                      style={{ width: '100%', height: 150, objectFit: 'cover' }}
                    />
                    {thumbnailIndex === index && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          color: '#1890ff',
                        }}
                      >
                        <StarFilled style={{ fontSize: 20 }} />
                      </div>
                    )}
                    {thumbnailIndex === index && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: '#1890ff',
                          color: 'white',
                          textAlign: 'center',
                          padding: 4,
                          fontSize: 11,
                          fontWeight: 'bold',
                        }}
                      >
                        Ảnh đại diện
                      </div>
                    )}
                  </div>
                </Col>
              ))}
          </Row>
        </Col>
      )}

      <Col span={24}>
        <Alert
          message="💡 Hướng dẫn"
          description={
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>
                <strong>Upload từ máy:</strong> Chọn tab "Upload từ máy" → Chọn file → Click "Upload"
              </li>
              <li>
                <strong>Nhập URL:</strong> Chọn tab "Nhập URL" → Paste URL ảnh → Mỗi URL một dòng
              </li>
              <li>
                <strong>Ảnh đại diện:</strong> Click vào ảnh có icon ⭐ để đặt làm ảnh chính
              </li>
            </ul>
          }
          type="info"
          showIcon
        />
      </Col>
    </Row>
  );
};

export default ProductImagesFormImproved;

