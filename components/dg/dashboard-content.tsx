"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { ArrowUpRight, BarChart3, FileText, MessageSquare, RefreshCw, Star, Timer } from "lucide-react"
import { AdminFrame } from "@/components/dg/admin-frame"
import { authHeaders, requestWithTimeout, token } from "@/components/dg/api"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type RangeValue = "today" | "week" | "month"

type DashboardState = {
  overview: Record<string, any>
  satisfaction: { trend?: any[]; distribution?: Record<string, number> }
  emotions: Record<string, number>
  hotQuestions: any[]
  interests: Record<string, number>
  hotSpots: any[]
}

const emptyState: DashboardState = {
  overview: {},
  satisfaction: { trend: [], distribution: {} },
  emotions: {},
  hotQuestions: [],
  interests: {},
  hotSpots: [],
}

const label = {
  title: "仪表盘",
  desc: "查看导览服务运行情况、游客偏好与知识命中表现。",
  refresh: "刷新数据",
  loading: "正在读取后端实时数据",
  empty: "暂无数据",
  authWait: "等待登录凭证就绪",
  conversations: "总会话",
  messages: "总消息",
  response: "平均响应",
  satisfaction: "满意度",
  rag: "RAG 命中",
  today: "今日",
  rangeToday: "今日",
  rangeWeek: "近 7 天",
  rangeMonth: "近 30 天",
  satTrend: "满意度趋势",
  satNote: "每日平均分与评分构成",
  avgScore: "平均分",
  emotion: "情感分布",
  emotionNote: "AI 回复情感标签分布",
  hotQuestions: "热门问题",
  hotQuestionsNote: "高频游客问题，单行显示，点击查看全文",
  interests: "兴趣分布",
  interestsNote: "会话中的游客兴趣分布",
  spots: "热门景点",
  spotsNote: "游客咨询中被提及的景点",
  fullQuestion: "问题全文",
  count: "次",
  noToken: "尚未获取登录凭证，已暂停请求。",
  partial: "部分接口暂时未返回，已先显示可用的真实数据。",
}

const colors = ["#007A2F", "#12B981", "#E0B43F", "#6F8D99", "#D66A6A", "#0F6F55", "#A0C878"]

function itemsOf(data: any) {
  return Array.isArray(data) ? data : data?.items || []
}

function rangeText(range: RangeValue) {
  if (range === "today") return label.rangeToday
  if (range === "month") return label.rangeMonth
  return label.rangeWeek
}

function formatNumber(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? number.toLocaleString("zh-CN") : "-"
}

function formatPercent(value: unknown) {
  const number = Number(value)
  if (!Number.isFinite(number)) return "-"
  return `${Math.round(number * 100)}%`
}

function responseTime(value: unknown) {
  const ms = Number(value)
  if (!Number.isFinite(ms)) return "-"
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`
}

function shortDate(value: unknown) {
  const text = String(value || "")
  return text.includes("-") ? text.slice(5).replace("-", "/") : text || "-"
}

function StatCard({ title, value, note, icon: Icon, active }: any) {
  return (
    <Card className={`${active ? "bg-primary text-primary-foreground" : "bg-card text-foreground"} p-5 shadow-lg transition-all duration-300 hover:scale-[1.02]`}>
      <div className="mb-4 flex items-start justify-between">
        <h3 className="text-sm font-medium opacity-90">{title}</h3>
        <div className={`${active ? "bg-primary-foreground/20" : "bg-primary"} flex h-8 w-8 items-center justify-center rounded-full`}>
          <ArrowUpRight className="h-4 w-4 text-primary-foreground" />
        </div>
      </div>
      <p className="mb-4 text-3xl font-bold">{value}</p>
      <div className="flex items-center gap-1.5 text-xs opacity-80">
        <Icon className="h-3.5 w-3.5" />
        {note}
      </div>
    </Card>
  )
}

function PanelHeader({ title, note, range }: { title: string; note: string; range: string }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{note}</p>
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">{range}</span>
    </div>
  )
}

function EmptyBox({ text = label.empty }: { text?: string }) {
  return <div className="grid min-h-40 place-items-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">{text}</div>
}

async function safeRequest<T>(path: string, fallback: T, timeoutMs = 9000) {
  try {
    return { data: await requestWithTimeout<T>(path, { headers: authHeaders() }, timeoutMs), ok: true }
  } catch (error) {
    console.warn(`[Dashboard] ${path}`, error)
    return { data: fallback, ok: false }
  }
}

function ProgressList({ entries }: { entries: { name: string; value: number }[] }) {
  const max = Math.max(...entries.map((item) => item.value), 1)
  if (!entries.length) return <EmptyBox />
  return (
    <div className="space-y-4">
      {entries.slice(0, 8).map((item, index) => (
        <div key={item.name} className="grid grid-cols-[80px_1fr_42px] items-center gap-3 text-sm">
          <span className="truncate text-foreground">{item.name}</span>
          <div className="h-2 rounded-full bg-muted">
            <div className="h-full rounded-full" style={{ width: `${Math.max(6, (item.value / max) * 100)}%`, backgroundColor: colors[index % colors.length] }} />
          </div>
          <strong className="text-right">{item.value}</strong>
        </div>
      ))}
    </div>
  )
}

function SatisfactionPanel({ data, range }: { data: DashboardState["satisfaction"]; range: RangeValue }) {
  const trend = (data?.trend || []).map((item: any) => ({ date: shortDate(item.date), rating: Number(item.avg_rating || 0) }))
  const distribution = Object.entries(data?.distribution || {}).map(([name, value]) => ({ name: `${name} 星`, value: Number(value) }))
  const average = trend.length ? (trend.reduce((sum, item) => sum + item.rating, 0) / trend.length).toFixed(1) : "-"

  return (
    <Card className="p-6 shadow-lg">
      <PanelHeader title={label.satTrend} note={label.satNote} range={rangeText(range)} />
      {trend.length ? (
        <div className="grid min-h-[300px] gap-6 lg:grid-cols-[1fr_210px]">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trend} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E6EEE8" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="rating" stroke="#007A2F" fill="#DDF3EA" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="grid place-items-center">
            {distribution.length ? (
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={distribution} dataKey="value" innerRadius={56} outerRadius={78} paddingAngle={2}>
                    {distribution.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
                  </Pie>
                  <Tooltip />
                  <text x="50%" y="48%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-3xl font-bold">
                    {average}
                  </text>
                  <text x="50%" y="61%" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-xs">
                    {label.avgScore}
                  </text>
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyBox />}
          </div>
        </div>
      ) : <EmptyBox />}
    </Card>
  )
}

function HotQuestionsPanel({ questions, range }: { questions: any[]; range: RangeValue }) {
  const [selected, setSelected] = useState<any | null>(null)
  const current = selected || questions[0] || null

  useEffect(() => {
    setSelected(null)
  }, [questions])

  return (
    <Card className="p-6 shadow-lg">
      <PanelHeader title={label.hotQuestions} note={label.hotQuestionsNote} range={rangeText(range)} />
      {questions.length ? (
        <div className="grid gap-4">
          <div className="max-h-80 space-y-2 overflow-auto pr-1">
            {questions.slice(0, 12).map((item, index) => {
              const question = String(item.question_pattern || item.question || "-")
              const active = current === item
              return (
                <button
                  key={`${question}-${index}`}
                  type="button"
                  onClick={() => setSelected(item)}
                  className={`grid h-11 w-full grid-cols-[1fr_52px] items-center gap-3 rounded-lg border px-3 text-left text-sm transition-colors ${active ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/30 hover:bg-muted/30"}`}
                  title={question}
                >
                  <span className="truncate font-medium">{question}</span>
                  <span className="text-right text-xs text-muted-foreground">{formatNumber(item.count)} {label.count}</span>
                </button>
              )
            })}
          </div>
          {current && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="mb-2 text-xs font-medium text-primary">{label.fullQuestion}</p>
              <p className="text-sm leading-6 text-foreground">{String(current.question_pattern || current.question || "-")}</p>
            </div>
          )}
        </div>
      ) : <EmptyBox />}
    </Card>
  )
}

export function DashboardContent() {
  const [range, setRange] = useState<RangeValue>("week")
  const [data, setData] = useState<DashboardState>(emptyState)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [authReady, setAuthReady] = useState(false)

  const load = useCallback(async () => {
    if (!token()) {
      setError(label.noToken)
      setLoading(false)
      return
    }

    setLoading(true)
    setError("")
    const [overview, satisfaction, emotionTrend, hotQuestions, interests, hotSpots] = await Promise.all([
      safeRequest(`/api/admin/stats/overview?range=${range}`, {}),
      safeRequest(`/api/admin/stats/satisfaction?range=${range}`, { trend: [], distribution: {} }),
      safeRequest(`/api/admin/stats/emotion-trend?range=${range}`, { distribution: {} }),
      safeRequest(`/api/admin/stats/hot-questions?range=${range}&limit=12`, { items: [] }),
      safeRequest(`/api/admin/stats/interest-distribution?range=${range}`, {}),
      safeRequest(`/api/admin/stats/hot-spots?range=${range}&limit=8`, { items: [] }),
    ])

    setData({
      overview: overview.data || {},
      satisfaction: satisfaction.data || { trend: [], distribution: {} },
      emotions: (emotionTrend.data as any)?.distribution || {},
      hotQuestions: itemsOf(hotQuestions.data),
      interests: (interests.data as Record<string, number>) || {},
      hotSpots: itemsOf(hotSpots.data),
    })
    setError([overview, satisfaction, emotionTrend, hotQuestions, interests, hotSpots].some((item) => !item.ok) ? label.partial : "")
    setLoading(false)
  }, [range])

  useEffect(() => {
    if (token()) {
      setAuthReady(true)
      return
    }

    let attempts = 0
    const id = window.setInterval(() => {
      attempts += 1
      if (token()) {
        setAuthReady(true)
        window.clearInterval(id)
      }
      if (attempts > 20) {
        setLoading(false)
        window.clearInterval(id)
      }
    }, 100)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (authReady) load()
  }, [authReady, load])

  const interestEntries = useMemo(
    () => Object.entries(data.interests || {}).map(([name, value]) => ({ name, value: Number(value) })).sort((a, b) => b.value - a.value),
    [data.interests],
  )
  const emotionEntries = useMemo(
    () => Object.entries(data.emotions || {}).map(([name, value]) => ({ name, value: Number(value) })).sort((a, b) => b.value - a.value),
    [data.emotions],
  )
  const spotEntries = useMemo(
    () => (data.hotSpots || []).map((item) => ({ name: item.spot_name || item.name || "-", value: Number(item.mention_count || item.count || 0) })),
    [data.hotSpots],
  )

  const actions = (
    <Button onClick={load} disabled={loading || !authReady}>
      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      {label.refresh}
    </Button>
  )

  return (
    <AdminFrame title={label.title} description={label.desc} actions={actions}>
      {!authReady && <Card className="mb-5 p-4 text-sm text-muted-foreground shadow-sm">{label.authWait}</Card>}
      {error && <Card className="mb-5 border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive shadow-sm">{error}</Card>}

      <div className="mb-5 flex flex-wrap gap-2">
        {(["today", "week", "month"] as RangeValue[]).map((item) => (
          <Button key={item} variant={range === item ? "default" : "outline"} size="sm" onClick={() => setRange(item)}>
            {rangeText(item)}
          </Button>
        ))}
      </div>

      {loading ? (
        <Card className="mb-5 p-6 text-sm text-muted-foreground shadow-lg">{label.loading}</Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard active title={label.conversations} value={formatNumber(data.overview.total_conversations)} note={label.today} icon={MessageSquare} />
        <StatCard title={label.messages} value={formatNumber(data.overview.total_messages)} note={label.today} icon={FileText} />
        <StatCard title={label.response} value={responseTime(data.overview.avg_response_ms)} note="Raw avg" icon={Timer} />
        <StatCard title={label.satisfaction} value={data.overview.avg_satisfaction == null ? "-" : Number(data.overview.avg_satisfaction).toFixed(1)} note={label.avgScore} icon={Star} />
        <StatCard title={label.rag} value={formatPercent(data.overview.rag_hit_rate)} note="Knowledge hit" icon={BarChart3} />
      </div>

      <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(360px,1fr)]">
        <SatisfactionPanel data={data.satisfaction} range={range} />
        <Card className="p-6 shadow-lg">
          <PanelHeader title={label.emotion} note={label.emotionNote} range={rangeText(range)} />
          <ProgressList entries={emotionEntries} />
        </Card>
      </div>

      <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(360px,1fr)]">
        <HotQuestionsPanel questions={data.hotQuestions} range={range} />
        <div className="grid gap-5">
          <Card className="p-6 shadow-lg">
            <PanelHeader title={label.interests} note={label.interestsNote} range={rangeText(range)} />
            <ProgressList entries={interestEntries} />
          </Card>
          <Card className="p-6 shadow-lg">
            <PanelHeader title={label.spots} note={label.spotsNote} range={rangeText(range)} />
            <ProgressList entries={spotEntries} />
          </Card>
        </div>
      </div>
    </AdminFrame>
  )
}
