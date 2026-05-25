const API_BASE = "/api";

function getUser() {
  return JSON.parse(localStorage.getItem("user") || "{}");
}

function protectPage() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "/";
    return;
  }

  renderNav();
  applyRoleVisibility();
  applySidebarState();
}

async function apiRequest(endpoint, method = "GET", body = null) {
  const token = localStorage.getItem("token");

  const options = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(API_BASE + endpoint, options);
  const data = await res.json();

  if (!res.ok) {
    alert(data.message || "Request failed");
    throw new Error(data.message);
  }

  return data;
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/";
}

function renderNav() {
  const user = getUser();
  const nav = document.getElementById("navMenu");

  if (!nav) return;

  const currentPage = window.location.pathname;

  const isActive = (path) => (currentPage.includes(path) ? "active-nav" : "");

  let links = `
    <a href="/dashboard.html" class="${isActive("dashboard")}" title="Dashboard">
      <span class="nav-icon">📊</span>
      <span class="nav-text">Dashboard</span>
    </a>

    <a href="/inventory.html" class="${isActive("inventory")}" title="Inventory">
      <span class="nav-icon">📦</span>
      <span class="nav-text">Inventory</span>
    </a>

    <a href="/refill-requests.html" class="${isActive("refill-requests")}" title="Refill Requests">
      <span class="nav-icon">📝</span>
      <span class="nav-text">Refill Requests</span>
    </a>

    <a href="/reports.html" class="${isActive("reports")}" title="Reports">
      <span class="nav-icon">📈</span>
      <span class="nav-text">Reports</span>
    </a>
  `;

  if (user.role === "admin") {
    links += `
      <a href="/branches.html" class="${isActive("branches")}" title="Branches">
        <span class="nav-icon">🏢</span>
        <span class="nav-text">Branches</span>
      </a>

      <a href="/products.html" class="${isActive("products")}" title="Products">
        <span class="nav-icon">🛒</span>
        <span class="nav-text">Products</span>
      </a>

      <a href="/users.html" class="${isActive("users")}" title="Users">
        <span class="nav-icon">👤</span>
        <span class="nav-text">Users</span>
      </a>
    `;
  }

  nav.innerHTML = links;
}

function applyRoleVisibility() {
  const user = getUser();

  document.querySelectorAll(".admin-only").forEach((el) => {
    if (user.role !== "admin") {
      el.style.display = "none";
    }
  });
}

function toggleSidebar() {
  const sidebar = document.querySelector(".sidebar");
  if (!sidebar) return;

  sidebar.classList.toggle("collapsed");

  localStorage.setItem(
    "sidebarState",
    sidebar.classList.contains("collapsed") ? "collapsed" : "expanded",
  );
}

function applySidebarState() {
  const sidebar = document.querySelector(".sidebar");
  if (!sidebar) return;

  if (localStorage.getItem("sidebarState") === "collapsed") {
    sidebar.classList.add("collapsed");
  }
}

document.addEventListener("DOMContentLoaded", applySidebarState);

function applySidebarState() {
  const sidebar = document.querySelector(".sidebar");
  if (!sidebar) return;

  const sidebarState = localStorage.getItem("sidebarState");

  if (sidebarState === "collapsed") {
    sidebar.classList.add("collapsed");
  } else {
    sidebar.classList.remove("collapsed");
  }
}

document.addEventListener("DOMContentLoaded", applySidebarState);

function badge(status) {
  let cls = "badge green";

  if (status === "Low Stock") cls = "badge yellow";
  if (status === "Out of Stock") cls = "badge red";

  return `<span class="${cls}">${status}</span>`;
}
