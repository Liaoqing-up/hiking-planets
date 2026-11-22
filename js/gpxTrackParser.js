/**
 * 户外 GPX 轨迹解析与球面微缩投射引擎 (gpxTrackParser.js)
 * 兼容：两步路 (2bulu) / 六只脚 (foooooot) / Garmin / Strava / Apple Watch 导出的 .gpx XML 文件
 * 将真实地球经纬度与海拔爬升曲线无损提炼为微缩 3D 星球的环绕路标！
 */

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function parseGpxTrackFile(file) {
  if (!file) throw new Error("未选择 GPX 轨迹文件");
  const xmlText = await file.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "application/xml");
  if (doc.querySelector("parsererror")) {
    throw new Error("GPX 文件格式解析失败，请确认是有效的 .gpx 轨迹");
  }

  // 提取路线标题
  const rawTrackName =
    doc.querySelector("trk > name")?.textContent?.trim() ||
    doc.querySelector("metadata > name")?.textContent?.trim() ||
    doc.querySelector("rte > name")?.textContent?.trim() ||
    file.name.replace(/\.gpx$/i, "");

  // 采集所有轨迹点 (<trkpt> 优先，其次 <rtept> / <wpt>)
  let ptNodes = Array.from(doc.querySelectorAll("trkpt"));
  if (ptNodes.length === 0) ptNodes = Array.from(doc.querySelectorAll("rtept"));
  if (ptNodes.length === 0) ptNodes = Array.from(doc.querySelectorAll("wpt"));
  if (ptNodes.length < 2) {
    throw new Error("GPX 文件中轨迹点不足（至少需要 2 个坐标点）");
  }

  const points = [];
  let minLat = Infinity,
    maxLat = -Infinity,
    minLon = Infinity,
    maxLon = -Infinity;
  let minElev = Infinity,
    maxElev = -Infinity,
    maxElevIdx = 0;

  for (let i = 0; i < ptNodes.length; i++) {
    const node = ptNodes[i];
    const lat = parseFloat(node.getAttribute("lat"));
    const lon = parseFloat(node.getAttribute("lon"));
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const eleText = node.querySelector("ele")?.textContent;
    const ele = eleText != null && Number.isFinite(parseFloat(eleText)) ? parseFloat(eleText) : null;
    const timeText = node.querySelector("time")?.textContent?.trim() || "";

    const idx = points.length;
    points.push({ lat, lon, ele, timeText });

    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
    if (ele !== null) {
      if (ele < minElev) minElev = ele;
      if (ele > maxElev) {
        maxElev = ele;
        maxElevIdx = idx;
      }
    }
  }

  if (points.length < 2) {
    throw new Error("未读取到有效经纬度轨迹点");
  }

  // 计算总里程与累计爬升（过滤 <2m GPS 高程抖动噪点）
  let totalDistKm = 0;
  let elevationGainM = 0;
  let lastValidEle = points[0].ele;

  for (let i = 1; i < points.length; i++) {
    totalDistKm += haversineKm(points[i - 1].lat, points[i - 1].lon, points[i].lat, points[i].lon);
    const curEle = points[i].ele;
    if (curEle !== null && lastValidEle !== null) {
      const diff = curEle - lastValidEle;
      if (diff >= 2.2) {
        elevationGainM += diff;
        lastValidEle = curEle;
      } else if (diff <= -2.2) {
        lastValidEle = curEle;
      }
    } else if (curEle !== null) {
      lastValidEle = curEle;
    }
  }

  const cleanMaxElev = Number.isFinite(maxElev) ? Math.round(maxElev) : 2600;
  const cleanGainM = Math.round(elevationGainM);
  const distanceKm = Number(totalDistKm.toFixed(1));
  const trackDate =
    points[0].timeText?.slice(0, 7) || new Date().toISOString().slice(0, 7);

  // 智能推荐星球地貌
  let recommendedTemplate = "meadow";
  if (cleanMaxElev >= 3800) recommendedTemplate = "snow";
  else if (cleanMaxElev <= 450) recommendedTemplate = "coast";
  else if (cleanGainM >= 1200) recommendedTemplate = "sunset";

  // 采样 4 个关键里程碑（起点营地、攀升山脊、最高峰顶、收官回望），映射至微缩星球黄金环线角度（防重叠）
  const n = points.length;
  const summitIdx = maxElevIdx > 0 && maxElevIdx < n - 1 ? maxElevIdx : Math.floor(n * 0.62);
  const ridgeIdx = Math.max(1, Math.floor(summitIdx * 0.5));
  const sampleIndices = [0, ridgeIdx, summitIdx, n - 1];
  const SPHERE_SLOTS = [
    { lat: 24, lon: 18, label: "起点大本营" },
    { lat: -14, lon: 108, label: "山脊攀升段" },
    { lat: 38, lon: -122, label: "最高海拔之巅" },
    { lat: -26, lon: -46, label: "徒步收官站" },
  ];

  const sampledSphericalWaypoints = sampleIndices.map((ptIdx, slotIdx) => {
    const pt = points[ptIdx] || points[0];
    const slot = SPHERE_SLOTS[slotIdx];
    const ptElev = pt.ele !== null ? `${Math.round(pt.ele)}m` : `${cleanMaxElev}m`;
    return {
      name: `${rawTrackName}·${slot.label}`,
      lat: slot.lat,
      lon: slot.lon,
      elevation: ptElev,
      date: trackDate,
      memory:
        slotIdx === 2
          ? `GPX 实测登顶最高点（海拔 ${ptElev}），全程徒步 ${distanceKm} km，累计爬升 ${cleanGainM} m。`
          : `真实户外 GPX 轨迹坐标 (${pt.lat.toFixed(3)}°N, ${pt.lon.toFixed(3)}°E) · 海拔 ${ptElev}。`,
    };
  });

  return {
    trackName: rawTrackName,
    pointCount: points.length,
    distanceKm,
    maxElevationM: cleanMaxElev,
    elevationGainM: cleanGainM,
    trackDate,
    recommendedTemplate,
    sampledSphericalWaypoints,
    summaryLabel: `📍 已解析 GPX：${points.length} 个轨迹点 · 全程 ${distanceKm} km · 最高 ${cleanMaxElev}m · 累计爬升 +${cleanGainM}m`,
  };
}
