const express = require('express');
const {
  getAllWarrantyPackages,
  createWarrantyPackage,
  updateWarrantyPackage,
  deleteWarrantyPackage,
  getWarrantyPackageById,
  getWarrantyPackagesByProduct,
} = require('../controllers/warrantyPackageController');
const { authenticate } = require('../middlewares/authenticate');
const { adminAuthenticate } = require('../middlewares/adminAuth');

const router = express.Router();

// Public routes
router.get('/', getAllWarrantyPackages);
router.get('/product/:productId', getWarrantyPackagesByProduct);
router.get('/:id', getWarrantyPackageById);

// Admin routes
router.post('/', adminAuthenticate, createWarrantyPackage);
router.put('/:id', adminAuthenticate, updateWarrantyPackage);
router.delete('/:id', adminAuthenticate, deleteWarrantyPackage);

module.exports = router;
