module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/app/api/[...path]/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DELETE",
    ()=>DELETE,
    "GET",
    ()=>GET,
    "OPTIONS",
    ()=>OPTIONS,
    "PATCH",
    ()=>PATCH,
    "POST",
    ()=>POST,
    "PUT",
    ()=>PUT,
    "runtime",
    ()=>runtime
]);
const runtime = "nodejs";
const backendBase = (process.env.DG_BACKEND_URL || process.env.NEXT_PUBLIC_DG_BACKEND_URL || "http://localhost:8000").replace(/\/$/, "");
function targetURL(request, path) {
    const url = new URL(request.url);
    const target = new URL(`${backendBase}/api/${path.join("/")}`);
    target.search = url.search;
    return target;
}
function proxyHeaders(request) {
    const headers = new Headers();
    const contentType = request.headers.get("content-type");
    const authorization = request.headers.get("authorization");
    const accept = request.headers.get("accept");
    if (contentType) headers.set("content-type", contentType);
    if (authorization) headers.set("authorization", authorization);
    if (accept) headers.set("accept", accept);
    return headers;
}
async function proxy(request, context) {
    try {
        const { path } = await context.params;
        const method = request.method;
        const hasBody = ![
            "GET",
            "HEAD"
        ].includes(method);
        const body = hasBody ? Buffer.from(await request.arrayBuffer()) : undefined;
        const response = await fetch(targetURL(request, path), {
            method,
            headers: proxyHeaders(request),
            body,
            cache: "no-store"
        });
        const headers = new Headers(response.headers);
        headers.delete("content-encoding");
        headers.delete("content-length");
        headers.set("access-control-allow-origin", "*");
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers
        });
    } catch (error) {
        return Response.json({
            detail: error?.message || "Proxy request failed"
        }, {
            status: 502
        });
    }
}
async function GET(request, context) {
    return proxy(request, context);
}
async function POST(request, context) {
    return proxy(request, context);
}
async function PUT(request, context) {
    return proxy(request, context);
}
async function PATCH(request, context) {
    return proxy(request, context);
}
async function DELETE(request, context) {
    return proxy(request, context);
}
async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
            "access-control-allow-headers": "*"
        }
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__3937c2e9._.js.map