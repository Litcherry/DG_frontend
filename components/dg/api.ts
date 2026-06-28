"use client"

export type AdminSource = "backend" | "demo"

export const demoData = {
  overview: {
    total_conversations: 1286,
    total_messages: 4932,
    avg_response_ms: 1680,
    avg_satisfaction: 4.7,
    rag_hit_rate: 0.92,
  },
  satisfaction: {
    trend: [
      { date: "周一", avg_rating: 4.3, count: 18 },
      { date: "周二", avg_rating: 4.5, count: 22 },
      { date: "周三", avg_rating: 4.6, count: 25 },
      { date: "周四", avg_rating: 4.4, count: 19 },
      { date: "周五", avg_rating: 4.8, count: 31 },
      { date: "周六", avg_rating: 4.9, count: 42 },
      { date: "周日", avg_rating: 4.7, count: 37 },
    ],
    distribution: { 1: 3, 2: 5, 3: 18, 4: 61, 5: 107 },
  },
  emotions: { 积极: 64, 平稳: 25, 思考: 8, 致歉: 3 },
  hotQuestions: [
    { question_pattern: "灵山大佛怎么游览？", count: 86 },
    { question_pattern: "九龙灌浴表演有什么特色？", count: 71 },
    { question_pattern: "适合老人的游玩路线？", count: 54 },
    { question_pattern: "梵宫需要游览多久？", count: 38 },
    { question_pattern: "停车场和餐饮在哪里？", count: 29 },
  ],
  interests: {
    自然风光: 26,
    历史文化: 38,
    佛教文化: 44,
    休闲娱乐: 18,
    拍照打卡: 25,
    亲子游览: 17,
    餐饮购物: 12,
  },
  hotSpots: [
    { spot_name: "灵山大佛", mention_count: 236 },
    { spot_name: "九龙灌浴", mention_count: 198 },
    { spot_name: "灵山梵宫", mention_count: 174 },
    { spot_name: "五印坛城", mention_count: 126 },
    { spot_name: "五明桥", mention_count: 93 },
  ],
}

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
    if (Array.isArray(data.detail)) return data.detail.map((item: any) => item.msg).join("，")
    return data.detail || data.message || fallback
  } catch {
    return text
  }
}

export async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, options)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(readErrorMessage(text, `请求失败（${res.status}）`))
  }
  const type = res.headers.get("content-type") || ""
  return type.includes("application/json") ? res.json() : (res as T)
}

export async function requestAdminData<T>(path: string, fallback: T) {
  try {
    return { data: await request<T>(path, { headers: authHeaders() }), source: "backend" as AdminSource }
  } catch (error) {
    console.warn(`[DG admin demo fallback] ${path}`, error)
    return { data: fallback, source: "demo" as AdminSource }
  }
}

export function resolveMediaURL(value = "") {
  const source = String(value || "").trim()
  if (!source) return ""
  if (/^(?:https?:|data:|blob:)/i.test(source)) return source
  return `${apiBase()}${source.startsWith("/") ? "" : "/"}${source}`
}

export function splitTags(value: string) {
  return value.split(/[,，、]/).map((item) => item.trim()).filter(Boolean)
}
