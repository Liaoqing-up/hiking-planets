import * as THREE from "three";

function makeLabelSprite(text, accentColor = "#f0c768") {
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 72;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(10, 18, 40, 0.72)";
  ctx.strokeStyle = "rgba(240, 199, 104, 0.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(14, 12, 292, 48, 24);
  ctx.fill();
  ctx.stroke();

  ctx.font = "600 23px 'PingFang SC', 'Hiragino Sans GB', serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = accentColor;
  ctx.fillText(`✦ ${text}`, 160, 37);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    opacity: 0.62,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(7.6, 1.72, 1);
  return sprite;
}

export function createSkyWonders(activePlanet, allPlanets) {
  const group = new THREE.Group();
  const clickableMeshes = [];
  const distantOrbs = [];
  let telescopeActive = false;

  // ==================== 1. 远空邻近 5 颗微缩自转星球（星际望远镜直飞） ====================
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

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(1.55, 22, 18),
      new THREE.MeshStandardMaterial({
        color: p.palette.ground,
        emissive: p.palette.accent,
        emissiveIntensity: 0.34,
        roughness: 0.72,
      })
    );
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(2.25, 18, 14),
      new THREE.MeshBasicMaterial({
        color: p.palette.accent,
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
      })
    );
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(2.15, 2.55, 32),
      new THREE.MeshBasicMaterial({
        color: p.palette.accent,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.36,
      })
    );
    ring.rotation.x = 1.12;
    ring.rotation.y = i * 0.5;

    const label = makeLabelSprite(p.name, "#f6d98a");
    label.position.set(0, -3.05, 0);

    // 宽容点击拾取球，手机手指轻点星空即可跨星际直飞
    const hitMesh = new THREE.Mesh(
      new THREE.SphereGeometry(4.2, 10, 8),
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
      orbGroup,
      core,
      halo,
      ring,
      label,
      phase: i * 1.3,
      defaultPos: pos.clone(),
      observatoryPos: pos.clone(),
    });
  });

  // ==================== 2. 高山飘雪 → 云开日照金山奇遇 ====================
  const isAlpine = ["yading", "siguniang", "zhagana"].includes(activePlanet.id);
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
    mGroup.add(head, tail);
    group.add(mGroup);
    meteors.push({
      group: mGroup,
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

  return {
    group,
    getClickableMeshes: () => clickableMeshes,
    setTelescopeActive(on, frame = null) {
      telescopeActive = Boolean(on);
      if (telescopeActive && frame) {
        const { hikerPos, upDir, fwdDir, rightDir, isPortrait } = frame;
        const count = distantOrbs.length; // 其余全部 5 颗山海星球
        const downOffset = upDir.clone().multiplyScalar(-3.15);
        distantOrbs.forEach((orb, i) => {
          // 让名字铭牌始终垂直悬停于当前视角里每颗星球的正下方，不遮挡球体与星环
          orb.label.position.copy(downOffset);

          if (isPortrait) {
            // 手机竖屏：避开左侧功能栏与右边缘，在中央夜空排成错落有致的五曜星阵
            const portraitSlots = [
              { x: -5.2, y: 29.5 },
              { x: 6.2, y: 29.5 },
              { x: 0.6, y: 23.0 },
              { x: -4.8, y: 16.5 },
              { x: 6.4, y: 16.5 },
            ];
            const slot = portraitSlots[i % portraitSlots.length];
            orb.observatoryPos
              .copy(hikerPos)
              .addScaledVector(fwdDir, 54)
              .addScaledVector(rightDir, slot.x)
              .addScaledVector(upDir, slot.y);
          } else {
            // 电脑横屏：宽幅优雅拱月星弧，5 颗星球一字舒展同框
            const norm = count > 1 ? (i / (count - 1)) * 2 - 1 : 0;
            const lateral = norm * 25.5;
            const archLift = (1 - norm * norm * 0.58) * 8.5;
            orb.observatoryPos
              .copy(hikerPos)
              .addScaledVector(fwdDir, 48)
              .addScaledVector(rightDir, lateral)
              .addScaledVector(upDir, 20.5 + archLift);
          }
        });
      } else {
        distantOrbs.forEach((orb) => orb.label.position.set(0, -3.05, 0));
      }
    },
    triggerMeteorBurst,
    update(dt, elapsed, state = {}) {
      // 远空星球自转、观星模式全星系星弧聚拢同框与高亮
      const wantScale = telescopeActive ? (window.innerWidth < window.innerHeight ? 1.08 : 1.38) : 1.0;
      for (const orb of distantOrbs) {
        const goalPos = telescopeActive ? orb.observatoryPos : orb.defaultPos;
        orb.orbGroup.position.lerp(goalPos, Math.min(1, dt * 4.6));
        orb.core.rotation.y = elapsed * 0.35 + orb.phase;
        orb.ring.rotation.z = elapsed * 0.2;
        orb.orbGroup.scale.lerp(
          new THREE.Vector3(wantScale, wantScale, wantScale),
          Math.min(1, dt * 4.5)
        );
        orb.label.material.opacity = THREE.MathUtils.lerp(
          orb.label.material.opacity,
          telescopeActive ? 0.98 : 0.46,
          Math.min(1, dt * 5)
        );
        orb.halo.material.opacity = telescopeActive
          ? 0.3 + Math.sin(elapsed * 3 + orb.phase) * 0.08
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

      // 星夜驻足自动流星雨
      if (meteorCooldown > 0) meteorCooldown -= dt;
      const starryPlanet = activePlanet.id === "tengger" || activePlanet.id === "yili";
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
