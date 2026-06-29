"use client"

import { useState } from "react"
import { useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bot, Database, LayoutDashboard, LogOut, Map, Route } from "lucide-react"
import { authHeaders, requestWithTimeout, token } from "@/components/dg/api"
import { cn } from "@/lib/utils"

const menuItems = [
  { icon: LayoutDashboard, label: "\u4EEA\u8868\u76D8", href: "/admin" },
  { icon: Database, label: "\u77E5\u8BC6\u5E93", href: "/admin/knowledge" },
  { icon: Map, label: "\u666F\u533A\u7BA1\u7406", href: "/admin/scenic" },
  { icon: Bot, label: "\u6570\u5B57\u4EBA", href: "/admin/human" },
]

const generalItems = [
  { icon: Route, label: "\u8DEF\u7EBF\u6570\u636E", href: "/admin/scenic?tab=routes" },
  { icon: LogOut, label: "\u9000\u51FA\u767B\u5F55", href: "/admin/logout" },
]

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

export function Sidebar() {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [blindCount, setBlindCount] = useState(0)
  const pathname = usePathname()

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
  }, [pathname])

  return (
    <aside className="fixed top-0 left-0 w-64 bg-card border-r border-border p-4 h-screen overflow-y-auto lg:block">
      <div className="flex items-center gap-2 mb-6 group cursor-pointer">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center transition-transform group-hover:scale-110 duration-300 relative">
            <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground absolute" style={{ top: "30%", left: "30%" }} />
            <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground absolute" style={{ top: "30%", right: "30%" }} />
            <div className="w-3 h-1.5 border-b-2 border-primary-foreground rounded-full absolute bottom-2.5" />
          </div>
          <span className="text-lg font-semibold text-foreground">DG Admin</span>
        </Link>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">Menu</p>
          <nav className="space-y-0.5">
            {menuItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onMouseEnter={() => setHoveredItem(item.label)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    hoveredItem === item.label && !isActive && "translate-x-1",
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                  {item.href === "/admin/knowledge" && blindCount > 0 && (
                    <span className="ml-auto rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground">
                      {blindCount}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        <div>
          <p className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">General</p>
          <nav className="space-y-0.5">
            {generalItems.map((item) => {
              const isActive = item.href.includes("?") ? pathname === item.href.split("?")[0] : pathname === item.href
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onMouseEnter={() => setHoveredItem(item.label)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    hoveredItem === item.label && !isActive && "translate-x-1",
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </aside>
  )
}
