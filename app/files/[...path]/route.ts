import { NextRequest } from "next/server"

export const runtime = "nodejs"

const backendBase = (process.env.DG_BACKEND_URL || process.env.NEXT_PUBLIC_DG_BACKEND_URL || "http://localhost:8000").replace(/\/$/, "")

async function proxyFile(request: NextRequest, context: { params: Promise<any> }) {
  try {
    const { path = [] } = await context.params
    const source = new URL(request.url)
    const target = new URL(`${backendBase}/files/${path.join("/")}`)
    target.search = source.search

    const response = await fetch(target, { cache: "no-store" })
    const headers = new Headers(response.headers)
    headers.delete("content-encoding")
    headers.delete("content-length")
    headers.set("access-control-allow-origin", "*")

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  } catch (error: any) {
    return Response.json({ detail: error?.message || "File proxy request failed" }, { status: 502 })
  }
}

export async function GET(request: NextRequest, context: { params: Promise<any> }) {
  return proxyFile(request, context)
}
