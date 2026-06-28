(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/components/dg/api.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "apiBase",
    ()=>apiBase,
    "authHeaders",
    ()=>authHeaders,
    "clearToken",
    ()=>clearToken,
    "request",
    ()=>request,
    "requestWithTimeout",
    ()=>requestWithTimeout,
    "resolveMediaURL",
    ()=>resolveMediaURL,
    "setApiBase",
    ()=>setApiBase,
    "setToken",
    ()=>setToken,
    "splitTags",
    ()=>splitTags,
    "token",
    ()=>token
]);
"use client";
function apiBase() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    return (localStorage.getItem("dg_api_base") || "http://localhost:8000").replace(/\/$/, "");
}
function setApiBase(value) {
    localStorage.setItem("dg_api_base", value.replace(/\/$/, ""));
}
function token() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    return localStorage.getItem("dg_admin_token") || "";
}
function setToken(value) {
    localStorage.setItem("dg_admin_token", value);
    localStorage.setItem("dg_role", "admin");
}
function clearToken() {
    localStorage.removeItem("dg_admin_token");
    localStorage.removeItem("dg_role");
}
function authHeaders(extra = {}) {
    const current = token();
    return {
        ...extra,
        ...current ? {
            Authorization: `Bearer ${current}`
        } : {}
    };
}
function readErrorMessage(text, fallback) {
    if (!text) return fallback;
    try {
        const data = JSON.parse(text);
        if (Array.isArray(data.detail)) return data.detail.map((item)=>item.msg).join(", ");
        return data.detail || data.message || fallback;
    } catch  {
        return text;
    }
}
async function request(path, options = {}) {
    const res = await fetch(`${apiBase()}${path}`, options);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(readErrorMessage(text, `Request failed (${res.status})`));
    }
    const type = res.headers.get("content-type") || "";
    return type.includes("application/json") ? res.json() : res;
}
async function requestWithTimeout(path, options = {}, timeoutMs = 12000) {
    const controller = new AbortController();
    const timer = window.setTimeout(()=>controller.abort(), timeoutMs);
    try {
        return await request(path, {
            ...options,
            signal: controller.signal
        });
    } finally{
        window.clearTimeout(timer);
    }
}
function resolveMediaURL(value = "") {
    const source = String(value || "").trim();
    if (!source) return "";
    if (/^(?:https?:|data:|blob:)/i.test(source)) return source;
    return `${apiBase()}${source.startsWith("/") ? "" : "/"}${source}`;
}
function splitTags(value) {
    return value.split(/[,，、]/).map((item)=>item.trim()).filter(Boolean);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/logout/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LogoutPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$10_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.0.10_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$10_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.0.10_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$10_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.0.10_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$dg$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/dg/api.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function LogoutPage() {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$10_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$10_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "LogoutPage.useEffect": ()=>{
            async function logout() {
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$dg$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["request"])("/api/auth/logout", {
                    method: "POST",
                    headers: (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$dg$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authHeaders"])()
                }).catch({
                    "LogoutPage.useEffect.logout": ()=>null
                }["LogoutPage.useEffect.logout"]);
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$dg$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clearToken"])();
                router.replace("/");
            }
            logout();
        }
    }["LogoutPage.useEffect"], [
        router
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$10_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        className: "grid min-h-screen place-items-center bg-background text-sm text-muted-foreground",
        children: "正在退出登录..."
    }, void 0, false, {
        fileName: "[project]/app/logout/page.tsx",
        lineNumber: 19,
        columnNumber: 10
    }, this);
}
_s(LogoutPage, "vQduR7x+OPXj6PSmJyFnf+hU7bg=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$10_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = LogoutPage;
var _c;
__turbopack_context__.k.register(_c, "LogoutPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/node_modules/.pnpm/next@16.0.10_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/navigation.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {

module.exports = __turbopack_context__.r("[project]/node_modules/.pnpm/next@16.0.10_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/client/components/navigation.js [app-client] (ecmascript)");
}),
]);

//# sourceMappingURL=_369d2317._.js.map