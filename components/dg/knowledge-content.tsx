"use client"

import type { ChangeEvent, FormEvent } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { FileUp, RefreshCw, Save, Trash2 } from "lucide-react"
import { AdminFrame } from "@/components/dg/admin-frame"
import { authHeaders, request, requestWithTimeout, token } from "@/components/dg/api"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

const label = {
  title: "\u77E5\u8BC6\u5E93\u7BA1\u7406",
  desc: "\u7BA1\u7406\u6587\u6863\u3001FAQ \u4E0E\u77E5\u8BC6\u76F2\u70B9\uFF0C\u6240\u6709\u64CD\u4F5C\u76F4\u8FDE\u540E\u7AEF\u63A5\u53E3\u3002",
  refresh: "\u5237\u65B0",
  search: "\u641C\u7D22\u6587\u6863\u6216 FAQ",
  docs: "\u6587\u6863\u5165\u5E93",
  faq: "FAQ",
  blind: "\u77E5\u8BC6\u76F2\u70B9",
  conversations: "\u5BF9\u8BDD\u8BB0\u5F55",
  category: "\u5206\u7C7B",
  chooseUpload: "\u9009\u62E9\u6587\u4EF6\u5E76\u5165\u5E93",
  uploadSelected: "\u4E0A\u4F20\u5E76\u5165\u5E93",
  changeFile: "\u66F4\u6362\u6587\u4EF6",
  fileReady: "\u5DF2\u9009\u62E9",
  noFile: "\u652F\u6301 PDF / TXT / DOCX\uFF0C\u6700\u5927 20MB",
  uploaded: "\u6587\u6863\u5DF2\u4E0A\u4F20\u5E76\u5F00\u59CB\u5165\u5E93",
  needFile: "\u8BF7\u5148\u9009\u62E9\u8981\u4E0A\u4F20\u7684\u6587\u4EF6",
  noToken: "\u5C1A\u672A\u83B7\u53D6\u767B\u5F55\u51ED\u8BC1\uFF0C\u5DF2\u6682\u505C\u8BF7\u6C42\u3002",
  name: "\u540D\u79F0",
  status: "\u72B6\u6001",
  size: "\u5927\u5C0F",
  chunks: "\u5207\u7247",
  created: "\u521B\u5EFA\u65F6\u95F4",
  action: "\u64CD\u4F5C",
  delete: "\u5220\u9664",
  empty: "\u6682\u65E0\u6570\u636E",
  question: "\u95EE\u9898",
  answer: "\u7B54\u6848",
  active: "\u542F\u7528",
  saveFaq: "\u4FDD\u5B58 FAQ",
  newFaq: "\u65B0\u5EFA FAQ",
  editFaq: "\u7F16\u8F91 FAQ",
  saved: "FAQ \u5DF2\u4FDD\u5B58",
  deleted: "\u5DF2\u5220\u9664",
  confirmDelete: "\u786E\u8BA4\u5220\u9664\u8FD9\u6761\u6570\u636E\uFF1F",
  blindHint: "\u6765\u81EA\u540E\u7AEF\u7684\u672A\u547D\u4E2D\u95EE\u9898\u548C\u76F2\u70B9\u805A\u5408",
  localHistory: "\u672C\u673A\u6E38\u5BA2\u4F1A\u8BDD\u5386\u53F2",
}

function itemsOf(data: any) {
  return Array.isArray(data) ? data : data?.items || []
}

function formatBytes(value: unknown) {
  const size = Number(value)
  if (!Number.isFinite(size) || size <= 0) return "-"
  if (size > 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`
  if (size > 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${Math.round(size)} B`
}

function formatDate(value: unknown) {
  if (!value) return "-"
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("zh-CN")
}

function EmptyRow({ colSpan }: { colSpan: number }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-28 text-center text-sm text-muted-foreground">{label.empty}</TableCell>
    </TableRow>
  )
}

export function KnowledgeContent() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [tab, setTab] = useState("documents")
  const [documents, setDocuments] = useState<any[]>([])
  const [faqs, setFaqs] = useState<any[]>([])
  const [blindSpots, setBlindSpots] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>(["general"])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [docFile, setDocFile] = useState<File | null>(null)
  const [docCategory, setDocCategory] = useState("general")
  const [faqId, setFaqId] = useState("")
  const [faqQuestion, setFaqQuestion] = useState("")
  const [faqAnswer, setFaqAnswer] = useState("")
  const [faqCategory, setFaqCategory] = useState("general")
  const [faqActive, setFaqActive] = useState(true)
  const [conversations, setConversations] = useState<any[]>([])

  const filteredDocs = useMemo(
    () => documents.filter((item) => `${item.original_name || item.filename || item.name || ""} ${item.category || ""} ${item.status || ""}`.toLowerCase().includes(search.toLowerCase())),
    [documents, search],
  )
  const filteredFaqs = useMemo(
    () => faqs.filter((item) => `${item.question || ""} ${item.answer || ""} ${item.category || ""}`.toLowerCase().includes(search.toLowerCase())),
    [faqs, search],
  )

  const load = useCallback(async () => {
    if (!token()) {
      setError(label.noToken)
      return
    }

    setLoading(true)
    setError("")
    setMessage("")
    const safe = async <T,>(path: string, fallback: T) => {
      try {
        return await requestWithTimeout<T>(path, { headers: authHeaders() }, 9000)
      } catch (err) {
        console.warn(`[Knowledge] ${path}`, err)
        return fallback
      }
    }
    const [docs, faqData, cats, blind] = await Promise.all([
      safe("/api/admin/knowledge/documents?page=1&page_size=100", { items: [] }),
      safe("/api/admin/knowledge/faq?page=1&page_size=100", { items: [] }),
      safe<string[]>("/api/admin/knowledge/categories", ["general"]),
      safe("/api/admin/knowledge/blind-spots?range=week", { items: [] }),
    ])
    setDocuments(itemsOf(docs))
    setFaqs(itemsOf(faqData))
    setCategories(Array.isArray(cats) && cats.length ? cats : ["general"])
    setBlindSpots(itemsOf(blind))
    setLoading(false)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setTab(params.get("tab") || "documents")
    setSearch(params.get("search") || "")
    try {
      setConversations(JSON.parse(localStorage.getItem("dg_conversation_history") || "[]"))
    } catch {
      setConversations([])
    }
    if (token()) {
      load()
      return
    }
    let attempts = 0
    const id = window.setInterval(() => {
      attempts += 1
      if (token()) {
        load()
        window.clearInterval(id)
      }
      if (attempts > 20) window.clearInterval(id)
    }, 100)
    return () => window.clearInterval(id)
  }, [load])

  async function uploadDocument() {
    if (!docFile) {
      fileInputRef.current?.click()
      return
    }

    setLoading(true)
    setError("")
    setMessage("")
    try {
      const form = new FormData()
      form.append("file", docFile)
      form.append("category", docCategory || "general")
      await request("/api/admin/knowledge/documents", { method: "POST", headers: authHeaders(), body: form })
      setDocFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
      setMessage(label.uploaded)
      await load()
    } catch (err: any) {
      setError(err?.message || "Upload failed")
    } finally {
      setLoading(false)
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null
    setDocFile(file)
    setMessage(file ? `${label.fileReady}: ${file.name}` : "")
    setError("")
  }

  function fillFAQ(item: any) {
    setFaqId(String(item.id))
    setFaqQuestion(item.question || "")
    setFaqAnswer(item.answer || "")
    setFaqCategory(item.category || "general")
    setFaqActive(Boolean(item.is_active))
    setTab("faq")
  }

  function resetFAQ() {
    setFaqId("")
    setFaqQuestion("")
    setFaqAnswer("")
    setFaqCategory("general")
    setFaqActive(true)
  }

  async function saveFAQ(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")
    try {
      const body = JSON.stringify({ question: faqQuestion, answer: faqAnswer, category: faqCategory, is_active: faqActive })
      await request(faqId ? `/api/admin/knowledge/faq/${faqId}` : "/api/admin/knowledge/faq", {
        method: faqId ? "PUT" : "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body,
      })
      setMessage(label.saved)
      resetFAQ()
      await load()
    } catch (err: any) {
      setError(err?.message || "Save failed")
    } finally {
      setLoading(false)
    }
  }

  async function deleteDocument(id: unknown) {
    if (!window.confirm(label.confirmDelete)) return
    await request(`/api/admin/knowledge/documents/${id}`, { method: "DELETE", headers: authHeaders() })
    setMessage(label.deleted)
    await load()
  }

  async function deleteFAQ(id: unknown) {
    if (!window.confirm(label.confirmDelete)) return
    await request(`/api/admin/knowledge/faq/${id}`, { method: "DELETE", headers: authHeaders() })
    setMessage(label.deleted)
    await load()
  }

  const actions = (
    <Button onClick={load} disabled={loading}>
      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      {label.refresh}
    </Button>
  )

  return (
    <AdminFrame title={label.title} description={label.desc} actions={actions}>
      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_220px]">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={label.search} />
        <select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={docCategory} onChange={(event) => setDocCategory(event.target.value)}>
          {categories.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>

      {message && <Card className="mb-5 border-primary/20 bg-primary/5 p-4 text-sm text-primary shadow-sm">{message}</Card>}
      {error && <Card className="mb-5 border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive shadow-sm">{error}</Card>}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-5">
          <TabsTrigger value="documents">{label.docs}</TabsTrigger>
          <TabsTrigger value="faq">{label.faq}</TabsTrigger>
          <TabsTrigger value="conversations">{label.conversations}</TabsTrigger>
          <TabsTrigger value="blind" className="relative">
            {label.blind}
            {blindSpots.length > 0 && <span className="ml-2 rounded-full bg-destructive px-2 py-0.5 text-[10px] text-destructive-foreground">{blindSpots.length}</span>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-5">
          <Card className="p-5 shadow-lg">
            <div className="grid gap-4 md:grid-cols-[1fr_220px_auto] md:items-end">
              <div>
                <p className="mb-2 text-sm font-medium">{docFile ? `${label.fileReady}: ${docFile.name}` : label.noFile}</p>
                <input ref={fileInputRef} type="file" accept=".pdf,.txt,.docx" className="hidden" onChange={handleFileChange} />
                {docFile && (
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    {label.changeFile}
                  </Button>
                )}
              </div>
              <label className="grid gap-2 text-sm font-medium">
                {label.category}
                <select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={docCategory} onChange={(event) => setDocCategory(event.target.value)}>
                  {categories.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <Button type="button" onClick={uploadDocument} disabled={loading}>
                <FileUp className="h-4 w-4" />
                {docFile ? label.uploadSelected : label.chooseUpload}
              </Button>
            </div>
          </Card>

          <Card className="overflow-hidden shadow-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{label.name}</TableHead>
                  <TableHead>{label.category}</TableHead>
                  <TableHead>{label.status}</TableHead>
                  <TableHead>{label.size}</TableHead>
                  <TableHead>{label.chunks}</TableHead>
                  <TableHead>{label.created}</TableHead>
                  <TableHead className="text-right">{label.action}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocs.length ? filteredDocs.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="max-w-[260px] truncate font-medium">{item.original_name || item.filename || item.name || "-"}</TableCell>
                    <TableCell>{item.category || "-"}</TableCell>
                    <TableCell>{item.status || "-"}</TableCell>
                    <TableCell>{formatBytes(item.file_size)}</TableCell>
                    <TableCell>{item.chunk_count ?? "-"}</TableCell>
                    <TableCell>{formatDate(item.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button type="button" variant="ghost" size="icon-sm" onClick={() => deleteDocument(item.id)} title={label.delete}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : <EmptyRow colSpan={7} />}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="faq" className="grid gap-5 xl:grid-cols-[420px_1fr]">
          <Card className="p-5 shadow-lg">
            <form className="space-y-4" onSubmit={saveFAQ}>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{faqId ? label.editFaq : label.newFaq}</h2>
                {faqId && <Button type="button" variant="outline" size="sm" onClick={resetFAQ}>{label.newFaq}</Button>}
              </div>
              <Input value={faqQuestion} onChange={(event) => setFaqQuestion(event.target.value)} placeholder={label.question} required />
              <Textarea value={faqAnswer} onChange={(event) => setFaqAnswer(event.target.value)} placeholder={label.answer} rows={8} required />
              <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={faqCategory} onChange={(event) => setFaqCategory(event.target.value)}>
                {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={faqActive} onChange={(event) => setFaqActive(event.target.checked)} />
                {label.active}
              </label>
              <Button className="w-full" disabled={loading}>
                <Save className="h-4 w-4" />
                {label.saveFaq}
              </Button>
            </form>
          </Card>

          <Card className="overflow-hidden shadow-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{label.question}</TableHead>
                  <TableHead>{label.category}</TableHead>
                  <TableHead>{label.active}</TableHead>
                  <TableHead className="text-right">{label.action}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFaqs.length ? filteredFaqs.map((item) => (
                  <TableRow key={item.id} className="cursor-pointer" onClick={() => fillFAQ(item)}>
                    <TableCell className="max-w-[520px] truncate font-medium">{item.question || "-"}</TableCell>
                    <TableCell>{item.category || "-"}</TableCell>
                    <TableCell>{item.is_active ? label.active : "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button type="button" variant="ghost" size="icon-sm" onClick={(event) => { event.stopPropagation(); deleteFAQ(item.id) }} title={label.delete}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : <EmptyRow colSpan={4} />}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="conversations">
          <Card className="p-6 shadow-lg">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">{label.conversations}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{label.localHistory}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {conversations.length ? conversations.map((item, index) => (
                <div key={item.id || index} className="rounded-xl border border-border p-4">
                  <strong className="block truncate">{item.title || label.conversations}</strong>
                  <p className="mt-2 truncate text-xs text-muted-foreground">{item.updatedAt || item.id || "-"}</p>
                </div>
              )) : <div className="col-span-full grid min-h-36 place-items-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">{label.empty}</div>}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="blind">
          <Card className="p-6 shadow-lg">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">{label.blind}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{label.blindHint}</p>
            </div>
            <div className="max-h-[520px] space-y-3 overflow-auto pr-1">
              {blindSpots.length ? blindSpots.map((item, index) => {
                const question = item.question_pattern || item.question || item.query || item.pattern || "-"
                return (
                <div key={`${question}-${index}`} className="rounded-xl border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">{question}</p>
                    <span className="shrink-0 rounded-full bg-destructive/10 px-3 py-1 text-xs text-destructive">{item.count || item.frequency || item.total || 1}</span>
                  </div>
                  {(item.suggestion || item.answer || item.reason) && <p className="mt-2 text-sm text-muted-foreground">{item.suggestion || item.answer || item.reason}</p>}
                </div>
              )}) : <div className="grid min-h-40 place-items-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">{label.empty}</div>}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminFrame>
  )
}
