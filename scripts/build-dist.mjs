#!/usr/bin/env node
/**
 * 构建生产级极速单包（同步写入 js/app.bundle.js 与发布目录，使 GitHub Pages 镜像、本地开发服与 Cloudflare Pages 三端全部共享单包秒开！）
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const HOME = process.env.HOME || "";
const DIST = path.join(HOME, "Desktop", "行者的星球-网页发布包");
const DIST_ZIP = `${DIST}.zip`;

function findEsbuildBin() {
  const candidates = [path.join(ROOT, "node_modules", ".bin", "esbuild")];
  const npxDir = path.join(HOME, ".npm", "_npx");
  if (fs.existsSync(npxDir)) {
    for (const dir of fs.readdirSync(npxDir)) {
      const bin = path.join(npxDir, dir, "node_modules", ".bin", "esbuild");
      if (fs.existsSync(bin)) candidates.push(bin);
    }
  }
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === ".DS_Store") continue;
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

const esbuild = findEsbuildBin();
if (!esbuild) {
  throw new Error("esbuild binary not found! Run `npx esbuild --version` once.");
}

// 1. Build `js/app.bundle.js` directly in repo so GitHub Pages (`liaoqing-up.github.io/hiking-planets/`) & local server also load 1 minified file!
execFileSync(
  esbuild,
  [
    path.join(ROOT, "js", "main.js"),
    "--bundle",
    "--minify",
    "--format=esm",
    "--external:three",
    `--outfile=${path.join(ROOT, "js", "app.bundle.js")}`,
  ],
  { stdio: "inherit" }
);

console.log("🚀 Building ultra-fast production bundle to:", DIST);
fs.rmSync(DIST, { recursive: true, force: true });
fs.rmSync(DIST_ZIP, { force: true });
fs.mkdirSync(path.join(DIST, "js"), { recursive: true });
fs.mkdirSync(path.join(DIST, "assets", "photos"), { recursive: true });

for (const file of ["sw.js", "manifest.webmanifest"]) {
  fs.copyFileSync(path.join(ROOT, file), path.join(DIST, file));
}
fs.copyFileSync(path.join(ROOT, "js", "app.bundle.js"), path.join(DIST, "js", "app.bundle.js"));
copyDir(path.join(ROOT, "functions"), path.join(DIST, "functions"));
copyDir(path.join(ROOT, "vendor"), path.join(DIST, "vendor"));
copyDir(path.join(ROOT, "assets", "postcards"), path.join(DIST, "assets", "postcards"));
copyDir(path.join(ROOT, "assets", "kitty"), path.join(DIST, "assets", "kitty"));
copyDir(path.join(ROOT, "assets", "photos", "miemie"), path.join(DIST, "assets", "photos", "miemie"));
copyDir(path.join(ROOT, "assets", "photos", "luca"), path.join(DIST, "assets", "photos", "luca"));

for (const name of fs.readdirSync(path.join(ROOT, "assets"))) {
  if (/\.(jpg|jpeg|png|webp|svg|ico)$/i.test(name)) {
    fs.copyFileSync(path.join(ROOT, "assets", name), path.join(DIST, "assets", name));
  }
}

execFileSync(
  esbuild,
  [
    path.join(ROOT, "styles.css"),
    "--minify",
    `--outfile=${path.join(DIST, "styles.css")}`,
  ],
  { stdio: "inherit" }
);

for (const vf of ["three.module.js", "three.core.js"]) {
  const vp = path.join(DIST, "vendor", vf);
  if (fs.existsSync(vp)) {
    execFileSync(esbuild, [vp, "--minify", "--allow-overwrite", `--outfile=${vp}`], { stdio: "inherit" });
  }
}

const rawHtml = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const inlinedCss = fs.readFileSync(path.join(DIST, "styles.css"), "utf8").trim();

// Inline CSS in DIST/index.html for single-roundtrip instant paint
const distHtml = rawHtml.replace(
  /<link rel="stylesheet" href="\.\/styles\.css[^"]*" \/>/,
  `<style>${inlinedCss}</style>`
);
fs.writeFileSync(path.join(DIST, "index.html"), distHtml, "utf8");

const headersContent = `/js/app.bundle.js
  Cache-Control: public, max-age=31536000, immutable
/vendor/*
  Cache-Control: public, max-age=31536000, immutable
/assets/*
  Cache-Control: public, max-age=604800, stale-while-revalidate=86400
/styles.css
  Cache-Control: public, max-age=31536000, immutable
`;
fs.writeFileSync(path.join(DIST, "_headers"), headersContent, "utf8");

execFileSync("zip", ["-rq", DIST_ZIP, "."], { cwd: DIST, stdio: "inherit" });
console.log(`✅ Ultra-fast production bundle ready at ${DIST}`);
