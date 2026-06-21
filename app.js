const state = {
  apiBase: localStorage.getItem("dg_api_base") || "http://localhost:8000",
  token: localStorage.getItem("dg_admin_token") || "",
  role: localStorage.getItem("dg_role") || "",
  visitorName: localStorage.getItem("dg_visitor_name") || "",
  conversationId: "",
  interests: [],
  selectedRating: 5,
  recorder: null,
  chunks: [],
  audio: null,
  audioContext: null,
  lipSyncFrame: null,
  recognition: null,
  isListening: false,
  recognitionSessionId: 0,
  ignoreRecognitionResults: false,
  speechQueue: [],
  speechPlaying: false,
  isAIResponding: false,
  speechRunId: 0,
  speechSegmentsQueued: 0,
  ttsRequestSeq: 0,
  speechFetchControllers: new Set(),
  generationAbort: null,
  activeReader: null,
  routeRequestAbort: null,
  live2dApp: null,
  live2dModel: null,
  live2dResizeObserver: null,
  live2dInitPromise: null,
  live2dSpeaking: false,
  live2dMouthValue: 0,
  live2dRenderedMouth: 0,
  live2dMouthUpdateHandler: null,
  live2dLifecycleId: 0,
  browserMouthTimer: null,
  liveTalkingPc: null,
  liveTalkingSessionId: "",
  liveTalkingConnected: false,
  liveTalkingBase: localStorage.getItem("dg_livetalking_base") || "http://127.0.0.1:8010",
  avatarEngine: "live2d",
  humanConfig: null,
  visitorHumanConfig: JSON.parse(localStorage.getItem("dg_visitor_human_config") || "null"),
  history: JSON.parse(localStorage.getItem("dg_conversation_history") || "[]"),
  routeMap: null,
  routeMarkers: [],
  routePolyline: null,
  routeSpots: [],
  selectedRouteSpot: -1,
  latestRoutePlan: JSON.parse(localStorage.getItem("dg_latest_route_plan") || "null"),
  routeCatalogLoaded: false,
  routeCatalogLoading: null,
  latestRoutePreference: "",
};

const $ = (id) => document.getElementById(id);
const defaultInterests = ["历史文化", "自然风光", "休闲娱乐", "亲子游", "摄影打卡"];
const scenicSpots = [
  {
    id: "lingshan_screen",
    name: "灵山大照壁",
    aliases: ["大照壁", "灵山照壁"],
    lat: 31.41915,
    lng: 120.091,
    intro: "灵山胜境入口处的标志性景观，也是进入景区后的第一处文化序章。",
    duration: "10分钟",
    tags: ["入口景观", "佛教文化", "拍照打卡"],
  },
  {
    id: "shengjing_square",
    name: "胜境广场",
    aliases: ["灵山胜境广场"],
    lat: 31.41985,
    lng: 120.09165,
    intro: "开阔舒适的入园集散空间，适合整理行程并了解景区整体布局。",
    duration: "10分钟",
    tags: ["休闲漫步", "游客集散"],
  },
  {
    id: "wuming_bridge",
    name: "五明桥",
    aliases: ["五明桥景点"],
    lat: 31.4202,
    lng: 120.09235,
    intro: "五座汉白玉石拱桥并列横跨香水海，寓意佛教五种核心智慧。",
    duration: "10分钟",
    tags: ["佛教文化", "建筑艺术", "拍照打卡"],
  },
  {
    id: "buddha_foot",
    name: "佛足坛",
    aliases: ["佛足印", "佛足坛景点"],
    lat: 31.42075,
    lng: 120.0922,
    intro: "以佛足印为核心的文化景观，可在此感受庄重安宁的礼佛氛围。",
    duration: "15分钟",
    tags: ["佛教文化", "人文景观"],
  },
  {
    id: "hundred_children_maitreya",
    name: "百子戏弥勒",
    aliases: ["百子弥勒", "弥勒佛"],
    lat: 31.4213,
    lng: 120.09275,
    intro: "生动活泼的弥勒主题群像，寓意欢喜、包容与吉祥。",
    duration: "15分钟",
    tags: ["亲子游", "佛教文化", "雕塑艺术"],
  },
  {
    id: "nine_dragons",
    name: "九龙灌浴",
    aliases: ["九龙灌浴广场", "九龙灌浴表演"],
    lat: 31.42205,
    lng: 120.0932,
    intro: "大型动态音乐群雕景观，通过声光水景呈现佛陀诞生故事。",
    duration: "25分钟",
    tags: ["核心景点", "演艺景观", "亲子游"],
  },
  {
    id: "bodhi_avenue",
    name: "菩提大道",
    aliases: ["菩提路"],
    lat: 31.42305,
    lng: 120.0936,
    intro: "连接景区重要文化节点的景观步道，绿意舒展，适合慢行游览。",
    duration: "20分钟",
    tags: ["自然风光", "休闲漫步", "拍照打卡"],
  },
  {
    id: "buddha_hand_square",
    name: "佛手广场",
    aliases: ["天下第一掌", "佛手"],
    lat: 31.42395,
    lng: 120.0938,
    intro: "以大型佛手造像为核心的特色广场，是游客喜爱的互动打卡点。",
    duration: "15分钟",
    tags: ["拍照打卡", "佛教文化"],
  },
  {
    id: "xiangfu_temple",
    name: "祥符禅寺",
    aliases: ["祥符寺", "禅寺"],
    lat: 31.425,
    lng: 120.0942,
    intro: "历史悠久的佛教寺院建筑群，适合静心参访并了解寺院文化。",
    duration: "30分钟",
    tags: ["佛教文化", "历史建筑", "静心参访"],
  },
  {
    id: "buddha_square",
    name: "佛前广场",
    aliases: ["大佛广场"],
    lat: 31.42655,
    lng: 120.0949,
    intro: "仰望灵山大佛的主要观景空间，视野开阔，仪式感鲜明。",
    duration: "15分钟",
    tags: ["核心景点", "观景", "拍照打卡"],
  },
  {
    id: "lingshan_buddha",
    name: "灵山大佛",
    aliases: ["大佛", "灵山大佛景区"],
    lat: 31.42755,
    lng: 120.0953,
    intro: "灵山胜境核心景点之一，适合了解佛教文化与大型露天造像艺术。",
    duration: "40分钟",
    tags: ["佛教文化", "核心景点", "拍照打卡"],
  },
  {
    id: "lingshan_palace",
    name: "灵山梵宫",
    aliases: ["梵宫", "灵山宫"],
    lat: 31.4217,
    lng: 120.09745,
    intro: "融合建筑、壁画、雕塑与演艺艺术的文化地标，内部装饰华美。",
    duration: "45分钟",
    tags: ["建筑艺术", "佛教文化", "室内参观"],
  },
  {
    id: "five_mudra_mandala",
    name: "五印坛城",
    aliases: ["坛城", "五印坛城文化园"],
    lat: 31.4208,
    lng: 120.0987,
    intro: "具有鲜明藏式建筑特色的文化景观，可感受丰富的坛城艺术。",
    duration: "35分钟",
    tags: ["建筑艺术", "佛教文化", "拍照打卡"],
  },
  {
    id: "manfeilong_pagoda",
    name: "曼飞龙塔",
    aliases: ["飞龙塔", "曼飞龙佛塔"],
    lat: 31.4229,
    lng: 120.09905,
    intro: "造型精巧的佛塔景观，周边视野舒展，适合文化参观与摄影。",
    duration: "20分钟",
    tags: ["建筑艺术", "拍照打卡", "人文景观"],
  },
  {
    id: "lingshan_lodge",
    name: "灵山精舍",
    aliases: ["精舍"],
    lat: 31.42025,
    lng: 120.10005,
    intro: "环境清幽的禅意空间，适合短暂休息并体验东方生活美学。",
    duration: "20分钟",
    tags: ["休闲体验", "禅意空间"],
  },
  {
    id: "xingtan_square",
    name: "杏坛广场",
    aliases: ["杏坛"],
    lat: 31.42565,
    lng: 120.09455,
    intro: "位于礼佛主轴线上的开阔广场，是前往佛前广场与灵山大佛的重要节点。",
    duration: "10分钟",
    tags: ["佛教文化", "休闲漫步"],
  },
  {
    id: "sansheng_hall",
    name: "三圣殿",
    aliases: ["三圣堂"],
    lat: 31.42295,
    lng: 120.09765,
    intro: "以佛教造像与文化展示为主的殿堂，适合进一步了解佛教艺术与礼仪。",
    duration: "20分钟",
    tags: ["佛教文化", "人文景观"],
  },
  {
    id: "palace_square",
    name: "梵宫广场",
    aliases: ["灵山梵宫广场"],
    lat: 31.42125,
    lng: 120.09685,
    intro: "灵山梵宫前的开阔景观空间，可完整欣赏梵宫建筑群与周边环境。",
    duration: "15分钟",
    tags: ["建筑艺术", "自然风光", "拍照打卡"],
  },
  {
    id: "demon_relief",
    name: "降魔浮雕",
    aliases: ["降魔成道浮雕"],
    lat: 31.42045,
    lng: 120.0919,
    intro: "以佛教故事为主题的大型浮雕景观，通过细腻造型呈现降魔成道场景。",
    duration: "10分钟",
    tags: ["佛教文化", "雕塑艺术"],
  },
];
const live2dModels = {
  modern: "./assets/live2d/mark/runtime/mark_free_t04.model3.json",
  hanfu: "./assets/live2d/mark/runtime/mark_free_t04.model3.json",
  nature: "./assets/live2d/mark/runtime/mark_free_t04.model3.json",
};
const scriptCache = new Map();
const viewFragments = [
  "./views/visitor.html",
  "./views/route-map.html",
  "./views/feedback.html",
  "./views/admin.html",
];

async function loadViewFragments() {
  const root = $("deferredViews");
  const fragments = await Promise.all(viewFragments.map(async (path) => {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) throw new Error(`页面片段加载失败：${path}`);
    return response.text();
  }));
  root.innerHTML = fragments.join("\n");
}

function apiBase() {
  const input = $("apiBase");
  state.apiBase = (input?.value || state.apiBase || "http://localhost:8000").replace(/\/$/, "");
  localStorage.setItem("dg_api_base", state.apiBase);
  return state.apiBase;
}

function authHeaders(extra = {}) {
  return { ...extra, ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}) };
}

function readErrorMessage(text, fallback) {
  if (!text) return fallback;
  try {
    const data = JSON.parse(text);
    if (Array.isArray(data.detail)) return data.detail.map((item) => item.msg).join("；");
    return data.detail || data.message || fallback;
  } catch {
    return text;
  }
}

async function request(path, options = {}) {
  const res = await fetch(`${apiBase()}${path}`, options);
  if (!res.ok) {
    const text = await res.text();
    const message = readErrorMessage(text, `请求失败：${res.status}`);
    if (res.status === 401 && state.token) {
      clearExpiredLogin();
      throw new Error("登录已过期，请重新登录管理后台。");
    }
    throw new Error(message);
  }
  const type = res.headers.get("content-type") || "";
  return type.includes("application/json") ? res.json() : res;
}

function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => el.classList.remove("show"), 2600);
}

function setRoleForm(role) {
  $("visitorRoleBtn").classList.toggle("active", role === "visitor");
  $("adminRoleBtn").classList.toggle("active", role === "admin");
  $("visitorLoginForm").classList.toggle("active", role === "visitor");
  $("adminLoginForm").classList.toggle("active", role === "admin");
}

function clearExpiredLogin() {
  state.token = "";
  state.role = "";
  localStorage.removeItem("dg_admin_token");
  localStorage.removeItem("dg_role");
  $("authView").classList.remove("hidden");
  $("appShell").classList.add("hidden");
  document.body.classList.remove("in-app", "role-visitor", "role-admin", "history-open");
  setRoleForm("admin");
}

function enterApp(role) {
  const runtimeRole = sessionStorage.getItem("dg_runtime_role") || "";
  const reloadGuard = sessionStorage.getItem("dg_visitor_reload_guard") === "1";
  if (role === "visitor" && runtimeRole === "admin" && !reloadGuard) {
    state.role = "visitor";
    localStorage.setItem("dg_role", "visitor");
    sessionStorage.setItem("dg_visitor_reload_guard", "1");
    window.location.reload();
    return;
  }
  sessionStorage.removeItem("dg_visitor_reload_guard");
  sessionStorage.setItem("dg_runtime_role", role);
  state.role = role;
  localStorage.setItem("dg_role", role);
  $("authView").classList.add("hidden");
  $("appShell").classList.remove("hidden");
  document.body.classList.add("in-app");
  document.body.classList.toggle("role-visitor", role === "visitor");
  document.body.classList.toggle("role-admin", role === "admin");
  $("sessionLabel").textContent = role === "admin" ? "管理员工作台" : `游客：${state.visitorName || "临时游客"}`;
  renderRoleNavigation(role);

  if (role === "admin") {
    switchView("admin");
    switchAdminTab("dashboard");
  } else {
    switchView("visitor");
    window.requestAnimationFrame(ensureLive2DVisible);
  }
  renderHistoryList();
}

function renderRoleNavigation(role) {
  const nav = $("roleNav");
  if (!nav) return;
  const visitorItems = [
    ["visitor", "游", "游客交互端"],
    ["routeMap", "线", "游览路径规划"],
    ["feedbackPage", "评", "体验反馈打分"],
  ];
  const adminItems = [
    ["dashboard", "表", "仪表盘"],
    ["knowledge", "知", "知识库管理"],
    ["scenic", "景", "景区管理"],
    ["human", "人", "数字人配置"],
  ];
  nav.innerHTML = role === "admin"
    ? adminItems.map(([tab, icon, label], index) => `
      <button class="nav-item${index === 0 ? " active" : ""}" data-admin-tab="${tab}" type="button">
        <span class="nav-icon">${icon}</span><span class="nav-label">${label}</span>
      </button>`).join("")
    : visitorItems.map(([view, icon, label], index) => `
      <button class="nav-item${index === 0 ? " active" : ""}" data-view="${view}" type="button">
        <span class="nav-icon">${icon}</span><span class="nav-label">${label}</span>
      </button>`).join("");

  nav.querySelectorAll("[data-view]").forEach((button) => {
    button.onclick = () => switchView(button.dataset.view);
  });
  nav.querySelectorAll("[data-admin-tab]").forEach((button) => {
    button.onclick = () => {
      switchView("admin");
      switchAdminTab(button.dataset.adminTab);
    };
  });
}

function logout() {
  state.role = "";
  state.token = "";
  state.conversationId = "";
  localStorage.removeItem("dg_role");
  localStorage.removeItem("dg_admin_token");
  $("authView").classList.remove("hidden");
  $("appShell").classList.add("hidden");
  document.body.classList.remove("in-app", "role-visitor", "role-admin", "history-open");
  setRoleForm("visitor");
}

function switchView(view) {
  if (view === "admin" && state.role !== "admin") {
    toast("请先登录管理后台");
    return;
  }
  if (["routeMap", "feedbackPage"].includes(view) && state.role !== "visitor") {
    toast("请先进入游客交互端");
    return;
  }
  document.querySelectorAll(".nav-item").forEach((btn) => btn.classList.toggle("active", btn.dataset.view === view));
  $("visitorView").classList.toggle("active", view === "visitor");
  $("routeMapView").classList.toggle("active", view === "routeMap");
  $("feedbackPageView").classList.toggle("active", view === "feedbackPage");
  $("adminView").classList.toggle("active", view === "admin");
  moveLive2DStage(view === "routeMap" ? "route" : "home");
  if (state.live2dApp) {
    if (view === "visitor" || view === "routeMap") {
      state.live2dApp.start?.();
    } else {
      state.live2dApp.stop?.();
    }
  }
  if (view === "visitor" && state.avatarEngine === "live2d") {
    restoreLive2DAfterNavigation();
  }
  if (view === "routeMap") {
    window.setTimeout(() => {
      restoreLive2DAfterNavigation();
      initDraggableAssistantPanel();
      initRouteMap();
      state.routeMap?.invalidateSize();
      hydrateScenicSpotsFromBackend().finally(() => {
        if (state.latestRoutePlan) renderRoutePlan(state.latestRoutePlan);
      });
    }, 80);
  }
}

function moveLive2DStage(target = "home") {
  const stage = $("openAvatarStage");
  const dock = target === "route" ? $("routeLive2DDock") : $("live2dHomeDock");
  if (!stage || !dock || stage.parentElement === dock) return;
  dock.appendChild(stage);
  stage.classList.toggle("route-avatar-stage", target === "route");
}

function restoreLive2DAfterNavigation() {
  const canvas = $("live2dCanvas");
  if (!canvas) return;
  canvas.style.visibility = "hidden";
  const restore = () => {
    ensureLive2DVisible();
    resizeLive2DStage();
    if (state.live2dModel) {
      state.live2dModel.visible = true;
      styleLive2DModel();
    }
    state.live2dApp?.renderer?.render?.(state.live2dApp.stage);
  };
  window.requestAnimationFrame(() => {
    restore();
    window.requestAnimationFrame(() => {
      restore();
      canvas.style.visibility = "visible";
    });
  });
}

function switchAdminTab(tab) {
  document.querySelectorAll("[data-admin-tab]").forEach((btn) => btn.classList.toggle("active", btn.dataset.adminTab === tab));
  document.querySelectorAll(".admin-tab").forEach((panel) => panel.classList.remove("active"));
  $(`${tab}Tab`).classList.add("active");
  if (tab === "dashboard") loadDashboard().catch((err) => toast(err.message));
  if (tab === "knowledge") loadKnowledge().catch((err) => toast(err.message));
  if (tab === "scenic") loadScenic().catch((err) => toast(err.message));
  if (tab === "human") loadHumanConfig().catch((err) => toast(err.message));
}

function switchAdminSubtab(group, targetId) {
  document.querySelectorAll(`[data-subtab-group="${group}"]`).forEach((button) => {
    button.classList.toggle("active", button.dataset.subtabTarget === targetId);
  });
  document.querySelectorAll(`[data-subtab-panel="${group}"]`).forEach((panel) => {
    panel.classList.toggle("active", panel.id === targetId);
  });
  localStorage.setItem(`dg_admin_subtab_${group}`, targetId);
}

function restoreAdminSubtabs() {
  ["knowledge", "scenic"].forEach((group) => {
    const fallback = document.querySelector(`[data-subtab-group="${group}"].active`)?.dataset.subtabTarget;
    const saved = localStorage.getItem(`dg_admin_subtab_${group}`);
    const target = saved && document.getElementById(saved) ? saved : fallback;
    if (target) switchAdminSubtab(group, target);
  });
}

function toggleSidebar() {
  document.body.classList.toggle("sidebar-collapsed");
  localStorage.setItem("dg_sidebar_collapsed", document.body.classList.contains("sidebar-collapsed") ? "1" : "0");
}

function setHistoryOpen(open) {
  document.body.classList.toggle("history-open", open);
  const toggle = $("historyToggleBtn");
  if (toggle) toggle.textContent = open ? "收起历史" : "历史对话";
  $("historyCloseBtn").title = open ? "收起会话栏" : "展开会话栏";
  $("historyCloseBtn").setAttribute("aria-label", open ? "收起会话栏" : "展开会话栏");
}

function closeHistoryMenus() {
  document.querySelectorAll(".history-item-wrap.menu-open, .history-item-wrap.menu-up").forEach((item) => {
    item.classList.remove("menu-open", "menu-up");
  });
}

function loadScriptOnce(src) {
  if (scriptCache.has(src)) return scriptCache.get(src);
  const promise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      if (existing.dataset.loaded === "1") resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "1";
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
  scriptCache.set(src, promise);
  return promise;
}

function setAvatarEngineStatus(text) {
  const status = $("avatarEngineStatus");
  if (status) status.textContent = text;
}

function digitalHumanName(cfg = state.humanConfig || {}) {
  return String(cfg.name_zh || cfg.name || "小导").trim() || "小导";
}

function showDigitalHumanName() {
  setAvatarEngineStatus(digitalHumanName());
}

function liveTalkingBase() {
  const input = $("liveTalkingBase");
  state.liveTalkingBase = (input?.value || state.liveTalkingBase || "http://127.0.0.1:8010").replace(/\/$/, "");
  localStorage.setItem("dg_livetalking_base", state.liveTalkingBase);
  return state.liveTalkingBase;
}

function setAvatarEngine(engine, persist = true) {
  // LiveTalking is intentionally disabled in the competition frontend.
  state.avatarEngine = "live2d";
  if (persist) localStorage.setItem("dg_avatar_engine", state.avatarEngine);
  const panel = document.querySelector(".human-panel");
  if (!panel) return;
  stopLipSync();
  panel.classList.remove("engine-live2d", "engine-livetalking", "engine-css", "engine-loading", "livetalking-connected");
  panel.classList.add(`engine-${state.avatarEngine}`);
  const select = $("visitorAvatarEngine");
  if (select && select.value !== state.avatarEngine) select.value = state.avatarEngine;
  if (state.avatarEngine === "live2d") {
    state.live2dApp?.start?.();
    if (state.live2dModel) state.live2dModel.visible = true;
    if (isLive2DStageVisible()) {
      ensureLive2DVisible();
      // Let the CSS engine switch finish before measuring the stage. A second
      // frame protects against stale dimensions after video/Live2D switching.
      window.requestAnimationFrame(() => {
        resizeLive2DStage();
        window.requestAnimationFrame(resizeLive2DStage);
      });
    }
    else setAvatarEngineStatus("Live2D 等待页面显示");
  }
  if (state.avatarEngine === "css") {
    setAvatarEngineStatus("虚拟主播数字人");
  }
}

async function connectLiveTalking() {
  setAvatarEngine("livetalking");
  setAvatarEngineStatus("正在连接 LiveTalking");
  const panel = document.querySelector(".human-panel");
  panel?.classList.remove("livetalking-connected");
  if (state.liveTalkingPc) {
    state.liveTalkingPc.close();
    state.liveTalkingPc = null;
  }

  const pc = new RTCPeerConnection({ sdpSemantics: "unified-plan" });
  state.liveTalkingPc = pc;
  pc.addTransceiver("video", { direction: "recvonly" });
  pc.addTransceiver("audio", { direction: "recvonly" });
  pc.addEventListener("track", (event) => {
    if (event.track.kind === "video") {
      const video = $("liveTalkingVideo");
      video.srcObject = event.streams[0];
      video.muted = true;
      video.play?.().catch(() => {});
      panel?.classList.add("livetalking-connected");
      setAvatarEngineStatus(`LiveTalking 视频已接入 ${state.liveTalkingSessionId || ""}`.trim());
    }
    if (event.track.kind === "audio") {
      const audio = $("liveTalkingAudio");
      audio.srcObject = event.streams[0];
      audio.play?.().catch(() => {});
    }
  });
  pc.addEventListener("connectionstatechange", () => {
    if (pc.connectionState === "connected") {
      state.liveTalkingConnected = true;
      panel?.classList.add("livetalking-connected");
      setAvatarEngineStatus(`LiveTalking 已连接 ${state.liveTalkingSessionId || ""}`.trim());
    }
    if (["failed", "closed", "disconnected"].includes(pc.connectionState)) {
      state.liveTalkingConnected = false;
      panel?.classList.remove("livetalking-connected");
      setAvatarEngineStatus("LiveTalking 连接已断开");
    }
  });

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await new Promise((resolve) => {
    if (pc.iceGatheringState === "complete") return resolve();
    const checkState = () => {
      if (pc.iceGatheringState === "complete") {
        pc.removeEventListener("icegatheringstatechange", checkState);
        resolve();
      }
    };
    pc.addEventListener("icegatheringstatechange", checkState);
  });

  const body = {
    sdp: pc.localDescription.sdp,
    type: pc.localDescription.type,
    avatar: state.humanConfig?.avatar_id || undefined,
  };
  const res = await fetch(`${liveTalkingBase()}/offer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("LiveTalking /offer 连接失败");
  const answer = await res.json();
  state.liveTalkingSessionId = String(answer.sessionid || "");
  await pc.setRemoteDescription(answer);
  state.liveTalkingConnected = true;
  setAvatarEngineStatus(`LiveTalking 已连接 ${state.liveTalkingSessionId}`);
  toast("LiveTalking 已连接");
}

async function speakWithLiveTalking(text, emotion = "neutral", interrupt = true) {
  if (!text || state.avatarEngine !== "livetalking" || !state.liveTalkingSessionId) return false;
  const res = await fetch(`${liveTalkingBase()}/human`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionid: state.liveTalkingSessionId,
      text,
      type: "echo",
      interrupt,
      tts: {
        voice: state.humanConfig?.voice_gender === "male" ? "zh-CN-YunxiNeural" : "zh-CN-XiaoxiaoNeural",
        emotion,
      },
    }),
  });
  if (!res.ok) return false;
  const data = await res.json().catch(() => ({}));
  if (data.code && data.code !== 0) return false;
  setHumanState({ speaking: true, emotion });
  return true;
}

async function waitForLiveTalkingSpeech(runId, textLength = 20) {
  const startedAt = Date.now();
  const timeout = Math.min(30000, Math.max(5000, textLength * 320));
  let observedSpeaking = false;
  while (runId === state.speechRunId && Date.now() - startedAt < timeout) {
    await new Promise((resolve) => window.setTimeout(resolve, 320));
    try {
      const res = await fetch(`${liveTalkingBase()}/is_speaking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionid: state.liveTalkingSessionId }),
      });
      const data = await res.json();
      const speaking = Boolean(data.data);
      if (speaking) observedSpeaking = true;
      if (observedSpeaking && !speaking) return;
    } catch {
      return;
    }
  }
}

async function initLive2D() {
  const lifecycleId = state.live2dLifecycleId;
  const panel = document.querySelector(".human-panel");
  const canvas = $("live2dCanvas");
  if (!panel || !canvas) return;
  if (!isLive2DStageVisible()) {
    setAvatarEngineStatus("Live2D 等待页面显示");
    return;
  }
  panel.classList.add("engine-loading");
  setAvatarEngineStatus("Live2D 模型加载中");

  if (!window.PIXI?.live2d?.Live2DModel) throw new Error("Live2D runtime unavailable");
  if (!state.live2dApp) {
    const rect = canvas.parentElement.getBoundingClientRect();
    state.live2dApp = new PIXI.Application({
      view: canvas,
      width: Math.max(1, Math.round(rect.width)),
      height: Math.max(1, Math.round(rect.height)),
      autoStart: true,
      transparent: true,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
    });
    observeLive2DStage();
  }
  resizeLive2DStage();
  const modelLoaded = await loadLive2DModel(lifecycleId);
  if (!modelLoaded) return;
  if (lifecycleId !== state.live2dLifecycleId) return;
  resizeLive2DStage();
  panel.classList.remove("engine-loading");
  panel.classList.add("engine-live2d");
  showDigitalHumanName();
  console.info("[Live2D] Mark model ready", live2dModels.modern);
}

function isLive2DStageVisible() {
  const canvas = $("live2dCanvas");
  const stage = canvas?.parentElement;
  if (!canvas || !stage || $("appShell")?.classList.contains("hidden")) return false;
  const rect = stage.getBoundingClientRect();
  return rect.width > 2 && rect.height > 2;
}

function ensureLive2DVisible() {
  if (state.avatarEngine !== "live2d" || !isLive2DStageVisible()) return;
  if (state.live2dApp && state.live2dModel) {
    resizeLive2DStage();
    showDigitalHumanName();
    return;
  }
  if (state.live2dInitPromise) return;
  state.live2dInitPromise = initLive2D()
    .catch((error) => {
      console.warn("[Live2D] Mark model failed to load; AI chat remains available.", error);
      setAvatarEngineStatus("Mark 加载失败，已使用简化形象");
      setAvatarEngine("css", false);
    })
    .finally(() => {
      state.live2dInitPromise = null;
    });
}

function observeLive2DStage() {
  const stage = $("live2dCanvas")?.parentElement;
  if (!stage || state.live2dResizeObserver || !window.ResizeObserver) return;
  state.live2dResizeObserver = new ResizeObserver(() => {
    window.requestAnimationFrame(resizeLive2DStage);
  });
  state.live2dResizeObserver.observe(stage);
}

function resizeLive2DStage() {
  const app = state.live2dApp;
  const stage = $("live2dCanvas")?.parentElement;
  if (!app || !stage) return;
  const rect = stage.getBoundingClientRect();
  const width = Math.round(rect.width);
  const height = Math.round(rect.height);
  if (width <= 2 || height <= 2) return;
  if (app.renderer.screen.width !== width || app.renderer.screen.height !== height) {
    app.renderer.resize(width, height);
  }
  styleLive2DModel();
}

async function loadLive2DModel(lifecycleId = state.live2dLifecycleId) {
  if (!state.live2dApp || !window.PIXI?.live2d?.Live2DModel) return false;
  const appearance = state.humanConfig?.appearance || "modern";
  const configuredPath = state.humanConfig?.extra_config?.live2d_model_path;
  const modelUrl = configuredPath || live2dModels[appearance] || live2dModels.modern;
  if (state.live2dModel?.modelUrl === modelUrl) {
    styleLive2DModel();
    return true;
  }
  if (state.live2dModel) {
    detachLive2DMouthDriver();
    state.live2dApp.stage.removeChild(state.live2dModel);
    state.live2dModel.destroy?.();
    state.live2dModel = null;
  }
  const model = await PIXI.live2d.Live2DModel.from(modelUrl);
  if (lifecycleId !== state.live2dLifecycleId || !state.live2dApp) {
    model.destroy?.();
    return false;
  }
  model.modelUrl = modelUrl;
  model.anchor.set(0.5, 0.5);
  state.live2dApp.stage.addChild(model);
  state.live2dModel = model;
  attachLive2DMouthDriver(model);
  model.motion?.("Idle", 0);
  styleLive2DModel();
  return true;
}

function styleLive2DModel() {
  const model = state.live2dModel;
  const app = state.live2dApp;
  if (!model || !app) return;
  const width = app.renderer.screen.width || 320;
  const height = app.renderer.screen.height || 320;
  const bounds = model.getLocalBounds();
  const naturalWidth = Math.max(1, bounds.width);
  const naturalHeight = Math.max(1, bounds.height);
  // Mark's source canvas contains generous transparent margins, so a modest
  // visual boost keeps the character legible while preserving the full body.
  const scale = Math.min(width / naturalWidth, height / naturalHeight) * 1.45;
  model.x = width / 2;
  model.y = height / 2;
  model.scale.set(scale);
  model.rotation = 0;
  model.alpha = 1;
  model.tint = 0xffffff;
}

function setHumanState({ speaking = false, thinking = false, emotion = "neutral" } = {}) {
  const human = $("digitalHuman");
  const anchor = $("virtualAnchor");
  human.classList.toggle("speaking", speaking);
  human.classList.toggle("thinking", thinking);
  human.classList.remove("neutral", "happy", "thinking-emotion", "sorry");
  human.classList.add(emotion === "thinking" ? "thinking-emotion" : emotion || "neutral");
  if (anchor) {
    anchor.classList.toggle("speaking", speaking);
    anchor.classList.toggle("thinking", thinking);
    anchor.classList.remove("neutral", "happy", "thinking-emotion", "sorry");
    anchor.classList.add(emotion === "thinking" ? "thinking-emotion" : emotion || "neutral");
  }
  $("humanState").textContent = speaking ? "正在讲解" : thinking ? "正在思考" : "在线待命";
  if (state.avatarEngine === "live2d" && state.live2dModel) {
    try {
      if (speaking && !state.live2dSpeaking) {
        state.live2dSpeaking = true;
        state.live2dModel.motion?.("Tap");
      }
      if (!speaking && state.live2dSpeaking) {
        state.live2dSpeaking = false;
        state.live2dModel.motion?.("Idle", 0);
      }
      if (emotion === "happy") state.live2dModel.expression?.(0);
    } catch {}
  }
}

function describeVoice(cfg = {}) {
  const gender = cfg.voice_gender === "male" ? "男声" : "女声";
  const speedMap = { slow: "舒缓", medium: "自然", fast: "轻快" };
  const expressionMap = { lively: "活泼", calm: "沉稳", warm: "温暖" };
  return `${gender} · ${speedMap[cfg.voice_speed] || "自然"} · ${expressionMap[cfg.expression_style] || "亲切"}`;
}

function applyHumanConfig(cfg = {}) {
  const merged = { ...(state.humanConfig || {}), ...(cfg || {}) };
  state.humanConfig = merged;
  const name = digitalHumanName(merged);
  $("humanName").textContent = name;
  const routeName = $("routeHumanName");
  if (routeName) routeName.textContent = `${name}路线助手`;
  if (state.live2dModel) showDigitalHumanName();
  const human = $("digitalHuman");
  const anchor = $("virtualAnchor");
  human.classList.remove("modern", "hanfu", "nature");
  human.classList.add(merged.appearance || "modern");
  if (anchor) {
    anchor.classList.remove("modern", "hanfu", "nature", "expression-lively", "expression-calm", "expression-warm");
    anchor.classList.add(merged.appearance || "modern", `expression-${merged.expression_style || "lively"}`);
    anchor.dataset.voiceGender = merged.voice_gender || "female";
    anchor.dataset.voiceSpeed = merged.voice_speed || "medium";
  }
  human.classList.remove("expression-lively", "expression-calm", "expression-warm");
  human.classList.add(`expression-${merged.expression_style || "lively"}`);
  human.dataset.voiceGender = merged.voice_gender || "female";
  human.dataset.voiceSpeed = merged.voice_speed || "medium";
  const voiceMeta = $("humanVoiceMeta");
  if (voiceMeta) voiceMeta.textContent = describeVoice(merged);
  const avatar = $("humanAvatarImage");
  if (avatar) {
    avatar.src = merged.avatar_url || "";
    human.classList.toggle("has-avatar", Boolean(merged.avatar_url));
  }
  syncVisitorHumanControls(merged);
  if (state.avatarEngine === "live2d") {
    loadLive2DModel().catch(() => {});
  }
}

function previewHumanConfigFromForm() {
  applyHumanConfig({
    ...(state.humanConfig || {}),
    name: $("cfgName").value || "小导",
    appearance: $("cfgAppearance").value || "modern",
    voice_gender: $("cfgVoiceGender").value || "female",
    voice_speed: $("cfgVoiceSpeed").value || "medium",
    expression_style: $("cfgExpression").value || "lively",
  });
}

function syncVisitorHumanControls(cfg = state.humanConfig || {}) {
  const pairs = [
    ["visitorAvatarEngine", state.avatarEngine || "live2d"],
    ["visitorAppearance", cfg.appearance || "modern"],
    ["visitorVoiceGender", cfg.voice_gender || "female"],
    ["visitorVoiceSpeed", cfg.voice_speed || "medium"],
    ["visitorExpression", cfg.expression_style || "lively"],
  ];
  pairs.forEach(([id, value]) => {
    const el = $(id);
    if (el && el.value !== value) el.value = value;
  });
}

function previewVisitorHumanConfig() {
  setAvatarEngine($("visitorAvatarEngine").value || "live2d");
  const cfg = {
    ...(state.humanConfig || {}),
    ...(state.visitorHumanConfig || {}),
    appearance: $("visitorAppearance").value || "modern",
    voice_gender: $("visitorVoiceGender").value || "female",
    voice_speed: $("visitorVoiceSpeed").value || "medium",
    expression_style: $("visitorExpression").value || "lively",
  };
  state.visitorHumanConfig = {
    appearance: cfg.appearance,
    voice_gender: cfg.voice_gender,
    voice_speed: cfg.voice_speed,
    expression_style: cfg.expression_style,
  };
  localStorage.setItem("dg_visitor_human_config", JSON.stringify(state.visitorHumanConfig));
  applyHumanConfig(cfg);
}

function stopLipSync() {
  if (state.lipSyncFrame) {
    cancelAnimationFrame(state.lipSyncFrame);
    state.lipSyncFrame = null;
  }
  if (state.browserMouthTimer) {
    window.clearInterval(state.browserMouthTimer);
    state.browserMouthTimer = null;
  }
  $("digitalHuman").style.setProperty("--mouth-open", "8px");
  $("virtualAnchor")?.style.setProperty("--mouth-open", "6px");
  setLive2DMouth(0);
}

function writeLive2DMouth(value) {
  const model = state.live2dModel;
  if (!model) return;
  const normalized = Math.max(0, Math.min(1, value));
  try {
    const core = model.internalModel?.coreModel;
    if (core?.setParameterValueById) core.setParameterValueById("ParamMouthOpenY", normalized);
    if (core?.setParamFloat) core.setParamFloat("PARAM_MOUTH_OPEN_Y", normalized);
  } catch {}
}

function setLive2DMouth(value) {
  state.live2dMouthValue = Math.max(0, Math.min(1, value));
  writeLive2DMouth(state.live2dMouthValue);
}

function detachLive2DMouthDriver() {
  const internalModel = state.live2dModel?.internalModel;
  if (internalModel && state.live2dMouthUpdateHandler) {
    internalModel.off?.("beforeModelUpdate", state.live2dMouthUpdateHandler);
  }
  state.live2dMouthUpdateHandler = null;
  state.live2dMouthValue = 0;
  state.live2dRenderedMouth = 0;
}

function attachLive2DMouthDriver(model) {
  detachLive2DMouthDriver();
  const internalModel = model?.internalModel;
  if (!internalModel?.on) return;
  state.live2dMouthUpdateHandler = () => {
    // Motions and physics update parameters every frame. Applying lip sync at
    // beforeModelUpdate keeps the audio-driven value from being overwritten.
    const response = state.live2dMouthValue > state.live2dRenderedMouth ? 0.34 : 0.2;
    state.live2dRenderedMouth += (state.live2dMouthValue - state.live2dRenderedMouth) * response;
    if (state.live2dRenderedMouth < 0.01 && state.live2dMouthValue === 0) {
      state.live2dRenderedMouth = 0;
    }
    writeLive2DMouth(state.live2dRenderedMouth);
  };
  internalModel.on("beforeModelUpdate", state.live2dMouthUpdateHandler);
}

function startLipSync(audio, emotion = "neutral") {
  stopLipSync();
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    setHumanState({ speaking: true, emotion });
    return;
  }

  try {
    state.audioContext = state.audioContext || new AudioContextClass();
    const analyser = state.audioContext.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.32;
    const source = state.audioContext.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(state.audioContext.destination);
    const waveform = new Uint8Array(analyser.fftSize);
    const human = $("digitalHuman");
    let smoothedMouth = 0;
    let smoothedEnergy = 0;
    let lastMouthUpdate = 0;

    const tick = (timestamp = performance.now()) => {
      if (audio.paused || audio.ended) {
        setLive2DMouth(0);
        return;
      }
      analyser.getByteTimeDomainData(waveform);
      let energy = 0;
      for (let index = 0; index < waveform.length; index += 1) {
        const sample = (waveform[index] - 128) / 128;
        energy += sample * sample;
      }
      const rms = Math.sqrt(energy / waveform.length);
      smoothedEnergy += (rms - smoothedEnergy) * 0.18;

      // Human-looking lip sync does not need to react at 60 FPS. Updating near
      // 30 FPS and using a slower release removes rapid chatter between samples.
      if (timestamp - lastMouthUpdate >= 32) {
        let target = smoothedEnergy < 0.022
          ? 0
          : Math.min(0.82, (smoothedEnergy - 0.022) * 6.2);
        if (target < 0.07) target = 0;
        const response = target > smoothedMouth ? 0.3 : 0.12;
        smoothedMouth += (target - smoothedMouth) * response;
        if (smoothedMouth < 0.025) smoothedMouth = 0;
        const open = 7 + smoothedMouth * 21;
        human.style.setProperty("--mouth-open", `${open}px`);
        $("virtualAnchor")?.style.setProperty("--mouth-open", `${6 + smoothedMouth * 16}px`);
        setLive2DMouth(smoothedMouth);
        lastMouthUpdate = timestamp;
      }
      state.lipSyncFrame = requestAnimationFrame(tick);
    };

    state.audioContext.resume?.();
    setHumanState({ speaking: true, emotion });
    tick();
  } catch {
    setHumanState({ speaking: true, emotion });
  }
}

function normalizeStreamText(text = "") {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/([。！？；])\s*(\d+[.)、]\s+)/g, "$1\n$2")
    .replace(/([。！？；])\s*([-*•]\s+)/g, "$1\n$2")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function appendFormattedText(target, text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  parts.forEach((part) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const strong = document.createElement("strong");
      strong.textContent = part.slice(2, -2);
      target.appendChild(strong);
      return;
    }
    target.appendChild(document.createTextNode(part));
  });
}

function renderRichText(target, rawText = "") {
  const text = normalizeStreamText(rawText);
  target.innerHTML = "";
  if (!text) return;

  text.split(/\n{2,}/).forEach((block) => {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const isList = lines.length > 1 && lines.every((line) => /^([-*•]|\d+[.)、])\s+/.test(line));
    if (isList) {
      const ordered = lines.every((line) => /^\d+[.)、]\s+/.test(line));
      const list = document.createElement(ordered ? "ol" : "ul");
      lines.forEach((line) => {
        const item = document.createElement("li");
        appendFormattedText(item, line.replace(/^([-*•]|\d+[.)、])\s+/, ""));
        list.appendChild(item);
      });
      target.appendChild(list);
      return;
    }
    lines.forEach((line) => {
      const paragraph = document.createElement("p");
      appendFormattedText(paragraph, line);
      target.appendChild(paragraph);
    });
  });
}

function addMessage(role, content, id, persist = true) {
  const box = document.createElement("div");
  box.className = `message ${role}`;
  if (id) box.id = id;

  if (role === "assistant") {
    const meta = document.createElement("div");
    meta.className = "message-meta";
    meta.innerHTML = '<span class="assistant-dot">DG</span><strong>小导</strong><span class="message-status">已回答</span>';
    box.appendChild(meta);
  }

  const contentBox = document.createElement("div");
  contentBox.className = "message-content";
  box.appendChild(contentBox);
  renderRichText(contentBox, content);
  $("chatMessages").appendChild(box);
  $("chatMessages").scrollTop = $("chatMessages").scrollHeight;

  if (persist && content) saveMessageToHistory(role, content);
  return box;
}

function setMessageText(messageEl, text) {
  renderRichText(messageEl.querySelector(".message-content") || messageEl, text);
}

function setMessageStreaming(messageEl, isStreaming) {
  messageEl.classList.toggle("streaming", isStreaming);
  const status = messageEl.querySelector(".message-status");
  if (status) status.textContent = isStreaming ? "正在组织回答" : "已回答";
  if (isStreaming && status && !status.querySelector(".typing-dots")) {
    const dots = document.createElement("span");
    dots.className = "typing-dots";
    dots.innerHTML = "<i></i><i></i><i></i>";
    status.appendChild(dots);
  }
  if (!isStreaming) messageEl.querySelector(".typing-dots")?.remove();
}

function getCurrentHistoryItem() {
  return state.history.find((item) => item.id === state.conversationId);
}

function updateConversationTitle(title = "") {
  const badge = $("conversationBadge");
  if (badge) badge.textContent = title.trim() || "新的导览会话";
}

function persistHistory() {
  state.history = state.history.slice(0, 30);
  localStorage.setItem("dg_conversation_history", JSON.stringify(state.history));
  renderHistoryList();
}

function upsertConversationHistory({ id, title, greeting = "" }) {
  if (!id) return;
  let item = state.history.find((entry) => entry.id === id);
  if (!item) {
    item = { id, title: title || "新的导览会话", messages: [], updatedAt: new Date().toISOString() };
    state.history.unshift(item);
  }
  item.title = title || item.title;
  item.updatedAt = new Date().toISOString();
  if (greeting && !item.messages.length) item.messages.push({ role: "assistant", content: greeting });
  persistHistory();
}

function saveMessageToHistory(role, content) {
  if (!state.conversationId || !content) return;
  let item = getCurrentHistoryItem();
  if (!item) {
    item = { id: state.conversationId, title: content.slice(0, 24), messages: [], updatedAt: new Date().toISOString() };
    state.history.unshift(item);
  }
  const last = item.messages[item.messages.length - 1];
  if (last && last.role === role && last.content === content) return;
  item.messages.push({ role, content });
  if (role === "user") item.title = content.slice(0, 28);
  item.updatedAt = new Date().toISOString();
  updateConversationTitle(item.title);
  persistHistory();
}

function renderHistoryList() {
  const list = $("historyList");
  if (!list) return;
  if (!state.history.length) {
    list.innerHTML = '<div class="empty-history">暂无历史会话</div>';
    return;
  }
  list.innerHTML = state.history.map((item) => {
    const last = item.messages[item.messages.length - 1]?.content || "尚无对话内容";
    const active = item.id === state.conversationId ? " active" : "";
    return `
      <div class="history-item-wrap${active}" data-history-id="${item.id}">
        <button class="history-item" type="button" data-conv-id="${item.id}">
          <strong>${escapeHTML(item.title || "导览会话")}</strong>
          <span>${escapeHTML(last).slice(0, 46)}</span>
          <small>${formatDate(item.updatedAt)}</small>
        </button>
        <button class="history-more" type="button" data-history-menu="${item.id}" aria-label="更多操作">···</button>
        <div class="history-menu">
          <button type="button" data-history-rename="${item.id}">重命名对话</button>
          <button type="button" class="danger" data-history-delete="${item.id}">删除聊天记录</button>
        </div>
      </div>
    `;
  }).join("");
  list.querySelectorAll("[data-conv-id]").forEach((btn) => {
    btn.onclick = () => loadConversationFromHistory(btn.dataset.convId);
  });
  list.querySelectorAll("[data-history-menu]").forEach((btn) => {
    btn.onclick = (event) => {
      event.stopPropagation();
      const wrap = btn.closest(".history-item-wrap");
      const isOpen = wrap.classList.contains("menu-open");
      closeHistoryMenus();
      if (!isOpen) {
        const rect = wrap.getBoundingClientRect();
        wrap.classList.toggle("menu-up", window.innerHeight - rect.bottom < 120);
        wrap.classList.add("menu-open");
      }
    };
  });
  list.querySelectorAll("[data-history-rename]").forEach((btn) => {
    btn.onclick = (event) => {
      event.stopPropagation();
      renameHistoryItem(btn.dataset.historyRename);
    };
  });
  list.querySelectorAll("[data-history-delete]").forEach((btn) => {
    btn.onclick = (event) => {
      event.stopPropagation();
      deleteHistoryItem(btn.dataset.historyDelete);
    };
  });
}

function renameHistoryItem(id) {
  const item = state.history.find((entry) => entry.id === id);
  if (!item) return;
  closeHistoryMenus();
  const nextTitle = window.prompt("重命名对话", item.title || "导览会话");
  if (nextTitle === null) return;
  const title = nextTitle.trim();
  if (!title) return toast("名称不能为空");
  item.title = title.slice(0, 40);
  item.updatedAt = new Date().toISOString();
  if (state.conversationId === id) updateConversationTitle(item.title);
  persistHistory();
  toast("对话已重命名");
}

function deleteHistoryItem(id) {
  const item = state.history.find((entry) => entry.id === id);
  if (!item) return;
  closeHistoryMenus();
  const ok = window.confirm(`确定删除“${item.title || "导览会话"}”吗？删除后本地历史记录不可恢复。`);
  if (!ok) return;
  state.history = state.history.filter((entry) => entry.id !== id);
  if (state.conversationId === id) {
    state.conversationId = "";
    updateConversationTitle();
    $("chatMessages").innerHTML = "";
    addMessage("assistant", "您好，我是景区 AI 导游小导。点击“新聊天”，就可以开始新的导览会话。", undefined, false);
  }
  persistHistory();
  toast("聊天记录已删除");
}

async function loadConversationFromHistory(id) {
  const item = state.history.find((entry) => entry.id === id);
  if (!item) return;
  state.conversationId = id;
  updateConversationTitle(item.title);
  $("chatMessages").innerHTML = "";
  item.messages.forEach((msg) => addMessage(msg.role, msg.content, undefined, false));
  renderHistoryList();

  try {
    const data = await request(`/api/conversations/${id}`);
    if (Array.isArray(data.interest_tags)) {
      state.interests = data.interest_tags;
      renderInterests(defaultInterests);
    }
  } catch {
    toast("已恢复本地历史，后端会话可能已过期");
  }
}

function renderInterests(options = defaultInterests) {
  const wrap = $("interestChips");
  wrap.innerHTML = "";
  options.forEach((tag) => {
    const btn = document.createElement("button");
    btn.className = `chip ${state.interests.includes(tag) ? "active" : ""}`;
    btn.textContent = tag;
    btn.onclick = async () => {
      state.interests = state.interests.includes(tag)
        ? state.interests.filter((item) => item !== tag)
        : [...state.interests, tag];
      renderInterests(options);
      if (state.conversationId) {
        await request(`/api/conversations/${state.conversationId}/interests`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ interest_tags: state.interests }),
        });
      }
    };
    wrap.appendChild(btn);
  });
}

async function createConversation() {
  const visitorId = localStorage.getItem("dg_visitor_id") || crypto.randomUUID();
  localStorage.setItem("dg_visitor_id", visitorId);
  const data = await request("/api/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ visitor_id: `${state.visitorName || "visitor"}-${visitorId}` }),
  });

  state.conversationId = data.conversation_id;
  state.interests = [];
  $("chatMessages").innerHTML = "";
  updateConversationTitle("新的导览会话");
  applyHumanConfig(data.digital_human || {});
  if (state.visitorHumanConfig) applyHumanConfig({ ...(data.digital_human || {}), ...state.visitorHumanConfig });
  renderInterests(data.interest_options || defaultInterests);
  const greeting = data.greeting || "您好，我是您的 AI 导游小导。想了解景点、路线或服务设施，都可以直接问我。";
  const configuredGreeting = state.humanConfig?.extra_config?.welcome_message;
  const activeGreeting = configuredGreeting || greeting;
  upsertConversationHistory({ id: state.conversationId, title: "新的导览会话", greeting: activeGreeting });
  addMessage("assistant", activeGreeting, undefined, false);
}

function resizeChatInput() {
  const input = $("chatInput");
  if (!input) return;
  input.style.height = "auto";
  const nextHeight = Math.min(input.scrollHeight, 160);
  input.style.height = `${Math.max(40, nextHeight)}px`;
  input.style.overflowY = input.scrollHeight > 160 ? "auto" : "hidden";
}

function updateComposerState() {
  const input = $("chatInput");
  const send = $("sendBtn");
  if (!input || !send) return;
  send.disabled = !input.value.trim() && !state.isListening;
  resizeChatInput();
}

function setListeningState(active, message = "正在聆听…") {
  state.isListening = active;
  $("voiceBtn")?.classList.toggle("listening", active);
  const status = $("voiceStatus");
  status?.classList.toggle("show", active);
  const label = status?.querySelector("span:last-child");
  if (label) label.textContent = message;
  updateComposerState();
}

function initSpeechRecognition() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) return null;
  const recognition = new Recognition();
  recognition.lang = "zh-CN";
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  let committedText = "";
  let activeSessionId = 0;

  recognition.onstart = () => {
    activeSessionId = recognition._dgSessionId || 0;
    if (state.ignoreRecognitionResults || activeSessionId !== state.recognitionSessionId) {
      try {
        recognition.abort();
      } catch {}
      return;
    }
    committedText = $("chatInput").value.trim();
    setListeningState(true);
  };
  recognition.onresult = (event) => {
    if (state.ignoreRecognitionResults || activeSessionId !== state.recognitionSessionId) return;
    let interimText = "";
    let finalText = "";
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const transcript = event.results[index][0]?.transcript || "";
      if (event.results[index].isFinal) finalText += transcript;
      else interimText += transcript;
    }
    if (finalText) committedText = [committedText, finalText].filter(Boolean).join("");
    $("chatInput").value = `${committedText}${interimText}`;
    updateComposerState();
  };
  recognition.onerror = (event) => {
    const messages = {
      "not-allowed": "麦克风权限被拒绝，请在浏览器设置中允许访问",
      "audio-capture": "没有检测到可用麦克风",
      network: "语音识别网络异常，请稍后再试",
      "no-speech": "没有识别到语音，请再试一次",
    };
    if (event.error !== "aborted") toast(messages[event.error] || "语音识别失败，请稍后再试");
    if (activeSessionId === state.recognitionSessionId) setListeningState(false);
  };
  recognition.onend = () => {
    if (activeSessionId === state.recognitionSessionId) setListeningState(false);
  };
  state.recognition = recognition;
  return recognition;
}

function toggleVoiceRecognition() {
  if (state.isListening) {
    state.recognition?.stop();
    return;
  }
  const recognition = state.recognition || initSpeechRecognition();
  if (!recognition) {
    toast("当前浏览器不支持语音识别，建议使用最新版 Chrome");
    return;
  }
  try {
    state.recognitionSessionId += 1;
    state.ignoreRecognitionResults = false;
    recognition._dgSessionId = state.recognitionSessionId;
    setListeningState(true, "正在启动语音识别…");
    recognition.start();
  } catch (error) {
    setListeningState(false);
    if (error.name !== "InvalidStateError") toast("语音识别暂时无法启动，请稍后再试");
  }
}

function stopVoiceRecognition({ discardLateResults = false } = {}) {
  if (!state.recognition) {
    setListeningState(false);
    return;
  }
  if (discardLateResults) {
    state.ignoreRecognitionResults = true;
    state.recognitionSessionId += 1;
    try {
      state.recognition.abort();
    } catch {}
  } else {
    try {
      state.recognition.stop();
    } catch {}
  }
  setListeningState(false);
}

function updateReplyControl() {
  const active = state.speechPlaying || state.isAIResponding;
  $("stopReplyBtn")?.classList.toggle("show", active);
  $("routeStopReplyBtn")?.classList.toggle("show", active);
  document.querySelector(".composer-wrap")?.classList.toggle("voice-playing", state.speechPlaying);
}

function setAIResponding(active) {
  state.isAIResponding = active;
  updateReplyControl();
}

function setSpeechPlaying(active) {
  state.speechPlaying = active;
  updateReplyControl();
}

function splitCompletedSentences(text, flush = false) {
  const parts = [];
  let rest = text;
  let queuedCount = state.speechSegmentsQueued;
  while (!flush && rest.length) {
    const targetLength = queuedCount === 0 ? 12 : 22;
    const maxLength = queuedCount === 0 ? 15 : 25;
    let sentenceEnd = -1;
    const inspectLength = Math.min(rest.length, maxLength);
    for (let index = 0; index < inspectLength; index += 1) {
      if (/[。！？!?]/.test(rest[index]) && index + 1 >= 8) {
        sentenceEnd = index + 1;
        break;
      }
    }
    const cutAt = sentenceEnd > 0
      ? sentenceEnd
      : rest.length >= targetLength
        ? targetLength
        : -1;
    if (cutAt < 0) break;
    const segment = rest.slice(0, cutAt).trim();
    if (segment) {
      parts.push(segment);
      queuedCount += 1;
    }
    rest = rest.slice(cutAt).trimStart();
  }
  if (flush && rest.trim()) {
    parts.push(rest.trim());
    return { sentences: parts, rest: "" };
  }
  return { sentences: parts, rest };
}

function prepareSpeechAudio(text, runId) {
  const controller = new AbortController();
  state.speechFetchControllers.add(controller);
  const requestId = ++state.ttsRequestSeq;
  const preview = text.slice(0, 10).replace(/\s+/g, " ");
  const timerLabel = `[TTS ${requestId}] ${preview}`;
  const startedAt = performance.now();
  console.time(timerLabel);
  return fetch(`${apiBase()}/api/voice/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversation_id: state.conversationId, text }),
    signal: controller.signal,
  }).then(async (res) => {
    if (!res.ok || runId !== state.speechRunId) return null;
    return res.blob();
  }).catch((error) => {
    if (error.name !== "AbortError") console.warn("[TTS error]", preview, error);
    return null;
  }).finally(() => {
    console.timeEnd(timerLabel);
    console.log("[TTS duration]", requestId, Math.round(performance.now() - startedAt), "ms", preview);
    state.speechFetchControllers.delete(controller);
  });
}

function enqueueSpeech(text, emotion = "neutral") {
  const clean = text.trim();
  if (!clean || state.humanConfig?.extra_config?.auto_voice === false) return;
  const runId = state.speechRunId;
  const audioPromise = state.avatarEngine === "livetalking" && state.liveTalkingSessionId
    ? null
    : prepareSpeechAudio(clean, runId);
  state.speechQueue.push({ text: clean, emotion, audioPromise });
  state.speechSegmentsQueued += 1;
  console.log("[TTS enqueue]", Date.now(), clean.length, clean);
  processSpeechQueue().catch(() => {
    setSpeechPlaying(false);
    setHumanState({ emotion: "neutral" });
  });
}

async function playAudioBlob(blob, emotion, runId, text = "") {
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.volume = Math.max(0, Math.min(1, Number(state.humanConfig?.extra_config?.volume ?? 100) / 100));
  state.audio = audio;
  return new Promise((resolve) => {
    const finish = () => {
      stopLipSync();
      URL.revokeObjectURL(url);
      if (state.audio === audio) state.audio = null;
      resolve();
    };
    audio.onplay = () => {
      console.log("[TTS play]", Date.now(), text.length, text.slice(0, 20));
      startLipSync(audio, emotion);
    };
    audio.onended = finish;
    audio.onerror = finish;
    audio.onpause = () => {
      if (runId !== state.speechRunId) finish();
    };
    audio.play().catch(finish);
  });
}

function speakWithBrowserTTS(text, emotion, runId) {
  if (!("speechSynthesis" in window) || runId !== state.speechRunId) return Promise.resolve();
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    const speedMap = { slow: 0.86, medium: 1, fast: 1.14 };
    utterance.lang = "zh-CN";
    utterance.rate = speedMap[state.humanConfig?.voice_speed] || 1;
    utterance.pitch = state.humanConfig?.voice_gender === "male" ? 0.88 : 1.04;
    utterance.volume = Math.max(0, Math.min(1, Number(state.humanConfig?.extra_config?.volume ?? 100) / 100));
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find((voice) => voice.lang.toLowerCase().startsWith("zh")) || null;
    const finish = () => {
      if (state.browserMouthTimer) {
        window.clearInterval(state.browserMouthTimer);
        state.browserMouthTimer = null;
      }
      setLive2DMouth(0);
      if (runId === state.speechRunId) setHumanState({ emotion: "neutral" });
      resolve();
    };
    utterance.onstart = () => {
      setHumanState({ speaking: true, emotion });
      state.browserMouthTimer = window.setInterval(() => {
        setLive2DMouth(0.18 + Math.random() * 0.72);
      }, 90);
    };
    utterance.onend = finish;
    utterance.onerror = finish;
    window.speechSynthesis.speak(utterance);
  });
}

async function speakSentence(item, runId) {
  if (runId !== state.speechRunId) return;
  const { text, emotion, audioPromise } = item;
  if (state.avatarEngine === "livetalking" && state.liveTalkingSessionId) {
    const accepted = await speakWithLiveTalking(text, emotion, false);
    if (accepted) await waitForLiveTalkingSpeech(runId, text.length);
    return;
  }
  const blob = await audioPromise;
  if (runId !== state.speechRunId) return;
  if (!blob || blob.size === 0) {
    console.warn("[TTS fallback] backend audio unavailable, using browser speech synthesis");
    await speakWithBrowserTTS(text, emotion, runId);
    return;
  }
  await playAudioBlob(blob, emotion, runId, text);
}

async function processSpeechQueue() {
  if (state.speechPlaying || !state.speechQueue.length) return;
  const runId = state.speechRunId;
  setSpeechPlaying(true);
  while (state.speechQueue.length && runId === state.speechRunId) {
    const item = state.speechQueue.shift();
    await speakSentence(item, runId);
  }
  if (runId === state.speechRunId) {
    setSpeechPlaying(false);
    setHumanState({ emotion: "neutral" });
  }
}

function stopReply({ abortGeneration = true } = {}) {
  state.speechRunId += 1;
  state.speechQueue = [];
  state.speechSegmentsQueued = 0;
  state.speechFetchControllers.forEach((controller) => controller.abort());
  state.speechFetchControllers.clear();
  if (state.audio) {
    state.audio.pause();
    state.audio.src = "";
    state.audio = null;
  }
  window.speechSynthesis?.cancel();
  if (abortGeneration) {
    state.generationAbort?.abort();
    state.activeReader?.cancel().catch(() => {});
  }
  state.generationAbort = null;
  state.activeReader = null;
  setAIResponding(false);
  stopLipSync();
  setSpeechPlaying(false);
  setHumanState();
  if (state.liveTalkingSessionId) {
    fetch(`${liveTalkingBase()}/interrupt_talk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionid: state.liveTalkingSessionId }),
    }).catch(() => {});
  }
}

function handleSendAction() {
  const input = $("chatInput");
  const text = input.value.trim();
  if (state.isListening) stopVoiceRecognition({ discardLateResults: true });
  if (!text) {
    updateComposerState();
    return;
  }
  input.value = "";
  updateComposerState();
  sendMessage(text).catch((err) => toast(err.message));
}

async function sendMessage(presetText = "") {
  const text = (presetText || $("chatInput").value).trim();
  if (!text) return;
  stopReply();
  const responseRunId = state.speechRunId;
  if (!state.conversationId) await createConversation();

  $("chatInput").value = "";
  updateComposerState();
  addMessage("user", text);
  const assistant = addMessage("assistant", "", `msg-${Date.now()}`, false);
  setMessageStreaming(assistant, true);
  setAIResponding(true);
  setHumanState({ thinking: true, emotion: "thinking" });
  state.generationAbort = new AbortController();

  let res;
  try {
    res = await fetch(`${apiBase()}/api/voice/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation_id: state.conversationId, message: text }),
      signal: state.generationAbort.signal,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      setMessageStreaming(assistant, false);
      setAIResponding(false);
      if (responseRunId === state.speechRunId) setHumanState();
      return;
    }
    setMessageStreaming(assistant, false);
    setAIResponding(false);
    setMessageText(assistant, "后端服务暂时无法连接，请确认服务地址和后端启动状态。");
    setHumanState();
    return;
  }

  if (!res.ok || !res.body) {
    setMessageStreaming(assistant, false);
    setAIResponding(false);
    setMessageText(assistant, "问答服务暂时不可用，请稍后再试。");
    setHumanState();
    return;
  }

  const reader = res.body.getReader();
  state.activeReader = reader;
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let finalText = "";
  let emotion = "neutral";
  let speechBuffer = "";
  let receivedDelta = false;

  while (true) {
    if (responseRunId !== state.speechRunId) break;
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";
    for (const event of events) {
      const line = event.split("\n").find((item) => item.startsWith("data:"));
      if (!line) continue;
      let payload;
      try {
        payload = JSON.parse(line.slice(5).trim());
      } catch {
        continue;
      }
      if (payload.type === "delta") {
        if (responseRunId !== state.speechRunId) break;
        receivedDelta = true;
        const delta = payload.content || "";
        console.log("[SSE delta]", Date.now(), delta.length, delta);
        finalText += delta;
        speechBuffer += delta;
        setMessageText(assistant, finalText);
        $("chatMessages").scrollTop = $("chatMessages").scrollHeight;
        const completed = splitCompletedSentences(speechBuffer);
        speechBuffer = completed.rest;
        completed.sentences.forEach((sentence) => enqueueSpeech(sentence, emotion));
      }
      if (payload.type === "done") {
        console.log("[SSE done]", Date.now(), (payload.content || finalText).length);
        finalText = payload.content || finalText;
        emotion = payload.emotion || "neutral";
        if (!receivedDelta) speechBuffer = finalText;
        setMessageText(assistant, finalText);
      }
      if (payload.type === "error") {
        finalText = payload.message || payload.content || "服务暂时不可用。";
        emotion = "sorry";
        setMessageText(assistant, finalText);
      }
    }
  }

  if (responseRunId !== state.speechRunId) {
    setMessageStreaming(assistant, false);
    setAIResponding(false);
    return;
  }
  splitCompletedSentences(speechBuffer, true).sentences.forEach((sentence) => enqueueSpeech(sentence, emotion));
  state.generationAbort = null;
  state.activeReader = null;
  setMessageStreaming(assistant, false);
  setAIResponding(false);
  setMessageText(assistant, finalText);
  saveMessageToHistory("assistant", finalText);
  extractAndRenderRouteFromAIText(finalText);
  if (!state.speechPlaying && !state.speechQueue.length) setHumanState({ emotion });
}

async function streamVoiceChat(text, options = {}) {
  const { signal, onDelta, shouldContinue } = options;
  if (!state.conversationId) await createConversation();

  let res;
  try {
    res = await fetch(`${apiBase()}/api/voice/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation_id: state.conversationId, message: text }),
      signal,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error("后端服务暂时无法连接，请确认服务地址和后端启动状态。");
  }

  if (!res.ok || !res.body) {
    throw new Error("问答服务暂时不可用，请稍后再试。");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let finalText = "";
  let emotion = "neutral";
  let receivedDelta = false;

  while (true) {
    if (typeof shouldContinue === "function" && !shouldContinue()) break;
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";
    for (const event of events) {
      const line = event.split("\n").find((item) => item.startsWith("data:"));
      if (!line) continue;
      let payload;
      try {
        payload = JSON.parse(line.slice(5).trim());
      } catch {
        continue;
      }
      if (payload.type === "delta") {
        receivedDelta = true;
        finalText += payload.content || "";
        onDelta?.(payload.content || "", finalText, emotion);
      }
      if (payload.type === "done") {
        finalText = payload.content || finalText;
        emotion = payload.emotion || emotion;
        if (!receivedDelta) onDelta?.("", finalText, emotion);
      }
      if (payload.type === "error") {
        throw new Error(payload.message || payload.content || "服务暂时不可用。");
      }
    }
  }

  return { content: finalText, emotion };
}

function normalizeSpotName(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[\s·•\-—_（）()]/g, "")
    .replace(/(?:景区|景点|文化园)$/g, "");
}

function locationFromSpot(spot = {}) {
  const location = spot.location || {};
  const lat = Number(spot.lat ?? location.lat ?? location.latitude);
  const lng = Number(spot.lng ?? location.lng ?? location.lon ?? location.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

function matchSpotByName(name) {
  const target = normalizeSpotName(name);
  if (!target) return null;
  const matches = scenicSpots.flatMap((spot) => (
    [spot.name, ...(spot.aliases || [])]
      .map(normalizeSpotName)
      .filter(Boolean)
      .map((candidate) => ({ spot, candidate }))
  ));
  const exact = matches.find(({ candidate }) => candidate === target);
  if (exact) return exact.spot;
  const fuzzy = matches
    .filter(({ candidate }) => (
      candidate.length >= 2
      && (target.includes(candidate) || (target.length >= 2 && candidate.includes(target)))
    ))
    .sort((a, b) => b.candidate.length - a.candidate.length);
  return fuzzy[0]?.spot || null;
}

function hydrateScenicSpotsFromBackend() {
  if (state.routeCatalogLoaded) return Promise.resolve();
  if (state.routeCatalogLoading) return state.routeCatalogLoading;
  state.routeCatalogLoading = request("/api/spots")
    .then((items) => {
      if (!Array.isArray(items)) return;
      items.forEach((item) => {
        const location = locationFromSpot(item);
        const existing = matchSpotByName(item.name);
        if (existing) {
          if (location) Object.assign(existing, location);
          if (item.description) existing.intro = item.description;
          if (Array.isArray(item.tags) && item.tags.length) existing.tags = item.tags;
          if (item.visit_duration_min) existing.duration = `${item.visit_duration_min}分钟`;
          return;
        }
        scenicSpots.push({
          id: item.id || `backend-${scenicSpots.length}`,
          name: item.name,
          aliases: item.name_en ? [item.name_en] : [],
          lat: location?.lat,
          lng: location?.lng,
          intro: item.description || "该景点的详细介绍正在补充中。",
          duration: item.visit_duration_min ? `${item.visit_duration_min}分钟` : "建议 20 分钟",
          tags: Array.isArray(item.tags) ? item.tags : [],
        });
      });
      state.routeCatalogLoaded = true;
    })
    .catch((error) => {
      console.warn("[Route map] backend spot catalog unavailable, using local fallback", error);
    })
    .finally(() => {
      state.routeCatalogLoading = null;
    });
  return state.routeCatalogLoading;
}

function createNumberedIcon(index, active = false) {
  if (!window.L) return null;
  return L.divIcon({
    className: "route-marker",
    html: `<div class="marker-dot${active ? " active" : ""}">${index + 1}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -20],
  });
}

function initRouteMap() {
  if (state.routeMap || !$("leafletRouteMap")) return state.routeMap;
  if (!window.L) {
    $("routeMapError")?.classList.remove("hidden");
    return null;
  }
  try {
    state.routeMap = L.map("leafletRouteMap", {
      zoomControl: true,
      minZoom: 14,
      maxZoom: 19,
    }).setView([31.4231, 120.0955], 16);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(state.routeMap);
    return state.routeMap;
  } catch (error) {
    console.error("[Route map] initialization failed", error);
    $("routeMapError")?.classList.remove("hidden");
    return null;
  }
}

function clearRouteLayer() {
  if (state.routeMap) {
    state.routeMarkers.forEach((marker) => {
      if (marker) state.routeMap.removeLayer(marker);
    });
    if (state.routePolyline) state.routeMap.removeLayer(state.routePolyline);
  }
  state.routeMarkers = [];
  state.routePolyline = null;
  state.routeSpots = [];
  state.selectedRouteSpot = -1;
}

function formatRouteDuration(data, spots) {
  if (data.duration) return String(data.duration);
  if (data.duration_hours) return `约 ${data.duration_hours} 小时`;
  const minutes = spots.reduce((sum, spot) => {
    const value = Number.parseInt(spot.duration, 10);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);
  return minutes ? `约 ${Math.max(1, Math.round(minutes / 30) / 2)} 小时` : "时长可调整";
}

function normalizeRouteSpot(item, index) {
  const source = typeof item === "string" ? { name: item } : (item || {});
  const name = source.name || source.spot_name || `景点 ${index + 1}`;
  const matched = matchSpotByName(name);
  const sourceLocation = locationFromSpot(source);
  const matchedLocation = locationFromSpot(matched || {});
  const location = sourceLocation || matchedLocation;
  return {
    ...(matched || {}),
    ...source,
    id: source.id || matched?.id || `unmatched-${index}`,
    name: matched?.name || name,
    requestedName: name,
    lat: location?.lat,
    lng: location?.lng,
    intro: source.intro || source.description || matched?.intro || "该景点的详细介绍正在补充中。",
    duration: source.duration || (source.visit_duration_min ? `${source.visit_duration_min}分钟` : matched?.duration || "建议 20 分钟"),
    tags: Array.isArray(source.tags) && source.tags.length ? source.tags : (matched?.tags || []),
    hasCoordinates: Boolean(location),
  };
}

function renderRouteResult(data) {
  renderRoutePlan(data);
}

function renderRoutePlan(aiRouteResult = {}) {
  const rawSpots = Array.isArray(aiRouteResult.spots) ? aiRouteResult.spots : [];
  const spots = rawSpots.map(normalizeRouteSpot);
  const routeName = aiRouteResult.routeName || aiRouteResult.route_name || aiRouteResult.name || "小导推荐路线";
  const duration = formatRouteDuration(aiRouteResult, spots);
  const reason = aiRouteResult.reason || aiRouteResult.description || "已根据你的游览时间和兴趣偏好生成路线。";
  const normalizedPlan = { ...aiRouteResult, routeName, duration, reason, spots };

  state.latestRoutePlan = {
    routeName,
    duration,
    reason,
    spots: spots.map((spot) => spot.requestedName || spot.name),
  };
  localStorage.setItem("dg_latest_route_plan", JSON.stringify(state.latestRoutePlan));
  clearRouteLayer();
  state.routeSpots = spots;

  if (!spots.length) {
    $("routeResult").innerHTML = `
      <div class="route-empty-state">
        <span class="route-empty-icon" aria-hidden="true">⌁</span>
        <strong>暂无推荐路线</strong>
        <p>请先在导览对话中生成路线，或设置游览时长后点击“生成推荐路线”。</p>
      </div>`;
    $("routeSpotList").innerHTML = "";
    return;
  }

  const mappedCount = spots.filter((spot) => spot.hasCoordinates).length;
  $("routeResult").innerHTML = `
    <div class="route-overview-head">
      <div>
        <span>当前路线</span>
        <strong>${escapeHTML(routeName)}</strong>
      </div>
      <span class="route-count">${spots.length} 个景点</span>
    </div>
    <div class="route-meta">
      <span>${escapeHTML(duration)}</span>
      <span>${mappedCount} 个可地图定位</span>
    </div>
    <p>${escapeHTML(reason)}</p>
  `;

  renderSpotList(spots);
  initRouteMap();
  renderRouteMarkers(spots);
  fitRouteBounds(spots);
  const firstMappedIndex = spots.findIndex((spot) => spot.hasCoordinates);
  selectSpot(firstMappedIndex >= 0 ? firstMappedIndex : 0, { moveMap: false, scrollList: false });
}

function renderSpotList(spots) {
  $("routeSpotList").innerHTML = spots.map((spot, index) => `
    <button class="route-spot-card" data-route-spot-index="${index}" type="button">
      <span class="route-spot-number">${index + 1}</span>
      <span class="route-spot-content">
        <span class="route-spot-title">
          <strong>${escapeHTML(spot.name)}</strong>
          <small>${escapeHTML(spot.duration)}</small>
        </span>
        <span class="route-spot-intro">${escapeHTML(spot.intro)}</span>
        <span class="route-spot-tags">
          ${(spot.tags || []).slice(0, 3).map((tag) => `<em>${escapeHTML(tag)}</em>`).join("")}
        </span>
        ${spot.hasCoordinates ? "" : '<span class="route-coordinate-warning">该景点暂无坐标信息</span>'}
      </span>
    </button>
  `).join("");

  document.querySelectorAll("[data-route-spot-index]").forEach((card) => {
    card.onclick = () => selectSpot(Number(card.dataset.routeSpotIndex));
  });
}

function routePopupHTML(spot, index) {
  return `
    <div class="route-popup">
      <span class="route-popup-step">第 ${index + 1} 站</span>
      <strong>${escapeHTML(spot.name)}</strong>
      <p>${escapeHTML(spot.intro)}</p>
      <div class="route-popup-meta"><span>${escapeHTML(spot.duration)}</span></div>
      <div class="route-popup-tags">
        ${(spot.tags || []).slice(0, 4).map((tag) => `<span>${escapeHTML(tag)}</span>`).join("")}
      </div>
    </div>`;
}

function renderRouteMarkers(spots) {
  const map = initRouteMap();
  if (!map) return;
  const points = [];
  spots.forEach((spot, index) => {
    if (!spot.hasCoordinates) {
      state.routeMarkers[index] = null;
      return;
    }
    const marker = L.marker([spot.lat, spot.lng], {
      icon: createNumberedIcon(index, false),
      riseOnHover: true,
    })
      .addTo(map)
      .bindPopup(routePopupHTML(spot, index), { maxWidth: 300, minWidth: 230, offset: [0, -4] });
    marker.on("click", () => selectSpot(index, { moveMap: false }));
    state.routeMarkers[index] = marker;
    points.push([spot.lat, spot.lng]);
  });

  if (points.length > 1) {
    state.routePolyline = L.polyline(points, {
      color: "#16856f",
      weight: 4,
      opacity: 0.78,
      lineCap: "round",
      lineJoin: "round",
      dashArray: "2 9",
    }).addTo(map);
  }
}

function fitRouteBounds(spots) {
  const map = initRouteMap();
  if (!map) return;
  const points = spots.filter((spot) => spot.hasCoordinates).map((spot) => [spot.lat, spot.lng]);
  if (points.length === 1) {
    map.setView(points[0], 17);
  } else if (points.length > 1) {
    map.fitBounds(L.latLngBounds(points), { padding: [64, 64], maxZoom: 17 });
  } else {
    map.setView([31.4231, 120.0955], 16);
  }
}

function selectSpot(index, options = {}) {
  const { moveMap = true, scrollList = true } = options;
  if (index < 0 || index >= state.routeSpots.length) return;
  state.selectedRouteSpot = index;
  document.querySelectorAll("[data-route-spot-index]").forEach((card, cardIndex) => {
    card.classList.toggle("active", cardIndex === index);
  });
  state.routeMarkers.forEach((marker, markerIndex) => {
    if (marker) marker.setIcon(createNumberedIcon(markerIndex, markerIndex === index));
  });

  const card = document.querySelector(`[data-route-spot-index="${index}"]`);
  if (scrollList && card) card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  const marker = state.routeMarkers[index];
  if (marker) {
    if (moveMap) state.routeMap.flyTo(marker.getLatLng(), Math.max(state.routeMap.getZoom(), 17), { duration: 0.65 });
    marker.openPopup();
  }
}

function getRoutePreferenceProfile(text = "", interests = []) {
  const source = `${text} ${interests.join(" ")}`;
  if (/(老人|长辈|父母|爸妈|爷爷|奶奶|外公|外婆|腿脚|体力有限|少爬|不爬|少走)/.test(source)) {
    return {
      intent: "长辈同行舒缓路线推荐",
      requirement: "节奏舒缓，优先平缓区域、可停留观赏和室内参观，不安排连续登高",
      reference: "资料中的亲子家庭路线（4小时轻松游）",
      candidates: ["九龙灌浴", "佛手广场", "百子戏弥勒", "灵山梵宫", "五印坛城"],
    };
  }
  if (/(孩子|儿童|亲子|宝宝|小朋友|轻松|有趣|互动|表演)/.test(source)) {
    return {
      intent: "亲子轻松有趣路线推荐",
      requirement: "体验生动有趣，优先动态表演、互动景观和室内艺术参观",
      reference: "资料中的亲子家庭路线（4小时轻松游）",
      candidates: ["九龙灌浴", "佛手广场", "百子戏弥勒", "灵山梵宫", "五印坛城"],
    };
  }
  if (/(自然|风景|风光|拍照|摄影|打卡)/.test(source)) {
    return {
      intent: "自然风光与摄影路线推荐",
      requirement: "兼顾自然景观、开阔视野和拍照体验",
      reference: "资料中的自然风光爱好者路线（5小时全景游）",
      candidates: ["佛足坛", "九龙灌浴", "菩提大道", "灵山大佛", "曼飞龙塔", "灵山精舍", "梵宫广场"],
    };
  }
  if (/(历史|文化|建筑|佛教|祈福|禅)/.test(source)) {
    return {
      intent: "历史文化经典路线推荐",
      requirement: "突出佛教文化、历史建筑和代表性艺术景观",
      reference: "资料中的历史文化爱好者路线（6小时深度游）",
      candidates: ["灵山大照壁", "佛手广场", "祥符禅寺", "佛前广场", "灵山大佛", "灵山梵宫", "五印坛城"],
    };
  }
  return {
    intent: "经典精华路线推荐",
    requirement: text || "路线紧凑、体验丰富、游览顺序合理",
    reference: "资料中的灵山胜境历史文化、自然风光和亲子家庭路线",
    candidates: ["灵山大照壁", "九龙灌浴", "佛手广场", "百子戏弥勒", "灵山大佛", "灵山梵宫", "五印坛城"],
  };
}

function buildRoutePlanningPrompt({ preferenceText = "" } = {}) {
  const guideText = (preferenceText || $("routeGuideInput")?.value || "").trim();
  const hours = Number($("availableHours")?.value || 0);
  const area = ($("currentArea")?.value || "").trim();
  const interests = Array.isArray(state.interests) ? state.interests.filter(Boolean) : [];
  const profile = getRoutePreferenceProfile(guideText, interests);
  const conditions = [];

  if (area) conditions.push(`当前位置${area}`);
  if (hours > 0) conditions.push(`游览时长${hours}小时`);
  if (interests.length) conditions.push(`游览偏好${interests.join("、")}`);
  conditions.push(`路线要求${profile.requirement}`);

  if (!conditions.length) return "";

  state.latestRoutePreference = `${guideText} ${interests.join(" ")}`.trim();
  const candidateNames = profile.candidates.join("、");
  return `灵山胜境${profile.intent}。游客条件：${conditions.join("，")}。请参考${profile.reference}，在时间较短时从完整路线中合理截取精华段。只能从以下资料已有景点中选择：${candidateNames}。请直接回答，不要要求用户再次说明景区或偏好。输出第一行必须使用“路线顺序：景点A → 景点B → 景点C”的格式，按顺序列出3至5个完整景点名称；随后逐站简要说明推荐理由。不要虚构精确步行时间、接驳方式、通行与服务条件、演出时间或官方政策；如资料不支持完整官方路线，请说明这是基于现有资料整理的参考顺序，但仍需给出可用路线。`;
}

function extractRouteReasonFromAIText(text = "") {
  const line = String(text)
    .split("\n")
    .map((item) => item.trim())
    .find((item) => item && !/^(?:第\s*)?\d+[\.、\)）]/.test(item) && !/^第[一二三四五六七八九十\d]+站/.test(item));
  if (!line) return "已根据你的游览时间和偏好生成路线。";
  return line.length > 140 ? `${line.slice(0, 140)}…` : line;
}

function buildFallbackRoutePlan() {
  const hours = Number($("availableHours")?.value || 0);
  const interests = Array.isArray(state.interests) ? state.interests : [];
  const profile = getRoutePreferenceProfile(state.latestRoutePreference, interests);
  let spots;
  let routeName;

  if (profile.intent.includes("长辈")) {
    routeName = "长辈同行舒缓路线";
    spots = ["九龙灌浴", "佛手广场", "灵山梵宫", "五印坛城"];
  } else if (profile.intent.includes("亲子")) {
    routeName = "亲子轻松体验路线";
    spots = ["九龙灌浴", "百子戏弥勒", "佛手广场", "灵山梵宫"];
  } else if (profile.intent.includes("自然")) {
    routeName = "自然风光打卡路线";
    spots = ["佛足坛", "九龙灌浴", "菩提大道", "灵山大佛", "梵宫广场"];
  } else {
    routeName = "灵山文化精华路线";
    spots = ["灵山大照壁", "九龙灌浴", "佛手广场", "灵山大佛", "灵山梵宫"];
  }

  const count = hours > 0 && hours <= 1.5 ? 3 : hours > 0 && hours <= 3 ? 4 : spots.length;
  return {
    routeName,
    duration: hours > 0 ? `约 ${hours} 小时` : "约 3 小时",
    reason: "AI 本轮未返回可定位的景点名称，地图已根据当前时长和兴趣生成保底路线，可继续询问小导调整。",
    spots: spots.slice(0, count),
  };
}

function parseRouteSpotsFromAIText(text = "") {
  if (!text) return [];

  const ordered = [];
  const seen = new Set();

  const addName = (rawName) => {
    const cleaned = String(rawName || "")
      .trim()
      .replace(/^[\*\-•\s]+/, "")
      .replace(/[：:].*$/, "")
      .replace(/[（(].*?[)）]/g, "")
      .trim();
    if (!cleaned || cleaned.length > 40) return;
    const matched = matchSpotByName(cleaned);
    const name = matched?.name || cleaned;
    const key = normalizeSpotName(name);
    if (seen.has(key)) return;
    seen.add(key);
    ordered.push(name);
  };

  scenicSpots
    .map((spot) => {
      const names = [spot.name, ...(spot.aliases || [])];
      const positions = names
        .map((name) => text.indexOf(name))
        .filter((position) => position >= 0);
      return positions.length ? { name: spot.name, position: Math.min(...positions) } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.position - b.position)
    .forEach((item) => addName(item.name));

  if (ordered.length >= 2) return ordered;

  ordered.length = 0;
  seen.clear();
  const numbered = [];
  const numberedRe = /(?:^|\n)\s*(?:第\s*)?(\d+)[\.、\)）]\s*([^\n]+)/g;
  let match;
  while ((match = numberedRe.exec(text)) !== null) {
    numbered.push({ order: Number(match[1]), line: match[2] });
  }
  if (numbered.length >= 2) {
    numbered.sort((a, b) => a.order - b.order);
    numbered.forEach(({ line }) => addName(line.split(/[，,、；;]/)[0]));
    if (ordered.length >= 2) return ordered;
    ordered.length = 0;
    seen.clear();
  }

  const stationRe = /第\s*[一二三四五六七八九十\d]+\s*站[：:\s]+([^\n，,；;]+)/g;
  while ((match = stationRe.exec(text)) !== null) addName(match[1]);
  if (ordered.length >= 2) return ordered;

  text.split("\n").forEach((line) => {
    if (/[→\->—]+/.test(line)) {
      line.split(/[→\->—]+/).forEach((part) => addName(part));
    }
  });
  if (ordered.length >= 2) return ordered;

  return ordered;
}

function renderRouteNoMatchState(message, aiText = "") {
  const excerpt = aiText
    ? `<p class="route-ai-excerpt">${escapeHTML(aiText.slice(0, 180))}${aiText.length > 180 ? "…" : ""}</p>`
    : "";
  clearRouteLayer();
  $("routeResult").innerHTML = `
    <div class="route-empty-state">
      <span class="route-empty-icon" aria-hidden="true">⌁</span>
      <strong>暂未识别到可匹配景点</strong>
      <p>${escapeHTML(message)}</p>
      ${excerpt}
    </div>`;
  $("routeSpotList").innerHTML = "";
}

function extractAndRenderRouteFromAIText(text = "", meta = {}) {
  if (!text) return null;

  const spotNames = parseRouteSpotsFromAIText(text);
  const matchedNames = spotNames.filter((name) => matchSpotByName(name));
  const namesForPlan = matchedNames.length ? matchedNames : spotNames;

  if (!namesForPlan.length || !matchedNames.length) {
    if (meta.showNoMatch) {
      renderRouteNoMatchState(
        "AI 回复已同步到游客对话，但暂未从中识别到可定位的景区景点。请补充具体景点名称或调整路线条件。",
      );
    }
    return null;
  }

  const hours = Number($("availableHours")?.value || 0);
  const plan = {
    routeName: meta.routeName || "小导智能推荐路线",
    duration: meta.duration || (hours > 0 ? `约 ${hours} 小时` : undefined),
    reason: meta.reason || extractRouteReasonFromAIText(text),
    spots: namesForPlan,
  };

  state.latestRoutePlan = {
    routeName: plan.routeName,
    duration: plan.duration || formatRouteDuration(plan, namesForPlan.map((name) => ({ duration: "" }))),
    reason: plan.reason,
    spots: namesForPlan,
  };
  localStorage.setItem("dg_latest_route_plan", JSON.stringify(state.latestRoutePlan));

  if ($("routeMapView")?.classList.contains("active") || meta.forceRender) {
    renderRoutePlan(state.latestRoutePlan);
  }
  return state.latestRoutePlan;
}

async function requestAIRoutePlan(prompt, options = {}) {
  const {
    mirrorToChat = true,
    userMessage = "",
    button = null,
    forceRender = true,
    showNoMatch = true,
    speakResponse = true,
  } = options;
  const trimmedPrompt = String(prompt || "").trim();
  const visibleUserMessage = String(userMessage || trimmedPrompt).trim();
  if (!trimmedPrompt) {
    toast("请先填写游览时长、当前位置或路线偏好");
    return null;
  }

  await hydrateScenicSpotsFromBackend();
  if (!state.conversationId) await createConversation();

  const previousLabel = button?.textContent;
  if (button) {
    button.disabled = true;
    button.textContent = "正在规划…";
  }

  setHumanState({ thinking: true, emotion: "thinking" });
  state.routeRequestAbort?.abort();
  state.routeRequestAbort = new AbortController();

  let assistantEl = null;
  let responseRunId = state.speechRunId;
  let routeSpeechBuffer = "";
  let receivedSpeechDelta = false;
  if (mirrorToChat) {
    stopReply();
    responseRunId = state.speechRunId;
    setHumanState({ thinking: true, emotion: "thinking" });
    addMessage("user", visibleUserMessage);
    assistantEl = addMessage("assistant", "", `msg-${Date.now()}`, false);
    setMessageStreaming(assistantEl, true);
    setAIResponding(true);
    state.generationAbort = state.routeRequestAbort;
  }

  try {
    const { content, emotion } = await streamVoiceChat(trimmedPrompt, {
      signal: state.routeRequestAbort.signal,
      shouldContinue: () => !mirrorToChat || responseRunId === state.speechRunId,
      onDelta: mirrorToChat
        ? (delta, fullText) => {
          if (responseRunId !== state.speechRunId) return;
          setMessageText(assistantEl, fullText);
          $("chatMessages").scrollTop = $("chatMessages").scrollHeight;
          if (speakResponse && delta) {
            receivedSpeechDelta = true;
            routeSpeechBuffer += delta;
            const completed = splitCompletedSentences(routeSpeechBuffer);
            routeSpeechBuffer = completed.rest;
            completed.sentences.forEach((sentence) => enqueueSpeech(sentence, "thinking"));
          }
        }
        : undefined,
    });

    const replyText = content.trim() || "小导暂时没有返回有效内容，请稍后再试。";
    if (speakResponse && responseRunId === state.speechRunId) {
      if (!receivedSpeechDelta) routeSpeechBuffer = replyText;
      splitCompletedSentences(routeSpeechBuffer, true).sentences
        .forEach((sentence) => enqueueSpeech(sentence, emotion));
    }
    if (mirrorToChat && assistantEl) {
      if (responseRunId !== state.speechRunId) return null;
      setMessageText(assistantEl, replyText);
      setMessageStreaming(assistantEl, false);
      setAIResponding(false);
      saveMessageToHistory("assistant", replyText);
      state.generationAbort = null;
    }

    let plan = extractAndRenderRouteFromAIText(replyText, { forceRender, showNoMatch: false });
    let usedFallback = false;
    if (!plan && showNoMatch) {
      plan = buildFallbackRoutePlan();
      state.latestRoutePlan = plan;
      localStorage.setItem("dg_latest_route_plan", JSON.stringify(plan));
      if ($("routeMapView")?.classList.contains("active") || forceRender) renderRoutePlan(plan);
      usedFallback = true;
    }
    if (plan && !state.speechPlaying && !state.speechQueue.length) {
      setHumanState({ emotion: "happy" });
    } else if (!plan && !state.speechPlaying && !state.speechQueue.length) {
      setHumanState({ emotion: emotion === "sorry" ? "sorry" : "neutral" });
    }
    return { content: replyText, plan, emotion, usedFallback };
  } catch (error) {
    if (error.name === "AbortError") return null;
    setHumanState({ emotion: "sorry" });
    if (mirrorToChat && assistantEl) {
      setMessageText(assistantEl, error.message);
      setMessageStreaming(assistantEl, false);
      setAIResponding(false);
      saveMessageToHistory("assistant", error.message);
      state.generationAbort = null;
    }
    throw error;
  } finally {
    state.routeRequestAbort = null;
    if (button) {
      button.disabled = false;
      button.textContent = previousLabel;
    }
  }
}

function syncRouteFromAIText(text = "") {
  extractAndRenderRouteFromAIText(text);
}

async function recommendRoute() {
  const prompt = buildRoutePlanningPrompt({});
  if (!prompt) {
    toast("请先填写游览时长、当前位置，或在助手窗口说明同行人员与偏好");
    return;
  }
  const result = await requestAIRoutePlan(prompt, {
    userMessage: prompt,
    button: $("recommendBtn"),
    forceRender: true,
    showNoMatch: true,
  });
  if (result?.usedFallback) {
    toast("AI 回复已同步；地图已生成一条可调整的保底路线");
  }
}

function renderRatingButtons() {
  const wrap = $("ratingButtons");
  wrap.innerHTML = "";
  [1, 2, 3, 4, 5].forEach((rating) => {
    const btn = document.createElement("button");
    btn.textContent = rating;
    btn.className = rating === state.selectedRating ? "active" : "";
    btn.onclick = () => {
      state.selectedRating = rating;
      renderRatingButtons();
    };
    wrap.appendChild(btn);
  });
}

async function submitFeedback() {
  if (!state.conversationId) return toast("请先创建会话");
  await request(`/api/conversations/${state.conversationId}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rating: state.selectedRating, comment: $("feedbackComment").value || null }),
  });
  $("feedbackComment").value = "";
  toast("反馈已提交");
}

async function askRouteGuide() {
  const input = $("routeGuideInput");
  const text = input.value.trim();
  if (!text) return toast("先输入想问小导的路线问题");
  input.value = "";
  const prompt = buildRoutePlanningPrompt({ preferenceText: text });
  try {
    const result = await requestAIRoutePlan(prompt, {
      userMessage: text,
      button: $("routeGuideBtn"),
      forceRender: true,
      showNoMatch: true,
    });
    if (result?.usedFallback) {
      toast("AI 回复已同步；地图已生成一条可调整的保底路线");
    } else if (result?.plan) {
      toast("对话已同步，推荐路线已更新到地图");
    }
  } catch (error) {
    toast(error.message);
  }
}

function initDraggableAssistantPanel() {
  const panel = $("routeAssistantPanel");
  const header = $("routeAssistantHeader");
  if (!panel || !header || panel.dataset.dragInit === "1") return;
  panel.dataset.dragInit = "1";

  const canDrag = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const storageKey = "dg_route_assistant_pos";
  const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
  if (saved && Number.isFinite(saved.left) && Number.isFinite(saved.top)) {
    panel.style.left = `${saved.left}px`;
    panel.style.top = `${saved.top}px`;
    panel.style.right = "auto";
    panel.style.bottom = "auto";
  }

  if (!canDrag) return;

  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  const clampPosition = (left, top) => {
    const maxLeft = Math.max(0, window.innerWidth - panel.offsetWidth);
    const maxTop = Math.max(0, window.innerHeight - panel.offsetHeight);
    return {
      left: Math.max(0, Math.min(left, maxLeft)),
      top: Math.max(0, Math.min(top, maxTop)),
    };
  };

  if (saved && Number.isFinite(saved.left) && Number.isFinite(saved.top)) {
    window.requestAnimationFrame(() => {
      const next = clampPosition(saved.left, saved.top);
      panel.style.left = `${next.left}px`;
      panel.style.top = `${next.top}px`;
    });
  }

  const persistPosition = () => {
    const left = Number.parseInt(panel.style.left, 10);
    const top = Number.parseInt(panel.style.top, 10);
    if (Number.isFinite(left) && Number.isFinite(top)) {
      localStorage.setItem(storageKey, JSON.stringify({ left, top }));
    }
  };

  header.addEventListener("mousedown", (event) => {
    if (event.button !== 0) return;
    dragging = true;
    panel.classList.add("is-dragging");
    const rect = panel.getBoundingClientRect();
    startX = event.clientX;
    startY = event.clientY;
    startLeft = rect.left;
    startTop = rect.top;
    panel.style.left = `${startLeft}px`;
    panel.style.top = `${startTop}px`;
    panel.style.right = "auto";
    panel.style.bottom = "auto";
    event.preventDefault();
  });

  window.addEventListener("mousemove", (event) => {
    if (!dragging) return;
    const next = clampPosition(
      startLeft + event.clientX - startX,
      startTop + event.clientY - startY,
    );
    panel.style.left = `${next.left}px`;
    panel.style.top = `${next.top}px`;
    event.preventDefault();
  });

  window.addEventListener("mouseup", () => {
    if (!dragging) return;
    dragging = false;
    panel.classList.remove("is-dragging");
    persistPosition();
  });

  window.addEventListener("resize", () => {
    if (!panel.style.left || !panel.style.top) return;
    const left = Number.parseInt(panel.style.left, 10);
    const top = Number.parseInt(panel.style.top, 10);
    if (!Number.isFinite(left) || !Number.isFinite(top)) return;
    const next = clampPosition(left, top);
    panel.style.left = `${next.left}px`;
    panel.style.top = `${next.top}px`;
  });
}

async function adminLogin(event) {
  event.preventDefault();
  const data = await request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: $("username").value, password: $("password").value }),
  });
  state.token = data.access_token;
  localStorage.setItem("dg_admin_token", state.token);
  toast(`已登录：${data.admin?.username || "admin"}`);
  enterApp("admin");
}

const adminMockData = {
  overview: { total_conversations: 1286, total_messages: 4932, avg_response_ms: 1680, avg_satisfaction: 4.7, rag_hit_rate: 0.92 },
  satisfaction: [
    { date: "周一", avg_rating: 4.3 }, { date: "周二", avg_rating: 4.5 }, { date: "周三", avg_rating: 4.6 },
    { date: "周四", avg_rating: 4.4 }, { date: "周五", avg_rating: 4.8 }, { date: "周六", avg_rating: 4.9 },
    { date: "周日", avg_rating: 4.7 },
  ],
  emotions: { happy: 64, neutral: 25, thinking: 8, sorry: 3 },
  hotQuestions: [
    { question_pattern: "灵山大佛怎么游览？", count: 86 },
    { question_pattern: "九龙灌浴表演有什么特色？", count: 71 },
    { question_pattern: "适合老人游玩的路线", count: 54 },
  ],
  interests: { 历史文化: 38, 自然风光: 26, 摄影打卡: 19, 亲子游: 17 },
  hotSpots: [
    { spot_name: "灵山大佛", mention_count: 236 },
    { spot_name: "九龙灌浴", mention_count: 198 },
    { spot_name: "灵山梵宫", mention_count: 174 },
  ],
};

async function requestOrMock(path, fallback) {
  try {
    return await request(path, { headers: authHeaders() });
  } catch (error) {
    console.warn(`[Admin mock] ${path}`, error);
    return fallback;
  }
}

async function loadDashboard() {
  if (!state.token) return;
  const [overview, satisfaction, emotion, hot, interest, hotSpots] = await Promise.all([
    requestOrMock("/api/admin/stats/overview?range=today", adminMockData.overview),
    requestOrMock("/api/admin/stats/satisfaction?range=week", { trend: adminMockData.satisfaction }),
    requestOrMock("/api/admin/stats/emotion-trend?range=week", { distribution: adminMockData.emotions }),
    requestOrMock("/api/admin/stats/hot-questions?range=week&limit=8", { items: adminMockData.hotQuestions }),
    requestOrMock("/api/admin/stats/interest-distribution?range=month", adminMockData.interests),
    requestOrMock("/api/admin/stats/hot-spots?range=week&limit=6", { items: adminMockData.hotSpots }),
  ]);
  renderStats(overview);
  renderTrend(satisfaction.trend || []);
  renderEmotionTrend(emotion.distribution || {});
  renderRankedList("hotQuestions", hot.items || [], (item) => item.question_pattern, (item) => item.count);
  renderInterestDistribution(interest || {});
  renderRankedList("hotSpots", hotSpots.items || [], (item) => item.spot_name, (item) => item.mention_count);
}

function renderStats(data = {}) {
  const items = [
    ["总会话", data.total_conversations ?? 0],
    ["总消息", data.total_messages ?? 0],
    ["平均响应时间", data.avg_response_ms ? `${Math.round(data.avg_response_ms)}ms` : "-"],
    ["满意度", data.avg_satisfaction ? Number(data.avg_satisfaction).toFixed(1) : "-"],
    ["RAG 命中率", data.rag_hit_rate == null ? "-" : `${Math.round(data.rag_hit_rate * 100)}%`],
  ];
  $("statsCards").innerHTML = items.map(([label, value]) => `<div class="stat-card"><span>${label}</span><strong>${value}</strong></div>`).join("");
}

function renderTrend(items) {
  $("satisfactionTrend").innerHTML = items.length
    ? items.map((item) => `
      <div class="bar-row">
        <span>${escapeHTML(item.date)}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.min(100, ((item.avg_rating || 0) / 5) * 100)}%"></div></div>
        <strong>${item.avg_rating || "-"}</strong>
      </div>`).join("")
    : '<div class="list-item">暂无满意度数据</div>';
}

function renderInterestDistribution(data) {
  const entries = Object.entries(data);
  $("interestDistribution").innerHTML = entries.length
    ? entries.map(([tag, count]) => `<span class="tag-pill">${escapeHTML(tag)} ${count}</span>`).join("")
    : '<div class="list-item">暂无兴趣标签数据</div>';
}

function renderEmotionTrend(data) {
  const labels = { happy: "积极", neutral: "平稳", thinking: "思考", sorry: "负向" };
  const colors = { happy: "#22a17f", neutral: "#7193a1", thinking: "#d9a229", sorry: "#d76b68" };
  const entries = Object.entries(data);
  $("emotionTrend").innerHTML = entries.length ? entries.map(([key, value]) => `
    <div class="emotion-row">
      <span><i style="background:${colors[key] || "#7193a1"}"></i>${labels[key] || escapeHTML(key)}</span>
      <div><b style="width:${Math.min(100, Number(value) || 0)}%;background:${colors[key] || "#7193a1"}"></b></div>
      <strong>${value}</strong>
    </div>`).join("") : '<div class="admin-empty">暂无情绪数据</div>';
}

function renderRankedList(id, items, labelGetter, valueGetter) {
  $(id).innerHTML = items.length ? items.map((item, index) => `
    <div class="ranked-item"><span>${index + 1}</span><strong>${escapeHTML(labelGetter(item) || "-")}</strong><em>${valueGetter(item) || 0}</em></div>
  `).join("") : '<div class="admin-empty">暂无数据</div>';
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char]));
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 16);
  return date.toLocaleString("zh-CN", { hour12: false, month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function renderList(id, items, mapper) {
  $(id).innerHTML = items.length ? items.map((item) => `<div class="list-item">${mapper(item)}</div>`).join("") : '<div class="list-item">暂无数据</div>';
}

async function loadKnowledge() {
  if (!state.token) return;
  const [docs, faq, blind] = await Promise.all([
    request("/api/admin/knowledge/documents?page=1&page_size=20", { headers: authHeaders() }),
    request("/api/admin/knowledge/faq?page=1&page_size=20", { headers: authHeaders() }),
    requestOrMock("/api/admin/knowledge/blind-spots?range=week", {
      items: [
        { question_pattern: "轮椅租借点在哪里？", count: 6, last_asked_at: new Date().toISOString(), confidence: 0.31 },
        { question_pattern: "梵宫今天的演出时间？", count: 4, last_asked_at: new Date().toISOString(), confidence: 0.42 },
      ],
    }),
  ]);
  const localDocuments = JSON.parse(localStorage.getItem("dg_mock_documents") || "[]");
  renderKnowledgeDocuments([...(localDocuments || []), ...(docs.items || [])]);
  renderKnowledgeFAQ(faq.items || []);
  renderAdminConversations();
  renderKnowledgeBlindSpots(blind.items || []);
}

function renderAdminConversations() {
  const messages = state.history.flatMap((conversation) => (
    (conversation.messages || []).slice(-4).map((message) => ({
      conversation: conversation.title || "导览会话",
      role: message.role,
      content: message.content,
      time: conversation.updatedAt,
    }))
  )).slice(0, 20);
  $("adminConversationList").innerHTML = messages.length ? `
    <table class="admin-table"><thead><tr><th>会话</th><th>角色</th><th>内容</th><th>时间</th></tr></thead><tbody>
      ${messages.map((item) => `<tr><td>${escapeHTML(item.conversation)}</td><td><span class="status-pill ${item.role === "assistant" ? "success" : "pending"}">${item.role === "assistant" ? "AI" : "游客"}</span></td><td>${escapeHTML(item.content).slice(0, 90)}</td><td>${formatDate(item.time)}</td></tr>`).join("")}
    </tbody></table>` : '<div class="admin-empty">暂无本地游客对话。后端尚未提供管理员会话列表接口。</div>';
}

function renderKnowledgeBlindSpots(items) {
  $("knowledgeBlindSpots").innerHTML = items.length ? `
    <table class="admin-table"><thead><tr><th>用户问题</th><th>状态</th><th>置信度</th><th>建议类型</th><th>操作</th></tr></thead><tbody>
      ${items.map((item, index) => {
        const confidence = item.confidence ?? Math.max(0.18, 0.56 - index * 0.08);
        return `<tr>
          <td><strong>${escapeHTML(item.question_pattern || item.question || "-")}</strong><small>${formatDate(item.last_asked_at || item.created_at)}</small></td>
          <td><span class="status-pill danger">未命中</span></td>
          <td>${Math.round(confidence * 100)}%</td>
          <td>${/时间|几点|开放/.test(item.question_pattern || "") ? "开放与演出时间" : "服务设施"}</td>
          <td><div class="table-actions"><button type="button" data-blind-faq="${index}">加入 FAQ</button><button type="button" data-blind-done="${index}">标记已处理</button></div></td>
        </tr>`;
      }).join("")}
    </tbody></table>` : '<div class="admin-empty">本周暂无知识盲点。</div>';
  $("knowledgeBlindSpots").querySelectorAll("[data-blind-faq]").forEach((button) => {
    button.onclick = () => {
      const item = items[Number(button.dataset.blindFaq)];
      $("faqQuestion").value = item.question_pattern || item.question || "";
      switchAdminSubtab("knowledge", "knowledgeFaqPanel");
      $("faqAnswer").focus();
      toast("问题已带入 FAQ 表单");
    };
  });
  $("knowledgeBlindSpots").querySelectorAll("[data-blind-done]").forEach((button) => {
    button.onclick = () => {
      button.closest("tr").remove();
      toast("已在前端标记处理，待后端提供状态接口");
    };
  });
}

function renderKnowledgeDocuments(items) {
  $("documentsList").innerHTML = items.length ? items.map((item) => {
    const statusClass = item.status === "active" ? "success" : item.status === "failed" ? "danger" : "pending";
    return `
      <div class="list-item knowledge-item">
        <div>
          <strong>${escapeHTML(item.original_name)}</strong>
          <small>${escapeHTML(item.category)} · ${escapeHTML(item.file_type)} · ${Math.ceil((item.file_size || 0) / 1024)} KB · ${formatDate(item.created_at)}</small>
          ${item.error_message ? `<small class="error-text">${escapeHTML(item.error_message)}</small>` : ""}
        </div>
        <div class="item-actions">
          <span class="status-pill ${statusClass}">${escapeHTML(item.status)} · ${item.chunk_count || 0} chunks</span>
          <button type="button" data-delete-doc="${item.id}">删除</button>
        </div>
      </div>`;
  }).join("") : '<div class="list-item">暂无文档，上传 txt / pdf / docx 后会显示入库状态。</div>';
  $("documentsList").querySelectorAll("[data-delete-doc]").forEach((btn) => {
    btn.onclick = () => deleteDocument(btn.dataset.deleteDoc).catch((err) => toast(err.message));
  });
}

function renderKnowledgeFAQ(items) {
  $("faqList").innerHTML = items.length ? items.map((item) => `
    <div class="list-item knowledge-item">
      <div>
        <strong>${escapeHTML(item.question)}</strong>
        <p>${escapeHTML(item.answer)}</p>
        <small>${escapeHTML(item.category)} · ${item.is_active ? "启用" : "停用"} · ${formatDate(item.updated_at)}</small>
      </div>
      <div class="item-actions"><button type="button" data-delete-faq="${item.id}">删除</button></div>
    </div>
  `).join("") : '<div class="list-item">暂无 FAQ，新增后会同步到 AI 知识库。</div>';
  $("faqList").querySelectorAll("[data-delete-faq]").forEach((btn) => {
    btn.onclick = () => deleteFAQ(btn.dataset.deleteFaq).catch((err) => toast(err.message));
  });
}

async function uploadDocument(event) {
  event.preventDefault();
  const file = $("docFile").files[0];
  if (!file) return toast("请选择文档");
  const extension = file.name.split(".").pop().toLowerCase();
  if (["md", "markdown"].includes(extension)) {
    const localDocuments = JSON.parse(localStorage.getItem("dg_mock_documents") || "[]");
    localDocuments.unshift({
      id: `mock-${Date.now()}`,
      original_name: file.name,
      category: $("docCategory").value || "general",
      file_type: extension,
      file_size: file.size,
      status: "mock",
      chunk_count: 0,
      created_at: new Date().toISOString(),
    });
    localStorage.setItem("dg_mock_documents", JSON.stringify(localDocuments.slice(0, 20)));
    event.target.reset();
    $("docCategory").value = "general";
    toast("Markdown 已加入前端展示，后端需补充 Markdown 入库支持");
    loadKnowledge().catch(() => {});
    return;
  }
  const form = new FormData();
  form.append("file", file);
  form.append("category", $("docCategory").value || "general");
  await request("/api/admin/knowledge/documents", { method: "POST", headers: authHeaders(), body: form });
  event.target.reset();
  $("docCategory").value = "general";
  toast("文档已上传，正在入库");
  loadKnowledge().catch(() => {});
  window.setTimeout(() => loadKnowledge().catch(() => {}), 3000);
}

async function createFAQ(event) {
  event.preventDefault();
  await request("/api/admin/knowledge/faq", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ question: $("faqQuestion").value, answer: $("faqAnswer").value, category: $("faqCategory").value || "general" }),
  });
  event.target.reset();
  $("faqCategory").value = "general";
  toast("FAQ 已新增");
  loadKnowledge().catch(() => {});
}

async function deleteDocument(id) {
  if (String(id).startsWith("mock-")) {
    const localDocuments = JSON.parse(localStorage.getItem("dg_mock_documents") || "[]")
      .filter((item) => String(item.id) !== String(id));
    localStorage.setItem("dg_mock_documents", JSON.stringify(localDocuments));
    toast("本地 Markdown 记录已删除");
    loadKnowledge().catch(() => {});
    return;
  }
  await request(`/api/admin/knowledge/documents/${id}`, { method: "DELETE", headers: authHeaders() });
  toast("文档已删除");
  loadKnowledge().catch(() => {});
}

async function deleteFAQ(id) {
  await request(`/api/admin/knowledge/faq/${id}`, { method: "DELETE", headers: authHeaders() });
  toast("FAQ 已删除");
  loadKnowledge().catch(() => {});
}

async function loadScenic() {
  if (!state.token) return;
  const [spots, routes] = await Promise.all([
    request("/api/admin/spots", { headers: authHeaders() }),
    request("/api/admin/routes", { headers: authHeaders() }),
  ]);
  renderScenicSpots(spots || []);
  renderList("routesList", routes || [], (item) => `${escapeHTML(item.name)}<br><small>${escapeHTML((item.target_tags || []).join("、"))} · ${item.duration_hours || "-"} 小时</small>`);
}

function scenicLocalMeta() {
  return JSON.parse(localStorage.getItem("dg_scenic_admin_meta") || "{}");
}

function renderScenicSpots(items) {
  const meta = scenicLocalMeta();
  $("spotsList").innerHTML = items.length ? `
    <table class="admin-table"><thead><tr><th>景点</th><th>标签</th><th>开放时间</th><th>时长</th><th>位置</th><th>状态</th><th>操作</th></tr></thead><tbody>
      ${items.map((item) => {
        const local = meta[item.id] || {};
        const location = item.location || {};
        return `<tr>
          <td><strong>${escapeHTML(item.name)}</strong><small>${escapeHTML(item.description || "").slice(0, 70)}</small></td>
          <td>${(item.tags || []).map((tag) => `<span class="mini-tag">${escapeHTML(tag)}</span>`).join("")}</td>
          <td>${escapeHTML(local.open_hours || "待补充")}</td>
          <td>${item.visit_duration_min || 30} 分钟</td>
          <td>${location.lat && (location.lng || location.lon) ? `${location.lat}, ${location.lng || location.lon}` : "暂无坐标"}</td>
          <td><span class="status-pill ${item.is_active ? "success" : "pending"}">${local.is_hot ? "热门" : item.is_active ? "展示中" : "停用"}</span></td>
          <td><div class="table-actions"><button type="button" data-edit-spot="${item.id}">编辑</button><button type="button" class="danger" data-delete-spot="${item.id}">删除</button></div></td>
        </tr>`;
      }).join("")}
    </tbody></table>` : '<div class="admin-empty">暂无景点，请先新增景点资料。</div>';
  $("spotsList").querySelectorAll("[data-edit-spot]").forEach((button) => {
    button.onclick = () => fillSpotForm(items.find((item) => String(item.id) === button.dataset.editSpot));
  });
  $("spotsList").querySelectorAll("[data-delete-spot]").forEach((button) => {
    button.onclick = () => deleteSpot(button.dataset.deleteSpot).catch((error) => toast(error.message));
  });
}

function fillSpotForm(item) {
  if (!item) return;
  switchAdminSubtab("scenic", "scenicEditorPanel");
  const local = scenicLocalMeta()[item.id] || {};
  const location = item.location || {};
  $("spotId").value = item.id;
  $("spotName").value = item.name || "";
  $("spotDesc").value = item.description || "";
  $("spotTags").value = (item.tags || []).join("、");
  $("spotDuration").value = item.visit_duration_min || 30;
  $("spotLat").value = location.lat || "";
  $("spotLng").value = location.lng || location.lon || "";
  $("spotOpenHours").value = local.open_hours || "";
  $("spotHot").checked = Boolean(local.is_hot);
  $("spotName").focus();
}

function resetSpotForm() {
  $("spotForm").reset();
  $("spotId").value = "";
  $("spotDuration").value = 30;
}

function splitTags(value) {
  return value.split(/[,，、]/).map((item) => item.trim()).filter(Boolean);
}

async function createSpot(event) {
  event.preventDefault();
  const spotId = $("spotId").value;
  const lat = Number($("spotLat").value);
  const lng = Number($("spotLng").value);
  const saved = await request(spotId ? `/api/admin/spots/${spotId}` : "/api/admin/spots", {
    method: spotId ? "PUT" : "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      name: $("spotName").value,
      description: $("spotDesc").value,
      tags: splitTags($("spotTags").value),
      visit_duration_min: Number($("spotDuration").value || 30),
      location: Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null,
    }),
  });
  const image = $("spotImage").files[0];
  if (image && saved?.id) {
    const form = new FormData();
    form.append("file", image);
    await request(`/api/admin/spots/${saved.id}/image`, { method: "POST", headers: authHeaders(), body: form });
  }
  const meta = scenicLocalMeta();
  meta[saved.id] = { open_hours: $("spotOpenHours").value.trim(), is_hot: $("spotHot").checked };
  localStorage.setItem("dg_scenic_admin_meta", JSON.stringify(meta));
  resetSpotForm();
  toast(spotId ? "景点已更新" : "景点已新增");
  loadScenic().catch(() => {});
}

async function deleteSpot(id) {
  if (!window.confirm("确定删除这个景点吗？")) return;
  await request(`/api/admin/spots/${id}`, { method: "DELETE", headers: authHeaders() });
  const meta = scenicLocalMeta();
  delete meta[id];
  localStorage.setItem("dg_scenic_admin_meta", JSON.stringify(meta));
  toast("景点已删除");
  loadScenic().catch(() => {});
}

async function createRoute(event) {
  event.preventDefault();
  let spotSequence = [];
  try {
    spotSequence = $("routeSpots").value ? JSON.parse($("routeSpots").value) : [];
  } catch {
    return toast("景点序列 JSON 格式不正确");
  }
  await request("/api/admin/routes", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      name: $("routeName").value,
      description: $("routeDesc").value,
      target_tags: splitTags($("routeTags").value),
      duration_hours: Number($("routeHours").value || 0) || null,
      spot_sequence: spotSequence,
    }),
  });
  event.target.reset();
  $("routeHours").value = 2;
  toast("路线已新增");
  loadScenic().catch(() => {});
}

async function loadHumanConfig() {
  if (!state.token) return;
  const cfg = await request("/api/admin/digital-human/config", { headers: authHeaders() });
  if (!cfg) return;
  $("cfgName").value = cfg.name || "";
  $("cfgAppearance").value = cfg.appearance || "modern";
  $("cfgVoiceGender").value = cfg.voice_gender || "female";
  $("cfgVoiceSpeed").value = cfg.voice_speed || "medium";
  $("cfgExpression").value = cfg.expression_style || "lively";
  const extra = cfg.extra_config || {};
  $("cfgRole").value = extra.role || "灵山胜境 AI 导览员";
  $("cfgWelcome").value = extra.welcome_message || "您好，我是灵山胜境 AI 导览员小导，很高兴陪你游览。";
  $("cfgVolume").value = extra.volume ?? 85;
  $("cfgAutoVoice").checked = extra.auto_voice !== false;
  $("cfgInterrupt").checked = extra.allow_interrupt !== false;
  $("cfgMotion").value = extra.default_motion || "idle";
  $("cfgModelPath").value = extra.live2d_model_path || "";
  $("cfgThemeColor").value = extra.theme_color || "#168f91";
  $("cfgPosition").value = extra.position || "left";
  $("adminHumanPreviewName").textContent = cfg.name || "小导";
  $("adminHumanPreviewRole").textContent = extra.role || "灵山胜境 AI 导览员";
  renderAvatarPreview(cfg.avatar_url);
  applyHumanConfig(cfg);
}

function renderAvatarPreview(url) {
  const preview = $("avatarPreview");
  if (!url) {
    preview.className = "avatar-fallback";
    preview.innerHTML = "DG";
    return;
  }
  preview.className = "avatar-image";
  preview.innerHTML = `<img src="${escapeHTML(url)}" alt="数字人头像" />`;
}

async function uploadAvatarIfNeeded() {
  const file = $("avatarFile").files[0];
  if (!file) return null;
  const form = new FormData();
  form.append("file", file);
  const data = await request("/api/admin/digital-human/avatar", { method: "POST", headers: authHeaders(), body: form });
  return data.avatar_url;
}

async function saveHumanConfig(event) {
  event.preventDefault();
  const avatarUrl = await uploadAvatarIfNeeded();
  const extraConfig = {
    ...(state.humanConfig?.extra_config || {}),
    ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    role: $("cfgRole").value.trim(),
    welcome_message: $("cfgWelcome").value.trim(),
    volume: Number($("cfgVolume").value || 85),
    auto_voice: $("cfgAutoVoice").checked,
    allow_interrupt: $("cfgInterrupt").checked,
    default_motion: $("cfgMotion").value.trim() || "idle",
    live2d_model_path: $("cfgModelPath").value.trim(),
    theme_color: $("cfgThemeColor").value,
    position: $("cfgPosition").value,
  };
  const cfg = await request("/api/admin/digital-human/config", {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      name: $("cfgName").value,
      appearance: $("cfgAppearance").value,
      voice_gender: $("cfgVoiceGender").value,
      voice_speed: $("cfgVoiceSpeed").value,
      expression_style: $("cfgExpression").value,
      extra_config: extraConfig,
    }),
  });
  localStorage.setItem("dg_admin_human_settings", JSON.stringify(extraConfig));
  renderAvatarPreview(cfg.avatar_url);
  applyHumanConfig(cfg);
  $("adminHumanPreviewName").textContent = cfg.name || "小导";
  $("adminHumanPreviewRole").textContent = extraConfig.role;
  document.documentElement.style.setProperty("--brand", extraConfig.theme_color);
  toast("数字人配置已保存");
}

function bindEvents() {
  if ($("apiBase")) $("apiBase").value = state.apiBase;
  $("visitorRoleBtn").onclick = () => setRoleForm("visitor");
  $("adminRoleBtn").onclick = () => setRoleForm("admin");
  $("visitorLoginForm").onsubmit = (event) => {
    event.preventDefault();
    state.visitorName = $("visitorNameInput").value.trim() || "临时游客";
    localStorage.setItem("dg_visitor_name", state.visitorName);
    enterApp("visitor");
  };
  $("adminLoginForm").onsubmit = (event) => adminLogin(event).catch((err) => toast(err.message));
  $("logoutBtn").onclick = logout;
  $("sidebarToggle").onclick = toggleSidebar;
  const historyToggle = $("historyToggleBtn");
  if (historyToggle) historyToggle.onclick = () => setHistoryOpen(!document.body.classList.contains("history-open"));
  $("historyCloseBtn").onclick = () => setHistoryOpen(!document.body.classList.contains("history-open"));

  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.onclick = () => switchView(btn.dataset.view);
  });
  document.querySelectorAll("[data-subtab-target]").forEach((button) => {
    button.onclick = () => switchAdminSubtab(button.dataset.subtabGroup, button.dataset.subtabTarget);
  });
  document.querySelectorAll("[data-question]").forEach((btn) => {
    btn.onclick = () => sendMessage(btn.dataset.question).catch((err) => toast(err.message));
  });

  $("newConversationBtn").onclick = () => createConversation().catch((err) => toast(err.message));
  $("sendBtn").onclick = handleSendAction;
  $("attachmentBtn").onclick = () => toast("附件入口已预留，可继续接入图片识别与文档提问");
  $("chatInput").oninput = updateComposerState;
  $("chatInput").onkeydown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendAction();
    }
  };
  $("voiceBtn").onclick = toggleVoiceRecognition;
  $("stopReplyBtn").onclick = () => stopReply();
  $("recommendBtn").onclick = () => recommendRoute().catch((err) => toast(err.message));
  $("feedbackBtn").onclick = () => submitFeedback().catch((err) => toast(err.message));
  $("routeGuideBtn").onclick = askRouteGuide;
  $("routeStopReplyBtn").onclick = () => stopReply();
  $("routeGuideInput").onkeydown = (event) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      askRouteGuide();
    }
  };
  $("refreshStatsBtn").onclick = () => loadDashboard().catch((err) => toast(err.message));
  $("docForm").onsubmit = (event) => uploadDocument(event).catch((err) => toast(err.message));
  $("faqForm").onsubmit = (event) => createFAQ(event).catch((err) => toast(err.message));
  $("spotForm").onsubmit = (event) => createSpot(event).catch((err) => toast(err.message));
  $("spotFormReset").onclick = resetSpotForm;
  $("routeForm").onsubmit = (event) => createRoute(event).catch((err) => toast(err.message));
  $("humanForm").onsubmit = (event) => saveHumanConfig(event).catch((err) => toast(err.message));
  ["cfgName", "cfgAppearance", "cfgVoiceGender", "cfgVoiceSpeed", "cfgExpression"].forEach((id) => {
    $(id).oninput = previewHumanConfigFromForm;
  });
  ["cfgName", "cfgRole"].forEach((id) => {
    $(id).addEventListener("input", () => {
      $("adminHumanPreviewName").textContent = $("cfgName").value || "小导";
      $("adminHumanPreviewRole").textContent = $("cfgRole").value || "灵山胜境 AI 导览员";
    });
  });
  ["visitorAvatarEngine", "visitorAppearance", "visitorVoiceGender", "visitorVoiceSpeed", "visitorExpression"].forEach((id) => {
    $(id).oninput = previewVisitorHumanConfig;
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".history-item-wrap")) closeHistoryMenus();
  });
  window.addEventListener("beforeunload", () => {
    stopVoiceRecognition({ discardLateResults: true });
    stopReply();
    state.liveTalkingPc?.close();
  });
}

async function bootstrapApp() {
  try {
    await loadViewFragments();
  } catch (error) {
    console.error(error);
    document.body.innerHTML = `<div class="bootstrap-error"><strong>页面加载失败</strong><p>${escapeHTML(error.message)}</p><p>请通过本地前端服务访问，不要直接双击 index.html。</p></div>`;
    return;
  }
  bindEvents();
  restoreAdminSubtabs();
  initDraggableAssistantPanel();
  if (localStorage.getItem("dg_sidebar_collapsed") === "1") document.body.classList.add("sidebar-collapsed");
  renderRatingButtons();
  renderInterests(defaultInterests);
  renderHistoryList();
  setHistoryOpen(true);
  updateComposerState();
  applyHumanConfig({
    name: "小导",
    appearance: "modern",
    voice_gender: "female",
    voice_speed: "medium",
    expression_style: "lively",
    extra_config: JSON.parse(localStorage.getItem("dg_admin_human_settings") || "{}"),
    ...(state.visitorHumanConfig || {}),
  });
  setAvatarEngine(state.avatarEngine || "live2d", false);
  addMessage("assistant", "您好，我是景区 AI 导游小导。点击“新建会话”，就可以开始问我景点、路线和服务信息。", undefined, false);
  if (state.visitorName) $("visitorNameInput").value = state.visitorName;
  if (state.role === "admin" && state.token) enterApp("admin");
  if (state.role === "visitor") enterApp("visitor");
}

bootstrapApp();
