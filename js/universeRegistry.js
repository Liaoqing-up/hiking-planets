/**
 * 四星主宇宙注册表与平行星系双星/三星同频配置中心
 * 将清哥 (mine)、Kitty、咩咩、Luca 四套星主标题、诗词、封面星球与跨宇宙同频关系集中管理，
 * 新增或调整星主配置只需修改此表，彻底消除散落在控制器中的多分支三元表达式。
 */

import * as THREE from "three";
import { PLANETS as MY_PLANETS } from "./data.js?v=5.3.1-uncharted-galaxies";
import { KITTY_PLANETS, NEIGHBOR_PROFILES } from "./kittyUniverse.js?v=5.3.1-uncharted-galaxies";
import { MIEMIE_PLANETS } from "./miemieUniverse.js?v=5.3.1-uncharted-galaxies";
import { LUCA_PLANETS } from "./lucaUniverse.js?v=5.3.1-uncharted-galaxies";
import { latLonToUnitVec } from "./sphereMath.js?v=5.3.1-uncharted-galaxies";

export const VALID_HOST_ROLES = ["mine", "kitty", "miemie", "luca"];

export function normalizeHostRole(role) {
  return VALID_HOST_ROLES.includes(role) ? role : "mine";
}

export function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Luca 扉页专属 3D 环岛骑行赛道切向基座
export const TITLE_BIKE_UP = latLonToUnitVec(75, -14);
export const TITLE_BIKE_FWD = new THREE.Vector3(-0.82, 0, 0.57)
  .sub(TITLE_BIKE_UP.clone().multiplyScalar(new THREE.Vector3(-0.82, 0, 0.57).dot(TITLE_BIKE_UP)))
  .normalize();
export const TITLE_BIKE_AXIS = new THREE.Vector3().crossVectors(TITLE_BIKE_UP, TITLE_BIKE_FWD).normalize();
export const TITLE_BIKE_BASIS = new THREE.Matrix4().makeBasis(
  TITLE_BIKE_AXIS,
  TITLE_BIKE_UP,
  TITLE_BIKE_FWD
);

export const HOST_REGISTRY = {
  mine: {
    id: "mine",
    name: "清哥",
    icon: "🪐",
    badgeIcon: "🏔️",
    outfit: "mine-host",
    isCyclingCover: false,
    coverScale: 1.0,
    docTitle: "清哥的苍山星河 · 山海皆星辰 | TRAILS AMONG THE STARS",
    titleEyebrow: "AZURE PEAKS & STARRY SEAS · 苍山星河主场",
    titleHeading: "清哥的苍山星河",
    titlePoem: "有些山川太过辽阔，记忆便把走过的每一段路，凝成了一片只属于清哥的苍山星河。",
    startBtnText: "✦ 开启清哥的苍山星河",
    tabSelfText: "🏔️ 我的星系 (苍山星河)",
    tabNeighborText: "🏔️ 清哥的苍山星河",
    tabOrder: ["mine", "kitty", "miemie", "luca"],
    switchToast: "🏔️ 已切换为清哥主场 · 苍山星河",
    warpLabel: "✦ 跃迁至清哥的苍山星河 ✦",
    mapHeadingSelf: "清哥的苍山星河",
    mapHeadingNeighbor: "清哥的苍山星河",
    mapLatin: "QINGGE'S AZURE PEAKS & STARRY SEAS · UNIVERSE A",
    mapSubtitleNeighbor: "欢迎串门！这是清哥丈量过大漠、雪峰、峡谷与海湾点亮的苍山星河",
    resColCls: "",
    resTagCls: "",
    coverWorld: {
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
    },
  },
  kitty: {
    id: "kitty",
    name: "Kitty",
    icon: "🐾",
    badgeIcon: "🐾",
    outfit: "kitty-host",
    isCyclingCover: false,
    coverScale: 1.0,
    docTitle: "Kitty 的星球 · 猫耳星云 | TRAILS AMONG THE STARS",
    titleEyebrow: "KITTY AMONG THE STARS · 猫耳星云主场",
    titleHeading: "Kitty 的星球",
    titlePoem:
      "心里总有一座小五台，去追日落的最后八分钟，把长白天池、银河与山野小猫都凝成只属于 Kitty 的星球。",
    startBtnText: `✦ 开启 Kitty 的 ${KITTY_PLANETS.length} 颗星球`,
    tabSelfText: "🐾 我的星系 (Kitty)",
    tabNeighborText: "🐾 Kitty 的星系",
    tabOrder: ["kitty", "mine", "miemie", "luca"],
    switchToast: "🐾 已切换为 Kitty 主场 · 猫耳星云",
    warpLabel: "✦ 跃迁至 Kitty 的猫耳星云 ✦",
    mapHeadingSelf: "Kitty 的山海旅程",
    mapHeadingNeighbor: "Kitty 的猫耳星云",
    mapLatin: "KITTY'S STARRY TRAILS · UNIVERSE K",
    mapSubtitleNeighbor: "欢迎串门！这是好朋友 Kitty 走过的七颗山海星球与偶遇的小生灵",
    resColCls: "kitty-col",
    resTagCls: "kitty-tag",
    coverWorld: {
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
    },
  },
  miemie: {
    id: "miemie",
    name: "咩咩",
    icon: "🐑",
    badgeIcon: "🐑",
    outfit: "miemie-host",
    isCyclingCover: false,
    coverScale: 1.0,
    docTitle: "咩咩的星球 · 咩星崛起 | TRAILS AMONG THE STARS",
    titleEyebrow: "MIEMIE RISING · 绵羊星云主场",
    titleHeading: "咩咩的星球",
    titlePoem:
      "从安顺喀斯特地心宇宙、内蒙火星红崖与黑色火山口，走到呼伦贝尔金草垛与重装亚丁的无信号雪林。",
    startBtnText: `✦ 开启咩咩的 ${MIEMIE_PLANETS.length} 颗星球`,
    tabSelfText: "🐑 我的星系 (咩咩)",
    tabNeighborText: "🐑 咩咩的星系",
    tabOrder: ["miemie", "mine", "kitty", "luca"],
    switchToast: "🐑 已切换为咩咩主场 · 绵羊星云",
    warpLabel: "✦ 跃迁至咩咩的绵羊星云 ✦",
    mapHeadingSelf: "咩咩的山海旅程",
    mapHeadingNeighbor: "咩咩的绵羊星云",
    mapLatin: "MIEMIE RISING · UNIVERSE M",
    mapSubtitleNeighbor:
      "欢迎串门！这是好朋友咩咩从贵州喀斯特地心、内蒙火山草原走到亚丁重装反穿的四颗星球",
    resColCls: "miemie-col",
    resTagCls: "miemie-tag",
    coverWorld: {
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
    },
  },
  luca: {
    id: "luca",
    name: "Luca",
    icon: "🚴",
    badgeIcon: "🚴",
    outfit: "luca-host",
    isCyclingCover: true,
    coverScale: 1.35,
    docTitle: "Luca 的星球 · 追风车辙星云 | TRAILS AMONG THE STARS",
    titleEyebrow: "RIDING THE BREEZE · 追风车辙星云主场",
    titleHeading: "Luca 的星球",
    titlePoem:
      "心中的海岛桃花源——车轮滚过九百四十八公里椰林海浪与天山雪岭，把迎风转动的自由都凝成星球。",
    startBtnText: `✦ 开启 Luca 的 ${LUCA_PLANETS.length} 颗骑行星球`,
    tabSelfText: "🚴 我的星系 (Luca)",
    tabNeighborText: "🚴 Luca 的星系",
    tabOrder: ["luca", "mine", "kitty", "miemie"],
    switchToast: "🚴 已切换为 Luca 主场 · 追风车辙星云",
    warpLabel: "✦ 跃迁至 Luca 的追风车辙星云 ✦",
    mapHeadingSelf: "Luca 的骑行旅程",
    mapHeadingNeighbor: "Luca 的追风车辙星云",
    mapLatin: "LUCA'S CYCLING ODYSSEY · UNIVERSE L",
    mapSubtitleNeighbor: "欢迎串门！这是好朋友 Luca 迎着海风环海南岛 948km 与天山雪岭骑行的两颗星球",
    resColCls: "luca-col",
    resTagCls: "luca-tag",
    coverWorld: {
      id: "title",
      terrainType: "maclehose",
      name: "破风起点星",
      palette: {
        halo: "#38bdf8",
        low: "#1e7a68",
        mid: "#49a87a",
        high: "#fef3c7",
        water: "#0284c7",
        particle: "#bae6fd",
      },
      waypoints: [],
      titleCyclingTrack: { upDir: TITLE_BIKE_UP, fwdDir: TITLE_BIKE_FWD },
    },
  },
};

export const RESONANCE_CLUSTERS = [
  {
    ids: ["zhagana", "kitty-zhagana"],
    title: "甘南双星同频 · 措美峰与扎尕那",
    members: { mine: "zhagana", kitty: "kitty-zhagana" },
  },
  {
    ids: ["yili", "kitty-wusun", "luca-tianshan"],
    title: "天山山野同频 · 伊犁、乌孙古道与雪岭骑行",
    members: { mine: "yili", kitty: "kitty-wusun", luca: "luca-tianshan" },
  },
  {
    ids: ["yading", "kitty-yading", "miemie-yading"],
    title: "川西双星同频 · 稻城亚丁三神山",
    members: { mine: "yading", kitty: "kitty-yading", miemie: "miemie-yading" },
  },
];

export function queryCoreUniversePlanets(uni) {
  if (uni === "kitty") return [...KITTY_PLANETS];
  if (uni === "miemie") return [...MIEMIE_PLANETS];
  if (uni === "luca") return [...LUCA_PLANETS];
  return [...MY_PLANETS];
}

export function queryUniversePlanets(uni, guestPlanets = [], customUserPlanets = [], boundLegacyMap = {}) {
  const customForRole = (role) => {
    const allowedHandle = boundLegacyMap && boundLegacyMap[role] ? String(boundLegacyMap[role]).toLowerCase() : null;
    return customUserPlanets.filter(
      (p) =>
        p &&
        (p.legacyRole === role ||
          (allowedHandle && String(p.ownerHandle || "").toLowerCase() === allowedHandle))
    );
  };
  if (uni === "custom") return [...customUserPlanets];
  if (uni === "kitty") return [...KITTY_PLANETS, ...customForRole("kitty")];
  if (uni === "miemie") return [...MIEMIE_PLANETS, ...customForRole("miemie")];
  if (uni === "luca") return [...LUCA_PLANETS, ...customForRole("luca")];
  return [...MY_PLANETS, ...guestPlanets, ...customForRole("mine")];
}

export function queryAllPlanets(guestPlanets = [], customUserPlanets = []) {
  return [...MY_PLANETS, ...KITTY_PLANETS, ...MIEMIE_PLANETS, ...LUCA_PLANETS, ...guestPlanets, ...customUserPlanets];
}

export function checkPlanetResonance(planet, activeHostRole) {
  if (!planet || (planet.owner || "mine") === activeHostRole) return false;
  return RESONANCE_CLUSTERS.some(
    (c) => c.ids.includes(planet.id) && Boolean(c.members[activeHostRole])
  );
}

export function isLucaCyclingPlanet(planet) {
  return Boolean(planet && (planet.owner === "luca" || String(planet.id || "").startsWith("luca-")));
}

export function getUniverseProfile(uni) {
  return NEIGHBOR_PROFILES[uni] || NEIGHBOR_PROFILES.mine;
}
