import * as THREE from "three";

/**
 * 生成高精度手绘感旋臂星云圆盘贴图（发光星核 + 彩色气体旋臂 + 星团亮点）
 * 解决纯粒子点在远景下稀疏发黑的问题，让每座微型星系都拥有浓郁饱满的星云体积光！
 */
function createSpiralGalaxyCanvas(coreHex, midHex, outerHex, arms = 3) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const cx = size / 2;
  const cy = size / 2;

  const cCore = new THREE.Color(coreHex);
  const cMid = new THREE.Color(midHex);
  const cOut = new THREE.Color(outerHex);
  const rgb = (c, a) =>
    `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${a})`;

  // 1. 柔和底层椭圆银晕（Galactic Halo）
  const baseGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, size * 0.49);
  baseGrad.addColorStop(0, "rgba(255,253,245,0.98)");
  baseGrad.addColorStop(0.14, rgb(cCore, 0.88));
  baseGrad.addColorStop(0.38, rgb(cMid, 0.46));
  baseGrad.addColorStop(0.72, rgb(cOut, 0.16));
  baseGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, size, size);

  // 2. 流转的发光流体旋臂云带（绘制多层柔光笔触）
  ctx.globalCompositeOperation = "lighter";
  for (let a = 0; a < arms; a++) {
    const baseAngle = (a / arms) * Math.PI * 2;
    for (let step = 0; step < 68; step++) {
      const t = step / 68;
      const r = 8 + t * (size * 0.43);
      const theta = baseAngle + t * 3.35;
      const x = cx + Math.cos(theta) * r;
      const y = cy + Math.sin(theta) * r;
      const puffR = (1 - t * 0.55) * 22 + 6;

      const pGrad = ctx.createRadialGradient(x, y, 0, x, y, puffR);
      const col = t < 0.35 ? cCore : t < 0.72 ? cMid : cOut;
      const alpha = (1 - t * 0.78) * 0.22;
      pGrad.addColorStop(0, rgb(col, alpha));
      pGrad.addColorStop(0.55, rgb(cOut, alpha * 0.45));
      pGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.arc(x, y, puffR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 3. 璀璨中心恒星核球高光
  const coreBurst = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.2);
  coreBurst.addColorStop(0, "rgba(255,255,255,1)");
  coreBurst.addColorStop(0.35, rgb(cCore, 0.75));
  coreBurst.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = coreBurst;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.2, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 生成深空星云彩绘背景天幕贴图（摆脱死黑底色，营造绘本级靛蓝-紫金-青岚星海）
 */
function createNebulaBackdropTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  const bg = ctx.createLinearGradient(0, 0, 0, 256);
  bg.addColorStop(0, "#0b1533");
  bg.addColorStop(0.48, "#101f46");
  bg.addColorStop(1, "#091229");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 256);

  ctx.globalCompositeOperation = "lighter";
  const clouds = [
    { x: 110, y: 88, r: 155, col: "rgba(56, 189, 248, 0.20)" },
    { x: 400, y: 82, r: 165, col: "rgba(236, 72, 153, 0.17)" },
    { x: 256, y: 64, r: 180, col: "rgba(139, 92, 246, 0.18)" },
    { x: 135, y: 185, r: 145, col: "rgba(16, 185, 129, 0.15)" },
    { x: 385, y: 188, r: 150, col: "rgba(245, 158, 11, 0.16)" },
  ];
  for (const c of clouds) {
    const g = ctx.createRadialGradient(c.x, c.y, 4, c.x, c.y, c.r);
    g.addColorStop(0, c.col);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 256);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 构建未登录首屏《行者的星球》星海总扉页专属 3D 璀璨星云宇宙场景
 */
export function buildPrologueCosmosWorld() {
  const group = new THREE.Group();
  const galaxies = [];
  const silhouettes = [];

  const glowCanvas = document.createElement("canvas");
  glowCanvas.width = 64;
  glowCanvas.height = 64;
  const gCtx = glowCanvas.getContext("2d");
  const grad = gCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.22, "rgba(255,250,235,0.95)");
  grad.addColorStop(0.55, "rgba(195,228,255,0.42)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  gCtx.fillStyle = grad;
  gCtx.fillRect(0, 0, 64, 64);
  const glowTex = new THREE.CanvasTexture(glowCanvas);

  // 0. 远景彩绘星云天幕 + 斜跨夜空的银河星尘流光带
  const backdropMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(130, 78),
    new THREE.MeshBasicMaterial({ map: createNebulaBackdropTexture(), depthWrite: false })
  );
  backdropMesh.position.set(0, 2, -36);
  group.add(backdropMesh);

  const riverCount = 1400;
  const riverPos = new Float32Array(riverCount * 3);
  const riverCol = new Float32Array(riverCount * 3);
  const cRiverA = new THREE.Color("#fde68a");
  const cRiverB = new THREE.Color("#7dd3fc");
  const cRiverC = new THREE.Color("#f9a8d4");
  const cTmp = new THREE.Color();
  for (let i = 0; i < riverCount; i++) {
    const u = (Math.random() - 0.5) * 68;
    const spread = (Math.random() - 0.5) * 14 * (0.4 + Math.random() * 0.8);
    const angle = 0.42;
    riverPos[i * 3] = u * Math.cos(angle) - spread * Math.sin(angle);
    riverPos[i * 3 + 1] = u * Math.sin(angle) + spread * Math.cos(angle) + 1.5;
    riverPos[i * 3 + 2] = -24 - Math.random() * 10;
    const pick = i % 3 === 0 ? cRiverA : i % 3 === 1 ? cRiverB : cRiverC;
    cTmp.copy(pick).lerp(new THREE.Color("#ffffff"), 0.35);
    riverCol[i * 3] = cTmp.r;
    riverCol[i * 3 + 1] = cTmp.g;
    riverCol[i * 3 + 2] = cTmp.b;
  }
  const riverGeo = new THREE.BufferGeometry();
  riverGeo.setAttribute("position", new THREE.BufferAttribute(riverPos, 3));
  riverGeo.setAttribute("color", new THREE.BufferAttribute(riverCol, 3));
  const starRiver = new THREE.Points(
    riverGeo,
    new THREE.PointsMaterial({
      size: 0.46,
      map: glowTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.68,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  group.add(starRiver);

  // 1. 六座体积光饱满的 3D 旋臂银河系缩影（精准环抱中央卡片四周，发光云盘 + 立体恒星粒子双层辉映）
  const galaxySpecs = [
    { pos: [-13.4, 6.2, -12.0], radius: 5.5, arms: 3, count: 780, coreCol: "#fde68a", midCol: "#f59e0b", outCol: "#ea580c", tilt: [0.68, 0.24, -0.28], speed: 0.11 },
    { pos: [13.8, 6.5, -12.5], radius: 5.3, arms: 4, count: 760, coreCol: "#fbcfe8", midCol: "#f472b6", outCol: "#9333ea", tilt: [0.72, -0.32, 0.26], speed: -0.095 },
    { pos: [-14.2, -4.5, -12.8], radius: 4.9, arms: 3, count: 680, coreCol: "#a7f3d0", midCol: "#34d399", outCol: "#0284c7", tilt: [0.62, 0.38, 0.18], speed: 0.105 },
    { pos: [14.5, -4.2, -12.2], radius: 5.1, arms: 3, count: 700, coreCol: "#bae6fd", midCol: "#38bdf8", outCol: "#4f46e5", tilt: [0.65, -0.26, -0.32], speed: -0.10 },
    { pos: [-5.8, 12.6, -15.5], radius: 4.5, arms: 2, count: 560, coreCol: "#e9d5ff", midCol: "#c084fc", outCol: "#db2777", tilt: [0.78, 0.14, 0.22], speed: 0.08 },
    { pos: [6.4, 12.9, -16.2], radius: 4.3, arms: 3, count: 540, coreCol: "#fef08a", midCol: "#60a5fa", outCol: "#2563eb", tilt: [0.74, -0.18, -0.2], speed: -0.085 },
  ];

  for (const spec of galaxySpecs) {
    const galGroup = new THREE.Group();
    galGroup.position.set(...spec.pos);
    galGroup.rotation.set(...spec.tilt);

    const discTex = createSpiralGalaxyCanvas(spec.coreCol, spec.midCol, spec.outCol, spec.arms);
    const discMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(spec.radius * 2.25, spec.radius * 2.25),
      new THREE.MeshBasicMaterial({
        map: discTex,
        transparent: true,
        opacity: 0.94,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    discMesh.rotation.x = -Math.PI / 2;

    const positions = new Float32Array(spec.count * 3);
    const colors = new Float32Array(spec.count * 3);
    const cCore = new THREE.Color("#ffffff").lerp(new THREE.Color(spec.coreCol), 0.45);
    const cMid = new THREE.Color(spec.midCol);
    const cOut = new THREE.Color(spec.outCol);
    const cMix = new THREE.Color();

    for (let i = 0; i < spec.count; i++) {
      const t = Math.pow(Math.random(), 1.25);
      const r = t * spec.radius;
      const armIdx = i % spec.arms;
      const branchAngle = (armIdx / spec.arms) * Math.PI * 2;
      const spinAngle = t * 3.35;
      const scatter = (1 - t * 0.5) * 0.58;
      positions[i * 3] = Math.cos(branchAngle + spinAngle) * r + (Math.random() - 0.5) * scatter;
      positions[i * 3 + 1] = (Math.random() - 0.5) * scatter * 0.32;
      positions[i * 3 + 2] = Math.sin(branchAngle + spinAngle) * r + (Math.random() - 0.5) * scatter;

      if (t < 0.35) cMix.copy(cCore).lerp(cMid, t / 0.35);
      else cMix.copy(cMid).lerp(cOut, (t - 0.35) / 0.65);
      colors[i * 3] = cMix.r;
      colors[i * 3 + 1] = cMix.g;
      colors[i * 3 + 2] = cMix.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const pts = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        size: 0.62,
        map: glowTex,
        vertexColors: true,
        transparent: true,
        opacity: 0.98,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );

    const coreHalo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        color: spec.coreCol,
        transparent: true,
        opacity: 0.92,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    coreHalo.scale.setScalar(spec.radius * 0.95);

    const spinHolder = new THREE.Group();
    spinHolder.add(discMesh, pts, coreHalo);
    galGroup.add(spinHolder);
    group.add(galGroup);
    galaxies.push({ spinHolder, speed: spec.speed, coreHalo, discMesh, phase: Math.random() * 6.28 });
  }

  return attachSilhouettesAndOutcrop(group, galaxies, silhouettes, glowTex, starRiver);
}

function createFresnelRimMesh(radius, hexColor, intensity = 0.85) {
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    uniforms: {
      uColor: { value: new THREE.Color(hexColor) },
      uPower: { value: 2.3 },
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
      uniform float uPower;
      uniform float uIntensity;
      varying vec3 vNormal;
      varying vec3 vViewPos;
      void main() {
        vec3 viewDir = normalize(vViewPos);
        float rim = pow(clamp(1.0 + dot(vNormal, viewDir), 0.0, 1.0), uPower);
        gl_FragColor = vec4(uColor, rim * uIntensity);
      }
    `,
  });
  return new THREE.Mesh(new THREE.SphereGeometry(radius * 1.24, 32, 24), mat);
}

function attachSilhouettesAndOutcrop(group, galaxies, silhouettes, glowTex, starRiver) {
  // 2. 远处深空悬浮的「待探索山海暗星剪影」（深靛蓝星体 + 菲涅尔大气日冕 + 球面微缩雪峰剪影 + 斜倾星环）
  const silhouetteSpecs = [
    { pos: [-11.4, 0.8, -6.8], r: 2.05, bodyCol: "#0c1938", rimCol: "#38bdf8", hasRing: true, ringCol: "#7dd3fc", phase: 0.4 },
    { pos: [11.8, 1.2, -7.4], r: 2.25, bodyCol: "#1a1638", rimCol: "#fbbf24", hasRing: true, ringCol: "#fde68a", phase: 1.9 },
    { pos: [-10.2, -6.8, -8.5], r: 1.55, bodyCol: "#13183a", rimCol: "#c084fc", hasRing: false, phase: 3.1 },
    { pos: [10.6, -6.5, -8.0], r: 1.68, bodyCol: "#0b2239", rimCol: "#34d399", hasRing: false, phase: 4.5 },
    { pos: [0.2, 11.4, -14.2], r: 2.25, bodyCol: "#101e42", rimCol: "#60a5fa", hasRing: true, ringCol: "#bae6fd", phase: 2.4 },
    { pos: [-14.8, 1.4, -15.5], r: 1.45, bodyCol: "#1f1638", rimCol: "#f472b6", hasRing: false, phase: 5.2 },
    { pos: [15.2, -0.6, -15.0], r: 1.6, bodyCol: "#17203f", rimCol: "#fcd34d", hasRing: false, phase: 0.9 },
  ];

  const sphereGeo = new THREE.IcosahedronGeometry(1, 3);
  const peakGeo = new THREE.ConeGeometry(0.24, 0.52, 5);

  for (const s of silhouetteSpecs) {
    const pWrap = new THREE.Group();
    pWrap.position.set(...s.pos);

    const bodyMat = new THREE.MeshStandardMaterial({
      color: s.bodyCol,
      roughness: 0.85,
      metalness: 0.12,
      emissive: s.bodyCol,
      emissiveIntensity: 0.55,
      flatShading: true,
    });
    const darkBody = new THREE.Mesh(sphereGeo, bodyMat);
    darkBody.scale.setScalar(s.r);
    pWrap.add(darkBody);

    // 球面边缘凸起的微缩山峦剪影，一眼认出这是「长满山峰的徒步星球」
    for (let k = 0; k < 5; k++) {
      const ang = (k / 5) * Math.PI * 2 + s.phase;
      const dir = new THREE.Vector3(Math.cos(ang), Math.sin(ang) * 0.85, 0.18).normalize();
      const peak = new THREE.Mesh(peakGeo, bodyMat);
      peak.scale.setScalar(s.r * (0.75 + (k % 2) * 0.3));
      peak.position.copy(dir).multiplyScalar(s.r * 0.98);
      peak.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      pWrap.add(peak);
    }

    // 3D 菲涅尔背光日冕大气层（无论相机怎么飘，边缘始终透出明亮通透的日食彩光）
    pWrap.add(createFresnelRimMesh(s.r, s.rimCol, 0.92));

    let orbitRing = null;
    if (s.hasRing) {
      orbitRing = new THREE.Mesh(
        new THREE.RingGeometry(s.r * 1.34, s.r * 1.82, 56),
        new THREE.MeshBasicMaterial({
          color: s.ringCol,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.42,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      orbitRing.rotation.set(1.18, 0.28, -0.35);
      pWrap.add(orbitRing);
    }

    // 待点亮微光营地信标
    const beacon = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        color: "#fef08a",
        transparent: true,
        opacity: 0.88,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    beacon.position.set(s.r * 0.45, s.r * 0.78, s.r * 0.52);
    beacon.scale.setScalar(0.62);
    pWrap.add(beacon);

    group.add(pWrap);
    silhouettes.push({ pWrap, baseY: s.pos[1], beacon, orbitRing, phase: s.phase });
  }

  // 3. 底部前景：莹蓝微光草甸「初生观星小行星脊」与双层鎏金星轨仪
  const pedestal = new THREE.Group();
  pedestal.position.set(0, -10.3, 5.2);

  const planetCap = new THREE.Mesh(
    new THREE.IcosahedronGeometry(5.8, 3),
    new THREE.MeshStandardMaterial({
      color: "#152c52",
      roughness: 0.82,
      metalness: 0.1,
      emissive: "#102347",
      emissiveIntensity: 0.5,
      flatShading: true,
    })
  );
  pedestal.add(planetCap);
  pedestal.add(createFresnelRimMesh(5.8, "#60a5fa", 0.58));

  const astrolabeRing1 = new THREE.Mesh(
    new THREE.RingGeometry(6.45, 6.56, 72),
    new THREE.MeshBasicMaterial({
      color: "#fbbf24",
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.48,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  astrolabeRing1.rotation.x = Math.PI * 0.46;

  const astrolabeRing2 = new THREE.Mesh(
    new THREE.RingGeometry(7.35, 7.44, 72),
    new THREE.MeshBasicMaterial({
      color: "#38bdf8",
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.34,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  astrolabeRing2.rotation.set(Math.PI * 0.54, 0.22, 0.14);

  pedestal.add(astrolabeRing1, astrolabeRing2);
  group.add(pedestal);

  return {
    group,
    pedestal,
    waypointObjs: [],
    update(dt, elapsed) {
      for (const g of galaxies) {
        g.spinHolder.rotation.y = elapsed * g.speed;
        g.coreHalo.material.opacity = 0.78 + Math.sin(elapsed * 1.6 + g.phase) * 0.18;
      }
      for (const s of silhouettes) {
        s.pWrap.position.y = s.baseY + Math.sin(elapsed * 0.65 + s.phase) * 0.22;
        s.pWrap.rotation.y = elapsed * 0.06;
        s.beacon.material.opacity = 0.45 + Math.sin(elapsed * 2.6 + s.phase) * 0.45;
        if (s.orbitRing) {
          s.orbitRing.rotation.z = -0.35 + Math.sin(elapsed * 0.3 + s.phase) * 0.08;
        }
      }
      starRiver.rotation.z = Math.sin(elapsed * 0.05) * 0.03;
      astrolabeRing1.rotation.z = elapsed * 0.06;
      astrolabeRing2.rotation.z = -elapsed * 0.04;
    },
  };
}

