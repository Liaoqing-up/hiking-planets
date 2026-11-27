// ============================================================================
// 《行者的星球 · 山海皆星辰》总扉页超清全景 3D 星海场景（v5.3.4 · 锐利微缩山海 + 双翼零遮挡）
// 核心升级：
// 1. 彻底消除雾化模糊：移除大面积雾化叠加贴图，星盘升级为 1024px 各向异性过滤矢量纹理，
//    铭牌升级为 1024×240 Retina 高清锐利字体；大气光圈收紧至 1.065x 锋利轮廓光。
// 2. 超清微缩山海星球：网格细分提升至 112×84，地形起伏强化 1.72x，海洋球壳严格置于陆地基准面下
//    (PLANET_RADIUS - 0.06)，杜绝半透明水壳蒙雾；使用标准 latLonToUnitVec 将雪峰、经幡、绿洲胡杨、
//    毡房、斜拉桥、红白灯塔与白帆船精准朝向镜头，并以 ±16° 黄金视角微摆展示最美正面！
// 3. 底端山脊双翼零遮挡：桌面端左右双翼退居山脚两侧，正中央完整露出高山松林、玫瑰罩、篝火帐篷与小人；
//    移动端自动抬升前景山脊底座，确保小人全身不被底栏遮挡。
// ============================================================================

import * as THREE from "three";
import {
  PLANET_RADIUS,
  STORYBOOK_GRAD,
  UP_VEC,
  getSurfaceRadius,
  latLonToUnitVec,
  seededRand,
} from "./sphereMath.js?v=5.3.5-hikerstars-domain";

// 4 阶高对比度清透绘本色阶贴图（NearestFilter 让微缩星球的山脊明暗交界线干净利落不发糊！）
function createCrispToonRamp() {
  const data = new Uint8Array([
    68, 76, 104, 255,
    126, 134, 158, 255,
    204, 206, 214, 255,
    255, 252, 245, 255,
  ]);
  const tex = new THREE.DataTexture(data, 4, 1, THREE.RGBAFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}
const CRISP_RAMP = createCrispToonRamp();

function createUnchartedAstrolabeDisc(armHex = "#8bb0e8") {
  const cv = document.createElement("canvas");
  cv.width = 1024;
  cv.height = 1024;
  const ctx = cv.getContext("2d");
  const cx = 512;
  const cy = 512;

  // 极克制的中心微光，避免泛白发雾
  const coreGrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, 380);
  coreGrad.addColorStop(0, "rgba(255, 240, 195, 0.28)");
  coreGrad.addColorStop(0.28, "rgba(240, 199, 104, 0.10)");
  coreGrad.addColorStop(0.65, "rgba(56, 88, 148, 0.05)");
  coreGrad.addColorStop(1, "rgba(10, 18, 40, 0)");
  ctx.fillStyle = coreGrad;
  ctx.fillRect(0, 0, 1024, 1024);

  // 1024px 超清古典鎏金同心轨道环
  [112, 210, 316, 424].forEach((r, idx) => {
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash(idx % 2 === 0 ? [18, 14] : [6, 16]);
    ctx.strokeStyle = `rgba(245, 208, 118, ${0.62 - idx * 0.1})`;
    ctx.lineWidth = idx === 0 ? 3.0 : 2.2;
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });

  // 48 道精密古星盘刻度线
  ctx.save();
  ctx.strokeStyle = "rgba(245, 208, 118, 0.48)";
  ctx.lineWidth = 2.0;
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const r0 = i % 4 === 0 ? 298 : 308;
    const r1 = i % 4 === 0 ? 334 : 324;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.stroke();
  }
  ctx.restore();

  // 双旋臂锐利星芒粒子点
  for (let arm = 0; arm < 2; arm++) {
    const base = arm * Math.PI;
    for (let s = 0; s < 160; s++) {
      const t = s / 160;
      const a = base + t * Math.PI * 2.4;
      const rad = 34 + t * 425;
      const px = cx + Math.cos(a) * rad + Math.sin(s * 1.9) * 11;
      const py = cy + Math.sin(a) * rad + Math.cos(s * 1.6) * 11;
      const pr = (1 - t * 0.45) * (s % 6 === 0 ? 5.6 : 3.0);
      ctx.beginPath();
      ctx.fillStyle = s % 4 === 0 ? "#ffefc2" : armHex;
      ctx.globalAlpha = (1 - t * 0.65) * 0.85;
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function createClassicalStarChartLabel(title, subtitle) {
  const cv = document.createElement("canvas");
  cv.width = 1024;
  cv.height = 240;
  const ctx = cv.getContext("2d");

  // 锐利半透明深靛蓝底衬胶囊，彻底告别糊边径向渐变
  const padX = 110;
  const padY = 26;
  const w = 1024 - padX * 2;
  const h = 240 - padY * 2;
  const r = h / 2;

  ctx.beginPath();
  ctx.roundRect(padX, padY, w, h, r);
  ctx.fillStyle = "rgba(8, 15, 34, 0.82)";
  ctx.fill();
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = "rgba(240, 199, 104, 0.58)";
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff3c4";
  ctx.font = '600 46px "LXGW WenKai Screen", "Kaiti SC", "Songti SC", Georgia, serif';
  ctx.fillText(title, 512, subtitle ? 96 : 120);

  if (subtitle) {
    ctx.fillStyle = "rgba(218, 232, 252, 0.94)";
    ctx.font = '500 31px "LXGW WenKai Screen", "Kaiti SC", system-ui, sans-serif';
    ctx.fillText(subtitle, 512, 156);
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 8;
  return tex;
}

function createCrispFresnelHalo(radius, hexColor, intensity = 0.36) {
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
        float rim = pow(clamp(1.0 + dot(vNormal, viewDir), 0.0, 1.0), 4.2);
        gl_FragColor = vec4(uColor, rim * uIntensity);
      }
    `,
  });
  return new THREE.Mesh(new THREE.SphereGeometry(radius * 1.068, 36, 24), mat);
}

function createFluffyCloudCluster(scale = 1) {
  const g = new THREE.Group();
  const mat = new THREE.MeshToonMaterial({
    color: "#f8fafc",
    gradientMap: CRISP_RAMP,
  });
  const puffs = [
    [0, 0, 0, 0.24],
    [-0.2, -0.03, 0.04, 0.17],
    [0.21, -0.02, -0.03, 0.18],
    [0.06, 0.08, 0.05, 0.16],
  ];
  for (const [x, y, z, r] of puffs) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r * scale, 12, 10), mat);
    m.position.set(x * scale, y * scale, z * scale);
    g.add(m);
  }
  return g;
}

function createMiniSpruce(scale = 1, snowTip = false) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.034 * scale, 0.05 * scale, 0.18 * scale, 6),
    new THREE.MeshToonMaterial({ color: "#5c3d28", gradientMap: CRISP_RAMP })
  );
  trunk.position.y = 0.08 * scale;
  const c1 = new THREE.Mesh(
    new THREE.ConeGeometry(0.18 * scale, 0.38 * scale, 7),
    new THREE.MeshToonMaterial({ color: "#1f5138", gradientMap: CRISP_RAMP })
  );
  c1.position.y = 0.26 * scale;
  const c2 = new THREE.Mesh(
    new THREE.ConeGeometry(0.135 * scale, 0.32 * scale, 7),
    new THREE.MeshToonMaterial({
      color: snowTip ? "#f1f6fd" : "#2f744c",
      gradientMap: CRISP_RAMP,
    })
  );
  c2.position.y = 0.44 * scale;
  g.add(trunk, c1, c2);
  return g;
}

function createMiniGlowingCamp(tentHex = "#ea8a2e", scale = 1) {
  const g = new THREE.Group();
  const tent = new THREE.Mesh(
    new THREE.ConeGeometry(0.22 * scale, 0.28 * scale, 4),
    new THREE.MeshStandardMaterial({
      color: tentHex,
      emissive: tentHex,
      emissiveIntensity: 0.42,
      roughness: 0.55,
    })
  );
  tent.position.y = 0.13 * scale;
  tent.rotation.y = Math.PI * 0.25;
  const fire = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.08 * scale, 0),
    new THREE.MeshBasicMaterial({ color: "#ffe47a" })
  );
  fire.position.set(0.24 * scale, 0.07 * scale, 0.14 * scale);
  g.add(tent, fire);
  return g;
}

const RELIEF_BOOST = 1.72;

// 精雕超清微缩山海星球（112×84 高精度顶点 + 1.72x 立体山脊强化 + 清透海岸线 + 镜头正对地标）
function buildDetailedMiniaturePlanet(spec) {
  const wrap = new THREE.Group();
  wrap.position.set(...spec.pos);
  const hitData = {
    prologueAction: "lit-planet",
    planetId: spec.planetId,
    founderRole: spec.founderRole,
    hoverTitle: `🪐 点击免登录降落 · ${spec.labelTitle}（${spec.labelSub}）`,
    wrapRef: wrap,
  };
  wrap.userData = hitData;

  const bodyGroup = new THREE.Group();
  bodyGroup.rotation.y = spec.heroYaw || 0;
  bodyGroup.rotation.x = spec.heroPitch || 0.12;
  wrap.add(bodyGroup);

  const scaleFactor = spec.r / PLANET_RADIUS;
  const surfaceRadiusAt = (dir) => {
    const rawH = getSurfaceRadius(spec.templateId, dir) - PLANET_RADIUS;
    return (PLANET_RADIUS + rawH * RELIEF_BOOST) * scaleFactor;
  };

  const geo = new THREE.SphereGeometry(spec.r, 112, 84);
  const posAttr = geo.attributes.position;
  const colors = new Float32Array(posAttr.count * 3);

  const cLow = new THREE.Color(spec.low);
  const cMid = new THREE.Color(spec.mid);
  const cHigh = new THREE.Color(spec.high);
  const cCoast = new THREE.Color(spec.coast || spec.low);
  const dir = new THREE.Vector3();
  const col = new THREE.Color();

  for (let i = 0; i < posAttr.count; i++) {
    dir.fromBufferAttribute(posAttr, i).normalize();
    const rawR = getSurfaceRadius(spec.templateId, dir);
    const rawH = rawR - PLANET_RADIUS;
    const scaledR = (PLANET_RADIUS + rawH * RELIEF_BOOST) * scaleFactor;
    posAttr.setXYZ(i, dir.x * scaledR, dir.y * scaledR, dir.z * scaledR);

    const hNorm = THREE.MathUtils.clamp((rawH + 0.15) / 1.85, 0, 1);
    if (rawH < 0.06 && spec.water) {
      col.copy(cCoast);
    } else if (hNorm < 0.44) {
      col.copy(cLow).lerp(cMid, hNorm / 0.44);
    } else {
      col.copy(cMid).lerp(cHigh, (hNorm - 0.44) / 0.56);
    }
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const terrain = new THREE.Mesh(
    geo,
    new THREE.MeshToonMaterial({
      vertexColors: true,
      gradientMap: CRISP_RAMP,
    })
  );
  terrain.userData = wrap.userData;
  bodyGroup.add(terrain);

  // 清透不蒙雾的海洋/高山冰湖球壳（严格低于陆地基准面 PLANET_RADIUS - 0.05！）
  if (spec.water) {
    const waterScale =
      spec.templateId === "maclehose"
        ? PLANET_RADIUS - 0.02
        : PLANET_RADIUS - 0.06;
    const sea = new THREE.Mesh(
      new THREE.SphereGeometry(waterScale * scaleFactor, 64, 48),
      new THREE.MeshStandardMaterial({
        color: spec.water,
        roughness: 0.18,
        metalness: 0.12,
      })
    );
    sea.userData = wrap.userData;
    bodyGroup.add(sea);
  }

  // 将地标精准锚定到立体放大后的地表，并通过逆偏航角让地标正对镜头方向！
  const yawInv = -(spec.heroYaw || 0);
  const placeProp = (obj, latDeg, lonDeg, offset = 0) => {
    const d = latLonToUnitVec(latDeg, lonDeg + (yawInv * 180) / Math.PI);
    const pr = surfaceRadiusAt(d) + offset;
    obj.position.copy(d).multiplyScalar(pr);
    obj.quaternion.setFromUnitVectors(UP_VEC, d);
    bodyGroup.add(obj);
  };

  // 1) 正面蜿蜒微缩石板山径（13 颗暖白踏脚石）
  const stoneMat = new THREE.MeshToonMaterial({
    color: "#f5ebd4",
    gradientMap: CRISP_RAMP,
  });
  for (let s = 0; s < 13; s++) {
    const lat = -22 + s * 4.4;
    const lon = -26 + Math.sin(s * 0.55) * 24;
    const stone = new THREE.Mesh(
      new THREE.CylinderGeometry(0.048 * spec.propScale, 0.056 * spec.propScale, 0.026 * spec.propScale, 6),
      stoneMat
    );
    placeProp(stone, lat, lon, 0.012);
  }

  // 2) 各大代表性星球专属地标微缩奇观（全部置于向阳正面！）
  const ps = spec.propScale;
  if (spec.templateId === "yading") {
    [
      [18, -28, true], [10, -36, false], [26, 22, true],
      [-6, 28, false], [-14, -22, false], [34, -12, true],
      [6, 36, false],
    ].forEach(([la, lo, snow]) => {
      placeProp(createMiniSpruce(0.76 * ps, snow), la, lo, -0.01);
    });
    // 垭口五彩藏地经幡阵
    const flagGroup = new THREE.Group();
    const poleMat = new THREE.MeshBasicMaterial({ color: "#d6b884" });
    const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.016 * ps, 0.016 * ps, 0.42 * ps, 5), poleMat);
    const p2 = p1.clone();
    p1.position.set(-0.18 * ps, 0.2 * ps, 0);
    p2.position.set(0.18 * ps, 0.2 * ps, 0);
    flagGroup.add(p1, p2);
    ["#3b82f6", "#f8fafc", "#ef4444", "#22c55e", "#eab308"].forEach((fc, idx) => {
      const f = new THREE.Mesh(
        new THREE.BoxGeometry(0.06 * ps, 0.052 * ps, 0.012 * ps),
        new THREE.MeshBasicMaterial({ color: fc })
      );
      f.position.set((-0.13 + idx * 0.065) * ps, (0.34 - Math.sin((idx / 4) * Math.PI) * 0.04) * ps, 0);
      flagGroup.add(f);
    });
    placeProp(flagGroup, 36, 4, 0);
    placeProp(createMiniGlowingCamp("#f59e0b", 0.9 * ps), -4, 12, 0);
  } else if (spec.templateId === "tengger") {
    // 翡翠月牙绿洲湖与金色胡杨林（正对正面沙谷）
    const oasis = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32 * ps, 0.34 * ps, 0.036 * ps, 20),
      new THREE.MeshStandardMaterial({ color: "#0ea5e9", roughness: 0.16, metalness: 0.18 })
    );
    placeProp(oasis, 12, -10, 0.01);
    [
      [20, -20], [16, 4], [4, -22], [-10, 24], [28, 16],
    ].forEach(([la, lo]) => {
      const poplar = new THREE.Group();
      const tr = new THREE.Mesh(
        new THREE.CylinderGeometry(0.026 * ps, 0.038 * ps, 0.16 * ps, 6),
        new THREE.MeshToonMaterial({ color: "#6b4423", gradientMap: CRISP_RAMP })
      );
      tr.position.y = 0.07 * ps;
      const crown = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.15 * ps, 0),
        new THREE.MeshToonMaterial({ color: "#f59e0b", gradientMap: CRISP_RAMP })
      );
      crown.position.y = 0.23 * ps;
      poplar.add(tr, crown);
      placeProp(poplar, la, lo, -0.01);
    });
    placeProp(createMiniGlowingCamp("#fb923c", 0.92 * ps), -8, 6, 0);
  } else if (spec.templateId === "yili") {
    // 天山雪岭云杉林 + 洁白哈萨克毡房群 + 微缩果子沟双塔斜拉桥
    [
      [28, -22, false], [36, -8, true], [22, 26, false],
      [12, -32, false], [-8, 30, false], [32, 14, true],
      [-18, -24, false],
    ].forEach(([la, lo, snow]) => {
      placeProp(createMiniSpruce(0.78 * ps, snow), la, lo, -0.01);
    });
    [
      [6, -6], [-4, 12],
    ].forEach(([la, lo]) => {
      const yurt = new THREE.Group();
      const wall = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14 * ps, 0.15 * ps, 0.12 * ps, 12),
        new THREE.MeshToonMaterial({ color: "#fffbeb", gradientMap: CRISP_RAMP })
      );
      wall.position.y = 0.06 * ps;
      const dome = new THREE.Mesh(
        new THREE.ConeGeometry(0.155 * ps, 0.11 * ps, 12),
        new THREE.MeshToonMaterial({ color: "#fde68a", gradientMap: CRISP_RAMP })
      );
      dome.position.y = 0.17 * ps;
      yurt.add(wall, dome);
      placeProp(yurt, la, lo, 0);
    });
    const bridge = new THREE.Group();
    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(0.56 * ps, 0.032 * ps, 0.09 * ps),
      new THREE.MeshToonMaterial({ color: "#e2e8f0", gradientMap: CRISP_RAMP })
    );
    deck.position.y = 0.15 * ps;
    const t1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.038 * ps, 0.34 * ps, 0.038 * ps),
      new THREE.MeshBasicMaterial({ color: "#f8fafc" })
    );
    const t2 = t1.clone();
    t1.position.set(-0.15 * ps, 0.17 * ps, 0);
    t2.position.set(0.15 * ps, 0.17 * ps, 0);
    bridge.add(deck, t1, t2);
    placeProp(bridge, 18, 10, 0.01);
  } else if (spec.templateId === "maclehose") {
    [
      [22, -26, false], [10, -34, false], [30, -10, false], [-12, -22, false],
    ].forEach(([la, lo, snow]) => {
      placeProp(createMiniSpruce(0.72 * ps, snow), la, lo, -0.01);
    });
    // 海角红白灯塔（暖黄航标光）
    const lh = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065 * ps, 0.095 * ps, 0.30 * ps, 10),
      new THREE.MeshToonMaterial({ color: "#f8fafc", gradientMap: CRISP_RAMP })
    );
    base.position.y = 0.15 * ps;
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(0.076 * ps, 0.084 * ps, 0.09 * ps, 10),
      new THREE.MeshToonMaterial({ color: "#ef4444", gradientMap: CRISP_RAMP })
    );
    band.position.y = 0.17 * ps;
    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.072 * ps, 10, 8),
      new THREE.MeshBasicMaterial({ color: "#fef08a" })
    );
    lamp.position.y = 0.33 * ps;
    const cap = new THREE.Mesh(
      new THREE.ConeGeometry(0.085 * ps, 0.09 * ps, 10),
      new THREE.MeshToonMaterial({ color: "#dc2626", gradientMap: CRISP_RAMP })
    );
    cap.position.y = 0.40 * ps;
    lh.add(base, band, lamp, cap);
    placeProp(lh, 16, -6, 0);

    // 蔚蓝海湾小白帆船（置于正对镜头的海面上！）
    const boat = new THREE.Group();
    const hull = new THREE.Mesh(
      new THREE.BoxGeometry(0.22 * ps, 0.055 * ps, 0.10 * ps),
      new THREE.MeshToonMaterial({ color: "#9a3412", gradientMap: CRISP_RAMP })
    );
    const sail = new THREE.Mesh(
      new THREE.ConeGeometry(0.11 * ps, 0.28 * ps, 3),
      new THREE.MeshBasicMaterial({ color: "#fffbeb" })
    );
    sail.position.y = 0.16 * ps;
    boat.add(hull, sail);
    const seaDir = latLonToUnitVec(-8, 28 + (yawInv * 180) / Math.PI);
    boat.position.copy(seaDir).multiplyScalar((PLANET_RADIUS - 0.01) * scaleFactor);
    boat.quaternion.setFromUnitVectors(UP_VEC, seaDir);
    bodyGroup.add(boat);
  }

  // 3) 环绕星球半山腰缓缓飘动的 2 朵绘本柔白流云
  const cloudOrbit = new THREE.Group();
  for (let c = 0; c < 2; c++) {
    const cl = createFluffyCloudCluster(0.72 * ps);
    const cDir = latLonToUnitVec(c === 0 ? 24 : -18, c === 0 ? -42 : 48);
    cl.position.copy(cDir).multiplyScalar(spec.r * 1.2);
    cl.quaternion.setFromUnitVectors(UP_VEC, cDir);
    cloudOrbit.add(cl);
  }
  wrap.add(cloudOrbit);

  // 收紧锋利菲涅尔轮廓光（不糊星球内部细节！）
  wrap.add(createCrispFresnelHalo(spec.r, spec.halo, 0.36));

  // 1024×240 Retina 高清古典星图铭牌（置于星球正下方，干净醒目）
  const label = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createClassicalStarChartLabel(spec.labelTitle, spec.labelSub),
      transparent: true,
      depthWrite: false,
    })
  );
  label.position.set(0, -(spec.r + 0.92), 0.4);
  label.scale.set(4.5, 1.05, 1);
  wrap.add(label);

  // 隐形点击感应球，让微缩星球及其周围光晕都能轻松点中
  const hitMesh = new THREE.Mesh(
    new THREE.SphereGeometry(spec.r * 1.18, 14, 10),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitMesh.userData = hitData;
  wrap.add(hitMesh);

  return {
    wrap,
    bodyGroup,
    cloudOrbit,
    hitMesh,
    basePos: [...spec.pos],
    baseY: spec.pos[1],
    heroYaw: spec.heroYaw || 0,
  };
}

// 前景高山松林草甸营地山脊底座（正居中央双翼之间，零遮挡展示行者小人、篝火帐篷与玻璃罩玫瑰）
function buildAlpineHikerPedestal() {
  const pedestal = new THREE.Group();
  const radius = 5.4;
  const scaleFactor = radius / PLANET_RADIUS;

  const geo = new THREE.SphereGeometry(radius, 96, 64);
  const posAttr = geo.attributes.position;
  const colors = new Float32Array(posAttr.count * 3);

  const cForest = new THREE.Color("#26523b");
  const cMeadow = new THREE.Color("#5ca05b");
  const cSnow = new THREE.Color("#eef5fc");
  const dir = new THREE.Vector3();
  const col = new THREE.Color();

  const surfaceAt = (unitDir) => {
    const rawH = getSurfaceRadius("title", unitDir) - PLANET_RADIUS;
    return (PLANET_RADIUS + rawH * 1.35) * scaleFactor;
  };

  for (let i = 0; i < posAttr.count; i++) {
    dir.fromBufferAttribute(posAttr, i).normalize();
    const sr = surfaceAt(dir);
    posAttr.setXYZ(i, dir.x * sr, dir.y * sr, dir.z * sr);

    const hNorm = THREE.MathUtils.clamp((sr / scaleFactor - PLANET_RADIUS + 0.1) / 1.9, 0, 1);
    if (hNorm < 0.46) col.copy(cForest).lerp(cMeadow, hNorm / 0.46);
    else col.copy(cMeadow).lerp(cSnow, (hNorm - 0.46) / 0.54);
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const planetMesh = new THREE.Mesh(
    geo,
    new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: STORYBOOK_GRAD })
  );
  pedestal.add(planetMesh);
  pedestal.add(createCrispFresnelHalo(radius, "#93c5fd", 0.3));

  const pinePlacements = [
    [-0.36, 0.90, 0.20, 1.32, true],
    [-0.25, 0.93, 0.24, 1.05, false],
    [0.32, 0.91, 0.24, 1.25, true],
    [0.44, 0.87, 0.20, 1.08, false],
    [-0.14, 0.94, -0.22, 1.15, true],
    [0.20, 0.94, -0.20, 1.22, true],
  ];
  for (const [x, y, z, sc, snow] of pinePlacements) {
    const pDir = new THREE.Vector3(x, y, z).normalize();
    const tree = createMiniSpruce(sc, snow);
    tree.position.copy(pDir).multiplyScalar(surfaceAt(pDir) - 0.04);
    tree.quaternion.setFromUnitVectors(UP_VEC, pDir);
    pedestal.add(tree);
  }

  // 右侧山脊暖橘帐篷与跳动篝火
  const campGroup = new THREE.Group();
  const tent = new THREE.Mesh(
    new THREE.ConeGeometry(0.32, 0.40, 4),
    new THREE.MeshStandardMaterial({
      color: "#ea8a2e",
      emissive: "#d97706",
      emissiveIntensity: 0.42,
      roughness: 0.55,
    })
  );
  tent.position.set(0.24, 0.18, -0.06);
  tent.rotation.y = Math.PI * 0.22;
  campGroup.add(tent);

  const flame = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.115, 0),
    new THREE.MeshBasicMaterial({ color: "#ffe074" })
  );
  flame.position.set(-0.14, 0.13, 0.16);
  campGroup.add(flame);

  const fireLight = new THREE.PointLight("#ffad42", 1.5, 6.5);
  fireLight.position.set(-0.14, 0.34, 0.16);
  campGroup.add(fireLight);

  const campDir = new THREE.Vector3(0.17, 0.96, 0.22).normalize();
  campGroup.position.copy(campDir).multiplyScalar(surfaceAt(campDir) - 0.02);
  campGroup.quaternion.setFromUnitVectors(UP_VEC, campDir);
  pedestal.add(campGroup);

  // 左侧山脊《小王子》玻璃罩红玫瑰
  const roseGroup = new THREE.Group();
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.018, 0.26, 6),
    new THREE.MeshToonMaterial({ color: "#2e7d32", gradientMap: CRISP_RAMP })
  );
  stem.position.y = 0.13;
  const bloom = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.082, 0),
    new THREE.MeshStandardMaterial({
      color: "#e11d48",
      emissive: "#881337",
      emissiveIntensity: 0.38,
      roughness: 0.4,
    })
  );
  bloom.position.y = 0.28;
  const glassDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.165, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.65),
    new THREE.MeshStandardMaterial({
      color: "#e0f2fe",
      transparent: true,
      opacity: 0.26,
      roughness: 0.08,
      side: THREE.DoubleSide,
    })
  );
  glassDome.position.y = 0.15;
  roseGroup.add(stem, bloom, glassDome);

  const roseDir = new THREE.Vector3(-0.19, 0.955, 0.23).normalize();
  roseGroup.position.copy(roseDir).multiplyScalar(surfaceAt(roseDir) - 0.01);
  roseGroup.quaternion.setFromUnitVectors(UP_VEC, roseDir);
  pedestal.add(roseGroup);

  pedestal.position.set(0, -9.85, 5.8);
  return { pedestal, flame, fireLight, roseGroup, surfaceAt };
}

export function buildPrologueCosmosWorld() {
  const group = new THREE.Group();
  group.name = "prologue-cosmos-world";

  // 1. 全景深空清透鎏金与月白星尘粒子（零雾化、针尖般锐利闪烁）
  const rand = seededRand(20260608);
  const starCount = 420;
  const starPos = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);
  const palette = [
    new THREE.Color("#f0c768"),
    new THREE.Color("#f8efd8"),
    new THREE.Color("#93c5fd"),
    new THREE.Color("#fde68a"),
  ];
  for (let i = 0; i < starCount; i++) {
    const r = 18 + rand() * 24;
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(2 * rand() - 1);
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = r * Math.cos(phi) * 0.62 + 1.2;
    starPos[i * 3 + 2] = -Math.abs(r * Math.sin(phi) * Math.sin(theta)) - 6;
    const c = palette[i % palette.length];
    starColors[i * 3] = c.r;
    starColors[i * 3 + 1] = c.g;
    starColors[i * 3 + 2] = c.b;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute("color", new THREE.BufferAttribute(starColors, 3));
  const starMat = new THREE.PointsMaterial({
    size: 0.19,
    vertexColors: true,
    transparent: true,
    opacity: 0.88,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const deepStars = new THREE.Points(starGeo, starMat);
  group.add(deepStars);

  // 2. 三座超清 1024px 古星盘「未名星系」（正中主旋涡 + 左右远景双翼呼应）
  const unknownSpecs = [
    {
      pos: [0.0, 2.85, -10.2],
      tilt: [0.88, -0.06, 0.1],
      discSize: 8.2,
      armColor: "#93c5fd",
      title: "✦ 未名星系 · 点击开辟",
      sub: "申领星际护照 · 点亮你的第一颗星",
      labelScale: [5.2, 1.22, 1],
      labelY: 2.32,
    },
    {
      pos: [-15.8, -0.35, -13.0],
      tilt: [0.98, 0.24, -0.18],
      discSize: 5.5,
      armColor: "#c4b5fd",
      title: "✦ 待开辟星云",
      sub: "虚位以待",
      labelScale: [4.0, 0.94, 1],
      labelY: 1.68,
    },
    {
      pos: [16.0, -0.25, -13.2],
      tilt: [0.94, -0.26, 0.16],
      discSize: 5.5,
      armColor: "#7dd3fc",
      title: "✦ 远方未知星域",
      sub: "静候行者",
      labelScale: [4.0, 0.94, 1],
      labelY: 1.68,
    },
  ];

  const unknownGalaxies = [];
  for (const u of unknownSpecs) {
    const gWrap = new THREE.Group();
    gWrap.position.set(...u.pos);
    const hitData = {
      prologueAction: "uncharted-galaxy",
      hoverTitle: "🪪 点击申领星际护照 · 点亮并命名这片未知星系",
      wrapRef: gWrap,
    };
    gWrap.userData = hitData;

    const discTex = createUnchartedAstrolabeDisc(u.armColor);
    const disc = new THREE.Mesh(
      new THREE.PlaneGeometry(u.discSize, u.discSize),
      new THREE.MeshBasicMaterial({
        map: discTex,
        transparent: true,
        opacity: 0.96,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    disc.rotation.set(...u.tilt);
    disc.userData = gWrap.userData;
    gWrap.add(disc);

    // 隐形交互碰撞球，方便鼠标/手指精准点击
    const hitSphere = new THREE.Mesh(
      new THREE.SphereGeometry(u.discSize * 0.34, 12, 10),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitSphere.userData = gWrap.userData;
    gWrap.add(hitSphere);

    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + 0.5;
      const orbR = u.discSize * (0.24 + k * 0.06);
      const veiled = new THREE.Mesh(
        new THREE.SphereGeometry(0.18 + (k % 2) * 0.06, 16, 12),
        new THREE.MeshStandardMaterial({
          color: "#1e293b",
          emissive: "#f0c768",
          emissiveIntensity: 0.28,
          roughness: 0.55,
        })
      );
      veiled.position.set(Math.cos(a) * orbR, Math.sin(a) * 0.32, Math.sin(a) * orbR * 0.45);
      veiled.userData = gWrap.userData;
      gWrap.add(veiled);
    }

    const label = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createClassicalStarChartLabel(u.title, u.sub),
        transparent: true,
        depthWrite: false,
      })
    );
    label.position.set(0, u.labelY, 0.6);
    label.scale.set(...u.labelScale);
    gWrap.add(label);

    group.add(gWrap);
    unknownGalaxies.push({ wrap: gWrap, disc, hitSphere, basePos: [...u.pos], baseY: u.pos[1] });
  }

  // 3. 四颗超清拉近版「微缩山海星球」（直径约 150-185px，细节纤毫毕现！）
  const miniSpecs = [
    {
      templateId: "yading",
      planetId: "yading",
      founderRole: "mine",
      pos: [-9.8, 3.05, -3.8],
      r: 2.32,
      propScale: 1.44,
      heroYaw: -0.68,
      heroPitch: 0.16,
      low: "#2c6b56",
      mid: "#6da86c",
      high: "#f4f8ff",
      coast: "#bfe6da",
      water: "#0ea5e9",
      halo: "#7dd3fc",
      labelTitle: "🏔️ 亚丁雪峰星",
      labelSub: "清哥 · 苍山星河",
    },
    {
      templateId: "tengger",
      planetId: "tengger",
      founderRole: "mine",
      pos: [10.0, 3.12, -3.9],
      r: 2.35,
      propScale: 1.44,
      heroYaw: -0.45,
      heroPitch: 0.18,
      low: "#b86b2b",
      mid: "#e5a349",
      high: "#fde6b0",
      coast: "#fef3c7",
      water: "#e11d48",
      halo: "#fbbf24",
      labelTitle: "🏜️ 腾格里金沙星",
      labelSub: "绿洲胡杨 · 乌兰红湖",
    },
    {
      templateId: "yili",
      planetId: "kitty-wusun",
      founderRole: "kitty",
      pos: [-4.85, -1.05, -4.4],
      r: 1.98,
      propScale: 1.28,
      heroYaw: 0.42,
      heroPitch: 0.14,
      low: "#2f6f4e",
      mid: "#70b868",
      high: "#eef6ff",
      coast: "#bae6fd",
      water: "#2563eb",
      halo: "#86efac",
      labelTitle: "🌲 天山云杉星",
      labelSub: "毡房牧歌 · 果子沟桥",
    },
    {
      templateId: "maclehose",
      planetId: "maclehose",
      founderRole: "luca",
      pos: [4.95, -0.98, -4.3],
      r: 2.02,
      propScale: 1.30,
      heroYaw: 0.24,
      heroPitch: 0.15,
      low: "#2d6a4f",
      mid: "#68b06b",
      high: "#e8f3dc",
      coast: "#fde68a",
      water: "#0284c7",
      halo: "#38bdf8",
      labelTitle: "🌊 麦理浩海湾星",
      labelSub: "海角灯塔 · 追风白帆",
    },
  ];
  const miniPlanets = miniSpecs.map((s) => {
    const mp = buildDetailedMiniaturePlanet(s);
    group.add(mp.wrap);
    return mp;
  });

  // 4. 古星图金色虚线航迹（串联中央未名星系与四颗微缩星球）
  const constellationPairs = [
    [unknownSpecs[0].pos, miniSpecs[0].pos],
    [unknownSpecs[0].pos, miniSpecs[1].pos],
    [unknownSpecs[0].pos, miniSpecs[2].pos],
    [unknownSpecs[0].pos, miniSpecs[3].pos],
    [miniSpecs[0].pos, miniSpecs[2].pos],
    [miniSpecs[1].pos, miniSpecs[3].pos],
  ];
  const lineMat = new THREE.LineDashedMaterial({
    color: "#f0c768",
    transparent: true,
    opacity: 0.26,
    dashSize: 0.42,
    gapSize: 0.34,
  });
  for (const [pA, pB] of constellationPairs) {
    const lGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(...pA),
      new THREE.Vector3(...pB),
    ]);
    const line = new THREE.Line(lGeo, lineMat);
    line.computeLineDistances();
    group.add(line);
  }

  // 5. 底端中央无遮挡高山松林营地底座
  const { pedestal, flame, fireLight, roseGroup, surfaceAt } = buildAlpineHikerPedestal();
  group.add(pedestal);

  const clickableMeshes = [
    ...unknownGalaxies.map((u) => u.hitSphere),
    ...miniPlanets.map((m) => m.hitMesh),
  ];

  let hoveredWrap = null;
  let targetParallaxX = 0;
  let targetParallaxY = 0;
  let curParallaxX = 0;
  let curParallaxY = 0;

  function getClickableMeshes() {
    return clickableMeshes;
  }

  function setHoveredWrap(w) {
    hoveredWrap = w || null;
  }

  function setParallax(nx, ny) {
    targetParallaxX = THREE.MathUtils.clamp(nx, -1, 1) * 0.55;
    targetParallaxY = THREE.MathUtils.clamp(ny, -1, 1) * 0.28;
  }

  // 自适应视口布局：窄屏手机端底栏上下叠放时，自动收拢横向跨度并抬高前景山脊与小人
  function setViewportLayout(width, height) {
    const isNarrow = width <= 960;
    const xMul = isNarrow ? 0.54 : 1.0;
    const yAdd = isNarrow ? 1.45 : 0.0;
    miniPlanets.forEach((mp) => {
      mp.wrap.position.x = mp.basePos[0] * xMul;
      mp.baseY = mp.basePos[1] + yAdd;
    });
    unknownGalaxies.forEach((u, idx) => {
      u.wrap.position.x = u.basePos[0] * (isNarrow ? 0.56 : 1.0);
      u.baseY = u.basePos[1] + (idx === 0 && isNarrow ? 2.2 : yAdd);
      if (idx > 0) u.wrap.visible = !isNarrow;
    });
    if (isNarrow) {
      pedestal.position.set(0, -7.25, 4.4);
      pedestal.scale.setScalar(0.84);
    } else {
      const aspectAdjust = height < 820 ? 0.35 : 0;
      pedestal.position.set(0, -9.65 + aspectAdjust, 5.8);
      pedestal.scale.setScalar(1.0);
    }
  }

  function update(dt = 0.016, elapsed = 0) {
    const t = elapsed || 0;
    curParallaxX += (targetParallaxX - curParallaxX) * Math.min(1, dt * 4.5);
    curParallaxY += (targetParallaxY - curParallaxY) * Math.min(1, dt * 4.5);
    group.rotation.y = curParallaxX * 0.06;
    group.rotation.x = -curParallaxY * 0.04;

    deepStars.rotation.y = t * 0.008;

    unknownGalaxies.forEach((u, idx) => {
      u.disc.rotation.z = t * (idx % 2 === 0 ? 0.09 : -0.075);
      u.wrap.position.y = u.baseY + Math.sin(t * 0.65 + idx * 1.7) * 0.16;
      const goalScale = hoveredWrap === u.wrap ? 1.1 : 1.0;
      u.wrap.scale.lerp(new THREE.Vector3(goalScale, goalScale, goalScale), Math.min(1, dt * 8));
    });

    // 星球以黄金正面视角做 ±15° 柔和呼吸微摆（避免转到荒芜背面），流云则 360° 环绕飘行！
    miniPlanets.forEach((mp, idx) => {
      mp.bodyGroup.rotation.y = mp.heroYaw + Math.sin(t * 0.36 + idx * 1.5) * 0.26;
      mp.cloudOrbit.rotation.y = t * (0.22 + idx * 0.03) * (idx % 2 === 0 ? 1 : -1);
      mp.wrap.position.y = mp.baseY + Math.sin(t * 0.72 + idx * 1.4) * 0.16;
      const goalScale = hoveredWrap === mp.wrap ? 1.12 : 1.0;
      mp.wrap.scale.lerp(new THREE.Vector3(goalScale, goalScale, goalScale), Math.min(1, dt * 8));
    });

    if (flame && fireLight) {
      const flicker = 0.92 + Math.sin(t * 11.5) * 0.1 + Math.cos(t * 17.3) * 0.06;
      flame.scale.setScalar(flicker);
      fireLight.intensity = 1.45 * flicker;
    }
    if (roseGroup) {
      roseGroup.rotation.z = Math.sin(t * 1.3) * 0.03;
    }
  }

  return {
    id: "prologue-cosmos",
    group,
    pedestal,
    surfaceAt,
    getClickableMeshes,
    setHoveredWrap,
    setParallax,
    setViewportLayout,
    update,
  };
}


