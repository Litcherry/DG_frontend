import type React from "react"
import type { Metadata } from "next"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "DG \u7BA1\u7406\u540E\u53F0",
  description: "AI \u6570\u5B57\u4EBA\u5BFC\u89C8\u7BA1\u7406\u540E\u53F0",
  icons: {
    icon: [
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider defaultTheme="light" enableSystem={false} storageKey="tasko-theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
