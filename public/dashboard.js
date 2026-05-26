protectPage();

const user = getUser();
const branchChartInstances = {};

let staffInventoryChart = null;
let staffStatusChart = null;

async function loadDashboard() {
  try {
    const [inventory, branches, products, requests] = await Promise.all([
      apiRequest("/inventory"),
      apiRequest("/branches"),
      apiRequest("/products"),
      apiRequest("/refill-requests"),
    ]);

    // save globally for branch monitoring
    window.dashboardInventory = inventory;
    window.dashboardBranches = branches;
    window.dashboardProducts = products;

    // KPI Cards
    document.getElementById("totalBranches").textContent = branches.length || 0;

    document.getElementById("totalProducts").textContent = products.length || 0;

    const lowStockCount = inventory.filter(
      (item) => getStockStatus(item) === "Low Stock",
    ).length;

    document.getElementById("lowStockItems").textContent = lowStockCount;

    const pendingCount = requests.filter((r) => r.status === "Pending").length;

    document.getElementById("pendingRequests").textContent = pendingCount;

    // NEW: Branch monitoring
    loadBranchFilter(branches);
    renderBranchMonitoring();
  } catch (error) {
    console.error("Dashboard load error:", error);
  }
}

async function loadStaffDashboard() {
  try {
    const user = getUser();
    const branchId = user.assignedBranch?._id;

    document.getElementById("staffUserInfo").textContent =
      `Welcome ${user.name} • ${user.assignedBranch?.branchName || "No Branch Assigned"}`;

    const inventory = await apiRequest("/inventory");

    const branchInventory = inventory.filter(
      (item) => item.branch?._id === branchId,
    );

    document.getElementById("staffTotalProducts").textContent =
      branchInventory.length;

    const lowStock = branchInventory.filter(
      (i) => getStockStatus(i) === "Low Stock",
    ).length;

    const inStock = branchInventory.filter(
      (i) => getStockStatus(i) === "In Stock",
    ).length;

    const outStock = branchInventory.filter(
      (i) => getStockStatus(i) === "Out of Stock",
    ).length;

    document.getElementById("staffLowStock").textContent = lowStock;

    document.getElementById("staffInStock").textContent = inStock;

    document.getElementById("staffOutStock").textContent = outStock;

    document.getElementById("staffInventoryTable").innerHTML = branchInventory
      .map(
        (item) => `
        <tr>
          <td>${item.product?.productName || ""}</td>
          <td>${item.currentStock}</td>
          <td>${item.minimumStockLevel}</td>
          <td>${badge(getStockStatus(item))}</td>
        </tr>
      `,
      )
      .join("");
    renderStaffInventoryChart(branchInventory);
    renderStaffStatusChart({
      inStock,
      lowStock,
      outStock,
    });
  } catch (error) {
    console.error("Staff dashboard error:", error);
  }
}

function renderStaffInventoryChart(items) {
  const canvas = document.getElementById("staffInventoryChart");
  if (!canvas) return;

  if (staffInventoryChart) {
    staffInventoryChart.destroy();
  }

  staffInventoryChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: items.map((item) => item.product?.productName || "Product"),
      datasets: [
        {
          label: "Current Stock",
          data: items.map((item) => Number(item.currentStock || 0)),
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}

function renderStaffStatusChart(counts) {
  const canvas = document.getElementById("staffStatusChart");
  if (!canvas) return;

  if (staffStatusChart) {
    staffStatusChart.destroy();
  }

  staffStatusChart = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: ["In Stock", "Low Stock", "Out of Stock"],
      datasets: [
        {
          data: [counts.inStock, counts.lowStock, counts.outStock],
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "58%",
    },
  });
}

function getStockStatus(item) {
  const currentStock = Number(item.currentStock || 0);
  const minimumStockLevel = Number(item.minimumStockLevel || 0);

  if (currentStock <= 0) return "Out of Stock";
  if (currentStock <= minimumStockLevel) return "Low Stock";
  return "In Stock";
}

function loadBranchFilter(branches) {
  const branchFilter = document.getElementById("branchFilter");
  if (!branchFilter) return;

  branchFilter.innerHTML =
    `<option value="">All Branches</option>` +
    branches
      .map(
        (branch) =>
          `<option value="${branch._id}">${branch.branchName}</option>`,
      )
      .join("");
}

function renderBranchMonitoring() {
  const inventory = window.dashboardInventory || [];
  const branches = window.dashboardBranches || [];

  const selectedBranch = document.getElementById("branchFilter")?.value || "";
  const searchText =
    document.getElementById("productSearch")?.value.toLowerCase() || "";

  const branchCards = document.getElementById("branchCards");
  if (!branchCards) return;

  Object.values(branchChartInstances).forEach((chart) => chart.destroy());

  if (branches.length === 0) {
    branchCards.innerHTML = `
      <div class="empty-dashboard-state">
        <h3>No branches added yet</h3>
        <p>Add a branch first to monitor stock per product.</p>
        <button onclick="location.href='branches.html'">+ Add Branch</button>
      </div>
    `;
    return;
  }

  const visibleBranches = selectedBranch
    ? branches.filter((branch) => branch._id === selectedBranch)
    : branches;

  branchCards.innerHTML = visibleBranches
    .map((branch) => {
      const branchInventory = inventory.filter(
        (item) => item.branch?._id === branch._id,
      );

      const filteredInventory = branchInventory.filter((item) => {
        const productName = item.product?.productName || "";
        return productName.toLowerCase().includes(searchText);
      });

      const totalStock = filteredInventory.reduce(
        (sum, item) => sum + Number(item.currentStock || 0),
        0,
      );

      if (filteredInventory.length === 0) {
        return `
          <div class="branch-stock-card">
            <div class="branch-card-header">
              <h3>${branch.branchName}</h3>
              <span>Total Stock: 0</span>
            </div>

            <div class="empty-branch">
              No inventory records for this branch.
            </div>
          </div>
        `;
      }

      return `
        <div class="branch-stock-card">
          <div class="branch-card-header">
            <h3>${branch.branchName}</h3>
            <span>Total Stock: ${totalStock}</span>
          </div>

          <div class="branch-card-content">
            <div class="branch-chart-box">
              <canvas id="chart-${branch._id}"></canvas>
            </div>

            <div class="branch-product-list">
              ${filteredInventory
                .map((item) => {
                  const status = getStockStatus(item);

                  return `
                    <div class="branch-product-row">
                      <div>
                        <strong>${item.product?.productName || "No Product"}</strong>
                        <small>${status}</small>
                      </div>
                      <span>${item.currentStock || 0}</span>
                    </div>
                  `;
                })
                .join("")}
            </div>
          </div>

          <button class="view-details-btn" onclick="location.href='inventory.html'">
            View Details
          </button>
        </div>
      `;
    })
    .join("");

  visibleBranches.forEach((branch) => {
    const branchInventory = inventory.filter(
      (item) => item.branch?._id === branch._id,
    );

    const filteredInventory = branchInventory.filter((item) => {
      const productName = item.product?.productName || "";
      return productName.toLowerCase().includes(searchText);
    });

    if (filteredInventory.length > 0) {
      createBranchChart(branch._id, filteredInventory);
    }
  });
}

function createBranchChart(branchId, items) {
  const ctx = document.getElementById(`chart-${branchId}`);
  if (!ctx) return;

  branchChartInstances[branchId] = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: items.map((item) => item.product?.productName || "No Product"),
      datasets: [
        {
          data: items.map((item) => Number(item.currentStock || 0)),
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "58%",
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  });
}

function exportBranchStock() {
  window.open("/reports.html", "_blank");
}

function updateDateTime() {
  const now = new Date();

  const text = now.toLocaleString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const adminDate = document.getElementById("currentDateTime");
  const staffDate = document.getElementById("staffCurrentDateTime");

  if (adminDate) adminDate.textContent = text;
  if (staffDate) staffDate.textContent = text;
}

async function loadNotifications() {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch("/api/refill/pending", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    const notifCount = document.getElementById("notifCount");
    const notifList = document.getElementById("notificationList");

    if (!data.requests || data.requests.length === 0) {
      notifCount.classList.add("hidden");

      notifList.innerHTML = `
        <p class="empty-notif">
          No refill request notifications
        </p>
      `;

      return;
    }

    notifCount.classList.remove("hidden");
    notifCount.textContent = data.requests.length;

    notifList.innerHTML = data.requests
      .map(
        (req) => `
          <div class="notification-item">
            <strong>${req.branchName}</strong>
            requested refill for
            <b>${req.productName}</b>
            <br>
            Qty: ${req.quantity}
          </div>
        `,
      )
      .join("");
  } catch (err) {
    console.error("Notification error:", err);
  }
}

function showNotifications() {
  document.getElementById("notificationDropdown").classList.toggle("hidden");
}

async function loadDashboardNotifications() {
  try {
    const notifications = await apiRequest("/notifications");

    const user = getUser();

    if (user.role === "admin") {
      renderNotificationUI({
        countId: "adminNotifCount",
        listId: "adminNotificationList",
        notifications,
      });
    } else {
      renderNotificationUI({
        countId: "staffNotifCount",
        listId: "staffNotificationList",
        notifications,
      });
    }
  } catch (error) {
    console.error("Dashboard notification error:", error);
  }
}

function renderNotificationUI({ countId, listId, notifications }) {
  const countEl = document.getElementById(countId);
  const listEl = document.getElementById(listId);

  if (!countEl || !listEl) return;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (unreadCount > 0) {
    countEl.classList.remove("hidden");
    countEl.textContent = unreadCount;
  } else {
    countEl.classList.add("hidden");
  }

  if (notifications.length === 0) {
    listEl.innerHTML = `<p class="empty-notif">No notifications</p>`;
    return;
  }

  listEl.innerHTML = `
    <div class="notif-actions">
      <button onclick="deleteAllNotifications()" class="clear-notif-btn">
        Clear All
      </button>
    </div>

    ${notifications
      .map(
        (n) => `
          <div class="notification-item ${n.isRead ? "read" : "unread"}">
            <div>
              <strong>${n.title}</strong>
              <p>${n.message}</p>
              <small>${new Date(n.createdAt).toLocaleString("en-PH")}</small>
            </div>

            <button 
              class="delete-notif-btn"
              onclick="deleteNotification('${n._id}')"
            >
              ✕
            </button>
          </div>
        `,
      )
      .join("")}
  `;
}

async function deleteNotification(id) {
  await apiRequest(`/notifications/${id}`, "DELETE");
  loadDashboardNotifications();
}

async function deleteAllNotifications() {
  if (!confirm("Delete all notifications?")) return;

  await apiRequest("/notifications", "DELETE");
  loadDashboardNotifications();
}

async function toggleNotificationDropdown() {
  const user = getUser();

  if (user.role === "admin") {
    document
      .getElementById("adminNotificationDropdown")
      ?.classList.toggle("hidden");
  } else {
    document
      .getElementById("staffNotificationDropdown")
      ?.classList.toggle("hidden");
  }

  await apiRequest("/notifications/read-all", "PUT");
  loadDashboardNotifications();
}

function setupRealtimeNotifications() {
  const user = getUser();

  if (typeof io === "undefined") {
    console.error("Socket.IO not loaded");
    return;
  }

  const socket = io();

  if (user.role === "admin") {
    socket.emit("joinAdminRoom");

    socket.on("newRefillRequest", () => {
      loadDashboardNotifications();

      if (typeof loadDashboard === "function") {
        loadDashboard();
      }
    });
    socket.on("newNotification", () => {
      loadDashboardNotifications();

      if (user.role === "admin") {
        loadDashboard();
      }
    });
  }

  if (user.role === "staff" && user.assignedBranch?._id) {
    socket.emit("joinBranchRoom", user.assignedBranch._id);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const user = getUser();

  updateDateTime();

  if (user.role === "admin") {
    document.getElementById("adminDashboard").style.display = "block";

    document.getElementById("staffDashboard").style.display = "none";

    loadDashboard();
    loadDashboardNotifications();

    setInterval(loadDashboardNotifications, 30000);
  } else {
    document.getElementById("adminDashboard").style.display = "none";

    document.getElementById("staffDashboard").style.display = "block";

    loadStaffDashboard();
    loadDashboardNotifications();
    setInterval(loadDashboardNotifications, 30000);
  }

  setInterval(updateDateTime, 60000);
  setupRealtimeNotifications();
});
