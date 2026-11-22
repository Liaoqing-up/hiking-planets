/**
 * V4.0 星球邻居社交引擎 (Cosmic Neighbors Social System)
 * 包含：
 * 1. 3D 星球主人驻留迎宾实体 (Kitty 猫耳帽行者 + 鎏金串门邮筒 + 双星同频水晶碑 + 走近挥手互动)
 * 2. 双人同框星际串门拍立得纪念照合成器 (带猫爪串门邮戳 & 直达二维码)
 * 3. 星际串门邮筒留言板 + 玫瑰投递 + 平行时空「双星同频」对照卷轴
 * 4. 零后端「创造我的客座星球」生成器 (?guest= Base64URL 分享直达链接)
 */

import * as THREE from "three";
import {
  latLonToUnitVec,
  getSurfaceRadius,
  registerGuestTerrain,
} from "./sphereMath.js?v=5.3.1-uncharted-galaxies";
import { buildHikerCharacter } from "./hikerCharacter3D.js?v=5.3.1-uncharted-galaxies";
import { drawSiteQrStamp, drawPostmarkSeal } from "./qrStamp.js?v=5.3.1-uncharted-galaxies";

const UP = new THREE.Vector3(0, 1, 0);
const SOCIAL_STORAGE_KEY = "hiking_planets_neighbor_social_v4";

export function loadSocialState() {
  try {
    const raw = localStorage.getItem(SOCIAL_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      roses: { kitty: 18, miemie: 18, luca: 18, mine: 16, ...(parsed.roses || {}) },
      visitors: { kitty: 14, miemie: 16, luca: 12, mine: 19, ...(parsed.visitors || {}) },
      visitorNames: parsed.visitorNames && typeof parsed.visitorNames === "object" ? parsed.visitorNames : {},
      notes: {
        kitty: [
          { from: "清哥", badge: "🏔️ 同款山友", text: "太惊喜啦！原来我们都走过亚丁和措美峰扎尕那，来你的星球追日落八分钟啦！", time: "星历 · 初访" },
          { from: "追风旅人", badge: "🐱 撸猫打卡", text: "小五台草甸和长白天池都太治愈了，石头上的小猫咪和亚丁小松鼠好萌！", time: "星历 · 串门" },
        ],
        miemie: [
          { from: "清哥", badge: "🎒 重装同频", text: "七人六天五晚自主重装反穿亚丁太酷了！铜鼓荡地心瀑布和龙脊人间塞尔达也绝美！", time: "星历 · 初访" },
          { from: "Kitty", badge: "🐾 星际邻居", text: "来咩星串门啦！麝香洞的地心宇宙穹顶和猫跳峡也太神奇了吧🌹", time: "星历 · 串门" },
        ],
        luca: [
          { from: "清哥", badge: "🚴 追风同频", text: "七天 948 公里环海南岛太热血了！而且我们在同一脉新疆天山留下了山野足迹！", time: "星历 · 初访" },
          { from: "Kitty", badge: "🏔️ 天山邻居", text: "从北纬18°椰林海风一路骑到天山雪岭木屋营地，少年感拉满🌹", time: "星历 · 串门" },
        ],
        mine: [
          { from: "Kitty", badge: "🐾 猫耳邻居", text: "来串门啦！原来我们在亚丁、扎尕那和天山都吹过同一阵山风，送你一朵星辰玫瑰🌹", time: "星历 · 初访" },
          { from: "咩咩", badge: "🐑 咩星邻居", text: "背着大包从没有信号的雪山路过你的星球，路线不止一条，我们都在路上✨", time: "星历 · 串门" },
        ],
        ...(parsed.notes || {}),
      },
      customPlanets: Array.isArray(parsed.customPlanets) ? parsed.customPlanets : [],
    };
  } catch {
    return {
      roses: { kitty: 18, miemie: 18, luca: 18, mine: 16 },
      visitors: { kitty: 14, miemie: 16, luca: 12, mine: 19 },
      visitorNames: {},
      notes: { kitty: [], miemie: [], luca: [], mine: [] },
      customPlanets: [],
    };
  }
}

export function saveSocialState(state) {
  try {
    localStorage.setItem(SOCIAL_STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

// ==================== 零后端客座邻居星球 URL 编解码 ====================
const GUEST_TEMPLATES = {
  volcano: {
    terrain: "kitty-changbai", label: "🌋 火山蔚蓝天池",
    palette: { halo: "#7ec4ff", low: "#4a7f5e", mid: "#6fa377", high: "#eef5ff", rock: "#626b7a", water: "#1a74d4", particle: "#d8f0ff" },
    sceneArt: "snow_lake",
  },
  sunset: {
    terrain: "kitty-sunset", label: "🌅 旷野风车日落",
    palette: { halo: "#ff9e6d", low: "#3d466e", mid: "#9e6378", high: "#ffb87a", rock: "#564b6e", water: "#4c5c96", particle: "#ffe0a6" },
    sceneArt: "starry_forest",
  },
  snow: {
    terrain: "yading", label: "🏔️ 雪山冰川圣湖",
    palette: { halo: "#ffd28a", low: "#4d7a58", mid: "#95a8b8", high: "#f8fbff", rock: "#6f7c8f", water: "#189ad6", particle: "#fff0c2" },
    sceneArt: "snow_tent",
  },
  desert: {
    terrain: "tengger", label: "🏜️ 大漠星海红湖",
    palette: { halo: "#f5b963", low: "#d48c46", mid: "#e8af64", high: "#fae0a8", rock: "#9c5e35", water: "#c93b3b", particle: "#ffe59e" },
    sceneArt: "yardang_moon",
  },
  coast: {
    terrain: "maclehose", label: "🌊 山海奇岸灯塔",
    palette: { halo: "#64d8e8", low: "#48965a", mid: "#7bc46c", high: "#f2ebd4", rock: "#bfa074", water: "#159ab8", particle: "#d4fbff" },
    sceneArt: "sea_cliff",
  },
  meadow: {
    terrain: "kitty-daqing", label: "⛺ 云端绿茵营地",
    palette: { halo: "#9ce082", low: "#3b824e", mid: "#78c268", high: "#e8f7df", rock: "#7a8578", water: "#3fa4d8", particle: "#eaffc7" },
    sceneArt: "meadow_camp",
  },
};

export { GUEST_TEMPLATES };

export function encodeGuestPlanetPayload(cfg) {
  const mini = {
    o: (cfg.ownerName || "远方山友").slice(0, 12),
    n: (cfg.planetName || "无名山海星").slice(0, 16),
    e: (cfg.elevation || "2400m").slice(0, 12),
    t: GUEST_TEMPLATES[cfg.template] ? cfg.template : "volcano",
    c: cfg.creature || "kitty-changbai",
    q: (cfg.quote || "把走过的山风与星光搓成星球，欢迎来我的营地坐坐。").slice(0, 80),
    m: (cfg.memory || "每一次系紧鞋带出发，都是去往自由的星辰之旅。").slice(0, 120),
  };
  const bytes = new TextEncoder().encode(JSON.stringify(mini));
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeGuestPlanetPayload(token) {
  try {
    const b64 = token.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
    const mini = JSON.parse(new TextDecoder().decode(bytes));
    return hydrateGuestPlanet(mini, "guest-shared");
  } catch {
    return null;
  }
}

export function hydrateGuestPlanet(mini, idOverride) {
  const tplKey = GUEST_TEMPLATES[mini.t] ? mini.t : "volcano";
  const tpl = GUEST_TEMPLATES[tplKey];
  const seedHash = Math.abs(hashStr(`${mini.o || ""}|${mini.n || ""}|${mini.e || ""}`));
  const pid = idOverride || mini.slug || `guest-${seedHash}`;
  const seedAngle = ((seedHash % 360) * Math.PI) / 180;
  registerGuestTerrain(pid, tpl.terrain, seedAngle);

  const customWps =
    Array.isArray(mini.wps) && mini.wps.length > 0
      ? mini.wps.map((w, idx) => ({
          id: `${pid}-${idx + 1}`,
          name: w.name || `${mini.n} · 印记 ${idx + 1}`,
          shortName: w.shortName || (idx === 0 ? "出发山口" : idx === mini.wps.length - 1 ? "绝景之巅" : `驿站 ${idx + 1}`),
          elevation: w.elevation || mini.e || "云端",
          lat: typeof w.lat === "number" ? w.lat : [34, -18, 22, -32][idx % 4],
          lon: typeof w.lon === "number" ? w.lon : [16, 108, -74, -158][idx % 4],
          photo: w.photo || undefined,
          sceneArt: w.sceneArt || (idx === 0 ? tpl.sceneArt : "starry_forest"),
          caption: w.caption || `${mini.o} 在 ${mini.n} 留下的旅途影像`,
          poem: w.poem || mini.q,
          memory: w.memory || mini.m,
        }))
      : [
          {
            id: `${pid}-1`,
            name: `${mini.n} · 起点山门`,
            shortName: "出发山口",
            elevation: mini.e || "山野起点",
            lat: 34,
            lon: 16,
            photo: Array.isArray(mini.p) && mini.p[0] ? mini.p[0] : undefined,
            sceneArt: tpl.sceneArt,
            caption: `${mini.o} 在 ${mini.n} 留下的第一枚星辰路标`,
            poem: mini.q,
            memory: mini.m,
          },
          {
            id: `${pid}-2`,
            name: `${mini.n} · 云端绝景之巅`,
            shortName: "绝景之巅",
            elevation: `${mini.e} · 最高处`,
            lat: -18,
            lon: 108,
            photo: Array.isArray(mini.p) && (mini.p[1] || mini.p[0]) ? mini.p[1] || mini.p[0] : undefined,
            sceneArt: "starry_forest",
            caption: `${mini.o} 的星夜营地与山巅远眺`,
            poem: "两颗各自发光的星球，因为同样热爱山海，在同一片星空下成为了邻居。",
            memory: `来自星球主人 ${mini.o} 的寄语：“${mini.m}” —— 欢迎随时来我的星球吹风烤火！`,
          },
        ];

  return {
    id: pid,
    slug: mini.slug || pid,
    terrainType: tpl.terrain,
    creatureType: mini.c || "kitty-changbai",
    owner: mini.ownerHandle || "guest",
    ownerHandle: mini.ownerHandle || null,
    ownerName: mini.o || "远方山友",
    code: `G-${(mini.e || "STAR").replace(/[^0-9A-Za-z]/g, "").slice(0, 4) || "2026"}`,
    chapter: `好友客座星球 · ${mini.o} 的记忆`,
    name: mini.n || "山友的秘境星",
    subtitle: `${tpl.label.replace(/^.\s*/, "")} · ${mini.o} 邀你串门漫步`,
    days: "好友造星",
    distance: "星际串门",
    maxElevation: mini.e || "云端",
    region: `${mini.o} 的定制星域`,
    bgmName: `星邻微风 · ${mini.n}`,
    stats: (() => {
      const parsedPeak = parseInt(String(mini.e || "").replace(/[^0-9]/g, ""), 10) || 2680;
      return {
        distance: "好友造星",
        altitude: mini.e || `${parsedPeak}m`,
        days: "星际串门",
        baseAlt: Math.max(400, Math.round(parsedPeak * 0.62)),
        peakAlt: parsedPeak,
      };
    })(),
    quote: mini.q || "欢迎来到我亲手创造的徒步星球！",
    hostSpotGreeting: `👋 ${mini.o}：欢迎串门降落我的「${mini.n}」星球！快去打卡路标看看我的故事吧～`,
    guestRaw: mini,
    palette: {
      skyDay: "#111b38",
      skyNight: "#060918",
      ...tpl.palette,
    },
    waypoints: customWps,
  };
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

export function encodeReplyLetter({ toOwner, from, text, roses = 1 }) {
  const json = JSON.stringify({ to: toOwner || "mine", f: (from || "星友").slice(0, 16), m: (text || "").slice(0, 110), r: roses });
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeReplyLetter(token) {
  try {
    const b64 = token.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

// ==================== 3D 星球主人迎宾实体 + 串门邮筒 + 双星同频碑 ====================
export function buildNeighborSocialRig(planet, resonanceInfo = null, activeHostRole = "mine", isSelfOwnedPlanet = null) {
  const group = new THREE.Group();
  const planetOwner = planet.owner || "mine";
  // 谁登录谁是主场：当星球归属 !== 当前登录身份时即为「串门拜访邻居」；或者双星同频星球上互派同行伙伴驻守！
  const isNotHome = isSelfOwnedPlanet !== null ? !isSelfOwnedPlanet : planetOwner !== activeHostRole;
  const isNeighborPlanet = isNotHome || Boolean(resonanceInfo);
  const partnerOwner = resonanceInfo?.partnerId?.startsWith("kitty-")
    ? "kitty"
    : resonanceInfo?.partnerId?.startsWith("miemie-")
      ? "miemie"
      : resonanceInfo?.partnerId?.startsWith("luca-")
        ? "luca"
        : "mine";
  const residentRole = isNotHome ? planetOwner : partnerOwner;

  // 选定迎宾站位：homeHostUp 记录初始营地驻守位，hostUp 为星主实时球面坐标（支持并肩同行跟随！）
  const wp0 = planet.waypoints[0] || { lat: 20, lon: 10 };
  const homeHostUp = isNotHome
    ? latLonToUnitVec(wp0.lat - 5, wp0.lon - 28)
    : latLonToUnitVec(wp0.lat + 7, wp0.lon - 18);
  const hostUp = homeHostUp.clone();
  const resUp = latLonToUnitVec(wp0.lat + 8, wp0.lon - 22);

  let hostChar = null;
  let bottleGroup = null;
  let bottleFloatPivot = null;
  let hostGlowRing = null;
  let hostCharmOrbit = null;
  let greetedOnce = false;
  let isFollowing = false;
  let isHostCycling = false;

  // 🍾 星际漂流瓶放在出生点右侧首屏可视近景位（与左侧驻守星主隔着主角左右对称分开 >=30°，首屏一眼可见且互不干扰）
  bottleGroup = new THREE.Group();
  const spawnLat = planet.id === "luca-hainan" ? 15 : planet.id === "luca-tianshan" ? -17 : wp0.lat - 12;
  const spawnLon = planet.id === "luca-hainan" ? -28 : planet.id === "luca-tianshan" ? -110 : wp0.lon - 14;
  const avoidDirs = [
    homeHostUp,
    resUp,
    ...(planet.waypoints || []).map((w) => latLonToUnitVec(w.lat, w.lon)),
  ];
  if (planet.id === "luca-hainan") avoidDirs.push(latLonToUnitVec(20, -34));
  if (planet.id === "luca-tianshan") avoidDirs.push(latLonToUnitVec(-20, -118));
  const bottleCandidates = [
    [spawnLat - 2, spawnLon + 22],
    [spawnLat + 5, spawnLon + 24],
    [spawnLat - 8, spawnLon + 20],
    [spawnLat - 12, spawnLon + 12],
    [spawnLat - 14, spawnLon - 4],
    [spawnLat + 10, spawnLon + 26],
  ].map(([la, lo]) => latLonToUnitVec(la, lo));
  let pbUp = bottleCandidates[0];
  let bestScore = -1;
  for (const cand of bottleCandidates) {
    const distHost = cand.distanceTo(homeHostUp);
    if (distHost < 0.48) continue;
    const minClear = Math.min(...avoidDirs.map((d) => cand.distanceTo(d)));
    if (minClear > bestScore) {
      bestScore = minClear;
      pbUp = cand;
    }
  }
  const pbR = getSurfaceRadius(planet.id, pbUp);
  const bottleTint =
    planetOwner === "kitty"
      ? { ring: "#f9a8d4", glass: "#fbcfe8", emi: "#ec4899" }
      : planetOwner === "miemie"
        ? { ring: "#6ee7b7", glass: "#a7f3d0", emi: "#10b981" }
        : planetOwner === "luca"
          ? { ring: "#38bdf8", glass: "#bae6fd", emi: "#0284c7" }
          : { ring: "#7dd3fc", glass: "#93c5fd", emi: "#3b82f6" };
  const bottleRipple = new THREE.Mesh(
    new THREE.RingGeometry(0.28, 0.42, 28),
    new THREE.MeshBasicMaterial({
      color: bottleTint.ring,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
    })
  );
  bottleRipple.rotation.x = Math.PI / 2;
  bottleRipple.position.y = 0.03;

  bottleFloatPivot = new THREE.Group();
  bottleFloatPivot.position.y = 0.36;
  bottleFloatPivot.rotation.z = 0.28; // 微倾漂流姿态
  const glassMat = new THREE.MeshStandardMaterial({
    color: bottleTint.glass,
    emissive: bottleTint.emi,
    emissiveIntensity: 0.28,
    roughness: 0.12,
    metalness: 0.1,
    transparent: true,
    opacity: 0.68,
  });
  const bottleBody = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.15, 0.38, 14), glassMat);
  const bottleShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.142, 14, 10), glassMat);
  bottleShoulder.position.y = 0.16;
  const bottleNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.075, 0.14, 12), glassMat);
  bottleNeck.position.y = 0.29;
  const cork = new THREE.Mesh(
    new THREE.CylinderGeometry(0.066, 0.056, 0.09, 10),
    new THREE.MeshStandardMaterial({ color: "#c69255", roughness: 0.85 })
  );
  cork.position.y = 0.37;
  const goldRibbon = new THREE.Mesh(
    new THREE.TorusGeometry(0.068, 0.014, 8, 16),
    new THREE.MeshStandardMaterial({ color: "#fbbf24", emissive: "#f59e0b", emissiveIntensity: 0.45 })
  );
  goldRibbon.rotation.x = Math.PI / 2;
  goldRibbon.position.y = 0.26;
  const scrollLetter = new THREE.Mesh(
    new THREE.CylinderGeometry(0.042, 0.042, 0.24, 10),
    new THREE.MeshStandardMaterial({ color: "#fef3c7", emissive: "#fde68a", emissiveIntensity: 0.65 })
  );
  scrollLetter.rotation.z = -0.18;
  scrollLetter.position.set(-0.02, -0.02, 0);
  const miniRose = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.052, 0),
    new THREE.MeshStandardMaterial({ color: "#f43f5e", emissive: "#e11d48", emissiveIntensity: 0.7 })
  );
  miniRose.position.set(0.04, 0.08, 0.02);
  bottleFloatPivot.add(bottleBody, bottleShoulder, bottleNeck, cork, goldRibbon, scrollLetter, miniRose);

  // 🍾 漂流瓶顶部「未读新来信」闪烁八角金星信标
  const bottleBeaconGroup = new THREE.Group();
  bottleBeaconGroup.position.set(0, 0.92, 0);
  bottleBeaconGroup.visible = false;
  const beaconStar = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.11, 0),
    new THREE.MeshStandardMaterial({ color: "#fde047", emissive: "#f59e0b", emissiveIntensity: 1.15, roughness: 0.15 })
  );
  const beaconHalo = new THREE.Mesh(
    new THREE.RingGeometry(0.14, 0.19, 20),
    new THREE.MeshBasicMaterial({ color: "#fef08a", side: THREE.DoubleSide, transparent: true, opacity: 0.78 })
  );
  bottleBeaconGroup.add(beaconStar, beaconHalo);

  const bottlePillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.19, 1.05, 14, 1, true),
    new THREE.MeshBasicMaterial({
      color: bottleTint.ring,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  bottlePillar.position.y = 0.54;

  bottleGroup.add(bottleRipple, bottlePillar, bottleFloatPivot, bottleBeaconGroup);
  bottleGroup.scale.setScalar(1.18);
  bottleGroup.position.copy(pbUp).multiplyScalar(pbR);
  bottleGroup.quaternion.setFromUnitVectors(UP, pbUp);
  group.add(bottleGroup);

  if (isNeighborPlanet) {
    hostChar = buildHikerCharacter();
    const outfitKey =
      residentRole === "kitty"
        ? "kitty-host"
        : residentRole === "miemie"
          ? "miemie-host"
          : residentRole === "luca"
            ? "luca-host"
            : planet.ownerOutfit
              ? planet.ownerOutfit
              : planetOwner === "mine"
                ? planet.id
                : "gold";
    hostChar.setOutfit(outfitKey);
    const r = getSurfaceRadius(planet.id, hostUp);
    hostChar.root.position.copy(hostUp).multiplyScalar(r);
    const fwd = new THREE.Vector3(0, 1, 0).sub(hostUp.clone().multiplyScalar(hostUp.y));
    if (fwd.lengthSq() < 0.001) fwd.set(1, 0, 0).sub(hostUp.clone().multiplyScalar(hostUp.x));
    fwd.normalize();
    const right = new THREE.Vector3().crossVectors(hostUp, fwd).normalize();
    fwd.crossVectors(right, hostUp).normalize();
    hostChar.root.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, hostUp, fwd));
    group.add(hostChar.root);

    // 脚下温柔呼吸的迎宾光环
    hostGlowRing = new THREE.Mesh(
      new THREE.RingGeometry(0.42, 0.54, 28),
      new THREE.MeshBasicMaterial({
        color:
          residentRole === "kitty"
            ? "#f9a8d4"
            : residentRole === "miemie"
              ? "#6ee7b7"
              : residentRole === "luca"
                ? "#38bdf8"
                : "#fde68a",
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.72,
      })
    );
    hostGlowRing.position.copy(hostUp).multiplyScalar(r + 0.03);
    hostGlowRing.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), hostUp);
    group.add(hostGlowRing);

    // ✦ 星主专属 3D 环绕守护微缩图腾（咩咩：绵羊云 | Kitty：粉晶猫爪 | Luca：辐条单车飞轮 | 清哥：日照金山晶）
    hostCharmOrbit = new THREE.Group();
    hostCharmOrbit.position.set(0, 1.38, 0);
    if (residentRole === "luca") {
      const wheelGrp = new THREE.Group();
      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(0.082, 0.016, 8, 20),
        new THREE.MeshStandardMaterial({ color: "#38bdf8", emissive: "#0284c7", emissiveIntensity: 0.85, roughness: 0.2 })
      );
      wheelGrp.add(rim);
      for (let k = 0; k < 4; k++) {
        const spoke = new THREE.Mesh(
          new THREE.CylinderGeometry(0.004, 0.004, 0.16, 6),
          new THREE.MeshBasicMaterial({ color: "#e0f2fe" })
        );
        spoke.rotation.z = (k / 4) * Math.PI;
        wheelGrp.add(spoke);
      }
      wheelGrp.position.set(0.42, 0.02, 0);
      const windStar = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.052, 0),
        new THREE.MeshStandardMaterial({ color: "#fb923c", emissive: "#f97316", emissiveIntensity: 0.9 })
      );
      windStar.position.set(-0.42, 0.06, 0);
      hostCharmOrbit.add(wheelGrp, windStar);
    } else if (residentRole === "miemie") {
      const puffMat = new THREE.MeshStandardMaterial({ color: "#fffbeb", emissive: "#fef3c7", emissiveIntensity: 0.35, roughness: 0.7 });
      const c1 = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), puffMat);
      const c2 = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), puffMat);
      c2.position.set(0.055, 0.015, 0);
      const c3 = new THREE.Mesh(new THREE.SphereGeometry(0.052, 10, 10), puffMat);
      c3.position.set(-0.052, 0.01, 0);
      const gem = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.055, 0),
        new THREE.MeshStandardMaterial({ color: "#2dd4bf", emissive: "#06b6d4", emissiveIntensity: 0.95, roughness: 0.15 })
      );
      gem.position.set(-0.84, 0.08, 0);
      const cloud = new THREE.Group();
      cloud.add(c1, c2, c3);
      cloud.position.set(0.42, 0, 0);
      gem.position.set(-0.42, 0.06, 0);
      hostCharmOrbit.add(cloud, gem);
    } else if (residentRole === "kitty") {
      const pawMat = new THREE.MeshStandardMaterial({ color: "#f9a8d4", emissive: "#ec4899", emissiveIntensity: 0.65, roughness: 0.25 });
      const paw = new THREE.Group();
      const pad = new THREE.Mesh(new THREE.SphereGeometry(0.062, 10, 10), pawMat);
      pad.scale.set(1.15, 0.85, 0.65);
      paw.add(pad);
      [-0.055, 0, 0.055].forEach((ox, ti) => {
        const toe = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), pawMat);
        toe.position.set(ox, 0.068 + (ti === 1 ? 0.014 : 0), 0);
        paw.add(toe);
      });
      paw.position.set(0.42, 0.02, 0);
      const star = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.052, 0),
        new THREE.MeshStandardMaterial({ color: "#fde047", emissive: "#f59e0b", emissiveIntensity: 0.9 })
      );
      star.position.set(-0.42, 0.06, 0);
      hostCharmOrbit.add(paw, star);
    } else {
      const peak = new THREE.Mesh(
        new THREE.ConeGeometry(0.075, 0.14, 5),
        new THREE.MeshStandardMaterial({ color: "#fde68a", emissive: "#f59e0b", emissiveIntensity: 0.75, roughness: 0.2 })
      );
      peak.position.set(0.42, 0.02, 0);
      const iceStar = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.052, 0),
        new THREE.MeshStandardMaterial({ color: "#7dd3fc", emissive: "#0284c7", emissiveIntensity: 0.85 })
      );
      iceStar.position.set(-0.42, 0.06, 0);
      hostCharmOrbit.add(peak, iceStar);
    }
    hostChar.root.add(hostCharmOrbit);
  }

  // ⚡ 跨宇宙「双星同频共鸣水晶碑」（在两人都走过的山脉星球上闪耀！）
  let resonanceGroup = null;
  let resonanceCrystal = null;
  if (resonanceInfo) {
    resonanceGroup = new THREE.Group();
    const rr = getSurfaceRadius(planet.id, resUp);
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.34, 0.16, 8),
      new THREE.MeshStandardMaterial({ color: "#d6b88d", roughness: 0.65 })
    );
    base.position.y = 0.08;
    resonanceCrystal = new THREE.Group();
    resonanceCrystal.position.y = 0.68;
    const gemA = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.22, 0),
      new THREE.MeshStandardMaterial({ color: "#f472b6", emissive: "#ec4899", emissiveIntensity: 0.55, roughness: 0.15 })
    );
    gemA.position.x = -0.11;
    const gemB = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.22, 0),
      new THREE.MeshStandardMaterial({ color: "#fbbf24", emissive: "#f59e0b", emissiveIntensity: 0.55, roughness: 0.15 })
    );
    gemB.position.x = 0.11;
    resonanceCrystal.add(gemA, gemB);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.36, 0.45, 24),
      new THREE.MeshBasicMaterial({ color: "#fbcfe8", side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.04;
    resonanceGroup.add(base, resonanceCrystal, ring);
    resonanceGroup.position.copy(resUp).multiplyScalar(rr);
    resonanceGroup.quaternion.setFromUnitVectors(UP, resUp);
    group.add(resonanceGroup);
  }

  // ✨ 3D 双人互动演出特效（发光星辰红玫瑰 + 16 颗螺旋升空粉金星尘粒子）
  const duoFxGroup = new THREE.Group();
  duoFxGroup.visible = false;
  const fxRose = new THREE.Group();
  const fxStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.016, 0.28, 8),
    new THREE.MeshStandardMaterial({ color: "#34d399", emissive: "#10b981", emissiveIntensity: 0.4 })
  );
  const fxBloom = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.095, 0),
    new THREE.MeshStandardMaterial({ color: "#fb7185", emissive: "#e11d48", emissiveIntensity: 0.85, roughness: 0.25 })
  );
  fxBloom.position.y = 0.16;
  fxRose.add(fxStem, fxBloom);
  fxRose.position.y = 0.85;
  duoFxGroup.add(fxRose);

  const sparkPalette =
    residentRole === "miemie"
      ? ["#34d399", "#22d3ee"]
      : residentRole === "kitty"
        ? ["#f472b6", "#fde047"]
        : residentRole === "luca"
          ? ["#38bdf8", "#fb923c"]
          : ["#fbbf24", "#38bdf8"];
  const fxSparks = [];
  for (let i = 0; i < 16; i++) {
    const sp = new THREE.Mesh(
      new THREE.OctahedronGeometry(i % 2 === 0 ? 0.055 : 0.04, 0),
      new THREE.MeshBasicMaterial({ color: sparkPalette[i % 2], transparent: true, opacity: 0.95 })
    );
    duoFxGroup.add(sp);
    fxSparks.push({ mesh: sp, angle: (i / 16) * Math.PI * 2, speed: 1.4 + (i % 4) * 0.35, radius: 0.26 + (i % 3) * 0.12 });
  }
  group.add(duoFxGroup);
  let fxTimer = 0;
  let fxShowRose = false;
  let duoSitLock = false;

  const tmpLook = new THREE.Vector3();
  const tmpRight = new THREE.Vector3();
  const tmpMat = new THREE.Matrix4();
  const tmpTargetUp = new THREE.Vector3();

  function orientChar(upVec, fwdHint) {
    if (!hostChar) return;
    const r = getSurfaceRadius(planet.id, upVec);
    hostChar.root.position.copy(upVec).multiplyScalar(r);
    tmpLook.copy(fwdHint).sub(upVec.clone().multiplyScalar(fwdHint.dot(upVec)));
    if (tmpLook.lengthSq() < 1e-5) {
      tmpLook.set(0, 1, 0).sub(upVec.clone().multiplyScalar(upVec.y));
    }
    tmpLook.normalize();
    tmpRight.crossVectors(upVec, tmpLook).normalize();
    tmpLook.crossVectors(tmpRight, upVec).normalize();
    hostChar.root.quaternion.setFromRotationMatrix(tmpMat.makeBasis(tmpRight, upVec, tmpLook));
  }

  return {
    group,
    hostChar,
    bottleGroup,
    resonanceGroup,
    isNeighborPlanet,
    isVisitingOther: planetOwner !== activeHostRole,
    residentRole,
    hasResonance: Boolean(resonanceInfo),
    get isFollowing() { return isFollowing; },
    get isHostCycling() { return isHostCycling; },
    homeHostUp,
    hostUp,
    pbUp,
    resUp,
    orientChar,
    setFollowing(on) {
      if (!hostChar) return false;
      isFollowing = Boolean(on);
      duoSitLock = false;
      hostChar.setSitting(false);
      if (hostGlowRing) hostGlowRing.visible = !isFollowing;
      if (!isFollowing) {
        if (isHostCycling) {
          isHostCycling = false;
          hostChar.setCycling(false);
        }
        hostUp.copy(homeHostUp);
        orientChar(hostUp, new THREE.Vector3(0, 1, 0));
        hostChar.triggerWave();
      } else {
        hostChar.triggerEmote("cheer", 1.5);
      }
      return isFollowing;
    },
    triggerDuoAction(mode, midUp, faceDir) {
      if (!hostChar) return;
      duoSitLock = mode === "sit";
      if (faceDir) orientChar(hostUp, faceDir);
      if (mode === "sit") {
        hostChar.setSitting(true);
      } else {
        hostChar.setSitting(false);
        hostChar.triggerEmote(mode === "spin" ? "spin" : mode === "rose" ? "wave" : "cheer", 2.8);
      }
      const fxR = getSurfaceRadius(planet.id, midUp);
      duoFxGroup.position.copy(midUp).multiplyScalar(fxR);
      duoFxGroup.quaternion.setFromUnitVectors(UP, midUp);
      duoFxGroup.visible = true;
      fxShowRose = mode === "rose";
      fxRose.visible = fxShowRose;
      fxTimer = 3.0;
    },
    clearDuoSit() {
      if (duoSitLock && hostChar) {
        duoSitLock = false;
        hostChar.setSitting(false);
      }
    },
    setUnreadBeacon(on) {
      bottleBeaconGroup.visible = Boolean(on);
    },
    celebrateWaypoint(playerUpVec) {
      if (!hostChar) return;
      const midUp = hostUp.clone().add(playerUpVec).normalize();
      const midR = getSurfaceRadius(planet.id, midUp);
      duoFxGroup.position.copy(midUp).multiplyScalar(midR);
      duoFxGroup.quaternion.setFromUnitVectors(UP, midUp);
      duoFxGroup.visible = true;
      fxShowRose = false;
      fxRose.visible = false;
      fxTimer = 2.8;
      orientChar(hostUp, playerUpVec.clone().sub(hostUp));
      hostChar.triggerEmote("cheer", 2.4);
    },
    getHostHeadWorldPos(target = new THREE.Vector3()) {
      if (!hostChar) return null;
      const r = getSurfaceRadius(planet.id, hostUp);
      return target.copy(hostUp).multiplyScalar(r + 1.92);
    },
    pickCompanionLine() {
      const LINES = {
        "kitty-xiaowutai": ["太行屋脊的风吹草甸好舒服呀～", "快看前面山脊，去见那座山吧！", "西台石头上不知还能不能偶遇小橘猫🐱"],
        "kitty-sunset": ["日落的最后八分钟，连风车都是紫金色的✨", "等天再暗一点，抬头就是整条银河啦！", "和你并肩追一场不落幕的晚霞～"],
        "kitty-changbai": ["天池的水像嵌在火山口的蓝宝石！", "嘘——林子里好像有梅花鹿的脚步声🦌"],
        "kitty-zhagana": ["云雾从石城木屋顶上漫过来啦～", "这一段峡谷栈道走起来好治愈呀！"],
        "kitty-daqing": ["在云端草甸扎营，伸手就能摘到星星⛺", "深呼吸，全是高山草甸清冽的味道～"],
        "kitty-wusun": ["天山的雪峰与河谷太辽阔了！", "一步一景，走慢一点也没关系～"],
        "kitty-yading": ["三神山就在云层后面看着我们呢🏔️", "高海拔慢点走，我陪你一起登顶！"],
        "miemie-guizhou": [
          "黑石林配绿草甸，牛羊都不赶时间🐑",
          "前面就是人间塞尔达·龙脊天路，还有牛倒岩地心瀑布与麝香洞星穹✨",
          "整座千年布依古寨都是石头写就的时光典籍🏡",
        ],
        "miemie-volcano": [
          "站在四子王旗大红山下，真的像一秒登陆了火星赤壁🌋",
          "乌兰哈达的黑色火山锥像不像月球暗面？脚下全是轻盈的火山浮石✨",
          "今晚把帐篷扎在红崖下，抬头就是塞北没有边界的银河⛺",
        ],
        "miemie-hulunbuir": [
          "阿尔山木栈道里全是松针的清香🌲",
          "快看呼伦贝尔漫山的金色大圆草垛和骏马牛羊🌾",
          "一路向北走到满洲里边城，天苍苍野茫茫太自由啦！",
        ],
        "miemie-tonggudang": ["黑石林配绿草甸，牛羊都不赶时间🐑", "前面牛倒岩洞里有超震撼的地心瀑布！", "大圣之眼的岩羊路线超像闯进游戏世界✨"],
        "miemie-longji": ["欢迎来到人间塞尔达·巨龙脊背🐉", "下面河床的关岭冰臼就像大地之眼！"],
        "miemie-shexiang": ["抬头看！我们在麝香洞邂逅了地心宇宙穹顶🔦", "幽蓝钟乳石像不像凝固的星河？"],
        "miemie-buyi": ["整座千年布依古寨都是石头写就的时光典籍🏡", "去猫跳峡看看古时候野猫怎么一跃过河🐱"],
        "miemie-yading": ["我喜欢没有信号的地方，抵达营地就足够啦⛺", "我有足够的力量背起大包，看见更美的风景🎒", "人生可以有很多答案，而我们还在路上✨"],
        "luca-hainan": ["欢迎来到我的海岛桃花源🌴 七天 948 公里海风超自由！", "前面就是万宁海岸爬升坡顶，吹着太平洋的风太爽啦🚴", "最后一天从文昌一口气干了 186 公里回海口，痛快！"],
        "luca-tianshan": ["从热带海岛一路骑进天山雪岭溪谷啦🏔️", "前面云杉林草坡上有原木小木屋，今晚把车停那儿看云⛺"],
        default: ["山风吹过的时候，真开心有人并肩同行✨", "慢点走，每一处垭口都值得回头看看～", "去下一个路标盖章吧，我在你身边！"],
      };
      const pool = LINES[planet.id] || LINES.default;
      return pool[Math.floor(Math.random() * pool.length)];
    },
    pickCampfireLine() {
      const FIRE_LINES = {
        kitty: [
          "手伸过来烤烤火，钛杯里的热茶刚冒白气啦🍵",
          "听着柴火噼啪声和山风，感觉时间都慢下来了🔥",
          "把今天看到的晚霞和雪山都攒进梦里吧✨",
        ],
        miemie: [
          "卸下大大的重装背包坐在火堆旁，没有信号的夜晚真自在呀🔥",
          "每天一个小目标，今晚抵达营地围着篝火就足够幸福啦⛺",
          "抬头看星河，我们走过的地心与雪山都在发光呢✨",
        ],
        luca: [
          "把公路车停在营火旁，海风与雪山晚风都吹进茶杯里啦🍵",
          "踩了整整一天踏板，坐下来围着篝火烤烤火太治愈了🔥",
          "不管车轮滚出几百公里，最棒的永远是和朋友在星空下歇脚✨",
        ],
        mine: [
          "山里的夜风再凉，点起这堆篝火就浑身暖洋洋的🔥",
          "喝口热茶歇歇脚，明天继续去翻下一座垭口🍵",
          "真好，这么辽阔的山海星夜有人并排坐着听风✨",
        ],
      };
      const arr = FIRE_LINES[residentRole] || FIRE_LINES.mine;
      return arr[Math.floor(Math.random() * arr.length)];
    },
    triggerHostWave() {
      if (hostChar) hostChar.triggerWave();
    },
    setHostSitting(on) {
      if (hostChar) hostChar.setSitting(on);
    },
    update(dt, elapsed, playerUp, isNight = false, isCampfire = false, playerForward = null, playerSpeed = 0, isPlayerCycling = false) {
      let nearHost = false;
      let justGreeted = false;
      if (bottleFloatPivot) {
        bottleFloatPivot.position.y = 0.36 + Math.sin(elapsed * 2.4) * 0.045;
        bottleFloatPivot.rotation.y = elapsed * 0.55;
      }
      if (bottleBeaconGroup.visible) {
        bottleBeaconGroup.position.y = 0.94 + Math.sin(elapsed * 3.8) * 0.07;
        beaconStar.rotation.y = elapsed * 2.2;
        beaconHalo.rotation.z = -elapsed * 1.5;
      }
      if (fxTimer > 0) {
        fxTimer = Math.max(0, fxTimer - dt);
        const prog = 1 - fxTimer / 3.0;
        if (fxShowRose) {
          fxRose.rotation.y += dt * 3.2;
          fxRose.position.y = 0.72 + Math.sin(prog * Math.PI) * 0.45;
        }
        fxSparks.forEach((sp, idx) => {
          const a = sp.angle + elapsed * sp.speed;
          const rad = sp.radius * (0.5 + prog * 1.15);
          sp.mesh.position.set(Math.cos(a) * rad, 0.35 + prog * 1.65 + (idx % 3) * 0.18, Math.sin(a) * rad);
          sp.mesh.material.opacity = Math.max(0, 1 - prog * 0.95);
        });
        if (fxTimer <= 0) duoFxGroup.visible = false;
      }

      if (hostChar) {
        hostChar.setHeadlamp(isNight && !isCampfire && !duoSitLock);
        let moveSpeedRatio = 0;

        const shouldCycle = Boolean(isFollowing && isPlayerCycling && !isCampfire && !duoSitLock);
        if (shouldCycle !== isHostCycling) {
          isHostCycling = shouldCycle;
          hostChar.setCycling(shouldCycle);
        }

        if (isFollowing && playerForward) {
          if (playerSpeed > 0.08 && duoSitLock) {
            duoSitLock = false;
            hostChar.setSitting(false);
          }
          const pRight = new THREE.Vector3().crossVectors(playerUp, playerForward).normalize();
          if (isCampfire) {
            const fireUp = playerUp
              .clone()
              .addScaledVector(playerForward, 0.052)
              .addScaledVector(pRight, 0.012)
              .normalize();
            tmpTargetUp
              .copy(playerUp)
              .addScaledVector(pRight, 0.088)
              .addScaledVector(playerForward, 0.022)
              .normalize();
            if (hostUp.distanceTo(tmpTargetUp) > 0.003) {
              hostUp.lerp(tmpTargetUp, Math.min(1, dt * 6.0)).normalize();
            }
            orientChar(hostUp, fireUp.sub(hostUp));
          } else {
            const sideOff = shouldCycle ? 0.148 : 0.115;
            const backOff = shouldCycle ? -0.095 : -0.075;
            tmpTargetUp
              .copy(playerUp)
              .addScaledVector(pRight, sideOff)
              .addScaledVector(playerForward, backOff)
              .normalize();
            const gap = hostUp.distanceTo(tmpTargetUp);
            if (gap > 0.004 && !duoSitLock) {
              const followRate = shouldCycle ? (gap > 0.25 ? 10.5 : 7.8) : gap > 0.25 ? 7.5 : 5.2;
              const step = Math.min(1, dt * followRate);
              const prevUp = hostUp.clone();
              hostUp.lerp(tmpTargetUp, step).normalize();
              const moved = prevUp.distanceTo(hostUp) / Math.max(dt, 0.001);
              moveSpeedRatio = THREE.MathUtils.clamp(moved * 4.2, 0, 1.5);
              const moveDir = hostUp.clone().sub(prevUp);
              orientChar(hostUp, moveDir.lengthSq() > 1e-6 ? moveDir : playerForward);
            } else if (!duoSitLock) {
              orientChar(hostUp, playerForward);
            }
          }
          hostChar.setSitting(isCampfire || duoSitLock);
          nearHost = true;
        } else {
          hostChar.setSitting(isCampfire || duoSitLock);
          const dist = playerUp.distanceTo(hostUp);
          nearHost = dist < 0.24;
          if (dist < 0.36 && !isCampfire && !duoSitLock) {
            orientChar(hostUp, playerUp.clone().sub(hostUp));
            if (!greetedOnce) {
              greetedOnce = true;
              justGreeted = true;
              hostChar.triggerWave();
            }
          } else if (dist > 0.48) {
            greetedOnce = false;
          }
          if (hostGlowRing && hostGlowRing.visible) {
            hostGlowRing.scale.setScalar(0.94 + Math.sin(elapsed * 2.8) * 0.08);
          }
        }
        hostChar.update(dt, elapsed, moveSpeedRatio);
        if (hostCharmOrbit) {
          const boost = fxTimer > 0 ? 3.2 : 1.0;
          hostCharmOrbit.rotation.y += dt * 1.15 * boost;
          hostCharmOrbit.position.y = 1.38 + Math.sin(elapsed * 2.4) * 0.055;
        }
      }

      let nearResonance = false;
      if (resonanceCrystal) {
        resonanceCrystal.rotation.y += dt * 1.6;
        resonanceCrystal.position.y = 0.68 + Math.sin(elapsed * 2.5) * 0.07;
        nearResonance = playerUp.distanceTo(resUp) < 0.22;
      }

      const nearBottle = playerUp.distanceTo(pbUp) < 0.22;
      return { nearHost, nearBottle, justGreeted, nearResonance };
    },
  };
}

// ==================== 双人同框串门拍立得 & 星际邀请卡 Canvas 生成器 ====================
export function generateCoopSnapshotDataUrl(glCanvas, planet, visitorName = "星辰访客", activeHostRole = "mine") {
  const W = 1080, H = 1440;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");

  // 拍立得暖奶油羊皮纸相框
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#faf3e3"); bg.addColorStop(1, "#ede0c4");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#c49a52"; ctx.lineWidth = 4;
  ctx.strokeRect(26, 26, W - 52, H - 52);

  // 居中裁剪 3D 实机同框画面
  const frameX = 58, frameY = 64, frameW = W - 116, frameH = 1020;
  ctx.save();
  ctx.beginPath(); ctx.roundRect(frameX, frameY, frameW, frameH, 18); ctx.clip();
  const ir = glCanvas.width / glCanvas.height, br = frameW / frameH;
  let sx = 0, sy = 0, sw = glCanvas.width, sh = glCanvas.height;
  if (ir > br) { sw = glCanvas.height * br; sx = (glCanvas.width - sw) * 0.5; }
  else { sh = glCanvas.width / br; sy = (glCanvas.height - sh) * 0.5; }
  ctx.drawImage(glCanvas, sx, sy, sw, sh, frameX, frameY, frameW, frameH);
  ctx.restore();

  const ROLE_NAMES = { kitty: "Kitty", miemie: "咩咩", luca: "Luca", mine: "清哥" };
  const pOwner = planet.owner || "mine";
  const hostName = ROLE_NAMES[pOwner] || planet.ownerName || "清哥";
  const activeName = ROLE_NAMES[activeHostRole] || "清哥";
  const isHome = pOwner === activeHostRole;
  const subLine = isHome
    ? `星球主人「${hostName}」 ✦ 与同频邻居山海重逢`
    : `访客「${visitorName || activeName}」 ✦ 到访邻居「${hostName}」的山海营地`;
  const snapIcon = pOwner === "kitty" ? "🐾" : pOwner === "miemie" ? "🐑" : pOwner === "luca" ? "🚴" : "🪐";
  ctx.fillStyle = "#2b1d0e";
  ctx.font = '400 42px "ZCOOL XiaoWei", "LXGW WenKai Screen", serif';
  ctx.fillText(`${snapIcon} 星际串门同框 · ${planet.name}`, 64, 1156);

  ctx.fillStyle = "#5c4324";
  ctx.font = '400 26px "LXGW WenKai Screen", "Kaiti SC", serif';
  ctx.fillText(subLine, 64, 1208);

  ctx.fillStyle = "#8a5a1e";
  ctx.font = 'italic 600 24px "Cormorant Garamond", Georgia, serif';
  ctx.fillText(`COSMIC NEIGHBORS  ·  ${planet.code}  ·  ${planet.maxElevation}`, 64, 1256);

  drawPostmarkSeal(ctx, W - 310, 1245, {
    radius: 74, bannerText: "星际串门", subText: `${hostName}的星球`,
    color: "rgba(186, 46, 74, 0.88)", paperBg: "#f2e5cb", wavyTail: false, angle: -0.15,
  });
  drawSiteQrStamp(
    ctx,
    W - 206,
    1142,
    144,
    "parchment",
    pOwner === "kitty" || pOwner === "miemie" || pOwner === "luca" ? pOwner : "mine"
  );
  return c.toDataURL("image/png");
}

export function generateNeighborInviteCardDataUrl(guestPlanet, shareUrl) {
  const W = 1080, H = 1440;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");

  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#0b132b"); g.addColorStop(0.55, "#192650"); g.addColorStop(1, "#0d1530");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(244, 206, 118, 0.65)"; ctx.lineWidth = 3;
  ctx.strokeRect(36, 36, W - 72, H - 72);

  ctx.textAlign = "center";
  ctx.fillStyle = "#f5d380";
  ctx.font = '700 24px "Cormorant Garamond", Georgia, serif';
  ctx.fillText("✦   COSMIC NEIGHBOR INVITATION   ✦", W / 2, 120);

  ctx.fillStyle = "#fff8e8";
  ctx.font = '400 62px "ZCOOL XiaoWei", serif';
  ctx.fillText(`${guestPlanet.ownerName} 的徒步星球`, W / 2, 212);

  ctx.fillStyle = "#f9a8d4";
  ctx.font = '400 34px "LXGW WenKai Screen", serif';
  ctx.fillText(`「 ${guestPlanet.name} · ${guestPlanet.maxElevation} 」`, W / 2, 276);

  // 中央发光星球徽章
  const cx = W / 2, cy = 590, r = 210;
  const aura = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 1.45);
  aura.addColorStop(0, guestPlanet.palette.halo + "88");
  aura.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = aura; ctx.beginPath(); ctx.arc(cx, cy, r * 1.45, 0, Math.PI * 2); ctx.fill();

  const sg = ctx.createRadialGradient(cx - 60, cy - 70, 20, cx, cy, r);
  sg.addColorStop(0, guestPlanet.palette.high);
  sg.addColorStop(0.5, guestPlanet.palette.mid);
  sg.addColorStop(1, guestPlanet.palette.low);
  ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(255,245,214,0.6)"; ctx.lineWidth = 3; ctx.stroke();

  // 寄语羊皮纸卡
  ctx.fillStyle = "#f5ead2";
  ctx.beginPath(); ctx.roundRect(86, 890, W - 172, 440, 24); ctx.fill();
  ctx.fillStyle = "#3b2814";
  ctx.font = '400 30px "LXGW WenKai Screen", serif';
  const q = `“${guestPlanet.quote}”`;
  ctx.fillText(q.slice(0, 24), W / 2, 975);
  if (q.length > 24) ctx.fillText(q.slice(24, 48), W / 2, 1022);

  ctx.textAlign = "left";
  ctx.fillStyle = "#2b1d0e";
  ctx.font = '400 32px "ZCOOL XiaoWei", serif';
  ctx.fillText("💌 扫码或复制专属星门链接，来我的星球串门", 124, 1140);
  ctx.fillStyle = "#6e4f28";
  ctx.font = '400 22px "LXGW WenKai Screen", serif';
  ctx.fillText("《行者的星球 · 山海皆星辰》星际邻居共建计划", 124, 1190);
  ctx.fillStyle = "#8a5a1e";
  ctx.font = '700 21px "Cormorant Garamond", serif';
  ctx.fillText(shareUrl.slice(0, 52), 124, 1236);

  drawSiteQrStamp(ctx, W - 266, 1106, 150, "parchment");
  return c.toDataURL("image/png");
}

