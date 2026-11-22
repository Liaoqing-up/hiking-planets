import { renderPlanetIllustration } from "./planetArt2D.js?v=5.2.8-prologue-cosmos";
import { drawSiteQrStamp, drawPostmarkSeal, drawTravelerNameplate, resolveQrDomainLabel } from "./qrStamp.js?v=5.2.8-prologue-cosmos";

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

export const PLANET_SEAL_TITLE = {
  tengger: "穿沙成功",
  yading: "转山圆满",
  zhagana: "穿越成功",
  siguniang: "登顶穿越",
  maclehose: "逐浪山海",
  yili: "旷野寻遍",
  "kitty-xiaowutai": "五台连穿",
  "kitty-changbai": "天池揽胜",
  "kitty-sunset": "追光揽星",
  "kitty-zhagana": "甘南同频",
  "kitty-daqing": "云端扎营",
  "kitty-wusun": "天山穿越",
  "kitty-yading": "亚丁奇遇",
  "miemie-guizhou": "地心魔界",
  "miemie-volcano": "红崖星火",
  "miemie-hulunbuir": "北疆牧歌",
  "miemie-tonggudang": "地心探奇",
  "miemie-longji": "龙脊凌云",
  "miemie-shexiang": "星穹寻幽",
  "miemie-buyi": "古寨拾光",
  "miemie-yading": "重装无畏",
  "luca-hainan": "破风环岛",
  "luca-tianshan": "车辙天山",
};

export async function generateSummitTicketDataUrl(
  planet,
  discoveredSet = new Set(),
  totalSteps = 0,
  travelerName = "",
  options = {}
) {
  const pOwner = planet?.owner;
  const effectiveHost =
    pOwner === "kitty" || pOwner === "miemie" || pOwner === "luca"
      ? pOwner
      : pOwner
        ? "mine"
        : options.hostRole === "kitty" || options.hostRole === "miemie" || options.hostRole === "luca"
          ? options.hostRole
          : "mine";
  const companionName = options.companionName || "";
  const W = 760;
  const H = 1280;
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
  ctx.font = "600 17px Georgia, 'ZCOOL XiaoWei', 'LXGW WenKai Screen', 'Songti SC', serif";
  ctx.textAlign = "center";
  ctx.fillText(`✦  TRAILS AMONG THE STARS · PASS NO.${ticketNo}  ✦`, W / 2, ty + 52);

  ctx.fillStyle = "#2b1e12";
  ctx.font = "700 38px 'ZCOOL XiaoWei', 'LXGW WenKai Screen', 'Songti SC', 'STSong', serif";
  ctx.fillText(planet.name, W / 2, ty + 104);

  ctx.fillStyle = "#6d5233";
  ctx.font = "500 18px 'LXGW WenKai Screen', 'PingFang SC', sans-serif";
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
      ctx.font = "600 12.5px 'LXGW WenKai Screen', 'PingFang SC', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("✦ 已点亮", cx + 57, cy + 34);

      // 拍立得底栏标题与海拔
      ctx.fillStyle = "#2f2113";
      ctx.font = "600 16px 'ZCOOL XiaoWei', 'LXGW WenKai Screen', 'Songti SC', 'LXGW WenKai Screen', 'PingFang SC', serif";
      ctx.fillText(label, cx + cardW / 2, cy + mediaH + 31);
      ctx.fillStyle = "#7d6240";
      ctx.font = "500 12.5px 'LXGW WenKai Screen', 'PingFang SC', sans-serif";
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

      // 手绘鎏金星轨罗盘徽章（取代生硬的系统挂锁图标）
      const mx = cx + cardW / 2;
      const my = cy + 66;
      ctx.save();
      ctx.strokeStyle = "rgba(240, 199, 104, 0.72)";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(mx, my, 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(mx, my, 16.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(240, 199, 104, 0.22)";
      ctx.beginPath();
      ctx.moveTo(mx - 12, my + 8);
      ctx.lineTo(mx - 3, my - 5);
      ctx.lineTo(mx + 2, my + 2);
      ctx.lineTo(mx + 6, my - 3);
      ctx.lineTo(mx + 13, my + 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#f5d98e";
      ctx.font = "600 13px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("✦", mx, my - 7);
      ctx.restore();
      ctx.textAlign = "center";

      ctx.fillStyle = "#f3d792";
      ctx.font = "600 16px 'LXGW WenKai Screen', 'PingFang SC', sans-serif";
      ctx.fillText("待探访解锁", cx + cardW / 2, cy + 116);

      ctx.fillStyle = "rgba(232, 218, 186, 0.65)";
      ctx.font = "400 12.5px 'LXGW WenKai Screen', 'PingFang SC', sans-serif";
      ctx.fillText("漫步至发光路标点亮", cx + cardW / 2, cy + 142);

      // 底栏线索地名
      ctx.fillStyle = "#d9c6a0";
      ctx.font = "500 15px 'ZCOOL XiaoWei', 'LXGW WenKai Screen', 'Songti SC', 'LXGW WenKai Screen', 'PingFang SC', serif";
      ctx.fillText(`◇ ${label}`, cx + cardW / 2, cy + mediaH + 34);
      ctx.fillStyle = "rgba(217, 198, 160, 0.65)";
      ctx.font = "400 12px 'LXGW WenKai Screen', 'PingFang SC', sans-serif";
      ctx.fillText("尚未抵达此处", cx + cardW / 2, cy + mediaH + 52);
    }
  });

  // 5. 星球语录
  ctx.textAlign = "center";
  ctx.fillStyle = "#46331f";
  ctx.font = "italic 18.5px 'ZCOOL XiaoWei', 'LXGW WenKai Screen', 'Songti SC', Georgia, serif";
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

  // 6a. 醒目鎏金「持票旅人」专属铭牌（置于副券顶部第一视觉中心）
  drawTravelerNameplate(ctx, tx + 42, notchY + 26, tw - 84, travelerName, "parchment");

  // 6b. 左侧收集进度与路线详情
  ctx.textAlign = "left";
  ctx.fillStyle = "#5c4326";
  ctx.font = "600 17.5px 'LXGW WenKai Screen', 'PingFang SC', sans-serif";
  ctx.fillText(
    allCleared
      ? `明信片图鉴：已全部集齐 (${doneCount}/${totalCount})`
      : `明信片图鉴：已点亮 ${doneCount}/${totalCount}（待解锁 ${totalCount - doneCount}）`,
    tx + 44,
    notchY + 106
  );

  ctx.fillStyle = "#6e5332";
  ctx.font = "500 16px 'LXGW WenKai Screen', 'PingFang SC', sans-serif";
  ctx.fillText(`最高海拔：${planet.stats.altitude} · ${planet.stats.days}`, tx + 44, notchY + 138);
  ctx.fillText(`徒步路线：${planet.stats.distance}`, tx + 44, notchY + 168);
  ctx.fillText(`漫游：${totalSteps} 步  |  签发：${dateStr}`, tx + 44, notchY + 198);

  ctx.fillStyle = "#8a6229";
  ctx.font = "600 15.5px Georgia, 'LXGW WenKai Screen', 'PingFang SC', serif";
  const hostSiteTitle =
    effectiveHost === "kitty"
      ? "Kitty 的星球"
      : effectiveHost === "miemie"
        ? "咩咩的星球"
        : effectiveHost === "luca"
          ? "Luca 的星球"
          : "行者的星球";
  const dm = resolveQrDomainLabel();
  const brandLine = companionName
    ? `✦ 并肩同行：与 ${companionName} 共攀  ·  ${hostSiteTitle}`
    : effectiveHost === "kitty"
      ? `🐾 Kitty 的星球 · 猫耳星云  |  ${dm}`
      : effectiveHost === "miemie"
        ? `🐑 咩咩的星球 · 绵羊星云  |  ${dm}`
        : effectiveHost === "luca"
          ? `🚴 Luca 的星球 · 追风车辙星云  |  ${dm}`
          : `行者的星球 · ${dm}`;
  ctx.fillText(brandLine, tx + 44, notchY + 234);

  // 6c. 右侧博物馆级双环雪山星轨圆形邮戳（一星一专属四字印文）+ 正立高反差扫码二维码
  const clearedSealWord = PLANET_SEAL_TITLE[planet.id] || "穿越成功";
  drawPostmarkSeal(ctx, tx + tw - 208, notchY + 168, {
    radius: 54,
    bannerText: allCleared ? clearedSealWord : `已点亮 ${doneCount}/${totalCount}`,
    subText: companionName ? `与${companionName}同行` : allCleared ? "山海皆星辰" : "星途漫步中",
    color: allCleared ? "rgba(182, 36, 28, 0.9)" : "rgba(148, 96, 32, 0.86)",
    paperBg: "#ecdcb9",
    wavyTail: false,
    angle: -0.2,
  });

  drawSiteQrStamp(ctx, tx + tw - 122, notchY + 114, 86, "parchment", effectiveHost);

  return canvas.toDataURL("image/png");
}
