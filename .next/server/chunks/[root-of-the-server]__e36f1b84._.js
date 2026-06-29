module.exports=[18622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},70406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},93695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},2157,(e,t,r)=>{t.exports=e.x("node:fs",()=>require("node:fs"))},50227,(e,t,r)=>{t.exports=e.x("node:path",()=>require("node:path"))},63146,e=>{"use strict";var t=e.i(47909),r=e.i(74017),i=e.i(96250),a=e.i(59756),s=e.i(61916),o=e.i(14444),n=e.i(37092),d=e.i(69741),l=e.i(16795),c=e.i(87718),p=e.i(95169),u=e.i(47587),h=e.i(66012),v=e.i(70101),m=e.i(26937),g=e.i(10372),b=e.i(93695);e.i(52474);var y=e.i(220),f=e.i(2157),x=e.i(50227);function w(e){return f.default.readFileSync(x.default.join(process.cwd(),e),"utf8")}async function R(e){let t,r,i=new URL(e.url),a="1"===i.searchParams.get("embed"),s="routeMap"===i.searchParams.get("view")?"routeMap":"visitor",o=w("src/templates/visitor.html"),n=w("src/templates/route-map.html"),d=w("src/templates/feedback.html"),l=w("src/templates/admin.html"),c=w("src/styles/legacy.css"),p=(t=w("src/config/live2d.js").replaceAll("export const","const"),r=w("src/legacy/runtime.js").replace(/import\s*\{[\s\S]*?\}\s*from\s*["']\.\.\/config\/live2d\.js["'];?/,"").replace("export async function bootstrapLegacyApp()","async function bootstrapLegacyApp()"),`
    localStorage.setItem("dg_api_base", window.location.origin);
    localStorage.setItem("dg_role", "visitor");
    localStorage.setItem("dg_visitor_name", localStorage.getItem("dg_visitor_name") || "访客");
    sessionStorage.setItem("dg_runtime_role", "visitor");
    sessionStorage.setItem("dg_visitor_entry", "next");
    window.__DG_INITIAL_VIEW = ${JSON.stringify(s)};
    ${t}
    ${r}
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
  `);return new Response(`<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#168f91" />
    <title>DG 游客导览端</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>${c}${a?`
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
      body.embedded-visitor .chat-messages,
      body.embedded-visitor .history-list {
        min-height: 0;
      }
      body.embedded-visitor #routeMapView.active,
      body.embedded-visitor #routeMapView .route-page {
        min-height: 100vh;
        height: 100vh;
      }
    `:""}</style>
  </head>
  <body class="in-app role-visitor${a?" embedded-visitor":""}" data-visitor-entry="next">
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
          ${o}
          ${n}
          ${d}
          ${l}
        </div>
      </main>
    </div>
    <div id="toast" class="toast"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="/vendor/live2d/pixi.min.js"></script>
    <script src="/vendor/live2d/live2dcubismcore.min.js"></script>
    <script src="/vendor/live2d/pixi-live2d-display-cubism4.min.js"></script>
    <script type="module">${p.replace(/<\/script/gi,"<\\/script")}</script>
  </body>
</html>`,{headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store"}})}e.s(["GET",()=>R,"dynamic",0,"force-dynamic","runtime",0,"nodejs"],81346);var E=e.i(81346);let _=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/visitor/route",pathname:"/visitor",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/app/visitor/route.ts",nextConfigOutput:"",userland:E}),{workAsyncStorage:I,workUnitAsyncStorage:A,serverHooks:C}=_;function T(){return(0,i.patchFetch)({workAsyncStorage:I,workUnitAsyncStorage:A})}async function N(e,t,i){_.isDev&&(0,a.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let f="/visitor/route";f=f.replace(/\/index$/,"")||"/";let x=await _.prepare(e,t,{srcPage:f,multiZoneDraftMode:!1});if(!x)return t.statusCode=400,t.end("Bad Request"),null==i.waitUntil||i.waitUntil.call(i,Promise.resolve()),null;let{buildId:w,params:R,nextConfig:E,parsedUrl:I,isDraftMode:A,prerenderManifest:C,routerServerContext:T,isOnDemandRevalidate:N,revalidateOnlyGenerated:S,resolvedPathname:k,clientReferenceManifest:P,serverActionsManifest:j}=x,O=(0,d.normalizeAppPath)(f),q=!!(C.dynamicRoutes[O]||C.routes[k]),M=async()=>((null==T?void 0:T.render404)?await T.render404(e,t,I,!1):t.end("This page could not be found"),null);if(q&&!A){let e=!!C.routes[k],t=C.dynamicRoutes[O];if(t&&!1===t.fallback&&!e){if(E.experimental.adapterPath)return await M();throw new b.NoFallbackError}}let $=null;!q||_.isDev||A||($="/index"===($=k)?"/":$);let D=!0===_.isDev||!q,H=q&&!D;j&&P&&(0,o.setReferenceManifestsSingleton)({page:f,clientReferenceManifest:P,serverActionsManifest:j,serverModuleMap:(0,n.createServerModuleMap)({serverActionsManifest:j})});let U=e.method||"GET",L=(0,s.getTracer)(),V=L.getActiveScopeSpan(),G={params:R,prerenderManifest:C,renderOpts:{experimental:{authInterrupts:!!E.experimental.authInterrupts},cacheComponents:!!E.cacheComponents,supportsDynamicResponse:D,incrementalCache:(0,a.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:E.cacheLife,waitUntil:i.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,i)=>_.onRequestError(e,t,i,T)},sharedContext:{buildId:w}},F=new l.NodeNextRequest(e),B=new l.NodeNextResponse(t),K=c.NextRequestAdapter.fromNodeNextRequest(F,(0,c.signalFromNodeResponse)(t));try{let o=async e=>_.handle(K,G).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=L.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==p.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let i=r.get("next.route");if(i){let t=`${U} ${i}`;e.setAttributes({"next.route":i,"http.route":i,"next.span_name":t}),e.updateName(t)}else e.updateName(`${U} ${f}`)}),n=!!(0,a.getRequestMeta)(e,"minimalMode"),d=async a=>{var s,d;let l=async({previousCacheEntry:r})=>{try{if(!n&&N&&S&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let s=await o(a);e.fetchMetrics=G.renderOpts.fetchMetrics;let d=G.renderOpts.pendingWaitUntil;d&&i.waitUntil&&(i.waitUntil(d),d=void 0);let l=G.renderOpts.collectedTags;if(!q)return await (0,h.sendResponse)(F,B,s,G.renderOpts.pendingWaitUntil),null;{let e=await s.blob(),t=(0,v.toNodeOutgoingHttpHeaders)(s.headers);l&&(t[g.NEXT_CACHE_TAGS_HEADER]=l),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==G.renderOpts.collectedRevalidate&&!(G.renderOpts.collectedRevalidate>=g.INFINITE_CACHE)&&G.renderOpts.collectedRevalidate,i=void 0===G.renderOpts.collectedExpire||G.renderOpts.collectedExpire>=g.INFINITE_CACHE?void 0:G.renderOpts.collectedExpire;return{value:{kind:y.CachedRouteKind.APP_ROUTE,status:s.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:i}}}}catch(t){throw(null==r?void 0:r.isStale)&&await _.onRequestError(e,t,{routerKind:"App Router",routePath:f,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:H,isOnDemandRevalidate:N})},T),t}},c=await _.handleResponse({req:e,nextConfig:E,cacheKey:$,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:C,isRoutePPREnabled:!1,isOnDemandRevalidate:N,revalidateOnlyGenerated:S,responseGenerator:l,waitUntil:i.waitUntil,isMinimalMode:n});if(!q)return null;if((null==c||null==(s=c.value)?void 0:s.kind)!==y.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==c||null==(d=c.value)?void 0:d.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});n||t.setHeader("x-nextjs-cache",N?"REVALIDATED":c.isMiss?"MISS":c.isStale?"STALE":"HIT"),A&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let p=(0,v.fromNodeOutgoingHttpHeaders)(c.value.headers);return n&&q||p.delete(g.NEXT_CACHE_TAGS_HEADER),!c.cacheControl||t.getHeader("Cache-Control")||p.get("Cache-Control")||p.set("Cache-Control",(0,m.getCacheControlHeader)(c.cacheControl)),await (0,h.sendResponse)(F,B,new Response(c.value.body,{headers:p,status:c.value.status||200})),null};V?await d(V):await L.withPropagatedContext(e.headers,()=>L.trace(p.BaseServerSpan.handleRequest,{spanName:`${U} ${f}`,kind:s.SpanKind.SERVER,attributes:{"http.method":U,"http.target":e.url}},d))}catch(t){if(t instanceof b.NoFallbackError||await _.onRequestError(e,t,{routerKind:"App Router",routePath:O,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:H,isOnDemandRevalidate:N})}),q)throw t;return await (0,h.sendResponse)(F,B,new Response(null,{status:500})),null}}e.s(["handler",()=>N,"patchFetch",()=>T,"routeModule",()=>_,"serverHooks",()=>C,"workAsyncStorage",()=>I,"workUnitAsyncStorage",()=>A],63146)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__e36f1b84._.js.map