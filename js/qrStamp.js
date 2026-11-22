import {
  QR_ROWS_HIKERSTARS,
  QR_ROWS_HIKERSTARS_KITTY,
  QR_ROWS_HIKERSTARS_MIEMIE,
  QR_ROWS_HIKERSTARS_LUCA,
} from "./hikerstarsQrMatrices.js?v=5.2.5-wormhole-dedup";

// 经 Apple CoreImage & Vision 100% 校验的 https://hikerplanets.pages.dev 标准 29x29 QR(M) 矩阵（兼容备份）
const QR_ROWS = [
  "11111110010001110011101111111",
  "10000010011111111010001000001",
  "10111010111111010000001011101",
  "10111010110110110100101011101",
  "10111010110100011011101011101",
  "10000010111010000100001000001",
  "11111110101010101010101111111",
  "00000000101010101001100000000",
  "10111110011110001101001111100",
  "01101001100101110011001110001",
  "01110011001101111000110110000",
  "01000000100111010001011111010",
  "01011011110100110100100001100",
  "00011001001010011001101110001",
  "01111110000100000110010101100",
  "01001101001000101000110000010",
  "11111011010100001110100001100",
  "10010000001011110111111110101",
  "10100011100001111100101110100",
  "10001001010001010010110000010",
  "10011010010000110100111110111",
  "00000000110010011010100011111",
  "11111110011110000001101011100",
  "10000010110000101011100010011",
  "10111010101100000100111110101",
  "10111010100011110010100001100",
  "10111010100101110001111111110",
  "10000010010001001000110011010",
  "11111110100101011101000000100",
];

// 经 Apple CoreImage & Vision 100% 校验的 https://hikerplanets.pages.dev/?host=kitty 标准 29x29 QR(M) 矩阵
const QR_ROWS_KITTY = [
  "11111110010101011011001111111",
  "10000010100101110101001000001",
  "10111010001110000000101011101",
  "10111010001110111011101011101",
  "10111010110001110011001011101",
  "10000010001100011011001000001",
  "11111110101010101010101111111",
  "00000000000101100110100000000",
  "10101010001011000101100010010",
  "11000100000000001100001001001",
  "01011011110000100000001110111",
  "11000001000101101110011000010",
  "11010011110111011100011001011",
  "10110101011101101110101001001",
  "00010110101100001110101101011",
  "10000101101111010111110111010",
  "11111111001101011110011001011",
  "00111100000001101000111001101",
  "10000110011000000100010110011",
  "01110001101111001101110111010",
  "10110011101001010100111110000",
  "00000000110010100101100010111",
  "11111110010000100001101011011",
  "10000010011101101100100011011",
  "10111010110010111100111110000",
  "10111010011110000101100110111",
  "10111010110011001001000111001",
  "10000010010100101111110100010",
  "11111110110011100101111000011",
];

// 经 Apple CoreImage & Vision 100% 校验的 https://hikerplanets.pages.dev/?host=miemie 标准 33x33 QR(M) 矩阵
const QR_ROWS_MIEMIE = [
  "111111100110101010011111001111111",
  "100000100111000110100100101000001",
  "101110101011101110011111101011101",
  "101110101100000100110100101011101",
  "101110101101101110001110001011101",
  "100000101101011000110101101000001",
  "111111101010101010101010101111111",
  "000000001101000010111101000000000",
  "101111100101010001010011001111100",
  "000101010110010011110001001101101",
  "000001110001011101001010001010110",
  "111000011110010111110000010011100",
  "000100110110101110001110110111001",
  "110100010100000100100000101001011",
  "011111101100101110101110011001010",
  "000000001000011100000100011011100",
  "100000101111011101001010110111001",
  "010100001101001010111101001101101",
  "001110101001110100100100010110110",
  "000010011011011010001111110111111",
  "001111111100101000100101110111011",
  "110011001011100110001111001000101",
  "100111111011101001010100001001010",
  "101101010001011010011110100011111",
  "100110100000101001011011111111001",
  "000000001010110001111000100010111",
  "111111100011011111001011101010100",
  "100000101111111001101001100011111",
  "101110101011101110001110111111011",
  "101110101011110100100001110011101",
  "101110101000111110001010001100100",
  "100000100010100100000100011010100",
  "111111101101111111000011110101010",
];

// 经 Apple CoreImage & Vision 100% 校验的 https://hikerplanets.pages.dev/?host=luca 标准 29x29 QR(M) 矩阵
const QR_ROWS_LUCA = [
  "11111110000011100011101111111",
  "10000010010010110010001000001",
  "10111010110110111000001011101",
  "10111010110001111100101011101",
  "10111010110011001011101011101",
  "10000010101110111100001000001",
  "11111110101010101010101111111",
  "00000000111010000001100000000",
  "10111110001011111101001111100",
  "11100101100010101011001110001",
  "00100011010110111000110110000",
  "11111100010110101001011111010",
  "01111011111111100100100001100",
  "10111100011000001001101110001",
  "11011111001111010110010101100",
  "00011001000000110000110000010",
  "11010111011001100110100001100",
  "10100000111110001111111110101",
  "10100010111000011100101110100",
  "10010000111010101010110000010",
  "10111010011010001100111110111",
  "00000000110001000010100011111",
  "11111110000111111001101011100",
  "10000010111001001011100010000",
  "10111010111000100100111110111",
  "10111010111101000010100001111",
  "10111010101011010001111111110",
  "10000010010011001000110011010",
  "11111110110000111101000000100",
];

/**
 * 在分享海报角落绘制高识别率复古小二维码印章（支持 hostRole="kitty" | "miemie" | "luca" 专属主场直达二维码）
 */
export function resolveQrDomainLabel() {
  if (typeof window !== "undefined" && /(^|\.)hikerstars\.com$/i.test(window.location.hostname || "")) {
    return "hikerstars.com";
  }
  return "hikerplanets.pages.dev";
}

export function drawSiteQrStamp(ctx, x, y, boxSize = 96, theme = "parchment", hostRole = "mine") {
  const useHikerstars = typeof window !== "undefined" && /(^|\.)hikerstars\.com$/i.test(window.location.hostname || "");
  const matrix = useHikerstars
    ? hostRole === "kitty"
      ? QR_ROWS_HIKERSTARS_KITTY
      : hostRole === "miemie"
        ? QR_ROWS_HIKERSTARS_MIEMIE
        : hostRole === "luca"
          ? QR_ROWS_HIKERSTARS_LUCA
          : QR_ROWS_HIKERSTARS
    : hostRole === "kitty"
      ? QR_ROWS_KITTY
      : hostRole === "miemie"
        ? QR_ROWS_MIEMIE
        : hostRole === "luca"
          ? QR_ROWS_LUCA
          : QR_ROWS;
  const N = matrix.length;
  const quiet = 3;
  const cell = boxSize / (N + quiet * 2);

  ctx.save();
  // 保持浅暖底高反差静区，确保微信长按 100% 秒识别
  ctx.fillStyle = theme === "dark" ? "#f9f1dc" : "#fffdf7";
  ctx.strokeStyle = theme === "dark" ? "rgba(240, 199, 104, 0.72)" : "rgba(156, 115, 52, 0.45)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y, boxSize, boxSize, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#171f36";
  const startX = x + quiet * cell;
  const startY = y + quiet * cell;
  for (let r = 0; r < N; r++) {
    const row = matrix[r];
    for (let c = 0; c < N; c++) {
      if (row[c] === "1") {
        ctx.fillRect(
          startX + c * cell - 0.15,
          startY + r * cell - 0.15,
          cell + 0.3,
          cell + 0.3
        );
      }
    }
  }

  ctx.textAlign = "center";
  ctx.fillStyle = theme === "dark" ? "#d9c28e" : "#7c5c32";
  ctx.font = "500 11.5px 'LXGW WenKai Screen', 'PingFang SC', sans-serif";
  ctx.fillText("长按扫码登球", x + boxSize / 2, y + boxSize + 15);
  ctx.restore();
}

function drawArcChars(ctx, str, radius, startAngle, endAngle, flipBottom = false) {
  const chars = Array.from(str);
  if (!chars.length) return;
  const step = chars.length > 1 ? (endAngle - startAngle) / (chars.length - 1) : 0;
  chars.forEach((ch, idx) => {
    const ang = startAngle + step * idx;
    ctx.save();
    ctx.rotate(ang);
    if (flipBottom) {
      ctx.translate(0, radius);
    } else {
      ctx.translate(0, -radius);
    }
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  });
}

/**
 * 绘制博物馆级双环雪山星轨圆形纪念邮戳（含圆弧环绕铭文、罗盘刻度、雪峰星芒、横贯绶带与邮戳波浪纹）
 */
export function drawPostmarkSeal(
  ctx,
  cx,
  cy,
  {
    radius = 56,
    bannerText = "全印记走完",
    subText = "山海皆星辰",
    color = "rgba(184, 38, 30, 0.9)",
    paperBg = "#eedec0",
    wavyTail = true,
    angle = -0.2,
  } = {}
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  // 左侧复古邮局波浪销票纹
  if (wavyTail) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    ctx.globalAlpha = 0.55;
    for (let row = -1; row <= 1; row++) {
      const wy = row * 11;
      ctx.beginPath();
      for (let t = 0; t <= 28; t++) {
        const wx = -radius - 8 - t * 2.1;
        const offY = wy + Math.sin(t * 0.65) * 3.0;
        if (t === 0) ctx.moveTo(wx, offY);
        else ctx.lineTo(wx, offY);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // 外粗环 + 内细双环
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.arc(0, 0, radius - 5.5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, radius - 18, 0, Math.PI * 2);
  ctx.stroke();

  // 罗盘星历细刻度线
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    ctx.save();
    ctx.rotate(a);
    ctx.lineWidth = i % 6 === 0 ? 1.8 : 0.9;
    ctx.beginPath();
    ctx.moveTo(0, -(radius - 5.5));
    ctx.lineTo(0, -(radius - (i % 6 === 0 ? 10 : 8.2)));
    ctx.stroke();
    ctx.restore();
  }

  // 上圆弧环绕英文铭文
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${Math.round(radius * 0.145)}px Georgia, serif`;
  drawArcChars(ctx, "✦ STARLIGHT TRAIL ✦", radius - 11.8, -Math.PI * 0.68, Math.PI * 0.68, false);

  // 下圆弧副铭文
  ctx.font = `600 ${Math.round(radius * 0.155)}px 'ZCOOL XiaoWei', 'LXGW WenKai Screen', 'Songti SC', serif`;
  drawArcChars(ctx, subText, radius - 11.8, Math.PI * 0.34, -Math.PI * 0.34, true);

  // 内圈上半部：双雪峰剪影 + 峰顶北极星
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-20, -6);
  ctx.lineTo(-7, -25);
  ctx.lineTo(3, -12);
  ctx.lineTo(11, -21);
  ctx.lineTo(22, -6);
  ctx.closePath();
  ctx.fill();

  // 峰顶留白雪线与星芒
  ctx.strokeStyle = paperBg;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-11, -18);
  ctx.lineTo(-7, -15);
  ctx.lineTo(-3, -18);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.font = `700 ${Math.round(radius * 0.19)}px Georgia, serif`;
  ctx.fillText("✦", 1, -29);

  // 横贯中央的复古双线印章横幅（切开圆环，极具精品邮戳立体层次）
  const bw = radius * 2.16;
  const bh = radius * 0.44;
  ctx.fillStyle = paperBg;
  ctx.fillRect(-bw / 2, -bh / 2 + 4, bw, bh);

  ctx.strokeStyle = color;
  ctx.lineWidth = 2.0;
  ctx.strokeRect(-bw / 2, -bh / 2 + 4, bw, bh);
  ctx.lineWidth = 0.9;
  ctx.strokeRect(-bw / 2 + 3, -bh / 2 + 7, bw - 6, bh - 6);

  // 横幅主章大字
  ctx.fillStyle = color;
  ctx.font = `700 ${Math.round(radius * 0.31)}px 'ZCOOL XiaoWei', 'LXGW WenKai Screen', 'Songti SC', 'LXGW WenKai Screen', 'PingFang SC', serif`;
  ctx.fillText(bannerText, 0, 5);

  ctx.restore();
}

/**
 * 绘制醒目高辨识度的「持票旅人专属烫金铭牌」
 */
export function drawTravelerNameplate(
  ctx,
  x,
  y,
  width,
  travelerName = "",
  theme = "parchment"
) {
  const clean = String(travelerName || "").trim().slice(0, 12);
  const h = 48;
  ctx.save();

  if (clean) {
    // 醒目深海鎏金反差铭牌框：一眼成为票面个人专属视觉中心
    const grad = ctx.createLinearGradient(x, y, x + width, y + h);
    if (theme === "dark") {
      grad.addColorStop(0, "rgba(244, 204, 110, 0.22)");
      grad.addColorStop(1, "rgba(196, 142, 48, 0.14)");
    } else {
      grad.addColorStop(0, "#14203f");
      grad.addColorStop(1, "#1f305c");
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, width, h, 10);
    ctx.fill();

    ctx.strokeStyle = theme === "dark" ? "#f5cf72" : "#e3b454";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(x, y, width, h, 10);
    ctx.stroke();

    ctx.strokeStyle = "rgba(245, 207, 114, 0.35)";
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.roundRect(x + 3.5, y + 3.5, width - 7, h - 7, 7);
    ctx.stroke();

    // 左侧烫金头衔小标
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ebd094";
    ctx.font = "600 13.5px 'LXGW WenKai Screen', 'PingFang SC', sans-serif";
    ctx.fillText("✦ 持票旅人", x + 16, y + h / 2 + 1);

    // 分隔金竖线
    ctx.strokeStyle = "rgba(245, 207, 114, 0.42)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x + 102, y + 11);
    ctx.lineTo(x + 102, y + h - 11);
    ctx.stroke();

    // 右侧大号醒目鎏金姓名（2~3字中文自动舒展字距，仪式感拉满）
    const spacedName =
      clean.length >= 2 && clean.length <= 3 && /^[\u4e00-\u9fa5]+$/.test(clean)
        ? clean.split("").join(" ")
        : clean;
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffe28a";
    ctx.shadowColor = "rgba(255, 204, 84, 0.38)";
    ctx.shadowBlur = 8;
    ctx.font = "700 24px 'ZCOOL XiaoWei', 'LXGW WenKai Screen', 'Songti SC', 'STSong', Georgia, serif";
    ctx.fillText(spacedName, x + 102 + (width - 114) / 2, y + h / 2 + 1);
    ctx.shadowBlur = 0;
  } else {
    // 未署名时的浅雅虚线引导栏
    ctx.strokeStyle =
      theme === "dark" ? "rgba(240, 199, 104, 0.36)" : "rgba(150, 108, 46, 0.42)";
    ctx.lineWidth = 1.3;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.roundRect(x, y, width, h - 6, 9);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = theme === "dark" ? "rgba(240, 214, 156, 0.72)" : "#7d5e34";
    ctx.font = "500 14px 'LXGW WenKai Screen', 'PingFang SC', sans-serif";
    ctx.fillText("✦ 持票旅人：可在下方输入名字烫金印签", x + 14, y + (h - 6) / 2 + 1);
  }

  ctx.restore();
}
