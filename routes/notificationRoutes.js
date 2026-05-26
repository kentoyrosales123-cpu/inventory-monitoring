const express = require("express");

const {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
} = require("../controllers/notificationController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getNotifications);

router.put("/read-all", protect, markAllNotificationsAsRead);

router.put("/:id/read", protect, markNotificationAsRead);

router.delete("/", protect, deleteAllNotifications);

router.delete("/:id", protect, deleteNotification);

module.exports = router;
