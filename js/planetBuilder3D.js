import * as THREE from "three";

export const PLANET_RADIUS = 12;
const UP = new THREE.Vector3(0, 1, 0);

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

export function getSurfaceRadius(planetId, dir) {
  const x = dir.x, y = dir.y, z = dir.z;
  const base = fbm3(x, y, z);

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
    let h = PLANET_RADIUS + 0.24 + Math.abs(base) * 0.34;
    const yaomei = Math.hypot(x - 0.22, y - 0.85, z + 0.46);
    if (yaomei < 0.54) h += Math.pow((0.54 - yaomei) / 0.54, 1.55) * 2.25;
    const ridge = Math.abs(x * 0.65 + z * 0.75);
    if (ridge < 0.28 && y > -0.2) h += (0.28 - ridge) * 1.9;
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

  const mat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.8 });
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
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.86,
      metalness: 0.04,
    })
  );
  terrainMesh.name = "planet-terrain";
  group.add(terrainMesh);

  // 2. 水体球壳（海洋 / 高山湖泊 / 赤红盐湖）
  let waterMesh = null;
  if (id !== "zhagana" && id !== "siguniang" && id !== "title") {
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

    const postGroup = new THREE.Group();
    const postBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.44, 0.18),
      new THREE.MeshStandardMaterial({ color: "#26734d", roughness: 0.65 })
    );
    postBox.position.y = 0.22;
    const slot = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.04, 0.2),
      new THREE.MeshBasicMaterial({ color: "#fff2cc" })
    );
    slot.position.y = 0.34;
    const sacredTree = createTree("spruce", "#eb9e2d");
    sacredTree.scale.setScalar(1.65);
    sacredTree.position.set(-0.42, 0, -0.1);
    postGroup.add(postBox, slot, sacredTree);
    placeOnSphere(postGroup, latLonToUnitVec(32, -106), 0, id);
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
    // ① 大峰 5025m 红字圆梦石碑 + 攀登绳索
    const steleGroup = new THREE.Group();
    const stele = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.68, 0.14),
      new THREE.MeshStandardMaterial({ color: "#cfd6de", roughness: 0.75 })
    );
    stele.position.y = 0.34;
    const redInscr = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.42, 0.155),
      new THREE.MeshBasicMaterial({ color: "#e02b2b" })
    );
    redInscr.position.y = 0.34;
    steleGroup.add(stele, redInscr);
    placeOnSphere(steleGroup, latLonToUnitVec(52, -106), 0, id);
    group.add(steleGroup);

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
      new THREE.SphereGeometry(0.85, 24, 20),
      new THREE.MeshBasicMaterial({ color: "#fff8d6" })
    );
    fullMoon.position.copy(latLonToUnitVec(-32, -68)).multiplyScalar(PLANET_RADIUS + 4.2);
    const moonGlow = new THREE.Mesh(
      new THREE.SphereGeometry(1.4, 20, 16),
      new THREE.MeshBasicMaterial({
        color: "#ffeeb0",
        transparent: true,
        opacity: 0.26,
        blending: THREE.AdditiveBlending,
      })
    );
    fullMoon.add(moonGlow);
    group.add(fullMoon);
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
      }

      if (prop) {
        placeOnSphere(prop, d, -0.02, id);
        group.add(prop);
      }
    }
  }

  // 6. 四个可交互徒步路标信标（Waypoints）
  const waypointObjs = waypoints.map((wp) => {
    const unitDir = latLonToUnitVec(wp.lat, wp.lon);
    const r = getSurfaceRadius(id, unitDir);
    const wpGroup = new THREE.Group();
    wpGroup.position.copy(unitDir).multiplyScalar(r);
    wpGroup.quaternion.setFromUnitVectors(UP, unitDir);

    // 玛尼石堆底座 + 发光星晶 + 光环
    const cairn = new THREE.Mesh(
      new THREE.ConeGeometry(0.24, 0.42, 6),
      new THREE.MeshStandardMaterial({ color: "#dfd5c5", roughness: 0.8 })
    );
    cairn.position.y = 0.2;
    wpGroup.add(cairn);

    const crystalMat = new THREE.MeshBasicMaterial({ color: "#ffe28a" });
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), crystalMat);
    crystal.position.y = 0.68;
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

  return {
    group,
    terrainMesh,
    waypointObjs,
    update(dt, elapsed) {
      cloudsGroup.rotation.y += dt * 0.035;
      particles.rotation.y += dt * 0.07;
      particles.rotation.x = Math.sin(elapsed * 0.25) * 0.08;

      if (waterMesh) {
        const s = 1 + Math.sin(elapsed * 1.8) * 0.0025;
        waterMesh.scale.setScalar(s);
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

  const jacketMat = new THREE.MeshStandardMaterial({ color: "#a62938", roughness: 0.65 }); // 腾格里酒红冲锋衣
  const pantsMat = new THREE.MeshStandardMaterial({ color: "#2b303c", roughness: 0.85 });
  const maskMat = new THREE.MeshStandardMaterial({ color: "#d6d8de", roughness: 0.8 }); // 防风沙护脸面罩
  const skinMat = new THREE.MeshStandardMaterial({ color: "#fce2cc", roughness: 0.72 });
  const hairMat = new THREE.MeshStandardMaterial({ color: "#1e1b1c", roughness: 0.82 }); // 深色双小辫
  const hatMat = new THREE.MeshStandardMaterial({ color: "#32353d", roughness: 0.85 }); // 深炭灰宽檐防晒帽
  const packMat = new THREE.MeshStandardMaterial({ color: "#6e737d", roughness: 0.78 }); // 灰色重装徒步包
  const padMat = new THREE.MeshStandardMaterial({ color: "#b8bec8", roughness: 0.55, metalness: 0.25 }); // 银灰折叠蛋巢防潮垫
  const visorMat = new THREE.MeshStandardMaterial({
    color: "#ff551a",
    emissive: "#ff6a1a",
    emissiveIntensity: 0.45,
    roughness: 0.18,
    metalness: 0.75,
  }); // 炫彩橘红镀膜风镜

  // 双腿与登山靴
  const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.048, 0.28, 8), pantsMat);
  leftLeg.position.set(-0.075, 0.14, 0);
  const rightLeg = leftLeg.clone();
  rightLeg.position.set(0.075, 0.14, 0);
  bodyPivot.add(leftLeg, rightLeg);

  // 酒红色冲锋衣躯干 + 连帽领口
  const torso = new THREE.Mesh(new THREE.ConeGeometry(0.205, 0.43, 12), jacketMat);
  torso.position.y = 0.44;
  const hoodCollar = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.038, 8, 16), jacketMat);
  hoodCollar.rotation.x = Math.PI / 2;
  hoodCollar.position.y = 0.62;
  bodyPivot.add(torso, hoodCollar);

  // 60L 重装大包 + 侧面银灰折叠蛋巢防潮垫 + 毛球挂件 + 平安进山小红牌
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
  bodyPivot.add(pack, eggPad, pomPom, redCharm);

  // 头部 + 浅灰防晒护脸面罩 + 亮橙红镀膜大护目镜
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 14), skinMat);
  head.position.y = 0.74;
  const faceMask = new THREE.Mesh(
    new THREE.CylinderGeometry(0.135, 0.125, 0.12, 14),
    maskMat
  );
  faceMask.position.set(0, 0.69, 0.015);
  const goggles = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.072, 0.08), visorMat);
  goggles.position.set(0, 0.755, 0.115);
  bodyPivot.add(head, faceMask, goggles);

  // 深炭灰大宽檐户外防晒渔夫帽
  const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.025, 20), hatMat);
  hatBrim.position.y = 0.825;
  const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.155, 0.11, 16), hatMat);
  hatCrown.position.y = 0.885;
  bodyPivot.add(hatBrim, hatCrown);

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
    return pivot;
  }
  const leftArm = makeArmPole(-1);
  const rightArm = makeArmPole(1);

  return {
    root,
    setHeadlamp(on) {
      lampLens.visible = Boolean(on);
      headLight.intensity = on ? 4.6 : 0;
    },
    update(dt, elapsed, speedRatio = 0) {
      const s = THREE.MathUtils.clamp(speedRatio, 0, 1.8);
      const walkPhase = elapsed * (7.5 + s * 3.5);
      const swing = Math.sin(walkPhase) * 0.55 * Math.min(1, s);

      leftLeg.rotation.x = swing;
      rightLeg.rotation.x = -swing;
      leftArm.rotation.x = -swing * 0.85;
      rightArm.rotation.x = swing * 0.85;

      bodyPivot.position.y = Math.abs(Math.sin(walkPhase)) * 0.045 * Math.min(1, s);
      bodyPivot.rotation.x = s * 0.08;

      // 双小辫随微风与步伐俏皮轻晃
      const braidBounce = Math.sin(walkPhase * 2) * (0.06 + s * 0.18);
      const breeze = Math.sin(elapsed * 3.4) * 0.08;
      leftBraid.rotation.z = -0.18 - Math.abs(braidBounce) * 0.5 + breeze * 0.4;
      rightBraid.rotation.z = 0.18 + Math.abs(braidBounce) * 0.5 + breeze * 0.4;
      leftBraid.rotation.x = -0.12 - s * 0.25 + Math.cos(elapsed * 4.1) * 0.06;
      rightBraid.rotation.x = -0.12 - s * 0.25 + Math.sin(elapsed * 4.1) * 0.06;
    },
  };
}
