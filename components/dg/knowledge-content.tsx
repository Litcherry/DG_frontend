"use client"

import { useEffect, useMemo, useState } from "react"
import { FileUp, RefreshCw, Save, Trash2 } from "lucide-react"
import { AdminFrame } from "@/components/dg/admin-frame"
import { authHeaders, request, requestAdminData } from "@/components/dg/api"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

function itemsOf(data: any) {
  return Array.isArray(data) ? data : data?.items || []
}

export function KnowledgeContent() {
  const [tab, setTab] = useState("documents")
  const [documents, setDocuments] = useState<any[]>([])
  const [faqs, setFaqs] = useState<any[]>([])
  const [blindSpots, setBlindSpots] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>(["general"])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [search, setSearch] = useState("")
  const [docFile, setDocFile] = useState<File | null>(null)
  const [docCategory, setDocCategory] = useState("general")
  const [faqId, setFaqId] = useState("")
  const [faqQuestion, setFaqQuestion] = useState("")
  const [faqAnswer, setFaqAnswer] = useState("")
  const [faqCategory, setFaqCategory] = useState("general")
  const [faqActive, setFaqActive] = useState(true)

  const conversations = useMemo(() => {
    if (typeof window === "undefined") return []
    try {
      return JSON.parse(localStorage.getItem("dg_conversation_history") || "[]")
    } catch {
      return []
    }
  }, [])

  const filteredDocs = documents.filter((item) => {
    const text = `${item.original_name || item.filename || item.name || ""} ${item.category || ""} ${item.status || ""}`.toLowerCase()
    return text.includes(search.toLowerCase())
  })

  const filteredFaqs = faqs.filter((item) => {
    const text = `${item.question || ""} ${item.answer || ""} ${item.category || ""}`.toLowerCase()
    return text.includes(search.toLowerCase())
  })

  async function load() {
    setLoading(true)
    setMessage("")
    const [docs, faqData, cats, blind] = await Promise.all([
      request("/api/admin/knowledge/documents?page=1&page_size=100", { headers: authHeaders() }).catch(() => ({ items: [] })),
      request("/api/admin/knowledge/faq?page=1&page_size=100", { headers: authHeaders() }).catch(() => ({ items: [] })),
      request<string[]>("/api/admin/knowledge/categories", { headers: authHeaders() }).catch(() => ["general"]),
      requestAdminData("/api/admin/knowledge/blind-spots?range=week", { items: [] }),
    ])
    setDocuments(itemsOf(docs))
    setFaqs(itemsOf(faqData))
    setCategories(cats.length ? cats : ["general"])
    setBlindSpots(itemsOf(blind.data))
    setLoading(false)
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("tab")) setTab(params.get("tab") || "documents")
    if (params.get("search")) setSearch(params.get("search") || "")
    load()
  }, [])

  async function uploadDocument(event: React.FormEvent) {
    event.preventDefault()
    if (!docFile) {
      setMessage("请选择要上传的文件")
      return
    }
    const form = new FormData()
    form.append("file", docFile)
    form.append("category", docCategory)
    await request("/api/admin/knowledge/documents", { method: "POST", headers: authHeaders(), body: form })
    setDocFile(null)
    setMessage("文档已上传并开始入库")
    await load()
  }

  function fillFAQ(item: any) {
    setFaqId(String(item.id))
    setFaqQuestion(item.question || "")
    setFaqAnswer(item.answer || "")
    setFaqCategory(item.category || "general")
    setFaqActive(item.is_active !== false)
    setTab("faq")
  }

  async function saveFAQ(event: React.FormEvent) {
    event.preventDefault()
    await request(faqId ? `/api/admin/knowledge/faq/${faqId}` : "/api/admin/knowledge/faq", {
      method: faqId ? "PUT" : "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ question: faqQuestion, answer: faqAnswer, category: faqCategory, is_active: faqActive }),
    })
    clearFAQ()
    setMessage("FAQ 已保存")
    await load()
  }

  function clearFAQ() {
    setFaqId("")
    setFaqQuestion("")
    setFaqAnswer("")
    setFaqCategory("general")
    setFaqActive(true)
  }

  async function remove(path: string) {
    if (!window.confirm("确认删除？")) return
    await request(path, { method: "DELETE", headers: authHeaders() })
    setMessage("已删除")
    await load()
  }

  async function toggleFAQ(item: any) {
    await request(`/api/admin/knowledge/faq/${item.id}`, {
      method: "PUT",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ is_active: item.is_active === false }),
    })
    await load()
  }

  return (
    <AdminFrame
      title="知识库管理"
      description="维护知识文档、FAQ、游客对话与知识盲点。"
      actions={<Button onClick={load} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />刷新</Button>}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input className="max-w-md" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索文档、FAQ、分类" />
        {message && <p className="text-sm text-primary">{message}</p>}
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="documents">文档上传</TabsTrigger>
          <TabsTrigger value="faq">FAQ 管理</TabsTrigger>
          <TabsTrigger value="conversations">对话记录</TabsTrigger>
          <TabsTrigger value="blind">知识盲点</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="grid gap-4 lg:grid-cols-[380px_1fr]">
          <Card className="animate-slide-in-up p-6 shadow-lg">
            <form className="space-y-4" onSubmit={uploadDocument}>
              <h2 className="text-xl font-semibold">上传知识文档</h2>
              <Input type="file" accept=".pdf,.txt,.docx" onChange={(event) => setDocFile(event.target.files?.[0] || null)} />
              <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={docCategory} onChange={(event) => setDocCategory(event.target.value)}>
                {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <Button className="w-full"><FileUp className="h-4 w-4" />上传并入库</Button>
              <p className="text-xs text-muted-foreground">支持 pdf / txt / docx，沿用原后端文档入库接口。</p>
            </form>
          </Card>
          <Card className="animate-slide-in-up p-6 shadow-lg" style={{ animationDelay: "100ms" }}>
            <h2 className="mb-4 text-xl font-semibold">文档列表</h2>
            <Table>
              <TableHeader><TableRow><TableHead>文件</TableHead><TableHead>分类</TableHead><TableHead>状态</TableHead><TableHead>分块</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader>
              <TableBody>
                {filteredDocs.map((item) => (
                  <TableRow key={item.id || item.original_name}>
                    <TableCell className="font-medium">{item.original_name || item.filename || item.name}</TableCell>
                    <TableCell>{item.category || "-"}</TableCell>
                    <TableCell>{item.status || "active"}</TableCell>
                    <TableCell>{item.chunk_count ?? "-"}</TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon-sm" onClick={() => remove(`/api/admin/knowledge/documents/${item.id}`)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="faq" className="grid gap-4 lg:grid-cols-[420px_1fr]">
          <Card className="animate-slide-in-up p-6 shadow-lg">
            <form className="space-y-4" onSubmit={saveFAQ}>
              <h2 className="text-xl font-semibold">{faqId ? "编辑 FAQ" : "新增 FAQ"}</h2>
              <Input value={faqQuestion} onChange={(event) => setFaqQuestion(event.target.value)} placeholder="游客问题" required />
              <Textarea value={faqAnswer} onChange={(event) => setFaqAnswer(event.target.value)} placeholder="标准答案" required />
              <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={faqCategory} onChange={(event) => setFaqCategory(event.target.value)}>
                {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={String(faqActive)} onChange={(event) => setFaqActive(event.target.value === "true")}>
                <option value="true">启用</option>
                <option value="false">停用</option>
              </select>
              <div className="flex gap-2">
                <Button className="flex-1"><Save className="h-4 w-4" />保存 FAQ</Button>
                <Button type="button" variant="outline" onClick={clearFAQ}>清空</Button>
              </div>
            </form>
          </Card>
          <Card className="animate-slide-in-up p-6 shadow-lg" style={{ animationDelay: "100ms" }}>
            <h2 className="mb-4 text-xl font-semibold">FAQ 列表</h2>
            <div className="space-y-3">
              {filteredFaqs.map((item) => (
                <div key={item.id || item.question} className="rounded-xl border border-border p-4 transition-all duration-300 hover:scale-[1.01] hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div><h3 className="font-semibold">{item.question}</h3><p className="mt-2 text-sm text-muted-foreground">{item.answer}</p><p className="mt-2 text-xs text-muted-foreground">{item.category} · {item.is_active === false ? "停用" : "启用"}</p></div>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => fillFAQ(item)}>编辑</Button>
                      <Button variant="outline" size="sm" onClick={() => toggleFAQ(item)}>{item.is_active === false ? "启用" : "停用"}</Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => remove(`/api/admin/knowledge/faq/${item.id}`)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="conversations">
          <Card className="animate-slide-in-up p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold">游客对话记录</h2>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {conversations.map((item: any) => <div key={item.id} className="rounded-xl border border-border p-4"><strong>{item.title || "导览会话"}</strong><p className="mt-2 text-xs text-muted-foreground">{item.updatedAt || "-"}</p></div>)}
              {!conversations.length && <p className="text-sm text-muted-foreground">暂无本机游客会话记录。</p>}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="blind">
          <Card className="animate-slide-in-up p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold">知识盲点</h2>
            <Table>
              <TableHeader><TableRow><TableHead>问题</TableHead><TableHead>次数</TableHead><TableHead>最近时间</TableHead></TableRow></TableHeader>
              <TableBody>{blindSpots.map((item, index) => <TableRow key={index}><TableCell>{item.question_pattern || item.question || item.query}</TableCell><TableCell>{item.count || 1}</TableCell><TableCell>{item.last_asked_at || item.created_at || "-"}</TableCell></TableRow>)}</TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminFrame>
  )
}
