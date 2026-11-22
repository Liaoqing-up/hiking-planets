import * as THREE from "three";
import { getSurfaceRadius } from "./sphereMath.js?v=5.3.1-uncharted-galaxies";
import { drawSiteQrStamp } from "./qrStamp.js?v=5.3.1-uncharted-galaxies";
import { renderPlanetIllustration, renderPostcardScene } from "./planetArt2D.js?v=5.3.1-uncharted-galaxies";
import { computeSmartPhotoCrop, getSavedPhotoPan } from "./photoFocus.js?v=5.3.1-uncharted-galaxies";

const UP = new THREE.Vector3(0, 1, 0);
const FLAG_STORAGE_KEY = "hiking_planets_flags_v1";

// ==================== 1. 🍲 3D 高山气罐炉头小火锅 + 双人钛杯碰杯 ====================
export function buildHotpotRig() {
  const group = new THREE.Group();
  group.visible = false;

  // 金色高山扁气罐 + 折叠炉头架 + 幽蓝炉火圈
  const canister = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.12, 0.11, 14),
    new THREE.MeshStandardMaterial({ color: "#f59e0b", metalness: 0.45, roughness: 0.35 })
  );
  canister.position.y = 0.055;
  const burnerFlame = new THREE.Mesh(
    new THREE.TorusGeometry(0.075, 0.016, 6, 16),
    new THREE.MeshBasicMaterial({ color: "#38bdf8", transparent: true, opacity: 0.9 })
  );
  burnerFlame.rotation.x = Math.PI / 2;
  burnerFlame.position.y = 0.13;

  // 双耳露营钛锅 + 沸腾红汤锅底 + 食材丸子块
  const potMat = new THREE.MeshStandardMaterial({ color: "#cbd5e1", metalness: 0.72, roughness: 0.28 });
  const potBody = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.13, 18), potMat);
  potBody.position.y = 0.205;
  const handleL = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.008, 6, 12, Math.PI), potMat);
  handleL.position.set(-0.175, 0.22, 0);
  handleL.rotation.z = Math.PI / 2;
  const handleR = handleL.clone();
  handleR.position.x = 0.175;
  handleR.rotation.z = -Math.PI / 2;

  const soupMat = new THREE.MeshBasicMaterial({ color: "#ef4444" });
  const soupTop = new THREE.Mesh(new THREE.CircleGeometry(0.168, 18), soupMat);
  soupTop.rotation.x = -Math.PI / 2;
  soupTop.position.y = 0.268;

  const warmLight = new THREE.PointLight("#fb923c", 1.8, 4.2, 1.8);
  warmLight.position.set(0, 0.38, 0);
  group.add(canister, burnerFlame, potBody, handleL, handleR, soupTop, warmLight);

  // 两只欢乐碰杯的钛金属露营杯
  const clinkPivot = new THREE.Group();
  clinkPivot.position.set(0, 0.46, 0);
  const cupGeo = new THREE.CylinderGeometry(0.042, 0.038, 0.088, 12);
  const cupA = new THREE.Mesh(cupGeo, potMat);
  const cupB = new THREE.Mesh(cupGeo, potMat);
  clinkPivot.add(cupA, cupB);
  group.add(clinkPivot);

  // 8 团袅袅升腾的白色火锅鲜香蒸汽
  const steams = [];
  const steamMat = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.58, depthWrite: false });
  for (let i = 0; i < 8; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), steamMat);
    group.add(p);
    steams.push({ mesh: p, phase: i / 8 });
  }

  return {
    group,
    placeAt(planetId, midUp) {
      const r = getSurfaceRadius(planetId, midUp);
      group.position.copy(midUp).multiplyScalar(r - 0.01);
      group.quaternion.setFromUnitVectors(UP, midUp);
      group.visible = true;
    },
    hide() {
      group.visible = false;
    },
    update(elapsed) {
      if (!group.visible) return;
      burnerFlame.scale.setScalar(0.94 + Math.sin(elapsed * 18) * 0.08);
      const swing = Math.abs(Math.sin(elapsed * 3.6));
      cupA.position.set(-0.055 - swing * 0.07, swing * 0.03, 0);
      cupA.rotation.z = -0.22 + swing * 0.15;
      cupB.position.set(0.055 + swing * 0.07, swing * 0.03, 0);
      cupB.rotation.z = 0.22 - swing * 0.15;
      for (const st of steams) {
        const pr = (elapsed * 0.55 + st.phase) % 1;
        st.mesh.position.set(Math.sin(elapsed * 2.4 + st.phase * 9) * 0.08, 0.29 + pr * 0.52, Math.cos(elapsed * 2.1 + st.phase * 9) * 0.08);
        st.mesh.scale.setScalar((0.55 + pr * 1.15) * (1 - pr * 0.55));
      }
    },
  };
}

// ==================== 2. 🚩 3D 球面串门纪念旗 & ?flag= 跨手机微信坐标分享 ====================
export function encodeFlagToken(flagObj) {
  try {
    const compact = {
      p: flagObj.planetId,
      a: String(flagObj.author || "行者").slice(0, 12),
      r: flagObj.role || "mine",
      m: String(flagObj.msg || "").slice(0, 36),
      u: flagObj.up.map((n) => Number(Number(n).toFixed(4))),
      d: flagObj.date || new Date().toISOString().slice(0, 10),
    };
    const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(compact))));
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  } catch {
    return "";
  }
}

export function decodeFlagToken(token) {
  try {
    const norm = String(token || "").replace(/-/g, "+").replace(/_/g, "/");
    const pad = norm + "=".repeat((4 - (norm.length % 4)) % 4);
    const raw = JSON.parse(decodeURIComponent(escape(atob(pad))));
    if (!raw?.p || !Array.isArray(raw.u) || raw.u.length !== 3) return null;
    const v = new THREE.Vector3(Number(raw.u[0]) || 0, Number(raw.u[1]) || 1, Number(raw.u[2]) || 0).normalize();
    return {
      id: `f_${raw.p}_${v.x.toFixed(2)}_${v.y.toFixed(2)}_${v.z.toFixed(2)}`,
      planetId: raw.p,
      author: String(raw.a || "山海好友").slice(0, 12),
      role: raw.r || "mine",
      msg: String(raw.m || "到此吹风打卡，风景绝了！").slice(0, 40),
      up: [v.x, v.y, v.z],
      date: raw.d || "2026",
    };
  } catch {
    return null;
  }
}

export function loadPlantedFlags(planetId = null) {
  try {
    const all = JSON.parse(localStorage.getItem(FLAG_STORAGE_KEY) || "[]");
    const list = Array.isArray(all) ? all : [];
    return planetId ? list.filter((x) => x.planetId === planetId) : list;
  } catch {
    return [];
  }
}

export function savePlantedFlag(flagObj) {
  const list = loadPlantedFlags();
  const v = new THREE.Vector3(...flagObj.up).normalize();
  const id = flagObj.id || `f_${flagObj.planetId}_${v.x.toFixed(2)}_${v.y.toFixed(2)}_${v.z.toFixed(2)}`;
  const item = { ...flagObj, id, up: [v.x, v.y, v.z] };
  const idx = list.findIndex((x) => x.id === id);
  if (idx >= 0) list[idx] = item;
  else list.unshift(item);
  try {
    localStorage.setItem(FLAG_STORAGE_KEY, JSON.stringify(list.slice(0, 48)));
  } catch {}
  return item;
}

export function buildFlagMesh(planetId, flagItem) {
  const wrap = new THREE.Group();
  const unitDir = new THREE.Vector3(...flagItem.up).normalize();
  const r = getSurfaceRadius(planetId, unitDir);
  const COLORS = {
    mine: { cloth: "#f59e0b", emi: "#d97706", ring: "#fde68a" },
    kitty: { cloth: "#f472b6", emi: "#db2777", ring: "#fbcfe8" },
    miemie: { cloth: "#10b981", emi: "#059669", ring: "#6ee7b7" },
    luca: { cloth: "#0ea5e9", emi: "#0284c7", ring: "#bae6fd" },
  };
  const c = COLORS[flagItem.role] || COLORS.mine;

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.02, 0.86, 8),
    new THREE.MeshStandardMaterial({ color: "#f8fafc", metalness: 0.7, roughness: 0.25 })
  );
  pole.position.y = 0.42;

  const topStar = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.058, 0),
    new THREE.MeshStandardMaterial({ color: "#fde047", emissive: "#f59e0b", emissiveIntensity: 0.95 })
  );
  topStar.position.y = 0.88;

  const pennant = new THREE.Mesh(
    new THREE.ConeGeometry(0.14, 0.38, 3),
    new THREE.MeshStandardMaterial({ color: c.cloth, emissive: c.emi, emissiveIntensity: 0.45, roughness: 0.4 })
  );
  pennant.rotation.z = -Math.PI / 2;
  pennant.scale.set(1, 1, 0.16);
  pennant.position.set(0.19, 0.7, 0);

  const baseRing = new THREE.Mesh(
    new THREE.RingGeometry(0.16, 0.23, 20),
    new THREE.MeshBasicMaterial({ color: c.ring, side: THREE.DoubleSide, transparent: true, opacity: 0.75 })
  );
  baseRing.rotation.x = Math.PI / 2;
  baseRing.position.y = 0.025;

  wrap.add(pole, topStar, pennant, baseRing);
  wrap.position.copy(unitDir).multiplyScalar(r);
  wrap.quaternion.setFromUnitVectors(UP, unitDir);
  return { group: wrap, pennant, topStar, unitDir, data: flagItem };
}

function loadCertPhoto(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawLaurelWreath(ctx, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(side, 1);
    ctx.strokeStyle = "#c9963b";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 6, r, Math.PI * 0.62, Math.PI * 1.35, false);
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const a = Math.PI * 0.66 + i * 0.088 * Math.PI;
      const lx = Math.cos(a) * r;
      const ly = 6 + Math.sin(a) * r;
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(a - Math.PI * 0.42);
      ctx.fillStyle = i % 2 === 0 ? "#dca946" : "#b98228";
      ctx.beginPath();
      ctx.ellipse(0, 0, 12, 4.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }
  ctx.restore();
}

// ==================== 3. 🏅 《双人并肩完赛荣誉证》高清联名典藏证书生成器 ====================
export async function generateDuoFinisherCertDataUrl(
  planet,
  hostName = "星主",
  visitorName = "同行旅人",
  steps = 0
) {
  const W = 960, H = 1420;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  const pOwner =
    planet?.owner === "kitty" || planet?.owner === "miemie" || planet?.owner === "luca" ? planet.owner : "mine";

  // 1. 深空繁星外衬 + 典藏羊皮纸内芯 + 烫金双线框与星芒角花
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#091228");
  bg.addColorStop(0.5, "#112145");
  bg.addColorStop(1, "#0b1530");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 42; i++) {
    ctx.fillStyle = `rgba(253, 230, 138, ${0.18 + (i % 4) * 0.12})`;
    ctx.beginPath();
    ctx.arc((i * 197) % W, (i * 283) % H, (i % 2) + 1, 0, Math.PI * 2);
    ctx.fill();
  }

  const paperGrad = ctx.createLinearGradient(0, 42, 0, H - 42);
  paperGrad.addColorStop(0, "#fdf8ec");
  paperGrad.addColorStop(1, "#f4e6c8");
  ctx.fillStyle = paperGrad;
  ctx.beginPath();
  ctx.roundRect(42, 42, W - 84, H - 84, 24);
  ctx.fill();

  ctx.strokeStyle = "#c59134";
  ctx.lineWidth = 3.5;
  ctx.strokeRect(60, 60, W - 120, H - 120);
  ctx.strokeStyle = "rgba(197, 145, 52, 0.42)";
  ctx.lineWidth = 1.3;
  ctx.strokeRect(70, 70, W - 140, H - 140);
  [[82, 82], [W - 82, 82], [82, H - 82], [W - 82, H - 82]].forEach(([cx, cy]) => {
    ctx.fillStyle = "#c59134";
    ctx.font = "18px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("✦", cx, cy + 6);
  });

  // 2. 顶部抬头 + 手绘微缩水彩星球主视觉 + 烫金月桂桂冠 + 联名丝绒绶带
  ctx.textAlign = "center";
  ctx.fillStyle = "#9a6b21";
  ctx.font = "600 17px 'Cormorant Garamond', Georgia, serif";
  ctx.fillText("✦ CO-OP TRAIL FINISHER CERTIFICATE · 星际并肩完赛典藏 ✦", W / 2, 118);

  ctx.fillStyle = "#2c1e0f";
  ctx.font = "44px 'ZCOOL XiaoWei', 'Songti SC', serif";
  ctx.fillText("双 人 并 肩 完 赛 荣 誉 证", W / 2, 174);

  const pCx = W / 2, pCy = 328;
  const halo = planet?.palette?.halo || "#f59e0b";
  const haloGrad = ctx.createRadialGradient(pCx, pCy, 34, pCx, pCy, 150);
  haloGrad.addColorStop(0, "rgba(255, 248, 224, 0.95)");
  haloGrad.addColorStop(0.58, `${halo}38`);
  haloGrad.addColorStop(1, "rgba(251, 244, 228, 0)");
  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.arc(pCx, pCy, 150, 0, Math.PI * 2);
  ctx.fill();

  drawLaurelWreath(ctx, pCx, pCy, 132);

  const planetArt = document.createElement("canvas");
  planetArt.width = 300;
  planetArt.height = 300;
  renderPlanetIllustration(planetArt, planet?.terrainType || planet?.id || "yading");
  ctx.drawImage(planetArt, pCx - 122, pCy - 122, 244, 244);

  // 皇家深金联名绶带
  const ribGrad = ctx.createLinearGradient(pCx - 190, 444, pCx + 190, 444);
  ribGrad.addColorStop(0, "#7c4f15");
  ribGrad.addColorStop(0.5, "#3b240b");
  ribGrad.addColorStop(1, "#7c4f15");
  ctx.fillStyle = ribGrad;
  ctx.beginPath();
  ctx.roundRect(pCx - 196, 434, 392, 44, 22);
  ctx.fill();
  ctx.strokeStyle = "#eab308";
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.fillStyle = "#fef3c7";
  ctx.font = "600 20px 'LXGW WenKai Screen', 'Kaiti SC', serif";
  ctx.fillText(`🏅  ${hostName}  ×  ${visitorName}  ·  并肩完赛`, pCx, 463);

  // 3. 星球档案与授牌正文
  ctx.fillStyle = "#2e1d0d";
  ctx.font = "34px 'ZCOOL XiaoWei', 'Songti SC', serif";
  ctx.fillText(`《 ${planet?.name || "山海星球"} 》`, W / 2, 528);

  ctx.fillStyle = "#7c5829";
  ctx.font = "19px 'LXGW WenKai Screen', 'Kaiti SC', serif";
  const distStr = planet?.stats?.distance ? ` · 里程 ${planet.stats.distance}` : "";
  ctx.fillText(
    `${planet?.code || "STAR"} · 最高海拔 ${planet?.stats?.altitude || "—"}${distStr} · 同行 ${Math.max(steps, 128)} 步`,
    W / 2,
    562
  );

  const wps = planet?.waypoints || [];
  ctx.fillStyle = "#3a2612";
  ctx.font = "22px 'LXGW WenKai Screen', 'Kaiti SC', serif";
  ctx.fillText(
    `兹见证「${visitorName}」与星球主人「${hostName}」集齐全部 ${wps.length} 处山海印记，共赏星辰！`,
    W / 2,
    602
  );

  // 4. 三联山海实景拍立得纪念画廊（精选首/中/末三站实景照片 + 智能人像防截断裁切）
  const getWpPhoto = (w) => w?.photo || w?.photo2 || (Array.isArray(w?.photos) ? w.photos[0] : "");
  const photoWps = wps.filter((w) => getWpPhoto(w));
  const certPool = photoWps.length > 0 ? photoWps : wps;
  const picked =
    certPool.length <= 3
      ? certPool
      : [certPool[0], certPool[Math.floor(certPool.length / 2)], certPool[certPool.length - 1]];
  const loadedImgs = await Promise.all(picked.map((w) => loadCertPhoto(getWpPhoto(w))));
  const cardW = 222, cardH = 226, imgW = 198, imgH = 158;
  const angles = [-0.052, 0.014, 0.055];
  const countP = Math.max(1, picked.length);
  const spanX = countP === 1 ? 0 : countP === 2 ? 256 : 244;

  for (let i = 0; i < picked.length; i++) {
    const wp = picked[i];
    const pUrl = getWpPhoto(wp);
    const img = loadedImgs[i];
    const cx = W / 2 + (i - (countP - 1) / 2) * spanX;
    const cy = 752 + (i === 1 ? -8 : 4);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angles[i % 3]);
    ctx.shadowColor = "rgba(44, 30, 14, 0.24)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = "#fffdf8";
    ctx.beginPath();
    ctx.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 6);
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = "rgba(180, 146, 94, 0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();

    if (img && img.naturalWidth > 0) {
      const natW = img.naturalWidth, natH = img.naturalHeight;
      const crop = computeSmartPhotoCrop(pUrl, natW, natH, imgW / imgH);
      const pan = getSavedPhotoPan(pUrl);
      const xNorm = pan ? (pan[0] / 100) * (1 - crop.winW) : crop.x0;
      const yNorm = pan ? (pan[1] / 100) * (1 - crop.winH) : crop.y0;
      ctx.drawImage(
        img,
        xNorm * natW,
        yNorm * natH,
        crop.winW * natW,
        crop.winH * natH,
        -imgW / 2,
        -cardH / 2 + 12,
        imgW,
        imgH
      );
    } else {
      const fb = document.createElement("canvas");
      fb.width = 320;
      fb.height = 240;
      renderPostcardScene(fb, planet?.terrainType || planet?.id || "yading", wp?.sceneArt || wp?.artScene || "ridge");
      ctx.drawImage(fb, -imgW / 2, -cardH / 2 + 12, imgW, imgH);
    }
    // 顶部和纸胶带装饰
    ctx.fillStyle = "rgba(234, 179, 8, 0.34)";
    ctx.fillRect(-34, -cardH / 2 - 6, 68, 15);
    ctx.fillStyle = "#3f2b15";
    ctx.font = "15.5px 'LXGW WenKai Screen', 'Kaiti SC', serif";
    ctx.textAlign = "center";
    ctx.fillText(`✦ ${(wp.shortName || wp.name || "").slice(0, 10)}`, 0, cardH / 2 - 18);
    ctx.restore();
  }

  // 5. 全路标满贯打卡印记榜（自适应 4~8+ 个路标全展示）
  ctx.fillStyle = "rgba(201, 150, 59, 0.11)";
  ctx.strokeStyle = "rgba(197, 145, 52, 0.35)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(88, 902, W - 176, 212, 16);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#8a5d1c";
  ctx.font = "600 16px 'LXGW WenKai Screen', 'Kaiti SC', serif";
  ctx.fillText(`✦ 全 路 标 并 肩 满 贯 印 记 （ ${wps.length} / ${wps.length} 已 点 亮 ） ✦`, W / 2, 934);

  const cols = wps.length > 6 ? 4 : 3;
  const rows = Math.ceil(wps.length / cols);
  ctx.font = wps.length > 6 ? "17.5px 'LXGW WenKai Screen', 'Kaiti SC', serif" : "19px 'LXGW WenKai Screen', 'Kaiti SC', serif";
  ctx.fillStyle = "#422c14";
  wps.forEach((wp, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const cellW = (W - 216) / cols;
    const tx = 108 + cellW * (col + 0.5);
    const ty = (rows <= 2 ? 988 : 974) + row * (rows <= 2 ? 56 : 42);
    const label = (wp.shortName || wp.name || "").slice(0, cols === 4 ? 7 : 9);
    ctx.fillText(`✓ ${label}`, tx, ty);
  });

  // 6. 双人联名朱砂红火漆大印章 + 寄语 + 扫码回访邮票
  ctx.save();
  ctx.translate(196, 1246);
  ctx.rotate(-0.11);
  ctx.strokeStyle = "#be2623";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, 74, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 65, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#be2623";
  ctx.textAlign = "center";
  ctx.font = "bold 20px 'Songti SC', serif";
  ctx.fillText("山海并肩完赛", 0, -18);
  ctx.font = "bold 18px 'Songti SC', serif";
  ctx.fillText(`${hostName} × ${visitorName}`, 0, 10);
  ctx.font = "15px Georgia, serif";
  ctx.fillText(new Date().toISOString().slice(0, 10), 0, 36);
  ctx.restore();

  ctx.textAlign = "left";
  ctx.fillStyle = "#5c401e";
  ctx.font = "20px 'LXGW WenKai Screen', 'Kaiti SC', serif";
  ctx.fillText("“山路也许陡峭，但有人并肩同行的", 302, 1222);
  ctx.fillText("  每一步，都在宇宙里闪闪发光。”", 302, 1254);
  ctx.font = "16.5px 'LXGW WenKai Screen', 'Kaiti SC', serif";
  ctx.fillStyle = "#8c6d43";
  ctx.fillText("扫码回访这颗星球 · 开启下一段山海奇遇 →", 308, 1298);

  drawSiteQrStamp(ctx, W - 216, H - 246, 122, "parchment", pOwner);
  return c.toDataURL("image/png");
}


