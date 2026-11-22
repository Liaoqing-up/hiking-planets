import * as THREE from "three";

/**
 * 构建未登录首屏《行者的星球》星海总扉页专属 3D 深空宇宙缩影场景：
 * 1. 多座色彩各异的旋臂星系微缩星云（金色苍山星河、樱粉猫耳星云、翡翠绵羊星云、冰蓝追风星云、紫罗兰远方星系）
 * 2. 远处深空悬浮的待探索黑暗星球剪影（背光边缘冷蓝/鎏金日冕轮廓光 + 微弱星环 + 神秘信标）
 * 3. 前景微缩观星台崖顶与仰望深空的行者剪影落点
 */
export function buildPrologueCosmosWorld() {
  const group = new THREE.Group();
  const galaxies = [];
  const silhouettes = [];

  // 柔和发光星尘贴图（Canvas 动态生成，零网络请求）
  const glowCanvas = document.createElement("canvas");
  glowCanvas.width = 64;
  glowCanvas.height = 64;
  const gCtx = glowCanvas.getContext("2d");
  const grad = gCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.28, "rgba(255,248,225,0.82)");
  grad.addColorStop(0.65, "rgba(190,220,255,0.22)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  gCtx.fillStyle = grad;
  gCtx.fillRect(0, 0, 64, 64);
  const glowTex = new THREE.CanvasTexture(glowCanvas);

  // 1. 构建多座旋臂银河系缩影（精确排布在中央玻璃卡片左右两侧及天顶高处，完全不被卡片遮挡！）
  const galaxySpecs = [
    { pos: [-22.5, 9.6, -15], radius: 6.8, arms: 3, count: 680, coreCol: "#fef08a", armCol: "#f59e0b", tilt: [0.58, 0.25, -0.32], speed: 0.085 },
    { pos: [22.8, 10.2, -16], radius: 6.4, arms: 4, count: 640, coreCol: "#fbcfe8", armCol: "#ec4899", tilt: [0.66, -0.34, 0.28], speed: -0.075 },
    { pos: [-24.0, -5.8, -18], radius: 5.6, arms: 3, count: 540, coreCol: "#a7f3d0", armCol: "#10b981", tilt: [0.48, 0.42, 0.18], speed: 0.092 },
    { pos: [24.2, -5.0, -15], radius: 5.8, arms: 3, count: 560, coreCol: "#bae6fd", armCol: "#38bdf8", tilt: [0.52, -0.28, -0.36], speed: -0.088 },
    { pos: [-8.5, 14.8, -24], radius: 4.8, arms: 2, count: 440, coreCol: "#e9d5ff", armCol: "#a855f7", tilt: [0.72, 0.12, 0.24], speed: 0.065 },
    { pos: [9.8, 15.2, -26], radius: 4.4, arms: 3, count: 400, coreCol: "#fde68a", armCol: "#60a5fa", tilt: [0.62, -0.18, -0.22], speed: -0.07 },
  ];

  for (const spec of galaxySpecs) {
    const galGroup = new THREE.Group();
    galGroup.position.set(...spec.pos);
    galGroup.rotation.set(...spec.tilt);

    const positions = new Float32Array(spec.count * 3);
    const colors = new Float32Array(spec.count * 3);
    const cCore = new THREE.Color(spec.coreCol);
    const cArm = new THREE.Color(spec.armCol);
    const cMix = new THREE.Color();

    for (let i = 0; i < spec.count; i++) {
      const t = Math.pow(Math.random(), 1.45);
      const r = t * spec.radius;
      const armIdx = i % spec.arms;
      const branchAngle = (armIdx / spec.arms) * Math.PI * 2;
      const spinAngle = r * 1.15;
      const scatter = (1 - t * 0.55) * 0.48;
      const rx = (Math.random() - 0.5) * scatter;
      const ry = (Math.random() - 0.5) * scatter * 0.28;
      const rz = (Math.random() - 0.5) * scatter;

      positions[i * 3] = Math.cos(branchAngle + spinAngle) * r + rx;
      positions[i * 3 + 1] = ry;
      positions[i * 3 + 2] = Math.sin(branchAngle + spinAngle) * r + rz;

      cMix.copy(cCore).lerp(cArm, Math.min(1, t * 1.15));
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
        size: 0.34,
        map: glowTex,
        vertexColors: true,
        transparent: true,
        opacity: 0.92,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );

    const coreHalo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        color: spec.coreCol,
        transparent: true,
        opacity: 0.68,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    coreHalo.scale.setScalar(spec.radius * 0.62);

    const spinHolder = new THREE.Group();
    spinHolder.add(pts, coreHalo);
    galGroup.add(spinHolder);
    group.add(galGroup);
    galaxies.push({ spinHolder, speed: spec.speed, coreHalo, phase: Math.random() * 6.28 });
  }

  return attachSilhouettesAndOutcrop(group, galaxies, silhouettes, glowTex);
}

function attachSilhouettesAndOutcrop(group, galaxies, silhouettes, glowTex) {
  // 2. 远处深空悬浮的「待探索黑暗星球剪影」（排布在左翼、右翼、天顶与下缘深空，日食轮廓清晰可见）
  const silhouetteSpecs = [
    { pos: [-15.8, 1.4, -8.5], r: 2.55, rimCol: "#38bdf8", hasRing: true, ringCol: "#7dd3fc", phase: 0.4 },
    { pos: [16.4, 2.0, -9.8], r: 2.95, rimCol: "#f59e0b", hasRing: true, ringCol: "#fcd34d", phase: 1.9 },
    { pos: [-12.2, -9.2, -10.5], r: 1.85, rimCol: "#a78bfa", hasRing: false, phase: 3.1 },
    { pos: [12.8, -8.8, -9.2], r: 2.05, rimCol: "#34d399", hasRing: false, phase: 4.5 },
    { pos: [0.4, 12.6, -18.5], r: 3.1, rimCol: "#60a5fa", hasRing: true, ringCol: "#93c5fd", phase: 2.4 },
    { pos: [-19.2, 11.2, -22.0], r: 1.7, rimCol: "#f472b6", hasRing: false, phase: 5.2 },
    { pos: [19.5, -10.8, -20.0], r: 2.2, rimCol: "#fbbf24", hasRing: false, phase: 0.9 },
  ];

  const darkSphereGeo = new THREE.IcosahedronGeometry(1, 3);
  for (const s of silhouetteSpecs) {
    const pWrap = new THREE.Group();
    pWrap.position.set(...s.pos);

    // 深邃剪影本体（仅边缘受微弱环境天光勾勒，保留神秘未探索感）
    const darkBody = new THREE.Mesh(
      darkSphereGeo,
      new THREE.MeshStandardMaterial({
        color: "#050914",
        roughness: 0.92,
        metalness: 0.08,
        emissive: "#070d1f",
        emissiveIntensity: 0.45,
      })
    );
    darkBody.scale.setScalar(s.r);
    pWrap.add(darkBody);

    // 日食式背光轮廓薄冕（Rim Halo）
    const rimRing = new THREE.Mesh(
      new THREE.RingGeometry(s.r * 0.985, s.r * 1.075, 48),
      new THREE.MeshBasicMaterial({
        color: s.rimCol,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.58,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    pWrap.add(rimRing);

    const outerGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        color: s.rimCol,
        transparent: true,
        opacity: 0.24,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    outerGlow.scale.setScalar(s.r * 3.1);
    pWrap.add(outerGlow);

    // 行星环剪影
    let orbitRing = null;
    if (s.hasRing) {
      orbitRing = new THREE.Mesh(
        new THREE.RingGeometry(s.r * 1.32, s.r * 1.78, 56),
        new THREE.MeshBasicMaterial({
          color: s.ringCol,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.26,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      orbitRing.rotation.set(1.22, 0.28, -0.35);
      pWrap.add(orbitRing);
    }

    // 星球表面一颗微弱闪烁的「待点亮路标信标」
    const beacon = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        color: "#fef08a",
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    beacon.position.set(s.r * 0.42, s.r * 0.76, s.r * 0.52);
    beacon.scale.setScalar(0.45);
    pWrap.add(beacon);

    group.add(pWrap);
    silhouettes.push({
      pWrap,
      baseY: s.pos[1],
      rimRing,
      beacon,
      orbitRing,
      phase: s.phase,
    });
  }

  // 3. 底部前景：悬浮于星海之畔的「观星初生小行星脊」与星轨罗盘光环（刚好露在中央卡片底缘下方）
  const pedestal = new THREE.Group();
  pedestal.position.set(0, -13.4, 4.5);

  const planetCap = new THREE.Mesh(
    new THREE.IcosahedronGeometry(6.2, 3),
    new THREE.MeshStandardMaterial({
      color: "#0b1630",
      roughness: 0.86,
      metalness: 0.12,
      emissive: "#112248",
      emissiveIntensity: 0.35,
      flatShading: true,
    })
  );
  pedestal.add(planetCap);

  const astrolabeRing1 = new THREE.Mesh(
    new THREE.RingGeometry(6.8, 6.88, 72),
    new THREE.MeshBasicMaterial({
      color: "#f59e0b",
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  astrolabeRing1.rotation.x = Math.PI * 0.46;

  const astrolabeRing2 = new THREE.Mesh(
    new THREE.RingGeometry(7.9, 7.96, 72),
    new THREE.MeshBasicMaterial({
      color: "#38bdf8",
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.2,
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
        g.coreHalo.material.opacity = 0.55 + Math.sin(elapsed * 1.6 + g.phase) * 0.16;
      }
      for (const s of silhouettes) {
        s.pWrap.position.y = s.baseY + Math.sin(elapsed * 0.65 + s.phase) * 0.24;
        s.beacon.material.opacity = 0.35 + Math.sin(elapsed * 2.6 + s.phase) * 0.42;
        if (s.orbitRing) {
          s.orbitRing.rotation.z = -0.35 + Math.sin(elapsed * 0.3 + s.phase) * 0.08;
        }
      }
      astrolabeRing1.rotation.z = elapsed * 0.05;
      astrolabeRing2.rotation.z = -elapsed * 0.035;
    },
  };
}

