"use client"

import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { token } from "@/components/dg/api"

export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    const hasToken = Boolean(token())
    setSignedIn(hasToken)
    setReady(true)
    if (!hasToken) router.replace("/?adminLogin=1")
  }, [router])

  if (!ready || !signedIn) {
    return (
      <main className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        正在前往首页登录...
      </main>
    )
  }

  return children
}
