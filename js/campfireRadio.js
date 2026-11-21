import * as THREE from "three";

export function buildCampfireRig() {
  const group = new THREE.Group();
  group.visible = false;

  const woodMat = new THREE.MeshStandardMaterial({ color: "#5c3a21", roughness: 0.9 });
  for (let i = 0; i < 4; i++) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.038, 0.42, 7), woodMat);
    log.position.y = 0.04;
    log.rotation.z = Math.PI * 0.44;
    log.rotation.y = (i / 4) * Math.PI;
    group.add(log);
  }

  const stoneMat = new THREE.MeshStandardMaterial({ color: "#78716c", roughness: 0.85 });
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.055, 0), stoneMat);
    st.position.set(Math.cos(a) * 0.24, 0.03, Math.sin(a) * 0.24);
    group.add(st);
  }

  const outerFlameMat = new THREE.MeshBasicMaterial({
    color: "#f97316",
    transparent: true,
    opacity: 0.88,
  });
  const innerFlameMat = new THREE.MeshBasicMaterial({
    color: "#fde047",
    transparent: true,
    opacity: 0.92,
  });
  const outerFlame = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.36, 8), outerFlameMat);
  outerFlame.position.y = 0.2;
  const innerFlame = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.24, 8), innerFlameMat);
  innerFlame.position.y = 0.16;

  const fireLight = new THREE.PointLight("#ff8c24", 0, 7.5, 1.8);
  fireLight.position.set(0, 0.36, 0);
  group.add(outerFlame, innerFlame, fireLight);

  const sparks = [];
  const sparkMat = new THREE.MeshBasicMaterial({ color: "#fde68a" });
  for (let i = 0; i < 8; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), sparkMat);
    group.add(s);
    sparks.push({ mesh: s, phase: i * 0.125 });
  }

  // 火堆石块旁摆放户外露营钛金属马克杯 + 袅袅热茶白气
  const mugGroup = new THREE.Group();
  mugGroup.position.set(-0.28, 0.055, -0.14);
  const tiMat = new THREE.MeshStandardMaterial({ color: "#94a3b8", metalness: 0.65, roughness: 0.35 });
  const mugCup = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.038, 0.095, 12), tiMat);
  const mugHandle = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.006, 6, 12, Math.PI), tiMat);
  mugHandle.rotation.z = -Math.PI / 2;
  mugHandle.position.set(-0.042, 0, 0);
  const teaTop = new THREE.Mesh(
    new THREE.CircleGeometry(0.036, 12),
    new THREE.MeshBasicMaterial({ color: "#d97706" })
  );
  teaTop.rotation.x = -Math.PI / 2;
  teaTop.position.y = 0.044;
  mugGroup.add(mugCup, mugHandle, teaTop);

  const steamPuffs = [];
  const steamMat = new THREE.MeshBasicMaterial({
    color: "#f8fafc",
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
  });
  for (let i = 0; i < 3; i++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.018, 7, 7), steamMat);
    mugGroup.add(puff);
    steamPuffs.push({ mesh: puff, phase: i * 0.33 });
  }
  group.add(mugGroup);

  // ⛺ 围炉扎营 3D 暖光高山双人星空帐篷（交叉铝杆穹顶 + 暖橘内帐营灯 + 防风绳地钉 + 卷起蛋巢垫）
  const tentGroup = new THREE.Group();
  tentGroup.position.set(-0.78, -0.04, 0.56);
  tentGroup.rotation.y = 0.52;

  const groundSheet = new THREE.Mesh(
    new THREE.BoxGeometry(0.96, 0.025, 0.82),
    new THREE.MeshStandardMaterial({ color: "#334155", roughness: 0.9 })
  );
  groundSheet.position.y = 0.012;

  const flyMat = new THREE.MeshStandardMaterial({
    color: "#f59e0b",
    emissive: "#b45309",
    emissiveIntensity: 0.22,
    roughness: 0.55,
  });
  const domeGeo = new THREE.SphereGeometry(0.46, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.52);
  const tentDome = new THREE.Mesh(domeGeo, flyMat);
  tentDome.scale.set(1.02, 0.96, 0.86);
  tentDome.position.y = 0.015;

  // 双交叉铝合金防风外帐杆
  const poleMat = new THREE.MeshStandardMaterial({ color: "#fde68a", metalness: 0.65, roughness: 0.3 });
  const poleA = new THREE.Mesh(new THREE.TorusGeometry(0.465, 0.011, 6, 24, Math.PI), poleMat);
  poleA.rotation.y = 0.62;
  poleA.scale.set(1.0, 0.97, 1.0);
  poleA.position.y = 0.015;
  const poleB = poleA.clone();
  poleB.rotation.y = -0.62;

  // 微敞前门厅透出的暖橘色营地帐灯柔光面 + 悬挂小马灯珠
  const innerWarmMat = new THREE.MeshBasicMaterial({ color: "#fef08a", transparent: true, opacity: 0.92 });
  const doorGlow = new THREE.Mesh(new THREE.ConeGeometry(0.21, 0.34, 3), innerWarmMat);
  doorGlow.position.set(0, 0.16, -0.35);
  doorGlow.rotation.x = -0.14;
  doorGlow.scale.set(1.0, 1.0, 0.22);

  const lanternOrb = new THREE.Mesh(
    new THREE.SphereGeometry(0.042, 10, 10),
    new THREE.MeshBasicMaterial({ color: "#fffbeb" })
  );
  lanternOrb.position.set(0, 0.29, -0.36);

  // 门帘两侧卷起固定边 + 四角防风绳地钉 + 帐旁蛋巢防潮垫卷
  const flapMat = new THREE.MeshStandardMaterial({ color: "#1e293b", roughness: 0.7 });
  const flapL = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.03, 0.34, 8), flapMat);
  flapL.position.set(-0.12, 0.16, -0.36);
  flapL.rotation.z = -0.52;
  const flapR = flapL.clone();
  flapR.position.x = 0.12;
  flapR.rotation.z = 0.52;

  const rollMat = new THREE.MeshStandardMaterial({ color: "#fbbf24", roughness: 0.6 });
  const foamRoll = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.36, 12), rollMat);
  foamRoll.rotation.z = Math.PI / 2;
  foamRoll.position.set(0.32, 0.068, -0.36);

  [[-0.52, -0.44], [0.52, -0.44], [-0.52, 0.44], [0.52, 0.44]].forEach(([gx, gz]) => {
    const peg = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.004, 0.08, 6), poleMat);
    peg.position.set(gx, 0.03, gz);
    tentGroup.add(peg);
  });

  tentGroup.add(groundSheet, tentDome, poleA, poleB, doorGlow, lanternOrb, flapL, flapR, foamRoll);
  group.add(tentGroup);

  let tentPopTime = 1;
  const basisMat = new THREE.Matrix4();
  const TENT_THEMES = {
    mine: { fly: "#f59e0b", emi: "#b45309", roll: "#38bdf8" },
    kitty: { fly: "#f472b6", emi: "#be185d", roll: "#fde047" },
    miemie: { fly: "#10b981", emi: "#047857", roll: "#fbbf24" },
    luca: { fly: "#0ea5e9", emi: "#0369a1", roll: "#f97316" },
  };

  return {
    group,
    tentGroup,
    placeInFrontOfHiker(upDir, forwardDir, surfacePos, ownerRole = "mine") {
      const right = new THREE.Vector3().crossVectors(upDir, forwardDir).normalize();
      const trueFwd = new THREE.Vector3().crossVectors(right, upDir).normalize();
      const th = TENT_THEMES[ownerRole] || TENT_THEMES.mine;
      flyMat.color.set(th.fly);
      flyMat.emissive.set(th.emi);
      rollMat.color.set(th.roll);
      group.position
        .copy(surfacePos)
        .addScaledVector(trueFwd, 0.68)
        .addScaledVector(right, 0.12)
        .addScaledVector(upDir, -0.02);
      group.quaternion.setFromRotationMatrix(basisMat.makeBasis(right, upDir, trueFwd));
      group.visible = true;
      tentPopTime = 0;
      tentGroup.scale.set(0.1, 0.05, 0.1);
      fireLight.intensity = 2.8;
    },
    hide() {
      group.visible = false;
      fireLight.intensity = 0;
    },
    update(elapsed, dt = 0.016) {
      if (!group.visible) return;
      if (tentPopTime < 1) {
        tentPopTime = Math.min(1, tentPopTime + dt * 2.8);
        const ease = 1 - Math.pow(1 - tentPopTime, 3) + Math.sin(tentPopTime * Math.PI) * 0.08 * (1 - tentPopTime);
        tentGroup.scale.set(ease, ease, ease);
      }
      innerWarmMat.opacity = 0.84 + Math.sin(elapsed * 5.2) * 0.1;
      const flicker = 1 + Math.sin(elapsed * 14.0) * 0.12 + Math.cos(elapsed * 23.0) * 0.08;
      outerFlame.scale.set(1, flicker, 1);
      innerFlame.scale.set(1, 1.15 - (flicker - 1), 1);
      fireLight.intensity = 2.5 + (flicker - 1) * 3.2;

      for (const sp of sparks) {
        const p = (elapsed * 0.65 + sp.phase) % 1;
        sp.mesh.position.set(
          Math.sin(elapsed * 3 + sp.phase * 12) * 0.12,
          0.18 + p * 0.65,
          Math.cos(elapsed * 2.6 + sp.phase * 10) * 0.12
        );
        sp.mesh.scale.setScalar(Math.max(0.01, (1 - p) * 1.1));
      }

      for (const st of steamPuffs) {
        const p = (elapsed * 0.45 + st.phase) % 1;
        st.mesh.position.set(
          Math.sin(elapsed * 2.2 + st.phase * 8) * 0.02,
          0.07 + p * 0.22,
          Math.cos(elapsed * 2.0 + st.phase * 8) * 0.02
        );
        st.mesh.scale.setScalar((0.6 + p * 0.9) * (1 - p * 0.65));
      }
    },
  };
}
