import {
  LIVE2D_MODELS,
  LIVE2D_RENDER_SIZE,
  LIVE2D_ROLE_DEFAULTS,
} from "../config/live2d.js";

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
  live2dModelLoadId: 0,
  vrmAvatar: null,
  vrmAvatarInitPromise: null,
  browserMouthTimer: null,
  liveTalkingPc: null,
  liveTalkingSessionId: "",
  liveTalkingConnected: false,
  liveTalkingBase: localStorage.getItem("dg_livetalking_base") || "http://127.0.0.1:8010",
  avatarEngine: "live2d",
  humanConfig: null,
  visitorHumanConfig: safeJSONParse(localStorage.getItem("dg_visitor_human_config"), null),
  history: normalizeHistory(safeJSONParse(localStorage.getItem("dg_conversation_history"), [])),
  routeMap: null,
  routeMarkers: [],
  routePolyline: null,
  routeSpots: [],
  selectedRouteSpot: -1,
  latestRoutePlan: safeJSONParse(localStorage.getItem("dg_latest_route_plan"), null),
  routeCatalogLoaded: false,
  routeCatalogLoading: null,
  latestRoutePreference: "",
};

const $ = (id) => document.getElementById(id);

function safeJSONParse(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeHistoryItem(item = {}) {
  const messages = Array.isArray(item.messages)
    ? item.messages
        .filter((msg) => msg && typeof msg === "object")
        .map((msg) => ({
          role: msg.role === "user" ? "user" : "assistant",
          content: String(msg.content || ""),
        }))
        .filter((msg) => msg.content)
    : [];
  return {
    ...item,
    id: item.id || item.conversation_id || crypto.randomUUID(),
    title: item.title || item.name || "鏂扮殑瀵艰浼氳瘽",
    messages,
    updatedAt: item.updatedAt || item.updated_at || new Date().toISOString(),
  };
}

function normalizeHistory(value) {
  return Array.isArray(value) ? value.map(normalizeHistoryItem).filter((item) => item.id) : [];
}
const defaultInterests = ["鍘嗗彶鏂囧寲", "鑷劧椋庡厜", "浼戦棽濞变箰", "浜插瓙娓?, "鎽勫奖鎵撳崱"];
const scenicSpots = [
  {
    id: "lingshan_screen",
    name: "鐏靛北澶х収澹?,
    aliases: ["澶х収澹?, "鐏靛北鐓у"],
    lat: 31.41915,
    lng: 120.091,
    intro: "鐏靛北鑳滃鍏ュ彛澶勭殑鏍囧織鎬ф櫙瑙傦紝涔熸槸杩涘叆鏅尯鍚庣殑绗竴澶勬枃鍖栧簭绔犮€?,
    duration: "10鍒嗛挓",
    tags: ["鍏ュ彛鏅", "浣涙暀鏂囧寲", "鎷嶇収鎵撳崱"],
  },
  {
    id: "shengjing_square",
    name: "鑳滃骞垮満",
    aliases: ["鐏靛北鑳滃骞垮満"],
    lat: 31.41985,
    lng: 120.09165,
    intro: "寮€闃旇垝閫傜殑鍏ュ洯闆嗘暎绌洪棿锛岄€傚悎鏁寸悊琛岀▼骞朵簡瑙ｆ櫙鍖烘暣浣撳竷灞€銆?,
    duration: "10鍒嗛挓",
    tags: ["浼戦棽婕", "娓稿闆嗘暎"],
  },
  {
    id: "wuming_bridge",
    name: "浜旀槑妗?,
    aliases: ["浜旀槑妗ユ櫙鐐?],
    lat: 31.4202,
    lng: 120.09235,
    intro: "浜斿骇姹夌櫧鐜夌煶鎷辨ˉ骞跺垪妯法棣欐按娴凤紝瀵撴剰浣涙暀浜旂鏍稿績鏅烘収銆?,
    duration: "10鍒嗛挓",
    tags: ["浣涙暀鏂囧寲", "寤虹瓚鑹烘湳", "鎷嶇収鎵撳崱"],
  },
  {
    id: "buddha_foot",
    name: "浣涜冻鍧?,
    aliases: ["浣涜冻鍗?, "浣涜冻鍧涙櫙鐐?],
    lat: 31.42075,
    lng: 120.0922,
    intro: "浠ヤ經瓒冲嵃涓烘牳蹇冪殑鏂囧寲鏅锛屽彲鍦ㄦ鎰熷彈搴勯噸瀹夊畞鐨勭ぜ浣涙皼鍥淬€?,
    duration: "15鍒嗛挓",
    tags: ["浣涙暀鏂囧寲", "浜烘枃鏅"],
  },
  {
    id: "hundred_children_maitreya",
    name: "鐧惧瓙鎴忓讥鍕?,
    aliases: ["鐧惧瓙寮ュ嫆", "寮ュ嫆浣?],
    lat: 31.4213,
    lng: 120.09275,
    intro: "鐢熷姩娲绘臣鐨勫讥鍕掍富棰樼兢鍍忥紝瀵撴剰娆㈠枩銆佸寘瀹逛笌鍚夌ゥ銆?,
    duration: "15鍒嗛挓",
    tags: ["浜插瓙娓?, "浣涙暀鏂囧寲", "闆曞鑹烘湳"],
  },
  {
    id: "nine_dragons",
    name: "涔濋緳鐏屾荡",
    aliases: ["涔濋緳鐏屾荡骞垮満", "涔濋緳鐏屾荡琛ㄦ紨"],
    lat: 31.42205,
    lng: 120.0932,
    intro: "澶у瀷鍔ㄦ€侀煶涔愮兢闆曟櫙瑙傦紝閫氳繃澹板厜姘存櫙鍛堢幇浣涢檧璇炵敓鏁呬簨銆?,
    duration: "25鍒嗛挓",
    tags: ["鏍稿績鏅偣", "婕旇壓鏅", "浜插瓙娓?],
  },
  {
    id: "bodhi_avenue",
    name: "鑿╂彁澶ч亾",
    aliases: ["鑿╂彁璺?],
    lat: 31.42305,
    lng: 120.0936,
    intro: "杩炴帴鏅尯閲嶈鏂囧寲鑺傜偣鐨勬櫙瑙傛閬擄紝缁挎剰鑸掑睍锛岄€傚悎鎱㈣娓歌銆?,
    duration: "20鍒嗛挓",
    tags: ["鑷劧椋庡厜", "浼戦棽婕", "鎷嶇収鎵撳崱"],
  },
  {
    id: "buddha_hand_square",
    name: "浣涙墜骞垮満",
    aliases: ["澶╀笅绗竴鎺?, "浣涙墜"],
    lat: 31.42395,
    lng: 120.0938,
    intro: "浠ュぇ鍨嬩經鎵嬮€犲儚涓烘牳蹇冪殑鐗硅壊骞垮満锛屾槸娓稿鍠滅埍鐨勪簰鍔ㄦ墦鍗＄偣銆?,
    duration: "15鍒嗛挓",
    tags: ["鎷嶇収鎵撳崱", "浣涙暀鏂囧寲"],
  },
  {
    id: "xiangfu_temple",
    name: "绁ョ绂呭",
    aliases: ["绁ョ瀵?, "绂呭"],
    lat: 31.425,
    lng: 120.0942,
    intro: "鍘嗗彶鎮犱箙鐨勪經鏁欏闄㈠缓绛戠兢锛岄€傚悎闈欏績鍙傝骞朵簡瑙ｅ闄㈡枃鍖栥€?,
    duration: "30鍒嗛挓",
    tags: ["浣涙暀鏂囧寲", "鍘嗗彶寤虹瓚", "闈欏績鍙傝"],
  },
  {
    id: "buddha_square",
    name: "浣涘墠骞垮満",
    aliases: ["澶т經骞垮満"],
    lat: 31.42655,
    lng: 120.0949,
    intro: "浠版湜鐏靛北澶т經鐨勪富瑕佽鏅┖闂达紝瑙嗛噹寮€闃旓紝浠紡鎰熼矞鏄庛€?,
    duration: "15鍒嗛挓",
    tags: ["鏍稿績鏅偣", "瑙傛櫙", "鎷嶇収鎵撳崱"],
  },
  {
    id: "lingshan_buddha",
    name: "鐏靛北澶т經",
    aliases: ["澶т經", "鐏靛北澶т經鏅尯"],
    lat: 31.42755,
    lng: 120.0953,
    intro: "鐏靛北鑳滃鏍稿績鏅偣涔嬩竴锛岄€傚悎浜嗚В浣涙暀鏂囧寲涓庡ぇ鍨嬮湶澶╅€犲儚鑹烘湳銆?,
    duration: "40鍒嗛挓",
    tags: ["浣涙暀鏂囧寲", "鏍稿績鏅偣", "鎷嶇収鎵撳崱"],
  },
  {
    id: "lingshan_palace",
    name: "鐏靛北姊靛",
    aliases: ["姊靛", "鐏靛北瀹?],
    lat: 31.4217,
    lng: 120.09745,
    intro: "铻嶅悎寤虹瓚銆佸鐢汇€侀洉濉戜笌婕旇壓鑹烘湳鐨勬枃鍖栧湴鏍囷紝鍐呴儴瑁呴グ鍗庣編銆?,
    duration: "45鍒嗛挓",
    tags: ["寤虹瓚鑹烘湳", "浣涙暀鏂囧寲", "瀹ゅ唴鍙傝"],
  },
  {
    id: "five_mudra_mandala",
    name: "浜斿嵃鍧涘煄",
    aliases: ["鍧涘煄", "浜斿嵃鍧涘煄鏂囧寲鍥?],
    lat: 31.4208,
    lng: 120.0987,
    intro: "鍏锋湁椴滄槑钘忓紡寤虹瓚鐗硅壊鐨勬枃鍖栨櫙瑙傦紝鍙劅鍙椾赴瀵岀殑鍧涘煄鑹烘湳銆?,
    duration: "35鍒嗛挓",
    tags: ["寤虹瓚鑹烘湳", "浣涙暀鏂囧寲", "鎷嶇収鎵撳崱"],
  },
  {
    id: "manfeilong_pagoda",
    name: "鏇奸榫欏",
    aliases: ["椋為緳濉?, "鏇奸榫欎經濉?],
    lat: 31.4229,
    lng: 120.09905,
    intro: "閫犲瀷绮惧阀鐨勪經濉旀櫙瑙傦紝鍛ㄨ竟瑙嗛噹鑸掑睍锛岄€傚悎鏂囧寲鍙傝涓庢憚褰便€?,
    duration: "20鍒嗛挓",
    tags: ["寤虹瓚鑹烘湳", "鎷嶇収鎵撳崱", "浜烘枃鏅"],
  },
  {
    id: "lingshan_lodge",
    name: "鐏靛北绮捐垗",
    aliases: ["绮捐垗"],
    lat: 31.42025,
    lng: 120.10005,
    intro: "鐜娓呭菇鐨勭鎰忕┖闂达紝閫傚悎鐭殏浼戞伅骞朵綋楠屼笢鏂圭敓娲荤編瀛︺€?,
    duration: "20鍒嗛挓",
    tags: ["浼戦棽浣撻獙", "绂呮剰绌洪棿"],
  },
  {
    id: "xingtan_square",
    name: "鏉忓潧骞垮満",
    aliases: ["鏉忓潧"],
    lat: 31.42565,
    lng: 120.09455,
    intro: "浣嶄簬绀间經涓昏酱绾夸笂鐨勫紑闃斿箍鍦猴紝鏄墠寰€浣涘墠骞垮満涓庣伒灞卞ぇ浣涚殑閲嶈鑺傜偣銆?,
    duration: "10鍒嗛挓",
    tags: ["浣涙暀鏂囧寲", "浼戦棽婕"],
  },
  {
    id: "sansheng_hall",
    name: "涓夊湥娈?,
    aliases: ["涓夊湥鍫?],
    lat: 31.42295,
    lng: 120.09765,
    intro: "浠ヤ經鏁欓€犲儚涓庢枃鍖栧睍绀轰负涓荤殑娈垮爞锛岄€傚悎杩涗竴姝ヤ簡瑙ｄ經鏁欒壓鏈笌绀间华銆?,
    duration: "20鍒嗛挓",
    tags: ["浣涙暀鏂囧寲", "浜烘枃鏅"],
  },
  {
    id: "palace_square",
    name: "姊靛骞垮満",
    aliases: ["鐏靛北姊靛骞垮満"],
    lat: 31.42125,
    lng: 120.09685,
    intro: "鐏靛北姊靛鍓嶇殑寮€闃旀櫙瑙傜┖闂达紝鍙畬鏁存璧忔⒌瀹缓绛戠兢涓庡懆杈圭幆澧冦€?,
    duration: "15鍒嗛挓",
    tags: ["寤虹瓚鑹烘湳", "鑷劧椋庡厜", "鎷嶇収鎵撳崱"],
  },
  {
    id: "demon_relief",
    name: "闄嶉瓟娴洉",
    aliases: ["闄嶉瓟鎴愰亾娴洉"],
    lat: 31.42045,
    lng: 120.0919,
    intro: "浠ヤ經鏁欐晠浜嬩负涓婚鐨勫ぇ鍨嬫诞闆曟櫙瑙傦紝閫氳繃缁嗚吇閫犲瀷鍛堢幇闄嶉瓟鎴愰亾鍦烘櫙銆?,
    duration: "10鍒嗛挓",
    tags: ["浣涙暀鏂囧寲", "闆曞鑹烘湳"],
  },
];
// The original fallback catalog was drawn around an approximate anchor.
// Align every fallback point to the published WGS84 coordinate of the Grand
// Buddha so OpenStreetMap markers match the visible scenic area more closely.
const fallbackCoordinateCorrection = {
  lat: 31.43194 - 31.42755,
  lng: 120.09139 - 120.0953,
};
scenicSpots.forEach((spot) => {
  if (Number.isFinite(spot.lat) && Number.isFinite(spot.lng)) {
    spot.lat += fallbackCoordinateCorrection.lat;
    spot.lng += fallbackCoordinateCorrection.lng;
  }
});
defaultInterests.splice(0, defaultInterests.length, "历史文化", "自然风光", "休闲娱乐", "亲子游", "摄影打卡");
scenicSpots.splice(0, scenicSpots.length, ...[
  {
    id: "lingshan_screen",
    name: "灵山大照壁",
    aliases: ["大照壁", "华夏第一壁", "灵山照壁"],
    lat: 31.41915,
    lng: 120.091,
    intro: "景区入口处的标志性景观，适合作为路线起点，快速了解景区文化序章。",
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
    intro: "五座汉白玉石拱桥并列横跨香水河，寓意佛教五种核心智慧。",
    duration: "10分钟",
    tags: ["佛教文化", "建筑艺术", "拍照打卡"],
  },
  {
    id: "buddha_foot",
    name: "佛足坛",
    aliases: ["佛足印", "佛足坛景点"],
    lat: 31.42075,
    lng: 120.0922,
    intro: "以佛足印为核心的人文景观，可在此感受庄重安宁的礼佛氛围。",
    duration: "15分钟",
    tags: ["佛教文化", "人文景观"],
  },
  {
    id: "jiulong",
    name: "九龙灌浴",
    aliases: ["九龙灌浴广场", "九龙灌浴表演"],
    lat: 31.42255,
    lng: 120.09308,
    intro: "以释迦太子诞生传说为主题的动态景观，结合音乐、喷泉和佛光效果，是亲子与首次到访游客都很适合的开场体验。",
    duration: "20分钟",
    tags: ["核心景点", "亲子游", "佛教文化"],
  },
  {
    id: "buddha_hand_square",
    name: "佛手广场",
    aliases: ["天下第一掌", "佛手"],
    lat: 31.424,
    lng: 120.0938,
    intro: "“天下第一掌”所在的互动广场，摸佛手寓意祈福、平安和吉祥。",
    duration: "15分钟",
    tags: ["佛教文化", "互动体验", "拍照打卡"],
  },
  {
    id: "baizi",
    name: "百子戏弥勒",
    aliases: ["百子戏弥勒雕塑群", "弥勒佛"],
    lat: 31.42465,
    lng: 120.0941,
    intro: "孩童与弥勒佛的欢快场景，形象轻松亲切，适合家庭游客拍照和理解佛教生活智慧。",
    duration: "15分钟",
    tags: ["亲子游", "休闲娱乐", "拍照打卡"],
  },
  {
    id: "xiangfu_temple",
    name: "祥符禅寺",
    aliases: ["祥符寺", "禅寺"],
    lat: 31.4262,
    lng: 120.0944,
    intro: "古朴寺庙，与景区佛教文化脉络相关，适合喜欢历史与宗教故事的游客深度停留。",
    duration: "25分钟",
    tags: ["历史文化", "佛教文化", "宗教建筑"],
  },
  {
    id: "xingtan_square",
    name: "杏坛广场",
    aliases: ["杏坛"],
    lat: 31.42695,
    lng: 120.09505,
    intro: "连接主要文化节点的广场空间，可作为前往大佛区域的过渡。",
    duration: "10分钟",
    tags: ["休闲漫步", "路线过渡"],
  },
  {
    id: "buddha_square",
    name: "佛前广场",
    aliases: ["佛前"],
    lat: 31.4281,
    lng: 120.09575,
    intro: "位于大佛前的核心观赏空间，视野开阔，适合拍摄大佛全景。",
    duration: "15分钟",
    tags: ["核心景点", "拍照打卡"],
  },
  {
    id: "lingshan_buddha",
    name: "灵山大佛",
    aliases: ["大佛", "灵山大佛景区", "青铜大佛"],
    lat: 31.43194,
    lng: 120.09139,
    intro: "大型青铜露天造像，是景区核心景点之一，适合了解佛教文化与大型造像艺术。",
    duration: "30分钟",
    tags: ["佛教文化", "核心景点", "拍照打卡"],
  },
  {
    id: "fan_gong",
    name: "灵山梵宫",
    aliases: ["梵宫", "灵山梵宫", "梵宫艺术殿堂"],
    lat: 31.4266,
    lng: 120.0915,
    intro: "集木雕、琉璃、穹顶天象和佛教艺术于一体的建筑艺术空间，适合深度讲解。",
    duration: "40分钟",
    tags: ["建筑艺术", "历史文化", "佛教文化"],
  },
  {
    id: "wuyin_tancheng",
    name: "五印坛城",
    aliases: ["坛城", "五印坛城景点"],
    lat: 31.428,
    lng: 120.0888,
    intro: "体现藏传佛教曼茶罗概念的体验空间，可观看转经筒、唐卡和墙体艺术。",
    duration: "35分钟",
    tags: ["佛教文化", "民族艺术", "深度体验"],
  },
  {
    id: "mansara",
    name: "曼飞龙塔",
    aliases: ["曼飞龙塔", "龙塔"],
    lat: 31.4291,
    lng: 120.0876,
    intro: "具有异域风情的塔式景观，可放入自然风光与拍照路线中。",
    duration: "15分钟",
    tags: ["建筑艺术", "拍照打卡"],
  },
  {
    id: "jingtu",
    name: "灵山精舍",
    aliases: ["精舍", "精舍区"],
    lat: 31.4273,
    lng: 120.0882,
    intro: "较为宁静的文化休息区，适合需要缓步慢游的游客。",
    duration: "20分钟",
    tags: ["休闲漫步", "自然风光"],
  },
  {
    id: "fan_gong_square",
    name: "梵宫广场",
    aliases: ["梵宫外广场"],
    lat: 31.42605,
    lng: 120.09095,
    intro: "梵宫外部广场，适合拍摄建筑外观并过渡到室内参观。",
    duration: "10分钟",
    tags: ["拍照打卡", "建筑艺术"],
  },
]);
const live2dModels = LIVE2D_MODELS;
const live2dRoleDefaults = {
  ...LIVE2D_ROLE_DEFAULTS,
  modern: { ...LIVE2D_ROLE_DEFAULTS.modern, name: "AI 瀵艰鍛? },
  hanfu: { ...LIVE2D_ROLE_DEFAULTS.hanfu, role: "鏅尯鏂囧寲璁茶В鍛? },
  nature: { name: "AI 瀵艰鍛?, role: "鑷劧鎺㈢储鍚戝" },
};
const LIVE2D_RENDER_WIDTH = LIVE2D_RENDER_SIZE.width;
const LIVE2D_RENDER_HEIGHT = LIVE2D_RENDER_SIZE.height;
const scriptCache = new Map();

function apiBase() {
  const input = $("apiBase");
  state.apiBase = (input?.value || state.apiBase || "http://localhost:8000").replace(/\/$/, "");
  localStorage.setItem("dg_api_base", state.apiBase);
  return state.apiBase;
}

function resolveMediaURL(value = "") {
  const source = String(value || "").trim();
  if (!source) return "";
  if (/^(?:https?:|data:|blob:)/i.test(source)) return source;
  return `${apiBase()}${source.startsWith("/") ? "" : "/"}${source}`;
}

function authHeaders(extra = {}) {
  return { ...extra, ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}) };
}

function readErrorMessage(text, fallback) {
  if (!text) return fallback;
  try {
    const data = JSON.parse(text);
    if (Array.isArray(data.detail)) return data.detail.map((item) => item.msg).join("锛?);
    return data.detail || data.message || fallback;
  } catch {
    return text;
  }
}

async function request(path, options = {}) {
  const res = await fetch(`${apiBase()}${path}`, options);
  if (!res.ok) {
    const text = await res.text();
    const message = readErrorMessage(text, `璇锋眰澶辫触锛?{res.status}`);
    if (res.status === 401 && state.token) {
      clearExpiredLogin();
      throw new Error("鐧诲綍宸茶繃鏈燂紝璇烽噸鏂扮櫥褰曠鐞嗗悗鍙般€?);
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

function hasAuthView() {
  return Boolean($("authView"));
}

function isVisitorOnlyEntry() {
  return document.body?.dataset?.visitorEntry === "next" || !hasAuthView();
}

function goHome() {
  window.location.href = "/";
}

function setRoleForm(role) {
  if (!hasAuthView()) return;
  $("visitorRoleBtn")?.classList.toggle("active", role === "visitor");
  $("adminRoleBtn")?.classList.toggle("active", role === "admin");
  $("visitorLoginForm")?.classList.toggle("active", role === "visitor");
  $("adminLoginForm")?.classList.toggle("active", role === "admin");
}

function clearExpiredLogin() {
  state.token = "";
  state.role = "";
  localStorage.removeItem("dg_admin_token");
  localStorage.removeItem("dg_role");
  if (isVisitorOnlyEntry()) {
    goHome();
    return;
  }
  $("authView")?.classList.remove("hidden");
  $("appShell")?.classList.add("hidden");
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
  $("authView")?.classList.add("hidden");
  $("appShell")?.classList.remove("hidden");
  document.body.classList.add("in-app");
  document.body.classList.toggle("role-visitor", role === "visitor");
  document.body.classList.toggle("role-admin", role === "admin");
  $("sessionLabel").textContent = role === "admin" ? "绠＄悊鍛樺伐浣滃彴" : `娓稿锛?{state.visitorName || "涓存椂娓稿"}`;
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
    ["visitor", "娓?, "娓稿浜や簰绔?],
    ["routeMap", "绾?, "娓歌璺緞瑙勫垝"],
    ["feedbackPage", "璇?, "浣撻獙鍙嶉鎵撳垎"],
  ];
  const adminItems = [
    ["dashboard", "琛?, "浠〃鐩?],
    ["knowledge", "鐭?, "鐭ヨ瘑搴撶鐞?],
    ["scenic", "鏅?, "鏅尯绠＄悊"],
    ["human", "浜?, "鏁板瓧浜洪厤缃?],
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
  stopReply();
  state.role = "";
  state.token = "";
  state.conversationId = "";
  localStorage.removeItem("dg_role");
  localStorage.removeItem("dg_admin_token");
  sessionStorage.removeItem("dg_runtime_role");
  sessionStorage.removeItem("dg_visitor_reload_guard");
  sessionStorage.removeItem("dg_visitor_entry");
  if (isVisitorOnlyEntry()) {
    goHome();
    return;
  }
  // Recreate the whole document instead of restoring a hidden WebGL canvas.
  // Do not call WEBGL_lose_context: Chromium may carry that loss into the next
  // context created immediately in the same renderer process.
  window.location.replace(window.location.pathname);
}

function switchView(view) {
  if (view === "admin" && state.role !== "admin") {
    toast("璇峰厛鐧诲綍绠＄悊鍚庡彴");
    return;
  }
  if (["routeMap", "feedbackPage"].includes(view) && state.role !== "visitor") {
    toast("璇峰厛杩涘叆娓稿浜や簰绔?);
    return;
  }
  document.querySelectorAll(".nav-item").forEach((btn) => btn.classList.toggle("active", btn.dataset.view === view));
  $("visitorView").classList.toggle("active", view === "visitor");
  $("routeMapView").classList.toggle("active", view === "routeMap");
  $("feedbackPageView").classList.toggle("active", view === "feedbackPage");
  $("adminView").classList.toggle("active", view === "admin");
  moveLive2DStage(view === "routeMap" ? "route" : "home");
  state.live2dApp?.start?.();
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
  if (toggle) toggle.textContent = open ? "鏀惰捣鍘嗗彶" : "鍘嗗彶瀵硅瘽";
  $("historyCloseBtn").title = open ? "鏀惰捣浼氳瘽鏍? : "灞曞紑浼氳瘽鏍?;
  $("historyCloseBtn").setAttribute("aria-label", open ? "鏀惰捣浼氳瘽鏍? : "灞曞紑浼氳瘽鏍?);
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
  return String(cfg.name_zh || cfg.name || "AI 瀵艰鍛?).trim() || "AI 瀵艰鍛?;
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
  const staticMode = state.humanConfig?.extra_config?.model_type === "static";
  state.avatarEngine = staticMode && engine === "css" ? "css" : "live2d";
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
    else setAvatarEngineStatus("Live2D 绛夊緟椤甸潰鏄剧ず");
  }
  if (state.avatarEngine === "css") {
    setAvatarEngineStatus("铏氭嫙涓绘挱鏁板瓧浜?);
  }
}

async function connectLiveTalking() {
  setAvatarEngine("livetalking");
  setAvatarEngineStatus("姝ｅ湪杩炴帴 LiveTalking");
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
      setAvatarEngineStatus(`LiveTalking 瑙嗛宸叉帴鍏?${state.liveTalkingSessionId || ""}`.trim());
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
      setAvatarEngineStatus(`LiveTalking 宸茶繛鎺?${state.liveTalkingSessionId || ""}`.trim());
    }
    if (["failed", "closed", "disconnected"].includes(pc.connectionState)) {
      state.liveTalkingConnected = false;
      panel?.classList.remove("livetalking-connected");
      setAvatarEngineStatus("LiveTalking 杩炴帴宸叉柇寮€");
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
  if (!res.ok) throw new Error("LiveTalking /offer 杩炴帴澶辫触");
  const answer = await res.json();
  state.liveTalkingSessionId = String(answer.sessionid || "");
  await pc.setRemoteDescription(answer);
  state.liveTalkingConnected = true;
  setAvatarEngineStatus(`LiveTalking 宸茶繛鎺?${state.liveTalkingSessionId}`);
  toast("LiveTalking 宸茶繛鎺?);
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
    setAvatarEngineStatus("Live2D 绛夊緟椤甸潰鏄剧ず");
    return;
  }
  panel.classList.add("engine-loading");
  setAvatarEngineStatus("Live2D 妯″瀷鍔犺浇涓?);

  if (!window.PIXI?.live2d?.Live2DModel) throw new Error("Live2D runtime unavailable");
  if (!state.live2dApp) {
    state.live2dApp = new PIXI.Application({
      view: canvas,
      width: LIVE2D_RENDER_WIDTH,
      height: LIVE2D_RENDER_HEIGHT,
      autoStart: true,
      transparent: true,
      antialias: true,
      autoDensity: false,
      resolution: 1,
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
      setAvatarEngineStatus("Mark 鍔犺浇澶辫触锛屽凡浣跨敤绠€鍖栧舰璞?);
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
  if (rect.width <= 2 || rect.height <= 2) return;
  // Keep Cubism's WebGL viewport fixed. Resizing the renderer between the
  // visitor card and route popup can corrupt clipping masks on some GPUs.
  if (
    app.renderer.screen.width !== LIVE2D_RENDER_WIDTH
    || app.renderer.screen.height !== LIVE2D_RENDER_HEIGHT
  ) {
    app.renderer.resize(LIVE2D_RENDER_WIDTH, LIVE2D_RENDER_HEIGHT);
  }
  styleLive2DModel();
  app.renderer.render(app.stage);
}

async function loadLive2DModel(lifecycleId = state.live2dLifecycleId) {
  if (!state.live2dApp || !window.PIXI?.live2d?.Live2DModel) return false;
  const loadId = ++state.live2dModelLoadId;
  const appearance = state.humanConfig?.appearance || "modern";
  const configuredPath = state.humanConfig?.extra_config?.live2d_model_path;
  const modelUrl = appearance === "custom" && configuredPath
    ? configuredPath
    : live2dModels[appearance] || live2dModels.modern;
  if (state.live2dModel?.modelUrl === modelUrl) {
    state.live2dModel.modelAppearance = appearance;
    styleLive2DModel();
    return true;
  }
  const model = await PIXI.live2d.Live2DModel.from(modelUrl);
  if (
    loadId !== state.live2dModelLoadId
    || lifecycleId !== state.live2dLifecycleId
    || !state.live2dApp
  ) {
    model.destroy?.();
    return false;
  }

  detachLive2DMouthDriver();
  state.live2dApp.stage.children
    .filter((child) => child !== model && child?.internalModel)
    .forEach((child) => {
      state.live2dApp.stage.removeChild(child);
      child.destroy?.();
    });

  model.modelUrl = modelUrl;
  model.modelAppearance = appearance;
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
  const appearance = model.modelAppearance || "modern";
  const inRouteAssistant = $("routeLive2DDock")?.contains($("openAvatarStage"));
  const scaleBoost = inRouteAssistant
    ? appearance === "hanfu" ? 1.42 : 0.82
    : appearance === "hanfu" ? 1.75 : 1.45;
  const scale = Math.min(width / naturalWidth, height / naturalHeight) * scaleBoost;
  model.x = width / 2;
  model.y = inRouteAssistant
    ? appearance === "hanfu" ? height * 0.56 : height * 0.24
    : appearance === "hanfu" ? height * 0.95 : height / 2;
  model.scale.set(scale);
  if (appearance === "hanfu") {
    const top = model.y + bounds.y * scale;
    const safeTop = 12;
    if (top < safeTop) model.y += safeTop - top;
  }
  model.rotation = 0;
  model.alpha = 1;
  model.tint = 0xffffff;
}

async function initVRMAvatar() {
  if (state.vrmAvatar) return state.vrmAvatar;
  if (state.vrmAvatarInitPromise) return state.vrmAvatarInitPromise;
  const stage = $("vrmAvatarStage");
  const canvas = $("vrmAvatarCanvas");
  const status = $("vrmAvatarStatus");
  if (!stage || !canvas) return null;

  const setStatus = (text, debug = false) => {
    if (status) status.textContent = text;
    stage.classList.toggle("is-debug", debug);
  };

  state.vrmAvatarInitPromise = (async () => {
    const models = {
      model7533: { label: "7533417284697534698", url: "/assets/vrm/7533417284697534698.vrm", fallbackSize: 15282092 },
      default: { label: "default_2963", url: "/assets/vrm/default_2963.vrm", fallbackSize: 5350040 },
      default2704: { label: "default_2704", url: "/assets/vrm/default_2704.vrm", fallbackSize: 5548212 },
      karmesi: { label: "Karmesi", url: "/assets/vrm/karmesi.vrm", fallbackSize: 18748576 },
    };
    const motions = {
      fullBody: { label: "灞曠ず鍏ㄨ韩", url: "/assets/vrm/animations/VRMA_01.vrma" },
      greeting: { label: "鎵撴嫑鍛?, url: "/assets/vrm/animations/VRMA_02.vrma" },
      vSign: { label: "姣?V 鎵嬪娍", url: "/assets/vrm/animations/VRMA_03.vrma" },
      pose: { label: "妯＄壒鎽嗘媿", url: "/assets/vrm/animations/VRMA_06.vrma" },
    };

    setStatus("VRM 鏁板瓧浜哄姞杞戒腑", true);
    const THREE = await import("three");
    const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
    const { OrbitControls } = await import("three/addons/controls/OrbitControls.js");
    const { VRMLoaderPlugin, VRMUtils } = await import("@pixiv/three-vrm");
    let VRMAnimationLoaderPlugin = null;
    let createVRMAnimationClip = null;
    try {
      const vrmaModule = await import("@pixiv/three-vrm-animation");
      VRMAnimationLoaderPlugin = vrmaModule.VRMAnimationLoaderPlugin;
      createVRMAnimationClip = vrmaModule.createVRMAnimationClip;
    } catch (error) {
      console.warn("[VRM] VRMA runtime unavailable, manual motion fallback is active.", error);
    }

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.setClearColor(0xffffff, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 100);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableRotate = false;

    scene.add(new THREE.AmbientLight(0xdfeee8, 0.58));
    scene.add(new THREE.HemisphereLight(0xf4fff9, 0x17352f, 0.92));
    const key = new THREE.DirectionalLight(0xffead2, 0.92);
    key.position.set(1.8, 2.8, 2.6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x8ee7ff, 0.55);
    rim.position.set(-2.5, 2, -1.4);
    scene.add(rim);
    const faceFill = new THREE.DirectionalLight(0xffffff, 0.36);
    faceFill.position.set(0, 1.6, 3.4);
    scene.add(faceFill);

    const clock = new THREE.Clock();
    const motionClipCache = new Map();
    let activeModelKey = "model7533";
    let activeModel = models[activeModelKey];
    let currentVrm = null;
    let mixer = null;
    let activeAction = null;
    let mode = "idle";
    let blinkAt = 0;

    const resize = () => {
      const rect = stage.getBoundingClientRect();
      const width = Math.max(Math.round(rect.width), 1);
      const height = Math.max(Math.round(rect.height), 1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const bone = (name) => currentVrm?.humanoid?.getNormalizedBoneNode?.(name);
    const setExpression = (name, value) => currentVrm?.expressionManager?.setValue?.(name, value);
    const resetExpressions = () => {
      ["happy", "aa", "ih", "ou", "blink", "relaxed", "surprised", "sad", "angry"].forEach((name) => setExpression(name, 0));
    };
    const setBoneRotation = (name, x = 0, y = 0, z = 0) => {
      const target = bone(name);
      if (target) target.rotation.set(x, y, z);
    };
    const applyGuidePose = (time) => {
      const breathe = Math.sin(time * 1.4) * 0.018;
      setBoneRotation("hips", 0, Math.sin(time * 0.5) * 0.018, 0);
      setBoneRotation("spine", breathe, Math.sin(time * 0.45) * 0.026, 0);
      setBoneRotation("chest", breathe * 0.7, Math.sin(time * 0.55) * 0.022, 0);
      setBoneRotation("head", Math.sin(time * 1.1) * 0.025, Math.sin(time * 0.8) * 0.045, Math.sin(time * 0.7) * 0.012);
      setBoneRotation("leftUpperArm", 0.15, 0.02, 1.16 + Math.sin(time * 0.9) * 0.025);
      setBoneRotation("rightUpperArm", 0.18, -0.03, -1.04 + Math.cos(time * 0.85) * 0.025);
      setBoneRotation("leftLowerArm", -0.04, 0.08, 0.34);
      setBoneRotation("rightLowerArm", -0.03, -0.08, -0.34);
      setBoneRotation("leftUpperLeg", 0.02, 0, 0.035);
      setBoneRotation("rightUpperLeg", 0.02, 0, -0.035);
    };

    const prepareMaterials = (vrm) => {
      vrm.scene.traverse((object) => {
        object.visible = true;
        object.frustumCulled = false;
        if (!object.isMesh && !object.isSkinnedMesh) return;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.filter(Boolean).forEach((material) => {
          const name = String(material.name || "").toLowerCase();
          if (material.map) {
            material.map.colorSpace = THREE.SRGBColorSpace;
            material.map.needsUpdate = true;
          }
          if (material.color && (name.includes("skin") || name.includes("face") || name.includes("body_mat"))) {
            material.color.setRGB(0.88, 0.84, 0.82);
          } else if (material.color) {
            material.color.setRGB(0.95, 0.95, 0.95);
          }
          const shouldBlend = material.transparent || name.includes("hairback") || name.includes("highlight") || name.includes("eyeline") || name.includes("eyelash") || name.includes("brow");
          const shouldMask = !shouldBlend && (material.alphaTest > 0 || name.includes("hair") || name.includes("eye") || name.includes("face") || name.includes("skin") || name.includes("cloth"));
          if (shouldBlend) {
            material.transparent = true;
            material.alphaTest = 0;
            material.depthWrite = false;
            material.depthTest = true;
          } else if (shouldMask) {
            material.transparent = false;
            material.alphaTest = Math.max(material.alphaTest || 0, 0.5);
            material.depthWrite = true;
          }
          material.needsUpdate = true;
        });
      });
    };

    const normalizeAndFrame = (vrm) => {
      VRMUtils.rotateVRM0(vrm);
      if (currentVrm?.scene?.parent) scene.remove(currentVrm.scene);
      currentVrm = vrm;
      scene.add(vrm.scene);
      mixer = new THREE.AnimationMixer(vrm.scene);
      activeAction = null;
      motionClipCache.clear();
      prepareMaterials(vrm);

      vrm.scene.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(vrm.scene);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const targetHeight = 2.12;
      const scale = Number.isFinite(size.y) && size.y > 0 ? targetHeight / size.y : 1;
      vrm.scene.scale.setScalar(scale);
      vrm.scene.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
      vrm.scene.updateMatrixWorld(true);

      const fittedBox = new THREE.Box3().setFromObject(vrm.scene);
      const fittedSize = fittedBox.getSize(new THREE.Vector3());
      const fittedCenter = fittedBox.getCenter(new THREE.Vector3());
      const viewDistance = Math.max(2.55, fittedSize.y * 1.28, fittedSize.x * 1.95);
      camera.position.set(fittedCenter.x, fittedCenter.y + fittedSize.y * 0.08, fittedCenter.z + viewDistance);
      controls.target.set(fittedCenter.x, fittedCenter.y + fittedSize.y * 0.02, fittedCenter.z);
      camera.updateProjectionMatrix();
      controls.update();
      setStatus(`${activeModel.label} 宸插姞杞絗);
      playMotion("fullBody").catch(() => {});
    };

    const loadModel = async () => {
      const loader = new GLTFLoader();
      loader.register((parser) => new VRMLoaderPlugin(parser));
      await new Promise((resolve, reject) => {
        loader.load(activeModel.url, (gltf) => {
          try {
            if (!gltf.userData?.vrm) throw new Error("VRM metadata was not parsed");
            normalizeAndFrame(gltf.userData.vrm);
            resolve();
          } catch (error) {
            reject(error);
          }
        }, undefined, reject);
      });
    };

    const loadMotionClip = async (key) => {
      if (!currentVrm || !motions[key] || !VRMAnimationLoaderPlugin || !createVRMAnimationClip) return null;
      const cacheKey = `${activeModelKey}:${key}`;
      if (motionClipCache.has(cacheKey)) return motionClipCache.get(cacheKey);
      const loader = new GLTFLoader();
      loader.register((parser) => new VRMAnimationLoaderPlugin(parser));
      const clip = await new Promise((resolve, reject) => {
        loader.load(motions[key].url, (gltf) => {
          try {
            const animation = gltf.userData?.vrmAnimations?.[0];
            if (!animation) throw new Error("No VRMA animation found");
            resolve(createVRMAnimationClip(animation, currentVrm));
          } catch (error) {
            reject(error);
          }
        }, undefined, reject);
      });
      motionClipCache.set(cacheKey, clip);
      return clip;
    };

    const playMotion = async (key) => {
      if (!motions[key]) return;
      try {
        const clip = await loadMotionClip(key);
        if (!clip || !mixer) {
          activeAction = null;
          return;
        }
        const nextAction = mixer.clipAction(clip);
        nextAction.reset().setEffectiveWeight(1).setEffectiveTimeScale(1).fadeIn(0.24).play();
        if (activeAction && activeAction !== nextAction) activeAction.fadeOut(0.24);
        activeAction = nextAction;
      } catch (error) {
        activeAction = null;
        console.warn("[VRM] motion failed", error);
      }
    };

    const setMode = (nextMode = "idle") => {
      mode = nextMode;
      if (mode === "talk") playMotion("greeting").catch(() => {});
      else if (mode === "think") playMotion("pose").catch(() => {});
      else if (mode === "happy") playMotion("vSign").catch(() => {});
      else playMotion("fullBody").catch(() => {});
    };

    const setModel = async (key) => {
      if (!models[key] || key === activeModelKey) return;
      activeModelKey = key;
      activeModel = models[key];
      await loadModel();
    };

    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.elapsedTime;
      if (currentVrm) {
        mixer?.update(delta);
        resetExpressions();
        if (!activeAction) applyGuidePose(time);
        if (mode === "talk") {
          setExpression("aa", 0.28 + Math.abs(Math.sin(time * 9)) * 0.58);
          setExpression("happy", 0.18);
        } else if (mode === "think") {
          setExpression("relaxed", 0.34);
        } else if (mode === "happy") {
          setExpression("happy", 0.86);
        }
        if (time > blinkAt) {
          setExpression("blink", 1);
          if (time > blinkAt + 0.12) blinkAt = time + 2.4 + Math.random() * 2.2;
        }
        currentVrm.update(delta);
      }
      controls.update();
      renderer.render(scene, camera);
    };

    resize();
    const resizeObserver = window.ResizeObserver ? new ResizeObserver(resize) : null;
    resizeObserver?.observe(stage);
    window.addEventListener("resize", resize);
    animate();
    await loadModel();
    stage.classList.remove("is-debug");

    state.vrmAvatar = { setMode, setModel, playMotion };
    return state.vrmAvatar;
  })().catch((error) => {
    console.warn("[VRM] init failed", error);
    setStatus(`VRM 鍔犺浇澶辫触锛?{error?.message || error}`, true);
    state.vrmAvatarInitPromise = null;
    return null;
  });

  return state.vrmAvatarInitPromise;
}

function syncVRMAvatarState({ speaking = false, thinking = false, emotion = "neutral" } = {}) {
  const mode = speaking
    ? "talk"
    : thinking || emotion === "thinking"
      ? "think"
      : emotion === "happy"
        ? "happy"
        : "idle";
  if (state.vrmAvatar) {
    state.vrmAvatar.setMode(mode);
    return;
  }
  initVRMAvatar().then((avatar) => avatar?.setMode(mode)).catch(() => {});
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
  $("humanState").textContent = speaking ? "姝ｅ湪璁茶В" : thinking ? "姝ｅ湪鎬濊€? : "鍦ㄧ嚎寰呭懡";
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
      if (state.humanConfig?.appearance === "hanfu") {
        if (emotion === "happy") state.live2dModel.expression?.("blush");
        if (emotion === "sorry") state.live2dModel.expression?.("sad");
      } else if (emotion === "happy") {
        state.live2dModel.expression?.(0);
      }
    } catch {}
  }
  syncVRMAvatarState({ speaking, thinking, emotion });
}

function describeVoice(cfg = {}) {
  const gender = cfg.voice_gender === "male" ? "鐢峰０" : "濂冲０";
  const speedMap = { slow: "鑸掔紦", medium: "鑷劧", fast: "杞诲揩" };
  const expressionMap = { lively: "娲绘臣", calm: "娌夌ǔ", warm: "娓╂殩" };
  return `${gender} 路 ${speedMap[cfg.voice_speed] || "鑷劧"} 路 ${expressionMap[cfg.expression_style] || "浜插垏"}`;
}

function applyHumanConfig(cfg = {}) {
  const merged = { ...(state.humanConfig || {}), ...(cfg || {}) };
  state.humanConfig = merged;
  const name = digitalHumanName(merged);
  $("humanName").textContent = name;
  const routeName = $("routeHumanName");
  if (routeName) routeName.textContent = `${name}璺嚎鍔╂墜`;
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
  const voiceButton = $("voiceBtn");
  if (voiceButton) {
    voiceButton.disabled = merged.extra_config?.voice_input_enabled === false;
    voiceButton.title = voiceButton.disabled ? "绠＄悊鍛樺凡鍏抽棴璇煶杈撳叆" : "璇煶杈撳叆";
  }
  const avatar = $("humanAvatarImage");
  if (avatar) {
    if (merged.avatar_url) avatar.src = merged.avatar_url;
    else avatar.removeAttribute("src");
    human.classList.toggle("has-avatar", Boolean(merged.avatar_url));
  }
  syncVisitorHumanControls(merged);
  if (merged.extra_config?.model_type === "static") {
    setAvatarEngine("css", false);
  } else {
    setAvatarEngine("live2d", false);
    loadLive2DModel().catch(() => {});
  }
}

function previewHumanConfigFromForm() {
  const cfg = {
    ...(state.humanConfig || {}),
    name: $("cfgName").value || "AI 瀵艰鍛?,
    appearance: $("cfgAppearance").value || "modern",
    voice_gender: $("cfgVoiceGender").value || "female",
    voice_speed: $("cfgVoiceSpeed").value || "medium",
    expression_style: $("cfgExpression").value || "lively",
    extra_config: {
      ...(state.humanConfig?.extra_config || {}),
      model_type: $("cfgModelType")?.value || "live2d",
      live2d_model_path: $("cfgModelPath")?.value.trim() || "",
    },
  };
  applyHumanConfig(cfg);
  renderAvatarPreview(cfg.avatar_url, cfg);
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
  const appearance = $("visitorAppearance").value || "modern";
  const preset = live2dRoleDefaults[appearance];
  const currentName = digitalHumanName();
  const cfg = {
    ...(state.humanConfig || {}),
    ...(state.visitorHumanConfig || {}),
    appearance,
    voice_gender: $("visitorVoiceGender").value || "female",
    voice_speed: $("visitorVoiceSpeed").value || "medium",
    expression_style: $("visitorExpression").value || "lively",
  };
  if (preset && Object.values(live2dRoleDefaults).some((item) => item.name === currentName)) {
    cfg.name = preset.name;
  }
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
    .replace(/([銆傦紒锛燂紱])\s*(\d+[.)銆乚\s+)/g, "$1\n$2")
    .replace(/([銆傦紒锛燂紱])\s*([-*鈥\s+)/g, "$1\n$2")
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
    const isList = lines.length > 1 && lines.every((line) => /^([-*鈥|\d+[.)銆乚)\s+/.test(line));
    if (isList) {
      const ordered = lines.every((line) => /^\d+[.)銆乚\s+/.test(line));
      const list = document.createElement(ordered ? "ol" : "ul");
      lines.forEach((line) => {
        const item = document.createElement("li");
        appendFormattedText(item, line.replace(/^([-*鈥|\d+[.)銆乚)\s+/, ""));
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
    const dot = document.createElement("span");
    dot.className = "assistant-dot";
    dot.textContent = "AI";
    const name = document.createElement("strong");
    name.textContent = digitalHumanName();
    const status = document.createElement("span");
    status.className = "message-status";
    status.textContent = "宸插洖绛?;
    meta.append(dot, name, status);
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
  if (status) status.textContent = isStreaming ? "姝ｅ湪缁勭粐鍥炵瓟" : "宸插洖绛?;
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
  if (badge) badge.textContent = title.trim() || "鏂扮殑瀵艰浼氳瘽";
}

function persistHistory() {
  state.history = normalizeHistory(state.history).slice(0, 30);
  localStorage.setItem("dg_conversation_history", JSON.stringify(state.history));
  renderHistoryList();
}

function upsertConversationHistory({ id, title, greeting = "" }) {
  if (!id) return;
  let item = state.history.find((entry) => entry.id === id);
  if (!item) {
    item = { id, title: title || "鏂扮殑瀵艰浼氳瘽", messages: [], updatedAt: new Date().toISOString() };
    state.history.unshift(item);
  }
  item.messages = Array.isArray(item.messages) ? item.messages : [];
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
  item.messages = Array.isArray(item.messages) ? item.messages : [];
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
  state.history = normalizeHistory(state.history);
  if (!state.history.length) {
    list.innerHTML = '<div class="empty-history">鏆傛棤鍘嗗彶浼氳瘽</div>';
    return;
  }
  list.innerHTML = state.history.map((item) => {
    const last = item.messages[item.messages.length - 1]?.content || "灏氭棤瀵硅瘽鍐呭";
    const active = item.id === state.conversationId ? " active" : "";
    return `
      <div class="history-item-wrap${active}" data-history-id="${item.id}">
        <button class="history-item" type="button" data-conv-id="${item.id}">
          <strong>${escapeHTML(item.title || "瀵艰浼氳瘽")}</strong>
          <span>${escapeHTML(last).slice(0, 46)}</span>
          <small>${formatDate(item.updatedAt)}</small>
        </button>
        <button class="history-more" type="button" data-history-menu="${item.id}" aria-label="鏇村鎿嶄綔">路路路</button>
        <div class="history-menu">
          <button type="button" data-history-rename="${item.id}">閲嶅懡鍚嶅璇?/button>
          <button type="button" class="danger" data-history-delete="${item.id}">鍒犻櫎鑱婂ぉ璁板綍</button>
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
  const nextTitle = window.prompt("閲嶅懡鍚嶅璇?, item.title || "瀵艰浼氳瘽");
  if (nextTitle === null) return;
  const title = nextTitle.trim();
  if (!title) return toast("鍚嶇О涓嶈兘涓虹┖");
  item.title = title.slice(0, 40);
  item.updatedAt = new Date().toISOString();
  if (state.conversationId === id) updateConversationTitle(item.title);
  persistHistory();
  toast("瀵硅瘽宸查噸鍛藉悕");
}

function deleteHistoryItem(id) {
  const item = state.history.find((entry) => entry.id === id);
  if (!item) return;
  closeHistoryMenus();
  const ok = window.confirm(`纭畾鍒犻櫎鈥?{item.title || "瀵艰浼氳瘽"}鈥濆悧锛熷垹闄ゅ悗鏈湴鍘嗗彶璁板綍涓嶅彲鎭㈠銆俙);
  if (!ok) return;
  state.history = state.history.filter((entry) => entry.id !== id);
  if (state.conversationId === id) {
    state.conversationId = "";
    updateConversationTitle();
    $("chatMessages").innerHTML = "";
    addMessage("assistant", `鎮ㄥソ锛屾垜鏄?{digitalHumanName()}銆傜偣鍑烩€滄柊鑱婂ぉ鈥濓紝鍗冲彲寮€濮嬫柊鐨勫瑙堜細璇濄€俙, undefined, false);
  }
  persistHistory();
  toast("鑱婂ぉ璁板綍宸插垹闄?);
}

async function loadConversationFromHistory(id) {
  const item = state.history.find((entry) => entry.id === id);
  if (!item) return;
  item.messages = Array.isArray(item.messages) ? item.messages : [];
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
    toast("宸叉仮澶嶆湰鍦板巻鍙诧紝鍚庣浼氳瘽鍙兘宸茶繃鏈?);
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
  updateConversationTitle("鏂扮殑瀵艰浼氳瘽");
  applyHumanConfig(data.digital_human || {});
  if (state.visitorHumanConfig) applyHumanConfig({ ...(data.digital_human || {}), ...state.visitorHumanConfig });
  renderInterests(data.interest_options || defaultInterests);
  const greeting = data.greeting || `鎮ㄥソ锛屾垜鏄?{digitalHumanName()}銆傛兂浜嗚В褰撳墠鍦烘櫙鍐呭銆佽矾绾挎垨鏈嶅姟淇℃伅锛岄兘鍙互鐩存帴闂垜銆俙;
  const configuredGreeting = state.humanConfig?.extra_config?.welcome_message;
  const activeGreeting = state.humanConfig?.extra_config?.welcome_enabled === false ? "" : configuredGreeting || greeting;
  upsertConversationHistory({ id: state.conversationId, title: "鏂扮殑瀵艰浼氳瘽", greeting: activeGreeting });
  if (activeGreeting) addMessage("assistant", activeGreeting, undefined, false);
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

function setListeningState(active, message = "姝ｅ湪鑱嗗惉鈥?) {
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
      "not-allowed": "楹﹀厠椋庢潈闄愯鎷掔粷锛岃鍦ㄦ祻瑙堝櫒璁剧疆涓厑璁歌闂?,
      "audio-capture": "娌℃湁妫€娴嬪埌鍙敤楹﹀厠椋?,
      network: "璇煶璇嗗埆缃戠粶寮傚父锛岃绋嶅悗鍐嶈瘯",
      "no-speech": "娌℃湁璇嗗埆鍒拌闊筹紝璇峰啀璇曚竴娆?,
    };
    if (event.error !== "aborted") toast(messages[event.error] || "璇煶璇嗗埆澶辫触锛岃绋嶅悗鍐嶈瘯");
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
    toast("褰撳墠娴忚鍣ㄤ笉鏀寔璇煶璇嗗埆锛屽缓璁娇鐢ㄦ渶鏂扮増 Chrome");
    return;
  }
  try {
    state.recognitionSessionId += 1;
    state.ignoreRecognitionResults = false;
    recognition._dgSessionId = state.recognitionSessionId;
    setListeningState(true, "姝ｅ湪鍚姩璇煶璇嗗埆鈥?);
    recognition.start();
  } catch (error) {
    setListeningState(false);
    if (error.name !== "InvalidStateError") toast("璇煶璇嗗埆鏆傛椂鏃犳硶鍚姩锛岃绋嶅悗鍐嶈瘯");
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
      if (/[銆傦紒锛??]/.test(rest[index]) && index + 1 >= 8) {
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
  const extra = state.humanConfig?.extra_config || {};
  if (!clean || extra.tts_enabled === false || extra.auto_voice === false) return;
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
      if (state.humanConfig?.extra_config?.lip_sync_enabled !== false) startLipSync(audio, emotion);
      else setHumanState({ speaking: true, emotion });
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
      if (state.humanConfig?.extra_config?.lip_sync_enabled === false) return;
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
    setMessageText(assistant, "鍚庣鏈嶅姟鏆傛椂鏃犳硶杩炴帴锛岃纭鏈嶅姟鍦板潃鍜屽悗绔惎鍔ㄧ姸鎬併€?);
    setHumanState();
    return;
  }

  if (!res.ok || !res.body) {
    setMessageStreaming(assistant, false);
    setAIResponding(false);
    setMessageText(assistant, "闂瓟鏈嶅姟鏆傛椂涓嶅彲鐢紝璇风◢鍚庡啀璇曘€?);
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
        finalText = payload.message || payload.content || "鏈嶅姟鏆傛椂涓嶅彲鐢ㄣ€?;
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
    throw new Error("鍚庣鏈嶅姟鏆傛椂鏃犳硶杩炴帴锛岃纭鏈嶅姟鍦板潃鍜屽悗绔惎鍔ㄧ姸鎬併€?);
  }

  if (!res.ok || !res.body) {
    throw new Error("闂瓟鏈嶅姟鏆傛椂涓嶅彲鐢紝璇风◢鍚庡啀璇曘€?);
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
        throw new Error(payload.message || payload.content || "鏈嶅姟鏆傛椂涓嶅彲鐢ㄣ€?);
      }
    }
  }

  return { content: finalText, emotion };
}

function normalizeSpotName(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[\s路鈥-鈥擾锛堬級()]/g, "")
    .replace(/(?:鏅尯|鏅偣|鏂囧寲鍥?$/g, "");
}

function locationFromSpot(spot = {}) {
  const location = spot.location || {};
  let lat = Number(spot.lat ?? location.lat ?? location.latitude);
  let lng = Number(spot.lng ?? location.lng ?? location.lon ?? location.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  // Accept accidentally reversed latitude/longitude, but never accept 0,0 or
  // coordinates outside the valid world range. The platform can host multiple
  // scenic areas, so validation must not be tied to one fixed location.
  if (Math.abs(lat) > 90 && Math.abs(lng) <= 90) [lat, lng] = [lng, lat];
  const isZeroPoint = Math.abs(lat) < 0.000001 && Math.abs(lng) < 0.000001;
  const isWorldCoordinate = Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  return !isZeroPoint && isWorldCoordinate ? { lat, lng } : null;
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
          if (item.visit_duration_min) existing.duration = `${item.visit_duration_min}鍒嗛挓`;
          if (item.image_url) existing.imageUrl = resolveMediaURL(item.image_url);
          return;
        }
        scenicSpots.push({
          id: item.id || `backend-${scenicSpots.length}`,
          name: item.name,
          aliases: item.name_en ? [item.name_en] : [],
          lat: location?.lat,
          lng: location?.lng,
          intro: item.description || "璇ユ櫙鐐圭殑璇︾粏浠嬬粛姝ｅ湪琛ュ厖涓€?,
          duration: item.visit_duration_min ? `${item.visit_duration_min}鍒嗛挓` : "寤鸿 20 鍒嗛挓",
          tags: Array.isArray(item.tags) ? item.tags : [],
          imageUrl: resolveMediaURL(item.image_url),
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
    renderFallbackRouteMap(state.routeSpots);
    return null;
  }
  try {
    state.routeMap = L.map("leafletRouteMap", {
      zoomControl: true,
      minZoom: 14,
      maxZoom: 19,
    }).setView([31.4275, 120.0915], 16);

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

function renderFallbackRouteMap(spots = []) {
  const map = $("leafletRouteMap");
  if (!map) return;
  const positioned = spots.filter((spot) => spot.hasCoordinates);
  const minLat = Math.min(...positioned.map((spot) => spot.lat), 31.419);
  const maxLat = Math.max(...positioned.map((spot) => spot.lat), 31.435);
  const minLng = Math.min(...positioned.map((spot) => spot.lng), 120.084);
  const maxLng = Math.max(...positioned.map((spot) => spot.lng), 120.101);
  const latSpan = Math.max(0.001, maxLat - minLat);
  const lngSpan = Math.max(0.001, maxLng - minLng);
  const points = positioned.map((spot, index) => {
    const left = 10 + ((spot.lng - minLng) / lngSpan) * 80;
    const top = 90 - ((spot.lat - minLat) / latSpan) * 80;
    const originalIndex = spots.indexOf(spot);
    return `
      <button class="fallback-map-point" type="button" data-fallback-route-index="${originalIndex}" style="left:${left}%;top:${top}%">
        <span>${originalIndex + 1}</span>
        <small>${escapeHTML(spot.name)}</small>
      </button>
    `;
  }).join("");
  map.innerHTML = `
    <div class="fallback-route-map">
      <div class="fallback-map-grid"></div>
      <div class="fallback-map-path"></div>
      ${points || '<div class="fallback-map-empty">璺嚎鏅偣鏆傛棤鍧愭爣锛屼粛鍙湪宸︿晶鏌ョ湅鎺ㄨ崘椤哄簭</div>'}
    </div>
  `;
  map.querySelectorAll("[data-fallback-route-index]").forEach((btn) => {
    btn.onclick = () => selectSpot(Number(btn.dataset.fallbackRouteIndex), { moveMap: false, showDetails: true });
  });
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
  closeRouteSpotDetail();
}

function formatRouteDuration(data, spots) {
  if (data.duration) return String(data.duration);
  if (data.duration_hours) return `绾?${data.duration_hours} 灏忔椂`;
  const minutes = spots.reduce((sum, spot) => {
    const value = Number.parseInt(spot.duration, 10);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);
  return minutes ? `绾?${Math.max(1, Math.round(minutes / 30) / 2)} 灏忔椂` : "鏃堕暱鍙皟鏁?;
}

function normalizeRouteSpot(item, index) {
  const source = typeof item === "string" ? { name: item } : (item || {});
  const name = source.name || source.spot_name || `鏅偣 ${index + 1}`;
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
    intro: source.intro || source.description || matched?.intro || "璇ユ櫙鐐圭殑璇︾粏浠嬬粛姝ｅ湪琛ュ厖涓€?,
    duration: source.duration || (source.visit_duration_min ? `${source.visit_duration_min}鍒嗛挓` : matched?.duration || "寤鸿 20 鍒嗛挓"),
    tags: Array.isArray(source.tags) && source.tags.length ? source.tags : (matched?.tags || []),
    imageUrl: resolveMediaURL(source.image_url || source.imageUrl || matched?.imageUrl),
    hasCoordinates: Boolean(location),
  };
}

function renderRouteResult(data) {
  renderRoutePlan(data);
}

function renderRoutePlan(aiRouteResult = {}) {
  const rawSpots = Array.isArray(aiRouteResult.spots) ? aiRouteResult.spots : [];
  const spots = rawSpots.map(normalizeRouteSpot);
  const routeName = aiRouteResult.routeName || aiRouteResult.route_name || aiRouteResult.name || "AI 鎺ㄨ崘璺嚎";
  const duration = formatRouteDuration(aiRouteResult, spots);
  const reason = aiRouteResult.reason || aiRouteResult.description || "宸叉牴鎹綘鐨勬父瑙堟椂闂村拰鍏磋叮鍋忓ソ鐢熸垚璺嚎銆?;
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
        <span class="route-empty-icon" aria-hidden="true">鈱?/span>
        <strong>鏆傛棤鎺ㄨ崘璺嚎</strong>
        <p>璇峰厛鍦ㄥ瑙堝璇濅腑鐢熸垚璺嚎锛屾垨璁剧疆娓歌鏃堕暱鍚庣偣鍑烩€滅敓鎴愭帹鑽愯矾绾库€濄€?/p>
      </div>`;
    $("routeSpotList").innerHTML = "";
    return;
  }

  const mappedCount = spots.filter((spot) => spot.hasCoordinates).length;
  $("routeResult").innerHTML = `
    <div class="route-overview-head">
      <div>
        <span>褰撳墠璺嚎</span>
        <strong>${escapeHTML(routeName)}</strong>
      </div>
      <span class="route-count">${spots.length} 涓櫙鐐?/span>
    </div>
    <div class="route-meta">
      <span>${escapeHTML(duration)}</span>
      <span>${mappedCount} 涓彲鍦板浘瀹氫綅</span>
    </div>
    <p>${escapeHTML(reason)}</p>
  `;

  renderSpotList(spots);
  initRouteMap();
  renderRouteMarkers(spots);
  fitRouteBounds(spots);
  const firstMappedIndex = spots.findIndex((spot) => spot.hasCoordinates);
  selectSpot(firstMappedIndex >= 0 ? firstMappedIndex : 0, {
    moveMap: false,
    scrollList: false,
    showDetails: false,
  });
}

function renderSpotList(spots) {
  $("routeSpotList").innerHTML = spots.map((spot, index) => `
    <button class="route-spot-card${spot.imageUrl ? " has-image" : ""}" data-route-spot-index="${index}" type="button"
      ${spot.imageUrl ? `style="--spot-image: url('${escapeHTML(spot.imageUrl)}')"` : ""}>
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
        ${spot.hasCoordinates ? "" : '<span class="route-coordinate-warning">璇ユ櫙鐐规殏鏃犲潗鏍囦俊鎭?/span>'}
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
      <span class="route-popup-step">绗?${index + 1} 绔?/span>
      <strong>${escapeHTML(spot.name)}</strong>
      <p>${escapeHTML(spot.intro)}</p>
      <div class="route-popup-meta"><span>${escapeHTML(spot.duration)}</span></div>
      <div class="route-popup-tags">
        ${(spot.tags || []).slice(0, 4).map((tag) => `<span>${escapeHTML(tag)}</span>`).join("")}
      </div>
    </div>`;
}

function closeRouteSpotDetail() {
  const detail = $("routeSpotDetail");
  if (!detail) return;
  detail.classList.remove("show");
  detail.setAttribute("aria-hidden", "true");
}

function showRouteSpotDetail(spot, index) {
  const detail = $("routeSpotDetail");
  if (!detail || !spot) return;
  const media = $("routeSpotDetailMedia");
  const imageUrl = resolveMediaURL(spot.imageUrl || spot.image_url);
  media.innerHTML = imageUrl
    ? `<img src="${escapeHTML(imageUrl)}" alt="${escapeHTML(spot.name)}" />`
    : `<div class="route-spot-detail-placeholder"><span>DG</span><small>鏆傛棤鏅偣鍥剧墖</small></div>`;
  $("routeSpotDetailStep").textContent = `璺嚎绗?${index + 1} 绔檂;
  $("routeSpotDetailName").textContent = spot.name;
  $("routeSpotDetailMeta").innerHTML = `
    <span>${escapeHTML(spot.duration || "寤鸿 20 鍒嗛挓")}</span>
    <span>${spot.hasCoordinates ? "宸插畾浣嶅埌鍦板浘" : "鏆傛棤鍧愭爣"}</span>
  `;
  $("routeSpotDetailIntro").textContent = spot.intro || "璇ユ櫙鐐圭殑璇︾粏浠嬬粛姝ｅ湪琛ュ厖涓€?;
  $("routeSpotDetailTags").innerHTML = (spot.tags || [])
    .slice(0, 6)
    .map((tag) => `<span>${escapeHTML(tag)}</span>`)
    .join("");
  detail.classList.add("show");
  detail.setAttribute("aria-hidden", "false");
}

function renderRouteMarkers(spots) {
  const map = initRouteMap();
  if (!map) {
    renderFallbackRouteMap(spots);
    return;
  }
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
      .bindPopup(routePopupHTML(spot, index), {
        maxWidth: 300,
        minWidth: 230,
        offset: [0, -4],
        autoPan: false,
      });
    marker.on("click", () => selectSpot(index, { moveMap: false, showDetails: true }));
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
    map.setView([31.4275, 120.0915], 16);
  }
}

function selectSpot(index, options = {}) {
  const { moveMap = true, scrollList = true, showDetails = true } = options;
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
    if (moveMap && state.routeMap) {
      state.routeMap.invalidateSize({ animate: false, pan: false });
      const target = marker.getLatLng();
      state.routeMap.setView(target, state.routeMap.getZoom(), { animate: true });
      window.setTimeout(() => state.routeMap?.invalidateSize({ animate: false, pan: false }), 80);
    }
    marker.openPopup();
  }
  if (showDetails) showRouteSpotDetail(state.routeSpots[index], index);
}

function getRoutePreferenceProfile(text = "", interests = []) {
  const source = `${text} ${interests.join(" ")}`;
  if (/(老人|长辈|父母|爸妈|爷爷|奶奶|外公|外婆|腿脚|体力有限|少爬|不爬|少走|轻松|慢游)/.test(source)) {
    return {
      intent: "长辈同行舒缓路线推荐",
      requirement: "节奏舒缓，优先选择平缓区域、可停留观赏和室内参观，减少连续登高和长距离折返",
      reference: "亲子家庭路线和文化精华路线",
      candidates: ["九龙灌浴", "佛手广场", "百子戏弥勒", "灵山梵宫", "五印坛城"],
    };
  }
  if (/(孩子|儿童|亲子|宝宝|小朋友|轻松|有趣|互动|表演)/.test(source)) {
    return {
      intent: "亲子轻松有趣路线推荐",
      requirement: "体验生动有趣，优先动态表演、互动景观和室内艺术参观",
      reference: "亲子家庭路线",
      candidates: ["九龙灌浴", "百子戏弥勒", "佛手广场", "灵山梵宫", "五印坛城"],
    };
  }
  if (/(自然|风景|风光|拍照|摄影|打卡)/.test(source)) {
    return {
      intent: "自然风光与摄影路线推荐",
      requirement: "兼顾自然景观、开阔视野和拍照体验",
      reference: "自然风光路线",
      candidates: ["佛足坛", "九龙灌浴", "五明桥", "灵山大佛", "曼飞龙塔", "灵山精舍", "梵宫广场"],
    };
  }
  if (/(历史|文化|建筑|佛教|祈福|禅|艺术)/.test(source)) {
    return {
      intent: "历史文化经典路线推荐",
      requirement: "突出佛教文化、历史建筑和代表性艺术景观",
      reference: "历史文化路线",
      candidates: ["灵山大照壁", "佛手广场", "祥符禅寺", "佛前广场", "灵山大佛", "灵山梵宫", "五印坛城"],
    };
  }
  return {
    intent: "经典精华路线推荐",
    requirement: text || "路线紧凑、体验丰富、游览顺序合理",
    reference: "当前知识库中的历史文化、自然风光和亲子家庭路线",
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

  if (area) conditions.push(`当前位置：${area}`);
  if (hours > 0) conditions.push(`游览时长：${hours}小时`);
  if (interests.length) conditions.push(`游客偏好：${interests.join("、")}`);
  if (guideText) conditions.push(`补充偏好：${guideText}`);
  conditions.push(`路线要求：${profile.requirement}`);

  state.latestRoutePreference = `${guideText} ${interests.join(" ")}`.trim();
  const candidateNames = profile.candidates.join("、");
  return [
    `请基于当前知识库，为游客生成一条${profile.intent}。`,
    `游客条件：${conditions.join("；")}。`,
    `请参考：${profile.reference}。`,
    `只能从以下资料已有景点中选择：${candidateNames}。`,
    "请直接回答，不要要求用户再次说明景区或偏好。",
    "输出第一行必须使用“路线顺序：景点A → 景点B → 景点C”的格式，按游览顺序列出3至5个完整景点名称。",
    "随后逐站简要说明推荐理由。",
    "不要虚构精确步行时间、接驳方式、通行与服务条件、演出时间或官方政策；如资料不支持完整官方路线，请说明这是基于现有资料整理的参考顺序，但仍需给出可用路线。",
  ].join("");
}

function extractRouteReasonFromAIText(text = "") {
  const lines = String(text).split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  const line = lines.find((item) => !/^路线顺序\s*[：:]/.test(item) && !/^\d+[\.\、\)]/.test(item));
  if (!line) return "已根据你的游览时间和偏好生成路线。";
  return line.length > 140 ? `${line.slice(0, 140)}...` : line;
}

function buildFallbackRoutePlan() {
  const hours = Number($("availableHours")?.value || 0);
  const interests = Array.isArray(state.interests) ? state.interests : [];
  const profile = getRoutePreferenceProfile(state.latestRoutePreference, interests);
  let spots;
  let routeName;

  if (profile.intent.includes("长辈")) {
    routeName = "长辈同行舒缓路线";
    spots = ["九龙灌浴", "佛手广场", "百子戏弥勒", "灵山梵宫", "五印坛城"];
  } else if (profile.intent.includes("亲子")) {
    routeName = "亲子轻松体验路线";
    spots = ["九龙灌浴", "百子戏弥勒", "佛手广场", "灵山梵宫"];
  } else if (profile.intent.includes("自然")) {
    routeName = "自然风光打卡路线";
    spots = ["佛足坛", "九龙灌浴", "五明桥", "灵山大佛", "梵宫广场"];
  } else if (profile.intent.includes("历史")) {
    routeName = "历史文化经典路线";
    spots = ["灵山大照壁", "佛手广场", "祥符禅寺", "灵山大佛", "灵山梵宫"];
  } else {
    routeName = "AI 智能推荐路线";
    spots = ["灵山大照壁", "九龙灌浴", "佛手广场", "灵山大佛", "灵山梵宫"];
  }

  const count = hours > 0 && hours <= 1.5 ? 3 : hours > 0 && hours <= 3 ? 4 : Math.min(5, spots.length);
  return {
    routeName,
    duration: hours > 0 ? `约 ${hours} 小时` : "约 3 小时",
    reason: "AI 本轮回复未返回可定位的景点名称，地图已根据当前时长和偏好生成一条可调整的参考路线。",
    spots: spots.slice(0, count),
  };
}

function parseRouteSpotsFromAIText(text = "") {
  if (!text) return [];

  const ordered = [];
  const seen = new Set();

  const addName = (rawName) => {
    let cleaned = String(rawName || "")
      .trim()
      .replace(/^[\s\*\-•·]+/, "")
      .replace(/^第?[一二三四五六七八九十\d]+[站点、\.\)\s：:]+/, "")
      .replace(/（.*?）|\(.*?\)/g, "")
      .replace(/[：:，,；;。！!？?].*$/, "")
      .trim();
    if (!cleaned || cleaned.length > 40) return;
    const matched = matchSpotByName(cleaned);
    if (!matched) {
      const direct = scenicSpots.find((spot) => cleaned.includes(spot.name) || (spot.aliases || []).some((alias) => cleaned.includes(alias)));
      if (direct) cleaned = direct.name;
    }
    const name = matchSpotByName(cleaned)?.name || cleaned;
    const key = normalizeSpotName(name);
    if (!key || seen.has(key)) return;
    seen.add(key);
    ordered.push(name);
  };

  const normalizedText = String(text).replace(/\r/g, "");
  const routeLine = normalizedText
    .split("\n")
    .map((line) => line.trim().replace(/^\*+|\*+$/g, ""))
    .find((line) => /^路线顺序\s*[：:]/.test(line));

  if (routeLine) {
    routeLine
      .replace(/^路线顺序\s*[：:]\s*/, "")
      .split(/\s*(?:→|->|—|--|>|、)\s*/)
      .forEach(addName);
    if (ordered.length >= 2) return ordered;
    ordered.length = 0;
    seen.clear();
  }

  const positiveText = normalizedText.split(/(?:舍弃|排除|不推荐|未选择|不纳入|无需前往|不建议前往)/, 1)[0];
  const numberedRe = /(?:^|\n)\s*(?:第\s*)?([一二三四五六七八九十\d]+)[\.、\)\s：:]+([^\n]+)/g;
  let match;
  const numbered = [];
  while ((match = numberedRe.exec(positiveText)) !== null) {
    numbered.push({ line: match[2] });
  }
  if (numbered.length >= 2) {
    numbered.forEach(({ line }) => addName(line));
    if (ordered.length >= 2) return ordered;
    ordered.length = 0;
    seen.clear();
  }

  scenicSpots
    .map((spot) => {
      const names = [spot.name, ...(spot.aliases || [])];
      const positions = names
        .map((name) => positiveText.indexOf(name))
        .filter((position) => position >= 0);
      return positions.length ? { name: spot.name, position: Math.min(...positions) } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.position - b.position)
    .forEach((item) => addName(item.name));

  return ordered;
}

function renderRouteNoMatchState(message, aiText = "") {
  const excerpt = aiText
    ? `<p class="route-ai-excerpt">${escapeHTML(aiText.slice(0, 180))}${aiText.length > 180 ? "..." : ""}</p>`
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
        "AI 回复已同步到游客对话，但暂未从中识别到可定位景点。请补充具体景点名称或调整路线条件。",
        text,
      );
    }
    return null;
  }

  const hours = Number($("availableHours")?.value || 0);
  const plan = {
    routeName: meta.routeName || "AI 智能推荐路线",
    duration: meta.duration || (hours > 0 ? `约 ${hours} 小时` : undefined),
    reason: meta.reason || extractRouteReasonFromAIText(text),
    spots: namesForPlan,
  };

  state.latestRoutePlan = {
    routeName: plan.routeName,
    duration: plan.duration || formatRouteDuration(plan, namesForPlan.map(() => ({ duration: "" }))),
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
    button.textContent = "正在规划...";
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
          if ($("chatMessages")) $("chatMessages").scrollTop = $("chatMessages").scrollHeight;
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

    const replyText = content.trim() || "AI 导览员暂时没有返回有效内容，请稍后再试。";
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
  const hours = Number($("availableHours")?.value || 0);
  const area = ($("currentArea")?.value || "").trim();
  const visibleMessage = `请根据${hours > 0 ? `${hours}小时` : "当前"}游览时长${area ? `、当前位置${area}` : ""}生成推荐路线`;
  const result = await requestAIRoutePlan(prompt, {
    userMessage: visibleMessage,
    button: $("recommendBtn"),
    forceRender: true,
    showNoMatch: true,
  });
  if (result?.usedFallback) {
    toast("AI 回复已同步；地图已生成一条可调整的参考路线");
  } else if (result?.plan) {
    toast("推荐路线已更新到地图和景点列表");
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
  if (!state.conversationId) return toast("璇峰厛鍒涘缓浼氳瘽");
  await request(`/api/conversations/${state.conversationId}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rating: state.selectedRating, comment: $("feedbackComment").value || null }),
  });
  $("feedbackComment").value = "";
  toast("鍙嶉宸叉彁浜?);
}

async function askRouteGuide() {
  const input = $("routeGuideInput");
  const text = input.value.trim();
  if (!text) return toast("先输入想问 AI 导览员的路线问题");
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
      toast("AI 回复已同步；地图已生成一条可调整的参考路线");
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
  toast(`宸茬櫥褰曪細${data.admin?.username || "admin"}`);
  enterApp("admin");
}

const adminDemoData = {
  overview: { total_conversations: 1286, total_messages: 4932, avg_response_ms: 1680, avg_satisfaction: 4.7, rag_hit_rate: 0.92 },
  satisfaction: {
    trend: [
      { date: "鍛ㄤ竴", avg_rating: 4.3, count: 18 }, { date: "鍛ㄤ簩", avg_rating: 4.5, count: 22 },
      { date: "鍛ㄤ笁", avg_rating: 4.6, count: 25 }, { date: "鍛ㄥ洓", avg_rating: 4.4, count: 19 },
      { date: "鍛ㄤ簲", avg_rating: 4.8, count: 31 }, { date: "鍛ㄥ叚", avg_rating: 4.9, count: 42 },
      { date: "鍛ㄦ棩", avg_rating: 4.7, count: 37 },
    ],
    distribution: { 1: 3, 2: 5, 3: 18, 4: 61, 5: 107 },
  },
  emotions: { happy: 64, neutral: 25, thinking: 8, sorry: 3 },
  hotQuestions: [
    { question_pattern: "鐏靛北澶т經鎬庝箞娓歌锛?, count: 86 },
    { question_pattern: "涔濋緳鐏屾荡琛ㄦ紨鏈変粈涔堢壒鑹诧紵", count: 71 },
    { question_pattern: "閫傚悎鑰佷汉娓哥帺鐨勮矾绾?, count: 54 },
    { question_pattern: "姊靛闇€瑕佹父瑙堝涔咃紵", count: 38 },
    { question_pattern: "鍋滆溅鍦哄拰椁愰ギ鍦ㄥ摢閲岋紵", count: 29 },
  ],
  interests: { 鑷劧椋庡厜: 26, 鍘嗗彶鏂囧寲: 38, 浣涙暀鏂囧寲: 44, 浼戦棽濞变箰: 18, 鎷嶇収鎵撳崱: 25, 浜插瓙娓歌: 17, 椁愰ギ璐墿: 12 },
  hotSpots: [
    { spot_name: "鐏靛北澶т經", mention_count: 236 },
    { spot_name: "涔濋緳鐏屾荡", mention_count: 198 },
    { spot_name: "鐏靛北姊靛", mention_count: 174 },
    { spot_name: "浜斿嵃鍧涘煄", mention_count: 126 },
    { spot_name: "浜旀槑妗?, mention_count: 93 },
    { spot_name: "闃胯偛鐜嬫煴", mention_count: 61 },
  ],
};

async function requestAdminData(path, fallback) {
  try {
    return { data: await request(path, { headers: authHeaders() }), source: "backend", path };
  } catch (error) {
    console.warn(`[Admin demo fallback] ${path}`, error);
    return { data: fallback, source: "demo", path, error };
  }
}

async function loadDashboard() {
  if (!state.token) return;
  setDashboardSource("loading");
  const results = await Promise.all([
    requestAdminData("/api/admin/stats/overview?range=today", adminDemoData.overview),
    requestAdminData("/api/admin/stats/satisfaction?range=week", adminDemoData.satisfaction),
    requestAdminData("/api/admin/stats/emotion-trend?range=week", { distribution: adminDemoData.emotions }),
    requestAdminData("/api/admin/stats/hot-questions?range=week&limit=8", { items: adminDemoData.hotQuestions }),
    requestAdminData("/api/admin/stats/interest-distribution?range=month", adminDemoData.interests),
    requestAdminData("/api/admin/stats/hot-spots?range=week&limit=7", { items: adminDemoData.hotSpots }),
  ]);
  const [overview, satisfaction, emotion, hot, interest, hotSpots] = results.map((result) => result.data);
  const usesDemo = results.some((result) => result.source === "demo");
  setDashboardSource(usesDemo ? "mixed" : "backend");
  renderStats(overview, results[0].source === "demo");
  renderSatisfactionCharts(satisfaction.trend || [], satisfaction.distribution || {});
  renderEmotionTrend(emotion.distribution || {});
  renderHotQuestions(hot.items || []);
  renderInterestDistribution(interest || {});
  renderHotSpots(hotSpots.items || []);
}

function setDashboardSource(source) {
  const badge = $("dashboardDataSource");
  if (!badge) return;
  const labels = {
    loading: "姝ｅ湪璇诲彇鏁版嵁",
    backend: "鍚庣瀹炴椂鏁版嵁",
    mixed: "閮ㄥ垎婕旂ず鏁版嵁",
  };
  badge.className = `data-source-badge ${source === "backend" ? "live" : source === "mixed" ? "demo" : "loading"}`;
  badge.textContent = labels[source] || labels.loading;
  badge.title = source === "mixed" ? "閮ㄥ垎缁熻鎺ュ彛涓嶅彲鐢紝鐩稿叧鍥捐〃宸蹭娇鐢ㄩ泦涓畾涔夌殑婕旂ず鏁版嵁銆? : "鏁版嵁鏉ヨ嚜绠＄悊鍚庡彴缁熻鎺ュ彛銆?;
}

function metricIcon(name) {
  const paths = {
    conversations: '<path d="M4 5.5h16v10H8l-4 3v-13Z"/><path d="M8 9h8M8 12h5"/>',
    messages: '<path d="M5 4h14v12H9l-4 3V4Z"/><path d="M8 8h8M8 11h6"/>',
    response: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
    satisfaction: '<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/>',
    rag: '<path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h5"/><path d="m15 15 1.4 1.4L19 13.8"/>',
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.messages}</svg>`;
}

function formatResponseTime(value) {
  const milliseconds = Number(value);
  if (!Number.isFinite(milliseconds)) return { display: "-", raw: "鏆傛棤鍝嶅簲鑰楁椂鏁版嵁" };
  return {
    display: milliseconds >= 1000 ? `${(milliseconds / 1000).toFixed(1)}s` : `${Math.round(milliseconds)}ms`,
    raw: `鍘熷骞冲潎鍊?${Math.round(milliseconds)}ms`,
  };
}

function renderStats(data = {}, usesDemo = false) {
  const response = formatResponseTime(data.avg_response_ms);
  const satisfaction = data.avg_satisfaction == null ? "-" : Number(data.avg_satisfaction).toFixed(1);
  const ragRate = data.rag_hit_rate == null ? null : Math.round(Number(data.rag_hit_rate) * 100);
  const items = [
    { label: "鎬讳細璇?, value: data.total_conversations ?? 0, icon: "conversations", note: "浠婃棩鍒涘缓鐨勬父瀹細璇? },
    { label: "鎬绘秷鎭?, value: data.total_messages ?? 0, icon: "messages", note: "浠婃棩娓稿涓?AI 娑堟伅" },
    { label: "骞冲潎鍝嶅簲鏃堕棿", value: response.display, icon: "response", note: response.raw },
    { label: "婊℃剰搴?, value: satisfaction, icon: "satisfaction", note: satisfaction === "-" ? "浠婃棩鏆傛棤鍙嶉璇勫垎" : `婊″垎 5 鍒?路 ${renderStars(Number(satisfaction))}` },
    { label: "RAG 鍛戒腑鐜?, value: ragRate == null ? "-" : `${ragRate}%`, icon: "rag", note: "AI 鍥炲涓懡涓煡璇嗗簱鐨勬瘮渚?, status: ragRate >= 80 ? "healthy" : "" },
  ];
  $("statsCards").innerHTML = items.map((item) => `
    <article class="stat-card ${item.status || ""}" title="${escapeHTML(item.note)}">
      <div class="stat-card-top"><span>${escapeHTML(item.label)}</span><i>${metricIcon(item.icon)}</i></div>
      <strong>${escapeHTML(item.value)}</strong>
      <small>${escapeHTML(item.note)}</small>
      ${usesDemo ? '<em>鎺ュ彛寮傚父鏃朵娇鐢ㄦ紨绀哄厹搴?/em>' : ""}
    </article>
  `).join("");
}

function renderStars(score) {
  const rounded = Math.max(0, Math.min(5, Math.round(score)));
  return `${"鈽?.repeat(rounded)}${"鈽?.repeat(5 - rounded)}`;
}

function renderSatisfactionCharts(items, distribution) {
  renderLineChart("satisfactionTrend", items);
  renderDonutChart("satisfactionDistribution", distribution);
}

function renderLineChart(id, items) {
  const root = $(id);
  if (!items.length) {
    root.innerHTML = '<div class="admin-empty">鏆傛棤鍙嶉璇勫垎鏁版嵁</div>';
    return;
  }
  const width = 600;
  const height = 230;
  const pad = { left: 38, right: 18, top: 20, bottom: 38 };
  const usableWidth = width - pad.left - pad.right;
  const usableHeight = height - pad.top - pad.bottom;
  const points = items.map((item, index) => {
    const x = pad.left + (items.length === 1 ? usableWidth / 2 : (index / (items.length - 1)) * usableWidth);
    const y = pad.top + usableHeight - (Math.max(0, Math.min(5, Number(item.avg_rating) || 0)) / 5) * usableHeight;
    return { x, y, item };
  });
  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${pad.left},${pad.top + usableHeight} ${polyline} ${pad.left + usableWidth},${pad.top + usableHeight}`;
  const grid = [1, 2, 3, 4, 5].map((value) => {
    const y = pad.top + usableHeight - (value / 5) * usableHeight;
    return `<line x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}" class="chart-grid-line"/><text x="8" y="${y + 4}" class="chart-axis-label">${value}</text>`;
  }).join("");
  root.innerHTML = `
    <svg class="admin-svg-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="婊℃剰搴︽瘡鏃ュ钩鍧囧垎鎶樼嚎鍥?>
      ${grid}
      <polygon points="${area}" class="line-chart-area"/>
      <polyline points="${polyline}" class="line-chart-path"/>
      ${points.map(({ x, y, item }) => `
        <g class="chart-point">
          <circle cx="${x}" cy="${y}" r="5"><title>${escapeHTML(item.date)}锛?{item.avg_rating} 鍒嗭紝${item.count || 0} 鏉″弽棣?/title></circle>
          <text x="${x}" y="${height - 12}" text-anchor="middle" class="chart-axis-label">${escapeHTML(shortDate(item.date))}</text>
        </g>
      `).join("")}
    </svg>`;
}

function shortDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(-3);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function renderDonutChart(id, distribution) {
  const root = $(id);
  const values = [1, 2, 3, 4, 5].map((rating) => Number(distribution[String(rating)] || distribution[rating] || 0));
  const total = values.reduce((sum, value) => sum + value, 0);
  if (!total) {
    root.innerHTML = '<div class="admin-empty">鏆傛棤璇勫垎鍗犳瘮</div>';
    return;
  }
  const colors = ["#cf6f6b", "#d99c63", "#dcc36e", "#73aa97", "#16856f"];
  let offset = 25;
  const segments = values.map((value, index) => {
    const percentage = (value / total) * 100;
    const dash = `${percentage} ${100 - percentage}`;
    const segment = `<circle cx="70" cy="70" r="48" pathLength="100" stroke="${colors[index]}" stroke-dasharray="${dash}" stroke-dashoffset="${-offset}" class="donut-segment"><title>${index + 1} 鏄燂細${value} 鏉★紙${Math.round(percentage)}%锛?/title></circle>`;
    offset += percentage;
    return segment;
  }).join("");
  const average = values.reduce((sum, value, index) => sum + value * (index + 1), 0) / total;
  root.innerHTML = `
    <div class="donut-wrap">
      <svg viewBox="0 0 140 140" class="donut-chart" role="img" aria-label="婊℃剰搴﹁瘎鍒嗗崰姣?>
        <circle cx="70" cy="70" r="48" pathLength="100" class="donut-track"/>
        ${segments}
        <text x="70" y="66" text-anchor="middle" class="donut-value">${average.toFixed(1)}</text>
        <text x="70" y="84" text-anchor="middle" class="donut-label">骞冲潎璇勫垎</text>
      </svg>
      <div class="donut-legend">${values.map((value, index) => `<span><i style="background:${colors[index]}"></i>${index + 1} 鏄?<b>${value}</b></span>`).join("")}</div>
    </div>`;
}

function renderInterestDistribution(data) {
  const dimensions = ["鑷劧椋庡厜", "鍘嗗彶鏂囧寲", "浣涙暀鏂囧寲", "浼戦棽濞变箰", "鎷嶇収鎵撳崱", "浜插瓙娓歌", "椁愰ギ璐墿"];
  const aliases = { 鎽勫奖鎵撳崱: "鎷嶇収鎵撳崱", 浜插瓙娓? "浜插瓙娓歌" };
  const normalized = {};
  Object.entries(data).forEach(([key, value]) => {
    const target = aliases[key] || key;
    normalized[target] = (normalized[target] || 0) + Number(value || 0);
  });
  const values = dimensions.map((label) => normalized[label] || 0);
  const max = Math.max(...values, 0);
  const root = $("interestDistribution");
  if (!max) {
    root.innerHTML = '<div class="admin-empty">鏆傛棤鍏磋叮鍒嗗竷鏁版嵁</div>';
    return;
  }
  const size = 330;
  const center = size / 2;
  const radius = 108;
  const pointAt = (index, scale = 1) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / dimensions.length;
    return [center + Math.cos(angle) * radius * scale, center + Math.sin(angle) * radius * scale];
  };
  const rings = [0.25, 0.5, 0.75, 1].map((scale) => `<polygon points="${dimensions.map((_, index) => pointAt(index, scale).join(",")).join(" ")}" class="radar-grid"/>`).join("");
  const axes = dimensions.map((_, index) => {
    const [x, y] = pointAt(index);
    return `<line x1="${center}" y1="${center}" x2="${x}" y2="${y}" class="radar-axis"/>`;
  }).join("");
  const valuePoints = values.map((value, index) => pointAt(index, value / max));
  root.innerHTML = `
    <svg class="admin-svg-chart radar-chart" viewBox="0 0 ${size} ${size}" role="img" aria-label="娓稿鍏磋叮鍒嗗竷闆疯揪鍥?>
      ${rings}${axes}
      <polygon points="${valuePoints.map((point) => point.join(",")).join(" ")}" class="radar-value"/>
      ${dimensions.map((label, index) => {
        const [x, y] = pointAt(index, 1.22);
        const [px, py] = valuePoints[index];
        return `<text x="${x}" y="${y}" text-anchor="middle" class="radar-label">${label}</text><circle cx="${px}" cy="${py}" r="4" class="radar-point"><title>${label}锛?{values[index]}</title></circle>`;
      }).join("")}
    </svg>`;
}

function renderEmotionTrend(data) {
  const labels = { happy: "绉瀬", neutral: "骞崇ǔ", thinking: "鎬濊€?, sorry: "璐熷悜" };
  const colors = { happy: "#22a17f", neutral: "#7193a1", thinking: "#d9a229", sorry: "#d76b68" };
  const entries = Object.entries(data);
  $("emotionTrend").innerHTML = entries.length ? entries.map(([key, value]) => `
    <div class="emotion-row">
      <span><i style="background:${colors[key] || "#7193a1"}"></i>${labels[key] || escapeHTML(key)}</span>
      <div><b style="width:${Math.min(100, Number(value) || 0)}%;background:${colors[key] || "#7193a1"}"></b></div>
      <strong>${value}</strong>
    </div>`).join("") : '<div class="admin-empty">鏆傛棤鎯呯华鏁版嵁</div>';
}

function extractQuestionKeywords(items) {
  const catalog = ["鐏靛北澶т經", "浜旀槑妗?, "姊靛", "涔濋緳鐏屾荡", "浜斿嵃鍧涘煄", "娓歌璺嚎", "璺嚎", "闂ㄧエ", "鍋滆溅", "椁愰ギ", "寮€鏀炬椂闂?, "鑰佷汉", "浜插瓙", "鎷嶇収"];
  const counts = new Map();
  items.forEach((item) => {
    const text = item.question_pattern || "";
    const weight = Number(item.count || 1);
    catalog.forEach((keyword) => {
      if (text.includes(keyword)) counts.set(keyword === "璺嚎" ? "娓歌璺嚎" : keyword, (counts.get(keyword === "璺嚎" ? "娓歌璺嚎" : keyword) || 0) + weight);
    });
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14);
}

function renderHotQuestions(items) {
  renderRankedList("hotQuestions", items, (item) => item.question_pattern, (item) => item.count);
  const keywords = extractQuestionKeywords(items);
  const root = $("hotQuestionCloud");
  if (!keywords.length) {
    root.innerHTML = '<div class="admin-empty">鏆傛棤鍏抽敭璇嶆暟鎹?/div>';
    return;
  }
  const max = Math.max(...keywords.map(([, count]) => count), 1);
  root.innerHTML = keywords.map(([word, count], index) => {
    const level = 0.82 + (count / max) * 0.72;
    return `<span style="font-size:${level.toFixed(2)}rem;--word-index:${index}" title="${escapeHTML(word)}锛?{count} 娆?>${escapeHTML(word)}</span>`;
  }).join("");
}

function renderRankedList(id, items, labelGetter, valueGetter) {
  $(id).innerHTML = items.length ? items.map((item, index) => `
    <div class="ranked-item"><span>${index + 1}</span><strong>${escapeHTML(labelGetter(item) || "-")}</strong><em>${valueGetter(item) || 0}</em></div>
  `).join("") : '<div class="admin-empty">鏆傛棤鏁版嵁</div>';
}

function renderHotSpots(items) {
  const root = $("hotSpots");
  if (!items.length) {
    root.innerHTML = '<div class="admin-empty">鏆傛棤鏅偣鐑害鏁版嵁</div>';
    return;
  }
  const max = Math.max(...items.map((item) => Number(item.mention_count || 0)), 1);
  root.innerHTML = items.map((item, index) => {
    const value = Number(item.mention_count || 0);
    const width = Math.max(4, (value / max) * 100);
    return `
      <div class="horizontal-rank-item" title="${escapeHTML(item.spot_name)}锛?{value} 娆℃彁鍙?>
        <span>${index + 1}</span>
        <strong>${escapeHTML(item.spot_name || "-")}</strong>
        <div><i style="--rank-width:${width}%"></i></div>
        <em>${value}</em>
      </div>`;
  }).join("");
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
  $(id).innerHTML = items.length ? items.map((item) => `<div class="list-item">${mapper(item)}</div>`).join("") : '<div class="list-item">鏆傛棤鏁版嵁</div>';
}

async function loadKnowledge() {
  if (!state.token) return;
  const [docs, faq, blindResult] = await Promise.all([
    request("/api/admin/knowledge/documents?page=1&page_size=20", { headers: authHeaders() }),
    request("/api/admin/knowledge/faq?page=1&page_size=20", { headers: authHeaders() }),
    requestAdminData("/api/admin/knowledge/blind-spots?range=week", {
      items: [
        { question_pattern: "杞绉熷€熺偣鍦ㄥ摢閲岋紵", count: 6, last_asked_at: new Date().toISOString(), confidence: 0.31 },
        { question_pattern: "姊靛浠婂ぉ鐨勬紨鍑烘椂闂达紵", count: 4, last_asked_at: new Date().toISOString(), confidence: 0.42 },
      ],
    }),
  ]);
  renderKnowledgeDocuments(docs.items || []);
  renderKnowledgeFAQ(faq.items || []);
  renderAdminConversations();
  renderKnowledgeBlindSpots(blindResult.data.items || [], blindResult.source);
  const badge = document.querySelector("#knowledgeBlindPanel .data-source-badge");
  if (badge) {
    badge.className = `data-source-badge ${blindResult.source === "backend" ? "live" : "demo"}`;
    badge.textContent = blindResult.source === "backend" ? "鍚庣瀹炴椂鏁版嵁" : "鍓嶇婕旂ず鏁版嵁";
  }
}

function renderAdminConversations() {
  const messages = state.history.flatMap((conversation) => (
    (conversation.messages || []).slice(-4).map((message) => ({
      conversation: conversation.title || "瀵艰浼氳瘽",
      role: message.role,
      content: message.content,
      time: conversation.updatedAt,
    }))
  )).slice(0, 20);
  $("adminConversationList").innerHTML = messages.length ? `
    <table class="admin-table"><thead><tr><th>浼氳瘽</th><th>瑙掕壊</th><th>鍐呭</th><th>鏃堕棿</th></tr></thead><tbody>
      ${messages.map((item) => `<tr><td>${escapeHTML(item.conversation)}</td><td><span class="status-pill ${item.role === "assistant" ? "success" : "pending"}">${item.role === "assistant" ? "AI" : "娓稿"}</span></td><td>${escapeHTML(item.content).slice(0, 90)}</td><td>${formatDate(item.time)}</td></tr>`).join("")}
    </tbody></table>` : '<div class="admin-empty">鏆傛棤鏈湴娓稿瀵硅瘽銆傚悗绔皻鏈彁渚涚鐞嗗憳浼氳瘽鍒楄〃鎺ュ彛銆?/div>';
}

function renderKnowledgeBlindSpots(items, source = "backend") {
  $("knowledgeBlindSpots").innerHTML = items.length ? `
    <table class="admin-table"><thead><tr><th>鐢ㄦ埛闂</th><th>鐘舵€?/th><th>缃俊搴?/th><th>寤鸿绫诲瀷</th><th>鎿嶄綔</th></tr></thead><tbody>
      ${items.map((item, index) => {
        const confidence = item.confidence;
        return `<tr>
          <td><strong>${escapeHTML(item.question_pattern || item.question || "-")}</strong><small>${formatDate(item.last_asked_at || item.created_at)} 路 鍑虹幇 ${item.count || 1} 娆?/small></td>
          <td><span class="status-pill danger">鏈懡涓?/span></td>
          <td>${confidence == null ? '<span title="鍚庣褰撳墠鏈繑鍥炵疆淇″害">-</span>' : `${Math.round(confidence * 100)}%`}</td>
          <td>${/鏃堕棿|鍑犵偣|寮€鏀?.test(item.question_pattern || "") ? "寮€鏀句笌婕斿嚭鏃堕棿" : "鏈嶅姟璁炬柦"}</td>
          <td><div class="table-actions"><button type="button" data-blind-faq="${index}">鍔犲叆 FAQ</button><button type="button" data-blind-done="${index}" ${source !== "backend" ? "disabled" : ""}>鏍囪宸插鐞?/button></div></td>
        </tr>`;
      }).join("")}
    </tbody></table>` : '<div class="admin-empty">鏈懆鏆傛棤鐭ヨ瘑鐩茬偣銆?/div>';
  $("knowledgeBlindSpots").querySelectorAll("[data-blind-faq]").forEach((button) => {
    button.onclick = () => {
      const item = items[Number(button.dataset.blindFaq)];
      $("faqQuestion").value = item.question_pattern || item.question || "";
      switchAdminSubtab("knowledge", "knowledgeFaqPanel");
      $("faqAnswer").focus();
      toast("闂宸插甫鍏?FAQ 琛ㄥ崟");
    };
  });
  $("knowledgeBlindSpots").querySelectorAll("[data-blind-done]").forEach((button) => {
    button.onclick = () => {
      toast("鍚庣灏氭湭鎻愪緵鐭ヨ瘑鐩茬偣澶勭悊鐘舵€佹帴鍙ｏ紝褰撳墠涓嶄細浼淇濆瓨鎴愬姛");
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
          <small>${escapeHTML(item.category)} 路 ${escapeHTML(item.file_type)} 路 ${Math.ceil((item.file_size || 0) / 1024)} KB 路 ${formatDate(item.created_at)}</small>
          ${item.error_message ? `<small class="error-text">${escapeHTML(item.error_message)}</small>` : ""}
        </div>
        <div class="item-actions">
          <span class="status-pill ${statusClass}">${escapeHTML(item.status)} 路 ${item.chunk_count || 0} chunks</span>
          <button type="button" data-delete-doc="${item.id}">鍒犻櫎</button>
        </div>
      </div>`;
  }).join("") : '<div class="list-item">鏆傛棤鏂囨。锛屼笂浼?txt / pdf / docx 鍚庝細鏄剧ず鍏ュ簱鐘舵€併€?/div>';
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
        <small>${escapeHTML(item.category)} 路 ${item.is_active ? "鍚敤" : "鍋滅敤"} 路 ${formatDate(item.updated_at)}</small>
      </div>
      <div class="item-actions"><button type="button" data-edit-faq="${item.id}">缂栬緫</button><button type="button" data-delete-faq="${item.id}">鍒犻櫎</button></div>
    </div>
  `).join("") : '<div class="list-item">鏆傛棤 FAQ锛屾柊澧炲悗浼氬悓姝ュ埌 AI 鐭ヨ瘑搴撱€?/div>';
  $("faqList").querySelectorAll("[data-edit-faq]").forEach((btn) => {
    btn.onclick = () => {
      const item = items.find((entry) => String(entry.id) === String(btn.dataset.editFaq));
      if (!item) return;
      $("faqId").value = item.id;
      $("faqQuestion").value = item.question || "";
      $("faqAnswer").value = item.answer || "";
      $("faqCategory").value = item.category || "general";
      $("faqSubmitBtn").textContent = "淇濆瓨淇敼";
      $("faqCancelEditBtn").classList.remove("hidden");
      $("faqQuestion").focus();
    };
  });
  $("faqList").querySelectorAll("[data-delete-faq]").forEach((btn) => {
    btn.onclick = () => deleteFAQ(btn.dataset.deleteFaq).catch((err) => toast(err.message));
  });
}

async function uploadDocument(event) {
  event.preventDefault();
  const file = $("docFile").files[0];
  if (!file) return toast("璇烽€夋嫨鏂囨。");
  const extension = file.name.split(".").pop().toLowerCase();
  if (["md", "markdown"].includes(extension)) {
    toast("鍚庣褰撳墠浠呮敮鎸?PDF銆丏OCX銆乀XT锛孧arkdown 灏氫笉鑳界湡瀹炲叆搴?);
    return;
  }
  const form = new FormData();
  form.append("file", file);
  form.append("category", $("docCategory").value || "general");
  await request("/api/admin/knowledge/documents", { method: "POST", headers: authHeaders(), body: form });
  event.target.reset();
  $("docCategory").value = "general";
  toast("鏂囨。宸蹭笂浼狅紝姝ｅ湪鍏ュ簱");
  loadKnowledge().catch(() => {});
  window.setTimeout(() => loadKnowledge().catch(() => {}), 3000);
}

async function createFAQ(event) {
  event.preventDefault();
  const faqId = $("faqId").value;
  await request(faqId ? `/api/admin/knowledge/faq/${faqId}` : "/api/admin/knowledge/faq", {
    method: faqId ? "PUT" : "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ question: $("faqQuestion").value, answer: $("faqAnswer").value, category: $("faqCategory").value || "general" }),
  });
  resetFAQForm();
  toast(faqId ? "FAQ 宸叉洿鏂板苟鍚屾鐭ヨ瘑搴? : "FAQ 宸叉柊澧炲苟鍚屾鐭ヨ瘑搴?);
  loadKnowledge().catch(() => {});
}

async function deleteDocument(id) {
  await request(`/api/admin/knowledge/documents/${id}`, { method: "DELETE", headers: authHeaders() });
  toast("鏂囨。宸插垹闄?);
  loadKnowledge().catch(() => {});
}

async function deleteFAQ(id) {
  await request(`/api/admin/knowledge/faq/${id}`, { method: "DELETE", headers: authHeaders() });
  toast("FAQ 宸插垹闄?);
  loadKnowledge().catch(() => {});
}

function resetFAQForm() {
  $("faqForm").reset();
  $("faqId").value = "";
  $("faqCategory").value = "general";
  $("faqSubmitBtn").textContent = "鏂板 FAQ";
  $("faqCancelEditBtn").classList.add("hidden");
}

async function loadScenic() {
  if (!state.token) return;
  const [spots, routes] = await Promise.all([
    request("/api/admin/spots", { headers: authHeaders() }),
    request("/api/admin/routes", { headers: authHeaders() }),
  ]);
  renderScenicSpots(spots || []);
  renderList("routesList", routes || [], (item) => `${escapeHTML(item.name)}<br><small>${escapeHTML((item.target_tags || []).join("銆?))} 路 ${item.duration_hours || "-"} 灏忔椂</small>`);
}

function scenicLocalMeta() {
  return JSON.parse(localStorage.getItem("dg_scenic_admin_meta") || "{}");
}

function renderScenicSpots(items) {
  const meta = scenicLocalMeta();
  $("spotsList").innerHTML = items.length ? `
    <table class="admin-table"><thead><tr><th>鍥剧墖</th><th>鏅偣</th><th>鏍囩</th><th>寮€鏀炬椂闂?/th><th>鏃堕暱</th><th>浣嶇疆</th><th>鐘舵€?/th><th>鎿嶄綔</th></tr></thead><tbody>
      ${items.map((item) => {
        const local = meta[item.id] || {};
        const location = locationFromSpot(item);
        const fallbackLocation = locationFromSpot(matchSpotByName(item.name) || {});
        const displayLocation = location || fallbackLocation;
        return `<tr>
          <td>${item.image_url
            ? `<img class="admin-spot-thumb" src="${escapeHTML(resolveMediaURL(item.image_url))}" alt="${escapeHTML(item.name)}" loading="lazy" />`
            : '<span class="admin-spot-thumb empty">鏆傛棤</span>'}</td>
          <td><strong>${escapeHTML(item.name)}</strong><small>${escapeHTML(item.description || "").slice(0, 70)}</small></td>
          <td>${(item.tags || []).map((tag) => `<span class="mini-tag">${escapeHTML(tag)}</span>`).join("")}</td>
          <td>${escapeHTML(local.open_hours || "寰呰ˉ鍏?)}</td>
          <td>${item.visit_duration_min || 30} 鍒嗛挓</td>
          <td>${displayLocation
            ? `${displayLocation.lat.toFixed(6)}, ${displayLocation.lng.toFixed(6)}${location ? "" : '<small class="coordinate-fallback-note">寰呬繚瀛樹慨澶?/small>'}`
            : "鏆傛棤鍧愭爣"}</td>
          <td><span class="status-pill ${item.is_active ? "success" : "pending"}">${local.is_hot ? "鐑棬" : item.is_active ? "灞曠ず涓? : "鍋滅敤"}</span></td>
          <td><div class="table-actions"><button type="button" data-edit-spot="${item.id}">缂栬緫</button><button type="button" class="danger" data-delete-spot="${item.id}">鍒犻櫎</button></div></td>
        </tr>`;
      }).join("")}
    </tbody></table>` : '<div class="admin-empty">鏆傛棤鏅偣锛岃鍏堟柊澧炴櫙鐐硅祫鏂欍€?/div>';
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
  const backendLocation = locationFromSpot(item);
  const fallbackLocation = locationFromSpot(matchSpotByName(item.name) || {});
  const location = backendLocation || fallbackLocation || {};
  $("spotId").value = item.id;
  $("spotName").value = item.name || "";
  $("spotDesc").value = item.description || "";
  $("spotTags").value = (item.tags || []).join("銆?);
  $("spotDuration").value = item.visit_duration_min || 30;
  $("spotLat").value = Number.isFinite(location.lat) ? location.lat.toFixed(6) : "";
  $("spotLng").value = Number.isFinite(location.lng) ? location.lng.toFixed(6) : "";
  $("spotOpenHours").value = local.open_hours || "";
  $("spotHot").checked = Boolean(local.is_hot);
  renderSpotImagePreview(resolveMediaURL(item.image_url), item.name);
  $("spotName").focus();
}

function resetSpotForm() {
  $("spotForm").reset();
  $("spotId").value = "";
  $("spotDuration").value = 30;
  renderSpotImagePreview();
}

function renderSpotImagePreview(url = "", name = "鏅偣鍥剧墖") {
  const preview = $("spotImagePreview");
  if (!preview) return;
  preview.innerHTML = url
    ? `<img src="${escapeHTML(url)}" alt="${escapeHTML(name)}" /><span>鍥剧墖灏嗗悓姝ュ睍绀哄湪娓稿绔櫙鐐硅鎯呬腑</span>`
    : "<span>涓婁紶鍥剧墖鍚庡皢鍦ㄨ繖閲岄瑙?/span>";
  preview.classList.toggle("has-image", Boolean(url));
}

function splitTags(value) {
  return value.split(/[,锛屻€乚/).map((item) => item.trim()).filter(Boolean);
}

async function createSpot(event) {
  event.preventDefault();
  const spotId = $("spotId").value;
  const latText = $("spotLat").value.trim();
  const lngText = $("spotLng").value.trim();
  const lat = latText === "" ? Number.NaN : Number(latText);
  const lng = lngText === "" ? Number.NaN : Number(lngText);
  const hasLocation = Number.isFinite(lat) && Number.isFinite(lng);
  if ((latText || lngText) && !hasLocation) return toast("璇峰悓鏃跺～鍐欐湁鏁堢殑绾害鍜岀粡搴?);
  if (hasLocation && !locationFromSpot({ lat, lng })) {
    return toast("缁忕含搴︽棤鏁堬紝璇锋鏌ユ槸鍚﹀～鍙嶆垨杈撳叆浜?0,0");
  }
  const saved = await request(spotId ? `/api/admin/spots/${spotId}` : "/api/admin/spots", {
    method: spotId ? "PUT" : "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      name: $("spotName").value,
      description: $("spotDesc").value,
      tags: splitTags($("spotTags").value),
      visit_duration_min: Number($("spotDuration").value || 30),
      location: hasLocation ? { lat, lng } : null,
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
  state.routeCatalogLoaded = false;
  resetSpotForm();
  toast(spotId ? "鏅偣宸叉洿鏂? : "鏅偣宸叉柊澧?);
  loadScenic().catch(() => {});
}

async function deleteSpot(id) {
  if (!window.confirm("纭畾鍒犻櫎杩欎釜鏅偣鍚楋紵")) return;
  await request(`/api/admin/spots/${id}`, { method: "DELETE", headers: authHeaders() });
  const meta = scenicLocalMeta();
  delete meta[id];
  localStorage.setItem("dg_scenic_admin_meta", JSON.stringify(meta));
  toast("鏅偣宸插垹闄?);
  loadScenic().catch(() => {});
}

async function createRoute(event) {
  event.preventDefault();
  let spotSequence = [];
  try {
    spotSequence = $("routeSpots").value ? JSON.parse($("routeSpots").value) : [];
  } catch {
    return toast("鏅偣搴忓垪 JSON 鏍煎紡涓嶆纭?);
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
  toast("璺嚎宸叉柊澧?);
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
  $("cfgRole").value = extra.role || "鐭ヨ瘑搴撴暟瀛椾汉璁茶В鍛?;
  $("cfgWelcome").value = extra.welcome_message || "鎮ㄥソ锛屾垜鏄綋鍓嶅満鏅殑 AI 瀵艰鍛橈紝寰堥珮鍏翠负浣犳彁渚涜瑙ｄ笌璺嚎鏈嶅姟銆?;
  $("cfgVolume").value = extra.volume ?? 85;
  $("cfgVolumeValue").value = `${extra.volume ?? 85}%`;
  $("cfgModelType").value = extra.model_type || "live2d";
  $("cfgTtsEnabled").checked = extra.tts_enabled !== false;
  $("cfgAutoVoice").checked = extra.auto_voice !== false;
  $("cfgVoiceInput").checked = extra.voice_input_enabled !== false;
  $("cfgInterrupt").checked = extra.allow_interrupt !== false;
  $("cfgLipSync").checked = extra.lip_sync_enabled !== false;
  $("cfgWelcomeEnabled").checked = extra.welcome_enabled !== false;
  $("cfgMotion").value = extra.default_motion || "idle";
  $("cfgModelPath").value = extra.live2d_model_path || "";
  $("cfgThemeColor").value = extra.theme_color || "#168f91";
  $("cfgPosition").value = extra.position || "left";
  $("adminHumanPreviewName").textContent = cfg.name || "AI 瀵艰鍛?;
  $("adminHumanPreviewRole").textContent = extra.role || "鐭ヨ瘑搴撴暟瀛椾汉璁茶В鍛?;
  renderAvatarPreview(cfg.avatar_url, cfg);
  applyHumanConfig(cfg);
}

function renderAvatarPreview(url, cfg = state.humanConfig || {}) {
  const preview = $("avatarPreview");
  const modelType = cfg.extra_config?.model_type || "live2d";
  const appearance = cfg.appearance || "modern";
  const roleNames = { modern: "Mark", hanfu: "妞?, nature: "鍙傛暟鎺у埗瑙掕壊", custom: "鑷畾涔夋ā鍨? };
  const stateBadge = $("adminHumanLoadState");
  const modelInfo = $("adminHumanModelInfo");
  if (modelType === "static" && url) {
    preview.className = "avatar-image";
    preview.innerHTML = `<img src="${escapeHTML(url)}" alt="鏁板瓧浜哄ご鍍? />`;
    if (stateBadge) {
      stateBadge.className = "status-pill success";
      stateBadge.textContent = "闈欐€佸ご鍍忓凡鍔犺浇";
    }
  } else {
    preview.className = `avatar-live2d-preview ${appearance}`;
    preview.innerHTML = `<span>Live2D</span><strong>${escapeHTML(roleNames[appearance] || "鑷畾涔夋ā鍨?)}</strong><small>${escapeHTML(cfg.extra_config?.live2d_model_path || live2dModels[appearance] || "鏈厤缃ā鍨嬭矾寰?)}</small>`;
    if (stateBadge) {
      stateBadge.className = `status-pill ${live2dModels[appearance] || cfg.extra_config?.live2d_model_path ? "success" : "danger"}`;
      stateBadge.textContent = live2dModels[appearance] || cfg.extra_config?.live2d_model_path ? "妯″瀷璺緞宸查厤缃? : "妯″瀷璺緞缂哄け";
    }
  }
  if (modelInfo) modelInfo.textContent = modelType === "static"
    ? "褰撳墠浣跨敤闈欐€佸浘鐗囷紝涓嶅惎鐢?Live2D 鍔ㄤ綔涓庡彛鍨嬪弬鏁般€?
    : `${roleNames[appearance] || "鑷畾涔夋ā鍨?} 路 ${cfg.extra_config?.live2d_model_path || live2dModels[appearance] || "鏈厤缃矾寰?}`;
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
    model_type: $("cfgModelType").value,
    volume: Number($("cfgVolume").value || 85),
    tts_enabled: $("cfgTtsEnabled").checked,
    auto_voice: $("cfgAutoVoice").checked,
    voice_input_enabled: $("cfgVoiceInput").checked,
    allow_interrupt: $("cfgInterrupt").checked,
    lip_sync_enabled: $("cfgLipSync").checked,
    welcome_enabled: $("cfgWelcomeEnabled").checked,
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
  applyHumanConfig(cfg);
  renderAvatarPreview(cfg.avatar_url, cfg);
  $("adminHumanPreviewName").textContent = cfg.name || "AI 瀵艰鍛?;
  $("adminHumanPreviewRole").textContent = extraConfig.role;
  document.documentElement.style.setProperty("--brand", extraConfig.theme_color);
  toast("鏁板瓧浜洪厤缃凡淇濆瓨");
}

function previewAdminHumanState(stateName) {
  document.querySelectorAll("[data-human-preview-state]").forEach((button) => {
    button.classList.toggle("active", button.dataset.humanPreviewState === stateName);
  });
  const preview = $("avatarPreview");
  preview?.classList.remove("is-idle", "is-thinking", "is-speaking");
  preview?.classList.add(`is-${stateName}`);
  const badge = $("adminHumanLoadState");
  if (badge) badge.textContent = stateName === "speaking" ? "speaking 路 鍙ｅ瀷鍔ㄧ敾" : stateName === "thinking" ? "thinking 路 鎬濊€冧腑" : "idle 路 鍦ㄧ嚎寰呭懡";
}

function bindEvents() {
  const bindClick = (id, handler) => {
    const el = $(id);
    if (el) el.onclick = handler;
  };
  const bindSubmit = (id, handler) => {
    const el = $(id);
    if (el) el.onsubmit = handler;
  };
  const bindInput = (id, handler) => {
    const el = $(id);
    if (el) el.oninput = handler;
  };
  const bindKeydown = (id, handler) => {
    const el = $(id);
    if (el) el.onkeydown = handler;
  };
  const bindChange = (id, handler) => {
    const el = $(id);
    if (el) el.onchange = handler;
  };

  if ($("apiBase")) $("apiBase").value = state.apiBase;
  bindClick("visitorRoleBtn", () => setRoleForm("visitor"));
  bindClick("adminRoleBtn", () => setRoleForm("admin"));
  if ($("visitorLoginForm")) {
    $("visitorLoginForm").onsubmit = (event) => {
      event.preventDefault();
      state.visitorName = $("visitorNameInput")?.value.trim() || "涓存椂娓稿";
      localStorage.setItem("dg_visitor_name", state.visitorName);
      enterApp("visitor");
    };
  }
  bindSubmit("adminLoginForm", (event) => adminLogin(event).catch((err) => toast(err.message)));
  bindClick("homeBtn", goHome);
  bindClick("logoutBtn", logout);
  bindClick("sidebarToggle", toggleSidebar);
  const historyToggle = $("historyToggleBtn");
  if (historyToggle) historyToggle.onclick = () => setHistoryOpen(!document.body.classList.contains("history-open"));
  bindClick("historyCloseBtn", () => setHistoryOpen(!document.body.classList.contains("history-open")));

  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.onclick = () => switchView(btn.dataset.view);
  });
  document.querySelectorAll("[data-subtab-target]").forEach((button) => {
    button.onclick = () => switchAdminSubtab(button.dataset.subtabGroup, button.dataset.subtabTarget);
  });
  document.querySelectorAll("[data-question]").forEach((btn) => {
    btn.onclick = () => sendMessage(btn.dataset.question).catch((err) => toast(err.message));
  });

  bindClick("newConversationBtn", () => createConversation().catch((err) => toast(err.message)));
  bindClick("sendBtn", handleSendAction);
  bindClick("attachmentBtn", () => toast("闄勪欢鍏ュ彛宸查鐣欙紝鍙户缁帴鍏ュ浘鐗囪瘑鍒笌鏂囨。鎻愰棶"));
  bindInput("chatInput", updateComposerState);
  bindKeydown("chatInput", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendAction();
    }
  });
  bindClick("voiceBtn", toggleVoiceRecognition);
  bindClick("stopReplyBtn", () => stopReply());
  bindClick("recommendBtn", () => recommendRoute().catch((err) => toast(err.message)));
  bindClick("feedbackBtn", () => submitFeedback().catch((err) => toast(err.message)));
  bindClick("routeGuideBtn", askRouteGuide);
  bindClick("routeStopReplyBtn", () => stopReply());
  bindClick("routeSpotDetailClose", closeRouteSpotDetail);
  bindKeydown("routeGuideInput", (event) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      askRouteGuide();
    }
  });
  bindClick("refreshStatsBtn", () => loadDashboard().catch((err) => toast(err.message)));
  bindSubmit("docForm", (event) => uploadDocument(event).catch((err) => toast(err.message)));
  bindSubmit("faqForm", (event) => createFAQ(event).catch((err) => toast(err.message)));
  bindClick("faqCancelEditBtn", resetFAQForm);
  bindSubmit("spotForm", (event) => createSpot(event).catch((err) => toast(err.message)));
  bindClick("spotFormReset", resetSpotForm);
  bindChange("spotImage", () => {
    const file = $("spotImage").files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      $("spotImage").value = "";
      toast("鏅偣鍥剧墖鏈€澶ф敮鎸?10 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => renderSpotImagePreview(String(reader.result || ""), file.name);
    reader.readAsDataURL(file);
  });
  bindSubmit("routeForm", (event) => createRoute(event).catch((err) => toast(err.message)));
  bindSubmit("humanForm", (event) => saveHumanConfig(event).catch((err) => toast(err.message)));
  ["cfgName", "cfgAppearance", "cfgVoiceGender", "cfgVoiceSpeed", "cfgExpression", "cfgModelType", "cfgModelPath"].forEach((id) => {
    bindInput(id, previewHumanConfigFromForm);
  });
  bindInput("cfgVolume", () => {
    if ($("cfgVolumeValue") && $("cfgVolume")) $("cfgVolumeValue").value = `${$("cfgVolume").value}%`;
  });
  document.querySelectorAll("[data-human-preview-state]").forEach((button) => {
    button.onclick = () => previewAdminHumanState(button.dataset.humanPreviewState);
  });
  ["cfgName", "cfgRole"].forEach((id) => {
    const el = $(id); if (el) el.addEventListener("input", () => { if ($("adminHumanPreviewName")) $("adminHumanPreviewName").textContent = $("cfgName")?.value || "AI 导览员"; if ($("adminHumanPreviewRole")) $("adminHumanPreviewRole").textContent = $("cfgRole")?.value || "知识库数字人讲解员"; });
  });
  ["visitorAvatarEngine", "visitorAppearance", "visitorVoiceGender", "visitorVoiceSpeed", "visitorExpression"].forEach((id) => {
    bindInput(id, previewVisitorHumanConfig);
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

export async function bootstrapLegacyApp() {
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
    name: "AI 瀵艰鍛?,
    appearance: "modern",
    voice_gender: "female",
    voice_speed: "medium",
    expression_style: "lively",
    extra_config: JSON.parse(localStorage.getItem("dg_admin_human_settings") || "{}"),
    ...(state.visitorHumanConfig || {}),
  });
  setAvatarEngine(state.avatarEngine || "live2d", false);
  initVRMAvatar().then((avatar) => avatar?.setMode("idle")).catch(() => {});
  addMessage("assistant", `鎮ㄥソ锛屾垜鏄?{digitalHumanName()}銆傜偣鍑烩€滄柊寤轰細璇濃€濓紝鍗冲彲寮€濮嬭闂綋鍓嶅満鏅唴瀹广€佽矾绾垮拰鏈嶅姟淇℃伅銆俙, undefined, false);
  if (!state.visitorName) {
    state.visitorName = localStorage.getItem("dg_visitor_name") || "璁垮";
  }
  localStorage.setItem("dg_visitor_name", state.visitorName);
  if ($("visitorNameInput")) $("visitorNameInput").value = state.visitorName;
  if (isVisitorOnlyEntry()) {
    state.role = "visitor";
    localStorage.setItem("dg_role", "visitor");
    enterApp("visitor");
    return;
  }
  if (state.role === "admin" && state.token) enterApp("admin");
  if (state.role === "visitor") enterApp("visitor");
}

