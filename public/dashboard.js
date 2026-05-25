protectPage();

async function loadDashboard() {
  const user = getUser();

  document.getElementById("userInfo").textContent =
    `${user.name} — ${user.role.toUpperCase()}`;

  const data = await apiRequest("/reports/dashboard");

  totalBranches.textContent = data.totalBranches;
  totalProducts.textContent = data.totalProducts;
  lowStockItems.textContent = data.lowStockItems;
  pendingRequests.textContent = data.pendingRefillRequests;

  recentInventory.innerHTML = data.recentInventory
    .map(
      (i) => `
    <tr>
      <td>${i.branch?.branchName || ""}</td>
      <td>${i.product?.productName || ""}</td>
      <td>${i.currentStock}</td>
      <td>${badge(i.stockStatus)}</td>
    </tr>
  `,
    )
    .join("");

  new Chart(document.getElementById("stockChart"), {
    type: "doughnut",
    data: {
      labels: ["In Stock", "Low Stock", "Out of Stock"],
      datasets: [
        {
          data: [
            data.stockSummary.inStock,
            data.stockSummary.lowStock,
            data.stockSummary.outOfStock,
          ],
        },
      ],
    },
  });
}

function updateDateTime() {
  const dateTimeEl = document.getElementById("currentDateTime");
  if (!dateTimeEl) return;

  const now = new Date();

  dateTimeEl.textContent = now.toLocaleString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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

loadNotifications();

/* auto refresh every 30 sec */
setInterval(loadNotifications, 30000);
updateDateTime();
setInterval(updateDateTime, 60000);

loadDashboard();
