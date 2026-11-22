import * as THREE from "three";
import { STORYBOOK_GRAD } from "./sphereMath.js?v=5.3.1-uncharted-galaxies";

/**
 * 绘制《小王子》水彩绘本风暮光天幕贴图：
 * 上方是柔和的矢车菊蓝与鸢尾紫，中下部晕染开蜂蜜金、杏桃粉与晨雾奶白，彻底告别压抑暗黑感！
 */
function createWatercolourTwilightSky() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0.0, "#1d356b");  // 顶部清透暮蓝
  grad.addColorStop(0.32, "#325194"); // 矢车菊星蓝
  grad.addColorStop(0.62, "#5c65a8"); // 薰衣草柔紫
  grad.addColorStop(0.84, "#c87d92"); // 晚霞玫瑰粉
  grad.addColorStop(1.0, "#f5be7d");  // 天际线暖杏金
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // 水彩云絮晕染斑块（柔和粉彩笔触）
  const washes = [
    { x: 110, y: 150, r: 170, col: "rgba(147, 197, 253, 0.24)" },
    { x: 405, y: 145, r: 175, col: "rgba(249, 168, 212, 0.24)" },
    { x: 256, y: 240, r: 210, col: "rgba(253, 230, 138, 0.20)" },
    { x: 95, y: 340, r: 165, col: "rgba(167, 243, 208, 0.20)" },
    { x: 420, y: 345, r: 170, col: "rgba(254, 215, 170, 0.26)" },
  ];
  for (const w of washes) {
    const g = ctx.createRadialGradient(w.x, w.y, 6, w.x, w.y, w.r);
    g.addColorStop(0, w.col);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 绘制手绘水彩星云团贴图（像绘本里柔和晕染的棉花糖彩色星团，温暖明亮）
 */
function createPastelNebulaPatch(centerHex, edgeHex) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const c1 = new THREE.Color(centerHex);
  const c2 = new THREE.Color(edgeHex);
  const rgb = (c, a) =>
    `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${a})`;

  const g = ctx.createRadialGradient(128, 128, 4, 128, 128, 124);
  g.addColorStop(0, "rgba(255,254,248,0.72)");
  g.addColorStop(0.28, rgb(c1, 0.52));
  g.addColorStop(0.66, rgb(c2, 0.24));
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 绘制《小王子》四芒十字手绘小星星贴图
 */
function createFourPointStarTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");

  const glow = ctx.createRadialGradient(32, 32, 0, 32, 32, 28);
  glow.addColorStop(0, "rgba(255, 252, 235, 1)");
  glow.addColorStop(0.35, "rgba(254, 240, 138, 0.65)");
  glow.addColorStop(1, "rgba(254, 240, 138, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 64, 64);

  ctx.fillStyle = "#fffef5";
  ctx.beginPath();
  ctx.moveTo(32, 4);
  ctx.quadraticCurveTo(34.5, 29.5, 60, 32);
  ctx.quadraticCurveTo(34.5, 34.5, 32, 60);
  ctx.quadraticCurveTo(29.5, 34.5, 4, 32);
  ctx.quadraticCurveTo(29.5, 29.5, 32, 4);
  ctx.closePath();
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 绘制《小王子》古典手绘星图风「未知星系旋涡星云圆盘贴图」（乳白鎏金虚线星轨 + 水彩柔光旋臂）
 */
function createChartSwirlTexture(tintHex = "#e0e7ff") {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const cx = 128;
  const cy = 128;
  const c = new THREE.Color(tintHex);
  const rgb = (a) => `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${a})`;

  const base = ctx.createRadialGradient(cx, cy, 4, cx, cy, 122);
  base.addColorStop(0, "rgba(255, 253, 244, 0.78)");
  base.addColorStop(0.38, rgb(0.42));
  base.addColorStop(0.78, rgb(0.14));
  base.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);

  ctx.save();
  ctx.strokeStyle = "rgba(254, 240, 138, 0.65)";
  ctx.lineWidth = 1.8;
  ctx.setLineDash([7, 6]);
  ctx.beginPath();
  ctx.arc(cx, cy, 102, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 66, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  for (let arm = 0; arm < 2; arm++) {
    ctx.strokeStyle = arm === 0 ? "rgba(255, 251, 235, 0.62)" : rgb(0.55);
    ctx.lineWidth = 5.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    for (let s = 0; s < 42; s++) {
      const t = s / 42;
      const ang = arm * Math.PI + t * 3.6;
      const rad = 10 + t * 98;
      const x = cx + Math.cos(ang) * rad;
      const y = cy + Math.sin(ang) * rad;
      if (s === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 绘制手绘绘本风「未知星系微缩星图铭牌」贴图（如「✦ 未知星系 · B-???」）
 */
function createUnknownLabelTexture(titleText, subText = "") {
  const canvas = document.createElement("canvas");
  canvas.width = 340;
  canvas.height = 104;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "rgba(38, 54, 102, 0.58)";
  ctx.strokeStyle = "rgba(253, 230, 138, 0.78)";
  ctx.lineWidth = 2.2;
  ctx.setLineDash([7, 5]);
  ctx.beginPath();
  ctx.roundRect(12, 14, 316, subText ? 76 : 58, 30);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.textAlign = "center";
  ctx.fillStyle = "#fef3c7";
  ctx.font = "600 24px 'Songti SC', 'Kaiti SC', serif";
  ctx.fillText(titleText, 170, subText ? 46 : 51);

  if (subText) {
    ctx.fillStyle = "rgba(224, 242, 254, 0.92)";
    ctx.font = "17px 'Songti SC', serif";
    ctx.fillText(subText, 170, 74);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 构建一颗《小王子》绘本插画风的彩色迷你星球（MeshToonMaterial 水彩阶梯色 + 积雪圆润小山尖 + 小松树/帐篷/风车 + 金色星轨环）
 */
function buildStorybookMiniPlanet(spec) {
  const wrap = new THREE.Group();
  wrap.position.set(...spec.pos);
  const r = spec.r;

  const bodyMat = new THREE.MeshToonMaterial({
    color: spec.color,
    gradientMap: STORYBOOK_GRAD,
  });
  const sphere = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 3), bodyMat);
  wrap.add(sphere);

  // 柔和暖色大气光圈（非暗黑日食，而是水彩温暖光晕）
  const haloMat = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    uniforms: { uColor: { value: new THREE.Color(spec.halo || "#fde68a") } },
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
        float rim = pow(clamp(1.0 + dot(vNormal, viewDir), 0.0, 1.0), 2.2);
        gl_FragColor = vec4(uColor, rim * 0.52);
      }
    `,
  });
  wrap.add(new THREE.Mesh(new THREE.SphereGeometry(r * 1.22, 28, 20), haloMat));

  // 星球表面圆润可爱的雪顶小山峰
  const snowMat = new THREE.MeshToonMaterial({ color: "#fffdf7", gradientMap: STORYBOOK_GRAD });
  const peakMat = new THREE.MeshToonMaterial({ color: spec.peakColor || "#84a98c", gradientMap: STORYBOOK_GRAD });
  const peakDirs = [
    new THREE.Vector3(0.25, 0.92, 0.28).normalize(),
    new THREE.Vector3(-0.52, 0.78, 0.34).normalize(),
    new THREE.Vector3(0.68, 0.55, 0.48).normalize(),
  ];
  peakDirs.forEach((dir, idx) => {
    const h = r * (0.42 - idx * 0.06);
    const coneGrp = new THREE.Group();
    const cone = new THREE.Mesh(new THREE.ConeGeometry(r * 0.26, h, 7), peakMat);
    cone.position.y = h * 0.42;
    const snowCap = new THREE.Mesh(new THREE.ConeGeometry(r * 0.13, h * 0.46, 7), snowMat);
    snowCap.position.y = h * 0.66;
    coneGrp.add(cone, snowCap);
    coneGrp.position.copy(dir).multiplyScalar(r * 0.95);
    coneGrp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    wrap.add(coneGrp);
  });

  // 2 棵童话小松树 + 1 顶暖橙小帐篷
  const treeMat = new THREE.MeshToonMaterial({ color: spec.treeColor || "#3b875e", gradientMap: STORYBOOK_GRAD });
  const trunkMat = new THREE.MeshToonMaterial({ color: "#8c5a3c", gradientMap: STORYBOOK_GRAD });
  for (const tDir of [
    new THREE.Vector3(-0.22, 0.52, 0.82).normalize(),
    new THREE.Vector3(0.42, -0.35, 0.84).normalize(),
  ]) {
    const tg = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.025, r * 0.035, r * 0.14, 6), trunkMat);
    trunk.position.y = r * 0.07;
    const crown1 = new THREE.Mesh(new THREE.ConeGeometry(r * 0.12, r * 0.22, 7), treeMat);
    crown1.position.y = r * 0.2;
    const crown2 = new THREE.Mesh(new THREE.ConeGeometry(r * 0.09, r * 0.18, 7), treeMat);
    crown2.position.y = r * 0.31;
    tg.add(trunk, crown1, crown2);
    tg.position.copy(tDir).multiplyScalar(r * 0.98);
    tg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tDir);
    wrap.add(tg);
  }

  if (spec.hasTent) {
    const tentDir = new THREE.Vector3(0.08, 0.62, 0.78).normalize();
    const tent = new THREE.Mesh(
      new THREE.ConeGeometry(r * 0.13, r * 0.18, 4),
      new THREE.MeshToonMaterial({ color: "#fb923c", gradientMap: STORYBOOK_GRAD })
    );
    tent.position.copy(tentDir).multiplyScalar(r * 1.05);
    tent.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tentDir);
    wrap.add(tent);
  }

  // 环绕小星球的软萌白朵云
  const cloudGrp = new THREE.Group();
  const cloudMat = new THREE.MeshToonMaterial({ color: "#fffaf0", gradientMap: STORYBOOK_GRAD });
  for (let c = 0; c < 2; c++) {
    const cg = new THREE.Group();
    const ang = c * Math.PI + 0.5;
    [-0.12, 0, 0.12].forEach((ox, i) => {
      const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(r * (i === 1 ? 0.13 : 0.095), 1), cloudMat);
      puff.position.x = ox * r * 1.3;
      cg.add(puff);
    });
    cg.position.set(Math.cos(ang) * r * 1.35, (c === 0 ? 0.28 : -0.22) * r, Math.sin(ang) * r * 1.35);
    cloudGrp.add(cg);
  }
  wrap.add(cloudGrp);

  // 可选：金色/粉彩星轨细环
  let ringMesh = null;
  if (spec.ringColor) {
    ringMesh = new THREE.Mesh(
      new THREE.TorusGeometry(r * 1.52, r * 0.025, 8, 64),
      new THREE.MeshBasicMaterial({ color: spec.ringColor, transparent: true, opacity: 0.72 })
    );
    ringMesh.rotation.set(1.18, 0.25, -0.32);
    wrap.add(ringMesh);
  }

  return { wrap, sphere, cloudGrp, ringMesh, baseY: spec.pos[1], phase: spec.phase || 0 };
}

/**
 * 构建未登录首屏《小王子 · 山海皆星辰》童话水彩绘本总扉页 3D 场景：
 * - 温暖暮蓝→薰衣草粉→晚霞杏金手绘水彩天幕（彻底摆脱暗黑风！）
 * - 多座粉彩水彩星云群落与细金线串联的星座小星球（对应多位已入驻星主的星系缩影）
 * - 远景柔雾晨光中的待命名未知小星球剪影
 * - 最底端保留B-612童话风绿茵小野花小行星 + 红玫瑰玻璃罩 + 铸铁暖黄小路灯 + 小人伫立仰望漫天星辰！
 */
export function buildPrologueCosmosWorld() {
  const group = new THREE.Group();
  const miniPlanets = [];
  const nebulaSprites = [];

  const starTex = createFourPointStarTexture();

  // 1. 《小王子》水彩暮霞天幕背景板
  const skyPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(140, 88),
    new THREE.MeshBasicMaterial({ map: createWatercolourTwilightSky(), depthWrite: false })
  );
  skyPlane.position.set(0, 1.5, -36);
  group.add(skyPlane);

  // 2. 四座粉彩水彩星云缩影群落（琥珀苍山星云、蜜桃猫耳星云、薄荷绵羊星云、晴空追风星云）
  const nebulaSpecs = [
    { pos: [-14.2, 6.8, -16], scale: 14.5, c1: "#fde68a", c2: "#fb923c" },
    { pos: [14.6, 7.2, -16.5], scale: 14.0, c1: "#fbcfe8", c2: "#c084fc" },
    { pos: [-14.8, -3.6, -17], scale: 12.8, c1: "#a7f3d0", c2: "#38bdf8" },
    { pos: [15.0, -3.2, -16.2], scale: 13.2, c1: "#bae6fd", c2: "#818cf8" },
  ];
  nebulaSpecs.forEach((n, i) => {
    const sp = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createPastelNebulaPatch(n.c1, n.c2),
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      })
    );
    sp.position.set(...n.pos);
    sp.scale.setScalar(n.scale);
    group.add(sp);
    nebulaSprites.push({ sp, baseScale: n.scale, phase: i * 1.4 });
  });

  // 3. 漫天手绘金色四芒星与童话星座金色虚线连线
  const starCount = 260;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    starPos[i * 3] = (Math.random() - 0.5) * 56;
    starPos[i * 3 + 1] = -8 + Math.random() * 28;
    starPos[i * 3 + 2] = -14 - Math.random() * 18;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  const fourPointStars = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({
      size: 0.95,
      map: starTex,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  group.add(fourPointStars);

  // 4. 环绕中央绘本卡片的《小王子》水彩彩色迷你徒步星球群（圆润雪峰 + 小松树 + 白朵云 + 金色星环）
  const litSpecs = [
    {
      pos: [-11.8, 5.4, -8.2],
      r: 2.05,
      color: "#eab308", // 金色腾格里沙丘星
      peakColor: "#d97706",
      treeColor: "#4d7c0f",
      halo: "#fef08a",
      ringColor: "#fde68a",
      hasTent: true,
      phase: 0.3,
    },
    {
      pos: [12.2, 5.6, -8.6],
      r: 2.15,
      color: "#f472b6", // 蜜桃樱花晚霞星
      peakColor: "#fb7185",
      treeColor: "#2dd4bf",
      halo: "#fbcfe8",
      ringColor: "#fed7aa",
      hasTent: true,
      phase: 1.7,
    },
    {
      pos: [-12.4, -3.4, -9.2],
      r: 1.85,
      color: "#4ade80", // 翡翠高山草甸星
      peakColor: "#34d399",
      treeColor: "#15803d",
      halo: "#bbf7d0",
      ringColor: null,
      hasTent: false,
      phase: 3.1,
    },
    {
      pos: [12.6, -3.0, -8.8],
      r: 1.92,
      color: "#60a5fa", // 蔚蓝海湾骑行星
      peakColor: "#38bdf8",
      treeColor: "#10b981",
      halo: "#bae6fd",
      ringColor: "#fef08a",
      hasTent: false,
      phase: 4.4,
    },
  ];

  for (const s of litSpecs) {
    const mp = buildStorybookMiniPlanet(s);
    group.add(mp.wrap);
    miniPlanets.push(mp);
  }

  // 左翼与右翼绘本金色星座连线（把同星系的小星球串联成星座）
  for (const pair of [
    [litSpecs[0].pos, [-15.2, 1.2, -13.5], litSpecs[2].pos],
    [litSpecs[1].pos, [15.6, 1.5, -13.8], litSpecs[3].pos],
  ]) {
    const curvePts = pair.map((p) => new THREE.Vector3(...p));
    const lineGeo = new THREE.BufferGeometry().setFromPoints(curvePts);
    const line = new THREE.Line(
      lineGeo,
      new THREE.LineDashedMaterial({
        color: "#fde68a",
        dashSize: 0.45,
        gapSize: 0.32,
        transparent: true,
        opacity: 0.55,
      })
    );
    line.computeLineDistances();
    group.add(line);
  }

  // 5. 暮霞深处的「未知星系群落（Uncharted Galaxies）」：
  // 手绘古典星图旋涡圆盘 + 多颗柔雾未命名小星球串联成虚线星座 + 悬停绘本问号铭牌！
  const unknownGalaxies = [];
  const unchartedSpecs = [
    {
      center: [-15.8, 1.1, -13.5],
      tilt: [0.95, 0.28, -0.22],
      discSize: 8.6,
      tint: "#c4b5fd",
      title: "✦ 未知星系 · ？",
      sub: "待新行者点亮命名",
      satellites: [
        [-1.8, 0.5, 0.4, 0.72],
        [0.2, 0.15, -0.2, 1.08],
        [2.1, -0.45, 0.5, 0.64],
      ],
      phase: 0.6,
    },
    {
      center: [16.0, 1.3, -13.8],
      tilt: [0.92, -0.30, 0.24],
      discSize: 8.8,
      tint: "#bae6fd",
      title: "✦ 迷雾星云 · B-???",
      sub: "尚无足迹抵达的远方",
      satellites: [
        [-2.0, -0.3, 0.5, 0.68],
        [-0.1, 0.2, 0.1, 1.12],
        [1.9, 0.55, -0.4, 0.76],
      ],
      phase: 2.1,
    },
    {
      center: [-6.6, 10.2, -16.2],
      tilt: [1.05, 0.18, -0.15],
      discSize: 7.4,
      tint: "#fbcfe8",
      title: "✦ 无名星座 · ？",
      sub: "",
      satellites: [
        [-1.5, 0.2, 0.3, 0.58],
        [0.3, 0.0, 0.0, 0.92],
        [1.7, -0.25, -0.2, 0.55],
      ],
      phase: 3.5,
    },
    {
      center: [6.8, 10.4, -16.5],
      tilt: [1.02, -0.22, 0.18],
      discSize: 7.2,
      tint: "#fde68a",
      title: "✦ 远方星群 · ？",
      sub: "",
      satellites: [
        [-1.4, -0.2, 0.2, 0.56],
        [0.1, 0.1, 0.1, 0.88],
        [1.6, 0.3, -0.3, 0.60],
      ],
      phase: 4.9,
    },
  ];

  for (const ug of unchartedSpecs) {
    const ugWrap = new THREE.Group();
    ugWrap.position.set(...ug.center);

    // (a) 古典绘本手绘旋涡星云圆盘（倾斜透视，缓慢自转）
    const swirlDisc = new THREE.Mesh(
      new THREE.PlaneGeometry(ug.discSize, ug.discSize),
      new THREE.MeshBasicMaterial({
        map: createChartSwirlTexture(ug.tint),
        transparent: true,
        opacity: 0.88,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    swirlDisc.rotation.set(...ug.tilt);
    ugWrap.add(swirlDisc);

    // (b) 构成这座未知星系的多颗柔雾粉蓝未探索小星球 + 虚线星座连线
    const satPts = [];
    for (const [sx, sy, sz, sr] of ug.satellites) {
      const pPos = new THREE.Vector3(sx, sy, sz);
      satPts.push(pPos);
      const mistPlanet = new THREE.Mesh(
        new THREE.IcosahedronGeometry(sr, 2),
        new THREE.MeshToonMaterial({
          color: "#818cf8",
          gradientMap: STORYBOOK_GRAD,
          transparent: true,
          opacity: 0.78,
        })
      );
      mistPlanet.position.copy(pPos);
      ugWrap.add(mistPlanet);

      // 外围金色虚线待探索光环
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(sr * 1.38, 0.025, 6, 32),
        new THREE.MeshBasicMaterial({ color: "#fef08a", transparent: true, opacity: 0.55 })
      );
      ring.position.copy(pPos);
      ring.rotation.set(1.2, 0.3, -0.2);
      ugWrap.add(ring);
    }

    const constLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(satPts),
      new THREE.LineDashedMaterial({
        color: "#fef08a",
        dashSize: 0.28,
        gapSize: 0.22,
        transparent: true,
        opacity: 0.72,
      })
    );
    constLine.computeLineDistances();
    ugWrap.add(constLine);

    // (c) 悬停在未知星系上方的《小王子》绘本虚线铭牌（「✦ 未知星系 · ？」）
    const labelSp = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createUnknownLabelTexture(ug.title, ug.sub),
        transparent: true,
        opacity: 0.92,
        depthWrite: false,
      })
    );
    labelSp.position.set(0, ug.sub ? 2.15 : 1.75, 0.6);
    labelSp.scale.set(ug.sub ? 4.8 : 4.1, ug.sub ? 1.48 : 1.26, 1);
    ugWrap.add(labelSp);

    group.add(ugWrap);
    unknownGalaxies.push({ ugWrap, swirlDisc, labelSp, baseY: ug.center[1], phase: ug.phase });
  }

  // 6. 最底端保留并精心雕琢：B-612 童话风绿茵野花小行星 + 小人伫立仰望 + 红玫瑰玻璃罩 + 暖黄铸铁小路灯！
  const pedestal = buildLittlePrinceHomePedestal();
  group.add(pedestal);

  return {
    group,
    pedestal,
    waypointObjs: [],
    update(dt, elapsed) {
      for (const mp of miniPlanets) {
        mp.wrap.position.y = mp.baseY + Math.sin(elapsed * 0.85 + mp.phase) * 0.22;
        mp.sphere.rotation.y = elapsed * 0.16;
        if (mp.cloudGrp) mp.cloudGrp.rotation.y = -elapsed * 0.24;
        if (mp.ringMesh) mp.ringMesh.rotation.z = -0.32 + Math.sin(elapsed * 0.4 + mp.phase) * 0.06;
      }
      for (const nb of nebulaSprites) {
        const s = nb.baseScale * (1 + Math.sin(elapsed * 0.5 + nb.phase) * 0.04);
        nb.sp.scale.setScalar(s);
      }
      for (const ug of unknownGalaxies) {
        ug.ugWrap.position.y = ug.baseY + Math.sin(elapsed * 0.65 + ug.phase) * 0.2;
        ug.swirlDisc.rotation.z += dt * 0.16;
        ug.labelSp.material.opacity = 0.78 + Math.sin(elapsed * 1.6 + ug.phase) * 0.18;
      }
      fourPointStars.rotation.z = Math.sin(elapsed * 0.06) * 0.02;
    },
  };
}

/**
 * 最底端前景 B-612《小王子》绿茵野花初生星球座：
 * 温润抹茶草地弧面 + 遍野五彩绘本小野花 + 玻璃罩红玫瑰 + 暖黄街灯 + 木质观星长椅
 */
function buildLittlePrinceHomePedestal() {
  const pedestal = new THREE.Group();
  pedestal.position.set(0, -9.85, 5.8);
  const R = 5.6;

  // 温润嫩绿草甸球面（水彩阶梯着色）
  const grassSphere = new THREE.Mesh(
    new THREE.IcosahedronGeometry(R, 3),
    new THREE.MeshToonMaterial({
      color: "#68b678",
      gradientMap: STORYBOOK_GRAD,
    })
  );
  pedestal.add(grassSphere);

  // 小王子星球标志性的微缩火山口浅坑与石阶小径
  const craterMat = new THREE.MeshToonMaterial({ color: "#eab308", gradientMap: STORYBOOK_GRAD });
  for (const [x, y, z] of [
    [-2.2, 4.95, 1.4],
    [2.4, 4.8, 1.6],
  ]) {
    const dir = new THREE.Vector3(x, y, z).normalize();
    const crater = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.08, 7, 16), craterMat);
    crater.position.copy(dir).multiplyScalar(R - 0.02);
    crater.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
    pedestal.add(crater);
  }

  // 遍野彩色绘本小野花簇
  const flowerColors = ["#fef08a", "#fda4af", "#fffbeb", "#fbcfe8", "#bae6fd"];
  for (let i = 0; i < 42; i++) {
    const theta = ((i * 137.5) % 360) * (Math.PI / 180);
    const phi = 0.08 + (i / 42) * 0.52;
    const dir = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta),
      Math.cos(phi),
      Math.sin(phi) * Math.sin(theta)
    ).normalize();
    const fl = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.085, 0),
      new THREE.MeshBasicMaterial({ color: flowerColors[i % flowerColors.length] })
    );
    fl.position.copy(dir).multiplyScalar(R + 0.04);
    pedestal.add(fl);
  }

  // 右侧：B-612 透明玻璃罩下的红玫瑰（The Rose under a Glass Dome）
  const roseGrp = new THREE.Group();
  const roseDir = new THREE.Vector3(0.24, 0.95, 0.19).normalize();
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.36, 6),
    new THREE.MeshBasicMaterial({ color: "#15803d" })
  );
  stem.position.y = 0.18;
  const bloom = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.12, 1),
    new THREE.MeshToonMaterial({ color: "#f43f5e", gradientMap: STORYBOOK_GRAD })
  );
  bloom.position.y = 0.38;
  const dome = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.25, 0.56, 16, 1, false),
    new THREE.MeshBasicMaterial({
      color: "#e0f2fe",
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    })
  );
  dome.position.y = 0.28;
  roseGrp.add(stem, bloom, dome);
  roseGrp.position.copy(roseDir).multiplyScalar(R - 0.02);
  roseGrp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), roseDir);
  pedestal.add(roseGrp);

  // 左侧：《小王子》点灯人的暖光复古铸铁小路灯，温柔照亮小人背影！
  const lampGrp = new THREE.Group();
  const lampDir = new THREE.Vector3(-0.34, 0.92, 0.16).normalize();
  const postMat = new THREE.MeshStandardMaterial({ color: "#334155", roughness: 0.7 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 1.35, 8), postMat);
  pole.position.y = 0.67;
  const lantern = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.18, 1),
    new THREE.MeshBasicMaterial({ color: "#fef08a" })
  );
  lantern.position.y = 1.42;
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.14, 7), postMat);
  cap.position.y = 1.56;
  const warmLight = new THREE.PointLight("#fde047", 2.4, 8.5, 1.4);
  warmLight.position.set(0, 1.4, 0.15);
  lampGrp.add(pole, lantern, cap, warmLight);
  lampGrp.position.copy(lampDir).multiplyScalar(R - 0.03);
  lampGrp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), lampDir);
  pedestal.add(lampGrp);

  return pedestal;
}

