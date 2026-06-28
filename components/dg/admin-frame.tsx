"use client"

import type { ReactNode } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { AuthGate } from "@/components/dg/auth-gate"

interface AdminFrameProps {
  title: string
  description: string
  actions?: ReactNode
  children: ReactNode
}

export function AdminFrame({ title, description, actions, children }: AdminFrameProps) {
  return (
    <AuthGate>
      <div className="flex min-h-screen bg-background">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <main className="flex-1 p-3 md:p-4 lg:ml-64 lg:p-5">
          <Header title={title} description={description} actions={actions} />
          <div className="mt-4 md:mt-5">{children}</div>
        </main>
      </div>
    </AuthGate>
  )
}
