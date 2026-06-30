"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Bot, Edit3, MapPin, Mic, MoreHorizontal, Navigation, Plus, Route, Send, Sparkles, Star, Trash2, Volume2, X } from "lucide-react"
import { apiBase, request, resolveMediaURL } from "@/components/dg/api"
import { guideForModel, VrmAvatarStage, type VrmGuideOption } from "@/components/dg/vrm-avatar-stage"

type TouristView = "chat" | "map" | "route" | "feedback"
type AvatarMode = "idle" | "talk" | "think" | "happy"
type Message = { role: "assistant" | "user"; content: string }
type HistoryItem = { id: string; title: string; messages: Message[]; updatedAt: string; interests?: string[] }
type ScenicBackdrop = { name: string; url: string }
type Spot = {
  id?: number | string
  name: string
  description?: string
  sort_order?: number
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
const attractionFallbackImages = [
  "/assets/images/lingshan-hero.png",
  "/assets/images/snow-mountain-lake-wide.png",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Huangshan_pic_4.jpg?width=1200",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Zhangjiajie_National_Forest_Park.jpg?width=1200",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Li_River,_Guilin,_China.jpg?width=1200",
]
const spotGalleryImages: Record<string, string> = {
  灵山大照壁: "/assets/images/lingshan-hero.png",
  胜境广场: "https://commons.wikimedia.org/wiki/Special:FilePath/Great_Wall_of_China_at_Jinshanling-edit.jpg?width=1200",
  五明桥: "https://commons.wikimedia.org/wiki/Special:FilePath/Huangshan_pic_4.jpg?width=1200",
  佛足坛: "https://commons.wikimedia.org/wiki/Special:FilePath/Li_River,_Guilin,_China.jpg?width=1200",
  百子戏弥勒: "https://commons.wikimedia.org/wiki/Special:FilePath/Zhangjiajie_National_Forest_Park.jpg?width=1200",
  九龙灌浴: "https://commons.wikimedia.org/wiki/Special:FilePath/Great_Wall_of_China_July_2006.JPG?width=1200",
  菩提大道: "https://commons.wikimedia.org/wiki/Special:FilePath/Longji_Rice_Terraces,_Guangxi,_China.jpg?width=1200",
  佛手广场: "https://commons.wikimedia.org/wiki/Special:FilePath/Yungang_Grottoes_2007_1.jpg?width=1200",
  祥符禅寺: "https://commons.wikimedia.org/wiki/Special:FilePath/Buddhist_temple_in_Wutai_Shan.jpg?width=1200",
  佛前广场: "/assets/images/lingshan-hero.png",
  灵山大佛: "/assets/images/lingshan-hero.png",
  灵山梵宫: "https://commons.wikimedia.org/wiki/Special:FilePath/Forbidden_City_Beijing_Shenwumen_Gate.JPG?width=1200",
  五印坛城: "https://commons.wikimedia.org/wiki/Special:FilePath/Potala_Palace,_Lhasa,_Tibet.jpg?width=1200",
  曼飞龙塔: "https://commons.wikimedia.org/wiki/Special:FilePath/Dali_Three_Pagodas_2009_06.jpg?width=1200",
  灵山精舍: "https://commons.wikimedia.org/wiki/Special:FilePath/Jiuzhaigou_Valley.jpg?width=1200",
  梵宫广场: "https://commons.wikimedia.org/wiki/Special:FilePath/Temple_of_Heaven_in_Beijing.JPG?width=1200",
}
const masonryRowSpans = [18, 24, 15, 21, 28, 17, 23, 19, 26, 16]
const localScenicSpots: Spot[] = [
  { id: "lingshan_screen", name: "灵山大照壁", lat: 31.41915, lng: 120.091, description: "景区入口处的标志性景观，适合作为路线起点。", tags: ["入口景观", "佛教文化", "拍照打卡"], visit_duration_min: 10 },
  { id: "shengjing_square", name: "胜境广场", lat: 31.41985, lng: 120.09165, description: "开阔舒适的入园集散空间，适合整理行程。", tags: ["休闲漫步", "游客集散"], visit_duration_min: 10 },
  { id: "wuming_bridge", name: "五明桥", lat: 31.4202, lng: 120.09235, description: "汉白玉石拱桥景观，寓意佛教智慧。", tags: ["佛教文化", "建筑艺术", "拍照打卡"], visit_duration_min: 10 },
  { id: "buddha_foot", name: "佛足坛", lat: 31.42075, lng: 120.0922, description: "以佛足印为核心的人文景观，氛围庄重安宁。", tags: ["佛教文化", "人文景观"], visit_duration_min: 15 },
  { id: "hundred_children_maitreya", name: "百子戏弥勒", lat: 31.4213, lng: 120.09275, description: "生动活泼的弥勒主题群像，适合亲子游览。", tags: ["亲子游", "佛教文化", "雕塑艺术"], visit_duration_min: 15 },
  { id: "nine_dragons", name: "九龙灌浴", lat: 31.42255, lng: 120.09308, description: "大型动态音乐群雕景观，呈现佛陀诞生故事。", tags: ["核心景点", "演艺景观", "亲子游"], visit_duration_min: 25 },
  { id: "bodhi_avenue", name: "菩提大道", lat: 31.42305, lng: 120.0936, description: "连接景区重要文化节点的景观步道，适合慢行。", tags: ["自然风光", "休闲漫步", "拍照打卡"], visit_duration_min: 20 },
  { id: "buddha_hand_square", name: "佛手广场", lat: 31.42395, lng: 120.0938, description: "以大型佛手造像为核心的互动打卡点。", tags: ["拍照打卡", "佛教文化"], visit_duration_min: 15 },
  { id: "xiangfu_temple", name: "祥符禅寺", lat: 31.4262, lng: 120.0944, description: "历史悠久的佛教寺院建筑群，适合静心参访。", tags: ["佛教文化", "历史建筑", "静心参访"], visit_duration_min: 30 },
  { id: "buddha_square", name: "佛前广场", lat: 31.4281, lng: 120.09575, description: "仰望灵山大佛的主要观景空间，视野开阔。", tags: ["核心景点", "观景", "拍照打卡"], visit_duration_min: 15 },
  { id: "lingshan_buddha", name: "灵山大佛", lat: 31.43194, lng: 120.09139, description: "灵山胜境核心景点，适合了解佛教文化与大型露天造像艺术。", tags: ["佛教文化", "核心景点", "拍照打卡"], visit_duration_min: 40 },
  { id: "lingshan_palace", name: "灵山梵宫", lat: 31.4266, lng: 120.0915, description: "融合建筑、壁画、雕塑与演艺艺术的文化地标。", tags: ["建筑艺术", "佛教文化", "室内参观"], visit_duration_min: 45 },
  { id: "five_mudra_mandala", name: "五印坛城", lat: 31.428, lng: 120.0888, description: "藏式建筑特色鲜明的文化景观。", tags: ["建筑艺术", "佛教文化", "拍照打卡"], visit_duration_min: 35 },
  { id: "manfeilong_pagoda", name: "曼飞龙塔", lat: 31.4291, lng: 120.0876, description: "造型精巧的佛塔景观，适合文化参观与摄影。", tags: ["建筑艺术", "拍照打卡", "人文景观"], visit_duration_min: 20 },
  { id: "lingshan_lodge", name: "灵山精舍", lat: 31.4273, lng: 120.0882, description: "环境清幽的禅意空间，适合短暂休息。", tags: ["休闲体验", "禅意空间"], visit_duration_min: 20 },
  { id: "palace_square", name: "梵宫广场", lat: 31.42605, lng: 120.09095, description: "梵宫前的开阔景观空间，适合欣赏建筑群。", tags: ["建筑艺术", "自然风光", "拍照打卡"], visit_duration_min: 15 },
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

function normalizeSpotName(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[()（）【】「」《》]/g, "")
    .replace(/景区|景点|文化园/g, "")
}

function spotLat(spot: Spot) {
  return Number(spot.latitude ?? spot.lat ?? spot.location?.lat ?? spot.location?.latitude)
}

function spotLng(spot: Spot) {
  return Number(spot.longitude ?? spot.lng ?? spot.location?.lng ?? spot.location?.lon ?? spot.location?.longitude)
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
  const [avatarBackdrop, setAvatarBackdrop] = useState<ScenicBackdrop | null>(null)
  const [previousAvatarBackdrop, setPreviousAvatarBackdrop] = useState<ScenicBackdrop | null>(null)
  const [currentGuide, setCurrentGuide] = useState<VrmGuideOption>(() => guideForModel("/assets/vrm/7533417284697534698.vrm"))
  const [interests, setInterests] = useState<string[]>([])
  const [interestOptions, setInterestOptions] = useState(defaultInterests)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [menuId, setMenuId] = useState("")
  const [spots, setSpots] = useState<Spot[]>([])
  const [routes, setRoutes] = useState<RoutePlan[]>([])
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null)
  const [spotDetailOpen, setSpotDetailOpen] = useState(false)
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
  const backdropSequenceTimerRef = useRef<number | null>(null)
  const backdropSessionRef = useRef(0)
  const failedBackdropUrlsRef = useRef<Set<string>>(new Set())
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const handleGuideChange = useCallback((guide: VrmGuideOption) => {
    setCurrentGuide(guide)
  }, [])

  useEffect(() => {
    setVisitorName(localStorage.getItem("dg_visitor_name") || "临时游客")
    setHistory(safeHistory())
    loadScenicData()
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (!previousAvatarBackdrop) return
    const timer = window.setTimeout(() => setPreviousAvatarBackdrop(null), 1200)
    return () => window.clearTimeout(timer)
  }, [previousAvatarBackdrop])

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
        const merged = { ...(existing || {}), ...spot, tags: normalizeTags(spot.tags).length ? normalizeTags(spot.tags) : normalizeTags(existing?.tags) }
        if (existing && hasCoordinate(existing)) {
          merged.lat = existing.lat
          merged.lng = existing.lng
          merged.latitude = existing.latitude
          merged.longitude = existing.longitude
          merged.location = existing.location
        }
        byName.set(spot.name, merged)
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
      setSelectedRoute((current) => current)
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

  async function createIsolatedRouteConversation() {
    const visitorId = localStorage.getItem("dg_visitor_id") || crypto.randomUUID()
    localStorage.setItem("dg_visitor_id", visitorId)
    const data = await request<any>("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitor_id: `route-${visitorName || "visitor"}-${visitorId}-${Date.now()}`, language: "zh" }),
    })
    return String(data.conversation_id || "")
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
    const speechText = text.slice(0, 2200).replace(/\s+/g, " ").trim()
    if (!speechText) return
    setSpeaking(true)
    setAvatarMode("talk")
    const controller = new AbortController()
    ttsControllersRef.current.add(controller)
    try {
      const res = await fetch(`${apiBase()}/api/voice/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: speechText, conversation_id: conversationId || null, language: "zh", voice_gender: currentGuide.voiceGender }),
        signal: controller.signal,
      })
      if (!res.ok || runId !== speechRunRef.current) return
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
        audio.play()
          .then(() => {
            if (runId === speechRunRef.current) startAvatarBackdropSequence()
          })
          .catch(() => resolve())
      })
    } catch {
    } finally {
      ttsControllersRef.current.delete(controller)
    }
    if (runId === speechRunRef.current) {
      setSpeaking(false)
      setAvatarMode("idle")
      audioRef.current = null
      clearAvatarBackdrop()
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
    clearAvatarBackdrop()
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

  function openSpotDetail(spot: Spot) {
    setSelectedSpot(spot)
    setSpotDetailOpen(true)
  }

  function spotImage(spot: Spot, index = 0) {
    const matched = spots.find((item) => normalizeSpotName(item.name) === normalizeSpotName(spot.name))
    const uploaded = matched?.image_url || matched?.cover_image || spot.image_url || spot.cover_image
    if (uploaded) return resolveMediaURL(uploaded)
    return spotGalleryImages[spot.name] || attractionFallbackImages[0]
  }

  function gallerySpotImage(spot: Spot, index = 0) {
    const matched = spots.find((item) => normalizeSpotName(item.name) === normalizeSpotName(spot.name))
    const uploaded = matched?.image_url || matched?.cover_image || spot.image_url || spot.cover_image
    return uploaded ? resolveMediaURL(uploaded) : spotGalleryImages[spot.name] || attractionFallbackImages[index % attractionFallbackImages.length]
  }

  function localSpotMeta(spot: Spot) {
    return localScenicSpots.find((item) => item.name === spot.name)
  }

  function gallerySpotDescription(spot: Spot) {
    return localSpotMeta(spot)?.description || spot.description || "点击查看景点详情。"
  }

  function gallerySpotTags(spot: Spot) {
    return normalizeTags(localSpotMeta(spot)?.tags || spot.tags)
  }

  function uploadedBackdropImage(spot: Spot) {
    const uploaded = spot.image_url || spot.cover_image
    return uploaded ? resolveMediaURL(uploaded) : ""
  }

  function uploadedBackdropSequence(): ScenicBackdrop[] {
    const byName = new Map<string, { item: ScenicBackdrop; score: number; order: number }>()
    spots.forEach((spot, index) => {
      const key = normalizeSpotName(spot.name)
      const source = spot.image_url || spot.cover_image || ""
      const url = uploadedBackdropImage(spot)
      if (!key || !url) return
      const score = String(source).startsWith("/files/") ? 100 : 10
      const order = typeof spot.sort_order === "number" ? spot.sort_order : index + 1000
      const existing = byName.get(key)
      if (!existing || score > existing.score || (score === existing.score && order < existing.order)) {
        byName.set(key, { item: { name: spot.name, url }, score, order })
      }
    })
    return Array.from(byName.values())
      .sort((a, b) => a.order - b.order)
      .map((entry) => entry.item)
  }

  function clearAvatarBackdrop() {
    backdropSessionRef.current += 1
    if (backdropSequenceTimerRef.current) {
      window.clearTimeout(backdropSequenceTimerRef.current)
      backdropSequenceTimerRef.current = null
    }
    setPreviousAvatarBackdrop((current) => current || avatarBackdrop)
    setAvatarBackdrop(null)
  }

  function showAvatarBackdrop(next: ScenicBackdrop) {
    setAvatarBackdrop((current) => {
      if (current?.url === next.url && current?.name === next.name) return current
      setPreviousAvatarBackdrop(current)
      return next
    })
  }

  function preloadBackdrop(url: string) {
    return new Promise<boolean>((resolve) => {
      const img = new Image()
      img.onload = () => resolve(true)
      img.onerror = () => resolve(false)
      img.src = url
    })
  }

  function startAvatarBackdropSequence() {
    const session = backdropSessionRef.current + 1
    backdropSessionRef.current = session
    if (backdropSequenceTimerRef.current) window.clearTimeout(backdropSequenceTimerRef.current)
    backdropSequenceTimerRef.current = null
    const sequence = uploadedBackdropSequence().filter((item) => !failedBackdropUrlsRef.current.has(item.url))
    if (!sequence.length) {
      clearAvatarBackdrop()
      return
    }
    let index = 0
    const scheduleNext = (delay: number) => {
      backdropSequenceTimerRef.current = window.setTimeout(async () => {
        let attempts = 0
        let shown = false
        while (attempts < sequence.length && session === backdropSessionRef.current) {
          const next = sequence[index]
          index = (index + 1) % sequence.length
          attempts += 1
          if (failedBackdropUrlsRef.current.has(next.url)) continue
          const loaded = await preloadBackdrop(next.url)
          if (session !== backdropSessionRef.current) return
          if (loaded) {
            showAvatarBackdrop(next)
            shown = true
            break
          }
          failedBackdropUrlsRef.current.add(next.url)
        }
        if (session !== backdropSessionRef.current) return
        if (!shown && sequence.every((item) => failedBackdropUrlsRef.current.has(item.url))) {
          clearAvatarBackdrop()
          return
        }
        scheduleNext(5000)
      }, delay)
    }
    scheduleNext(3000)
  }

  function handleAvatarBackdropError(url: string) {
    failedBackdropUrlsRef.current.add(url)
    if (backdropSequenceTimerRef.current) return
    const sequence = uploadedBackdropSequence().filter((item) => !failedBackdropUrlsRef.current.has(item.url))
    if (!sequence.length) {
      clearAvatarBackdrop()
      return
    }
    void preloadBackdrop(sequence[0].url).then((loaded) => {
      if (!loaded) {
        failedBackdropUrlsRef.current.add(sequence[0].url)
        return
      }
      showAvatarBackdrop(sequence[0])
    })
  }

  function renderSpotDetailModal() {
    if (!spotDetailOpen || !selectedSpot) return null
    return (
      <div className="fixed inset-0 z-[900] grid place-items-center bg-slate-950/45 p-5 backdrop-blur-sm">
        <div className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-2xl">
          <img
            src={gallerySpotImage(selectedSpot)}
            alt={selectedSpot.name}
            className="h-64 w-full object-cover"
            onError={(event) => {
              event.currentTarget.src = attractionFallbackImages[0]
            }}
          />
          <div className="p-6">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Scenic Spot</p>
                <h3 className="mt-1 text-2xl font-bold">{selectedSpot.name}</h3>
              </div>
              <button type="button" onClick={() => setSpotDetailOpen(false)} className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground" aria-label="关闭景点介绍">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm leading-7 text-muted-foreground">{gallerySpotDescription(selectedSpot)}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {gallerySpotTags(selectedSpot).map((tag) => (
                <span key={tag} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-primary">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
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
    await requestAIRoutePlan(interests.length ? `请根据我的兴趣偏好推荐路线：${interests.join("、")}` : "请推荐一条经典游览路线")
  }

  function matchSpotName(name: string) {
    const target = normalizeSpotName(name)
    if (!target) return null
    const aliases: Record<string, string[]> = {
      灵山大照壁: ["大照壁", "华夏第一壁", "照壁"],
      胜境广场: ["灵山胜境广场"],
      五明桥: ["五明桥景点"],
      佛足坛: ["佛足印", "佛足坛景点"],
      百子戏弥勒: ["弥勒佛", "百子戏弥勒雕塑群"],
      九龙灌浴: ["九龙灌浴广场", "九龙灌浴表演"],
      佛手广场: ["佛手", "天下第一掌"],
      祥符禅寺: ["祥符寺", "禅寺"],
      佛前广场: ["佛前"],
      灵山大佛: ["大佛", "青铜大佛"],
      灵山梵宫: ["梵宫", "梵宫艺术殿堂"],
      五印坛城: ["坛城"],
      曼飞龙塔: ["龙塔"],
      灵山精舍: ["精舍"],
      梵宫广场: ["梵宫外广场"],
    }
    return spots.find((spot) => {
      const names = [spot.name, ...(aliases[spot.name] || [])].map(normalizeSpotName).filter(Boolean)
      return names.some((spotName) => spotName === target || target.includes(spotName) || spotName.includes(target))
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
        .split(/\s*(?:→|->|—|--|>|、|,|，)\s*/)
        .map((name) => name.replace(/（.*?）|\(.*?\)/g, "").replace(/[：:；;。！？].*$/, "").trim())
        .forEach((name) => addSpot(matchSpotName(name)))
      if (ordered.length >= 2) return ordered
    }
    const positiveText = text.split(/(?:舍弃|排除|不推荐|未选择|不纳入|无需前往|不建议前往)/, 1)[0]
    const numbered = Array.from(positiveText.matchAll(/(?:^|\n)\s*(?:第\s*)?[一二三四五六七八九十\d]+[\.、\)\s：:]+([^\n]+)/g))
    if (numbered.length >= 2) {
      numbered.forEach((match) => {
        const rawName = String(match[1] || "").replace(/（.*?）|\(.*?\)/g, "").replace(/[：:，,；;。！？].*$/, "").trim()
        addSpot(matchSpotName(rawName))
      })
      if (ordered.length >= 2) return ordered
    }
    if (ordered.length < 2) {
      spots
        .map((spot) => ({ spot, index: positiveText.indexOf(spot.name) }))
        .filter((item) => item.index >= 0)
        .sort((a, b) => a.index - b.index)
        .forEach((item) => addSpot(item.spot))
    }
    return ordered
  }

  function buildFallbackRoutePlan(reasonText = "", preferenceText = ""): RoutePlan {
    const profileText = `${preferenceText} ${routeChatInput} ${interests.join(" ")}`
    const isEasy = /老人|长辈|父母|爸妈|轻松|少走|少爬/.test(profileText)
    const isFamily = /孩子|亲子|儿童|有趣|互动|表演/.test(profileText)
    const isNature = /自然|风景|风光|拍照|摄影|打卡/.test(profileText)
    const isCulture = /历史|文化|佛教|建筑|祈福|禅|艺术/.test(profileText)
    const names = isEasy
      ? ["九龙灌浴", "佛手广场", "百子戏弥勒", "灵山梵宫"]
      : isFamily
        ? ["九龙灌浴", "百子戏弥勒", "佛手广场", "灵山梵宫"]
        : isNature
          ? ["五明桥", "九龙灌浴", "灵山大佛", "梵宫广场"]
          : isCulture
            ? ["灵山大照壁", "佛手广场", "祥符禅寺", "灵山大佛", "灵山梵宫"]
            : ["灵山大照壁", "九龙灌浴", "佛手广场", "灵山大佛", "灵山梵宫"]
    const routeSpotList = names.map(matchSpotName).filter(Boolean) as Spot[]
    return {
      id: `fallback-${Date.now()}`,
      name: isEasy ? "轻松舒缓参考路线" : isFamily ? "亲子轻松参考路线" : isNature ? "自然风光参考路线" : isCulture ? "历史文化参考路线" : "经典精华参考路线",
      description: reasonText || "AI 本轮回复未返回可定位景点，已根据当前游览时长、位置和偏好生成可在地图上展示的参考路线。",
      duration: routeHours ? `约 ${routeHours} 小时` : undefined,
      spots: routeSpotList,
    }
  }

  function applyAIRoute(text: string, preferenceText = "") {
    const routeSpotList = parseRouteFromAIText(text)
    if (!routeSpotList.length) {
      const fallback = buildFallbackRoutePlan("已根据当前游览时长、当前位置和偏好生成一条可在地图上展示的参考路线。", preferenceText)
      setSelectedRoute(fallback)
      const first = routeSpots(fallback)[0]
      if (first) setSelectedSpot(first)
      setError("")
      return fallback
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
    setError("")
    return plan
  }

  function routePlanToAssistantText(plan?: RoutePlan | null) {
    const planSpots = routeSpots(plan)
    if (!plan || !planSpots.length) return "已根据当前条件生成一条参考路线，请在地图上查看景点顺序。"
    const routeLine = `路线顺序：${planSpots.map((spot) => spot.name).join(" → ")}`
    const details = planSpots
      .map((spot, index) => `${index + 1}. ${spot.name}：${spot.description || "适合纳入本次游览路线，可结合现场体力和时间灵活停留。"}`)
      .join("\n")
    return `${routeLine}\n\n${plan.duration ? `${plan.duration}。` : ""}${plan.description ? `${plan.description}\n\n` : ""}${details}`
  }

  function buildRoutePrompt(userQuestion = "") {
    const profileText = `${userQuestion} ${interests.join(" ")}`
    const preferenceHint = /老人|长辈|父母|爸妈|轻松|少走|少爬/.test(profileText)
      ? "路线节奏要轻松，减少连续登高和长距离折返，优先选择平缓、可停留、室内或互动景点。"
      : /孩子|亲子|儿童|有趣|互动|表演/.test(profileText)
        ? "路线要轻松有趣，优先选择动态表演、互动景观和适合亲子理解的景点。"
        : /自然|风景|风光|拍照|摄影|打卡/.test(profileText)
          ? "路线要兼顾自然景观、开阔视野和拍照打卡体验。"
          : /历史|文化|佛教|建筑|祈福|禅|艺术/.test(profileText)
            ? "路线要突出历史文化、佛教文化、建筑艺术和代表性景观。"
            : "路线紧凑、体验丰富、游览顺序合理。"
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
      `路线要求：${preferenceHint}`,
    ].filter(Boolean).join("；")

    return `route plan / 路线推荐 / 游览顺序规划
【路线规划任务】
本次只做游览路线规划。请只根据本条消息里的游览时长、当前位置、游客兴趣和可用景点资料生成路线。
请忽略本会话中与路线规划无关的旧上下文。
本次请求不是身体不适、疼痛处理或安全求助，不要回答休息、就医或联系工作人员等非路线内容。
如果游客没有填写当前位置，请默认从景区入口或主游线起点开始规划，不要询问补充位置。

你是景区 AI 导览员，请根据游客约束和景区资料生成一条可在地图上定位的游览路线。
游客约束：${conditions || "暂无额外约束"}。
可用景点资料如下，只能从这些景点中选择，不要虚构景点：
${availableSpots || "暂无景点资料"}。
请直接输出路线。第一行必须使用格式：“路线顺序：景点A → 景点B → 景点C”，列出 3 到 5 个完整景点名称。
随后逐站说明推荐理由、停留建议和游览提醒。不要要求用户再次说明景区或偏好。
如果资料不足，也要从可用景点资料中给出一条“参考路线”，第一行仍必须是“路线顺序：...”。`
  }

  async function requestAIRoutePlan(userQuestion = "") {
    const prompt = buildRoutePrompt(userQuestion)
    const visibleQuestion = userQuestion.trim() || `请根据${routeHours || "当前"}小时游览时长${routeArea.trim() ? `、当前位置${routeArea.trim()}` : ""}生成推荐路线`
    setError("")
    setRoutePlanning(true)
    setRouteAnswer("")
    setAvatarMode("think")
    setRouteChatInput("")
    stopReply(false)
    const runId = ++speechRunRef.current
    let activeId = conversationId
    try {
      if (!activeId) activeId = await createConversation(false)
      const routeConversationId = await createIsolatedRouteConversation()
      const routeUserMessage: Message = { role: "user", content: visibleQuestion }
      setMessages((current) => [...current, routeUserMessage, { role: "assistant", content: "" }])
      appendHistoryMessage(activeId, routeUserMessage, visibleQuestion.slice(0, 28))
      const controller = new AbortController()
      abortRef.current = controller
      const res = await fetch(`${apiBase()}/api/voice/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: routeConversationId || activeId,
          message: prompt,
          history: [],
          interest_tags: interests,
          use_rag: true,
          language: "zh",
          explain_mode: "normal",
        }),
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
          setMessages((current) => current.map((item, index) => (index === current.length - 1 ? { ...item, content: finalText } : item)))
        }
      }
      const appliedPlan = applyAIRoute(finalText, userQuestion)
      const usedFallback = Boolean(appliedPlan?.id?.toString().startsWith("fallback-"))
      const routeReplyText = usedFallback ? routePlanToAssistantText(appliedPlan) : (finalText || routePlanToAssistantText(appliedPlan))
      setRouteAnswer(routeReplyText)
      const routeAssistantMessage: Message = { role: "assistant", content: routeReplyText }
      setMessages((current) => current.map((item, index) => (index === current.length - 1 ? routeAssistantMessage : item)))
      appendHistoryMessage(activeId, routeAssistantMessage)
      setRoutePlanning(false)
      if (routeReplyText) void speakText(routeReplyText, runId)
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        const message = err?.message || "路线规划服务暂时不可用"
        setError(message)
        setMessages((current) => current.map((item, index) => (index === current.length - 1 && item.role === "assistant" ? { ...item, content: message } : item)))
      }
    } finally {
      setRoutePlanning(false)
      abortRef.current = null
      if (!speaking && !audioRef.current) setAvatarMode("idle")
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
    if (!fromRoute.length) return spots
    return fromRoute.map((spot) => {
      const matched = matchSpotName(spot.name)
      return matched ? { ...matched, ...spot, tags: normalizeTags(spot.tags).length ? spot.tags : matched.tags } : spot
    })
  }, [selectedRoute, spots])
  const mapSpots = selectedRoute ? activeRouteSpots : []

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

  if (view === "route") {
    const gallerySpots = [
      ...localScenicSpots.map((localSpot) => {
        const backendSpot = spots.find((spot) => normalizeSpotName(spot.name) === normalizeSpotName(localSpot.name))
        return backendSpot
          ? {
              ...localSpot,
              ...backendSpot,
              description: backendSpot.description || localSpot.description,
              tags: normalizeTags(backendSpot.tags).length ? backendSpot.tags : localSpot.tags,
              location: localSpot.location || backendSpot.location,
              lat: localSpot.lat ?? backendSpot.lat,
              lng: localSpot.lng ?? backendSpot.lng,
              latitude: localSpot.latitude ?? backendSpot.latitude,
              longitude: localSpot.longitude ?? backendSpot.longitude,
            }
          : localSpot
      }),
      ...spots.filter((spot) => !localScenicSpots.some((localSpot) => normalizeSpotName(localSpot.name) === normalizeSpotName(spot.name))),
    ]
    return (
      <div className="relative h-full overflow-auto bg-[#050505] px-6 py-8 text-white lg:px-10">
        <div className="mx-auto mb-8 max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-emerald-300">Scenic Gallery</p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight">景点推荐</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/58">精选景区景点图片，点击卡片查看景点介绍、标签与游览信息。</p>
        </div>

        <div className="mx-auto grid max-w-7xl auto-rows-[20px] grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {gallerySpots.map((spot, index) => (
            <button
              key={`${spot.id || spot.name}`}
              type="button"
              onClick={() => openSpotDetail(spot)}
              className="group relative overflow-hidden rounded-lg border border-white/10 bg-neutral-950 text-left transition-all duration-200 hover:-translate-y-1 hover:border-white/30"
              style={{ gridRowEnd: `span ${masonryRowSpans[index % masonryRowSpans.length]}` }}
            >
              <img
                src={gallerySpotImage(spot, index)}
                alt={spot.name}
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                onError={(event) => {
                  event.currentTarget.src = attractionFallbackImages[index % attractionFallbackImages.length]
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/12 to-black/72" />
              <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/24 px-2.5 py-1 text-xs font-mono font-semibold text-white/80 backdrop-blur">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="absolute inset-x-0 bottom-0 p-4">
                <strong className="block truncate text-base font-bold text-white">{spot.name}</strong>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/70">{gallerySpotDescription(spot)}</p>
              </div>
            </button>
          ))}
        </div>
        {renderSpotDetailModal()}
      </div>
    )
  }

  if (view === "map") {
    return (
      <div className="relative grid h-full min-h-0 grid-cols-[minmax(350px,410px)_1fr_minmax(320px,380px)] gap-5 overflow-hidden bg-white">
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
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-primary">{activeRouteSpots.length} 个景点</span>
              </div>
              <strong className="block text-lg leading-tight">{routeTitle(selectedRoute)}</strong>
              <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">{selectedRoute.description || selectedRoute.reason || "已根据你的游览约束生成路线。"}</p>
            </div>
          ) : null}
          <div className="space-y-3">
            {(activeRouteSpots.length ? activeRouteSpots : spots).map((spot, index) => (
              <button key={`${spot.id || spot.name}`} type="button" onClick={() => openSpotDetail(spot)} className={`w-full rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 ${selectedSpot?.name === spot.name ? "border-primary bg-primary/5" : "border-border bg-white"}`}>
                <div className="flex gap-3">
                  <img
                    src={spotImage(spot, index)}
                    alt={spot.name}
                    className="h-16 w-20 rounded-xl object-cover"
                    onError={(event) => {
                      event.currentTarget.src = spotGalleryImages[spot.name] || attractionFallbackImages[0]
                    }}
                  />
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
          <div className="pointer-events-none absolute bottom-0 right-0 z-[500] h-[460px] w-[330px]">
            <VrmAvatarStage
              mode={avatarMode}
              model="/assets/vrm/7533417284697534698.vrm"
              motionPlaylist={["modelPose"]}
              showControls={false}
              showStatus={false}
              surface="transparent"
              framing="upper"
              className="h-full w-full"
            />
          </div>
        </section>

        <aside className="flex min-h-0 flex-col overflow-hidden rounded-[26px] border border-border bg-white shadow-sm">
          <header className="border-b border-border p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Guide Chat</p>
            <h3 className="mt-1 text-xl font-bold">和导游对话</h3>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">可以直接问路线、景点顺序和游览偏好，回复会同步到地图路线。</p>
          </header>
          <div className="border-b border-border p-4">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-bold"><Sparkles className="h-4 w-4 text-primary" />兴趣偏好</h4>
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
          <div className="min-h-0 flex-1 space-y-3 overflow-auto bg-gradient-to-b from-white to-slate-50/70 p-4">
            {messages.slice(-8).map((message, index) => (
              <div key={`${message.role}-${index}-${message.content.slice(0, 10)}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-xs leading-6 shadow-sm ${message.role === "user" ? "bg-primary text-white" : "border border-border bg-white text-foreground"}`}>
                  {message.content || <span className="text-muted-foreground">正在规划路线...</span>}
                </div>
              </div>
            ))}
            {routeAnswer ? (
              <div className="rounded-2xl border border-emerald-900/10 bg-emerald-50/70 p-3 text-xs leading-6 text-emerald-950">
                <strong className="mb-1 block text-primary">路线已同步到地图</strong>
                <p className="line-clamp-5 whitespace-pre-line">{routeAnswer}</p>
              </div>
            ) : null}
          </div>
          <div className="border-t border-border bg-white p-4">
            {error ? <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p> : null}
            <div className="mb-3 flex flex-wrap gap-2">
              {quickQuestions.slice(0, 3).map((item) => (
                <button key={item} type="button" onClick={() => requestAIRoutePlan(item)} className="rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold transition hover:bg-muted">{item}</button>
              ))}
            </div>
            <div className="flex items-end gap-2 rounded-2xl border border-border bg-white p-2 shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
              <textarea value={routeChatInput} onChange={(event) => setRouteChatInput(event.target.value)} rows={2} placeholder="问导游路线、景点或游览偏好" className="min-h-11 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground" />
              {(routePlanning || speaking) ? (
                <button type="button" onClick={() => stopReply(true)} className="grid h-10 w-10 place-items-center rounded-full bg-red-50 text-red-600 transition hover:bg-red-100" title="停止回复"><X className="h-4 w-4" /></button>
              ) : null}
              <button type="button" onClick={() => requestAIRoutePlan(routeChatInput)} disabled={routePlanning || !routeChatInput.trim()} className="grid h-10 w-10 place-items-center rounded-full bg-primary text-white transition hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground" title="询问导游"><Send className="h-4 w-4" /></button>
            </div>
          </div>
        </aside>
        {renderSpotDetailModal()}
      </div>
    )
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(520px,700px)_minmax(420px,1fr)_minmax(280px,340px)] gap-5 overflow-hidden bg-white">
      <aside className="relative min-h-0 overflow-hidden rounded-[26px] border border-emerald-900/10 bg-[#f3f6f3] shadow-[0_18px_60px_rgba(15,38,25,0.10)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,148,0.20),transparent_30%),linear-gradient(180deg,#f8faf7_0%,#eef3ee_100%)]" />
        {previousAvatarBackdrop ? (
          <img
            key={`previous-${previousAvatarBackdrop.url}`}
            src={previousAvatarBackdrop.url}
            alt={previousAvatarBackdrop.name}
            className="absolute inset-0 h-full w-full animate-[dgBackdropOut_900ms_ease-out_forwards] object-cover"
            onError={() => handleAvatarBackdropError(previousAvatarBackdrop.url)}
          />
        ) : null}
        {avatarBackdrop ? (
          <img
            key={avatarBackdrop.url}
            src={avatarBackdrop.url}
            alt={avatarBackdrop.name}
            className="absolute inset-0 h-full w-full animate-[dgBackdropFade_900ms_ease-out] object-cover opacity-100"
            onError={() => handleAvatarBackdropError(avatarBackdrop.url)}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/18 to-white/70" />
        <div className="pointer-events-none absolute inset-0 overflow-hidden text-[6.5rem] font-black uppercase leading-none tracking-[-0.08em] text-emerald-950/[0.10]">
          <span className="absolute left-6 top-14 whitespace-nowrap">SCENIC GUIDE</span>
          <span className="absolute bottom-8 left-20 whitespace-nowrap">DISCOVER</span>
        </div>
        {avatarBackdrop ? (
          <div className="absolute left-5 top-5 z-20 rounded-full border border-white/70 bg-white/72 px-3 py-1 text-xs font-semibold text-emerald-950 shadow-sm backdrop-blur">
            正在讲解：{avatarBackdrop.name}
          </div>
        ) : null}
        <VrmAvatarStage mode={avatarMode} onGuideChange={handleGuideChange} surface="transparent" className="relative z-10 h-full min-h-[620px]" />
        <style jsx global>{`
          @keyframes dgBackdropFade {
            from { opacity: 0; transform: scale(1.025); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes dgBackdropOut {
            from { opacity: 1; transform: scale(1); }
            to { opacity: 0; transform: scale(1.012); }
          }
        `}</style>
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


