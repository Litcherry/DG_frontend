"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import { Check, Play, RefreshCw, Save, Sparkles, Volume2 } from "lucide-react"
import { AdminFrame } from "@/components/dg/admin-frame"
import { apiBase, authHeaders, request } from "@/components/dg/api"
import { MODEL_OPTIONS, VrmAvatarStage, type VrmGuideOption, type VrmMotionKey } from "@/components/dg/vrm-avatar-stage"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type VoiceGender = "female" | "male"
type VoiceSpeed = "slow" | "medium" | "fast"
type VoiceStyle = "lively" | "calm" | "warm" | "professional"

type DigitalHumanConfig = {
  name: string
  appearance: string
  voice_gender: VoiceGender
  voice_speed: VoiceSpeed
  expression_style: VoiceStyle
  extra_config: Record<string, any>
}

type CharacterOption = {
  id: string
  title: string
  subtitle: string
  culture: string
  model: string
  voiceGender: VoiceGender
  motions: VrmMotionKey[]
  badge: string
  tone: string
  gradient: string
}

const guideById = MODEL_OPTIONS.reduce<Record<string, VrmGuideOption>>((items, guide) => {
  items[guide.id] = guide
  return items
}, {})

const characters: CharacterOption[] = [
  {
    id: "xiaohao",
    title: "小号",
    subtitle: "沉稳男声导览员",
    culture: "适合历史讲解、路线规划和秩序引导。",
    model: guideById.xiaohao?.value || "/assets/vrm/7533417284697534698.vrm",
    voiceGender: "male",
    motions: ["modelPose"],
    badge: "Guide M",
    tone: "稳重 / 清晰",
    gradient: "from-slate-900 via-slate-700 to-emerald-800",
  },
  {
    id: "karmesi",
    title: "Karmesi",
    subtitle: "亲和女声陪伴者",
    culture: "适合轻松问答、迎宾互动和拍照打卡推荐。",
    model: guideById.karmesi?.value || "/assets/vrm/karmesi.vrm",
    voiceGender: "female",
    motions: ["greeting", "modelPose"],
    badge: "Guide K",
    tone: "亲切 / 活泼",
    gradient: "from-orange-500 via-rose-500 to-stone-900",
  },
  {
    id: "guideA",
    title: "导览员 A",
    subtitle: "活力女声文化讲解员",
    culture: "适合入口欢迎、全身展示、手势讲解和重点景点介绍。",
    model: guideById.guideA?.value || "/assets/vrm/default_2963.vrm",
    voiceGender: "female",
    motions: ["fullBody", "greeting", "vSign", "modelPose"],
    badge: "Guide A",
    tone: "明亮 / 热情",
    gradient: "from-cyan-400 via-fuchsia-500 to-indigo-900",
  },
  {
    id: "guideB",
    title: "导览员 B",
    subtitle: "潮流女声互动助手",
    culture: "适合年轻游客互动、路线提示和趣味推荐。",
    model: guideById.guideB?.value || "/assets/vrm/default_2704.vrm",
    voiceGender: "female",
    motions: ["greeting", "modelPose", "spin", "vSign"],
    badge: "Guide B",
    tone: "轻快 / 有趣",
    gradient: "from-teal-300 via-blue-500 to-violet-900",
  },
]

const voiceSpeeds: Array<{ value: VoiceSpeed; label: string; detail: string }> = [
  { value: "slow", label: "慢速", detail: "适合长者与深度讲解" },
  { value: "medium", label: "自然", detail: "日常导览推荐" },
  { value: "fast", label: "快速", detail: "适合简短提示" },
]

const voiceStyles: Array<{ value: VoiceStyle; label: string; detail: string }> = [
  { value: "lively", label: "活泼", detail: "轻松、有互动感" },
  { value: "warm", label: "温柔", detail: "陪伴感更强" },
  { value: "calm", label: "沉稳", detail: "文化讲解更可靠" },
  { value: "professional", label: "专业", detail: "服务指引更清晰" },
]

const defaultCharacter = characters[2]

const defaults: DigitalHumanConfig = {
  name: defaultCharacter.title,
  appearance: defaultCharacter.id,
  voice_gender: defaultCharacter.voiceGender,
  voice_speed: "medium",
  expression_style: "lively",
  extra_config: {
    role: "景区 AI 数字人导览员",
    model_type: "vrm",
    vrm_model_path: defaultCharacter.model,
    selected_character: defaultCharacter.id,
    welcome_message: "您好，我是景区 AI 数字人导览员，很高兴为您讲解景点、规划路线和提供服务信息。",
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

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ")
}

function selectedCharacterFromConfig(cfg: DigitalHumanConfig) {
  const extra = cfg.extra_config || {}
  return (
    characters.find((item) => item.id === extra.selected_character) ||
    characters.find((item) => item.id === cfg.appearance) ||
    characters.find((item) => item.model === extra.vrm_model_path) ||
    defaultCharacter
  )
}

export function HumanContent() {
  const [cfg, setCfg] = useState<DigitalHumanConfig>(defaults)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [previewMode, setPreviewMode] = useState<"idle" | "talk" | "happy">("idle")
  const extra = { ...defaults.extra_config, ...(cfg.extra_config || {}) }
  const selectedCharacter = useMemo(() => selectedCharacterFromConfig(cfg), [cfg])

  async function load() {
    setLoading(true)
    setMessage("")
    const data = await request<DigitalHumanConfig | null>("/api/admin/digital-human/config", { headers: authHeaders() }).catch(() => null)
    const merged: DigitalHumanConfig = {
      ...defaults,
      ...(data || {}),
      extra_config: { ...defaults.extra_config, ...((data as any)?.extra_config || {}) },
    }
    const character = selectedCharacterFromConfig(merged)
    setCfg({
      ...merged,
      name: merged.name || character.title,
      appearance: character.id,
      voice_gender: (merged.voice_gender || character.voiceGender) as VoiceGender,
      extra_config: {
        ...merged.extra_config,
        selected_character: character.id,
        vrm_model_path: character.model,
        model_type: "vrm",
      },
    })
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  function setField<Key extends keyof DigitalHumanConfig>(name: Key, value: DigitalHumanConfig[Key]) {
    setCfg((current) => ({ ...current, [name]: value }))
  }

  function setExtra(name: string, value: any) {
    setCfg((current) => ({ ...current, extra_config: { ...(current.extra_config || {}), [name]: value } }))
  }

  function selectCharacter(character: CharacterOption) {
    setCfg((current) => ({
      ...current,
      name: current.name && current.name !== selectedCharacter.title ? current.name : character.title,
      appearance: character.id,
      voice_gender: character.voiceGender,
      extra_config: {
        ...(current.extra_config || {}),
        role: current.extra_config?.role || "景区 AI 数字人导览员",
        model_type: "vrm",
        selected_character: character.id,
        vrm_model_path: character.model,
        default_motion: guideById[character.id]?.defaultMotion || "idle",
      },
    }))
    setPreviewMode("happy")
    window.setTimeout(() => setPreviewMode("idle"), 1200)
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setMessage("")
    const extra_config = {
      ...extra,
      selected_character: selectedCharacter.id,
      vrm_model_path: selectedCharacter.model,
      model_type: "vrm",
      available_motions: selectedCharacter.motions,
    }
    try {
      const saved = await request<DigitalHumanConfig>("/api/admin/digital-human/config", {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          name: cfg.name || selectedCharacter.title,
          appearance: selectedCharacter.id,
          voice_gender: cfg.voice_gender,
          voice_speed: cfg.voice_speed,
          expression_style: cfg.expression_style,
          extra_config,
        }),
      })
      localStorage.setItem("dg_admin_human_settings", JSON.stringify(extra_config))
      setCfg({ ...cfg, ...(saved as any), appearance: selectedCharacter.id, extra_config })
      setMessage("数字人配置已保存，并同步到游客端。")
    } catch (error: any) {
      setMessage(error?.message || "保存失败，请确认后端服务和管理员登录状态。")
    } finally {
      setSaving(false)
    }
  }

  async function previewVoice() {
    setMessage("正在生成试听语音...")
    setPreviewMode("talk")
    const res = await fetch(`${apiBase()}/api/voice/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: extra.welcome_message || defaults.extra_config.welcome_message,
        language: "zh",
        voice_gender: cfg.voice_gender,
        voice_speed: cfg.voice_speed,
        expression_style: cfg.expression_style,
      }),
    })
    if (!res.ok) {
      setPreviewMode("idle")
      setMessage("试听语音生成失败，请确认后端 TTS 服务状态。")
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    audio.onended = () => {
      URL.revokeObjectURL(url)
      setPreviewMode("idle")
    }
    audio.onerror = () => {
      URL.revokeObjectURL(url)
      setPreviewMode("idle")
    }
    await audio.play()
    setMessage("正在播放试听语音。")
  }

  return (
    <AdminFrame
      title="数字人形象管理"
      description="配置数字人的外观、服装、声音、语速和讲解风格，使其更贴合景区文化特色。"
      actions={<Button onClick={load} disabled={loading} variant="outline"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />刷新配置</Button>}
    >
      {message ? <p className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{message}</p> : null}

      <form className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_460px]" onSubmit={save}>
        <div className="space-y-5">
          <Card className="overflow-hidden border-emerald-900/10 bg-white p-0 shadow-[0_18px_60px_rgba(15,38,25,0.08)]">
            <div className="border-b border-border px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-600">Character Select</p>
              <h2 className="mt-1 text-2xl font-semibold text-foreground">选择数字人形象</h2>
            </div>
            <div className="grid gap-3 p-5 md:grid-cols-2">
              {characters.map((character) => {
                const active = selectedCharacter.id === character.id
                return (
                  <button
                    key={character.id}
                    type="button"
                    onClick={() => selectCharacter(character)}
                    className={classNames(
                      "group relative overflow-hidden rounded-[22px] border p-4 text-left transition duration-300 hover:-translate-y-1 hover:shadow-xl",
                      active ? "border-emerald-500 bg-emerald-50 shadow-[0_18px_50px_rgba(0,122,47,0.16)]" : "border-border bg-white hover:border-emerald-200",
                    )}
                  >
                    <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${character.gradient}`} />
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="rounded-full border border-emerald-900/10 bg-white/80 px-2.5 py-1 text-[11px] font-bold text-emerald-700">{character.badge}</span>
                        <h3 className="mt-4 text-lg font-semibold text-foreground">{character.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{character.subtitle}</p>
                      </div>
                      <span className={classNames("grid h-8 w-8 place-items-center rounded-full border transition", active ? "border-emerald-500 bg-emerald-600 text-white" : "border-border text-muted-foreground group-hover:border-emerald-300")}>
                        {active ? <Check className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                      </span>
                    </div>
                    <p className="mt-4 min-h-[44px] text-sm leading-6 text-muted-foreground">{character.culture}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">{character.voiceGender === "male" ? "默认男声" : "默认女声"}</span>
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">{character.tone}</span>
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">{character.motions.length} 个动作</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </Card>

          <Card className="border-emerald-900/10 bg-white p-5 shadow-[0_18px_60px_rgba(15,38,25,0.08)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-600">Voice Settings</p>
                <h2 className="mt-1 text-xl font-semibold">声音与讲解配置</h2>
              </div>
              <Button type="button" variant="outline" onClick={previewVoice} className="bg-transparent"><Play className="h-4 w-4" />试听</Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                数字人名称
                <Input value={cfg.name || ""} onChange={(event) => setField("name", event.target.value)} placeholder="例如：小号 / 灵灵 / AI 导览员" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                角色定位
                <Input value={extra.role || ""} onChange={(event) => setExtra("role", event.target.value)} placeholder="例如：灵山文化讲解员" />
              </label>

              <div className="grid gap-2">
                <span className="text-sm font-medium">声音</span>
                <div className="grid grid-cols-2 gap-2">
                  {(["female", "male"] as VoiceGender[]).map((gender) => (
                    <button
                      key={gender}
                      type="button"
                      onClick={() => setField("voice_gender", gender)}
                      className={classNames("rounded-2xl border px-4 py-3 text-sm font-semibold transition", cfg.voice_gender === gender ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-border hover:border-emerald-200")}
                    >
                      {gender === "female" ? "女声" : "男声"}
                    </button>
                  ))}
                </div>
              </div>

              <label className="grid gap-2 text-sm font-medium">
                音量
                <Input type="number" min="0" max="100" value={extra.volume ?? 85} onChange={(event) => setExtra("volume", Number(event.target.value))} />
              </label>

              <div className="md:col-span-2 grid gap-2">
                <span className="text-sm font-medium">语速</span>
                <div className="grid gap-2 md:grid-cols-3">
                  {voiceSpeeds.map((speed) => (
                    <button
                      key={speed.value}
                      type="button"
                      onClick={() => setField("voice_speed", speed.value)}
                      className={classNames("rounded-2xl border p-4 text-left transition hover:-translate-y-0.5", cfg.voice_speed === speed.value ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-border hover:border-emerald-200")}
                    >
                      <strong className="block">{speed.label}</strong>
                      <span className="mt-1 block text-xs text-muted-foreground">{speed.detail}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 grid gap-2">
                <span className="text-sm font-medium">声音风格</span>
                <div className="grid gap-2 md:grid-cols-4">
                  {voiceStyles.map((style) => (
                    <button
                      key={style.value}
                      type="button"
                      onClick={() => setField("expression_style", style.value)}
                      className={classNames("rounded-2xl border p-4 text-left transition hover:-translate-y-0.5", cfg.expression_style === style.value ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-border hover:border-emerald-200")}
                    >
                      <strong className="block">{style.label}</strong>
                      <span className="mt-1 block text-xs text-muted-foreground">{style.detail}</span>
                    </button>
                  ))}
                </div>
              </div>

              <label className="md:col-span-2 grid gap-2 text-sm font-medium">
                开场欢迎语
                <Textarea className="min-h-28" value={extra.welcome_message || ""} onChange={(event) => setExtra("welcome_message", event.target.value)} placeholder="游客进入对话时的数字人开场白" />
              </label>
            </div>
          </Card>
        </div>

        <Card className="sticky top-5 h-[calc(100vh-2.5rem)] min-h-[720px] overflow-hidden border-emerald-900/10 bg-[#071d16] p-0 text-white shadow-[0_24px_80px_rgba(7,29,22,0.28)]">
          <div className={`absolute inset-0 bg-gradient-to-br ${selectedCharacter.gradient} opacity-45`} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.22),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.12),rgba(0,0,0,0.28))]" />
          <div className="relative z-10 flex h-full flex-col">
            <div className="flex items-start justify-between gap-3 p-5">
              <div>
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white/80 backdrop-blur">{selectedCharacter.badge}</span>
                <h2 className="mt-4 text-3xl font-semibold">{selectedCharacter.title}</h2>
                <p className="mt-1 text-sm text-white/70">{selectedCharacter.subtitle}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-3 text-right text-xs text-white/70 backdrop-blur">
                <Volume2 className="ml-auto h-5 w-5 text-white" />
                <p className="mt-2">{cfg.voice_gender === "male" ? "男声" : "女声"} · {voiceSpeeds.find((item) => item.value === cfg.voice_speed)?.label}</p>
              </div>
            </div>

            <div className="relative min-h-0 flex-1 px-5">
              <VrmAvatarStage
                model={selectedCharacter.model}
                mode={previewMode}
                motionPlaylist={selectedCharacter.motions}
                showControls={false}
                showStatus={false}
                surface="transparent"
                framing="full"
                className="h-full min-h-[520px]"
              />
            </div>

            <div className="relative z-20 border-t border-white/10 bg-black/24 p-5 backdrop-blur-xl">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                  <p className="text-xs text-white/55">形象</p>
                  <strong className="mt-1 block text-sm">{selectedCharacter.title}</strong>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                  <p className="text-xs text-white/55">风格</p>
                  <strong className="mt-1 block text-sm">{voiceStyles.find((item) => item.value === cfg.expression_style)?.label}</strong>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                  <p className="text-xs text-white/55">动作</p>
                  <strong className="mt-1 block text-sm">{selectedCharacter.motions.length} 组</strong>
                </div>
              </div>
              <Button className="mt-4 w-full" disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? "保存中..." : "保存并同步到游客端"}
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </AdminFrame>
  )
}
