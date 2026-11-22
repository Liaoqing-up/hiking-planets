/**
 * Cloudflare Pages Functions 同域边缘网关 (/sb/* -> Supabase Tokyo)
 * 作用：
 * 1. 让 https://hikerstars.com/sb/* 与 https://hikerplanets.pages.dev/sb/* 同域直连东京 Supabase，
 *    彻底绕开中国大陆移动/宽带网络对 *.supabase.co 默认域名的连接阻断 (ERR_CONNECTION_RESET)。
 * 2. 后续若迁移至国内备案的 MemFire Cloud，只需将下方 DEFAULT_UPSTREAM 改为 MemFire 实例地址即可。
 */

const DEFAULT_UPSTREAM = "https://yocivsfzjgjzfrtxjqav.supabase.co";
const ALLOWED_PREFIXES = ["/auth/v1/", "/rest/v1/", "/storage/v1/"];

function buildCorsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, apikey, content-type, x-client-info, prefer, range, x-upsert",
    "Access-Control-Expose-Headers": "content-range, x-supabase-api-version",
    "Access-Control-Max-Age": "86400",
  };
}

export async function onRequest(context) {
  const { request, env } = context;
  const origin = request.headers.get("Origin") || "*";
  const cors = buildCorsHeaders(origin);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  const incomingUrl = new URL(request.url);
  const subPath = incomingUrl.pathname.replace(/^\/sb/, "") || "/";

  if (subPath === "/health") {
    return new Response(
      JSON.stringify({
        ok: true,
        gateway: "cloudflare-pages-functions",
        upstreamRegion: "ap-northeast-1",
      }),
      {
        status: 200,
        headers: { ...cors, "Content-Type": "application/json; charset=utf-8" },
      }
    );
  }

  if (!ALLOWED_PREFIXES.some((prefix) => subPath.startsWith(prefix))) {
    return new Response(JSON.stringify({ error: "Forbidden gateway path" }), {
      status: 403,
      headers: { ...cors, "Content-Type": "application/json; charset=utf-8" },
    });
  }

  const upstreamOrigin = (env && env.SUPABASE_UPSTREAM_URL) || DEFAULT_UPSTREAM;
  const targetUrl = upstreamOrigin.replace(/\/+$/, "") + subPath + incomingUrl.search;

  const forwardHeaders = new Headers();
  for (const name of [
    "authorization",
    "apikey",
    "content-type",
    "x-client-info",
    "prefer",
    "range",
    "accept",
    "x-upsert",
  ]) {
    const val = request.headers.get(name);
    if (val) forwardHeaders.set(name, val);
  }

  const upstreamRes = await fetch(targetUrl, {
    method: request.method,
    headers: forwardHeaders,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    redirect: "manual",
  });

  const responseHeaders = new Headers(upstreamRes.headers);
  for (const [k, v] of Object.entries(cors)) {
    responseHeaders.set(k, v);
  }

  return new Response(upstreamRes.body, {
    status: upstreamRes.status,
    statusText: upstreamRes.statusText,
    headers: responseHeaders,
  });
}
