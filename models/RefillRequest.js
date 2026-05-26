const mongoose = require("mongoose");

const refillRequestSchema = new mongoose.Schema(
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
    inventory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
    },
    currentStock: { type: Number, required: true },
    requestedQuantity: { type: Number, required: true },
    deliveredQuantity: { type: Number, default: 0 },
    urgencyLevel: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    remarks: { type: String },
    status: {
      type: String,
      enum: [
        "Pending",
        "Approved",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ],
      default: "Pending",
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    deliveredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    outForDeliveryBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    outForDeliveryDate: {
      type: Date,
      default: null,
    },

    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    acknowledgedDate: {
      type: Date,
      default: null,
    },
    requestDate: {
      type: Date,
      default: Date.now,
    },
    deliveredDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("RefillRequest", refillRequestSchema);
