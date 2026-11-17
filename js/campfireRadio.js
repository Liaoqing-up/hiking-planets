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

  return {
    group,
    placeInFrontOfHiker(upDir, forwardDir, surfacePos) {
      const right = new THREE.Vector3().crossVectors(upDir, forwardDir).normalize();
      group.position
        .copy(surfacePos)
        .addScaledVector(forwardDir, 0.68)
        .addScaledVector(right, 0.12)
        .addScaledVector(upDir, -0.02);
      group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), upDir);
      group.visible = true;
      fireLight.intensity = 2.8;
    },
    hide() {
      group.visible = false;
      fireLight.intensity = 0;
    },
    update(elapsed) {
      if (!group.visible) return;
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
