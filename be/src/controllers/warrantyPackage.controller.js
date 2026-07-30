const { WarrantyPackage, ProductWarranty, Product } = require('../models');
const { validationResult } = require('express-validator');

// Get all warranty packages
exports.getAllWarrantyPackages = async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    const { count, rows } = await WarrantyPackage.findAndCountAll({
      where: whereClause,
      order: [
        ['sortOrder', 'ASC'],
        ['createdAt', 'ASC'],
      ],
      offset: parseInt(offset),
      limit: parseInt(limit),
    });

    res.json({
      status: 'success',
      data: {
        warrantyPackages: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching warranty packages:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
    });
  }
};

// Get warranty packages by product ID
exports.getWarrantyPackagesByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    // Check if product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found',
      });
    }

    // Get warranty packages for this product
    const productWarranties = await ProductWarranty.findAll({
      where: { productId },
      include: [
        {
          model: WarrantyPackage,
          as: 'warrantyPackage',
          where: { isActive: true },
        },
      ],
      order: [
        [{ model: WarrantyPackage, as: 'warrantyPackage' }, 'sortOrder', 'ASC'],
        [{ model: WarrantyPackage, as: 'warrantyPackage' }, 'price', 'ASC'],
      ],
    });

    // Extract warranty packages with default info
    const warrantyPackages = productWarranties.map((pw) => ({
      ...pw.warrantyPackage.toJSON(),
      isDefault: pw.isDefault,
    }));

    res.json({
      status: 'success',
      data: {
        warrantyPackages,
        productId,
      },
    });
  } catch (error) {
    console.error('Error fetching warranty packages for product:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
    });
  }
};

// Get warranty package by ID
exports.getWarrantyPackageById = async (req, res) => {
  try {
    const { id } = req.params;

    const warrantyPackage = await WarrantyPackage.findByPk(id);

    if (!warrantyPackage) {
      return res.status(404).json({
        status: 'error',
        message: 'Warranty package not found',
      });
    }

    res.json({
      status: 'success',
      data: warrantyPackage,
    });
  } catch (error) {
    console.error('Error fetching warranty package:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
    });
  }
};

// Create warranty package
exports.createWarrantyPackage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: errors.array(),
      });
    }

    const {
      name,
      description,
      durationMonths,
      price,
      terms,
      coverage,
      isActive = true,
      sortOrder = 0,
    } = req.body;

    const warrantyPackage = await WarrantyPackage.create({
      name,
      description,
      durationMonths,
      price,
      terms,
      coverage,
      isActive,
      sortOrder,
    });

    res.status(201).json({
      status: 'success',
      data: warrantyPackage,
    });
  } catch (error) {
    console.error('Error creating warranty package:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
    });
  }
};

// Update warranty package
exports.updateWarrantyPackage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const {
      name,
      description,
      durationMonths,
      price,
      terms,
      coverage,
      isActive,
      sortOrder,
    } = req.body;

    const warrantyPackage = await WarrantyPackage.findByPk(id);

    if (!warrantyPackage) {
      return res.status(404).json({
        status: 'error',
        message: 'Warranty package not found',
      });
    }

    await warrantyPackage.update({
      name,
      description,
      durationMonths,
      price,
      terms,
      coverage,
      isActive,
      sortOrder,
    });

    res.json({
      status: 'success',
      data: warrantyPackage,
    });
  } catch (error) {
    console.error('Error updating warranty package:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
    });
  }
};

// Delete warranty package
exports.deleteWarrantyPackage = async (req, res) => {
  try {
    const { id } = req.params;

    const warrantyPackage = await WarrantyPackage.findByPk(id);

    if (!warrantyPackage) {
      return res.status(404).json({
        status: 'error',
        message: 'Warranty package not found',
      });
    }

    // Check if warranty package is being used
    const isUsed = await ProductWarranty.findOne({
      where: { warrantyPackageId: id },
    });

    if (isUsed) {
      return res.status(400).json({
        status: 'error',
        message:
          'Cannot delete warranty package that is being used by products',
      });
    }

    await warrantyPackage.destroy();

    res.json({
      status: 'success',
      message: 'Warranty package deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting warranty package:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
    });
  }
};
