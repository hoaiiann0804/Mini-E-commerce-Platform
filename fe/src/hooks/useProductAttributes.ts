import { useState } from 'react';
import { ProductAttribute } from '@/types/product';

// Attribute type from the modal (uses 'value' as string)
interface Attribute {
  id?: string;
  name: string;
  value: string;
}

export const useProductAttributes = (
  initialAttributes: ProductAttribute[] = []
) => {
  const [attributes, setAttributes] =
    useState<ProductAttribute[]>(initialAttributes);
  const [attributeModalVisible, setAttributeModalVisible] = useState(false);
  const [editingAttribute, setEditingAttribute] =
    useState<ProductAttribute | null>(null);

  // Convert Attribute (modal) to ProductAttribute (internal)
  const convertToProductAttribute = (attr: Attribute): ProductAttribute => {
    // Convert comma-separated string to array
    const values = attr.value
      ? attr.value.split(',').map(v => v.trim()).filter(v => v)
      : [];
    
    return {
      id: attr.id || '',
      productId: '',
      name: attr.name,
      value: attr.value, // Keep the string version for form/modal compatibility
      values: values,    // Store array version for backend compatibility
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  // Convert ProductAttribute to Attribute for modal
  const convertToAttribute = (attr: ProductAttribute): Attribute => {
    return {
      id: attr.id,
      name: attr.name,
      value: attr.value || attr.values.join(', '),
    };
  };

  // Attribute handlers
  const handleAddAttribute = (attribute: Attribute) => {
    //console.log('handleAddAttribute called with:', attribute);

    // Convert Attribute to ProductAttribute
    const productAttr = convertToProductAttribute(attribute);

    if (editingAttribute) {
      // Cập nhật thuộc tính đã tồn tại
      const updatedAttributes = attributes.map((attr) =>
        attr.id === editingAttribute.id
          ? { ...productAttr, id: editingAttribute.id }
          : attr
      );
      //console.log(
        'Updating existing attribute. New attributes array:',
        updatedAttributes
      );
      setAttributes(updatedAttributes);
    } else {
      // Thêm thuộc tính mới
      const newId = `attr-${attributes.length}-${Math.random().toString(36).substring(2, 9)}`;
      const newAttributes = [
        ...attributes,
        { ...productAttr, id: productAttr.id || newId },
      ];
      //console.log('Adding new attribute. New attributes array:', newAttributes);
      setAttributes(newAttributes);
    }

    // Lưu vào localStorage để debug
    localStorage.setItem('current_attributes', JSON.stringify(attributes));

    setAttributeModalVisible(false);
    setEditingAttribute(null);
  };

  const handleDeleteAttribute = (id: string) => {
    setAttributes(attributes.filter((attr) => attr.id !== id));
  };

  const openAttributeModal = (attribute?: ProductAttribute) => {
    // Convert ProductAttribute to Attribute for the modal
    const attrForModal = attribute ? convertToAttribute(attribute) : undefined;
    setEditingAttribute(attribute || null);
    setAttributeModalVisible(true);
  };

  const closeAttributeModal = () => {
    setAttributeModalVisible(false);
    setEditingAttribute(null);
  };

  // Get editing attribute converted for modal
  const getEditingAttributeForModal = (): Attribute | null | undefined => {
    if (!editingAttribute) return undefined;
    return convertToAttribute(editingAttribute);
  };

  return {
    attributes,
    setAttributes,
    attributeModalVisible,
    editingAttribute,
    editingAttributeForModal: getEditingAttributeForModal(),
    handleAddAttribute,
    handleDeleteAttribute,
    openAttributeModal,
    closeAttributeModal,
  };
};
