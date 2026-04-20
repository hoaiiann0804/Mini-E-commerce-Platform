const {
  AttributeGroup,
  AttributeValue,
  ProductAttributeGroup,
  Product,
} = require("../models");
const productNameGeneratorService = require("../services/productNameGenerator.service");

// Get all attribute groups with their values
const getAttributeGroups = async (req, res) => {
  try {
    const attributeGroups = await AttributeGroup.findAll({
      include: [
        {
          model: AttributeValue,
          as: "values",
          where: { isActive: true },
          required: false,
          order: [
            ["sortOrder", "ASC"],
            ["name", "ASC"],
          ],
        },
      ],
      where: { isActive: true },
      order: [
        ["sortOrder", "ASC"],
        ["name", "ASC"],
      ],
    });

    res.json({
      success: true,
      data: attributeGroups,
    });
  } catch (error) {
    console.error("Error fetching attribute groups:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch attribute groups",
      error: error.message,
    });
  }
};

// Get attribute groups for a specific product
const getProductAttributeGroups = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findByPk(productId, {
      include: [
        {
          model: AttributeGroup,
          as: "attributeGroups",
          through: {
            attributes: ["isRequired", "sortOrder"],
          },
          include: [
            {
              model: AttributeValue,
              as: "values",
              where: { isActive: true },
              required: false,
              order: [
                ["sortOrder", "ASC"],
                ["name", "ASC"],
              ],
            },
          ],
          where: { isActive: true },
          required: false,
        },
      ],
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      data: product.attributeGroups,
    });
  } catch (error) {
    console.error("Error fetching product attribute groups:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product attribute groups",
      error: error.message,
    });
  }
};

// Create new attribute group
const createAttributeGroup = async (req, res) => {
  try {
    const { name, description, type, isRequired, sortOrder } = req.body;

    const attributeGroup = await AttributeGroup.create({
      name,
      description,
      type,
      isRequired,
      sortOrder,
    });

    res.status(201).json({
      success: true,
      data: attributeGroup,
      message: "Attribute group created successfully",
    });
  } catch (error) {
    console.error("Error creating attribute group:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create attribute group",
      error: error.message,
    });
  }
};

// Add attribute value to group
const addAttributeValue = async (req, res) => {
  try {
    const { attributeGroupId } = req.params;
    const {
      name,
      value,
      colorCode,
      imageUrl,
      priceAdjustment,
      sortOrder,
      affectsName,
      nameTemplate,
    } = req.body;

    const attributeValue = await AttributeValue.create({
      attributeGroupId,
      name,
      value,
      colorCode,
      imageUrl,
      priceAdjustment,
      sortOrder,
      affectsName: affectsName || false,
      nameTemplate,
    });

    res.status(201).json({
      success: true,
      data: attributeValue,
      message: "Attribute value added successfully",
    });
  } catch (error) {
    console.error("Error adding attribute value:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add attribute value",
      error: error.message,
    });
  }
};

// Assign attribute group to product
const assignAttributeGroupToProduct = async (req, res) => {
  try {
    const { productId, attributeGroupId } = req.params;
    const { isRequired, sortOrder } = req.body;

    const assignment = await ProductAttributeGroup.create({
      productId,
      attributeGroupId,
      isRequired,
      sortOrder,
    });

    res.status(201).json({
      success: true,
      data: assignment,
      message: "Attribute group assigned to product successfully",
    });
  } catch (error) {
    console.error("Error assigning attribute group to product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to assign attribute group to product",
      error: error.message,
    });
  }
};

// Update attribute group
const updateAttributeGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, type, isRequired, sortOrder, isActive } =
      req.body;

    const attributeGroup = await AttributeGroup.findByPk(id);
    if (!attributeGroup) {
      return res.status(404).json({
        success: false,
        message: "Attribute group not found",
      });
    }

    await attributeGroup.update({
      name,
      description,
      type,
      isRequired,
      sortOrder,
      isActive,
    });

    res.json({
      success: true,
      data: attributeGroup,
      message: "Attribute group updated successfully",
    });
  } catch (error) {
    console.error("Error updating attribute group:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update attribute group",
      error: error.message,
    });
  }
};

// Update attribute value
const updateAttributeValue = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      value,
      colorCode,
      imageUrl,
      priceAdjustment,
      sortOrder,
      isActive,
      affectsName,
      nameTemplate,
    } = req.body;

    const attributeValue = await AttributeValue.findByPk(id);
    if (!attributeValue) {
      return res.status(404).json({
        success: false,
        message: "Attribute value not found",
      });
    }

    await attributeValue.update({
      name,
      value,
      colorCode,
      imageUrl,
      priceAdjustment,
      sortOrder,
      isActive,
      affectsName,
      nameTemplate,
    });

    res.json({
      success: true,
      data: attributeValue,
      message: "Attribute value updated successfully",
    });
  } catch (error) {
    console.error("Error updating attribute value:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update attribute value",
      error: error.message,
    });
  }
};

// Delete attribute group
const deleteAttributeGroup = async (req, res) => {
  try {
    const { id } = req.params;

    const attributeGroup = await AttributeGroup.findByPk(id);
    if (!attributeGroup) {
      return res.status(404).json({
        success: false,
        message: "Attribute group not found",
      });
    }

    await attributeGroup.update({ isActive: false });

    res.json({
      success: true,
      message: "Attribute group deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting attribute group:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete attribute group",
      error: error.message,
    });
  }
};

// Delete attribute value
const deleteAttributeValue = async (req, res) => {
  try {
    const { id } = req.params;

    const attributeValue = await AttributeValue.findByPk(id);
    if (!attributeValue) {
      return res.status(404).json({
        success: false,
        message: "Attribute value not found",
      });
    }

    await attributeValue.update({ isActive: false });

    res.json({
      success: true,
      message: "Attribute value deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting attribute value:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete attribute value",
      error: error.message,
    });
  }
};

// Preview product name with selected attributes
const previewProductName = async (req, res) => {
  try {
    const { baseName, selectedAttributes, separator, includeDetails } =
      req.body;

    if (!baseName) {
      return res.status(400).json({
        success: false,
        message: "Base name is required",
      });
    }

    const preview = await productNameGeneratorService.previewProductName(
      baseName,
      selectedAttributes || [],
      {
        separator: separator || " ",
        includeDetails: includeDetails || false,
      }
    );

    res.json({
      success: true,
      data: preview,
      message: "Product name preview generated successfully",
    });
  } catch (error) {
    console.error("Error previewing product name:", error);
    res.status(500).json({
      success: false,
      message: "Failed to preview product name",
      error: error.message,
    });
  }
};

// Get attributes that affect product names
const getNameAffectingAttributes = async (req, res) => {
  try {
    const { productId } = req.query;

    const attributes =
      await productNameGeneratorService.getNameAffectingAttributes(productId);

    res.json({
      success: true,
      data: attributes,
      message: "Name affecting attributes retrieved successfully",
    });
  } catch (error) {
    console.error("Error getting name affecting attributes:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get name affecting attributes",
      error: error.message,
    });
  }
};

// Batch generate product names
const batchGenerateProductNames = async (req, res) => {
  try {
    const { items, separator } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: "Items must be an array",
      });
    }

    const results = await productNameGeneratorService.batchGenerateNames(
      items,
      separator || " "
    );

    res.json({
      success: true,
      data: results,
      message: "Product names generated successfully",
    });
  } catch (error) {
    console.error("Error batch generating product names:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate product names",
      error: error.message,
    });
  }
};

// Real-time name generation for dynamic forms
const generateNameRealTime = async (req, res) => {
  try {
    const { baseName, attributeValues, productId } = req.body;

    if (!baseName) {
      return res.status(400).json({
        success: false,
        message: "Base name is required",
      });
    }

    // Convert attributeValues object to array of IDs
    const selectedAttributes = Array.isArray(attributeValues)
      ? attributeValues
      : Object.values(attributeValues || {}).filter((id) => id);

    const preview = await productNameGeneratorService.previewProductName(
      baseName,
      selectedAttributes,
      {
        separator: " ",
        includeDetails: true,
      }
    );

    // Also get suggested attribute combinations if productId provided
    let suggestions = [];
    if (productId) {
      // Get popular attribute combinations for this product type
      suggestions = await getPopularAttributeCombinations(productId);
    }

    res.json({
      success: true,
      data: {
        ...preview,
        suggestions,
        timestamp: new Date().toISOString(),
      },
      message: "Real-time name generated successfully",
    });
  } catch (error) {
    console.error("Error generating real-time name:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate real-time name",
      error: error.message,
    });
  }
};

// Helper function to get popular attribute combinations
async function getPopularAttributeCombinations(productId) {
  try {
    const { ProductVariant } = require("../models");

    // Get existing variants for this product to suggest popular combinations
    const existingVariants = await ProductVariant.findAll({
      where: { productId },
      attributes: ["attributeValues", "displayName", "name"],
      limit: 10,
      order: [["createdAt", "DESC"]],
    });

    return existingVariants.map((variant) => ({
      attributeValues: variant.attributeValues,
      displayName: variant.displayName,
      fullName: variant.name,
    }));
  } catch (error) {
    //console.log('Could not get popular combinations:', error.message);
    return [];
  }
}

module.exports = {
  getAttributeGroups,
  getProductAttributeGroups,
  createAttributeGroup,
  addAttributeValue,
  assignAttributeGroupToProduct,
  updateAttributeGroup,
  updateAttributeValue,
  deleteAttributeGroup,
  deleteAttributeValue,
  // New endpoints for name generation
  previewProductName,
  getNameAffectingAttributes,
  batchGenerateProductNames,
  generateNameRealTime,
};
