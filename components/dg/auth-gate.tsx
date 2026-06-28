"use client"

import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import { apiBase, request, setApiBase, setToken, token } from "@/components/dg/api"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export function AuthGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const [base, setBase] = useState("http://localhost:8000")
  const [username, setUsername] = useState("admin")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setBase(apiBase())
    setSignedIn(Boolean(token()))
    setReady(true)
  }, [])

  async function login(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError("")
    try {
      setApiBase(base)
      const data = await request<{ access_token: string }>("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })
      setToken(data.access_token)
      setSignedIn(true)
    } catch (err: any) {
      setError(err?.message || "\u767B\u5F55\u5931\u8D25")
    } finally {
      setLoading(false)
    }
  }

  if (!ready) return null
  if (signedIn) return children

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="animate-slide-in-up">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-black text-primary-foreground">
              DG
            </div>
            <div>
              <strong className="block text-2xl">DG &#x7BA1;&#x7406;&#x540E;&#x53F0;</strong>
              <span className="text-sm text-muted-foreground">&#x57FA;&#x4E8E; Tasko &#x6A21;&#x677F;&#x7684;&#x6570;&#x5B57;&#x4EBA;&#x5BFC;&#x89C8;&#x8FD0;&#x8425;&#x53F0;</span>
            </div>
          </div>
          <h1 className="mb-3 max-w-2xl text-4xl font-bold leading-tight text-foreground md:text-6xl">
            &#x7528;&#x540C;&#x4E00;&#x5957;&#x6A21;&#x677F;&#x7BA1;&#x7406;&#x77E5;&#x8BC6;&#x3001;&#x666F;&#x70B9;&#x3001;&#x8DEF;&#x7EBF;&#x548C;&#x6570;&#x5B57;&#x4EBA;
          </h1>
          <p className="max-w-xl text-base leading-8 text-muted-foreground">
            &#x4FDD;&#x7559;&#x539F;&#x6709; DG &#x540E;&#x53F0;&#x63A5;&#x53E3;&#xFF0C;&#x754C;&#x9762;&#x4E0E;&#x52A8;&#x6548;&#x4F7F;&#x7528; Tasko &#x7684;&#x5361;&#x7247;&#x3001;&#x4FA7;&#x680F;&#x3001;&#x56FE;&#x8868;&#x548C;&#x9875;&#x9762;&#x8282;&#x594F;&#x3002;
          </p>
        </section>

        <Card className="animate-slide-in-up p-6 shadow-xl" style={{ animationDelay: "120ms" }}>
          <form className="space-y-4" onSubmit={login}>
            <div>
              <h2 className="text-2xl font-semibold">&#x7BA1;&#x7406;&#x5458;&#x767B;&#x5F55;</h2>
              <p className="mt-1 text-sm text-muted-foreground">&#x767B;&#x5F55;&#x540E;&#x8FDB;&#x5165;&#x6A21;&#x677F;&#x5316;&#x8FD0;&#x8425;&#x540E;&#x53F0;&#x3002;</p>
            </div>
            <label className="grid gap-2 text-sm font-medium">
              &#x540E;&#x7AEF;&#x5730;&#x5740;
              <Input value={base} onChange={(event) => setBase(event.target.value)} />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              &#x8D26;&#x53F7;
              <Input value={username} onChange={(event) => setUsername(event.target.value)} />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              &#x5BC6;&#x7801;
              <Input
                type="password"
                placeholder="\u9ED8\u8BA4 admin123"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            <Button className="h-10 w-full transition-all duration-300 hover:scale-[1.01] hover:shadow-lg hover:shadow-primary/30" disabled={loading}>
              {loading ? "\u6B63\u5728\u767B\u5F55..." : "\u767B\u5F55\u7BA1\u7406\u540E\u53F0"}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  )
}
