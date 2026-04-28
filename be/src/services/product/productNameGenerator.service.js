const { AttributeValue, AttributeGroup } = require("../../models");

// Define associations if they don't exist
if (!AttributeValue.associations.attributeGroup) {
  AttributeValue.belongsTo(AttributeGroup, {
    foreignKey: "attributeGroupId",
    as: "attributeGroup",
  });
}

if (!AttributeGroup.associations.values) {
  AttributeGroup.hasMany(AttributeValue, {
    foreignKey: "attributeGroupId",
    as: "values",
  });
}

/**
 * Service for generating dynamic product names based on selected attributes
 */
class ProductNameGeneratorService {
  /**
   * Generate product name based on base name and selected attribute values
   * @param {string} baseName - Base product name (e.g., "ThinkPad X1 Carbon")
   * @param {Array} selectedAttributes - Array of selected attribute value IDs
   * @param {string} separator - Separator between name parts (default: " ")
   * @returns {Promise<string>} Generated product name
   */
  async generateProductName(
    baseName,
    selectedAttributes = [],
    separator = " "
  ) {
    try {
      if (!baseName) {
        throw new Error("Base name is required");
      }

      if (!selectedAttributes.length) {
        return baseName;
      }

      // Get attribute values that affect the name
      const attributeValues = await AttributeValue.findAll({
        where: {
          id: selectedAttributes,
          affectsName: true,
          isActive: true,
        },
        include: [
          {
            model: AttributeGroup,
            as: "attributeGroup",
            attributes: ["name", "type", "sortOrder"],
          },
        ],
        order: [
          [{ model: AttributeGroup, as: "attributeGroup" }, "sortOrder", "ASC"],
          ["sortOrder", "ASC"],
        ],
      });

      if (!attributeValues.length) {
        return baseName;
      }

      // Build name parts
      const nameParts = [baseName];

      for (const attrValue of attributeValues) {
        const nameToAdd = attrValue.nameTemplate || attrValue.name;
        if (nameToAdd && nameToAdd.trim()) {
          nameParts.push(nameToAdd.trim());
        }
      }

      return nameParts.join(separator);
    } catch (error) {
      console.error("Error generating product name:", error);
      throw error;
    }
  }

  /**
   * Generate product name from attribute combinations (for variants)
   * @param {string} baseName - Base product name
   * @param {Object} attributesCombination - Object with attributeGroupId: attributeValueId pairs
   * @param {string} separator - Separator between name parts
   * @returns {Promise<string>} Generated product name
   */
  async generateVariantName(
    baseName,
    attributesCombination = {},
    separator = " "
  ) {
    try {
      const selectedAttributeIds = Object.values(attributesCombination).filter(
        (id) => id
      );
      return this.generateProductName(
        baseName,
        selectedAttributeIds,
        separator
      );
    } catch (error) {
      console.error("Error generating variant name:", error);
      throw error;
    }
  }

  /**
   * Preview product name without saving
   * @param {string} baseName - Base product name
   * @param {Array} selectedAttributes - Array of selected attribute value IDs
   * @param {Object} options - Options for name generation
   * @returns {Promise<Object>} Preview result with original and generated names
   */
  async previewProductName(baseName, selectedAttributes = [], options = {}) {
    try {
      const { separator = " ", includeDetails = false } = options;

      const generatedName = await this.generateProductName(
        baseName,
        selectedAttributes,
        separator
      );

      const result = {
        originalName: baseName,
        generatedName,
        hasChanges: generatedName !== baseName,
        parts: generatedName.split(separator),
      };

      if (includeDetails) {
        // Get details about which attributes affected the name
        const attributeValues = await AttributeValue.findAll({
          where: {
            id: selectedAttributes,
            affectsName: true,
            isActive: true,
          },
          include: [
            {
              model: AttributeGroup,
              as: "attributeGroup",
              attributes: ["id", "name", "type"],
            },
          ],
        });

        result.affectingAttributes = attributeValues.map((attr) => ({
          id: attr.id,
          name: attr.name,
          nameTemplate: attr.nameTemplate,
          groupName: attr.attributeGroup?.name,
          groupType: attr.attributeGroup?.type,
        }));
      }

      return result;
    } catch (error) {
      console.error("Error previewing product name:", error);
      throw error;
    }
  }

  /**
   * Get all attribute values that can affect product names
   * @param {string} productId - Product ID (optional, for product-specific attributes)
   * @returns {Promise<Array>} Array of attribute values that affect names
   */
  async getNameAffectingAttributes(productId = null) {
    try {
      const whereCondition = {
        affectsName: true,
        isActive: true,
      };

      const attributeValues = await AttributeValue.findAll({
        where: whereCondition,
        include: [
          {
            model: AttributeGroup,
            as: "attributeGroup",
            attributes: ["id", "name", "type", "description"],
            where: { isActive: true },
          },
        ],
        order: [
          [{ model: AttributeGroup, as: "attributeGroup" }, "sortOrder", "ASC"],
          ["sortOrder", "ASC"],
        ],
      });

      return attributeValues;
    } catch (error) {
      console.error("Error getting name affecting attributes:", error);
      throw error;
    }
  }

  /**
   * Batch generate names for multiple products/variants
   * @param {Array} items - Array of items with baseName and selectedAttributes
   * @param {string} separator - Separator between name parts
   * @returns {Promise<Array>} Array of generated names
   */
  async batchGenerateNames(items = [], separator = " ") {
    try {
      const results = [];

      for (const item of items) {
        const { baseName, selectedAttributes, id } = item;
        const generatedName = await this.generateProductName(
          baseName,
          selectedAttributes,
          separator
        );

        results.push({
          id,
          baseName,
          generatedName,
          selectedAttributes,
        });
      }

      return results;
    } catch (error) {
      console.error("Error batch generating names:", error);
      throw error;
    }
  }
}

module.exports = new ProductNameGeneratorService();
