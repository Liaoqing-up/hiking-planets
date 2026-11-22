import * as THREE from "three";
import { PLANET_RADIUS, STORYBOOK_GRAD, getSurfaceRadius } from "./sphereMath.js?v=5.3.2-shanhai-astrolabe";

/**
 * 绘制温润深邃的「古星图星云水墨晕染层」（克制的靛青与暗金星尘，融入 #0a1228 星空底色，绝不马卡龙！）
 */
function createAstrolabeNebulaTexture(innerHex, outerHex) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const c1 = new THREE.Color(innerHex);
  const c2 = new THREE.Color(outerHex);
  const rgb = (c, a) =>
    `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${a})`;

  const g = ctx.createRadialGradient(128, 128, 6, 128, 128, 124);
  g.addColorStop(0, rgb(c1, 0.34));
  g.addColorStop(0.45, rgb(c2, 0.16));
  g.addColorStop(1, "rgba(10, 18, 40, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 绘制古典鎏金星盘旋涡贴图（用于远方「未知星系」：细金刻度环 + 银蓝星尘旋臂，克制典雅）
 */
function createUnchartedAstrolabeDisc(armHex = "#7892b8") {
  const canvas = document.createElement("canvas");
  canvas.width = 384;
  canvas.height = 384;
  const ctx = canvas.getContext("2d");
  const cx = 192;
  const cy = 192;
  const armCol = new THREE.Color(armHex);
  const rgbArm = (a) =>
    `rgba(${Math.round(armCol.r * 255)},${Math.round(armCol.g * 255)},${Math.round(armCol.b * 255)},${a})`;

  // 中心微弱古金银雾核
  const core = ctx.createRadialGradient(cx, cy, 2, cx, cy, 175);
  core.addColorStop(0, "rgba(240, 199, 104, 0.38)");
  core.addColorStop(0.28, rgbArm(0.22));
  core.addColorStop(0.72, rgbArm(0.07));
  core.addColorStop(1, "rgba(10, 18, 40, 0)");
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, 384, 384);

  // 古星图同心细金轨线与 36 道罗盘刻度
  ctx.save();
  ctx.strokeStyle = "rgba(240, 199, 104, 0.34)";
  ctx.lineWidth = 1.1;
  ctx.setLineDash([6, 7]);
  ctx.beginPath();
  ctx.arc(cx, cy, 156, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(184, 214, 255, 0.24)";
  ctx.setLineDash([3, 6]);
  ctx.beginPath();
  ctx.arc(cx, cy, 106, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = "rgba(240, 199, 104, 0.28)";
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    const r0 = i % 3 === 0 ? 148 : 152;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    ctx.lineTo(cx + Math.cos(a) * 158, cy + Math.sin(a) * 158);
    ctx.stroke();
  }
  ctx.restore();

  // 双旋臂细腻银金星尘微粒（替代卡通粗线条）
  let seed = 73;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < 420; i++) {
    const t = Math.pow(rand(), 0.78);
    const arm = i % 2;
    const ang = arm * Math.PI + t * 4.2 + (rand() - 0.5) * (0.35 + t * 0.45);
    const rad = 10 + t * 146;
    const x = cx + Math.cos(ang) * rad;
    const y = cy + Math.sin(ang) * rad;
    const sz = (1 - t * 0.55) * (0.8 + rand() * 1.4);
    ctx.fillStyle = rand() > 0.3 ? rgbArm(0.45 * (1 - t * 0.6)) : `rgba(248, 226, 166, ${0.48 * (1 - t * 0.6)})`;
    ctx.beginPath();
    ctx.arc(x, y, sz, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 绘制无边框古典星图细线标注（与游戏内标题/星海卷轴同源字体气质，无卡通胶囊框）
 */
function createClassicalStarChartLabel(titleText, subText = "") {
  const canvas = document.createElement("canvas");
  canvas.width = 384;
  canvas.height = 96;
  const ctx = canvas.getContext("2d");

  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(6, 11, 26, 0.92)";
  ctx.shadowBlur = 10;

  // 两侧渐隐鎏金细横线
  const lg = ctx.createLinearGradient(36, 0, 348, 0);
  lg.addColorStop(0, "rgba(240, 199, 104, 0)");
  lg.addColorStop(0.22, "rgba(240, 199, 104, 0.55)");
  lg.addColorStop(0.5, "rgba(240, 199, 104, 0.15)");
  lg.addColorStop(0.78, "rgba(240, 199, 104, 0.55)");
  lg.addColorStop(1, "rgba(240, 199, 104, 0)");
  ctx.strokeStyle = lg;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(36, 56);
  ctx.lineTo(348, 56);
  ctx.stroke();

  ctx.fillStyle = "rgba(246, 224, 164, 0.92)";
  ctx.font = "500 22px 'Songti SC', 'STSong', 'Kaiti SC', serif";
  ctx.fillText(titleText, 192, 44);

  if (subText) {
    ctx.fillStyle = "rgba(186, 206, 236, 0.78)";
    ctx.font = "16px 'Songti SC', 'STSong', serif";
    ctx.fillText(subText, 192, 78);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 使用与进入游戏后完全同源的 getSurfaceRadius 等高平滑顶点着色算法，
 * 塑造微缩山海真实地貌星球（雪山冰川、金色沙海、云杉草甸、蔚蓝海岸），彻底告别马卡龙塑料球感！
 */
function buildMiniatureRealTerrainPlanet(spec) {
  const wrap = new THREE.Group();
  wrap.position.set(...spec.pos);
  const scaleRatio = spec.r / PLANET_RADIUS;

  const geo = new THREE.SphereGeometry(PLANET_RADIUS, 56, 42);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const cLow = new THREE.Color(spec.low);
  const cMid = new THREE.Color(spec.mid);
  const cHigh = new THREE.Color(spec.high);
  const tmpDir = new THREE.Vector3();
  const tmpCol = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    tmpDir.fromBufferAttribute(pos, i).normalize();
    const r = getSurfaceRadius(spec.templateId, tmpDir);
    pos.setXYZ(i, tmpDir.x * r, tmpDir.y * r, tmpDir.z * r);
    const hNorm = THREE.MathUtils.clamp((r - PLANET_RADIUS + 0.3) / 1.85, 0, 1);
    if (hNorm < 0.46) tmpCol.copy(cLow).lerp(cMid, hNorm / 0.46);
    else tmpCol.copy(cMid).lerp(cHigh, (hNorm - 0.46) / 0.54);
    colors[i * 3] = tmpCol.r;
    colors[i * 3 + 1] = tmpCol.g;
    colors[i * 3 + 2] = tmpCol.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const coreGroup = new THREE.Group();
  coreGroup.scale.setScalar(scaleRatio);

  const terrainMesh = new THREE.Mesh(
    geo,
    new THREE.MeshToonMaterial({
      vertexColors: true,
      gradientMap: STORYBOOK_GRAD,
      transparent: Boolean(spec.opacity),
      opacity: spec.opacity || 1,
    })
  );
  coreGroup.add(terrainMesh);

  if (spec.water) {
    const waterMesh = new THREE.Mesh(
      new THREE.SphereGeometry(PLANET_RADIUS + 0.16, 40, 30),
      new THREE.MeshStandardMaterial({
        color: spec.water,
        roughness: 0.25,
        metalness: 0.1,
        transparent: true,
        opacity: spec.opacity ? 0.45 : 0.78,
      })
    );
    coreGroup.add(waterMesh);
  }

  wrap.add(coreGroup);

  const haloMat = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    uniforms: {
      uColor: { value: new THREE.Color(spec.halo || "#f0c768") },
      uStrength: { value: spec.haloStrength ?? 0.52 },
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
      uniform float uStrength;
      varying vec3 vNormal;
      varying vec3 vViewPos;
      void main() {
        vec3 viewDir = normalize(vViewPos);
        float rim = pow(clamp(1.0 + dot(vNormal, viewDir), 0.0, 1.0), 2.5);
        gl_FragColor = vec4(uColor, rim * uStrength);
      }
    `,
  });
  wrap.add(new THREE.Mesh(new THREE.SphereGeometry(spec.r * 1.24, 32, 24), haloMat));

  let ringMesh = null;
  if (spec.ringColor) {
    ringMesh = new THREE.Mesh(
      new THREE.TorusGeometry(spec.r * 1.54, 0.022, 8, 72),
      new THREE.MeshBasicMaterial({ color: spec.ringColor, transparent: true, opacity: 0.45 })
    );
    ringMesh.rotation.set(1.22, 0.26, -0.28);
    wrap.add(ringMesh);
  }

  return { wrap, coreGroup, ringMesh, baseY: spec.pos[1], phase: spec.phase || 0 };
}

/**
 * 构建与进入游戏后完全同频的《山海古星图 · 行者的星球》总扉页 3D 宇宙：
 * - 延续游戏原生 #0a1228 深邃静谧靛蓝夜空 + 双色闪烁星穹（无缝衔接个人扉页与羊皮星图！）
 * - 近中景：4 颗真实山海等高地貌微缩星球（雪峰冰海、腾格里金沙、天山云杉、蔚蓝海岸）串联成鎏金星轨
 * - 远景：4 座古典鎏金星盘「未知星系」旋涡，内含晨雾靛青色未探索山海星体与细金线古星图角标
 * - 最底端：同源平滑高山草甸雪脊星球弧顶 + 行者小人伫立 + 暖光徒步帐篷篝火 + 松林与小王子玫瑰
 */
export function buildPrologueCosmosWorld() {
  const group = new THREE.Group();
  const miniPlanets = [];
  const unknownGalaxies = [];

  // 1. 低饱和度苍青与流金古星云薄雾（融入 #0a1228 星空，温润通透不暗黑、绝不甜腻卡通）
  const nebulaWashes = [
    { pos: [-14.0, 5.2, -18], scale: 18, c1: "#335c96", c2: "#162a52" },
    { pos: [14.5, 5.6, -18.5], scale: 17.5, c1: "#8c6d3b", c2: "#1b2e56" },
    { pos: [0, -3.5, -20], scale: 22, c1: "#24477a", c2: "#0e1c3a" },
  ];
  for (const nw of nebulaWashes) {
    const sp = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createAstrolabeNebulaTexture(nw.c1, nw.c2),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    sp.position.set(...nw.pos);
    sp.scale.setScalar(nw.scale);
    group.add(sp);
  }

  // 2. 已点亮山海星系代表：与游戏内完全同款地貌着色的 4 颗微缩真实徒步星球
  const litSpecs = [
    {
      // 稻城亚丁三神山雪峰星
      templateId: "yading",
      pos: [-11.8, 5.2, -8.0],
      r: 2.05,
      low: "#b88944",
      mid: "#727f8e",
      high: "#f2f6fc",
      water: "#1c92cf",
      halo: "#7ec8ff",
      ringColor: "#f0c768",
      phase: 0.3,
    },
    {
      // 腾格里金色沙海绿洲星
      templateId: "tengger",
      pos: [12.2, 5.4, -8.4],
      r: 2.1,
      low: "#c6843e",
      mid: "#dfa858",
      high: "#f6e3be",
      water: null,
      halo: "#f0c768",
      ringColor: "#ffe399",
      phase: 1.8,
    },
    {
      // 伊犁天山云杉草甸星
      templateId: "yili",
      pos: [-12.5, -3.3, -9.0],
      r: 1.82,
      low: "#3d754c",
      mid: "#6ba35c",
      high: "#eef5fc",
      water: "#2185d0",
      halo: "#9ed6a0",
      ringColor: null,
      phase: 3.1,
    },
    {
      // 麦理浩蔚蓝海湾山脊星
      templateId: "maclehose",
      pos: [12.6, -3.0, -8.8],
      r: 1.88,
      low: "#467c52",
      mid: "#76a365",
      high: "#eef4fa",
      water: "#1d68b5",
      halo: "#68b5f8",
      ringColor: "#f0c768",
      phase: 4.5,
    },
  ];

  for (const s of litSpecs) {
    const mp = buildMiniatureRealTerrainPlanet(s);
    group.add(mp.wrap);
    miniPlanets.push(mp);
  }

  // 左右两侧古典鎏金星轨虚线，将已点亮微缩星球与远方星系优雅串联
  for (const pts of [
    [litSpecs[0].pos, [-15.8, 1.0, -13.8], litSpecs[2].pos],
    [litSpecs[1].pos, [16.0, 1.2, -14.0], litSpecs[3].pos],
  ]) {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
    const lineGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(36));
    const line = new THREE.Line(
      lineGeo,
      new THREE.LineDashedMaterial({
        color: "#f0c768",
        dashSize: 0.36,
        gapSize: 0.28,
        transparent: true,
        opacity: 0.42,
      })
    );
    line.computeLineDistances();
    group.add(line);
  }

  // 3. 远方深邃星海中的「未知星系群落（Uncharted Astrolabe Galaxies）」：
  // 细金罗盘旋涡星尘盘 + 晨雾苍青色未点亮真实地形星体 + 无边框古典宋体星图角标
  const unchartedSpecs = [
    {
      center: [-16.0, 1.0, -14.2],
      tilt: [1.02, 0.26, -0.2],
      discSize: 9.2,
      armHex: "#7290bc",
      title: "✦ 未名星系 · 待点亮",
      sub: "静候新行者开辟疆域",
      satellites: [
        [-1.9, 0.45, 0.3, 0.66, "zhagana"],
        [0.15, 0.12, -0.15, 1.05, "siguniang"],
        [2.05, -0.4, 0.4, 0.58, "tengger"],
      ],
      phase: 0.7,
    },
    {
      center: [16.2, 1.2, -14.5],
      tilt: [0.98, -0.28, 0.22],
      discSize: 9.4,
      armHex: "#8aa2c4",
      title: "✦ 迷雾星云 · B-???",
      sub: "尚无足迹抵达的山海",
      satellites: [
        [-2.0, -0.35, 0.4, 0.64, "yili"],
        [-0.1, 0.18, 0.1, 1.08, "yading"],
        [1.95, 0.5, -0.35, 0.7, "maclehose"],
      ],
      phase: 2.3,
    },
    {
      center: [-6.8, 10.2, -16.8],
      tilt: [1.08, 0.16, -0.14],
      discSize: 7.4,
      armHex: "#6d88b2",
      title: "✦ 远方未知星群",
      sub: "",
      satellites: [
        [-1.45, 0.2, 0.25, 0.52, "zhagana"],
        [0.25, 0.0, 0.0, 0.86, "yading"],
        [1.65, -0.22, -0.2, 0.5, "yili"],
      ],
      phase: 3.8,
    },
    {
      center: [7.0, 10.4, -17.0],
      tilt: [1.06, -0.2, 0.16],
      discSize: 7.2,
      armHex: "#8c9bb8",
      title: "✦ 隐秘星域 · ？",
      sub: "",
      satellites: [
        [-1.4, -0.18, 0.2, 0.5, "tengger"],
        [0.1, 0.08, 0.1, 0.84, "siguniang"],
        [1.55, 0.28, -0.25, 0.54, "maclehose"],
      ],
      phase: 5.1,
    },
  ];

  for (const ug of unchartedSpecs) {
    const ugWrap = new THREE.Group();
    ugWrap.position.set(...ug.center);

    const swirlDisc = new THREE.Mesh(
      new THREE.PlaneGeometry(ug.discSize, ug.discSize),
      new THREE.MeshBasicMaterial({
        map: createUnchartedAstrolabeDisc(ug.armHex),
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    swirlDisc.rotation.set(...ug.tilt);
    ugWrap.add(swirlDisc);

    // 笼罩在苍青夜雾中的真实山海微缩星体剪影（边缘泛着微弱香槟金晨曦轮廓光）
    const satPts = [];
    for (const [sx, sy, sz, sr, tpl] of ug.satellites) {
      satPts.push(new THREE.Vector3(sx, sy, sz));
      const veiledPlanet = buildMiniatureRealTerrainPlanet({
        templateId: tpl,
        pos: [sx, sy, sz],
        r: sr,
        low: "#1a2947",
        mid: "#2b4068",
        high: "#526d99",
        water: null,
        halo: "#f0c768",
        haloStrength: 0.36,
        opacity: 0.88,
      });
      ugWrap.add(veiledPlanet.wrap);
    }

    const constLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(satPts),
      new THREE.LineDashedMaterial({
        color: "#f0c768",
        dashSize: 0.24,
        gapSize: 0.22,
        transparent: true,
        opacity: 0.42,
      })
    );
    constLine.computeLineDistances();
    ugWrap.add(constLine);

    const labelSp = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createClassicalStarChartLabel(ug.title, ug.sub),
        transparent: true,
        opacity: 0.86,
        depthWrite: false,
      })
    );
    labelSp.position.set(0, ug.sub ? 2.05 : 1.65, 0.5);
    labelSp.scale.set(ug.sub ? 5.2 : 4.5, ug.sub ? 1.3 : 1.12, 1);
    ugWrap.add(labelSp);

    group.add(ugWrap);
    unknownGalaxies.push({ ugWrap, swirlDisc, labelSp, baseY: ug.center[1], phase: ug.phase });
  }

  // 4. 最底端前景：与个人扉页 setupTitleScene 完全同源的高山松林草甸营地星球脊顶 + 小人伫立仰望！
  const { pedestal, fireLight, fireMesh, surfaceAt } = buildAlpineHikerPedestal();
  group.add(pedestal);

  return {
    group,
    pedestal,
    surfaceAt,
    waypointObjs: [],
    update(dt, elapsed) {
      for (const mp of miniPlanets) {
        mp.wrap.position.y = mp.baseY + Math.sin(elapsed * 0.72 + mp.phase) * 0.18;
        mp.coreGroup.rotation.y = elapsed * 0.14;
        if (mp.ringMesh) mp.ringMesh.rotation.z = -0.28 + Math.sin(elapsed * 0.35 + mp.phase) * 0.05;
      }
      for (const ug of unknownGalaxies) {
        ug.ugWrap.position.y = ug.baseY + Math.sin(elapsed * 0.55 + ug.phase) * 0.16;
        ug.swirlDisc.rotation.z += dt * 0.12;
        ug.labelSp.material.opacity = 0.72 + Math.sin(elapsed * 1.4 + ug.phase) * 0.16;
      }
      if (fireLight) {
        fireLight.intensity = 2.2 + Math.sin(elapsed * 7.5) * 0.35;
      }
      if (fireMesh) {
        fireMesh.scale.setScalar(0.95 + Math.sin(elapsed * 9.0) * 0.1);
      }
    },
  };
}

/**
 * 最底端前景高山营地观星星球脊（与进入后的 setupTitleScene 星球地貌 & 材质 100% 同源）：
 * 平滑等高顶点着色山脊 + 苍翠冷杉松林 + 暖光徒步帐篷与跳动篝火 + 玻璃罩红玫瑰 + 金色大气晨曦光边
 */
function buildAlpineHikerPedestal() {
  const pedestal = new THREE.Group();
  pedestal.position.set(0, -10.35, 5.6);
  const scaleRatio = 5.65 / PLANET_RADIUS;

  const geo = new THREE.SphereGeometry(PLANET_RADIUS, 88, 64);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const cLow = new THREE.Color("#3b6e49");
  const cMid = new THREE.Color("#6b9e5c");
  const cHigh = new THREE.Color("#edf3fa");
  const tmpDir = new THREE.Vector3();
  const tmpCol = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    tmpDir.fromBufferAttribute(pos, i).normalize();
    const r = getSurfaceRadius("title", tmpDir);
    pos.setXYZ(i, tmpDir.x * r, tmpDir.y * r, tmpDir.z * r);
    const hNorm = THREE.MathUtils.clamp((r - PLANET_RADIUS + 0.3) / 1.9, 0, 1);
    if (hNorm < 0.48) tmpCol.copy(cLow).lerp(cMid, hNorm / 0.48);
    else tmpCol.copy(cMid).lerp(cHigh, (hNorm - 0.48) / 0.52);
    colors[i * 3] = tmpCol.r;
    colors[i * 3 + 1] = tmpCol.g;
    colors[i * 3 + 2] = tmpCol.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const terrainWrap = new THREE.Group();
  terrainWrap.scale.setScalar(scaleRatio);
  terrainWrap.add(
    new THREE.Mesh(
      geo,
      new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: STORYBOOK_GRAD })
    )
  );
  pedestal.add(terrainWrap);

  // 金色晨曦大气边缘光（与游戏内封面星球同款）
  const rimHalo = new THREE.Mesh(
    new THREE.SphereGeometry(5.65 * 1.16, 40, 28),
    new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: { uColor: { value: new THREE.Color("#f0c768") } },
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
          float rim = pow(clamp(1.0 + dot(vNormal, viewDir), 0.0, 1.0), 2.8);
          gl_FragColor = vec4(uColor, rim * 0.45);
        }
      `,
    })
  );
  pedestal.add(rimHalo);

  const surfaceAt = (dir) => getSurfaceRadius("title", dir) * scaleRatio;

  // 两侧自然苍翠冷杉林（与 planetBuilder3D 同款双层松塔）
  const pineMat = new THREE.MeshToonMaterial({ color: "#2d5a40", gradientMap: STORYBOOK_GRAD });
  const pineTopMat = new THREE.MeshToonMaterial({ color: "#3d7552", gradientMap: STORYBOOK_GRAD });
  const trunkMat = new THREE.MeshToonMaterial({ color: "#5c4033", gradientMap: STORYBOOK_GRAD });
  for (const [tx, ty, tz, sc] of [
    [-0.48, 0.85, 0.22, 0.95],
    [-0.58, 0.78, 0.08, 0.75],
    [0.52, 0.82, 0.20, 0.9],
    [0.62, 0.75, 0.05, 0.72],
  ]) {
    const dir = new THREE.Vector3(tx, ty, tz).normalize();
    const tg = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.24, 6), trunkMat);
    trunk.position.y = 0.12;
    const c1 = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.52, 7), pineMat);
    c1.position.y = 0.42;
    const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.42, 7), pineTopMat);
    c2.position.y = 0.68;
    tg.add(trunk, c1, c2);
    tg.scale.setScalar(sc);
    tg.position.copy(dir).multiplyScalar(surfaceAt(dir) - 0.03);
    tg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    pedestal.add(tg);
  }

  // 右侧：暖橙色徒步营地小帐篷 + 跳动篝火（与进入后的星球营地完全呼应）
  const campDir = new THREE.Vector3(0.26, 0.94, 0.21).normalize();
  const campGrp = new THREE.Group();
  const tent = new THREE.Mesh(
    new THREE.ConeGeometry(0.32, 0.42, 4),
    new THREE.MeshStandardMaterial({
      color: "#e88b35",
      emissive: "#ff9838",
      emissiveIntensity: 0.38,
      roughness: 0.72,
    })
  );
  tent.position.y = 0.2;
  tent.rotation.y = Math.PI * 0.22;
  const fireMesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.095, 0),
    new THREE.MeshBasicMaterial({ color: "#ffd266" })
  );
  fireMesh.position.set(-0.32, 0.1, 0.14);
  const fireLight = new THREE.PointLight("#ffad42", 2.2, 6.5, 1.5);
  fireLight.position.set(-0.32, 0.35, 0.16);
  campGrp.add(tent, fireMesh, fireLight);
  campGrp.position.copy(campDir).multiplyScalar(surfaceAt(campDir) - 0.02);
  campGrp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), campDir);
  pedestal.add(campGrp);

  // 左侧小人近旁：克制雅致的微缩玻璃罩红玫瑰彩蛋（保留《小王子》诗意隐喻而不突兀）
  const roseDir = new THREE.Vector3(-0.26, 0.94, 0.22).normalize();
  const roseGrp = new THREE.Group();
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.014, 0.22, 6),
    new THREE.MeshBasicMaterial({ color: "#2d6a4f" })
  );
  stem.position.y = 0.11;
  const bloom = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.075, 1),
    new THREE.MeshToonMaterial({ color: "#d9465f", gradientMap: STORYBOOK_GRAD })
  );
  bloom.position.y = 0.24;
  const dome = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.16, 0.36, 14),
    new THREE.MeshBasicMaterial({ color: "#dbeafe", transparent: true, opacity: 0.2, depthWrite: false })
  );
  dome.position.y = 0.18;
  roseGrp.add(stem, bloom, dome);
  roseGrp.position.copy(roseDir).multiplyScalar(surfaceAt(roseDir) - 0.01);
  roseGrp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), roseDir);
  pedestal.add(roseGrp);

  return { pedestal, fireLight, fireMesh, surfaceAt };
}

