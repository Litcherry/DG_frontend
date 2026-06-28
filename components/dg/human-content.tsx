"use client"

import { useEffect, useState } from "react"
import { Bot, Play, RefreshCw, Save, Upload } from "lucide-react"
import { AdminFrame } from "@/components/dg/admin-frame"
import { apiBase, authHeaders, request, resolveMediaURL } from "@/components/dg/api"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

const defaults = {
  name: "AI 导览员",
  appearance: "modern",
  voice_gender: "female",
  voice_speed: "medium",
  expression_style: "lively",
  extra_config: {
    role: "知识库数字人讲解员",
    model_type: "live2d",
    live2d_model_path: "",
    theme_color: "#007a2f",
    position: "left",
    welcome_message: "您好，我是当前场景的 AI 导览员，很高兴为你提供讲解与路线服务。",
    volume: 85,
    tts_enabled: true,
    auto_voice: true,
    voice_input_enabled: true,
    allow_interrupt: true,
    lip_sync_enabled: true,
    welcome_enabled: true,
    default_motion: "idle",
  },
}

export function HumanContent() {
  const [cfg, setCfg] = useState<any>(defaults)
  const [avatar, setAvatar] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const extra = { ...defaults.extra_config, ...(cfg.extra_config || {}) }

  async function load() {
    setLoading(true)
    setMessage("")
    const data = await request("/api/admin/digital-human/config", { headers: authHeaders() }).catch(() => defaults)
    setCfg({ ...defaults, ...(data || {}), extra_config: { ...defaults.extra_config, ...(data as any)?.extra_config } })
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  function setField(name: string, value: any) {
    setCfg((current: any) => ({ ...current, [name]: value }))
  }

  function setExtra(name: string, value: any) {
    setCfg((current: any) => ({ ...current, extra_config: { ...(current.extra_config || {}), [name]: value } }))
  }

  async function uploadAvatarIfNeeded() {
    if (!avatar) return null
    const form = new FormData()
    form.append("file", avatar)
    const data = await request<any>("/api/admin/digital-human/avatar", { method: "POST", headers: authHeaders(), body: form })
    return data.avatar_url
  }

  async function save(event: React.FormEvent) {
    event.preventDefault()
    setMessage("")
    const avatarUrl = await uploadAvatarIfNeeded()
    const extra_config = { ...extra, ...(avatarUrl ? { avatar_url: avatarUrl } : {}) }
    const saved = await request("/api/admin/digital-human/config", {
      method: "PUT",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        name: cfg.name,
        appearance: cfg.appearance,
        voice_gender: cfg.voice_gender,
        voice_speed: cfg.voice_speed,
        expression_style: cfg.expression_style,
        extra_config,
      }),
    })
    localStorage.setItem("dg_admin_human_settings", JSON.stringify(extra_config))
    setCfg({ ...cfg, ...(saved as any), extra_config })
    setAvatar(null)
    setMessage("数字人配置已保存")
  }

  async function previewVoice() {
    setMessage("正在生成试听语音...")
    const res = await fetch(`${apiBase()}/api/voice/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: extra.welcome_message || "欢迎使用 DG AI 导览服务。",
        language: "zh",
        voice_gender: cfg.voice_gender,
        voice_speed: cfg.voice_speed,
      }),
    })
    if (!res.ok) {
      setMessage("试听语音生成失败，请确认后端 TTS 服务状态")
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    audio.onended = () => URL.revokeObjectURL(url)
    await audio.play()
    setMessage("正在播放试听语音")
  }

  return (
    <AdminFrame
      title="数字人配置"
      description="配置游客端数字人名称、声音、形象和交互行为。"
      actions={<Button onClick={load} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />刷新</Button>}
    >
      {message && <p className="rounded-lg border border-border bg-card px-4 py-2 text-sm text-primary">{message}</p>}
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card className="animate-slide-in-up p-6 shadow-lg">
          <form className="grid gap-4 md:grid-cols-2" onSubmit={save}>
            <h2 className="md:col-span-2 text-xl font-semibold">形象配置</h2>
            <Input value={cfg.name || ""} onChange={(e) => setField("name", e.target.value)} placeholder="数字人名称" />
            <Input value={extra.role || ""} onChange={(e) => setExtra("role", e.target.value)} placeholder="角色定位" />
            <select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={extra.model_type} onChange={(e) => setExtra("model_type", e.target.value)}>
              <option value="live2d">Live2D</option>
              <option value="static">静态图片</option>
            </select>
            <select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={cfg.appearance} onChange={(e) => setField("appearance", e.target.value)}>
              <option value="modern">现代智慧导游</option>
              <option value="hanfu">文化讲解员</option>
              <option value="nature">自然探索助手</option>
              <option value="custom">自定义模型</option>
            </select>
            <Input className="md:col-span-2" value={extra.live2d_model_path || ""} onChange={(e) => setExtra("live2d_model_path", e.target.value)} placeholder="./assets/live2d/guide/guide.model3.json" />
            <Input type="color" value={extra.theme_color || "#007a2f"} onChange={(e) => setExtra("theme_color", e.target.value)} />
            <select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={extra.position} onChange={(e) => setExtra("position", e.target.value)}>
              <option value="left">左侧</option>
              <option value="right">右侧</option>
            </select>

            <h2 className="md:col-span-2 mt-3 text-xl font-semibold">语音与交互</h2>
            <select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={cfg.voice_gender} onChange={(e) => setField("voice_gender", e.target.value)}>
              <option value="female">女声</option>
              <option value="male">男声</option>
            </select>
            <select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={cfg.voice_speed} onChange={(e) => setField("voice_speed", e.target.value)}>
              <option value="slow">慢速</option>
              <option value="medium">适中</option>
              <option value="fast">快速</option>
            </select>
            <Input type="number" min="0" max="100" value={extra.volume} onChange={(e) => setExtra("volume", Number(e.target.value))} placeholder="音量" />
            <Input value={extra.default_motion || "idle"} onChange={(e) => setExtra("default_motion", e.target.value)} placeholder="默认动作" />
            <Textarea className="md:col-span-2 min-h-28" value={extra.welcome_message || ""} onChange={(e) => setExtra("welcome_message", e.target.value)} placeholder="欢迎语" />
            <label className="md:col-span-2 flex h-10 items-center gap-2 rounded-md border border-input px-3 text-sm text-muted-foreground">
              <Upload className="h-4 w-4" />
              <span>{avatar?.name || "上传静态头像"}</span>
              <input className="hidden" type="file" accept=".jpg,.jpeg,.png,.gif,.webp" onChange={(e) => setAvatar(e.target.files?.[0] || null)} />
            </label>
            <div className="md:col-span-2 flex flex-wrap gap-2">
              <Button><Save className="h-4 w-4" />保存并同步游客端</Button>
              <Button type="button" variant="outline" onClick={previewVoice} className="bg-transparent"><Play className="h-4 w-4" />试听语音</Button>
            </div>
          </form>
        </Card>

        <Card className="sticky top-5 animate-slide-in-up items-center justify-center p-6 text-center shadow-lg" style={{ animationDelay: "120ms" }}>
          <div className="mb-4 grid h-56 w-full place-items-center overflow-hidden rounded-xl border border-border bg-gradient-to-br from-emerald-50 to-background">
            {extra.avatar_url ? <img className="h-full w-full object-cover" src={resolveMediaURL(extra.avatar_url)} alt={cfg.name} /> : <Bot className="h-20 w-20 text-primary" />}
          </div>
          <h2 className="text-2xl font-semibold">{cfg.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{extra.role}</p>
          <div className="mt-5 grid w-full grid-cols-3 gap-2">
            {["idle", "thinking", "speaking"].map((item) => <div key={item} className="rounded-lg border border-border px-2 py-2 text-xs">{item}</div>)}
          </div>
          <p className="mt-5 text-sm leading-6 text-muted-foreground">当前配置将通过原后端数字人配置接口保存，并同步到游客端使用。</p>
        </Card>
      </div>
    </AdminFrame>
  )
}
