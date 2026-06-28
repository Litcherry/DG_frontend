"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Activity, ArrowUpRight, FlaskConical, MessageSquare, Play, RefreshCw, Star, Timer, TrendingUp } from "lucide-react"
import { AdminFrame } from "@/components/dg/admin-frame"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { authHeaders, demoData, request, requestAdminData } from "@/components/dg/api"

type DashboardState = {
  overview: any
  satisfaction: any
  emotions: Record<string, number>
  hotQuestions: any[]
  interests: Record<string, number>
  hotSpots: any[]
  source: "backend" | "demo" | "mixed" | "loading"
}

const initialState: DashboardState = {
  overview: null,
  satisfaction: null,
  emotions: {},
  hotQuestions: [],
  interests: {},
  hotSpots: [],
  source: "loading",
}

const chartColors = ["#007a2f", "#0f9f6e", "#e4c65d", "#6f8d99", "#d96b6b", "#8bbf9f", "#1b6b50"]

function responseTime(value: unknown) {
  const ms = Number(value)
  if (!Number.isFinite(ms)) return "-"
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`
}

function shortDate(value: unknown) {
  const text = String(value || "")
  if (!text) return "-"
  if (text.includes("-")) return text.slice(5).replace("-", "/")
  return text
}

function StatCard({ title, value, note, icon: Icon, active, delay }: any) {
  return (
    <Card
      className={`${active ? "bg-primary text-primary-foreground" : "bg-card text-foreground"} cursor-pointer p-5 shadow-lg transition-all duration-500 ease-out animate-slide-in-up hover:scale-[1.03] hover:shadow-2xl`}
      style={{ animationDelay: delay }}
    >
      <div className="mb-1 flex items-start justify-between">
        <h3 className="text-sm font-medium opacity-90">{title}</h3>
        <div className={`${active ? "bg-primary-foreground/20" : "bg-primary"} flex h-7 w-7 items-center justify-center rounded-full transition-transform duration-300 group-hover:rotate-45`}>
          <ArrowUpRight className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
      </div>
      <p className="mb-2 text-4xl font-bold">{value}</p>
      <div className="flex items-center gap-1.5 text-xs opacity-80">
        <Icon className="h-3.5 w-3.5" />
        <span>{note}</span>
      </div>
    </Card>
  )
}

function PanelHeader({ title, note, range }: { title: string; note: string; range: string }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{note}</p>
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">{range}</span>
    </div>
  )
}

function EmptyChart({ text = "暂无数据" }: { text?: string }) {
  return <div className="grid h-full min-h-48 place-items-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">{text}</div>
}

function SatisfactionPanel({ trend, distribution }: { trend: any[]; distribution: Record<string, number> }) {
  const lineData = trend.map((item) => ({
    date: shortDate(item.date),
    rating: Number(item.avg_rating || 0),
    count: Number(item.count || 0),
  }))
  const pieData = Object.entries(distribution || {}).map(([name, value]) => ({ name: `${name}星`, value: Number(value) }))
  const total = pieData.reduce((sum, item) => sum + item.value, 0)
  const average = lineData.length ? lineData.reduce((sum, item) => sum + item.rating, 0) / lineData.length : 0

  return (
    <Card className="animate-slide-in-up p-6 shadow-lg transition-all duration-500 hover:shadow-xl">
      <PanelHeader title="满意度趋势" note="每日均分与评分构成" range="最近 7 天" />
      <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
        <div className="h-72 min-w-0">
          {lineData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lineData} margin={{ top: 8, right: 18, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="ratingFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#007a2f" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#007a2f" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e5ebe4" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "#6f766d", fontSize: 12 }} />
                <YAxis domain={[0, 5]} tickLine={false} axisLine={false} tick={{ fill: "#6f766d", fontSize: 12 }} />
                <Tooltip formatter={(value: any) => [`${Number(value).toFixed(1)} 分`, "满意度"]} />
                <Area type="monotone" dataKey="rating" stroke="#007a2f" strokeWidth={3} fill="url(#ratingFill)" activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </div>

        <div className="grid h-72 place-items-center">
          {pieData.length ? (
            <div className="relative h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius={68} outerRadius={92} paddingAngle={2} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${value} 次`, "评分"]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                <div>
                  <strong className="block text-3xl">{average ? average.toFixed(1) : "-"}</strong>
                  <span className="text-xs text-muted-foreground">平均评分</span>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {pieData.map((item, index) => (
                  <span key={item.name} className="inline-flex items-center gap-1">
                    <i className="h-2 w-2 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
                    {item.name} {total ? Math.round((item.value / total) * 100) : 0}%
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <EmptyChart />
          )}
        </div>
      </div>
    </Card>
  )
}

function EmotionPanel({ data }: { data: Record<string, number> }) {
  const rows = Object.entries(data || {}).map(([name, value]) => ({ name, value: Number(value) }))
  const max = Math.max(...rows.map((item) => item.value), 1)

  return (
    <Card className="animate-slide-in-up p-6 shadow-lg transition-all duration-500 hover:shadow-xl" style={{ animationDelay: "120ms" }}>
      <PanelHeader title="情绪趋势" note="AI 回复情绪标签分布" range="最近 7 天" />
      <div className="space-y-5">
        {rows.length ? rows.map((item, index) => (
          <div key={item.name} className="grid grid-cols-[52px_1fr_34px] items-center gap-3 text-sm">
            <span className="truncate">{item.name}</span>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.max(5, (item.value / max) * 100)}%`, backgroundColor: chartColors[index % chartColors.length] }}
              />
            </div>
            <strong className="text-right">{item.value}</strong>
          </div>
        )) : <EmptyChart />}
      </div>
    </Card>
  )
}

function InterestRadarPanel({ data }: { data: Record<string, number> }) {
  const radarData = Object.entries(data || {}).map(([name, value]) => ({ name, value: Number(value) }))

  return (
    <Card className="animate-slide-in-up p-6 shadow-lg transition-all duration-500 hover:shadow-xl">
      <PanelHeader title="兴趣分布" note="会话偏好标签统计" range="最近 30 天" />
      <div className="h-80">
        {radarData.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} outerRadius="72%">
              <PolarGrid stroke="#dde7dd" />
              <PolarAngleAxis dataKey="name" tick={{ fill: "#485148", fontSize: 12 }} />
              <Radar dataKey="value" stroke="#007a2f" fill="#007a2f" fillOpacity={0.18} strokeWidth={2} />
              <Tooltip formatter={(value: any) => [`${value}`, "兴趣次数"]} />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </div>
    </Card>
  )
}

function HotQuestionsPanel({ items }: { items: any[] }) {
  return (
    <Card className="animate-slide-in-up p-6 shadow-lg transition-all duration-500 hover:shadow-xl" style={{ animationDelay: "180ms" }}>
      <PanelHeader title="热门问题" note="高频咨询与关键词" range="最近 7 天" />
      <div className="space-y-3">
        {items.length ? items.slice(0, 6).map((item, index) => (
          <div key={`${item.question_pattern}-${index}`} className="rounded-lg border border-border p-3 transition-all duration-300 hover:scale-[1.02] hover:bg-secondary">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium leading-6">{item.question_pattern}</p>
              <strong className="text-sm text-primary">{item.count}</strong>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">咨询次数</p>
          </div>
        )) : <EmptyChart />}
      </div>
    </Card>
  )
}

function HotSpotsPanel({ items }: { items: any[] }) {
  const max = Math.max(...items.map((item) => Number(item.mention_count || 0)), 1)

  return (
    <Card className="animate-slide-in-up p-6 shadow-lg transition-all duration-500 hover:shadow-xl" style={{ animationDelay: "240ms" }}>
      <PanelHeader title="热门景点" note="游客消息中的景点提及" range="最近 7 天" />
      <div className="space-y-4">
        {items.length ? items.map((item, index) => (
          <div key={`${item.spot_name}-${index}`} className="grid grid-cols-[28px_1fr_48px] items-center gap-3 text-sm">
            <span className="font-bold text-primary">{index + 1}</span>
            <div>
              <div className="mb-1 flex items-center justify-between gap-2">
                <strong className="truncate">{item.spot_name}</strong>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${Math.max(5, (Number(item.mention_count || 0) / max) * 100)}%` }} />
              </div>
            </div>
            <span className="text-right text-muted-foreground">{item.mention_count}</span>
          </div>
        )) : <EmptyChart />}
      </div>
    </Card>
  )
}

function TestReportPanel() {
  const [report, setReport] = useState<any>(null)
  const [status, setStatus] = useState("尚未读取测试报告")
  const [loading, setLoading] = useState(false)

  async function loadReport() {
    setLoading(true)
    try {
      const data = await request("/api/admin/test-report", { headers: authHeaders() })
      setReport(data)
      setStatus("已读取后端测试报告")
    } catch (error: any) {
      setReport(null)
      setStatus(error?.message || "暂无测试报告")
    } finally {
      setLoading(false)
    }
  }

  async function runTests() {
    setLoading(true)
    setStatus("后端测试正在运行，请稍候...")
    try {
      const data = await request("/api/admin/test-report/run", { method: "POST", headers: authHeaders() })
      setReport(data)
      setStatus(Number((data as any).exit_code) === 0 ? "测试通过" : "测试完成，但存在失败项")
    } catch (error: any) {
      setStatus(error?.message || "测试运行失败")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReport()
  }, [])

  const unit = report?.unit_tests
  const coverage = report?.coverage
  const performance = report?.performance

  return (
    <Card className="animate-slide-in-up p-6 shadow-lg transition-all duration-500 hover:shadow-xl" style={{ animationDelay: "300ms" }}>
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-xl font-semibold text-foreground">测试报告</h2>
          <p className="mt-1 text-xs text-muted-foreground">{status}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadReport} disabled={loading} className="bg-transparent">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            读取
          </Button>
          <Button size="sm" onClick={runTests} disabled={loading}>
            <Play className="h-4 w-4" />
            运行测试
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-border p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium"><FlaskConical className="h-4 w-4 text-primary" />单元测试</div>
          <strong className="text-2xl">{unit ? `${unit.passed}/${unit.total}` : "-"}</strong>
          <p className="mt-1 text-xs text-muted-foreground">失败 {unit?.failed ?? "-"} · 跳过 {unit?.skipped ?? "-"}</p>
        </div>
        <div className="rounded-xl border border-border p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium"><Activity className="h-4 w-4 text-primary" />覆盖率</div>
          <strong className="text-2xl">{coverage?.total_pct == null ? "-" : `${coverage.total_pct}%`}</strong>
          <p className="mt-1 text-xs text-muted-foreground">按模块聚合覆盖率</p>
        </div>
        <div className="rounded-xl border border-border p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium"><Timer className="h-4 w-4 text-primary" />性能</div>
          <strong className="text-2xl">{performance?.avg_ms == null ? "-" : `${performance.avg_ms}ms`}</strong>
          <p className="mt-1 text-xs text-muted-foreground">RPS {performance?.rps ?? "-"} · P95 {performance?.p95_ms ?? "-"}</p>
        </div>
      </div>

      {report?.pytest_output && (
        <pre className="mt-4 max-h-40 overflow-auto rounded-xl bg-muted p-3 text-xs leading-6 text-muted-foreground">
          {report.pytest_output}
        </pre>
      )}
    </Card>
  )
}

export function DashboardContent() {
  const [state, setState] = useState<DashboardState>(initialState)
  const [loading, setLoading] = useState(false)
  const [range, setRange] = useState<"today" | "week" | "month">("today")

  async function load() {
    setLoading(true)
    const trendRange = range === "today" ? "week" : range
    const results = await Promise.all([
      requestAdminData(`/api/admin/stats/overview?range=${range}`, null),
      requestAdminData(`/api/admin/stats/satisfaction?range=${trendRange}`, null),
      requestAdminData(`/api/admin/stats/emotion-trend?range=${trendRange}`, { distribution: {} }),
      requestAdminData(`/api/admin/stats/hot-questions?range=${trendRange}&limit=8`, { items: [] }),
      requestAdminData(`/api/admin/stats/interest-distribution?range=${range === "today" ? "month" : range}`, {}),
      requestAdminData(`/api/admin/stats/hot-spots?range=${trendRange}&limit=7`, { items: [] }),
    ])
    setState({
      overview: results[0].data,
      satisfaction: results[1].data,
      emotions: (results[2].data as any).distribution || results[2].data || {},
      hotQuestions: (results[3].data as any).items || [],
      interests: results[4].data as any || {},
      hotSpots: (results[5].data as any).items || [],
      source: "backend",
    })
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [range])

  const stats = useMemo(() => {
    const rag = state.overview.rag_hit_rate == null ? "-" : `${Math.round(Number(state.overview.rag_hit_rate) * 100)}%`
    return [
      { title: "总会话", value: state.overview.total_conversations ?? 0, note: "今日创建的游客会话", icon: MessageSquare, active: true },
      { title: "总消息", value: state.overview.total_messages ?? 0, note: "游客与 AI 消息总量", icon: TrendingUp },
      { title: "平均响应", value: responseTime(state.overview.avg_response_ms), note: "后端平均响应耗时", icon: Timer },
      { title: "满意度", value: state.overview.avg_satisfaction == null ? "-" : Number(state.overview.avg_satisfaction).toFixed(1), note: `RAG 命中率 ${rag}`, icon: Star },
    ]
  }, [state.overview])

  return (
    <AdminFrame
      title="Dashboard"
      description="查看导览服务运行情况、游客偏好与知识命中表现。"
      actions={
        <>
          <div className="flex rounded-lg border border-border bg-card p-1">
            {[
              ["today", "今日"],
              ["week", "本周"],
              ["month", "本月"],
            ].map(([value, label]) => (
              <Button
                key={value}
                size="sm"
                variant={range === value ? "default" : "ghost"}
                onClick={() => setRange(value as "today" | "week" | "month")}
                className="h-7"
              >
                {label}
              </Button>
            ))}
          </div>
          <Button onClick={load} disabled={loading} className="h-9 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/30">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            刷新数据
          </Button>
          <Button asChild variant="outline" className="h-9 bg-transparent">
            <Link href="/settings">
              {state.source === "backend" ? "后端实时数据" : state.source === "mixed" ? "部分演示数据" : "正在读取数据"}
            </Link>
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item, index) => (
            <StatCard key={item.title} {...item} delay={`${index * 100}ms`} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_0.8fr]">
          <SatisfactionPanel trend={state.satisfaction.trend || []} distribution={state.satisfaction.distribution || {}} />
          <EmotionPanel data={state.emotions} />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <HotQuestionsPanel items={state.hotQuestions} />
          <InterestRadarPanel data={state.interests} />
          <HotSpotsPanel items={state.hotSpots} />
        </div>

        <TestReportPanel />
      </div>
    </AdminFrame>
  )
}
