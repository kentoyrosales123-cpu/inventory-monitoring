const RefillRequest = require("../models/RefillRequest");
const Inventory = require("../models/Inventory");
const Notification = require("../models/Notification");

exports.createRefillRequest = async (req, res) => {
  try {
    const { inventoryId, requestedQuantity, urgencyLevel, remarks } = req.body;

    const inventory = await Inventory.findById(inventoryId);

    if (!inventory) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    if (
      req.user.role === "staff" &&
      inventory.branch.toString() !== req.user.assignedBranch?.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const request = await RefillRequest.create({
      branch: inventory.branch,
      product: inventory.product,
      inventory: inventory._id,
      currentStock: inventory.currentStock,
      requestedQuantity,
      urgencyLevel,
      remarks,
      requestedBy: req.user._id,
      status: "Pending",
    });

    const populatedRequest = await RefillRequest.findById(request._id)
      .populate("branch", "branchName")
      .populate("product", "productName sku")
      .populate("requestedBy", "name");

    // save notification in database
    const notification = await Notification.create({
      recipientRole: "admin",
      title: "New Refill Request",
      message: `${populatedRequest.branch?.branchName} requested refill for ${populatedRequest.product?.productName}`,
      type: "REFILL_REQUEST",
      refillRequest: request._id,
    });

    // realtime notify admins
    const io = req.app.get("io");

    if (io) {
      io.to("admins").emit("newRefillRequest", {
        notification,
        request: populatedRequest,
      });
    }

    res.status(201).json({
      message: "Refill request submitted",
      request,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRefillRequests = async (req, res) => {
  try {
    const filter = {};

    if (req.user.role === "staff") {
      filter.branch = req.user.assignedBranch;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.branch) {
      filter.branch = req.query.branch;
    }

    const requests = await RefillRequest.find(filter)
      .populate("branch", "branchName")
      .populate("product", "productName sku")
      .populate("requestedBy", "name")
      .populate("approvedBy", "name")
      .populate("outForDeliveryBy", "name")
      .populate("acknowledgedBy", "name")
      .populate("deliveredBy", "name")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateRefillStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const request = await RefillRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    if (status === "Approved") {
      if (request.status !== "Pending") {
        return res.status(400).json({
          message: "Only pending requests can be approved",
        });
      }

      request.status = "Approved";
      request.approvedBy = req.user._id;
      await Notification.create({
        recipientRole: "staff",
        recipientBranch: request.branch,
        title: "Refill Approved",
        message: "Your refill request has been approved",
        type: "REFILL_APPROVED",
        refillRequest: request._id,
      });

      const io = req.app.get("io");

      if (io) {
        io.to(`branch-${request.branch}`).emit("newNotification");
      }
    }

    if (status === "Out for Delivery") {
      if (request.status !== "Approved") {
        return res.status(400).json({
          message: "Only approved requests can be marked out for delivery",
        });
      }

      request.status = "Out for Delivery";
      request.outForDeliveryBy = req.user._id;
      request.outForDeliveryDate = new Date();
      await Notification.create({
        recipientRole: "staff",
        recipientBranch: request.branch,
        title: "Out for Delivery",
        message: "Your requested refill is out for delivery",
        type: "OUT_FOR_DELIVERY",
        refillRequest: request._id,
      });

      const io = req.app.get("io");

      if (io) {
        io.to(`branch-${request.branch}`).emit("newNotification");
      }
    }

    if (status === "Cancelled") {
      if (request.status === "Delivered") {
        return res.status(400).json({
          message: "Delivered requests cannot be cancelled",
        });
      }

      request.status = "Cancelled";
      request.approvedBy = req.user._id;
    }

    await request.save();

    res.json({
      message: "Request status updated",
      request,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.acknowledgeDelivery = async (req, res) => {
  try {
    const request = await RefillRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (
      req.user.role === "staff" &&
      request.branch.toString() !== req.user.assignedBranch?.toString()
    ) {
      return res.status(403).json({
        message: "You can only acknowledge deliveries for your assigned branch",
      });
    }

    if (request.status !== "Out for Delivery") {
      return res.status(400).json({
        message: "Only out for delivery requests can be acknowledged",
      });
    }

    const inventory = await Inventory.findById(request.inventory);

    if (!inventory) {
      return res.status(404).json({
        message: "Inventory record not found",
      });
    }

    const qty = Number(request.requestedQuantity || 0);

    inventory.currentStock += qty;
    inventory.lastRefillDate = new Date();
    inventory.lastUpdatedBy = req.user._id;

    await inventory.save();

    request.status = "Delivered";
    request.deliveredQuantity = qty;
    request.acknowledgedBy = req.user._id;
    request.acknowledgedDate = new Date();
    request.deliveredDate = new Date();

    await request.save();

    await Notification.create({
      recipientRole: "admin",
      title: "Delivery Acknowledged",
      message: "Branch acknowledged delivery",
      type: "DELIVERED",
      refillRequest: request._id,
    });

    const io = req.app.get("io");

    if (io) {
      io.to("admins").emit("newNotification");
    }

    res.json({
      message: "Delivery acknowledged and inventory updated",
      request,
      inventory,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
