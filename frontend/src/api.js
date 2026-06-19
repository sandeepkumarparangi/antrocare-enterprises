const DEFAULT_API_BASE = import.meta.env.DEV ? "http://localhost:8081" : "";

export const API_BASE = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE).replace(/\/$/, "");
const ASSET_VERSION = "20260529";

export function mediaUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const separator = normalizedPath.includes("?") ? "&" : "?";
  return `${API_BASE}${normalizedPath}${separator}v=${ASSET_VERSION}`;
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.adminKey ? { "X-Admin-Key": options.adminKey, "X-Auth-Token": options.adminKey } : {}),
      ...(options.authToken ? { "X-Auth-Token": options.authToken } : {})
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return { ...data, _responseStatus: response.status };
  }
  return data;
}

async function uploadRequest(path, file, authToken) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      ...(authToken ? { "X-Auth-Token": authToken } : {})
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`);
  }

  return response.json();
}

export function fetchProducts(adminKey) {
  return request(`/api/products${adminKey ? "?includeHidden=true" : ""}`, { adminKey });
}

export function fetchCategories() {
  return request("/api/categories");
}

export function fetchSummary() {
  return request("/api/summary");
}

export function fetchOAuth2Status() {
  return request("/api/oauth2/status");
}

export function fetchPurchaseRequests(adminKey) {
  return request("/api/purchase-requests", { adminKey });
}

export function fetchMyPurchaseRequests(authToken) {
  return request("/api/purchase-requests/me", { authToken });
}

export function fetchStockAlerts(adminKey) {
  return request("/api/stock-alerts", { adminKey });
}

export function fetchProductChangeRequests(authToken) {
  return request("/api/product-change-requests", { authToken });
}

export function approveProductChange(changeId, authToken) {
  return request(`/api/product-change-requests/${changeId}/approve`, {
    method: "POST",
    authToken
  });
}

export function rejectProductChange(changeId, authToken) {
  return request(`/api/product-change-requests/${changeId}/reject`, {
    method: "POST",
    authToken
  });
}

export function createPurchaseRequest(purchaseRequest, authToken) {
  return request("/api/purchase-requests", {
    method: "POST",
    authToken,
    body: purchaseRequest
  });
}

export function uploadPrescription(file, authToken) {
  return uploadRequest("/api/prescriptions", file, authToken);
}

export function updatePurchaseRequestStatus(requestId, status, adminKey) {
  return request(`/api/purchase-requests/${requestId}/status`, {
    method: "PATCH",
    adminKey,
    body: { status }
  });
}

export function updateProduct(product, adminKey) {
  return request(`/api/products/${product.id}`, {
    method: "PATCH",
    adminKey,
    body: {
      cost: product.cost,
      status: product.status,
      stockQuantity: Number(product.stockQuantity) || 0
    }
  });
}

export function signupUser(account) {
  return request("/api/auth/signup", {
    method: "POST",
    body: account
  });
}

export function loginUser(credentials) {
  return request("/api/auth/login", {
    method: "POST",
    body: credentials
  });
}

export function loginAdmin(credentials) {
  return request("/api/auth/admin/login", {
    method: "POST",
    body: typeof credentials === "string" ? { password: credentials } : credentials
  });
}

export function fetchCurrentSession(authToken) {
  return request("/api/auth/me", { authToken });
}

export function registerAdmin(account, authToken) {
  return request("/api/auth/admin/register", {
    method: "POST",
    authToken,
    body: account
  });
}

export function fetchAdminAccounts(authToken) {
  return request("/api/auth/admin/accounts", { authToken });
}

export function deleteAdminAccount(adminId, authToken) {
  return request(`/api/auth/admin/accounts/${adminId}`, {
    method: "DELETE",
    authToken
  });
}

export function sendTestEmail(authToken, email = "sandeepkumar.parangi@gmail.com") {
  return request("/api/notifications/test-email", {
    method: "POST",
    authToken,
    body: { email }
  });
}
