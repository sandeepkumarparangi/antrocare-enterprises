const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

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
