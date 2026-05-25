const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema(
  {
    branchName: { type: String, required: true },
    address: { type: String, required: true },
    contactPerson: { type: String },
    contactNumber: { type: String },
    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Branch", branchSchema);
