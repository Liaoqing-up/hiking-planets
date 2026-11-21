/**
 * 球面几何高度场、经纬度向量变换、绘本色阶材质与伪随机工具
 * 供星球地形、小生灵、脚印、玛尼堆、星穹奇观等所有 3D 模块无环共享
 */
import * as THREE from "three";

export const PLANET_RADIUS = 12;
export const UP_VEC = new THREE.Vector3(0, 1, 0);

// 《小王子》绘本风 5 阶柔和色阶渐变贴图（让星球与植被呈现温润水彩插画层次）
function createStorybookGradientMap() {
  const data = new Uint8Array([
    82, 86, 112, 255,
    132, 136, 158, 255,
    182, 184, 196, 255,
    226, 224, 222, 255,
    255, 252, 244, 255,
  ]);
  const tex = new THREE.DataTexture(data, 5, 1, THREE.RGBAFormat);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}
export const STORYBOOK_GRAD = createStorybookGradientMap();


export function latLonToUnitVec(latDeg, lonDeg) {
  const lat = (latDeg * Math.PI) / 180;
  const lon = (lonDeg * Math.PI) / 180;
  return new THREE.Vector3(
    Math.cos(lat) * Math.sin(lon),
    Math.sin(lat),
    Math.cos(lat) * Math.cos(lon)
  ).normalize();
}

function fbm3(x, y, z) {
  const n1 = Math.sin(x * 2.3 + y * 1.7) * Math.cos(z * 2.1 - x * 1.3);
  const n2 = Math.sin(x * 5.1 - z * 4.3) * Math.cos(y * 4.7 + z * 3.2) * 0.45;
  const n3 = Math.sin(y * 9.2 + x * 7.4 - z * 8.1) * 0.18;
  return n1 + n2 + n3;
}

export const GUEST_TERRAIN_MAP = {};
export function registerGuestTerrain(planetId, templateId) {
  GUEST_TERRAIN_MAP[planetId] = templateId;
}

export function getSurfaceRadius(planetId, dir) {
  const mappedId = GUEST_TERRAIN_MAP[planetId] || planetId;
  if (mappedId === "kitty-zhagana" || mappedId === "miemie-guizhou" || mappedId === "miemie-longji") planetId = "zhagana";
  else if (mappedId === "kitty-wusun" || mappedId === "miemie-hulunbuir") planetId = "yili";
  else if (mappedId === "kitty-yading" || mappedId === "miemie-yading") planetId = "yading";
  else if (mappedId === "miemie-tonggudang") planetId = "kitty-xiaowutai";
  else if (mappedId === "miemie-shexiang" || mappedId === "luca-hainan") planetId = "maclehose";
  else if (mappedId === "miemie-buyi") planetId = "kitty-daqing";
  else if (mappedId === "luca-tianshan") planetId = "yili";
  else planetId = mappedId;

  const x = dir.x, y = dir.y, z = dir.z;
  const base = fbm3(x, y, z);

  if (planetId === "miemie-volcano") {
    // 内蒙红黑异星地貌：四子王旗大红山阶梯赤红台地 + 乌兰哈达环形火山锥群
    let h = PLANET_RADIUS + 0.22 + Math.abs(base) * 0.24;
    const mesas = [
      [latLonToUnitVec(30, -36), 0.95, 0.48],
      [latLonToUnitVec(-18, 36), 0.78, 0.44],
    ];
    for (const [mc, amp, rad] of mesas) {
      const d = dir.distanceTo(mc);
      if (d < rad) {
        const t = 1 - d / rad;
        const stepped = Math.floor(Math.min(0.99, t * 1.25) * 3.5) / 3.0;
        h += (stepped * 0.7 + t * 0.3) * amp;
      }
    }
    const craters = [
      [latLonToUnitVec(36, 132), 1.65, 0.42],
      [latLonToUnitVec(12, -146), 1.28, 0.35],
    ];
    for (const [vc, amp, rad] of craters) {
      const d = dir.distanceTo(vc);
      if (d < rad) {
        const u = d / rad;
        const cone = Math.cos(u * Math.PI * 0.5);
        const pit = u < 0.28 ? Math.cos((u / 0.28) * Math.PI * 0.5) * 0.62 : 0;
        h += Math.pow(cone, 1.15) * amp - pit * amp;
      }
    }
    return h;
  }

  if (planetId === "kitty-xiaowutai") {
    // 京郊华北屋脊小五台：东台(2882m)、北台(2837m)、南台(2743m)、西台(2671m) 四座高山草甸主峰与连穿山梁
    const ridgeWave = (Math.sin(x * 4.2 - z * 3.1) + 1) * 0.22;
    let h = PLANET_RADIUS + 0.24 + ridgeWave + Math.abs(base) * 0.22;
    const taiPeaks = [
      [latLonToUnitVec(58, 16), 1.55, 0.42],   // 东台叶斗峰 (最高)
      [latLonToUnitVec(22, 108), 1.38, 0.38],  // 北台险脊
      [latLonToUnitVec(-24, -95), 1.15, 0.38], // 南台草甸
      [latLonToUnitVec(-38, 28), 1.02, 0.36],  // 西台乱石坡
    ];
    for (const [pk, amp, rad] of taiPeaks) {
      const d = dir.distanceTo(pk);
      if (d < rad) {
        const k = Math.cos((d / rad) * Math.PI * 0.5);
        h += Math.pow(k, 1.35) * amp;
      }
    }
    return h;
  }

  if (planetId === "kitty-changbai") {
    // 长白山高耸环形火山口 + 天池蔚蓝火山湖盆 + 连绵高山草甸
    let h = PLANET_RADIUS + 0.24 + Math.abs(base) * 0.3;
    const craterCenter = latLonToUnitVec(62, 10);
    const cd = dir.distanceTo(craterCenter);
    if (cd < 0.56) {
      if (cd < 0.24) {
        // 火山口中央深邃天池盆地
        const inner = Math.cos((cd / 0.24) * Math.PI * 0.5);
        h = PLANET_RADIUS + 0.95 - inner * 0.65;
      } else {
        // 环绕天池的十六峰火山口山脊环
        const ringT = Math.sin(((cd - 0.22) / 0.34) * Math.PI);
        const jagged = 0.88 + 0.22 * Math.sin(Math.atan2(z, x) * 7.0);
        h += ringT * 1.65 * jagged;
      }
    }
    return h;
  }

  if (planetId === "kitty-sunset" || planetId === "kitty-daqing") {
    // 旷野风车山脊 / 大青山云端波浪大草甸
    const waves = (Math.sin(x * 3.8 + z * 3.4) * Math.cos(y * 3.6 - x * 2.2) + 1) * 0.32;
    let h = PLANET_RADIUS + 0.22 + waves + Math.abs(base) * 0.14;
    const lakeDist = dir.distanceTo(latLonToUnitVec(-18, 95));
    if (planetId === "kitty-daqing" && lakeDist < 0.34) {
      const k = Math.cos((lakeDist / 0.34) * Math.PI * 0.5);
      h = PLANET_RADIUS + 0.16 - k * 0.48;
    }
    return h;
  }

  if (planetId === "tengger") {
    // 连绵新月沙丘波浪（陆地始终高于水面，仅乌兰湖与天鹅湖下凹成湖）
    const dunes = Math.abs(Math.sin(x * 6.5 + z * 5.2 + Math.sin(y * 3.0) * 1.4)) * 0.58;
    let h = PLANET_RADIUS + 0.22 + dunes + base * 0.14;
    const ulanDist = dir.distanceTo(latLonToUnitVec(-18, 108));
    const swanDist = dir.distanceTo(latLonToUnitVec(26, 15));
    if (ulanDist < 0.34) {
      const k = Math.cos((ulanDist / 0.34) * Math.PI * 0.5);
      h = PLANET_RADIUS + 0.18 - k * 0.52;
    } else if (swanDist < 0.26) {
      const k = Math.cos((swanDist / 0.26) * Math.PI * 0.5);
      h = PLANET_RADIUS + 0.18 - k * 0.45;
    }
    return h;
  }

  if (planetId === "yading") {
    // 亚丁三神山高耸雪峰 + 圆润宝石牛奶海盆地
    let h = PLANET_RADIUS + 0.28 + Math.abs(base) * 0.36;
    const peaks = [
      [0.15, 0.88, 0.45, 2.35],
      [-0.48, 0.7, 0.52, 1.95],
      [0.56, 0.66, -0.48, 1.85],
    ];
    for (const [px, py, pz, amp] of peaks) {
      const d = Math.hypot(x - px, y - py, z - pz);
      if (d < 0.58) h += Math.pow((0.58 - d) / 0.58, 1.6) * amp;
    }
    const milkDist = dir.distanceTo(latLonToUnitVec(-12, 112));
    if (milkDist < 0.34) {
      const k = Math.cos((milkDist / 0.34) * Math.PI * 0.5);
      h = PLANET_RADIUS + 0.2 - k * 0.55;
    }
    return h;
  }

  if (planetId === "zhagana") {
    let h = PLANET_RADIUS + 0.24 + Math.abs(base) * 0.32;
    const wallBand = Math.abs(y - 0.46 - Math.sin(x * 4 + z * 3) * 0.12);
    if (wallBand < 0.26 && z < 0.4) {
      h += Math.pow((0.26 - wallBand) / 0.26, 1.3) * 1.75;
    }
    return h;
  }

  if (planetId === "siguniang") {
    let h = PLANET_RADIUS + 0.24 + Math.abs(base) * 0.32;
    // 主雪峰精准对齐大峰之巅 (lat: 50, lon: -112)，确保石碑立在星球最高雪山顶
    const dafengPeak = latLonToUnitVec(50, -112);
    const dPeak = dir.distanceTo(dafengPeak);
    if (dPeak < 0.62) {
      h += Math.pow((0.62 - dPeak) / 0.62, 1.45) * 2.35;
    }
    const yaomeiSpire = dir.distanceTo(latLonToUnitVec(36, -78));
    if (yaomeiSpire < 0.42) {
      h += Math.pow((0.42 - yaomeiSpire) / 0.42, 1.6) * 1.75;
    }
    const chazigouPass = dir.distanceTo(latLonToUnitVec(-16, 118));
    if (chazigouPass < 0.42) {
      h += Math.pow((0.42 - chazigouPass) / 0.42, 1.4) * 1.35;
    }
    return h;
  }

  if (planetId === "maclehose") {
    // 清晰平滑的山海海岸线：一侧深蓝果冻海湾，一侧翠绿山脊
    const landMask = -x * 0.65 + z * 0.55 + y * 0.22 + base * 0.15;
    let h = PLANET_RADIUS + landMask * 1.05 + Math.abs(Math.sin(x * 4.5 - y * 3.8)) * 0.22;
    const sharpPeak = dir.distanceTo(latLonToUnitVec(40, -102));
    if (sharpPeak < 0.4) h += Math.pow((0.4 - sharpPeak) / 0.4, 1.5) * 1.4;
    return Math.max(PLANET_RADIUS - 0.55, h);
  }

  if (planetId === "yili") {
    // 喀拉峻丝滑立体波浪草原 + 天山雪岭 + 赛里木湖蓝宝石盆地
    const waves = (Math.sin(x * 4.2 + y * 3.5) * Math.cos(z * 4.0 - y * 2.6) + 1) * 0.34;
    let h = PLANET_RADIUS + 0.2 + waves + Math.abs(base) * 0.16;
    if (y > 0.55) h += Math.pow((y - 0.55) / 0.45, 1.45) * 1.65;
    const sayram = dir.distanceTo(latLonToUnitVec(-34, -40));
    if (sayram < 0.38) {
      const k = Math.cos((sayram / 0.38) * Math.PI * 0.5);
      h = PLANET_RADIUS + 0.18 - k * 0.56;
    }
    return h;
  }

  let h = PLANET_RADIUS + 0.2 + Math.abs(base) * 0.28;
  const northDist = dir.distanceTo(UP_VEC);
  if (northDist < 0.35) h = THREE.MathUtils.lerp(PLANET_RADIUS + 0.24, h, northDist / 0.35);
  const backPeak = Math.hypot(x + 0.48, y - 0.68, z + 0.52);
  if (backPeak < 0.48) h += Math.pow((0.48 - backPeak) / 0.48, 1.5) * 1.55;
  return h;
}


export function seededRand(seed) {
  let s = seed % 2147483647;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function placeOnSphere(obj, dir, radiusOffset = 0, planetId = "title") {
  const r = getSurfaceRadius(planetId, dir) + radiusOffset;
  obj.position.copy(dir).multiplyScalar(r);
  obj.quaternion.setFromUnitVectors(UP_VEC, dir);
}

