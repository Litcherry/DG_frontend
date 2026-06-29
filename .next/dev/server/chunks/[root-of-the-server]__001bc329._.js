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
"[externals]/node:fs [external] (node:fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:fs", () => require("node:fs"));

module.exports = mod;
}),
"[externals]/node:path [external] (node:path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:path", () => require("node:path"));

module.exports = mod;
}),
"[project]/app/visitor/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "dynamic",
    ()=>dynamic,
    "runtime",
    ()=>runtime
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:fs [external] (node:fs, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:path [external] (node:path, cjs)");
;
;
const dynamic = "force-dynamic";
const runtime = "nodejs";
function readText(relativePath) {
    return __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["default"].readFileSync(__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(process.cwd(), relativePath), "utf8");
}
function escapeScript(value) {
    return value.replace(/<\/script/gi, "<\\/script");
}
function buildLegacyRuntime() {
    const config = readText("src/config/live2d.js").replaceAll("export const", "const");
    const runtimeSource = readText("src/legacy/runtime.js").replace(/import\s*\{[\s\S]*?\}\s*from\s*["']\.\.\/config\/live2d\.js["'];?/, "").replace("export async function bootstrapLegacyApp()", "async function bootstrapLegacyApp()");
    return `
    localStorage.setItem("dg_api_base", window.location.origin);
    localStorage.setItem("dg_role", "visitor");
    localStorage.setItem("dg_visitor_name", localStorage.getItem("dg_visitor_name") || "访客");
    sessionStorage.setItem("dg_runtime_role", "visitor");
    sessionStorage.setItem("dg_visitor_entry", "next");
    ${config}
    ${runtimeSource}
    bootstrapLegacyApp().catch((error) => {
      console.error(error);
      const toast = document.getElementById("toast");
      if (toast) {
        toast.textContent = error?.message || "游客端初始化失败";
        toast.classList.add("show");
      }
    });
  `;
}
async function GET() {
    const visitorTemplate = readText("src/templates/visitor.html");
    const routeTemplate = readText("src/templates/route-map.html");
    const feedbackTemplate = readText("src/templates/feedback.html");
    const adminTemplate = readText("src/templates/admin.html");
    const legacyCss = readText("src/styles/legacy.css");
    const legacyRuntime = buildLegacyRuntime();
    const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#168f91" />
    <title>DG 游客导览端</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>${legacyCss}</style>
  </head>
  <body class="in-app role-visitor" data-visitor-entry="next">
    <div id="appShell" class="app-shell">
      <aside id="sidebar" class="sidebar">
        <button id="sidebarToggle" class="sidebar-toggle" type="button" title="收起侧栏" aria-label="收起侧栏">
          <span class="panel-toggle-icon"></span>
        </button>
        <div class="brand-row compact">
          <div class="brand-mark">DG</div>
          <div class="sidebar-text">
            <strong>AI 数字人导览</strong>
            <span id="sessionLabel">游客：访客</span>
          </div>
        </div>
        <nav id="roleNav" class="nav"></nav>
        <div class="sidebar-footer-actions">
          <button id="homeBtn" class="ghost wide" type="button">返回首页</button>
          <button id="logoutBtn" class="ghost wide" type="button">退出当前身份</button>
        </div>
      </aside>
      <main class="main-area">
        <div id="deferredViews">
          ${visitorTemplate}
          ${routeTemplate}
          ${feedbackTemplate}
          ${adminTemplate}
        </div>
      </main>
    </div>
    <div id="toast" class="toast"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="/vendor/live2d/pixi.min.js"></script>
    <script src="/vendor/live2d/live2dcubismcore.min.js"></script>
    <script src="/vendor/live2d/pixi-live2d-display-cubism4.min.js"></script>
    <script type="module">${escapeScript(legacyRuntime)}</script>
  </body>
</html>`;
    return new Response(html, {
        headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "no-store"
        }
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__001bc329._.js.map