import React from 'react';
import { Form } from 'antd';
import ProductBasicInfoForm from './components/product/ProductBasicInfoForm';

const TestBasicForm: React.FC = () => {
  const [form] = Form.useForm();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Test ProductBasicInfoForm</h1>

      <Form form={form}>
        <ProductBasicInfoForm
          fillExampleData={() => //console.log('Fill example data')}
          productId="test-id"
        />
      </Form>
    </div>
  );
};

export default TestBasicForm;
