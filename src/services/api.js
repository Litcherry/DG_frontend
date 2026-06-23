const DEFAULT_API_BASE = "http://localhost:8000";

export function getApiBase() {
  return (localStorage.getItem("dg_api_base") || DEFAULT_API_BASE).replace(/\/$/, "");
}

export function authHeaders(extra = {}) {
  const token = localStorage.getItem("dg_admin_token");
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${getApiBase()}${path}`, options);
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }
  if (!response.ok) {
    const message = payload?.detail || payload?.message || text || `请求失败（${response.status}）`;
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }
  return payload;
}
