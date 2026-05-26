const Inventory = require("../models/Inventory");
const InventoryHistory = require("../models/InventoryHistory");
const Product = require("../models/Product");

exports.createInventory = async (req, res) => {
  try {
    console.log("CREATE INVENTORY BODY:", req.body);
    console.log("CREATE INVENTORY USER:", req.user);

    const { branch, product, currentStock, minimumStockLevel } = req.body;

    if (!branch || !product) {
      return res.status(400).json({
        message: "Branch and product are required",
      });
    }

    const existing = await Inventory.findOne({ branch, product });

    if (existing) {
      return res.status(400).json({
        message: "This product already exists in this branch inventory",
      });
    }

    const productData = await Product.findById(product);

    const inventory = new Inventory({
      branch,
      product,
      currentStock: Number(currentStock || 0),
      minimumStockLevel: Number(
        minimumStockLevel || productData?.minimumStockLevel || 0,
      ),
      lastUpdatedBy: req.user?._id || null,
    });

    await inventory.save();

    res.status(201).json(inventory);
  } catch (error) {
    console.error("CREATE INVENTORY ERROR:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

exports.getInventory = async (req, res) => {
  try {
    const filter = {};

    if (req.user.role === "staff") {
      filter.branch = req.user.assignedBranch;
    }

    if (req.query.branch) filter.branch = req.query.branch;
    if (req.query.product) filter.product = req.query.product;
    if (req.query.stockStatus) filter.stockStatus = req.query.stockStatus;

    const inventory = await Inventory.find(filter)
      .populate("branch", "branchName")
      .populate("product")
      .populate("lastUpdatedBy", "name");

    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateStock = async (req, res) => {
  try {
    const { currentStock, remarks } = req.body;

    const inventory = await Inventory.findById(req.params.id);

    if (!inventory) {
      return res.status(404).json({
        message: "Inventory not found",
      });
    }

    if (
      req.user.role === "staff" &&
      inventory.branch.toString() !== req.user.assignedBranch?.toString()
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const previousStock = inventory.currentStock;

    inventory.currentStock = Number(currentStock);
    inventory.lastUpdatedBy = req.user?._id || null;

    await inventory.save();

    try {
      await InventoryHistory.create({
        branch: inventory.branch,
        product: inventory.product,
        inventory: inventory._id,
        previousStock,
        newStock: inventory.currentStock,
        remarks: remarks || "Manual inventory count",
        updatedBy: req.user?._id,
      });
    } catch (historyError) {
      console.error("Inventory history save error:", historyError.message);
    }

    const updatedInventory = await Inventory.findById(inventory._id)
      .populate("branch", "branchName")
      .populate("product")
      .populate("lastUpdatedBy", "name");

    res.json({
      message: "Stock updated",
      inventory: updatedInventory,
    });
  } catch (error) {
    console.error("Update stock error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

exports.getLowStock = async (req, res) => {
  const filter = {
    stockStatus: { $in: ["Low Stock", "Out of Stock"] },
  };

  if (req.user.role === "staff") {
    filter.branch = req.user.assignedBranch;
  }

  const items = await Inventory.find(filter)
    .populate("branch", "branchName")
    .populate("product");

  res.json(items);
};

exports.getInventoryHistory = async (req, res) => {
  const filter = {};

  if (req.user.role === "staff") {
    filter.branch = req.user.assignedBranch;
  }

  const history = await InventoryHistory.find(filter)
    .populate("branch", "branchName")
    .populate("product", "productName sku")
    .populate("updatedBy", "name")
    .sort({ createdAt: -1 });

  res.json(history);
};
