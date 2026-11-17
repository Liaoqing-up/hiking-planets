import * as THREE from "three";
import { PLANETS } from "./data.js";
import { sound } from "./audio.js";
import { renderPlanetIllustration, renderPostcardScene } from "./planetArt2D.js";
import {
  PLANET_RADIUS,
  latLonToUnitVec,
  getSurfaceRadius,
  buildPlanetWorld,
  buildHikerCharacter,
} from "./planetBuilder3D.js";
import { buildPlanetCreature, CREATURE_CATALOG } from "./creatures3D.js";
import { createSkyWonders } from "./skyWonders3D.js";
import { buildManiCairn3D, loadManiNotes, addManiNote } from "./maniCairn.js";
import { generateSummitTicketDataUrl, PLANET_SEAL_TITLE } from "./summitTicket.js";
import { buildCampfireRig } from "./campfireRadio.js";
import { createFootprintTrail } from "./footprints3D.js";
import {
  renderCreaturePortrait,
  capturePhotoWallpaper,
  generateGrandPassportDataUrl,
  generatePostcardBookmarkDataUrl,
} from "./bestiaryAndExtras.js";

const SAVE_KEY = "hiking_planets_save_v1";

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return { discovered: {}, steps: 0 };
}

const saveData = loadSave();
if (!Array.isArray(saveData.creatures)) saveData.creatures = [];
function persistSave() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
  } catch (_) {}
}

function getDiscoveredSet(planetId) {
  return new Set(saveData.discovered[planetId] || []);
}

// ==================== THREE.JS SCENE SETUP ====================
const container = document.getElementById("webgl-container");
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color("#0a1228");

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 400);
camera.position.set(0, 1.5, 30);

// 灯光系统（晨曦天光 / 星夜极光无缝切换）
const hemiLight = new THREE.HemisphereLight("#d8e6ff", "#2e3b59", 1.15);
scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight("#fff1d0", 1.85);
sunLight.position.set(24, 30, 22);
scene.add(sunLight);

const rimLight = new THREE.DirectionalLight("#7aa8ff", 0.75);
rimLight.position.set(-22, -16, -20);
scene.add(rimLight);

// 双层闪烁璀璨柔光星空穹顶
const starTexCanvas = document.createElement("canvas");
starTexCanvas.width = 32;
starTexCanvas.height = 32;
const sctx = starTexCanvas.getContext("2d");
const sgrad = sctx.createRadialGradient(16, 16, 0.5, 16, 16, 15);
sgrad.addColorStop(0, "rgba(255,255,255,1)");
sgrad.addColorStop(0.35, "rgba(255,255,255,0.7)");
sgrad.addColorStop(1, "rgba(255,255,255,0)");
sctx.fillStyle = sgrad;
sctx.fillRect(0, 0, 32, 32);
const starSoftTex = new THREE.CanvasTexture(starTexCanvas);

function createStarLayer(count, size, colorHex) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const d = new THREE.Vector3(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1
    ).normalize();
    const r = 95 + Math.random() * 85;
    pos[i * 3] = d.x * r;
    pos[i * 3 + 1] = d.y * r;
    pos[i * 3 + 2] = d.z * r;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      color: colorHex,
      map: starSoftTex,
      size: size * 2.1,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
}

const starsGold = createStarLayer(900, 0.65, "#ffe6a8");
const starsBlue = createStarLayer(1200, 0.45, "#b8d6ff");
scene.add(starsGold, starsBlue);

// ==================== GAME STATE ====================
let mode = "title"; // "title" | "map" | "planet"
let selectedPlanetIdx = 0;
let activePlanet = null;
let currentWorld = null;
let skyPhase = "day"; // "day" (晨曦) | "dusk" (暮霞) | "night" (星夜)
let isNight = false;
let isPhotoMode = false;
let journalOpen = false;
let journalPage = 1;
let currentJournalWp = null;
let currentJournalPlanet = null;
let atlasModalOpen = false;
let atlasFilterPlanetId = "all";
let warpActive = false;
let warpTimer = 0;
let photoLoadSeq = 0;
const preloadedImages = new Map();

function preloadUrl(url) {
  if (!url || preloadedImages.has(url)) return preloadedImages.get(url);
  const img = new Image();
  img.decoding = "async";
  img.src = url;
  preloadedImages.set(url, img);
  return img;
}

function prefetchPlanetPhotos(planet) {
  if (!planet?.waypoints) return;
  for (const w of planet.waypoints) {
    if (w.photo) preloadUrl(w.photo);
    if (w.photo2) preloadUrl(w.photo2);
  }
}

const hiker = buildHikerCharacter();
scene.add(hiker.root);

// 球面行走运动学状态（无万向节死锁四元数切向系统）
const playerUp = new THREE.Vector3(0, 1, 0);
const playerForward = new THREE.Vector3(0, 0, 1);
const smoothCamUp = new THREE.Vector3(0, 1, 0);
const smoothCamPos = new THREE.Vector3(0, 18, 28);
const smoothLookAt = new THREE.Vector3(0, 12, 0);

let camYaw = 0;
let camPitch = 0.56;
let camDist = 11.2;
let introZoomProgress = 1;
let walkTargetDir = null;
let activeWaypointNear = null;
let stepAccum = 0;
let currentSpeedFactor = 1.0;
let activeSceneZone = null;
let activeCreature = null;
let activeSkyWonders = null;
let activeManiCairn = null;
let activeFootprints = null;
let activeManiNear = false;
let maniModalOpen = false;
let ticketModalOpen = false;
let bestiaryModalOpen = false;
let finaleModalOpen = false;
let isCampfireMode = false;
let isTelescopeMode = false;
let idleSeconds = 0;
let wonderToastTimer = null;

const campfireRig = buildCampfireRig();
scene.add(campfireRig.group);

function showWonderToast(msg, durationMs = 4200) {
  const el = document.getElementById("wonder-toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
  if (wonderToastTimer) clearTimeout(wonderToastTimer);
  wonderToastTimer = setTimeout(() => el.classList.add("hidden"), durationMs);
}

// 点击地面目标光圈 & 路标引路金色光弧
const clickRing = new THREE.Mesh(
  new THREE.RingGeometry(0.18, 0.28, 24),
  new THREE.MeshBasicMaterial({
    color: "#ffe28a",
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
  })
);
clickRing.visible = false;
scene.add(clickRing);

let guideArcLine = null;
let guideArcTimer = 0;

function clearGuideArc() {
  if (guideArcLine) {
    scene.remove(guideArcLine);
    guideArcLine.geometry.dispose();
    guideArcLine.material.dispose();
    guideArcLine = null;
  }
  document.querySelectorAll(".wp-pill").forEach((el) => el.classList.remove("guiding"));
}

function showGuideArcToDir(targetUnitDir, colorHex = "#ffe594", pillEl = null) {
  clearGuideArc();
  if (!activePlanet || !targetUnitDir) return;
  const pts = [];
  const segs = 38;
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const d = new THREE.Vector3().lerpVectors(playerUp, targetUnitDir, t).normalize();
    const arch = Math.sin(t * Math.PI) * 1.45;
    const r = getSurfaceRadius(activePlanet.id, d) + 0.28 + arch;
    pts.push(d.multiplyScalar(r));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.94,
  });
  guideArcLine = new THREE.Line(geo, mat);
  scene.add(guideArcLine);
  guideArcTimer = 6.5;
  if (pillEl) pillEl.classList.add("guiding");
}

function showGuideArcTo(wpObj, pillEl) {
  if (!wpObj) return;
  showGuideArcToDir(wpObj.unitDir, "#ffe594", pillEl);
}

function triggerHaptic(ms = 14) {
  try {
    if (navigator.vibrate) navigator.vibrate(ms);
  } catch {
    /* ignore */
  }
}

function isAnyModalOpen() {
  return (
    journalOpen ||
    maniModalOpen ||
    ticketModalOpen ||
    bestiaryModalOpen ||
    finaleModalOpen ||
    atlasModalOpen
  );
}

function disposeCurrentWorld() {
  clearGuideArc();
  clickRing.visible = false;
  campfireRig.hide();
  isCampfireMode = false;
  isTelescopeMode = false;
  activeSceneZone = null;
  sound.setSceneZone?.(null);
  activeCreature = null;
  activeSkyWonders = null;
  activeManiCairn = null;
  activeFootprints = null;
  document.getElementById("campfire-mixer")?.classList.add("hidden");
  document.getElementById("btn-campfire-mode")?.classList.remove("active");
  document.getElementById("btn-telescope-mode")?.classList.remove("active");
  hiker?.setSitting?.(false);
  // 销毁旧星球前先将主角小人摘回根场景，防止其材质/几何体被一并释放
  if (hiker?.root && hiker.root.parent !== scene) {
    scene.add(hiker.root);
  }
  if (!currentWorld) return;
  scene.remove(currentWorld.group);
  currentWorld.group.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((m) => {
        if (m.map && m.map.isCanvasTexture) m.map.dispose();
        m.dispose();
      });
    }
  });
  currentWorld = null;
}

function orientHikerOnSphere(parentGroup, upVec, fwdVec, planetId) {
  fwdVec.sub(upVec.clone().multiplyScalar(fwdVec.dot(upVec))).normalize();
  if (fwdVec.lengthSq() < 0.001) {
    fwdVec.set(1, 0, 0).sub(upVec.clone().multiplyScalar(upVec.x)).normalize();
  }
  const right = new THREE.Vector3().crossVectors(upVec, fwdVec).normalize();
  fwdVec.crossVectors(right, upVec).normalize();

  const basis = new THREE.Matrix4().makeBasis(right, upVec, fwdVec);
  hiker.root.quaternion.setFromRotationMatrix(basis);

  const r = getSurfaceRadius(planetId, upVec);
  hiker.root.position.copy(upVec).multiplyScalar(r);
  if (hiker.root.parent !== parentGroup) {
    parentGroup.add(hiker.root);
  }
}

// ==================== SCREEN SWITCHING ====================
const elScreenTitle = document.getElementById("screen-title");
const elScreenMap = document.getElementById("screen-map");
const elScreenHud = document.getElementById("screen-hud");

let hasHistoryGuard = false;
function ensureHistoryGuard() {
  if (hasHistoryGuard) return;
  try {
    history.pushState({ hpGuard: true }, "");
    hasHistoryGuard = true;
  } catch {
    /* ignore */
  }
}

function setScreen(nextMode) {
  mode = nextMode;
  elScreenTitle.classList.toggle("active", mode === "title");
  elScreenMap.classList.toggle("active", mode === "map");
  elScreenHud.classList.toggle("active", mode === "planet");
  if (mode !== "planet" && isPhotoMode) togglePhotoMode(false);
  if (mode !== "title") ensureHistoryGuard();
}

function updateTitleLayout() {
  if (!currentWorld || mode !== "title") return;
  const isMobile = window.innerWidth <= 820;
  if (isMobile) {
    currentWorld.group.position.x = 0;
    currentWorld.group.userData.baseY = -10.6;
    camera.position.set(0, 2.2, 39);
    camera.lookAt(0, -2.5, 0);
  } else {
    currentWorld.group.position.x = 9.8;
    currentWorld.group.userData.baseY = -1.6;
    camera.position.set(0, 1.8, 37);
    camera.lookAt(3.2, 0.2, 0);
  }
}

function setupTitleScene() {
  disposeCurrentWorld();
  activePlanet = null;
  skyPhase = "day";
  isNight = false;
  hiker.setOutfit("tengger");
  hiker.setHeadlamp(false);
  sound.setPlanetBGM("space");

  currentWorld = buildPlanetWorld({
    id: "title",
    name: "起点星",
    palette: {
      halo: "#f2c866",
      low: "#4a8756",
      mid: "#78b566",
      high: "#f6f9ff",
      particle: "#ffe5a3",
    },
    waypoints: [],
  });
  currentWorld.group.userData.baseY = -1.2;
  currentWorld.group.position.set(6.2, -1.2, 0);
  currentWorld.group.visible = true;
  hiker.root.visible = true;
  scene.add(currentWorld.group);

  const standDir = latLonToUnitVec(84, -15);
  const standFwd = new THREE.Vector3(-0.35, 0, 0.9).normalize();
  orientHikerOnSphere(currentWorld.group, standDir, standFwd, "title");

  scene.background.set("#0a1228");
  camera.up.set(0, 1, 0);
  setScreen("title");
  updateTitleLayout();
}

// ==================== PARCHMENT MAP SCROLL ====================
const elPlanetGrid = document.getElementById("scroll-planet-grid");
const elMapChapter = document.getElementById("map-chapter");
const elMapTitle = document.getElementById("map-title");
const elMapStats = document.getElementById("map-stats");
const elMapQuote = document.getElementById("map-quote");

const planetNodeEls = [];

function initScrollMapUI() {
  elPlanetGrid.innerHTML = "";
  PLANETS.forEach((p, idx) => {
    const node = document.createElement("div");
    node.className = "planet-node";
    node.setAttribute("role", "option");
    node.innerHTML = `
      <div class="planet-visual">
        <div class="planet-ring"></div>
        <canvas class="planet-thumb"></canvas>
        <span class="planet-stamp">0/4</span>
      </div>
      <div class="planet-node-label">${p.name}</div>
    `;
    const canvas = node.querySelector("canvas");
    renderPlanetIllustration(canvas, p.id);

    node.addEventListener("click", () => {
      if (selectedPlanetIdx === idx) {
        enterPlanet(idx);
      } else {
        selectMapPlanet(idx);
        sound.playHover();
      }
    });
    node.addEventListener("dblclick", () => enterPlanet(idx));

    elPlanetGrid.appendChild(node);
    planetNodeEls.push(node);
  });
  refreshScrollMapBadges();
  selectMapPlanet(0);
}

function refreshScrollMapBadges() {
  PLANETS.forEach((p, idx) => {
    const disc = getDiscoveredSet(p.id);
    const done = disc.size >= p.waypoints.length;
    const node = planetNodeEls[idx];
    if (!node) return;
    node.classList.toggle("completed", done);
    const stamp = node.querySelector(".planet-stamp");
    const sealWord = PLANET_SEAL_TITLE[p.id] || "穿越成功";
    if (stamp) stamp.textContent = done ? `✦ ${sealWord}` : `${disc.size}/${p.waypoints.length}`;
  });

  // 更新全星系总印记进度、生灵图集计数与 24/24 终章手札解锁状态
  const totalWp = PLANETS.reduce((s, p) => s + p.waypoints.length, 0);
  const doneWp = PLANETS.reduce((s, p) => s + getDiscoveredSet(p.id).size, 0);
  const creatureCount = (saveData.creatures || []).length;
  const totalEl = document.getElementById("scroll-total-progress");
  if (totalEl) totalEl.textContent = `✦ 星系印记 ${doneWp} / ${totalWp}`;
  const mapBestiaryBtn = document.getElementById("btn-map-bestiary");
  if (mapBestiaryBtn) mapBestiaryBtn.textContent = `🐾 生灵图集 ${creatureCount} / ${PLANETS.length}`;
  const hudBestiaryBtn = document.getElementById("btn-hud-bestiary");
  if (hudBestiaryBtn) {
    hudBestiaryBtn.textContent =
      creatureCount >= PLANETS.length ? "🐾 生灵 ✦" : `🐾 生灵 ${creatureCount}/${PLANETS.length}`;
  }
  const finaleBtn = document.getElementById("btn-grand-finale");
  if (finaleBtn) finaleBtn.classList.toggle("hidden", doneWp < totalWp);
}

function selectMapPlanet(idx) {
  selectedPlanetIdx = (idx + PLANETS.length) % PLANETS.length;
  const p = PLANETS[selectedPlanetIdx];
  const disc = getDiscoveredSet(p.id);

  planetNodeEls.forEach((el, i) => {
    el.classList.toggle("selected", i === selectedPlanetIdx);
  });
  const tbcBtn = document.getElementById("btn-tbc-planet");
  if (tbcBtn) tbcBtn.classList.remove("selected");
  const enterBtn = document.getElementById("btn-enter-planet");
  if (enterBtn) {
    enterBtn.disabled = false;
    enterBtn.style.opacity = "1";
    enterBtn.textContent = "✦ 前去徒步";
  }

  const distLabel = /\d/.test(p.stats.distance) ? `全程 ${p.stats.distance}` : p.stats.distance;
  elMapChapter.textContent = `${p.chapter} · ${p.region}`;
  elMapTitle.textContent = `${p.name} · ${p.code}`;
  elMapStats.innerHTML = `
    <span class="stat-pill">${distLabel}</span>
    <span class="stat-pill">最高海拔 ${p.stats.altitude}</span>
    <span class="stat-pill">行程 ${p.stats.days}</span>
    <span class="stat-pill">足迹印记 ${disc.size} / ${p.waypoints.length}</span>
  `;
  elMapQuote.textContent = `“${p.quote}”`;
  // 在星图浏览时即提前预加载选中星球照片
  prefetchPlanetPhotos(p);
}

// 轻量无侵入统计上报（即使被广告拦截器屏蔽也绝不报错）
function trackEvent(eventName, eventData) {
  try {
    if (window.umami && typeof window.umami.track === "function") {
      window.umami.track(eventName, eventData);
    }
  } catch {
    /* ignore */
  }
}

function openStarMap() {
  if (currentWorld) currentWorld.group.visible = false;
  hiker.root.visible = false;
  scene.background.set("#0a1228");
  refreshScrollMapBadges();
  selectMapPlanet(selectedPlanetIdx);
  sound.setPlanetBGM("space");
  setScreen("map");
  trackEvent("展开星图");
}

// ==================== ENTER 3D PLANET ====================
const elHudName = document.getElementById("hud-planet-name");
const elHudAlt = document.getElementById("hud-altitude");
const elHudSteps = document.getElementById("hud-steps");
const elHudWaypoints = document.getElementById("hud-waypoints");
const elPromptInteract = document.getElementById("prompt-interact");
const elPromptText = document.getElementById("prompt-interact-text");

function enterPlanet(idx) {
  selectedPlanetIdx = idx;
  const p = PLANETS[idx];
  activePlanet = p;
  disposeCurrentWorld();
  hiker.setOutfit(p.id);

  const discSet = getDiscoveredSet(p.id);
  currentWorld = buildPlanetWorld(p, discSet);
  currentWorld.group.position.set(0, 0, 0);
  currentWorld.group.visible = true;
  hiker.root.visible = true;
  scene.add(currentWorld.group);

  // 挂载 V3.3 星球奇遇实体：山野小生灵(支持结伴跟随与围炉打盹) · 动态脚印 · 远空邻近星系与天气奇遇 · 垭口玛尼堆
  const alreadyBonded = (saveData.creatures || []).includes(p.id);
  activeCreature = buildPlanetCreature(p, alreadyBonded);
  currentWorld.group.add(activeCreature.group);

  activeFootprints = createFootprintTrail(p);
  currentWorld.group.add(activeFootprints.group);

  activeSkyWonders = createSkyWonders(p, PLANETS);
  activeSkyWonders.refreshOrbLabels((pid) => getDiscoveredSet(pid).size);
  currentWorld.group.add(activeSkyWonders.group);
  isTelescopeMode = false;
  document.getElementById("btn-telescope-mode")?.classList.remove("active");
  renderer.domElement.style.cursor = "";

  activeManiCairn = buildManiCairn3D(p);
  currentWorld.group.add(activeManiCairn.group);
  idleSeconds = 0;
  refreshTicketButtons();
  refreshScrollMapBadges();

  // 初始落点靠近第一个路标附近，方便快速开启徒步
  const startWp = p.waypoints[0];
  playerUp.copy(latLonToUnitVec(startWp.lat - 12, startWp.lon - 14));
  playerForward.set(0, 1, 0).sub(playerUp.clone().multiplyScalar(playerUp.y)).normalize();
  orientHikerOnSphere(scene, playerUp, playerForward, p.id);

  camYaw = 0;
  camPitch = 0.56;
  camDist = 11.0;
  introZoomProgress = 0;
  walkTargetDir = null;
  journalOpen = false;
  document.getElementById("modal-journal").classList.add("hidden");

  smoothCamUp.copy(playerUp);
  smoothCamPos.copy(playerUp).multiplyScalar(38);
  smoothLookAt.copy(hiker.root.position);

  elHudName.textContent = `${p.name}`;
  elHudSteps.textContent = `${saveData.steps || 0} 步`;
  const elBgm = document.getElementById("hud-bgm");
  if (elBgm) elBgm.textContent = `♪ ${p.bgmName || p.name}`;
  renderHudWaypoints();
  applyLightingTheme(true);

  sound.init();
  sound.playSelectPlanet();
  sound.setPlanetBGM(p.id);
  prefetchPlanetPhotos(p);
  setScreen("planet");
  trackEvent(`登陆 · ${p.name}`, { planet: p.name, planetId: p.id });

  // 仅在新访客首次登陆第一颗星球时浮现 4.5s 温柔指引，随后永久不再打扰
  if (!saveData.onboardedPlanet) {
    saveData.onboardedPlanet = true;
    persistSave();
    setTimeout(() => {
      if (mode !== "planet" || isAnyModalOpen()) return;
      const mobileGuide = window.innerWidth <= 820;
      showWonderToast(
        mobileGuide
          ? "✦ 轻推左下星芒或点击草坡漫步 · 点上方地名可唤出星光引路"
          : "✦ 按 WASD 或点击草坡漫步 · 点右上地名可唤出星光引路",
        4600
      );
    }, 1100);
  }
}

function renderHudWaypoints() {
  if (!activePlanet || !currentWorld) return;
  const disc = getDiscoveredSet(activePlanet.id);
  elHudWaypoints.innerHTML = "";
  currentWorld.waypointObjs.forEach((wpObj) => {
    const isDone = disc.has(wpObj.data.id);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `wp-pill ${isDone ? "discovered" : ""}`;
    const label = wpObj.data.shortName || wpObj.data.name;
    btn.textContent = `${isDone ? "✦" : "◇"} ${label}`;
    btn.title = `${wpObj.data.name}（点击亮起星光引路弧线）`;
    btn.addEventListener("click", () => {
      showGuideArcTo(wpObj, btn);
      sound.playHover();
    });
    elHudWaypoints.appendChild(btn);
  });
}

// ==================== LIGHTING (晨曦 → 暮霞 → 星夜 三态流转) & SHORTCUTS ====================
function cycleSkyPhase() {
  skyPhase = skyPhase === "day" ? "dusk" : skyPhase === "dusk" ? "night" : "day";
  isNight = skyPhase === "night";
  applyLightingTheme(false);
  const labelMap = {
    day: "☀ 已切换至「清朗晨曦」光影",
    dusk: "🌇 已切换至「紫金暮霞 · 蓝调时刻」光影",
    night: "☾ 已切换至「极光星夜」光影 · 头灯已点亮",
  };
  showWonderToast(labelMap[skyPhase], 2600);
}

function applyLightingTheme(immediate = false) {
  const pal = activePlanet ? activePlanet.palette : { skyDay: "#0a1228", skyNight: "#060918" };
  let bgHex = pal.skyDay;
  if (skyPhase === "night") bgHex = pal.skyNight;
  else if (skyPhase === "dusk") bgHex = "#24193c";

  const targetBg = new THREE.Color(bgHex);
  if (immediate) scene.background.copy(targetBg);
  else scene.background.lerp(targetBg, 0.08);

  if (skyPhase === "day") {
    hemiLight.color.set("#d8e6ff");
    hemiLight.groundColor.set("#2e3b59");
    hemiLight.intensity = 1.18;
    sunLight.intensity = 1.85;
    sunLight.color.set("#fff1d0");
  } else if (skyPhase === "dusk") {
    hemiLight.color.set("#c79ef7");
    hemiLight.groundColor.set("#3d253b");
    hemiLight.intensity = 0.88;
    sunLight.intensity = 1.62;
    sunLight.color.set("#ff8c42");
  } else {
    hemiLight.color.set("#9db8ff");
    hemiLight.groundColor.set("#1b2540");
    hemiLight.intensity = 0.42;
    sunLight.intensity = 0.52;
    sunLight.color.set("#8fb8ff");
  }
  hiker.setHeadlamp(skyPhase === "night" && mode === "planet");

  const nightBtn = document.getElementById("btn-toggle-night");
  if (nightBtn) {
    const btnText =
      skyPhase === "day"
        ? `🌇 暮霞 <kbd>L</kbd>`
        : skyPhase === "dusk"
          ? `☾ 星夜 <kbd>L</kbd>`
          : `☀ 晨曦 <kbd>L</kbd>`;
    nightBtn.innerHTML = btnText;
  }
}

function togglePhotoMode(force) {
  isPhotoMode = typeof force === "boolean" ? force : !isPhotoMode;
  document.body.classList.toggle("photo-mode", isPhotoMode);
  document.getElementById("photo-mode-bar")?.classList.toggle("hidden", !isPhotoMode);
}

// 记录当前票根预览窗的渲染源，以便填写专属署名后即时重新烫金绘制
let currentTicketContext = null;

function getTravelerName() {
  const input = document.getElementById("ticket-traveler-input");
  if (input && input.value.trim()) {
    saveData.travelerName = input.value.trim().slice(0, 12);
    persistSave();
  }
  if (input && !input.value && saveData.travelerName) {
    input.value = saveData.travelerName;
  }
  return saveData.travelerName || "";
}

async function refreshTicketPreviewImage() {
  if (!currentTicketContext) return;
  const traveler = getTravelerName();
  let dataUrl = "";
  let fileName = "行者的星球-纪念印记.png";
  let modalTitle = "山海纪念票根";
  let modalSub = "将走过的山海与星辰装进专属典藏卡片";
  if (currentTicketContext.type === "summit" && activePlanet) {
    const discSet = getDiscoveredSet(activePlanet.id);
    dataUrl = await generateSummitTicketDataUrl(activePlanet, discSet, saveData.steps || 0, traveler);
    fileName = `行者的星球-${activePlanet.name}-登顶纪念票根.png`;
    modalTitle = `${activePlanet.name} · 纪念票根`;
    modalSub = `已点亮 ${discSet.size} / ${activePlanet.waypoints.length} 处山海印记 · 支持烫金印签`;
  } else if (currentTicketContext.type === "passport") {
    dataUrl = generateGrandPassportDataUrl(PLANETS, saveData, traveler);
    fileName = "行者的星球-全星系大满贯荣誉护照.png";
    modalTitle = "全星系大满贯荣誉护照";
    modalSub = "24 / 24 处山海印记全境穿越达成典藏";
  } else if (currentTicketContext.type === "wallpaper" && currentTicketContext.snapCanvas) {
    dataUrl = capturePhotoWallpaper(
      currentTicketContext.snapCanvas,
      currentTicketContext.planetName,
      currentTicketContext.altText,
      traveler
    );
    fileName = `行者的星球-${currentTicketContext.planetName}-留影壁纸.png`;
    modalTitle = `${currentTicketContext.planetName} · 留影壁纸`;
    modalSub = "拍立得星海锁屏纪念壁纸 · 可印上旅人署名";
  } else if (currentTicketContext.type === "bookmark" && currentTicketContext.planet && currentTicketContext.wp) {
    dataUrl = await generatePostcardBookmarkDataUrl(
      currentTicketContext.planet,
      currentTicketContext.wp,
      traveler
    );
    fileName = `行者的星球-${currentTicketContext.wp.shortName || currentTicketContext.wp.name}-故事书签.png`;
    modalTitle = `${currentTicketContext.wp.shortName || currentTicketContext.wp.name} · 故事书签`;
    modalSub = `${currentTicketContext.planet.name} · 双面诗笺与旅途故事典藏`;
  }
  const titleEl = document.getElementById("ticket-modal-title");
  const subEl = document.getElementById("ticket-modal-sub");
  if (titleEl) titleEl.textContent = modalTitle;
  if (subEl) subEl.textContent = modalSub;
  const img = document.getElementById("ticket-preview-img");
  const dl = document.getElementById("btn-download-ticket");
  if (img && dataUrl) img.src = dataUrl;
  if (dl && dataUrl) {
    dl.href = dataUrl;
    dl.download = fileName;
  }
}

function snapPhotoWallpaper() {
  if (!activePlanet) return;
  sound.init();
  sound.playSelectPlanet();
  renderer.render(scene, camera);
  // 拷贝当前 WebGL 帧到离屏画布，方便随后随时修改署名重印
  const snapCanvas = document.createElement("canvas");
  snapCanvas.width = renderer.domElement.width;
  snapCanvas.height = renderer.domElement.height;
  snapCanvas.getContext("2d").drawImage(renderer.domElement, 0, 0);
  const altText = document.getElementById("hud-altitude")?.textContent || activePlanet.stats.altitude;
  currentTicketContext = {
    type: "wallpaper",
    snapCanvas,
    planetName: activePlanet.name,
    altText,
  };
  togglePhotoMode(false);
  refreshTicketPreviewImage();
  ticketModalOpen = true;
  document.getElementById("modal-ticket")?.classList.remove("hidden");
  trackEvent(`咔嚓留影壁纸 · ${activePlanet.name}`, { planet: activePlanet.name });
}

function guideToPlanetCreature(targetPlanetId) {
  closeBestiaryModal();
  const pIdx = PLANETS.findIndex((p) => p.id === targetPlanetId);
  if (pIdx < 0) return;
  if (mode !== "planet" || activePlanet?.id !== targetPlanetId) {
    enterPlanet(pIdx);
  }
  if (activeCreature) {
    showGuideArcToDir(activeCreature.getUnitDir(), "#ffb4c8");
    showWonderToast("🐾 星尘寻踪已点亮 · 顺着粉金色光弧去偶遇它吧！");
  }
}

function openBestiaryModal() {
  const grid = document.getElementById("bestiary-grid");
  if (!grid) return;
  const metSet = new Set(saveData.creatures || []);
  grid.innerHTML = "";
  CREATURE_CATALOG.forEach((item) => {
    const unlocked = metSet.has(item.planetId);
    const card = document.createElement("div");
    card.className = `bestiary-card ${unlocked ? "unlocked" : "locked"}`;
    const c = document.createElement("canvas");
    renderCreaturePortrait(c, item.planetId, unlocked);
    const title = document.createElement("div");
    title.className = "bestiary-name";
    title.textContent = unlocked ? `${item.emoji} ${item.name}` : "🔒 未知山野小生灵";
    const sub = document.createElement("div");
    sub.className = "bestiary-planet";
    sub.textContent = unlocked ? `✦ 已结伴 · ${item.planetName}` : `栖息线索：${item.planetName}`;
    const bio = document.createElement("div");
    bio.className = "bestiary-note";
    bio.textContent = unlocked ? item.note : "前往该星球漫步走近它，即可建立羁绊同行";
    const guideBtn = document.createElement("button");
    guideBtn.type = "button";
    guideBtn.className = "bestiary-guide-btn";
    guideBtn.textContent =
      activePlanet?.id === item.planetId ? "✦ 星尘寻踪引路" : `✦ 前往${item.planetName}寻它`;
    guideBtn.addEventListener("click", () => guideToPlanetCreature(item.planetId));
    card.append(c, title, sub, bio, guideBtn);
    grid.appendChild(card);
  });
  bestiaryModalOpen = true;
  document.getElementById("modal-bestiary")?.classList.remove("hidden");
  sound.init();
  sound.playHover();
  trackEvent("打开小生灵图集", { unlocked: metSet.size });
}

function closeBestiaryModal() {
  bestiaryModalOpen = false;
  document.getElementById("modal-bestiary")?.classList.add("hidden");
}

async function saveCurrentPostcardBookmark() {
  const p = currentJournalPlanet || activePlanet;
  const wp = currentJournalWp;
  if (!p || !wp) return;
  closeJournal();
  sound.init();
  sound.playSelectPlanet();
  triggerHaptic(14);
  currentTicketContext = { type: "bookmark", planet: p, wp };
  await refreshTicketPreviewImage();
  ticketModalOpen = true;
  document.getElementById("modal-ticket")?.classList.remove("hidden");
  trackEvent(`珍藏双面书签 · ${wp.shortName || wp.name}`, { planet: p.name });
}

function renderAtlasGridUI() {
  const tabsEl = document.getElementById("atlas-tabs");
  const gridEl = document.getElementById("atlas-grid");
  if (!tabsEl || !gridEl) return;

  const totalWp = PLANETS.reduce((s, p) => s + p.waypoints.length, 0);
  const doneWp = PLANETS.reduce((s, p) => s + getDiscoveredSet(p.id).size, 0);

  tabsEl.innerHTML = "";
  const makeTab = (id, label) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `atlas-tab ${atlasFilterPlanetId === id ? "active" : ""}`;
    b.textContent = label;
    b.addEventListener("click", () => {
      atlasFilterPlanetId = id;
      sound.playHover();
      renderAtlasGridUI();
    });
    tabsEl.appendChild(b);
  };
  makeTab("all", `全部 (${doneWp}/${totalWp})`);
  PLANETS.forEach((p) => {
    const cnt = getDiscoveredSet(p.id).size;
    makeTab(p.id, `${p.name} (${cnt}/${p.waypoints.length})`);
  });

  gridEl.innerHTML = "";
  const targetPlanets =
    atlasFilterPlanetId === "all"
      ? PLANETS
      : PLANETS.filter((p) => p.id === atlasFilterPlanetId);

  targetPlanets.forEach((p) => {
    const pIdx = PLANETS.indexOf(p);
    const disc = getDiscoveredSet(p.id);
    p.waypoints.forEach((wp) => {
      const unlocked = disc.has(wp.id);
      const card = document.createElement("div");
      card.className = `atlas-card ${unlocked ? "unlocked" : "locked"}`;

      const thumb = document.createElement("div");
      thumb.className = "atlas-thumb-wrap";
      if (unlocked && wp.photo) {
        const img = document.createElement("img");
        img.loading = "lazy";
        img.src = wp.photo;
        img.alt = wp.name;
        thumb.appendChild(img);
      } else {
        thumb.textContent = "🔒";
      }

      const title = document.createElement("div");
      title.className = "atlas-card-title";
      title.textContent = unlocked ? `✦ ${wp.shortName || wp.name}` : `◇ ${wp.shortName || wp.name}`;

      const meta = document.createElement("div");
      meta.className = "atlas-card-meta";
      meta.textContent = unlocked ? `${p.name}` : `${p.name} · 待探访`;

      if (unlocked) {
        card.title = "点击重温正反双页明信片故事";
        card.addEventListener("click", () => {
          closeAtlasModal();
          openReadOnlyJournal(p, wp);
        });
      } else {
        const goBtn = document.createElement("button");
        goBtn.type = "button";
        goBtn.className = "bestiary-guide-btn";
        goBtn.textContent = "✦ 前往点亮";
        goBtn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          closeAtlasModal();
          if (mode !== "planet" || activePlanet?.id !== p.id) {
            enterPlanet(pIdx);
          }
          const wpObj = currentWorld?.waypointObjs?.find((o) => o.data.id === wp.id);
          if (wpObj) {
            showGuideArcTo(wpObj, null);
            showWonderToast(`✦ 星光引路已点亮 · 前往探访「${wp.shortName || wp.name}」`);
          }
        });
        card.append(thumb, title, meta, goBtn);
        gridEl.appendChild(card);
        return;
      }

      card.append(thumb, title, meta);
      gridEl.appendChild(card);
    });
  });
}

function openAtlasModal() {
  atlasModalOpen = true;
  ensureHistoryGuard();
  renderAtlasGridUI();
  document.getElementById("modal-atlas")?.classList.remove("hidden");
  sound.init();
  sound.playHover();
  trackEvent("打开24印记总图集");
}

function closeAtlasModal() {
  atlasModalOpen = false;
  document.getElementById("modal-atlas")?.classList.add("hidden");
}

function openReadOnlyJournal(planet, wpData) {
  journalOpen = true;
  ensureHistoryGuard();
  journalPage = 1;
  currentJournalPlanet = planet;
  currentJournalWp = wpData;
  const list = saveData.discovered[planet.id] || [];
  document.getElementById("journal-chapter").textContent = `${planet.name} · 行者明信片典藏`;
  document.getElementById("journal-title").textContent = wpData.name;
  document.getElementById("journal-elevation").textContent = `${wpData.elevation}`;
  renderJournalTextPage();
  document.getElementById("journal-progress").textContent = `所属星球收集进度：${list.length} / ${planet.waypoints.length}`;
  document.getElementById("btn-journal-ticket")?.classList.toggle("hidden", mode !== "planet");
  if (wpData.photo2) preloadUrl(wpData.photo2);
  document.getElementById("modal-journal").classList.remove("hidden");
  sound.init();
  sound.playHover();
}

function startStarWarpToPlanet(targetIdx, targetName) {
  if (warpActive) return;
  warpActive = true;
  warpTimer = 0.88;
  const veil = document.getElementById("warp-veil");
  const label = document.getElementById("warp-label");
  if (label) label.textContent = `✦ 星轨穿梭 · 正在飞往「${targetName}」…`;
  if (veil) {
    veil.classList.remove("hidden");
    requestAnimationFrame(() => veil.classList.add("active"));
  }
  sound.init();
  sound.playSelectPlanet();
  triggerHaptic(20);
  trackEvent(`星际直飞 · ${targetName}`, { target: targetName });

  setTimeout(() => {
    enterPlanet(targetIdx);
  }, 420);
  setTimeout(() => {
    if (veil) {
      veil.classList.remove("active");
      setTimeout(() => veil.classList.add("hidden"), 320);
    }
    camera.fov = 45;
    camera.updateProjectionMatrix();
    warpActive = false;
  }, 880);
}

function openFinaleModal() {
  finaleModalOpen = true;
  ensureHistoryGuard();
  document.getElementById("modal-finale")?.classList.remove("hidden");
  sound.init();
  sound.playDiscoverWaypoint(true);
  trackEvent("拆阅24全满贯终章手札");
}

function closeFinaleModal() {
  finaleModalOpen = false;
  document.getElementById("modal-finale")?.classList.add("hidden");
}

function openGrandPassport() {
  closeFinaleModal();
  currentTicketContext = { type: "passport" };
  refreshTicketPreviewImage();
  ticketModalOpen = true;
  document.getElementById("modal-ticket")?.classList.remove("hidden");
  trackEvent("签发全星系大满贯护照");
}

// ==================== JOURNAL POSTCARD DISCOVERY ====================
function renderJournalTextPage() {
  if (!currentJournalWp) return;
  const poemEl = document.getElementById("journal-poem");
  const badgeEl = document.getElementById("journal-page-badge");
  const hintEl = document.getElementById("journal-flip-hint");
  const captionEl = document.getElementById("journal-caption");
  const photoEl = document.getElementById("journal-photo");
  const artCanvas = document.getElementById("journal-art-canvas");
  if (!poemEl) return;

  const targetPhoto =
    journalPage === 2
      ? currentJournalWp.photo2 || currentJournalWp.photo
      : currentJournalWp.photo;
  const targetCaption =
    journalPage === 2
      ? currentJournalWp.caption2 || currentJournalWp.caption || currentJournalWp.name
      : currentJournalWp.caption || currentJournalWp.name;

  if (journalPage === 1) {
    poemEl.textContent = currentJournalWp.poem;
    if (badgeEl) badgeEl.textContent = "✦ 绘本诗笺 · 1/2";
    if (hintEl) hintEl.textContent = "查看旅途故事 ↻";
  } else {
    poemEl.textContent = currentJournalWp.memory || currentJournalWp.poem;
    if (badgeEl) badgeEl.textContent = "✎ 旅途故事 · 2/2";
    if (hintEl) hintEl.textContent = "返回绘本诗笺 ↺";
  }

  if (captionEl) captionEl.textContent = targetCaption;
  const mediaBox = photoEl.parentElement;
  const seq = ++photoLoadSeq;

  if (targetPhoto) {
    artCanvas.classList.add("hidden");
    const cached = preloadUrl(targetPhoto);
    if (cached && cached.complete && cached.naturalWidth > 0) {
      if (mediaBox) mediaBox.classList.remove("loading");
      photoEl.src = targetPhoto;
      photoEl.classList.remove("hidden");
    } else {
      // 尚未下载完时立即隐藏上一张旧图并显示显影态，彻底杜绝残留上一次照片
      photoEl.classList.add("hidden");
      photoEl.removeAttribute("src");
      if (mediaBox) mediaBox.classList.add("loading");
      cached.addEventListener(
        "load",
        () => {
          if (seq !== photoLoadSeq) return;
          if (mediaBox) mediaBox.classList.remove("loading");
          photoEl.src = targetPhoto;
          photoEl.classList.remove("hidden");
        },
        { once: true }
      );
    }
  } else if (currentJournalPlanet || activePlanet) {
    if (mediaBox) mediaBox.classList.remove("loading");
    renderPostcardScene(artCanvas, currentJournalWp, currentJournalPlanet || activePlanet);
    artCanvas.classList.remove("hidden");
    photoEl.classList.add("hidden");
  }
}

function flipJournalPage() {
  if (!currentJournalWp) return;
  journalPage = journalPage === 1 ? 2 : 1;
  if (journalPage === 2) {
    trackEvent("翻看第2页故事", {
      planet: activePlanet ? activePlanet.name : "",
      waypoint: currentJournalWp.name,
    });
  }
  const poemEl = document.getElementById("journal-poem");
  const photoEl = document.getElementById("journal-photo");
  if (poemEl) poemEl.style.opacity = "0.2";
  if (photoEl) photoEl.style.opacity = "0.25";
  setTimeout(() => {
    renderJournalTextPage();
    if (poemEl) poemEl.style.opacity = "1";
    if (photoEl) photoEl.style.opacity = "1";
  }, 115);
  sound.playHover();
}
function openWaypointJournal(wpObj) {
  if (!activePlanet || !wpObj) return;
  journalOpen = true;
  ensureHistoryGuard();
  journalPage = 1;
  currentJournalPlanet = activePlanet;
  currentJournalWp = wpObj.data;
  triggerHaptic(16);
  walkTargetDir = null;
  clickRing.visible = false;

  const pId = activePlanet.id;
  if (!saveData.discovered[pId]) saveData.discovered[pId] = [];
  const list = saveData.discovered[pId];
  const wasAlreadyAllDone = list.length >= activePlanet.waypoints.length;

  if (!list.includes(wpObj.data.id)) {
    list.push(wpObj.data.id);
    wpObj.markDiscovered();
    persistSave();
  }

  const nowAllDone = list.length >= activePlanet.waypoints.length;
  sound.playDiscoverWaypoint(nowAllDone && !wasAlreadyAllDone);

  document.getElementById("journal-chapter").textContent = `${activePlanet.name} · 行者明信片`;
  document.getElementById("journal-title").textContent = wpObj.data.name;
  document.getElementById("journal-elevation").textContent = `${wpObj.data.elevation}`;
  renderJournalTextPage();
  document.getElementById("journal-progress").textContent = `当前星球印记收集：${list.length} / ${activePlanet.waypoints.length}`;

  // 预加载第 2 页照片，让点击「查看旅途故事」时零延迟秒切
  if (wpObj.data.photo2) {
    const preload = new Image();
    preload.src = wpObj.data.photo2;
  }

  document.getElementById("modal-journal").classList.remove("hidden");
  renderHudWaypoints();
  refreshScrollMapBadges();
  refreshTicketButtons();
  trackEvent(`明信片 · ${wpObj.data.shortName || wpObj.data.name}`, {
    planet: activePlanet.name,
    waypoint: wpObj.data.name,
  });

  if (nowAllDone && !wasAlreadyAllDone) {
    trackEvent(`通关 · ${activePlanet.name}`, { planet: activePlanet.name });
    const banner = document.getElementById("banner-complete");
    const totalWp = PLANETS.reduce((s, p) => s + p.waypoints.length, 0);
    const doneWp = PLANETS.reduce((s, p) => s + getDiscoveredSet(p.id).size, 0);
    if (doneWp >= totalWp) {
      document.getElementById("banner-complete-text").textContent =
        "🏆 24/24 全境穿越达成！已为你解锁《终章手札》";
    } else {
      const sealWord = PLANET_SEAL_TITLE[activePlanet.id] || "穿越成功";
      document.getElementById("banner-complete-text").textContent = `✦ ${sealWord} · 已集齐「${activePlanet.name}」全部印记 · 可领取纪念票根`;
    }
    banner.classList.remove("hidden");
    setTimeout(() => banner.classList.add("hidden"), 6500);
  }
}

function refreshTicketButtons() {
  if (!activePlanet) return;
  const count = getDiscoveredSet(activePlanet.id).size;
  const total = activePlanet.waypoints.length;
  const done = count >= total;
  const sideBtn = document.getElementById("btn-summit-ticket");
  const journalBtn = document.getElementById("btn-journal-ticket");
  if (sideBtn) {
    sideBtn.classList.remove("hidden");
    sideBtn.textContent = done ? "🎫 票根 ✦" : `🎫 票根 ${count}/${total}`;
  }
  if (journalBtn) {
    journalBtn.classList.remove("hidden");
    journalBtn.textContent = done ? "🎫 领取满贯纪念票根" : `🎫 查看票根图鉴 (${count}/${total})`;
  }
}

async function openSummitTicketModal() {
  if (!activePlanet) return;
  sound.init();
  sound.playSelectPlanet();
  currentTicketContext = { type: "summit" };
  await refreshTicketPreviewImage();
  ticketModalOpen = true;
  document.getElementById("modal-ticket")?.classList.remove("hidden");
  trackEvent(`领取票根 · ${activePlanet.name}`, { planet: activePlanet.name });
}

function closeSummitTicketModal() {
  ticketModalOpen = false;
  document.getElementById("modal-ticket")?.classList.add("hidden");
}

function renderManiNotesUI() {
  if (!activePlanet) return;
  const listEl = document.getElementById("mani-notes-list");
  if (!listEl) return;
  const notes = loadManiNotes(activePlanet.id);
  listEl.innerHTML = "";
  notes.forEach((n) => {
    const row = document.createElement("div");
    row.className = "mani-note-item";
    const spanText = document.createElement("span");
    spanText.textContent = n.text;
    const spanAuthor = document.createElement("span");
    spanAuthor.className = "mani-note-author";
    spanAuthor.textContent = `— ${n.author}`;
    row.append(spanText, spanAuthor);
    listEl.appendChild(row);
  });
}

function openManiModal() {
  if (!activePlanet) return;
  maniModalOpen = true;
  ensureHistoryGuard();
  walkTargetDir = null;
  clickRing.visible = false;
  document.getElementById("mani-title").textContent = `${activePlanet.name} · 垭口留痕`;
  renderManiNotesUI();
  document.getElementById("modal-mani")?.classList.remove("hidden");
  sound.playHover();
  trackEvent(`查看玛尼堆 · ${activePlanet.name}`, { planet: activePlanet.name });
}

function closeManiModal() {
  maniModalOpen = false;
  document.getElementById("modal-mani")?.classList.add("hidden");
}

function syncCampfireAudio() {
  const fire = Number(document.getElementById("mix-fire")?.value ?? 75) / 100;
  const wind = Number(document.getElementById("mix-wind")?.value ?? 55) / 100;
  const music = Number(document.getElementById("mix-music")?.value ?? 70) / 100;
  sound.setCampfireMix({ active: isCampfireMode, fire, wind, music });
}

function toggleCampfireMode(force) {
  if (mode !== "planet" || !activePlanet) return;
  isCampfireMode = typeof force === "boolean" ? force : !isCampfireMode;
  if (isCampfireMode && isTelescopeMode) toggleTelescopeMode(false);
  sound.init();
  hiker.setSitting(isCampfireMode);
  document.getElementById("btn-campfire-mode")?.classList.toggle("active", isCampfireMode);
  document.getElementById("campfire-mixer")?.classList.toggle("hidden", !isCampfireMode);
  if (isCampfireMode) {
    walkTargetDir = null;
    clickRing.visible = false;
    campfireRig.placeInFrontOfHiker(playerUp, playerForward, hiker.root.position);
    syncCampfireAudio();
    showWonderToast("🔥 已卸下背包围炉而坐 · 可调节下方篝火与风声混音");
    trackEvent("开启围炉电台", { planet: activePlanet.name });
  } else {
    campfireRig.hide();
    sound.setCampfireMix({ active: false });
  }
}

function computeCameraViewBasis() {
  const refNorth = new THREE.Vector3(0, 1, 0);
  if (Math.abs(playerUp.dot(refNorth)) > 0.94) refNorth.set(0, 0, 1);
  const localEast = new THREE.Vector3().crossVectors(refNorth, playerUp).normalize();
  const localNorth = new THREE.Vector3().crossVectors(playerUp, localEast).normalize();
  const camBackDir = new THREE.Vector3()
    .addScaledVector(localNorth, -Math.cos(camYaw))
    .addScaledVector(localEast, Math.sin(camYaw))
    .normalize();
  const fwdDir = camBackDir.clone().negate();
  const rightDir = new THREE.Vector3().crossVectors(fwdDir, playerUp).normalize();
  return { upDir: playerUp.clone(), fwdDir, rightDir };
}

function toggleTelescopeMode(force) {
  if (mode !== "planet" || !activePlanet) return;
  isTelescopeMode = typeof force === "boolean" ? force : !isTelescopeMode;
  if (isTelescopeMode && isCampfireMode) toggleCampfireMode(false);
  document.getElementById("btn-telescope-mode")?.classList.toggle("active", isTelescopeMode);
  if (isTelescopeMode) {
    camPitch = 0.02; // 仰望远方天际星海，将其余全部 5 颗星球拱形排布于正前方夜空
    const basis = computeCameraViewBasis();
    activeSkyWonders?.setTelescopeActive(true, {
      hikerPos: hiker.root.position.clone(),
      ...basis,
      isPortrait: window.innerWidth < window.innerHeight,
    });
    showWonderToast("🔭 星际望远镜已开启 · 其余 5 颗山海星球已浮现夜空，点击即可直飞！");
    trackEvent("开启星际望远镜", { planet: activePlanet.name });
  } else {
    activeSkyWonders?.setTelescopeActive(false);
    camPitch = 0.56;
  }
}

function closeJournal() {
  journalOpen = false;
  document.getElementById("photo-lightbox")?.classList.add("hidden");
  document.getElementById("modal-journal").classList.add("hidden");
}

// ==================== INPUT CONTROLS ====================
const keys = {};
window.addEventListener("keydown", (e) => {
  keys[e.code] = true;

  if (e.code === "KeyM") {
    const on = sound.toggle();
    document.getElementById("btn-global-sound").textContent = on ? "♪ 星音" : "♪ 静音";
  }

  // 原图放大灯箱最优先拦截 Esc / Space，避免把底下的明信片一起关掉
  const lbEl = document.getElementById("photo-lightbox");
  if (lbEl && !lbEl.classList.contains("hidden")) {
    if (e.code === "Escape" || e.code === "Space") {
      e.preventDefault();
      lbEl.classList.add("hidden");
    }
    return;
  }

  // 全局跨界面模态框优先响应键盘关闭（星图与星球内统一生效）
  if (atlasModalOpen) {
    if (e.code === "Escape" || e.code === "KeyG") closeAtlasModal();
    return;
  }
  if (bestiaryModalOpen) {
    if (e.code === "Escape" || e.code === "KeyB") closeBestiaryModal();
    return;
  }
  if (finaleModalOpen) {
    if (e.code === "Escape") closeFinaleModal();
    return;
  }
  if (ticketModalOpen) {
    if (e.code === "Escape" || e.code === "Space") closeSummitTicketModal();
    return;
  }
  if (journalOpen) {
    if (e.code === "ArrowRight" || e.code === "ArrowLeft" || e.code === "Tab") {
      e.preventDefault();
      flipJournalPage();
    } else if (e.code === "KeyE" || e.code === "Space" || e.code === "Enter" || e.code === "Escape") {
      e.preventDefault();
      closeJournal();
    }
    return;
  }

  if (mode === "title" && (e.code === "Enter" || e.code === "Space")) {
    sound.init();
    sound.playSelectPlanet();
    openStarMap();
  } else if (mode === "map") {
    if (e.code === "ArrowRight" || e.code === "KeyD") selectMapPlanet(selectedPlanetIdx + 1);
    else if (e.code === "ArrowLeft" || e.code === "KeyA") selectMapPlanet(selectedPlanetIdx - 1);
    else if (e.code === "ArrowDown" || e.code === "KeyS") selectMapPlanet(selectedPlanetIdx + 3);
    else if (e.code === "ArrowUp" || e.code === "KeyW") selectMapPlanet(selectedPlanetIdx - 3);
    else if (e.code === "KeyB") openBestiaryModal();
    else if (e.code === "KeyG") openAtlasModal();
    else if (e.code === "Enter" || e.code === "Space") enterPlanet(selectedPlanetIdx);
    else if (e.code === "Escape") setupTitleScene();
  } else if (mode === "planet") {
    if (maniModalOpen) {
      if (e.code === "Escape") closeManiModal();
      return;
    }
    if (e.code === "KeyE" && activeWaypointNear) {
      openWaypointJournal(activeWaypointNear);
    } else if (e.code === "KeyE" && activeManiNear) {
      openManiModal();
    } else if (e.code === "KeyG") {
      openAtlasModal();
    } else if (e.code === "KeyB") {
      openBestiaryModal();
    } else if (e.code === "KeyC") {
      toggleCampfireMode();
    } else if (e.code === "KeyT") {
      toggleTelescopeMode();
    } else if (e.code === "KeyL") {
      cycleSkyPhase();
    } else if (e.code === "KeyP") {
      togglePhotoMode();
    } else if (e.code === "Escape") {
      if (isPhotoMode) togglePhotoMode(false);
      else openStarMap();
    }
  }
});

window.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

// 鼠标拖拽旋转视角 · 手机双指捏合缩放视角 · 左下角星芒触控微摇杆 · 点击星球表面寻路
let isPointerDown = false;
let pointerMoved = 0;
let lastPX = 0;
let lastPY = 0;
const activePointers = new Map();
let pinchLastDist = 0;

let joyInputX = 0;
let joyInputY = 0;
let joyMagnitude = 0;
let joyPointerId = null;

const elJoystick = document.getElementById("mobile-joystick");
const elJoyKnob = document.getElementById("joy-knob");
if (elJoystick && elJoyKnob) {
  const maxR = 28;
  const updateJoyFromEvent = (e) => {
    const rect = elJoystick.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    elJoyKnob.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
    joyInputX = dx / maxR;
    joyInputY = -dy / maxR;
    joyMagnitude = Math.min(1, dist / maxR);
  };
  const resetJoy = () => {
    joyPointerId = null;
    joyInputX = 0;
    joyInputY = 0;
    joyMagnitude = 0;
    elJoyKnob.style.transform = "translate(0px, 0px)";
    elJoystick.classList.remove("active");
  };
  elJoystick.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
    sound.init();
    joyPointerId = e.pointerId;
    elJoystick.setPointerCapture?.(e.pointerId);
    elJoystick.classList.add("active");
    updateJoyFromEvent(e);
  });
  elJoystick.addEventListener("pointermove", (e) => {
    if (e.pointerId !== joyPointerId) return;
    e.stopPropagation();
    updateJoyFromEvent(e);
  });
  elJoystick.addEventListener("pointerup", (e) => {
    if (e.pointerId === joyPointerId) resetJoy();
  });
  elJoystick.addEventListener("pointercancel", resetJoy);
}

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();

renderer.domElement.addEventListener("pointerdown", (e) => {
  if (mode === "title") {
    sound.init();
    sound.playSelectPlanet();
    openStarMap();
    return;
  }
  if (mode !== "planet" || isAnyModalOpen()) return;
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (activePointers.size === 2) {
    const pts = Array.from(activePointers.values());
    pinchLastDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    isPointerDown = false;
    return;
  }
  isPointerDown = true;
  pointerMoved = 0;
  lastPX = e.clientX;
  lastPY = e.clientY;
});

window.addEventListener("pointermove", (e) => {
  if (activePointers.has(e.pointerId)) {
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  }
  if (activePointers.size === 2 && mode === "planet") {
    const pts = Array.from(activePointers.values());
    const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    if (pinchLastDist > 0) {
      const delta = pinchLastDist - d;
      camDist = THREE.MathUtils.clamp(camDist + delta * 0.038, 6.2, 24);
    }
    pinchLastDist = d;
    pointerMoved = 999;
    return;
  }
  if (!isPointerDown || mode !== "planet") {
    // 电脑端悬停感知：鼠标移到夜空邻近星球或玛尼堆上时自动变为小手并让星球微光呼吸放大
    if (e.pointerType === "mouse" && mode === "planet" && !isAnyModalOpen()) {
      ndc.x = (e.clientX / window.innerWidth) * 2 - 1;
      ndc.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      let hoverId = null;
      let clickable = false;
      if (activeSkyWonders) {
        const sh = raycaster.intersectObjects(activeSkyWonders.getClickableMeshes(), false);
        if (sh.length > 0) {
          hoverId = sh[0].object.userData.planetId || null;
          clickable = true;
        }
        activeSkyWonders.setHoveredPlanet(hoverId);
      }
      if (!clickable && activeManiCairn) {
        if (raycaster.intersectObject(activeManiCairn.group, true).length > 0) {
          clickable = true;
        }
      }
      renderer.domElement.style.cursor = clickable ? "pointer" : "";
    }
    return;
  }
  const dx = e.clientX - lastPX;
  const dy = e.clientY - lastPY;
  lastPX = e.clientX;
  lastPY = e.clientY;
  pointerMoved += Math.hypot(dx, dy);

  camYaw -= dx * 0.0065;
  const minPitch = isTelescopeMode ? -0.14 : 0.2;
  const maxPitch = isTelescopeMode ? 0.48 : 1.25;
  camPitch = THREE.MathUtils.clamp(camPitch + dy * 0.0055, minPitch, maxPitch);
});

window.addEventListener("pointercancel", (e) => {
  activePointers.delete(e.pointerId);
  if (activePointers.size < 2) pinchLastDist = 0;
});

window.addEventListener("pointerup", (e) => {
  activePointers.delete(e.pointerId);
  if (activePointers.size < 2) pinchLastDist = 0;
  if (!isPointerDown) return;
  isPointerDown = false;
  if (mode === "planet" && !isAnyModalOpen() && pointerMoved < 6 && currentWorld?.terrainMesh) {
    ndc.x = (e.clientX / window.innerWidth) * 2 - 1;
    ndc.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);

    // 1. 优先检测是否点击了远空中的邻近星球（0.88s 星轨穿梭直飞跃迁！）
    if (activeSkyWonders) {
      const skyHits = raycaster.intersectObjects(activeSkyWonders.getClickableMeshes(), false);
      if (skyHits.length > 0) {
        const { targetPlanetIdx, planetName } = skyHits[0].object.userData;
        if (typeof targetPlanetIdx === "number") {
          startStarWarpToPlanet(targetPlanetIdx, planetName);
          return;
        }
      }
    }

    // 2. 检测是否点击了垭口星光玛尼堆
    if (activeManiCairn) {
      const maniHits = raycaster.intersectObject(activeManiCairn.group, true);
      if (maniHits.length > 0) {
        openManiModal();
        return;
      }
    }

    if (isCampfireMode) return;
    const hits = raycaster.intersectObject(currentWorld.terrainMesh, false);
    if (hits.length > 0) {
      walkTargetDir = hits[0].point.clone().normalize();
      const r = getSurfaceRadius(activePlanet.id, walkTargetDir);
      clickRing.position.copy(walkTargetDir).multiplyScalar(r + 0.05);
      clickRing.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), walkTargetDir);
      clickRing.visible = true;
    }
  }
});

renderer.domElement.addEventListener(
  "wheel",
  (e) => {
    if (mode !== "planet") return;
    camDist = THREE.MathUtils.clamp(camDist + e.deltaY * 0.01, 6.2, 24);
  },
  { passive: true }
);

// ==================== DOM BUTTON BINDINGS ====================
document.getElementById("btn-global-sound").addEventListener("click", () => {
  sound.init();
  const on = sound.toggle();
  document.getElementById("btn-global-sound").textContent = on ? "♪ 星音" : "♪ 静音";
});

document.getElementById("btn-start-journey").addEventListener("click", () => {
  sound.init();
  sound.playSelectPlanet();
  openStarMap();
});

document.getElementById("btn-back-title").addEventListener("click", () => {
  setupTitleScene();
});

document.getElementById("btn-enter-planet").addEventListener("click", () => {
  const enterBtn = document.getElementById("btn-enter-planet");
  if (enterBtn?.disabled) return;
  enterPlanet(selectedPlanetIdx);
});

const elTbcBtn = document.getElementById("btn-tbc-planet");
if (elTbcBtn) {
  elTbcBtn.addEventListener("click", () => {
    planetNodeEls.forEach((el) => el.classList.remove("selected"));
    elTbcBtn.classList.add("selected");
    elMapChapter.textContent = "未完待续 · TO BE CONTINUED";
    elMapTitle.textContent = "下一颗星 · 未知的山海远方";
    elMapStats.innerHTML = `
      <span class="stat-pill">坐标 尚在风中</span>
      <span class="stat-pill">海拔 待双脚丈量</span>
      <span class="stat-pill">状态 步履不停</span>
    `;
    elMapQuote.textContent = "“山海从无尽头。只要行者再次系紧鞋带，下一段旅途便会在夜空凝成新的星辰。”";
    const enterBtn = document.getElementById("btn-enter-planet");
    if (enterBtn) {
      enterBtn.disabled = true;
      enterBtn.style.opacity = "0.65";
      enterBtn.textContent = "✦ 下一段旅程 · 敬请期待";
    }
    sound.playHover();
  });
}

document.getElementById("btn-back-map").addEventListener("click", () => {
  openStarMap();
});

document.getElementById("btn-toggle-night").addEventListener("click", () => {
  cycleSkyPhase();
});

document.getElementById("btn-photo-mode").addEventListener("click", () => {
  togglePhotoMode();
});

document.getElementById("photo-exit-hint").addEventListener("click", () => {
  togglePhotoMode(false);
});

elPromptInteract.addEventListener("click", () => {
  if (activeWaypointNear) openWaypointJournal(activeWaypointNear);
  else if (activeManiNear) openManiModal();
});

document.getElementById("btn-campfire-mode")?.addEventListener("click", () => toggleCampfireMode());
document.getElementById("btn-exit-campfire")?.addEventListener("click", () => toggleCampfireMode(false));
["mix-fire", "mix-wind", "mix-music"].forEach((id) => {
  document.getElementById(id)?.addEventListener("input", syncCampfireAudio);
});

document.getElementById("btn-telescope-mode")?.addEventListener("click", () => toggleTelescopeMode());
document.getElementById("btn-summit-ticket")?.addEventListener("click", openSummitTicketModal);
document.getElementById("btn-journal-ticket")?.addEventListener("click", () => {
  closeJournal();
  openSummitTicketModal();
});
document.getElementById("btn-close-ticket")?.addEventListener("click", closeSummitTicketModal);
document.getElementById("ticket-preview-img")?.addEventListener("click", () => {
  const src = document.getElementById("ticket-preview-img")?.src;
  const lb = document.getElementById("photo-lightbox");
  const lbImg = document.getElementById("lightbox-img");
  if (src && lb && lbImg) {
    ensureHistoryGuard();
    lbImg.src = src;
    lb.classList.remove("hidden");
  }
});
document.getElementById("btn-apply-signature")?.addEventListener("click", () => {
  sound.init();
  sound.playHover();
  refreshTicketPreviewImage();
  showWonderToast("✦ 已将专属署名烫金印上纪念卡片！");
});
document.getElementById("ticket-traveler-input")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    refreshTicketPreviewImage();
  }
});
document.getElementById("btn-snap-wallpaper")?.addEventListener("click", snapPhotoWallpaper);
document.getElementById("btn-save-bookmark")?.addEventListener("click", saveCurrentPostcardBookmark);
document.getElementById("scroll-total-progress")?.addEventListener("click", openAtlasModal);
document.getElementById("btn-hud-atlas")?.addEventListener("click", openAtlasModal);
document.getElementById("btn-close-atlas")?.addEventListener("click", closeAtlasModal);
document.getElementById("btn-hud-bestiary")?.addEventListener("click", openBestiaryModal);
document.getElementById("btn-map-bestiary")?.addEventListener("click", openBestiaryModal);
document.getElementById("btn-close-bestiary")?.addEventListener("click", closeBestiaryModal);
document.getElementById("btn-grand-finale")?.addEventListener("click", openFinaleModal);
document.getElementById("btn-close-finale")?.addEventListener("click", closeFinaleModal);
document.getElementById("btn-generate-passport")?.addEventListener("click", openGrandPassport);

document.getElementById("btn-close-mani")?.addEventListener("click", closeManiModal);
document.getElementById("mani-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!activePlanet) return;
  const authorInput = document.getElementById("mani-author");
  const textInput = document.getElementById("mani-text");
  const text = textInput?.value?.trim();
  if (!text) return;
  addManiNote(activePlanet.id, authorInput?.value, text);
  if (textInput) textInput.value = "";
  activeManiCairn?.addVisualStone();
  renderManiNotesUI();
  sound.init();
  sound.playDiscoverWaypoint(false);
  showWonderToast("🪨 已将你的心愿星石垒上垭口玛尼堆！");
  trackEvent("玛尼堆垒石留言", { planet: activePlanet.name });
});

document.getElementById("btn-close-journal").addEventListener("click", closeJournal);

const elJournalTextCard = document.getElementById("journal-text-card");
if (elJournalTextCard) {
  elJournalTextCard.addEventListener("click", flipJournalPage);
}

// 明信片弹窗支持手机手指左右轻滑翻面（第1页绘本诗笺 ↔ 第2页旅途故事）
const elJournalPostcard = document.querySelector(".journal-postcard");
let swipeStartX = 0;
let swipeStartY = 0;
let swipeJustHandled = false;
if (elJournalPostcard) {
  elJournalPostcard.addEventListener(
    "touchstart",
    (e) => {
      if (!e.touches || e.touches.length !== 1) return;
      swipeStartX = e.touches[0].clientX;
      swipeStartY = e.touches[0].clientY;
    },
    { passive: true }
  );
  elJournalPostcard.addEventListener(
    "touchend",
    (e) => {
      if (!journalOpen || !e.changedTouches || e.changedTouches.length !== 1) return;
      const dx = e.changedTouches[0].clientX - swipeStartX;
      const dy = e.changedTouches[0].clientY - swipeStartY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.35) {
        swipeJustHandled = true;
        setTimeout(() => { swipeJustHandled = false; }, 260);
        flipJournalPage();
      }
    },
    { passive: true }
  );
}

// 点击拍立得明信片放大查看原图（若刚触发左右滑动翻页则不误弹灯箱）
const elPolaroid = document.getElementById("journal-polaroid");
const elLightbox = document.getElementById("photo-lightbox");
const elLightboxImg = document.getElementById("lightbox-img");
  if (elPolaroid && elLightbox && elLightboxImg) {
  elPolaroid.addEventListener("click", () => {
    if (swipeJustHandled) return;
    ensureHistoryGuard();
    const photoEl = document.getElementById("journal-photo");
    const artCanvas = document.getElementById("journal-art-canvas");
    if (!photoEl.classList.contains("hidden") && photoEl.src) {
      elLightboxImg.src = photoEl.src;
    } else {
      elLightboxImg.src = artCanvas.toDataURL("image/jpeg", 0.9);
    }
    elLightbox.classList.remove("hidden");
  });
  elLightbox.addEventListener("click", () => {
    elLightbox.classList.add("hidden");
  });
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  updateTitleLayout();
});

// ==================== MAIN ANIMATION LOOP ====================
const clock = new THREE.Clock();

function updatePlanetExploration(dt, elapsed) {
  if (!activePlanet || !currentWorld) return;

  // 计算相对于当前相机视角的球面切向方向基
  const camToPlayer = hiker.root.position.clone().sub(camera.position);
  let viewFwd = camToPlayer.sub(playerUp.clone().multiplyScalar(camToPlayer.dot(playerUp)));
  if (viewFwd.lengthSq() < 1e-5) {
    viewFwd.copy(playerForward);
  } else {
    viewFwd.normalize();
  }
  const viewRight = new THREE.Vector3().crossVectors(viewFwd, playerUp).normalize();

  let inputX = 0;
  let inputY = 0;
  if (!isAnyModalOpen() && !isCampfireMode) {
    if (keys["KeyW"] || keys["ArrowUp"]) inputY += 1;
    if (keys["KeyS"] || keys["ArrowDown"]) inputY -= 1;
    if (keys["KeyD"] || keys["ArrowRight"]) inputX += 1;
    if (keys["KeyA"] || keys["ArrowLeft"]) inputX -= 1;
    if (Math.abs(joyInputX) > 0.08 || Math.abs(joyInputY) > 0.08) {
      inputX += joyInputX;
      inputY += joyInputY;
    }
  }

  const moveDir = new THREE.Vector3();
  if (inputX !== 0 || inputY !== 0) {
    walkTargetDir = null;
    clickRing.visible = false;
    moveDir.addScaledVector(viewFwd, inputY).addScaledVector(viewRight, inputX).normalize();
  } else if (walkTargetDir && !journalOpen) {
    const angle = playerUp.angleTo(walkTargetDir);
    if (angle < 0.04) {
      walkTargetDir = null;
      clickRing.visible = false;
    } else {
      moveDir
        .copy(walkTargetDir)
        .sub(playerUp.clone().multiplyScalar(walkTargetDir.dot(playerUp)))
        .normalize();
    }
  }

  // 真实地形起伏坡度变速 + 特定险峻路段阻尼（如红军垭口深雪横切、大峰绝望坡、新月流沙梁）
  let terrainStatusText = "";
  let zoneSpeedFactor = 1.0;
  let detectedSoundZone = null;

  for (const wpObj of currentWorld.waypointObjs) {
    const ang = playerUp.angleTo(wpObj.unitDir);
    const sz = wpObj.data.slowZone;
    if (sz && ang < sz.radius) {
      const blend = 1 - ang / sz.radius;
      const f = THREE.MathUtils.lerp(1.0, sz.factor, Math.min(1, blend * 1.4));
      if (f < zoneSpeedFactor) {
        zoneSpeedFactor = f;
        terrainStatusText = `⛰ ${sz.label}`;
      }
    }
    if (wpObj.data.soundZone && ang < 0.28) {
      detectedSoundZone = wpObj.data.soundZone;
    }
  }

  // 触发特定场景音效（雪山垭口呼啸风声、咸田湾生日八音盒等）
  if (detectedSoundZone !== activeSceneZone) {
    activeSceneZone = detectedSoundZone;
    sound.setSceneZone(activeSceneZone);
  }
  if (!terrainStatusText && activeSceneZone === "birthday_beach") {
    terrainStatusText = "🎂 咸田湾营地 · 八音盒《生日快乐歌》";
  } else if (!terrainStatusText && activeSceneZone === "gale_pass") {
    terrainStatusText = "🌬 高山风口 · 经幡猎猎";
  }

  let slopeFactor = 1.0;
  if (moveDir.lengthSq() > 0) {
    const rNow = getSurfaceRadius(activePlanet.id, playerUp);
    const aheadDir = playerUp.clone().addScaledVector(moveDir, 0.06).normalize();
    const rAhead = getSurfaceRadius(activePlanet.id, aheadDir);
    const dh = rAhead - rNow;
    if (dh > 0.004) {
      slopeFactor = THREE.MathUtils.clamp(1.0 - dh * 5.2, 0.56, 1.0);
      if (!terrainStatusText && slopeFactor < 0.78) {
        terrainStatusText = "↗ 陡坡爬升中";
      }
    } else if (dh < -0.004) {
      slopeFactor = THREE.MathUtils.clamp(1.0 - dh * 1.8, 1.0, 1.18);
    }
  }

  const targetFactor = zoneSpeedFactor * slopeFactor;
  currentSpeedFactor = THREE.MathUtils.lerp(currentSpeedFactor, targetFactor, Math.min(1, dt * 6));

  const elTerrainTag = document.getElementById("hud-terrain-tag");
  if (elTerrainTag) {
    if (terrainStatusText) {
      elTerrainTag.textContent = terrainStatusText;
      elTerrainTag.classList.remove("hidden");
    } else {
      elTerrainTag.classList.add("hidden");
    }
  }

  const isRunning = keys["ShiftLeft"] || keys["ShiftRight"] || joyMagnitude > 0.85;
  const joyScale = joyMagnitude > 0.08 && !keys["KeyW"] && !keys["ArrowUp"] ? THREE.MathUtils.lerp(0.55, 1.0, joyMagnitude) : 1.0;
  const baseSpeed = moveDir.lengthSq() > 0 ? (isRunning ? 5.6 : 3.6) * joyScale : 0;
  const speed = baseSpeed * currentSpeedFactor;

  if (speed > 0) {
    idleSeconds = 0;
    const angularStep = (speed / PLANET_RADIUS) * dt;
    const rotAxis = new THREE.Vector3().crossVectors(playerUp, moveDir).normalize();
    const dq = new THREE.Quaternion().setFromAxisAngle(rotAxis, angularStep);
    playerUp.applyQuaternion(dq).normalize();
    playerForward.lerp(moveDir, Math.min(1, dt * 10)).normalize();

    stepAccum += speed * dt;
    if (stepAccum > 1.35) {
      stepAccum = 0;
      saveData.steps = (saveData.steps || 0) + 2;
      elHudSteps.textContent = `${saveData.steps} 步`;
      sound.playStep(activePlanet.palette.particleType);
    }
  }

  orientHikerOnSphere(scene, playerUp, playerForward, activePlanet.id);
  hiker.update(dt, elapsed, isCampfireMode ? 0 : speed / 3.6);
  if (speed === 0) idleSeconds += dt;

  // 动态映射海拔表
  const curR = hiker.root.position.length();
  const hRatio = THREE.MathUtils.clamp((curR - PLANET_RADIUS + 0.2) / 2.0, 0, 1);
  const altMeters = Math.round(
    THREE.MathUtils.lerp(activePlanet.stats.baseAlt, activePlanet.stats.peakAlt, hRatio)
  );
  elHudAlt.textContent = `海拔 ${altMeters.toLocaleString()} m`;

  // 更新 V3.3 星球奇遇实体（小生灵驯养结伴跟随与围炉打盹 · 动态脚印 · 天气奇遇与流星雨 · 玛尼堆 · 营地篝火）
  if (activeFootprints) {
    activeFootprints.update(dt, playerUp, playerForward, speed > 0.15 && !isCampfireMode);
  }
  if (activeCreature) {
    activeCreature.update(
      dt,
      elapsed,
      {
        hikerPos: hiker.root.position,
        hikerUp: playerUp,
        hikerForward: playerForward,
        isCampfire: isCampfireMode,
      },
      (info, firstBond) => {
        sound.init();
        sound.playCreatureChirp(activePlanet.id);
        if (firstBond && !(saveData.creatures || []).includes(activePlanet.id)) {
          saveData.creatures.push(activePlanet.id);
          persistSave();
          refreshScrollMapBadges();
          showWonderToast(`${info.emoji} 已与「${info.name}」结伴并记入生灵图集 · 它会一路陪你漫步！`, 5000);
          trackEvent(`结伴小生灵 · ${info.name}`, { planet: activePlanet.name });
        } else {
          showWonderToast(`${info.emoji} 偶遇「${info.name}」 · ${info.greeting}`);
        }
      }
    );
  }
  if (activeSkyWonders) {
    if (isTelescopeMode) {
      const basis = computeCameraViewBasis();
      activeSkyWonders.setTelescopeActive(true, {
        hikerPos: hiker.root.position,
        ...basis,
        isPortrait: window.innerWidth < window.innerHeight,
      });
    }
    activeSkyWonders.update(dt, elapsed, {
      isNight,
      idleSeconds,
      normalizedAlt: hRatio,
      hikerPos: hiker.root.position,
      playerUp,
      onWonder: (msg) => showWonderToast(msg, 4800),
    });
  }
  if (activeManiCairn) {
    activeManiCairn.update(elapsed);
  }
  campfireRig.update(elapsed);

  // 检测附近可打卡的徒步路标或垭口星光玛尼堆（当大峰石碑与玛尼堆相邻时，按最近距离精准触发）
  let nearest = null;
  let minAng = 0.21;
  for (const wpObj of currentWorld.waypointObjs) {
    const ang = playerUp.angleTo(wpObj.unitDir);
    if (ang < minAng) {
      minAng = ang;
      nearest = wpObj;
    }
  }
  const maniAng = activeManiCairn ? playerUp.angleTo(activeManiCairn.unitDir) : 999;
  if (maniAng < 0.19 && maniAng < minAng) {
    activeWaypointNear = null;
    activeManiNear = true;
  } else {
    activeWaypointNear = nearest;
    activeManiNear = !nearest && maniAng < 0.19;
  }

  const isMobileShort = window.innerWidth <= 820;
  if (activeWaypointNear && !isAnyModalOpen() && !isCampfireMode) {
    const wpLabel = isMobileShort
      ? activeWaypointNear.data.shortName || activeWaypointNear.data.name
      : activeWaypointNear.data.name;
    elPromptText.textContent = isMobileShort
      ? `点击探访「${wpLabel}」`
      : `按 [E] 或点击 · 探访「${wpLabel}」`;
    elPromptInteract.classList.remove("hidden");
  } else if (activeManiNear && !isAnyModalOpen() && !isCampfireMode) {
    elPromptText.textContent = isMobileShort
      ? "🪨 点击垭口玛尼堆留痕"
      : "🪨 按 [E] 或点击 · 垭口星光玛尼堆留痕";
    elPromptInteract.classList.remove("hidden");
  } else {
    elPromptInteract.classList.add("hidden");
  }

  // 引路光弧淡出计时
  if (guideArcLine) {
    guideArcTimer -= dt;
    guideArcLine.material.opacity = Math.max(0, Math.min(0.95, guideArcTimer * 0.4));
    if (guideArcTimer <= 0) clearGuideArc();
  }

  // 第三人称球面轨道跟随相机（丝滑俯冲 + 围炉电影感近景 + 观星广角 + 全角度极点无死锁）
  introZoomProgress = Math.min(1, introZoomProgress + dt * 0.85);
  if (isCampfireMode) {
    camYaw += dt * 0.14;
  }
  const modeDist = isCampfireMode ? 6.4 : isTelescopeMode ? 14.5 : camDist;
  const effectiveDist = THREE.MathUtils.lerp(28, modeDist, 1 - Math.pow(1 - introZoomProgress, 3));

  // 构建局部稳定正交切基以支持自由环绕偏航角 camYaw
  const refNorth = new THREE.Vector3(0, 1, 0);
  if (Math.abs(playerUp.dot(refNorth)) > 0.94) refNorth.set(0, 0, 1);
  const localEast = new THREE.Vector3().crossVectors(refNorth, playerUp).normalize();
  const localNorth = new THREE.Vector3().crossVectors(playerUp, localEast).normalize();

  const horizDir = new THREE.Vector3()
    .addScaledVector(localNorth, -Math.cos(camYaw))
    .addScaledVector(localEast, Math.sin(camYaw))
    .normalize();

  const camOffsetDir = new THREE.Vector3()
    .addScaledVector(horizDir, Math.cos(camPitch))
    .addScaledVector(playerUp, Math.sin(camPitch))
    .normalize();

  const desiredCamPos = hiker.root.position.clone().addScaledVector(camOffsetDir, effectiveDist);
  const lookLift = isTelescopeMode ? 5.6 : isCampfireMode ? 0.55 : 0.9;
  const desiredTarget = hiker.root.position.clone().addScaledVector(playerUp, lookLift);

  const damp = 1 - Math.exp(-6.5 * dt);
  smoothCamPos.lerp(desiredCamPos, damp);
  smoothLookAt.lerp(desiredTarget, damp);
  smoothCamUp.lerp(playerUp, damp).normalize();

  camera.up.copy(smoothCamUp);
  camera.position.copy(smoothCamPos);
  camera.lookAt(smoothLookAt);
}

function animate() {
  requestAnimationFrame(animate);
  if (document.hidden) return;
  const dt = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;

  starsGold.rotation.y = elapsed * 0.008;
  starsBlue.rotation.y = -elapsed * 0.005;
  starsGold.material.opacity = 0.72 + Math.sin(elapsed * 1.4) * 0.16;

  if (currentWorld) {
    currentWorld.update(dt, elapsed);
  }

  if (mode === "title" && currentWorld) {
    currentWorld.group.rotation.y = elapsed * 0.12;
    const baseY = currentWorld.group.userData.baseY ?? -1.2;
    currentWorld.group.position.y = baseY + Math.sin(elapsed * 0.9) * 0.25;
    hiker.update(dt, elapsed, 0.15);
  } else if (mode === "map" && currentWorld) {
    currentWorld.group.rotation.y = elapsed * 0.06;
  } else if (mode === "planet") {
    applyLightingTheme(false);
    updatePlanetExploration(dt, elapsed);
  }

  if (warpActive) {
    warpTimer = Math.max(0, warpTimer - dt);
    const pulse = Math.sin((1 - warpTimer / 0.88) * Math.PI);
    camera.fov = 45 + pulse * 24;
    camera.updateProjectionMatrix();
  }

  renderer.render(scene, camera);
}

// iOS 微信与移动端浏览器：首次手指触碰屏幕无感唤醒音频通道
const unlockAudioOnce = () => {
  if (sound.enabled) sound.init();
  window.removeEventListener("touchstart", unlockAudioOnce, true);
  window.removeEventListener("pointerdown", unlockAudioOnce, true);
};
window.addEventListener("touchstart", unlockAudioOnce, { capture: true, passive: true });
window.addEventListener("pointerdown", unlockAudioOnce, { capture: true, passive: true });

// 切回微信聊天 / 手机锁屏时自动挂起音频并暂停 3D 渲染零耗电，切回前台无缝恢复
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (sound.ctx && sound.ctx.state === "running") {
      sound.ctx.suspend().catch(() => {});
    }
  } else {
    clock.getDelta();
    if (sound.enabled && sound.ctx && sound.ctx.state === "suspended") {
      sound.ctx.resume().catch(() => {});
    }
  }
});

// Expose state for inspection/verification
window.__game = {
  get mode() { return mode; },
  get activePlanet() { return activePlanet?.id || null; },
  get currentOutfit() { return hiker.outfit; },
  get speedFactor() { return currentSpeedFactor; },
  get activeSoundZone() { return activeSceneZone; },
  get audioZone() { return sound.activeZone; },
  walkToWaypoint(idx) {
    const wpObj = currentWorld?.waypointObjs?.[idx];
    if (wpObj) walkTargetDir = wpObj.unitDir.clone();
  },
  walkToCreature() {
    if (activeCreature) walkTargetDir = activeCreature.getUnitDir();
  },
  walkToMani() {
    if (activeManiCairn) walkTargetDir = activeManiCairn.unitDir.clone();
  },
  openManiModal,
  openAtlasModal,
  openSummitTicketModal,
  cycleSkyPhase,
  startStarWarpToPlanet,
  toggleCampfireMode,
  toggleTelescopeMode,
  enterPlanet,
  openStarMap,
  PLANETS,
};

// 点击 6 大弹窗外侧深色半透明星空空白背景即可优雅收起弹窗
[
  ["modal-journal", closeJournal],
  ["modal-atlas", closeAtlasModal],
  ["modal-bestiary", closeBestiaryModal],
  ["modal-ticket", closeSummitTicketModal],
  ["modal-mani", closeManiModal],
  ["modal-finale", closeFinaleModal],
].forEach(([modalId, closeFn]) => {
  const backdrop = document.getElementById(modalId);
  if (!backdrop) return;
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeFn();
  });
});

// 接管微信 / 手机浏览器「左边缘右滑返回手势」防误退：逐级关闭大图→弹窗→退回星图→退回扉页
window.addEventListener("popstate", () => {
  hasHistoryGuard = false;
  const lb = document.getElementById("photo-lightbox");
  if (lb && !lb.classList.contains("hidden")) {
    lb.classList.add("hidden");
    ensureHistoryGuard();
    return;
  }
  if (ticketModalOpen) {
    closeSummitTicketModal();
    if (isAnyModalOpen() || mode !== "title") ensureHistoryGuard();
    return;
  }
  if (journalOpen) {
    closeJournal();
    if (isAnyModalOpen() || mode !== "title") ensureHistoryGuard();
    return;
  }
  if (atlasModalOpen) {
    closeAtlasModal();
    if (mode !== "title") ensureHistoryGuard();
    return;
  }
  if (bestiaryModalOpen) {
    closeBestiaryModal();
    if (mode !== "title") ensureHistoryGuard();
    return;
  }
  if (maniModalOpen) {
    closeManiModal();
    if (mode !== "title") ensureHistoryGuard();
    return;
  }
  if (finaleModalOpen) {
    closeFinaleModal();
    if (mode !== "title") ensureHistoryGuard();
    return;
  }
  if (isPhotoMode) {
    togglePhotoMode(false);
    ensureHistoryGuard();
    return;
  }
  if (isCampfireMode) {
    toggleCampfireMode(false);
    ensureHistoryGuard();
    return;
  }
  if (isTelescopeMode) {
    toggleTelescopeMode(false);
    ensureHistoryGuard();
    return;
  }
  if (mode === "planet") {
    openStarMap();
    return;
  }
  if (mode === "map") {
    setupTitleScene();
  }
});

// 支持同行队友专属星球直达链接（如 https://hikerplanets.netlify.app/#siguniang 或 ?planet=maclehose）
function resolveDeepLinkPlanetIndex() {
  const qPlanet = new URLSearchParams(window.location.search).get("planet");
  const hashPlanet = window.location.hash.replace(/^#\/?/, "").trim().toLowerCase();
  const targetKey = (qPlanet || hashPlanet || "").toLowerCase();
  if (!targetKey) return -1;
  return PLANETS.findIndex((p) => p.id === targetKey);
}

initScrollMapUI();
const deepIdx = resolveDeepLinkPlanetIndex();
if (deepIdx >= 0) {
  enterPlanet(deepIdx);
} else {
  setupTitleScene();
}
animate();

// 首帧 WebGL 星空就绪后柔和揭开绘本帷幕
requestAnimationFrame(() => {
  setTimeout(() => {
    const curtain = document.getElementById("boot-curtain");
    if (curtain) {
      curtain.classList.add("fade-out");
      setTimeout(() => curtain.remove(), 750);
    }
  }, 180);
});
