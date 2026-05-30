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
      ...(options.adminKey ? { "X-Admin-Key": options.adminKey } : {})
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
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

export function updateProduct(product, adminKey) {
  return request(`/api/products/${product.id}`, {
    method: "PATCH",
    adminKey,
    body: {
      cost: product.cost,
      status: product.status
    }
  });
}
