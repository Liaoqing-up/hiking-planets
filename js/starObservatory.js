/**
 * V5.1 《星海观星台 · 万星名录》 (Star Observatory & Galaxy Directory)
 * 承接百人/万人规模行者社交串门：
 * 1. 👑 创世领航四星系（清哥 / Kitty / 咩咩 / Luca 殿堂置顶）
 * 2. 🌌 银河社区行者广场（实时聚合 Supabase profiles + user_planets + planet_roses）
 * 3. 🔍 搜人 / 搜山峰（「以山会友」检索） + 4 档筛选（全部 / 已点亮 / 人气 / 串门足迹）
 * 4. 🌠 虫洞随机跃迁（一键随机降落远方行者星球）
 */

const VISITED_STORAGE_KEY = "hp_visited_galaxies_v1";

const FOUNDER_META = [
  { role: "mine", accent: "#f59e0b", tag: "苍山星河", galaxyName: "清哥的苍山星河" },
  { role: "kitty", accent: "#f472b6", tag: "猫耳星云", galaxyName: "Kitty 的猫耳星云" },
  { role: "miemie", accent: "#34d399", tag: "绵羊星云", galaxyName: "咩咩的绵羊星云" },
  { role: "luca", accent: "#38bdf8", tag: "追风星云", galaxyName: "Luca 的追风星云" },
];

const OUTFIT_RING_COLORS = {
  gold: "#f59e0b",
  pink: "#f472b6",
  mint: "#34d399",
  cyan: "#38bdf8",
};

function loadVisitedSet() {
  try {
    const raw = JSON.parse(localStorage.getItem(VISITED_STORAGE_KEY) || "[]");
    return new Set(Array.isArray(raw) ? raw : []);
  } catch {
    return new Set();
  }
}

export function recordVisitedGalaxy(key) {
  if (!key) return;
  const set = loadVisitedSet();
  set.delete(key);
  const next = [key, ...set].slice(0, 60);
  try {
    localStorage.setItem(VISITED_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function esc(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function createObservatoryController({
  hostRegistry,
  queryCorePlanets,
  fetchDirectory,
  getCurrentUniverseState,
  onVisitFounder,
  onVisitUserHandle,
  onOpenCreator,
  onToast,
  playHover,
  playSelect,
}) {
  let cache = { profiles: [], planets: [], roses: [], loadedAt: 0 };
  let activeFilter = "all";
  let searchQuery = "";

  const modalEl = document.getElementById("modal-observatory");
  const foundersSection = document.getElementById("obs-founders-section");
  const foundersGrid = document.getElementById("obs-founders-grid");
  const communityTitle = document.getElementById("obs-community-title");
  const communityGrid = document.getElementById("obs-community-grid");
  const searchInput = document.getElementById("obs-search-input");
  const clearSearchBtn = document.getElementById("btn-obs-clear-search");

  function buildRoseMap() {
    const map = new Map();
    for (const r of cache.roses) {
      if (r?.bucket_key) map.set(r.bucket_key, Number(r.rose_count) || 0);
    }
    return map;
  }

  function buildCommunityEntries() {
    const roseMap = buildRoseMap();
    const byHandle = new Map();

    for (const p of cache.profiles) {
      if (!p?.handle) continue;
      // 绑定了四大创始星主的账号已合并展示在上方「创世领航四星系」殿堂区，避免重复刷屏
      if (p.legacy_role && hostRegistry[p.legacy_role]) continue;
      byHandle.set(p.handle, {
        handle: p.handle,
        displayName: p.display_name || p.handle,
        avatarIcon: p.avatar_icon || "🏔️",
        outfit: p.outfit || "gold",
        bioPoem: p.bio_poem || "",
        createdAt: p.created_at || "",
        planets: [],
        roses: roseMap.get(`u:${p.handle}`) || 0,
      });
    }

    for (const pl of cache.planets) {
      const h = pl?.owner_handle;
      if (!h) continue;
      const ownerProf = cache.profiles.find((x) => x.handle === h);
      if (ownerProf?.legacy_role && hostRegistry[ownerProf.legacy_role]) continue;
      if (!byHandle.has(h)) {
        byHandle.set(h, {
          handle: h,
          displayName: pl.owner_name || h,
          avatarIcon: "🪐",
          outfit: "gold",
          bioPoem: pl.quote || "",
          createdAt: pl.created_at || "",
          planets: [],
          roses: roseMap.get(`u:${h}`) || 0,
        });
      }
      const entry = byHandle.get(h);
      entry.planets.push(pl);
      entry.roses += Math.max(roseMap.get(`p:${pl.slug}`) || 0, roseMap.get(pl.slug) || 0);
    }

    return Array.from(byHandle.values());
  }

  async function refreshData(force = false) {
    renderAll();
    if (!force && Date.now() - cache.loadedAt < 25000 && (cache.profiles.length || cache.planets.length)) {
      return;
    }
    if (communityGrid && !cache.loadedAt) {
      communityGrid.innerHTML = `<div class="obs-empty-hint">🔭 正在调准深空望远镜，接收银河系最新信标…</div>`;
    }
    const data = await fetchDirectory();
    cache = { ...data, loadedAt: Date.now() };
    renderAll();
  }

  function renderFounders(visitedSet, q) {
    if (!foundersGrid) return;
    const state = getCurrentUniverseState();
    const roseMap = buildRoseMap();
    const cardsHtml = [];

    for (const f of FOUNDER_META) {
      const cfg = hostRegistry[f.role];
      if (!cfg) continue;
      const corePlanets = queryCorePlanets(f.role) || [];
      const boundProf = cache.profiles.find((x) => x.legacy_role === f.role);
      const extraPlanets = boundProf
        ? cache.planets.filter((pl) => pl.owner_handle === boundProf.handle)
        : [];
      const allNames = [
        ...corePlanets.map((p) => p.name),
        ...extraPlanets.map((p) => p.planet_name),
      ];

      if (q) {
        const hay = `${cfg.name} ${f.role} ${boundProf?.handle || ""} ${allNames.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }
      if (activeFilter === "visited" && !visitedSet.has(`role:${f.role}`)) continue;

      const isCurrent = state.currentUniverse === f.role;
      const roses = (roseMap.get(f.role) || 12) + (boundProf ? roseMap.get(`u:${boundProf.handle}`) || 0 : 0);
      const peakPreview = allNames.slice(0, 4).join(" · ");

      cardsHtml.push(`
        <div class="obs-founder-card ${isCurrent ? "is-current" : ""}" data-founder-role="${f.role}" style="--founder-accent:${f.accent}">
          <div class="obs-founder-top">
            <div class="obs-founder-avatar">${cfg.badgeIcon || cfg.icon}</div>
            <div>
              <div class="obs-founder-name">${esc(f.galaxyName || `${cfg.name}的星系`)}</div>
              <div class="obs-founder-sub">${f.tag} · ${allNames.length} 颗星</div>
            </div>
          </div>
          <div class="obs-founder-peaks">${esc(peakPreview)}</div>
          <div class="obs-founder-foot">
            <span>🌹 ${roses}</span>
            <span>${isCurrent ? "✦ 当前所在" : "串门跃迁 →"}</span>
          </div>
        </div>
      `);
    }

    if (foundersSection) {
      foundersSection.classList.toggle("hidden", cardsHtml.length === 0);
    }
    foundersGrid.innerHTML = cardsHtml.join("");
    foundersGrid.querySelectorAll("[data-founder-role]").forEach((el) => {
      el.addEventListener("click", () => {
        const role = el.getAttribute("data-founder-role");
        recordVisitedGalaxy(`role:${role}`);
        playSelect?.();
        onVisitFounder(role);
      });
    });
  }

  function renderCommunity(visitedSet, q) {
    if (!communityGrid) return;
    let list = buildCommunityEntries();

    if (q) {
      list = list.filter((item) => {
        const pNames = item.planets.map((p) => `${p.planet_name} ${p.quote || ""}`).join(" ");
        const hay = `${item.displayName} @${item.handle} ${item.bioPoem} ${pNames}`.toLowerCase();
        return hay.includes(q);
      });
    }

    if (activeFilter === "lit") {
      list = list.filter((x) => x.planets.length > 0);
    } else if (activeFilter === "visited") {
      list = list.filter((x) => visitedSet.has(`u:${x.handle}`));
    }

    if (activeFilter === "popular") {
      list.sort((a, b) => b.roses - a.roses || b.planets.length - a.planets.length);
    } else {
      // 默认把已点亮星球的行者排前面，再按最新时间排
      list.sort((a, b) => {
        const aHas = a.planets.length > 0 ? 1 : 0;
        const bHas = b.planets.length > 0 ? 1 : 0;
        if (bHas !== aHas) return bHas - aHas;
        return String(b.createdAt).localeCompare(String(a.createdAt));
      });
    }

    if (communityTitle) {
      communityTitle.textContent = `🌌 银河行者名录 · 共发现 ${list.length} 位独立星友`;
    }

    if (list.length === 0) {
      communityGrid.innerHTML = `
        <div class="obs-empty-hint">
          ${
            q
              ? `🔭 未找到包含「${esc(q)}」的行者或山峰星球，换个山名试试？`
              : activeFilter === "visited"
                ? "👣 你还没有串门记录，快点上方或随机跃迁去拜访第一位星友吧！"
                : "🌱 银河广场虚位以待！注册护照并点亮第 1 颗星，你的名片就会登上这里～"
          }
        </div>
      `;
      return;
    }

    const state = getCurrentUniverseState();
    communityGrid.innerHTML = list
      .map((item) => {
        const ring = OUTFIT_RING_COLORS[item.outfit] || "#f59e0b";
        const isCurrent =
          state.currentUniverse === "custom" && state.activeCustomHandle === item.handle;
        const chipsHtml =
          item.planets.length > 0
            ? item.planets
                .slice(0, 3)
                .map((pl) => {
                  const hit = q && String(pl.planet_name || "").toLowerCase().includes(q);
                  const rawEl = String(pl.elevation || "").trim();
                  const elevTxt = rawEl ? (/^\d+$/.test(rawEl) ? `${rawEl}m` : rawEl).slice(0, 10) : "";
                  return `<span class="obs-planet-chip ${hit ? "match-hit" : ""}" data-slug="${esc(pl.slug)}">🪐 ${esc(pl.planet_name)}${elevTxt ? ` · ${esc(elevTxt)}` : ""}</span>`;
                })
                .join("")
            : `<span class="obs-planet-chip" style="opacity:0.65">✦ 初生星云 · 待点亮首颗星</span>`;

        return `
          <div class="obs-hiker-card ${isCurrent ? "is-current" : ""}" data-user-handle="${esc(item.handle)}">
            <div class="obs-hiker-head">
              <div class="obs-hiker-id">
                <div class="obs-hiker-avatar" style="--hiker-ring:${ring}">${esc(item.avatarIcon)}</div>
                <div style="min-width:0">
                  <div class="obs-hiker-title">${esc(item.displayName)}</div>
                  <div class="obs-hiker-handle">@${esc(item.handle)}</div>
                </div>
              </div>
              <div class="obs-hiker-badges">
                <span class="obs-pill">🪐 ${item.planets.length}</span>
                ${item.roses > 0 ? `<span class="obs-pill rose">🌹 ${item.roses}</span>` : ""}
              </div>
            </div>
            <div class="obs-hiker-planets">${chipsHtml}</div>
            <div class="obs-hiker-poem">“${esc(item.bioPoem || "把走过的山海，凝成夜空里不灭的星辰。")}"</div>
          </div>
        `;
      })
      .join("");

    communityGrid.querySelectorAll("[data-user-handle]").forEach((card) => {
      card.addEventListener("click", (ev) => {
        const handle = card.getAttribute("data-user-handle");
        const chip = ev.target.closest?.("[data-slug]");
        const slug = chip ? chip.getAttribute("data-slug") : null;
        recordVisitedGalaxy(`u:${handle}`);
        playSelect?.();
        onVisitUserHandle(handle, slug);
      });
    });
  }

  function renderAll() {
    const visitedSet = loadVisitedSet();
    const q = searchQuery.trim().toLowerCase().replace(/^@/, "");
    renderFounders(visitedSet, q);
    renderCommunity(visitedSet, q);
  }

  async function triggerWormholeWarp() {
    if (!cache.loadedAt) {
      await refreshData(false);
    }
    const state = getCurrentUniverseState();
    const pool = [];

    for (const f of FOUNDER_META) {
      if (state.currentUniverse !== f.role) {
        const planets = queryCorePlanets(f.role) || [];
        const pick = planets[Math.floor(Math.random() * planets.length)];
        pool.push({ type: "founder", role: f.role, label: hostRegistry[f.role]?.name, planetId: pick?.id, planetName: pick?.name });
      }
    }

    for (const pl of cache.planets) {
      if (!pl?.owner_handle) continue;
      if (state.currentUniverse === "custom" && state.activeCustomHandle === pl.owner_handle) continue;
      // 给予社区真实自建星球更高权重，鼓励山友互相串门发现
      pool.push({ type: "user", handle: pl.owner_handle, label: pl.owner_name || pl.owner_handle, slug: pl.slug, planetName: pl.planet_name });
      pool.push({ type: "user", handle: pl.owner_handle, label: pl.owner_name || pl.owner_handle, slug: pl.slug, planetName: pl.planet_name });
    }

    if (!pool.length) {
      onVisitFounder("kitty");
      return;
    }

    const chosen = pool[Math.floor(Math.random() * pool.length)];
    playSelect?.();
    if (chosen.type === "user") {
      recordVisitedGalaxy(`u:${chosen.handle}`);
      onToast?.(`🌠 虫洞跃迁成功！随机降落至 @${chosen.handle} 的「${chosen.planetName}」`, 4600);
      onVisitUserHandle(chosen.handle, chosen.slug);
    } else {
      recordVisitedGalaxy(`role:${chosen.role}`);
      onToast?.(`🌠 虫洞跃迁成功！已穿梭至「${chosen.label}的星系 · ${chosen.planetName || ""}」`, 4400);
      onVisitFounder(chosen.role, chosen.planetId);
    }
  }

  // 事件绑定：搜索输入 + 筛选胶囊 + 刷新 + 底部按钮
  searchInput?.addEventListener("input", () => {
    searchQuery = searchInput.value || "";
    clearSearchBtn?.classList.toggle("hidden", !searchQuery);
    renderAll();
  });

  clearSearchBtn?.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    searchQuery = "";
    clearSearchBtn.classList.add("hidden");
    renderAll();
  });

  modalEl?.querySelectorAll("[data-obs-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeFilter = btn.getAttribute("data-obs-filter") || "all";
      modalEl.querySelectorAll("[data-obs-filter]").forEach((b) => b.classList.toggle("active", b === btn));
      playHover?.();
      renderAll();
    });
  });

  document.getElementById("btn-obs-refresh")?.addEventListener("click", () => {
    playHover?.();
    refreshData(true);
  });

  document.getElementById("btn-obs-random-warp")?.addEventListener("click", () => {
    triggerWormholeWarp();
  });

  document.getElementById("btn-obs-go-create")?.addEventListener("click", () => {
    onOpenCreator?.();
  });

  return {
    refreshData,
    renderAll,
    triggerWormholeWarp,
  };
}


