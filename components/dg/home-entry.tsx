"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Bot, Check, Eye, EyeOff, LayoutDashboard, Lock, MapPin, Mountain, Shield, Sparkles, User, X } from "lucide-react"
import { request, setApiBase, setToken } from "@/components/dg/api"

const scenicImages = [
  "/assets/images/lingshan-hero.png",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Huangshan_pic_4.jpg?width=2400",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Great_Wall_of_China_July_2006.JPG?width=2400",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Li_River,_Guilin,_China.jpg?width=2400",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Zhangjiajie_National_Forest_Park.jpg?width=2400",
]

const labels = {
  brand: "DG AI",
  navVisitor: "游客端",
  navAdmin: "管理后台",
  badge: "全景区 AI 导览体验",
  title: "让每一次旅行都有一位随行的 AI 导览员",
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

export function HomeEntry() {
  const [loginOpen, setLoginOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<HomeTab>("home")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("adminLogin") === "1") {
      setLoginOpen(true)
      window.history.replaceState(null, "", "/")
    }
  }, [])

  function selectTab(tab: HomeTab) {
    setActiveTab(tab)
  }

  return (
    <main className={`min-h-screen ${activeTab === "home" ? "bg-muted p-3 md:p-5" : "bg-white"}`}>
      <section className={`relative flex min-h-screen flex-col overflow-hidden ${activeTab === "home" ? "rounded-[28px] bg-emerald-950 md:min-h-[calc(100vh-2.5rem)]" : "bg-white"}`}>
        {activeTab === "home" && <div className="absolute inset-0">
          {scenicImages.map((image, index) => (
            <div
              key={image}
              className="scenic-slide absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${image})`,
                animation: "scenicFade 25s infinite",
                animationDelay: `${index * 5}s`,
                opacity: index === 0 ? 1 : 0,
              }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-black/70" />
        </div>}

        <div className={`relative flex flex-1 flex-col ${activeTab === "home" ? "px-4 pb-6 pt-5 md:px-8 md:pb-10 md:pt-6" : "px-4 pb-5 pt-5 md:px-8"}`}>
          <nav className="mx-auto flex w-full max-w-7xl animate-slide-in-up items-center justify-between gap-4">
            <div className={`flex flex-1 items-center justify-between rounded-[22px] border px-5 py-3 md:px-7 md:py-4 ${
              activeTab === "home"
                ? "border-white/35 bg-white/80 shadow-[0_18px_48px_rgba(0,0,0,0.14)] backdrop-blur-xl"
                : "border-emerald-900/10 bg-white/90 shadow-[0_14px_34px_rgba(16,48,40,0.08)] backdrop-blur-xl"
            }`}>
              <Link href="/" className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-black text-primary-foreground">DG</span>
                <span className="text-lg font-semibold tracking-tight">
                  <span className="text-primary">{labels.brand}</span>
                  <span className="text-foreground"> Guide</span>
                </span>
              </Link>
              <div className="hidden items-center gap-1 md:flex">
                {homeTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => selectTab(tab.key)}
                    className={`relative min-h-0 rounded-none border-0 bg-transparent px-4 py-2 text-sm transition duration-200 hover:-translate-y-0.5 hover:bg-transparent ${
                      activeTab === tab.key
                        ? "font-semibold text-foreground after:absolute after:bottom-0 after:left-4 after:right-4 after:h-[2px] after:rounded-full after:bg-gradient-to-r after:from-transparent after:via-primary after:to-transparent after:shadow-[0_0_10px_rgba(0,122,47,0.45)]"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLoginOpen(true)}
              className={`inline-flex items-center justify-center rounded-full border py-3 text-sm font-medium transition hover:-translate-y-0.5 md:py-4 ${
                activeTab === "home"
                  ? "border-white/30 bg-white/14 px-4 text-white shadow-sm backdrop-blur-xl hover:bg-white/20"
                  : "border-emerald-900/10 bg-white px-4 text-emerald-950/65 shadow-sm hover:text-emerald-950"
              }`}
              title={labels.admin}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="sr-only">{labels.admin}</span>
            </button>
          </nav>

          {activeTab === "home" ? (
          <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center pt-12 md:pt-16">
            <div className="text-center">
              <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/40 bg-black/25 px-4 py-2 text-sm text-white backdrop-blur-md">
                <Sparkles className="h-4 w-4 text-emerald-300" />
                {labels.badge}
              </div>
              <h1 className="mx-auto max-w-5xl text-balance text-4xl font-medium leading-[1.05] tracking-tight text-white drop-shadow-lg sm:text-5xl md:text-6xl lg:text-7xl">
                {labels.title}
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-pretty text-base font-medium leading-relaxed text-white/90 drop-shadow md:text-lg">
                {labels.desc}
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setActiveTab("chat")}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-base font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
                >
                  <Bot className="h-4 w-4" />
                  {labels.visitor}
                </button>
                <button
                  type="button"
                  onClick={() => setLoginOpen(true)}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/50 bg-white/10 px-7 text-base font-medium text-white backdrop-blur-sm transition hover:bg-white/20 hover:text-white"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {labels.admin}
                </button>
              </div>

              <div className="relative mt-24 flex items-end justify-between gap-4 md:mt-44">
                <div className="flex items-center gap-3 rounded-2xl bg-black/35 px-4 py-3 pr-5 text-white backdrop-blur-md">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-primary">
                    <Mountain className="h-5 w-5" />
                  </div>
                  <p className="max-w-64 text-left text-xs leading-tight md:text-sm">{labels.helped}</p>
                </div>

                <ul className="hidden flex-wrap items-center justify-end gap-3 md:flex">
                  {[labels.pointA, labels.pointB, labels.pointC].map((item) => (
                    <li key={item} className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-black/25 px-4 py-2 text-sm text-white backdrop-blur-md">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                        <Check className="h-3 w-3 text-white" strokeWidth={3} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
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

          {activeTab === "home" && <div className="pointer-events-none absolute bottom-5 left-1/2 hidden -translate-x-1/2 items-center gap-2 rounded-full bg-black/25 px-4 py-2 text-xs text-white/85 backdrop-blur-md md:flex">
            <MapPin className="h-3.5 w-3.5" />
            Huangshan / Zhangjiajie / Guilin / Great Wall
          </div>}

          {activeTab === "home" && <div className="absolute bottom-8 right-8 hidden lg:block"><FloatingDigitalHuman compact /></div>}
        </div>
      </section>

      <FrostedAdminLogin open={loginOpen} onClose={() => setLoginOpen(false)} />

      <style>{`
        @keyframes scenicFade {
          0% { opacity: 0; transform: scale(1.02); filter: saturate(0.92) contrast(1.02); }
          4% { opacity: 1; }
          20% { opacity: 1; }
          28% { opacity: 0; transform: scale(1.09); filter: saturate(1.08) contrast(1.06); }
          100% { opacity: 0; transform: scale(1.09); filter: saturate(1.08) contrast(1.06); }
        }
      `}</style>
    </main>
  )
}

