import React from 'react';
import { Form } from 'antd';
import ProductWarrantySection from '@/components/product/ProductWarrantyForm';

const ProductWarrantyForm: React.FC = () => {
  const form = Form.useFormInstance();
  return <ProductWarrantySection form={form} />;
};

export default ProductWarrantyForm;
