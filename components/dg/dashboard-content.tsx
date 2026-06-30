"use client"

import Link from "next/link"
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
import { AlertCircle, ArrowUpRight, BarChart3, Bot, Database, FileText, Map, MessageSquare, RefreshCw, Star, Timer } from "lucide-react"
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
  title: "\u4EEA\u8868\u76D8",
  desc: "\u67E5\u770B\u5BFC\u89C8\u670D\u52A1\u8FD0\u884C\u60C5\u51B5\u3001\u6E38\u5BA2\u504F\u597D\u4E0E\u77E5\u8BC6\u547D\u4E2D\u8868\u73B0\u3002",
  backend: "\u540E\u7AEF\u5B9E\u65F6\u6570\u636E",
  refresh: "\u5237\u65B0\u6570\u636E",
  loading: "\u6B63\u5728\u8BFB\u53D6\u540E\u7AEF\u5B9E\u65F6\u6570\u636E",
  empty: "\u6682\u65E0\u6570\u636E",
  authWait: "\u7B49\u5F85\u767B\u5F55\u51ED\u8BC1\u5C31\u7EEA",
  conversations: "\u603B\u4F1A\u8BDD",
  messages: "\u603B\u6D88\u606F",
  response: "\u5E73\u5747\u54CD\u5E94\u65F6\u95F4",
  satisfaction: "\u6EE1\u610F\u5EA6",
  rag: "RAG \u547D\u4E2D\u7387",
  today: "\u4ECA\u65E5",
  rangeToday: "\u4ECA\u65E5",
  rangeWeek: "\u6700\u8FD1 7 \u5929",
  rangeMonth: "\u6700\u8FD1 30 \u5929",
  satTrend: "\u6EE1\u610F\u5EA6\u8D8B\u52BF",
  satNote: "\u6BCF\u65E5\u5747\u5206\u4E0E\u8BC4\u5206\u6784\u6210",
  avgScore: "\u5E73\u5747\u8BC4\u5206",
  emotion: "\u60C5\u7EEA\u8D8B\u52BF",
  emotionNote: "AI \u56DE\u590D\u60C5\u7EEA\u6807\u7B7E\u5206\u5E03",
  hotQuestions: "\u70ED\u95E8\u95EE\u9898",
  hotQuestionsNote: "\u9AD8\u9891\u6E38\u5BA2\u95EE\u9898\uFF0C\u5355\u884C\u663E\u793A\uFF0C\u70B9\u51FB\u67E5\u770B\u5168\u6587",
  interests: "\u5174\u8DA3\u5206\u5E03",
  interestsNote: "\u4F1A\u8BDD\u4E2D\u7684\u6E38\u5BA2\u5174\u8DA3\u5206\u5E03",
  spots: "\u70ED\u95E8\u666F\u70B9",
  spotsNote: "\u6E38\u5BA2\u54A8\u8BE2\u4E2D\u88AB\u63D0\u53CA\u7684\u666F\u70B9",
  fullQuestion: "\u95EE\u9898\u5168\u6587",
  count: "\u6B21",
  noToken: "\u5C1A\u672A\u83B7\u53D6\u767B\u5F55\u51ED\u8BC1\uFF0C\u5DF2\u6682\u505C\u8BF7\u6C42\u3002",
  partial: "\u90E8\u5206\u63A5\u53E3\u6682\u65F6\u672A\u8FD4\u56DE\uFF0C\u5DF2\u5148\u663E\u793A\u53EF\u7528\u7684\u771F\u5B9E\u6570\u636E\u3002",
  quickActions: "\u5FEB\u6377\u64CD\u4F5C",
  uploadKnowledge: "\u4E0A\u4F20\u77E5\u8BC6\u6587\u6863",
  viewBlind: "\u67E5\u770B\u77E5\u8BC6\u76F2\u70B9",
  manageScenic: "\u7BA1\u7406\u666F\u533A\u6570\u636E",
  configHuman: "\u914D\u7F6E\u6570\u5B57\u4EBA",
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
      <p className="mb-4 text-4xl font-bold">{value}</p>
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
  const distribution = Object.entries(data?.distribution || {}).map(([name, value]) => ({ name: `${name} star`, value: Number(value) }))
  const average = trend.length ? trend.reduce((sum, item) => sum + item.rating, 0) / trend.length : 0

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
                    {average.toFixed(1)}
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
                  className={`${active ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"} grid h-11 w-full grid-cols-[1fr_52px] items-center gap-3 rounded-lg border px-3 text-left text-sm transition-colors`}
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
    <>
      <Button variant="outline" asChild><Link href="/settings">{label.backend}</Link></Button>
      <Button onClick={load} disabled={loading || !authReady}>
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        {label.refresh}
      </Button>
    </>
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

      <Card className="mb-5 p-4 shadow-lg">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">{label.quickActions}</h2>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <Button asChild variant="outline"><Link href="/knowledge"><Database className="h-4 w-4" />{label.uploadKnowledge}</Link></Button>
          <Button asChild variant="outline"><Link href="/knowledge?tab=blind"><AlertCircle className="h-4 w-4" />{label.viewBlind}</Link></Button>
          <Button asChild variant="outline"><Link href="/scenic"><Map className="h-4 w-4" />{label.manageScenic}</Link></Button>
          <Button asChild variant="outline"><Link href="/human"><Bot className="h-4 w-4" />{label.configHuman}</Link></Button>
        </div>
      </Card>

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
