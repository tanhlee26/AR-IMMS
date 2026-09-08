const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

// ─── Token helpers (localStorage) ───────────────────────────────────────────
export const tokenStorage = {
  get: () => (typeof window !== "undefined" ? localStorage.getItem("ar_imms_token") : null),
  set: (token) => typeof window !== "undefined" && localStorage.setItem("ar_imms_token", token),
  remove: () => typeof window !== "undefined" && localStorage.removeItem("ar_imms_token"),
};

// ─── Base request với tự động đính kèm Bearer Token ─────────────────────────
async function request(path, options = {}) {
  const token = tokenStorage.get();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));

  // Token hết hạn hoặc không hợp lệ → xóa token, để UI tự redirect
  if (response.status === 401) {
    tokenStorage.remove();
    throw new Error("UNAUTHORIZED");
  }

  if (!response.ok) throw new Error(payload.message || `API error ${response.status}`);
  return payload.data;
}

// ─── Auth endpoints (không cần token) ────────────────────────────────────────
async function publicRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || `API error ${response.status}`);
  return payload.data;
}

// ─── API exports ─────────────────────────────────────────────────────────────
export const api = {
  // Auth
  login: (identifier, password) =>
    publicRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    }),
  register: (username, email, password, full_name, role) =>
    publicRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password, full_name, role }),
    }),
  me: () => request("/auth/me"),

  // Dashboard & Monitoring
  dashboard: () => request("/dashboard"),
  hierarchy: () => request("/hierarchy"),
  telemetry: (nodeId, minutes = 15) => request(`/nodes/${nodeId}/telemetry?minutes=${minutes}`),

  // Alerts
  alerts: () => request("/alerts"),
  acknowledge: (id) => request(`/alerts/${id}/acknowledge`, { method: "PATCH" }),

  // Tickets
  tickets: () => request("/tickets"),
  createTicket: (data) => request("/tickets", { method: "POST", body: JSON.stringify(data) }),
  updateTicket: (id, data) => request(`/tickets/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  // Reports & Audit
  pue: () => request("/reports/pue"),
  auditLogs: () => request("/audit-logs"),
};
