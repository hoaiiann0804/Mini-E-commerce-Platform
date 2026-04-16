import React, {
  useMemo,
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { message } from 'antd';
import { useUploadImageMutation } from '@/services/imageApi';

interface EnhancedRichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  height?: number;
  readonly?: boolean;
  productId?: string;
  category?: 'product' | 'user' | 'review';
  style?: React.CSSProperties;
  className?: string;
  onImageUpload?: (imageUrl: string, imageId: string) => void;
}

const EnhancedRichTextEditor: React.FC<EnhancedRichTextEditorProps> = ({
  value = '',
  onChange,
  placeholder = 'Nhập nội dung...',
  height = 200,
  readonly = false,
  productId,
  category = 'product',
  onImageUpload,
}) => {
  // Add error boundary
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('EnhancedRichTextEditor error:', error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div
        style={{
          border: '1px solid #d9d9d9',
          borderRadius: '6px',
          padding: '12px',
          minHeight: `${height}px`,
          backgroundColor: '#fff2f0',
          color: '#ff4d4f',
        }}
      >
        <p>
          ❌ Rich Text Editor gặp lỗi. Đang sử dụng editor đơn giản thay thế.
        </p>
        <textarea
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          style={{
            width: '100%',
            minHeight: `${height - 60}px`,
            border: 'none',
            outline: 'none',
            resize: 'vertical',
            fontFamily: 'inherit',
          }}
        />
      </div>
    );
  }
  const [displayValue, setDisplayValue] = useState(value);
  const quillRef = useRef<ReactQuill>(null);
  const [uploadImage] = useUploadImageMutation();
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const handleChange = (content: string) => {
    setDisplayValue(content);
    if (onChange) {
      onChange(content);
    }
  };

  // Custom image handler for Quill
  const handleImageInsert = useCallback(async () => {
    if (isUploading) {
      message.warning('Đang upload ảnh, vui lòng chờ...');
      return;
    }

    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        message.error('Kích thước ảnh không được vượt quá 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        message.error('Chỉ được upload file ảnh');
        return;
      }

      setIsUploading(true);
      message.loading('Đang upload ảnh...', 0);

      try {
        const result = await uploadImage({
          file,
          options: {
            category,
            productId,
            generateThumbs: true,
            optimize: true,
          },
        }).unwrap();

        const imageUrl =
          typeof result?.data?.url === 'string' &&
          /^https?:\/\//i.test(result.data.url)
            ? result.data.url
            : `${(import.meta.env.VITE_API_URL || 'http://localhost:8888/api').replace(/\/api\/?$/, '')}${result.data.url}`;

        // Insert image into editor
        const quill = quillRef.current?.getEditor();
        if (quill) {
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, 'image', imageUrl);
          quill.setSelection(range.index + 1);
        }

        // Call onImageUpload callback if provided
        if (onImageUpload) {
          onImageUpload(imageUrl, result.data.id);
        }

        message.destroy();
        message.success('Upload ảnh thành công!');
      } catch (error: any) {
        message.destroy();
        const errorMessage = error?.data?.message || 'Upload ảnh thất bại';
        message.error(errorMessage);
        console.error('Image upload error:', error);
      } finally {
        setIsUploading(false);
      }
    };
  }, [uploadImage, category, productId, isUploading, onImageUpload]);

  // Custom paste handler to handle pasted images
  const handlePaste = useCallback(
    async (e: ClipboardEvent) => {
      const clipboardData = e.clipboardData || (window as any).clipboardData;
      const items = clipboardData?.items;

      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          e.preventDefault();

          const file = item.getAsFile();
          if (!file) continue;

          if (isUploading) {
            message.warning('Đang upload ảnh, vui lòng chờ...');
            return;
          }

          // Validate file size (5MB)
          if (file.size > 5 * 1024 * 1024) {
            message.error('Kích thước ảnh không được vượt quá 5MB');
            return;
          }

          setIsUploading(true);
          message.loading('Đang upload ảnh từ clipboard...', 0);

          try {
            const result = await uploadImage({
              file,
              options: {
                category,
                productId,
                generateThumbs: true,
                optimize: true,
              },
            }).unwrap();

            const imageUrl =
              typeof result?.data?.url === 'string' &&
              /^https?:\/\//i.test(result.data.url)
                ? result.data.url
                : `${(import.meta.env.VITE_API_URL || 'http://localhost:8888/api').replace(/\/api\/?$/, '')}${result.data.url}`;

            // Insert image into editor
            const quill = quillRef.current?.getEditor();
            if (quill) {
              const range = quill.getSelection(true);
              quill.insertEmbed(range.index, 'image', imageUrl);
              quill.setSelection(range.index + 1);
            }

            // Call onImageUpload callback if provided
            if (onImageUpload) {
              onImageUpload(imageUrl, result.data.id);
            }

            message.destroy();
            message.success('Upload ảnh thành công!');
          } catch (error: any) {
            message.destroy();
            const errorMessage = error?.data?.message || 'Upload ảnh thất bại';
            message.error(errorMessage);
            console.error('Image upload error:', error);
          } finally {
            setIsUploading(false);
          }
          break;
        }
      }
    },
    [uploadImage, category, productId, isUploading, onImageUpload]
  );

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ indent: '-1' }, { indent: '+1' }],
          ['link', 'image'],
          ['clean'],
        ],
        handlers: {
          image: handleImageInsert,
        },
      },
      clipboard: {
        matchVisual: false,
      },
    }),
    [handleImageInsert]
  );

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'color',
    'background',
    'list',
    'bullet',
    'indent',
    'link',
    'image',
  ];

  // Add event listener for paste
  useEffect(() => {
    const quill = quillRef.current?.getEditor();
    if (quill && !readonly) {
      quill.root.addEventListener('paste', handlePaste);
      return () => {
        quill.root.removeEventListener('paste', handlePaste);
      };
    }
  }, [handlePaste, readonly]);

  // If readonly, render display mode
  if (readonly) {
    return (
      <div className="enhanced-rich-text-editor readonly-mode">
        <div
          className="ql-editor"
          dangerouslySetInnerHTML={{ __html: displayValue }}
          style={{
            minHeight: `${height - 42}px`,
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '12px 15px',
            backgroundColor: '#f8f9fa',
          }}
        />
        <style>{`
          .readonly-mode .ql-editor {
            min-height: ${height - 42}px;
          }
          .readonly-mode .ql-editor img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 10px 0;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          .readonly-mode .ql-editor p {
            margin-bottom: 10px;
          }
        `}</style>
      </div>
    );
  }

  try {
    return (
      <div className="enhanced-rich-text-editor">
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={displayValue}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          readOnly={readonly || isUploading}
          style={{ height: `${height}px`, marginBottom: '50px' }}
        />
        {isUploading && (
          <div className="upload-overlay">
            <div className="upload-indicator">Đang upload ảnh...</div>
          </div>
        )}
        <style>{`
        .enhanced-rich-text-editor {
          position: relative;
        }
        .enhanced-rich-text-editor .ql-editor {
          min-height: ${height - 42}px;
        }
        .enhanced-rich-text-editor .ql-toolbar {
          border-top: 1px solid #ccc;
          border-left: 1px solid #ccc;
          border-right: 1px solid #ccc;
        }
        .enhanced-rich-text-editor .ql-container {
          border-bottom: 1px solid #ccc;
          border-left: 1px solid #ccc;
          border-right: 1px solid #ccc;
        }
        .enhanced-rich-text-editor .ql-editor img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 10px 0;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s ease;
        }
        .enhanced-rich-text-editor .ql-editor img:hover {
          transform: scale(1.02);
        }
        .enhanced-rich-text-editor .ql-editor p {
          margin-bottom: 10px;
        }
        .enhanced-rich-text-editor .ql-editor.ql-blank::before {
          font-style: italic;
          color: #aaa;
        }
        .upload-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .upload-indicator {
          background: #1890ff;
          color: white;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 14px;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
      `}</style>
      </div>
    );
  } catch (error) {
    console.error('ReactQuill render error:', error);
    return (
      <div
        style={{
          border: '1px solid #d9d9d9',
          borderRadius: '6px',
          padding: '12px',
          minHeight: `${height}px`,
          backgroundColor: '#fff2f0',
          color: '#ff4d4f',
        }}
      >
        <p>
          ❌ Rich Text Editor gặp lỗi khi render. Đang sử dụng editor đơn giản
          thay thế.
        </p>
        <textarea
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          style={{
            width: '100%',
            minHeight: `${height - 60}px`,
            border: 'none',
            outline: 'none',
            resize: 'vertical',
            fontFamily: 'inherit',
          }}
        />
      </div>
    );
  }
};

export default EnhancedRichTextEditor;
