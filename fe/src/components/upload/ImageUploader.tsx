import React from 'react'
import { Upload, message, List, Button } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useUploadMultipleImagesMutation } from '@/services/imageApi'

type Props = {
  productId?: string;
  onUrlsChange: (urls: string[]) => void}
const ImageUploader = ({productId, onUrlsChange}: Props) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadMany , {isLoading}] = useUploadMultipleImagesMutation()

  const onUpload = async ()=>{
    if(!files.length) return;
    try{
      const res = await uploadMany({
        files, options: {category: 'product', productId}
      }).unwrap();
      const urls = res.data.successful.map(item=>item.url)
      onUrlsChange(urls);
      setFiles([]);
      message.success(`Uploaded ${urls.length} images`)
    

    }
    catch(err: any)
    {
      message.error(err?.data?.message || 'Failed to upload images')

    }
  }
  return (
    <div>
      <Upload
      multiple
      beforeUpload={(file)=>{
        setFiles((prev)=>[...prev, file])
        return false; // prevent auto - uploaf, we control it
      }}
      fileList={files.map((f)=>({uid: f.name, name: f.name} as any))}
      onRemove={(file)=>{
        setFiles((prev)=>prev.filter((f)=>f.name !== file.name))
      }}
      accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
      maxCount={10}
      >
        <Button icon={<UploadOutlined />}>Select Images</Button>

      </Upload>
      <Button type='primary' onClick={onUpload} loading={isLoading} disabled={!files.length} style={{marginTop: 8}}>
        Upload Images
      </Button>
      <List size='small' dataSource={files} renderItem={(f)=><List.Item>{f.name}</List.Item>}/>
    </div>
  )
}

export default ImageUploader