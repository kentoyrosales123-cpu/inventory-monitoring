const express = require("express");
const {
  createRefillRequest,
  getRefillRequests,
  updateRefillStatus,
} = require("../controllers/refillRequestController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createRefillRequest);
router.get("/", protect, getRefillRequests);
router.put("/:id/status", protect, adminOnly, updateRefillStatus);

module.exports = router;
