// ============================================================================
// 《行者的星球 · 山海皆星辰》总扉页全景 3D 星海场景（v5.3.3 · 无框天幕 + 精细山海微缩生态）
// 视觉语言：
// 1. 天幕分景：正中央黄金视野 100% 让给 3D 全景星海——中央缓缓旋转的「古典鎏金星盘未知星系」
//    与错落环绕的 4 颗精细微缩真实徒步星球交相辉映，手机端与桌面端零遮挡。
// 2. 精细微缩生态：4 颗已点亮山海星球不仅拥有 getSurfaceRadius() 真实等高地形，更精雕了
//    五彩经幡、云海浮云、蜿蜒石板山径、暖光篝火帐篷、沙漠绿洲胡杨、果子沟斜拉桥、海角灯塔与小帆船！
// 3. 底端高山山脊观星台：冷杉松林、高山杜鹃花丛、玛尼石堆与跳动的暖光篝火帐篷、小王子玻璃罩玫瑰。
// 4. 全景交互：支持鼠标轻微视差与射线拾取——悬停/点击未知星系唤起护照创世，点击已点亮星球直飞体验！
// ============================================================================

import * as THREE from "three";
import { PLANET_RADIUS, STORYBOOK_GRAD, getSurfaceRadius, seededRand } from "./sphereMath.js?v=5.3.3-panoramic-shanhai";

const UP = new THREE.Vector3(0, 1, 0);

function latLonVec(latDeg, lonDeg) {
  const phi = THREE.MathUtils.degToRad(90 - latDeg);
  const theta = THREE.MathUtils.degToRad(lonDeg);
  return new THREE.Vector3(
    Math.sin(phi) * Math.cos(theta),
    Math.cos(phi),
    Math.sin(phi) * Math.sin(theta)
  ).normalize();
}

function createAstrolabeNebulaTexture(hexInner, hexOuter) {
  const cv = document.createElement("canvas");
  cv.width = 256;
  cv.height = 256;
  const ctx = cv.getContext("2d");
  const g = ctx.createRadialGradient(128, 128, 8, 128, 128, 124);
  g.addColorStop(0, `${hexInner}36`);
  g.addColorStop(0.45, `${hexOuter}18`);
  g.addColorStop(1, "rgba(10, 18, 40, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createUnchartedAstrolabeDisc(armHex = "#7898c8") {
  const cv = document.createElement("canvas");
  cv.width = 512;
  cv.height = 512;
  const ctx = cv.getContext("2d");
  const cx = 256;
  const cy = 256;

  const coreGrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, 240);
  coreGrad.addColorStop(0, "rgba(255, 242, 204, 0.72)");
  coreGrad.addColorStop(0.2, "rgba(240, 199, 104, 0.28)");
  coreGrad.addColorStop(0.55, "rgba(68, 98, 156, 0.14)");
  coreGrad.addColorStop(1, "rgba(10, 18, 40, 0)");
  ctx.fillStyle = coreGrad;
  ctx.fillRect(0, 0, 512, 512);

  // 古典鎏金星轨虚线环 + 精细天球经纬线
  [54, 102, 154, 206].forEach((r, idx) => {
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash(idx % 2 === 0 ? [9, 8] : [3, 9]);
    ctx.strokeStyle = `rgba(240, 199, 104, ${0.46 - idx * 0.08})`;
    ctx.lineWidth = idx === 0 ? 1.7 : 1.25;
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });

  // 36 道古星盘精密刻度
  ctx.save();
  ctx.strokeStyle = "rgba(240, 199, 104, 0.34)";
  ctx.lineWidth = 1.1;
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    const r0 = i % 3 === 0 ? 146 : 150;
    const r1 = i % 3 === 0 ? 162 : 158;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.stroke();
  }
  ctx.restore();

  // 双旋臂细腻银金星尘粒子流
  for (let arm = 0; arm < 2; arm++) {
    const base = arm * Math.PI;
    for (let s = 0; s < 140; s++) {
      const t = s / 140;
      const a = base + t * Math.PI * 2.45;
      const rad = 16 + t * 208;
      const px = cx + Math.cos(a) * rad + Math.sin(s * 1.9) * 6;
      const py = cy + Math.sin(a) * rad + Math.cos(s * 1.6) * 6;
      const pr = (1 - t * 0.52) * (s % 6 === 0 ? 3.2 : 1.75);
      ctx.beginPath();
      ctx.fillStyle = s % 4 === 0 ? "#ffeab3" : armHex;
      ctx.globalAlpha = (1 - t * 0.72) * 0.7;
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createClassicalStarChartLabel(title, subtitle) {
  const cv = document.createElement("canvas");
  cv.width = 512;
  cv.height = 136;
  const ctx = cv.getContext("2d");

  const bg = ctx.createRadialGradient(256, 68, 12, 256, 68, 236);
  bg.addColorStop(0, "rgba(10, 18, 40, 0.74)");
  bg.addColorStop(0.75, "rgba(10, 18, 40, 0.32)");
  bg.addColorStop(1, "rgba(10, 18, 40, 0)");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 136);

  ctx.strokeStyle = "rgba(240, 199, 104, 0.56)";
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(96, 20);
  ctx.lineTo(416, 20);
  ctx.moveTo(126, 116);
  ctx.lineTo(386, 116);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#f7e3a8";
  ctx.font = '600 26px "Kaiti SC", "Songti SC", "STKaiti", Georgia, serif';
  ctx.fillText(title, 256, subtitle ? 52 : 68);

  if (subtitle) {
    ctx.fillStyle = "rgba(216, 228, 248, 0.9)";
    ctx.font = '500 17px "Kaiti SC", "Songti SC", system-ui, sans-serif';
    ctx.fillText(subtitle, 256, 88);
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createFresnelHalo(radius, hexColor, intensity = 0.45) {
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uColor: { value: new THREE.Color(hexColor) },
      uIntensity: { value: intensity },
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
      uniform float uIntensity;
      varying vec3 vNormal;
      varying vec3 vViewPos;
      void main() {
        vec3 viewDir = normalize(vViewPos);
        float rim = pow(clamp(1.0 + dot(vNormal, viewDir), 0.0, 1.0), 2.5);
        gl_FragColor = vec4(uColor, rim * uIntensity);
      }
    `,
  });
  return new THREE.Mesh(new THREE.SphereGeometry(radius * 1.22, 28, 20), mat);
}

// 构造云朵团簇（柔白绘本云朵环绕微缩星球半山腰）
function createFluffyCloudCluster(scale = 1) {
  const g = new THREE.Group();
  const mat = new THREE.MeshToonMaterial({
    color: "#f4f7fc",
    gradientMap: STORYBOOK_GRAD,
    transparent: true,
    opacity: 0.88,
  });
  const puffs = [
    [0, 0, 0, 0.22],
    [-0.18, -0.03, 0.04, 0.16],
    [0.19, -0.02, -0.03, 0.17],
    [0.06, 0.07, 0.05, 0.15],
  ];
  for (const [x, y, z, r] of puffs) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r * scale, 10, 8), mat);
    m.position.set(x * scale, y * scale, z * scale);
    g.add(m);
  }
  return g;
}

// 构造双层冷杉树（带树干与积雪尖顶可选）
function createMiniSpruce(scale = 1, snowTip = false) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03 * scale, 0.045 * scale, 0.16 * scale, 5),
    new THREE.MeshToonMaterial({ color: "#5c3d28", gradientMap: STORYBOOK_GRAD })
  );
  trunk.position.y = 0.07 * scale;
  const c1 = new THREE.Mesh(
    new THREE.ConeGeometry(0.16 * scale, 0.34 * scale, 6),
    new THREE.MeshToonMaterial({ color: "#27533a", gradientMap: STORYBOOK_GRAD })
  );
  c1.position.y = 0.24 * scale;
  const c2 = new THREE.Mesh(
    new THREE.ConeGeometry(0.12 * scale, 0.28 * scale, 6),
    new THREE.MeshToonMaterial({
      color: snowTip ? "#e8f1fb" : "#366e49",
      gradientMap: STORYBOOK_GRAD,
    })
  );
  c2.position.y = 0.4 * scale;
  g.add(trunk, c1, c2);
  return g;
}

// 构造发光微缩帐篷与营火
function createMiniGlowingCamp(tentHex = "#e88b35", scale = 1) {
  const g = new THREE.Group();
  const tent = new THREE.Mesh(
    new THREE.ConeGeometry(0.18 * scale, 0.24 * scale, 4),
    new THREE.MeshStandardMaterial({
      color: tentHex,
      emissive: tentHex,
      emissiveIntensity: 0.5,
      roughness: 0.65,
    })
  );
  tent.position.y = 0.11 * scale;
  tent.rotation.y = Math.PI * 0.25;
  const fire = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.065 * scale, 0),
    new THREE.MeshBasicMaterial({ color: "#ffdf73" })
  );
  fire.position.set(0.2 * scale, 0.06 * scale, 0.12 * scale);
  g.add(tent, fire);
  return g;
}

// ============================================================================
// 构建精细微缩真实徒步星球（真实等高线顶点着色 + 蜿蜒石板路 + 云朵环绕 + 专属微缩地标生态）
// ============================================================================
function buildDetailedMiniaturePlanet(spec) {
  const wrap = new THREE.Group();
  wrap.position.set(...spec.pos);

  const scaleFactor = spec.r / PLANET_RADIUS;
  const geo = new THREE.SphereGeometry(spec.r, 56, 40);
  const posAttr = geo.attributes.position;
  const colors = new Float32Array(posAttr.count * 3);

  const cLow = new THREE.Color(spec.low);
  const cMid = new THREE.Color(spec.mid);
  const cHigh = new THREE.Color(spec.high);
  const cSnow = new THREE.Color("#f6f9ff");
  const cShore = new THREE.Color("#e8d5a7");
  const dir = new THREE.Vector3();
  const tmp = new THREE.Color();

  const surfaceAtUnit = (uDir) => getSurfaceRadius(spec.templateId, uDir) * scaleFactor;

  const placeProp = (obj, uDir, extraH = 0) => {
    const r = surfaceAtUnit(uDir) + extraH;
    obj.position.copy(uDir).multiplyScalar(r);
    obj.quaternion.setFromUnitVectors(UP, uDir);
    return obj;
  };

  for (let i = 0; i < posAttr.count; i++) {
    dir.fromBufferAttribute(posAttr, i).normalize();
    const rawR = getSurfaceRadius(spec.templateId, dir);
    const h = rawR - PLANET_RADIUS;
    const scaledR = rawR * scaleFactor;
    posAttr.setXYZ(i, dir.x * scaledR, dir.y * scaledR, dir.z * scaledR);

    if (spec.water && h < 0.08) {
      tmp.copy(cShore).lerp(cLow, THREE.MathUtils.clamp((h + 0.35) / 0.43, 0, 1));
    } else if (h < 0.3) {
      tmp.copy(cLow).lerp(cMid, THREE.MathUtils.clamp((h + 0.35) / 0.65, 0, 1));
    } else if (h < 0.92) {
      tmp.copy(cMid).lerp(cHigh, THREE.MathUtils.clamp((h - 0.3) / 0.62, 0, 1));
    } else {
      tmp.copy(cHigh).lerp(cSnow, THREE.MathUtils.clamp((h - 0.92) / 0.55, 0, 1));
    }
    colors[i * 3] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const bodyGroup = new THREE.Group();
  const terrain = new THREE.Mesh(
    geo,
    new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: STORYBOOK_GRAD })
  );
  bodyGroup.add(terrain);

  if (spec.water) {
    const sea = new THREE.Mesh(
      new THREE.SphereGeometry(spec.r * 1.004, 36, 28),
      new THREE.MeshToonMaterial({
        color: spec.water,
        gradientMap: STORYBOOK_GRAD,
        transparent: true,
        opacity: 0.86,
      })
    );
    bodyGroup.add(sea);
  }

  // 1. 蜿蜒石板山径（绕星球正面的精致踏脚石虚线）
  const stoneGeo = new THREE.CylinderGeometry(0.032, 0.038, 0.02, 5);
  const stoneMat = new THREE.MeshBasicMaterial({ color: "#f5ebd4" });
  const pathNodes = [
    latLonVec(-22, -45),
    latLonVec(-4, -12),
    latLonVec(18, 22),
    latLonVec(34, 58),
    latLonVec(12, 98),
  ];
  for (let seg = 0; seg < pathNodes.length - 1; seg++) {
    for (let s = 1; s < 8; s++) {
      const d = new THREE.Vector3().lerpVectors(pathNodes[seg], pathNodes[seg + 1], s / 8).normalize();
      if (spec.water && getSurfaceRadius(spec.templateId, d) < PLANET_RADIUS + 0.04) continue;
      const st = new THREE.Mesh(stoneGeo, stoneMat);
      bodyGroup.add(placeProp(st, d, 0.008));
    }
  }

  // 2. 四颗代表山海星球各自的标志性微缩生态奇观！
  const rand = seededRand(spec.templateId.charCodeAt(0) * 97 + 13);

  if (spec.templateId === "yading") {
    // 🏔️ 亚丁三神山雪峰星：冲垭口五彩藏地经幡 + 高山冰川松林 + 暴雪暖光营地 + 翡翠牛奶海波光
    for (let i = 0; i < 14; i++) {
      const d = latLonVec((rand() - 0.5) * 110, (rand() - 0.5) * 320);
      const h = getSurfaceRadius("yading", d) - PLANET_RADIUS;
      if (h > 0.08 && h < 0.72) {
        bodyGroup.add(placeProp(createMiniSpruce(0.75 + rand() * 0.35, h > 0.45), d, -0.01));
      }
    }
    // 垭口五彩经幡杆阵
    const flagRig = new THREE.Group();
    const poleMat = new THREE.MeshBasicMaterial({ color: "#e5d5b5" });
    [-0.18, 0.18].forEach((px) => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.38, 5), poleMat);
      p.position.set(px, 0.18, 0);
      flagRig.add(p);
    });
    ["#3b82f6", "#f8fafc", "#ef4444", "#22c55e", "#eab308"].forEach((fc, idx) => {
      const fl = new THREE.Mesh(
        new THREE.BoxGeometry(0.058, 0.045, 0.01),
        new THREE.MeshBasicMaterial({ color: fc })
      );
      fl.position.set(-0.13 + idx * 0.065, 0.31 - Math.sin((idx / 4) * Math.PI) * 0.035, 0);
      flagRig.add(fl);
    });
    bodyGroup.add(placeProp(flagRig, latLonVec(26, 18), 0));
    bodyGroup.add(placeProp(createMiniGlowingCamp("#eb9b34", 0.95), latLonVec(-12, -16), 0));
  } else if (spec.templateId === "tengger") {
    // 🏜️ 腾格里金沙星：月牙翡翠绿洲湖 + 金秋胡杨林 + 紫色马兰花 + 沙漠篝火营地与驼队剪影
    const oasisDir = latLonVec(8, -18);
    const oasisLake = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.24, 0.04, 14),
      new THREE.MeshBasicMaterial({ color: "#14b8a6" })
    );
    bodyGroup.add(placeProp(oasisLake, oasisDir, 0.01));
    // 金色胡杨树丛环绕绿洲
    for (let t = 0; t < 7; t++) {
      const td = oasisDir
        .clone()
        .add(new THREE.Vector3((rand() - 0.5) * 0.36, (rand() - 0.5) * 0.36, (rand() - 0.5) * 0.36))
        .normalize();
      const poplar = new THREE.Group();
      const tr = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.03, 0.14, 5),
        new THREE.MeshBasicMaterial({ color: "#6b4423" })
      );
      tr.position.y = 0.06;
      const crown = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.11 + rand() * 0.04, 0),
        new THREE.MeshToonMaterial({ color: "#f59e0b", gradientMap: STORYBOOK_GRAD })
      );
      crown.position.y = 0.18;
      poplar.add(tr, crown);
      bodyGroup.add(placeProp(poplar, td, 0));
    }
    bodyGroup.add(placeProp(createMiniGlowingCamp("#f97316", 0.95), latLonVec(-16, 22), 0));
  } else if (spec.templateId === "yili") {
    // 🌲 天山云杉草甸星：成片雪岭云杉 + 洁白哈萨克毡房群 + 果子沟双塔斜拉微缩大桥 + 草原花海
    for (let i = 0; i < 18; i++) {
      const d = latLonVec((rand() - 0.5) * 125, (rand() - 0.5) * 340);
      const h = getSurfaceRadius("yili", d) - PLANET_RADIUS;
      if (h > 0.06 && h < 0.78) {
        bodyGroup.add(placeProp(createMiniSpruce(0.7 + rand() * 0.35, false), d, -0.01));
      }
    }
    // 洁白哈萨克牧民毡房 2 座
    [latLonVec(-8, 14), latLonVec(-15, 28)].forEach((yd) => {
      const yurt = new THREE.Group();
      const wall = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, 0.14, 0.1, 10),
        new THREE.MeshToonMaterial({ color: "#fcfbf7", gradientMap: STORYBOOK_GRAD })
      );
      wall.position.y = 0.05;
      const dome = new THREE.Mesh(
        new THREE.ConeGeometry(0.14, 0.09, 10),
        new THREE.MeshToonMaterial({ color: "#f0e6d2", gradientMap: STORYBOOK_GRAD })
      );
      dome.position.y = 0.14;
      yurt.add(wall, dome);
      bodyGroup.add(placeProp(yurt, yd, 0));
    });
    // 微缩果子沟双塔斜拉大桥
    const bridge = new THREE.Group();
    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(0.56, 0.025, 0.08),
      new THREE.MeshBasicMaterial({ color: "#f1f5f9" })
    );
    deck.position.y = 0.16;
    [-0.16, 0.16].forEach((tx) => {
      const tw = new THREE.Mesh(
        new THREE.BoxGeometry(0.028, 0.34, 0.06),
        new THREE.MeshBasicMaterial({ color: "#ffffff" })
      );
      tw.position.set(tx, 0.17, 0);
      bridge.add(tw);
    });
    bridge.add(deck);
    bodyGroup.add(placeProp(bridge, latLonVec(22, -20), 0.01));
  } else if (spec.templateId === "maclehose") {
    // 🌊 麦理浩蔚蓝海湾山脊星：海角红白发光灯塔 + 蔚蓝海面小白帆船 + 沙滩营地
    for (let i = 0; i < 12; i++) {
      const d = latLonVec((rand() - 0.5) * 115, (rand() - 0.5) * 330);
      const h = getSurfaceRadius("maclehose", d) - PLANET_RADIUS;
      if (h > 0.14 && h < 0.7) {
        bodyGroup.add(placeProp(createMiniSpruce(0.68 + rand() * 0.28, false), d, -0.01));
      }
    }
    // 海角红顶发光灯塔
    const lh = new THREE.Group();
    const tower = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.075, 0.34, 8),
      new THREE.MeshToonMaterial({ color: "#f8fafc", gradientMap: STORYBOOK_GRAD })
    );
    tower.position.y = 0.17;
    const redBand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.056, 0.064, 0.09, 8),
      new THREE.MeshBasicMaterial({ color: "#ef4444" })
    );
    redBand.position.y = 0.2;
    const lantern = new THREE.Mesh(
      new THREE.SphereGeometry(0.052, 8, 8),
      new THREE.MeshBasicMaterial({ color: "#fef08a" })
    );
    lantern.position.y = 0.36;
    lh.add(tower, redBand, lantern);
    bodyGroup.add(placeProp(lh, latLonVec(18, -14), 0));

    // 海湾小白帆船
    const boat = new THREE.Group();
    const hull = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.045, 0.08),
      new THREE.MeshBasicMaterial({ color: "#d97706" })
    );
    const sail = new THREE.Mesh(
      new THREE.ConeGeometry(0.08, 0.22, 3),
      new THREE.MeshBasicMaterial({ color: "#ffffff" })
    );
    sail.position.y = 0.13;
    boat.add(hull, sail);
    const seaDir = latLonVec(-12, 24);
    boat.position.copy(seaDir).multiplyScalar(spec.r * 1.015);
    boat.quaternion.setFromUnitVectors(UP, seaDir);
    bodyGroup.add(boat);
  }

  // 3. 环绕半山腰缓缓流淌的绘本云朵轨道层
  const cloudOrbit = new THREE.Group();
  [
    [24, 42, 0.85],
    [-18, -68, 0.72],
    [8, 165, 0.78],
  ].forEach(([lat, lon, sc]) => {
    const cl = createFluffyCloudCluster(sc);
    const cd = latLonVec(lat, lon);
    cl.position.copy(cd).multiplyScalar(spec.r * 1.18);
    cl.quaternion.setFromUnitVectors(UP, cd);
    cloudOrbit.add(cl);
  });
  bodyGroup.add(cloudOrbit);

  wrap.add(bodyGroup);
  wrap.add(createFresnelHalo(spec.r, spec.halo, 0.52));

  if (spec.ringColor) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(spec.r * 1.48, 0.022, 8, 72),
      new THREE.MeshBasicMaterial({
        color: spec.ringColor,
        transparent: true,
        opacity: 0.42,
      })
    );
    ring.rotation.set(1.16, 0.24, -0.18);
    wrap.add(ring);
  }

  // 星球下方精致古典小铭牌
  const labelMat = new THREE.SpriteMaterial({
    map: createClassicalStarChartLabel(spec.labelTitle, spec.labelSub),
    transparent: true,
    depthWrite: false,
    opacity: 0.86,
  });
  const labelSprite = new THREE.Sprite(labelMat);
  labelSprite.scale.set(spec.r * 2.55, spec.r * 0.68, 1);
  labelSprite.position.set(0, -spec.r * 1.46, 0.3);
  wrap.add(labelSprite);

  // 透明拾取球（方便鼠标悬停高亮放大与点击跳转）
  const hitMesh = new THREE.Mesh(
    new THREE.SphereGeometry(spec.r * 1.42, 16, 12),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitMesh.userData = {
    prologueAction: "lit-planet",
    founderRole: spec.founderRole,
    planetId: spec.planetId,
    hoverTitle: spec.hoverTitle,
    wrapRef: wrap,
  };
  wrap.add(hitMesh);

  return {
    wrap,
    bodyGroup,
    cloudOrbit,
    hitMesh,
    baseY: spec.pos[1],
    phase: spec.phase,
    hoverScale: 1,
  };
}

// ============================================================================
// 底端前景星球：高山草甸松林山脊营地（松林 + 玛尼石堆 + 高山杜鹃 + 篝火帐篷 + 玫瑰罩）
// ============================================================================
function buildAlpineHikerPedestal() {
  const pedestal = new THREE.Group();
  // 在方案 A 上下分景构图中，下沉前景山脊并稳稳承托底部观星坞与行者小人
  pedestal.position.set(0, -10.85, 5.5);

  const scaleFactor = 5.4 / PLANET_RADIUS;
  const geo = new THREE.SphereGeometry(5.4, 60, 44);
  const posAttr = geo.attributes.position;
  const colors = new Float32Array(posAttr.count * 3);
  const cForest = new THREE.Color("#2b5640");
  const cMeadow = new THREE.Color("#528558");
  const cRidge = new THREE.Color("#8a959e");
  const cSnow = new THREE.Color("#eef4fc");
  const dir = new THREE.Vector3();
  const tmp = new THREE.Color();

  for (let i = 0; i < posAttr.count; i++) {
    dir.fromBufferAttribute(posAttr, i).normalize();
    const rawR = getSurfaceRadius("title", dir);
    const h = rawR - PLANET_RADIUS;
    const r = rawR * scaleFactor;
    posAttr.setXYZ(i, dir.x * r, dir.y * r, dir.z * r);

    if (h < 0.25) {
      tmp.copy(cForest).lerp(cMeadow, THREE.MathUtils.clamp((h + 0.3) / 0.55, 0, 1));
    } else if (h < 0.92) {
      tmp.copy(cMeadow).lerp(cRidge, THREE.MathUtils.clamp((h - 0.25) / 0.67, 0, 1));
    } else {
      tmp.copy(cRidge).lerp(cSnow, THREE.MathUtils.clamp((h - 0.92) / 0.55, 0, 1));
    }
    colors[i * 3] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  pedestal.add(
    new THREE.Mesh(geo, new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: STORYBOOK_GRAD }))
  );
  pedestal.add(createFresnelHalo(5.4, "#86b8ef", 0.36));

  const surfaceAt = (uDir) => getSurfaceRadius("title", uDir) * scaleFactor;
  const place = (obj, uDir, extraH = 0) => {
    const r = surfaceAt(uDir) + extraH;
    obj.position.copy(uDir).multiplyScalar(r);
    obj.quaternion.setFromUnitVectors(UP, uDir);
    return obj;
  };

  // 两侧高山冷杉林
  [
    [-0.36, 0.9, 0.22],
    [-0.46, 0.85, 0.28],
    [-0.26, 0.92, -0.15],
    [0.37, 0.89, 0.2],
    [0.47, 0.84, 0.28],
    [0.29, 0.91, -0.14],
  ].forEach(([x, y, z], idx) => {
    const d = new THREE.Vector3(x, y, z).normalize();
    pedestal.add(place(createMiniSpruce(1.55 + (idx % 2) * 0.28, idx % 3 === 0), d, -0.02));
  });

  // 暖橙探险帐篷 + 篝火点光源（位于小人右前方）
  const campDir = new THREE.Vector3(0.2, 0.955, 0.22).normalize();
  const campGroup = new THREE.Group();
  const tent = new THREE.Mesh(
    new THREE.ConeGeometry(0.38, 0.48, 4),
    new THREE.MeshStandardMaterial({
      color: "#e88b35",
      emissive: "#d97706",
      emissiveIntensity: 0.46,
      roughness: 0.72,
    })
  );
  tent.position.y = 0.22;
  tent.rotation.y = Math.PI * 0.25;
  const fireMesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.11, 0),
    new THREE.MeshBasicMaterial({ color: "#ffe07d" })
  );
  fireMesh.position.set(-0.34, 0.1, 0.2);
  const fireLight = new THREE.PointLight("#ffb74d", 2.1, 10.5);
  fireLight.position.set(-0.34, 0.42, 0.2);
  campGroup.add(tent, fireMesh, fireLight);
  pedestal.add(place(campGroup, campDir, 0));

  // 小人左前方：小王子玻璃罩红玫瑰彩蛋
  const roseDir = new THREE.Vector3(-0.17, 0.96, 0.22).normalize();
  const roseGroup = new THREE.Group();
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.018, 0.24, 6),
    new THREE.MeshBasicMaterial({ color: "#2e7d32" })
  );
  stem.position.y = 0.12;
  const bloom = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.068, 0),
    new THREE.MeshBasicMaterial({ color: "#e11d48" })
  );
  bloom.position.y = 0.26;
  const glass = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.11, 0.16, 8, 14),
    new THREE.MeshPhysicalMaterial({
      color: "#dbeafe",
      transparent: true,
      opacity: 0.28,
      roughness: 0.1,
    })
  );
  glass.position.y = 0.17;
  roseGroup.add(stem, bloom, glass);
  pedestal.add(place(roseGroup, roseDir, 0));

  return { pedestal, fireLight, fireMesh, surfaceAt };
}

// ============================================================================
// 主组装函数：无框天幕 · 中央黄金全景星海 + 可点击拾取接口
// ============================================================================
export function buildPrologueCosmosWorld() {
  const group = new THREE.Group();
  const miniPlanets = [];
  const unknownGalaxies = [];
  const clickableMeshes = [];

  // 1. 细腻苍青与暗金星尘薄雾
  [
    [-11, 5.2, -26, 26, "#2c4c86", "#16264c"],
    [12, 4.8, -28, 28, "#3e5888", "#182850"],
    [0, 1.8, -22, 24, "#5c4a2e", "#192a52"],
  ].forEach(([x, y, z, scale, c1, c2]) => {
    const sp = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createAstrolabeNebulaTexture(c1, c2),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    sp.position.set(x, y, z);
    sp.scale.set(scale, scale * 0.65, 1);
    group.add(sp);
  });

  // 2. 环绕中央全景星海的 4 颗精细微缩真实徒步星球（各有专属地标、山径与环绕流云！）
  const litSpecs = [
    {
      templateId: "yading",
      founderRole: "mine",
      planetId: "yading",
      pos: [-8.8, 2.5, -7.8],
      r: 2.15,
      low: "#b88944",
      mid: "#727f8e",
      high: "#f2f6fc",
      water: "#1c92cf",
      halo: "#7ec8ff",
      ringColor: "#f0c768",
      labelTitle: "🏔️ 亚丁雪峰星",
      labelSub: "清哥 · 苍山星河",
      hoverTitle: "🏔️ 点击降落「稻城亚丁 · 三神山星」",
      phase: 0.3,
    },
    {
      templateId: "tengger",
      founderRole: "mine",
      planetId: "tengger",
      pos: [9.0, 2.7, -8.0],
      r: 2.18,
      low: "#c6843e",
      mid: "#dfa858",
      high: "#f6e3be",
      water: null,
      halo: "#f0c768",
      ringColor: "#ffe399",
      labelTitle: "🏜️ 腾格里金沙星",
      labelSub: "绿洲胡杨 · 篝火营地",
      hoverTitle: "🏜️ 点击降落「腾格里沙漠 · 五湖连穿星」",
      phase: 1.8,
    },
    {
      templateId: "yili",
      founderRole: "kitty",
      planetId: "kitty-yili",
      pos: [-4.3, -0.85, -8.8],
      r: 1.82,
      low: "#3d754c",
      mid: "#6ba35c",
      high: "#eef5fc",
      water: "#2185d0",
      halo: "#9ed6a0",
      ringColor: null,
      labelTitle: "🌲 天山云杉星",
      labelSub: "Kitty · 猫耳星云",
      hoverTitle: "🌲 点击串门「Kitty · 伊犁天山云杉星」",
      phase: 3.1,
    },
    {
      templateId: "maclehose",
      founderRole: "luca",
      planetId: "luca-maclehose",
      pos: [4.5, -0.7, -8.6],
      r: 1.86,
      low: "#467c52",
      mid: "#76a365",
      high: "#eef4fa",
      water: "#1d68b5",
      halo: "#68b5f8",
      ringColor: "#f0c768",
      labelTitle: "🌊 麦理浩海湾星",
      labelSub: "Luca · 追风星云",
      hoverTitle: "🌊 点击串门「Luca · 麦理浩海岸灯塔星」",
      phase: 4.5,
    },
  ];

  for (const s of litSpecs) {
    const mp = buildDetailedMiniaturePlanet(s);
    group.add(mp.wrap);
    miniPlanets.push(mp);
    clickableMeshes.push(mp.hitMesh);
  }

  // 古典鎏金航迹虚线：将中央未知星系与四颗已点亮山海星球优雅串联成猎户般的全景星座
  for (const pts of [
    [litSpecs[0].pos, [-4.6, 2.2, -10.4], [0, 2.1, -12.4], [4.8, 2.3, -10.4], litSpecs[1].pos],
    [litSpecs[0].pos, litSpecs[2].pos, [0, -0.2, -10.5], litSpecs[3].pos, litSpecs[1].pos],
  ]) {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
    const lineGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(48));
    const line = new THREE.Line(
      lineGeo,
      new THREE.LineDashedMaterial({
        color: "#f0c768",
        dashSize: 0.34,
        gapSize: 0.26,
        transparent: true,
        opacity: 0.38,
      })
    );
    line.computeLineDistances();
    group.add(line);
  }

  // 3. 正中央黄金视野 + 左右纵深：3 座古典鎏金罗盘「未知星系（Uncharted Galaxies）」
  const unchartedSpecs = [
    {
      // 正中央主未知星系：毫无遮挡地悬浮在天幕中央！
      center: [0.0, 2.15, -12.4],
      tilt: [0.95, 0.06, -0.1],
      discSize: 9.8,
      armHex: "#88a8d8",
      title: "✦ 未名星系 · 点击开辟专属疆域",
      sub: "申领护照即可在此点亮你的第一颗山海星球",
      hoverTitle: "🪪 点击申领星际护照 · 点亮并命名这片未知星系",
      satellites: [
        [-2.05, 0.36, 0.32, 0.72, "zhagana"],
        [0.08, 0.16, 0.0, 1.18, "siguniang"],
        [2.12, -0.34, 0.3, 0.66, "tengger"],
      ],
      phase: 0.7,
    },
    {
      center: [-14.4, 0.4, -14.2],
      tilt: [1.02, 0.26, -0.2],
      discSize: 8.4,
      armHex: "#7290bc",
      title: "✦ 迷雾星云 · B-???",
      sub: "静候新行者足迹抵达",
      hoverTitle: "🪪 点击申领护照 · 为「迷雾星云」镌刻你的名字",
      satellites: [
        [-1.75, 0.38, 0.28, 0.6, "siguniang"],
        [0.12, 0.1, -0.1, 0.96, "yili"],
        [1.85, -0.34, 0.32, 0.56, "maclehose"],
      ],
      phase: 2.3,
    },
    {
      center: [14.6, 0.6, -14.4],
      tilt: [0.98, -0.28, 0.22],
      discSize: 8.4,
      armHex: "#8aa2c4",
      title: "✦ 远方隐秘星群 · ？",
      sub: "万千未知山海待点亮",
      hoverTitle: "🪪 点击申领护照 · 开启属于你的山海星系",
      satellites: [
        [-1.8, -0.3, 0.32, 0.58, "yili"],
        [-0.06, 0.16, 0.1, 0.98, "zhagana"],
        [1.82, 0.42, -0.28, 0.62, "tengger"],
      ],
      phase: 3.8,
    },
  ];

  const veiledBodyMat = new THREE.MeshToonMaterial({
    color: "#2b426d",
    emissive: "#152548",
    emissiveIntensity: 0.48,
    gradientMap: STORYBOOK_GRAD,
  });

  for (const u of unchartedSpecs) {
    const cluster = new THREE.Group();
    cluster.position.set(...u.center);

    const discMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(u.discSize, u.discSize),
      new THREE.MeshBasicMaterial({
        map: createUnchartedAstrolabeDisc(u.armHex),
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      })
    );
    discMesh.rotation.set(...u.tilt);
    cluster.add(discMesh);

    const satPts = [];
    for (const [sx, sy, sz, sr, tpl] of u.satellites) {
      const sGeo = new THREE.SphereGeometry(sr, 26, 20);
      const pAttr = sGeo.attributes.position;
      const vDir = new THREE.Vector3();
      const sFactor = sr / PLANET_RADIUS;
      for (let k = 0; k < pAttr.count; k++) {
        vDir.fromBufferAttribute(pAttr, k).normalize();
        const mr = getSurfaceRadius(tpl, vDir) * sFactor;
        pAttr.setXYZ(k, vDir.x * mr, vDir.y * mr, vDir.z * mr);
      }
      sGeo.computeVertexNormals();

      const satWrap = new THREE.Group();
      satWrap.position.set(sx, sy, sz);
      satWrap.add(new THREE.Mesh(sGeo, veiledBodyMat));
      satWrap.add(createFresnelHalo(sr, "#f0c768", 0.56));
      cluster.add(satWrap);
      satPts.push(new THREE.Vector3(sx, sy, sz));
    }

    if (satPts.length >= 2) {
      const cGeo = new THREE.BufferGeometry().setFromPoints(satPts);
      const cLine = new THREE.Line(
        cGeo,
        new THREE.LineDashedMaterial({
          color: "#f0c768",
          dashSize: 0.22,
          gapSize: 0.18,
          transparent: true,
          opacity: 0.55,
        })
      );
      cLine.computeLineDistances();
      cluster.add(cLine);
    }

    const labelMat = new THREE.SpriteMaterial({
      map: createClassicalStarChartLabel(u.title, u.sub),
      transparent: true,
      depthWrite: false,
      opacity: 0.94,
    });
    const labelSprite = new THREE.Sprite(labelMat);
    const lScale = u.discSize * 0.62;
    labelSprite.scale.set(lScale, lScale * 0.265, 1);
    labelSprite.position.set(0, u.discSize * 0.28, 0.8);
    cluster.add(labelSprite);

    const hitMesh = new THREE.Mesh(
      new THREE.SphereGeometry(u.discSize * 0.34, 16, 12),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitMesh.userData = {
      prologueAction: "uncharted-galaxy",
      hoverTitle: u.hoverTitle,
      wrapRef: cluster,
    };
    cluster.add(hitMesh);
    clickableMeshes.push(hitMesh);

    group.add(cluster);
    unknownGalaxies.push({
      cluster,
      discMesh,
      labelMat,
      baseY: u.center[1],
      phase: u.phase,
      hoverScale: 1,
    });
  }

  // 4. 底端前景高山松林篝火营地（承载行者小人仰望整片中央星海）
  const { pedestal, fireLight, fireMesh, surfaceAt } = buildAlpineHikerPedestal();
  group.add(pedestal);

  let hoveredWrap = null;
  let parallaxTargetX = 0;
  let parallaxTargetY = 0;

  return {
    group,
    pedestal,
    surfaceAt,
    getClickableMeshes() {
      return clickableMeshes;
    },
    setHoveredWrap(targetWrap) {
      hoveredWrap = targetWrap || null;
    },
    setParallax(nx, ny) {
      parallaxTargetX = THREE.MathUtils.clamp(nx, -1, 1) * 0.55;
      parallaxTargetY = THREE.MathUtils.clamp(ny, -1, 1) * 0.32;
    },
    update(dt, elapsed) {
      group.position.x += (parallaxTargetX - group.position.x) * Math.min(1, dt * 3.5);
      group.position.y += (parallaxTargetY - group.position.y) * Math.min(1, dt * 3.5);

      for (const mp of miniPlanets) {
        mp.bodyGroup.rotation.y += dt * 0.16;
        mp.cloudOrbit.rotation.y += dt * 0.09;
        mp.wrap.position.y = mp.baseY + Math.sin(elapsed * 0.85 + mp.phase) * 0.2;
        const targetS = hoveredWrap === mp.wrap ? 1.12 : 1.0;
        mp.hoverScale += (targetS - mp.hoverScale) * Math.min(1, dt * 8);
        mp.wrap.scale.setScalar(mp.hoverScale);
      }
      for (const ug of unknownGalaxies) {
        ug.discMesh.rotation.z -= dt * 0.14;
        ug.cluster.position.y = ug.baseY + Math.sin(elapsed * 0.65 + ug.phase) * 0.16;
        ug.labelMat.opacity = 0.84 + Math.sin(elapsed * 1.5 + ug.phase) * 0.14;
        const targetS = hoveredWrap === ug.cluster ? 1.1 : 1.0;
        ug.hoverScale += (targetS - ug.hoverScale) * Math.min(1, dt * 8);
        ug.cluster.scale.setScalar(ug.hoverScale);
      }
      fireLight.intensity = 1.95 + Math.sin(elapsed * 7.4) * 0.25 + Math.cos(elapsed * 11.3) * 0.12;
      fireMesh.scale.setScalar(0.92 + Math.sin(elapsed * 9.0) * 0.12);
    },
  };
}



