import * as THREE from "three";

export const PLANET_RADIUS = 12;
const UP = new THREE.Vector3(0, 1, 0);

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
const STORYBOOK_GRAD = createStorybookGradientMap();

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

const GUEST_TERRAIN_MAP = {};
export function registerGuestTerrain(planetId, templateId) {
  GUEST_TERRAIN_MAP[planetId] = templateId;
}

export function getSurfaceRadius(planetId, dir) {
  const mappedId = GUEST_TERRAIN_MAP[planetId] || planetId;
  if (mappedId === "kitty-zhagana" || mappedId === "miemie-longji") planetId = "zhagana";
  else if (mappedId === "kitty-wusun") planetId = "yili";
  else if (mappedId === "kitty-yading" || mappedId === "miemie-yading") planetId = "yading";
  else if (mappedId === "miemie-tonggudang") planetId = "kitty-xiaowutai";
  else if (mappedId === "miemie-shexiang") planetId = "maclehose";
  else if (mappedId === "miemie-buyi") planetId = "kitty-daqing";
  else planetId = mappedId;

  const x = dir.x, y = dir.y, z = dir.z;
  const base = fbm3(x, y, z);

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
  const northDist = dir.distanceTo(UP);
  if (northDist < 0.35) h = THREE.MathUtils.lerp(PLANET_RADIUS + 0.24, h, northDist / 0.35);
  const backPeak = Math.hypot(x + 0.48, y - 0.68, z + 0.52);
  if (backPeak < 0.48) h += Math.pow((0.48 - backPeak) / 0.48, 1.5) * 1.55;
  return h;
}

function seededRand(seed) {
  let s = seed % 2147483647;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function placeOnSphere(obj, dir, radiusOffset = 0, planetId = "title") {
  const r = getSurfaceRadius(planetId, dir) + radiusOffset;
  obj.position.copy(dir).multiplyScalar(r);
  obj.quaternion.setFromUnitVectors(UP, dir);
}

function createTree(type = "spruce", colorHex = "#2d6e46") {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.08, 0.36, 6),
    new THREE.MeshStandardMaterial({ color: "#5e402b", roughness: 0.9 })
  );
  trunk.position.y = 0.18;
  g.add(trunk);

  if (type === "deadwood") {
    const branch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.04, 0.32, 5),
      trunk.material
    );
    branch.position.set(0.08, 0.34, 0);
    branch.rotation.z = -0.7;
    g.add(branch);
    return g;
  }

  const mat = new THREE.MeshToonMaterial({ color: colorHex, gradientMap: STORYBOOK_GRAD });
  for (let i = 0; i < 3; i++) {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.28 - i * 0.06, 0.42 - i * 0.05, 7),
      mat
    );
    cone.position.y = 0.42 + i * 0.22;
    g.add(cone);
  }
  return g;
}

function createDafengStele5025() {
  const g = new THREE.Group();

  // 1. 高清 512x640 离屏画布绘制风化花岗岩肌理 + 行楷毛笔书法石刻红字
  const cv = document.createElement("canvas");
  cv.width = 512;
  cv.height = 640;
  const ctx = cv.getContext("2d");

  const grad = ctx.createLinearGradient(0, 0, 512, 640);
  grad.addColorStop(0, "#e7edf4");
  grad.addColorStop(0.45, "#c5ced9");
  grad.addColorStop(1, "#949fad");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 640);

  // 天然山石云母斑点与冰霜裂纹
  for (let i = 0; i < 1200; i++) {
    const rx = (i * 97) % 512;
    const ry = (i * 173) % 640;
    const rw = 2 + (i % 5);
    ctx.fillStyle = i % 3 === 0 ? "rgba(255,255,255,0.3)" : "rgba(52,60,74,0.14)";
    ctx.fillRect(rx, ry, rw, 2 + (i % 3));
  }

  // 顶部手写感藏文祈福纹饰
  ctx.save();
  ctx.fillStyle = "rgba(176, 62, 42, 0.72)";
  ctx.font = "italic 34px 'Kaiti SC', 'STKaiti', serif";
  ctx.textAlign = "center";
  ctx.fillText("༄༅། །བཀྲ་ཤིས་བདེ་ལེགས།", 246, 118);
  ctx.restore();

  // 书法行楷石刻渲染辅助（阴刻暗槽 + 朱砂红漆 + 手写微倾韵律）
  function drawCarvedBrushChar(ch, x, y, size, rotRad = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotRad);
    ctx.font = `${size}px 'Xingkai SC', 'STXingkai', 'Kaiti SC', 'STKaiti', 'BiauKai', cursive, serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // 石刻凹槽暗影
    ctx.fillStyle = "rgba(45, 18, 18, 0.55)";
    ctx.fillText(ch, -3, -3);
    // 顶部受光石棱亮边
    ctx.fillStyle = "rgba(255, 240, 235, 0.4)";
    ctx.fillText(ch, 2, 2);
    // 饱满朱砂红漆主体
    ctx.fillStyle = "#c92020";
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  }

  // 中央灵动行楷大字「大 峰」
  drawCarvedBrushChar("大", 218, 285, 195, -0.04);
  drawCarvedBrushChar("峰", 224, 475, 190, 0.025);

  // 右侧行楷竖排刻度「海拔 5025 米」（复刻真碑右侧竖列排布）
  const rightMarks = [
    ["海", 240, 48],
    ["拔", 295, 48],
    ["5", 352, 46],
    ["0", 398, 46],
    ["2", 444, 46],
    ["5", 490, 46],
    ["米", 544, 48],
  ];
  for (const [ch, ry, sz] of rightMarks) {
    drawCarvedBrushChar(ch, 392, ry, sz, (ry % 3 - 1) * 0.03);
  }

  // 叠加一层风雪岁月剥落飞白噪点，彻底消除数码生硬感
  for (let i = 0; i < 650; i++) {
    const fx = 110 + ((i * 83) % 330);
    const fy = 160 + ((i * 149) % 430);
    if (i % 4 === 0) {
      ctx.fillStyle = "rgba(205, 214, 224, 0.42)";
      ctx.beginPath();
      ctx.arc(fx, fy, 1.2 + (i % 3) * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;

  // 2. 复刻大峰真碑的天然不规则山石轮廓（左上翘角、顶沿双弧风化切面）
  const shape = new THREE.Shape();
  shape.moveTo(-0.28, 0);
  shape.lineTo(-0.31, 0.36);
  shape.lineTo(-0.27, 0.72);
  shape.lineTo(-0.3, 0.94);
  shape.quadraticCurveTo(-0.14, 0.86, 0.0, 0.92);
  shape.quadraticCurveTo(0.14, 0.84, 0.28, 0.88);
  shape.lineTo(0.31, 0.52);
  shape.lineTo(0.27, 0.18);
  shape.lineTo(0.29, 0);
  shape.closePath();

  const extrudeGeo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.13,
    bevelEnabled: true,
    bevelThickness: 0.022,
    bevelSize: 0.02,
    bevelSegments: 2,
  });
  extrudeGeo.center();

  // 重新映射正面 UV 使 512x640 书法碑面完整居中贴合在不规则石碑上
  const posAttr = extrudeGeo.attributes.position;
  const uvAttr = extrudeGeo.attributes.uv;
  for (let i = 0; i < posAttr.count; i++) {
    const px = posAttr.getX(i);
    const py = posAttr.getY(i);
    uvAttr.setXY(i, (px + 0.33) / 0.66, (py + 0.48) / 0.96);
  }

  const rockSideMat = new THREE.MeshToonMaterial({ color: "#aeb8c4", gradientMap: STORYBOOK_GRAD });
  const frontMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.78 });

  const stele = new THREE.Mesh(extrudeGeo, [frontMat, rockSideMat]);
  stele.position.y = 0.47;
  g.add(stele);

  // 3. 左上翘角披挂飘扬的五彩哈达与经幡结（还原实拍左上角哈达簇）
  const hadaCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 10, 8),
    new THREE.MeshToonMaterial({ color: "#f8fafc", gradientMap: STORYBOOK_GRAD })
  );
  hadaCap.position.set(-0.26, 0.88, 0.04);
  g.add(hadaCap);

  const hadaColors = ["#f97316", "#2563eb", "#f8fafc", "#22c55e", "#eab308"];
  hadaColors.forEach((hc, i) => {
    const ribbon = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.38 - i * 0.03, 0.025),
      new THREE.MeshBasicMaterial({ color: hc })
    );
    ribbon.position.set(-0.29 - i * 0.018, 0.68 - i * 0.025, 0.05 - (i % 2) * 0.03);
    ribbon.rotation.z = 0.22 + i * 0.07;
    g.add(ribbon);
  });

  return g;
}

function createCampSite(tentColor = "#f09436") {
  const g = new THREE.Group();
  const tent = new THREE.Mesh(
    new THREE.ConeGeometry(0.36, 0.46, 4),
    new THREE.MeshStandardMaterial({
      color: tentColor,
      emissive: "#ff9d3b",
      emissiveIntensity: 0.35,
      roughness: 0.7,
    })
  );
  tent.position.y = 0.22;
  tent.rotation.y = Math.PI * 0.25;
  g.add(tent);

  const fire = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.11, 0),
    new THREE.MeshBasicMaterial({ color: "#ffcf5c" })
  );
  fire.position.set(0.38, 0.12, 0.22);
  g.add(fire);

  const warmLight = new THREE.PointLight("#ffad42", 2.2, 4.5);
  warmLight.position.set(0.38, 0.35, 0.22);
  g.add(warmLight);
  g.userData.fire = fire;
  g.userData.light = warmLight;
  return g;
}

export function buildPlanetWorld(planetConfig, discoveredSet = new Set()) {
  const id = planetConfig.id || "title";
  const pal = planetConfig.palette || {
    halo: "#f0c768",
    low: "#4d8a58",
    mid: "#7ab866",
    high: "#f4f8ff",
    rock: "#78828c",
    water: "#2185d0",
    water2: "#e87848",
    particle: "#ffe7a8",
  };

  const group = new THREE.Group();
  const animatedProps = [];

  // 1. 高精度平滑球面地形网格（SphereGeometry 共享焊接顶点，法线丝滑柔和无折痕）
  const geo = new THREE.SphereGeometry(PLANET_RADIUS, 128, 96);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);

  const cLow = new THREE.Color(pal.low || "#54945c");
  const cMid = new THREE.Color(pal.mid || "#82ba64");
  const cHigh = new THREE.Color(pal.high || "#f5f8fc");
  const cWater2 = new THREE.Color(pal.water2 || pal.mid || "#c94c38");
  const tmpDir = new THREE.Vector3();
  const tmpColor = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    tmpDir.fromBufferAttribute(pos, i).normalize();
    const r = getSurfaceRadius(id, tmpDir);
    pos.setXYZ(i, tmpDir.x * r, tmpDir.y * r, tmpDir.z * r);

    const hNorm = THREE.MathUtils.clamp((r - PLANET_RADIUS + 0.3) / 1.9, 0, 1);
    if (hNorm < 0.45) {
      tmpColor.copy(cLow).lerp(cMid, hNorm / 0.45);
    } else {
      tmpColor.copy(cMid).lerp(cHigh, (hNorm - 0.45) / 0.55);
    }

    // 特色地貌色斑（毕棚沟红石彩林、伊犁紫色花海、乌兰湖盐边）
    if (id === "siguniang" && tmpDir.x > 0.2 && hNorm < 0.62) {
      tmpColor.lerp(cWater2, 0.55);
    } else if (id === "yili" && Math.sin(tmpDir.x * 9 + tmpDir.z * 8) > 0.55 && hNorm < 0.55) {
      tmpColor.lerp(cWater2, 0.45);
    } else if (id === "tengger" && r < PLANET_RADIUS + 0.05) {
      tmpColor.lerp(new THREE.Color("#fff0dc"), 0.6);
    }

    colors[i * 3] = tmpColor.r;
    colors[i * 3 + 1] = tmpColor.g;
    colors[i * 3 + 2] = tmpColor.b;
  }

  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const terrainMesh = new THREE.Mesh(
    geo,
    new THREE.MeshToonMaterial({
      vertexColors: true,
      gradientMap: STORYBOOK_GRAD,
    })
  );
  terrainMesh.name = "planet-terrain";
  group.add(terrainMesh);

  // 星球下半球点缀《小王子》式精致微缩环形石坑与遍野绘本小野花簇
  const craterMat = new THREE.MeshToonMaterial({
    color: pal.rock || "#7a746e",
    gradientMap: STORYBOOK_GRAD,
  });
  const craterRand = seededRand(id.length * 97 + 31);
  for (let k = 0; k < 9; k++) {
    const cd = latLonToUnitVec(-28 - craterRand() * 48, craterRand() * 360 - 180);
    const cr = getSurfaceRadius(id, cd);
    if (cr < PLANET_RADIUS + 0.08) continue;
    const crater = new THREE.Mesh(
      new THREE.TorusGeometry(0.24 + craterRand() * 0.18, 0.055, 7, 16),
      craterMat
    );
    crater.position.copy(cd).multiplyScalar(cr - 0.01);
    crater.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), cd);
    group.add(crater);
  }

  const wildflowerColors = ["#fff3b0", "#ff9ebb", "#a8d8ff", "#d8b4fe", "#fde047"];
  for (let f = 0; f < 68; f++) {
    const fd = new THREE.Vector3(
      craterRand() * 2 - 1,
      craterRand() * 2 - 1,
      craterRand() * 2 - 1
    ).normalize();
    const fr = getSurfaceRadius(id, fd);
    if (fr < PLANET_RADIUS + 0.12 || fr > PLANET_RADIUS + 1.25) continue;
    const petal = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.055, 0),
      new THREE.MeshBasicMaterial({ color: wildflowerColors[f % wildflowerColors.length] })
    );
    petal.position.copy(fd).multiplyScalar(fr + 0.03);
    group.add(petal);
  }

  // 2. 水体球壳（海洋 / 高山湖泊 / 赤红盐湖）
  const baseTerrainId = planetConfig.terrainType || GUEST_TERRAIN_MAP[id] || id;
  let waterMesh = null;
  if (
    baseTerrainId !== "zhagana" &&
    baseTerrainId !== "siguniang" &&
    baseTerrainId !== "kitty-xiaowutai" &&
    baseTerrainId !== "kitty-changbai" &&
    baseTerrainId !== "kitty-sunset" &&
    id !== "title"
  ) {
    const waterRadius =
      id === "maclehose"
        ? PLANET_RADIUS - 0.02
        : id === "tengger"
        ? PLANET_RADIUS - 0.08
        : PLANET_RADIUS - 0.05;
    waterMesh = new THREE.Mesh(
      new THREE.SphereGeometry(waterRadius, 48, 36),
      new THREE.MeshStandardMaterial({
        color: pal.water || "#1c96c9",
        roughness: 0.22,
        metalness: 0.15,
        transparent: true,
        opacity: 0.88,
      })
    );
    group.add(waterMesh);
  }

  // 3. 菲涅尔柔和大气辉光层
  const haloMat = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    uniforms: {
      uColor: { value: new THREE.Color(pal.halo || "#f0c768") },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPos;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vViewPos = -mvPos.xyz;
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying vec3 vNormal;
      varying vec3 vViewPos;
      void main() {
        vec3 viewDir = normalize(vViewPos);
        float rim = pow(clamp(1.0 + dot(vNormal, viewDir), 0.0, 1.0), 2.6);
        gl_FragColor = vec4(uColor, rim * 0.48);
      }
    `,
  });
  const haloMesh = new THREE.Mesh(new THREE.SphereGeometry(PLANET_RADIUS * 1.2, 36, 28), haloMat);
  group.add(haloMesh);

  // 4. 连接路标的蜿蜒石板虚线徒步小径
  const waypoints = planetConfig.waypoints || [];
  if (waypoints.length >= 2) {
    const stoneGeo = new THREE.CylinderGeometry(0.09, 0.11, 0.05, 6);
    const stoneMat = new THREE.MeshStandardMaterial({ color: "#f3e5c8", roughness: 0.9 });
    for (let i = 0; i < waypoints.length; i++) {
      const a = latLonToUnitVec(waypoints[i].lat, waypoints[i].lon);
      const b = latLonToUnitVec(
        waypoints[(i + 1) % waypoints.length].lat,
        waypoints[(i + 1) % waypoints.length].lon
      );
      const steps = 26;
      for (let s = 2; s < steps - 1; s++) {
        const t = s / steps;
        const d = new THREE.Vector3().lerpVectors(a, b, t).normalize();
        const r = getSurfaceRadius(id, d);
        if (id === "maclehose" && r < PLANET_RADIUS) continue;
        const stone = new THREE.Mesh(stoneGeo, stoneMat);
        stone.position.copy(d).multiplyScalar(r + 0.015);
        stone.quaternion.setFromUnitVectors(UP, d);
        group.add(stone);
      }
    }
  }

  // 5. 星球专属 3D 微缩生态与朋友圈故事彩蛋景观
  const rand = seededRand(id.charCodeAt(0) * 137 + id.length * 41);
  const wpDirs = waypoints.map((w) => latLonToUnitVec(w.lat, w.lon));
  const isNearWp = (d) => wpDirs.some((wd) => wd.distanceTo(d) < 0.2);

  // 放置朋友圈专属地标微缩装置
  if (id === "tengger") {
    // ① 绿洲马兰花丛（Day2 绿洲旁）
    const oasisCenter = latLonToUnitVec(-18, 108);
    const flowerMat = new THREE.MeshBasicMaterial({ color: "#9b72ff" });
    for (let f = 0; f < 18; f++) {
      const fd = oasisCenter
        .clone()
        .add(new THREE.Vector3((rand() - 0.5) * 0.35, (rand() - 0.5) * 0.35, (rand() - 0.5) * 0.35))
        .normalize();
      const iris = new THREE.Mesh(new THREE.OctahedronGeometry(0.075, 0), flowerMat);
      placeOnSphere(iris, fd, 0.06, id);
      group.add(iris);
    }
    // ② 篝火荧光棒营地 & 沙漠邮局绿邮筒 + 神树
    const fireCamp = createCampSite("#e88a34");
    const glowStick1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.36, 6),
      new THREE.MeshBasicMaterial({ color: "#3df5d4" })
    );
    glowStick1.position.set(0.54, 0.24, 0.15);
    glowStick1.rotation.z = -0.4;
    const glowStick2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.36, 6),
      new THREE.MeshBasicMaterial({ color: "#ff66c4" })
    );
    glowStick2.position.set(0.24, 0.24, 0.42);
    glowStick2.rotation.z = 0.45;
    fireCamp.add(glowStick1, glowStick2);
    placeOnSphere(fireCamp, latLonToUnitVec(-26, -30), 0, id);
    group.add(fireCamp);
    animatedProps.push(fireCamp);

    // 1:1 复刻实拍：橙棕木屋「沙漠邮局」+ 三扇窗 + 三只绿邮筒 + 枯木神树
    const postGroup = new THREE.Group();
    const cabinCv = document.createElement("canvas");
    cabinCv.width = 256;
    cabinCv.height = 128;
    const cctx = cabinCv.getContext("2d");
    cctx.fillStyle = "#b86b35";
    cctx.fillRect(0, 0, 256, 128);
    cctx.fillStyle = "#1e1a18";
    cctx.font = "bold 32px 'Songti SC', sans-serif";
    cctx.textAlign = "center";
    cctx.fillText("沙 漠 邮 局", 128, 44);
    [42, 108, 174].forEach((wx) => {
      cctx.fillStyle = "#2b2f36";
      cctx.fillRect(wx, 62, 40, 32);
    });
    const cabinTex = new THREE.CanvasTexture(cabinCv);
    cabinTex.colorSpace = THREE.SRGBColorSpace;
    const woodMat = new THREE.MeshToonMaterial({ color: "#b86b35", gradientMap: STORYBOOK_GRAD });
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.42, 0.38),
      [woodMat, woodMat, woodMat, woodMat, new THREE.MeshBasicMaterial({ map: cabinTex }), woodMat]
    );
    cabin.position.y = 0.21;
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.04, 0.44),
      new THREE.MeshStandardMaterial({ color: "#2b2d30" })
    );
    roof.position.y = 0.43;
    postGroup.add(cabin, roof);

    const greenBoxMat = new THREE.MeshToonMaterial({ color: "#1f6e43", gradientMap: STORYBOOK_GRAD });
    const poleMat = new THREE.MeshBasicMaterial({ color: "#e5e7eb" });
    [-0.54, -0.74, -0.94].forEach((px) => {
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.24, 6), poleMat);
      stand.position.set(px, 0.12, 0.06);
      const mbox = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.11, 0.08), greenBoxMat);
      mbox.position.set(px, 0.26, 0.06);
      postGroup.add(stand, mbox);
    });
    const sacredTree = createTree("deadwood");
    sacredTree.scale.setScalar(1.35);
    sacredTree.position.set(-1.16, 0, 0.08);
    postGroup.add(sacredTree);
    placeOnSphere(postGroup, latLonToUnitVec(33.5, -112), 0, id);
    group.add(postGroup);
  } else if (id === "yading") {
    // ① 松多垭口五彩经幡阵 & 驮着红色可乐箱的马帮
    const flagGroup = new THREE.Group();
    const poleMat = new THREE.MeshStandardMaterial({ color: "#dfd6c7" });
    const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.85, 6), poleMat);
    p1.position.set(-0.45, 0.42, 0);
    const p2 = p1.clone();
    p2.position.set(0.45, 0.42, 0);
    flagGroup.add(p1, p2);
    const fCols = ["#3b82f6", "#ffffff", "#ef4444", "#22c55e", "#eab308"];
    fCols.forEach((fc, idx) => {
      const fl = new THREE.Mesh(
        new THREE.BoxGeometry(0.13, 0.1, 0.02),
        new THREE.MeshBasicMaterial({ color: fc })
      );
      fl.position.set(-0.32 + idx * 0.16, 0.68 - Math.sin((idx / 4) * Math.PI) * 0.08, 0);
      flagGroup.add(fl);
    });
    placeOnSphere(flagGroup, latLonToUnitVec(26, 26), 0, id);
    group.add(flagGroup);

    // 马帮 + 可乐红箱
    const horseGroup = new THREE.Group();
    const horseMat = new THREE.MeshStandardMaterial({ color: "#6e4427", roughness: 0.85 });
    for (let m = 0; m < 2; m++) {
      const hBody = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.13), horseMat);
      hBody.position.set(m * 0.46, 0.22, m * 0.18);
      const hHead = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 0.09), horseMat);
      hHead.position.set(m * 0.46 + 0.16, 0.31, m * 0.18);
      const colaBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.11, 0.18),
        new THREE.MeshStandardMaterial({ color: "#e02828" })
      );
      colaBox.position.set(m * 0.46, 0.33, m * 0.18);
      horseGroup.add(hBody, hHead, colaBox);
    }
    placeOnSphere(horseGroup, latLonToUnitVec(18, 14), 0, id);
    group.add(horseGroup);

    // ② 暴雪营地 + 重点保护的弯曲帐篷杖杆
    const snowCamp = createCampSite("#eb9b34");
    const bentPole = new THREE.Mesh(
      new THREE.TorusGeometry(0.28, 0.018, 6, 14, Math.PI * 0.65),
      new THREE.MeshBasicMaterial({ color: "#ff6b6b" })
    );
    bentPole.position.set(-0.35, 0.18, 0.15);
    snowCamp.add(bentPole);
    placeOnSphere(snowCamp, latLonToUnitVec(-24, -36), 0, id);
    group.add(snowCamp);
    animatedProps.push(snowCamp);
  } else if (id === "zhagana") {
    // 红军垭口探路小无人机（空中悬停闪烁信号灯）
    const drone = new THREE.Group();
    const dBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.06, 0.22),
      new THREE.MeshStandardMaterial({ color: "#dce4ed" })
    );
    const dLed = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 8, 8),
      new THREE.MeshBasicMaterial({ color: "#3dff8b" })
    );
    dLed.position.y = -0.04;
    drone.add(dBody, dLed);
    placeOnSphere(drone, latLonToUnitVec(41, -92), 1.35, id);
    drone.userData.isDrone = true;
    drone.userData.basePos = drone.position.clone();
    group.add(drone);
    animatedProps.push(drone);
  } else if (id === "siguniang") {
    // ① 最高雪峰之巅立起细粒度「大峰 · 海拔5025米」红字石碑 + 冲顶安全路绳桩
    const peakDir = latLonToUnitVec(50, -112);
    const steleOffsetDir = latLonToUnitVec(50.8, -110.5);
    const steleGroup = createDafengStele5025();
    placeOnSphere(steleGroup, steleOffsetDir, 0, id);
    steleGroup.rotateY(-1.15);
    group.add(steleGroup);

    const ropePts = [];
    const postMat = new THREE.MeshStandardMaterial({ color: "#e86a2c" });
    const startRopeDir = latLonToUnitVec(36, -96);
    for (let s = 0; s <= 6; s++) {
      const rd = new THREE.Vector3().lerpVectors(startRopeDir, peakDir, s / 6).normalize();
      const rr = getSurfaceRadius(id, rd);
      const stake = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.32, 6), postMat);
      placeOnSphere(stake, rd, 0.14, id);
      group.add(stake);
      ropePts.push(rd.clone().multiplyScalar(rr + 0.26));
    }
    const ropeLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(ropePts),
      new THREE.LineBasicMaterial({ color: "#38bdf8" })
    );
    group.add(ropeLine);

    // ② 大本营圆顶帐篷与热气腾腾的大铜锅火锅
    const baseCamp = createCampSite("#4a90d9");
    const hotpot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.12, 0.12, 12),
      new THREE.MeshStandardMaterial({ color: "#c96e32", metalness: 0.45 })
    );
    hotpot.position.set(-0.36, 0.08, 0.24);
    const chimney = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.04, 0.22, 8),
      hotpot.material
    );
    chimney.position.set(-0.36, 0.18, 0.24);
    baseCamp.add(hotpot, chimney);
    placeOnSphere(baseCamp, latLonToUnitVec(14, 18), 0, id);
    group.add(baseCamp);
    animatedProps.push(baseCamp);

    // ③ 红石滩鲜红岩石群 + 独木桥
    const redMat = new THREE.MeshStandardMaterial({ color: "#d63e2f", roughness: 0.8 });
    for (let r = 0; r < 14; r++) {
      const rd = latLonToUnitVec(-22 + (rand() - 0.5) * 18, -45 + (rand() - 0.5) * 24);
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.14 + rand() * 0.1, 0), redMat);
      placeOnSphere(rock, rd, 0.02, id);
      group.add(rock);
    }
  } else if (id === "maclehose") {
    // 咸田湾海平面孤岛与绯红海上日出光球！
    const sunriseDir = latLonToUnitVec(12, 48);
    const island = new THREE.Mesh(
      new THREE.ConeGeometry(0.65, 0.38, 9),
      new THREE.MeshStandardMaterial({ color: "#243547", roughness: 0.9 })
    );
    placeOnSphere(island, sunriseDir, 0.12, id);
    group.add(island);

    const redSun = new THREE.Mesh(
      new THREE.SphereGeometry(0.72, 24, 20),
      new THREE.MeshBasicMaterial({ color: "#ff3b47" })
    );
    redSun.position.copy(sunriseDir).multiplyScalar(PLANET_RADIUS + 2.35);
    const sunHalo = new THREE.Mesh(
      new THREE.SphereGeometry(1.15, 20, 16),
      new THREE.MeshBasicMaterial({
        color: "#ff6b52",
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending,
      })
    );
    redSun.add(sunHalo);
    group.add(redSun);

    // 咸田湾沙滩发光生日小蛋糕 🎂 + M042 刻字标距柱
    const cakeGroup = new THREE.Group();
    const cakeBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.17, 0.12, 14),
      new THREE.MeshToonMaterial({ color: "#fff5eb", gradientMap: STORYBOOK_GRAD })
    );
    cakeBase.position.y = 0.06;
    const candle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.12, 8),
      new THREE.MeshBasicMaterial({ color: "#fb7185" })
    );
    candle.position.y = 0.16;
    const flame = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 8, 8),
      new THREE.MeshBasicMaterial({ color: "#fde047" })
    );
    flame.position.y = 0.24;
    const cakeLight = new THREE.PointLight("#ffd166", 1.5, 3.2);
    cakeLight.position.y = 0.32;
    cakeGroup.add(cakeBase, candle, flame, cakeLight);
    placeOnSphere(cakeGroup, latLonToUnitVec(14.5, 25.5), 0.01, id);
    group.add(cakeGroup);

    const m042Cv = document.createElement("canvas");
    m042Cv.width = 128;
    m042Cv.height = 256;
    const mctx = m042Cv.getContext("2d");
    mctx.fillStyle = "#efe4ce";
    mctx.fillRect(0, 0, 128, 256);
    mctx.fillStyle = "#ffffff";
    mctx.fillRect(14, 24, 100, 130);
    mctx.fillStyle = "#1e293b";
    mctx.font = "bold 28px sans-serif";
    mctx.textAlign = "center";
    mctx.fillText("M042", 64, 126);
    mctx.fillText("🚶", 64, 76);
    const m042Post = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.56, 0.12),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(m042Cv) })
    );
    placeOnSphere(m042Post, latLonToUnitVec(-30.5, -42.5), 0.26, id);
    group.add(m042Post);
  } else if (id === "yili") {
    // ① 右手果子沟微缩斜拉大桥（赛里木湖山脊旁）
    const bridge = new THREE.Group();
    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.045, 0.16),
      new THREE.MeshStandardMaterial({ color: "#eef3fa" })
    );
    deck.position.y = 0.36;
    const towerMat = new THREE.MeshStandardMaterial({ color: "#ffffff" });
    [-0.32, 0.32].forEach((tx) => {
      const tower = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.72, 0.14), towerMat);
      tower.position.set(tx, 0.36, 0);
      bridge.add(tower);
    });
    bridge.add(deck);
    placeOnSphere(bridge, latLonToUnitVec(24, 38), 0.05, id);
    group.add(bridge);

    // ② 大海道风蚀雅丹“诺亚方舟”岩台 + 中秋皎洁大圆月🌕
    const arkMat = new THREE.MeshStandardMaterial({ color: "#b87c4c", roughness: 0.88 });
    for (let yk = 0; yk < 6; yk++) {
      const yd = latLonToUnitVec(-34 + (yk - 2.5) * 4, -42 + (yk % 2) * 8);
      const ark = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.28 + (yk % 3) * 0.1, 0.18), arkMat);
      placeOnSphere(ark, yd, 0.06, id);
      group.add(ark);
    }
    const fullMoon = new THREE.Mesh(
      new THREE.SphereGeometry(0.88, 24, 20),
      new THREE.MeshBasicMaterial({ color: "#ffd24a" })
    );
    fullMoon.position.copy(latLonToUnitVec(-32, -68)).multiplyScalar(PLANET_RADIUS + 4.2);
    const moonGlow = new THREE.Mesh(
      new THREE.SphereGeometry(1.48, 20, 16),
      new THREE.MeshBasicMaterial({
        color: "#ffb62e",
        transparent: true,
        opacity: 0.36,
        blending: THREE.AdditiveBlending,
      })
    );
    fullMoon.add(moonGlow);
    group.add(fullMoon);

    // 赛里木湖并肩游弋的白天鹅🦢 + 唐布拉雪原对称静立的两匹骏马🐴
    const swanMat = new THREE.MeshBasicMaterial({ color: "#ffffff" });
    [-1.5, 1.5].forEach((offsetLon) => {
      const swan = new THREE.Group();
      const sBody = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), swanMat);
      sBody.scale.set(1.4, 0.85, 0.95);
      const sNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.16, 8), swanMat);
      sNeck.position.set(0.09, 0.1, 0);
      swan.add(sBody, sNeck);
      const sd = latLonToUnitVec(-31, -37 + offsetLon);
      swan.position.copy(sd).multiplyScalar(PLANET_RADIUS - 0.02);
      swan.quaternion.setFromUnitVectors(UP, sd);
      group.add(swan);
    });

    const steedMat = new THREE.MeshToonMaterial({ color: "#4a3222", gradientMap: STORYBOOK_GRAD });
    [-2.2, 2.2].forEach((offsetLon, idx) => {
      const horse = new THREE.Group();
      const hb = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.12), steedMat);
      hb.position.y = 0.22;
      const hh = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.15, 0.09), steedMat);
      hh.position.set(idx === 0 ? 0.15 : -0.15, 0.28, 0);
      horse.add(hb, hh);
      placeOnSphere(horse, latLonToUnitVec(40, -104 + offsetLon), 0, id);
      group.add(horse);
    });
  } else if (baseTerrainId === "kitty-xiaowutai") {
    // 小五台高山草甸特色：金莲花丛 + 四台山顶石头玛尼标志木牌
    const flowerMat = new THREE.MeshToonMaterial({ color: "#facc15", gradientMap: STORYBOOK_GRAD });
    const stemMat = new THREE.MeshToonMaterial({ color: "#4d7c0f", gradientMap: STORYBOOK_GRAD });
    for (let f = 0; f < 18; f++) {
      const fl = new THREE.Group();
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.16, 5), stemMat);
      st.position.y = 0.08;
      const bl = new THREE.Mesh(new THREE.DodecahedronGeometry(0.075, 0), flowerMat);
      bl.position.y = 0.18;
      fl.add(st, bl);
      placeOnSphere(fl, latLonToUnitVec(-45 + f * 5.2, (f * 67) % 360 - 180), 0, id);
      group.add(fl);
    }
    // 东台2882m 木质山顶标桩
    const post = new THREE.Group();
    const wood = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.85, 0.14),
      new THREE.MeshToonMaterial({ color: "#92400e", gradientMap: STORYBOOK_GRAD })
    );
    wood.position.y = 0.42;
    const plaque = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.22, 0.08),
      new THREE.MeshToonMaterial({ color: "#fef3c7", gradientMap: STORYBOOK_GRAD })
    );
    plaque.position.y = 0.72;
    post.add(wood, plaque);
    placeOnSphere(post, latLonToUnitVec(59, 22), 0, id);
    group.add(post);
  } else if (baseTerrainId === "kitty-changbai") {
    // 长白山火山口高海拔晶莹蓝宝石天池湖面
    const tianchi = new THREE.Mesh(
      new THREE.CylinderGeometry(2.75, 2.55, 0.24, 36),
      new THREE.MeshStandardMaterial({
        color: "#1b7ce6",
        emissive: "#0d3f8a",
        emissiveIntensity: 0.22,
        roughness: 0.14,
        metalness: 0.25,
        transparent: true,
        opacity: 0.92,
      })
    );
    placeOnSphere(tianchi, latLonToUnitVec(62, 10), 0.36, id);
    group.add(tianchi);
  } else if (baseTerrainId === "kitty-sunset") {
    // 日落八分钟与旷野旋转白色大风车群（3座风力发电机）
    const towerMat = new THREE.MeshToonMaterial({ color: "#f8fafc", gradientMap: STORYBOOK_GRAD });
    const hubMat = new THREE.MeshToonMaterial({ color: "#fcd34d", gradientMap: STORYBOOK_GRAD });
    [
      [16, 114, 1.15],
      [26, 134, 0.92],
      [4, 98, 0.85],
    ].forEach(([lat, lon, sc]) => {
      const wm = new THREE.Group();
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.11, 2.35, 10), towerMat);
      mast.position.y = 1.15;
      const nacelle = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.34), towerMat);
      nacelle.position.set(0, 2.34, 0.04);
      const rotor = new THREE.Group();
      rotor.position.set(0, 2.34, 0.23);
      const hub = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), hubMat);
      rotor.add(hub);
      for (let b = 0; b < 3; b++) {
        const bladePivot = new THREE.Group();
        bladePivot.rotation.z = (b * Math.PI * 2) / 3;
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.085, 1.08, 0.022), towerMat);
        blade.position.y = 0.56;
        bladePivot.add(blade);
        rotor.add(bladePivot);
      }
      wm.add(mast, nacelle, rotor);
      wm.scale.setScalar(sc);
      wm.userData.windmillRotor = rotor;
      placeOnSphere(wm, latLonToUnitVec(lat, lon), -0.05, id);
      group.add(wm);
      animatedProps.push(wm);
    });
  } else if (id === "kitty-zhagana") {
    // 措美峰东线半冰封蓝白高山海子
    const iceLake = new THREE.Mesh(
      new THREE.CylinderGeometry(1.75, 1.6, 0.14, 28),
      new THREE.MeshStandardMaterial({ color: "#8ee0f7", roughness: 0.12, metalness: 0.3 })
    );
    placeOnSphere(iceLake, latLonToUnitVec(44, 22), 0.04, id);
    group.add(iceLake);
  } else if (baseTerrainId === "kitty-daqing") {
    // 大青山云端双顶露营帐篷与观云平台
    const extraCamp = createCampSite("#65c466");
    placeOnSphere(extraCamp, latLonToUnitVec(12, 104), 0, id);
    group.add(extraCamp);
    animatedProps.push(extraCamp);
  }

  if (id === "title") {
    const camp = createCampSite("#f29638");
    placeOnSphere(camp, latLonToUnitVec(74, 48), 0, id);
    group.add(camp);
    animatedProps.push(camp);
    for (let i = 0; i < 34; i++) {
      const d = new THREE.Vector3(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize();
      if (d.distanceTo(UP) < 0.28) continue;
      const tree = createTree("spruce", i % 3 === 0 ? "#d99838" : "#2f7349");
      tree.scale.setScalar(0.8 + rand() * 0.55);
      placeOnSphere(tree, d, -0.04, id);
      group.add(tree);
    }
  } else {
    // 放置温暖营地
    const campDir = latLonToUnitVec(-8, -12);
    const camp = createCampSite(pal.accent || "#f09436");
    placeOnSphere(camp, campDir, 0, id);
    group.add(camp);
    animatedProps.push(camp);

    const propCount = 92;
    for (let i = 0; i < propCount; i++) {
      const d = new THREE.Vector3(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize();
      if (isNearWp(d) || d.distanceTo(campDir) < 0.22) continue;
      const r = getSurfaceRadius(id, d);
      if (waterMesh && r < PLANET_RADIUS + 0.05) continue;

      let prop = null;
      if (id === "tengger") {
        if (i < 8) {
          // 双峰小骆驼
          prop = new THREE.Group();
          const camelMat = new THREE.MeshStandardMaterial({ color: "#9c5e31", roughness: 0.85 });
          const body = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.14), camelMat);
          body.position.y = 0.22;
          const head = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.18, 0.1), camelMat);
          head.position.set(0.16, 0.32, 0);
          prop.add(body, head);
        } else if (i < 22) {
          prop = createTree(i % 2 === 0 ? "deadwood" : "spruce", "#e09a34");
        }
      } else if (id === "yading") {
        if (i < 28 && r < PLANET_RADIUS + 0.85) {
          prop = createTree("spruce", i % 2 === 0 ? "#d99e2b" : "#3a6e4c");
        }
      } else if (id === "zhagana") {
        if (i < 10 && d.y < 0.35 && d.y > -0.25) {
          // 藏式榻板木屋
          prop = new THREE.Group();
          const house = new THREE.Mesh(
            new THREE.BoxGeometry(0.34, 0.24, 0.28),
            new THREE.MeshStandardMaterial({ color: "#b58152", roughness: 0.85 })
          );
          house.position.y = 0.12;
          const win = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.07, 0.3),
            new THREE.MeshBasicMaterial({ color: "#ffe18c" })
          );
          win.position.y = 0.14;
          prop.add(house, win);
        } else if (i < 34) {
          prop = createTree("spruce", "#2b6944");
        }
      } else if (id === "siguniang") {
        if (i < 10) {
          prop = createTree("deadwood");
        } else if (i < 34 && r < PLANET_RADIUS + 0.9) {
          prop = createTree("spruce", d.x > 0 ? "#d95d39" : "#e39f36");
        }
      } else if (id === "maclehose") {
        if (i < 12 && r < PLANET_RADIUS + 0.35) {
          // 万宜水库六角火山岩柱
          prop = new THREE.Mesh(
            new THREE.CylinderGeometry(0.11, 0.12, 0.55 + rand() * 0.35, 6),
            new THREE.MeshStandardMaterial({ color: "#bfa074", roughness: 0.8 })
          );
        } else if (i < 20) {
          // 麦理浩径标志性标距柱
          prop = new THREE.Group();
          const post = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.42, 0.08),
            new THREE.MeshStandardMaterial({ color: "#f5ebd6" })
          );
          post.position.y = 0.21;
          const band = new THREE.Mesh(
            new THREE.BoxGeometry(0.09, 0.1, 0.09),
            new THREE.MeshBasicMaterial({ color: "#eb9c26" })
          );
          band.position.y = 0.32;
          prop.add(post, band);
        } else if (i < 34) {
          prop = createTree("spruce", "#489956");
        }
      } else if (id === "yili") {
        if (i < 7) {
          // 洁白哈萨克毡房
          prop = new THREE.Group();
          const wall = new THREE.Mesh(
            new THREE.CylinderGeometry(0.28, 0.28, 0.18, 12),
            new THREE.MeshStandardMaterial({ color: "#faf6ed", roughness: 0.75 })
          );
          wall.position.y = 0.09;
          const dome = new THREE.Mesh(
            new THREE.SphereGeometry(0.28, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
            wall.material
          );
          dome.position.y = 0.18;
          prop.add(wall, dome);
        } else if (i < 18) {
          // 草原小绵羊
          prop = new THREE.Mesh(
            new THREE.SphereGeometry(0.11, 8, 8),
            new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.9 })
          );
          prop.scale.set(1.3, 0.95, 0.95);
        } else if (i < 38) {
          prop = createTree("spruce", "#1f5938");
          prop.scale.setScalar(1.15);
        }
      } else if (id.startsWith("kitty-") || id.startsWith("guest-")) {
        if (i < 30 && r < PLANET_RADIUS + 1.0) {
          const leafColor =
            baseTerrainId === "kitty-sunset"
              ? i % 2 === 0 ? "#d97757" : "#6d597a"
              : baseTerrainId === "kitty-daqing"
              ? "#45a15a"
              : "#2f7852";
          prop = createTree("spruce", leafColor);
          prop.scale.setScalar(0.85 + rand() * 0.4);
        }
      }

      if (prop) {
        placeOnSphere(prop, d, -0.02, id);
        group.add(prop);
      }
    }
  }

  // 6. 二十四个打卡点一对一专属 3D 微缩故事小物件（替代单一石堆）
  function makeSignTex(bgHex, fgHex, text) {
    const c = document.createElement("canvas");
    c.width = 160;
    c.height = 80;
    const x = c.getContext("2d");
    x.fillStyle = bgHex;
    x.fillRect(0, 0, 160, 80);
    x.fillStyle = fgHex;
    x.font = "bold 28px 'Kaiti SC', sans-serif";
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText(text, 80, 42);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  function createWaypointDiorama(wpId) {
    const d = new THREE.Group();
    const toon = (col) => new THREE.MeshToonMaterial({ color: col, gradientMap: STORYBOOK_GRAD });

    switch (wpId) {
      case "tengger-1": {
        // 沙海迎风红路旗 + 蓝色易拉罐与自热饭盒
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.56, 6), toon("#e5e7eb"));
        pole.position.set(-0.1, 0.28, 0);
        const flag = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.28, 3), new THREE.MeshBasicMaterial({ color: "#ef4444" }));
        flag.rotation.z = -Math.PI / 2;
        flag.position.set(0.04, 0.46, 0);
        const can = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.14, 10), toon("#2563eb"));
        can.position.set(0.14, 0.07, 0.08);
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.09, 0.14), toon("#f8fafc"));
        box.position.set(0.06, 0.045, -0.1);
        d.add(pole, flag, can, box);
        break;
      }
      case "tengger-2": {
        // 绿洲水洼 + 盛开的紫色马兰花簇
        const pond = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.03, 16), toon("#38b2ac"));
        pond.position.y = 0.015;
        d.add(pond);
        [[-0.14, 0.1], [0.15, 0.08], [0.02, -0.15]].forEach(([fx, fz]) => {
          const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.015, 0.22, 5), toon("#2f855a"));
          stem.position.set(fx, 0.12, fz);
          const bloom = new THREE.Mesh(new THREE.OctahedronGeometry(0.085, 0), new THREE.MeshBasicMaterial({ color: "#8b5cf6" }));
          bloom.position.set(fx, 0.25, fz);
          d.add(stem, bloom);
        });
        break;
      }
      case "tengger-3": {
        // 篝火柴堆 + 挥舞的青粉双色荧光棒
        const log1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.34, 6), toon("#78350f"));
        log1.rotation.z = Math.PI / 2;
        log1.position.y = 0.04;
        const fire = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.28, 6), new THREE.MeshBasicMaterial({ color: "#fbbf24" }));
        fire.position.y = 0.16;
        const stickA = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.36, 6), new THREE.MeshBasicMaterial({ color: "#2dd4bf" }));
        stickA.position.set(-0.18, 0.22, 0.08);
        stickA.rotation.z = 0.45;
        const stickB = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.36, 6), new THREE.MeshBasicMaterial({ color: "#f472b6" }));
        stickB.position.set(0.18, 0.22, 0.08);
        stickB.rotation.z = -0.45;
        d.add(log1, fire, stickA, stickB);
        break;
      }
      case "tengger-4": {
        // 绿色邮筒与信封（呼应身旁的沙漠邮局木屋）
        const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.28, 8), toon("#e2e8f0"));
        stand.position.y = 0.14;
        const mbox = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.15), toon("#15803d"));
        mbox.position.y = 0.34;
        const letter = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.02), new THREE.MeshBasicMaterial({ color: "#fef3c7" }));
        letter.position.set(0, 0.36, 0.085);
        d.add(stand, mbox, letter);
        break;
      }
      case "yading-1": {
        // 松多垭口经幡柱 + 马帮红色可乐补给箱
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.58, 6), toon("#d6d3d1"));
        pole.position.set(-0.12, 0.29, 0);
        ["#3b82f6", "#f8fafc", "#ef4444", "#22c55e", "#eab308"].forEach((fc, i) => {
          const fl = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.02), new THREE.MeshBasicMaterial({ color: fc }));
          fl.position.set(-0.03, 0.52 - i * 0.07, 0);
          d.add(fl);
        });
        const crate = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.15), toon("#dc2626"));
        crate.position.set(0.14, 0.07, 0.06);
        d.add(pole, crate);
        break;
      }
      case "yading-2": {
        // 积雪半埋金字塔帐篷 + 外侧折弯的红色支撑杖杆 + 化雪小锅
        const tent = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.36, 4), toon("#eab308"));
        tent.position.set(-0.05, 0.18, 0);
        tent.rotation.y = 0.4;
        const bentPole = new THREE.Mesh(
          new THREE.TorusGeometry(0.22, 0.018, 6, 12, Math.PI * 0.72),
          new THREE.MeshBasicMaterial({ color: "#ef4444" })
        );
        bentPole.position.set(0.12, 0.16, 0.1);
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.06, 0.08, 10), toon("#94a3b8"));
        pot.position.set(0.2, 0.04, -0.08);
        d.add(tent, bentPole, pot);
        break;
      }
      case "yading-3": {
        // 4900m 垭口戴红围巾小雪人⛄ + 洁白雪球簇
        const b1 = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), toon("#ffffff"));
        b1.position.y = 0.14;
        const b2 = new THREE.Mesh(new THREE.SphereGeometry(0.105, 12, 10), toon("#ffffff"));
        b2.position.y = 0.34;
        const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.022, 6, 12), new THREE.MeshBasicMaterial({ color: "#ef4444" }));
        scarf.rotation.x = Math.PI / 2;
        scarf.position.y = 0.26;
        const sb1 = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), toon("#f8fafc"));
        sb1.position.set(0.2, 0.05, 0.1);
        const sb2 = sb1.clone();
        sb2.position.set(0.14, 0.05, 0.2);
        d.add(b1, b2, scarf, sb1, sb2);
        break;
      }
      case "yading-4": {
        // 波拥措层叠玛尼石堆 + 迷你装满世界的小背包
        [0.2, 0.15, 0.1].forEach((rad, i) => {
          const st = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.85, rad, 0.09, 7), toon(i === 1 ? "#cbd5e1" : "#94a3b8"));
          st.position.set(-0.08, 0.045 + i * 0.09, 0);
          d.add(st);
        });
        const miniPack = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 0.12), toon("#0d9488"));
        miniPack.position.set(0.16, 0.11, 0.06);
        d.add(miniPack);
        break;
      }
      case "zhagana-1": {
        // 甘南小木屋 + 挂着平安进山小红牌的木桩
        const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.24), toon("#9c6b43"));
        cabin.position.set(-0.06, 0.11, 0);
        const roof = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.14, 4), toon("#5c3d24"));
        roof.rotation.y = Math.PI / 4;
        roof.position.set(-0.06, 0.29, 0);
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.34, 6), toon("#78553a"));
        post.position.set(0.2, 0.17, 0.08);
        const redTag = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.015), new THREE.MeshBasicMaterial({ color: "#dc2626" }));
        redTag.position.set(0.2, 0.24, 0.1);
        d.add(cabin, roof, post, redTag);
        break;
      }
      case "zhagana-2": {
        // 红军垭口雪阶 + 握作冰镐状交叉双登山杖
        for (let s = 0; s < 3; s++) {
          const step = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.14), toon("#f1f5f9"));
          step.position.set(-0.06 + s * 0.06, 0.03 + s * 0.06, -0.06 + s * 0.05);
          d.add(step);
        }
        const pMat = toon("#38bdf8");
        const pole1 = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.012, 0.5, 6), pMat);
        pole1.position.set(0.12, 0.25, 0.08);
        pole1.rotation.z = 0.38;
        const pole2 = pole1.clone();
        pole2.rotation.z = -0.38;
        d.add(pole1, pole2);
        break;
      }
      case "zhagana-3": {
        // 密林溪涧原木小桥 + 冷杉幼苗
        const stream = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.02, 0.2), toon("#38bdf8"));
        stream.position.y = 0.01;
        const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.34), toon("#8b5a2b"));
        bridge.position.y = 0.05;
        const fir = createTree("spruce", "#1e5638");
        fir.scale.setScalar(0.55);
        fir.position.set(-0.2, 0, -0.1);
        d.add(stream, bridge, fir);
        break;
      }
      case "zhagana-4": {
        // 光盖山多洛米蒂式双尖灰白石峰微缩门
        const p1 = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.52, 5), toon("#cbd5e1"));
        p1.position.set(-0.13, 0.26, 0);
        const p2 = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.42, 5), toon("#94a3b8"));
        p2.position.set(0.13, 0.21, 0.04);
        d.add(p1, p2);
        break;
      }
      case "siguniang-1": {
        // 大本营木方桌 + 红油沸腾高烟囱铜锅火锅🍲
        const table = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.28), toon("#8c5832"));
        table.position.y = 0.07;
        const potRim = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.1, 0.09, 14), toon("#d97706"));
        potRim.position.y = 0.18;
        const soup = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.02, 12), new THREE.MeshBasicMaterial({ color: "#dc2626" }));
        soup.position.y = 0.22;
        const chim = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.035, 0.16, 10), toon("#f59e0b"));
        chim.position.y = 0.27;
        d.add(table, potRim, soup, chim);
        break;
      }
      case "siguniang-2": {
        // 大峰 5025m 峰顶石碑旁配精致覆雪祈福石座（主碑紧立于侧）
        const snowPedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.14, 7), toon("#f1f5f9"));
        snowPedestal.position.y = 0.07;
        d.add(snowPedestal);
        break;
      }
      case "siguniang-3": {
        // 长坪沟鲜红红石滩石阵 + 独木桥
        const log = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.42, 7), toon("#7c4d2b"));
        log.rotation.z = Math.PI / 2;
        log.position.set(0, 0.06, 0.1);
        d.add(log);
        [[-0.14, -0.06], [0.02, -0.09], [0.16, -0.04], [-0.05, 0.02]].forEach(([rx, rz], i) => {
          const rs = new THREE.Mesh(new THREE.DodecahedronGeometry(0.075 + (i % 2) * 0.025, 0), toon("#dc2626"));
          rs.position.set(rx, 0.06, rz);
          d.add(rs);
        });
        break;
      }
      case "siguniang-4": {
        // 4661m 叉子沟垭口木路牌 + 毕棚沟金秋小彩林
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.42, 6), toon("#784c2a"));
        post.position.set(-0.08, 0.21, 0);
        const board = new THREE.Mesh(
          new THREE.BoxGeometry(0.28, 0.13, 0.03),
          new THREE.MeshBasicMaterial({ map: makeSignTex("#7c4a24", "#fef3c7", "4661 m") })
        );
        board.position.set(-0.08, 0.36, 0);
        const larch = createTree("spruce", "#f59e0b");
        larch.scale.setScalar(0.56);
        larch.position.set(0.18, 0, -0.05);
        d.add(post, board, larch);
        break;
      }
      case "maclehose-1": {
        // 咸田湾沙滩发光生日蜡烛小蛋糕🎂
        const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 16), toon("#f8fafc"));
        plate.position.y = 0.01;
        const cake = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.16, 0.13, 16), toon("#fff1f2"));
        cake.position.y = 0.08;
        const icing = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.022, 6, 16), new THREE.MeshBasicMaterial({ color: "#fb7185" }));
        icing.rotation.x = Math.PI / 2;
        icing.position.y = 0.145;
        const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.12, 8), new THREE.MeshBasicMaterial({ color: "#f43f5e" }));
        candle.position.y = 0.2;
        const flame = new THREE.Mesh(new THREE.SphereGeometry(0.036, 8, 8), new THREE.MeshBasicMaterial({ color: "#fde047" }));
        flame.position.y = 0.28;
        d.add(plate, cake, icing, candle, flame);
        break;
      }
      case "maclehose-2": {
        // 破边洲六角火山岩柱簇 + 红底白字「破边洲」路牌
        [[-0.14, 0.44], [-0.03, 0.34], [0.07, 0.26]].forEach(([hx, hh]) => {
          const col = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.07, hh, 6), toon("#c2a278"));
          col.position.set(hx, hh / 2, -0.04);
          d.add(col);
        });
        const sign = new THREE.Mesh(
          new THREE.BoxGeometry(0.26, 0.11, 0.025),
          new THREE.MeshBasicMaterial({ map: makeSignTex("#991b1b", "#ffffff", "破邊洲") })
        );
        sign.position.set(0.14, 0.18, 0.12);
        const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.2, 6), toon("#78350f"));
        sp.position.set(0.14, 0.1, 0.12);
        d.add(sign, sp);
        break;
      }
      case "maclehose-3": {
        // 海岸山脊迎风白色旗帜 + 观海木长椅
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.56, 6), toon("#cbd5e1"));
        pole.position.set(-0.14, 0.28, 0);
        const banner = new THREE.Mesh(
          new THREE.BoxGeometry(0.26, 0.16, 0.018),
          new THREE.MeshBasicMaterial({ map: makeSignTex("#f8fafc", "#be123c", "自由") })
        );
        banner.position.set(0, 0.46, 0);
        const bench = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.12), toon("#a16207"));
        bench.position.set(0.1, 0.06, 0.1);
        d.add(pole, banner, bench);
        break;
      }
      case "maclehose-4": {
        // 麦理浩径 M042 标距柱
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.48, 0.1), toon("#efe4ce"));
        post.position.y = 0.24;
        const plaque = new THREE.Mesh(
          new THREE.BoxGeometry(0.15, 0.16, 0.11),
          new THREE.MeshBasicMaterial({ map: makeSignTex("#ffffff", "#0f172a", "M042") })
        );
        plaque.position.y = 0.34;
        d.add(post, plaque);
        break;
      }
      case "yili-1": {
        // 松树头山脊红色高山气罐 + 银色煮锅（日照金山下煮饭！）
        const canister = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.1, 12), toon("#dc2626"));
        canister.position.set(-0.08, 0.05, 0.04);
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.085, 0.11, 12), toon("#cbd5e1"));
        pot.position.set(-0.08, 0.16, 0.04);
        const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.02, 12), toon("#94a3b8"));
        lid.position.set(-0.08, 0.22, 0.04);
        const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.07, 10), toon("#f59e0b"));
        mug.position.set(0.14, 0.035, 0.06);
        d.add(canister, pot, lid, mug);
        break;
      }
      case "yili-2": {
        // 唐布拉覆雪原木牧栏 + 对称小马驹
        const rail1 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.03, 0.03), toon("#8b5a2b"));
        rail1.position.set(0, 0.18, -0.12);
        const rail2 = rail1.clone();
        rail2.position.set(0, 0.1, -0.12);
        [-0.18, 0.18].forEach((px) => {
          const p = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.24, 6), toon("#784c2a"));
          p.position.set(px, 0.12, -0.12);
          d.add(p);
        });
        const pony = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.11, 0.08), toon("#5c3a21"));
        pony.position.set(0, 0.12, 0.06);
        d.add(rail1, rail2, pony);
        break;
      }
      case "yili-3": {
        // 琼库什台杉木小木屋 + 金黄夕阳芦苇丛
        const hut = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.2, 0.22), toon("#a16207"));
        hut.position.set(-0.08, 0.1, 0);
        const roof = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.14, 4), toon("#713f12"));
        roof.rotation.y = Math.PI / 4;
        roof.position.set(-0.08, 0.27, 0);
        [0.12, 0.18, 0.23].forEach((rx, i) => {
          const reed = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.008, 0.3 + i * 0.04, 5), new THREE.MeshBasicMaterial({ color: "#fde047" }));
          reed.position.set(rx, 0.15, (i - 1) * 0.06);
          reed.rotation.z = -0.12 * (i - 1);
          d.add(reed);
        });
        d.add(hut, roof);
        break;
      }
      case "yili-4": {
        // 大海道微缩“诺亚方舟”风蚀雅丹台 + 戈壁观月折叠椅
        const baseMesa = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.14, 0.2), toon("#b47649"));
        baseMesa.position.set(-0.06, 0.07, -0.04);
        const topMesa = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.15), toon("#d08c5a"));
        topMesa.position.set(-0.06, 0.2, -0.04);
        const chair = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.12, 0.13), toon("#334155"));
        chair.position.set(0.18, 0.06, 0.1);
        d.add(baseMesa, topMesa, chair);
        break;
      }
      default: {
        const cairn = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.38, 6), toon("#dfd5c5"));
        cairn.position.y = 0.19;
        d.add(cairn);
      }
    }
    return d;
  }

  const waypointObjs = waypoints.map((wp) => {
    const unitDir = latLonToUnitVec(wp.lat, wp.lon);
    const r = getSurfaceRadius(id, unitDir);
    const wpGroup = new THREE.Group();
    wpGroup.position.copy(unitDir).multiplyScalar(r);
    wpGroup.quaternion.setFromUnitVectors(UP, unitDir);

    // 每个打卡点专属的 3D 微缩主题小景物 + 悬浮发光星晶 + 光环
    const diorama = createWaypointDiorama(wp.id);
    wpGroup.add(diorama);

    const crystalMat = new THREE.MeshBasicMaterial({ color: "#ffe28a" });
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), crystalMat);
    crystal.position.y = 0.72;
    wpGroup.add(crystal);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.42, 0.54, 28),
      new THREE.MeshBasicMaterial({
        color: "#f5cc6a",
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.72,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    wpGroup.add(ring);

    const beamMat = new THREE.MeshBasicMaterial({
      color: "#ffe494",
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.28, 3.6, 12, 1, true), beamMat);
    beam.position.y = 1.8;
    wpGroup.add(beam);

    group.add(wpGroup);

    const entry = {
      data: wp,
      unitDir,
      position: wpGroup.position.clone(),
      group: wpGroup,
      crystal,
      ring,
      beam,
      isDiscovered: false,
      markDiscovered() {
        entry.isDiscovered = true;
        crystalMat.color.set("#fff6cc");
        beam.scale.set(1.45, 1.8, 1.45);
        beamMat.opacity = 0.42;
        ring.material.color.set("#fff0a6");
      },
    };

    if (discoveredSet && discoveredSet.has(wp.id)) {
      entry.markDiscovered();
    }
    return entry;
  });

  // 7. 童话蓬松立体云朵环 + 圆形柔光天气微粒
  const cloudsGroup = new THREE.Group();
  if (id !== "tengger") {
    const cloudMat = new THREE.MeshStandardMaterial({
      color: "#ffffff",
      roughness: 0.9,
      transparent: true,
      opacity: 0.78,
    });
    for (let c = 0; c < 8; c++) {
      const puffCluster = new THREE.Group();
      for (let k = 0; k < 3; k++) {
        const puff = new THREE.Mesh(
          new THREE.SphereGeometry(0.35 + (k === 1 ? 0.14 : 0), 12, 10),
          cloudMat
        );
        puff.position.set((k - 1) * 0.36, (k % 2) * 0.08, 0);
        puff.scale.set(1.3, 0.72, 0.9);
        puffCluster.add(puff);
      }
      const ca = (c / 8) * Math.PI * 2;
      const clat = ((c % 3) - 1) * 28;
      const cdir = latLonToUnitVec(clat, (ca * 180) / Math.PI);
      puffCluster.position.copy(cdir).multiplyScalar(PLANET_RADIUS + 2.6 + (c % 2) * 0.6);
      puffCluster.quaternion.setFromUnitVectors(UP, cdir);
      cloudsGroup.add(puffCluster);
    }
    group.add(cloudsGroup);
  }

  const dotCanvas = document.createElement("canvas");
  dotCanvas.width = 32;
  dotCanvas.height = 32;
  const dctx = dotCanvas.getContext("2d");
  const dgrad = dctx.createRadialGradient(16, 16, 1, 16, 16, 15);
  dgrad.addColorStop(0, "rgba(255,255,255,1)");
  dgrad.addColorStop(0.45, "rgba(255,255,255,0.65)");
  dgrad.addColorStop(1, "rgba(255,255,255,0)");
  dctx.fillStyle = dgrad;
  dctx.fillRect(0, 0, 32, 32);
  const softDotTex = new THREE.CanvasTexture(dotCanvas);

  const pCount = 320;
  const pPos = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    const d = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
    const pr = PLANET_RADIUS + 0.9 + Math.random() * 4.6;
    pPos[i * 3] = d.x * pr;
    pPos[i * 3 + 1] = d.y * pr;
    pPos[i * 3 + 2] = d.z * pr;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  const particles = new THREE.Points(
    pGeo,
    new THREE.PointsMaterial({
      color: pal.particle || "#fff2c2",
      map: softDotTex,
      size: 0.26,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  group.add(particles);

  // 8. 球面等高线徒步环线轨迹（串联全部路标的暖金虚线山径，已点亮区间化作明亮星轨）
  const trailGroup = new THREE.Group();
  const trailSegments = [];
  if (waypointObjs.length >= 2) {
    for (let i = 0; i < waypointObjs.length; i++) {
      const a = waypointObjs[i];
      const b = waypointObjs[(i + 1) % waypointObjs.length];
      const pts = [];
      const steps = 34;
      for (let s = 0; s <= steps; s++) {
        const dir = a.unitDir.clone().lerp(b.unitDir, s / steps).normalize();
        const r = getSurfaceRadius(id, dir) + 0.055;
        pts.push(dir.multiplyScalar(r));
      }
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const lineMat = new THREE.LineDashedMaterial({
        color: "#f3cf7a",
        dashSize: 0.24,
        gapSize: 0.2,
        transparent: true,
        opacity: 0.34,
      });
      const segLine = new THREE.Line(lineGeo, lineMat);
      segLine.computeLineDistances();
      trailGroup.add(segLine);
      trailSegments.push({ line: segLine, mat: lineMat, fromId: a.data.id, toId: b.data.id });
    }
    group.add(trailGroup);
  }

  // 9. 山野微气候奇遇（日照金山 · 蓝眼泪荧光海 · 麝香洞地心宇宙 & 牛倒岩地下暗瀑幽蓝萤光）
  const hasSnowPeaks =
    id === "yading" || id === "siguniang" || id === "zhagana" || id === "yili" ||
    id === "kitty-yading" || id === "kitty-wusun" || id === "kitty-zhagana" || id === "miemie-yading";
  const alpenglowLight = new THREE.PointLight("#ff6a2b", 0, 26, 1.4);
  alpenglowLight.position.set(6, PLANET_RADIUS + 6.5, 6);
  group.add(alpenglowLight);

  let cavernSporePts = null;
  let cavernGlowLight = null;
  if (id === "miemie-shexiang" || id === "miemie-tonggudang") {
    const isFullCave = id === "miemie-shexiang";
    const caveWp = waypointObjs.find((w) => w.data.id === "mm-tgd-3");
    const centerDir = caveWp ? caveWp.unitDir.clone() : new THREE.Vector3(0, 1, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: "#38bdf8",
      emissive: "#0284c7",
      emissiveIntensity: 0.95,
      roughness: 0.25,
      transparent: true,
      opacity: 0.88,
    });
    const caveCount = isFullCave ? 22 : 7;
    for (let i = 0; i < caveCount; i++) {
      const randDir = isFullCave
        ? new THREE.Vector3(Math.sin(i * 2.39), Math.cos(i * 1.71), Math.sin(i * 3.13)).normalize()
        : centerDir
            .clone()
            .add(new THREE.Vector3(Math.sin(i * 1.9) * 0.16, Math.cos(i * 2.3) * 0.16, Math.sin(i * 2.9) * 0.16))
            .normalize();
      if (!isFullCave && waypointObjs.some((w) => w.unitDir.angleTo(randDir) < 0.09)) continue;
      const sr = getSurfaceRadius(id, randDir);
      const spire = new THREE.Mesh(new THREE.ConeGeometry(0.11 + (i % 3) * 0.04, 0.52 + (i % 4) * 0.18, 6), crystalMat);
      spire.position.copy(randDir).multiplyScalar(sr + 0.18);
      spire.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), randDir);
      group.add(spire);
    }
    if (!isFullCave && caveWp) {
      // 牛倒岩溶洞拱门与发光幽蓝地心瀑布水幕
      const cDir = caveWp.unitDir.clone().add(new THREE.Vector3(0.09, 0.04, -0.08)).normalize();
      const cr = getSurfaceRadius(id, cDir);
      const archGrp = new THREE.Group();
      archGrp.position.copy(cDir).multiplyScalar(cr - 0.04);
      archGrp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), cDir);
      const archRock = new THREE.Mesh(
        new THREE.TorusGeometry(0.46, 0.14, 7, 14, Math.PI),
        new THREE.MeshStandardMaterial({ color: "#1e293b", roughness: 0.92 })
      );
      const fallMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.46, 0.72),
        new THREE.MeshBasicMaterial({ color: "#38bdf8", transparent: true, opacity: 0.72, side: THREE.DoubleSide })
      );
      fallMesh.position.set(0, 0.28, -0.04);
      const cavePt = new THREE.PointLight("#38bdf8", 2.2, 5.5, 1.5);
      cavePt.position.set(0, 0.42, 0.15);
      archGrp.add(archRock, fallMesh, cavePt);
      group.add(archGrp);
    }
    const spCount = isFullCave ? 240 : 75;
    const spArr = new Float32Array(spCount * 3);
    for (let i = 0; i < spCount; i++) {
      const d = isFullCave
        ? new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize()
        : centerDir
            .clone()
            .add(new THREE.Vector3((Math.random() - 0.5) * 0.42, (Math.random() - 0.5) * 0.42, (Math.random() - 0.5) * 0.42))
            .normalize();
      const pr = PLANET_RADIUS + 0.35 + Math.random() * (isFullCave ? 2.8 : 1.6);
      spArr[i * 3] = d.x * pr;
      spArr[i * 3 + 1] = d.y * pr;
      spArr[i * 3 + 2] = d.z * pr;
    }
    const spGeo = new THREE.BufferGeometry();
    spGeo.setAttribute("position", new THREE.BufferAttribute(spArr, 3));
    cavernSporePts = new THREE.Points(
      spGeo,
      new THREE.PointsMaterial({
        color: "#67e8f9",
        map: softDotTex,
        size: 0.24,
        transparent: true,
        opacity: 0.92,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    group.add(cavernSporePts);
    if (isFullCave) {
      cavernGlowLight = new THREE.PointLight("#0ea5e9", 3.4, 30, 1.2);
      cavernGlowLight.position.set(-4, PLANET_RADIUS + 5.5, 5);
      group.add(cavernGlowLight);
    }
  }
  let climateMode = "day";

  return {
    group,
    terrainMesh,
    waypointObjs,
    refreshTrailLoop(discoveredSet) {
      for (const seg of trailSegments) {
        const lit = discoveredSet.has(seg.fromId) && discoveredSet.has(seg.toId);
        seg.mat.color.set(lit ? "#ffe596" : "#e5c16c");
        seg.mat.opacity = lit ? 0.82 : 0.34;
        seg.mat.gapSize = lit ? 0.08 : 0.22;
        seg.mat.needsUpdate = true;
      }
    },
    setMicroclimate(skyPhase) {
      climateMode = skyPhase;
      if (hasSnowPeaks && skyPhase === "dusk") {
        alpenglowLight.intensity = 4.6;
        particles.material.color.set("#fff0df");
        particles.material.size = 0.31;
      } else {
        alpenglowLight.intensity = 0;
        particles.material.color.set(pal.particle || "#fff2c2");
        particles.material.size = 0.26;
      }
      if (waterMesh && (id === "maclehose" || id === "miemie-shexiang")) {
        if (skyPhase === "night" || id === "miemie-shexiang") {
          waterMesh.material.emissive.set(id === "miemie-shexiang" ? "#0284c7" : "#00aaff");
          waterMesh.material.emissiveIntensity = 0.55;
        } else {
          waterMesh.material.emissive.set("#000000");
          waterMesh.material.emissiveIntensity = 0;
        }
      }
    },
    update(dt, elapsed) {
      cloudsGroup.rotation.y += dt * 0.035;
      particles.rotation.y += dt * 0.07;
      particles.rotation.x = Math.sin(elapsed * 0.25) * 0.08;
      if (cavernSporePts) {
        cavernSporePts.rotation.y -= dt * 0.095;
        cavernSporePts.material.opacity = 0.72 + Math.sin(elapsed * 2.4) * 0.22;
      }
      if (cavernGlowLight) {
        cavernGlowLight.intensity = 3.0 + Math.sin(elapsed * 1.9) * 0.75;
      }

      if (waterMesh) {
        const s = 1 + Math.sin(elapsed * 1.8) * 0.0025;
        waterMesh.scale.setScalar(s);
        if (id === "maclehose" && climateMode === "night") {
          waterMesh.material.emissiveIntensity = 0.42 + Math.sin(elapsed * 2.6) * 0.22;
        }
      }

      for (const camp of animatedProps) {
        if (camp.userData.fire) {
          camp.userData.fire.scale.setScalar(0.88 + Math.sin(elapsed * 9) * 0.16);
          camp.userData.light.intensity = 2.0 + Math.sin(elapsed * 7.3) * 0.45;
        } else if (camp.userData.isDrone) {
          camp.position.copy(camp.userData.basePos).addScaledVector(
            camp.userData.basePos.clone().normalize(),
            Math.sin(elapsed * 3.2) * 0.14
          );
        } else if (camp.userData.windmillRotor) {
          camp.userData.windmillRotor.rotation.z += dt * 1.15;
        }
      }

      for (const wp of waypointObjs) {
        wp.crystal.rotation.y += dt * 1.4;
        wp.crystal.position.y = 0.68 + Math.sin(elapsed * 2.6 + wp.data.lat) * 0.07;
        const pulse = 0.92 + Math.sin(elapsed * 3.0) * 0.1;
        wp.ring.scale.setScalar(pulse);
      }
    },
  };
}

export function buildHikerCharacter() {
  // 复刻腾格里沙漠照造型：酒红冲锋衣 + 深灰宽檐渔夫帽 + 亮橙红镀膜大风镜 + 护脸面罩 + 双小辫女生 + 银灰蛋巢垫毛球重装包
  const root = new THREE.Group();
  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);

  const toon = (c) => new THREE.MeshToonMaterial({ color: c, gradientMap: STORYBOOK_GRAD });
  const jacketMat = toon("#be293e"); // 鲜亮勃艮第酒红硬壳冲锋衣
  const zipMat = toon("#27272a"); // 防水主拉链撞色条
  const pantsMat = toon("#2c3240");
  const bootMat = toon("#4a3728"); // 户外厚底登山靴
  const soleMat = toon("#18181b"); // Vibram 防滑深色大底
  const strapMat = toon("#1f2430"); // 背包双肩背带
  const maskMat = toon("#dfe3ea");
  const skinMat = toon("#fde4cf");
  const hairMat = toon("#1b191a");
  const hatMat = toon("#30343f");
  const packMat = toon("#717885");
  const padMat = toon("#c4cbd6");
  const visorMat = new THREE.MeshStandardMaterial({
    color: "#ff551a",
    emissive: "#ff6a1a",
    emissiveIntensity: 0.5,
    roughness: 0.16,
    metalness: 0.72,
  });

  // 双腿 + 双色厚底户外登山靴 + 可选高山雪套
  const gaiterMat = toon("#2563eb");
  function makeLegBoot(side) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.054, 0.048, 0.24, 10), pantsMat);
    leg.position.set(side * 0.076, 0.16, 0);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.075, 0.14), bootMat);
    boot.position.set(0, -0.11, 0.02);
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.102, 0.026, 0.15), soleMat);
    sole.position.set(0, -0.148, 0.02);
    const gaiter = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.054, 0.14, 10), gaiterMat);
    gaiter.position.y = -0.03;
    gaiter.visible = false;
    leg.add(boot, sole, gaiter);
    bodyPivot.add(leg);
    return { leg, gaiter };
  }
  const { leg: leftLeg, gaiter: leftGaiter } = makeLegBoot(-1);
  const { leg: rightLeg, gaiter: rightGaiter } = makeLegBoot(1);

  // 立体剪裁冲锋衣（收腰上身 + 微扩防风下摆 + 立领风帽 + 防水拉链 + 双肩背带与橙色救生哨胸扣）
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.17, 0.28, 14), jacketMat);
  chest.position.y = 0.49;
  const hemSkirt = new THREE.Mesh(new THREE.CylinderGeometry(0.168, 0.215, 0.16, 14), jacketMat);
  hemSkirt.position.y = 0.29;
  const hoodCollar = new THREE.Mesh(new THREE.TorusGeometry(0.118, 0.04, 8, 18), jacketMat);
  hoodCollar.rotation.x = Math.PI / 2;
  hoodCollar.position.y = 0.63;
  const frontZip = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.39, 0.02), zipMat);
  frontZip.position.set(0, 0.42, 0.165);
  frontZip.rotation.x = -0.15;

  const strapL = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.28, 0.18), strapMat);
  strapL.position.set(-0.085, 0.5, -0.01);
  const strapR = strapL.clone();
  strapR.position.x = 0.085;
  const chestBuckle = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.022, 0.02),
    new THREE.MeshBasicMaterial({ color: "#f97316" })
  );
  chestBuckle.position.set(0, 0.51, 0.152);
  bodyPivot.add(chest, hemSkirt, hoodCollar, frontZip, strapL, strapR, chestBuckle);

  // 60L 重装大包 + 侧面银灰折叠蛋巢防潮垫 + 毛球挂件 + 平安进山小红牌（收纳于 packGroup，围炉时可整体卸放身旁！）
  const packGroup = new THREE.Group();
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.34, 0.17), packMat);
  pack.position.set(0, 0.47, -0.145);
  const eggPad = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.32, 0.13), padMat);
  eggPad.position.set(-0.14, 0.46, -0.145);
  const pomPom = new THREE.Mesh(
    new THREE.SphereGeometry(0.048, 10, 8),
    new THREE.MeshStandardMaterial({ color: "#9e826c", roughness: 1.0 })
  );
  pomPom.position.set(-0.18, 0.38, -0.18);
  const redCharm = new THREE.Mesh(
    new THREE.BoxGeometry(0.035, 0.07, 0.012),
    new THREE.MeshBasicMaterial({ color: "#e62e2e" })
  );
  redCharm.position.set(0.13, 0.42, -0.22);
  const duckCharm = new THREE.Group();
  const duckBody = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), toon("#ffd426"));
  const duckBeak = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.016, 0.03), new THREE.MeshBasicMaterial({ color: "#f97316" }));
  duckBeak.position.set(0, 0, -0.05);
  duckCharm.add(duckBody, duckBeak);
  duckCharm.position.set(0.12, 0.54, -0.22);
  duckCharm.visible = false;
  packGroup.add(pack, eggPad, pomPom, redCharm, duckCharm);
  root.add(packGroup);

  // 围炉歇脚时的营地圆木坐桩 + 卸下斜靠在背包旁的交叉双登山杖
  const sitLog = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.115, 0.44, 10),
    new THREE.MeshStandardMaterial({ color: "#6b442a", roughness: 0.88 })
  );
  sitLog.rotation.z = Math.PI / 2;
  sitLog.position.set(0, 0.095, -0.04);
  sitLog.visible = false;
  root.add(sitLog);

  const restingPoles = new THREE.Group();
  const restPoleMat = new THREE.MeshStandardMaterial({ color: "#e5ecf5", metalness: 0.55 });
  const rp1 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.01, 0.58, 6), restPoleMat);
  rp1.rotation.set(0.32, 0, -0.22);
  const rp2 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.01, 0.58, 6), restPoleMat);
  rp2.rotation.set(0.28, 0, 0.18);
  restingPoles.add(rp1, rp2);
  restingPoles.position.set(-0.46, 0.24, -0.02);
  restingPoles.visible = false;
  root.add(restingPoles);

  // 头部 + 饱满深色发顶（彻底杜绝任何角度露头皮）+ 防晒护脸面罩 + 镀膜护目镜
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 14), skinMat);
  head.position.y = 0.74;
  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.146, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62),
    hairMat
  );
  hairCap.position.set(0, 0.75, -0.012);
  hairCap.rotation.x = -0.18;
  const faceMask = new THREE.Mesh(
    new THREE.CylinderGeometry(0.135, 0.125, 0.12, 14),
    maskMat
  );
  faceMask.position.set(0, 0.69, 0.015);
  const gogglesFrame = new THREE.Mesh(new THREE.BoxGeometry(0.224, 0.084, 0.075), soleMat);
  gogglesFrame.position.set(0, 0.755, 0.11);
  const goggles = new THREE.Mesh(new THREE.BoxGeometry(0.208, 0.068, 0.082), visorMat);
  goggles.position.set(0, 0.755, 0.115);
  const blushMat = new THREE.MeshBasicMaterial({ color: "#f48fb1" });
  const blushL = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 6), blushMat);
  blushL.position.set(-0.085, 0.71, 0.115);
  const blushR = blushL.clone();
  blushR.position.x = 0.085;
  bodyPivot.add(head, hairCap, blushL, blushR, faceMask, gogglesFrame, goggles);

  // 深炭灰大宽檐户外防晒渔夫帽 vs 温暖针织冷帽 (Beanie)
  const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.025, 20), hatMat);
  hatBrim.position.y = 0.825;
  const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.155, 0.11, 16), hatMat);
  hatCrown.position.y = 0.885;
  bodyPivot.add(hatBrim, hatCrown);

  // 🐶 清爽绘本风针织冷帽 + 元气修勾软垂耳 / 猫耳 / 绵羊耳
  const beanieMat = toon("#fffbeb");
  const beanieCuffMat = toon("#fde68a");
  const puppyEarMat = toon("#c26a27");
  const puppyInnerMat = toon("#fed7aa");
  const bonePinMat = toon("#ffffff");

  const beanieGroup = new THREE.Group();
  const beanieDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.154, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.58),
    beanieMat
  );
  beanieDome.position.y = 0.79;

  const beanieCuff = new THREE.Mesh(new THREE.TorusGeometry(0.144, 0.03, 10, 22), beanieCuffMat);
  beanieCuff.rotation.x = Math.PI / 2;
  beanieCuff.position.y = 0.806;

  // 🐶 清哥专属：软萌微折小狗垂耳 (Floppy Puppy Ears) + 柴犬豆豆眉 + 迷你小骨头胸针
  const puppyEarsGroup = new THREE.Group();
  function makePuppyEar(side) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.126, 0.895, 0.012);
    pivot.rotation.set(0.14, side * 0.22, -side * 0.34);

    // 耳根柔和折角隆起
    const earRoot = new THREE.Mesh(new THREE.SphereGeometry(0.034, 10, 8), puppyEarMat);
    earRoot.scale.set(1.05, 0.72, 0.85);
    earRoot.position.set(side * 0.012, 0.006, 0);

    // 圆润水滴状软垂狗耳瓣（前后双面可见，跑图背影也能一眼看到两只软乎乎垂耳！）
    const earFlap = new THREE.Mesh(new THREE.SphereGeometry(0.052, 12, 10), puppyEarMat);
    earFlap.scale.set(0.84, 1.58, 0.38);
    earFlap.position.set(side * 0.036, -0.068, 0.008);
    earFlap.rotation.z = side * 0.18;

    const earInner = new THREE.Mesh(new THREE.SphereGeometry(0.033, 10, 8), puppyInnerMat);
    earInner.scale.set(0.75, 1.28, 0.28);
    earInner.position.set(side * 0.034, -0.07, 0.021);
    earInner.rotation.z = side * 0.18;

    pivot.add(earRoot, earFlap, earInner);
    puppyEarsGroup.add(pivot);
    return pivot;
  }
  const leftPuppyEar = makePuppyEar(-1);
  const rightPuppyEar = makePuppyEar(1);

  // 呆萌柴犬豆豆眉（帽身正上方两颗圆糯奶豆点）
  const puppyBrowMat = toon("#fffbeb");
  [-1, 1].forEach((s) => {
    const browBean = new THREE.Mesh(new THREE.SphereGeometry(0.017, 8, 7), puppyBrowMat);
    browBean.scale.set(1.25, 0.88, 0.65);
    browBean.position.set(s * 0.046, 0.868, 0.138);
    browBean.rotation.set(-0.25, s * 0.22, -s * 0.2);
    puppyEarsGroup.add(browBean);
  });

  // 帽檐右侧迷你立体 🦴 小骨头别针
  const boneBadge = new THREE.Group();
  boneBadge.position.set(0.072, 0.808, 0.158);
  boneBadge.rotation.set(0, 0.42, -0.18);
  const boneShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.034, 6), bonePinMat);
  boneShaft.rotation.z = Math.PI / 2;
  boneBadge.add(boneShaft);
  [[-0.018, 0.006], [-0.018, -0.006], [0.018, 0.006], [0.018, -0.006]].forEach(([bx, by]) => {
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.0085, 6, 6), bonePinMat);
    knob.position.set(bx, by, 0);
    boneBadge.add(knob);
  });
  puppyEarsGroup.add(boneBadge);
  // Kitty 专属超萌立体小猫耳针织帽装饰
  const catEarsGroup = new THREE.Group();
  const innerEarMat = toon("#f9a8d4");
  [-1, 1].forEach((s) => {
    const earOuter = new THREE.Mesh(new THREE.ConeGeometry(0.056, 0.1, 4), beanieMat);
    earOuter.position.set(s * 0.1, 0.925, 0.01);
    earOuter.rotation.set(0.08, s * 0.35, -s * 0.36);
    const earInner = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.062, 4), innerEarMat);
    earInner.position.set(s * 0.098, 0.922, 0.032);
    earInner.rotation.set(0.08, s * 0.35, -s * 0.36);
    catEarsGroup.add(earOuter, earInner);
  });
  catEarsGroup.visible = false;
  // 咩咩专属超萌立体小绵羊弯角+奶白蓬松垂耳针织帽装饰
  const sheepEarsGroup = new THREE.Group();
  const hornMat = toon("#fde68a");
  const sheepFluffMat = toon("#fffbeb");
  [-1, 1].forEach((s) => {
    const horn = new THREE.Mesh(new THREE.TorusGeometry(0.044, 0.016, 7, 14, Math.PI * 1.35), hornMat);
    horn.position.set(s * 0.118, 0.895, 0.015);
    horn.rotation.set(0.25, s * 0.55, s * 0.6);
    const earFluff = new THREE.Mesh(new THREE.SphereGeometry(0.034, 8, 7), sheepFluffMat);
    earFluff.scale.set(1.3, 0.68, 0.85);
    earFluff.position.set(s * 0.145, 0.84, 0.01);
    earFluff.rotation.z = -s * 0.35;
    sheepEarsGroup.add(horn, earFluff);
  });
  sheepEarsGroup.visible = false;
  beanieGroup.add(beanieDome, beanieCuff, puppyEarsGroup, catEarsGroup, sheepEarsGroup);
  beanieGroup.visible = false;
  bodyPivot.add(beanieGroup);

  // 左右两条灵动俏皮的小辫子（双麻花辫，随步伐轻盈晃动！）
  function makeBraid(side) {
    const braidPivot = new THREE.Group();
    braidPivot.position.set(side * 0.135, 0.73, -0.03);
    for (let b = 0; b < 4; b++) {
      const bead = new THREE.Mesh(
        new THREE.SphereGeometry(0.036 - b * 0.004, 8, 8),
        hairMat
      );
      bead.scale.set(0.9, 1.25, 0.9);
      bead.position.set(side * b * 0.018, -b * 0.058, -b * 0.015);
      braidPivot.add(bead);
    }
    const tie = new THREE.Mesh(
      new THREE.TorusGeometry(0.022, 0.008, 6, 10),
      new THREE.MeshBasicMaterial({ color: "#f5c451" })
    );
    tie.rotation.x = Math.PI / 2;
    tie.position.set(side * 0.054, -0.175, -0.045);
    braidPivot.add(tie);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.026, 0.07, 7), hairMat);
    tip.rotation.x = Math.PI;
    tip.position.set(side * 0.062, -0.215, -0.055);
    braidPivot.add(tip);
    bodyPivot.add(braidPivot);
    return braidPivot;
  }
  const leftBraid = makeBraid(-1);
  const rightBraid = makeBraid(1);

  // 户外头灯（星夜模式亮起照亮前路）
  const lampLens = new THREE.Mesh(
    new THREE.SphereGeometry(0.036, 8, 8),
    new THREE.MeshBasicMaterial({ color: "#fff5cc" })
  );
  lampLens.position.set(0, 0.88, 0.15);
  bodyPivot.add(lampLens);

  const headLight = new THREE.SpotLight("#ffefc2", 0, 10, Math.PI / 3.8, 0.55, 1.1);
  headLight.position.set(0, 0.9, 0.17);
  headLight.target.position.set(0, 0.1, 3.0);
  bodyPivot.add(headLight, headLight.target);
  lampLens.visible = false;

  // 左右酒红袖子 + 深灰手套 + 双登山杖
  function makeArmPole(side) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.185, 0.56, 0);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.038, 0.22, 8), jacketMat);
    arm.position.set(0, -0.09, 0.04);
    arm.rotation.x = -0.35;
    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 8), hatMat);
    glove.position.set(0, -0.19, 0.08);
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.01, 0.62, 6),
      new THREE.MeshStandardMaterial({ color: "#e5ecf5", metalness: 0.55 })
    );
    pole.position.set(0, -0.26, 0.14);
    pole.rotation.x = 0.18;
    pivot.add(arm, glove, pole);
    bodyPivot.add(pivot);
    return { pivot, pole };
  }
  const { pivot: leftArm, pole: leftPole } = makeArmPole(-1);
  const { pivot: rightArm, pole: rightPole } = makeArmPole(1);

  const OUTFITS = {
    "mine-host": {
      jacket: "#be293e", zip: "#fde68a", pants: "#2c3240", pack: "#275248", visor: "#ff551a",
      hatType: "beanie", hatColor: "#f5b829", cuffColor: "#e6a81c", earColor: "#a85518", browColor: "#fffbeb",
      mask: false, heavyGear: true, gaiter: null, duck: false,
    },
    tengger: {
      jacket: "#be293e", zip: "#27272a", pants: "#2c3240", pack: "#717885", visor: "#ff551a",
      hatType: "wide", hatColor: "#30343f", mask: true, heavyGear: true, gaiter: null, duck: false,
    },
    yading: {
      jacket: "#0fa8a0", zip: "#e2f1ef", pants: "#e5dfd5", pack: "#275248", visor: "#d946ef",
      hatType: "beanie", hatColor: "#f5b829", cuffColor: "#e6a81c", earColor: "#a85518", browColor: "#fffbeb",
      mask: false, heavyGear: true, gaiter: null, duck: false,
    },
    zhagana: {
      jacket: "#70386b", zip: "#f0abfc", pants: "#283044", pack: "#1cb5e8", visor: "#38bdf8",
      hatType: "beanie", hatColor: "#465a8c", cuffColor: "#3a4c78", earColor: "#273554", browColor: "#f1f5f9",
      mask: true, heavyGear: true, gaiter: "#84cc16", duck: false,
    },
    siguniang: {
      jacket: "#7ddbb0", zip: "#134e4a", pants: "#323846", pack: "#f97316", visor: "#f59e0b",
      hatType: "beanie", hatColor: "#f5efe6", cuffColor: "#eae0d2", earColor: "#9a6338", browColor: "#b47b4e",
      mask: true, heavyGear: true, gaiter: "#2563eb", duck: false,
    },
    maclehose: {
      jacket: "#e12d6c", zip: "#ffe4e6", pants: "#8b78b5", pack: "#d4d9e2", visor: "#ff7a1a",
      hatType: "bucket", hatColor: "#f5efe4", mask: false, heavyGear: false, gaiter: null, duck: false,
    },
    yili: {
      jacket: "#5b346e", zip: "#e9d5ff", pants: "#f6f0e4", pack: "#2e323d", visor: "#60a5fa",
      hatType: "beanie", hatColor: "#f7f2e8", cuffColor: "#ede5d6", earColor: "#c27832", browColor: "#d9914b",
      mask: false, heavyGear: false, gaiter: null, duck: true,
    },
    "kitty-host": {
      jacket: "#f472b6", zip: "#fdf2f8", pants: "#f8fafc", pack: "#7dd3fc", visor: "#38bdf8",
      hatType: "beanie", hatColor: "#fff5f7", mask: false, heavyGear: false, gaiter: null, duck: false, catEars: true,
    },
    "kitty-xiaowutai": {
      jacket: "#34d399", zip: "#ecfdf5", pants: "#334155", pack: "#f472b6", visor: "#facc15",
      hatType: "beanie", hatColor: "#fff1f2", mask: false, heavyGear: false, gaiter: null, duck: false, catEars: true,
    },
    "kitty-changbai": {
      jacket: "#38bdf8", zip: "#f0f9ff", pants: "#334155", pack: "#f472b6", visor: "#fb7185",
      hatType: "beanie", hatColor: "#fff1f2", mask: false, heavyGear: false, gaiter: null, duck: false, catEars: true,
    },
    "kitty-sunset": {
      jacket: "#fb923c", zip: "#fff7ed", pants: "#1e293b", pack: "#a78bfa", visor: "#f472b6",
      hatType: "bucket", hatColor: "#fef3c7", mask: false, heavyGear: false, gaiter: null, duck: false,
    },
    "kitty-zhagana": {
      jacket: "#2dd4bf", zip: "#f0fdfa", pants: "#27272a", pack: "#f59e0b", visor: "#38bdf8",
      hatType: "beanie", hatColor: "#fef08a", mask: false, heavyGear: true, gaiter: "#38bdf8", duck: false, catEars: true,
    },
    "kitty-daqing": {
      jacket: "#a3e635", zip: "#f7fee7", pants: "#f5f5f4", pack: "#fb923c", visor: "#fbbf24",
      hatType: "bucket", hatColor: "#fafaf9", mask: false, heavyGear: false, gaiter: null, duck: true,
    },
    "kitty-wusun": {
      jacket: "#818cf8", zip: "#eef2ff", pants: "#1f2937", pack: "#f43f5e", visor: "#fb923c",
      hatType: "beanie", hatColor: "#fdf4ff", mask: true, heavyGear: true, gaiter: "#6366f1", duck: false, catEars: true,
    },
    "kitty-yading": {
      jacket: "#f472b6", zip: "#fdf2f8", pants: "#f1f5f9", pack: "#2dd4bf", visor: "#facc15",
      hatType: "beanie", hatColor: "#ffffff", mask: false, heavyGear: true, gaiter: null, duck: false, catEars: true,
    },
    "miemie-host": {
      jacket: "#34d399", zip: "#ecfdf5", pants: "#f8fafc", pack: "#fbbf24", visor: "#fde047",
      hatType: "beanie", hatColor: "#fffbeb", mask: false, heavyGear: true, gaiter: "#10b981", duck: true, sheepEars: true,
    },
    "miemie-tonggudang": {
      jacket: "#34d399", zip: "#ecfdf5", pants: "#334155", pack: "#fbbf24", visor: "#38bdf8",
      hatType: "beanie", hatColor: "#fffbeb", mask: false, heavyGear: false, gaiter: null, duck: true, sheepEars: true,
    },
    "miemie-longji": {
      jacket: "#84cc16", zip: "#f7fee7", pants: "#1e293b", pack: "#f59e0b", visor: "#2dd4bf",
      hatType: "beanie", hatColor: "#fefce8", mask: false, heavyGear: false, gaiter: null, duck: false, sheepEars: true,
    },
    "miemie-shexiang": {
      jacket: "#38bdf8", zip: "#e0f2fe", pants: "#0f172a", pack: "#facc15", visor: "#7dd3fc",
      hatType: "beanie", hatColor: "#f8fafc", mask: false, heavyGear: true, gaiter: "#0284c7", duck: false, sheepEars: true,
    },
    "miemie-buyi": {
      jacket: "#f59e0b", zip: "#fffbeb", pants: "#f5f5f4", pack: "#14b8a6", visor: "#fbbf24",
      hatType: "bucket", hatColor: "#fef3c7", mask: false, heavyGear: false, gaiter: null, duck: true,
    },
    "miemie-yading": {
      jacket: "#2dd4bf", zip: "#f0fdfa", pants: "#1e293b", pack: "#f43f5e", visor: "#fde047",
      hatType: "beanie", hatColor: "#fffbeb", mask: false, heavyGear: true, gaiter: "#38bdf8", duck: false, sheepEars: true,
    },
  };

  let currentOutfitId = "tengger";

  function setOutfit(planetId = "tengger") {
    const cfg = OUTFITS[planetId] || OUTFITS.tengger;
    currentOutfitId = OUTFITS[planetId] ? planetId : "tengger";
    jacketMat.color.set(cfg.jacket);
    zipMat.color.set(cfg.zip || "#27272a");
    pantsMat.color.set(cfg.pants);
    packMat.color.set(cfg.pack);
    visorMat.color.set(cfg.visor);
    visorMat.emissive.set(cfg.visor);

    const isBrimmed = cfg.hatType === "wide" || cfg.hatType === "bucket";
    hatBrim.visible = isBrimmed;
    hatCrown.visible = isBrimmed;
    const brimScale = cfg.hatType === "bucket" ? 0.76 : 1.0;
    hatBrim.scale.set(brimScale, 1, brimScale);
    beanieGroup.visible = cfg.hatType === "beanie";
    const isPuppyStyle = !cfg.catEars && !cfg.sheepEars;
    puppyEarsGroup.visible = isPuppyStyle;
    catEarsGroup.visible = Boolean(cfg.catEars);
    sheepEarsGroup.visible = Boolean(cfg.sheepEars);
    if (isBrimmed) hatMat.color.set(cfg.hatColor);
    if (cfg.hatType === "beanie") {
      beanieMat.color.set(cfg.hatColor);
      beanieCuffMat.color.set(cfg.cuffColor || cfg.hatColor);
      if (isPuppyStyle) {
        puppyEarMat.color.set(cfg.earColor || "#a85518");
        puppyBrowMat.color.set(cfg.browColor || "#fffbeb");
        const isLightHat = planetId === "siguniang" || planetId === "yili";
        bonePinMat.color.set(isLightHat ? "#fbbf24" : "#ffffff");
      }
    }

    faceMask.visible = cfg.mask;
    goggles.visible = true;
    eggPad.visible = cfg.heavyGear;
    pomPom.visible = cfg.heavyGear;
    pack.scale.set(1, cfg.heavyGear ? 1 : 0.78, cfg.heavyGear ? 1 : 0.8);
    duckCharm.visible = Boolean(cfg.duck);

    if (cfg.gaiter) {
      gaiterMat.color.set(cfg.gaiter);
      leftGaiter.visible = true;
      rightGaiter.visible = true;
    } else {
      leftGaiter.visible = false;
      rightGaiter.visible = false;
    }
  }

  let isSitting = false;
  let outfitHasMask = true;

  const origSetOutfit = setOutfit;
  function applyOutfitAndSync(planetId = "tengger") {
    origSetOutfit(planetId);
    outfitHasMask = Boolean((OUTFITS[currentOutfitId] || OUTFITS.tengger).mask);
    if (isSitting) {
      faceMask.visible = false;
    }
  }

  let waveTimer = 0;
  let emoteType = null;
  let emoteTimer = 0;

  return {
    root,
    get outfit() { return currentOutfitId; },
    setOutfit: applyOutfitAndSync,
    triggerWave() {
      waveTimer = 1.8;
    },
    triggerEmote(type = "cheer", duration = 2.6) {
      if (isSitting && type !== "sit") this.setSitting(false);
      emoteType = type;
      emoteTimer = duration;
      if (type === "wave") waveTimer = duration;
    },
    poseWaveSnapshot() {
      if (isSitting) this.setSitting(false);
      bodyPivot.position.y = 0.04;
      bodyPivot.rotation.set(0, 0, 0);
      leftLeg.rotation.x = 0.08;
      rightLeg.rotation.x = -0.08;
      leftArm.rotation.set(-0.45, 0, 0.22);
      rightArm.rotation.set(-2.55, 0, -0.42);
    },
    setSitting(on) {
      isSitting = Boolean(on);
      sitLog.visible = isSitting;
      restingPoles.visible = isSitting;
      leftPole.visible = !isSitting;
      rightPole.visible = !isSitting;
      strapL.visible = !isSitting;
      strapR.visible = !isSitting;
      chestBuckle.visible = !isSitting;

      if (isSitting) {
        // 卸下重装大包斜靠在身旁左侧营地草皮上
        packGroup.position.set(-0.36, -0.22, -0.02);
        packGroup.rotation.set(0.24, 0.55, 0.14);
        // 拉下防晒面罩，将镀膜大风镜轻松推上额头帽檐
        faceMask.visible = false;
        gogglesFrame.position.set(0, 0.805, 0.115);
        gogglesFrame.rotation.x = -0.28;
        goggles.position.set(0, 0.805, 0.12);
        goggles.rotation.x = -0.28;
      } else {
        packGroup.position.set(0, 0, 0);
        packGroup.rotation.set(0, 0, 0);
        faceMask.visible = outfitHasMask;
        gogglesFrame.position.set(0, 0.755, 0.11);
        gogglesFrame.rotation.x = 0;
        goggles.position.set(0, 0.755, 0.115);
        goggles.rotation.x = 0;
        leftArm.rotation.z = 0;
        rightArm.rotation.z = 0;
        bodyPivot.position.y = 0;
        bodyPivot.rotation.x = 0;
      }
    },
    setHeadlamp(on) {
      lampLens.visible = Boolean(on);
      headLight.intensity = on ? 4.6 : 0;
    },
    update(dt, elapsed, speedRatio = 0) {
      if (isSitting) {
        // 坐在营地圆木桩上，卸包伸手向篝火取暖、轻晃双脚与辫子
        bodyPivot.position.y = -0.09;
        bodyPivot.rotation.x = 0.05;
        leftLeg.rotation.x = -1.24 + Math.sin(elapsed * 2.2) * 0.07;
        rightLeg.rotation.x = -1.24 - Math.sin(elapsed * 2.2) * 0.07;
        leftArm.rotation.x = -0.76 + Math.sin(elapsed * 2.8) * 0.05;
        rightArm.rotation.x = -0.76 - Math.sin(elapsed * 2.8) * 0.05;
        leftArm.rotation.z = 0.18;
        rightArm.rotation.z = -0.18;
        leftBraid.rotation.z = -0.2 + Math.sin(elapsed * 2.4) * 0.06;
        rightBraid.rotation.z = 0.2 + Math.cos(elapsed * 2.4) * 0.06;
        return;
      }
      const s = THREE.MathUtils.clamp(speedRatio, 0, 1.8);
      if (emoteTimer > 0) {
        emoteTimer = Math.max(0, emoteTimer - dt);
        if (emoteType === "cheer") {
          const hop = Math.abs(Math.sin(elapsed * 9.5));
          bodyPivot.position.y = hop * 0.24;
          bodyPivot.rotation.y = 0;
          leftArm.rotation.x = -2.65 + Math.sin(elapsed * 12) * 0.2;
          rightArm.rotation.x = -2.65 - Math.sin(elapsed * 12) * 0.2;
          leftArm.rotation.z = 0.36;
          rightArm.rotation.z = -0.36;
          leftLeg.rotation.x = hop * 0.35;
          rightLeg.rotation.x = -hop * 0.25;
          if (puppyEarsGroup.visible) {
            leftPuppyEar.rotation.z = 0.34 + hop * 0.42;
            rightPuppyEar.rotation.z = -0.34 - hop * 0.42;
          }
          packGroup.position.y = bodyPivot.position.y;
          return;
        } else if (emoteType === "spin") {
          bodyPivot.position.y = 0.08 + Math.abs(Math.sin(elapsed * 8)) * 0.08;
          bodyPivot.rotation.y += dt * 7.2;
          leftArm.rotation.x = -1.35;
          rightArm.rotation.x = -1.35;
          leftArm.rotation.z = 0.85;
          rightArm.rotation.z = -0.85;
          packGroup.position.y = bodyPivot.position.y;
          packGroup.rotation.y = bodyPivot.rotation.y;
          return;
        }
      } else if (bodyPivot.rotation.y !== 0) {
        bodyPivot.rotation.y = 0;
        packGroup.rotation.y = 0;
        leftArm.rotation.z = 0;
      }

      const walkPhase = elapsed * (7.5 + s * 3.5);
      const swing = Math.sin(walkPhase) * 0.55 * Math.min(1, s);

      leftLeg.rotation.x = swing;
      rightLeg.rotation.x = -swing;
      leftArm.rotation.x = -swing * 0.85;
      if (waveTimer > 0) {
        waveTimer = Math.max(0, waveTimer - dt);
        rightArm.rotation.x = -2.45;
        rightArm.rotation.z = -0.35 + Math.sin(elapsed * 14) * 0.32;
      } else {
        rightArm.rotation.x = swing * 0.85;
        rightArm.rotation.z = 0;
      }

      bodyPivot.position.y = Math.abs(Math.sin(walkPhase)) * 0.045 * Math.min(1, s);
      bodyPivot.rotation.x = s * 0.08;
      packGroup.position.y = bodyPivot.position.y;
      packGroup.rotation.x = bodyPivot.rotation.x;

      // 双小辫与元气小狗软垂耳随微风与步伐一颠一颠扑扇
      const braidBounce = Math.sin(walkPhase * 2) * (0.06 + s * 0.18);
      const breeze = Math.sin(elapsed * 3.4) * 0.08;
      if (puppyEarsGroup.visible) {
        const flap = Math.abs(Math.sin(walkPhase * 2)) * (0.06 + s * 0.26) + Math.sin(elapsed * 2.8) * 0.035;
        leftPuppyEar.rotation.z = 0.34 + flap;
        rightPuppyEar.rotation.z = -0.34 - flap;
      }
      leftBraid.rotation.z = -0.18 - Math.abs(braidBounce) * 0.5 + breeze * 0.4;
      rightBraid.rotation.z = 0.18 + Math.abs(braidBounce) * 0.5 + breeze * 0.4;
      leftBraid.rotation.x = -0.12 - s * 0.25 + Math.cos(elapsed * 4.1) * 0.06;
      rightBraid.rotation.x = -0.12 - s * 0.25 + Math.sin(elapsed * 4.1) * 0.06;
    },
  };
}
