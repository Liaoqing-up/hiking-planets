/**
 * 行者的星球 · 零依赖原生 ES Module 云端认证与串门社交同步引擎
 *
 * 兼容后端：Supabase (PostgreSQL + GoTrue + PostgREST + Storage) / 国内 MemFire Cloud
 * 核心能力：
 * 1. 星际行者护照注册 / 登录 / 会话自动续期 / 退出 (Auth)
 * 2. 个人宇宙代号档案读写 (`profiles` 表：支持 `?u=handle` 访问任意朋友的宇宙，并兼容清哥/Kitty/咩咩/Luca 四大创始星主)
 * 3. 自建 3D 星球云端持久化 (`user_planets` 表)
 * 4. 微信免登录/已登录全网实时送玫瑰、星际漂流瓶留言、球面山脊插旗 (`planet_roses`, `planet_notes`, `planted_flags`)
 * 5. 旅途照片与户外 GPX 轨迹上传 (`planet-media` Storage 桶)
 */

import {
  DIRECT_SUPABASE_URL,
  FALLBACK_PAGES_ORIGIN,
  STORAGE_BUCKET_MEDIA,
  SUPABASE_ANON_KEY,
  resolveCloudApiBase,
} from "./cloudConfig.js?v=5.3.2-shanhai-astrolabe";

const SESSION_STORAGE_KEY = "hikerstars_auth_session_v1";

let activeApiBase = resolveCloudApiBase();
let fallbackProbed = false;

async function cloudFetch(subPath, options = {}) {
  const { method = "GET", headers = {}, body, authToken, prefer } = options;
  const reqHeaders = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${authToken || getAccessToken() || SUPABASE_ANON_KEY}`,
    ...headers,
  };
  if (prefer) reqHeaders.Prefer = prefer;
  if (body && !(body instanceof Blob) && !(body instanceof FormData) && !reqHeaders["Content-Type"]) {
    reqHeaders["Content-Type"] = "application/json";
  }

  const payload =
    body && typeof body === "object" && !(body instanceof Blob) && !(body instanceof FormData)
      ? JSON.stringify(body)
      : body;

  const tryOnce = async (base) => {
    const res = await fetch(`${base}${subPath}`, {
      method,
      headers: reqHeaders,
      body: payload,
    });
    return res;
  };

  let res;
  try {
    res = await tryOnce(activeApiBase);
    // 若本地静态 http.server / 本地 dev 代理因国内直连被重置返回 404/501/502，自动无感切换到 Cloudflare Pages 同域边缘网关！
    if ((res.status === 404 || res.status === 501 || res.status === 502) && activeApiBase.endsWith("/sb") && !fallbackProbed) {
      fallbackProbed = true;
      for (const candidate of [`${FALLBACK_PAGES_ORIGIN}/sb`, DIRECT_SUPABASE_URL]) {
        if (candidate === activeApiBase) continue;
        try {
          const probe = await tryOnce(candidate);
          if (probe.status !== 404 && probe.status !== 501 && probe.status !== 502) {
            activeApiBase = candidate;
            res = probe;
            break;
          }
        } catch (_) {}
      }
    }
  } catch (networkErr) {
    if (!fallbackProbed) {
      fallbackProbed = true;
      for (const candidate of [`${FALLBACK_PAGES_ORIGIN}/sb`, DIRECT_SUPABASE_URL]) {
        if (candidate === activeApiBase) continue;
        try {
          res = await tryOnce(candidate);
          activeApiBase = candidate;
          break;
        } catch (_) {}
      }
    }
    if (!res) throw networkErr;
  }

  // 如果访问令牌失效/过期导致公开读取返回 401，自动剥离失效会话并回退匿名公钥重试！
  if (res.status === 401 && !authToken && getAccessToken()) {
    saveSession(null);
    reqHeaders.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
    res = await tryOnce(activeApiBase);
  }

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (_) {
      data = text;
    }
  }

  if (!res.ok) {
    const msg =
      data?.msg ||
      data?.error_description ||
      data?.message ||
      data?.hint ||
      `云端请求失败 (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.details = data;
    throw err;
  }
  return data;
}

// ==================== 1. 会话与认证管理 (Star Hiker Passport) ====================

let currentSession = loadStoredSession();
const PROFILE_CACHE_KEY = `${SESSION_STORAGE_KEY}_profile`;
let currentProfile = loadStoredProfile();
const authListeners = new Set();

function loadStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function loadStoredProfile() {
  try {
    const raw = localStorage.getItem(`${SESSION_STORAGE_KEY}_profile`);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function saveStoredProfile(prof) {
  currentProfile = prof || null;
  try {
    if (prof) localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(prof));
    else localStorage.removeItem(PROFILE_CACHE_KEY);
  } catch (_) {}
}

function saveStoredSession(session) {
  currentSession = session;
  try {
    if (session) localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (_) {}
}

function notifyAuthChange() {
  const snapshot = { user: currentSession?.user || null, profile: currentProfile };
  authListeners.forEach((fn) => {
    try {
      fn(snapshot);
    } catch (_) {}
  });
}

export function onAuthStateChange(listener) {
  authListeners.add(listener);
  return () => authListeners.delete(listener);
}

export function getAccessToken() {
  return currentSession?.access_token || null;
}

export function getCurrentAuthState() {
  return {
    isLoggedIn: Boolean(currentSession?.user),
    user: currentSession?.user || null,
    profile: currentProfile,
  };
}

export function getCurrentProfile() {
  return currentProfile || null;
}

export function isCloudLoggedIn() {
  return Boolean(currentSession?.access_token && currentProfile);
}

export function sanitizeHandle(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 24);
}

/**
 * 启动时自动恢复登录态并刷新即将过期的 Token
 */
export async function restoreCloudSession() {
  if (!currentSession?.access_token) return getCurrentAuthState();
  const nowSec = Math.floor(Date.now() / 1000);
  if (currentSession.expires_at && currentSession.expires_at - nowSec < 120 && currentSession.refresh_token) {
    try {
      const refreshed = await cloudFetch("/auth/v1/token?grant_type=refresh_token", {
        method: "POST",
        authToken: SUPABASE_ANON_KEY,
        body: { refresh_token: currentSession.refresh_token },
      });
      if (refreshed?.access_token) saveStoredSession(refreshed);
    } catch (_) {
      saveStoredSession(null);
      saveStoredProfile(null);
      notifyAuthChange();
      return getCurrentAuthState();
    }
  }

  try {
    const user = await cloudFetch("/auth/v1/user", {
      method: "GET",
      authToken: currentSession.access_token,
    });
    currentSession.user = user;
    saveStoredSession(currentSession);
    const freshProf = await fetchProfileByUserId(user.id);
    if (freshProf) saveStoredProfile(freshProf);
    notifyAuthChange();
  } catch (_) {
    // 离线弱网时保留本地缓存态，不强制踢出
  }
  return getCurrentAuthState();
}

/**
 * 注册并签发「星际行者护照」
 */
export async function signUpHikerPassport({
  email,
  password,
  handle,
  displayName,
  avatarIcon = "🪐",
  outfit = "mine-host",
  bioPoem = "把走过的每一段山海，都凝成了一颗发光的星球。",
  legacyRole = null,
}) {
  const cleanHandle = sanitizeHandle(handle);
  if (cleanHandle.length < 2) {
    throw new Error("专属星际代号需为 2~24 位字母、数字或下划线（如 xiaolin）");
  }

  // 先检查代号是否已被占用
  const existing = await fetchProfileByHandle(cleanHandle);
  if (existing) {
    throw new Error(`星际代号「${cleanHandle}」已被其他行者认领，换一个试试吧`);
  }

  const res = await cloudFetch("/auth/v1/signup", {
    method: "POST",
    authToken: SUPABASE_ANON_KEY,
    body: {
      email: String(email || "").trim().toLowerCase(),
      password,
      data: { handle: cleanHandle, display_name: displayName || cleanHandle },
    },
  });

  const session = res?.access_token ? res : res?.session || null;
  const user = res?.user || session?.user;
  if (!session?.access_token || !user?.id) {
    throw new Error("注册成功，请使用刚刚的邮箱与密码登录");
  }
  saveStoredSession(session);

  const profileRows = await cloudFetch("/rest/v1/profiles", {
    method: "POST",
    authToken: session.access_token,
    prefer: "return=representation",
    body: {
      id: user.id,
      handle: cleanHandle,
      display_name: String(displayName || cleanHandle).trim().slice(0, 16),
      avatar_icon: avatarIcon,
      outfit,
      bio_poem: String(bioPoem || "").trim().slice(0, 120),
      legacy_role: legacyRole,
    },
  });

  saveStoredProfile(Array.isArray(profileRows) ? profileRows[0] : profileRows);
  notifyAuthChange();
  return { user, profile: currentProfile };
}

/**
 * 使用邮箱 + 密码登录行者护照
 */
export async function signInHikerPassport({ email, password }) {
  const session = await cloudFetch("/auth/v1/token?grant_type=password", {
    method: "POST",
    authToken: SUPABASE_ANON_KEY,
    body: {
      email: String(email || "").trim().toLowerCase(),
      password,
    },
  });

  saveStoredSession(session);
  saveStoredProfile(await fetchProfileByUserId(session.user.id));
  notifyAuthChange();
  return { user: session.user, profile: currentProfile };
}

export async function signOutHikerPassport() {
  if (currentSession?.access_token) {
    try {
      await cloudFetch("/auth/v1/logout", {
        method: "POST",
        authToken: currentSession.access_token,
      });
    } catch (_) {}
  }
  saveStoredSession(null);
  saveStoredProfile(null);
  notifyAuthChange();
}

export async function updateMyProfile(patch) {
  if (!currentSession?.user?.id) throw new Error("请先登录行者护照");
  const rows = await cloudFetch(
    `/rest/v1/profiles?id=eq.${encodeURIComponent(currentSession.user.id)}`,
    {
      method: "PATCH",
      prefer: "return=representation",
      body: patch,
    }
  );
  if (Array.isArray(rows) && rows[0]) {
    saveStoredProfile(rows[0]);
    notifyAuthChange();
  }
  return currentProfile;
}

// ==================== 2. 档案与自建星球查询 / 创建 ====================

export async function fetchProfileByUserId(userId) {
  if (!userId) return null;
  const rows = await cloudFetch(
    `/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=*&limit=1`
  );
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

export async function fetchProfileByHandle(handle) {
  const clean = sanitizeHandle(handle);
  if (!clean) return null;
  const rows = await cloudFetch(
    `/rest/v1/profiles?handle=eq.${encodeURIComponent(clean)}&select=*&limit=1`
  );
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

export async function fetchCloudUserPlanets(ownerHandle = null) {
  const filter = ownerHandle
    ? `&owner_handle=eq.${encodeURIComponent(sanitizeHandle(ownerHandle))}`
    : "";
  return await cloudFetch(
    `/rest/v1/user_planets?select=*${filter}&order=created_at.desc&limit=50`
  );
}

/**
 * 拉取《星海观星台 · 万星名录》全站公开行者与已点亮星球聚合目录
 */
export async function fetchStarObservatoryDirectory() {
  const [profiles, planets, roses] = await Promise.all([
    cloudFetch("/rest/v1/profiles?select=handle,display_name,avatar_icon,outfit,bio_poem,legacy_role,created_at&order=created_at.desc&limit=80").catch(() => []),
    cloudFetch("/rest/v1/user_planets?is_public=eq.true&select=slug,owner_handle,owner_name,planet_name,elevation,template,creature,quote,created_at&order=created_at.desc&limit=150").catch(() => []),
    cloudFetch("/rest/v1/planet_roses?select=bucket_key,rose_count&limit=200").catch(() => []),
  ]);
  return {
    profiles: Array.isArray(profiles) ? profiles : [],
    planets: Array.isArray(planets) ? planets : [],
    roses: Array.isArray(roses) ? roses : [],
  };
}

export async function createCloudUserPlanet({
  planetName,
  elevation = "3000m",
  template = "snow",
  creature = "siguniang",
  quote = "",
  memory = "",
  waypointsJson = [],
  gpxSummary = null,
}) {
  if (!currentSession?.user?.id || !currentProfile) {
    throw new Error("请先登录你的「星际行者护照」，再将新星球永久刻入星图");
  }
  const slug = `${currentProfile.handle}-${Date.now().toString(36)}`;
  const rows = await cloudFetch("/rest/v1/user_planets", {
    method: "POST",
    prefer: "return=representation",
    body: {
      slug,
      owner_id: currentSession.user.id,
      owner_handle: currentProfile.handle,
      owner_name: currentProfile.display_name,
      planet_name: planetName,
      elevation,
      template,
      creature,
      quote,
      memory,
      waypoints_json: waypointsJson,
      gpx_summary: gpxSummary,
      is_public: true,
    },
  });
  return Array.isArray(rows) ? rows[0] : rows;
}

// ==================== 3. 串门社交实时云同步（玫瑰 · 漂流瓶 · 3D 营旗） ====================

export async function fetchCloudBucketSocial(bucketKey) {
  const key = String(bucketKey || "mine").trim();
  const [roseRows, noteRows] = await Promise.all([
    cloudFetch(`/rest/v1/planet_roses?bucket_key=eq.${encodeURIComponent(key)}&select=*&limit=1`),
    cloudFetch(
      `/rest/v1/planet_notes?bucket_key=eq.${encodeURIComponent(key)}&select=*&order=created_at.desc&limit=40`
    ),
  ]);
  const stat = Array.isArray(roseRows) && roseRows[0] ? roseRows[0] : null;
  return {
    roseCount: stat?.rose_count ?? null,
    visitorCount: stat?.visitor_count ?? null,
    notes: Array.isArray(noteRows)
      ? noteRows.map((r) => ({
          id: r.id,
          from: r.author_name,
          handle: r.author_handle,
          badge: r.badge || "🍾 漂流瓶信笺",
          text: r.content,
          time: formatRelativeDate(r.created_at),
        }))
      : [],
  };
}

export async function sendCloudRose(bucketKey) {
  return await cloudFetch("/rest/v1/rpc/increment_planet_rose", {
    method: "POST",
    body: { p_bucket: String(bucketKey || "mine") },
  });
}

export async function recordCloudVisitor(bucketKey) {
  return await cloudFetch("/rest/v1/rpc/increment_planet_visitor", {
    method: "POST",
    body: { p_bucket: String(bucketKey || "mine") },
  });
}

export async function postCloudBottleNote({ bucketKey, authorName, content, badge = "🍾 漂流瓶信笺" }) {
  const rows = await cloudFetch("/rest/v1/planet_notes", {
    method: "POST",
    prefer: "return=representation",
    body: {
      bucket_key: String(bucketKey || "mine"),
      author_id: currentSession?.user?.id || null,
      author_handle: currentProfile?.handle || null,
      author_name: String(authorName || currentProfile?.display_name || "山海旅人").slice(0, 16),
      badge,
      content: String(content || "").trim().slice(0, 120),
    },
  });
  return Array.isArray(rows) ? rows[0] : rows;
}

export async function fetchCloudPlantedFlags(planetId) {
  const rows = await cloudFetch(
    `/rest/v1/planted_flags?planet_id=eq.${encodeURIComponent(planetId)}&select=*&order=created_at.desc&limit=30`
  );
  return Array.isArray(rows)
    ? rows.map((r) => ({
        id: r.id,
        planetId: r.planet_id,
        author: r.author_name,
        role: r.role_key,
        msg: r.msg,
        up: r.up_vec,
        date: r.planted_date,
      }))
    : [];
}

export async function saveCloudPlantedFlag({ planetId, author, role = "mine", msg, up, date }) {
  const rows = await cloudFetch("/rest/v1/planted_flags", {
    method: "POST",
    prefer: "return=representation",
    body: {
      planet_id: planetId,
      author_id: currentSession?.user?.id || null,
      author_name: String(author || currentProfile?.display_name || "旅人").slice(0, 16),
      role_key: role,
      msg: String(msg || "").trim().slice(0, 60),
      up_vec: up,
      planted_date: date || new Date().toISOString().slice(0, 10),
    },
  });
  return Array.isArray(rows) ? rows[0] : rows;
}

// ==================== 4. 旅途照片与 GPX 轨迹存储上传 ====================

export async function uploadPlanetMediaFile(file, subFolder = "photos") {
  if (!currentSession?.user?.id) {
    throw new Error("请先登录行者护照后再上传旅途照片或轨迹");
  }
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const objectPath = `${currentSession.user.id}/${subFolder}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 7)}.${ext}`;

  await cloudFetch(`/storage/v1/object/${STORAGE_BUCKET_MEDIA}/${objectPath}`, {
    method: "POST",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
      "x-upsert": "true",
    },
    body: file,
  });

  // 若当前站点支持同域 /sb（如 hikerstars.com / pages.dev），用相对路径；否则（如 github.io 极速镜像）直接用 activeApiBase！
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  const supportsSameOriginSb =
    host === "hikerstars.com" || host.endsWith(".hikerstars.com") || host.endsWith(".pages.dev");
  const gatewayBase = supportsSameOriginSb ? "/sb" : activeApiBase.startsWith("http://127.0.0.1") || activeApiBase.startsWith("http://localhost")
    ? "https://hikerplanets.pages.dev/sb"
    : activeApiBase;
  return {
    objectPath,
    publicUrl: `${gatewayBase}/storage/v1/object/public/${STORAGE_BUCKET_MEDIA}/${objectPath}`,
  };
}

function formatRelativeDate(isoStr) {
  if (!isoStr) return "星际串门";
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return "星际串门";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}-${dd} 漂达`;
}
