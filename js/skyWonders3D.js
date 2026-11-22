import * as THREE from "three";
import { getSurfaceRadius, PLANET_RADIUS } from "./sphereMath.js?v=5.2.9-luminous-galaxies";

function drawPlanetLabelCanvas(canvas, text, progressStr = "", isCleared = false) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = isCleared ? "rgba(18, 28, 56, 0.86)" : "rgba(10, 18, 40, 0.78)";
  ctx.strokeStyle = isCleared ? "rgba(255, 216, 112, 0.88)" : "rgba(240, 199, 104, 0.48)";
  ctx.lineWidth = isCleared ? 2.6 : 2;
  ctx.beginPath();
  ctx.roundRect(10, 12, canvas.width - 20, 50, 25);
  ctx.fill();
  ctx.stroke();

  const fullLabel = progressStr ? `✦ ${text} · ${progressStr}` : `✦ ${text}`;
  ctx.font = "600 22px 'PingFang SC', 'Hiragino Sans GB', serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = isCleared ? "#ffe48f" : "#f5d98e";
  ctx.fillText(fullLabel, canvas.width / 2, 38);
}

function makeLabelSprite(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 74;
  drawPlanetLabelCanvas(canvas, text, "", false);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    opacity: 0.62,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(8.8, 1.64, 1);
  sprite.userData = { canvas, tex, baseName: text, lastKey: "" };
  return sprite;
}

/**
 * 构建高精度微缩立体地貌星球（真实地形高度雕刻 + 绘本三阶顶点着色 + 湖海层 + 每星专属立体冠冕微雕 + 绕球白云）
 */
function buildDetailedMiniPlanet(p) {
  const root = new THREE.Group();
  const baseR = 1.68;

  // 1. 雕刻真实球面起伏地貌并烘焙左上柔光绘本顶点色（确保星夜下依然色彩饱满立体）
  const geo = new THREE.IcosahedronGeometry(baseR, 4);
  const posAttr = geo.attributes.position;
  const vCount = posAttr.count;
  const dir = new THREE.Vector3();

  for (let i = 0; i < vCount; i++) {
    dir.fromBufferAttribute(posAttr, i).normalize();
    const hDelta = getSurfaceRadius(p.id, dir) - PLANET_RADIUS;
    const r = baseR + hDelta * 0.28;
    posAttr.setXYZ(i, dir.x * r, dir.y * r, dir.z * r);
  }
  geo.computeVertexNormals();

  const normAttr = geo.attributes.normal;
  const colors = new Float32Array(vCount * 3);
  const cLow = new THREE.Color(p.palette.low || "#4e8a62");
  const cMid = new THREE.Color(p.palette.mid || "#c99b5b");
  const cHigh = new THREE.Color(p.palette.high || "#f8f4ec");
  const tmpCol = new THREE.Color();
  const nVec = new THREE.Vector3();
  const sunDir = new THREE.Vector3(-0.55, 0.72, 0.42).normalize();

  for (let i = 0; i < vCount; i++) {
    dir.fromBufferAttribute(posAttr, i);
    const r = dir.length();
    const hNorm = THREE.MathUtils.clamp((r - (baseR - 0.12)) / 0.56, 0, 1);
    if (hNorm < 0.48) {
      tmpCol.copy(cLow).lerp(cMid, hNorm / 0.48);
    } else {
      tmpCol.copy(cMid).lerp(cHigh, (hNorm - 0.48) / 0.52);
    }
    nVec.fromBufferAttribute(normAttr, i).normalize();
    const shade = 0.62 + 0.46 * Math.max(0, nVec.dot(sunDir));
    colors[i * 3] = Math.min(1, tmpCol.r * shade);
    colors[i * 3 + 1] = Math.min(1, tmpCol.g * shade);
    colors[i * 3 + 2] = Math.min(1, tmpCol.b * shade);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const terrainMesh = new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({ vertexColors: true })
  );
  root.add(terrainMesh);

  // 2. 晶莹湖海层（自动在凹陷盆地呈现出乌兰湖、牛奶海、麦理浩径海湾、赛里木湖）
  const waterR = p.id === "maclehose" || p.id === "luca-hainan" ? baseR + 0.05 : baseR + 0.015;
  const waterMesh = new THREE.Mesh(
    new THREE.SphereGeometry(waterR, 24, 18),
    new THREE.MeshBasicMaterial({
      color: p.palette.water || "#3898c8",
      transparent: true,
      opacity: p.id === "maclehose" || p.id === "luca-hainan" ? 0.84 : 0.74,
    })
  );
  root.add(waterMesh);

  // 3. 每颗星球专属标志性 3D 冠冕微雕（一眼认出每颗星！）
  const crown = new THREE.Group();
  if (p.id === "yading") {
    // 稻城亚丁：三座高耸洁白冰晶神山锥峰 + 牛奶海宝蓝圆镜
    const snowMat = new THREE.MeshBasicMaterial({ color: "#f6fbff" });
    const p1 = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.05, 6), snowMat);
    p1.position.set(0, baseR + 0.52, 0);
    const p2 = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.82, 6), snowMat);
    p2.position.set(-0.46, baseR + 0.34, 0.18);
    p2.rotation.z = 0.24;
    const p3 = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.78, 6), snowMat);
    p3.position.set(0.44, baseR + 0.32, -0.15);
    p3.rotation.z = -0.22;
    const lake = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, 0.08, 14),
      new THREE.MeshBasicMaterial({ color: "#32c5ff" })
    );
    lake.position.set(0.12, baseR + 0.14, 0.56);
    lake.rotation.x = 0.34;
    crown.add(p1, p2, p3, lake);
  } else if (p.id === "siguniang") {
    // 四姑娘山与长穿毕：日照金山大峰金字塔 + 鲜红红石滩宝石带 + 彩林球树
    const peak = new THREE.Mesh(
      new THREE.ConeGeometry(0.48, 1.12, 4),
      new THREE.MeshBasicMaterial({ color: "#ffd88a" })
    );
    peak.position.set(0, baseR + 0.54, 0);
    peak.rotation.y = 0.4;
    const redMat = new THREE.MeshBasicMaterial({ color: "#e34c36" });
    for (let k = 0; k < 5; k++) {
      const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.13, 0), redMat);
      stone.position.set(-0.42 + k * 0.2, baseR + 0.12, 0.52 - Math.abs(k - 2) * 0.08);
      crown.add(stone);
    }
    crown.add(peak);
  } else if (p.id === "zhagana") {
    // 扎尕那：险峻灰白石城岩屏 + 葱郁云杉小尖树林
    const rockMat = new THREE.MeshBasicMaterial({ color: "#cbd5e1" });
    for (let k = -1; k <= 1; k++) {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.76 - Math.abs(k) * 0.14, 0.22), rockMat);
      slab.position.set(k * 0.3, baseR + 0.34, -0.1);
      slab.rotation.z = k * -0.12;
      crown.add(slab);
    }
    const treeMat = new THREE.MeshBasicMaterial({ color: "#2d6a4f" });
    for (let k = 0; k < 5; k++) {
      const tree = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.42, 5), treeMat);
      const ang = (k / 5) * Math.PI * 2;
      tree.position.set(Math.cos(ang) * 0.65, baseR + 0.16, Math.sin(ang) * 0.65);
      crown.add(tree);
    }
  } else if (p.id === "tengger") {
    // 腾格里沙漠：暖橙篝火营地星芒 + 绿洲草甸 + 乌兰红心湖
    const heartLake = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.34, 0.08, 14),
      new THREE.MeshBasicMaterial({ color: "#d93848" })
    );
    heartLake.position.set(-0.22, baseR + 0.16, 0.48);
    heartLake.rotation.x = 0.28;
    const fireGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 10, 10),
      new THREE.MeshBasicMaterial({ color: "#ffb703" })
    );
    fireGlow.position.set(0.28, baseR + 0.3, 0.22);
    crown.add(heartLake, fireGlow);
  } else if (p.id === "maclehose") {
    // 麦理浩径：海岬洁白小灯塔 + 塔顶暖金灯室
    const tower = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.15, 0.62, 8),
      new THREE.MeshBasicMaterial({ color: "#fffdf9" })
    );
    tower.position.set(0.15, baseR + 0.36, 0.25);
    const lantern = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 10, 10),
      new THREE.MeshBasicMaterial({ color: "#ffe169" })
    );
    lantern.position.set(0.15, baseR + 0.72, 0.25);
    crown.add(tower, lantern);
  } else if (p.id === "yili") {
    // 新疆伊犁：雪岭云杉林 + 侧上方绕转的大海道暖黄圆月卫星
    const spruceMat = new THREE.MeshBasicMaterial({ color: "#2b7a4b" });
    for (let k = 0; k < 6; k++) {
      const sp = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.44, 5), spruceMat);
      const ang = (k / 6) * Math.PI * 2;
      sp.position.set(Math.cos(ang) * 0.56, baseR + 0.18, Math.sin(ang) * 0.56);
      crown.add(sp);
    }
    const yellowMoon = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 14, 14),
      new THREE.MeshBasicMaterial({ color: "#ffd54f" })
    );
    yellowMoon.position.set(1.95, 1.35, 0.4);
    crown.add(yellowMoon);
  } else if (p.id === "luca-hainan") {
    // 海南环岛骑行星：发光蔚蓝环岛公路光轨 + 海岸小灯塔
    const loopRing = new THREE.Mesh(
      new THREE.TorusGeometry(baseR + 0.24, 0.045, 8, 36),
      new THREE.MeshBasicMaterial({ color: "#38bdf8" })
    );
    loopRing.rotation.x = Math.PI * 0.42;
    const tower = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.14, 0.56, 8),
      new THREE.MeshBasicMaterial({ color: "#fffdf9" })
    );
    tower.position.set(0.14, baseR + 0.34, 0.22);
    crown.add(loopRing, tower);
  } else if (p.id === "luca-tianshan") {
    const snowMat = new THREE.MeshBasicMaterial({ color: "#f8fafc" });
    const peak = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.88, 6), snowMat);
    peak.position.set(0, baseR + 0.44, 0);
    const spruce = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.46, 5), new THREE.MeshBasicMaterial({ color: "#22c55e" }));
    spruce.position.set(-0.42, baseR + 0.2, 0.24);
    crown.add(peak, spruce);
  }
  root.add(crown);

  // 4. 环绕星球缓缓飘浮的 2 团立体绘本小白云
  const cloudOrbit = new THREE.Group();
  const cloudMat = new THREE.MeshBasicMaterial({
    color: "#fffcf5",
    transparent: true,
    opacity: 0.82,
  });
  for (let c = 0; c < 2; c++) {
    const cg = new THREE.Group();
    const pA = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), cloudMat);
    const pB = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), cloudMat);
    pB.position.set(0.2, -0.04, 0.06);
    const pC = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), cloudMat);
    pC.position.set(-0.18, -0.05, -0.04);
    cg.add(pA, pB, pC);
    const a = c * Math.PI + 0.6;
    cg.position.set(Math.cos(a) * 2.25, 0.45 - c * 0.65, Math.sin(a) * 2.25);
    cg.lookAt(0, 0, 0);
    cloudOrbit.add(cg);
  }
  root.add(cloudOrbit);

  return { root, cloudOrbit };
}

export function createSkyWonders(activePlanet, allPlanets) {
  const group = new THREE.Group();
  const clickableMeshes = [];
  const distantOrbs = [];
  let telescopeActive = false;
  let hoveredPlanetId = null;

  // ==================== 1. 远空邻近高精度立体地貌微缩星球（数量随当前星系动态自适应） ====================
  const others = allPlanets
    .map((p, idx) => ({ p, idx }))
    .filter((item) => item.p.id !== activePlanet.id);

  others.forEach(({ p, idx }, i) => {
    const az = (i / others.length) * Math.PI * 2 + 0.42;
    const elev = 0.24 + (i % 3) * 0.22;
    const dist = 62 + (i % 2) * 8;
    const pos = new THREE.Vector3(
      Math.cos(elev) * Math.cos(az) * dist,
      Math.sin(elev) * dist,
      Math.cos(elev) * Math.sin(az) * dist
    );

    const orbGroup = new THREE.Group();
    orbGroup.position.copy(pos);

    const { root: core, cloudOrbit } = buildDetailedMiniPlanet(p);

    const haloColor = p.palette.halo || p.palette.accent || "#f4c668";
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(2.55, 20, 16),
      new THREE.MeshBasicMaterial({
        color: haloColor,
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
      })
    );

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(2.42, 2.76, 40),
      new THREE.MeshBasicMaterial({
        color: haloColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.42,
      })
    );
    ring.rotation.x = 1.18;
    ring.rotation.y = i * 0.45;

    const label = makeLabelSprite(p.name);
    label.position.set(0, -3.45, 0);

    // 宽容点击拾取球，电脑悬停发光、手机轻点直飞
    const hitMesh = new THREE.Mesh(
      new THREE.SphereGeometry(4.4, 10, 8),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    hitMesh.userData = {
      targetPlanetIdx: idx,
      planetName: p.name,
      planetId: p.id,
    };

    orbGroup.add(core, halo, ring, label, hitMesh);
    group.add(orbGroup);
    clickableMeshes.push(hitMesh);
    distantOrbs.push({
      planet: p,
      orbGroup,
      core,
      cloudOrbit,
      halo,
      ring,
      label,
      phase: i * 1.3,
      defaultPos: pos.clone(),
      observatoryPos: pos.clone(),
    });
  });

  // ==================== 1.5 横贯深空的 3D 璀璨银河星云光带 (Milky Way Band) ====================
  const milkyWayGroup = new THREE.Group();
  const mwCount = 1400;
  const mwPos = new Float32Array(mwCount * 3);
  const mwCol = new Float32Array(mwCount * 3);
  const paletteMW = [
    new THREE.Color("#fff4d2"),
    new THREE.Color("#a5ceff"),
    new THREE.Color("#f5b8e6"),
    new THREE.Color("#c7b3ff"),
    new THREE.Color("#ffd59e"),
  ];
  for (let i = 0; i < mwCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    // 高斯式收束在银河赤道带附近，局部成团形成星云感
    const spread = (Math.random() + Math.random() + Math.random() - 1.5) * 0.24;
    const wave = Math.sin(theta * 3) * 0.08;
    const phi = Math.PI * 0.5 + spread + wave;
    const dist = 108 + Math.random() * 26;
    mwPos[i * 3] = dist * Math.sin(phi) * Math.cos(theta);
    mwPos[i * 3 + 1] = dist * Math.cos(phi);
    mwPos[i * 3 + 2] = dist * Math.sin(phi) * Math.sin(theta);
    const c = paletteMW[i % paletteMW.length];
    const bright = 0.65 + Math.random() * 0.35;
    mwCol[i * 3] = c.r * bright;
    mwCol[i * 3 + 1] = c.g * bright;
    mwCol[i * 3 + 2] = c.b * bright;
  }
  const mwGeo = new THREE.BufferGeometry();
  mwGeo.setAttribute("position", new THREE.BufferAttribute(mwPos, 3));
  mwGeo.setAttribute("color", new THREE.BufferAttribute(mwCol, 3));
  // 柔和发光星尘贴图
  const dotCanvas = document.createElement("canvas");
  dotCanvas.width = 32;
  dotCanvas.height = 32;
  const dctx = dotCanvas.getContext("2d");
  const dgrad = dctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  dgrad.addColorStop(0, "rgba(255,255,255,1)");
  dgrad.addColorStop(0.35, "rgba(245,235,255,0.65)");
  dgrad.addColorStop(1, "rgba(255,255,255,0)");
  dctx.fillStyle = dgrad;
  dctx.fillRect(0, 0, 32, 32);
  const isGalaxyHero =
    activePlanet.id === "kitty-sunset" ||
    activePlanet.id === "tengger" ||
    activePlanet.id === "miemie-shexiang";
  const mwMat = new THREE.PointsMaterial({
    size: isGalaxyHero ? 2.5 : 1.9,
    map: new THREE.CanvasTexture(dotCanvas),
    vertexColors: true,
    transparent: true,
    opacity: isGalaxyHero ? 0.88 : 0.62,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const mwPoints = new THREE.Points(mwGeo, mwMat);
  milkyWayGroup.rotation.set(0.62, 0.35, -0.48);
  milkyWayGroup.add(mwPoints);
  group.add(milkyWayGroup);

  // ==================== 2. 高山飘雪 → 云开日照金山奇遇 ====================
  const isAlpine = [
    "yading",
    "siguniang",
    "zhagana",
    "kitty-changbai",
    "kitty-zhagana",
    "kitty-wusun",
    "kitty-yading",
    "miemie-yading",
    "luca-tianshan",
  ].includes(activePlanet.id);
  let snowPoints = null;
  const snowCount = 96;
  const snowOffsets = new Float32Array(snowCount * 3);
  if (isAlpine) {
    for (let i = 0; i < snowCount; i++) {
      snowOffsets[i * 3] = (Math.random() - 0.5) * 9;
      snowOffsets[i * 3 + 1] = (Math.random() - 0.5) * 9;
      snowOffsets[i * 3 + 2] = (Math.random() - 0.5) * 9;
    }
    const snowGeo = new THREE.BufferGeometry();
    snowGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(snowCount * 3), 3));
    const snowMat = new THREE.PointsMaterial({
      color: "#ffffff",
      size: 0.14,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    snowPoints = new THREE.Points(snowGeo, snowMat);
    group.add(snowPoints);
  }

  const alpenglowLight = new THREE.DirectionalLight("#ff9e2c", 0);
  alpenglowLight.position.set(-26, 18, 22);
  group.add(alpenglowLight);

  let alpenglowTimer = 0;
  let alpenglowCooldown = 0;

  // ==================== 3. 星夜驻足仰望 · 流星雨奇遇 ====================
  const meteors = [];
  const meteorHeadMat = new THREE.MeshBasicMaterial({ color: "#fffbeb" });
  for (let i = 0; i < 5; i++) {
    const mGroup = new THREE.Group();
    mGroup.visible = false;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), meteorHeadMat);
    const tailMat = new THREE.MeshBasicMaterial({
      color: "#fcd34d",
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
    });
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.18, 6.8, 8), tailMat);
    tail.rotation.x = Math.PI * 0.5;
    tail.position.z = -3.4;
    const hit = new THREE.Mesh(
      new THREE.SphereGeometry(2.8, 6, 6),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    hit.position.z = -1.6;
    mGroup.add(head, tail, hit);
    group.add(mGroup);
    meteors.push({
      group: mGroup,
      hit,
      tailMat,
      active: false,
      delay: 0,
      life: 0,
      maxLife: 1.35,
      pos: new THREE.Vector3(),
      vel: new THREE.Vector3(),
    });
  }
  let meteorCooldown = 4;

  function triggerMeteorBurst(anchorDir, onWonder) {
    const up = anchorDir ? anchorDir.clone().normalize() : new THREE.Vector3(0, 1, 0);
    const tangentA = new THREE.Vector3(0, 1, 0).cross(up);
    if (tangentA.lengthSq() < 0.01) tangentA.set(1, 0, 0);
    tangentA.normalize();
    const tangentB = new THREE.Vector3().crossVectors(up, tangentA).normalize();

    meteors.forEach((m, idx) => {
      m.active = true;
      m.delay = idx * 0.36;
      m.life = 0;
      m.maxLife = 1.2 + Math.random() * 0.45;
      const spreadA = (idx - 2) * 8.5 + (Math.random() - 0.5) * 5;
      const spreadB = 14 + Math.random() * 12;
      m.pos
        .copy(up)
        .multiplyScalar(44 + Math.random() * 8)
        .addScaledVector(tangentA, spreadA)
        .addScaledVector(tangentB, spreadB);
      m.vel
        .copy(tangentA)
        .multiplyScalar(18 + Math.random() * 8)
        .addScaledVector(tangentB, -16)
        .addScaledVector(up, -6);
    });
    if (onWonder) onWonder("🌠 奇遇 · 驻足仰望，夜空划过流星雨");
  }

  function refreshOrbLabels(getDiscoveredCount) {
    if (typeof getDiscoveredCount !== "function") return;
    for (const orb of distantOrbs) {
      const done = getDiscoveredCount(orb.planet.id);
      const total = orb.planet.waypoints.length;
      const cleared = done >= total;
      const progStr = cleared ? "★" : `${done}/${total}`;
      const cacheKey = `${progStr}-${cleared}`;
      if (orb.label.userData.lastKey !== cacheKey) {
        orb.label.userData.lastKey = cacheKey;
        drawPlanetLabelCanvas(
          orb.label.userData.canvas,
          orb.label.userData.baseName,
          progStr,
          cleared
        );
        orb.label.userData.tex.needsUpdate = true;
      }
    }
  }

  return {
    group,
    getOtherPlanetCount: () => distantOrbs.length,
    getClickableMeshes: () => clickableMeshes,
    setHoveredPlanet(planetId) {
      hoveredPlanetId = planetId || null;
    },
    refreshOrbLabels,
    setTelescopeActive(on, frame = null) {
      telescopeActive = Boolean(on);
      if (!telescopeActive) hoveredPlanetId = null;
      if (telescopeActive && frame) {
        const { hikerPos, upDir, fwdDir, rightDir, isPortrait } = frame;
        const count = distantOrbs.length;
        const downOffset = upDir.clone().multiplyScalar(-3.55);
        // 使微缩星球的北极雪峰朝向当前屏幕上方 upDir，观感端正立体
        const alignQuat = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          upDir
        );

        distantOrbs.forEach((orb, i) => {
          orb.label.position.copy(downOffset);
          orb.core.quaternion.slerp(alignQuat, 0.35);

          if (isPortrait) {
            let slot;
            if (count === 1) {
              slot = { x: 0, y: 23.2 };
            } else if (count === 2) {
              slot = i === 0 ? { x: -4.8, y: 23.8 } : { x: 4.8, y: 23.8 };
            } else if (count === 3) {
              const s3 = [
                { x: 0, y: 29.2 },
                { x: -5.2, y: 19.6 },
                { x: 5.2, y: 19.6 },
              ];
              slot = s3[i];
            } else if (count === 4) {
              const s4 = [
                { x: -5.0, y: 28.6 },
                { x: 5.4, y: 28.6 },
                { x: -5.0, y: 18.2 },
                { x: 5.4, y: 18.2 },
              ];
              slot = s4[i];
            } else if (count === 5) {
              const s5 = [
                { x: -5.2, y: 29.8 },
                { x: 6.2, y: 29.8 },
                { x: 0.6, y: 23.0 },
                { x: -4.8, y: 16.2 },
                { x: 6.4, y: 16.2 },
              ];
              slot = s5[i];
            } else {
              // 6+ 颗邻星（如 Kitty 7 星宇宙或含自建星）：双列错落星阵，绝不重叠遮挡
              const rows = Math.ceil(count / 2);
              const r = Math.floor(i / 2);
              const col = i % 2;
              const isLastOdd = i === count - 1 && count % 2 === 1;
              const ySpan = Math.min(18.0, (rows - 1) * 7.4);
              const yTop = 23.2 + ySpan * 0.5;
              const yStep = rows > 1 ? ySpan / (rows - 1) : 0;
              slot = {
                x: isLastOdd ? 0 : col === 0 ? -5.4 : 5.8,
                y: yTop - r * yStep,
              };
            }
            orb.observatoryPos
              .copy(hikerPos)
              .addScaledVector(fwdDir, 55)
              .addScaledVector(rightDir, slot.x)
              .addScaledVector(upDir, slot.y);
          } else {
            const norm = count > 1 ? (i / (count - 1)) * 2 - 1 : 0;
            const spread = count === 2 ? 11.5 : count === 3 ? 18.5 : 26.0;
            const lateral = norm * spread;
            const archLift = (1 - norm * norm * 0.58) * (count <= 2 ? 5.2 : 8.5);
            orb.observatoryPos
              .copy(hikerPos)
              .addScaledVector(fwdDir, 49)
              .addScaledVector(rightDir, lateral)
              .addScaledVector(upDir, 20.5 + archLift);
          }
        });
      } else {
        distantOrbs.forEach((orb) => orb.label.position.set(0, -3.45, 0));
      }
    },
    triggerMeteorBurst,
    pickActiveMeteor(raycaster) {
      const hits = meteors.filter((m) => m.active && m.group.visible).map((m) => m.hit);
      if (!hits.length) return false;
      const res = raycaster.intersectObjects(hits, false);
      return res.length > 0;
    },
    update(dt, elapsed, state = {}) {
      const baseScale = telescopeActive
        ? window.innerWidth < window.innerHeight
          ? 1.04
          : 1.34
        : 0.96;

      for (const orb of distantOrbs) {
        const isHovered = hoveredPlanetId === orb.planet.id;
        const wantScale = baseScale * (isHovered ? 1.16 : 1.0);
        const goalPos = telescopeActive ? orb.observatoryPos : orb.defaultPos;
        orb.orbGroup.position.lerp(goalPos, Math.min(1, dt * 4.6));
        orb.core.rotateOnAxis(new THREE.Vector3(0, 1, 0), dt * 0.42);
        orb.cloudOrbit.rotation.y = -elapsed * 0.28 + orb.phase;
        orb.ring.rotation.z = elapsed * 0.22;
        orb.orbGroup.scale.lerp(
          new THREE.Vector3(wantScale, wantScale, wantScale),
          Math.min(1, dt * 6)
        );
        orb.label.material.opacity = THREE.MathUtils.lerp(
          orb.label.material.opacity,
          telescopeActive ? 1.0 : isHovered ? 0.92 : 0.46,
          Math.min(1, dt * 5)
        );
        orb.halo.material.opacity = isHovered
          ? 0.44
          : telescopeActive
          ? 0.28 + Math.sin(elapsed * 3 + orb.phase) * 0.07
          : 0.14;
      }

      // 高山飘雪与日照金山奇遇
      if (alpenglowCooldown > 0) alpenglowCooldown -= dt;
      const normAlt = state.normalizedAlt ?? 0;
      if (isAlpine && normAlt > 0.78 && alpenglowTimer <= 0 && alpenglowCooldown <= 0) {
        alpenglowTimer = 14.0;
        alpenglowCooldown = 65.0;
        if (state.onWonder) state.onWonder("🏔️ 奇遇 · 风雪初霁，遇见日照金山");
      }
      if (alpenglowTimer > 0) {
        alpenglowTimer -= dt;
        const fade = alpenglowTimer > 2.5 ? 1 : Math.max(0, alpenglowTimer / 2.5);
        alpenglowLight.intensity = THREE.MathUtils.lerp(
          alpenglowLight.intensity,
          2.6 * fade,
          Math.min(1, dt * 2.2)
        );
      } else {
        alpenglowLight.intensity = THREE.MathUtils.lerp(alpenglowLight.intensity, 0, dt * 2);
      }

      if (snowPoints && state.hikerPos) {
        const wantSnow = normAlt > 0.42 && alpenglowTimer <= 0 ? 0.78 : 0;
        snowPoints.material.opacity = THREE.MathUtils.lerp(
          snowPoints.material.opacity,
          wantSnow,
          Math.min(1, dt * 2)
        );
        snowPoints.visible = snowPoints.material.opacity > 0.02;
        if (snowPoints.visible) {
          const arr = snowPoints.geometry.attributes.position.array;
          for (let i = 0; i < snowCount; i++) {
            const drift = ((elapsed * 1.4 + i * 0.17) % 1) * 6;
            arr[i * 3] = state.hikerPos.x + snowOffsets[i * 3] + Math.sin(elapsed + i) * 0.4;
            arr[i * 3 + 1] = state.hikerPos.y + snowOffsets[i * 3 + 1] - drift + 3;
            arr[i * 3 + 2] = state.hikerPos.z + snowOffsets[i * 3 + 2] + Math.cos(elapsed + i) * 0.4;
          }
          snowPoints.geometry.attributes.position.needsUpdate = true;
        }
      }

      // 银河缓慢流转 + 星夜增亮
      milkyWayGroup.rotation.y += dt * 0.012;
      const targetMwOpacity = state.isNight ? 0.95 : isGalaxyHero ? 0.86 : 0.62;
      mwMat.opacity = THREE.MathUtils.lerp(mwMat.opacity, targetMwOpacity, Math.min(1, dt * 2));

      // 星夜驻足自动流星雨
      if (meteorCooldown > 0) meteorCooldown -= dt;
      const starryPlanet =
        activePlanet.id === "tengger" ||
        activePlanet.id === "yili" ||
        activePlanet.id === "kitty-sunset" ||
        activePlanet.id === "miemie-shexiang";
      if (
        (state.isNight || starryPlanet) &&
        (state.idleSeconds ?? 0) > 2.8 &&
        meteorCooldown <= 0
      ) {
        meteorCooldown = 24;
        triggerMeteorBurst(state.playerUp, state.onWonder);
      }

      for (const m of meteors) {
        if (!m.active) continue;
        if (m.delay > 0) {
          m.delay -= dt;
          continue;
        }
        m.group.visible = true;
        m.life += dt;
        m.pos.addScaledVector(m.vel, dt);
        m.group.position.copy(m.pos);
        m.group.lookAt(m.pos.clone().add(m.vel));
        const p = m.life / m.maxLife;
        m.tailMat.opacity = Math.sin(Math.min(1, p) * Math.PI) * 0.85;
        if (m.life >= m.maxLife) {
          m.active = false;
          m.group.visible = false;
        }
      }
    },
  };
}
