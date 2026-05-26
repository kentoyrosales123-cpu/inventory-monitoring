const express = require("express");
const router = express.Router();

const {
  createInventory,
  getInventory,
  updateStock,
} = require("../controllers/inventoryController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

// Get inventory
router.get("/", protect, getInventory);

// Create inventory
router.post("/", protect, adminOnly, createInventory);

// Update stock
router.put("/:id/stock", protect, updateStock);

module.exports = router;
