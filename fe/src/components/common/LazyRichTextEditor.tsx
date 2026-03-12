import { lazy, Suspense, useState, useEffect } from 'react';
import { Spin } from 'antd';
import { processHtmlForEditor } from '@/utils/htmlProcessor';

// Lazy load the heavy Quill editor
const ReactQuill = lazy(() => import('react-quill'));

interface LazyRichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  height?: number;
  readonly?: boolean;
}

const LazyRichTextEditor: React.FC<LazyRichTextEditorProps> = ({
  value = '',
  onChange,
  placeholder = 'Nhập nội dung...',
  height = 200,
  readonly = false,
}) => {
  const [editorValue, setEditorValue] = useState(() => {
    return processHtmlForEditor(value || '');
  });

  useEffect(() => {
    const processedValue = processHtmlForEditor(value || '');
    setEditorValue(processedValue);
  }, [value]);

  const handleChange = (content: string) => {
    setEditorValue(content);
    onChange?.(content);
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
      ['clean'],
    ],
  };

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'link',
    'image',
  ];

  if (readonly) {
    return (
      <div
        className="ql-editor"
        dangerouslySetInnerHTML={{ __html: editorValue }}
        style={{
          minHeight: `${height}px`,
          border: '1px solid #d9d9d9',
          borderRadius: '6px',
          padding: '12px',
          backgroundColor: '#f5f5f5',
        }}
      />
    );
  }

  return (
    <div style={{ height: `${height + 42}px` }}>
      <Suspense
        fallback={
          <div
            style={{
              height: `${height}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
            }}
          >
            <Spin tip="Loading editor..." />
          </div>
        }
      >
        <ReactQuill
          theme="snow"
          value={editorValue}
          onChange={handleChange}
          placeholder={placeholder}
          modules={modules}
          formats={formats}
          style={{
            height: `${height}px`,
          }}
        />
      </Suspense>
    </div>
  );
};

export default LazyRichTextEditor;

