## Image Upload in Admin Product Management

This guide shows how to organize and wire up image uploads in the admin product workflow using the existing `/api/images/*` endpoints and RTK Query hooks.

### Why use uploads instead of manual URLs?
- **Better UX**: drag-and-drop, preview, progress.
- **Consistent URLs**: server returns canonical `/uploads/...` or CDN links.
- **Future-proof**: storage backend can be swapped (e.g., S3/GCS) without UI changes.

### Endpoints used
- POST `/api/images/upload` (single file, multipart field `image`)
- POST `/api/images/upload-multiple` (multipart field `images[]`)
- POST `/api/images/convert/base64` (JSON; for rich-text editor embedded images)

### Hooks available
From `fe/src/services/imageApi.ts`:

```ts
const [uploadImage, { isLoading: isUploading }] = useUploadImageMutation();
const [uploadMultipleImages, { isLoading: isUploadingMany }] = useUploadMultipleImagesMutation();
const [convertBase64ToImage] = useConvertBase64ToImageMutation();
```

### Recommended folder structure
- `src/components/upload/` — Reusable upload UI (dropzone/button/preview list)
- `src/services/imageApi.ts` — RTK Query (already present)
- `src/utils/descriptionImageProcessor.ts` — base64 handling (already present)
- `src/components/product/ProductImagesForm.tsx` — Integrate uploader into product form

### Minimal uploader component (example)
Use Ant Design Upload or any dropzone; on success, push returned `data.url` into the form’s `images` field.

```tsx
// src/components/upload/ImageUploader.tsx
import React, { useState } from 'react';
import { Upload, Button, List, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useUploadMultipleImagesMutation } from '@/services/imageApi';

type Props = { productId?: string; onUrlsChange: (urls: string[]) => void };

export default function ImageUploader({ productId, onUrlsChange }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadMany, { isLoading }] = useUploadMultipleImagesMutation();

  const onUpload = async () => {
    if (!files.length) return;
    try {
      const res = await uploadMany({ files, options: { category: 'product', productId } }).unwrap();
      const urls = res.data.successful.map((x) => x.url);
      onUrlsChange(urls);
      setFiles([]);
      message.success(`Uploaded ${urls.length} image(s)`);
    } catch (e: any) {
      message.error(e?.data?.message || 'Upload failed');
    }
  };

  return (
    <div>
      <Upload
        multiple
        beforeUpload={(file) => {
          setFiles((prev) => [...prev, file]);
          return false; // prevent auto-upload, we control it
        }}
        fileList={files.map((f) => ({ uid: f.name, name: f.name } as any))}
        onRemove={(file) => {
          setFiles((prev) => prev.filter((f) => f.name !== file.name));
        }}
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
        maxCount={10}
      >
        <Button icon={<UploadOutlined />}>Select Images</Button>
      </Upload>
      <Button type="primary" onClick={onUpload} loading={isLoading} disabled={!files.length} style={{ marginTop: 8 }}>
        Upload
      </Button>
      <List size="small" dataSource={files} renderItem={(f) => <List.Item>{f.name}</List.Item>} />
    </div>
  );
}
```

### Integrate into `ProductImagesForm`
Replace manual textarea entry with the uploader but still allow paste-as-URL as fallback.

```tsx
// In ProductImagesForm.tsx
import ImageUploader from '@/components/upload/ImageUploader';

// inside the component
<Form.Item label="Tải ảnh" tooltip="Tối đa 10 ảnh, 10MB mỗi ảnh">
  <ImageUploader
    productId={form.getFieldValue('id')}
    onUrlsChange={(urls) => {
      const current: string = form.getFieldValue('images') || '';
      const merged = Array.from(new Set([...(current ? current.split('\n') : []), ...urls]));
      form.setFieldsValue({ images: merged.join('\n') });
    }}
  />
  {/* keep existing TextArea below as optional manual input */}
  <Form.Item name="images" label="Hoặc dán URL (mỗi dòng một URL)">
    <TextArea rows={6} />
  </Form.Item>
  <Form.Item name="thumbnail" label="Ảnh đại diện">
    <Input />
  </Form.Item>
}</Form.Item>
```

### Rich-text description images
If the editor inserts base64 images, convert them before product submit (already wired in `EditProductPage`). Example usage:

```ts
const result = await convertBase64ToImage({
  base64Data,
  options: { category: 'product', productId: id },
}).unwrap();
// Replace <img src="data:..."> with result.data.url
```

### Error handling & limits
- Enforce allowed mime types and max size (10MB) client-side where possible.
- Surface server messages from 400 responses to the user.
- For large batches, show per-file success/failure using `data.failed`.

### Auth
- All mutating endpoints require auth; ensure your base API attaches the bearer token. No need to set multipart headers manually; the browser handles it.

### Deployment notes
- Dev: backend serves `/uploads`; URLs look like `http://localhost:8888/uploads/...`.
- Prod: point imageService to object storage (S3/GCS) and return public/CDN URLs without changing this UI.
- Consider adding a small rate limiter to `/images/upload*`.

### Testing checklist
- Upload single and multiple; verify thumbnails and returned URLs.
- Paste multiple files, remove one before upload; confirm only remaining upload.
- Add images via uploader then submit product; ensure URLs persist.
- Paste base64 image in description; verify it converts to a URL on save.


