/**
 * 3D 行者与星主角色建模、四季穿搭切换、步行/坐姿/双车把闭式解析 IK 骑行动画引擎
 * 从 planetBuilder3D.js 独立拆出，职责单一且无循环依赖
 */
import * as THREE from "three";
import { STORYBOOK_GRAD } from "./sphereMath.js?v=5.2.7-guest-identity";

export function buildHikerCharacter() {
  // 复刻腾格里沙漠照造型：酒红冲锋衣 + 深灰宽檐渔夫帽 + 亮橙红镀膜大风镜 + 护脸面罩 + 双小辫女生 + 银灰蛋巢垫毛球重装包
  const root = new THREE.Group();
  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);

  const toon = (c) => new THREE.MeshToonMaterial({ color: c, gradientMap: STORYBOOK_GRAD });
  const jacketMat = toon("#be293e"); // 鲜亮勃艮第酒红硬壳冲锋衣
  const zipMat = toon("#27272a"); // 防水主拉链撞色条
  const pantsMat = toon("#2c3240");
  const bootMat = toon("#4a3728"); // 户外厚底登山靴
  const soleMat = toon("#18181b"); // Vibram 防滑深色大底
  const strapMat = toon("#1f2430"); // 背包双肩背带
  const maskMat = toon("#dfe3ea");
  const skinMat = toon("#fde4cf");
  const hairMat = toon("#1b191a");
  const hatMat = toon("#30343f");
  const packMat = toon("#717885");
  const padMat = toon("#c4cbd6");
  const visorMat = new THREE.MeshStandardMaterial({
    color: "#ff551a",
    emissive: "#ff6a1a",
    emissiveIntensity: 0.5,
    roughness: 0.16,
    metalness: 0.72,
  });

  // 双腿 + 双色厚底户外登山靴 + 可选高山雪套
  const gaiterMat = toon("#2563eb");
  function makeLegBoot(side) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.054, 0.048, 0.24, 10), pantsMat);
    leg.position.set(side * 0.076, 0.16, 0);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.075, 0.14), bootMat);
    boot.position.set(0, -0.11, 0.02);
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.102, 0.026, 0.15), soleMat);
    sole.position.set(0, -0.148, 0.02);
    const gaiter = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.054, 0.14, 10), gaiterMat);
    gaiter.position.y = -0.03;
    gaiter.visible = false;
    leg.add(boot, sole, gaiter);
    bodyPivot.add(leg);
    return { leg, gaiter };
  }
  const { leg: leftLeg, gaiter: leftGaiter } = makeLegBoot(-1);
  const { leg: rightLeg, gaiter: rightGaiter } = makeLegBoot(1);

  // 立体剪裁冲锋衣（收腰上身 + 微扩防风下摆 + 立领风帽 + 防水拉链 + 双肩背带与橙色救生哨胸扣）
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.17, 0.28, 14), jacketMat);
  chest.position.y = 0.49;
  const hemSkirt = new THREE.Mesh(new THREE.CylinderGeometry(0.168, 0.215, 0.16, 14), jacketMat);
  hemSkirt.position.y = 0.29;
  const hoodCollar = new THREE.Mesh(new THREE.TorusGeometry(0.118, 0.04, 8, 18), jacketMat);
  hoodCollar.rotation.x = Math.PI / 2;
  hoodCollar.position.y = 0.63;
  const frontZip = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.39, 0.02), zipMat);
  frontZip.position.set(0, 0.42, 0.165);
  frontZip.rotation.x = -0.15;

  const strapL = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.28, 0.18), strapMat);
  strapL.position.set(-0.085, 0.5, -0.01);
  const strapR = strapL.clone();
  strapR.position.x = 0.085;
  const chestBuckle = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.022, 0.02),
    new THREE.MeshBasicMaterial({ color: "#f97316" })
  );
  chestBuckle.position.set(0, 0.51, 0.152);
  bodyPivot.add(chest, hemSkirt, hoodCollar, frontZip, strapL, strapR, chestBuckle);

  // 60L 重装大包 + 侧面银灰折叠蛋巢防潮垫 + 毛球挂件 + 平安进山小红牌（收纳于 packGroup，围炉时可整体卸放身旁！）
  const packGroup = new THREE.Group();
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
  const duckCharm = new THREE.Group();
  const duckBody = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), toon("#ffd426"));
  const duckBeak = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.016, 0.03), new THREE.MeshBasicMaterial({ color: "#f97316" }));
  duckBeak.position.set(0, 0, -0.05);
  duckCharm.add(duckBody, duckBeak);
  duckCharm.position.set(0.12, 0.54, -0.22);
  duckCharm.visible = false;
  packGroup.add(pack, eggPad, pomPom, redCharm, duckCharm);
  root.add(packGroup);

  // 围炉歇脚时的营地圆木坐桩 + 卸下斜靠在背包旁的交叉双登山杖
  const sitLog = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.115, 0.44, 10),
    new THREE.MeshStandardMaterial({ color: "#6b442a", roughness: 0.88 })
  );
  sitLog.rotation.z = Math.PI / 2;
  sitLog.position.set(0, 0.095, -0.04);
  sitLog.visible = false;
  root.add(sitLog);

  const restingPoles = new THREE.Group();
  const restPoleMat = new THREE.MeshStandardMaterial({ color: "#e5ecf5", metalness: 0.55 });
  const rp1 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.01, 0.58, 6), restPoleMat);
  rp1.rotation.set(0.32, 0, -0.22);
  const rp2 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.01, 0.58, 6), restPoleMat);
  rp2.rotation.set(0.28, 0, 0.18);
  restingPoles.add(rp1, rp2);
  restingPoles.position.set(-0.46, 0.24, -0.02);
  restingPoles.visible = false;
  root.add(restingPoles);

  // 🚴 3D 破风弯把公路车坐骑道具（沿 +Z 前进方向建模，车轮与曲柄随骑行速度真实旋转！）
  const rideBikeGroup = new THREE.Group();
  const bikeTireMat = new THREE.MeshStandardMaterial({ color: "#1e293b", roughness: 0.55 });
  const bikeRimMat = new THREE.MeshStandardMaterial({ color: "#cbd5e1", metalness: 0.68, roughness: 0.22 });
  const bikeFrameMat = toon("#38bdf8");
  const makeRideWheel = (zPos) => {
    const wPivot = new THREE.Group();
    wPivot.position.set(0, 0.168, zPos);
    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.148, 0.022, 8, 22), bikeTireMat);
    tire.rotation.y = Math.PI / 2;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.124, 0.008, 6, 20), bikeRimMat);
    rim.rotation.y = Math.PI / 2;
    wPivot.add(tire, rim);
    for (let sp = 0; sp < 4; sp++) {
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.24, 4), bikeRimMat);
      spoke.rotation.x = (sp / 4) * Math.PI;
      wPivot.add(spoke);
    }
    rideBikeGroup.add(wPivot);
    return wPivot;
  };
  const bikeRearWheel = makeRideWheel(-0.26);
  const bikeFrontWheel = makeRideWheel(0.27);

  const bkTopTube = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.32, 8), bikeFrameMat);
  bkTopTube.rotation.x = Math.PI / 2 - 0.14;
  bkTopTube.position.set(0, 0.386, 0.034);
  const bkDownTube = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.32, 8), bikeFrameMat);
  bkDownTube.rotation.x = 0.84;
  bkDownTube.position.set(0, 0.27, 0.068);
  const bkHeadTube = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.075, 8), bikeFrameMat);
  bkHeadTube.rotation.x = -0.28;
  bkHeadTube.position.set(0, 0.396, 0.188);
  const bkSeatTube = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.31, 8), bikeFrameMat);
  bkSeatTube.rotation.x = -0.22;
  bkSeatTube.position.set(0, 0.26, -0.11);
  const bkStay = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.26, 6), bikeFrameMat);
  bkStay.rotation.x = 0.72;
  bkStay.position.set(0, 0.25, -0.19);
  const bkFork = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.01, 0.265, 8), bikeFrameMat);
  bkFork.rotation.x = -0.31;
  bkFork.position.set(0, 0.29, 0.23);
  const bkSaddle = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.026, 0.13), bikeTireMat);
  bkSaddle.position.set(0, 0.402, -0.135);
  const bkStem = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.068, 8), bikeRimMat);
  bkStem.rotation.x = 0.58;
  bkStem.position.set(0, 0.442, 0.207);
  const bkBar = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.242, 8), bikeRimMat);
  bkBar.rotation.z = Math.PI / 2;
  bkBar.position.set(0, 0.468, 0.224);
  const bkComputer = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.008, 0.036), bikeTireMat);
  bkComputer.rotation.x = -0.2;
  bkComputer.position.set(0, 0.478, 0.248);
  const dropL = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.01, 6, 12, Math.PI), bikeTireMat);
  dropL.rotation.set(0, -Math.PI / 2, -Math.PI / 2);
  dropL.position.set(-0.118, 0.43, 0.224);
  const dropR = dropL.clone();
  dropR.position.x = 0.118;
  const hoodL = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.042, 0.046), bikeTireMat);
  hoodL.rotation.x = -0.32;
  hoodL.position.set(-0.118, 0.484, 0.248);
  const hoodR = hoodL.clone();
  hoodR.position.x = 0.118;
  const tailLed = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 6), new THREE.MeshBasicMaterial({ color: "#ef4444" }));
  tailLed.position.set(0, 0.36, -0.155);

  const bikeCrankPivot = new THREE.Group();
  bikeCrankPivot.position.set(0, 0.165, -0.05);
  const chainring = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.008, 14), bikeRimMat);
  chainring.rotation.z = Math.PI / 2;
  chainring.position.x = 0.032;
  [-1, 1].forEach((sd) => {
    const crankArm = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.095, 0.018), bikeRimMat);
    crankArm.position.set(sd * 0.046, sd * 0.038, 0);
    const pedal = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.012, 0.028), bikeTireMat);
    pedal.position.set(sd * 0.068, sd * 0.078, 0);
    bikeCrankPivot.add(crankArm, pedal);
  });
  rideBikeGroup.add(
    bkTopTube, bkDownTube, bkHeadTube, bkSeatTube, bkStay, bkFork,
    bkSaddle, bkStem, bkBar, bkComputer, dropL, dropR, hoodL, hoodR, tailLed, bikeCrankPivot
  );
  rideBikeGroup.visible = false;
  root.add(rideBikeGroup);

  // 头部 + 饱满深色发顶（彻底杜绝任何角度露头皮）+ 防晒护脸面罩 + 镀膜护目镜
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 14), skinMat);
  head.position.y = 0.74;
  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.146, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62),
    hairMat
  );
  hairCap.position.set(0, 0.75, -0.012);
  hairCap.rotation.x = -0.18;
  const faceMask = new THREE.Mesh(
    new THREE.CylinderGeometry(0.135, 0.125, 0.12, 14),
    maskMat
  );
  faceMask.position.set(0, 0.69, 0.015);
  const gogglesFrame = new THREE.Mesh(new THREE.BoxGeometry(0.224, 0.084, 0.075), soleMat);
  gogglesFrame.position.set(0, 0.755, 0.11);
  const goggles = new THREE.Mesh(new THREE.BoxGeometry(0.208, 0.068, 0.082), visorMat);
  goggles.position.set(0, 0.755, 0.115);
  const blushMat = new THREE.MeshBasicMaterial({ color: "#f48fb1" });
  const blushL = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 6), blushMat);
  blushL.position.set(-0.085, 0.71, 0.115);
  const blushR = blushL.clone();
  blushR.position.x = 0.085;
  bodyPivot.add(head, hairCap, blushL, blushR, faceMask, gogglesFrame, goggles);

  // 深炭灰大宽檐户外防晒渔夫帽 vs 温暖针织冷帽 (Beanie)
  const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.025, 20), hatMat);
  hatBrim.position.y = 0.825;
  const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.155, 0.11, 16), hatMat);
  hatCrown.position.y = 0.885;
  bodyPivot.add(hatBrim, hatCrown);

  // 🐶 清爽绘本风针织冷帽 + 元气修勾软垂耳 / 猫耳 / 绵羊耳
  const beanieMat = toon("#fffbeb");
  const beanieCuffMat = toon("#fde68a");
  const puppyEarMat = toon("#c26a27");
  const puppyInnerMat = toon("#fed7aa");
  const bonePinMat = toon("#ffffff");

  const beanieGroup = new THREE.Group();
  const beanieDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.154, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.58),
    beanieMat
  );
  beanieDome.position.y = 0.79;

  const beanieCuff = new THREE.Mesh(new THREE.TorusGeometry(0.144, 0.03, 10, 22), beanieCuffMat);
  beanieCuff.rotation.x = Math.PI / 2;
  beanieCuff.position.y = 0.806;

  // 🐶 清哥专属：软萌微折小狗垂耳 (Floppy Puppy Ears) + 柴犬豆豆眉 + 迷你小骨头胸针
  const puppyEarsGroup = new THREE.Group();
  function makePuppyEar(side) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.126, 0.895, 0.012);
    pivot.rotation.set(0.14, side * 0.22, -side * 0.34);

    // 耳根柔和折角隆起
    const earRoot = new THREE.Mesh(new THREE.SphereGeometry(0.034, 10, 8), puppyEarMat);
    earRoot.scale.set(1.05, 0.72, 0.85);
    earRoot.position.set(side * 0.012, 0.006, 0);

    // 圆润水滴状软垂狗耳瓣（前后双面可见，跑图背影也能一眼看到两只软乎乎垂耳！）
    const earFlap = new THREE.Mesh(new THREE.SphereGeometry(0.052, 12, 10), puppyEarMat);
    earFlap.scale.set(0.84, 1.58, 0.38);
    earFlap.position.set(side * 0.036, -0.068, 0.008);
    earFlap.rotation.z = side * 0.18;

    const earInner = new THREE.Mesh(new THREE.SphereGeometry(0.033, 10, 8), puppyInnerMat);
    earInner.scale.set(0.75, 1.28, 0.28);
    earInner.position.set(side * 0.034, -0.07, 0.021);
    earInner.rotation.z = side * 0.18;

    pivot.add(earRoot, earFlap, earInner);
    puppyEarsGroup.add(pivot);
    return pivot;
  }
  const leftPuppyEar = makePuppyEar(-1);
  const rightPuppyEar = makePuppyEar(1);

  // 呆萌柴犬豆豆眉（帽身正上方两颗圆糯奶豆点）
  const puppyBrowMat = toon("#fffbeb");
  [-1, 1].forEach((s) => {
    const browBean = new THREE.Mesh(new THREE.SphereGeometry(0.017, 8, 7), puppyBrowMat);
    browBean.scale.set(1.25, 0.88, 0.65);
    browBean.position.set(s * 0.046, 0.868, 0.138);
    browBean.rotation.set(-0.25, s * 0.22, -s * 0.2);
    puppyEarsGroup.add(browBean);
  });

  // 帽檐右侧迷你立体 🦴 小骨头别针
  const boneBadge = new THREE.Group();
  boneBadge.position.set(0.072, 0.808, 0.158);
  boneBadge.rotation.set(0, 0.42, -0.18);
  const boneShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.034, 6), bonePinMat);
  boneShaft.rotation.z = Math.PI / 2;
  boneBadge.add(boneShaft);
  [[-0.018, 0.006], [-0.018, -0.006], [0.018, 0.006], [0.018, -0.006]].forEach(([bx, by]) => {
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.0085, 6, 6), bonePinMat);
    knob.position.set(bx, by, 0);
    boneBadge.add(knob);
  });
  puppyEarsGroup.add(boneBadge);
  // Kitty 专属超萌立体小猫耳针织帽装饰
  const catEarsGroup = new THREE.Group();
  const innerEarMat = toon("#f9a8d4");
  [-1, 1].forEach((s) => {
    const earOuter = new THREE.Mesh(new THREE.ConeGeometry(0.056, 0.1, 4), beanieMat);
    earOuter.position.set(s * 0.1, 0.925, 0.01);
    earOuter.rotation.set(0.08, s * 0.35, -s * 0.36);
    const earInner = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.062, 4), innerEarMat);
    earInner.position.set(s * 0.098, 0.922, 0.032);
    earInner.rotation.set(0.08, s * 0.35, -s * 0.36);
    catEarsGroup.add(earOuter, earInner);
  });
  catEarsGroup.visible = false;
  // 咩咩专属超萌立体小绵羊弯角+奶白蓬松垂耳针织帽装饰
  const sheepEarsGroup = new THREE.Group();
  const hornMat = toon("#fde68a");
  const sheepFluffMat = toon("#fffbeb");
  [-1, 1].forEach((s) => {
    const horn = new THREE.Mesh(new THREE.TorusGeometry(0.044, 0.016, 7, 14, Math.PI * 1.35), hornMat);
    horn.position.set(s * 0.118, 0.895, 0.015);
    horn.rotation.set(0.25, s * 0.55, s * 0.6);
    const earFluff = new THREE.Mesh(new THREE.SphereGeometry(0.034, 8, 7), sheepFluffMat);
    earFluff.scale.set(1.3, 0.68, 0.85);
    earFluff.position.set(s * 0.145, 0.84, 0.01);
    earFluff.rotation.z = -s * 0.35;
    sheepEarsGroup.add(horn, earFluff);
  });
  sheepEarsGroup.visible = false;
  beanieGroup.add(beanieDome, beanieCuff, puppyEarsGroup, catEarsGroup, sheepEarsGroup);
  beanieGroup.visible = false;
  bodyPivot.add(beanieGroup);

  // 🚴 Luca 专属（吴磊《骑有此理》风阳光骑行少年）：流线型破风气动头盔 + 剑眉星目阳光露齿笑 + 碎刘海 + Vlog运动相机
  const helmetShellMat = toon("#eef4f8");
  const lucaHelmetGroup = new THREE.Group();
  const aeroShell = new THREE.Mesh(
    new THREE.SphereGeometry(0.156, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.54),
    helmetShellMat
  );
  aeroShell.scale.set(0.98, 0.92, 1.14);
  aeroShell.position.set(0, 0.795, -0.012);
  aeroShell.rotation.x = -0.1;
  const aeroTail = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.12, 10), helmetShellMat);
  aeroTail.rotation.x = -Math.PI * 0.56;
  aeroTail.scale.set(1.1, 1, 0.58);
  aeroTail.position.set(0, 0.835, -0.175);
  lucaHelmetGroup.add(aeroShell, aeroTail);
  // 6 道黑色空气动力学破风散热槽
  [-0.075, -0.026, 0.026, 0.075].forEach((vx) => {
    const vent = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.022, 0.16), soleMat);
    vent.position.set(vx, 0.912, -0.01);
    vent.rotation.x = -0.12;
    lucaHelmetGroup.add(vent);
  });
  // 🕶️ 架在鼻梁正前方的流线型一体式环抱炫彩镀膜破风骑行镜（100% Speedcraft / Sutro 运动风）
  const lucaGlassesGroup = new THREE.Group();
  const lensIridiumMat = new THREE.MeshStandardMaterial({
    color: "#ff4d15",
    emissive: "#fb923c",
    emissiveIntensity: 0.36,
    metalness: 0.76,
    roughness: 0.08,
    transparent: true,
    opacity: 0.84,
    side: THREE.DoubleSide,
  });
  const glassFrameMat = toon("#f8fafc");
  // 环抱弧面大护目镜片（顺脸型弧度包裹双眼，下沿留出阳光露齿笑）
  const shieldLens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.154, 0.154, 0.052, 28, 1, true, -0.78, 1.56),
    lensIridiumMat
  );
  shieldLens.position.set(0, 0.753, 0.002);
  // 亮白气动上眉框 + 下外侧导风锐角边
  const topFrameArc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.157, 0.157, 0.011, 28, 1, true, -0.81, 1.62),
    glassFrameMat
  );
  topFrameArc.position.set(0, 0.781, 0.002);
  // 中央倒V运动鼻托架（塑造专业骑行镜标志性鼻梁切口层次）
  [-1, 1].forEach((s) => {
    const nosePad = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.009, 0.012), soleMat);
    nosePad.position.set(s * 0.014, 0.731, 0.153);
    nosePad.rotation.z = -s * 0.48;
    // 左右两侧亮白侧翼立柱 + 向后延伸入鬓角的流线破风镜腿
    const sidePost = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.054, 0.014), glassFrameMat);
    sidePost.position.set(s * 0.111, 0.754, 0.109);
    sidePost.rotation.y = s * 0.76;
    const lowerWing = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.008, 0.012), glassFrameMat);
    lowerWing.position.set(s * 0.086, 0.728, 0.129);
    lowerWing.rotation.set(0, s * 0.56, s * 0.08);
    const templeArm = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.012, 0.105), glassFrameMat);
    templeArm.position.set(s * 0.131, 0.766, 0.062);
    templeArm.rotation.set(0.08, s * 0.24, 0);
    lucaGlassesGroup.add(nosePad, sidePost, lowerWing, templeArm);
  });
  // 镜面斜向高光流光纹（正侧面都有通透炫光感）
  const glintMat = new THREE.MeshBasicMaterial({ color: "#fff7ed", transparent: true, opacity: 0.62 });
  const glint1 = new THREE.Mesh(new THREE.BoxGeometry(0.011, 0.044, 0.004), glintMat);
  glint1.position.set(-0.052, 0.754, 0.148);
  glint1.rotation.set(0, -0.34, -0.38);
  const glint2 = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.038, 0.004), glintMat);
  glint2.position.set(-0.037, 0.754, 0.152);
  glint2.rotation.set(0, -0.24, -0.38);
  lucaGlassesGroup.add(shieldLens, topFrameArc, glint1, glint2);

  // 细巧黑色运动头盔下颌带
  [-1, 1].forEach((s) => {
    const chinStrap = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.13, 6), soleMat);
    chinStrap.position.set(s * 0.126, 0.735, 0.032);
    chinStrap.rotation.z = s * 0.22;
    lucaHelmetGroup.add(chinStrap);
  });
  lucaHelmetGroup.add(lucaGlassesGroup);
  lucaHelmetGroup.visible = false;
  bodyPivot.add(lucaHelmetGroup);

  const lucaBoyGroup = new THREE.Group();
  // 蓬松阳光少年乌黑碎发刘海与利落短鬓角
  [[-0.055, 0.812, 0.132, 0.28], [0, 0.816, 0.138, -0.12], [0.052, 0.812, 0.132, -0.26]].forEach(([bx, by, bz, rz]) => {
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.026, 0.062, 6), hairMat);
    tuft.rotation.set(Math.PI * 0.88, 0, rz);
    tuft.position.set(bx, by, bz);
    lucaBoyGroup.add(tuft);
  });
  [-1, 1].forEach((s) => {
    // 利落少年短鬓角
    const sideburn = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.058, 0.032), hairMat);
    sideburn.position.set(s * 0.132, 0.755, 0.045);
    // 浓密英气上扬剑眉
    const swordBrow = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.011, 0.014), hairMat);
    swordBrow.position.set(s * 0.048, 0.776, 0.134);
    swordBrow.rotation.set(0, s * 0.18, s * 0.14);
    // 明亮深邃星眸 + 白色眼神光
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), hairMat);
    eye.scale.set(0.95, 1.08, 0.55);
    eye.position.set(s * 0.046, 0.748, 0.136);
    const spark = new THREE.Mesh(new THREE.SphereGeometry(0.0055, 6, 6), new THREE.MeshBasicMaterial({ color: "#ffffff" }));
    spark.position.set(s * 0.042, 0.753, 0.143);
    lucaBoyGroup.add(sideburn, swordBrow, eye, spark);
  });
  // 挺拔少年鼻梁 + 标志性阳光灿烂露齿笑
  const boyNose = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.026, 6), toon("#e3b089"));
  boyNose.rotation.x = Math.PI * 0.42;
  boyNose.position.set(0, 0.732, 0.145);
  const smileMouth = new THREE.Mesh(
    new THREE.TorusGeometry(0.032, 0.008, 6, 12, Math.PI),
    new THREE.MeshBasicMaterial({ color: "#b91c1c" })
  );
  smileMouth.rotation.z = Math.PI;
  smileMouth.position.set(0, 0.714, 0.134);
  const whiteTeeth = new THREE.Mesh(
    new THREE.BoxGeometry(0.046, 0.013, 0.012),
    new THREE.MeshBasicMaterial({ color: "#ffffff" })
  );
  whiteTeeth.position.set(0, 0.708, 0.137);
  // 胸前佩戴《骑有此理》同款迷你 Action 运动相机（带红点录制灯）+ 后腰斜插冰蓝骑行水壶
  const actionCam = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.036, 0.028), soleMat);
  actionCam.position.set(0, 0.51, 0.168);
  const camLens = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.012, 10), visorMat);
  camLens.rotation.x = Math.PI / 2;
  camLens.position.set(0.01, 0.51, 0.184);
  const recDot = new THREE.Mesh(new THREE.SphereGeometry(0.005, 6, 6), new THREE.MeshBasicMaterial({ color: "#ef4444" }));
  recDot.position.set(-0.016, 0.52, 0.183);
  const bidonBottle = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.03, 0.13, 10), toon("#38bdf8"));
  bidonBottle.position.set(0.075, 0.34, -0.155);
  bidonBottle.rotation.set(-0.18, 0, -0.28);
  lucaBoyGroup.add(boyNose, smileMouth, whiteTeeth, actionCam, camLens, recDot, bidonBottle);
  lucaBoyGroup.visible = false;
  bodyPivot.add(lucaBoyGroup);

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
    return { pivot, pole };
  }
  const { pivot: leftArm, pole: leftPole } = makeArmPole(-1);
  const { pivot: rightArm, pole: rightPole } = makeArmPole(1);

  const OUTFITS = {
    "mine-host": {
      jacket: "#be293e", zip: "#fde68a", pants: "#2c3240", pack: "#275248", visor: "#ff551a",
      hatType: "beanie", hatColor: "#f5b829", cuffColor: "#e6a81c", earColor: "#a85518", browColor: "#fffbeb",
      mask: false, heavyGear: true, gaiter: null, duck: false,
    },
    tengger: {
      jacket: "#be293e", zip: "#27272a", pants: "#2c3240", pack: "#717885", visor: "#ff551a",
      hatType: "wide", hatColor: "#30343f", mask: true, heavyGear: true, gaiter: null, duck: false,
    },
    yading: {
      jacket: "#0fa8a0", zip: "#e2f1ef", pants: "#e5dfd5", pack: "#275248", visor: "#d946ef",
      hatType: "beanie", hatColor: "#f5b829", cuffColor: "#e6a81c", earColor: "#a85518", browColor: "#fffbeb",
      mask: false, heavyGear: true, gaiter: null, duck: false,
    },
    zhagana: {
      jacket: "#70386b", zip: "#f0abfc", pants: "#283044", pack: "#1cb5e8", visor: "#38bdf8",
      hatType: "beanie", hatColor: "#465a8c", cuffColor: "#3a4c78", earColor: "#273554", browColor: "#f1f5f9",
      mask: true, heavyGear: true, gaiter: "#84cc16", duck: false,
    },
    siguniang: {
      jacket: "#7ddbb0", zip: "#134e4a", pants: "#323846", pack: "#f97316", visor: "#f59e0b",
      hatType: "beanie", hatColor: "#f5efe6", cuffColor: "#eae0d2", earColor: "#9a6338", browColor: "#b47b4e",
      mask: true, heavyGear: true, gaiter: "#2563eb", duck: false,
    },
    maclehose: {
      jacket: "#e12d6c", zip: "#ffe4e6", pants: "#8b78b5", pack: "#d4d9e2", visor: "#ff7a1a",
      hatType: "bucket", hatColor: "#f5efe4", mask: false, heavyGear: false, gaiter: null, duck: false,
    },
    yili: {
      jacket: "#5b346e", zip: "#e9d5ff", pants: "#f6f0e4", pack: "#2e323d", visor: "#60a5fa",
      hatType: "beanie", hatColor: "#f7f2e8", cuffColor: "#ede5d6", earColor: "#c27832", browColor: "#d9914b",
      mask: false, heavyGear: false, gaiter: null, duck: true,
    },
    "kitty-host": {
      jacket: "#f472b6", zip: "#fdf2f8", pants: "#f8fafc", pack: "#7dd3fc", visor: "#38bdf8",
      hatType: "beanie", hatColor: "#fff5f7", mask: false, heavyGear: false, gaiter: null, duck: false, catEars: true,
    },
    "kitty-xiaowutai": {
      jacket: "#34d399", zip: "#ecfdf5", pants: "#334155", pack: "#f472b6", visor: "#facc15",
      hatType: "beanie", hatColor: "#fff1f2", mask: false, heavyGear: false, gaiter: null, duck: false, catEars: true,
    },
    "kitty-changbai": {
      jacket: "#38bdf8", zip: "#f0f9ff", pants: "#334155", pack: "#f472b6", visor: "#fb7185",
      hatType: "beanie", hatColor: "#fff1f2", mask: false, heavyGear: false, gaiter: null, duck: false, catEars: true,
    },
    "kitty-sunset": {
      jacket: "#fb923c", zip: "#fff7ed", pants: "#1e293b", pack: "#a78bfa", visor: "#f472b6",
      hatType: "bucket", hatColor: "#fef3c7", mask: false, heavyGear: false, gaiter: null, duck: false,
    },
    "kitty-zhagana": {
      jacket: "#2dd4bf", zip: "#f0fdfa", pants: "#27272a", pack: "#f59e0b", visor: "#38bdf8",
      hatType: "beanie", hatColor: "#fef08a", mask: false, heavyGear: true, gaiter: "#38bdf8", duck: false, catEars: true,
    },
    "kitty-daqing": {
      jacket: "#a3e635", zip: "#f7fee7", pants: "#f5f5f4", pack: "#fb923c", visor: "#fbbf24",
      hatType: "bucket", hatColor: "#fafaf9", mask: false, heavyGear: false, gaiter: null, duck: true,
    },
    "kitty-wusun": {
      jacket: "#818cf8", zip: "#eef2ff", pants: "#1f2937", pack: "#f43f5e", visor: "#fb923c",
      hatType: "beanie", hatColor: "#fdf4ff", mask: true, heavyGear: true, gaiter: "#6366f1", duck: false, catEars: true,
    },
    "kitty-yading": {
      jacket: "#f472b6", zip: "#fdf2f8", pants: "#f1f5f9", pack: "#2dd4bf", visor: "#facc15",
      hatType: "beanie", hatColor: "#ffffff", mask: false, heavyGear: true, gaiter: null, duck: false, catEars: true,
    },
    "miemie-host": {
      jacket: "#34d399", zip: "#ecfdf5", pants: "#f8fafc", pack: "#fbbf24", visor: "#fde047",
      hatType: "beanie", hatColor: "#fffbeb", mask: false, heavyGear: true, gaiter: "#10b981", duck: true, sheepEars: true,
    },
    "miemie-guizhou": {
      jacket: "#34d399", zip: "#ecfdf5", pants: "#1e293b", pack: "#fbbf24", visor: "#38bdf8",
      hatType: "beanie", hatColor: "#fffbeb", mask: false, heavyGear: false, gaiter: "#0ea5e9", duck: true, sheepEars: true,
    },
    "miemie-volcano": {
      jacket: "#fb7185", zip: "#fff1f2", pants: "#18181b", pack: "#fbbf24", visor: "#fdba74",
      hatType: "beanie", hatColor: "#fffbeb", mask: false, heavyGear: false, gaiter: "#f97316", duck: false, sheepEars: true,
    },
    "miemie-hulunbuir": {
      jacket: "#facc15", zip: "#fefce8", pants: "#f8fafc", pack: "#34d399", visor: "#fde047",
      hatType: "beanie", hatColor: "#fffbeb", mask: false, heavyGear: false, gaiter: null, duck: true, sheepEars: true,
    },
    "miemie-tonggudang": {
      jacket: "#34d399", zip: "#ecfdf5", pants: "#334155", pack: "#fbbf24", visor: "#38bdf8",
      hatType: "beanie", hatColor: "#fffbeb", mask: false, heavyGear: false, gaiter: null, duck: true, sheepEars: true,
    },
    "miemie-longji": {
      jacket: "#84cc16", zip: "#f7fee7", pants: "#1e293b", pack: "#f59e0b", visor: "#2dd4bf",
      hatType: "beanie", hatColor: "#fefce8", mask: false, heavyGear: false, gaiter: null, duck: false, sheepEars: true,
    },
    "miemie-shexiang": {
      jacket: "#38bdf8", zip: "#e0f2fe", pants: "#0f172a", pack: "#facc15", visor: "#7dd3fc",
      hatType: "beanie", hatColor: "#f8fafc", mask: false, heavyGear: true, gaiter: "#0284c7", duck: false, sheepEars: true,
    },
    "miemie-buyi": {
      jacket: "#f59e0b", zip: "#fffbeb", pants: "#f5f5f4", pack: "#14b8a6", visor: "#fbbf24",
      hatType: "bucket", hatColor: "#fef3c7", mask: false, heavyGear: false, gaiter: null, duck: true,
    },
    "miemie-yading": {
      jacket: "#2dd4bf", zip: "#f0fdfa", pants: "#1e293b", pack: "#f43f5e", visor: "#fde047",
      hatType: "beanie", hatColor: "#fffbeb", mask: false, heavyGear: true, gaiter: "#38bdf8", duck: false, sheepEars: true,
    },
    "luca-host": {
      jacket: "#0284c7", zip: "#e0f2fe", pants: "#1e293b", pack: "#0f172a", visor: "#ff551a",
      hatType: "helmet", hatColor: "#eef4f8", mask: false, heavyGear: false, gaiter: "#ffffff", duck: false, isLucaBoy: true,
    },
    "luca-hainan": {
      jacket: "#0369a1", zip: "#38bdf8", pants: "#0f172a", pack: "#1e293b", visor: "#f97316",
      hatType: "helmet", hatColor: "#f1f5f9", mask: false, heavyGear: false, gaiter: "#ffffff", duck: false, isLucaBoy: true,
    },
    "luca-tianshan": {
      jacket: "#0d9488", zip: "#ccfbf1", pants: "#1e293b", pack: "#334155", visor: "#fb923c",
      hatType: "helmet", hatColor: "#e2e8f0", mask: false, heavyGear: false, gaiter: "#f8fafc", duck: false, isLucaBoy: true,
    },
    // 行者护照四大自选 3D 装扮配色（与注册/预览铭牌 100% 对应）
    gold: {
      jacket: "#d97706", zip: "#fef3c7", pants: "#2c3240", pack: "#275248", visor: "#ff551a",
      hatType: "beanie", hatColor: "#f5b829", cuffColor: "#e6a81c", earColor: "#a85518", browColor: "#fffbeb",
      mask: false, heavyGear: true, gaiter: null, duck: false,
    },
    pink: {
      jacket: "#f472b6", zip: "#fdf2f8", pants: "#f8fafc", pack: "#7dd3fc", visor: "#38bdf8",
      hatType: "beanie", hatColor: "#fff5f7", mask: false, heavyGear: false, gaiter: null, duck: false, catEars: true,
    },
    mint: {
      jacket: "#10b981", zip: "#ecfdf5", pants: "#1e293b", pack: "#fbbf24", visor: "#fde047",
      hatType: "beanie", hatColor: "#fffbeb", mask: false, heavyGear: true, gaiter: "#10b981", duck: true, sheepEars: true,
    },
    cyan: {
      jacket: "#0284c7", zip: "#e0f2fe", pants: "#1e293b", pack: "#0f172a", visor: "#ff551a",
      hatType: "helmet", hatColor: "#eef4f8", mask: false, heavyGear: false, gaiter: "#ffffff", duck: false, isLucaBoy: true,
    },
  };

  let currentOutfitId = "tengger";
  let outfitIsCyclist = false;

  function setOutfit(planetId = "tengger") {
    const resolvedId = planetId === "luca" ? "luca-host" : planetId;
    const cfg = OUTFITS[resolvedId] || OUTFITS.tengger;
    currentOutfitId = OUTFITS[resolvedId] ? resolvedId : "tengger";
    const isBoy = Boolean(cfg.isLucaBoy);
    outfitIsCyclist = isBoy;
    jacketMat.color.set(cfg.jacket);
    zipMat.color.set(cfg.zip || "#27272a");
    pantsMat.color.set(cfg.pants);
    packMat.color.set(cfg.pack);
    visorMat.color.set(cfg.visor);
    visorMat.emissive.set(cfg.visor);
    skinMat.color.set(isBoy ? "#f0c29c" : "#fde4cf");
    bootMat.color.set(isBoy ? "#f8fafc" : "#4a3728");
    chest.scale.set(isBoy ? 1.12 : 1, 1, isBoy ? 1.04 : 1);
    hemSkirt.scale.set(isBoy ? 0.86 : 1, 1, isBoy ? 0.88 : 1);

    const isBrimmed = cfg.hatType === "wide" || cfg.hatType === "bucket";
    hatBrim.visible = isBrimmed;
    hatCrown.visible = isBrimmed;
    const brimScale = cfg.hatType === "bucket" ? 0.76 : 1.0;
    hatBrim.scale.set(brimScale, 1, brimScale);
    beanieGroup.visible = cfg.hatType === "beanie";
    lucaHelmetGroup.visible = cfg.hatType === "helmet";
    lucaBoyGroup.visible = isBoy;
    leftBraid.visible = !isBoy;
    rightBraid.visible = !isBoy;
    blushL.visible = !isBoy;
    blushR.visible = !isBoy;
    redCharm.visible = !isBoy;

    const isPuppyStyle = !cfg.catEars && !cfg.sheepEars;
    puppyEarsGroup.visible = isPuppyStyle;
    catEarsGroup.visible = Boolean(cfg.catEars);
    sheepEarsGroup.visible = Boolean(cfg.sheepEars);
    if (isBrimmed) hatMat.color.set(cfg.hatColor);
    if (cfg.hatType === "helmet") helmetShellMat.color.set(cfg.hatColor || "#eef4f8");
    if (cfg.hatType === "beanie") {
      beanieMat.color.set(cfg.hatColor);
      beanieCuffMat.color.set(cfg.cuffColor || cfg.hatColor);
      if (isPuppyStyle) {
        puppyEarMat.color.set(cfg.earColor || "#a85518");
        puppyBrowMat.color.set(cfg.browColor || "#fffbeb");
        const isLightHat = planetId === "siguniang" || planetId === "yili";
        bonePinMat.color.set(isLightHat ? "#fbbf24" : "#ffffff");
      }
    }

    faceMask.visible = cfg.mask;
    gogglesFrame.visible = !isBoy;
    goggles.visible = !isBoy;
    leftPole.visible = !isBoy && !isSitting;
    rightPole.visible = !isBoy && !isSitting;
    eggPad.visible = cfg.heavyGear;
    pomPom.visible = cfg.heavyGear;
    pack.scale.set(isBoy ? 0.62 : 1, cfg.heavyGear ? 1 : isBoy ? 0.66 : 0.78, cfg.heavyGear ? 1 : isBoy ? 0.52 : 0.8);
    duckCharm.visible = Boolean(cfg.duck);

    if (cfg.gaiter) {
      gaiterMat.color.set(cfg.gaiter);
      leftGaiter.visible = true;
      rightGaiter.visible = true;
    } else {
      leftGaiter.visible = false;
      rightGaiter.visible = false;
    }
  }

  let isSitting = false;
  let isCycling = false;
  let crankAngle = 0;
  let outfitHasMask = true;

  const origSetOutfit = setOutfit;
  function applyOutfitAndSync(planetId = "tengger") {
    origSetOutfit(planetId);
    outfitHasMask = Boolean((OUTFITS[currentOutfitId] || OUTFITS.tengger).mask);
    bikeFrameMat.color.set(planetId === "luca-tianshan" ? "#14b8a6" : "#38bdf8");
    if (isSitting) {
      faceMask.visible = false;
    }
    if (isCycling) {
      leftPole.visible = false;
      rightPole.visible = false;
    }
  }

  let waveTimer = 0;
  let emoteType = null;
  let emoteTimer = 0;

  return {
    root,
    get outfit() { return currentOutfitId; },
    get isCycling() { return isCycling; },
    setOutfit: applyOutfitAndSync,
    setCycling(on) {
      const next = Boolean(on);
      if (next && isSitting) this.setSitting(false);
      isCycling = next;
      rideBikeGroup.visible = isCycling;
      leftPole.visible = !isCycling && !isSitting && !outfitIsCyclist;
      rightPole.visible = !isCycling && !isSitting && !outfitIsCyclist;
      if (!isCycling) {
        bodyPivot.position.set(0, 0, 0);
        bodyPivot.rotation.set(0, 0, 0);
        packGroup.position.set(0, 0, 0);
        packGroup.rotation.set(0, 0, 0);
        leftLeg.position.set(-0.076, 0.16, 0);
        rightLeg.position.set(0.076, 0.16, 0);
        leftArm.rotation.set(0, 0, 0);
        rightArm.rotation.set(0, 0, 0);
        leftArm.scale.set(1, 1, 1);
        rightArm.scale.set(1, 1, 1);
      }
    },
    triggerWave() {
      waveTimer = 1.8;
    },
    triggerEmote(type = "cheer", duration = 2.6) {
      if (isSitting && type !== "sit") this.setSitting(false);
      emoteType = type;
      emoteTimer = duration;
      if (type === "wave") waveTimer = duration;
    },
    poseWaveSnapshot() {
      if (isSitting) this.setSitting(false);
      bodyPivot.position.y = 0.04;
      bodyPivot.rotation.set(0, 0, 0);
      leftLeg.rotation.x = 0.08;
      rightLeg.rotation.x = -0.08;
      leftArm.rotation.set(-0.45, 0, 0.22);
      rightArm.rotation.set(-2.55, 0, -0.42);
    },
    setSitting(on) {
      isSitting = Boolean(on);
      if (isSitting && isCycling) {
        isCycling = false;
        rideBikeGroup.visible = false;
        leftArm.rotation.set(0, 0, 0);
        rightArm.rotation.set(0, 0, 0);
        leftArm.scale.set(1, 1, 1);
        rightArm.scale.set(1, 1, 1);
      }
      sitLog.visible = isSitting;
      restingPoles.visible = isSitting && !outfitIsCyclist;
      leftPole.visible = !isSitting && !isCycling && !outfitIsCyclist;
      rightPole.visible = !isSitting && !isCycling && !outfitIsCyclist;
      strapL.visible = !isSitting;
      strapR.visible = !isSitting;
      chestBuckle.visible = !isSitting;

      if (isSitting) {
        // 卸下重装大包斜靠在身旁左侧营地草皮上
        packGroup.position.set(-0.36, -0.22, -0.02);
        packGroup.rotation.set(0.24, 0.55, 0.14);
        leftLeg.position.set(-0.076, 0.16, 0);
        rightLeg.position.set(0.076, 0.16, 0);
        // 拉下防晒面罩，将镀膜大风镜轻松推上额头帽檐
        faceMask.visible = false;
        gogglesFrame.position.set(0, 0.805, 0.115);
        gogglesFrame.rotation.x = -0.28;
        goggles.position.set(0, 0.805, 0.12);
        goggles.rotation.x = -0.28;
      } else {
        packGroup.position.set(0, 0, 0);
        packGroup.rotation.set(0, 0, 0);
        faceMask.visible = outfitHasMask;
        gogglesFrame.position.set(0, 0.755, 0.11);
        gogglesFrame.rotation.x = 0;
        goggles.position.set(0, 0.755, 0.115);
        goggles.rotation.x = 0;
        leftArm.rotation.z = 0;
        rightArm.rotation.z = 0;
        bodyPivot.position.set(0, 0, 0);
        bodyPivot.rotation.set(0, 0, 0);
      }
    },
    setHeadlamp(on) {
      lampLens.visible = Boolean(on);
      headLight.intensity = on ? 4.6 : 0;
    },
    update(dt, elapsed, speedRatio = 0) {
      if (isSitting) {
        // 坐在营地圆木桩上，卸包伸手向篝火取暖、轻晃双脚与辫子
        bodyPivot.position.y = -0.09;
        bodyPivot.rotation.x = 0.05;
        leftLeg.rotation.x = -1.24 + Math.sin(elapsed * 2.2) * 0.07;
        rightLeg.rotation.x = -1.24 - Math.sin(elapsed * 2.2) * 0.07;
        leftArm.rotation.x = -0.76 + Math.sin(elapsed * 2.8) * 0.05;
        rightArm.rotation.x = -0.76 - Math.sin(elapsed * 2.8) * 0.05;
        leftArm.rotation.z = 0.18;
        rightArm.rotation.z = -0.18;
        leftBraid.rotation.z = -0.2 + Math.sin(elapsed * 2.4) * 0.06;
        rightBraid.rotation.z = 0.2 + Math.cos(elapsed * 2.4) * 0.06;
        return;
      }
      const s = THREE.MathUtils.clamp(speedRatio, 0, 2.2);
      if (isCycling) {
        // 🚴 破风骑行姿态：跨坐车鞍、俯身前倾握弯把、车轮飞转、双腿真实画圆踩踏！
        const wheelRate = s * 11.5;
        bikeFrontWheel.rotation.x += dt * wheelRate;
        bikeRearWheel.rotation.x += dt * wheelRate;
        crankAngle += dt * (s > 0.05 ? 5.2 + s * 6.5 : 0);
        bikeCrankPivot.rotation.x = crankAngle;

        const aeroLean = 0.40 + Math.min(0.08, s * 0.045);
        const bob = s > 0.05 ? Math.sin(crankAngle * 2) * 0.01 : Math.sin(elapsed * 2.2) * 0.004;
        const swayZ = s > 0.05 ? Math.sin(crankAngle) * 0.032 : 0;
        const by = 0.155 + bob;
        const bz = -0.105;
        bodyPivot.position.set(0, by, bz);
        bodyPivot.rotation.set(aeroLean, 0, swayZ);
        packGroup.position.copy(bodyPivot.position);
        packGroup.rotation.copy(bodyPivot.rotation);

        if (s > 0.05) {
          leftLeg.position.set(-0.076, 0.16 + Math.sin(crankAngle) * 0.052, Math.cos(crankAngle) * 0.048);
          rightLeg.position.set(0.076, 0.16 - Math.sin(crankAngle) * 0.052, -Math.cos(crankAngle) * 0.048);
          leftLeg.rotation.x = -0.45 + Math.cos(crankAngle) * 0.48;
          rightLeg.rotation.x = -0.45 - Math.cos(crankAngle) * 0.48;
        } else {
          // 驻车等红灯/看风景时：左脚踩上踏板，右脚自然点地微侧倾
          leftLeg.position.set(-0.076, 0.19, 0.04);
          leftLeg.rotation.x = -0.62;
          rightLeg.position.set(0.082, 0.12, 0.01);
          rightLeg.rotation.x = -0.18;
        }

        // 闭式逆运动学（Analytic IK）：双手手套实时精准锁死在左右公路车手变头 (±0.118, 0.484, 0.246) 上！
        const cosL = Math.cos(aeroLean), sinL = Math.sin(aeroLean);
        const cosZ = Math.cos(swayZ), sinZ = Math.sin(swayZ);
        const gripHood = (armPivot, side) => {
          const dx = side * 0.118;
          const dy = 0.484 - by;
          const dz = 0.246 - bz;
          const dy1 = dy * cosL + dz * sinL;
          const dz1 = -dy * sinL + dz * cosL;
          const lx = dx * cosZ + dy1 * sinZ;
          const ly = -dx * sinZ + dy1 * cosZ;
          const vx = lx - side * 0.185;
          const vy = ly - 0.56;
          const vz = dz1;
          const armScale = Math.hypot(vx, vy, vz) / 0.206155;
          const y0 = -0.19 * armScale;
          const z0 = 0.08 * armScale;
          const rz = Math.asin(THREE.MathUtils.clamp(vx / -y0, -0.96, 0.96));
          const y1 = y0 * Math.cos(rz);
          const rx = Math.atan2(vz, vy) - Math.atan2(z0, y1);
          armPivot.scale.set(1, armScale, armScale);
          armPivot.rotation.set(rx, 0, rz);
        };
        gripHood(leftArm, -1);
        if (waveTimer > 0) {
          waveTimer = Math.max(0, waveTimer - dt);
          rightArm.scale.set(1, 1, 1);
          rightArm.rotation.x = -2.35;
          rightArm.rotation.z = -0.35 + Math.sin(elapsed * 14) * 0.32;
        } else {
          gripHood(rightArm, 1);
        }
        if (puppyEarsGroup.visible) {
          const windFlap = 0.12 + s * 0.28 + Math.sin(elapsed * 9) * 0.05;
          leftPuppyEar.rotation.z = 0.34 + windFlap;
          rightPuppyEar.rotation.z = -0.34 - windFlap;
        }
        leftBraid.rotation.x = -0.32 - s * 0.32;
        rightBraid.rotation.x = -0.32 - s * 0.32;
        return;
      }
      if (emoteTimer > 0) {
        emoteTimer = Math.max(0, emoteTimer - dt);
        if (emoteType === "cheer") {
          const hop = Math.abs(Math.sin(elapsed * 9.5));
          bodyPivot.position.y = hop * 0.24;
          bodyPivot.rotation.y = 0;
          leftArm.rotation.x = -2.65 + Math.sin(elapsed * 12) * 0.2;
          rightArm.rotation.x = -2.65 - Math.sin(elapsed * 12) * 0.2;
          leftArm.rotation.z = 0.36;
          rightArm.rotation.z = -0.36;
          leftLeg.rotation.x = hop * 0.35;
          rightLeg.rotation.x = -hop * 0.25;
          if (puppyEarsGroup.visible) {
            leftPuppyEar.rotation.z = 0.34 + hop * 0.42;
            rightPuppyEar.rotation.z = -0.34 - hop * 0.42;
          }
          packGroup.position.y = bodyPivot.position.y;
          return;
        } else if (emoteType === "spin") {
          bodyPivot.position.y = 0.08 + Math.abs(Math.sin(elapsed * 8)) * 0.08;
          bodyPivot.rotation.y += dt * 7.2;
          leftArm.rotation.x = -1.35;
          rightArm.rotation.x = -1.35;
          leftArm.rotation.z = 0.85;
          rightArm.rotation.z = -0.85;
          packGroup.position.y = bodyPivot.position.y;
          packGroup.rotation.y = bodyPivot.rotation.y;
          return;
        }
      } else if (bodyPivot.rotation.y !== 0) {
        bodyPivot.rotation.y = 0;
        packGroup.rotation.y = 0;
        leftArm.rotation.z = 0;
      }

      const walkPhase = elapsed * (7.5 + s * 3.5);
      const swing = Math.sin(walkPhase) * 0.55 * Math.min(1, s);

      leftLeg.rotation.x = swing;
      rightLeg.rotation.x = -swing;
      leftArm.rotation.x = -swing * 0.85;
      if (waveTimer > 0) {
        waveTimer = Math.max(0, waveTimer - dt);
        rightArm.rotation.x = -2.45;
        rightArm.rotation.z = -0.35 + Math.sin(elapsed * 14) * 0.32;
      } else {
        rightArm.rotation.x = swing * 0.85;
        rightArm.rotation.z = 0;
      }

      bodyPivot.position.y = Math.abs(Math.sin(walkPhase)) * 0.045 * Math.min(1, s);
      bodyPivot.rotation.x = s * 0.08;
      packGroup.position.y = bodyPivot.position.y;
      packGroup.rotation.x = bodyPivot.rotation.x;

      // 双小辫与元气小狗软垂耳随微风与步伐一颠一颠扑扇
      const braidBounce = Math.sin(walkPhase * 2) * (0.06 + s * 0.18);
      const breeze = Math.sin(elapsed * 3.4) * 0.08;
      if (puppyEarsGroup.visible) {
        const flap = Math.abs(Math.sin(walkPhase * 2)) * (0.06 + s * 0.26) + Math.sin(elapsed * 2.8) * 0.035;
        leftPuppyEar.rotation.z = 0.34 + flap;
        rightPuppyEar.rotation.z = -0.34 - flap;
      }
      leftBraid.rotation.z = -0.18 - Math.abs(braidBounce) * 0.5 + breeze * 0.4;
      rightBraid.rotation.z = 0.18 + Math.abs(braidBounce) * 0.5 + breeze * 0.4;
      leftBraid.rotation.x = -0.12 - s * 0.25 + Math.cos(elapsed * 4.1) * 0.06;
      rightBraid.rotation.x = -0.12 - s * 0.25 + Math.sin(elapsed * 4.1) * 0.06;
    },
  };
}
