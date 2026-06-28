"use client"

import { useEffect, useState } from "react"
import { Globe2, ImagePlus, RefreshCw, Save, Trash2 } from "lucide-react"
import { AdminFrame } from "@/components/dg/admin-frame"
import { authHeaders, request, resolveMediaURL, splitTags } from "@/components/dg/api"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const emptySpot = {
  id: "",
  name: "",
  name_en: "",
  description: "",
  description_en: "",
  tags: "",
  duration: 30,
  lat: "",
  lng: "",
  sort_order: 0,
  is_active: true,
}

const emptyRoute = {
  id: "",
  name: "",
  name_en: "",
  description: "",
  description_en: "",
  target_tags: "",
  duration_hours: "2",
  spot_sequence: "[]",
  is_active: true,
}

export function ScenicContent() {
  const [tab, setTab] = useState("spots")
  const [spots, setSpots] = useState<any[]>([])
  const [routes, setRoutes] = useState<any[]>([])
  const [spot, setSpot] = useState(emptySpot)
  const [route, setRoute] = useState(emptyRoute)
  const [image, setImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  async function load() {
    setLoading(true)
    setMessage("")
    const [spotData, routeData] = await Promise.all([
      request<any[]>("/api/admin/spots", { headers: authHeaders() }).catch(() => []),
      request<any[]>("/api/admin/routes", { headers: authHeaders() }).catch(() => []),
    ])
    setSpots(Array.isArray(spotData) ? spotData : [])
    setRoutes(Array.isArray(routeData) ? routeData : [])
    setLoading(false)
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("tab") === "routes") setTab("routes")
    load()
  }, [])

  function fillSpot(item: any) {
    const loc = item.location || {}
    setSpot({
      id: String(item.id || ""),
      name: item.name || "",
      name_en: item.name_en || "",
      description: item.description || "",
      description_en: item.description_en || "",
      tags: (item.tags || []).join("，"),
      duration: item.visit_duration_min || 30,
      lat: loc.lat ?? "",
      lng: loc.lng ?? "",
      sort_order: item.sort_order || 0,
      is_active: item.is_active !== false,
    })
    setTab("editor")
  }

  function fillRoute(item: any) {
    setRoute({
      id: String(item.id || ""),
      name: item.name || "",
      name_en: item.name_en || "",
      description: item.description || "",
      description_en: item.description_en || "",
      target_tags: (item.target_tags || []).join("，"),
      duration_hours: item.duration_hours == null ? "" : String(item.duration_hours),
      spot_sequence: JSON.stringify(item.spot_sequence || [], null, 2),
      is_active: item.is_active !== false,
    })
    setTab("routes")
  }

  async function saveSpot(event: React.FormEvent) {
    event.preventDefault()
    setMessage("")
    const lat = spot.lat === "" ? NaN : Number(spot.lat)
    const lng = spot.lng === "" ? NaN : Number(spot.lng)
    const hasLocation = Number.isFinite(lat) && Number.isFinite(lng)
    const saved = await request<any>(spot.id ? `/api/admin/spots/${spot.id}` : "/api/admin/spots", {
      method: spot.id ? "PUT" : "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        name: spot.name,
        name_en: spot.name_en || null,
        description: spot.description || null,
        description_en: spot.description_en || null,
        tags: splitTags(spot.tags),
        visit_duration_min: Number(spot.duration || 30),
        sort_order: Number(spot.sort_order || 0),
        is_active: spot.is_active,
        location: hasLocation ? { lat, lng } : null,
      }),
    })
    if (image && saved?.id) {
      const form = new FormData()
      form.append("file", image)
      await request(`/api/admin/spots/${saved.id}/image`, { method: "POST", headers: authHeaders(), body: form })
    }
    setSpot(emptySpot)
    setImage(null)
    setMessage("景点已保存")
    await load()
  }

  async function deleteSpot(id: string) {
    if (!window.confirm("确认删除这个景点？相关路线会同步清理。")) return
    await request(`/api/admin/spots/${id}`, { method: "DELETE", headers: authHeaders() })
    setMessage("景点已删除")
    await load()
  }

  async function toggleSpot(item: any) {
    await request(`/api/admin/spots/${item.id}`, {
      method: "PUT",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ is_active: !item.is_active }),
    })
    await load()
  }

  async function backfillEnglish() {
    const data = await request<any>("/api/admin/spots/backfill-name-en", { method: "POST", headers: authHeaders() })
    setMessage(`英文名回填完成：更新 ${data.updated || 0} 个景点`)
    await load()
  }

  async function saveRoute(event: React.FormEvent) {
    event.preventDefault()
    setMessage("")
    let sequence: any[] = []
    try {
      sequence = route.spot_sequence.trim() ? JSON.parse(route.spot_sequence) : []
      if (!Array.isArray(sequence)) throw new Error("spot_sequence must be array")
    } catch {
      setMessage("景点序列 JSON 必须是数组，例如 [{\"spot_id\":1,\"name\":\"灵山大佛\"}]")
      return
    }
    await request(route.id ? `/api/admin/routes/${route.id}` : "/api/admin/routes", {
      method: route.id ? "PUT" : "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        name: route.name,
        name_en: route.name_en || null,
        description: route.description || null,
        description_en: route.description_en || null,
        target_tags: splitTags(route.target_tags),
        duration_hours: Number(route.duration_hours || 0) || null,
        spot_sequence: sequence,
        is_active: route.is_active,
      }),
    })
    setRoute(emptyRoute)
    setMessage("路线已保存")
    await load()
  }

  async function deleteRoute(id: string) {
    if (!window.confirm("确认删除这条路线？")) return
    await request(`/api/admin/routes/${id}`, { method: "DELETE", headers: authHeaders() })
    setMessage("路线已删除")
    await load()
  }

  return (
    <AdminFrame
      title="景区管理"
      description="维护景点资料、地图位置、展示图片和路线数据。"
      actions={
        <>
          <Button onClick={backfillEnglish} variant="outline" className="bg-transparent">
            <Globe2 className="h-4 w-4" />
            回填英文名
          </Button>
          <Button onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
        </>
      }
    >
      {message && <p className="rounded-lg border border-border bg-card px-4 py-2 text-sm text-primary">{message}</p>}
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="spots">景点列表</TabsTrigger>
          <TabsTrigger value="editor">新增 / 编辑景点</TabsTrigger>
          <TabsTrigger value="routes">路线管理</TabsTrigger>
        </TabsList>

        <TabsContent value="spots">
          <Card className="animate-slide-in-up p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold">景点列表</h2>
            <Table>
              <TableHeader>
                <TableRow><TableHead>图片</TableHead><TableHead>景点</TableHead><TableHead>标签</TableHead><TableHead>时长</TableHead><TableHead>状态</TableHead><TableHead className="text-right">操作</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {spots.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.image_url ? <img className="h-12 w-16 rounded-lg object-cover" src={resolveMediaURL(item.image_url)} alt={item.name} /> : <div className="grid h-12 w-16 place-items-center rounded-lg bg-muted text-xs">暂无</div>}</TableCell>
                    <TableCell><strong>{item.name}</strong><p className="mt-1 max-w-md truncate text-xs text-muted-foreground">{item.description}</p></TableCell>
                    <TableCell>{(item.tags || []).join("，")}</TableCell>
                    <TableCell>{item.visit_duration_min || 30} 分钟</TableCell>
                    <TableCell>{item.is_active ? "展示中" : "停用"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="outline" size="sm" onClick={() => fillSpot(item)}>编辑</Button>
                        <Button variant="outline" size="sm" onClick={() => toggleSpot(item)}>{item.is_active ? "停用" : "启用"}</Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => deleteSpot(String(item.id))}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="editor">
          <Card className="animate-slide-in-up p-6 shadow-lg">
            <form className="grid gap-4 md:grid-cols-2" onSubmit={saveSpot}>
              <h2 className="md:col-span-2 text-xl font-semibold">{spot.id ? "编辑景点" : "新增景点"}</h2>
              <Input value={spot.name} onChange={(e) => setSpot({ ...spot, name: e.target.value })} placeholder="景点名称" required />
              <Input value={spot.name_en} onChange={(e) => setSpot({ ...spot, name_en: e.target.value })} placeholder="英文名称" />
              <Input value={spot.tags} onChange={(e) => setSpot({ ...spot, tags: e.target.value })} placeholder="标签：佛教文化，拍照打卡" />
              <Input type="number" value={spot.duration} onChange={(e) => setSpot({ ...spot, duration: Number(e.target.value) })} placeholder="推荐时长" />
              <Input value={spot.lat} onChange={(e) => setSpot({ ...spot, lat: e.target.value })} placeholder="纬度" />
              <Input value={spot.lng} onChange={(e) => setSpot({ ...spot, lng: e.target.value })} placeholder="经度" />
              <Input type="number" value={spot.sort_order} onChange={(e) => setSpot({ ...spot, sort_order: Number(e.target.value) })} placeholder="排序" />
              <select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={String(spot.is_active)} onChange={(e) => setSpot({ ...spot, is_active: e.target.value === "true" })}>
                <option value="true">展示中</option>
                <option value="false">停用</option>
              </select>
              <label className="md:col-span-2 flex h-9 items-center gap-2 rounded-md border border-input px-3 text-sm text-muted-foreground">
                <ImagePlus className="h-4 w-4" />
                <span className="truncate">{image?.name || "选择景点图片"}</span>
                <input className="hidden" type="file" accept=".jpg,.jpeg,.png,.gif,.webp" onChange={(e) => setImage(e.target.files?.[0] || null)} />
              </label>
              <Textarea className="md:col-span-2 min-h-28" value={spot.description} onChange={(e) => setSpot({ ...spot, description: e.target.value })} placeholder="景点简介" />
              <Textarea className="md:col-span-2 min-h-24" value={spot.description_en} onChange={(e) => setSpot({ ...spot, description_en: e.target.value })} placeholder="英文简介" />
              <div className="md:col-span-2 flex gap-2">
                <Button><Save className="h-4 w-4" />保存景点</Button>
                <Button type="button" variant="outline" onClick={() => { setSpot(emptySpot); setImage(null) }}>清空</Button>
              </div>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="routes" className="grid gap-4 lg:grid-cols-[420px_1fr]">
          <Card className="animate-slide-in-up p-6 shadow-lg">
            <form className="space-y-4" onSubmit={saveRoute}>
              <h2 className="text-xl font-semibold">{route.id ? "编辑路线" : "新增路线"}</h2>
              <Input value={route.name} onChange={(e) => setRoute({ ...route, name: e.target.value })} placeholder="路线名称" required />
              <Input value={route.name_en} onChange={(e) => setRoute({ ...route, name_en: e.target.value })} placeholder="英文名称" />
              <Input value={route.target_tags} onChange={(e) => setRoute({ ...route, target_tags: e.target.value })} placeholder="目标标签" />
              <Input type="number" step="0.5" value={route.duration_hours} onChange={(e) => setRoute({ ...route, duration_hours: e.target.value })} placeholder="预计时长" />
              <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={String(route.is_active)} onChange={(e) => setRoute({ ...route, is_active: e.target.value === "true" })}>
                <option value="true">展示中</option>
                <option value="false">停用</option>
              </select>
              <Textarea value={route.description} onChange={(e) => setRoute({ ...route, description: e.target.value })} placeholder="路线简介" />
              <Textarea value={route.description_en} onChange={(e) => setRoute({ ...route, description_en: e.target.value })} placeholder="英文简介" />
              <Textarea className="min-h-32 font-mono text-xs" value={route.spot_sequence} onChange={(e) => setRoute({ ...route, spot_sequence: e.target.value })} placeholder='景点序列 JSON：[{ "spot_id": 1, "name": "灵山大佛" }]' />
              <div className="flex gap-2">
                <Button className="flex-1"><Save className="h-4 w-4" />保存路线</Button>
                <Button type="button" variant="outline" onClick={() => setRoute(emptyRoute)}>清空</Button>
              </div>
            </form>
          </Card>
          <Card className="animate-slide-in-up p-6 shadow-lg" style={{ animationDelay: "100ms" }}>
            <h2 className="mb-4 text-xl font-semibold">路线数据</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {routes.map((item) => (
                <div key={item.id || item.name} className="rounded-xl border border-border p-4 transition-all duration-300 hover:scale-[1.01] hover:shadow-md">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <strong>{item.name}</strong>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{item.is_active ? "展示" : "停用"}</span>
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{item.description || "暂无简介"}</p>
                  <p className="mt-2 text-xs text-muted-foreground">时长 {item.duration_hours ?? "-"}h · 景点 {(item.spot_sequence || []).length}</p>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => fillRoute(item)}>编辑</Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => deleteRoute(String(item.id))}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminFrame>
  )
}
