const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || `API error ${response.status}`);
  return payload.data;
}

export const api = {
  dashboard: () => request("/dashboard"),
  hierarchy: () => request("/hierarchy"),
  telemetry: (nodeId, minutes = 15) => request(`/nodes/${nodeId}/telemetry?minutes=${minutes}`),
  alerts: () => request("/alerts"),
  acknowledge: (id) => request(`/alerts/${id}/acknowledge`, { method: "PATCH" }),
  tickets: () => request("/tickets"),
  createTicket: (data) => request("/tickets", { method: "POST", body: JSON.stringify(data) }),
  updateTicket: (id, data) => request(`/tickets/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  pue: () => request("/reports/pue"),
  auditLogs: () => request("/audit-logs"),
};
