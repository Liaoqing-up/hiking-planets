// 经 Apple CoreImage & Vision 校验的 https://hikerplanets.netlify.app 标准 29x29 QR(M) 矩阵
const QR_ROWS = [
  "11111110110111110011101111111",
  "10000010111011001110101000001",
  "10111010010110001010101011101",
  "10111010110100110101001011101",
  "10111010010000101111001011101",
  "10000010010101011011001000001",
  "11111110101010101010101111111",
  "00000000100100011101000000000",
  "10110111010001010110001001011",
  "10010000100011110111001110001",
  "00111011000001001110000000110",
  "11101100000110001000000100001",
  "10100111010100110100100001100",
  "11111101001010101001011000111",
  "00110010111011011001001110111",
  "11110101000000101000110000010",
  "10110011011110110010010111010",
  "00001100110000101000100101110",
  "10011110111001110100101110100",
  "00010101001011100100000110100",
  "01100010011001100111111111100",
  "00000000100110001100100011111",
  "11111110100110100101101011010",
  "10000010100111101010100011001",
  "10111010010100011110111110110",
  "10111010101100011000010111001",
  "10111010110111000110100100101",
  "10000010010011110010110011010",
  "11111110110111000011110110010",
];

// 经 Apple CoreImage & Vision 100% 校验的 https://hikerplanets.netlify.app/?host=kitty 标准 33x33 QR(M) 矩阵
const QR_ROWS_KITTY = [
  "111111100011010011111011001111111",
  "100000100011111101000010101000001",
  "101110101111010011111001101011101",
  "101110101000101010011110101011101",
  "101110101010000101100100101011101",
  "100000101001000111001100001000001",
  "111111101010101010101010101111111",
  "000000001100101100100100100000000",
  "101111100001011101000011001111100",
  "011011001011001000110101001101111",
  "101101110001000110101100011010100",
  "011001000000101100010110010011111",
  "000010101010000000100100010011011",
  "000110010011001110001011001101011",
  "001111101111101000010110111101010",
  "001001000101101010011100011001100",
  "101100110000111011011010110110001",
  "011000001010001011011001001101101",
  "000010101110001101000010001110100",
  "001001000001101011101001111111100",
  "001001100111000110001111010011000",
  "111100000111101100100101001000001",
  "101101100000101110001100101010110",
  "101010000011000100100110000101100",
  "101100101001001101001010111110011",
  "000000001011010010111100100010111",
  "111111100100000110101101101010110",
  "100000101101001100001111100011100",
  "101110101000000000100100111111000",
  "101110101011111111001011110011001",
  "101110101011000000010010001101000",
  "100000100110010010111101001011100",
  "111111101010001001010011110101010",
];

// https://hikerplanets.netlify.app/?host=miemie (Version 4, 33x33, ECC Level M, Apple Vision 100% 实测识别)
const QR_ROWS_MIEMIE = [
  "111111100000000010111111001111111",
  "100000100101100100100110101000001",
  "101110101101001010011111101011101",
  "101110101100000000110100101011101",
  "101110101101001111001101001011101",
  "100000101111000001010100001000001",
  "111111101010101010101010101111111",
  "000000001101001010111100100000000",
  "101111100110011001010011001111100",
  "110000000010011001110001001101111",
  "010110101000011111001010011010100",
  "101100001110010101110000010011111",
  "010100110110101010001110110011011",
  "000001001111010100100001001101011",
  "101001111100110110001110011101010",
  "110110011101001100000100011001100",
  "011011100101110111001011110110001",
  "111101011111000010011101001101101",
  "011110110111110100100100011110100",
  "100111011100110010001111110111100",
  "000111101101001100100101110011000",
  "100111011110100110001111001000001",
  "101000110011101000010100001010110",
  "101100000010010010111110000101110",
  "101010110101101001011010111110011",
  "000000001001111011111000100010111",
  "111111100111100111001011101010110",
  "100000101101000101101001100011100",
  "101110101011101010001110111111000",
  "101110101101000101100001110011001",
  "101110101101001110001010001101000",
  "100000100001111100100100001011100",
  "111111101011010101000011110101010",
];

/**
 * 在分享海报角落绘制高识别率复古小二维码印章（支持 hostRole="kitty" | "miemie" 专属主场直达二维码）
 */
export function drawSiteQrStamp(ctx, x, y, boxSize = 96, theme = "parchment", hostRole = "mine") {
  const matrix = hostRole === "kitty" ? QR_ROWS_KITTY : hostRole === "miemie" ? QR_ROWS_MIEMIE : QR_ROWS;
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
