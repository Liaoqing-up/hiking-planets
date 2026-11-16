import { renderPlanetIllustration } from "./planetArt2D.js";
import { drawSiteQrStamp } from "./qrStamp.js";

function loadImg(url) {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function drawCoverImage(ctx, img, x, y, w, h) {
  const ir = img.width / img.height;
  const br = w / h;
  let sx = 0,
    sy = 0,
    sw = img.width,
    sh = img.height;
  if (ir > br) {
    sw = img.height * br;
    sx = (img.width - sw) * 0.5;
  } else {
    sh = img.width / br;
    sy = (img.height - sh) * 0.5;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

if (typeof CanvasRenderingContext2D !== "undefined" && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h) {
    this.rect(x, y, w, h);
    return this;
  };
}

export async function generateSummitTicketDataUrl(
  planet,
  discoveredSet = new Set(),
  totalSteps = 0,
  travelerName = ""
) {
  const W = 760;
  const H = 1250;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // 1. 夜空深蓝丝绒底纹 + 繁星点缀
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0b132b");
  bg.addColorStop(0.5, "#111d3d");
  bg.addColorStop(1, "#090f22");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 70; i++) {
    const sx = ((i * 179) % (W - 40)) + 20;
    const sy = ((i * 293) % (H - 40)) + 20;
    ctx.fillStyle = `rgba(255, 244, 214, ${0.2 + (i % 5) * 0.14})`;
    ctx.beginPath();
    ctx.arc(sx, sy, (i % 3) * 0.7 + 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. 复古羊皮纸纪念票根主体 + 骑缝齿孔
  const tx = 50,
    ty = 56,
    tw = W - 100,
    th = H - 112;
  const paper = ctx.createLinearGradient(tx, ty, tx, ty + th);
  paper.addColorStop(0, "#f7eed7");
  paper.addColorStop(1, "#eadab8");
  ctx.fillStyle = paper;
  ctx.beginPath();
  ctx.roundRect(tx, ty, tw, th, 22);
  ctx.fill();

  const notchY = 858;
  ctx.fillStyle = "#0e1834";
  ctx.beginPath();
  ctx.arc(tx, notchY, 18, 0, Math.PI * 2);
  ctx.arc(tx + tw, notchY, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(122, 92, 48, 0.36)";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(tx + 28, notchY);
  ctx.lineTo(tx + tw - 28, notchY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = "rgba(156, 115, 52, 0.45)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(tx + 18, ty + 18, tw - 36, th - 36);

  // 3. 顶部标题与水彩微缩星球勋章
  const ticketNo = String(100 + (Math.floor(Date.now() / 1000) % 899)).padStart(3, "0");
  ctx.fillStyle = "#8a6229";
  ctx.font = "600 17px Georgia, 'Songti SC', serif";
  ctx.textAlign = "center";
  ctx.fillText(`✦  TRAILS AMONG THE STARS · PASS NO.${ticketNo}  ✦`, W / 2, ty + 52);

  ctx.fillStyle = "#2b1e12";
  ctx.font = "700 38px 'Songti SC', 'STSong', serif";
  ctx.fillText(planet.name, W / 2, ty + 104);

  ctx.fillStyle = "#6d5233";
  ctx.font = "500 18px 'PingFang SC', sans-serif";
  ctx.fillText(planet.subtitle, W / 2, ty + 138);

  const planetThumb = document.createElement("canvas");
  planetThumb.width = 140;
  planetThumb.height = 140;
  renderPlanetIllustration(planetThumb, planet.id);
  ctx.drawImage(planetThumb, tx + tw - 134, ty + 26, 102, 102);

  // 4. 2×2 四宫格明信片集章册（已收集显示实拍照片 · 未收集显示待解锁线索槽）
  const waypoints = planet.waypoints.slice(0, 4);
  const loadedPhotos = await Promise.all(
    waypoints.map((wp) => (discoveredSet.has(wp.id) ? loadImg(wp.photo) : Promise.resolve(null)))
  );

  const gridLeft = tx + 42;
  const gridTop = ty + 168;
  const gapX = 22;
  const gapY = 22;
  const cardW = (tw - 84 - gapX) / 2;
  const cardH = 244;
  const mediaH = 178;

  waypoints.forEach((wp, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const cx = gridLeft + col * (cardW + gapX);
    const cy = gridTop + row * (cardH + gapY);
    const unlocked = discoveredSet.has(wp.id);
    const label = wp.shortName || wp.name;

    if (unlocked) {
      // 已收集：拍立得暖白相框 + 实拍图 + 金星角标
      ctx.fillStyle = "#fffdf8";
      ctx.shadowColor = "rgba(45, 30, 12, 0.16)";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.roundRect(cx, cy, cardW, cardH, 8);
      ctx.fill();
      ctx.shadowBlur = 0;

      const img = loadedPhotos[idx];
      if (img) {
        drawCoverImage(ctx, img, cx + 10, cy + 10, cardW - 20, mediaH);
      } else {
        ctx.fillStyle = "#223254";
        ctx.fillRect(cx + 10, cy + 10, cardW - 20, mediaH);
      }

      // 左上角「✦ 已收集」金章小标签
      ctx.fillStyle = "rgba(12, 20, 42, 0.74)";
      ctx.beginPath();
      ctx.roundRect(cx + 18, cy + 18, 78, 24, 12);
      ctx.fill();
      ctx.fillStyle = "#f7d479";
      ctx.font = "600 12.5px 'PingFang SC', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("✦ 已点亮", cx + 57, cy + 34);

      // 拍立得底栏标题与海拔
      ctx.fillStyle = "#2f2113";
      ctx.font = "600 16px 'Songti SC', 'PingFang SC', serif";
      ctx.fillText(label, cx + cardW / 2, cy + mediaH + 31);
      ctx.fillStyle = "#7d6240";
      ctx.font = "500 12.5px 'PingFang SC', sans-serif";
      const shortElev = String(wp.elevation || "").split("·")[0].trim();
      ctx.fillText(shortElev, cx + cardW / 2, cy + mediaH + 50);
    } else {
      // 未收集：磨砂星空暗槽 + 虚线金框 + 待解锁线索
      ctx.fillStyle = "rgba(24, 34, 62, 0.88)";
      ctx.beginPath();
      ctx.roundRect(cx, cy, cardW, cardH, 8);
      ctx.fill();

      ctx.strokeStyle = "rgba(240, 199, 104, 0.48)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.roundRect(cx + 10, cy + 10, cardW - 20, mediaH, 5);
      ctx.stroke();
      ctx.setLineDash([]);

      // 锁印星芒与待解锁文案
      ctx.fillStyle = "rgba(240, 199, 104, 0.88)";
      ctx.font = "600 28px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("🔒", cx + cardW / 2, cy + 78);

      ctx.fillStyle = "#f3d792";
      ctx.font = "600 16px 'PingFang SC', sans-serif";
      ctx.fillText("待探访解锁", cx + cardW / 2, cy + 116);

      ctx.fillStyle = "rgba(232, 218, 186, 0.65)";
      ctx.font = "400 12.5px 'PingFang SC', sans-serif";
      ctx.fillText("漫步至发光路标点亮", cx + cardW / 2, cy + 142);

      // 底栏线索地名
      ctx.fillStyle = "#d9c6a0";
      ctx.font = "500 15px 'Songti SC', 'PingFang SC', serif";
      ctx.fillText(`◇ ${label}`, cx + cardW / 2, cy + mediaH + 34);
      ctx.fillStyle = "rgba(217, 198, 160, 0.65)";
      ctx.font = "400 12px 'PingFang SC', sans-serif";
      ctx.fillText("尚未抵达此处", cx + cardW / 2, cy + mediaH + 52);
    }
  });

  // 5. 星球语录
  ctx.textAlign = "center";
  ctx.fillStyle = "#46331f";
  ctx.font = "italic 18.5px 'Songti SC', Georgia, serif";
  const quote = `“${planet.quote}”`;
  const maxLine = 25;
  const lines = [];
  for (let i = 0; i < quote.length; i += maxLine) {
    lines.push(quote.slice(i, i + maxLine));
  }
  lines.slice(0, 2).forEach((ln, idx) => {
    ctx.fillText(ln, W / 2, ty + 716 + idx * 28);
  });

  // 6. 下半联副券：收集进度 + 路线参数 + 动态印章
  const doneCount = waypoints.filter((w) => discoveredSet.has(w.id)).length;
  const totalCount = waypoints.length;
  const allCleared = doneCount >= totalCount;

  const d = new Date();
  const dateStr = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")}`;

  ctx.textAlign = "left";
  ctx.fillStyle = "#5c4326";
  ctx.font = "600 18.5px 'PingFang SC', sans-serif";
  ctx.fillText(
    allCleared
      ? `明信片图鉴：已全部集齐 (${doneCount} / ${totalCount})`
      : `明信片图鉴：已点亮 ${doneCount} / ${totalCount}（尚有 ${totalCount - doneCount} 处待解锁）`,
    tx + 44,
    notchY + 56
  );

  ctx.fillStyle = "#6e5332";
  ctx.font = "500 17px 'PingFang SC', sans-serif";
  const cleanTraveler = String(travelerName || "").trim().slice(0, 12);
  const travelerPart = cleanTraveler ? `持票旅人：${cleanTraveler}  |  ` : "";
  ctx.fillText(`最高海拔：${planet.stats.altitude}  ·  ${planet.stats.days}`, tx + 44, notchY + 92);
  ctx.fillText(`徒步路线：${planet.stats.distance}`, tx + 44, notchY + 124);
  ctx.fillText(`${travelerPart}漫游：${totalSteps} 步  |  ${dateStr}`, tx + 44, notchY + 156);

  ctx.fillStyle = "#8a6229";
  ctx.font = "600 16.5px Georgia, 'PingFang SC', serif";
  ctx.fillText("行者的星球 · hikerplanets.netlify.app", tx + 44, notchY + 206);

  // 印章与可扫码登球二维码并列排布（二维码保持正立高反差，微信长按秒识别）
  drawSiteQrStamp(ctx, tx + tw - 124, notchY + 96, 86, "parchment");

  ctx.save();
  ctx.translate(tx + tw - 224, notchY + 142);
  ctx.rotate(-0.18);
  if (allCleared) {
    ctx.strokeStyle = "rgba(188, 42, 34, 0.88)";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.roundRect(-72, -44, 144, 88, 10);
    ctx.stroke();
    ctx.fillStyle = "rgba(188, 42, 34, 0.9)";
    ctx.textAlign = "center";
    ctx.font = "700 21px 'Songti SC', serif";
    ctx.fillText("✦ 山海皆星辰", 0, -6);
    ctx.font = "700 23px 'Songti SC', serif";
    ctx.fillText("全印记走完", 0, 26);
  } else {
    ctx.strokeStyle = "rgba(146, 102, 42, 0.78)";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.roundRect(-72, -44, 144, 88, 10);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(136, 92, 34, 0.88)";
    ctx.textAlign = "center";
    ctx.font = "700 20px 'Songti SC', serif";
    ctx.fillText("✦ 星途漫步中", 0, -6);
    ctx.font = "700 21px 'PingFang SC', sans-serif";
    ctx.fillText(`已解锁 ${doneCount}/${totalCount}`, 0, 24);
  }
  ctx.restore();

  return canvas.toDataURL("image/png");
}
