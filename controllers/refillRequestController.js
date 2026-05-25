const RefillRequest = require("../models/RefillRequest");
const Inventory = require("../models/Inventory");
const InventoryHistory = require("../models/InventoryHistory");

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
    });

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRefillRequests = async (req, res) => {
  const filter = {};

  if (req.user.role === "staff") {
    filter.branch = req.user.assignedBranch;
  }

  if (req.query.status) filter.status = req.query.status;
  if (req.query.branch) filter.branch = req.query.branch;

  const requests = await RefillRequest.find(filter)
    .populate("branch", "branchName")
    .populate("product", "productName sku")
    .populate("requestedBy", "name")
    .sort({ createdAt: -1 });

  res.json(requests);
};

exports.updateRefillStatus = async (req, res) => {
  try {
    const { status, deliveredQuantity } = req.body;

    const request = await RefillRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (status === "Approved") {
      request.status = "Approved";
      request.approvedBy = req.user._id;
    }

    if (status === "Cancelled") {
      request.status = "Cancelled";
      request.approvedBy = req.user._id;
    }

    if (status === "Delivered") {
      const inventory = await Inventory.findById(request.inventory);

      const previousStock = inventory.currentStock;
      const qty = Number(deliveredQuantity || request.requestedQuantity);

      inventory.currentStock += qty;
      inventory.lastRefillDate = new Date();
      inventory.lastUpdatedBy = req.user._id;

      await inventory.save();

      await InventoryHistory.create({
        branch: inventory.branch,
        product: inventory.product,
        inventory: inventory._id,
        previousStock,
        newStock: inventory.currentStock,
        remarks: `Refill delivered. Quantity added: ${qty}`,
        updatedBy: req.user._id,
      });

      request.status = "Delivered";
      request.deliveredQuantity = qty;
      request.deliveredBy = req.user._id;
      request.deliveredDate = new Date();
    }

    await request.save();

    res.json({ message: "Request updated", request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
