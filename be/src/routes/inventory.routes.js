const router = require("express").Router();
const inventoryController = require("../controllers/inventory.controller");
const { adminAuthenticate } = require("../middlewares/adminAuth");

router.use(adminAuthenticate);

router.get("/stock", inventoryController.getStock);
router.get("/transactions", inventoryController.getTransactions);
router.get("/stats", inventoryController.getStats);
router.post("/transactions", inventoryController.createTransaction);

module.exports = router;
