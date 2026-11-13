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

  // 5. 星球专属 3D 微缩生态与地标道具
  const rand = seededRand(id.charCodeAt(0) * 137 + id.length * 41);
  const wpDirs = waypoints.map((w) => latLonToUnitVec(w.lat, w.lon));
  const isNearWp = (d) => wpDirs.some((wd) => wd.distanceTo(d) < 0.24);

  if (id === "title") {
    const camp = createCampSite("#f29638");
    placeOnSphere(camp, latLonToUnitVec(74, 48), 0, id);
    group.add(camp);
    animatedProps.push(camp);
    for (let i = 0; i < 30; i++) {
      const d = new THREE.Vector3(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize();
      if (d.distanceTo(UP) < 0.28) continue;
      const tree = createTree("spruce", i % 3 === 0 ? "#d99838" : "#2f7349");
      tree.scale.setScalar(0.8 + rand() * 0.55);
      placeOnSphere(tree, d, -0.04, id);
      group.add(tree);
    }
  } else {
    // 放置一座温暖露营地
    const campDir = latLonToUnitVec(-8, -12);
    const camp = createCampSite(pal.accent || "#f09436");
    placeOnSphere(camp, campDir, 0, id);
    group.add(camp);
    animatedProps.push(camp);

    const propCount = 85;
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
  const root = new THREE.Group();
  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);

  const jacketMat = new THREE.MeshStandardMaterial({ color: "#2e7552", roughness: 0.72 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: "#2b354a", roughness: 0.85 });
  const skinMat = new THREE.MeshStandardMaterial({ color: "#fce0c8", roughness: 0.75 });
  const packMat = new THREE.MeshStandardMaterial({ color: "#c96238", roughness: 0.78 });
  const goldMat = new THREE.MeshStandardMaterial({
    color: "#f5c856",
    emissive: "#d99b26",
    emissiveIntensity: 0.22,
    roughness: 0.6,
  });

  // 双腿与登山靴
  const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.28, 8), pantsMat);
  leftLeg.position.set(-0.08, 0.14, 0);
  const rightLeg = leftLeg.clone();
  rightLeg.position.set(0.08, 0.14, 0);
  bodyPivot.add(leftLeg, rightLeg);

  // 冲锋衣躯干
  const torso = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.42, 10), jacketMat);
  torso.position.y = 0.44;
  bodyPivot.add(torso);

  // 重装登山背包 + 黄色防潮垫卷
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.3, 0.16), packMat);
  pack.position.set(0, 0.46, -0.14);
  const matRoll = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.045, 0.26, 8),
    goldMat
  );
  matRoll.rotation.z = Math.PI / 2;
  matRoll.position.set(0, 0.63, -0.14);
  bodyPivot.add(pack, matRoll);

  // 头部与户外探险帽
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.145, 16, 14), skinMat);
  head.position.y = 0.74;
  bodyPivot.add(head);

  const hatBrim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.23, 0.03, 16),
    new THREE.MeshStandardMaterial({ color: "#9c7044", roughness: 0.85 })
  );
  hatBrim.position.y = 0.83;
  const hatCrown = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.15, 0.11, 14),
    hatBrim.material
  );
  hatCrown.position.y = 0.89;
  bodyPivot.add(hatBrim, hatCrown);

  // 头灯（星夜模式亮起）
  const lampLens = new THREE.Mesh(
    new THREE.SphereGeometry(0.035, 8, 8),
    new THREE.MeshBasicMaterial({ color: "#fff5cc" })
  );
  lampLens.position.set(0, 0.88, 0.14);
  bodyPivot.add(lampLens);

  const headLight = new THREE.SpotLight("#ffefc2", 0, 9, Math.PI / 4, 0.55, 1.2);
  headLight.position.set(0, 0.9, 0.16);
  headLight.target.position.set(0, 0.1, 2.8);
  bodyPivot.add(headLight, headLight.target);
  lampLens.visible = false;

  // 左右手臂与双登山杖
  function makeArmPole(side) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.18, 0.56, 0);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.038, 0.22, 7), jacketMat);
    arm.position.set(0, -0.09, 0.04);
    arm.rotation.x = -0.35;
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.01, 0.62, 6),
      new THREE.MeshStandardMaterial({ color: "#e5ecf5", metalness: 0.5 })
    );
    pole.position.set(0, -0.26, 0.14);
    pole.rotation.x = 0.18;
    pivot.add(arm, pole);
    bodyPivot.add(pivot);
    return pivot;
  }
  const leftArm = makeArmPole(-1);
  const rightArm = makeArmPole(1);

  // 小王子致敬：随风波浪飘舞的暖金色长围巾
  const scarfRing = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.036, 8, 16), goldMat);
  scarfRing.rotation.x = Math.PI / 2;
  scarfRing.position.y = 0.62;
  bodyPivot.add(scarfRing);

  const scarfSegments = [];
  for (let i = 0; i < 6; i++) {
    const seg = new THREE.Mesh(
      new THREE.BoxGeometry(0.09 - i * 0.008, 0.025, 0.12),
      goldMat
    );
    bodyPivot.add(seg);
    scarfSegments.push(seg);
  }

  return {
    root,
    setHeadlamp(on) {
      lampLens.visible = Boolean(on);
      headLight.intensity = on ? 4.2 : 0;
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

      // 金色围巾在微风与步伐中柔美波动
      for (let i = 0; i < scarfSegments.length; i++) {
        const seg = scarfSegments[i];
        const t = i + 1;
        const waveX = Math.sin(elapsed * 4.2 - i * 0.65) * (0.03 + i * 0.018);
        const waveY = Math.cos(elapsed * 3.6 - i * 0.55) * 0.022 + s * 0.02 * i;
        seg.position.set(waveX, 0.61 - i * 0.018 + waveY, -0.11 - t * 0.095);
        seg.rotation.y = Math.cos(elapsed * 4.2 - i * 0.65) * 0.22;
      }
    },
  };
}
