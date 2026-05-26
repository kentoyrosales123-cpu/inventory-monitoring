const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinAdminRoom", () => {
    socket.join("admins");
  });

  socket.on("joinBranchRoom", (branchId) => {
    socket.join(`branch-${branchId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/branches", require("./routes/branchRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/inventory", require("./routes/inventoryRoutes"));
app.use("/api/refill-requests", require("./routes/refillRequestRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const User = require("./models/User");

app.get("/create-first-admin", async (req, res) => {
  const exists = await User.findOne({ email: "admin@gmail.com" });

  if (exists) {
    return res.json({ message: "Admin already exists" });
  }

  const admin = await User.create({
    name: "System Admin",
    email: "admin@gmail.com",
    password: "admin123",
    role: "admin",
  });

  res.json({
    message: "Admin created",
    email: "admin@gmail.com",
    password: "admin123",
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
