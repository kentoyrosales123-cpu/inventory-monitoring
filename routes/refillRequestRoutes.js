const express = require("express");

const {
  createRefillRequest,
  getRefillRequests,
  updateRefillStatus,
  acknowledgeDelivery,
} = require("../controllers/refillRequestController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createRefillRequest);

router.get("/", protect, getRefillRequests);

// Admin only: Approve, Out for Delivery, Cancel
router.put("/:id/status", protect, adminOnly, updateRefillStatus);

// Branch/User: acknowledge received delivery
router.put("/:id/acknowledge", protect, acknowledgeDelivery);

module.exports = router;
