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
  live2dApp: null,
  live2dModel: null,
  liveTalkingPc: null,
  liveTalkingSessionId: "",
  liveTalkingConnected: false,
  liveTalkingBase: localStorage.getItem("dg_livetalking_base") || "http://127.0.0.1:8010",
  avatarEngine: localStorage.getItem("dg_avatar_engine") || "css",
  humanConfig: null,
  visitorHumanConfig: JSON.parse(localStorage.getItem("dg_visitor_human_config") || "null"),
  history: JSON.parse(localStorage.getItem("dg_conversation_history") || "[]"),
};

const $ = (id) => document.getElementById(id);
const defaultInterests = ["历史文化", "自然风光", "休闲娱乐", "亲子游", "摄影打卡"];
const live2dModels = {
  modern: "https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/shizuku/shizuku.model.json",
  hanfu: "https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/shizuku/shizuku.model.json",
  nature: "https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/shizuku/shizuku.model.json",
};
const scriptCache = new Map();

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
  state.role = role;
  localStorage.setItem("dg_role", role);
  $("authView").classList.add("hidden");
  $("appShell").classList.remove("hidden");
  document.body.classList.add("in-app");
  document.body.classList.toggle("role-visitor", role === "visitor");
  document.body.classList.toggle("role-admin", role === "admin");
  $("sessionLabel").textContent = role === "admin" ? "管理员工作台" : `游客：${state.visitorName || "临时游客"}`;

  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.disabled = role !== "admin" && btn.dataset.view === "admin";
  });

  switchView(role === "admin" ? "admin" : "visitor");
  renderHistoryList();
  if (role === "admin") loadDashboard().catch((err) => toast(err.message));
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
}

function switchAdminTab(tab) {
  document.querySelectorAll(".tab").forEach((btn) => btn.classList.toggle("active", btn.dataset.adminTab === tab));
  document.querySelectorAll(".admin-tab").forEach((panel) => panel.classList.remove("active"));
  $(`${tab}Tab`).classList.add("active");
  if (tab === "dashboard") loadDashboard().catch((err) => toast(err.message));
  if (tab === "knowledge") loadKnowledge().catch((err) => toast(err.message));
  if (tab === "scenic") loadScenic().catch((err) => toast(err.message));
  if (tab === "human") loadHumanConfig().catch((err) => toast(err.message));
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

function liveTalkingBase() {
  const input = $("liveTalkingBase");
  state.liveTalkingBase = (input?.value || state.liveTalkingBase || "http://127.0.0.1:8010").replace(/\/$/, "");
  localStorage.setItem("dg_livetalking_base", state.liveTalkingBase);
  return state.liveTalkingBase;
}

function setAvatarEngine(engine, persist = true) {
  state.avatarEngine = engine || "live2d";
  if (persist) localStorage.setItem("dg_avatar_engine", state.avatarEngine);
  const panel = document.querySelector(".human-panel");
  if (!panel) return;
  panel.classList.remove("engine-live2d", "engine-livetalking", "engine-css", "engine-loading", "livetalking-connected");
  panel.classList.add(`engine-${state.avatarEngine}`);
  const select = $("visitorAvatarEngine");
  if (select && select.value !== state.avatarEngine) select.value = state.avatarEngine;
  if (state.avatarEngine === "live2d") initLive2D().catch(() => {
    setAvatarEngineStatus("Live2D 加载失败，已切换本地 2D");
    setAvatarEngine("css", false);
  });
  if (state.avatarEngine === "livetalking") {
    setAvatarEngineStatus(state.liveTalkingConnected ? `LiveTalking 已连接 ${state.liveTalkingSessionId}` : "等待连接 LiveTalking");
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
  const panel = document.querySelector(".human-panel");
  const canvas = $("live2dCanvas");
  if (!panel || !canvas) return;
  panel.classList.add("engine-loading");
  setAvatarEngineStatus("Live2D 模型加载中");

  await loadScriptOnce("https://cdn.jsdelivr.net/npm/pixi.js@6.5.10/dist/browser/pixi.min.js");
  await loadScriptOnce("https://cdn.jsdelivr.net/npm/pixi-live2d-display@0.4.0/dist/extra/live2d.min.js");
  await loadScriptOnce("https://cdn.jsdelivr.net/npm/pixi-live2d-display@0.4.0/dist/cubism2.min.js");

  if (!window.PIXI?.live2d?.Live2DModel) throw new Error("Live2D runtime unavailable");
  if (!state.live2dApp) {
    state.live2dApp = new PIXI.Application({
      view: canvas,
      autoStart: true,
      transparent: true,
      antialias: true,
      resizeTo: canvas.parentElement,
    });
  }
  await loadLive2DModel();
  panel.classList.remove("engine-loading");
  panel.classList.add("engine-live2d");
  setAvatarEngineStatus("Live2D 开源模型");
}

async function loadLive2DModel() {
  if (!state.live2dApp || !window.PIXI?.live2d?.Live2DModel) return;
  const appearance = state.humanConfig?.appearance || "modern";
  const modelUrl = live2dModels[appearance] || live2dModels.modern;
  if (state.live2dModel?.modelUrl === modelUrl) {
    styleLive2DModel();
    return;
  }
  if (state.live2dModel) {
    state.live2dApp.stage.removeChild(state.live2dModel);
    state.live2dModel.destroy?.();
    state.live2dModel = null;
  }
  const model = await PIXI.live2d.Live2DModel.from(modelUrl);
  model.modelUrl = modelUrl;
  model.anchor.set(0.5, 0.5);
  state.live2dApp.stage.addChild(model);
  state.live2dModel = model;
  styleLive2DModel();
}

function styleLive2DModel() {
  const model = state.live2dModel;
  const app = state.live2dApp;
  if (!model || !app) return;
  const width = app.renderer.width || 320;
  const height = app.renderer.height || 320;
  model.x = width / 2;
  model.y = height * 0.82;
  const base = Math.min(width / model.width, height / model.height) * 1.75;
  model.scale.set(Math.max(0.18, Math.min(base, 0.42)));
  model.rotation = 0;
  model.alpha = 1;
  model.tint = state.humanConfig?.appearance === "hanfu"
    ? 0xffedf0
    : state.humanConfig?.appearance === "nature"
      ? 0xe9fff0
      : 0xffffff;
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
  $("humanName").textContent = merged.name || "小导";
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
  $("digitalHuman").style.setProperty("--mouth-open", "8px");
  $("virtualAnchor")?.style.setProperty("--mouth-open", "6px");
  setLive2DMouth(0);
}

function setLive2DMouth(value) {
  const model = state.live2dModel;
  if (!model) return;
  const normalized = Math.max(0, Math.min(1, value));
  try {
    const core = model.internalModel?.coreModel;
    if (core?.setParameterValueById) core.setParameterValueById("ParamMouthOpenY", normalized);
    if (core?.setParamFloat) core.setParamFloat("PARAM_MOUTH_OPEN_Y", normalized);
  } catch {}
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
    analyser.fftSize = 128;
    const source = state.audioContext.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(state.audioContext.destination);
    const data = new Uint8Array(analyser.frequencyBinCount);
    const human = $("digitalHuman");

    const tick = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((sum, value) => sum + value, 0) / data.length;
      const open = Math.max(7, Math.min(28, avg / 5));
      human.style.setProperty("--mouth-open", `${open}px`);
      $("virtualAnchor")?.style.setProperty("--mouth-open", `${Math.max(6, Math.min(22, avg / 6))}px`);
      setLive2DMouth(open / 28);
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
  upsertConversationHistory({ id: state.conversationId, title: "新的导览会话", greeting });
  addMessage("assistant", greeting, undefined, false);
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
  if (!clean) return;
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

async function speakSentence(item, runId) {
  if (runId !== state.speechRunId) return;
  const { text, emotion, audioPromise } = item;
  if (state.avatarEngine === "livetalking" && state.liveTalkingSessionId) {
    const accepted = await speakWithLiveTalking(text, emotion, false);
    if (accepted) await waitForLiveTalkingSpeech(runId, text.length);
    return;
  }
  const blob = await audioPromise;
  if (!blob || runId !== state.speechRunId) return;
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
  if (!state.speechPlaying && !state.speechQueue.length) setHumanState({ emotion });
}

function renderRouteResult(data) {
  const spots = Array.isArray(data.spots) ? data.spots : [];
  updateMapRoute(spots);
  const steps = spots.map((spot, index) => {
    const name = escapeHTML(spot.name || spot.spot_name || `景点 ${index + 1}`);
    const desc = escapeHTML(spot.highlight || spot.description || "");
    return `<li><span>${index + 1}</span><div><strong>${name}</strong>${desc ? `<p>${desc}</p>` : ""}</div></li>`;
  }).join("");
  $("routeResult").innerHTML = `
    <div class="route-card">
      <strong>${escapeHTML(data.route_name || data.name || "推荐路线")}</strong>
      <small>${data.duration_hours ? `${data.duration_hours} 小时` : "时长可调整"}</small>
      <p>${escapeHTML(data.reason || data.description || "已根据兴趣偏好生成路线。")}</p>
      ${steps ? `<ol class="route-timeline">${steps}</ol>` : '<div class="empty-mini">暂无景点序列，可在后台补充路线数据。</div>'}
    </div>
  `;
}

function updateMapRoute(spots = []) {
  const names = spots
    .map((spot) => String(spot.name || spot.spot_name || "").trim())
    .filter(Boolean);
  const nodes = document.querySelectorAll(".map-node");
  if (!nodes.length) return;

  nodes.forEach((node) => {
    const name = node.dataset.spotName || "";
    const index = names.findIndex((item) => name.includes(item) || item.includes(name));
    node.classList.toggle("active", index >= 0 || (!names.length && node.dataset.spotName === "东门"));
    const badge = node.querySelector("span");
    if (badge && index >= 0) badge.textContent = index + 1;
  });
  $("activeRouteLine")?.classList.toggle("is-planned", names.length > 0);
}

async function recommendRoute() {
  if (!state.conversationId) await createConversation();
  setHumanState({ thinking: true, emotion: "thinking" });
  const data = await request("/api/routes/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      interest_tags: state.interests,
      available_hours: Number($("availableHours").value || 0) || null,
      current_area: $("currentArea").value || null,
    }),
  });
  renderRouteResult(data);
  setHumanState({ emotion: "happy" });
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

function askRouteGuide() {
  const input = $("routeGuideInput");
  const text = input.value.trim();
  if (!text) return toast("先输入想问小导的路线问题");
  input.value = "";
  sendMessage(text).catch((err) => toast(err.message));
  toast("已发送给小导，完整回答会出现在游客交互端");
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

async function loadDashboard() {
  if (!state.token) return;
  const [overview, satisfaction, hot, interest, blind] = await Promise.all([
    request("/api/admin/stats/overview?range=today", { headers: authHeaders() }),
    request("/api/admin/stats/satisfaction?range=week", { headers: authHeaders() }),
    request("/api/admin/stats/hot-questions?range=week&limit=8", { headers: authHeaders() }),
    request("/api/admin/stats/interest-distribution?range=month", { headers: authHeaders() }),
    request("/api/admin/knowledge/blind-spots?range=week", { headers: authHeaders() }),
  ]);
  renderStats(overview);
  renderTrend(satisfaction.trend || []);
  renderList("hotQuestions", hot.items || [], (item) => `${escapeHTML(item.question_pattern)}<br><small>${item.count} 次</small>`);
  renderInterestDistribution(interest || {});
  renderList("blindSpots", blind.items || [], (item) => `${escapeHTML(item.question_pattern)}<br><small>${item.count} 次，最近 ${escapeHTML(item.last_asked_at || "")}</small>`);
}

function renderStats(data = {}) {
  const items = [
    ["服务人次", data.total_conversations ?? 0],
    ["消息总数", data.total_messages ?? 0],
    ["平均延迟", data.avg_response_ms ? `${Math.round(data.avg_response_ms)}ms` : "-"],
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
  const [docs, faq] = await Promise.all([
    request("/api/admin/knowledge/documents?page=1&page_size=20", { headers: authHeaders() }),
    request("/api/admin/knowledge/faq?page=1&page_size=20", { headers: authHeaders() }),
  ]);
  renderKnowledgeDocuments(docs.items || []);
  renderKnowledgeFAQ(faq.items || []);
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
  renderList("spotsList", spots || [], (item) => `${escapeHTML(item.name)}<br><small>${escapeHTML((item.tags || []).join("、"))} · ${item.visit_duration_min} 分钟</small>`);
  renderList("routesList", routes || [], (item) => `${escapeHTML(item.name)}<br><small>${escapeHTML((item.target_tags || []).join("、"))} · ${item.duration_hours || "-"} 小时</small>`);
}

function splitTags(value) {
  return value.split(/[,，、]/).map((item) => item.trim()).filter(Boolean);
}

async function createSpot(event) {
  event.preventDefault();
  await request("/api/admin/spots", {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      name: $("spotName").value,
      description: $("spotDesc").value,
      tags: splitTags($("spotTags").value),
      visit_duration_min: Number($("spotDuration").value || 30),
    }),
  });
  event.target.reset();
  $("spotDuration").value = 30;
  toast("景点已新增");
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
  const extraConfig = avatarUrl ? { avatar_url: avatarUrl } : undefined;
  const cfg = await request("/api/admin/digital-human/config", {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      name: $("cfgName").value,
      appearance: $("cfgAppearance").value,
      voice_gender: $("cfgVoiceGender").value,
      voice_speed: $("cfgVoiceSpeed").value,
      expression_style: $("cfgExpression").value,
      ...(extraConfig ? { extra_config: extraConfig } : {}),
    }),
  });
  renderAvatarPreview(cfg.avatar_url);
  applyHumanConfig(cfg);
  toast("数字人配置已保存");
}

function bindEvents() {
  if ($("apiBase")) $("apiBase").value = state.apiBase;
  if ($("liveTalkingBase")) $("liveTalkingBase").value = state.liveTalkingBase;
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
  document.querySelectorAll(".tab").forEach((btn) => {
    btn.onclick = () => switchAdminTab(btn.dataset.adminTab);
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
  $("liveTalkingConnectBtn").onclick = () => connectLiveTalking().catch((err) => {
    setAvatarEngineStatus("LiveTalking 连接失败");
    toast(err.message);
  });
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
  $("routeForm").onsubmit = (event) => createRoute(event).catch((err) => toast(err.message));
  $("humanForm").onsubmit = (event) => saveHumanConfig(event).catch((err) => toast(err.message));
  ["cfgName", "cfgAppearance", "cfgVoiceGender", "cfgVoiceSpeed", "cfgExpression"].forEach((id) => {
    $(id).oninput = previewHumanConfigFromForm;
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

bindEvents();
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
  ...(state.visitorHumanConfig || {}),
});
setAvatarEngine(state.avatarEngine || "live2d", false);
addMessage("assistant", "您好，我是景区 AI 导游小导。点击“新建会话”，就可以开始问我景点、路线和服务信息。", undefined, false);
if (state.visitorName) $("visitorNameInput").value = state.visitorName;
if (state.role === "admin" && state.token) enterApp("admin");
if (state.role === "visitor") enterApp("visitor");
