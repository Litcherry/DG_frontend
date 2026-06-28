import fs from "node:fs"
import path from "node:path"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function readText(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8")
}

function extractTemplate(vueSource: string) {
  return vueSource.replace(/^[\s\S]*?<template>/, "").replace(/<\/template>[\s\S]*$/, "").trim()
}

function escapeScript(value: string) {
  return value.replace(/<\/script/gi, "<\\/script")
}

function buildLegacyRuntime() {
  const config = readText("src/config/live2d.js").replaceAll("export const", "const")
  const runtimeSource = readText("src/legacy/runtime.js")
    .replace(/import\s*\{[\s\S]*?\}\s*from\s*["']\.\.\/config\/live2d\.js["'];?/, "")
    .replace("export async function bootstrapLegacyApp()", "async function bootstrapLegacyApp()")

  return `
    localStorage.setItem("dg_api_base", window.location.origin);
    localStorage.setItem("dg_role", "visitor");
    localStorage.setItem("dg_visitor_name", localStorage.getItem("dg_visitor_name") || "访客");
    sessionStorage.setItem("dg_runtime_role", "visitor");
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
  `
}

export async function GET() {
  const authTemplate = extractTemplate(readText("src/components/views/AuthView.vue"))
  const visitorTemplate = readText("src/templates/visitor.html")
  const routeTemplate = readText("src/templates/route-map.html")
  const feedbackTemplate = readText("src/templates/feedback.html")
  const adminTemplate = readText("src/templates/admin.html")
  const legacyCss = readText("src/styles/legacy.css")
  const legacyRuntime = buildLegacyRuntime()

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
  <body>
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
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="/vendor/live2d/pixi.min.js"></script>
    <script src="/vendor/live2d/live2dcubismcore.min.js"></script>
    <script src="/vendor/live2d/pixi-live2d-display-cubism4.min.js"></script>
    <script type="module">${escapeScript(legacyRuntime)}</script>
  </body>
</html>`

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  })
}
