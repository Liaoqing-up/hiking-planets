/**
 * 行者的星球 · 云端后端与站点域名唯一配置中心 (Single Source of Truth)
 *
 * 设计目标：
 * 1. 当前架构：Cloudflare Pages / hikerstars.com 前端 + 同域 /sb 边缘网关 + Supabase 东京 (ap-northeast-1)
 * 2. 未来国内备案平滑迁移：只需将 DIRECT_SUPABASE_URL 与 SUPABASE_ANON_KEY 替换为国内 MemFire Cloud 配置，
 *    业务层代码 (js/cloudClient.js / main.js) 零改动即可无缝切换。
 */

export const SITE_CANONICAL_ORIGIN = "https://hikerstars.com";
export const FALLBACK_PAGES_ORIGIN = "https://hikerplanets.pages.dev";

// Supabase 东京项目公开连接参数（配合严格 PostgreSQL RLS 行级安全策略，浏览器端安全公开）
export const DIRECT_SUPABASE_URL = "https://yocivsfzjgjzfrtxjqav.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvY2l2c2Z6amdqemZydHhqcWF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ5ODc5NDMsImV4cCI6MjExMDU2Mzk0M30.TIs4yMA8nJ0x_bVlHjZbd3-fW5HuoIF8lxHOLDYso78";

export const STORAGE_BUCKET_MEDIA = "planet-media";

/**
 * 自动解析当前环境下最稳妥的云端 API 基址：
 * - 在 hikerstars.com 或 *.pages.dev 上：走同域 `/sb`（由 Cloudflare Worker / Pages Functions 边缘网关内部直连东京，国内微信零阻断）
 * - 在本地开发服务器 (127.0.0.1 / localhost)：优先走本地 `/sb` 代理端点；若使用纯静态 python http.server，则回退至 Pages 同域网关或直连地址
 */
export function resolveCloudApiBase() {
  if (typeof window === "undefined") return DIRECT_SUPABASE_URL;
  const host = window.location.hostname;
  if (
    host === "hikerstars.com" ||
    host.endsWith(".hikerstars.com") ||
    host.endsWith(".pages.dev")
  ) {
    return `${window.location.origin}/sb`;
  }
  if (host === "127.0.0.1" || host === "localhost") {
    // 若通过 node scripts/dev-cloud-server.mjs 启动，同源 /sb 已内置穿透代理；否则回退至线上网关
    return `${window.location.origin}/sb`;
  }
  return DIRECT_SUPABASE_URL;
}

/**
 * 生成对外分享（微信卡片、星门串门链接、插旗直达链接）的标准根网址
 */
export function resolveShareSiteOrigin() {
  if (typeof window === "undefined") return SITE_CANONICAL_ORIGIN;
  const host = window.location.hostname;
  if (host === "127.0.0.1" || host === "localhost") {
    return window.location.origin;
  }
  if (host === "hikerstars.com" || host === "www.hikerstars.com") {
    return SITE_CANONICAL_ORIGIN;
  }
  // 支持 GitHub Pages 等带有子目录（如 /hiking-planets）的全球极速镜像站
  const pathDir = window.location.pathname.replace(/\/index\.html$/i, "").replace(/\/+$/, "");
  return `${window.location.origin}${pathDir}`;
}

/**
 * 将历史云端存储相对路径 `/sb/storage/...` 修正为当前环境下可达的媒体 URL
 * （在不支持 `/sb` 反向代理的纯静态镜像如 `github.io` 上，自动解析至直连或边缘网关）
 */
export function normalizeCloudMediaUrl(url) {
  if (!url || typeof url !== "string") return url;
  if (url.startsWith("/sb/storage/")) {
    const base = resolveCloudApiBase();
    return `${base}${url.slice(3)}`;
  }
  if (url.startsWith("https://hikerplanets.pages.dev/sb/storage/")) {
    const base = resolveCloudApiBase();
    return `${base}${url.slice("https://hikerplanets.pages.dev/sb".length)}`;
  }
  return url;
}
