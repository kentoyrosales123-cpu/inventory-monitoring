const ExcelJS = require("exceljs");
const Inventory = require("../models/Inventory");
const RefillRequest = require("../models/RefillRequest");
const Branch = require("../models/Branch");
const Product = require("../models/Product");

exports.getDashboardStats = async (req, res) => {
  const branchFilter =
    req.user.role === "staff" ? { _id: req.user.assignedBranch } : {};
  const inventoryFilter =
    req.user.role === "staff" ? { branch: req.user.assignedBranch } : {};
  const refillFilter =
    req.user.role === "staff" ? { branch: req.user.assignedBranch } : {};

  const totalBranches = await Branch.countDocuments(branchFilter);
  const totalProducts = await Product.countDocuments();
  const lowStockItems = await Inventory.countDocuments({
    ...inventoryFilter,
    stockStatus: { $in: ["Low Stock", "Out of Stock"] },
  });
  const pendingRefillRequests = await RefillRequest.countDocuments({
    ...refillFilter,
    status: "Pending",
  });

  const inStock = await Inventory.countDocuments({
    ...inventoryFilter,
    stockStatus: "In Stock",
  });
  const lowStock = await Inventory.countDocuments({
    ...inventoryFilter,
    stockStatus: "Low Stock",
  });
  const outOfStock = await Inventory.countDocuments({
    ...inventoryFilter,
    stockStatus: "Out of Stock",
  });

  const recentInventory = await Inventory.find(inventoryFilter)
    .populate("branch", "branchName")
    .populate("product", "productName sku")
    .sort({ updatedAt: -1 })
    .limit(10);

  res.json({
    totalBranches,
    totalProducts,
    lowStockItems,
    pendingRefillRequests,
    stockSummary: {
      inStock,
      lowStock,
      outOfStock,
    },
    recentInventory,
  });
};

exports.getInventoryReport = async (req, res) => {
  const filter = {};

  if (req.user.role === "staff") {
    filter.branch = req.user.assignedBranch;
  }

  if (req.query.branch) filter.branch = req.query.branch;
  if (req.query.product) filter.product = req.query.product;
  if (req.query.stockStatus) filter.stockStatus = req.query.stockStatus;

  const data = await Inventory.find(filter)
    .populate("branch", "branchName")
    .populate("product");

  res.json(data);
};

exports.downloadInventoryExcel = async (req, res) => {
  const filter = {};

  if (req.query.branch) filter.branch = req.query.branch;
  if (req.query.stockStatus) filter.stockStatus = req.query.stockStatus;

  const data = await Inventory.find(filter)
    .populate("branch", "branchName")
    .populate("product");

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Inventory Report");

  sheet.columns = [
    { header: "Branch", key: "branch", width: 25 },
    { header: "Product", key: "product", width: 25 },
    { header: "SKU", key: "sku", width: 20 },
    { header: "Category", key: "category", width: 20 },
    { header: "Current Stock", key: "currentStock", width: 15 },
    { header: "Minimum Stock", key: "minimumStockLevel", width: 15 },
    { header: "Status", key: "stockStatus", width: 15 },
    { header: "Last Refill", key: "lastRefillDate", width: 20 },
  ];

  data.forEach((item) => {
    sheet.addRow({
      branch: item.branch?.branchName,
      product: item.product?.productName,
      sku: item.product?.sku,
      category: item.product?.category,
      currentStock: item.currentStock,
      minimumStockLevel: item.minimumStockLevel,
      stockStatus: item.stockStatus,
      lastRefillDate: item.lastRefillDate
        ? item.lastRefillDate.toISOString().split("T")[0]
        : "",
    });
  });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );

  res.setHeader(
    "Content-Disposition",
    "attachment; filename=inventory-report.xlsx",
  );

  await workbook.xlsx.write(res);
  res.end();
};
