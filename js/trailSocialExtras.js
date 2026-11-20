import * as THREE from "three";
import { getSurfaceRadius } from "./planetBuilder3D.js?v=4.0.0-r1";
import { drawSiteQrStamp } from "./qrStamp.js?v=4.0.0-r1";

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

// ==================== 3. 🏅 《双人并肩完赛荣誉证》高清联名典藏证书生成器 ====================
export function generateDuoFinisherCertDataUrl(planet, hostName = "星主", visitorName = "同行旅人", steps = 0) {
  const W = 900, H = 1260;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  const pOwner = planet?.owner === "kitty" || planet?.owner === "miemie" ? planet.owner : "mine";

  // 深空烫金底框 + 羊皮纸内芯
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0b142e");
  bg.addColorStop(1, "#132046");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#fbf4e4";
  ctx.beginPath();
  ctx.roundRect(46, 46, W - 92, H - 92, 24);
  ctx.fill();

  ctx.strokeStyle = "#c9963b";
  ctx.lineWidth = 3.5;
  ctx.strokeRect(64, 64, W - 128, H - 128);
  ctx.strokeStyle = "rgba(201, 150, 59, 0.45)";
  ctx.lineWidth = 1.2;
  ctx.strokeRect(74, 74, W - 148, H - 148);

  // 顶部抬头与星轨圆徽
  ctx.textAlign = "center";
  ctx.fillStyle = "#9a6b21";
  ctx.font = "600 18px 'Cormorant Garamond', Georgia, serif";
  ctx.fillText("✦ CO-OP TRAIL FINISHER CERTIFICATE ✦", W / 2, 128);

  ctx.fillStyle = "#2c1e0f";
  ctx.font = "44px 'ZCOOL XiaoWei', 'Songti SC', serif";
  ctx.fillText("双 人 并 肩 完 赛 荣 誉 证", W / 2, 188);

  const halo = planet?.palette?.halo || "#f59e0b";
  const core = planet?.palette?.ground || "#3b82f6";
  const rg = ctx.createRadialGradient(W / 2, 315, 16, W / 2, 315, 96);
  rg.addColorStop(0, core);
  rg.addColorStop(0.68, halo);
  rg.addColorStop(1, "rgba(251,244,228,0)");
  ctx.fillStyle = rg;
  ctx.beginPath();
  ctx.arc(W / 2, 315, 96, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#b7791f";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(W / 2, 315, 118, 38, -0.24, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 34px Georgia, serif";
  ctx.fillText("🏅", W / 2, 326);

  // 授牌正文
  ctx.fillStyle = "#3b2712";
  ctx.font = "34px 'ZCOOL XiaoWei', 'Songti SC', serif";
  ctx.fillText(`《 ${planet?.name || "山海星球"} 》`, W / 2, 462);

  ctx.fillStyle = "#7c5829";
  ctx.font = "22px 'LXGW WenKai Screen', 'Kaiti SC', serif";
  ctx.fillText(`${planet?.code || "STAR"} · 最高海拔 ${planet?.stats?.altitude || ""} · 同行 ${Math.max(steps, 88)} 步`, W / 2, 504);

  ctx.fillStyle = "#2d1f10";
  ctx.font = "25px 'LXGW WenKai Screen', 'Kaiti SC', serif";
  ctx.fillText(`兹证明  ${visitorName}  与星球主人  ${hostName}`, W / 2, 578);
  ctx.fillText(`并肩走完本星球全部 ${(planet?.waypoints || []).length} 处山海路标，共赏星辰！`, W / 2, 618);

  // 路标全满贯打勾印记框
  ctx.fillStyle = "rgba(201, 150, 59, 0.11)";
  ctx.beginPath();
  ctx.roundRect(110, 658, W - 220, 236, 16);
  ctx.fill();

  const wps = planet?.waypoints || [];
  ctx.font = "21px 'LXGW WenKai Screen', 'Kaiti SC', serif";
  ctx.fillStyle = "#4a3319";
  wps.slice(0, 6).forEach((wp, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const tx = col === 0 ? W * 0.31 : W * 0.69;
    const ty = 712 + row * 62;
    ctx.fillText(`✦ ${wp.shortName || wp.name}`, tx, ty);
  });

  // 双人联名朱砂红火漆大印章
  ctx.save();
  ctx.translate(230, 1045);
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
  ctx.font = "bold 20px 'Songti SC', serif";
  ctx.fillText("山海并肩完赛", 0, -18);
  ctx.font = "bold 19px 'Songti SC', serif";
  ctx.fillText(`${hostName} × ${visitorName}`, 0, 10);
  ctx.font = "15px Georgia, serif";
  ctx.fillText(new Date().toISOString().slice(0, 10), 0, 36);
  ctx.restore();

  ctx.textAlign = "left";
  ctx.fillStyle = "#6b4f2a";
  ctx.font = "20px 'LXGW WenKai Screen', 'Kaiti SC', serif";
  ctx.fillText("“山路也许陡峭，但有人并肩同行的每一步都闪闪发光。”", 340, 1025);
  ctx.font = "17px 'LXGW WenKai Screen', 'Kaiti SC', serif";
  ctx.fillStyle = "#8c6d43";
  ctx.fillText("扫码回访这颗星球 · 开启下一段山海奇遇 →", 340, 1068);

  drawSiteQrStamp(ctx, W - 208, H - 216, 118, "parchment", pOwner);
  return c.toDataURL("image/png");
}


