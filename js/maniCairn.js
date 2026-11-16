import * as THREE from "three";
import { latLonToUnitVec, getSurfaceRadius } from "./planetBuilder3D.js";

const SEED_NOTES = {
  tengger: [
    { author: "沙漠旅人", text: "混着沙子的米饭也算风味人间✨" },
    { author: "星夜看客", text: "沙漠夜空的烟花太浪漫了！" },
  ],
  yading: [
    { author: "垭口同路人", text: "致敬风雪夜死守弯帐杆的狠人⛺" },
    { author: "山友", text: "松多垭口的风吹走了所有烦恼" },
  ],
  zhagana: [
    { author: "重装搭子", text: "十一个垭口走完，膝盖值得敬一杯！" },
    { author: "路过的风", text: "石城晨雾升起那一刻太值了" },
  ],
  siguniang: [
    { author: "五千米的雪", text: "四年之约，恭喜终于摸到 5025 石碑！" },
    { author: "攀山者", text: "日照金山会眷顾每一个早起赶路的人" },
  ],
  maclehose: [
    { author: "海风", text: "咸田湾的海浪祝你年年自由快乐🎂" },
    { author: "麦径行者", text: "山海相连的蓝，看一眼记好多年" },
  ],
  yili: [
    { author: "追月亮的人", text: "大海道升起的那轮黄月亮太绝了🌕" },
    { author: "旷野过客", text: "愿你永远拥有奔向伊犁夏天的勇气" },
  ],
};

const STORAGE_KEY = "trails_among_stars_mani_v1";

export function loadManiNotes(planetId) {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {};
  } catch {
    saved = {};
  }
  const custom = Array.isArray(saved[planetId]) ? saved[planetId] : [];
  return [...custom, ...(SEED_NOTES[planetId] || [])];
}

export function addManiNote(planetId, author, text) {
  const cleanText = String(text || "").trim().slice(0, 28);
  const cleanAuthor = String(author || "过路星客").trim().slice(0, 10) || "过路星客";
  if (!cleanText) return loadManiNotes(planetId);
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {};
  } catch {
    saved = {};
  }
  if (!Array.isArray(saved[planetId])) saved[planetId] = [];
  saved[planetId].unshift({
    author: cleanAuthor,
    text: cleanText,
    ts: Date.now(),
  });
  saved[planetId] = saved[planetId].slice(0, 20);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {
    /* ignore */
  }
  return loadManiNotes(planetId);
}

const CAIRN_ANCHOR_WP = {
  siguniang: "siguniang-2", // 四姑娘山 · 大峰之巅 (5025m 石碑旁)
  yading: "yading-3",       // 海拔 4900m 垭口
  zhagana: "zhagana-2",     // 红军垭口
  tengger: "tengger-4",     // 神树与沙漠邮局
  maclehose: "maclehose-3", // 最美海岸山脊
  yili: "yili-1",           // 松树头山脊
};

export function buildManiCairn3D(planetConfig) {
  const pid = planetConfig.id;
  // 精准放置在代表性峰顶/垭口旁（如四姑娘山大峰 5025m 石碑近旁同屏可见处）
  const targetWpId = CAIRN_ANCHOR_WP[pid];
  const peakWp =
    planetConfig.waypoints.find((w) => w.id === targetWpId) ||
    planetConfig.waypoints[planetConfig.waypoints.length - 1];
  const unitDir = latLonToUnitVec(peakWp.lat - 4.5, peakWp.lon + 8.5);
  const surfR = getSurfaceRadius(pid, unitDir);

  const group = new THREE.Group();
  group.position.copy(unitDir).multiplyScalar(surfR);
  group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), unitDir);

  const stoneColors = ["#d6d3d1", "#a8a29e", "#e7e5e4", "#c7b9a5", "#94a3b8"];
  const stackGroup = new THREE.Group();
  const baseLayers = [
    { y: 0.07, r: 0.28, sy: 0.5 },
    { y: 0.19, r: 0.22, sy: 0.52 },
    { y: 0.3, r: 0.165, sy: 0.55 },
    { y: 0.4, r: 0.12, sy: 0.58 },
    { y: 0.49, r: 0.08, sy: 0.65 },
  ];
  baseLayers.forEach((l, i) => {
    const m = new THREE.Mesh(
      new THREE.DodecahedronGeometry(l.r, 0),
      new THREE.MeshStandardMaterial({
        color: stoneColors[i % stoneColors.length],
        roughness: 0.85,
      })
    );
    m.scale.set(1.08, l.sy, 0.96);
    m.position.y = l.y;
    m.rotation.y = i * 1.1;
    stackGroup.add(m);
  });

  // 五彩风马经幡小木杆
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.018, 0.78, 6),
    new THREE.MeshStandardMaterial({ color: "#78553a", roughness: 0.9 })
  );
  pole.position.set(0.06, 0.45, 0);
  pole.rotation.z = -0.12;
  stackGroup.add(pole);

  const flagColors = ["#3b82f6", "#f8fafc", "#ef4444", "#22c55e", "#eab308"];
  const flags = [];
  flagColors.forEach((fc, idx) => {
    const f = new THREE.Mesh(
      new THREE.PlaneGeometry(0.085, 0.055),
      new THREE.MeshBasicMaterial({ color: fc, side: THREE.DoubleSide })
    );
    f.position.set(0.11 + idx * 0.065, 0.76 - idx * 0.065, 0);
    stackGroup.add(f);
    flags.push({ mesh: f, phase: idx * 0.7 });
  });

  // 环绕玛尼堆的星尘微光粒子（象征前人留下的寄语）
  const moteGroup = new THREE.Group();
  const moteMat = new THREE.MeshBasicMaterial({ color: "#fde68a" });
  const motes = [];
  for (let i = 0; i < 6; i++) {
    const sp = new THREE.Mesh(new THREE.SphereGeometry(0.026, 6, 6), moteMat);
    moteGroup.add(sp);
    motes.push({ mesh: sp, idx: i });
  }

  group.add(stackGroup, moteGroup);
  let extraCount = Math.max(0, loadManiNotes(pid).length - 2);

  function addVisualStone() {
    const stone = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.072, 0),
      new THREE.MeshStandardMaterial({
        color: "#fde68a",
        emissive: "#f59e0b",
        emissiveIntensity: 0.45,
        roughness: 0.5,
      })
    );
    const ang = extraCount * 1.7;
    stone.position.set(Math.cos(ang) * 0.24, 0.08 + (extraCount % 3) * 0.06, Math.sin(ang) * 0.24);
    stone.scale.y = 0.65;
    stackGroup.add(stone);
    extraCount++;
  }
  for (let i = 0; i < Math.min(extraCount, 6); i++) addVisualStone();

  return {
    group,
    unitDir,
    addVisualStone,
    update(elapsed) {
      for (const fl of flags) {
        fl.mesh.rotation.y = Math.sin(elapsed * 4.5 + fl.phase) * 0.32;
      }
      for (const m of motes) {
        const a = elapsed * 0.9 + (m.idx / motes.length) * Math.PI * 2;
        m.mesh.position.set(
          Math.cos(a) * 0.34,
          0.32 + Math.sin(elapsed * 2 + m.idx) * 0.16,
          Math.sin(a) * 0.34
        );
      }
    },
  };
}
