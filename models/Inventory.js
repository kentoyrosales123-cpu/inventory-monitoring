const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    currentStock: { type: Number, default: 0 },
    minimumStockLevel: { type: Number, default: 0 },
    lastRefillDate: { type: Date, default: null },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    stockStatus: {
      type: String,
      enum: ["In Stock", "Low Stock", "Out of Stock"],
      default: "In Stock",
    },
  },
  { timestamps: true },
);

inventorySchema.pre("save", function () {
  if (this.currentStock <= 0) {
    this.stockStatus = "Out of Stock";
  } else if (this.currentStock <= this.minimumStockLevel) {
    this.stockStatus = "Low Stock";
  } else {
    this.stockStatus = "In Stock";
  }
});

module.exports = mongoose.model("Inventory", inventorySchema);
