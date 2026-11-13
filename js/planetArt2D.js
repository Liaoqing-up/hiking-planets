/**
 * 为羊皮纸星图卷轴生成 6 颗手绘水彩绘本风微缩星球插画（Retina 2x Canvas）
 * 参考《小王子：星辰之旅》星图卷轴中立体陨石坑肌理 + 顶部微缩景观的视觉风格
 */

function seededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function renderPlanetIllustration(canvas, planetId) {
  const size = 340;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, size, size);

  const cx = size * 0.5;
  const cy = size * 0.57;
  const r = size * 0.29;

  const themes = {
    tengger: {
      seed: 105,
      topA: "#f8dfa1",
      topB: "#e3a659",
      botA: "#b8743d",
      botB: "#784830",
      crater: "#965a32",
      rim: "#ffe9b5",
      glow: "rgba(244, 182, 96, 0.28)",
    },
    yading: {
      seed: 6032,
      topA: "#f0f6ff",
      topB: "#9bb5cf",
      botA: "#6a7d96",
      botB: "#435069",
      crater: "#4f5f78",
      rim: "#ffffff",
      glow: "rgba(126, 200, 255, 0.28)",
    },
    zhagana: {
      seed: 3900,
      topA: "#93c987",
      topB: "#5d9964",
      botA: "#7b8782",
      botB: "#50595c",
      crater: "#5c6666",
      rim: "#d6f2cb",
      glow: "rgba(140, 214, 158, 0.26)",
    },
    siguniang: {
      seed: 4668,
      topA: "#f7d4b2",
      topB: "#d97d48",
      botA: "#7d6864",
      botB: "#4b4252",
      crater: "#5e5059",
      rim: "#ffe6cf",
      glow: "rgba(242, 159, 103, 0.28)",
    },
    maclehose: {
      seed: 100,
      topA: "#8ed678",
      topB: "#3ca6a6",
      botA: "#1e7594",
      botB: "#184869",
      crater: "#1b5a78",
      rim: "#cbf7dc",
      glow: "rgba(82, 224, 212, 0.28)",
    },
    yili: {
      seed: 2800,
      topA: "#aae376",
      topB: "#5cb356",
      botA: "#587d68",
      botB: "#3d545c",
      crater: "#486958",
      rim: "#e4ffbd",
      glow: "rgba(168, 230, 108, 0.28)",
    },
  };

  const t = themes[planetId] || themes.tengger;
  const rand = seededRandom(t.seed);

  // 1. 柔和外发光水彩底晕
  const aura = ctx.createRadialGradient(cx, cy - 8, r * 0.5, cx, cy, r * 1.55);
  aura.addColorStop(0, t.glow);
  aura.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.55, 0, Math.PI * 2);
  ctx.fill();

  // 2. 绘制星球顶部后景元素（在球体背后的雪峰/石壁/沙丘远景）
  drawPlanetCrownBack(ctx, planetId, cx, cy, r);

  // 3. 星球主体球面（手绘不规则微起伏轮廓）
  ctx.save();
  ctx.beginPath();
  const steps = 72;
  for (let i = 0; i <= steps; i++) {
    const ang = (i / steps) * Math.PI * 2;
    const wobble = 1 + Math.sin(ang * 7 + t.seed) * 0.014 + Math.cos(ang * 13) * 0.01;
    const px = cx + Math.cos(ang) * r * wobble;
    const py = cy + Math.sin(ang) * r * wobble;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.clip();

  // 球体主渐变（右上暖受光，左下深阴影）
  const sphereGrad = ctx.createRadialGradient(
    cx - r * 0.28,
    cy - r * 0.38,
    r * 0.12,
    cx + r * 0.1,
    cy + r * 0.2,
    r * 1.25
  );
  sphereGrad.addColorStop(0, t.topA);
  sphereGrad.addColorStop(0.45, t.topB);
  sphereGrad.addColorStop(0.8, t.botA);
  sphereGrad.addColorStop(1, t.botB);
  ctx.fillStyle = sphereGrad;
  ctx.fillRect(cx - r - 10, cy - r - 10, r * 2 + 20, r * 2 + 20);

  // 特殊星球地表分界（如麦理浩径半山半海、腾格里乌兰湖、伊犁花海溪流）
  drawPlanetSurfaceBands(ctx, planetId, cx, cy, r);

  // 水彩斑驳笔触肌理
  for (let i = 0; i < 65; i++) {
    const a = rand() * Math.PI * 2;
    const dist = Math.sqrt(rand()) * r * 0.95;
    const bx = cx + Math.cos(a) * dist;
    const by = cy + Math.sin(a) * dist;
    const br = 6 + rand() * 18;
    ctx.fillStyle =
      by < cy
        ? `rgba(255, 248, 225, ${0.04 + rand() * 0.08})`
        : `rgba(20, 26, 46, ${0.05 + rand() * 0.1})`;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();
  }

  // 下半球小王子式精致岩石陨石坑肌理
  const craterCount = 11;
  for (let i = 0; i < craterCount; i++) {
    const ang = 0.15 * Math.PI + rand() * 0.7 * Math.PI; // 集中在下半球
    const dist = (0.38 + rand() * 0.5) * r;
    const kx = cx + Math.cos(ang) * dist;
    const ky = cy + Math.sin(ang) * dist * 0.92;
    const kr = 5 + rand() * 11;

    ctx.save();
    ctx.translate(kx, ky);
    ctx.rotate(ang - Math.PI / 2);
    ctx.scale(1, 0.72);

    // 坑外亮沿
    ctx.fillStyle = "rgba(255,245,220,0.28)";
    ctx.beginPath();
    ctx.arc(0, 1.5, kr + 1.5, 0, Math.PI * 2);
    ctx.fill();

    // 坑内暗影
    ctx.fillStyle = t.crater;
    ctx.globalAlpha = 0.58;
    ctx.beginPath();
    ctx.arc(0, 0, kr, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(18, 20, 35, 0.35)";
    ctx.beginPath();
    ctx.arc(-1.5, -2, kr * 0.75, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 球体顶部受光高光边缘与底部暗部反光
  const rimLight = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  rimLight.addColorStop(0, "rgba(255, 250, 232, 0.38)");
  rimLight.addColorStop(0.28, "rgba(255, 250, 232, 0)");
  rimLight.addColorStop(0.75, "rgba(15, 22, 42, 0)");
  rimLight.addColorStop(1, "rgba(12, 18, 38, 0.42)");
  ctx.fillStyle = rimLight;
  ctx.fillRect(cx - r - 10, cy - r - 10, r * 2 + 20, r * 2 + 20);

  ctx.restore();

  // 4. 绘制生长在球体上方的精致徒步微缩景观前景
  drawPlanetCrownFront(ctx, planetId, cx, cy, r);
}

function drawPlanetSurfaceBands(ctx, id, cx, cy, r) {
  if (id === "tengger") {
    // 起伏新月形沙浪与赤红地球之心乌兰湖
    ctx.fillStyle = "rgba(214, 126, 56, 0.45)";
    ctx.beginPath();
    ctx.moveTo(cx - r, cy - 12);
    ctx.quadraticCurveTo(cx - r * 0.3, cy - 34, cx + r * 0.25, cy - 8);
    ctx.quadraticCurveTo(cx + r * 0.7, cy + 12, cx + r, cy - 6);
    ctx.lineTo(cx + r, cy + r);
    ctx.lineTo(cx - r, cy + r);
    ctx.fill();

    // 乌兰湖赤红斑块 + 白色盐边
    ctx.save();
    ctx.translate(cx - r * 0.26, cy - r * 0.26);
    ctx.rotate(-0.2);
    ctx.fillStyle = "#fff3e0";
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#cc3535";
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (id === "yading") {
    // 金秋草甸 + 宝石蓝牛奶海
    ctx.fillStyle = "rgba(214, 162, 72, 0.5)";
    ctx.beginPath();
    ctx.ellipse(cx, cy - r * 0.35, r * 0.85, r * 0.36, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(cx + r * 0.18, cy - r * 0.3);
    ctx.fillStyle = "#e6f7ff";
    ctx.beginPath();
    ctx.ellipse(0, 0, 21, 11, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#199be6";
    ctx.beginPath();
    ctx.ellipse(0, 0, 17, 8.5, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (id === "maclehose") {
    // 左山脊翠绿，右西贡果冻海与白沙滩
    ctx.fillStyle = "#f5e6ba";
    ctx.beginPath();
    ctx.arc(cx + r * 0.28, cy - r * 0.1, r * 0.68, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#189ec2";
    ctx.beginPath();
    ctx.arc(cx + r * 0.36, cy - r * 0.05, r * 0.62, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === "siguniang") {
    // 左长坪沟苍翠雪白，右毕棚沟红石彩林
    ctx.fillStyle = "rgba(214, 82, 52, 0.5)";
    ctx.beginPath();
    ctx.arc(cx + r * 0.38, cy - r * 0.22, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === "yili") {
    // 赛里木湖一角湛蓝 + 薰衣草花带
    ctx.fillStyle = "rgba(155, 116, 224, 0.42)";
    ctx.beginPath();
    ctx.ellipse(cx - r * 0.28, cy - r * 0.22, 28, 12, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#227de0";
    ctx.beginPath();
    ctx.ellipse(cx + r * 0.28, cy - r * 0.15, 22, 11, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMountainPeak(ctx, x, y, w, h, baseColor, snowColor) {
  ctx.fillStyle = baseColor;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y);
  ctx.lineTo(x, y - h);
  ctx.lineTo(x + w / 2, y);
  ctx.closePath();
  ctx.fill();

  // 背光侧阴影
  ctx.fillStyle = "rgba(20, 30, 55, 0.25)";
  ctx.beginPath();
  ctx.moveTo(x, y - h);
  ctx.lineTo(x + w / 2, y);
  ctx.lineTo(x + w * 0.06, y);
  ctx.closePath();
  ctx.fill();

  if (snowColor) {
    ctx.fillStyle = snowColor;
    ctx.beginPath();
    ctx.moveTo(x, y - h);
    ctx.lineTo(x - w * 0.24, y - h * 0.52);
    ctx.lineTo(x - w * 0.06, y - h * 0.6);
    ctx.lineTo(x + w * 0.08, y - h * 0.48);
    ctx.lineTo(x + w * 0.24, y - h * 0.54);
    ctx.closePath();
    ctx.fill();
  }
}

function drawSpruce(ctx, x, y, scale = 1, color = "#2e6b48") {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#5c4030";
  ctx.fillRect(-1.8, -4, 3.6, 7);
  ctx.fillStyle = color;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(0, -24 + i * 5);
    ctx.lineTo(-9 + i * 1.4, -10 + i * 5);
    ctx.lineTo(9 - i * 1.4, -10 + i * 5);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawTent(ctx, x, y, color = "#f09b38") {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-12, 0);
  ctx.lineTo(0, -15);
  ctx.lineTo(12, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#ffe89e";
  ctx.beginPath();
  ctx.moveTo(-4, 0);
  ctx.lineTo(0, -8);
  ctx.lineTo(4, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPlanetCrownBack(ctx, id, cx, cy, r) {
  const topY = cy - r * 0.86;
  if (id === "tengger") {
    // 金色大沙丘弧顶
    ctx.fillStyle = "#e8af5d";
    ctx.beginPath();
    ctx.moveTo(cx - 58, topY + 24);
    ctx.quadraticCurveTo(cx - 18, topY - 22, cx + 22, topY + 14);
    ctx.quadraticCurveTo(cx + 45, topY - 12, cx + 66, topY + 26);
    ctx.closePath();
    ctx.fill();
  } else if (id === "yading") {
    // 亚丁三神山：仙乃日、央迈勇、夏诺多吉
    drawMountainPeak(ctx, cx - 28, topY + 22, 46, 54, "#6f829c", "#f7fbff");
    drawMountainPeak(ctx, cx + 28, topY + 24, 44, 48, "#637691", "#eef6ff");
    drawMountainPeak(ctx, cx + 2, topY + 20, 52, 72, "#7d92b0", "#ffffff");
  } else if (id === "zhagana") {
    // 扎尕那巨型灰白石匣山墙
    ctx.fillStyle = "#adb5b8";
    ctx.beginPath();
    ctx.moveTo(cx - 64, topY + 28);
    ctx.lineTo(cx - 50, topY - 28);
    ctx.lineTo(cx - 28, topY - 20);
    ctx.lineTo(cx - 12, topY - 46);
    ctx.lineTo(cx + 12, topY - 42);
    ctx.lineTo(cx + 28, topY - 24);
    ctx.lineTo(cx + 50, topY - 32);
    ctx.lineTo(cx + 64, topY + 28);
    ctx.closePath();
    ctx.fill();
    // 石林竖向裂隙阴影
    ctx.strokeStyle = "rgba(65,75,82,0.45)";
    ctx.lineWidth = 2;
    [-32, -10, 12, 34].forEach((dx) => {
      ctx.beginPath();
      ctx.moveTo(cx + dx, topY - 28);
      ctx.lineTo(cx + dx + 3, topY + 18);
      ctx.stroke();
    });
  } else if (id === "siguniang") {
    // 幺妹峰冷峻高耸雪峰 + 叉子沟垭口
    drawMountainPeak(ctx, cx - 18, topY + 22, 54, 70, "#6d6f87", "#ffffff");
    drawMountainPeak(ctx, cx + 22, topY + 24, 46, 46, "#8c6960", "#f7eee8");
  } else if (id === "maclehose") {
    // 蚺蛇尖翠绿尖峰
    drawMountainPeak(ctx, cx - 22, topY + 24, 58, 52, "#4f9c5c", null);
    drawMountainPeak(ctx, cx + 14, topY + 26, 48, 36, "#66b567", null);
  } else if (id === "yili") {
    // 远方连绵天山雪岭
    drawMountainPeak(ctx, cx - 26, topY + 22, 50, 44, "#799496", "#f5faff");
    drawMountainPeak(ctx, cx + 18, topY + 22, 54, 48, "#6f8a8f", "#f5faff");
  }
}

function drawPlanetCrownFront(ctx, id, cx, cy, r) {
  const topY = cy - r * 0.92;

  if (id === "tengger") {
    // 沙漠帐篷 + 枯木胡杨 + 两只小骆驼剪影
    drawTent(ctx, cx + 18, topY + 12, "#f28d35");
    // 骆驼小队
    ctx.fillStyle = "#6e3f20";
    [-26, -10].forEach((dx, idx) => {
      const y = topY + 8 + idx * 3;
      ctx.beginPath();
      ctx.ellipse(cx + dx, y - 5, 5.5, 3.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(cx + dx - 4, y - 5, 1.5, 6);
      ctx.fillRect(cx + dx + 3, y - 5, 1.5, 6);
      ctx.beginPath();
      ctx.arc(cx + dx + 6, y - 9, 2.2, 0, Math.PI * 2);
      ctx.fill();
    });
    // 金色胡杨树
    drawSpruce(ctx, cx + 42, topY + 20, 0.85, "#e89c31");
  } else if (id === "yading") {
    // 五彩经幡 + 金黄落叶松
    drawSpruce(ctx, cx - 44, topY + 20, 0.9, "#d99b2e");
    drawSpruce(ctx, cx + 44, topY + 22, 0.85, "#e0ab38");
    // 垭口经幡弦线
    ctx.strokeStyle = "#f2e8d5";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cx - 28, topY + 10);
    ctx.quadraticCurveTo(cx, topY - 6, cx + 28, topY + 10);
    ctx.stroke();
    const flagColors = ["#3b82f6", "#f8fafc", "#ef4444", "#22c55e", "#eab308"];
    flagColors.forEach((fc, idx) => {
      ctx.fillStyle = fc;
      ctx.fillRect(cx - 20 + idx * 9, topY + 2, 6, 5);
    });
  } else if (id === "zhagana") {
    // 藏式榻板木屋 + 袅袅晨雾炊烟 + 冷杉
    drawSpruce(ctx, cx - 46, topY + 22, 0.95, "#2d6b45");
    drawSpruce(ctx, cx + 46, topY + 22, 0.9, "#36784e");
    [
      { dx: -16, dy: 10 },
      { dx: 8, dy: 6 },
    ].forEach((h) => {
      ctx.fillStyle = "#b88456";
      ctx.fillRect(cx + h.dx - 9, topY + h.dy - 9, 18, 11);
      ctx.fillStyle = "#6e472b";
      ctx.beginPath();
      ctx.moveTo(cx + h.dx - 12, topY + h.dy - 9);
      ctx.lineTo(cx + h.dx, topY + h.dy - 16);
      ctx.lineTo(cx + h.dx + 12, topY + h.dy - 9);
      ctx.closePath();
      ctx.fill();
    });
    // 晨雾云带
    ctx.fillStyle = "rgba(245, 250, 248, 0.65)";
    ctx.beginPath();
    ctx.ellipse(cx - 10, topY - 4, 24, 6, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 18, topY + 2, 20, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === "siguniang") {
    // 彩林红桦 + 枯树滩枝干 + 营地帐篷
    drawSpruce(ctx, cx + 38, topY + 18, 0.95, "#d95b38");
    drawSpruce(ctx, cx + 50, topY + 26, 0.8, "#eba038");
    drawTent(ctx, cx - 32, topY + 16, "#e8b938");
    // 枯树剪影
    ctx.strokeStyle = "#ded6cc";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 6, topY + 12);
    ctx.lineTo(cx - 6, topY - 6);
    ctx.lineTo(cx - 13, topY - 13);
    ctx.moveTo(cx - 6, topY - 3);
    ctx.lineTo(cx + 2, topY - 10);
    ctx.stroke();
  } else if (id === "maclehose") {
    // 麦理浩径黄黑标距柱 + 万宜六角火山岩柱 + 浪花
    // 六角岩柱群
    ctx.fillStyle = "#c4a070";
    [26, 35, 44].forEach((dx, i) => {
      const hh = 18 - i * 3;
      ctx.fillRect(cx + dx, topY + 18 - hh, 7, hh);
    });
    // 标距柱 M100
    ctx.fillStyle = "#f5ede0";
    ctx.fillRect(cx - 8, topY - 12, 6, 22);
    ctx.fillStyle = "#e89f29";
    ctx.fillRect(cx - 8, topY - 8, 6, 6);
    // 海湾白浪点缀
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx + r * 0.25, cy - r * 0.12, r * 0.56, -0.9, 0.2);
    ctx.stroke();
  } else if (id === "yili") {
    // 雪岭云杉 + 哈萨克白毡房 + 草地小绵羊
    drawSpruce(ctx, cx - 42, topY + 18, 1.05, "#235c3a");
    drawSpruce(ctx, cx - 28, topY + 12, 0.9, "#2d7046");
    drawSpruce(ctx, cx + 42, topY + 20, 0.95, "#235c3a");

    // 洁白毡房 Yurt
    ctx.fillStyle = "#fbf8f0";
    ctx.fillRect(cx + 2, topY + 2, 20, 9);
    ctx.beginPath();
    ctx.arc(cx + 12, topY + 2, 10, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = "#d97848";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx + 2, topY + 3);
    ctx.lineTo(cx + 22, topY + 3);
    ctx.stroke();

    // 小绵羊点点
    ctx.fillStyle = "#ffffff";
    [
      [-14, 14],
      [-5, 17],
      [28, 16],
    ].forEach(([dx, dy]) => {
      ctx.beginPath();
      ctx.ellipse(cx + dx, topY + dy, 4, 2.8, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}
