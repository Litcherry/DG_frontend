"use client"

import { Edit, Eye, EyeOff, ImageIcon, Map, MapPin, Plus, RefreshCw, Save, Trash2, Upload, X } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { AdminFrame } from "@/components/dg/admin-frame"
import { authHeaders, request, resolveMediaURL, splitTags } from "@/components/dg/api"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

type Spot = {
  id?: number
  name: string
  name_en: string | null
  description: string | null
  description_en: string | null
  tags: string[]
  location: { lat?: number; lng?: number; latitude?: number; longitude?: number } | null
  visit_duration_min: number
  image_url: string | null
  sort_order: number
  is_active: boolean
}

type Route = {
  id?: number
  name: string
  name_en: string | null
  description: string | null
  description_en: string | null
  target_tags: string[]
  duration_hours: number | null
  spot_sequence: Array<{ spot_id: number; name?: string; name_en?: string | null; highlight?: string }>
  is_active: boolean
}

const emptySpot: Spot = {
  name: "",
  name_en: null,
  description: null,
  description_en: null,
  tags: [],
  location: null,
  visit_duration_min: 30,
  image_url: null,
  sort_order: 0,
  is_active: true,
}

const emptyRoute: Route = {
  name: "",
  name_en: null,
  description: null,
  description_en: null,
  target_tags: [],
  duration_hours: 2,
  spot_sequence: [],
  is_active: true,
}

function normalizeSpot(value: any): Spot {
  return { ...emptySpot, ...value, tags: Array.isArray(value?.tags) ? value.tags : [], location: value?.location || null }
}

function normalizeRoute(value: any): Route {
  return {
    ...emptyRoute,
    ...value,
    target_tags: Array.isArray(value?.target_tags) ? value.target_tags : Array.isArray(value?.tags) ? value.tags : [],
    spot_sequence: Array.isArray(value?.spot_sequence) ? value.spot_sequence : [],
  }
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-auto rounded-[8px] border bg-background shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 px-5 py-4 backdrop-blur">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button type="button" variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function locationText(spot: Spot) {
  const lat = spot.location?.lat ?? spot.location?.latitude
  const lng = spot.location?.lng ?? spot.location?.longitude
  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) return "暂无坐标"
  return `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`
}

function SpotImage({ spot }: { spot: Spot }) {
  const [failed, setFailed] = useState(false)
  const src = spot.image_url ? resolveMediaURL(spot.image_url) : ""
  useEffect(() => setFailed(false), [src])
  if (!src || failed) {
    return <div className="grid h-14 w-20 shrink-0 place-items-center rounded-[8px] bg-muted text-muted-foreground"><ImageIcon className="h-4 w-4" /></div>
  }
  return <img src={src} alt={spot.name} className="h-14 w-20 shrink-0 rounded-[8px] object-cover" loading="lazy" onError={() => setFailed(true)} />
}

function SpotEditor({ initial, onClose, onSaved }: { initial: Spot | null; onClose: () => void; onSaved: (spot: Spot) => void }) {
  const [spot, setSpot] = useState<Spot>(normalizeSpot(initial || emptySpot))
  const [tagInput, setTagInput] = useState("")
  const [imagePreview, setImagePreview] = useState(spot.image_url ? resolveMediaURL(spot.image_url) : "")
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function update<K extends keyof Spot>(key: K, value: Spot[K]) {
    setSpot((current) => ({ ...current, [key]: value }))
  }

  function updateLocation(key: "lat" | "lng", value: string) {
    const numeric = value === "" ? undefined : Number(value)
    setSpot((current) => ({ ...current, location: { ...(current.location || {}), [key]: Number.isFinite(numeric) ? numeric : undefined } }))
  }

  async function saveSpot() {
    if (!spot.name.trim()) return toast.error("请填写景点名称")
    setSaving(true)
    try {
      const payload = {
        name: spot.name.trim(),
        name_en: spot.name_en || null,
        description: spot.description || null,
        description_en: spot.description_en || null,
        tags: spot.tags,
        location: spot.location,
        visit_duration_min: Number(spot.visit_duration_min || 0),
        sort_order: Number(spot.sort_order || 0),
        is_active: Boolean(spot.is_active),
      }
      let saved = initial?.id
        ? await request<Spot>(`/api/admin/spots/${initial.id}`, { method: "PUT", headers: authHeaders({ "Content-Type": "application/json" }), body: JSON.stringify(payload) })
        : await request<Spot>("/api/admin/spots", { method: "POST", headers: authHeaders({ "Content-Type": "application/json" }), body: JSON.stringify(payload) })
      const file = fileInputRef.current?.files?.[0]
      if (file && saved.id) {
        const form = new FormData()
        form.append("file", file)
        const image = await request<{ image_url: string }>(`/api/admin/spots/${saved.id}/image`, { method: "POST", headers: authHeaders(), body: form })
        saved = { ...saved, image_url: image.image_url }
      }
      toast.success(initial?.id ? "景点已更新" : "景点已新增")
      onSaved(normalizeSpot(saved))
      onClose()
    } catch (error: any) {
      toast.error(error?.message || "保存失败")
    } finally {
      setSaving(false)
    }
  }

  const lat = spot.location?.lat ?? spot.location?.latitude ?? ""
  const lng = spot.location?.lng ?? spot.location?.longitude ?? ""

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2"><Label>景点名称</Label><Input value={spot.name} onChange={(e) => update("name", e.target.value)} placeholder="例如：灵山大佛" /></label>
        <label className="space-y-2"><Label>英文名称</Label><Input value={spot.name_en || ""} onChange={(e) => update("name_en", e.target.value || null)} placeholder="Lingshan Grand Buddha" /></label>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <label className="space-y-2"><Label>游览时长</Label><Input type="number" value={spot.visit_duration_min} onChange={(e) => update("visit_duration_min", Number(e.target.value))} /></label>
        <label className="space-y-2"><Label>排序</Label><Input type="number" value={spot.sort_order} onChange={(e) => update("sort_order", Number(e.target.value))} /></label>
        <label className="space-y-2"><Label>纬度</Label><Input type="number" value={lat} onChange={(e) => updateLocation("lat", e.target.value)} /></label>
        <label className="space-y-2"><Label>经度</Label><Input type="number" value={lng} onChange={(e) => updateLocation("lng", e.target.value)} /></label>
      </div>
      <div className="space-y-2">
        <Label>标签</Label>
        <div className="flex gap-2">
          <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="历史文化, 摄影打卡" />
          <Button type="button" variant="outline" onClick={() => { update("tags", Array.from(new Set([...spot.tags, ...splitTags(tagInput)]))); setTagInput("") }}>添加</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {spot.tags.map((tag) => <button key={tag} type="button" onClick={() => update("tags", spot.tags.filter((item) => item !== tag))} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">{tag} ×</button>)}
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        <div>
          <Label>景点图片</Label>
          <div className="mt-2 rounded-[8px] border p-3">
            {imagePreview ? <img src={imagePreview} alt="景点图片预览" className="h-44 w-full rounded-[8px] object-cover" /> : <div className="grid h-44 place-items-center rounded-[8px] bg-muted text-sm text-muted-foreground">暂无图片</div>}
            <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.gif,.webp,image/*" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) setImagePreview(URL.createObjectURL(file))
            }} />
            <Button type="button" variant="outline" className="mt-3 w-full" onClick={() => fileInputRef.current?.click()}><Upload className="h-4 w-4" />选择图片</Button>
          </div>
        </div>
        <div className="space-y-4">
          <label className="space-y-2"><Label>景点简介</Label><Textarea rows={6} value={spot.description || ""} onChange={(e) => update("description", e.target.value || null)} /></label>
          <label className="space-y-2"><Label>英文简介</Label><Textarea rows={3} value={spot.description_en || ""} onChange={(e) => update("description_en", e.target.value || null)} /></label>
          <div className="flex items-center justify-between rounded-[8px] border px-4 py-3"><Label>上线状态</Label><Switch checked={spot.is_active} onCheckedChange={(value) => update("is_active", value)} /></div>
        </div>
      </div>
      <div className="flex justify-end gap-3 border-t pt-4">
        <Button type="button" variant="outline" onClick={onClose}>取消</Button>
        <Button type="button" onClick={saveSpot} disabled={saving}><Save className="h-4 w-4" />{saving ? "保存中" : "保存"}</Button>
      </div>
    </div>
  )
}

function RouteEditor({ initial, spots, onClose, onSaved }: { initial: Route | null; spots: Spot[]; onClose: () => void; onSaved: (route: Route) => void }) {
  const [route, setRoute] = useState<Route>(normalizeRoute(initial || emptyRoute))
  const [tagInput, setTagInput] = useState("")
  const [saving, setSaving] = useState(false)

  function update<K extends keyof Route>(key: K, value: Route[K]) {
    setRoute((current) => ({ ...current, [key]: value }))
  }

  function toggleSpot(spot: Spot) {
    if (!spot.id) return
    const exists = route.spot_sequence.some((item) => item.spot_id === spot.id)
    update("spot_sequence", exists ? route.spot_sequence.filter((item) => item.spot_id !== spot.id) : [...route.spot_sequence, { spot_id: spot.id, name: spot.name, name_en: spot.name_en }])
  }

  async function saveRoute() {
    if (!route.name.trim()) return toast.error("请填写路线名称")
    if (!route.spot_sequence.length) return toast.error("请至少选择一个景点")
    setSaving(true)
    try {
      const payload = {
        name: route.name.trim(),
        name_en: route.name_en || null,
        description: route.description || null,
        description_en: route.description_en || null,
        target_tags: route.target_tags,
        duration_hours: route.duration_hours ? Number(route.duration_hours) : null,
        spot_sequence: route.spot_sequence,
        is_active: route.is_active,
      }
      const saved = initial?.id
        ? await request<Route>(`/api/admin/routes/${initial.id}`, { method: "PUT", headers: authHeaders({ "Content-Type": "application/json" }), body: JSON.stringify(payload) })
        : await request<Route>("/api/admin/routes", { method: "POST", headers: authHeaders({ "Content-Type": "application/json" }), body: JSON.stringify(payload) })
      toast.success(initial?.id ? "路线已更新" : "路线已新增")
      onSaved(normalizeRoute(saved))
      onClose()
    } catch (error: any) {
      toast.error(error?.message || "保存失败")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2"><Label>路线名称</Label><Input value={route.name} onChange={(e) => update("name", e.target.value)} placeholder="例如：经典精华路线" /></label>
        <label className="space-y-2"><Label>英文名称</Label><Input value={route.name_en || ""} onChange={(e) => update("name_en", e.target.value || null)} /></label>
      </div>
      <div className="grid gap-4 md:grid-cols-[1fr_180px]">
        <label className="space-y-2"><Label>适用标签</Label><div className="flex gap-2"><Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="亲子游, 摄影" /><Button type="button" variant="outline" onClick={() => { update("target_tags", Array.from(new Set([...route.target_tags, ...splitTags(tagInput)]))); setTagInput("") }}>添加</Button></div></label>
        <label className="space-y-2"><Label>时长（小时）</Label><Input type="number" step="0.5" value={route.duration_hours || ""} onChange={(e) => update("duration_hours", e.target.value ? Number(e.target.value) : null)} /></label>
      </div>
      <div className="flex flex-wrap gap-2">{route.target_tags.map((tag) => <button key={tag} type="button" onClick={() => update("target_tags", route.target_tags.filter((item) => item !== tag))} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">{tag} ×</button>)}</div>
      <label className="space-y-2"><Label>路线简介</Label><Textarea rows={4} value={route.description || ""} onChange={(e) => update("description", e.target.value || null)} /></label>
      <div className="space-y-2">
        <Label>选择景点顺序</Label>
        <div className="grid max-h-64 gap-2 overflow-auto rounded-[8px] border p-3 md:grid-cols-2">
          {spots.map((spot) => {
            const checked = Boolean(spot.id && route.spot_sequence.some((item) => item.spot_id === spot.id))
            return <button key={spot.id} type="button" onClick={() => toggleSpot(spot)} className={`rounded-[8px] border px-3 py-2 text-left text-sm ${checked ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"}`}>{spot.name}</button>
          })}
        </div>
        <p className="text-xs text-muted-foreground">当前顺序：{route.spot_sequence.map((item) => item.name || item.spot_id).join(" → ") || "未选择"}</p>
      </div>
      <div className="flex items-center justify-between rounded-[8px] border px-4 py-3"><Label>上线状态</Label><Switch checked={route.is_active} onCheckedChange={(value) => update("is_active", value)} /></div>
      <div className="flex justify-end gap-3 border-t pt-4">
        <Button type="button" variant="outline" onClick={onClose}>取消</Button>
        <Button type="button" onClick={saveRoute} disabled={saving}><Save className="h-4 w-4" />{saving ? "保存中" : "保存路线"}</Button>
      </div>
    </div>
  )
}

export function ScenicContent() {
  const [spots, setSpots] = useState<Spot[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [spotModal, setSpotModal] = useState<Spot | null | "new">(null)
  const [routeModal, setRouteModal] = useState<Route | null | "new">(null)

  async function loadData() {
    setLoading(true)
    try {
      const [spotData, routeData] = await Promise.all([
        request<Spot[]>("/api/admin/spots", { headers: authHeaders() }),
        request<Route[]>("/api/admin/routes", { headers: authHeaders() }),
      ])
      setSpots((Array.isArray(spotData) ? spotData : []).map(normalizeSpot))
      setRoutes((Array.isArray(routeData) ? routeData : []).map(normalizeRoute))
    } catch (error: any) {
      toast.error(error?.message || "加载失败")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  async function deleteRoute(id?: number) {
    if (!id || !window.confirm("确认删除这条路线？")) return
    await request(`/api/admin/routes/${id}`, { method: "DELETE", headers: authHeaders() })
    toast.success("路线已删除")
    loadData()
  }

  const sortedSpots = useMemo(() => [...spots].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0)), [spots])

  return (
    <AdminFrame
      title="景区管理"
      description="管理景点图片、基础信息、坐标和预设游览路线。"
      actions={<Button type="button" variant="outline" onClick={loadData} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />刷新</Button>}
    >
      <Tabs defaultValue="spots">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="spots"><MapPin className="mr-2 h-4 w-4" />景点列表</TabsTrigger>
            <TabsTrigger value="routes"><Map className="mr-2 h-4 w-4" />路线列表</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button type="button" onClick={() => setSpotModal("new")}><Plus className="h-4 w-4" />新增景点</Button>
            <Button type="button" variant="outline" onClick={() => setRouteModal("new")}><Plus className="h-4 w-4" />新建路线</Button>
          </div>
        </div>

        <TabsContent value="spots">
          <Card className="overflow-hidden shadow-sm">
            <div className="divide-y">
              {sortedSpots.length ? sortedSpots.map((spot) => (
                <div key={spot.id} className="flex items-center gap-4 p-4">
                  <SpotImage spot={spot} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <strong className="truncate">{spot.name || "未命名景点"}</strong>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${spot.is_active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>{spot.is_active ? "上线" : "下线"}</span>
                    </div>
                    <p className="mt-1 overflow-hidden text-sm leading-5 text-muted-foreground [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                      {spot.description || locationText(spot)}
                    </p>
                  </div>
                  <div className="hidden min-w-32 text-sm text-muted-foreground md:block">{spot.visit_duration_min || 0} 分钟</div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setSpotModal(spot)}><Edit className="h-4 w-4" />编辑</Button>
                </div>
              )) : <div className="grid min-h-48 place-items-center text-sm text-muted-foreground">暂无景点数据</div>}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="routes">
          <Card className="overflow-hidden shadow-sm">
            <div className="divide-y">
              {routes.length ? routes.map((route) => (
                <div key={route.id} className="flex items-center gap-4 p-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[8px] bg-primary/10 text-primary"><Map className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <strong className="truncate">{route.name}</strong>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${route.is_active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>{route.is_active ? "上线" : "下线"}</span>
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">{route.spot_sequence.map((item) => item.name || item.spot_id).join(" → ") || route.description || "暂无景点序列"}</p>
                  </div>
                  <div className="hidden min-w-24 text-sm text-muted-foreground md:block">{route.duration_hours || "-"} 小时</div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setRouteModal(route)}><Edit className="h-4 w-4" />编辑</Button>
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => deleteRoute(route.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              )) : <div className="grid min-h-48 place-items-center text-sm text-muted-foreground">暂无路线数据，点击右上角“新建路线”创建。</div>}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {spotModal !== null && (
        <Modal title={spotModal === "new" ? "新增景点" : "编辑景点"} onClose={() => setSpotModal(null)}>
          <SpotEditor initial={spotModal === "new" ? null : spotModal} onClose={() => setSpotModal(null)} onSaved={(saved) => { setSpots((current) => [saved, ...current.filter((item) => item.id !== saved.id)]); loadData() }} />
        </Modal>
      )}
      {routeModal !== null && (
        <Modal title={routeModal === "new" ? "新建路线" : "编辑路线"} onClose={() => setRouteModal(null)}>
          <RouteEditor initial={routeModal === "new" ? null : routeModal} spots={spots} onClose={() => setRouteModal(null)} onSaved={(saved) => { setRoutes((current) => [saved, ...current.filter((item) => item.id !== saved.id)]); loadData() }} />
        </Modal>
      )}
    </AdminFrame>
  )
}
