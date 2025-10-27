import React, { useState, useEffect } from 'react';
import { Upload, Form, message, Button, Row, Col, Image, Space, Typography, Card } from 'antd';
import {
  UploadOutlined,
  DeleteOutlined,
  EyeOutlined,
  StarFilled,
  StarOutlined,
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import { useUploadMultipleImagesMutation } from '@/services/imageApi';

const { Text } = Typography;

interface ProductImageUploadFormProps {
  productId?: string;
}

const ProductImageUploadForm: React.FC<ProductImageUploadFormProps> = ({ productId }) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewImage, setPreviewImage] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [thumbnailIndex, setThumbnailIndex] = useState<number>(-1);

  const [uploadImages, { isLoading: isUploading }] = useUploadMultipleImagesMutation();

  const [form] = Form.useForm();

  // Upload props
  const uploadProps: UploadProps = {
    name: 'images',
    multiple: true,
    accept: 'image/*',
    listType: 'picture-card',
    maxCount: 10,
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      const isLt5M = file.size / 1024 / 1024 < 5;

      if (!isImage) {
        message.error('Chỉ chấp nhận file ảnh!');
        return Upload.LIST_IGNORE;
      }
      if (!isLt5M) {
        message.error('Ảnh phải nhỏ hơn 5MB!');
        return Upload.LIST_IGNORE;
      }

      return false; // Prevent auto upload
    },
    onChange: async ({ fileList: newFileList }) => {
      setFileList(newFileList);
    },
    onPreview: async (file) => {
      if (file.url) {
        setPreviewImage(file.url);
        setPreviewOpen(true);
      } else if (file.originFileObj) {
        const url = URL.createObjectURL(file.originFileObj);
        setPreviewImage(url);
        setPreviewOpen(true);
      }
    },
    onRemove: (file) => {
      const newFileList = fileList.filter((item) => item.uid !== file.uid);
      setFileList(newFileList);
      
      // Nếu xóa ảnh thumbnail, reset thumbnail
      const removedIndex = fileList.findIndex((item) => item.uid === file.uid);
      if (removedIndex === thumbnailIndex) {
        setThumbnailIndex(-1);
      } else if (removedIndex < thumbnailIndex) {
        setThumbnailIndex(thumbnailIndex - 1);
      }
    },
    fileList,
    showUploadList: {
      showPreviewIcon: true,
      showRemoveIcon: true,
      showDownloadIcon: false,
    },
  };

  // Handle upload to server
  const handleUpload = async () => {
    try {
      // Get only files that haven't been uploaded yet
      const filesToUpload = fileList
        .filter((file) => file.originFileObj)
        .map((file) => file.originFileObj!);

      if (filesToUpload.length === 0) {
        message.warning('Không có ảnh nào để upload!');
        return;
      }

      message.loading({ content: 'Đang upload ảnh...', key: 'upload' });

      const result = await uploadImages({
        files: filesToUpload,
        options: {
          category: 'product',
          productId,
          generateThumbs: true,
          optimize: true,
        },
      }).unwrap();

      if (result.data.successful.length > 0) {
        // Update fileList with uploaded URLs
        const newFileList = fileList.map((file) => {
          const uploadedFile = result.data.successful.find(
            (sf) => sf.originalName === file.name
          );
          if (uploadedFile && !file.url) {
            return {
              ...file,
              url: uploadedFile.url,
              status: 'done',
            };
          }
          return file;
        });

        setFileList(newFileList);

        // Update form with image URLs
        const imageUrls = newFileList
          .filter((file) => file.url)
          .map((file) => file.url!);

        form.setFieldsValue({
          images: imageUrls.join('\n'),
          thumbnail: thumbnailIndex >= 0 ? imageUrls[thumbnailIndex] : imageUrls[0] || '',
        });

        message.success({
          content: `Upload thành công ${result.data.successful.length} ảnh!`,
          key: 'upload',
          duration: 3,
        });
      }

      if (result.data.failed.length > 0) {
        message.error({
          content: `Upload thất bại ${result.data.failed.length} ảnh`,
          key: 'upload',
        });
      }
    } catch (error: any) {
      message.error({
        content: `Lỗi upload: ${error?.data?.message || error?.message || 'Unknown error'}`,
        key: 'upload',
      });
    }
  };

  // Handle set thumbnail
  const handleSetThumbnail = (index: number) => {
    if (fileList[index]?.url) {
      setThumbnailIndex(index);
      form.setFieldsValue({
        thumbnail: fileList[index].url,
      });
      message.success('Đã đặt ảnh đại diện!');
    }
  };

  useEffect(() => {
    // Auto set first image as thumbnail if not set
    if (thumbnailIndex === -1 && fileList.length > 0 && fileList[0].url) {
      setThumbnailIndex(0);
      form.setFieldsValue({
        thumbnail: fileList[0].url,
      });
    }
  }, [fileList]);

  return (
    <Form form={form} layout="vertical">
      <Row gutter={[24, 16]}>
        {/* Upload Area */}
        <Col span={24}>
          <Card size="small" style={{ backgroundColor: '#fafafa' }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>📤 Upload hình ảnh sản phẩm</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Kéo thả ảnh vào đây hoặc click để chọn (Tối đa 10 ảnh, mỗi ảnh {'<'} 5MB)
                </Text>
              </div>

              <Upload {...uploadProps}>
                {fileList.length >= 10 ? null : (
                  <div>
                    <UploadOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                    <div style={{ marginTop: 8 }}>Thêm ảnh</div>
                  </div>
                )}
              </Upload>

              {fileList.length > 0 && (
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  onClick={handleUpload}
                  loading={isUploading}
                  block
                >
                  {isUploading ? 'Đang upload...' : `Upload ${fileList.length} ảnh lên server`}
                </Button>
              )}
            </Space>
          </Card>
        </Col>

        {/* Hidden form fields for image URLs */}
        <Col span={24} style={{ display: 'none' }}>
          <Form.Item name="images">
            <Upload
              name="images"
              accept="image/*"
              multiple
              listType="picture-card"
              fileList={fileList.filter((file) => file.url)}
              showUploadList={false}
            />
          </Form.Item>
        </Col>

        {/* Preview Section */}
        {fileList.length > 0 && (
          <Col span={24}>
            <Card size="small">
              <Text strong>Preview và chọn ảnh đại diện:</Text>
              <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                {fileList.map((file, index) => (
                  <Col span={4} key={file.uid}>
                    <Card
                      hoverable
                      style={{
                        position: 'relative',
                        cursor: 'pointer',
                        border: thumbnailIndex === index ? '3px solid #1890ff' : '1px solid #d9d9d9',
                      }}
                      onClick={() => handleSetThumbnail(index)}
                    >
                      {file.url ? (
                        <Image
                          src={file.url}
                          alt={file.name}
                          preview={false}
                          style={{ width: '100%', objectFit: 'cover' }}
                          height={120}
                        />
                      ) : file.thumbUrl ? (
                        <Image
                          src={file.thumbUrl}
                          alt={file.name}
                          preview={false}
                          style={{ width: '100%', objectFit: 'cover' }}
                          height={120}
                        />
                      ) : (
                        <img
                          src={URL.createObjectURL(file.originFileObj!)}
                          alt={file.name}
                          style={{ width: '100%', height: 120, objectFit: 'cover' }}
                        />
                      )}

                      {/* Star icon for thumbnail */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          color: thumbnailIndex === index ? '#1890ff' : '#999',
                        }}
                      >
                        {thumbnailIndex === index ? (
                          <StarFilled style={{ fontSize: 20 }} />
                        ) : (
                          <StarOutlined style={{ fontSize: 20 }} />
                        )}
                      </div>

                      {index === thumbnailIndex && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 4,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: '#1890ff',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 10,
                          }}
                        >
                          Ảnh đại diện
                        </div>
                      )}
                    </Card>
                  </Col>
                ))}
              </Row>
              <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
                💡 Click vào ảnh để đặt làm ảnh đại diện (có dấu ⭐)
              </Text>
            </Card>
          </Col>
        )}

        {/* Image URLs (Hidden) */}
        <Form.Item name="images" style={{ display: 'none' }}>
          <Upload
            name="images"
            showUploadList={false}
            fileList={fileList.filter((file) => file.url)}
          />
        </Form.Item>

        <Form.Item name="thumbnail" style={{ display: 'none' }} />
      </Row>

      {/* Preview Modal */}
      {previewImage && (
        <Image
          wrapperStyle={{ display: 'none' }}
          preview={{
            visible: previewOpen,
            src: previewImage,
            onVisibleChange: (value) => {
              setPreviewOpen(value);
            },
            destroyOnClose: true,
          }}
        />
      )}
    </Form>
  );
};

export default ProductImageUploadForm;

