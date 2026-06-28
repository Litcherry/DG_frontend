"use client"

export function apiBase() {
  if (typeof window === "undefined") return "http://localhost:8000"
  return (localStorage.getItem("dg_api_base") || "http://localhost:8000").replace(/\/$/, "")
}

export function setApiBase(value: string) {
  localStorage.setItem("dg_api_base", value.replace(/\/$/, ""))
}

export function token() {
  if (typeof window === "undefined") return ""
  return localStorage.getItem("dg_admin_token") || ""
}

export function setToken(value: string) {
  localStorage.setItem("dg_admin_token", value)
  localStorage.setItem("dg_role", "admin")
}

export function clearToken() {
  localStorage.removeItem("dg_admin_token")
  localStorage.removeItem("dg_role")
}

export function authHeaders(extra: Record<string, string> = {}) {
  const current = token()
  return { ...extra, ...(current ? { Authorization: `Bearer ${current}` } : {}) }
}

function readErrorMessage(text: string, fallback: string) {
  if (!text) return fallback
  try {
    const data = JSON.parse(text)
    if (Array.isArray(data.detail)) return data.detail.map((item: any) => item.msg).join(", ")
    return data.detail || data.message || fallback
  } catch {
    return text
  }
}

export async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, options)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(readErrorMessage(text, `Request failed (${res.status})`))
  }
  const type = res.headers.get("content-type") || ""
  return type.includes("application/json") ? res.json() : ((res as unknown) as T)
}

export async function requestWithTimeout<T = any>(path: string, options: RequestInit = {}, timeoutMs = 12000): Promise<T> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await request<T>(path, { ...options, signal: controller.signal })
  } finally {
    window.clearTimeout(timer)
  }
}

export function resolveMediaURL(value = "") {
  const source = String(value || "").trim()
  if (!source) return ""
  if (/^(?:https?:|data:|blob:)/i.test(source)) return source
  return `${apiBase()}${source.startsWith("/") ? "" : "/"}${source}`
}

export function splitTags(value: string) {
  return value
    .split(/[,，、]/)
    .map((item) => item.trim())
    .filter(Boolean)
}
