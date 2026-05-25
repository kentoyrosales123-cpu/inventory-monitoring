const Branch = require("../models/Branch");

exports.createBranch = async (req, res) => {
  const branch = await Branch.create(req.body);
  res.status(201).json(branch);
};

exports.getBranches = async (req, res) => {
  const branches = await Branch.find().populate("assignedStaff", "name email");
  res.json(branches);
};

exports.updateBranch = async (req, res) => {
  const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });

  res.json(branch);
};

exports.deleteBranch = async (req, res) => {
  await Branch.findByIdAndDelete(req.params.id);
  res.json({ message: "Branch deleted" });
};
