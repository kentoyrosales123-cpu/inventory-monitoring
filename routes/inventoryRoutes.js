const express = require("express");
const {
  createInventory,
  getInventory,
  updateStock,
  getLowStock,
  getInventoryHistory,
} = require("../controllers/inventoryController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, adminOnly, createInventory);
router.get("/", protect, getInventory);
router.get("/low-stock", protect, getLowStock);
router.get("/history", protect, getInventoryHistory);
router.put("/:id/stock", protect, updateStock);

module.exports = router;
