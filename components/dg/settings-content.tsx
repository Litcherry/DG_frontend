"use client"

import { useEffect, useState } from "react"
import { RefreshCw, Save } from "lucide-react"
import { AdminFrame } from "@/components/dg/admin-frame"
import { apiBase, setApiBase } from "@/components/dg/api"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export function SettingsContent() {
  const [base, setBase] = useState("http://localhost:8000")
  const [saved, setSaved] = useState(false)
  const [health, setHealth] = useState<any>(null)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    setBase(apiBase())
  }, [])

  function save(event: React.FormEvent) {
    event.preventDefault()
    setApiBase(base)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1800)
  }

  async function checkHealth() {
    setChecking(true)
    setHealth(null)
    try {
      const res = await fetch(`${base.replace(/\/$/, "")}/health`)
      const data = await res.json()
      setHealth({ ok: res.ok, ...data })
    } catch (error: any) {
      setHealth({ ok: false, status: "unreachable", message: error?.message || "无法连接后端" })
    } finally {
      setChecking(false)
    }
  }

  return (
    <AdminFrame title="接口设置" description="配置 DG 后端服务地址，所有后台接口调用沿用该地址。">
      <div className="grid gap-4 lg:grid-cols-[520px_1fr]">
        <Card className="animate-slide-in-up p-6 shadow-lg">
          <form className="space-y-4" onSubmit={save}>
            <h2 className="text-xl font-semibold">后端服务</h2>
            <Input value={base} onChange={(event) => setBase(event.target.value)} placeholder="http://localhost:8000" />
            <div className="flex gap-2">
              <Button><Save className="h-4 w-4" />保存设置</Button>
              <Button type="button" variant="outline" onClick={checkHealth} disabled={checking} className="bg-transparent">
                <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
                健康检查
              </Button>
            </div>
            {saved && <p className="text-sm text-primary">已保存</p>}
          </form>
        </Card>
        <Card className="animate-slide-in-up p-6 shadow-lg" style={{ animationDelay: "100ms" }}>
          <h2 className="text-xl font-semibold">接口状态</h2>
          {health ? (
            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">服务</span><strong>{health.status || "-"}</strong></div>
              <div className="flex justify-between"><span className="text-muted-foreground">数据库</span><strong>{health.database || "-"}</strong></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Redis</span><strong>{health.redis || "-"}</strong></div>
              {health.message && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-destructive">{health.message}</p>}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-7 text-muted-foreground">点击健康检查可验证当前后端地址、数据库与缓存状态。</p>
          )}
        </Card>
      </div>
    </AdminFrame>
  )
}
