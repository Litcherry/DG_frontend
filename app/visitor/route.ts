import fs from "node:fs"
import path from "node:path"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function readText(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8")
}

function escapeScript(value: string) {
  return value.replace(/<\/script/gi, "<\\/script")
}

function buildLegacyRuntime(initialView: "visitor" | "routeMap") {
  const config = readText("src/config/live2d.js").replaceAll("export const", "const")
  const runtimeSource = readText("src/legacy/runtime.js")
    .replace(/import\s*\{[\s\S]*?\}\s*from\s*["']\.\.\/config\/live2d\.js["'];?/, "")
    .replace("export async function bootstrapLegacyApp()", "async function bootstrapLegacyApp()")

  return `
    localStorage.setItem("dg_api_base", window.location.origin);
    localStorage.setItem("dg_role", "visitor");
    localStorage.setItem("dg_visitor_name", localStorage.getItem("dg_visitor_name") || "访客");
    sessionStorage.setItem("dg_runtime_role", "visitor");
    sessionStorage.setItem("dg_visitor_entry", "next");
    window.__DG_INITIAL_VIEW = ${JSON.stringify(initialView)};
    ${config}
    ${runtimeSource}
    bootstrapLegacyApp().then(() => {
      if (window.__DG_INITIAL_VIEW && window.__DG_INITIAL_VIEW !== "visitor") {
        window.setTimeout(() => switchView(window.__DG_INITIAL_VIEW), 120);
      }
    }).catch((error) => {
      console.error(error);
      const toast = document.getElementById("toast");
      if (toast) {
        toast.textContent = error?.message || "游客端初始化失败";
        toast.classList.add("show");
      }
    });
  `
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const embedded = url.searchParams.get("embed") === "1"
  const initialView = url.searchParams.get("view") === "routeMap" ? "routeMap" : "visitor"
  const visitorTemplate = readText("src/templates/visitor.html")
  const routeTemplate = readText("src/templates/route-map.html")
  const feedbackTemplate = readText("src/templates/feedback.html")
  const adminTemplate = readText("src/templates/admin.html")
  const legacyCss = readText("src/styles/legacy.css")
  const legacyRuntime = buildLegacyRuntime(initialView)

  const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#168f91" />
    <title>DG 游客导览端</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script type="importmap">
      {
        "imports": {
          "three": "https://cdn.jsdelivr.net/npm/three@0.177.0/build/three.module.js",
          "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.177.0/examples/jsm/",
          "@pixiv/three-vrm": "https://cdn.jsdelivr.net/npm/@pixiv/three-vrm@3/lib/three-vrm.module.min.js",
          "@pixiv/three-vrm-animation": "https://cdn.jsdelivr.net/npm/@pixiv/three-vrm-animation@3/lib/three-vrm-animation.module.min.js"
        }
      }
    </script>
    <style>${legacyCss}${embedded ? `
      body.embedded-visitor {
        min-height: 100vh;
        overflow: hidden;
        background: #fff;
      }
      body.embedded-visitor .app-shell {
        grid-template-columns: 1fr;
        height: 100vh;
        min-height: 100vh;
      }
      body.embedded-visitor .sidebar {
        display: none !important;
      }
      body.embedded-visitor .main-area {
        min-height: 100vh;
        height: 100vh;
        padding: 0;
        overflow: hidden;
      }
      body.embedded-visitor .view.active {
        min-height: 100vh;
        height: 100vh;
      }
      body.embedded-visitor .visitor-layout {
        min-height: 100vh;
        height: 100vh;
        gap: 14px;
      }
      body.embedded-visitor.history-open .visitor-layout,
      body.embedded-visitor:not(.history-open) .visitor-layout {
        height: 100vh;
        min-height: 100vh;
      }
      body.embedded-visitor .guide-column,
      body.embedded-visitor .chat-shell,
      body.embedded-visitor .history-panel {
        height: 100vh;
        max-height: 100vh;
      }
      body.embedded-visitor #visitorView .guide-column {
        flex: 0 0 min(700px, 44vw);
        width: min(700px, 44vw);
        max-width: min(700px, 44vw);
      }
      body.embedded-visitor #visitorView .chat-shell {
        min-width: 0;
      }
      body.embedded-visitor #visitorView .history-panel {
        flex: 0 0 282px;
        width: 282px;
      }
      body.embedded-visitor:not(.history-open) #visitorView .history-panel {
        flex-basis: 46px;
        width: 46px;
      }
      body.embedded-visitor .chat-messages,
      body.embedded-visitor .history-list {
        min-height: 0;
      }
      body.embedded-visitor #routeMapView.active,
      body.embedded-visitor #routeMapView .route-page {
        min-height: 100vh;
        height: 100vh;
      }
    ` : ""}</style>
  </head>
  <body class="in-app role-visitor${embedded ? " embedded-visitor" : ""}" data-visitor-entry="next">
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
</html>`

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  })
}
