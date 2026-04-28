const express = require('express');
const router = express.Router();
const attributeController = require('../controllers/attributeController');
const { authenticate } = require('../middlewares/authenticate');
const { authorize } = require('../middlewares/authorize');

// Public routes (for frontend product display)
router.get('/groups', attributeController.getAttributeGroups);
router.get(
  '/products/:productId/groups',
  attributeController.getProductAttributeGroups
);

// Product name generation routes (public for frontend use)
router.post('/preview-name', attributeController.previewProductName);
router.post(
  '/generate-name-realtime',
  attributeController.generateNameRealTime
);
router.get('/name-affecting', attributeController.getNameAffectingAttributes);

// Admin routes (require authentication and admin role)
router.use(authenticate);
router.use(authorize(['admin']));

// Attribute groups management
router.post('/groups', attributeController.createAttributeGroup);
router.put('/groups/:id', attributeController.updateAttributeGroup);
router.delete('/groups/:id', attributeController.deleteAttributeGroup);

// Attribute values management
router.post(
  '/groups/:attributeGroupId/values',
  attributeController.addAttributeValue
);
router.put('/values/:id', attributeController.updateAttributeValue);
router.delete('/values/:id', attributeController.deleteAttributeValue);

// Product attribute group assignments
router.post(
  '/products/:productId/groups/:attributeGroupId',
  attributeController.assignAttributeGroupToProduct
);

// Admin-only batch name generation
router.post(
  '/batch-generate-names',
  attributeController.batchGenerateProductNames
);

module.exports = router;
