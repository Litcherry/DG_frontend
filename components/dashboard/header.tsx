"use client"

import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, Mail, Search } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { authHeaders, requestWithTimeout, token } from "@/components/dg/api"
import { MobileNav } from "./mobile-nav"

interface HeaderProps {
  title: string
  description: string
  actions?: ReactNode
}

const resolvedBlindStorageKey = "dg_resolved_blind_spots"

function blindQuestion(item: any) {
  return String(item.question_pattern || item.question || item.query || item.pattern || "-").trim().toLowerCase()
}

function readResolvedBlindKeys() {
  try {
    const value = JSON.parse(localStorage.getItem(resolvedBlindStorageKey) || "[]")
    return Array.isArray(value) ? value.map(String) : []
  } catch {
    return []
  }
}

export function Header({ title, description, actions }: HeaderProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [blindCount, setBlindCount] = useState(0)

  useEffect(() => {
    if (!token()) return
    let mounted = true
    const loadBlindCount = () => requestWithTimeout<any>("/api/admin/knowledge/blind-spots?range=week", { headers: authHeaders() }, 7000)
      .then((data) => {
        const items = Array.isArray(data) ? data : data?.items || []
        const resolved = readResolvedBlindKeys()
        if (mounted) setBlindCount(items.filter((item: any) => !resolved.includes(blindQuestion(item))).length)
      })
      .catch(() => mounted && setBlindCount(0))
    loadBlindCount()
    window.addEventListener("dg-blind-spots-updated", loadBlindCount)
    return () => {
      mounted = false
      window.removeEventListener("dg-blind-spots-updated", loadBlindCount)
    }
  }, [])

  function submitSearch(event: React.FormEvent) {
    event.preventDefault()
    const keyword = query.trim().toLowerCase()
    if (!keyword) return
    if (/\u77E5\u8BC6|faq|\u6587\u6863|\u76F2\u70B9|question|document|knowledge/.test(keyword)) router.push("/admin/knowledge")
    else if (/\u666F\u70B9|\u8DEF\u7EBF|route|spot|scenic|\u5730\u56FE/.test(keyword)) router.push("/admin/scenic")
    else if (/\u6570\u5B57\u4EBA|\u58F0\u97F3|\u5934\u50CF|human|voice|avatar/.test(keyword)) router.push("/admin/human")
    else router.push(`/admin/knowledge?search=${encodeURIComponent(query.trim())}`)
  }

  return (
    <header className="space-y-3 md:space-y-4 animate-slide-in-up">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <MobileNav />

          <form className="relative flex-1 max-w-md" onSubmit={submitSearch}>
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="\u641C\u7D22\u540E\u53F0\u5185\u5BB9"
              className="pl-9 pr-3 md:pr-16 h-9 text-sm bg-card border-border transition-all duration-300 focus:shadow-lg focus:shadow-primary/10"
            />
            <kbd className="hidden md:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground bg-muted rounded border border-border">
              Enter
            </kbd>
          </form>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2">
          <Button asChild variant="ghost" size="icon" className="relative hover:bg-secondary transition-all duration-300 hover:scale-110 h-8 w-8">
            <Link href="/admin/knowledge?tab=conversations" title="\u6E38\u5BA2\u5BF9\u8BDD\u8BB0\u5F55">
              <Mail className="w-4 h-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="relative hover:bg-secondary transition-all duration-300 hover:scale-110 h-8 w-8">
            <Link href="/admin/knowledge?tab=blind" title="\u77E5\u8BC6\u76F2\u70B9">
              <Bell className="w-4 h-4" />
              {blindCount > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-destructive px-1.5 py-0.5 text-[9px] font-bold leading-none text-destructive-foreground">{blindCount}</span>}
            </Link>
          </Button>

          <div className="flex items-center gap-2 pl-2 md:pl-3 border-l border-border">
            <Avatar className="w-7 h-7 md:w-8 md:h-8 ring-2 ring-primary/20 transition-all duration-300 hover:ring-primary/40">
              <AvatarImage src="/profile.jpg" alt="DG Admin" />
              <AvatarFallback className="text-xs">DG</AvatarFallback>
            </Avatar>
            <div className="text-xs hidden sm:block">
              <p className="font-semibold text-foreground">&#x7BA1;&#x7406;&#x5458;</p>
              <p className="text-muted-foreground text-[10px]">DG operations</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-1">{title}</h1>
        <p className="text-xs md:text-sm text-muted-foreground">{description}</p>
      </div>

      {actions && <div className="flex flex-col sm:flex-row gap-2">{actions}</div>}
    </header>
  )
}
