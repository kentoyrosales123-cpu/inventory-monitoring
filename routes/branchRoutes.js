const express = require("express");
const {
  createBranch,
  getBranches,
  updateBranch,
  deleteBranch,
} = require("../controllers/branchController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, adminOnly, createBranch);
router.get("/", protect, adminOnly, getBranches);
router.put("/:id", protect, adminOnly, updateBranch);
router.delete("/:id", protect, adminOnly, deleteBranch);

module.exports = router;
