# A5 景区导览服务 AI 数字人前端

前端已迁移为 **Vue 3 + Vite**，对接 `DG_backend` 的 FastAPI 接口和 `DG_ai` 的流式问答能力。

## 技术栈

- Vue 3：页面组件与应用入口
- Vite 6：开发服务器与生产构建
- 原生 JavaScript 兼容运行时：承载已稳定的聊天、语音、Live2D 和地图逻辑
- Leaflet：景区地图和路线展示
- PixiJS + pixi-live2d-display：Live2D 数字人
- Fetch / SSE：接口调用和流式回答
- Web Speech API：浏览器语音输入

## 目录结构

```text
DG_frontend/
├─ src/
│  ├─ App.vue
│  ├─ main.js
│  ├─ components/
│  │  ├─ layout/AppShell.vue
│  │  └─ views/
│  │     ├─ AuthView.vue
│  │     ├─ VisitorWorkspace.vue
│  │     ├─ RoutePlannerView.vue
│  │     ├─ FeedbackView.vue
│  │     └─ AdminConsole.vue
│  ├─ services/api.js
│  ├─ config/live2d.js
│  ├─ composables/usePersistentState.js
│  ├─ legacy/runtime.js
│  ├─ templates/             # Vue 视图组件的外部模板
│  └─ styles/legacy.css
├─ assets/                # Live2D 模型等运行资源
├─ vendor/                # PixiJS / Cubism 运行库
├─ vite.config.js
└─ package.json
```

`src/legacy/runtime.js` 是渐进迁移兼容层。目前它保留了已经调试稳定的 SSE、TTS、Live2D、Leaflet 和后台业务逻辑，后续可继续拆分为 `useChat`、`useSpeech`、`useLive2D`、`useRouteMap` 等 composables。

## 开发启动

先启动后端和 AI 服务，然后：

```powershell
cd C:\Project_vscode\DG\DG_frontend
npm install
npm run dev
```

访问：

```text
http://127.0.0.1:5173
```

不能再使用旧的 Python 静态服务器直接运行源码，因为浏览器无法自行编译 `.vue` 文件。

## 生产构建

```powershell
npm run build
npm run preview
```

构建结果位于 `dist/`。Vite 构建结束后会自动复制 `assets/` 和 `vendor/`，确保 Live2D 模型和运行库可以部署。

## 常用命令

```powershell
npm run dev       # 开发模式
npm run build     # 生产构建
npm run preview   # 预览生产包
```

浏览器语音输入需要麦克风权限，建议始终通过 `localhost` 或 `127.0.0.1` 访问。
