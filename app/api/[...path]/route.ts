import { NextRequest } from "next/server"

export const runtime = "nodejs"

const backendBase = (process.env.DG_BACKEND_URL || process.env.NEXT_PUBLIC_DG_BACKEND_URL || "http://localhost:8000").replace(/\/$/, "")

function targetURL(request: NextRequest, path: string[]) {
  const url = new URL(request.url)
  const target = new URL(`${backendBase}/api/${path.join("/")}`)
  target.search = url.search
  return target
}

function proxyHeaders(request: NextRequest) {
  const headers = new Headers()
  const contentType = request.headers.get("content-type")
  const authorization = request.headers.get("authorization")
  const accept = request.headers.get("accept")
  if (contentType) headers.set("content-type", contentType)
  if (authorization) headers.set("authorization", authorization)
  if (accept) headers.set("accept", accept)
  return headers
}

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await context.params
    const method = request.method
    const hasBody = !["GET", "HEAD"].includes(method)
    const body = hasBody ? Buffer.from(await request.arrayBuffer()) : undefined
    const response = await fetch(targetURL(request, path), {
      method,
      headers: proxyHeaders(request),
      body,
      cache: "no-store",
    })

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
    return Response.json({ detail: error?.message || "Proxy request failed" }, { status: 502 })
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context)
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context)
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context)
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context)
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "access-control-allow-headers": "*",
    },
  })
}
