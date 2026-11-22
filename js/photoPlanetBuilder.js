/**
 * 旅途照片客户端压缩（WebP/JPEG ~250KB）+ AI 灵感诗句/色板预埋契约
 * 无需外部依赖，纯 Canvas + DataView 实现
 */
import { getAccessToken, uploadPlanetMediaFile } from "./cloudClient.js?v=5.3.1-uncharted-galaxies";
import { resolveCloudApiBase } from "./cloudConfig.js?v=5.3.1-uncharted-galaxies";

/**
 * 将用户选中的单张手机原图无损视角缩放至 maxSide 像素以内，输出高清轻量 WebP（不支持时回退 JPEG）
 */
export async function compressTravelPhoto(file, { maxSide = 1440, quality = 0.82 } = {}) {
  const bitmap = await loadImageSource(file);
  const srcW = bitmap.width || bitmap.naturalWidth || 1200;
  const srcH = bitmap.height || bitmap.naturalHeight || 900;
  const scale = Math.min(1, maxSide / Math.max(srcW, srcH));
  const dstW = Math.max(64, Math.round(srcW * scale));
  const dstH = Math.max(64, Math.round(srcH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = dstW;
  canvas.height = dstH;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, dstW, dstH);

  // 采样画面主色调，用于无 AI 时也能智能推荐星球地貌模板
  const dominant = sampleCanvasMood(ctx, dstW, dstH);

  const blob = await new Promise((resolve) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else canvas.toBlob((jb) => resolve(jb), "image/jpeg", quality);
      },
      "image/webp",
      quality
    );
  });

  const ext = blob?.type === "image/webp" ? "webp" : "jpg";
  const baseName = (file.name || "photo").replace(/\.[^.]+$/, "").slice(0, 24) || "trail";
  const outFile = new File([blob], `${baseName}.${ext}`, { type: blob?.type || "image/jpeg" });
  const previewUrl = URL.createObjectURL(outFile);

  if (typeof bitmap.close === "function") bitmap.close();
  return { file: outFile, previewUrl, width: dstW, height: dstH, dominant };
}

/**
 * 生成 30KB 级超轻缩略帧 Base64，预埋给后续 Cloudflare Workers AI / 百炼多模态网关识图写诗
 */
export async function buildTinyAiPreviewDataUrl(file) {
  const bitmap = await loadImageSource(file);
  const srcW = bitmap.width || bitmap.naturalWidth || 640;
  const srcH = bitmap.height || bitmap.naturalHeight || 480;
  const scale = Math.min(1, 512 / Math.max(srcW, srcH));
  const w = Math.max(48, Math.round(srcW * scale));
  const h = Math.max(48, Math.round(srcH * scale));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  c.getContext("2d").drawImage(bitmap, 0, 0, w, h);
  if (typeof bitmap.close === "function") bitmap.close();
  return c.toDataURL("image/jpeg", 0.68);
}

/**
 * 请求边缘 AI 灵感工坊（若边缘 `/api/ai-inspire` 尚未开启，则零延迟使用本地色彩诗意引擎兜底，绝不报错阻塞造星）
 */
export async function requestPlanetAiInspiration({ planetName, elevation, photoFiles = [] }) {
  let mood = { template: "snow", quote: "", memory: "" };
  let previewDataUrl = null;
  if (photoFiles[0]) {
    try {
      const comp = await compressTravelPhoto(photoFiles[0], { maxSide: 512, quality: 0.7 });
      URL.revokeObjectURL(comp.previewUrl);
      mood = inferLocalPoeticPreset(comp.dominant, planetName, elevation);
      previewDataUrl = await buildTinyAiPreviewDataUrl(photoFiles[0]);
    } catch (_) {
      mood = inferLocalPoeticPreset(null, planetName, elevation);
    }
  } else {
    mood = inferLocalPoeticPreset(null, planetName, elevation);
  }

  // 预埋同域 Edge AI 网关调用契约（后续开通 Workers AI 或百炼后自动生效）
  try {
    const token = getAccessToken();
    const res = await fetch("/api/ai-inspire", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        planetName,
        elevation,
        imageDataUrl: previewDataUrl,
        apiBaseHint: resolveCloudApiBase(),
      }),
    });
    if (res.ok) {
      const aiData = await res.json();
      if (aiData && (aiData.quote || aiData.template)) {
        return {
          template: aiData.template || mood.template,
          creature: aiData.creature || mood.creature,
          quote: aiData.quote || mood.quote,
          memory: aiData.memory || mood.memory,
          fromEdgeAi: true,
        };
      }
    }
  } catch (_) {}

  return { ...mood, fromEdgeAi: false };
}

/**
 * 批量压缩并上传 1~4 张旅途照片至 `planet-media` 云存储桶
 */
export async function compressAndUploadPhotos(files, onProgress) {
  const list = Array.from(files || []).slice(0, 4);
  const uploadedUrls = [];
  for (let i = 0; i < list.length; i++) {
    onProgress?.(`正在压缩并点亮第 ${i + 1}/${list.length} 张山海影像…`);
    const { file: webpFile, previewUrl } = await compressTravelPhoto(list[i]);
    URL.revokeObjectURL(previewUrl);
    const { publicUrl } = await uploadPlanetMediaFile(webpFile, "photos");
    uploadedUrls.push(publicUrl);
  }
  return uploadedUrls;
}

function loadImageSource(file) {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file);
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

function sampleCanvasMood(ctx, w, h) {
  try {
    const data = ctx.getImageData(0, 0, w, h).data;
    let r = 0, g = 0, b = 0, count = 0;
    const step = Math.max(4, Math.floor((w * h) / 600)) * 4;
    for (let i = 0; i < data.length; i += step) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      count++;
    }
    if (!count) return { r: 120, g: 145, b: 175 };
    return { r: r / count, g: g / count, b: b / count };
  } catch (_) {
    return { r: 120, g: 145, b: 175 };
  }
}

function inferLocalPoeticPreset(rgb, planetName = "秘境星", elevation = "3000m") {
  const cleanName = planetName.trim() || "远方秘境";
  if (!rgb) {
    return {
      template: "snow",
      creature: "siguniang",
      quote: `风吹过${cleanName}的山脊，把每一步脚印都酿成了星光。`,
      memory: `在海拔 ${elevation || "云端"} 的山风里深呼吸，把这段滚烫的旅途封存在属于我的小星球上。`,
    };
  }
  const { r, g, b } = rgb;
  if (r > 155 && r > b * 1.28) {
    return {
      template: r - g > 32 ? "volcano" : "dune",
      creature: r - g > 32 ? "miemie-volcano" : "tengger",
      quote: `赤红大地与落日长风，在${cleanName}写下滚烫的荒野诗行。`,
      memory: `脚下是旷野的砂砾与余温，抬头便是毫无遮挡的整条银河。`,
    };
  }
  if (g > r * 1.06 && g > b * 0.96) {
    return {
      template: "meadow",
      creature: "kitty-xiaowutai",
      quote: `云朵低垂在${cleanName}的草甸尽头，连山风都是青草与自由的味道。`,
      memory: `顺着蜿蜒的绿浪爬上山脊，每一朵野花都在替我记住这天的晴空。`,
    };
  }
  if (b > r * 1.15 && g > r * 1.05 && (r + g + b) / 3 < 155) {
    return {
      template: "coast",
      creature: "maclehose",
      quote: `山海相逢在${cleanName}的崖岸，海浪把远方的信笺拍进星夜。`,
      memory: `一边是起伏的山脊，一边是无垠的蔚蓝，走过的每一步都算数。`,
    };
  }
  return {
    template: "snow",
    creature: "kitty-changbai",
    quote: `雪线之上的清冽星光，替我守望着${cleanName}不化的浪漫。`,
    memory: `站在 ${elevation || "高处"} 的风口回望来路，所有的疲惫都在看见雪峰的一刻烟消云散。`,
  };
}
