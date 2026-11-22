import { renderPlanetIllustration } from "./planetArt2D.js?v=5.3.2-shanhai-astrolabe";
import { CREATURE_CATALOG } from "./creatures3D.js?v=5.3.2-shanhai-astrolabe";
import { drawSiteQrStamp, drawPostmarkSeal, drawTravelerNameplate, resolveQrDomainLabel } from "./qrStamp.js?v=5.3.2-shanhai-astrolabe";
import { computeSmartPhotoCrop, getSavedPhotoPan } from "./photoFocus.js?v=5.3.2-shanhai-astrolabe";

const PORTRAIT_BG = {
  tengger: ["#2e1a12", "#8b4b22"],
  yading: ["#13243f", "#3b6598"],
  zhagana: ["#162c28", "#3d6e5c"],
  siguniang: ["#281c3b", "#6e4b8c"],
  maclehose: ["#102a3f", "#27708f"],
  yili: ["#1c2d1f", "#557d4c"],
  "kitty-xiaowutai": ["#1a2e22", "#4b8b5e"],
  "kitty-sunset": ["#2c1836", "#8c466e"],
  "kitty-changbai": ["#12263f", "#3672a8"],
  "kitty-zhagana": ["#162c28", "#3f7560"],
  "kitty-daqing": ["#1c2f24", "#528258"],
  "kitty-wusun": ["#1c2638", "#4e6d8c"],
  "kitty-yading": ["#2b1e16", "#8a5a32"],
  "miemie-guizhou": ["#112e28", "#2d7c68"],
  "miemie-volcano": ["#2b1218", "#9f2a3e"],
  "miemie-hulunbuir": ["#1a2e1f", "#6a9e3f"],
  "miemie-tonggudang": ["#162b22", "#3e7d5c"],
  "miemie-longji": ["#1a2b20", "#4b7c4e"],
  "miemie-shexiang": ["#091c32", "#1e6494"],
  "miemie-buyi": ["#1d2730", "#4f687a"],
  "miemie-yading": ["#15243d", "#3c6494"],
  "luca-hainan": ["#0d2b45", "#1c6b8c"],
  "luca-tianshan": ["#122b26", "#356e5c"],
};

function drawAnimalShape(ctx, planetId) {
  ctx.save();
  ctx.translate(90, 96);
  drawAnimalAtOrigin(ctx, planetId);
  ctx.restore();
}

function drawAnimalAtOrigin(ctx, planetId) {
  if (planetId === "tengger") {
    // 摇铃双峰小骆驼
    ctx.fillStyle = "#dfa15a";
    ctx.beginPath();
    ctx.ellipse(4, 18, 34, 21, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f1d39f";
    ctx.beginPath();
    ctx.arc(-8, -4, 13, 0, Math.PI * 2);
    ctx.arc(16, -2, 12, 0, Math.PI * 2);
    ctx.fill();
    // 长颈与头
    ctx.fillStyle = "#dfa15a";
    ctx.beginPath();
    ctx.roundRect(-34, -22, 14, 34, 7);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-32, -26, 16, 12, -0.15, 0, Math.PI * 2);
    ctx.fill();
    // 红项圈与金驼铃
    ctx.strokeStyle = "#dc3830";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-35, -4);
    ctx.lineTo(-20, 0);
    ctx.stroke();
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(-31, 4, 5.5, 0, Math.PI * 2);
    ctx.fill();
    // 眼睛
    ctx.fillStyle = "#1c1917";
    ctx.beginPath();
    ctx.arc(-36, -28, 2.6, 0, Math.PI * 2);
    ctx.fill();
  } else if (planetId === "yading") {
    // 直立捧胸雪山旱獭
    ctx.fillStyle = "#9e6b3b";
    ctx.beginPath();
    ctx.ellipse(0, 14, 28, 34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f3d8a6";
    ctx.beginPath();
    ctx.ellipse(0, 18, 19, 25, 0, 0, Math.PI * 2);
    ctx.fill();
    // 圆脑袋与小耳朵
    ctx.fillStyle = "#9e6b3b";
    ctx.beginPath();
    ctx.arc(-16, -34, 7, 0, Math.PI * 2);
    ctx.arc(16, -34, 7, 0, Math.PI * 2);
    ctx.arc(0, -20, 22, 0, Math.PI * 2);
    ctx.fill();
    // 小门牙与黑鼻头
    ctx.fillStyle = "#fffdf7";
    ctx.fillRect(-4, -13, 8, 6);
    ctx.fillStyle = "#291d16";
    ctx.beginPath();
    ctx.arc(0, -17, 4, 0, Math.PI * 2);
    ctx.fill();
    // 双爪捧胸
    ctx.fillStyle = "#4a3222";
    ctx.beginPath();
    ctx.ellipse(-10, 6, 7, 5, 0.4, 0, Math.PI * 2);
    ctx.ellipse(10, 6, 7, 5, -0.4, 0, Math.PI * 2);
    ctx.fill();
    // 亮晶晶眼睛与腮红
    ctx.fillStyle = "#1c1917";
    ctx.beginPath();
    ctx.arc(-9, -23, 3, 0, Math.PI * 2);
    ctx.arc(9, -23, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(244, 144, 174, 0.65)";
    ctx.beginPath();
    ctx.arc(-14, -17, 4.5, 0, Math.PI * 2);
    ctx.arc(14, -17, 4.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (planetId === "siguniang" || planetId === "miemie-volcano" || planetId === "kitty-zhagana") {
    // 小王子白尖尾小狐狸（四姑娘山暖橙 / 大红山火山赤红 / 扎尕那冰川雪狐）
    const coat =
      planetId === "miemie-volcano"
        ? "#e11d48"
        : planetId === "kitty-zhagana"
          ? "#bfdbfe"
          : "#ea7434";
    // 大尾巴
    ctx.fillStyle = coat;
    ctx.beginPath();
    ctx.ellipse(26, 12, 22, 13, -0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff8ee";
    ctx.beginPath();
    ctx.arc(41, 1, 10, 0, Math.PI * 2);
    ctx.fill();
    // 身体与白胸毛
    ctx.fillStyle = coat;
    ctx.beginPath();
    ctx.ellipse(-4, 18, 22, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff8ee";
    ctx.beginPath();
    ctx.ellipse(-4, 14, 13, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    // 大尖耳与狐狸脸
    ctx.fillStyle = coat;
    ctx.beginPath();
    ctx.moveTo(-24, -18);
    ctx.lineTo(-16, -46);
    ctx.lineTo(-4, -22);
    ctx.moveTo(16, -18);
    ctx.lineTo(8, -46);
    ctx.lineTo(-4, -22);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-4, -14, 22, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff8ee";
    ctx.beginPath();
    ctx.arc(-14, -8, 10, 0, Math.PI * 2);
    ctx.arc(6, -8, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1f1918";
    ctx.beginPath();
    ctx.arc(-12, -15, 2.8, 0, Math.PI * 2);
    ctx.arc(4, -15, 2.8, 0, Math.PI * 2);
    ctx.arc(-4, -6, 3.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (planetId === "yili") {
    // 蓬松云朵小羊羔
    ctx.fillStyle = "#fcfaf2";
    const puffs = [
      [-18, 8, 16], [0, 2, 19], [18, 8, 16],
      [-14, 22, 15], [4, 24, 17], [18, 21, 14],
    ];
    for (const [px, py, pr] of puffs) {
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }
    // 粉耳朵与黑脸蛋
    ctx.fillStyle = "#f49cb5";
    ctx.beginPath();
    ctx.ellipse(-24, -14, 9, 5, -0.3, 0, Math.PI * 2);
    ctx.ellipse(16, -14, 9, 5, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#382f2c";
    ctx.beginPath();
    ctx.arc(-4, -12, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(-4, -26, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fffdf9";
    ctx.beginPath();
    ctx.arc(-10, -13, 2.6, 0, Math.PI * 2);
    ctx.arc(2, -13, 2.6, 0, Math.PI * 2);
    ctx.fill();
  } else if (planetId === "maclehose") {
    // 复刻宜家 Blåhaj 毛绒小蓝鲨侧颜水彩肖像
    // 大背鳍 + 后腰小背鳍 + 剪刀尾鳍
    ctx.fillStyle = "#5c839b";
    ctx.beginPath();
    ctx.moveTo(-8, -8);
    ctx.quadraticCurveTo(2, -46, 10, -44);
    ctx.quadraticCurveTo(14, -22, 14, -6);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(24, -2);
    ctx.lineTo(31, -14);
    ctx.lineTo(35, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(38, 4);
    ctx.quadraticCurveTo(55, -22, 56, -16);
    ctx.lineTo(48, 6);
    ctx.lineTo(54, 22);
    ctx.quadraticCurveTo(44, 18, 38, 10);
    ctx.fill();

    // 圆润雾霾蓝鱼身 + 奶白圆肚皮
    ctx.fillStyle = "#5c839b";
    ctx.beginPath();
    ctx.ellipse(-2, 4, 46, 22, -0.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f5f0e8";
    ctx.beginPath();
    ctx.ellipse(-6, 14, 37, 13, -0.04, 0, Math.PI);
    ctx.fill();

    // 粉嫩微笑嘴巴 + 锯齿软布小白牙
    ctx.fillStyle = "#efa9a0";
    ctx.beginPath();
    ctx.ellipse(-26, 14, 14, 4.5, 0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    for (let t = 0; t < 4; t++) {
      const tx = -36 + t * 5.5;
      ctx.beginPath();
      ctx.moveTo(tx, 11.5);
      ctx.lineTo(tx + 2.4, 15.2);
      ctx.lineTo(tx + 4.8, 11.5);
      ctx.fill();
    }

    // 向前伸出的胖胸鳍
    ctx.fillStyle = "#527890";
    ctx.beginPath();
    ctx.moveTo(-6, 11);
    ctx.quadraticCurveTo(12, 34, 18, 32);
    ctx.quadraticCurveTo(14, 16, 4, 10);
    ctx.fill();

    // 棕框亮豆豆眼 + 4 道竖向小鳃纹
    ctx.fillStyle = "#452922";
    ctx.beginPath();
    ctx.arc(-22, 5, 4.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#141215";
    ctx.beginPath();
    ctx.arc(-22, 5, 3.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(-23, 3.8, 1.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#365468";
    ctx.lineWidth = 1.8;
    for (let g = 0; g < 4; g++) {
      const gx = -8 + g * 3.5;
      ctx.beginPath();
      ctx.moveTo(gx, 2);
      ctx.lineTo(gx - 1, 10);
      ctx.stroke();
    }
  } else if (planetId === "zhagana") {
    // zhagana 高山小黑牦牛
    const coat = "#2d272b";
    ctx.fillStyle = coat;
    ctx.beginPath();
    ctx.ellipse(4, 14, 30, 23, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#f2e5c9";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(-10, -26, 15, Math.PI * 0.85, Math.PI * 1.35);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-2, -26, 15, -Math.PI * 0.35, Math.PI * 0.15);
    ctx.stroke();
    ctx.fillStyle = coat;
    ctx.beginPath();
    ctx.arc(-6, -12, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f8f6f0";
    ctx.beginPath();
    ctx.arc(-6, -22, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#d8cfd2";
    ctx.beginPath();
    ctx.ellipse(-6, -3, 14, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1c1917";
    ctx.beginPath();
    ctx.arc(-13, -15, 2.8, 0, Math.PI * 2);
    ctx.arc(1, -15, 2.8, 0, Math.PI * 2);
    ctx.fill();
  } else if (planetId === "kitty-xiaowutai") {
    // 🐱 小五台山野橘白小猫咪
    ctx.strokeStyle = "#f59e42"; ctx.lineWidth = 9; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(22, 24); ctx.quadraticCurveTo(44, 4, 36, -24); ctx.stroke();
    ctx.fillStyle = "#f59e42";
    ctx.beginPath(); ctx.ellipse(0, 18, 25, 20, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fffaf0";
    ctx.beginPath(); ctx.ellipse(0, 20, 15, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#f59e42";
    [-18, 18].forEach((sx) => {
      ctx.beginPath(); ctx.moveTo(sx * 0.4, -22); ctx.lineTo(sx * 1.15, -42); ctx.lineTo(sx * 1.35, -14); ctx.closePath(); ctx.fill();
    });
    ctx.beginPath(); ctx.arc(0, -10, 22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#1c1917";
    ctx.beginPath(); ctx.arc(-8, -12, 3, 0, Math.PI * 2); ctx.arc(8, -12, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#f472b6";
    ctx.beginPath(); ctx.arc(0, -6, 2.8, 0, Math.PI * 2); ctx.fill();
  } else if (planetId === "kitty-changbai") {
    // 🦌 长白山梅花小鹿
    ctx.fillStyle = "#d97736";
    ctx.beginPath(); ctx.ellipse(0, 18, 24, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fffbeb";
    [[-10, 14], [6, 12], [-2, 22], [12, 20]].forEach(([sx, sy]) => {
      ctx.beginPath(); ctx.arc(sx, sy, 3.5, 0, Math.PI * 2); ctx.fill();
    });
    ctx.strokeStyle = "#fde68a"; ctx.lineWidth = 4; ctx.lineCap = "round";
    [-1, 1].forEach((s) => {
      ctx.beginPath(); ctx.moveTo(s * 7, -24); ctx.lineTo(s * 14, -44); ctx.moveTo(s * 11, -35); ctx.lineTo(s * 19, -37); ctx.stroke();
    });
    ctx.fillStyle = "#d97736";
    ctx.beginPath(); ctx.arc(0, -10, 19, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#1c1917";
    ctx.beginPath(); ctx.arc(-7, -12, 2.8, 0, Math.PI * 2); ctx.arc(7, -12, 2.8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#7c2d12";
    ctx.beginPath(); ctx.arc(0, -4, 3.2, 0, Math.PI * 2); ctx.fill();
  } else if (planetId === "kitty-yading") {
    // 🐿️ 抱松果亚丁小松鼠
    ctx.fillStyle = "#9c5125";
    ctx.beginPath(); ctx.ellipse(22, 4, 18, 28, 0.35, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#b46535";
    ctx.beginPath(); ctx.ellipse(-4, 14, 19, 22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#faeed7";
    ctx.beginPath(); ctx.ellipse(-7, 16, 12, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#b46535";
    ctx.beginPath(); ctx.arc(-6, -12, 17, 0, Math.PI * 2); ctx.arc(-16, -27, 6, 0, Math.PI * 2); ctx.arc(4, -27, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#1c1917";
    ctx.beginPath(); ctx.arc(-11, -13, 2.8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#5c3317";
    ctx.beginPath(); ctx.ellipse(-16, 12, 7, 9, -0.2, 0, Math.PI * 2); ctx.fill();
  } else if (planetId === "kitty-sunset") {
    // 🐇 长耳星云兔
    ctx.fillStyle = "#fffaf5";
    ctx.beginPath();
    ctx.ellipse(-9, -34, 6, 18, -0.15, 0, Math.PI * 2);
    ctx.ellipse(9, -34, 6, 18, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 18, 24, 19, 0, 0, Math.PI * 2); ctx.arc(0, -8, 19, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#1c1917";
    ctx.beginPath(); ctx.arc(-7, -9, 2.8, 0, Math.PI * 2); ctx.arc(7, -9, 2.8, 0, Math.PI * 2); ctx.fill();
  } else if (planetId === "kitty-daqing" || planetId === "miemie-guizhou" || planetId === "miemie-tonggudang" || planetId === "luca-tianshan") {
    drawAnimalAtOrigin(ctx, "yili");
  } else if (planetId === "kitty-wusun" || planetId === "miemie-hulunbuir" || planetId === "miemie-longji") {
    // 🐴 天山/呼伦贝尔/塞尔达旷野小马驹（带飘逸金鬃毛、立耳与小马尾）
    const coat = planetId === "miemie-hulunbuir" ? "#b46934" : planetId === "miemie-longji" ? "#8b5a2b" : "#9a5b37";
    const mane = planetId === "miemie-hulunbuir" ? "#fde68a" : "#f5deb3";
    // 飞扬马尾
    ctx.fillStyle = mane;
    ctx.beginPath();
    ctx.ellipse(34, 12, 12, 7, 0.45, 0, Math.PI * 2);
    ctx.fill();
    // 身体与修长小腿
    ctx.fillStyle = coat;
    ctx.beginPath(); ctx.ellipse(6, 15, 27, 17, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(-14, 26, 6, 15);
    ctx.fillRect(18, 26, 6, 15);
    // 金色颈鬃
    ctx.fillStyle = mane;
    ctx.beginPath(); ctx.ellipse(-10, -6, 8, 16, -0.2, 0, Math.PI * 2); ctx.fill();
    // 马颈、立耳与骏马头
    ctx.fillStyle = coat;
    ctx.beginPath(); ctx.roundRect(-24, -18, 14, 30, 6); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-22, -26); ctx.lineTo(-19, -39); ctx.lineTo(-14, -26);
    ctx.moveTo(-16, -25); ctx.lineTo(-11, -37); ctx.lineTo(-8, -24);
    ctx.fill();
    ctx.beginPath(); ctx.ellipse(-24, -20, 16, 10.5, -0.25, 0, Math.PI * 2); ctx.fill();
    // 额头小白星与亮眼睛
    ctx.fillStyle = "#fffbeb";
    ctx.beginPath(); ctx.ellipse(-34, -18, 4.5, 3.2, -0.25, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#1c1917";
    ctx.beginPath(); ctx.arc(-26, -22, 2.8, 0, Math.PI * 2); ctx.fill();
  } else if (planetId === "miemie-shexiang") {
    // 🐇 地心星穹萤光兔
    ctx.fillStyle = "#67e8f9";
    ctx.beginPath();
    ctx.ellipse(-9, -34, 6.5, 18, -0.15, 0, Math.PI * 2);
    ctx.ellipse(9, -34, 6.5, 18, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ecfeff";
    ctx.beginPath(); ctx.ellipse(0, 18, 24, 19, 0, 0, Math.PI * 2); ctx.arc(0, -8, 19, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#083344";
    ctx.beginPath(); ctx.arc(-7, -9, 2.8, 0, Math.PI * 2); ctx.arc(7, -9, 2.8, 0, Math.PI * 2); ctx.fill();
  } else if (planetId === "miemie-buyi") {
    drawAnimalAtOrigin(ctx, "kitty-xiaowutai");
  } else if (planetId === "miemie-yading") {
    drawAnimalAtOrigin(ctx, "zhagana");
  } else if (planetId === "luca-hainan") {
    drawAnimalAtOrigin(ctx, "maclehose");
  }
}

export function renderCreaturePortrait(canvas, planetId, unlocked = true) {
  const S = 180;
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, S, S);

  const [c0, c1] = unlocked ? PORTRAIT_BG[planetId] || ["#172342", "#3b588c"] : ["#0d152b", "#182445"];
  const grad = ctx.createRadialGradient(90, 76, 12, 90, 90, 84);
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c0);

  ctx.save();
  ctx.beginPath();
  ctx.arc(90, 90, 82, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, S, S);

  // 星点装饰
  for (let i = 0; i < 14; i++) {
    const sx = 20 + ((i * 37) % 140);
    const sy = 16 + ((i * 53) % 90);
    ctx.fillStyle = "rgba(255, 245, 214, 0.45)";
    ctx.beginPath();
    ctx.arc(sx, sy, (i % 2) + 1, 0, Math.PI * 2);
    ctx.fill();
  }

  if (unlocked) {
    drawAnimalShape(ctx, planetId);
  } else {
    // 神秘剪影态：离屏绘制动物形状后染成深海星蓝暗影
    const off = document.createElement("canvas");
    off.width = S;
    off.height = S;
    const octx = off.getContext("2d");
    drawAnimalShape(octx, planetId);
    octx.globalCompositeOperation = "source-in";
    octx.fillStyle = "#080e20";
    octx.fillRect(0, 0, S, S);
    ctx.drawImage(off, 0, 0);

    ctx.fillStyle = "rgba(244, 207, 118, 0.85)";
    ctx.font = "700 28px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("?", 90, 105);
  }
  ctx.restore();

  // 金色圆形外环
  ctx.strokeStyle = unlocked ? "rgba(240, 199, 104, 0.78)" : "rgba(240, 199, 104, 0.3)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(90, 90, 82, 0, Math.PI * 2);
  ctx.stroke();
}

export function capturePhotoWallpaper(
  webglCanvas,
  planetName = "行者的星球",
  altitudeText = "",
  travelerName = "",
  hostRole = "mine"
) {
  const isLandscape = webglCanvas.width >= webglCanvas.height * 1.05;
  const W = isLandscape ? 1600 : 1080;
  const H = isLandscape ? 1220 : 1440;
  const out = document.createElement("canvas");
  out.width = W;
  out.height = H;
  const ctx = out.getContext("2d");

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#091024");
  bg.addColorStop(1, "#0d1733");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 拍立得/电影留白画框区（横屏采用宽画幅完整装下整颗微缩星球与星海，竖屏采用手机锁屏比例）
  const fx = 56,
    fy = 104,
    fw = W - 112,
    fh = H - 306;
  ctx.strokeStyle = "rgba(240, 199, 104, 0.45)";
  ctx.lineWidth = 2;
  ctx.strokeRect(fx - 8, fy - 8, fw + 16, fh + 16);

  // 居中裁切绘入实时 WebGL 画面
  const sw0 = webglCanvas.width;
  const sh0 = webglCanvas.height;
  const sr = sw0 / sh0;
  const tr = fw / fh;
  let sx = 0,
    sy = 0,
    sw = sw0,
    sh = sh0;
  if (sr > tr) {
    sw = sh0 * tr;
    sx = (sw0 - sw) * 0.5;
  } else {
    sh = sw0 / tr;
    sy = (sh0 - sh) * 0.5;
  }
  ctx.drawImage(webglCanvas, sx, sy, sw, sh, fx, fy, fw, fh);

  // 顶部与底部烫金铭文落款
  ctx.fillStyle = "#e8c36b";
  ctx.font = "600 22px Georgia, 'ZCOOL XiaoWei', 'LXGW WenKai Screen', 'Songti SC', serif";
  ctx.textAlign = "center";
  ctx.fillText("✦  TRAILS AMONG THE STARS · 山海皆星辰  ✦", W / 2, 68);

  const d = new Date();
  const dateStr = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")}`;

  ctx.fillStyle = "#f9eed2";
  ctx.font = "700 38px 'ZCOOL XiaoWei', 'LXGW WenKai Screen', 'Songti SC', serif";
  ctx.fillText(planetName, W / 2 - 48, fy + fh + 66);

  const cleanTraveler = String(travelerName || "").trim().slice(0, 12);
  ctx.fillStyle = "#cbb382";
  ctx.font = "500 21px 'LXGW WenKai Screen', 'PingFang SC', sans-serif";
  ctx.fillText(`${altitudeText}  ·  ${dateStr}`, W / 2 - 48, fy + fh + 104);

  if (cleanTraveler) {
    drawTravelerNameplate(ctx, W / 2 - 228, fy + fh + 122, 360, cleanTraveler, "dark");
  } else {
    ctx.fillStyle = "rgba(232, 195, 107, 0.72)";
    ctx.font = "500 19px Georgia, serif";
    const dm = resolveQrDomainLabel();
    ctx.fillText(
      hostRole === "kitty"
        ? `🐾 Kitty 的星球 · ${dm}`
        : hostRole === "miemie"
          ? `🐑 咩咩的星球 · ${dm}`
          : hostRole === "luca"
            ? `🚴 Luca 的星球 · ${dm}`
            : `行者的星球 · ${dm}`,
      W / 2 - 48,
      fy + fh + 152
    );
  }

  drawSiteQrStamp(ctx, fx + fw - 116, fy + fh + 36, 112, "dark", hostRole);

  return out.toDataURL("image/png");
}

export function generateGrandPassportDataUrl(planets, saveData = {}, travelerName = "", hostRole = "mine") {
  const firstOwner = planets[0]?.owner;
  const passOwner =
    firstOwner === "kitty"
      ? "kitty"
      : firstOwner === "miemie"
        ? "miemie"
        : firstOwner === "luca"
          ? "luca"
          : firstOwner
            ? "mine"
            : hostRole === "kitty" || hostRole === "miemie" || hostRole === "luca"
              ? hostRole
              : "mine";
  const W = 800;
  const H = 1220;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // 奢华黑金星空底纹
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#080e21");
  bg.addColorStop(0.5, "#111d3c");
  bg.addColorStop(1, "#070c1b");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 90; i++) {
    const sx = ((i * 197) % (W - 40)) + 20;
    const sy = ((i * 311) % (H - 40)) + 20;
    ctx.fillStyle = `rgba(255, 238, 186, ${0.18 + (i % 5) * 0.14})`;
    ctx.beginPath();
    ctx.arc(sx, sy, (i % 3) * 0.7 + 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = "rgba(240, 199, 104, 0.65)";
  ctx.lineWidth = 2.5;
  ctx.strokeRect(36, 36, W - 72, H - 72);
  ctx.strokeStyle = "rgba(240, 199, 104, 0.28)";
  ctx.lineWidth = 1;
  ctx.strokeRect(48, 48, W - 96, H - 96);

  ctx.textAlign = "center";
  ctx.fillStyle = "#f0c768";
  ctx.font = "600 19px Georgia, serif";
  ctx.fillText("✦  GRAND STARFARER PASSPORT · 全星系荣誉护照  ✦", W / 2, 102);

  const starNumMap = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
  const starWord =
    planets.length === 2 ? "双" : starNumMap[planets.length] || String(planets.length);

  ctx.fillStyle = "#fff6de";
  ctx.font = "700 42px 'ZCOOL XiaoWei', 'LXGW WenKai Screen', 'Songti SC', serif";
  ctx.fillText(
    passOwner === "kitty"
      ? `猫耳星云 · ${starWord}星全境行者`
      : passOwner === "miemie"
        ? `绵羊星云 · ${starWord}星全境行者`
        : passOwner === "luca"
          ? `追风车辙 · ${starWord}星破风骑士`
          : `山海皆星辰 · ${starWord}星全境行者`,
    W / 2,
    162
  );

  ctx.fillStyle = "#c9b384";
  ctx.font = "400 20px 'ZCOOL XiaoWei', 'LXGW WenKai Screen', 'Songti SC', serif";
  ctx.fillText(
    passOwner === "kitty"
      ? "致去见那座山、追过日落八分钟与漫天星河的追光人"
      : passOwner === "miemie"
        ? "致潜入地心宇宙、背起大包走向无信号雪山的自由灵魂"
        : passOwner === "luca"
          ? "致迎着九百公里海风与天山雪岭破风前行的单车少年"
          : "致耐心走完每一座垭口、每一片沙海与海岸的同路人",
    W / 2,
    202
  );

  // 自适应 2 星（居中大尺寸）、6 星（3×2）或 7 星（上4+下3居中）水彩勋章阵列
  const pList = planets.slice(0, 8);
  const isPair = pList.length <= 2;
  const topCols = isPair ? 2 : pList.length >= 7 ? 4 : 3;
  const cellW = isPair ? 300 : pList.length >= 7 ? 174 : 216;
  const cellH = 236;
  const startY = isPair ? 335 : 242;
  const iconSz = isPair ? 186 : pList.length >= 7 ? 124 : 144;

  pList.forEach((p, idx) => {
    const row = Math.floor(idx / topCols);
    const col = idx % topCols;
    const rowCount = row === 0 ? Math.min(topCols, pList.length) : pList.length - topCols;
    const rowStartX = (W - rowCount * cellW) / 2;
    const cx = rowStartX + col * cellW + cellW / 2;
    const cy = startY + row * cellH;

    const thumb = document.createElement("canvas");
    thumb.width = 160;
    thumb.height = 160;
    renderPlanetIllustration(thumb, p.id);
    ctx.drawImage(thumb, cx - iconSz / 2, cy, iconSz, iconSz);

    ctx.fillStyle = "#f9ecd0";
    ctx.font = `${pList.length >= 7 ? "600 16.5px" : "600 19px"} 'ZCOOL XiaoWei', 'LXGW WenKai Screen', serif`;
    ctx.fillText(p.name, cx, cy + iconSz + 26);

    ctx.fillStyle = "#f0c768";
    ctx.font = "500 14px 'LXGW WenKai Screen', 'PingFang SC', sans-serif";
    const cnt = (saveData.discovered?.[p.id] || []).length;
    ctx.fillText(`✦ 印记 ${cnt}/${p.waypoints.length}`, cx, cy + iconSz + 50);
  });

  // 汇总数据栏
  const totalWp = planets.reduce((s, p) => s + p.waypoints.length, 0);
  const doneWp = planets.reduce((s, p) => s + (saveData.discovered?.[p.id] || []).length, 0);
  const pIdSet = new Set(planets.map((p) => p.id));
  const donePlanetCnt = planets.filter(
    (p) => (saveData.discovered?.[p.id] || []).length >= p.waypoints.length
  ).length;
  const catalogPlanetSet = new Set(CREATURE_CATALOG.map((c) => c.planetId));
  const nativeCreatureTotal = planets.filter((p) => catalogPlanetSet.has(p.id)).length;
  const creatureCnt = (saveData.creatures || []).filter(
    (cid) => pIdSet.has(cid) && catalogPlanetSet.has(cid)
  ).length;

  const boxY = 732;
  ctx.fillStyle = "rgba(240, 199, 104, 0.08)";
  ctx.strokeStyle = "rgba(240, 199, 104, 0.35)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(74, boxY, W - 148, 226, 14);
  ctx.fill();
  ctx.stroke();

  drawTravelerNameplate(ctx, 102, boxY + 18, W - 204, travelerName, "dark");

  ctx.textAlign = "left";
  ctx.fillStyle = "#f7e7c2";
  ctx.font = "500 19.5px 'LXGW WenKai Screen', 'PingFang SC', sans-serif";
  ctx.fillText(
    `🪐 点亮山海星球：${donePlanetCnt} / ${planets.length}   ·   旅途明信片：${doneWp} / ${totalWp}`,
    108,
    boxY + 104
  );
  ctx.fillText(`🐾 结伴山野小生灵：${creatureCnt} / ${nativeCreatureTotal}`, 108, boxY + 148);
  ctx.fillText(`👣 星际累计漫游步数：${saveData.steps || 0} 步`, 108, boxY + 192);

  // 终章寄语与双环圆形烫金大满贯邮戳
  ctx.textAlign = "left";
  ctx.fillStyle = "#d9c498";
  ctx.font = "italic 18.5px 'ZCOOL XiaoWei', 'LXGW WenKai Screen', 'Songti SC', serif";
  ctx.fillText("“谢谢你来我的宇宙吹风散步。", 78, 1018);
  ctx.fillText("  愿我们在下一座没有天花板的山海重逢。”", 78, 1052);

  ctx.fillStyle = "rgba(240, 199, 104, 0.72)";
  ctx.font = "500 16.5px Georgia, serif";
  const dm = resolveQrDomainLabel();
  ctx.fillText(
    passOwner === "kitty"
      ? `🐾 Kitty 的星球 · ${dm}`
      : passOwner === "miemie"
        ? `🐑 咩咩的星球 · ${dm}`
        : passOwner === "luca"
          ? `🚴 Luca 的星球 · ${dm}`
          : `行者的星球 · ${dm}`,
    78,
    1126
  );

  drawPostmarkSeal(ctx, W - 278, 1068, {
    radius: 56,
    bannerText: passOwner === "mine" ? "全境穿越" : `${starWord}星满贯`,
    subText: "山海皆星辰",
    color: "#f2c864",
    paperBg: "#0a1126",
    wavyTail: false,
    angle: -0.16,
  });

  drawSiteQrStamp(ctx, W - 166, 1008, 94, "dark", passOwner);

  return canvas.toDataURL("image/png");
}

function loadBookmarkImg(url) {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function drawCoverBox(ctx, img, x, y, w, h, photoUrl = "") {
  const ir = img.width / img.height;
  const br = w / h;
  const saved = getSavedPhotoPan(photoUrl);
  const crop = computeSmartPhotoCrop(photoUrl, img.width, img.height, br);
  const pctX = saved ? saved[0] : crop.pctX;
  const pctY = saved ? saved[1] : crop.pctY;
  let sx = 0,
    sy = 0,
    sw = img.width,
    sh = img.height;
  if (ir > br) {
    sw = img.height * br;
    sx = (img.width - sw) * (pctX / 100);
  } else {
    sh = img.width / br;
    sy = (img.height - sh) * (pctY / 100);
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function wrapParagraph(ctx, text, maxWidth) {
  const chars = Array.from(String(text || ""));
  const lines = [];
  let line = "";
  for (const ch of chars) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = ch;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function generatePostcardBookmarkDataUrl(planet, wp, travelerName = "", hostRole = "mine") {
  const pOwner = planet?.owner;
  const bmOwner =
    pOwner === "kitty" || pOwner === "miemie" || pOwner === "luca"
      ? pOwner
      : pOwner
        ? "mine"
        : hostRole === "kitty" || hostRole === "miemie" || hostRole === "luca"
          ? hostRole
          : "mine";
  const W = 740;
  const H = 1280;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0a1228");
  bg.addColorStop(1, "#0d1734");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const bx = 44,
    by = 46,
    bw = W - 88,
    bh = H - 92;
  const paper = ctx.createLinearGradient(bx, by, bx, by + bh);
  paper.addColorStop(0, "#f8efe0");
  paper.addColorStop(1, "#ead8b6");
  ctx.fillStyle = paper;
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 20);
  ctx.fill();

  ctx.strokeStyle = "rgba(162, 118, 52, 0.45)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(bx + 16, by + 16, bw - 32, bh - 32);

  // 书签顶部金环穿孔装饰
  ctx.fillStyle = "#0b142c";
  ctx.beginPath();
  ctx.arc(W / 2, by + 34, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#c8963e";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#8a6228";
  ctx.font = "600 16px Georgia, 'ZCOOL XiaoWei', 'LXGW WenKai Screen', 'Songti SC', serif";
  ctx.fillText(`✦  ${planet.name} · 双面故事明信片书签  ✦`, W / 2, by + 76);

  ctx.fillStyle = "#2b1d10";
  ctx.font = "700 30px 'ZCOOL XiaoWei', 'LXGW WenKai Screen', 'Songti SC', serif";
  ctx.fillText(wp.name, W / 2, by + 118);

  ctx.fillStyle = "#755835";
  ctx.font = "500 16.5px 'LXGW WenKai Screen', 'PingFang SC', sans-serif";
  ctx.fillText(wp.elevation || "", W / 2, by + 148);

  // 正反双图拍立得并列框（第1页大景 + 第2页人物/故事照）
  const [img1, img2] = await Promise.all([
    loadBookmarkImg(wp.photo),
    loadBookmarkImg(wp.photo2 || wp.photo),
  ]);

  const padX = bx + 38;
  const gap = 18;
  const pW = (bw - 76 - gap) / 2;
  const pH = 228;
  const pY = by + 174;

  [img1, img2].forEach((im, i) => {
    const px = padX + i * (pW + gap);
    ctx.fillStyle = "#fffdf9";
    ctx.shadowColor = "rgba(40, 26, 10, 0.16)";
    ctx.shadowBlur = 12;
    ctx.fillRect(px, pY, pW, pH + 34);
    ctx.shadowBlur = 0;
    const urlForIdx = i === 0 ? wp.photo : wp.photo2 || wp.photo;
    if (im) drawCoverBox(ctx, im, px + 8, pY + 8, pW - 16, pH - 8, urlForIdx);
    ctx.fillStyle = "#6e5332";
    ctx.font = "500 12.5px 'LXGW WenKai Screen', 'PingFang SC', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(i === 0 ? "✦ 壹 · 山海帧" : "✎ 贰 · 故事帧", px + pW / 2, pY + pH + 22);
  });

  // 第 1 页：绘本诗笺
  let curY = pY + pH + 74;
  ctx.textAlign = "left";
  ctx.fillStyle = "#8a6124";
  ctx.font = "600 16px 'LXGW WenKai Screen', 'PingFang SC', sans-serif";
  ctx.fillText("✦ 绘本诗笺", padX, curY);
  curY += 30;

  ctx.fillStyle = "#2f2214";
  ctx.font = "500 18px 'ZCOOL XiaoWei', 'LXGW WenKai Screen', 'Songti SC', serif";
  const poemLines = wrapParagraph(ctx, wp.poem, bw - 76);
  poemLines.slice(0, 5).forEach((ln) => {
    ctx.fillText(ln, padX, curY);
    curY += 30;
  });

  // 分隔细线
  curY += 12;
  ctx.strokeStyle = "rgba(156, 115, 52, 0.32)";
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(padX, curY);
  ctx.lineTo(bx + bw - 38, curY);
  ctx.stroke();
  ctx.setLineDash([]);
  curY += 34;

  // 第 2 页：背后的真实旅途故事
  ctx.fillStyle = "#8a6124";
  ctx.font = "600 16px 'LXGW WenKai Screen', 'PingFang SC', sans-serif";
  ctx.fillText("✎ 旅途故事", padX, curY);
  curY += 30;

  ctx.fillStyle = "#3a2b1b";
  ctx.font = "400 17px 'LXGW WenKai Screen', 'PingFang SC', sans-serif";
  const memLines = wrapParagraph(ctx, wp.memory || wp.poem, bw - 76);
  memLines.slice(0, 8).forEach((ln) => {
    ctx.fillText(ln, padX, curY);
    curY += 28;
  });

  // 底部醒目持签旅人铭牌 + 圆形雪山邮戳 + 扫码徽章
  const d = new Date();
  const dateStr = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")}`;

  drawTravelerNameplate(ctx, padX, by + bh - 122, 344, travelerName, "parchment");

  ctx.textAlign = "left";
  ctx.fillStyle = "#7a5b34";
  ctx.font = "500 14.5px 'LXGW WenKai Screen', 'PingFang SC', sans-serif";
  ctx.fillText(
    `珍藏日期：${dateStr}  ·  ${
      bmOwner === "kitty"
        ? "Kitty 的星球"
        : bmOwner === "miemie"
          ? "咩咩的星球"
          : bmOwner === "luca"
            ? "Luca 的星球"
            : resolveQrDomainLabel()
    }`,
    padX,
    by + bh - 42
  );

  drawPostmarkSeal(ctx, bx + bw - 208, by + bh - 82, {
    radius: 46,
    bannerText: "山海典藏",
    subText: planet.name.slice(0, 5),
    color: "rgba(182, 36, 28, 0.88)",
    paperBg: "#ebd9b7",
    wavyTail: false,
    angle: -0.18,
  });

  drawSiteQrStamp(ctx, bx + bw - 124, by + bh - 126, 86, "parchment", bmOwner);

  return canvas.toDataURL("image/png");
}
