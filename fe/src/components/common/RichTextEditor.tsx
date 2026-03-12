import React, { useMemo, useEffect, useState, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  height?: number;
  readonly?: boolean;
  // Add support for Ant Design Form.Item
  style?: React.CSSProperties;
  className?: string;
}

// Utility function to convert base64 strings to proper img tags
const convertBase64ToImages = (content: string): string => {
  if (!content) return '';

  let convertedContent = content;

  // Find all base64 image data URLs
  const base64Pattern = /data:image\/[a-zA-Z]*;base64,[A-Za-z0-9+/=]+/g;

  // Replace each base64 string with an img tag if it's not already wrapped
  convertedContent = convertedContent.replace(base64Pattern, (match) => {
    // Check if this base64 is already inside an img tag
    const beforeMatch = convertedContent.substring(
      0,
      convertedContent.indexOf(match)
    );
    const afterMatch = convertedContent.substring(
      convertedContent.indexOf(match) + match.length
    );

    // Simple check: if we have <img before and > after, it's likely already wrapped
    if (
      beforeMatch.includes('<img') &&
      beforeMatch.lastIndexOf('<img') > beforeMatch.lastIndexOf('>')
    ) {
      return match; // Already wrapped
    }

    // Not wrapped, so create an img tag
    return `<img src="${match}" alt="Product image" style="max-width: 100%; height: auto;" />`;
  });

  return convertedContent;
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value = '',
  onChange,
  placeholder = 'Nhập nội dung...',
  height = 200,
  readonly = false,
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const quillRef = useRef<ReactQuill>(null);

  // Effect to convert base64 images when value changes
  useEffect(() => {
    console.log('RichTextEditor - Props received:', { value, readonly });
    console.log('RichTextEditor - Original value:', value);
    const converted = convertBase64ToImages(value);
    console.log('RichTextEditor - Converted value:', converted);
    setDisplayValue(converted);
  }, [value]);

  // Effect to inject HTML content into Quill editor when it's ready
  useEffect(() => {
    if (!readonly && displayValue && quillRef.current) {
      const timer = setTimeout(() => {
        const quill = quillRef.current?.getEditor();
        if (quill) {
          if (displayValue.includes('<img')) {
            console.log('Injecting HTML content into Quill for edit mode...');
            // Clear the editor first
            quill.setText('');
            // Then paste the HTML content
            quill.clipboard.dangerouslyPasteHTML(displayValue);
          } else {
            // For plain text, use setText
            quill.setText(displayValue);
          }
        }
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [displayValue, readonly]);

  const handleChange = (content: string) => {
    setDisplayValue(content);
    if (onChange) {
      onChange(content);
    }
  };

  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],
        ['link', 'image'],
        ['clean'],
      ],
      clipboard: {
        matchVisual: false,
      },
    }),
    []
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

  // If readonly and contains images, use dangerouslySetInnerHTML for proper display
  if (readonly && displayValue.includes('<img')) {
    return (
      <div className="rich-text-editor readonly-mode">
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
          }
          .readonly-mode .ql-editor p {
            margin-bottom: 10px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="rich-text-editor">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={displayValue.includes('<img') ? '' : displayValue}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={readonly}
        style={{ height: `${height}px`, marginBottom: '50px' }}
      />
      <style>{`
        .rich-text-editor .ql-editor {
          min-height: ${height - 42}px;
        }
        .rich-text-editor .ql-toolbar {
          border-top: 1px solid #ccc;
          border-left: 1px solid #ccc;
          border-right: 1px solid #ccc;
        }
        .rich-text-editor .ql-container {
          border-bottom: 1px solid #ccc;
          border-left: 1px solid #ccc;
          border-right: 1px solid #ccc;
        }
        .rich-text-editor .ql-editor img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 10px 0;
        }
        .rich-text-editor .ql-editor p {
          margin-bottom: 10px;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
