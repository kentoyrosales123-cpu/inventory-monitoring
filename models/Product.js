const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    unitType: { type: String, required: true },
    supplierCost: { type: Number, default: 0 },
    sellingPrice: { type: Number, default: 0 },
    minimumStockLevel: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", productSchema);
