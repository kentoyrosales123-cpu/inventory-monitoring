const Notification = require("../models/Notification");

exports.getNotifications = async (req, res) => {
  try {
    const filter = {};

    if (req.user.role === "admin") {
      filter.recipientRole = "admin";
    } else {
      filter.recipientRole = "staff";
      filter.recipientBranch = req.user.assignedBranch;
    }

    const notifications = await Notification.find(filter)
      .populate("recipientBranch", "branchName")
      .populate("refillRequest")
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markNotificationAsRead = async (req, res) => {
  try {
    const filter = {
      _id: req.params.id,
    };

    if (req.user.role === "admin") {
      filter.recipientRole = "admin";
    } else {
      filter.recipientRole = "staff";
      filter.recipientBranch = req.user.assignedBranch;
    }

    const notification = await Notification.findOneAndUpdate(
      filter,
      { isRead: true },
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    res.json({
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    const filter = {};

    if (req.user.role === "admin") {
      filter.recipientRole = "admin";
    } else {
      filter.recipientRole = "staff";
      filter.recipientBranch = req.user.assignedBranch;
    }

    await Notification.updateMany(filter, {
      isRead: true,
    });

    res.json({
      message: "All notifications marked as read",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const filter = {
      _id: req.params.id,
    };

    if (req.user.role === "admin") {
      filter.recipientRole = "admin";
    } else {
      filter.recipientRole = "staff";
      filter.recipientBranch = req.user.assignedBranch;
    }

    const notification = await Notification.findOneAndDelete(filter);

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    res.json({
      message: "Notification deleted",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteAllNotifications = async (req, res) => {
  try {
    const filter = {};

    if (req.user.role === "admin") {
      filter.recipientRole = "admin";
    } else {
      filter.recipientRole = "staff";
      filter.recipientBranch = req.user.assignedBranch;
    }

    await Notification.deleteMany(filter);

    res.json({
      message: "All notifications deleted",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
