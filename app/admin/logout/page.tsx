"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { authHeaders, clearToken, request } from "@/components/dg/api"

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    async function logout() {
      await request("/api/auth/logout", { method: "POST", headers: authHeaders() }).catch(() => null)
      clearToken()
      router.replace("/")
    }
    logout()
  }, [router])

  return <main className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">正在退出登录...</main>
}
