/**
 * 3D 迷你星球地表网格、地貌微缩景观、露营地与打卡水晶路标构建器
 * 数学/高度场与角色建模已分别解耦至 sphereMath.js 与 hikerCharacter3D.js
 */
import * as THREE from "three";
import {
  PLANET_RADIUS,
  UP_VEC as UP,
  STORYBOOK_GRAD,
  latLonToUnitVec,
  GUEST_TERRAIN_MAP,
  registerGuestTerrain,
  getSurfaceRadius,
  seededRand,
  placeOnSphere,
} from "./sphereMath.js?v=5.3.3-panoramic-shanhai";
import { buildHikerCharacter } from "./hikerCharacter3D.js?v=5.3.3-panoramic-shanhai";

export {
  PLANET_RADIUS,
  STORYBOOK_GRAD,
  latLonToUnitVec,
  registerGuestTerrain,
  getSurfaceRadius,
  buildHikerCharacter,
};

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

  // 8. 球面等高线徒步环线轨迹 / 3D 环星球沥青公路车骑行绿道（串联全部路标）
  const trailGroup = new THREE.Group();
  const trailSegments = [];
  const isCyclingPlanet = id === "luca-hainan" || id === "luca-tianshan";
  if (waypointObjs.length >= 2) {
    const asphaltMat = isCyclingPlanet
      ? new THREE.MeshStandardMaterial({
          color: "#2b3544",
          roughness: 0.78,
          metalness: 0.08,
          side: THREE.DoubleSide,
        })
      : null;
    const edgeLineColor = id === "luca-hainan" ? "#38bdf8" : "#34d399";
    const edgeMat = isCyclingPlanet
      ? new THREE.MeshBasicMaterial({ color: edgeLineColor, side: THREE.DoubleSide, transparent: true, opacity: 0.88 })
      : null;

    for (let i = 0; i < waypointObjs.length; i++) {
      const a = waypointObjs[i];
      const b = waypointObjs[(i + 1) % waypointObjs.length];
      const pts = [];
      const steps = isCyclingPlanet ? 52 : 34;
      for (let s = 0; s <= steps; s++) {
        const dir = a.unitDir.clone().lerp(b.unitDir, s / steps).normalize();
        const r = getSurfaceRadius(id, dir) + (isCyclingPlanet ? 0.052 : 0.055);
        pts.push(dir.clone().multiplyScalar(r));
      }

      if (isCyclingPlanet) {
        // 构建贴合球面曲率的 3D 沥青公路车骑行道带 + 双侧旅游公路彩色边线
        const halfW = 0.21;
        const edgeW = 0.032;
        const roadPos = [];
        const roadNorm = [];
        const roadIdx = [];
        const edgePos = [];
        const edgeIdx = [];
        for (let s = 0; s <= steps; s++) {
          const p = pts[s];
          const up = p.clone().normalize();
          const nextP = pts[Math.min(steps, s + 1)];
          const prevP = pts[Math.max(0, s - 1)];
          const tang = nextP.clone().sub(prevP).normalize();
          const side = new THREE.Vector3().crossVectors(tang, up).normalize();
          const pL = p.clone().addScaledVector(side, -halfW);
          const pR = p.clone().addScaledVector(side, halfW);
          roadPos.push(pL.x, pL.y, pL.z, pR.x, pR.y, pR.z);
          roadNorm.push(up.x, up.y, up.z, up.x, up.y, up.z);

          // 左右两条旅游公路彩线略高于沥青路面 0.006，防闪烁
          const lift = up.clone().multiplyScalar(0.006);
          const eL1 = p.clone().addScaledVector(side, -halfW + 0.012).add(lift);
          const eL2 = p.clone().addScaledVector(side, -halfW + 0.012 + edgeW).add(lift);
          const eR1 = p.clone().addScaledVector(side, halfW - 0.012 - edgeW).add(lift);
          const eR2 = p.clone().addScaledVector(side, halfW - 0.012).add(lift);
          edgePos.push(eL1.x, eL1.y, eL1.z, eL2.x, eL2.y, eL2.z, eR1.x, eR1.y, eR1.z, eR2.x, eR2.y, eR2.z);

          if (s < steps) {
            const base = s * 2;
            roadIdx.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
            const eb = s * 4;
            edgeIdx.push(eb, eb + 1, eb + 4, eb + 1, eb + 5, eb + 4);
            edgeIdx.push(eb + 2, eb + 3, eb + 6, eb + 3, eb + 7, eb + 6);
          }
        }
        const roadGeo = new THREE.BufferGeometry();
        roadGeo.setAttribute("position", new THREE.Float32BufferAttribute(roadPos, 3));
        roadGeo.setAttribute("normal", new THREE.Float32BufferAttribute(roadNorm, 3));
        roadGeo.setIndex(roadIdx);
        const roadMesh = new THREE.Mesh(roadGeo, asphaltMat);
        roadMesh.receiveShadow = true;

        const edgeGeo = new THREE.BufferGeometry();
        edgeGeo.setAttribute("position", new THREE.Float32BufferAttribute(edgePos, 3));
        edgeGeo.setIndex(edgeIdx);
        const edgeMesh = new THREE.Mesh(edgeGeo, edgeMat);
        trailGroup.add(roadMesh, edgeMesh);
      }

      const centerPts = isCyclingPlanet
        ? pts.map((p) => p.clone().addScaledVector(p.clone().normalize(), 0.012))
        : pts;
      const lineGeo = new THREE.BufferGeometry().setFromPoints(centerPts);
      const lineMat = new THREE.LineDashedMaterial({
        color: isCyclingPlanet ? "#fde047" : "#f3cf7a",
        dashSize: isCyclingPlanet ? 0.22 : 0.24,
        gapSize: isCyclingPlanet ? 0.18 : 0.2,
        transparent: true,
        opacity: isCyclingPlanet ? 0.86 : 0.34,
      });
      const segLine = new THREE.Line(lineGeo, lineMat);
      segLine.computeLineDistances();
      trailGroup.add(segLine);
      trailSegments.push({ line: segLine, mat: lineMat, fromId: a.data.id, toId: b.data.id });
    }
    group.add(trailGroup);
  } else if (planetConfig.titleCyclingTrack) {
    // Luca 扉页专属：环绕「破风起点星」的大圆 3D 沥青骑行绿道 + 天蓝边线 + 暖黄中线
    const { upDir, fwdDir } = planetConfig.titleCyclingTrack;
    const u0 = upDir.clone().normalize();
    const f0 = fwdDir.clone().sub(u0.clone().multiplyScalar(fwdDir.dot(u0))).normalize();
    const side = new THREE.Vector3().crossVectors(f0, u0).normalize();
    const steps = 96;
    const halfW = 0.24;
    const edgeW = 0.036;
    const roadPos = [];
    const roadNorm = [];
    const roadIdx = [];
    const edgePos = [];
    const edgeIdx = [];
    const centerPts = [];
    for (let s = 0; s <= steps; s++) {
      const ang = (s / steps) * Math.PI * 2;
      const dir = u0.clone().multiplyScalar(Math.cos(ang)).addScaledVector(f0, Math.sin(ang)).normalize();
      const r = Math.max(getSurfaceRadius(baseTerrainId, dir), PLANET_RADIUS + 0.235) + 0.048;
      const p = dir.clone().multiplyScalar(r);
      const pL = p.clone().addScaledVector(side, -halfW);
      const pR = p.clone().addScaledVector(side, halfW);
      roadPos.push(pL.x, pL.y, pL.z, pR.x, pR.y, pR.z);
      roadNorm.push(dir.x, dir.y, dir.z, dir.x, dir.y, dir.z);
      const lift = dir.clone().multiplyScalar(0.007);
      const eL1 = p.clone().addScaledVector(side, -halfW + 0.014).add(lift);
      const eL2 = p.clone().addScaledVector(side, -halfW + 0.014 + edgeW).add(lift);
      const eR1 = p.clone().addScaledVector(side, halfW - 0.014 - edgeW).add(lift);
      const eR2 = p.clone().addScaledVector(side, halfW - 0.014).add(lift);
      edgePos.push(eL1.x, eL1.y, eL1.z, eL2.x, eL2.y, eL2.z, eR1.x, eR1.y, eR1.z, eR2.x, eR2.y, eR2.z);
      centerPts.push(p.clone().addScaledVector(dir, 0.014));
      if (s < steps) {
        const b = s * 2;
        roadIdx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
        const eb = s * 4;
        edgeIdx.push(eb, eb + 1, eb + 4, eb + 1, eb + 5, eb + 4, eb + 2, eb + 3, eb + 6, eb + 3, eb + 7, eb + 6);
      }
    }
    const rGeo = new THREE.BufferGeometry();
    rGeo.setAttribute("position", new THREE.Float32BufferAttribute(roadPos, 3));
    rGeo.setAttribute("normal", new THREE.Float32BufferAttribute(roadNorm, 3));
    rGeo.setIndex(roadIdx);
    const eGeo = new THREE.BufferGeometry();
    eGeo.setAttribute("position", new THREE.Float32BufferAttribute(edgePos, 3));
    eGeo.setIndex(edgeIdx);
    const cLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(centerPts),
      new THREE.LineDashedMaterial({ color: "#fde047", dashSize: 0.24, gapSize: 0.18, transparent: true, opacity: 0.9 })
    );
    cLine.computeLineDistances();
    trailGroup.add(
      new THREE.Mesh(rGeo, new THREE.MeshStandardMaterial({ color: "#2b3544", roughness: 0.76, side: THREE.DoubleSide })),
      new THREE.Mesh(eGeo, new THREE.MeshBasicMaterial({ color: "#38bdf8", side: THREE.DoubleSide })),
      cLine
    );
    group.add(trailGroup);
  }

  // 9. 山野微气候奇遇（日照金山 · 蓝眼泪荧光海 · 麝香洞地心宇宙 & 牛倒岩地下暗瀑幽蓝萤光）
  const hasSnowPeaks =
    id === "yading" || id === "siguniang" || id === "zhagana" || id === "yili" ||
    id === "kitty-yading" || id === "kitty-wusun" || id === "kitty-zhagana" ||
    id === "miemie-yading" || id === "luca-tianshan";
  const alpenglowLight = new THREE.PointLight("#ff6a2b", 0, 26, 1.4);
  alpenglowLight.position.set(6, PLANET_RADIUS + 6.5, 6);
  group.add(alpenglowLight);

  let parkedBikeGroup = null;
  let parkedBikeUnitDir = null;
  if (id === "luca-hainan" || id === "luca-tianshan") {
    const makeMiniBike = (frameColor, withPanniers = false) => {
      const bike = new THREE.Group();
      const wheelMat = new THREE.MeshStandardMaterial({ color: "#1e293b", roughness: 0.55 });
      const rimMat = new THREE.MeshStandardMaterial({ color: "#cbd5e1", metalness: 0.65, roughness: 0.25 });
      const fMat = new THREE.MeshToonMaterial({ color: frameColor, gradientMap: STORYBOOK_GRAD });
      [-0.26, 0.26].forEach((wx) => {
        const tire = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.024, 8, 22), wheelMat);
        tire.position.set(wx, 0.175, 0);
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.009, 6, 20), rimMat);
        rim.position.set(wx, 0.175, 0);
        bike.add(tire, rim);
        for (let sp = 0; sp < 4; sp++) {
          const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.25, 4), rimMat);
          spoke.position.set(wx, 0.175, 0);
          spoke.rotation.z = (sp / 4) * Math.PI;
          bike.add(spoke);
        }
      });
      const topTube = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.36, 8), fMat);
      topTube.rotation.z = Math.PI / 2;
      topTube.position.set(-0.02, 0.35, 0);
      const downTube = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.38, 8), fMat);
      downTube.rotation.z = -0.68;
      downTube.position.set(0.04, 0.25, 0);
      const seatTube = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.31, 8), fMat);
      seatTube.rotation.z = 0.24;
      seatTube.position.set(-0.15, 0.27, 0);
      const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.01, 0.28, 8), fMat);
      fork.rotation.z = 0.26;
      fork.position.set(0.21, 0.27, 0);
      const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.026, 0.06), wheelMat);
      saddle.position.set(-0.19, 0.43, 0);
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.2, 8), rimMat);
      bar.rotation.x = Math.PI / 2;
      bar.position.set(0.18, 0.43, 0);
      // 地面柔光呼吸光圈 + 宽大透明点击热区（手机与鼠标都能轻松点中上车！）
      const glowHalo = new THREE.Mesh(
        new THREE.RingGeometry(0.32, 0.43, 28),
        new THREE.MeshBasicMaterial({ color: "#38bdf8", side: THREE.DoubleSide, transparent: true, opacity: 0.55 })
      );
      glowHalo.rotation.x = -Math.PI / 2;
      glowHalo.position.set(0, 0.02, 0);
      const hitBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.95, 0.72, 0.55),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
      );
      hitBox.position.set(0, 0.32, 0);
      bike.add(topTube, downTube, seatTube, fork, saddle, bar, glowHalo, hitBox);
      if (withPanniers) {
        const bagMat = new THREE.MeshToonMaterial({ color: "#f59e0b", gradientMap: STORYBOOK_GRAD });
        [-0.06, 0.06].forEach((bz) => {
          const bag = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.15, 0.055), bagMat);
          bag.position.set(-0.25, 0.25, bz);
          bike.add(bag);
        });
      }
      return bike;
    };
    const placeOnSphere = (obj, lat, lon, sink = 0) => {
      const u = latLonToUnitVec(lat, lon);
      const sr = getSurfaceRadius(id, u);
      obj.position.copy(u).multiplyScalar(sr - sink);
      obj.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), u);
      group.add(obj);
    };
    if (id === "luca-hainan") {
      const trunkMat = new THREE.MeshStandardMaterial({ color: "#8b6b4a", roughness: 0.88 });
      const palmMat = new THREE.MeshToonMaterial({ color: "#22c55e", gradientMap: STORYBOOK_GRAD });
      [[28, -14], [-14, 54], [-18, 156], [30, -122], [6, -78]].forEach(([plat, plon]) => {
        const palm = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.072, 0.88, 7), trunkMat);
        trunk.position.y = 0.42;
        trunk.rotation.z = 0.14;
        palm.add(trunk);
        for (let k = 0; k < 6; k++) {
          const frond = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.52, 4), palmMat);
          frond.scale.set(0.55, 1, 0.18);
          const fa = (k / 6) * Math.PI * 2;
          frond.position.set(-0.06 + Math.cos(fa) * 0.18, 0.84, Math.sin(fa) * 0.18);
          frond.rotation.set(Math.sin(fa) * 1.12, 0, -Math.cos(fa) * 1.12);
          palm.add(frond);
        }
        placeOnSphere(palm, plat, plon, 0.03);
      });
      const startSign = new THREE.Group();
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.026, 0.62, 8), trunkMat);
      post.position.y = 0.3;
      const board = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.18, 0.035),
        new THREE.MeshToonMaterial({ color: "#0284c7", gradientMap: STORYBOOK_GRAD })
      );
      board.position.y = 0.54;
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.035, 0.04), new THREE.MeshBasicMaterial({ color: "#fbbf24" }));
      stripe.position.y = 0.49;
      const roadBike = makeMiniBike("#38bdf8", false);
      roadBike.position.set(0.28, 0, 0.18);
      roadBike.rotation.y = -0.35;
      parkedBikeGroup = roadBike;
      parkedBikeUnitDir = latLonToUnitVec(20, -34);
      startSign.add(post, board, stripe, roadBike);
      placeOnSphere(startSign, 20, -34, 0.02);
    } else {
      const cabinGrp = new THREE.Group();
      const logMat = new THREE.MeshStandardMaterial({ color: "#7c5234", roughness: 0.86 });
      const roofMat = new THREE.MeshToonMaterial({ color: "#475569", gradientMap: STORYBOOK_GRAD });
      const walls = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.36, 0.44), logMat);
      walls.position.y = 0.18;
      const roof = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.28, 4), roofMat);
      roof.rotation.y = Math.PI / 4;
      roof.position.y = 0.48;
      const warmWin = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.14), new THREE.MeshBasicMaterial({ color: "#fde68a" }));
      warmWin.position.set(0, 0.2, 0.225);
      const tourBike = makeMiniBike("#14b8a6", true);
      tourBike.position.set(0.44, 0, 0.2);
      tourBike.rotation.y = -0.5;
      parkedBikeGroup = tourBike;
      parkedBikeUnitDir = latLonToUnitVec(-20, -118);
      cabinGrp.add(walls, roof, warmWin, tourBike);
      placeOnSphere(cabinGrp, -20, -118, 0.02);
    }
  }

  let cavernSporePts = null;
  let cavernGlowLight = null;
  if (id === "miemie-guizhou" || id === "miemie-shexiang" || id === "miemie-tonggudang") {
    const isFullCave = id === "miemie-shexiang";
    const fallWp = waypointObjs.find((w) => w.data.id === "mm-gz-2" || w.data.id === "mm-tgd-3");
    const crystalWp = waypointObjs.find((w) => w.data.id === "mm-gz-6") || fallWp;
    const centerDir = crystalWp ? crystalWp.unitDir.clone() : new THREE.Vector3(0, 1, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: "#38bdf8",
      emissive: "#0284c7",
      emissiveIntensity: 0.95,
      roughness: 0.25,
      transparent: true,
      opacity: 0.88,
    });
    const caveCount = isFullCave ? 22 : 10;
    for (let i = 0; i < caveCount; i++) {
      const randDir = isFullCave
        ? new THREE.Vector3(Math.sin(i * 2.39), Math.cos(i * 1.71), Math.sin(i * 3.13)).normalize()
        : centerDir
            .clone()
            .add(new THREE.Vector3(Math.sin(i * 1.9) * 0.18, Math.cos(i * 2.3) * 0.18, Math.sin(i * 2.9) * 0.18))
            .normalize();
      if (!isFullCave && waypointObjs.some((w) => w.unitDir.angleTo(randDir) < 0.09)) continue;
      const sr = getSurfaceRadius(id, randDir);
      const spire = new THREE.Mesh(new THREE.ConeGeometry(0.11 + (i % 3) * 0.04, 0.52 + (i % 4) * 0.18, 6), crystalMat);
      spire.position.copy(randDir).multiplyScalar(sr + 0.18);
      spire.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), randDir);
      group.add(spire);
    }
    if (!isFullCave && fallWp) {
      // 牛倒岩溶洞拱门与发光幽蓝地心瀑布水幕
      const cDir = fallWp.unitDir.clone().add(new THREE.Vector3(0.09, 0.04, -0.08)).normalize();
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
  if (id === "miemie-volcano") {
    // 乌兰哈达火山口赤红余烬微光池
    for (const [lat, lon, rad] of [[36, 132, 0.52], [12, -146, 0.38]]) {
      const cDir = latLonToUnitVec(lat, lon);
      const cr = getSurfaceRadius(id, cDir);
      const lavaPool = new THREE.Mesh(
        new THREE.CircleGeometry(rad, 20),
        new THREE.MeshBasicMaterial({ color: "#f97316", transparent: true, opacity: 0.82, side: THREE.DoubleSide })
      );
      lavaPool.position.copy(cDir).multiplyScalar(cr + 0.06);
      lavaPool.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), cDir);
      group.add(lavaPool);
      const lavaPt = new THREE.PointLight("#fb923c", 1.8, 5.0, 1.5);
      lavaPt.position.copy(cDir).multiplyScalar(cr + 0.45);
      group.add(lavaPt);
    }
  }
  if (id === "miemie-hulunbuir") {
    // 呼伦贝尔秋日金色大圆草垛（Golden Hay Bales）
    const baleCenter = latLonToUnitVec(22, -142);
    const baleMat = new THREE.MeshStandardMaterial({ color: "#eab308", roughness: 0.88 });
    const ringMat = new THREE.MeshStandardMaterial({ color: "#ca8a04", roughness: 0.92 });
    for (let i = 0; i < 6; i++) {
      const bDir = baleCenter
        .clone()
        .add(new THREE.Vector3(Math.sin(i * 1.45) * 0.26, Math.cos(i * 2.05) * 0.18, Math.sin(i * 2.75) * 0.26))
        .normalize();
      if (waypointObjs.some((w) => w.unitDir.angleTo(bDir) < 0.09)) continue;
      const br = getSurfaceRadius(id, bDir);
      const baleGrp = new THREE.Group();
      baleGrp.position.copy(bDir).multiplyScalar(br + 0.14);
      baleGrp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), bDir);
      const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.30, 14), baleMat);
      roll.rotation.z = Math.PI * 0.5;
      roll.rotation.y = i * 0.85;
      const strap = new THREE.Mesh(new THREE.TorusGeometry(0.162, 0.015, 6, 14), ringMat);
      strap.rotation.y = roll.rotation.y;
      baleGrp.add(roll, strap);
      group.add(baleGrp);
    }
  }
  let climateMode = "day";

  return {
    group,
    terrainMesh,
    waypointObjs,
    parkedBikeGroup,
    parkedBikeUnitDir,
    setParkedBikeMounted(mounted) {
      if (parkedBikeGroup) parkedBikeGroup.visible = !mounted;
    },
    refreshTrailLoop(discoveredSet) {
      for (const seg of trailSegments) {
        const lit = discoveredSet.has(seg.fromId) && discoveredSet.has(seg.toId);
        seg.mat.color.set(lit ? "#ffe596" : isCyclingPlanet ? "#fde047" : "#e5c16c");
        seg.mat.opacity = lit ? 0.96 : isCyclingPlanet ? 0.82 : 0.34;
        seg.mat.gapSize = lit ? 0.08 : isCyclingPlanet ? 0.18 : 0.22;
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

