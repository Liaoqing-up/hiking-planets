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

const SAVE_KEY = "hiking_planets_save_v1";

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return { discovered: {}, steps: 0 };
}

const saveData = loadSave();
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
let isNight = false;
let isPhotoMode = false;
let journalOpen = false;
let journalPage = 1;
let currentJournalWp = null;
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

function showGuideArcTo(wpObj, pillEl) {
  clearGuideArc();
  if (!activePlanet || !wpObj) return;
  const pts = [];
  const segs = 38;
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const d = new THREE.Vector3().lerpVectors(playerUp, wpObj.unitDir, t).normalize();
    const arch = Math.sin(t * Math.PI) * 1.45;
    const r = getSurfaceRadius(activePlanet.id, d) + 0.28 + arch;
    pts.push(d.multiplyScalar(r));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({
    color: "#ffe594",
    transparent: true,
    opacity: 0.92,
  });
  guideArcLine = new THREE.Line(geo, mat);
  scene.add(guideArcLine);
  guideArcTimer = 5.5;
  if (pillEl) pillEl.classList.add("guiding");
}

function disposeCurrentWorld() {
  clearGuideArc();
  clickRing.visible = false;
  if (!currentWorld) return;
  scene.remove(currentWorld.group);
  currentWorld.group.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
      else child.material.dispose();
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

function setScreen(nextMode) {
  mode = nextMode;
  elScreenTitle.classList.toggle("active", mode === "title");
  elScreenMap.classList.toggle("active", mode === "map");
  elScreenHud.classList.toggle("active", mode === "planet");
  if (mode !== "planet" && isPhotoMode) togglePhotoMode(false);
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
    if (stamp) stamp.textContent = done ? "✦ 走完" : `${disc.size}/${p.waypoints.length}`;
  });
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

function openStarMap() {
  if (currentWorld) currentWorld.group.visible = false;
  hiker.root.visible = false;
  scene.background.set("#0a1228");
  refreshScrollMapBadges();
  selectMapPlanet(selectedPlanetIdx);
  sound.setPlanetBGM("space");
  setScreen("map");
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

// ==================== LIGHTING & SHORTCUTS ====================
function applyLightingTheme(immediate = false) {
  const pal = activePlanet ? activePlanet.palette : { skyDay: "#0a1228", skyNight: "#060918" };
  const targetBg = new THREE.Color(isNight ? pal.skyNight : pal.skyDay);
  if (immediate) scene.background.copy(targetBg);
  else scene.background.lerp(targetBg, 0.08);

  hemiLight.intensity = isNight ? 0.42 : 1.18;
  sunLight.intensity = isNight ? 0.52 : 1.85;
  sunLight.color.set(isNight ? "#8fb8ff" : "#fff1d0");
  hiker.setHeadlamp(isNight && mode === "planet");

  const nightBtn = document.getElementById("btn-toggle-night");
  if (nightBtn) {
    nightBtn.innerHTML = isNight ? `☀ 晨曦 <kbd>L</kbd>` : `☾ 星夜 <kbd>L</kbd>`;
  }
}

function togglePhotoMode(force) {
  isPhotoMode = typeof force === "boolean" ? force : !isPhotoMode;
  document.body.classList.toggle("photo-mode", isPhotoMode);
  document.getElementById("photo-exit-hint").classList.toggle("hidden", !isPhotoMode);
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
  } else if (activePlanet) {
    if (mediaBox) mediaBox.classList.remove("loading");
    renderPostcardScene(artCanvas, currentJournalWp, activePlanet);
    artCanvas.classList.remove("hidden");
    photoEl.classList.add("hidden");
  }
}

function flipJournalPage() {
  if (!currentJournalWp) return;
  journalPage = journalPage === 1 ? 2 : 1;
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
  journalPage = 1;
  currentJournalWp = wpObj.data;
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

  if (nowAllDone && !wasAlreadyAllDone) {
    const banner = document.getElementById("banner-complete");
    document.getElementById("banner-complete-text").textContent = `星辰共鸣 · 已集齐「${activePlanet.name}」全部徒步印记`;
    banner.classList.remove("hidden");
    setTimeout(() => banner.classList.add("hidden"), 5500);
  }
}

function closeJournal() {
  journalOpen = false;
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

  if (mode === "title" && (e.code === "Enter" || e.code === "Space")) {
    sound.init();
    sound.playSelectPlanet();
    openStarMap();
  } else if (mode === "map") {
    if (e.code === "ArrowRight" || e.code === "KeyD") selectMapPlanet(selectedPlanetIdx + 1);
    else if (e.code === "ArrowLeft" || e.code === "KeyA") selectMapPlanet(selectedPlanetIdx - 1);
    else if (e.code === "ArrowDown" || e.code === "KeyS") selectMapPlanet(selectedPlanetIdx + 3);
    else if (e.code === "ArrowUp" || e.code === "KeyW") selectMapPlanet(selectedPlanetIdx - 3);
    else if (e.code === "Enter" || e.code === "Space") enterPlanet(selectedPlanetIdx);
    else if (e.code === "Escape") setupTitleScene();
  } else if (mode === "planet") {
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
    if (e.code === "KeyE" && activeWaypointNear) {
      openWaypointJournal(activeWaypointNear);
    } else if (e.code === "KeyL") {
      isNight = !isNight;
      applyLightingTheme(false);
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

// 鼠标拖拽旋转视角 & 点击星球表面寻路行走
let isPointerDown = false;
let pointerMoved = 0;
let lastPX = 0;
let lastPY = 0;
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();

renderer.domElement.addEventListener("pointerdown", (e) => {
  if (mode === "title") {
    sound.init();
    sound.playSelectPlanet();
    openStarMap();
    return;
  }
  if (mode !== "planet" || journalOpen) return;
  isPointerDown = true;
  pointerMoved = 0;
  lastPX = e.clientX;
  lastPY = e.clientY;
});

window.addEventListener("pointermove", (e) => {
  if (!isPointerDown || mode !== "planet") return;
  const dx = e.clientX - lastPX;
  const dy = e.clientY - lastPY;
  lastPX = e.clientX;
  lastPY = e.clientY;
  pointerMoved += Math.hypot(dx, dy);

  camYaw -= dx * 0.0065;
  camPitch = THREE.MathUtils.clamp(camPitch + dy * 0.0055, 0.2, 1.25);
});

window.addEventListener("pointerup", (e) => {
  if (!isPointerDown) return;
  isPointerDown = false;
  if (mode === "planet" && !journalOpen && pointerMoved < 6 && currentWorld?.terrainMesh) {
    ndc.x = (e.clientX / window.innerWidth) * 2 - 1;
    ndc.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
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
  isNight = !isNight;
  applyLightingTheme(false);
});

document.getElementById("btn-photo-mode").addEventListener("click", () => {
  togglePhotoMode();
});

document.getElementById("photo-exit-hint").addEventListener("click", () => {
  togglePhotoMode(false);
});

elPromptInteract.addEventListener("click", () => {
  if (activeWaypointNear) openWaypointJournal(activeWaypointNear);
});

document.getElementById("btn-close-journal").addEventListener("click", closeJournal);

const elJournalTextCard = document.getElementById("journal-text-card");
if (elJournalTextCard) {
  elJournalTextCard.addEventListener("click", flipJournalPage);
}

// 点击拍立得明信片放大查看原图
const elPolaroid = document.getElementById("journal-polaroid");
const elLightbox = document.getElementById("photo-lightbox");
const elLightboxImg = document.getElementById("lightbox-img");
if (elPolaroid && elLightbox && elLightboxImg) {
  elPolaroid.addEventListener("click", () => {
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
  if (!journalOpen) {
    if (keys["KeyW"] || keys["ArrowUp"]) inputY += 1;
    if (keys["KeyS"] || keys["ArrowDown"]) inputY -= 1;
    if (keys["KeyD"] || keys["ArrowRight"]) inputX += 1;
    if (keys["KeyA"] || keys["ArrowLeft"]) inputX -= 1;
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

  const isRunning = keys["ShiftLeft"] || keys["ShiftRight"];
  const baseSpeed = moveDir.lengthSq() > 0 ? (isRunning ? 5.8 : 3.6) : 0;
  const speed = baseSpeed * currentSpeedFactor;

  if (speed > 0) {
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
  hiker.update(dt, elapsed, speed / 3.6);

  // 动态映射海拔表
  const curR = hiker.root.position.length();
  const hRatio = THREE.MathUtils.clamp((curR - PLANET_RADIUS + 0.2) / 2.0, 0, 1);
  const altMeters = Math.round(
    THREE.MathUtils.lerp(activePlanet.stats.baseAlt, activePlanet.stats.peakAlt, hRatio)
  );
  elHudAlt.textContent = `海拔 ${altMeters.toLocaleString()} m`;

  // 检测附近可打卡的徒步路标
  let nearest = null;
  let minAng = 0.21;
  for (const wpObj of currentWorld.waypointObjs) {
    const ang = playerUp.angleTo(wpObj.unitDir);
    if (ang < minAng) {
      minAng = ang;
      nearest = wpObj;
    }
  }
  activeWaypointNear = nearest;
  if (nearest && !journalOpen) {
    elPromptText.textContent = `按 [E] 或点击 · 探访「${nearest.data.name}」`;
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

  // 第三人称球面轨道跟随相机（丝滑俯冲 + 全角度极点无死锁）
  introZoomProgress = Math.min(1, introZoomProgress + dt * 0.85);
  const effectiveDist = THREE.MathUtils.lerp(28, camDist, 1 - Math.pow(1 - introZoomProgress, 3));

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
  const desiredTarget = hiker.root.position.clone().addScaledVector(playerUp, 0.9);

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

  renderer.render(scene, camera);
}

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
  enterPlanet,
  openStarMap,
  PLANETS,
};

initScrollMapUI();
setupTitleScene();
animate();
