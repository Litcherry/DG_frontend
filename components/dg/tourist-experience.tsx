"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Bot, Edit3, MapPin, Mic, MoreHorizontal, Navigation, Plus, Route, Send, Sparkles, Star, Trash2, Volume2, X } from "lucide-react"
import { apiBase, request, resolveMediaURL } from "@/components/dg/api"
import { VrmAvatarStage } from "@/components/dg/vrm-avatar-stage"

type TouristView = "chat" | "map" | "route" | "feedback"
type AvatarMode = "idle" | "talk" | "think" | "happy"
type Message = { role: "assistant" | "user"; content: string }
type HistoryItem = { id: string; title: string; messages: Message[]; updatedAt: string; interests?: string[] }
type Spot = {
  id?: number | string
  name: string
  description?: string
  location?: { lat?: number; lng?: number; latitude?: number; longitude?: number; lon?: number }
  latitude?: number
  longitude?: number
  lat?: number
  lng?: number
  image_url?: string
  cover_image?: string
  tags?: string[] | string
  visit_duration_min?: number
}
type RoutePlan = {
  id?: number | string
  name?: string
  routeName?: string
  route_name?: string
  description?: string
  reason?: string
  duration?: string
  duration_hours?: number
  total_duration_hours?: number
  target_tags?: string[] | string
  spot_sequence?: Array<Spot & { spot_id?: number | string }>
  spots?: Array<Spot | string>
}

const HISTORY_KEY = "dg_conversation_history"
const defaultInterests = ["历史文化", "自然风光", "休闲娱乐", "亲子游", "摄影打卡"]
const quickQuestions = ["有什么景点推荐？", "我对历史文化感兴趣，帮我规划一条路线", "适合亲子游的路线怎么走？", "附近有哪些服务设施？"]
const initialMessage = "您好，我是 AI 导览员。创建导览会话后，可以询问景点讲解、路线规划和服务信息。"
const localScenicSpots: Spot[] = [
  { id: "lingshan_screen", name: "灵山大照壁", lat: 31.41915, lng: 120.091, description: "景区入口处的标志性景观，适合作为路线起点。", tags: ["入口景观", "佛教文化", "拍照打卡"], visit_duration_min: 10 },
  { id: "shengjing_square", name: "胜境广场", lat: 31.41985, lng: 120.09165, description: "开阔舒适的入园集散空间，适合整理行程。", tags: ["休闲漫步", "游客集散"], visit_duration_min: 10 },
  { id: "wuming_bridge", name: "五明桥", lat: 31.4202, lng: 120.09235, description: "汉白玉石拱桥景观，寓意佛教智慧。", tags: ["佛教文化", "建筑艺术", "拍照打卡"], visit_duration_min: 10 },
  { id: "buddha_foot", name: "佛足坛", lat: 31.42075, lng: 120.0922, description: "以佛足印为核心的人文景观，氛围庄重安宁。", tags: ["佛教文化", "人文景观"], visit_duration_min: 15 },
  { id: "hundred_children_maitreya", name: "百子戏弥勒", lat: 31.4213, lng: 120.09275, description: "生动活泼的弥勒主题群像，适合亲子游览。", tags: ["亲子游", "佛教文化", "雕塑艺术"], visit_duration_min: 15 },
  { id: "nine_dragons", name: "九龙灌浴", lat: 31.42205, lng: 120.0932, description: "大型动态音乐群雕景观，呈现佛陀诞生故事。", tags: ["核心景点", "演艺景观", "亲子游"], visit_duration_min: 25 },
  { id: "bodhi_avenue", name: "菩提大道", lat: 31.42305, lng: 120.0936, description: "连接景区重要文化节点的景观步道，适合慢行。", tags: ["自然风光", "休闲漫步", "拍照打卡"], visit_duration_min: 20 },
  { id: "buddha_hand_square", name: "佛手广场", lat: 31.42395, lng: 120.0938, description: "以大型佛手造像为核心的互动打卡点。", tags: ["拍照打卡", "佛教文化"], visit_duration_min: 15 },
  { id: "xiangfu_temple", name: "祥符禅寺", lat: 31.425, lng: 120.0942, description: "历史悠久的佛教寺院建筑群，适合静心参访。", tags: ["佛教文化", "历史建筑", "静心参访"], visit_duration_min: 30 },
  { id: "buddha_square", name: "佛前广场", lat: 31.42655, lng: 120.0949, description: "仰望灵山大佛的主要观景空间，视野开阔。", tags: ["核心景点", "观景", "拍照打卡"], visit_duration_min: 15 },
  { id: "lingshan_buddha", name: "灵山大佛", lat: 31.42755, lng: 120.0953, description: "灵山胜境核心景点，适合了解佛教文化与大型露天造像艺术。", tags: ["佛教文化", "核心景点", "拍照打卡"], visit_duration_min: 40 },
  { id: "lingshan_palace", name: "灵山梵宫", lat: 31.4217, lng: 120.09745, description: "融合建筑、壁画、雕塑与演艺艺术的文化地标。", tags: ["建筑艺术", "佛教文化", "室内参观"], visit_duration_min: 45 },
  { id: "five_mudra_mandala", name: "五印坛城", lat: 31.4208, lng: 120.0987, description: "藏式建筑特色鲜明的文化景观。", tags: ["建筑艺术", "佛教文化", "拍照打卡"], visit_duration_min: 35 },
  { id: "manfeilong_pagoda", name: "曼飞龙塔", lat: 31.4229, lng: 120.09905, description: "造型精巧的佛塔景观，适合文化参观与摄影。", tags: ["建筑艺术", "拍照打卡", "人文景观"], visit_duration_min: 20 },
  { id: "lingshan_lodge", name: "灵山精舍", lat: 31.42025, lng: 120.10005, description: "环境清幽的禅意空间，适合短暂休息。", tags: ["休闲体验", "禅意空间"], visit_duration_min: 20 },
  { id: "palace_square", name: "梵宫广场", lat: 31.42125, lng: 120.09685, description: "梵宫前的开阔景观空间，适合欣赏建筑群。", tags: ["建筑艺术", "自然风光", "拍照打卡"], visit_duration_min: 15 },
]

function safeHistory(): HistoryItem[] {
  try {
    const value = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]")
    return Array.isArray(value)
      ? value
          .filter((item) => item?.id)
          .map((item) => ({
            id: String(item.id),
            title: String(item.title || "导览会话"),
            messages: Array.isArray(item.messages) ? item.messages : [],
            updatedAt: item.updatedAt || new Date().toISOString(),
            interests: Array.isArray(item.interests) ? item.interests : [],
          }))
      : []
  } catch {
    return []
  }
}

function persistHistory(items: HistoryItem[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 30)))
}

function normalizeTags(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (typeof value === "string") return value.split(/[,，、\s]+/).map((item) => item.trim()).filter(Boolean)
  return []
}

function spotLat(spot: Spot) {
  return Number(spot.latitude ?? spot.lat ?? spot.location?.lat ?? spot.location?.latitude ?? 31.4275)
}

function spotLng(spot: Spot) {
  return Number(spot.longitude ?? spot.lng ?? spot.location?.lng ?? spot.location?.lon ?? spot.location?.longitude ?? 120.0915)
}

function hasCoordinate(spot: Spot) {
  const lat = spotLat(spot)
  const lng = spotLng(spot)
  return Number.isFinite(lat) && Number.isFinite(lng) && !(Math.abs(lat) < 0.000001 && Math.abs(lng) < 0.000001)
}

function routeTitle(route: RoutePlan, index = 0) {
  return route.routeName || route.route_name || route.name || `推荐路线 ${index + 1}`
}

function routeSpots(route?: RoutePlan | null): Spot[] {
  const raw = route?.spot_sequence?.length ? route.spot_sequence : route?.spots || []
  return raw.map((item, index) => (typeof item === "string" ? { name: item || `景点 ${index + 1}` } : item))
}

function formatTime(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

function splitSpeechText(text: string) {
  const parts = text
    .replace(/\s+/g, " ")
    .split(/(?<=[。！？!?；;])/)
    .map((item) => item.trim())
    .filter(Boolean)
  if (parts.length) return parts
  const chunks: string[] = []
  for (let i = 0; i < text.length; i += 90) chunks.push(text.slice(i, i + 90))
  return chunks.filter(Boolean)
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)
    if (existing) {
      if ((window as any).L) resolve()
      else existing.addEventListener("load", () => resolve(), { once: true })
      return
    }
    const script = document.createElement("script")
    script.src = src
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("地图脚本加载失败"))
    document.head.appendChild(script)
  })
}

function loadStyle(href: string) {
  if (document.querySelector(`link[href="${href}"]`)) return
  const link = document.createElement("link")
  link.rel = "stylesheet"
  link.href = href
  document.head.appendChild(link)
}

function LeafletMap({ spots, activeSpot, onSelect }: { spots: Spot[]; activeSpot?: Spot | null; onSelect?: (spot: Spot) => void }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const polylineRef = useRef<any>(null)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function init() {
      loadStyle("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css")
      await loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js")
      if (cancelled || !containerRef.current || mapRef.current) return
      const L = (window as any).L
      mapRef.current = L.map(containerRef.current, { zoomControl: true, minZoom: 3, maxZoom: 19 }).setView([31.4275, 120.0915], 16)
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(mapRef.current)
      setMapReady(true)
    }
    init().catch(() => {})
    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      setMapReady(false)
    }
  }, [])

  useEffect(() => {
    const L = (window as any).L
    const map = mapRef.current
    if (!mapReady || !L || !map) return
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []
    if (polylineRef.current) {
      polylineRef.current.remove()
      polylineRef.current = null
    }

    const positioned = spots.filter(hasCoordinate)
    const points: [number, number][] = []
    positioned.forEach((spot, index) => {
      const point: [number, number] = [spotLat(spot), spotLng(spot)]
      points.push(point)
      const marker = L.marker(point, {
        icon: L.divIcon({
          className: "dg-route-marker",
          html: `<span>${index + 1}</span>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        }),
      })
        .addTo(map)
        .bindPopup(`<strong>${spot.name}</strong><p>${spot.description || ""}</p>`)
      marker.on("click", () => onSelect?.(spot))
      markersRef.current.push(marker)
    })

    if (points.length > 1) {
      polylineRef.current = L.polyline(points, { color: "#007a3d", weight: 4, opacity: 0.78, dashArray: "6 10" }).addTo(map)
      map.fitBounds(L.latLngBounds(points), { padding: [56, 56], maxZoom: 17 })
    } else if (points.length === 1) {
      map.setView(points[0], 17)
    } else {
      map.setView([31.4275, 120.0915], 16)
    }
    window.setTimeout(() => map.invalidateSize(), 80)
  }, [spots, onSelect, mapReady])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !activeSpot || !hasCoordinate(activeSpot)) return
    map.setView([spotLat(activeSpot), spotLng(activeSpot)], Math.max(map.getZoom(), 16), { animate: true })
  }, [activeSpot])

  return (
    <div className="relative h-full min-h-[520px] overflow-hidden rounded-[26px] border border-emerald-900/10 bg-emerald-50">
      <div ref={containerRef} className="h-full w-full" />
      {!spots.filter(hasCoordinate).length && (
        <div className="absolute inset-0 grid place-items-center bg-emerald-50 text-sm text-muted-foreground">暂无带坐标的景点数据</div>
      )}
    </div>
  )
}

export function TouristExperience({ view }: { view: TouristView }) {
  const [visitorName, setVisitorName] = useState("临时游客")
  const [conversationId, setConversationId] = useState("")
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: initialMessage }])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [error, setError] = useState("")
  const [recording, setRecording] = useState(false)
  const [avatarMode, setAvatarMode] = useState<AvatarMode>("idle")
  const [interests, setInterests] = useState<string[]>([])
  const [interestOptions, setInterestOptions] = useState(defaultInterests)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [menuId, setMenuId] = useState("")
  const [spots, setSpots] = useState<Spot[]>([])
  const [routes, setRoutes] = useState<RoutePlan[]>([])
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null)
  const [selectedRoute, setSelectedRoute] = useState<RoutePlan | null>(null)
  const [routeHours, setRouteHours] = useState("2")
  const [routeArea, setRouteArea] = useState("")
  const [routeAnswer, setRouteAnswer] = useState("")
  const [routeChatInput, setRouteChatInput] = useState("")
  const [routePlanning, setRoutePlanning] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const abortRef = useRef<AbortController | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const ttsControllersRef = useRef<Set<AbortController>>(new Set())
  const speechRunRef = useRef(0)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setVisitorName(localStorage.getItem("dg_visitor_name") || "临时游客")
    setHistory(safeHistory())
    loadScenicData()
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  function updateHistory(mutator: (items: HistoryItem[]) => HistoryItem[]) {
    setHistory((current) => {
      const next = mutator(current.length ? current : safeHistory()).slice(0, 30)
      persistHistory(next)
      return next
    })
  }

  function upsertHistory(id: string, patch: Partial<HistoryItem>) {
    updateHistory((items) => {
      const existing = items.find((item) => item.id === id)
      const nextItem: HistoryItem = {
        id,
        title: patch.title || existing?.title || "新的导览会话",
        messages: patch.messages || existing?.messages || [],
        interests: patch.interests || existing?.interests || [],
        updatedAt: new Date().toISOString(),
      }
      return [nextItem, ...items.filter((item) => item.id !== id)]
    })
  }

  function appendHistoryMessage(id: string, message: Message, title?: string) {
    updateHistory((items) => {
      const existing = items.find((item) => item.id === id)
      const messagesForItem = existing?.messages || []
      const nextItem: HistoryItem = {
        id,
        title: title || (message.role === "user" ? message.content.slice(0, 28) : existing?.title) || "导览会话",
        messages: [...messagesForItem, message],
        interests,
        updatedAt: new Date().toISOString(),
      }
      return [nextItem, ...items.filter((item) => item.id !== id)]
    })
  }

  async function loadScenicData() {
    try {
      const [spotData, routeData] = await Promise.all([
        request<Spot[]>("/api/spots").catch(() => []),
        request<RoutePlan[]>("/api/routes").catch(() => []),
      ])
      const backendSpots = (Array.isArray(spotData) ? spotData : []).map((spot) => ({ ...spot, tags: normalizeTags(spot.tags) }))
      const byName = new Map<string, Spot>()
      localScenicSpots.forEach((spot) => byName.set(spot.name, { ...spot, tags: normalizeTags(spot.tags) }))
      backendSpots.forEach((spot) => {
        const existing = byName.get(spot.name)
        byName.set(spot.name, { ...(existing || {}), ...spot, tags: normalizeTags(spot.tags).length ? normalizeTags(spot.tags) : normalizeTags(existing?.tags) })
      })
      const normalizedSpots = Array.from(byName.values())
      const normalizedRoutes = (Array.isArray(routeData) ? routeData : []).map((route) => ({
        ...route,
        target_tags: normalizeTags(route.target_tags),
        spot_sequence: routeSpots(route).map((spot) => ({ ...spot, tags: normalizeTags(spot.tags) })),
      }))
      setSpots(normalizedSpots)
      setRoutes(normalizedRoutes)
      setSelectedSpot((current) => current || normalizedSpots[0] || null)
      setSelectedRoute((current) => current || normalizedRoutes[0] || null)
    } catch {
      setError("景区数据暂时无法连接，请确认后端服务已启动。")
    }
  }

  async function createConversation(resetReply = true) {
    if (resetReply) stopReply(false)
    const visitorId = localStorage.getItem("dg_visitor_id") || crypto.randomUUID()
    localStorage.setItem("dg_visitor_id", visitorId)
    localStorage.setItem("dg_visitor_name", visitorName || "临时游客")
    const data = await request<any>("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitor_id: `${visitorName || "visitor"}-${visitorId}`, language: "zh" }),
    })
    const id = String(data.conversation_id || "")
    const greeting = data.greeting || "新的导览会话已创建，想了解景点、路线或服务信息，都可以直接问我。"
    setConversationId(id)
    setInterestOptions(Array.isArray(data.interest_options) ? data.interest_options : defaultInterests)
    setInterests([])
    setMessages([{ role: "assistant", content: greeting }])
    upsertHistory(id, { title: "新的导览会话", messages: [{ role: "assistant", content: greeting }], interests: [] })
    return id
  }

  async function loadConversation(id: string) {
    const item = history.find((entry) => entry.id === id) || safeHistory().find((entry) => entry.id === id)
    if (!item) return
    stopReply(false)
    setConversationId(id)
    setMessages(item.messages?.length ? item.messages : [{ role: "assistant", content: initialMessage }])
    setInterests(item.interests || [])
    setMenuId("")
    try {
      const data = await request<any>(`/api/conversations/${id}`)
      if (Array.isArray(data.interest_tags)) setInterests(data.interest_tags)
      if (Array.isArray(data.messages) && data.messages.length) {
        const remoteMessages = data.messages.map((msg: any) => ({ role: msg.role, content: msg.content })).filter((msg: Message) => msg.role && msg.content)
        setMessages(remoteMessages)
        upsertHistory(id, { ...item, messages: remoteMessages, interests: data.interest_tags || item.interests })
      }
    } catch {
      setError("已恢复本地历史，后端会话可能已过期。")
    }
  }

  function renameHistory(id: string) {
    const item = history.find((entry) => entry.id === id)
    if (!item) return
    const title = window.prompt("重命名对话", item.title)?.trim()
    if (!title) return
    updateHistory((items) => items.map((entry) => (entry.id === id ? { ...entry, title: title.slice(0, 40), updatedAt: new Date().toISOString() } : entry)))
    setMenuId("")
  }

  function deleteHistory(id: string) {
    const item = history.find((entry) => entry.id === id)
    if (!item || !window.confirm(`确定删除“${item.title || "导览会话"}”吗？`)) return
    updateHistory((items) => items.filter((entry) => entry.id !== id))
    if (conversationId === id) {
      setConversationId("")
      setMessages([{ role: "assistant", content: initialMessage }])
      setInterests([])
    }
    setMenuId("")
  }

  async function speakText(text: string, runId: number) {
    const sentences = splitSpeechText(text.slice(0, 1800))
    if (!sentences.length) return
    setSpeaking(true)
    setAvatarMode("talk")
    for (const sentence of sentences) {
      if (runId !== speechRunRef.current) break
      const controller = new AbortController()
      ttsControllersRef.current.add(controller)
      try {
        const res = await fetch(`${apiBase()}/api/voice/tts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: sentence, conversation_id: conversationId || null, language: "zh", voice_gender: "male" }),
          signal: controller.signal,
        })
        if (!res.ok) continue
        const url = URL.createObjectURL(await res.blob())
        const audio = new Audio(url)
        audioRef.current = audio
        await new Promise<void>((resolve) => {
          audio.onended = () => {
            URL.revokeObjectURL(url)
            resolve()
          }
          audio.onerror = () => {
            URL.revokeObjectURL(url)
            resolve()
          }
          audio.play().catch(() => resolve())
        })
      } catch {
      } finally {
        ttsControllersRef.current.delete(controller)
      }
    }
    if (runId === speechRunRef.current) {
      setSpeaking(false)
      setAvatarMode("idle")
      audioRef.current = null
    }
  }

  async function sendMessage(text = input) {
    const content = text.trim()
    if (!content || loading) return
    stopReply(false)
    const runId = ++speechRunRef.current
    setError("")
    setLoading(true)
    setAvatarMode("think")
    setInput("")
    let activeId = conversationId
    try {
      if (!activeId) activeId = await createConversation(false)
      const userMessage: Message = { role: "user", content }
      setMessages((current) => [...current, userMessage, { role: "assistant", content: "" }])
      appendHistoryMessage(activeId, userMessage, content.slice(0, 28))
      const controller = new AbortController()
      abortRef.current = controller
      const res = await fetch(`${apiBase()}/api/voice/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation_id: activeId, message: content, language: "zh", explain_mode: "normal" }),
        signal: controller.signal,
      })
      if (!res.ok || !res.body) throw new Error("问答服务暂时不可用")
      const reader = res.body.getReader()
      const decoder = new TextDecoder("utf-8")
      let buffer = ""
      let finalText = ""
      while (true) {
        const { value, done } = await reader.read()
        if (done || runId !== speechRunRef.current) break
        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split("\n\n")
        buffer = events.pop() || ""
        for (const event of events) {
          const line = event.split("\n").find((item) => item.startsWith("data:"))
          if (!line) continue
          const payload = JSON.parse(line.slice(5).trim())
          if (payload.type === "delta") finalText += payload.content || ""
          if (payload.type === "done") finalText = payload.content || finalText
          if (payload.type === "error") throw new Error(payload.message || payload.content || "服务暂时不可用")
          setMessages((current) => current.map((item, index) => (index === current.length - 1 ? { ...item, content: finalText } : item)))
        }
      }
      const assistantMessage: Message = { role: "assistant", content: finalText || "我暂时没有得到有效回复，请稍后再试。" }
      setMessages((current) => current.map((item, index) => (index === current.length - 1 ? assistantMessage : item)))
      appendHistoryMessage(activeId, assistantMessage)
      setLoading(false)
      if (assistantMessage.content) await speakText(assistantMessage.content, runId)
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        const message = err?.message || "后端服务暂时无法连接，请确认服务地址和启动状态。"
        setError(message)
        setMessages((current) => current.map((item, index) => (index === current.length - 1 && item.role === "assistant" ? { ...item, content: message } : item)))
      }
      setLoading(false)
      setAvatarMode("idle")
    } finally {
      abortRef.current = null
      if (!speaking) setAvatarMode("idle")
    }
  }

  function stopReply(abortGeneration = true) {
    speechRunRef.current += 1
    if (abortGeneration) abortRef.current?.abort()
    abortRef.current = null
    ttsControllersRef.current.forEach((controller) => controller.abort())
    ttsControllersRef.current.clear()
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ""
      audioRef.current = null
    }
    setLoading(false)
    setSpeaking(false)
    setAvatarMode("idle")
  }

  async function toggleInterest(tag: string) {
    const next = interests.includes(tag) ? interests.filter((item) => item !== tag) : [...interests, tag]
    setInterests(next)
    if (conversationId) {
      upsertHistory(conversationId, { interests: next })
      await request(`/api/conversations/${conversationId}/interests`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interest_tags: next }),
      }).catch(() => {})
    }
  }

  async function recommendRoute() {
    setError("")
    try {
      const data = await request<RoutePlan>("/api/routes/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interest_tags: interests, max_duration_hours: 4 }),
      })
      setSelectedRoute(data)
      const first = routeSpots(data)[0]
      if (first) setSelectedSpot(first)
      setAvatarMode("happy")
      window.setTimeout(() => setAvatarMode("idle"), 1600)
    } catch (err: any) {
      setError(err?.message || "路线推荐暂时不可用")
    }
  }

  function matchSpotName(name: string) {
    const target = name.trim().toLowerCase().replace(/\s+/g, "")
    if (!target) return null
    return spots.find((spot) => {
      const spotName = String(spot.name || "").trim().toLowerCase().replace(/\s+/g, "")
      return spotName === target || target.includes(spotName) || spotName.includes(target)
    }) || null
  }

  function parseRouteFromAIText(text: string) {
    const ordered: Spot[] = []
    const seen = new Set<string>()
    const addSpot = (spot: Spot | null) => {
      if (!spot || seen.has(String(spot.id || spot.name))) return
      seen.add(String(spot.id || spot.name))
      ordered.push(spot)
    }
    const routeLine = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => /^路线顺序\s*[:：]/.test(line))
    if (routeLine) {
      routeLine
        .replace(/^路线顺序\s*[:：]\s*/, "")
        .split(/\s*(?:→|->|—|-|、|,|，)\s*/)
        .forEach((name) => addSpot(matchSpotName(name)))
    }
    if (ordered.length < 2) {
      spots
        .map((spot) => ({ spot, index: text.indexOf(spot.name) }))
        .filter((item) => item.index >= 0)
        .sort((a, b) => a.index - b.index)
        .forEach((item) => addSpot(item.spot))
    }
    return ordered
  }

  function applyAIRoute(text: string) {
    const routeSpotList = parseRouteFromAIText(text)
    if (!routeSpotList.length) {
      setError("AI 已回复，但暂时没有识别到可定位景点。请在问题里补充更具体的景点或路线偏好。")
      return
    }
    const plan: RoutePlan = {
      id: `ai-${Date.now()}`,
      name: "AI 智能推荐路线",
      description: text,
      duration: routeHours ? `约 ${routeHours} 小时` : undefined,
      spots: routeSpotList,
    }
    setSelectedRoute(plan)
    setSelectedSpot(routeSpotList[0])
  }

  function buildRoutePrompt(userQuestion = "") {
    const availableSpots = spots
      .map((spot) => {
        const tags = normalizeTags(spot.tags).join("、")
        return `${spot.name}${tags ? `（${tags}）` : ""}${spot.description ? `：${spot.description.slice(0, 80)}` : ""}`
      })
      .join("\n")
    const conditions = [
      routeArea.trim() ? `当前位置：${routeArea.trim()}` : "",
      routeHours ? `游览时长：${routeHours} 小时` : "",
      interests.length ? `游客兴趣：${interests.join("、")}` : "",
      userQuestion.trim() ? `游客补充问题：${userQuestion.trim()}` : "",
    ].filter(Boolean).join("；")

    return `你是景区 AI 导览员，请根据游客约束和景区资料生成一条可在地图上定位的游览路线。
游客约束：${conditions || "暂无额外约束"}。
可用景点资料如下，只能从这些景点中选择，不要虚构景点：
${availableSpots || "暂无景点资料"}。
请直接输出路线。第一行必须使用格式：“路线顺序：景点A → 景点B → 景点C”，列出 2 到 6 个完整景点名称。
随后逐站说明推荐理由、停留建议和游览提醒。不要要求用户再次说明景区或偏好。`
  }

  async function requestAIRoutePlan(userQuestion = "") {
    const prompt = buildRoutePrompt(userQuestion)
    setError("")
    setRoutePlanning(true)
    setRouteAnswer("")
    setAvatarMode("think")
    stopReply(false)
    const runId = ++speechRunRef.current
    let activeId = conversationId
    try {
      if (!activeId) activeId = await createConversation(false)
      const controller = new AbortController()
      abortRef.current = controller
      const res = await fetch(`${apiBase()}/api/voice/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation_id: activeId, message: prompt, language: "zh", explain_mode: "normal" }),
        signal: controller.signal,
      })
      if (!res.ok || !res.body) throw new Error("路线规划服务暂时不可用")
      const reader = res.body.getReader()
      const decoder = new TextDecoder("utf-8")
      let buffer = ""
      let finalText = ""
      while (true) {
        const { value, done } = await reader.read()
        if (done || runId !== speechRunRef.current) break
        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split("\n\n")
        buffer = events.pop() || ""
        for (const event of events) {
          const line = event.split("\n").find((item) => item.startsWith("data:"))
          if (!line) continue
          const payload = JSON.parse(line.slice(5).trim())
          if (payload.type === "delta") finalText += payload.content || ""
          if (payload.type === "done") finalText = payload.content || finalText
          if (payload.type === "error") throw new Error(payload.message || payload.content || "路线规划服务暂时不可用")
          setRouteAnswer(finalText)
        }
      }
      setRouteAnswer(finalText)
      applyAIRoute(finalText)
      appendHistoryMessage(activeId, { role: "user", content: userQuestion || "请根据当前位置和游览时长推荐路线" }, "路线规划")
      appendHistoryMessage(activeId, { role: "assistant", content: finalText })
      if (finalText) await speakText(finalText, runId)
    } catch (err: any) {
      if (err?.name !== "AbortError") setError(err?.message || "路线规划服务暂时不可用")
    } finally {
      setRoutePlanning(false)
      abortRef.current = null
      if (!speaking) setAvatarMode("idle")
    }
  }

  async function toggleRecording() {
    if (recording) {
      recorderRef.current?.stop()
      setRecording(false)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      audioChunksRef.current = []
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop())
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" })
        const form = new FormData()
        form.append("audio", blob, "voice.webm")
        try {
          const data = await request<any>("/api/voice/asr", { method: "POST", body: form })
          if (data.text) await sendMessage(data.text)
        } catch (err: any) {
          setError(err?.message || "语音识别失败")
        }
      }
      recorderRef.current = recorder
      recorder.start()
      setRecording(true)
    } catch {
      setError("无法使用麦克风，请检查浏览器权限。")
    }
  }

  async function submitFeedback() {
    let id = conversationId
    if (!id) id = await createConversation()
    await request(`/api/conversations/${id}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment: comment || null }),
    })
    setComment("")
    setError("")
    window.alert("感谢评价，反馈已提交。")
  }

  const activeRouteSpots = useMemo(() => {
    const fromRoute = routeSpots(selectedRoute)
    return fromRoute.length ? fromRoute : spots
  }, [selectedRoute, spots])
  const mapSpots = view === "route" ? activeRouteSpots : spots

  if (view === "feedback") {
    return (
      <div className="grid h-full place-items-center bg-white">
        <section className="w-full max-w-2xl rounded-[28px] border border-border bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Service Feedback</p>
          <h2 className="mt-2 text-3xl font-bold">服务反馈</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">评价本次 AI 导览体验，反馈会关联到当前导览会话；没有会话时会自动创建一条新的会话记录。</p>
          <div className="mt-8 space-y-5">
            <label className="block space-y-2">
              <span className="text-sm font-semibold">评分</span>
                            <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((item) => (
                  <button key={item} type="button" onClick={() => setRating(item)} className={`text-3xl transition hover:-translate-y-0.5 ${item <= rating ? "text-amber-400" : "text-slate-300"}`} aria-label={`${item} 星`}>
                    ★
                  </button>
                ))}
                <span className="ml-2 text-sm font-semibold text-muted-foreground">{rating} 星</span>
              </div>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-semibold">评价内容</span>
              <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={5} placeholder="可以写下你对讲解、路线推荐、语音体验的感受" className="w-full resize-none rounded-2xl border border-border px-4 py-3 text-sm outline-none focus:border-primary" />
            </label>
            {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}
            <button type="button" onClick={submitFeedback} className="h-12 w-full rounded-full bg-primary text-sm font-semibold text-white transition hover:bg-primary/90">
              提交反馈
            </button>
          </div>
        </section>
      </div>
    )
  }

  if (view === "map" || view === "route") {
    return (
      <div className="grid h-full min-h-0 grid-cols-[minmax(350px,410px)_1fr_minmax(300px,360px)] gap-5 overflow-hidden bg-white">
        <aside className="min-h-0 overflow-auto rounded-[26px] border border-border bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Scenic Guide</p>
              <h2 className="mt-1 text-2xl font-bold">{view === "map" ? "地图导览" : "路线推荐"}</h2>
            </div>
            <button type="button" onClick={loadScenicData} className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold transition hover:bg-muted">刷新</button>
          </div>
          <div className="mb-4 rounded-2xl border border-emerald-900/10 bg-emerald-50/70 p-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1 text-xs font-semibold text-muted-foreground">
                游览时长
                <input value={routeHours} onChange={(event) => setRouteHours(event.target.value)} className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-bold text-foreground outline-none focus:border-primary" />
              </label>
              <label className="space-y-1 text-xs font-semibold text-muted-foreground">
                当前位置
                <input value={routeArea} onChange={(event) => setRouteArea(event.target.value)} placeholder="如：景区东门" className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary" />
              </label>
            </div>
            <button type="button" onClick={() => requestAIRoutePlan()} disabled={routePlanning} className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-60">
              <Sparkles className="h-4 w-4" />
              {routePlanning ? "正在生成路线..." : "生成推荐路线"}
            </button>
          </div>
          {selectedRoute ? (
            <div className="mb-4 rounded-2xl border border-border bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-primary">当前路线</span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-primary">{routeSpots(selectedRoute).length} 个景点</span>
              </div>
              <strong className="block text-lg leading-tight">{routeTitle(selectedRoute)}</strong>
              <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">{selectedRoute.description || selectedRoute.reason || "已根据你的游览约束生成路线。"}</p>
            </div>
          ) : null}
          <div className="space-y-3">
            {(routeSpots(selectedRoute).length ? routeSpots(selectedRoute) : spots).map((spot, index) => (
              <button key={`${spot.id || spot.name}`} type="button" onClick={() => setSelectedSpot(spot)} className={`w-full rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 ${selectedSpot?.name === spot.name ? "border-primary bg-primary/5" : "border-border bg-white"}`}>
                <div className="flex gap-3">
                  {spot.image_url || spot.cover_image ? <img src={resolveMediaURL(spot.image_url || spot.cover_image || "")} alt={spot.name} className="h-16 w-20 rounded-xl object-cover" /> : <div className="grid h-16 w-20 place-items-center rounded-xl bg-emerald-50 text-primary"><MapPin className="h-5 w-5" /></div>}
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold text-primary">路线第 {index + 1} 站</span>
                    <strong className="block truncate text-sm">{spot.name}</strong>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{spot.description || "暂无简介"}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="relative min-h-0">
          <LeafletMap spots={mapSpots} activeSpot={selectedSpot} onSelect={setSelectedSpot} />
          <div className="absolute bottom-5 right-5 z-[500] w-[380px] max-w-[calc(100%-2rem)]">
            <div className="mb-3 ml-auto flex w-fit items-center gap-3 rounded-2xl bg-white/90 px-4 py-3 shadow-xl backdrop-blur-md">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-xs font-bold text-white">DG</span>
              <div>
                <h3 className="font-bold">小号路线助手</h3>
                <p className="text-xs text-muted-foreground">告诉我同行人员和游览偏好</p>
              </div>
            </div>
            <div className="flex items-end gap-2">
              <textarea value={routeChatInput} onChange={(event) => setRouteChatInput(event.target.value)} rows={2} placeholder="例如：带老人游玩，路线轻松一点" className="min-h-12 flex-1 resize-none rounded-2xl border border-border bg-white/95 px-3 py-2 text-sm shadow-xl outline-none backdrop-blur focus:border-primary" />
              {(routePlanning || speaking) ? (
                <button type="button" onClick={() => stopReply(true)} className="h-12 rounded-2xl border border-border bg-white/95 px-4 text-sm font-semibold shadow-xl backdrop-blur transition hover:bg-muted">停止</button>
              ) : null}
              <button type="button" onClick={() => requestAIRoutePlan(routeChatInput)} disabled={routePlanning || !routeChatInput.trim()} className="h-12 rounded-2xl bg-primary px-5 text-sm font-semibold text-white shadow-xl transition hover:bg-primary/90 disabled:opacity-50">询问</button>
            </div>
          </div>
        </section>

        <aside className="min-h-0 overflow-auto rounded-[26px] border border-border bg-white p-5 shadow-sm">
          <div className="mb-5 rounded-2xl bg-emerald-950 p-4 text-white">
            <p className="text-xs text-white/70">当前景点</p>
            <h3 className="mt-1 text-xl font-bold">{selectedSpot?.name || "请选择景点"}</h3>
            {selectedSpot?.image_url || selectedSpot?.cover_image ? (
              <img src={resolveMediaURL(selectedSpot.image_url || selectedSpot.cover_image || "")} alt={selectedSpot.name} className="mt-3 h-40 w-full rounded-2xl object-cover" />
            ) : null}            <p className="mt-3 text-sm leading-7 text-white/78">{selectedSpot?.description || "点击左侧景点或地图标记，查看景点介绍与路线位置。"}</p>
          </div>
          <div className="mb-5">
            <h3 className="mb-3 flex items-center gap-2 text-lg font-bold"><Sparkles className="h-5 w-5 text-primary" />兴趣偏好</h3>
            <div className="flex flex-wrap gap-2">
              {interestOptions.map((tag) => (
                <button key={tag} type="button" onClick={() => toggleInterest(tag)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${interests.includes(tag) ? "border-primary bg-primary text-white" : "border-border hover:bg-muted"}`}>{tag}</button>
              ))}
            </div>
            <button type="button" onClick={recommendRoute} className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-white transition hover:bg-primary/90">
              <Route className="h-4 w-4" />
              根据偏好推荐路线
            </button>
          </div>
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-lg font-bold"><Navigation className="h-5 w-5 text-primary" />路线列表</h3>
            <div className="space-y-3">
              {(selectedRoute ? [selectedRoute, ...routes.filter((item) => item.id !== selectedRoute.id)] : routes).map((route, index) => (
                <button key={`${route.id || routeTitle(route, index)}`} type="button" onClick={() => { setSelectedRoute(route); const first = routeSpots(route)[0]; if (first) setSelectedSpot(first) }} className="w-full rounded-2xl border border-border p-3 text-left transition hover:-translate-y-0.5 hover:bg-muted/50">
                  <strong className="block text-sm">{routeTitle(route, index)}</strong>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{routeSpots(route).map((spot) => spot.name).join(" → ") || route.description || "暂无景点序列"}</p>
                </button>
              ))}
            </div>
          </div>
          {error ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}
        </aside>
      </div>
    )
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(520px,700px)_minmax(420px,1fr)_minmax(280px,340px)] gap-5 overflow-hidden bg-white">
      <aside className="min-h-0 overflow-hidden">
        <VrmAvatarStage mode={avatarMode} className="h-full min-h-[620px]" />
      </aside>

      <section className="flex min-h-0 flex-col overflow-hidden rounded-[26px] border border-border bg-white shadow-sm">
        <header className="flex h-16 items-center justify-between border-b border-border px-5">
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-50 text-primary"><Bot className="h-4 w-4" /></span>
            <div>
              <h2 className="font-bold">AI 导览员在线</h2>
              <p className="text-xs text-muted-foreground">{conversationId ? `会话 ${conversationId}` : "新的导览会话"}</p>
            </div>
          </div>
          {(loading || speaking) ? <button type="button" onClick={() => stopReply(true)} className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-semibold transition hover:bg-muted"><X className="h-3.5 w-3.5" />停止回复</button> : null}
        </header>
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-auto bg-gradient-to-b from-white to-slate-50/70 p-5">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-7 shadow-sm ${message.role === "user" ? "bg-primary text-white" : "border border-border bg-white text-foreground"}`}>
                {message.content || <span className="text-muted-foreground">正在组织回答...</span>}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-border bg-white p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {quickQuestions.map((item) => (
              <button key={item} type="button" onClick={() => sendMessage(item)} className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold transition hover:bg-muted">{item}</button>
            ))}
          </div>
          {error ? <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-2 rounded-full border border-border bg-white p-2 shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
            <button type="button" onClick={createConversation} className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition hover:bg-muted" title="新建会话"><Plus className="h-5 w-5" /></button>
            <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage() } }} rows={1} placeholder="有问题，尽管问" className="max-h-28 min-h-10 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground" />
            <button type="button" onClick={toggleRecording} className={`grid h-10 w-10 place-items-center rounded-full transition ${recording ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"}`} title="语音输入"><Mic className="h-4 w-4" /></button>
            {(loading || speaking) ? (
              <button type="button" onClick={() => stopReply(true)} className="grid h-10 w-10 place-items-center rounded-full bg-red-50 text-red-600 transition hover:bg-red-100" title="停止回复"><X className="h-4 w-4" /></button>
            ) : (
              <button type="button" onClick={() => speakText(messages.filter((item) => item.role === "assistant" && item.content).at(-1)?.content || "", ++speechRunRef.current)} className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition hover:bg-muted" title="朗读最近回复"><Volume2 className="h-4 w-4" /></button>
            )}
            <button type="button" onClick={() => sendMessage()} disabled={!input.trim() || loading} className="grid h-10 w-10 place-items-center rounded-full bg-primary text-white transition hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"><Send className="h-4 w-4" /></button>
          </div>
        </div>
      </section>

      <aside className="min-h-0 space-y-4 overflow-auto rounded-[26px] border border-border bg-white p-5 shadow-sm">
        <section>
          <h3 className="mb-3 text-lg font-bold">导览会话</h3>
          <button type="button" onClick={createConversation} className="mb-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-muted text-sm font-semibold transition hover:bg-muted/80"><Plus className="h-4 w-4" />新聊天</button>
          <div className="space-y-2">
            {history.length ? history.map((item) => (
              <div key={item.id} className={`relative rounded-xl transition ${conversationId === item.id ? "bg-emerald-50" : "hover:bg-muted"}`}>
                <button type="button" onClick={() => loadConversation(item.id)} className="w-full p-3 pr-10 text-left">
                  <strong className="block truncate text-sm">{item.title || "导览会话"}</strong>
                  <span className="mt-1 block truncate text-xs text-muted-foreground">{item.messages.at(-1)?.content || "暂无对话内容"}</span>
                  <span className="mt-1 block text-[11px] text-muted-foreground">{formatTime(item.updatedAt)}</span>
                </button>
                <button type="button" onClick={() => setMenuId(menuId === item.id ? "" : item.id)} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-white"><MoreHorizontal className="h-4 w-4" /></button>
                {menuId === item.id ? (
                  <div className="absolute right-2 top-11 z-10 w-36 rounded-xl border border-border bg-white p-1 shadow-xl">
                    <button type="button" onClick={() => renameHistory(item.id)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs hover:bg-muted"><Edit3 className="h-3.5 w-3.5" />重命名</button>
                    <button type="button" onClick={() => deleteHistory(item.id)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" />删除</button>
                  </div>
                ) : null}
              </div>
            )) : <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">暂无历史会话</p>}
          </div>
        </section>
        <section className="rounded-2xl border border-border p-4">
          <h3 className="mb-3 flex items-center gap-2 font-bold"><Sparkles className="h-4 w-4 text-primary" />兴趣偏好</h3>
          <div className="flex flex-wrap gap-2">
            {interestOptions.map((tag) => (
              <button key={tag} type="button" onClick={() => toggleInterest(tag)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${interests.includes(tag) ? "border-primary bg-primary text-white" : "border-border hover:bg-muted"}`}>{tag}</button>
            ))}
          </div>
          <button type="button" onClick={recommendRoute} className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-white"><Route className="h-4 w-4" />推荐路线</button>
        </section>
      </aside>
    </div>
  )
}


