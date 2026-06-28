module.exports = [
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/app/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/layout.tsx [app-rsc] (ecmascript)"));
}),
"[externals]/node:fs [external] (node:fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:fs", () => require("node:fs"));

module.exports = mod;
}),
"[externals]/node:path [external] (node:path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:path", () => require("node:path"));

module.exports = mod;
}),
"[project]/app/visitor/page.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>VisitorPage,
    "dynamic",
    ()=>dynamic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$10_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.0.10_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:fs [external] (node:fs, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:path [external] (node:path, cjs)");
;
;
;
const dynamic = "force-dynamic";
function readText(relativePath) {
    return __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["default"].readFileSync(__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(process.cwd(), relativePath), "utf8");
}
function extractTemplate(vueSource) {
    return vueSource.replace(/^[\s\S]*?<template>/, "").replace(/<\/template>[\s\S]*$/, "").trim();
}
function buildLegacyRuntime() {
    const config = readText("src/config/live2d.js").replaceAll("export const", "const");
    const runtime = readText("src/legacy/runtime.js").replace(/import\s*\{[\s\S]*?\}\s*from\s*["']\.\.\/config\/live2d\.js["'];?/, "").replace("export async function bootstrapLegacyApp()", "async function bootstrapLegacyApp()");
    return `
    const frontendOrigin = window.parent?.location?.origin || window.location.origin;
    localStorage.setItem("dg_api_base", frontendOrigin);
    localStorage.setItem("dg_role", "visitor");
    localStorage.setItem("dg_visitor_name", localStorage.getItem("dg_visitor_name") || "访客");
    sessionStorage.setItem("dg_runtime_role", "visitor");
    ${config}
    ${runtime}
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
function escapeScript(value) {
    return value.replace(/<\/script/gi, "<\\/script");
}
function VisitorPage() {
    const authTemplate = extractTemplate(readText("src/components/views/AuthView.vue"));
    const visitorTemplate = readText("src/templates/visitor.html");
    const routeTemplate = readText("src/templates/route-map.html");
    const feedbackTemplate = readText("src/templates/feedback.html");
    const adminTemplate = readText("src/templates/admin.html");
    const legacyCss = readText("src/styles/legacy.css");
    const legacyRuntime = buildLegacyRuntime();
    const legacyShell = `
    ${authTemplate}
    <div id="appShell" class="app-shell hidden">
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
        <button id="logoutBtn" class="ghost wide" type="button">退出当前身份</button>
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
  `;
    const srcDoc = `<!doctype html>
    <html lang="zh-CN">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>DG 游客导览端</title>
        <style>${legacyCss}</style>
      </head>
      <body>
        ${legacyShell}
        <script src="/vendor/live2d/pixi.min.js"></script>
        <script src="/vendor/live2d/live2dcubismcore.min.js"></script>
        <script src="/vendor/live2d/pixi-live2d-display-cubism4.min.js"></script>
        <script type="module">${escapeScript(legacyRuntime)}</script>
      </body>
    </html>`;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$10_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("iframe", {
        title: "DG 游客导览端",
        srcDoc: srcDoc,
        className: "block h-screen w-full border-0",
        allow: "microphone; autoplay",
        sandbox: "allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
    }, void 0, false, {
        fileName: "[project]/app/visitor/page.tsx",
        lineNumber: 98,
        columnNumber: 5
    }, this);
}
}),
"[project]/app/visitor/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/visitor/page.tsx [app-rsc] (ecmascript)"));
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__3b79ca0c._.js.map