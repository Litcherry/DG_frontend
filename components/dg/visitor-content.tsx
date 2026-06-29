"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { BookOpen, Bot, Map, Mic, Plus, Send, Sparkles, Star, Volume2 } from "lucide-react"
import { apiBase, request } from "@/components/dg/api"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type Message = {
  role: "assistant" | "user"
  content: string
}

const labels = {
  tempVisitor: "\u4E34\u65F6\u6E38\u5BA2",
  hello: "\u60A8\u597D\uFF0C\u6211\u662F AI \u5BFC\u89C8\u5458\u3002\u521B\u5EFA\u5BFC\u89C8\u4F1A\u8BDD\u540E\uFF0C\u53EF\u4EE5\u8BE2\u95EE\u666F\u70B9\u8BB2\u89E3\u3001\u8DEF\u7EBF\u89C4\u5212\u548C\u670D\u52A1\u4FE1\u606F\u3002",
  newGreeting: "\u65B0\u7684\u5BFC\u89C8\u4F1A\u8BDD\u5DF2\u521B\u5EFA\uFF0C\u60F3\u4E86\u89E3\u5F53\u524D\u573A\u666F\u5185\u5BB9\u3001\u8DEF\u7EBF\u6216\u670D\u52A1\u4FE1\u606F\uFF0C\u90FD\u53EF\u4EE5\u76F4\u63A5\u95EE\u6211\u3002",
  unavailable: "\u540E\u7AEF\u670D\u52A1\u6682\u65F6\u65E0\u6CD5\u8FDE\u63A5\uFF0C\u8BF7\u786E\u8BA4\u670D\u52A1\u5730\u5740\u548C\u540E\u7AEF\u542F\u52A8\u72B6\u6001\u3002",
}

const defaultInterests = [
  "\u5386\u53F2\u6587\u5316",
  "\u81EA\u7136\u98CE\u5149",
  "\u4F11\u95F2\u5A31\u4E50",
  "\u4EB2\u5B50\u6E38\u89C8",
  "\u62CD\u7167\u6253\u5361",
]

export function VisitorContent({ embedded = false }: { embedded?: boolean } = {}) {
  const [visitorName, setVisitorName] = useState(labels.tempVisitor)
  const [conversationId, setConversationId] = useState("")
  const [interests, setInterests] = useState<string[]>([])
  const [interestOptions, setInterestOptions] = useState(defaultInterests)
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: labels.hello }])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [recording, setRecording] = useState(false)
  const [diary, setDiary] = useState<any>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const abortRef = useRef<AbortController | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  useEffect(() => {
    setVisitorName(localStorage.getItem("dg_visitor_name") || labels.tempVisitor)
  }, [])

  async function createConversation() {
    setError("")
    const visitorId = localStorage.getItem("dg_visitor_id") || crypto.randomUUID()
    localStorage.setItem("dg_visitor_id", visitorId)
    localStorage.setItem("dg_visitor_name", visitorName || labels.tempVisitor)

    const data = await request<any>("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitor_id: `${visitorName || "visitor"}-${visitorId}` }),
    })

    const nextConversationId = data.conversation_id as string
    setConversationId(nextConversationId)
    setInterests([])
    setInterestOptions(data.interest_options || defaultInterests)
    setMessages([{ role: "assistant", content: data.greeting || labels.newGreeting }])
    const history = JSON.parse(localStorage.getItem("dg_conversation_history") || "[]")
    localStorage.setItem("dg_conversation_history", JSON.stringify([{ id: nextConversationId, title: `${visitorName || labels.tempVisitor} 的导览会话`, updatedAt: new Date().toLocaleString() }, ...history].slice(0, 20)))
    return nextConversationId
  }

  async function toggleInterest(tag: string) {
    const next = interests.includes(tag) ? interests.filter((item) => item !== tag) : [...interests, tag]
    setInterests(next)
    if (conversationId) {
      await request(`/api/conversations/${conversationId}/interests`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interest_tags: next }),
      }).catch(() => {})
    }
  }

  async function sendMessage(text = input) {
    const content = text.trim()
    if (!content || loading) return

    setError("")
    setLoading(true)
    setInput("")

    try {
      let activeConversationId = conversationId
      if (!activeConversationId) {
        activeConversationId = await createConversation()
      }

      setMessages((current) => [...current, { role: "user", content }, { role: "assistant", content: "" }])
      const controller = new AbortController()
      abortRef.current = controller

      const res = await fetch(`${apiBase()}/api/voice/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation_id: activeConversationId, message: content, language: "zh", explain_mode: "normal" }),
        signal: controller.signal,
      })
      if (!res.ok || !res.body) throw new Error("\u95EE\u7B54\u670D\u52A1\u6682\u65F6\u4E0D\u53EF\u7528")

      const reader = res.body.getReader()
      const decoder = new TextDecoder("utf-8")
      let buffer = ""
      let finalText = ""

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split("\n\n")
        buffer = events.pop() || ""

        for (const event of events) {
          const line = event.split("\n").find((item) => item.startsWith("data:"))
          if (!line) continue
          const payload = JSON.parse(line.slice(5).trim())
          if (payload.type === "delta") finalText += payload.content || ""
          if (payload.type === "done") finalText = payload.content || finalText
          if (payload.type === "error") throw new Error(payload.message || payload.content || "\u670D\u52A1\u6682\u65F6\u4E0D\u53EF\u7528")
          setMessages((current) => current.map((item, index) => (index === current.length - 1 ? { ...item, content: finalText } : item)))
        }
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setError(err?.message || labels.unavailable)
        setMessages((current) => {
          if (!current.length || current[current.length - 1].role !== "assistant") {
            return [...current, { role: "assistant", content: labels.unavailable }]
          }
          return current.map((item, index) => (index === current.length - 1 ? { ...item, content: labels.unavailable } : item))
        })
      }
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }

  function stopReply() {
    abortRef.current?.abort()
    setLoading(false)
  }

  async function recommendRoute() {
    await sendMessage(`\u8BF7\u6839\u636E\u6211\u7684\u5174\u8DA3\u504F\u597D\u89C4\u5212\u4E00\u6761\u6E38\u89C8\u8DEF\u7EBF\uFF1A${interests.join("\uFF0C") || "\u4E0D\u9650"}`)
  }

  async function toggleRecording() {
    if (recording) {
      recorderRef.current?.stop()
      setRecording(false)
      return
    }
    setError("")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      audioChunksRef.current = []
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop())
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" })
        const form = new FormData()
        form.append("audio", blob, "voice.webm")
        try {
          const data = await request<any>("/api/voice/asr", { method: "POST", body: form })
          if (data.text) {
            setInput(data.text)
            await sendMessage(data.text)
          }
        } catch (err: any) {
          setError(err?.message || "语音识别失败")
        }
      }
      recorderRef.current = recorder
      recorder.start()
      setRecording(true)
    } catch {
      setError("无法使用麦克风，请检查浏览器权限")
    }
  }

  async function speakLastReply() {
    const last = [...messages].reverse().find((item) => item.role === "assistant" && item.content)
    if (!last) return
    const res = await fetch(`${apiBase()}/api/voice/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: last.content.slice(0, 1000), conversation_id: conversationId || null, language: "zh" }),
    })
    if (!res.ok) {
      setError("语音合成失败")
      return
    }
    const url = URL.createObjectURL(await res.blob())
    const audio = new Audio(url)
    audio.onended = () => URL.revokeObjectURL(url)
    await audio.play()
  }

  async function submitFeedback() {
    if (!conversationId) return
    await request(`/api/conversations/${conversationId}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment: comment || null }),
    })
    setError("")
    setComment("")
    setMessages((current) => [...current, { role: "assistant", content: "感谢评价，我会继续优化导览服务。" }])
  }

  async function endConversation() {
    if (!conversationId) return
    await request(`/api/conversations/${conversationId}/end`, { method: "POST" })
    setMessages((current) => [...current, { role: "assistant", content: "本次导览会话已结束，欢迎下次继续找我。" }])
  }

  async function generateDiary() {
    if (!conversationId) return
    const data = await request(`/api/conversations/${conversationId}/diary?language=zh`, { method: "POST" })
    setDiary(data)
  }

  return (
    <main className={embedded ? "h-full bg-transparent" : "min-h-screen bg-background p-3 md:p-5"}>
      <div className={`${embedded ? "h-full" : "mx-auto max-w-7xl"} grid gap-4 lg:grid-cols-[360px_1fr_280px]`}>
        <section className="space-y-4">
          <Card className="animate-slide-in-up overflow-hidden p-5 shadow-lg">
            {!embedded && <div className="mb-5 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground">DG</span>
                &#x6E38;&#x5BA2;&#x5BFC;&#x89C8;&#x7AEF;
              </Link>
              <Link href="/?adminLogin=1" className="text-xs font-semibold text-primary">
                &#x7BA1;&#x7406;&#x540E;&#x53F0;
              </Link>
            </div>}
            <div className={`${embedded ? "h-[420px]" : "h-72"} grid place-items-center rounded-xl bg-gradient-to-br from-emerald-50 to-background`}>
              <div className="grid place-items-center gap-3 text-center">
                <div className={`${embedded ? "h-36 w-36" : "h-24 w-24"} grid place-items-center rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/20`}>
                  <Bot className={embedded ? "h-20 w-20" : "h-12 w-12"} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">AI &#x5BFC;&#x89C8;&#x5458;</h1>
                  <p className="text-sm text-muted-foreground">&#x5728;&#x7EBF;&#x5F85;&#x547D;</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="animate-slide-in-up p-5 shadow-lg" style={{ animationDelay: "100ms" }}>
            <h2 className="mb-3 text-lg font-semibold">&#x6E38;&#x5BA2;&#x4FE1;&#x606F;</h2>
            <div className="space-y-3">
              <Input value={visitorName} onChange={(event) => setVisitorName(event.target.value)} placeholder="\u6E38\u5BA2\u6635\u79F0" />
              <Button className="w-full" onClick={createConversation}>
                <Plus className="h-4 w-4" />
                &#x65B0;&#x5EFA;&#x5BFC;&#x89C8;&#x4F1A;&#x8BDD;
              </Button>
            </div>
          </Card>

          <Card className="animate-slide-in-up p-5 shadow-lg" style={{ animationDelay: "180ms" }}>
            <h2 className="mb-3 text-lg font-semibold">&#x5174;&#x8DA3;&#x504F;&#x597D;</h2>
            <div className="flex flex-wrap gap-2">
              {interestOptions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleInterest(tag)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-all duration-300 ${interests.includes(tag) ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "border-border bg-card text-muted-foreground hover:bg-secondary"}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </Card>
        </section>

        <Card className={`animate-slide-in-up flex ${embedded ? "h-full min-h-0" : "h-[calc(100vh-2.5rem)] min-h-[680px]"} p-0 shadow-lg`} style={{ animationDelay: "80ms" }}>
          <div className="flex h-full w-full flex-col">
            <header className="flex h-16 items-center justify-between border-b border-border px-5">
              <div>
                <h2 className="font-semibold">&#x5BFC;&#x89C8;&#x4F1A;&#x8BDD;</h2>
                <p className="text-xs text-muted-foreground">{conversationId ? `\u4F1A\u8BDD ${conversationId}` : "\u8BF7\u5148\u521B\u5EFA\u4F1A\u8BDD"}</p>
              </div>
              {loading && (
                <Button variant="outline" size="sm" onClick={stopReply}>
                  &#x505C;&#x6B62;&#x56DE;&#x590D;
                </Button>
              )}
            </header>
            <div className="flex-1 space-y-4 overflow-auto p-5">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-7 shadow-sm ${message.role === "user" ? "bg-primary text-primary-foreground" : "border border-border bg-card text-foreground"}`}>
                    {message.content || <span className="text-muted-foreground">&#x6B63;&#x5728;&#x7EC4;&#x7EC7;&#x56DE;&#x7B54;...</span>}
                  </div>
                </div>
              ))}
            </div>
            {error && <p className="mx-5 mb-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            <div className="border-t border-border p-4">
              <div className="mb-3 flex flex-wrap gap-2">
                {["\u6709\u4EC0\u4E48\u666F\u70B9\u63A8\u8350\uFF1F", "\u9002\u5408\u4EB2\u5B50\u6E38\u7684\u8DEF\u7EBF\u600E\u4E48\u8D70\uFF1F", "\u9644\u8FD1\u6709\u54EA\u4E9B\u670D\u52A1\u8BBE\u65BD\uFF1F"].map((item) => (
                  <Button key={item} variant="outline" size="sm" onClick={() => sendMessage(item)}>
                    {item}
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-[auto_1fr_auto] items-end gap-2">
                <Button variant={recording ? "default" : "outline"} size="icon" title="\u8BED\u97F3\u8F93\u5165" onClick={toggleRecording}>
                  <Mic className="h-4 w-4" />
                </Button>
                <Textarea
                  className="min-h-11 resize-none"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="\u6709\u95EE\u9898\uFF0C\u5C3D\u7BA1\u95EE"
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault()
                      sendMessage()
                    }
                  }}
                />
                <Button size="icon" onClick={() => sendMessage()} disabled={!input.trim() || loading}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <aside className="space-y-4">
          <Card className="animate-slide-in-up p-5 shadow-lg" style={{ animationDelay: "160ms" }}>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Map className="h-5 w-5 text-primary" />
              &#x8DEF;&#x7EBF;&#x89C4;&#x5212;
            </h2>
            <p className="mb-4 text-sm leading-7 text-muted-foreground">
              &#x6839;&#x636E;&#x5174;&#x8DA3;&#x504F;&#x597D;&#x751F;&#x6210;&#x6E38;&#x89C8;&#x8DEF;&#x7EBF;&#xFF0C;&#x6CBF;&#x7528;&#x539F;&#x5BFC;&#x89C8;&#x95EE;&#x7B54;&#x63A5;&#x53E3;&#x3002;
            </p>
            <Button className="w-full" onClick={recommendRoute}>
              <Sparkles className="h-4 w-4" />
              &#x63A8;&#x8350;&#x8DEF;&#x7EBF;
            </Button>
          </Card>
          <Card className="animate-slide-in-up p-5 shadow-lg" style={{ animationDelay: "190ms" }}>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><BookOpen className="h-5 w-5 text-primary" />旅行日记</h2>
            <Button className="mb-3 w-full" variant="outline" onClick={generateDiary} disabled={!conversationId}>生成日记</Button>
            {diary && (
              <div className="max-h-56 space-y-2 overflow-auto rounded-xl border border-border p-3 text-sm leading-7">
                {diary.format === "segments" && diary.segments?.length
                  ? diary.segments.map((item: any, index: number) => <p key={index}>{item.content}</p>)
                  : <p>{diary.diary_text || "暂无日记内容"}</p>}
              </div>
            )}
          </Card>
          <Card className="animate-slide-in-up p-5 shadow-lg" style={{ animationDelay: "205ms" }}>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Star className="h-5 w-5 text-primary" />服务反馈</h2>
            <div className="space-y-3">
              <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={rating} onChange={(event) => setRating(Number(event.target.value))}>
                {[5, 4, 3, 2, 1].map((item) => <option key={item} value={item}>{item} 星</option>)}
              </select>
              <Input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="可选评价" />
              <Button className="w-full" onClick={submitFeedback} disabled={!conversationId}>提交评价</Button>
            </div>
          </Card>
          <Card className="animate-slide-in-up p-5 shadow-lg" style={{ animationDelay: "220ms" }}>
            <h2 className="mb-4 text-lg font-semibold">&#x4F1A;&#x8BDD;&#x72B6;&#x6001;</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">&#x6E38;&#x5BA2;</span>
                <strong>{visitorName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">&#x5174;&#x8DA3;&#x6570;</span>
                <strong>{interests.length}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">&#x6D88;&#x606F;&#x6570;</span>
                <strong>{messages.length}</strong>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={speakLastReply} disabled={!conversationId}><Volume2 className="h-4 w-4" />朗读</Button>
                <Button variant="outline" size="sm" onClick={endConversation} disabled={!conversationId}>结束</Button>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </main>
  )
}
