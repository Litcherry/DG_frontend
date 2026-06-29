"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Bot, Eye, EyeOff, LayoutDashboard, Lock, Shield, Sparkles, User, X } from "lucide-react"
import { request, setApiBase, setToken } from "@/components/dg/api"

const scenicImages = [
  "https://commons.wikimedia.org/wiki/Special:FilePath/Huangshan_pic_4.jpg?width=2400",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Great_Wall_of_China_July_2006.JPG?width=2400",
  "/assets/images/lingshan-hero.png",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Li_River,_Guilin,_China.jpg?width=2400",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Zhangjiajie_National_Forest_Park.jpg?width=2400",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Great_Wall_of_China_at_Jinshanling-edit.jpg?width=2400",
  "/assets/images/snow-mountain-lake-wide.png",
]

const labels = {
  brand: "DG AI",
  navVisitor: "游客端",
  navAdmin: "管理后台",
  badge: "全景区 AI 导览体验",
  titleLineA: "让每一次旅行",
  titleLineB: "都有一位随行的 AI 导览员。",
  desc: "游客可以直接进入导览问答，管理员可以进入 Tasko 风格的运营后台管理知识库、景区数据和数字人。",
  visitor: "开始对话",
  admin: "管理员登录",
  helped: "已支持景区问答、路线推荐和语音互动",
  pointA: "智能问答",
  pointB: "路线规划",
  pointC: "知识入库",
}

type HomeTab = "home" | "chat" | "map" | "route"

const homeTabs: Array<{ key: HomeTab; label: string }> = [
  { key: "home", label: "首页" },
  { key: "chat", label: "AI 对话" },
  { key: "map", label: "地图导览" },
  { key: "route", label: "路线推荐" },
]
function FrostedAdminLogin({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const [username, setUsername] = useState("admin")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, onClose])

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError("")
    try {
      setApiBase(window.location.origin)
      const data = await request<{ access_token: string }>("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })
      setToken(data.access_token)
      router.push("/admin")
    } catch (err: any) {
      setError(err?.message || "登录失败，请检查账号和密码")
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center px-4 py-6">
      <button type="button" aria-label="关闭登录弹窗" className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[450px] animate-slide-in-up">
        <div className="absolute inset-0 rounded-3xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl" />
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/25 via-white/10 to-transparent" />
        <div className="relative p-8">
          <div className="mb-7 flex items-start justify-between gap-4">
            <div>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/25 bg-white/15 text-white shadow-lg backdrop-blur-sm">
                <Shield className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-semibold text-white">管理员登录</h2>
              <p className="mt-2 text-sm text-white/70">登录后进入 DG 运营 Dashboard</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-full border border-white/20 bg-white/10 p-2 text-white/70 transition hover:bg-white/20 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={login} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-white/90">账号</span>
              <span className="relative block">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="h-11 w-full rounded-xl border border-white/20 bg-white/10 pl-10 pr-3 text-sm text-white outline-none backdrop-blur-sm transition placeholder:text-white/45 focus:border-white/45 focus:ring-2 focus:ring-white/15"
                  placeholder="请输入管理员账号"
                  autoComplete="username"
                  required
                />
              </span>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-white/90">密码</span>
              <span className="relative block">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-11 w-full rounded-xl border border-white/20 bg-white/10 pl-10 pr-10 text-sm text-white outline-none backdrop-blur-sm transition placeholder:text-white/45 focus:border-white/45 focus:ring-2 focus:ring-white/15"
                  placeholder="默认 admin123"
                  autoComplete="current-password"
                  required
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 transition hover:text-white/80">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
            </label>

            {error ? <p className="rounded-xl border border-red-200/20 bg-red-500/15 px-3 py-2 text-sm text-red-50">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-xl border border-white/30 bg-white/20 text-sm font-semibold text-white shadow-lg backdrop-blur-sm transition hover:border-white/45 hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "正在登录..." : "进入 Dashboard"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function FloatingDigitalHuman({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`pointer-events-none ${compact ? "w-40" : "w-56"} rounded-[24px] border border-white/35 bg-white/18 p-4 text-white shadow-2xl backdrop-blur-xl`}>
      <div className={`relative mx-auto mb-3 grid ${compact ? "h-24 w-24" : "h-32 w-32"} place-items-center rounded-full bg-white/20`}>
        <span className="absolute inset-2 rounded-full bg-primary/30 blur-md" />
        <span className={`relative grid ${compact ? "h-16 w-16" : "h-24 w-24"} place-items-center rounded-full bg-primary shadow-xl`}>
          <Bot className={compact ? "h-8 w-8" : "h-14 w-14"} />
        </span>
      </div>
      <strong className="block text-center text-sm">AI 数字人在线</strong>
      <span className="mt-1 block text-center text-xs text-white/75">随时陪你问景点、查路线</span>
    </div>
  )
}

function LegacyVisitorPane({ activeTab }: { activeTab: Exclude<HomeTab, "home"> }) {
  const view = activeTab === "chat" ? "visitor" : "routeMap"
  const title = activeTab === "chat" ? "AI 对话" : activeTab === "map" ? "地图导览" : "路线推荐"

  return (
    <iframe
      key={view}
      title={title}
      src={`/visitor?embed=1&view=${view}`}
      className="h-full min-h-0 w-full border-0 bg-white"
      allow="microphone; autoplay"
    />
  )
}

function TypewriterText({ text, loop = false }: { text: string; loop?: boolean }) {
  const [displayed, setDisplayed] = useState("")

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayed(text)
      return
    }

    let index = 0
    let timer: number | undefined
    let restartTimer: number | undefined

    const start = () => {
      index = 0
      setDisplayed("")
      timer = window.setInterval(() => {
      index += 1
      setDisplayed(text.slice(0, index))
        if (index >= text.length) {
          if (timer) window.clearInterval(timer)
          if (loop) restartTimer = window.setTimeout(start, 3000)
        }
      }, 86)
    }

    start()

    return () => {
      if (timer) window.clearInterval(timer)
      if (restartTimer) window.clearTimeout(restartTimer)
    }
  }, [loop, text])

  return (
    <span className="inline-block min-w-[15.5em] whitespace-nowrap">
      <span>{displayed}</span>
      <span className="ml-1 inline-block h-[0.9em] w-[2px] translate-y-[0.08em] animate-pulse bg-white/85 align-baseline" />
    </span>
  )
}

export function HomeEntry() {
  const [loginOpen, setLoginOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<HomeTab>("home")
  const [activeImage, setActiveImage] = useState(0)
  const [loadedImages, setLoadedImages] = useState<Set<number>>(() => new Set([0]))

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("adminLogin") === "1") {
      setLoginOpen(true)
      window.history.replaceState(null, "", "/")
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    scenicImages.forEach((src, index) => {
      const image = new Image()
      image.onload = () => {
        if (cancelled) return
        setLoadedImages((current) => {
          if (current.has(index)) return current
          const next = new Set(current)
          next.add(index)
          return next
        })
      }
      image.src = src
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (activeTab !== "home") return
    const availableImages = Array.from(loadedImages).sort((a, b) => a - b)
    if (availableImages.length < 2) return

    const timer = window.setInterval(() => {
      setActiveImage((current) => {
        const currentPosition = availableImages.indexOf(current)
        return availableImages[(currentPosition + 1) % availableImages.length] ?? availableImages[0]
      })
    }, 5000)
    return () => window.clearInterval(timer)
  }, [activeTab, loadedImages])

  function selectTab(tab: HomeTab) {
    setActiveTab(tab)
  }

  return (
    <main className={`min-h-screen ${activeTab === "home" ? "bg-emerald-950" : "bg-white"}`}>
      <section className={`relative flex min-h-screen flex-col overflow-hidden ${activeTab === "home" ? "bg-emerald-950" : "bg-white"}`}>
        {activeTab === "home" && <div className="absolute inset-0">
          {scenicImages.map((image, index) => (
            <div
              key={image}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[1600ms] ease-in-out ${
                index === activeImage && loadedImages.has(index) ? "opacity-100" : "opacity-0"
              }`}
              style={{
                backgroundImage: `url(${image})`,
              }}
            />
          ))}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_30%,rgba(255,190,92,0.22),transparent_32%),linear-gradient(90deg,rgba(3,20,28,0.72)_0%,rgba(8,34,46,0.38)_46%,rgba(8,20,24,0.28)_100%)]" />
        </div>}

        <div className={`relative flex flex-1 flex-col ${activeTab === "home" ? "px-5 pb-8 pt-2 md:px-12 md:pt-4" : "px-4 pb-5 pt-3 md:px-8 md:pt-4"}`}>
          <nav className="mx-auto grid w-full max-w-[1800px] animate-slide-in-up grid-cols-[auto_1fr_auto] items-center gap-4 px-0 py-0">
            <Link href="/" className={`flex items-center gap-2 transition hover:-translate-y-0.5 ${activeTab === "home" ? "text-white" : "text-foreground"}`}>
              <span className={`grid h-8 w-8 place-items-center rounded-xl text-xs font-black shadow-sm ${
                activeTab === "home" ? "bg-white/16 text-white ring-1 ring-white/18 backdrop-blur-md" : "bg-primary text-primary-foreground"
              }`}>DG</span>
              <span className="text-base font-semibold tracking-tight md:text-lg">
                <span className={activeTab === "home" ? "text-white" : "text-primary"}>{labels.brand}</span>
                <span className={activeTab === "home" ? "text-white/92" : "text-foreground"}> Guide</span>
              </span>
            </Link>
            <div className="hidden items-center justify-center gap-9 md:flex">
              {homeTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => selectTab(tab.key)}
                  className={`relative min-h-0 rounded-none border-0 bg-transparent px-1 py-2 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 hover:bg-transparent ${
                    activeTab === tab.key
                      ? activeTab === "home"
                        ? "text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-full after:bg-white after:shadow-[0_0_14px_rgba(255,255,255,0.52)]"
                        : "text-foreground after:absolute after:bottom-1 after:left-0 after:right-0 after:h-[2px] after:rounded-full after:bg-primary after:shadow-[0_0_12px_rgba(0,122,47,0.35)]"
                      : activeTab === "home"
                        ? "text-white/72 hover:text-white"
                        : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setLoginOpen(true)}
              className={`inline-flex h-11 items-center justify-center gap-2 rounded-full border px-5 text-sm font-semibold shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 md:px-7 ${
                activeTab === "home"
                  ? "border-white/18 bg-white/10 text-white hover:bg-white/16"
                  : "border-emerald-900/10 bg-white/70 text-emerald-950/75 hover:bg-white hover:text-emerald-950"
              }`}
              title={labels.admin}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">{labels.admin}</span>
            </button>
          </nav>

          {activeTab === "home" ? (
          <div className="mx-auto flex w-full max-w-[1800px] flex-1 flex-col justify-center pt-10 md:pt-6">
            <div className="max-w-5xl text-left">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/8 px-4 py-2 text-xs font-semibold text-white/90 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-emerald-200" />
                {labels.badge}
              </div>
              <h1 className="max-w-5xl text-5xl font-light leading-[1.02] text-white drop-shadow-lg sm:text-6xl md:text-[4.35rem] lg:text-[5.45rem]">
                <span className="block whitespace-nowrap">{labels.titleLineA}</span>
                <span className="block whitespace-nowrap">
                  <TypewriterText text={labels.titleLineB} loop />
                </span>
              </h1>
              <p className="mt-8 max-w-3xl text-pretty text-base font-medium leading-8 text-white/88 drop-shadow md:text-lg">
                {labels.desc}
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setActiveTab("chat")}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-8 text-base font-semibold text-emerald-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-white/92"
                >
                  <Bot className="h-4 w-4" />
                  {labels.visitor}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("map")}
                  className="inline-flex h-12 items-center justify-center rounded-full border border-white/18 bg-white/8 px-8 text-base font-semibold text-white backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/14 hover:text-white"
                >
                  地图导览
                </button>
              </div>
            </div>
          </div>
          ) : (
            <div className="mx-auto flex h-[calc(100vh-112px)] w-full max-w-7xl flex-col pt-5 animate-slide-in-up">
              <div className="min-h-0 flex-1 overflow-hidden bg-white">
                <LegacyVisitorPane activeTab={activeTab} />
              </div>
            </div>
          )}

          {activeTab === "home" && <div className="absolute bottom-8 right-8 hidden lg:block"><FloatingDigitalHuman compact /></div>}
        </div>
      </section>

      <FrostedAdminLogin open={loginOpen} onClose={() => setLoginOpen(false)} />

    </main>
  )
}

