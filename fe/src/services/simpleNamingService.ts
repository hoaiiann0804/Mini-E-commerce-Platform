// Simple Progressive Product Naming Service
export interface NameTemplate {
  baseName: string;
  selectedAttributes: Record<string, string>;
  attributePriority?: string[]; // Thứ tự ưu tiên trong tên
  separator?: string;
}

export interface SimpleNamingResponse {
  originalName: string;
  generatedName: string;
  hasChanges: boolean;
  addedParts: string[];
}

class SimpleNamingService {
  // Default attribute priority for naming
  private defaultPriority = ['CPU', 'GPU', 'RAM', 'Storage', 'Color', 'Size'];

  // Attribute name mapping to short names
  private nameTemplates: Record<string, Record<string, string>> = {
    CPU: {
      // Full CPU names
      'Intel Core i3-13100': 'i3',
      'Intel Core i5-13500H': 'i5',
      'Intel Core i7-13700H': 'i7',
      'Intel Core i9-13900H': 'i9',
      'AMD Ryzen 5 7600U': 'R5',
      'AMD Ryzen 7 7800U': 'R7',
      'AMD Ryzen 9 7900U': 'R9',
      // Short CPU codes (exact API values)
      i3: 'i3',
      i5: 'i5',
      i7: 'i7',
      i8: 'i8',
      i9: 'i9',
    },
    GPU: {
      'Integrated Graphics': '', // Don't add to name
      'NVIDIA RTX 4050': 'RTX4050',
      'NVIDIA RTX 4060': 'RTX4060',
      'NVIDIA RTX 4070': 'RTX4070',
      'NVIDIA RTX 4080': 'RTX4080',
      'AMD Radeon RX 7600M': 'RX7600M',
      'AMD Radeon RX 7700M': 'RX7700M',
    },
    RAM: {
      '8GB DDR4': '8GB',
      '16GB DDR4': '16GB',
      '32GB DDR4': '32GB',
      '8GB DDR5': '8GB',
      '16GB DDR5': '16GB',
      '32GB DDR5': '32GB',
      '64GB DDR5': '64GB',
    },
    Storage: {
      '256GB SSD': '256GB',
      '512GB SSD': '512GB',
      '1TB SSD': '1TB',
      '2TB SSD': '2TB',
    },
  };

  /**
   * Generate product name progressively - Simple approach
   * Just append selected attribute values to the base name
   */
  generateName(config: NameTemplate): SimpleNamingResponse {
    const { baseName, selectedAttributes, separator = ' ' } = config;

    const addedParts: string[] = [];
    const nameParts = [baseName.trim()];

    // Simply append all selected attribute values nếu trong baseName chưa có sẵn
    Object.entries(selectedAttributes).forEach(([attrName, attrValue]) => {
      if (attrValue && attrValue.trim() !== '') {
        const val = attrValue.trim();
        // Kiểm tra tránh trùng lặp từ khóa đã có sẵn trong tên gốc
        const regex = new RegExp(`\\b${val}\\b`, 'i');
        if (!regex.test(baseName)) {
          nameParts.push(val);
        }
        addedParts.push(`${attrName}: ${val}`);
      }
    });

    const generatedName = nameParts.join(separator);

    return {
      originalName: baseName,
      generatedName,
      hasChanges: addedParts.length > 0,
      addedParts,
    };
  }

  /**
   * Add new attribute to existing name
   */
  addAttribute(
    currentName: string,
    baseName: string,
    newAttribute: { type: string; value: string },
    selectedAttributes: Record<string, string>
  ): SimpleNamingResponse {
    // Update selected attributes
    const updatedAttributes = {
      ...selectedAttributes,
      [newAttribute.type]: newAttribute.value,
    };

    // Regenerate full name to maintain priority order
    return this.generateName({
      baseName,
      selectedAttributes: updatedAttributes,
    });
  }

  /**
   * Remove attribute from name
   */
  removeAttribute(
    currentName: string,
    baseName: string,
    attributeType: string,
    selectedAttributes: Record<string, string>
  ): SimpleNamingResponse {
    // Remove attribute from selection
    const updatedAttributes = { ...selectedAttributes };
    delete updatedAttributes[attributeType];

    // Regenerate name
    return this.generateName({
      baseName,
      selectedAttributes: updatedAttributes,
    });
  }

  /**
   * Get available name templates for attribute type
   */
  getNameTemplates(attributeType: string): Record<string, string> {
    return this.nameTemplates[attributeType] || {};
  }

  /**
   * Register new name template
   */
  registerNameTemplate(
    attributeType: string,
    valueToNameMap: Record<string, string>
  ) {
    this.nameTemplates[attributeType] = {
      ...this.nameTemplates[attributeType],
      ...valueToNameMap,
    };
  }

  /**
   * Preview name without updating state
   */
  previewName(
    baseName: string,
    potentialAttributes: Record<string, string>
  ): string {
    const result = this.generateName({
      baseName,
      selectedAttributes: potentialAttributes,
    });
    return result.generatedName;
  }
}

export const simpleNamingService = new SimpleNamingService();
export default simpleNamingService;
