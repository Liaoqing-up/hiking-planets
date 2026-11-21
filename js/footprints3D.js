import * as THREE from "three";
import { getSurfaceRadius, PLANET_RADIUS } from "./sphereMath.js?v=4.2.5-release";

const POOL_SIZE = 34;
const RIPPLE_POOL_SIZE = 14;
const FOOTPRINT_LIFE = 6.2;
const RIPPLE_LIFE = 1.45;

const COLOR_BY_PARTICLE = {
  sand: "#9e6324",
  snow: "#93b4dc",
  leaf: "#4b3826",
  petal: "#4d6638",
};

export function createFootprintTrail(planetConfig) {
  const group = new THREE.Group();
  const pid = planetConfig.id;
  const baseTint = new THREE.Color(
    COLOR_BY_PARTICLE[planetConfig.palette?.particleType] || "#524638"
  );
  const snowTint = new THREE.Color("#d9ecff");
  const isSnowCapable = ["yading", "siguniang", "zhagana", "yili"].includes(pid);
  const waterLevel = pid === "maclehose" ? PLANET_RADIUS + 0.22 : PLANET_RADIUS + 0.16;
  const rippleColor = planetConfig.palette?.water || "#67e8f9";

  const bootGeo = new THREE.CircleGeometry(0.058, 10);
  bootGeo.scale(0.78, 1.38, 1);

  const pool = [];
  for (let i = 0; i < POOL_SIZE; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: baseTint,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    const mesh = new THREE.Mesh(bootGeo, mat);
    mesh.visible = false;
    group.add(mesh);
    pool.push({ mesh, mat, age: 999, active: false, baseOpacity: 0.44 });
  }

  // 涉水浅滩清透扩散水波涟漪池
  const rippleGeo = new THREE.RingGeometry(0.065, 0.095, 22);
  const ripples = [];
  for (let i = 0; i < RIPPLE_POOL_SIZE; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: rippleColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(rippleGeo, mat);
    mesh.visible = false;
    group.add(mesh);
    ripples.push({ mesh, mat, age: 999, active: false });
  }

  let cursor = 0;
  let rippleCursor = 0;
  let leftRight = 1;
  let distAccum = 0;
  const lastUp = new THREE.Vector3();
  const tmpRight = new THREE.Vector3();
  const tmpBasis = new THREE.Matrix4();

  function spawnStep(upDir, forwardDir, isCycling = false) {
    tmpRight.crossVectors(forwardDir, upDir).normalize();
    const sideShift = isCycling ? 0 : leftRight * 0.0068;
    const backShift = isCycling ? -0.018 : -0.004;
    const footDir = upDir
      .clone()
      .addScaledVector(tmpRight, sideShift)
      .addScaledVector(forwardDir, backShift)
      .normalize();
    if (!isCycling) leftRight *= -1;

    const rawR = getSurfaceRadius(pid, footDir);
    const tangFwd = forwardDir
      .clone()
      .sub(footDir.clone().multiplyScalar(forwardDir.dot(footDir)))
      .normalize();
    const tangRight = new THREE.Vector3().crossVectors(tangFwd, footDir).normalize();
    tmpBasis.makeBasis(tangRight, tangFwd, footDir);

    // 1. 湖岸/海滩浅水区：泛起扩散水波涟漪光环
    if (rawR <= waterLevel) {
      const rp = ripples[rippleCursor];
      rippleCursor = (rippleCursor + 1) % RIPPLE_POOL_SIZE;
      rp.mesh.position.copy(footDir).multiplyScalar(Math.max(rawR, waterLevel - 0.04) + 0.02);
      rp.mesh.quaternion.setFromRotationMatrix(tmpBasis);
      rp.mesh.scale.setScalar(0.65);
      rp.age = 0;
      rp.active = true;
      rp.mesh.visible = true;
      rp.mat.opacity = 0.72;
      return;
    }

    // 2. 陆地 / 高海拔雪坡靴印与公路车辙印区分缩放与着色
    const slot = pool[cursor];
    cursor = (cursor + 1) % POOL_SIZE;
    slot.mesh.position.copy(footDir).multiplyScalar(rawR + 0.016);
    slot.mesh.quaternion.setFromRotationMatrix(tmpBasis);
    slot.mesh.scale.set(isCycling ? 0.36 : 1, isCycling ? 1.85 : 1, 1);

    const onSnow = isSnowCapable && rawR >= PLANET_RADIUS + 0.78;
    slot.mat.color.copy(onSnow ? snowTint : baseTint);
    slot.baseOpacity = isCycling ? 0.52 : onSnow ? 0.62 : 0.44;
    slot.age = 0;
    slot.active = true;
    slot.mesh.visible = true;
    slot.mat.opacity = slot.baseOpacity;
  }

  return {
    group,
    update(dt, upDir, forwardDir, isMoving, isCycling = false) {
      if (isMoving && upDir && forwardDir) {
        if (lastUp.lengthSq() === 0) {
          lastUp.copy(upDir);
        } else {
          const dAng = lastUp.angleTo(upDir);
          distAccum += dAng * 12.0;
          lastUp.copy(upDir);
          const stepThresh = isCycling ? 0.24 : 0.34;
          if (distAccum >= stepThresh) {
            distAccum = 0;
            spawnStep(upDir, forwardDir, isCycling);
          }
        }
      }

      for (const s of pool) {
        if (!s.active) continue;
        s.age += dt;
        if (s.age >= FOOTPRINT_LIFE) {
          s.active = false;
          s.mesh.visible = false;
          s.mat.opacity = 0;
        } else {
          const fade = 1 - s.age / FOOTPRINT_LIFE;
          s.mat.opacity = s.baseOpacity * Math.pow(fade, 1.35);
        }
      }

      for (const rp of ripples) {
        if (!rp.active) continue;
        rp.age += dt;
        if (rp.age >= RIPPLE_LIFE) {
          rp.active = false;
          rp.mesh.visible = false;
          rp.mat.opacity = 0;
        } else {
          const t = rp.age / RIPPLE_LIFE;
          rp.mesh.scale.setScalar(0.65 + t * 2.85);
          rp.mat.opacity = 0.72 * Math.pow(1 - t, 1.5);
        }
      }
    },
  };
}
