const User = require("../models/User");

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, assignedBranch, status } = req.body;

    const exists = await User.findOne({ email });

    if (exists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      assignedBranch: assignedBranch || null,
      status,
    });

    res.status(201).json({ message: "User created", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUsers = async (req, res) => {
  const users = await User.find()
    .select("-password")
    .populate("assignedBranch");
  res.json(users);
};

exports.updateUser = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) return res.status(404).json({ message: "User not found" });

  user.name = req.body.name || user.name;
  user.email = req.body.email || user.email;
  user.role = req.body.role || user.role;
  user.assignedBranch = req.body.assignedBranch || user.assignedBranch;
  user.status = req.body.status || user.status;

  if (req.body.password) user.password = req.body.password;

  await user.save();

  res.json({ message: "User updated", user });
};

exports.deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted" });
};
