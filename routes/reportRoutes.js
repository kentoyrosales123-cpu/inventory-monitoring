const express = require("express");
const {
  getDashboardStats,
  getInventoryReport,
  downloadInventoryExcel,
} = require("../controllers/reportController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/dashboard", protect, getDashboardStats);
router.get("/inventory", protect, getInventoryReport);
router.get("/inventory/excel", protect, downloadInventoryExcel);

module.exports = router;
