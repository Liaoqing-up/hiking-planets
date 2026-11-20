import * as THREE from "three";
import { PLANETS as MY_PLANETS } from "./data.js?v=4.0.0-r1";
import { KITTY_PLANETS, NEIGHBOR_PROFILES, RESONANCE_LINKS } from "./kittyUniverse.js?v=4.0.0-r1";
import { MIEMIE_PLANETS } from "./miemieUniverse.js?v=4.0.0-r1";
import {
  loadSocialState,
  saveSocialState,
  encodeGuestPlanetPayload,
  decodeGuestPlanetPayload,
  hydrateGuestPlanet,
  buildNeighborSocialRig,
  generateCoopSnapshotDataUrl,
  generateNeighborInviteCardDataUrl,
  encodeReplyLetter,
  decodeReplyLetter,
} from "./neighborSocial.js?v=4.0.0-r1";
import { sound } from "./audio.js?v=4.0.0-r1";
import { renderPlanetIllustration, renderPostcardScene } from "./planetArt2D.js?v=4.0.0-r1";
import {
  PLANET_RADIUS,
  latLonToUnitVec,
  getSurfaceRadius,
  buildPlanetWorld,
  buildHikerCharacter,
} from "./planetBuilder3D.js?v=4.0.0-r1";
import { buildPlanetCreature, CREATURE_CATALOG } from "./creatures3D.js?v=4.0.0-r1";
import { createSkyWonders } from "./skyWonders3D.js?v=4.0.0-r1";
import { buildManiCairn3D, loadManiNotes, addManiNote } from "./maniCairn.js?v=4.0.0-r1";
import { generateSummitTicketDataUrl, PLANET_SEAL_TITLE } from "./summitTicket.js?v=4.0.0-r1";
import { buildCampfireRig } from "./campfireRadio.js?v=4.0.0-r1";
import {
  buildHotpotRig,
  encodeFlagToken,
  decodeFlagToken,
  loadPlantedFlags,
  savePlantedFlag,
  buildFlagMesh,
  generateDuoFinisherCertDataUrl,
} from "./trailSocialExtras.js?v=4.0.0-r1";
import { createFootprintTrail } from "./footprints3D.js?v=4.0.0-r1";
import {
  renderCreaturePortrait,
  capturePhotoWallpaper,
  generateGrandPassportDataUrl,
  generatePostcardBookmarkDataUrl,
} from "./bestiaryAndExtras.js?v=4.0.0-r1";

const socialState = loadSocialState();
const guestPlanets = (socialState.customPlanets || []).map((raw) => hydrateGuestPlanet(raw));
const HOST_ROLE_KEY = "hiking_planets_host_role_v1";
function getPlanetsForUniverse(uni) {
  if (uni === "kitty") return [...KITTY_PLANETS];
  if (uni === "miemie") return [...MIEMIE_PLANETS];
  return [...MY_PLANETS, ...guestPlanets];
}

let activeHostRole = "mine";
try {
  const savedRole = localStorage.getItem(HOST_ROLE_KEY);
  if (savedRole === "kitty" || savedRole === "miemie") activeHostRole = savedRole;
} catch (_) {}
let currentUniverse = activeHostRole;
let PLANETS = getPlanetsForUniverse(currentUniverse);

function getAllKnownPlanets() {
  return [...MY_PLANETS, ...KITTY_PLANETS, ...MIEMIE_PLANETS, ...guestPlanets];
}

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
let activeNeighborRig = null;
let activeNeighborHostNear = false;
let activeResonanceNear = false;
let neighborModalOpen = false;
let resonanceModalOpen = false;
let creatorModalOpen = false;
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

let isAutoStroll = false;
let autoStrollWpIdx = 0;
let reelModalOpen = false;
let reelFrames = [];
let reelIndex = 0;
let reelTimer = null;

function isAnyModalOpen() {
  return (
    journalOpen ||
    maniModalOpen ||
    ticketModalOpen ||
    bestiaryModalOpen ||
    finaleModalOpen ||
    atlasModalOpen ||
    reelModalOpen ||
    neighborModalOpen ||
    resonanceModalOpen ||
    creatorModalOpen ||
    flagModalOpen
  );
}

let flagModalOpen = false;
let activePlantedFlagObjs = [];
let activePlantedFlagNear = null;
let pendingIncomingFlag = null;
const hotpotRig = buildHotpotRig();
scene.add(hotpotRig.group);

function disposeCurrentWorld() {
  clearGuideArc();
  clickRing.visible = false;
  isAutoStroll = false;
  document.getElementById("btn-auto-stroll")?.classList.remove("active");
  campfireRig.hide();
  hotpotRig.hide();
  activePlantedFlagObjs = [];
  activePlantedFlagNear = null;
  isCampfireMode = false;
  isTelescopeMode = false;
  activeSceneZone = null;
  sound.setSceneZone?.(null);
  activeCreature = null;
  activeSkyWonders = null;
  activeManiCairn = null;
  activeNeighborRig = null;
  activeNeighborHostNear = false;
  activeResonanceNear = false;
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

function applyHostRoleUI(role, rebuildScene = false) {
  activeHostRole = role === "kitty" ? "kitty" : role === "miemie" ? "miemie" : "mine";
  try {
    localStorage.setItem(HOST_ROLE_KEY, activeHostRole);
  } catch (_) {}

  document.querySelectorAll("#host-role-switcher .host-role-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.hostRole === activeHostRole);
  });

  const isKittyHost = activeHostRole === "kitty";
  const isMiemieHost = activeHostRole === "miemie";
  const presetNames = new Set(["", "清哥", "Kitty", "咩咩", "山海行者"]);
  if (presetNames.has((saveData.travelerName || "").trim())) {
    saveData.travelerName = isKittyHost ? "Kitty" : isMiemieHost ? "咩咩" : "清哥";
    const tInput = document.getElementById("ticket-traveler-input");
    if (tInput) tInput.value = saveData.travelerName;
    persistSave();
  }

  const eyebrow = document.getElementById("title-eyebrow-text");
  const heading = document.getElementById("title-main-heading");
  const poem = document.getElementById("title-main-poem");
  const startBtn = document.getElementById("btn-start-journey");
  const neighborBtn = document.getElementById("btn-visit-kitty-title");
  const miemieBtn = document.getElementById("btn-visit-miemie-title");
  if (eyebrow) {
    eyebrow.textContent = isKittyHost
      ? "KITTY AMONG THE STARS · 猫耳星云主场"
      : isMiemieHost
        ? "MIEMIE RISING · 绵羊星云主场"
        : "TRAILS AMONG THE STARS · 山海皆星辰";
  }
  if (heading) {
    heading.textContent = isKittyHost ? "Kitty 的星球" : isMiemieHost ? "咩咩的星球" : "行者的星球";
  }
  if (poem) {
    poem.textContent = isKittyHost
      ? "心里总有一座小五台，去追日落的最后八分钟，把长白天池、银河与山野小猫都凝成只属于 Kitty 的星球。"
      : isMiemieHost
        ? "喜欢没有信号的地方与未知；我有足够的力量背起大大的背包，从地心宇宙走到雪山垭口。"
        : "有些山川太过辽阔，记忆便把走过的每一段路，凝成了一颗只属于行者的星球。";
  }
  if (startBtn) {
    startBtn.textContent = isKittyHost
      ? "✦ 开启 Kitty 的 7 颗星球"
      : isMiemieHost
        ? "✦ 开启咩咩的 5 颗星球"
        : "✦ 点击 · 开始旅程";
  }
  if (neighborBtn) {
    neighborBtn.textContent = isKittyHost ? "🪐 串门 · 清哥的星球" : "🐾 串门 · Kitty 的星球";
  }
  if (miemieBtn) {
    miemieBtn.textContent = isMiemieHost ? "🪐 串门 · 清哥的星球" : "🐑 串门 · 咩咩的星球";
  }

  // 星图顶部切换 Tab 顺序与主次文案随当前登录星主动态反转！
  const switcher = document.getElementById("universe-switcher");
  const tabMine = switcher?.querySelector('.uni-tab[data-uni="mine"]');
  const tabKitty = switcher?.querySelector('.uni-tab[data-uni="kitty"]');
  const tabMiemie = switcher?.querySelector('.uni-tab[data-uni="miemie"]');
  const tabCreator = document.getElementById("btn-open-creator");
  if (tabMine && tabKitty && tabMiemie && switcher) {
    tabMine.textContent = activeHostRole === "mine" ? "🪐 我的星系" : "🪐 清哥的星系";
    tabKitty.textContent = isKittyHost ? "🐾 我的星系 (Kitty)" : "🐾 Kitty 的星系";
    tabMiemie.textContent = isMiemieHost ? "🐑 我的星系 (咩咩)" : "🐑 咩咩的星系";
    const order =
      isKittyHost ? [tabKitty, tabMine, tabMiemie] : isMiemieHost ? [tabMiemie, tabMine, tabKitty] : [tabMine, tabKitty, tabMiemie];
    order.forEach((t) => switcher.appendChild(t));
    if (tabCreator) switcher.appendChild(tabCreator);
  }

  document.title = isKittyHost
    ? "Kitty 的星球 · 猫耳星云 | TRAILS AMONG THE STARS"
    : isMiemieHost
      ? "咩咩的星球 · 咩星崛起 | TRAILS AMONG THE STARS"
      : "行者的星球 · 山海皆星辰 | TRAILS AMONG THE STARS";

  if (rebuildScene) {
    switchUniverse(activeHostRole);
    if (mode === "title") setupTitleScene();
  }
}

function setupTitleScene() {
  disposeCurrentWorld();
  activePlanet = null;
  skyPhase = "day";
  isNight = false;
  applyHostRoleUI(activeHostRole, false);
  const isKittyHost = activeHostRole === "kitty";
  const isMiemieHost = activeHostRole === "miemie";
  hiker.setOutfit(isKittyHost ? "kitty-host" : isMiemieHost ? "miemie-host" : "mine-host");
  hiker.setHeadlamp(false);
  sound.setPlanetBGM("space");

  const coverCfg = isKittyHost
    ? {
        id: "title",
        terrainType: "kitty-changbai",
        name: "猫耳起点星",
        palette: {
          halo: "#f9a8d4",
          low: "#4a7f5e",
          mid: "#6fa377",
          high: "#eef5ff",
          water: "#1a74d4",
          particle: "#fbcfe8",
        },
        waypoints: [],
      }
    : {
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
      };
  currentWorld = buildPlanetWorld(coverCfg);
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

const RESONANCE_CLUSTERS = [
  {
    ids: ["zhagana", "kitty-zhagana"],
    title: "甘南双星同频 · 措美峰与扎尕那",
    members: { mine: "zhagana", kitty: "kitty-zhagana" },
  },
  {
    ids: ["yili", "kitty-wusun"],
    title: "天山南北同频 · 伊犁与乌孙古道",
    members: { mine: "yili", kitty: "kitty-wusun" },
  },
  {
    ids: ["yading", "kitty-yading", "miemie-yading"],
    title: "川西双星同频 · 稻城亚丁三神山",
    members: { mine: "yading", kitty: "kitty-yading", miemie: "miemie-yading" },
  },
];

function hasResonanceWithActiveHost(planet) {
  if (!planet) return false;
  if ((planet.owner || "mine") === activeHostRole) return false;
  return RESONANCE_CLUSTERS.some((c) => c.ids.includes(planet.id) && Boolean(c.members[activeHostRole]));
}

const planetNodeEls = [];

function initScrollMapUI() {
  elPlanetGrid.innerHTML = "";
  elPlanetGrid.classList.toggle("grid-many-planets", PLANETS.length >= 7);
  planetNodeEls.length = 0;
  PLANETS.forEach((p, idx) => {
    const hasRes = hasResonanceWithActiveHost(p);
    const node = document.createElement("div");
    node.className = `planet-node${hasRes ? " has-resonance" : ""}`;
    node.setAttribute("role", "option");
    node.innerHTML = `
      <div class="planet-visual">
        <div class="planet-ring"></div>
        <canvas class="planet-thumb"></canvas>
        ${hasRes ? '<span class="resonance-badge-dot" title="跨宇宙双星同频">⚡同频</span>' : ""}
        <span class="planet-stamp">0/${p.waypoints.length}</span>
      </div>
      <div class="planet-node-label">${p.name}</div>
    `;
    const canvas = node.querySelector("canvas");
    renderPlanetIllustration(canvas, p.terrainType || p.id);

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

function switchUniverse(uniId, targetPlanetId = null) {
  currentUniverse = uniId === "kitty" ? "kitty" : uniId === "miemie" ? "miemie" : "mine";
  PLANETS = getPlanetsForUniverse(currentUniverse);
  document.querySelectorAll("#universe-switcher .uni-tab[data-uni]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.uni === currentUniverse);
  });
  const prof = NEIGHBOR_PROFILES[currentUniverse] || NEIGHBOR_PROFILES.mine;
  const headingEl = document.getElementById("scroll-heading");
  const subEl = document.getElementById("scroll-subtitle");
  const latinEl = document.getElementById("scroll-latin");
  if (headingEl) {
    headingEl.textContent =
      currentUniverse === "kitty"
        ? activeHostRole === "kitty" ? "Kitty 的山海旅程" : "Kitty 的猫耳星云"
        : currentUniverse === "miemie"
          ? activeHostRole === "miemie" ? "咩咩的山海旅程" : "咩咩的绵羊星云"
          : activeHostRole === "mine" ? "行 者 的 旅 程" : "邻居 · 清哥的星系";
  }
  if (latinEl) {
    latinEl.textContent =
      currentUniverse === "kitty"
        ? "KITTY'S STARRY TRAILS · UNIVERSE K"
        : currentUniverse === "miemie"
          ? "MIEMIE RISING · UNIVERSE M"
          : "LE VOYAGE DU RANDONNEUR · UNIVERSE A";
  }
  if (subEl) {
    subEl.textContent =
      currentUniverse === activeHostRole
        ? prof.motto
        : currentUniverse === "kitty"
          ? "欢迎串门！这是好朋友 Kitty 走过的七颗山海星球与偶遇的小生灵"
          : currentUniverse === "miemie"
            ? "欢迎串门！这是好朋友咩咩从贵州安顺地心秘境走到亚丁重装反穿的五颗星球"
            : "欢迎串门！这是好朋友清哥走过的六座山海星球";
  }
  initScrollMapUI();
  if (targetPlanetId) {
    const idx = PLANETS.findIndex((x) => x.id === targetPlanetId);
    if (idx >= 0) selectMapPlanet(idx);
  }
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

  // 更新全星系总印记进度、生灵图集计数与终章手札解锁状态
  const totalWp = PLANETS.reduce((s, p) => s + p.waypoints.length, 0);
  const doneWp = PLANETS.reduce((s, p) => s + getDiscoveredSet(p.id).size, 0);
  const planetIdsSet = new Set(PLANETS.map((p) => p.id));
  const creatureCount = (saveData.creatures || []).filter((cid) => planetIdsSet.has(cid)).length;
  const totalEl = document.getElementById("scroll-total-progress");
  if (totalEl) {
    totalEl.textContent = `✦ 星系印记 ${doneWp} / ${totalWp}`;
    totalEl.title = `点击翻阅 ${totalWp} 处星系印记明信片总图集`;
  }
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
  const resBtn = document.getElementById("btn-map-resonance");
  if (resBtn) {
    const hasRes = hasResonanceWithActiveHost(p);
    resBtn.classList.toggle("hidden", !hasRes);
    if (hasRes) resBtn.textContent = "⚡ 双星同频共鸣";
  }
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
  const planetOwner = p.owner || "mine";
  // 三位星主去别人星球串门时均保持各自招牌穿搭；在自己星球则换上对应路线的冲锋衣与帽饰
  const hostOutfit =
    activeHostRole === "kitty" && planetOwner !== "kitty"
      ? "kitty-host"
      : activeHostRole === "miemie" && planetOwner !== "miemie"
        ? "miemie-host"
        : activeHostRole === "mine" && planetOwner !== "mine"
          ? "mine-host"
          : p.id;
  hiker.setOutfit(hostOutfit);
  // 「银河与日落八分钟」默认开启紫金暮色；「麝香洞·地心宇宙」默认进入幽蓝地心星夜并点亮探洞头灯！
  if (p.id === "kitty-sunset") {
    skyPhase = "dusk";
    isNight = false;
  } else if (p.id === "miemie-shexiang") {
    skyPhase = "night";
    isNight = true;
    setTimeout(() => {
      if (activePlanet?.id === "miemie-shexiang") {
        showWonderToast("🔦 已步入麝香洞 · 地心宇宙穹顶，探洞头灯与幽蓝萤光已为你点亮", 4200);
      }
    }, 900);
  }

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

  // V4.2 双星主自适应迎宾实体 (邻居主人3D角色 + 发光星际漂流瓶 + 跨宇宙双星同频水晶碑)
  const resPayload = hasResonanceWithActiveHost(p) ? RESONANCE_LINKS[p.id] || { partnerId: activeHostRole } : null;
  activeNeighborRig = buildNeighborSocialRig(p, resPayload, activeHostRole);
  currentWorld.group.add(activeNeighborRig.group);
  activePlantedFlagObjs = loadPlantedFlags(p.id).map((fl) => {
    const obj = buildFlagMesh(p.id, fl);
    currentWorld.group.add(obj.group);
    return obj;
  });
  pendingHostAction = null;
  document.getElementById("companion-follow-pill")?.classList.add("hidden");
  document.getElementById("host-action-popover")?.classList.add("hidden");
  const hubBtn = document.getElementById("btn-neighbor-hub");
  if (hubBtn) {
    hubBtn.textContent = "🍾 漂流瓶";
  }
  hideCompanionBubble();
  syncBottleUnreadBeacon();
  maybeShowFirstLandGuide();
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
  currentWorld.refreshTrailLoop?.(disc);
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

  // V4.2 右上角导航栏新增「找星主 / 并肩同行」一键自动寻路胶囊
  if (activeNeighborRig?.isNeighborPlanet && activeNeighborRig.hostChar) {
    const hostBtn = document.createElement("button");
    hostBtn.type = "button";
    hostBtn.id = "btn-wp-find-host";
    const resRole = activeNeighborRig.residentRole;
    const resLabel = resRole === "kitty" ? "Kitty" : resRole === "miemie" ? "咩咩" : "星主";
    const resIcon = resRole === "kitty" ? "🐾" : resRole === "miemie" ? "🐑" : "🏔️";
    const following = activeNeighborRig.isFollowing;
    hostBtn.className = `wp-pill wp-chip wp-host-nav ${following ? "following" : ""}`;
    hostBtn.textContent = following ? `🤝 与${resLabel}同行中` : `${resIcon} 导航 · 找${resLabel}`;
    hostBtn.title = "点击自动导航行走到星球伙伴身旁并开启互动";
    hostBtn.addEventListener("click", () => {
      navigateToHostAndOpenMenu(hostBtn);
      sound.init();
      sound.playHover();
    });
    elHudWaypoints.appendChild(hostBtn);
  }
}

function toggleAutoStroll(force) {
  if (mode !== "planet" || !activePlanet || !currentWorld?.waypointObjs?.length) return;
  isAutoStroll = typeof force === "boolean" ? force : !isAutoStroll;
  if (isAutoStroll && isCampfireMode) toggleCampfireMode(false);
  document.getElementById("btn-auto-stroll")?.classList.toggle("active", isAutoStroll);
  if (isAutoStroll) {
    // 选取前方最近的下一个路标作为环山漫巡起点
    let bestIdx = 0;
    let bestAng = 999;
    currentWorld.waypointObjs.forEach((w, idx) => {
      const a = playerUp.angleTo(w.unitDir);
      if (a > 0.12 && a < bestAng) {
        bestAng = a;
        bestIdx = idx;
      }
    });
    autoStrollWpIdx = bestIdx;
    showWonderToast("🥾 已开启「环山自动漫巡」· 轻推摇杆或按键即可随时接管", 3000);
    sound.init();
    sound.playHover();
  } else {
    walkTargetDir = null;
    clickRing.visible = false;
  }
}

// ==================== LIGHTING (晨曦 → 暮色 → 星夜 三态流转) & SHORTCUTS ====================
function cycleSkyPhase() {
  skyPhase = skyPhase === "day" ? "dusk" : skyPhase === "dusk" ? "night" : "day";
  isNight = skyPhase === "night";
  applyLightingTheme(false);
  const pid = activePlanet?.id;
  const alpenglow =
    skyPhase === "dusk" && (pid === "yading" || pid === "siguniang" || pid === "zhagana" || pid === "yili")
      ? " · 雪巅泛起日照金山"
      : "";
  const blueTears =
    skyPhase === "night" && pid === "maclehose" ? " · 海湾泛起蓝眼泪荧光浪" : "";
  const labelMap = {
    day: "☀ 当前天光：清朗晨曦",
    dusk: `🌇 当前天光：紫金暮色${alpenglow}`,
    night: `☾ 当前天光：极光星夜 · 头灯已点亮${blueTears}`,
  };
  showWonderToast(labelMap[skyPhase], 2800);
}

function applyLightingTheme(immediate = false) {
  const pal = activePlanet ? activePlanet.palette : { skyDay: "#0a1228", skyNight: "#060918" };
  let bgHex = pal.skyDay || "#101a36";
  if (skyPhase === "night") bgHex = pal.skyNight || "#060918";
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
  } else if (activePlanet?.id === "miemie-shexiang") {
    // 麝香洞专属深渊青蓝萤光穹顶天光
    hemiLight.color.set("#38bdf8");
    hemiLight.groundColor.set("#082f49");
    hemiLight.intensity = 0.62;
    sunLight.intensity = 0.68;
    sunLight.color.set("#67e8f9");
  } else {
    hemiLight.color.set("#9db8ff");
    hemiLight.groundColor.set("#1b2540");
    hemiLight.intensity = 0.42;
    sunLight.intensity = 0.52;
    sunLight.color.set("#8fb8ff");
  }
  hiker.setHeadlamp(skyPhase === "night" && mode === "planet");
  currentWorld?.setMicroclimate?.(skyPhase);

  const nightBtn = document.getElementById("btn-toggle-night");
  if (nightBtn) {
    const btnText =
      skyPhase === "day"
        ? `☀ 晨曦 <kbd>L</kbd>`
        : skyPhase === "dusk"
          ? `🌇 暮色 <kbd>L</kbd>`
          : `☾ 星夜 <kbd>L</kbd>`;
    nightBtn.innerHTML = btnText;
  }
}

const PHOTO_PRESETS = [
  { label: "🎞️ 机位 · 近景旅拍", pitch: 0.44, dist: 7.6 },
  { label: "🎞️ 机位 · 星球全景", pitch: 0.32, dist: 48.0 },
  { label: "🎞️ 机位 · 仰望星海", pitch: 0.14, dist: 11.4 },
];
let photoPresetIdx = 0;

function cyclePhotoPreset() {
  photoPresetIdx = (photoPresetIdx + 1) % PHOTO_PRESETS.length;
  const preset = PHOTO_PRESETS[photoPresetIdx];
  camPitch = preset.pitch;
  camDist = preset.dist;
  const btn = document.getElementById("btn-photo-preset");
  if (btn) btn.textContent = preset.label;
  sound.init();
  sound.playHover();
}

function togglePhotoMode(force) {
  isPhotoMode = typeof force === "boolean" ? force : !isPhotoMode;
  document.body.classList.toggle("photo-mode", isPhotoMode);
  document.getElementById("photo-mode-bar")?.classList.toggle("hidden", !isPhotoMode);
  if (isPhotoMode) {
    clickRing.visible = false;
    if (guideArcLine) guideArcLine.visible = false;
  } else {
    // 退出留影模式时立即恢复舒适的初始标准徒步视角（告别全景残留）
    photoPresetIdx = 0;
    camPitch = 0.56;
    camDist = 11.0;
    const presetBtn = document.getElementById("btn-photo-preset");
    if (presetBtn) presetBtn.textContent = PHOTO_PRESETS[0].label;
    if (guideArcLine) guideArcLine.visible = true;
  }
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
  if (currentTicketContext.type === "finisher" && activePlanet) {
    const hostLabel = getResidentPartnerName();
    dataUrl = generateDuoFinisherCertDataUrl(activePlanet, hostLabel, traveler, saveData.steps || 88);
    fileName = `并肩完赛荣誉证-${activePlanet.name}-${hostLabel}x${traveler}.png`;
    modalTitle = `🏅 《${activePlanet.name}》双人并肩完赛证`;
    modalSub = `✦ ${hostLabel} × ${traveler} 全路标并肩打卡达成 · 长按或下载珍藏`;
  } else if (currentTicketContext.type === "summit" && activePlanet) {
    const discSet = getDiscoveredSet(activePlanet.id);
    const compName = activeNeighborRig?.isFollowing ? getResidentPartnerName() : "";
    dataUrl = await generateSummitTicketDataUrl(activePlanet, discSet, saveData.steps || 0, traveler, {
      hostRole: activeHostRole,
      companionName: compName,
    });
    const brandPrefix =
      activeHostRole === "kitty" ? "Kitty的星球" : activeHostRole === "miemie" ? "咩咩的星球" : "行者的星球";
    fileName = `${brandPrefix}-${activePlanet.name}-登顶纪念票根.png`;
    modalTitle = `${activePlanet.name} · 纪念票根`;
    modalSub = compName
      ? `✦ 与 ${compName} 并肩同行登顶  ·  已点亮 ${discSet.size} / ${activePlanet.waypoints.length} 处印记`
      : `已点亮 ${discSet.size} / ${activePlanet.waypoints.length} 处山海印记 · 支持烫金印签`;
  } else if (currentTicketContext.type === "passport") {
    const passUni = currentUniverse || activeHostRole;
    const passPlanets =
      passUni === "kitty" ? KITTY_PLANETS : passUni === "miemie" ? MIEMIE_PLANETS : CORE_MINE_PLANETS;
    const totalPassWp = passPlanets.reduce((s, p) => s + p.waypoints.length, 0);
    dataUrl = generateGrandPassportDataUrl(passPlanets, saveData, traveler, passUni);
    fileName = `${
      passUni === "kitty"
        ? "Kitty的星球-猫耳星云七星护照"
        : passUni === "miemie"
          ? "咩咩的星球-绵羊星云五星护照"
          : "行者的星球-全星系大满贯荣誉护照"
    }.png`;
    modalTitle =
      passUni === "kitty"
        ? "🐾 猫耳星云 · 七星全满贯护照"
        : passUni === "miemie"
          ? "🐑 绵羊星云 · 五星全满贯护照"
          : "全星系大满贯荣誉护照";
    modalSub = `${totalPassWp} / ${totalPassWp} 处山海印记全境穿越达成典藏`;
  } else if (currentTicketContext.type === "wallpaper" && currentTicketContext.snapCanvas) {
    dataUrl = capturePhotoWallpaper(
      currentTicketContext.snapCanvas,
      currentTicketContext.planetName,
      currentTicketContext.altText,
      traveler,
      activeHostRole
    );
    const wpBrand =
      activeHostRole === "kitty" ? "Kitty的星球" : activeHostRole === "miemie" ? "咩咩的星球" : "行者的星球";
    fileName = `${wpBrand}-${currentTicketContext.planetName}-留影壁纸.png`;
    modalTitle = `${currentTicketContext.planetName} · 留影壁纸`;
    modalSub = "拍立得星海锁屏纪念壁纸 · 可印上旅人署名";
  } else if (currentTicketContext.type === "bookmark" && currentTicketContext.planet && currentTicketContext.wp) {
    dataUrl = await generatePostcardBookmarkDataUrl(
      currentTicketContext.planet,
      currentTicketContext.wp,
      traveler,
      activeHostRole
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
  const uniCatalog = CREATURE_CATALOG.filter((c) =>
    currentUniverse === "kitty"
      ? c.owner === "kitty"
      : currentUniverse === "miemie"
        ? c.owner === "miemie"
        : !c.owner
  );
  grid.innerHTML = "";
  uniCatalog.forEach((item) => {
    const unlocked = metSet.has(item.planetId);
    const card = document.createElement("div");
    card.className = `bestiary-card ${unlocked ? "unlocked" : "locked"}`;
    const c = document.createElement("canvas");
    renderCreaturePortrait(c, item.planetId, unlocked);
    const title = document.createElement("div");
    title.className = "bestiary-name";
    title.textContent = unlocked ? `${item.emoji} ${item.name}` : "✧ 尚未邂逅的山野小生灵";
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
  if (atlasFilterPlanetId !== "all" && !PLANETS.some((p) => p.id === atlasFilterPlanetId)) {
    atlasFilterPlanetId = "all";
  }
  const atlasTitleEl = document.getElementById("atlas-title");
  if (atlasTitleEl) {
    atlasTitleEl.textContent =
      currentUniverse === "kitty"
        ? `猫耳星云 · ${totalWp} 帧山海印记`
        : currentUniverse === "miemie"
          ? `绵羊星云 · ${totalWp} 帧山海印记`
          : `山海 · ${totalWp} 帧星辰印记`;
  }

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
        thumb.classList.add("is-uncharted");
        thumb.style.setProperty("--orb-glow", p.palette?.halo || "#f0c768");
        thumb.innerHTML = `
          <svg class="uncharted-emblem" viewBox="0 0 120 90" aria-hidden="true">
            <circle cx="24" cy="20" r="1.1" fill="currentColor" opacity="0.55"/>
            <circle cx="96" cy="24" r="1.3" fill="currentColor" opacity="0.65"/>
            <circle cx="88" cy="68" r="1" fill="currentColor" opacity="0.45"/>
            <circle cx="30" cy="66" r="1.2" fill="currentColor" opacity="0.5"/>
            <circle class="emblem-orbit" cx="60" cy="43" r="28" fill="none" stroke="currentColor" stroke-width="1.1" stroke-dasharray="3.2 3.2" opacity="0.62"/>
            <circle cx="60" cy="43" r="22" fill="none" stroke="currentColor" stroke-width="1.25" opacity="0.82"/>
            <ellipse cx="60" cy="43" rx="33" ry="10.5" transform="rotate(-16 60 43)" fill="none" stroke="currentColor" stroke-width="1" opacity="0.48"/>
            <path d="M43 53 L54 36 L61 45 L67 38 L77 53 Z" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="1.35" stroke-linejoin="round"/>
            <path d="M60 22 L62.1 27.9 L68 30 L62.1 32.1 L60 38 L57.9 32.1 L52 30 L57.9 27.9 Z" fill="currentColor"/>
          </svg>
          <span class="uncharted-tag">✦ 星轨待寻</span>
        `;
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

function renderReelFrame() {
  if (!reelFrames.length) return;
  const item = reelFrames[reelIndex];
  const pad = (n) => String(n).padStart(2, "0");
  document.getElementById("reel-counter").textContent = `✦ ${pad(reelIndex + 1)} / ${pad(reelFrames.length)}`;
  document.getElementById("reel-planet-badge").textContent = `${item.planetName} · ${item.elevation}`;
  document.getElementById("reel-photo").src = item.photo;
  document.getElementById("reel-title").textContent = item.title;
  document.getElementById("reel-quote").textContent = item.text;
}

function restartReelTimer() {
  if (reelTimer) clearInterval(reelTimer);
  reelTimer = setInterval(() => {
    reelIndex = (reelIndex + 1) % reelFrames.length;
    renderReelFrame();
  }, 5200);
  const btn = document.getElementById("btn-reel-toggle");
  if (btn) {
    btn.classList.add("active");
    btn.textContent = "⏸ 暂停自动播映";
  }
}

function openMemoryReel() {
  reelFrames = [];
  const targetPlanets =
    atlasFilterPlanetId === "all"
      ? PLANETS
      : PLANETS.filter((p) => p.id === atlasFilterPlanetId);
  targetPlanets.forEach((p) => {
    const disc = getDiscoveredSet(p.id);
    p.waypoints.forEach((wp) => {
      if (!disc.has(wp.id)) return;
      if (wp.photo) {
        reelFrames.push({
          planetName: p.name,
          elevation: wp.elevation,
          photo: wp.photo,
          title: `${wp.name} · 绘本诗笺`,
          text: wp.poem,
        });
      }
      if (wp.photo2 && wp.memory) {
        reelFrames.push({
          planetName: p.name,
          elevation: wp.elevation,
          photo: wp.photo2,
          title: `${wp.name} · 旅途故事`,
          text: wp.memory,
        });
      }
    });
  });
  if (!reelFrames.length) {
    showWonderToast("✦ 先在星球上点亮至少 1 处明信片印记，即可开启旅途胶片放映！");
    return;
  }
  closeAtlasModal();
  reelIndex = 0;
  reelModalOpen = true;
  ensureHistoryGuard();
  renderReelFrame();
  document.getElementById("modal-reel")?.classList.remove("hidden");
  restartReelTimer();
  sound.init();
  sound.playHover();
  trackEvent("开启旅途胶片放映", { frames: reelFrames.length });
}

function closeMemoryReel() {
  reelModalOpen = false;
  if (reelTimer) {
    clearInterval(reelTimer);
    reelTimer = null;
  }
  document.getElementById("modal-reel")?.classList.add("hidden");
}

function stepMemoryReel(delta) {
  if (!reelFrames.length) return;
  reelIndex = (reelIndex + delta + reelFrames.length) % reelFrames.length;
  renderReelFrame();
  if (reelTimer) restartReelTimer();
}

function toggleMemoryReelPlay() {
  const btn = document.getElementById("btn-reel-toggle");
  if (reelTimer) {
    clearInterval(reelTimer);
    reelTimer = null;
    if (btn) {
      btn.classList.remove("active");
      btn.textContent = "▶ 继续自动播映";
    }
  } else {
    restartReelTimer();
  }
}

function getUnlockedPlanetWaypoints(planet) {
  if (!planet) return [];
  const disc = getDiscoveredSet(planet.id);
  return planet.waypoints.filter((w) => disc.has(w.id));
}

function syncJournalSiblingNav() {
  const unlocked = getUnlockedPlanetWaypoints(currentJournalPlanet);
  const showNav = unlocked.length >= 2;
  document.getElementById("btn-prev-postcard")?.classList.toggle("hidden", !showNav);
  document.getElementById("btn-next-postcard")?.classList.toggle("hidden", !showNav);
}

function stepSiblingPostcard(delta) {
  if (!currentJournalPlanet || !currentJournalWp) return false;
  const unlocked = getUnlockedPlanetWaypoints(currentJournalPlanet);
  if (unlocked.length < 2) return false;
  const curIdx = unlocked.findIndex((w) => w.id === currentJournalWp.id);
  const nextIdx = ((curIdx >= 0 ? curIdx : 0) + delta + unlocked.length) % unlocked.length;
  openReadOnlyJournal(currentJournalPlanet, unlocked[nextIdx]);
  return true;
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
  syncJournalSiblingNav();
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
  const modal = document.getElementById("modal-finale");
  if (modal) {
    const totalWp = PLANETS.reduce((s, p) => s + p.waypoints.length, 0);
    const eyeEl = modal.querySelector(".finale-eyebrow");
    const bodyEl = modal.querySelector(".finale-body");
    const passBtn = document.getElementById("btn-generate-passport");
    if (eyeEl) eyeEl.textContent = `✦ ALL ${totalWp} STARLIGHT TRAILS COMPLETED ✦`;
    if (bodyEl) {
      if (currentUniverse === "kitty") {
        bodyEl.innerHTML = `<p>真没想到，你竟然耐心地走完了猫耳星云七颗星球上的全部 ${totalWp} 个角落。</p><p>从小五台的金莲花与山野小猫、追日落的最后八分钟、长白天池的风散云开，到扎尕那云雾、大青山露营、重装翻越乌孙古道与亚丁栈道上的小松鼠——每一段奔赴山海的滚烫热爱，都在这片星空里闪闪发光。</p><p>谢谢你来 Kitty 的宇宙吹风散步。愿我们永远保有去见那座山的勇气✨</p>`;
      } else if (currentUniverse === "miemie") {
        bodyEl.innerHTML = `<p>真没想到，你竟然耐心地走完了绵羊星云五颗星球上的全部 ${totalWp} 个角落。</p><p>从铜鼓荡黑石草甸与牛倒岩地心瀑布、龙脊天路的人间塞尔达、麝香洞幽蓝地心宇宙、千年布依古寨与猫跳峡，到七人六天五晚自主重装反穿亚丁的无信号营地——原来我们都有足够的力量，背起大大的背包走过未知。</p><p>谢谢你来咩咩的宇宙探秘吹风。路线不止一条，而我们都在路上✨</p>`;
      } else {
        bodyEl.innerHTML = `<p>真没想到，你竟然耐心地走完了这 ${PLANETS.length} 颗星球上的全部 ${totalWp} 个角落。</p><p>从腾格里的夜空烟花、亚丁风雪夜死守的帐篷、扎尕那十一个垭口的白雪，到等了四年的大峰 5025 米石碑、咸田湾的海浪日出，还有伊犁升起的那轮黄月亮——这些原本只属于山野失联时刻的记忆，因为你的驻足，在星空里重新亮起了一遍。</p><p>谢谢你来我的宇宙吹风散步。山海未完，愿我们在下一座没有天花板的旷野重逢✨</p>`;
      }
    }
    if (passBtn) {
      passBtn.textContent =
        currentUniverse === "kitty"
          ? "🏆 签发猫耳星云七星护照"
          : currentUniverse === "miemie"
            ? "🏆 签发绵羊星云五星护照"
            : "🏆 签发全星系大满贯护照";
    }
    modal.classList.remove("hidden");
  }
  sound.init();
  sound.playDiscoverWaypoint(true);
  trackEvent("拆阅全满贯终章手札", { universe: currentUniverse });
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
  if (activeNeighborRig?.isFollowing) {
    activeNeighborRig.celebrateWaypoint?.(playerUp);
    hiker.triggerEmote("cheer", 2.0);
    showCompanionBubble(`🎉 太棒啦！陪你一起打卡「${wpObj.data.shortName || wpObj.data.name}」✨`, 3600);
  }

  const nowAllDone = list.length >= activePlanet.waypoints.length;
  sound.playDiscoverWaypoint(nowAllDone && !wasAlreadyAllDone);

  document.getElementById("journal-chapter").textContent = `${activePlanet.name} · 行者明信片`;
  document.getElementById("journal-title").textContent = wpObj.data.name;
  document.getElementById("journal-elevation").textContent = `${wpObj.data.elevation}`;
  renderJournalTextPage();
  document.getElementById("journal-progress").textContent = `当前星球印记收集：${list.length} / ${activePlanet.waypoints.length}`;
  syncJournalSiblingNav();

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
        `🏆 ${doneWp}/${totalWp} 全境穿越达成！已为你解锁《终章手札》`;
    } else {
      const sealWord = PLANET_SEAL_TITLE[activePlanet.id] || "穿越成功";
      document.getElementById("banner-complete-text").textContent = `✦ ${sealWord} · 已集齐「${activePlanet.name}」全部印记 · 可领取纪念票根`;
    }
    banner.classList.remove("hidden");
    setTimeout(() => banner.classList.add("hidden"), 6500);
    if (activeNeighborRig?.isFollowing) {
      setTimeout(() => triggerDuoFinisherCeremony(true), 900);
    }
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
  const wind = Number(document.getElementById("mix-wind")?.value ?? 50) / 100;
  const nature = Number(document.getElementById("mix-nature")?.value ?? 45) / 100;
  const music = Number(document.getElementById("mix-music")?.value ?? 70) / 100;
  sound.setCampfireMix({ active: isCampfireMode, fire, wind, nature, music });
}

const CAMPFIRE_STORIES = {
  tengger: [
    "沙脊在夜色里凉下来了，躺平抬头，整条银河就像直接倒进腾格里的沙海里。",
    "白天踩过的每一道滚烫沙梁，到了篝火边都变成了下酒的故事。",
  ],
  yading: [
    "三神山隐进深蓝星幕，四千九百米的垭口风声里，呼吸和心跳都格外清晰。",
    "牛奶海与五色海的蓝还在眼底发亮，喝口热茶，明天继续转山。",
  ],
  zhagana: [
    "措美峰的风雪留在身后，扎尕那木屋顶上的炊烟和我们的篝火连成了一片。",
    "走过乱石垭口才懂，山谷深处的这一小团暖火有多珍贵。",
  ],
  siguniang: [
    "五千米的星光离头顶好近，垭口玛尼堆上的风马旗正替行者把心愿吹向远方。",
    "从长坪沟到毕棚沟，雪山不说话，却把每一步坚持都记了下来。",
  ],
  maclehose: [
    "海浪拍着西贡的白沙滩，咸湿海风混着柴火香，这是属于山海行者的夜。",
    "远处的海面泛着幽蓝微光，百里麦径的疲惫都被海浪轻轻抚平了。",
  ],
  yili: [
    "赛里木湖的蓝与琼库什台的云杉林在夜风里摇晃，天山脚下的夏夜长乐未央。",
    "大海道的戈壁星辰辽阔无边，仿佛整颗星球只剩下风声与跳动的火苗。",
  ],
  "kitty-xiaowutai": [
    "心里总有一座山，吹着太行屋脊清冽的夜风，连金莲花都在星光下轻轻摇晃。",
    "白天在西台偶遇的小橘猫不知睡了没，愿每一个奔赴山野的人都有好梦。",
  ],
  "kitty-sunset": [
    "追完日落的最后八分钟，晚霞退成深紫星海，大风车在银河下慢慢旋转。",
    "白昼与星夜交界的温柔时刻，幸好有这堆篝火把浪漫再延长一点。",
  ],
  "kitty-changbai": [
    "火山口的天池在星夜里静得像一块蓝宝石，林间偶尔传来梅花鹿踩过松针的轻响。",
    "等一场风散云开看见天池全貌，是长白山送给行者最浪漫的礼物。",
  ],
  "kitty-zhagana": [
    "云雾绕着藏寨石城，篝火噼啪作响，甘南的夏夜凉爽得让人不想睡去。",
    "翻过高山草甸与峡谷栈道，把满眼绿意都烘进今晚的热茶里。",
  ],
  "kitty-daqing": [
    "在云端草甸扎下营帐，草浪翻涌到脚边，伸手仿佛就能触到低垂的星辰。",
    "帐篷外的篝火暖融融的，这大概就是山野露营最治愈的瞬间。",
  ],
  "kitty-wusun": [
    "跨过冰河、翻过达坂，重装徒步后的这一杯篝火热茶，胜过世间万千滋味。",
    "天山深处没有喧嚣，只有雪峰月色与并肩走过古道的滚烫回响。",
  ],
  "kitty-yading": [
    "秋色里的彩林与雪山在夜幕下安静睡去，白天栈道上的小松鼠一定也藏好了松果。",
    "高海拔的星空清澈透明，每一颗星都在替三神山守护赶路的人。",
  ],
  "miemie-tonggudang": [
    "黑石林与绿草甸在夜风里安静下来，白天漫山闲步的牛马羊也回栏歇息了。",
    "洞外是铜鼓荡的青绿牧歌，洞内是牛倒岩的地心飞瀑，贵州的山水藏着太多惊喜。",
  ],
  "miemie-longji": [
    "走过巨龙脊背般的刀锋天路，夜里围炉回想，仍像闯进了一场人间塞尔达传说。",
    "第四纪冰川留下的大地之眼映着星光，亿万年的时光在篝火边静静流淌。",
  ],
  "miemie-shexiang": [
    "关掉头灯小憩片刻，麝香洞的幽蓝穹顶与萤光石笋，就像置身真正的地心宇宙。",
    "水滴从钟乳石尖落入暗河，叮咚回响，奏出地心深处最空灵的夜曲。",
  ],
  "miemie-buyi": [
    "石瓦、石墙、石巷在月色下温润如玉，千年布依古寨正翻开它安静的夜晚篇章。",
    "猫跳峡的哗哗水声顺风飘来，烤着火听古老传说，山野岁月格外温柔。",
  ],
  "miemie-yading": [
    "我喜欢没有信号的地方，每天一个小目标——今晚平安抵达营地、围着火堆就足够了。",
    "卸下大大的重装背包才发现，原来自己有足够的力量走过未知，而我们还在路上。",
  ],
};
let campStoryIdx = 0;

function refreshCampfireStoryUI(advance = false) {
  const pid = activePlanet?.id || "tengger";
  const pool = CAMPFIRE_STORIES[pid] || CAMPFIRE_STORIES.tengger;
  if (advance) campStoryIdx = (campStoryIdx + 1) % pool.length;
  else campStoryIdx = campStoryIdx % pool.length;
  const textEl = document.getElementById("campfire-story-text");
  if (textEl) textEl.textContent = `“${pool[campStoryIdx]}”`;
  const titleEl = document.getElementById("campfire-header-title");
  if (titleEl) {
    titleEl.textContent = activeNeighborRig?.isFollowing
      ? `🔥 正与 ${getResidentPartnerName()} 并排围炉烤火 · 听风夜话`
      : `🔥 ${activePlanet?.name || "营地"} · 围炉夜话电台`;
  }
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
    hotpotRig.hide();
    campfireRig.placeInFrontOfHiker(playerUp, playerForward, hiker.root.position, activePlanet.owner || "mine");
    refreshCampfireStoryUI(false);
    syncCampfireAudio();
    if (activeNeighborRig?.isFollowing) {
      const line = activeNeighborRig.pickCampfireLine?.();
      if (line) showCompanionBubble(line, 4600);
      showWonderToast(`⛺ 已搭起暖光星空帐篷 · 与 ${getResidentPartnerName()} 并排围炉夜话`);
    } else {
      showWonderToast("⛺ 已在篝火畔支起暖光星空帐篷 · 可切换夜话或调节混音");
    }
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
  if (reelModalOpen) {
    if (e.code === "Escape") closeMemoryReel();
    else if (e.code === "ArrowRight") stepMemoryReel(1);
    else if (e.code === "ArrowLeft") stepMemoryReel(-1);
    else if (e.code === "Space") {
      e.preventDefault();
      toggleMemoryReelPlay();
    }
    return;
  }
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
    if (e.code === "Tab") {
      e.preventDefault();
      flipJournalPage();
    } else if (e.code === "ArrowRight") {
      e.preventDefault();
      if (!stepSiblingPostcard(1)) flipJournalPage();
    } else if (e.code === "ArrowLeft") {
      e.preventDefault();
      if (!stepSiblingPostcard(-1)) flipJournalPage();
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
    if (flagModalOpen) {
      if (e.code === "Escape") closeFlagModal();
      return;
    }
    if (maniModalOpen) {
      if (e.code === "Escape") closeManiModal();
      return;
    }
    if (e.code === "KeyE" && activeWaypointNear) {
      openWaypointJournal(activeWaypointNear);
    } else if (e.code === "KeyE" && activeManiNear) {
      openManiModal();
    } else if (e.code === "KeyE" && activePlantedFlagNear) {
      openFlagModal(activePlantedFlagNear.data);
    } else if (e.code === "KeyE" && activeNeighborHostNear) {
      openNeighborHubModal();
    } else if (e.code === "KeyE" && activeResonanceNear) {
      openResonanceModal(activePlanet?.id);
    } else if (e.code === "KeyF") {
      openFlagModal(null);
    } else if (e.code === "KeyN") {
      openNeighborHubModal();
    } else if (e.code === "KeyG") {
      openAtlasModal();
    } else if (e.code === "KeyB") {
      openBestiaryModal();
    } else if (e.code === "KeyR") {
      toggleAutoStroll();
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
      const maxZoom = isPhotoMode ? 58 : 48;
      camDist = THREE.MathUtils.clamp(camDist + delta * 0.038, 6.2, maxZoom);
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
      if (!clickable && activeNeighborRig) {
        const objs = [
          activeNeighborRig.hostChar?.root,
          activeNeighborRig.bottleGroup,
          activeNeighborRig.resonanceGroup,
        ].filter(Boolean);
        if (objs.length && raycaster.intersectObjects(objs, true).length > 0) {
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

    // 1.5 检测是否点中了划过天际的流星（《小王子》星辰许愿彩蛋）
    if (activeSkyWonders?.pickActiveMeteor?.(raycaster)) {
      const WISH_QUOTES = [
        "🌠 你接住了一颗流星：“夜晚仰望星空时，每一颗星星都会向你微笑。”",
        "🌠 流星划过山脊：“真正重要的东西，用眼睛是看不见的，要用心去寻觅。”",
        "🌠 星尘落在肩头：“愿你走过的每一道垭口，都化作照亮归途的星辰。”",
      ];
      sound.init();
      sound.playWishStar();
      triggerHaptic(18);
      showWonderToast(WISH_QUOTES[Math.floor(Math.random() * WISH_QUOTES.length)], 4000);
      return;
    }

    // 1.8 检测是否轻触了身边的山野小生灵（摸头欢跳 + 飘起星芒 + 行者挥手回应）
    if (activeCreature?.group) {
      const petHits = raycaster.intersectObject(activeCreature.group, true);
      if (petHits.length > 0) {
        const line = activeCreature.pet();
        hiker.triggerWave();
        sound.init();
        sound.playPetChime();
        triggerHaptic(14);
        showWonderToast(line, 3400);
        if (!saveData.creatures?.includes(activePlanet.id)) {
          saveData.creatures = [...(saveData.creatures || []), activePlanet.id];
          persistSave();
        }
        return;
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

    // 2.2 检测是否点击了星球主人 / 同行伙伴 / 星际漂流瓶 / 双星同频碑 / 主角自己
    if (activeNeighborRig) {
      if (
        activeNeighborRig.hostChar?.root &&
        raycaster.intersectObject(activeNeighborRig.hostChar.root, true).length > 0
      ) {
        handleHostCharacterClick();
        return;
      }
      if (
        activeNeighborRig.bottleGroup &&
        raycaster.intersectObject(activeNeighborRig.bottleGroup, true).length > 0
      ) {
        openNeighborHubModal();
        return;
      }
      if (
        activeNeighborRig.resonanceGroup &&
        raycaster.intersectObject(activeNeighborRig.resonanceGroup, true).length > 0
      ) {
        openResonanceModal();
        return;
      }
    }
    if (hiker?.root && raycaster.intersectObject(hiker.root, true).length > 0) {
      if (activeNeighborRig?.hostChar && playerUp.distanceTo(activeNeighborRig.hostUp) < 0.34) {
        triggerDuoInteractionScene();
      } else {
        hiker.triggerEmote("cheer", 2.0);
        sound.init();
        sound.playPetChime();
        showWonderToast("🙌 迎着山风开心蹦了蹦！点击右上角「找星主」或地面即可继续出发～", 2800);
      }
      return;
    }

    // 点击地面行走时收起星主浮动菜单并解除双人静坐
    closeHostPopover();
    if (duoSitActive) {
      duoSitActive = false;
      hiker.setSitting(false);
      activeNeighborRig?.clearDuoSit?.();
    }

    if (isCampfireMode) return;
    const hits = raycaster.intersectObject(currentWorld.terrainMesh, false);
    if (hits.length > 0) {
      if (isAutoStroll) toggleAutoStroll(false);
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
    const maxZoom = isPhotoMode ? 58 : 48;
    camDist = THREE.MathUtils.clamp(camDist + e.deltaY * 0.016, 6.2, maxZoom);
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
  switchUniverse(activeHostRole);
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

document.getElementById("btn-auto-stroll")?.addEventListener("click", () => toggleAutoStroll());
document.getElementById("btn-toggle-night").addEventListener("click", () => {
  cycleSkyPhase();
});

document.getElementById("btn-photo-mode").addEventListener("click", () => {
  togglePhotoMode();
});
document.getElementById("btn-photo-preset")?.addEventListener("click", cyclePhotoPreset);
document.getElementById("btn-prev-postcard")?.addEventListener("click", () => stepSiblingPostcard(-1));
document.getElementById("btn-next-postcard")?.addEventListener("click", () => stepSiblingPostcard(1));

document.getElementById("photo-exit-hint").addEventListener("click", () => {
  togglePhotoMode(false);
});

elPromptInteract.addEventListener("click", () => {
  if (activeWaypointNear) openWaypointJournal(activeWaypointNear);
  else if (activeManiNear) openManiModal();
  else if (activePlantedFlagNear) openFlagModal(activePlantedFlagNear.data);
  else if (activeNeighborHostNear) openNeighborHubModal();
  else if (activeResonanceNear) openResonanceModal(activePlanet?.id);
});

document.getElementById("btn-campfire-mode")?.addEventListener("click", () => toggleCampfireMode());
document.getElementById("btn-next-camp-story")?.addEventListener("click", () => {
  sound.init();
  sound.playHover();
  refreshCampfireStoryUI(true);
});
document.getElementById("btn-exit-campfire")?.addEventListener("click", () => toggleCampfireMode(false));
["mix-fire", "mix-wind", "mix-nature", "mix-music"].forEach((id) => {
  document.getElementById(id)?.addEventListener("input", syncCampfireAudio);
});
const CAMP_PRESETS = {
  sleep: { fire: 85, wind: 25, nature: 30, music: 20, label: "🌙 已调至「助眠微火」混音" },
  stream: { fire: 45, wind: 40, nature: 92, music: 55, label: "🌊 已调至「枕浪听溪」混音" },
  solo: { fire: 35, wind: 20, nature: 25, music: 95, label: "✨ 已调至「星夜琴音」混音" },
};
document.querySelectorAll(".camp-preset-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const p = CAMP_PRESETS[btn.dataset.preset];
    if (!p) return;
    document.getElementById("mix-fire").value = p.fire;
    document.getElementById("mix-wind").value = p.wind;
    document.getElementById("mix-nature").value = p.nature;
    document.getElementById("mix-music").value = p.music;
    syncCampfireAudio();
    showWonderToast(p.label, 2200);
  });
});

document.getElementById("btn-open-reel")?.addEventListener("click", openMemoryReel);
document.getElementById("btn-close-reel")?.addEventListener("click", closeMemoryReel);
document.getElementById("btn-reel-prev")?.addEventListener("click", () => stepMemoryReel(-1));
document.getElementById("btn-reel-next")?.addEventListener("click", () => stepMemoryReel(1));
document.getElementById("btn-reel-toggle")?.addEventListener("click", toggleMemoryReelPlay);

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
    if (isAutoStroll) toggleAutoStroll(false);
    walkTargetDir = null;
    clickRing.visible = false;
    moveDir.addScaledVector(viewFwd, inputY).addScaledVector(viewRight, inputX).normalize();
  } else if (isAutoStroll && !isAnyModalOpen() && !isCampfireMode && currentWorld?.waypointObjs?.length) {
    const targetWp = currentWorld.waypointObjs[autoStrollWpIdx % currentWorld.waypointObjs.length];
    if (playerUp.angleTo(targetWp.unitDir) < 0.08) {
      autoStrollWpIdx = (autoStrollWpIdx + 1) % currentWorld.waypointObjs.length;
    }
    const nextDir = currentWorld.waypointObjs[autoStrollWpIdx % currentWorld.waypointObjs.length].unitDir;
    moveDir
      .copy(nextDir)
      .sub(playerUp.clone().multiplyScalar(nextDir.dot(playerUp)))
      .normalize();
    camYaw += dt * 0.075;
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
    if (activePlanet.id === "miemie-tonggudang" && wpObj.data.id === "mm-tgd-3" && ang < 0.27) {
      detectedSoundZone = "cave_echo";
    }
  }
  if (!detectedSoundZone && activePlanet.id === "miemie-shexiang") {
    detectedSoundZone = "cave_echo";
  }

  // 触发特定场景音效（雪山垭口呼啸风声、咸田湾生日八音盒、地心溶洞水滴回声等）
  if (detectedSoundZone !== activeSceneZone) {
    activeSceneZone = detectedSoundZone;
    sound.setSceneZone(activeSceneZone);
  }
  if (!terrainStatusText && activeSceneZone === "birthday_beach") {
    terrainStatusText = "🎂 咸田湾营地 · 八音盒《生日快乐歌》";
  } else if (!terrainStatusText && activeSceneZone === "gale_pass") {
    terrainStatusText = "🌬 高山风口 · 经幡猎猎";
  } else if (!terrainStatusText && activeSceneZone === "cave_echo") {
    terrainStatusText = "💧 地心溶洞 · 钟乳水滴回响";
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
  if (speed > 0.08 && duoSitActive && !isCampfireMode) {
    duoSitActive = false;
    hiker.setSitting(false);
    activeNeighborRig?.clearDuoSit?.();
  }
  hiker.update(dt, elapsed, isCampfireMode || duoSitActive ? 0 : speed / 3.6);
  if (speed === 0) idleSeconds += dt;

  // 动态映射海拔表（带数值解析保底，彻底杜绝 NaN）
  const curR = hiker.root.position.length();
  const hRatio = THREE.MathUtils.clamp((curR - PLANET_RADIUS + 0.2) / 2.0, 0, 1);
  const bAlt = Number.isFinite(activePlanet.stats?.baseAlt) ? activePlanet.stats.baseAlt : 1600;
  const pAlt = Number.isFinite(activePlanet.stats?.peakAlt) ? activePlanet.stats.peakAlt : 2800;
  const altMeters = Math.round(THREE.MathUtils.lerp(bAlt, pAlt, hRatio));
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
  // 牛倒岩·地心瀑布洞窟自动头灯感应（草甸白昼步入溶洞口自动点亮双人头灯，出洞恢复）
  let inCaveZone = false;
  if (activePlanet?.id === "miemie-tonggudang" && currentWorld) {
    const caveWp = currentWorld.waypointObjs.find((w) => w.data.id === "mm-tgd-3");
    if (caveWp && playerUp.angleTo(caveWp.unitDir) < 0.27) inCaveZone = true;
  }
  if (inCaveZone !== Boolean(window.__lastInCaveZone)) {
    window.__lastInCaveZone = inCaveZone;
    hiker.setHeadlamp((skyPhase === "night" || inCaveZone) && mode === "planet");
    if (inCaveZone && skyPhase !== "night") {
      showWonderToast("🔦 已步入牛倒岩地心瀑布洞窟 · 探洞头灯自动点亮", 3400);
    }
  }

  if (activeNeighborRig) {
    const nb = activeNeighborRig.update(
      dt,
      elapsed,
      playerUp,
      isNight || inCaveZone,
      isCampfireMode,
      playerForward,
      speed
    );
    activeNeighborHostNear = nb.nearHost || nb.nearBottle;
    activeResonanceNear = nb.nearResonance;
    updateCompanionSpeechTick(dt, speed);
    if (firstLandGuideActive && speed > 0.12) dismissFirstLandGuide();
    if (
      pendingHostAction &&
      activeNeighborRig.hostChar &&
      playerUp.distanceTo(activeNeighborRig.hostUp) < 0.22
    ) {
      const act = pendingHostAction;
      pendingHostAction = null;
      walkTargetDir = null;
      clickRing.visible = false;
      if (act === "interact") triggerDuoInteractionScene();
      else openHostPopover();
    }
    if (nb.justGreeted && activePlanet) {
      const pOwner = activePlanet.owner || "mine";
      const visitorLabel =
        activeHostRole === "kitty" ? "Kitty" : activeHostRole === "miemie" ? "咩咩" : "清哥";
      const resPartner = getResidentPartnerName();
      const greetMsg =
        pOwner !== activeHostRole
          ? activePlanet.hostSpotGreeting ||
            (pOwner === "kitty"
              ? `🐾 Kitty 朝 ${visitorLabel} 开心挥手：欢迎来「${activePlanet.name}」串门！`
              : pOwner === "miemie"
                ? `🐑 咩咩朝 ${visitorLabel} 开心挥手：欢迎来「${activePlanet.name}」串门探秘！`
                : `🏔️ 清哥朝 ${visitorLabel} 开心挥手：欢迎来「${activePlanet.name}」串门吹风！`)
          : `⚡ 同频偶遇！邻居 ${resPartner} 也在同一片山脉向你挥手致意～`;
      showWonderToast(greetMsg, 4600);
    }
  }
  campfireRig.update(elapsed, dt);
  if (hotpotRig.group.visible && speed > 0.14) {
    hotpotRig.hide();
  }
  hotpotRig.update(elapsed);

  activePlantedFlagNear = null;
  let minFlagAng = 0.14;
  for (const flObj of activePlantedFlagObjs) {
    flObj.pennant.rotation.y = Math.sin(elapsed * 4.6 + flObj.unitDir.x * 5) * 0.24;
    flObj.topStar.rotation.y = elapsed * 2.2;
    const fAng = playerUp.angleTo(flObj.unitDir);
    if (fAng < minFlagAng) {
      minFlagAng = fAng;
      activePlantedFlagNear = flObj;
    }
  }

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
  } else if (activePlantedFlagNear && !isAnyModalOpen() && !isCampfireMode) {
    elPromptText.textContent = isMobileShort
      ? `🚩 查看「${activePlantedFlagNear.data.author}」的串门旗`
      : `🚩 按 [E] 或点击 · 查看「${activePlantedFlagNear.data.author}」插下的串门旗`;
    elPromptInteract.classList.remove("hidden");
  } else if (activeNeighborHostNear && !isAnyModalOpen() && !isCampfireMode) {
    const pOwner = activePlanet?.owner || "mine";
    const visitingOther = pOwner !== activeHostRole;
    const hostLabel =
      pOwner === "kitty" ? "Kitty" : pOwner === "miemie" ? "咩咩" : activePlanet?.ownerName || "清哥";
    const hostIcon = pOwner === "kitty" ? "🐾" : pOwner === "miemie" ? "🐑" : "🏔️";
    elPromptText.textContent = visitingOther
      ? isMobileShort
        ? `${hostIcon} 点击与 ${hostLabel} 串门合影`
        : `${hostIcon} 按 [E] 或点击 · 与星球主人 ${hostLabel} 合影 & 漂流瓶`
      : isMobileShort
        ? "📮 点击查看星际邮筒与同频手帐"
        : "📮 按 [E] 或点击 · 打开我的星际邮筒与串门手帐";
    elPromptInteract.classList.remove("hidden");
  } else if (activeResonanceNear && !isAnyModalOpen() && !isCampfireMode) {
    elPromptText.textContent = isMobileShort
      ? "⚡ 点击查看双星同频记忆"
      : "⚡ 按 [E] 或点击 · 开启跨宇宙双星同频记忆";
    elPromptInteract.classList.remove("hidden");
  } else {
    elPromptInteract.classList.add("hidden");
  }

  // 引路光弧淡出计时（留影模式下隐去地面辅助虚线，保证壁纸纯净）
  if (guideArcLine) {
    guideArcLine.visible = !isPhotoMode;
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

  const lookLift = isTelescopeMode ? 5.6 : isCampfireMode ? 0.55 : 0.9;
  const hikerFocus = hiker.root.position.clone().addScaledVector(playerUp, lookLift);
  // 镜头拉远时平滑将对焦中心从行者过渡到星球球心 (0,0,0)，让整颗微缩星球在画面正中完整入镜
  const globeBlend =
    isTelescopeMode || isCampfireMode
      ? 0
      : THREE.MathUtils.clamp((effectiveDist - 16.0) / 14.0, 0, 1);
  const desiredTarget = hikerFocus.clone().multiplyScalar(1 - globeBlend);
  const desiredCamPos = desiredTarget.clone().addScaledVector(camOffsetDir, effectiveDist);

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
  ["modal-reel", closeMemoryReel],
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
  if (reelModalOpen) {
    closeMemoryReel();
    if (mode !== "title") ensureHistoryGuard();
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

// ==================== V4.2 星际漂流瓶 · 星主互动 · 并肩同行控制器 ====================
let pendingHostAction = null;
let duoSitActive = false;
let duoSceneStep = 0;
let duoCamRestoreTimer = null;

function getResidentPartnerName() {
  if (!activeNeighborRig) return "星球伙伴";
  if (activeNeighborRig.residentRole === "kitty") return "Kitty";
  if (activeNeighborRig.residentRole === "miemie") return "咩咩";
  return "清哥";
}

function navigateToHostAndOpenMenu(pillBtn = null) {
  if (!activeNeighborRig?.hostChar || !activePlanet) return;
  if (isAutoStroll) toggleAutoStroll(false);
  if (isCampfireMode) toggleCampfireMode(false);
  const dist = playerUp.distanceTo(activeNeighborRig.hostUp);
  if (dist < 0.22) {
    openHostPopover();
    return;
  }
  const targetDir = activeNeighborRig.hostUp.clone();
  showGuideArcToDir(targetDir, "#f9a8d4", pillBtn);
  walkTargetDir = targetDir;
  const r = getSurfaceRadius(activePlanet.id, targetDir);
  clickRing.position.copy(targetDir).multiplyScalar(r + 0.05);
  clickRing.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), targetDir);
  clickRing.visible = true;
  pendingHostAction = "menu";
  showWonderToast(`🧭 星光导航已点亮 · 正在自动走往「${getResidentPartnerName()}」身旁…`, 2800);
}

function handleHostCharacterClick() {
  if (!activeNeighborRig?.hostChar) return;
  const pop = document.getElementById("host-action-popover");
  const isPopOpen = pop && !pop.classList.contains("hidden");
  if (playerUp.distanceTo(activeNeighborRig.hostUp) < 0.3) {
    if (isPopOpen) triggerDuoInteractionScene();
    else openHostPopover();
  } else {
    navigateToHostAndOpenMenu();
  }
}

function syncCompanionUI() {
  const following = Boolean(activeNeighborRig?.isFollowing);
  const partner = getResidentPartnerName();
  const rRole = activeNeighborRig?.residentRole;
  const rIcon = rRole === "kitty" ? "🐾" : rRole === "miemie" ? "🐑" : "🏔️";
  const pill = document.getElementById("companion-follow-pill");
  const label = document.getElementById("companion-follow-label");
  if (pill) pill.classList.toggle("hidden", !following);
  if (label) label.textContent = `${rIcon} 正与 ${partner} 并肩同行`;
  const popFollowBtn = document.getElementById("btn-pop-follow");
  if (popFollowBtn) {
    popFollowBtn.textContent = following
      ? `👋 结束同行 · 送 ${partner} 回营地`
      : `🤝 邀请 ${partner} 并肩同行`;
  }
  renderHudWaypoints();
}

function openHostPopover() {
  if (!activeNeighborRig?.hostChar) return;
  const partner = getResidentPartnerName();
  const rRole = activeNeighborRig.residentRole;
  const rIcon = rRole === "kitty" ? "🐾" : rRole === "miemie" ? "🐑" : "🏔️";
  const titleEl = document.getElementById("host-pop-title");
  if (titleEl) titleEl.textContent = `${rIcon} 星球伙伴 · ${partner}`;
  const interactBtn = document.getElementById("btn-pop-interact");
  if (interactBtn) {
    interactBtn.textContent =
      rRole === "miemie"
        ? "🐑 咩星萤光互动"
        : rRole === "kitty"
          ? "🐾 猫爪星芒互动"
          : "🏔️ 山海星火互动";
  }
  syncCompanionUI();
  document.getElementById("host-action-popover")?.classList.remove("hidden");
  activeNeighborRig.triggerHostWave();
  sound.init();
  sound.playHover();
}

function closeHostPopover() {
  document.getElementById("host-action-popover")?.classList.add("hidden");
}

function toggleCompanionFollow(force) {
  if (!activeNeighborRig?.hostChar) return;
  const next = typeof force === "boolean" ? force : !activeNeighborRig.isFollowing;
  activeNeighborRig.setFollowing(next);
  syncCompanionUI();
  closeHostPopover();
  const partner = getResidentPartnerName();
  sound.init();
  sound.playSelectPlanet?.();
  if (next) {
    hiker.triggerEmote("cheer", 1.5);
    showCompanionBubble(activeNeighborRig.pickCompanionLine?.() || "出发吧！我陪你一起走完这座山✨", 3600);
    showWonderToast(`🤝 ${partner} 开心地背好行囊加入了队伍！点顶部胶囊可随时挥手道别～`, 3800);
  } else {
    hideCompanionBubble();
    hiker.triggerWave();
    showWonderToast(`👋 与 ${partner} 挥手道别，TA 已回到营地星际漂流瓶旁守候～`, 3200);
  }
}

function triggerDuoInteractionScene() {
  if (!activeNeighborRig?.hostChar || !activePlanet) return;
  closeHostPopover();
  closeNeighborHubModal();
  const partner = getResidentPartnerName();
  const hostUp = activeNeighborRig.hostUp;
  // 让主角站到星主正身旁面对面/并肩黄金距离
  const arbitrary = Math.abs(hostUp.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const tangent = new THREE.Vector3().crossVectors(hostUp, arbitrary).normalize();
  playerUp.copy(hostUp).addScaledVector(tangent, 0.068).normalize();
  const faceToHost = hostUp.clone().sub(playerUp).normalize();
  playerForward.copy(faceToHost).sub(playerUp.clone().multiplyScalar(faceToHost.dot(playerUp))).normalize();
  orientHikerOnSphere(scene, playerUp, playerForward, activePlanet.id);

  const midUp = hostUp.clone().add(playerUp).normalize();
  const scenes = [
    { mode: "cheer", text: `🙌 与 ${partner} 在山巅击掌欢呼！漫天星芒为你们喝彩 ✨` },
    { mode: "rose", text: `🌹 互赠一朵发光的小王子星辰玫瑰，愿山海常相逢！` },
    { mode: "spin", text: `💫 和 ${partner} 在微缩星球的草坡上跳起星光圆舞曲～` },
    { mode: "sit", text: `🌠 与 ${partner} 卸下背包并肩席地而坐，静看银河流动（移动即可起身）` },
  ];
  const cur = scenes[duoSceneStep % scenes.length];
  duoSceneStep += 1;

  const faceToPlayer = playerUp.clone().sub(hostUp).normalize();
  if (cur.mode === "sit") {
    const viewFwd = new THREE.Vector3().crossVectors(tangent, midUp).normalize();
    playerForward.copy(viewFwd);
    orientHikerOnSphere(scene, playerUp, playerForward, activePlanet.id);
    hiker.setSitting(true);
    duoSitActive = true;
    activeNeighborRig.triggerDuoAction("sit", midUp, viewFwd);
  } else {
    duoSitActive = false;
    hiker.setSitting(false);
    hiker.triggerEmote(cur.mode === "spin" ? "spin" : cur.mode === "rose" ? "wave" : "cheer", 2.8);
    activeNeighborRig.triggerDuoAction(cur.mode, midUp, faceToPlayer);
  }

  // 推近到柔和舒适的平视微俯双人电影特写机位，3秒后平缓回到标准视角
  camPitch = 0.24;
  camDist = 7.2;
  if (duoCamRestoreTimer) clearTimeout(duoCamRestoreTimer);
  if (cur.mode !== "sit") {
    duoCamRestoreTimer = setTimeout(() => {
      if (!isPhotoMode) {
        camPitch = 0.56;
        camDist = 11.0;
      }
    }, 3100);
  }
  sound.init();
  sound.playDiscover?.();
  const rRole = activeNeighborRig.residentRole;
  const ROLE_DUO_LINES = {
    miemie: {
      cheer: "咩星人报到🐑！重装大包都挡不住我们登顶！",
      rose: "收下这朵地心发光玫瑰🌹，下座山继续约！",
      spin: "欢迎来到人间塞尔达，转个圈吹吹山风✨",
      sit: "没有信号的地方最自在，坐下听风和水滴声吧⛺",
    },
    kitty: {
      cheer: "耶🐾！终于在山顶等到你来串门啦～",
      rose: "猫耳星云的落日玫瑰送给你🌹！",
      spin: "趁日落最后八分钟，一起跳支星光舞吧💫",
      sit: "并排坐着等第一颗流星划过天际吧🌠",
    },
    mine: {
      cheer: "山海重逢🏔️！走，翻过前面那座垭口！",
      rose: "把沙漠与雪山的星光玫瑰送给你🌹！",
      spin: "风雪散尽就是日照金山，尽情欢呼吧✨",
      sit: "卸下重装包歇歇脚，山野的星空不赶时间⛺",
    },
  };
  const bubbleLine = (ROLE_DUO_LINES[rRole] || ROLE_DUO_LINES.mine)[cur.mode];
  if (bubbleLine) showCompanionBubble(bubbleLine, 3800);
  showWonderToast(cur.text, 3600);
}

// 🍲 V4.6 支炉头煮高山小火锅 & 露营钛杯碰杯互动
function triggerHotpotFeast() {
  if (!activeNeighborRig?.hostChar || !activePlanet) return;
  closeHostPopover();
  closeNeighborHubModal();
  if (isCampfireMode) toggleCampfireMode(false);
  const partner = getResidentPartnerName();
  const hostUp = activeNeighborRig.hostUp;
  const arbitrary = Math.abs(hostUp.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const tangent = new THREE.Vector3().crossVectors(hostUp, arbitrary).normalize();
  playerUp.copy(hostUp).addScaledVector(tangent, 0.085).normalize();
  const midUp = hostUp.clone().add(playerUp).normalize();
  const faceToHost = hostUp.clone().sub(playerUp).normalize();
  playerForward.copy(faceToHost).sub(playerUp.clone().multiplyScalar(faceToHost.dot(playerUp))).normalize();
  orientHikerOnSphere(scene, playerUp, playerForward, activePlanet.id);

  const viewFwd = new THREE.Vector3().crossVectors(tangent, midUp).normalize();
  hiker.setSitting(true);
  duoSitActive = true;
  activeNeighborRig.triggerDuoAction("sit", midUp, viewFwd);
  hotpotRig.placeAt(activePlanet.id, midUp);

  camPitch = 0.28;
  camDist = 7.4;
  sound.init();
  sound.playHotpotClink?.();
  const HOTPOT_LINES = {
    miemie: "海拔四千米的红汤小火锅咕嘟咕嘟🍲，重装背上来的肥牛就是香！干杯🍻！",
    kitty: "哇～山顶热乎乎的番茄小火锅配星空也太幸福了吧🍲！干杯✨！",
    mine: "支起高山气罐炉头🍲！风雪再大，一口热汤下肚浑身都是劲，碰一个🍻！",
  };
  showCompanionBubble(HOTPOT_LINES[activeNeighborRig.residentRole] || HOTPOT_LINES.mine, 4600);
  showWonderToast(`🍲 已与 ${partner} 支起高山炉头煮小火锅 · 露营钛杯碰杯干饭！（移动即可收锅）`, 4200);
  trackEvent("营地支炉煮火锅", { planet: activePlanet.name, partner });
}

// 🏅 V4.6 双人并肩完赛授牌仪式 & 签发《双人并肩完赛荣誉证》
function triggerDuoFinisherCeremony(fromAuto = false) {
  if (!activePlanet || !activeNeighborRig) return;
  closeHostPopover();
  const discSet = getDiscoveredSet(activePlanet.id);
  const total = activePlanet.waypoints.length;
  const partner = getResidentPartnerName();
  if (discSet.size < total) {
    if (!activeNeighborRig.isFollowing) toggleCompanionFollow(true);
    showCompanionBubble(`还差 ${total - discSet.size} 处路标就能拿联名完赛证啦，走，我陪你去打卡🏅！`, 4200);
    showWonderToast(`🏅 已邀 ${partner} 并肩同行！集齐剩余 ${total - discSet.size} 处路标即可触发双人授牌仪式`, 4000);
    return;
  }
  const midUp = activeNeighborRig.hostUp.clone().add(playerUp).normalize();
  const faceDir = playerForward.clone();
  hiker.setSitting(false);
  hiker.triggerEmote("cheer", 3.2);
  activeNeighborRig.triggerDuoAction("cheer", midUp, faceDir);
  camPitch = 0.25;
  camDist = 7.6;
  sound.init();
  sound.playDiscoverWaypoint?.(true);
  showCompanionBubble(`🏅 完赛授牌达成！恭喜我们并肩走完「${activePlanet.name}」全部路标🎉！`, 4500);
  showWonderToast(`🏅 双人并肩完赛达成！正在为你与 ${partner} 签发联名完赛荣誉证…`, 3800);
  setTimeout(async () => {
    if (!journalOpen) {
      currentTicketContext = { type: "finisher" };
      await refreshTicketPreviewImage();
      ticketModalOpen = true;
      document.getElementById("modal-ticket")?.classList.remove("hidden");
    }
  }, fromAuto ? 1400 : 650);
  trackEvent("签发双人并肩完赛证", { planet: activePlanet.name, partner });
}

// ==================== V4.3 头顶3D轻语气泡 · 漂流瓶未读星标 · 首次轻引导 ====================
let companionBubbleTimer = 0;
let companionAutoChatCooldown = 8.5;
let firstLandGuideActive = false;
let firstLandGuideTimer = null;
const _tmpHeadProj = new THREE.Vector3();

function showCompanionBubble(text, durationMs = 3400) {
  const el = document.getElementById("companion-speech-bubble");
  if (!el || !activeNeighborRig?.hostChar) return;
  el.textContent = text;
  el.classList.remove("hidden");
  companionBubbleTimer = durationMs / 1000;
}

function hideCompanionBubble() {
  companionBubbleTimer = 0;
  document.getElementById("companion-speech-bubble")?.classList.add("hidden");
}

function updateCompanionSpeechTick(dt, playerSpeed) {
  const el = document.getElementById("companion-speech-bubble");
  if (activeNeighborRig?.isFollowing && (playerSpeed > 0.1 || isCampfireMode)) {
    companionAutoChatCooldown -= dt;
    if (companionAutoChatCooldown <= 0 && companionBubbleTimer <= 0) {
      companionAutoChatCooldown = isCampfireMode ? 11 + Math.random() * 5 : 12.5 + Math.random() * 6;
      const line = isCampfireMode
        ? activeNeighborRig.pickCampfireLine?.()
        : activeNeighborRig.pickCompanionLine?.();
      if (line) showCompanionBubble(line, 3800);
    }
  }
  if (companionBubbleTimer > 0 && el && activeNeighborRig?.hostChar) {
    companionBubbleTimer -= dt;
    if (companionBubbleTimer <= 0 || isPhotoMode) {
      hideCompanionBubble();
      return;
    }
    const worldHead = activeNeighborRig.getHostHeadWorldPos?.(_tmpHeadProj);
    if (worldHead) {
      worldHead.project(camera);
      if (worldHead.z < 1) {
        const sx = (worldHead.x * 0.5 + 0.5) * window.innerWidth;
        const sy = (-worldHead.y * 0.5 + 0.5) * window.innerHeight;
        el.style.left = `${THREE.MathUtils.clamp(sx, 128, window.innerWidth - 128)}px`;
        el.style.top = `${THREE.MathUtils.clamp(sy - 12, 68, window.innerHeight - 140)}px`;
      }
    }
  }
}

function syncBottleUnreadBeacon() {
  const key = getNeighborBucketKey();
  const seenKey = `hp_bottle_seen_${key}`;
  const totalNotes = (socialState.notes[key] || []).length;
  const seenCount = Number(localStorage.getItem(seenKey) || 0);
  const hasUnread = totalNotes > seenCount;
  activeNeighborRig?.setUnreadBeacon?.(hasUnread);
  document.getElementById("btn-neighbor-hub")?.classList.toggle("has-unread-bottle", hasUnread);
}

function markBottleReadNow() {
  const key = getNeighborBucketKey();
  const totalNotes = (socialState.notes[key] || []).length;
  try {
    localStorage.setItem(`hp_bottle_seen_${key}`, String(totalNotes));
  } catch (_) {}
  activeNeighborRig?.setUnreadBeacon?.(false);
  document.getElementById("btn-neighbor-hub")?.classList.remove("has-unread-bottle");
}

function maybeShowFirstLandGuide() {
  try {
    if (localStorage.getItem("hp_first_land_guided_v43")) return;
  } catch (_) {}
  const el = document.getElementById("first-land-guide");
  if (!el) return;
  firstLandGuideActive = true;
  el.classList.remove("hidden");
  if (firstLandGuideTimer) clearTimeout(firstLandGuideTimer);
  firstLandGuideTimer = setTimeout(dismissFirstLandGuide, 4200);
}

function dismissFirstLandGuide() {
  if (!firstLandGuideActive) return;
  firstLandGuideActive = false;
  if (firstLandGuideTimer) clearTimeout(firstLandGuideTimer);
  document.getElementById("first-land-guide")?.classList.add("hidden");
  try {
    localStorage.setItem("hp_first_land_guided_v43", "1");
  } catch (_) {}
}

function warpToPlanetGlobal(targetPlanetId) {
  const veil = document.getElementById("warp-veil");
  const label = document.getElementById("warp-label");
  const all = getAllKnownPlanets();
  const target = all.find((x) => x.id === targetPlanetId);
  if (!target || warpActive) return;

  closeNeighborHubModal();
  closeResonanceModal();
  closeCreatorModal();
  closeHostPopover();

  warpActive = true;
  warpTimer = 1.12;
  if (label) label.textContent = `✦ 星轨穿梭 · 正在飞往「${target.name}」…`;
  if (veil) {
    veil.classList.remove("hidden");
    requestAnimationFrame(() => veil.classList.add("active"));
  }
  sound.init();
  sound.playSelectPlanet();
  triggerHaptic(22);

  setTimeout(() => {
    const targetUni = target.owner === "kitty" ? "kitty" : target.owner === "miemie" ? "miemie" : "mine";
    if (currentUniverse !== targetUni) switchUniverse(targetUni, target.id);
    const idx = PLANETS.findIndex((x) => x.id === target.id);
    if (idx >= 0) enterPlanet(idx);
  }, 480);

  setTimeout(() => {
    if (veil) {
      veil.classList.remove("active");
      setTimeout(() => veil.classList.add("hidden"), 360);
    }
    camera.fov = 45;
    camera.updateProjectionMatrix();
    warpActive = false;
  }, 1120);
}

function getNeighborBucketKey() {
  if (!activePlanet) return currentUniverse === "kitty" || currentUniverse === "miemie" ? currentUniverse : "mine";
  if (activePlanet.owner === "kitty" || activePlanet.owner === "miemie") return activePlanet.owner;
  if (activePlanet.owner === "guest") return activePlanet.id;
  return "mine";
}

function renderNeighborNotesUI() {
  const key = getNeighborBucketKey();
  const listEl = document.getElementById("neighbor-notes-list");
  const roseEl = document.getElementById("rose-count-num");
  if (roseEl) roseEl.textContent = String(socialState.roses[key] ?? 12);
  if (!listEl) return;
  const arr = socialState.notes[key] || [];
  listEl.innerHTML = arr
    .slice(0, 8)
    .map(
      (n) => `
      <div class="mani-note-item">
        <span class="mani-note-stone">${n.badge || "📮"}</span>
        <div class="mani-note-content">
          <div class="mani-note-text">“${n.text}”</div>
          <div class="mani-note-meta">— ${n.from} · ${n.time || "星际串门"}</div>
        </div>
      </div>`
    )
    .join("");
}

function openNeighborHubModal() {
  closeHostPopover();
  const p = activePlanet || PLANETS[selectedPlanetIdx];
  const pOwner = p?.owner || currentUniverse;
  const isHome = pOwner === activeHostRole;
  const hostName = pOwner === "kitty" ? "Kitty" : pOwner === "miemie" ? "咩咩" : p?.ownerName || "清哥";
  document.getElementById("neighbor-hub-title").textContent = isHome
    ? `🍾 我的星际漂流瓶 · 「${p?.name || "主场星云"}」`
    : pOwner === "guest"
      ? `🍾 客座漂流瓶 · ${hostName} 的「${p.name}」`
      : `🍾 星际漂流瓶 · 邻居 ${hostName} 的「${p?.name || "星云"}」`;
  document.getElementById("neighbor-hub-sub").textContent = isHome
    ? "打捞顺着银河漂流而来的好友纸条与星辰玫瑰，或放流一只漂流瓶去邻居家串门吧！"
    : p?.hostSpotGreeting || `写张星海纸条塞进漂流瓶，或拉上 ${hostName} 拍张平视双人拍立得吧！`;

  const duoBtn = document.getElementById("btn-hub-duo-interact");
  if (duoBtn) duoBtn.classList.toggle("hidden", !activeNeighborRig?.hostChar);

  const resBtn = document.getElementById("btn-hub-resonance");
  if (resBtn) resBtn.classList.toggle("hidden", !hasResonanceWithActiveHost(p));
  const warpBtn = document.getElementById("btn-warp-neighbor-uni");
  if (warpBtn) {
    warpBtn.textContent =
      currentUniverse === activeHostRole
        ? activeHostRole === "mine"
          ? "🐑 串门去邻居星系"
          : "🪐 串门去清哥的星系"
        : activeHostRole === "kitty"
          ? "🐾 返回我的猫耳星云"
          : activeHostRole === "miemie"
            ? "🐑 返回我的绵羊星云"
            : "🪐 返回我的主星系";
  }
  markBottleReadNow();
  renderNeighborNotesUI();
  neighborModalOpen = true;
  document.getElementById("modal-neighbor-hub")?.classList.remove("hidden");
  sound.init();
  sound.playHover();
}

function closeNeighborHubModal() {
  neighborModalOpen = false;
  document.getElementById("modal-neighbor-hub")?.classList.add("hidden");
}

const RES_ROLE_META = {
  mine: { name: "清哥", icon: "🪐", colCls: "", tagCls: "" },
  kitty: { name: "Kitty", icon: "🐾", colCls: "kitty-col", tagCls: "kitty-tag" },
  miemie: { name: "咩咩", icon: "🐑", colCls: "miemie-col", tagCls: "miemie-tag" },
};

function buildResonanceNote(leftRole, rightRole, clusterIds, isSelfLeft) {
  const prefix = isSelfLeft ? "你" : RES_ROLE_META[leftRole].name;
  const other = RES_ROLE_META[rightRole].name;
  if (clusterIds.includes("zhagana")) {
    return `${prefix}与邻居 ${other} 曾先后翻越措美峰 4600 米的风雪垭口，也在扎尕那的云雾石城里看过同一片绿浪。`;
  }
  if (clusterIds.includes("yili")) {
    return `${prefix}与邻居 ${other} 一南一北奔赴同一脉天山——一边是伊犁河谷与大海道的旷野繁星，一边是重装翻越乌孙古道达坂的滚烫青春。`;
  }
  return `同一片稻城亚丁三神山，见证了${prefix}与邻居 ${other} 各自的滚烫足迹——路线不止一条，选择不止一个，而你们都在路上。`;
}

function openResonanceModal(planetId, preferredPartnerRole = null) {
  const pid = planetId || activePlanet?.id || PLANETS[selectedPlanetIdx]?.id;
  const cluster = RESONANCE_CLUSTERS.find((c) => c.ids.includes(pid));
  if (!cluster) return;
  const all = getAllKnownPlanets();
  const curP = all.find((x) => x.id === pid);
  if (!curP) return;

  const curRole = curP.owner || "mine";
  const memberRoles = Object.keys(cluster.members);
  const selfInCluster = Boolean(cluster.members[activeHostRole]);
  const leftRole = selfInCluster ? activeHostRole : curRole;
  const otherRoles = memberRoles.filter((r) => r !== leftRole);
  const rightRole =
    preferredPartnerRole && otherRoles.includes(preferredPartnerRole)
      ? preferredPartnerRole
      : curRole !== leftRole && otherRoles.includes(curRole)
        ? curRole
        : otherRoles[0];

  const leftP = all.find((x) => x.id === cluster.members[leftRole]);
  const rightP = all.find((x) => x.id === cluster.members[rightRole]);
  if (!leftP || !rightP) return;

  const lMeta = RES_ROLE_META[leftRole] || RES_ROLE_META.mine;
  const rMeta = RES_ROLE_META[rightRole] || RES_ROLE_META.kitty;

  const isTrinity = preferredPartnerRole === "trinity" && memberRoles.length >= 3;
  const thirdRole = otherRoles.find((r) => r !== rightRole) || otherRoles[1];
  const thirdP = thirdRole ? all.find((x) => x.id === cluster.members[thirdRole]) : null;
  const tMeta = RES_ROLE_META[thirdRole] || RES_ROLE_META.miemie;

  const modalEl = document.getElementById("modal-resonance");
  const bookEl = modalEl?.querySelector(".resonance-book");
  const eyeEl = modalEl?.querySelector(".mani-eyebrow");
  const gridEl = modalEl?.querySelector(".resonance-compare-grid");
  bookEl?.classList.toggle("trinity-mode", isTrinity);
  gridEl?.classList.toggle("trinity-grid", isTrinity);
  if (eyeEl) {
    eyeEl.textContent = isTrinity
      ? "✦ TRINITY STAR ALIGNMENT · 跨宇宙三星连珠隐藏彩蛋 ✦"
      : "✦ TWIN-STAR TRAIL RESONANCE · 跨宇宙双星同频 ✦";
  }

  document.getElementById("resonance-title").textContent = isTrinity
    ? "🌌 三星连珠 · 同一座亚丁的三种青春"
    : `⚡ ${cluster.title}`;
  document.getElementById("resonance-sub").textContent = isTrinity
    ? "全宇宙 18 颗星球里，唯独稻城亚丁同时印下了清哥（大环线死守风雪帐篷）、Kitty（栈道松鼠与牛奶海晴空）、咩咩（六天五晚无信号重装反穿）三个人的脚印——同一座央迈勇，三种走法，在星海重逢。"
    : buildResonanceNote(leftRole, rightRole, cluster.ids, selfInCluster);

  const tabsEl = document.getElementById("resonance-partner-tabs");
  if (tabsEl) {
    tabsEl.innerHTML = "";
    if (memberRoles.length >= 3) {
      tabsEl.classList.remove("hidden");
      const pairBtn = document.createElement("button");
      pairBtn.type = "button";
      pairBtn.className = `uni-tab ${!isTrinity ? "active" : ""}`;
      pairBtn.textContent = `⚡ 双星对照（我 × ${rMeta.name}）`;
      pairBtn.onclick = () => openResonanceModal(pid, rightRole);
      const triBtn = document.createElement("button");
      triBtn.type = "button";
      triBtn.className = `uni-tab trinity-tab ${isTrinity ? "active" : ""}`;
      triBtn.textContent = "🌌 三星连珠 · 三人亚丁特辑";
      triBtn.onclick = () => openResonanceModal(pid, "trinity");
      tabsEl.append(pairBtn, triBtn);
    } else {
      tabsEl.classList.add("hidden");
    }
  }

  const fillCol = (side, pObj, roleKey, isSelfCard) => {
    if (!pObj) return;
    const m = RES_ROLE_META[roleKey] || RES_ROLE_META.mine;
    const col = document.getElementById(`res-col-${side}`);
    const tag = document.getElementById(`res-tag-${side}`);
    const jmp = document.getElementById(`res-jump-${side}`);
    if (col) col.className = `res-col ${m.colCls}`.trim();
    if (tag) {
      tag.className = `res-owner-tag ${m.tagCls}`.trim();
      tag.textContent = isSelfCard ? `${m.icon} 我的亚丁记忆（${m.name}）` : `${m.icon} 邻居 · ${m.name} 的星球记忆`;
    }
    document.getElementById(`res-img-${side}`).src = pObj.waypoints[0]?.photo || "";
    document.getElementById(`res-name-${side}`).textContent = `${pObj.name} · ${pObj.stats.altitude}`;
    document.getElementById(`res-text-${side}`).textContent = pObj.waypoints[0]?.memory || pObj.quote;
    if (jmp) {
      jmp.classList.toggle("hidden", !isTrinity);
      jmp.textContent =
        mode === "planet" && activePlanet?.id === pObj.id
          ? `📍 当前正在此星球漫步`
          : roleKey === activeHostRole
            ? `🚀 返回我的「${pObj.name}」`
            : `🚀 飞往 ${m.name} 的「${pObj.name}」`;
      jmp.onclick = () => warpToPlanetGlobal(pObj.id);
    }
  };

  fillCol("left", leftP, leftRole, selfInCluster);
  fillCol("right", rightP, rightRole, false);
  const colThird = document.getElementById("res-col-third");
  if (isTrinity && thirdP) {
    fillCol("third", thirdP, thirdRole, false);
    colThird?.classList.remove("hidden");
  } else {
    colThird?.classList.add("hidden");
  }

  const warpTwinBtn = document.getElementById("btn-warp-twin-planet");
  if (warpTwinBtn) {
    warpTwinBtn.classList.toggle("hidden", isTrinity);
    const jumpTarget = pid === rightP.id ? leftP : rightP;
    const jumpRole = jumpTarget.owner || "mine";
    const jumpMeta = RES_ROLE_META[jumpRole] || RES_ROLE_META.mine;
    warpTwinBtn.textContent =
      jumpRole === activeHostRole
        ? `🚀 返回我的「${jumpTarget.name}」`
        : `🚀 串门跃迁至「邻居 ${jumpMeta.name} · ${jumpTarget.name}」`;
    warpTwinBtn.onclick = () => warpToPlanetGlobal(jumpTarget.id);
  }

  closeNeighborHubModal();
  resonanceModalOpen = true;
  modalEl?.classList.remove("hidden");
  sound.init();
  if (isTrinity) sound.playDiscoverWaypoint?.(true);
  else sound.playSelectPlanet();
  trackEvent(isTrinity ? "开启三星连珠亚丁彩蛋" : "开启双星同频共鸣", { title: cluster.title, partner: rightRole });
}

function closeResonanceModal() {
  resonanceModalOpen = false;
  document.getElementById("modal-resonance")?.classList.add("hidden");
}

let latestCreatedGuestPlanet = null;
let latestCreatedShareUrl = "";

function openCreatorModal() {
  creatorModalOpen = true;
  document.getElementById("creator-share-result")?.classList.add("hidden");
  document.getElementById("modal-create-planet")?.classList.remove("hidden");
  sound.init();
  sound.playHover();
}

function closeCreatorModal() {
  creatorModalOpen = false;
  document.getElementById("modal-create-planet")?.classList.add("hidden");
}

// 扉页双星主身份切换舱 + 串门副按钮自适应
document.querySelectorAll("#host-role-switcher .host-role-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const r = btn.dataset.hostRole;
    const nextRole = r === "kitty" ? "kitty" : r === "miemie" ? "miemie" : "mine";
    if (nextRole === activeHostRole) return;
    sound.init();
    sound.playSelectPlanet();
    applyHostRoleUI(nextRole, true);
    showWonderToast(
      nextRole === "kitty"
        ? "🐾 已切换至「Kitty 星主主场」· 7 颗猫耳星云已就绪！"
        : nextRole === "miemie"
          ? "🐑 已切换至「咩咩星主主场」· 5 颗绵羊星云已就绪！"
          : "🏔️ 已切换至「清哥主场」· 6 颗山海星球已就绪！",
      3200
    );
  });
});

document.getElementById("btn-visit-kitty-title")?.addEventListener("click", () => {
  sound.init();
  sound.playSelectPlanet();
  const neighborUni = activeHostRole === "kitty" ? "mine" : "kitty";
  switchUniverse(neighborUni);
  openStarMap();
  trackEvent("扉页串门拜访邻居星系", { neighborUni });
});

document.getElementById("btn-visit-miemie-title")?.addEventListener("click", () => {
  sound.init();
  sound.playSelectPlanet();
  const neighborUni = activeHostRole === "miemie" ? "mine" : "miemie";
  switchUniverse(neighborUni);
  openStarMap();
  trackEvent("扉页串门拜访邻居星系", { neighborUni });
});

document.querySelectorAll("#universe-switcher .uni-tab[data-uni]").forEach((btn) => {
  btn.addEventListener("click", () => {
    sound.init();
    sound.playSelectPlanet();
    switchUniverse(btn.dataset.uni);
    trackEvent("星图切换宇宙", { universe: btn.dataset.uni });
  });
});

document.getElementById("btn-open-creator")?.addEventListener("click", openCreatorModal);
document.getElementById("btn-close-creator")?.addEventListener("click", closeCreatorModal);
document.getElementById("btn-map-resonance")?.addEventListener("click", () => {
  const p = PLANETS[selectedPlanetIdx];
  if (p) openResonanceModal(p.id);
});
document.getElementById("btn-neighbor-hub")?.addEventListener("click", openNeighborHubModal);
document.getElementById("btn-close-neighbor-hub")?.addEventListener("click", closeNeighborHubModal);
document.getElementById("btn-hub-resonance")?.addEventListener("click", () => {
  if (activePlanet) openResonanceModal(activePlanet.id);
});
document.getElementById("btn-close-resonance")?.addEventListener("click", closeResonanceModal);

document.getElementById("btn-warp-neighbor-uni")?.addEventListener("click", () => {
  closeNeighborHubModal();
  const nextUni =
    currentUniverse !== activeHostRole
      ? activeHostRole
      : activeHostRole === "mine"
        ? "miemie"
        : "mine";
  const veil = document.getElementById("warp-veil");
  const label = document.getElementById("warp-label");
  if (label) {
    label.textContent =
      nextUni === "kitty"
        ? "✦ 星轨穿梭 · 正在飞往「Kitty 的猫耳星云」…"
        : nextUni === "miemie"
          ? "✦ 星轨穿梭 · 正在飞往「咩咩的绵羊星云」…"
          : "✦ 星轨穿梭 · 正在飞往「清哥主星系」…";
  }
  if (veil) {
    veil.classList.remove("hidden");
    requestAnimationFrame(() => veil.classList.add("active"));
  }
  sound.init();
  sound.playSelectPlanet();
  setTimeout(() => {
    switchUniverse(nextUni);
    openStarMap();
  }, 440);
  setTimeout(() => {
    if (veil) {
      veil.classList.remove("active");
      setTimeout(() => veil.classList.add("hidden"), 350);
    }
  }, 1050);
});

document.getElementById("btn-send-rose")?.addEventListener("click", () => {
  const key = getNeighborBucketKey();
  socialState.roses[key] = (socialState.roses[key] ?? 12) + 1;
  saveSocialState(socialState);
  renderNeighborNotesUI();
  activeNeighborRig?.triggerHostWave();
  sound.init();
  sound.playDiscover?.();
  showWonderToast("🌹 已赠予一朵小王子的星辰玫瑰 · 星球主人开心向你挥手！");
});

let latestReplyShareUrl = "";

document.getElementById("neighbor-note-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const authorEl = document.getElementById("neighbor-note-author");
  const textEl = document.getElementById("neighbor-note-text");
  const text = (textEl?.value || "").trim();
  if (!text) return;
  const defaultName =
    activeHostRole === "kitty" ? "Kitty" : activeHostRole === "miemie" ? "咩咩" : saveData.travelerName || "清哥";
  const from = (authorEl?.value || "").trim() || defaultName;
  const key = getNeighborBucketKey();
  if (!Array.isArray(socialState.notes[key])) socialState.notes[key] = [];
  socialState.notes[key].unshift({ from, badge: "🍾 漂流瓶信笺", text, time: "刚刚放流" });
  saveSocialState(socialState);
  if (textEl) textEl.value = "";
  renderNeighborNotesUI();
  activeNeighborRig?.triggerHostWave();

  // 生成零后端跨手机「星海漂流瓶链接」
  const targetOwner = key === "kitty" || key === "miemie" ? key : "mine";
  const lToken = encodeReplyLetter({ toOwner: targetOwner, from, text, roses: 1 });
  const baseUrl = window.location.origin + window.location.pathname;
  latestReplyShareUrl = `${baseUrl}?host=${targetOwner}&letter=${lToken}`;
  const replyBtn = document.getElementById("btn-copy-reply-letter");
  if (replyBtn) replyBtn.classList.remove("hidden");

  showWonderToast("🍾 纸条已塞进星际漂流瓶放流！可点下方按钮复制漂流瓶链接发给 TA～");
});

document.getElementById("btn-copy-reply-letter")?.addEventListener("click", () => {
  if (!latestReplyShareUrl) return;
  navigator.clipboard?.writeText(latestReplyShareUrl).catch(() => {});
  showWonderToast("🍾 星海漂流瓶链接已复制！发给对方微信点开即可打捞收信！");
});

function captureCoopPolaroid() {
  if (mode !== "planet" || !activePlanet) {
    closeNeighborHubModal();
    closeHostPopover();
    enterPlanet(selectedPlanetIdx);
    return;
  }
  closeNeighborHubModal();
  closeHostPopover();

  const savedPos = camera.position.clone();
  const savedUp = camera.up.clone();
  const savedQuat = camera.quaternion.clone();

  if (activeNeighborRig?.hostChar) {
    // 黄金平视微仰双人人像机位：两人并肩面向镜头微笑挥手，背景衬出弧形雪峰与璀璨星河！
    const hUp = activeNeighborRig.hostUp.clone();
    const arb = Math.abs(hUp.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
    const rightTan = new THREE.Vector3().crossVectors(hUp, arb).normalize();
    const camFwd = new THREE.Vector3().crossVectors(rightTan, hUp).normalize();

    playerUp.copy(hUp).addScaledVector(rightTan, 0.055).normalize();
    playerForward.copy(camFwd);
    orientHikerOnSphere(scene, playerUp, playerForward, activePlanet.id);
    activeNeighborRig.orientChar(hUp, camFwd);
    hiker.poseWaveSnapshot?.();
    activeNeighborRig.hostChar.poseWaveSnapshot?.();

    const midUp = hUp.clone().add(playerUp).normalize();
    const midR = getSurfaceRadius(activePlanet.id, midUp);
    const groundMid = midUp.clone().multiplyScalar(midR);
    camera.up.copy(midUp);
    camera.position
      .copy(groundMid)
      .addScaledVector(midUp, 0.92)
      .addScaledVector(camFwd, 3.85);
    camera.lookAt(groundMid.clone().addScaledVector(midUp, 1.05));
  } else {
    hiker.poseWaveSnapshot?.();
  }

  renderer.render(scene, camera);
  const visitor =
    saveData.travelerName || (activeHostRole === "kitty" ? "Kitty" : activeHostRole === "miemie" ? "咩咩" : "清哥");
  const url = generateCoopSnapshotDataUrl(renderer.domElement, activePlanet, visitor, activeHostRole);

  // 抓拍完毕毫秒级无损还原正常游戏相机，不干扰后续操作
  camera.position.copy(savedPos);
  camera.up.copy(savedUp);
  camera.quaternion.copy(savedQuat);

  const previewImg = document.getElementById("ticket-preview-img");
  const dlBtn = document.getElementById("btn-download-ticket");
  const titleEl = document.getElementById("ticket-modal-title");
  if (previewImg) previewImg.src = url;
  if (dlBtn) {
    dlBtn.href = url;
    dlBtn.download = `星际串门同框-${activePlanet.name}.png`;
  }
  if (titleEl) titleEl.textContent = `🐾 星际串门双人同框 · ${activePlanet.name}`;
  ticketModalOpen = true;
  document.getElementById("modal-ticket")?.classList.remove("hidden");
  sound.init();
  sound.playSelectPlanet();
  trackEvent("拍摄星际串门双人拍立得", { planet: activePlanet.name });
}

document.getElementById("btn-coop-photo")?.addEventListener("click", captureCoopPolaroid);
document.getElementById("btn-hub-duo-interact")?.addEventListener("click", triggerDuoInteractionScene);
document.getElementById("companion-follow-pill")?.addEventListener("click", () => toggleCompanionFollow(false));
document.getElementById("btn-close-host-pop")?.addEventListener("click", closeHostPopover);
document.getElementById("btn-pop-follow")?.addEventListener("click", () => toggleCompanionFollow());
document.getElementById("btn-pop-hotpot")?.addEventListener("click", triggerHotpotFeast);
document.getElementById("btn-pop-interact")?.addEventListener("click", triggerDuoInteractionScene);
document.getElementById("btn-pop-photo")?.addEventListener("click", captureCoopPolaroid);
document.getElementById("btn-pop-finisher")?.addEventListener("click", () => triggerDuoFinisherCeremony(false));
document.getElementById("btn-plant-flag")?.addEventListener("click", () => openFlagModal(null));
document.getElementById("btn-close-flag-modal")?.addEventListener("click", closeFlagModal);

let viewingFlagItem = null;
function buildFlagShareLink(flagObj) {
  const token = encodeFlagToken(flagObj);
  const pObj = getAllKnownPlanets().find((x) => x.id === flagObj.planetId);
  const targetHost = pObj?.owner || "mine";
  const base = window.location.origin + window.location.pathname;
  return `${base}?host=${targetHost}&planet=${encodeURIComponent(flagObj.planetId)}&flag=${token}`;
}

function openFlagModal(existingFlag = null) {
  if (mode !== "planet" || !activePlanet) return;
  closeHostPopover();
  viewingFlagItem = existingFlag;
  flagModalOpen = true;
  const viewBox = document.getElementById("flag-view-box");
  const formEl = document.getElementById("flag-plant-form");
  const copyBtn = document.getElementById("btn-copy-existing-flag");
  const titleEl = document.getElementById("flag-modal-title");
  if (existingFlag) {
    if (titleEl) titleEl.textContent = `🚩 「${existingFlag.author}」插下的串门纪念旗`;
    document.getElementById("flag-view-meta").textContent = `📍 ${activePlanet.name} · ${existingFlag.date || "2026"}`;
    document.getElementById("flag-view-msg").textContent = `“${existingFlag.msg}”`;
    viewBox?.classList.remove("hidden");
    formEl?.classList.add("hidden");
    copyBtn?.classList.remove("hidden");
  } else {
    if (titleEl) titleEl.textContent = `🚩 在「${activePlanet.name}」插面串门旗`;
    const authorIn = document.getElementById("flag-author-input");
    if (authorIn && !authorIn.value) authorIn.value = getTravelerName();
    viewBox?.classList.add("hidden");
    formEl?.classList.remove("hidden");
    copyBtn?.classList.add("hidden");
  }
  document.getElementById("modal-plant-flag")?.classList.remove("hidden");
  sound.init();
  sound.playHover();
}

function closeFlagModal() {
  flagModalOpen = false;
  document.getElementById("modal-plant-flag")?.classList.add("hidden");
}

document.getElementById("btn-copy-existing-flag")?.addEventListener("click", async () => {
  if (!viewingFlagItem) return;
  const url = buildFlagShareLink(viewingFlagItem);
  try { await navigator.clipboard.writeText(url); } catch {}
  showWonderToast("🔗 已复制这面串门旗的微信坐标直达链接！", 3600);
});

document.getElementById("flag-plant-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!activePlanet || !currentWorld) return;
  const author = document.getElementById("flag-author-input").value.trim() || getTravelerName();
  const msg = document.getElementById("flag-msg-input").value.trim() || "到此吹风打卡，山海常相逢！";
  const saved = savePlantedFlag({
    planetId: activePlanet.id,
    author,
    role: activeHostRole,
    msg,
    up: [playerUp.x, playerUp.y, playerUp.z],
    date: new Date().toISOString().slice(0, 10),
  });
  const meshObj = buildFlagMesh(activePlanet.id, saved);
  currentWorld.group.add(meshObj.group);
  activePlantedFlagObjs.push(meshObj);
  document.getElementById("flag-msg-input").value = "";
  closeFlagModal();
  hiker.triggerEmote("cheer", 2.0);
  sound.init();
  sound.playDiscover?.();
  const url = buildFlagShareLink(saved);
  try { await navigator.clipboard.writeText(url); } catch {}
  showWonderToast(`🚩 已在脚下插好 3D 串门营旗！坐标直达链接已复制，快发给好友微信吧～`, 4800);
  trackEvent("插下3D串门纪念营旗", { planet: activePlanet.name, author });
});
document.querySelectorAll(".bottle-preset-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    const input = document.getElementById("neighbor-note-text");
    if (input) {
      input.value = chip.dataset.preset || "";
      input.focus();
      sound.init();
      sound.playHover();
    }
  });
});
document.getElementById("btn-pop-bottle")?.addEventListener("click", openNeighborHubModal);

document.getElementById("creator-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const cfg = {
    ownerName: document.getElementById("cr-owner").value.trim() || "远方山友",
    planetName: document.getElementById("cr-name").value.trim() || "云海秘境星",
    elevation: document.getElementById("cr-elev").value.trim() || "3000m",
    template: document.getElementById("cr-template").value,
    creature: document.getElementById("cr-creature").value,
    quote: document.getElementById("cr-quote").value.trim(),
    memory: document.getElementById("cr-memory").value.trim() || "山风吹过的时候，我把这段路留在了星空里。",
  };
  const token = encodeGuestPlanetPayload(cfg);
  const rawMini = {
    o: cfg.ownerName, n: cfg.planetName, e: cfg.elevation,
    t: cfg.template, c: cfg.creature, q: cfg.quote, m: cfg.memory,
  };
  socialState.customPlanets.push(rawMini);
  saveSocialState(socialState);
  const hydrated = hydrateGuestPlanet(rawMini);
  guestPlanets.push(hydrated);
  latestCreatedGuestPlanet = hydrated;
  const baseUrl = window.location.origin + window.location.pathname;
  latestCreatedShareUrl = `${baseUrl}?guest=${token}`;

  document.getElementById("cr-share-url").value = latestCreatedShareUrl;
  document.getElementById("creator-share-result")?.classList.remove("hidden");
  switchUniverse("mine", hydrated.id);
  sound.init();
  sound.playSelectPlanet();
  trackEvent("创建客座邻居星球", { name: cfg.planetName });
});

document.getElementById("btn-copy-share-url")?.addEventListener("click", () => {
  const url = document.getElementById("cr-share-url")?.value || "";
  navigator.clipboard?.writeText(url).catch(() => {});
  showWonderToast("📋 专属星门串门链接已复制！快发给好友来你的星球玩吧～");
});

document.getElementById("btn-land-new-planet")?.addEventListener("click", () => {
  if (!latestCreatedGuestPlanet) return;
  closeCreatorModal();
  warpToPlanetGlobal(latestCreatedGuestPlanet.id);
});

document.getElementById("btn-poster-new-planet")?.addEventListener("click", () => {
  if (!latestCreatedGuestPlanet) return;
  closeCreatorModal();
  const url = generateNeighborInviteCardDataUrl(latestCreatedGuestPlanet, latestCreatedShareUrl);
  const previewImg = document.getElementById("ticket-preview-img");
  const dlBtn = document.getElementById("btn-download-ticket");
  const titleEl = document.getElementById("ticket-modal-title");
  if (previewImg) previewImg.src = url;
  if (dlBtn) {
    dlBtn.href = url;
    dlBtn.download = `星际串门邀请函-${latestCreatedGuestPlanet.name}.png`;
  }
  if (titleEl) titleEl.textContent = `💌 星际串门邀请海报 · ${latestCreatedGuestPlanet.name}`;
  ticketModalOpen = true;
  document.getElementById("modal-ticket")?.classList.remove("hidden");
});

// 支持专属双星主登录 (?host=kitty / ?host=mine)、跨手机收信 (?letter=<token>)、客座星球 (?guest=<token>) 与直达星球
function bootFromUrlParams() {
  const sp = new URLSearchParams(window.location.search);
  const hostParam = (sp.get("host") || sp.get("role") || "").toLowerCase();
  if (hostParam === "kitty" || hostParam === "miemie" || hostParam === "mine") {
    applyHostRoleUI(hostParam, false);
    currentUniverse = activeHostRole;
    PLANETS = getPlanetsForUniverse(currentUniverse);
  } else {
    applyHostRoleUI(activeHostRole, false);
  }

  // 解析好友从微信发来的星际带话信笺 ?letter=<token>
  const letterToken = sp.get("letter");
  if (letterToken) {
    const incoming = decodeReplyLetter(letterToken);
    if (incoming && incoming.m) {
      const bucket = incoming.to === "kitty" || incoming.to === "miemie" ? incoming.to : "mine";
      if (!Array.isArray(socialState.notes[bucket])) socialState.notes[bucket] = [];
      const exists = socialState.notes[bucket].some((n) => n.from === incoming.f && n.text === incoming.m);
      if (!exists) {
        socialState.notes[bucket].unshift({
          from: incoming.f,
          badge: "🍾 星海漂流瓶",
          text: incoming.m,
          time: "顺银河漂达",
        });
        socialState.roses[bucket] = (socialState.roses[bucket] ?? 12) + (Number(incoming.r) || 1);
        saveSocialState(socialState);
      }
      setTimeout(() => {
        showWonderToast(`🍾 打捞起一只来自「${incoming.f}」的星际漂流瓶：“${incoming.m}”`, 6000);
      }, 950);
    }
  }
  const flagToken = sp.get("flag");
  if (flagToken) {
    const incomingFlag = decodeFlagToken(flagToken);
    if (incomingFlag) {
      const savedFlag = savePlantedFlag(incomingFlag);
      const pid = savedFlag.planetId;
      if (pid.startsWith("kitty-")) switchUniverse("kitty", pid);
      else if (pid.startsWith("miemie-")) switchUniverse("miemie", pid);
      else switchUniverse("mine", pid);
      const fIdx = PLANETS.findIndex((x) => x.id === pid);
      if (fIdx >= 0) {
        enterPlanet(fIdx);
        const targetDir = new THREE.Vector3(...savedFlag.up).normalize();
        showGuideArcToDir(targetDir, "#fbbf24");
        setTimeout(() => {
          showWonderToast(`🚩 收到来自「${savedFlag.author}」的山脊串门旗：“${savedFlag.msg}” · 顺着金色星尘去看看吧！`, 6200);
        }, 850);
        return;
      }
    }
  }

  const guestToken = sp.get("guest") || sp.get("visit");
  if (guestToken) {
    const sharedPlanet = decodeGuestPlanetPayload(guestToken);
    if (sharedPlanet) {
      if (!guestPlanets.some((x) => x.id === sharedPlanet.id)) {
        guestPlanets.unshift(sharedPlanet);
      }
      switchUniverse("mine", sharedPlanet.id);
      const gIdx = PLANETS.findIndex((x) => x.id === sharedPlanet.id);
      if (gIdx >= 0) {
        enterPlanet(gIdx);
        return;
      }
    }
  }

  const uniParam = (sp.get("universe") || sp.get("neighbor") || "").toLowerCase();
  const qPlanet = (sp.get("planet") || "").toLowerCase();
  const hashKey = window.location.hash.replace(/^#\/?/, "").trim().toLowerCase();
  const targetKey = qPlanet || hashKey;

  if (uniParam === "kitty" || targetKey === "kitty") {
    switchUniverse("kitty");
    openStarMap();
    return;
  }
  if (uniParam === "miemie" || targetKey === "miemie") {
    switchUniverse("miemie");
    openStarMap();
    return;
  }
  if (uniParam === "mine" || targetKey === "mine") {
    switchUniverse("mine");
    openStarMap();
    return;
  }

  if (targetKey) {
    if (targetKey.startsWith("kitty-")) {
      switchUniverse("kitty", targetKey);
    } else if (targetKey.startsWith("miemie-")) {
      switchUniverse("miemie", targetKey);
    } else if ([...MY_PLANETS, ...guestPlanets].some((p) => p.id === targetKey)) {
      switchUniverse("mine", targetKey);
    } else {
      initScrollMapUI();
    }
    const pIdx = PLANETS.findIndex((p) => p.id === targetKey);
    if (pIdx >= 0) {
      enterPlanet(pIdx);
      return;
    }
  } else {
    initScrollMapUI();
  }
  setupTitleScene();
}

window.addEventListener("hashchange", () => {
  const hk = window.location.hash.replace(/^#\/?/, "").trim().toLowerCase();
  if (hk && getAllKnownPlanets().some((p) => p.id === hk)) {
    warpToPlanetGlobal(hk);
  }
});

bootFromUrlParams();
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
