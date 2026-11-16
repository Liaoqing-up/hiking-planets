import * as THREE from "three";
import { getSurfaceRadius } from "./planetBuilder3D.js";

const POOL_SIZE = 34;
const FOOTPRINT_LIFE = 6.2; // 秒，随后被风雪/流沙轻轻抚平

const COLOR_BY_PARTICLE = {
  sand: "#9e6324",
  snow: "#93b4dc",
  leaf: "#4b3826",
  petal: "#4d6638",
};

export function createFootprintTrail(planetConfig) {
  const group = new THREE.Group();
  const pid = planetConfig.id;
  const tint = COLOR_BY_PARTICLE[planetConfig.palette?.particleType] || "#524638";

  // 椭圆小靴印几何体（共享几何体，独立透明度材质以支持逐枚渐隐）
  const bootGeo = new THREE.CircleGeometry(0.058, 10);
  bootGeo.scale(0.78, 1.38, 1);

  const pool = [];
  for (let i = 0; i < POOL_SIZE; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: tint,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    const mesh = new THREE.Mesh(bootGeo, mat);
    mesh.visible = false;
    group.add(mesh);
    pool.push({ mesh, mat, age: 999, active: false });
  }

  let cursor = 0;
  let leftRight = 1;
  let distAccum = 0;
  const lastUp = new THREE.Vector3();
  const tmpRight = new THREE.Vector3();
  const tmpBasis = new THREE.Matrix4();

  function spawnStep(upDir, forwardDir) {
    const slot = pool[cursor];
    cursor = (cursor + 1) % POOL_SIZE;

    tmpRight.crossVectors(forwardDir, upDir).normalize();
    const footDir = upDir
      .clone()
      .addScaledVector(tmpRight, leftRight * 0.0068)
      .addScaledVector(forwardDir, -0.004)
      .normalize();
    leftRight *= -1;

    const r = getSurfaceRadius(pid, footDir) + 0.016;
    slot.mesh.position.copy(footDir).multiplyScalar(r);

    // 让靴印平面贴合地表法线 (+Z 朝向法线 footDir, +Y 朝向行进方向 forwardDir)
    const tangFwd = forwardDir
      .clone()
      .sub(footDir.clone().multiplyScalar(forwardDir.dot(footDir)))
      .normalize();
    const tangRight = new THREE.Vector3().crossVectors(tangFwd, footDir).normalize();
    tmpBasis.makeBasis(tangRight, tangFwd, footDir);
    slot.mesh.quaternion.setFromRotationMatrix(tmpBasis);

    slot.age = 0;
    slot.active = true;
    slot.mesh.visible = true;
    slot.mat.opacity = 0.46;
  }

  return {
    group,
    update(dt, upDir, forwardDir, isMoving) {
      if (isMoving && upDir && forwardDir) {
        if (lastUp.lengthSq() === 0) {
          lastUp.copy(upDir);
        } else {
          const dAng = lastUp.angleTo(upDir);
          distAccum += dAng * 12.0;
          lastUp.copy(upDir);
          if (distAccum >= 0.34) {
            distAccum = 0;
            spawnStep(upDir, forwardDir);
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
          s.mat.opacity = 0.44 * Math.pow(fade, 1.35);
        }
      }
    },
  };
}
