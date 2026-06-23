# DG Frontend Architecture

## Current architecture

```text
Vue App
├─ AuthView
└─ AppShell
   ├─ VisitorWorkspace
   ├─ RoutePlannerView
   ├─ FeedbackView
   └─ AdminConsole
```

The Vue application owns startup, page composition and production builds. Existing stable domain behavior is loaded through `src/legacy/runtime.js`.

```text
Vue components
    ↓
Legacy compatibility runtime
    ├─ Conversation and SSE
    ├─ ASR and TTS
    ├─ Live2D lifecycle and lip sync
    ├─ Leaflet route planning
    └─ Admin data operations
    ↓
DG_backend / DG_ai
```

## Module responsibilities

| Path | Responsibility |
| --- | --- |
| `src/App.vue` | Vue application startup and error boundary |
| `src/components/layout` | Shared application shell |
| `src/components/views` | Visitor, route, feedback and admin views |
| `src/templates` | External templates compiled by Vue |
| `src/services` | HTTP and backend API access |
| `src/config` | Stable application and Live2D configuration |
| `src/composables` | Reusable Vue state and lifecycle logic |
| `src/legacy/runtime.js` | Compatibility layer for migrated domain behavior |
| `src/styles/legacy.css` | Existing visual system during progressive migration |

## Recommended next refactors

Refactor one domain at a time while keeping behavior covered:

1. Extract `useConversation()` and `conversationApi`.
2. Extract `useSpeechRecognition()` and `useSpeechPlayback()`.
3. Extract `useLive2D()` with explicit mount/unmount lifecycle.
4. Extract `useRouteMap()` and scenic spot data.
5. Move admin dashboard and knowledge management to reactive Vue state.
6. Split `legacy.css` into base, visitor, route and admin styles.

Do not rewrite all domains simultaneously. Live2D, Web Audio and Leaflet each keep browser resources that must be disposed when Vue components unmount.
