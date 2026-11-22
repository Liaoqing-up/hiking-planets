#!/usr/bin/env node
/**
 * 本地零配置静态开发服务器 + 同源 `/sb/*` 云端网关转发
 * 用法：node scripts/dev-cloud-server.mjs [port]
 * 特点：与 Cloudflare Pages 线上行为 100% 一致，提供静态资源服务的同时将 `/sb/*` 转发至东京 Supabase。
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.argv[2] || process.env.PORT || 8766);
const SUPABASE_ORIGIN = process.env.SUPABASE_UPSTREAM_URL || "https://yocivsfzjgjzfrtxjqav.supabase.co";
const ALLOWED_PREFIXES = ["/auth/v1/", "/rest/v1/", "/storage/v1/"];

const MIME_MAP = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);

  // 0. 本地同源 /api/ai-inspire 边缘函数模拟
  if (reqUrl.pathname === "/api/ai-inspire") {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString("utf8");
    const mod = await import("../functions/api/ai-inspire.js");
    const cfReq = new Request(`http://127.0.0.1:${PORT}/api/ai-inspire`, {
      method: req.method,
      headers: req.headers,
      body: req.method === "GET" || req.method === "HEAD" ? undefined : raw,
    });
    const cfRes = await mod.onRequest({ request: cfReq, env: {} });
    res.writeHead(cfRes.status, Object.fromEntries(cfRes.headers.entries()));
    res.end(await cfRes.text());
    return;
  }

  // 1. 同源 /sb/* 云端网关代理
  if (reqUrl.pathname === "/sb" || reqUrl.pathname.startsWith("/sb/")) {
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "authorization, apikey, content-type, x-client-info, prefer, range, x-upsert"
    );
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const subPath = reqUrl.pathname.replace(/^\/sb/, "") || "/";
    if (subPath === "/health") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ ok: true, gateway: "local-dev-server", upstream: SUPABASE_ORIGIN }));
      return;
    }

    if (!ALLOWED_PREFIXES.some((p) => subPath.startsWith(p))) {
      res.writeHead(403, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: "Forbidden gateway path" }));
      return;
    }

    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const bodyBuf = chunks.length > 0 ? Buffer.concat(chunks) : undefined;

      const outHeaders = {};
      for (const h of [
        "authorization",
        "apikey",
        "content-type",
        "x-client-info",
        "prefer",
        "range",
        "accept",
        "x-upsert",
      ]) {
        if (req.headers[h]) outHeaders[h] = req.headers[h];
      }

      let upstream;
      try {
        upstream = await fetch(`${SUPABASE_ORIGIN}${subPath}${reqUrl.search}`, {
          method: req.method,
          headers: outHeaders,
          body: req.method === "GET" || req.method === "HEAD" ? undefined : bodyBuf,
          signal: AbortSignal.timeout(2200),
        });
      } catch (_) {
        // 国内直连 *.supabase.co 被重置时，自动走已上线的 Cloudflare Pages 同源网关中转（遇瞬时抖动自动重试 1 次）
        const relayUrl = `https://hikerplanets.pages.dev/sb${subPath}${reqUrl.search}`;
        try {
          upstream = await fetch(relayUrl, {
            method: req.method,
            headers: outHeaders,
            body: req.method === "GET" || req.method === "HEAD" ? undefined : bodyBuf,
            signal: AbortSignal.timeout(5000),
          });
        } catch (_retryErr) {
          upstream = await fetch(relayUrl, {
            method: req.method,
            headers: outHeaders,
            body: req.method === "GET" || req.method === "HEAD" ? undefined : bodyBuf,
            signal: AbortSignal.timeout(6500),
          });
        }
      }

      const ct = upstream.headers.get("content-type");
      if (ct) res.setHeader("Content-Type", ct);
      const cr = upstream.headers.get("content-range");
      if (cr) res.setHeader("Content-Range", cr);

      const arrayBuf = await upstream.arrayBuffer();
      res.writeHead(upstream.status);
      res.end(Buffer.from(arrayBuf));
    } catch (err) {
      res.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
      res.end(
        JSON.stringify({
          error: "Upstream Supabase unreachable from direct local network (deploy to Cloudflare Pages / hikerstars.com to use Edge Gateway)",
          detail: err?.message,
        })
      );
    }
    return;
  }

  // 2. 静态文件服务
  let relPath = decodeURIComponent(reqUrl.pathname);
  if (relPath === "/") relPath = "/index.html";
  const safePath = path.normalize(path.join(ROOT, relPath));
  if (!safePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.stat(safePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }
    const ext = path.extname(safePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME_MAP[ext] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    fs.createReadStream(safePath).pipe(res);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🪐 HikerStars Dev Server running at http://127.0.0.1:${PORT} (LAN accessible)`);
});
