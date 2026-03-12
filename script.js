/* Combined single-file build generated from src modules */

/* ===== src/config.js ===== */
const CONFIG = {
  // Geometry
  polygonRadiusFactor: 0.29,
  insetPadding: 38,               // keeps nodes away from edges (safe polygon inset)
  minEdgeDistance: 6,             // extra margin enforced by soft barrier

  // Motion
  driftStrength: 0.074,           // subtle always-on drift (increase slightly if desired)
  jitterStrength: 0.78,           // per-node static jitter prevents honeycomb settling
  centerTether: 0.003,
  outwardBias: 0.001,             // pushes nodes away from center (balanced by barrier)
                                  // keeps centroid near center without over-regularizing

  // Collision
  collidePadding: 0.89,           // collision radius multiplier padding
  collideStrength: 0.02,

  // Focus forces (dimension/node)
  dimBiasMax: 1.69,               // max scaling when a dim is active
  dimBiasRamp: 0.2,               // ramp speed to avoid impulses
  nodeSimStrength: 0.72,          // similarity pull/push intensity
  nodeRepel: 0.96,                // repel for dissimilar nodes under focus

  // Animation
  sizeEase: 0.06,                 // smoothing for size changes
  posEase: 0.085,                 // smoothing for target position changes

  // Sizing lens (distance-based)
  lensNone:   { inner: 0,   outer: 0,   power: 1.05, a: 1.20, b: 0.70, scale: 1.05 },
  lensFocus:  { inner: 85,  outer: 280, power: 2.35, a: 1.65, b: 0.55, scale: 0.92 },

  // Links
  topoNeighbors: 2,
  focusTopoNeighbors: 10,
  dimTopK: 10,

  // Dimension hover band (annulus around vertices)
  dimHoverInnerFactor: 0.92,
  dimHoverOuterFactor: 1.20,

  // Extra separation for top dim nodes
  dimTopRepelRadius: 90,
  dimTopRepelStrength: 0.35,
};
const DEFAULT_CONFIG = JSON.parse(JSON.stringify(CONFIG));

/* ===== src/layout.js ===== */

let svg = d3.select(null);
let mountEl = null;
let widgetRoot = null;
let width = 900;
let height = 650;
let layoutBound = false;
let resizeHandler = null;
let rerenderHandler = null;

function resize() {
  if (svg.empty()) return;
  const rect = svg.node().getBoundingClientRect();
  width = Math.max(640, Math.floor(rect.width));
  height = Math.max(520, Math.floor(rect.height));
  svg.attr("viewBox", `0 0 ${width} ${height}`);
}

function initLayout() {
  if (layoutBound) return;
  layoutBound = true;
  resize();
  resizeHandler = () => {
    resize();
    if (rerenderHandler) rerenderHandler();
  };
  window.addEventListener("resize", resizeHandler);
}

function teardownLayout() {
  if (resizeHandler) window.removeEventListener("resize", resizeHandler);
  resizeHandler = null;
  rerenderHandler = null;
  layoutBound = false;
}

function setupMount(options = {}) {
  const defaultHost = document.querySelector("#sea-viz") || document.querySelector("#viz");
  const host = (typeof options.container === "string")
    ? document.querySelector(options.container)
    : (options.container || defaultHost);
  mountEl = host || document.body;

  if (mountEl.innerHTML != null) mountEl.innerHTML = "";
  widgetRoot = document.createElement("div");
  widgetRoot.className = "sea-widget";

  const main = document.createElement("div");
  main.className = "sea-widget-main";
  const vizHost = document.createElement("div");
  vizHost.className = "sea-widget-viz";
  const svgNode = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svgNode.setAttribute("aria-label", "Lesson polygon map");
  vizHost.appendChild(svgNode);
  main.appendChild(vizHost);

  const side = document.createElement("aside");
  side.className = "sea-widget-side";
  side.innerHTML = `
    <div class="panel info-panel">
      <div class="panel-body sea-info-body">
        <div class="empty">Hover or click a lesson node to view details.</div>
      </div>
    </div>
    <div class="panel legend-panel">
      <div class="panel-title">Legend</div>
      <div class="panel-body sea-legend-body"></div>
    </div>
  `;

  widgetRoot.appendChild(main);
  widgetRoot.appendChild(side);
  if (mountEl.appendChild) mountEl.appendChild(widgetRoot);

  svg = d3.select(svgNode);
  svg.style("width", "100%").style("height", "100%");
  info = d3.select(side.querySelector(".sea-info-body"));
  legend = d3.select(side.querySelector(".sea-legend-body"));

  if (mountEl.style) {
    if (!mountEl.style.width) mountEl.style.width = "100%";
    if (!mountEl.style.height) mountEl.style.height = "100%";
    if (!mountEl.style.minHeight) mountEl.style.minHeight = `${options.minHeight || 520}px`;
  }
}

const cx = () => width * 0.5;
const cy = () => height * 0.5;
const R = () => Math.min(width, height) * CONFIG.polygonRadiusFactor;

/* ===== src/ui.js ===== */
let tooltip = d3.select(null);

function ensureTooltip() {
  if (!tooltip.empty()) return;
  tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("left", "-9999px")
    .style("top", "-9999px")
    .style("opacity", 0);
}

function teardownTooltip() {
  if (!tooltip.empty()) tooltip.remove();
  tooltip = d3.select(null);
}

function buildTooltipHTML(d) {
  const img = d.thumb ? `<img class="thumb" src="${d.thumb}" alt=""/>` : ``;
  return `
    <div class="tipRow">${img}<div class="tipText">
      <div class="t">${d.lesson_id} — ${d.lesson_title || "(untitled)"}</div>
      <div class="s">Module ${d.module_id}: ${d.module_title || ""}<br/>${d.chapter_title || ""}</div>
    </div></div>
  `;
}

let info = d3.select(null);
let legend = d3.select(null);
let infoLessonRefs = null;

function clearInfoState() {
  infoLessonRefs = null;
}

function formatLessonTitle(node) {
  const rawTitle = String(node?.lesson_title || "(untitled)");
  const lessonId = String(node?.lesson_id || "").trim();
  if (!lessonId) return rawTitle;
  // Keep original title text but replace any leading lesson number with the full lesson id.
  return rawTitle.replace(/^\s*Lesson\s+[0-9]+(?:\.[0-9]+){0,3}/i, `Lesson ${lessonId}`);
}

function setInfoMode(refs, mode) {
  const root = refs?.root;
  if (!root) return;
  root.classList.toggle("mode-init", mode === "init");
  root.classList.toggle("mode-lesson", mode === "lesson");
}

function setThumbState(wrapEl, imgEl, { src, alt }) {
  if (!wrapEl || !imgEl) return;
  const hasSrc = !!String(src || "").trim();
  wrapEl.classList.toggle("no-thumb", !hasSrc);
  if (hasSrc) {
    if (imgEl.getAttribute("src") !== src) imgEl.setAttribute("src", src);
  } else {
    imgEl.removeAttribute("src");
  }
  imgEl.setAttribute("alt", alt || "");
}

function ensureLessonInfoView() {
  if (infoLessonRefs && infoLessonRefs.root?.isConnected) return infoLessonRefs;

  info.html(`
    <div class="sea-info-lesson mode-init">
      <div class="info-media">
        <div class="info-thumb-wrap info-logo-wrap no-thumb">
          <img class="info-thumb info-logo-thumb" alt="" />
        </div>
        <div class="info-thumb-wrap info-lesson-wrap no-thumb">
          <img class="info-thumb info-lesson-thumb" alt="" />
        </div>
      </div>
      <div class="info-init js-info-init">
        <div class="v info-init-title js-init-title"></div>
        <div class="v info-init-lead js-init-lead"></div>
        <div class="v info-init-body js-init-body"></div>
      </div>
      <div class="info-lesson-fields js-lesson-fields">
        <div>
          <div class="v info-lesson-title js-lesson-title"></div>
        </div>
        <div class="info-action">
          <button class="go-lesson-btn js-go-lesson" type="button">Go to lesson</button>
        </div>
        <div>
          <div class="k">Module</div>
          <div class="v js-module-title"></div>
        </div>
        <div>
          <div class="v js-chapter-title"></div>
        </div>
        <div>
          <div class="k">Description</div>
          <div class="v js-lesson-description"></div>
        </div>
      </div>
    </div>
  `);

  const host = info.node();
  const root = host.querySelector(".sea-info-lesson");
  infoLessonRefs = {
    root,
    logoWrap: host.querySelector(".info-logo-wrap"),
    logoThumb: host.querySelector(".info-logo-thumb"),
    lessonWrap: host.querySelector(".info-lesson-wrap"),
    lessonThumb: host.querySelector(".info-lesson-thumb"),
    initTitle: host.querySelector(".js-init-title"),
    initLead: host.querySelector(".js-init-lead"),
    initBody: host.querySelector(".js-init-body"),
    lessonFields: host.querySelector(".js-lesson-fields"),
    lessonTitle: host.querySelector(".js-lesson-title"),
    chapterTitle: host.querySelector(".js-chapter-title"),
    moduleTitle: host.querySelector(".js-module-title"),
    lessonDescription: host.querySelector(".js-lesson-description"),
    goLessonBtn: host.querySelector(".js-go-lesson"),
  };
  return infoLessonRefs;
}

function renderInfoInit() {
  const refs = ensureLessonInfoView();
  setInfoMode(refs, "init");

  refs.initTitle.textContent = String(SEA_OPTIONS.infoInitTitle || "Sustainable Energy Academy");
  refs.initLead.textContent = String(SEA_OPTIONS.infoInitLead || "Explore the lesson map.");
  refs.initBody.textContent = String(SEA_OPTIONS.infoInitBody || "Hover or click lessons and dimensions to inspect how content clusters by policy, technology, finance, equity, data, and implementation.");

  refs.goLessonBtn.removeAttribute("data-lesson-id");
  const logoSrc = String(SEA_OPTIONS.logoUrl || "logo.png");
  setThumbState(refs.logoWrap, refs.logoThumb, {
    src: logoSrc,
    alt: "Sustainable Energy Academy logo",
  });
  setThumbState(refs.lessonWrap, refs.lessonThumb, {
    src: "",
    alt: "",
  });
}

function renderInfo(node, themes) {
  if (!node) {
    renderInfoInit();
    return;
  }

  const refs = ensureLessonInfoView();
  setInfoMode(refs, "lesson");
  refs.lessonTitle.textContent = formatLessonTitle(node);
  refs.chapterTitle.textContent = node.chapter_title || "";
  refs.moduleTitle.textContent = node.module_title || "";
  refs.lessonDescription.textContent = node.lesson_description || "";
  refs.goLessonBtn.setAttribute("data-lesson-id", String(node.lesson_id ?? ""));

  const thumbSrc = node.thumb ? String(node.thumb) : "";
  setThumbState(refs.lessonWrap, refs.lessonThumb, {
    src: thumbSrc,
    alt: thumbSrc ? `Thumbnail for lesson ${node.lesson_id}` : "No thumbnail available",
  });
  setThumbState(refs.logoWrap, refs.logoThumb, {
    src: "",
    alt: "",
  });
}

function renderDimInfo(dim) {
  if (!dim) {
    renderInfoInit();
    return;
  }
  clearInfoState();
  info.html(`
    <div class="row">
      <div>
        <div class="k">Dimension</div>
        <div class="v">${dim.label || dim.id}</div>
      </div>
    </div>
    <div>
      <div class="k">Summary</div>
      <div class="v">${dim.summary || ""}</div>
    </div>
    <div>
      <div class="k">Details</div>
      <div class="v">${dim.details || ""}</div>
    </div>
  `);
}

// Render the module legend in the right panel.
function renderLegend(items) {
  legend.html("");
  const grid = legend.append("div").attr("class", "legend-grid");
  const row = grid.selectAll("div.legend-item")
    .data(items)
    .join("div")
    .attr("class", "legend-item");
  row.append("span")
    .attr("class", "swatch")
    .style("background", d => d.color);
  row.append("span").text(d => d.label);
}

/* ===== src/geometry.js ===== */

function anchors(themes) {
  const n = themes.length;
  return themes.map((d, i) => {
    const ang = (-Math.PI / 2) + (i * 2 * Math.PI / n);
    return { ...d, ang, x: cx() + Math.cos(ang) * R(), y: cy() + Math.sin(ang) * R() };
  });
}

function angleDiff(a, b) {
  const d = a - b;
  return Math.atan2(Math.sin(d), Math.cos(d));
}

function polygonPoints(A) {
  return A.map(a => [a.x, a.y]);
}

// Inset polygon by moving each vertex toward center (simple, robust enough for demo)
function insetPolygon(poly, pad) {
  const c = [cx(), cy()];
  return poly.map(([x,y]) => {
    const dx = x - c[0], dy = y - c[1];
    const len = Math.max(1e-6, Math.hypot(dx,dy));
    const nx = x - (dx/len) * pad;
    const ny = y - (dy/len) * pad;
    return [nx, ny];
  });
}

// Half-plane form for each edge (normal pointing inward)
function polygonHalfPlanes(poly) {
  const planes = [];
  for (let i=0;i<poly.length;i++){
    const [x1,y1] = poly[i];
    const [x2,y2] = poly[(i+1)%poly.length];
    const ex = x2-x1, ey = y2-y1;
    // inward normal: rotate edge by -90 then orient toward center
    let nx = ey, ny = -ex;
    const mx = (x1+x2)/2, my = (y1+y2)/2;
    const toC = [cx()-mx, cy()-my];
    if (nx*toC[0] + ny*toC[1] < 0) { nx=-nx; ny=-ny; }
    const nlen = Math.max(1e-6, Math.hypot(nx,ny));
    nx/=nlen; ny/=nlen;
    const c0 = nx*x1 + ny*y1; // plane: nx*x + ny*y >= c0
    planes.push({nx, ny, c0});
  }
  return planes;
}

// Project a point back into polygon safe region using half-plane distances
function clampToPolygon(p, planes) {
  let x = p.x, y = p.y;
  for (let iter=0; iter<2; iter++) {
    for (const pl of planes) {
      const d = pl.nx*x + pl.ny*y - pl.c0;
      if (d < 0) {
        // push inward
        x += (-d) * pl.nx;
        y += (-d) * pl.ny;
      }
    }
  }
  p.x = x; p.y = y;
}

// Soft barrier keeps nodes from sticking to edges
function softBarrier(node, planes, margin) {
  let dmin = Infinity;
  let nxIn = 0, nyIn = 0;
  for (const pl of planes) {
    const d = pl.nx*node.x + pl.ny*node.y - pl.c0;
    if (d < dmin) { dmin = d; nxIn = pl.nx; nyIn = pl.ny; }
  }
  if (dmin < margin) {
    const u = Math.max(0, Math.min(1, (margin - dmin) / margin));
    const inward = u*u;
    node.vx += nxIn * inward * 0.9;
    node.vy += nyIn * inward * 0.9;
  }
}

/* ===== src/weights.js ===== */
function normalizeWeights(w) {
  let s = 0;
  for (const k of Object.keys(w)) s += w[k];
  if (s <= 1e-8) {
    const n = Object.keys(w).length || 1;
    for (const k of Object.keys(w)) w[k] = 1/n;
  } else {
    for (const k of Object.keys(w)) w[k] /= s;
  }
}

function minMaxNormalize(nodes, themes) {
  const mins = {}, maxs = {};
  themes.forEach(t => { mins[t.id]=Infinity; maxs[t.id]=-Infinity; });
  nodes.forEach(n => {
    themes.forEach(t => {
      const v = n.weights?.[t.id] ?? 0;
      if (v < mins[t.id]) mins[t.id]=v;
      if (v > maxs[t.id]) maxs[t.id]=v;
    });
  });
  nodes.forEach(n => {
    n.wDimNorm = {};
    themes.forEach(t => {
      const v = n.weights?.[t.id] ?? 0;
      const den = (maxs[t.id] - mins[t.id]) || 1;
      n.wDimNorm[t.id] = (v - mins[t.id]) / den;
    });
  });
}

function dot(a,b){ let s=0; for(let i=0;i<a.length;i++) s += a[i]*b[i]; return s; }

function buildWeightMatrix(nodes, themes, useNorm=true) {
  const W = nodes.map(n => {
    const row = [];
    for (const d of themes) row.push(useNorm ? (n.wDimNorm?.[d.id] ?? 0) : (n.weights?.[d.id] ?? 0));
    return row;
  });
  const norms = W.map(r => r.reduce((s,v) => s + v*v, 0));
  return { W, norms };
}

function makeSimilarity() {
  // Gaussian kernel on squared Euclidean distance in weight space
  const sigma = 0.044;
  return (n, h) => {
    const d2 = n.__wnorm + h.__wnorm - 2 * dot(n.__wrow, h.__wrow);
    const sim = Math.exp(-d2 / sigma);
    return Math.max(0, Math.min(1, sim));
  };
}

/* ===== src/links.js ===== */

function buildTopologyLinks(nodes) {
  const links = [];
  for (let i=0;i<nodes.length;i++){
    const a = nodes[i];
    let best = [];
    for (let j=0;j<nodes.length;j++){
      if (i===j) continue;
      const b = nodes[j];
      const dx = a.__baseTx - b.__baseTx;
      const dy = a.__baseTy - b.__baseTy;
      const dd = dx*dx + dy*dy;
      best.push({b, dd});
    }
    best.sort((x,y)=>x.dd-y.dd);
    for (let k=0;k<Math.min(CONFIG.topoNeighbors, best.length);k++) {
      links.push({source: a.lesson_id, target: best[k].b.lesson_id, kind:"topo"});
    }
  }
  return links;
}

function buildDimTopLinks(nodes, themes) {
  const links = [];
  for (const dim of themes) {
    const ranked = nodes.slice().sort((a,b)=> (b.wDimNorm?.[dim.id] ?? 0) - (a.wDimNorm?.[dim.id] ?? 0));
    ranked.slice(0, CONFIG.dimTopK).forEach(n => {
      links.push({source: dim.id, target: n.lesson_id, kind:"dim", dim: dim.id});
    });
  }
  return links;
}

/* ===== src/state.js ===== */

const State = {
  dimActivatedAt: 0,
  // focus: dimension or node
  activeDim: null,
  lockedDim: null,
  hoverNode: null,
  lockedNode: null,
  hoverPointer: null,      // {x,y} for gentle follow
  suppressNextClick: false,
  clickStartedOnNode: false,
  hoverDimArc: null,       // dimension id selected via hover ring

  // smooth ramp for dim emphasis
  dimBiasScale: 0.0,
  dimBiasTarget: 0.0,
};
const DEFAULT_STATE = JSON.parse(JSON.stringify(State));

function clearFocus() {
  if (State.lockedNode) {
    State.lockedNode.fx = null;
    State.lockedNode.fy = null;
  }
  State.activeDim = null;
  State.dimActivatedAt = performance.now();
  State.lockedDim = null;
  State.dimActivatedAt = performance.now();
  State.hoverNode = null;
  State.lockedNode = null;
  State.hoverPointer = null;
}

function setDim(dimId, lock=false) {
  const prevDim = (State.lockedDim ?? State.activeDim);
  const wasLocked = (State.lockedDim === dimId);

  if (lock && dimId && prevDim === dimId && !wasLocked) {
    // Lock the currently-hovered dim without changing strength or restart.
    State.lockedDim = dimId;
    State.activeDim = dimId;
    State.dimBiasTarget = State.dimBiasScale;
    return;
  }

  if (lock) {
    if (State.lockedDim === dimId) {
      State.lockedDim = null;
      State.activeDim = null;
    } else {
      State.lockedDim = dimId;
      State.activeDim = dimId;
      State.lockedNode = null; // locking a dim clears node lock
    }
  } else {
    if (State.lockedDim) return;
    State.activeDim = dimId;
  }
  if ((State.lockedDim ?? State.activeDim) !== prevDim) {
    State.dimActivatedAt = performance.now();
  }
  State.dimBiasTarget = State.activeDim ? CONFIG.dimBiasMax : 0.0;
}

function setHoverNode(n, pointer=null) {
  State.hoverNode = n;
  State.hoverPointer = pointer;
}

function lockNode(n) {
  State.lockedNode = n;
  n.fx = n.x;
  n.fy = n.y;
  n.vx = 0;
  n.vy = 0;
  State.hoverNode = null;
  State.hoverPointer = null;
  State.lockedDim = null;
  State.activeDim = null;
  State.dimBiasTarget = 0.0;
}

function unlockNode() {
  if (State.lockedNode) { State.lockedNode.fx = null; State.lockedNode.fy = null; }
  State.lockedNode = null;
}

function resetState() {
  if (State.lockedNode) {
    State.lockedNode.fx = null;
    State.lockedNode.fy = null;
  }
  Object.keys(State).forEach((k) => {
    State[k] = DEFAULT_STATE[k];
  });
}

/* ===== src/main.js ===== */
/* 
SEA Lesson Map (D3) — Refactored from v46 (stable baseline)

Purpose
- Visualize all lessons as nodes inside a 6‑dimensional polygon (one vertex per theme).
- Nodes drift subtly to feel alive.
- Hover a node: gentle mouse-follow + similarity reflow (keeps global centroid stable).
- Click/drag a node: lock selection; drag updates its weights; release returns to drift.
- Hover a dimension label/anchor: emphasize that dimension (stronger pull for high-weight nodes, push for low-weight).
- Click a dimension label/anchor: lock/unlock the dimension focus.
- Info panel shows lesson details; tooltip shows thumbnail + key info.

Implementation notes (handover)
- The simulation uses D3 forceSimulation for smooth motion but we control targets via a custom "field" computed each tick.
- To prevent chaotic ricochets, we constrain nodes to a "safe inset polygon" using half-planes and a soft barrier.
- Size is computed by a "lens" around the current focus (center/dimension/node). Size updates smoothly via target easing.
- There is no label layer on nodes (intentionally removed for robustness).
*/

const DEFAULT_SEA_OPTIONS = {
  dataDir: "data",
  dataUrls: {},
  data: {},
  minHeight: 520,
  logoUrl: "logo.png",
  infoInitTitle: "Sustainable Energy Academy",
  infoInitLead: "Explore the lesson map.",
  infoInitBody: "Hover or click lessons and dimensions to inspect how content clusters by policy, technology, finance, equity, data, and implementation.",
};
let SEA_OPTIONS = { ...DEFAULT_SEA_OPTIONS };
const DATA_FILES = {
  graphConfig: "sea_network_graph_config.json",
  moduleStructure: "module_structure.json",
};

function resetConfig() {
  Object.keys(CONFIG).forEach((k) => {
    if (!(k in DEFAULT_CONFIG)) delete CONFIG[k];
  });
  Object.keys(DEFAULT_CONFIG).forEach((k) => {
    const v = DEFAULT_CONFIG[k];
    CONFIG[k] = (v && typeof v === "object") ? JSON.parse(JSON.stringify(v)) : v;
  });
}

function resolveDataPath(file) {
  const base = String(SEA_OPTIONS.dataDir || "data").replace(/\/+$/, "");
  return `${base}/${file}`;
}

// Data lookup order is deterministic to make CMS migration straightforward:
// 1) in-memory data passed by host app (SEA_OPTIONS.data)
// 2) explicit per-file URLs (SEA_OPTIONS.dataUrls)
// 3) local relative fallback (SEA_OPTIONS.dataDir + default filename)
function resolveDataUrl(key) {
  const urls = SEA_OPTIONS.dataUrls || {};
  if (urls[key]) return urls[key];
  return resolveDataPath(DATA_FILES[key]);
}

async function loadJsonData(key) {
  const inline = SEA_OPTIONS.data || {};
  if (inline[key] != null) return inline[key];
  return d3.json(resolveDataUrl(key));
}

function setConfigByPath(target, path, value) {
  const parts = String(path || "").split(".").map(p => p.trim()).filter(Boolean);
  if (!parts.length) return false;
  let obj = target;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (!(k in obj) || typeof obj[k] !== "object" || obj[k] == null) return false;
    obj = obj[k];
  }
  const leaf = parts[parts.length - 1];
  if (!(leaf in obj)) return false;
  obj[leaf] = value;
  return true;
}

function normalizeConfigValue(value) {
  if (typeof value !== "string") return value;
  const raw = value.trim();
  if (!raw) return value;
  const num = Number(raw);
  return Number.isFinite(num) ? num : value;
}

function applyConfigObject(prefix, value) {
  if (value == null) return;
  if (Array.isArray(value)) {
    if (!setConfigByPath(CONFIG, prefix, value)) {
      console.warn(`Unknown tuning key: ${prefix}`);
    }
    return;
  }
  if (typeof value === "object") {
    Object.entries(value).forEach(([k, v]) => {
      const path = prefix ? `${prefix}.${k}` : k;
      applyConfigObject(path, v);
    });
    return;
  }
  if (!setConfigByPath(CONFIG, prefix, normalizeConfigValue(value))) {
    console.warn(`Unknown tuning key: ${prefix}`);
  }
}

function applyGraphConfigTuning(graphConfig) {
  const tuning = graphConfig?.tuning;
  if (!tuning || typeof tuning !== "object") {
    console.warn("Graph config tuning not found; using in-code defaults.");
    return;
  }
  Object.entries(tuning).forEach(([k, v]) => applyConfigObject(k, v));
}

/* =========================
   7) Main: Load Data + Build Scene
   ========================= */

async function main() {
  const graphConfig = await loadJsonData("graphConfig");
  applyGraphConfigTuning(graphConfig);

  // Build order: geometry → anchors → data → links → nodes → interaction → simulation
  const dimMeta = { dimensions: Array.isArray(graphConfig?.dimensions) ? graphConfig.dimensions : [] };
  const THEMES = (dimMeta?.dimensions || []).map(d => ({ id: d.id, label: d.label || d.id }));
  const dimMap = new Map((dimMeta?.dimensions || []).map(d => [d.id, d]));

  /* ---------- 7.1 Geometry ---------- */
  let A = anchors(THEMES);
  let poly = polygonPoints(A);
  let polySafe = insetPolygon(poly, CONFIG.insetPadding);
  let planes = polygonHalfPlanes(polySafe);

  svg.selectAll("*").remove();
  const g = svg.append("g");

  // Outer polygon
  const outerPoly = g.append("path")
    .attr("d", d3.line().curve(d3.curveLinearClosed)(poly))
    .attr("fill", "rgba(255,255,255,0.015)")
    .attr("stroke", "rgba(232,236,255,0.14)")
    .attr("stroke-width", 1.2);

  // Dimension hover band (light ring)
  const hoverRing = g.append("circle")
    .attr("cx", cx())
    .attr("cy", cy())
    .attr("r", R() * ((CONFIG.dimHoverInnerFactor + CONFIG.dimHoverOuterFactor) * 0.5))
    .attr("fill", "none")
    .attr("stroke", "rgba(232,236,255,0.16)")
    .attr("stroke-width", 1.4)
    .attr("stroke-dasharray", "3 6");

  /* ---------- 7.2 Anchors ---------- */
  // Theme anchors
  const anchorG = g.selectAll(".anchor")
    .data(A)
    .join("g")
    .attr("class", "anchor");

  const anchorDot = anchorG.append("circle")
    .attr("cx", d => d.x).attr("cy", d => d.y)
    .attr("r", 3.8)
    .attr("fill", "rgba(232,236,255,0.55)")
    .style("pointer-events", "none");

  // Dimension label (hover/click)
  const anchorText = anchorG.append("text")
    .attr("x", d => d.x).attr("y", d => d.y)
    .attr("dx", d => (Math.cos(d.ang) > 0 ? 10 : -10))
    .attr("dy", d => (Math.sin(d.ang) > 0 ? 14 : -8))
    .attr("text-anchor", d => (Math.cos(d.ang) > 0 ? "start" : "end"))
    .attr("font-size", 12)
    .attr("fill", "rgba(232,236,255,0.82)")
    .text(d => d.label)
    .style("cursor", "pointer")
    .style("pointer-events", "all");

  // Large hit target around vertex
  const dimHitSel = anchorG.append("circle")
    .attr("cx", d => d.x).attr("cy", d => d.y)
    .attr("r", 90)
    .attr("class", "dimHit")
    .attr("fill", "transparent")
    .style("cursor", "pointer");

  function dimEnter(event, ad) { setDim(ad.id, false); updateDimTop(); styleAll(); kickSim(0.32); }
  function dimLeave(event, ad) { setDim(null, false); updateDimTop(); styleAll(); kickSim(0.32); }

  anchorText.on("mouseenter", dimEnter).on("mouseleave", dimLeave)
    .on("click", (event, ad) => {
      event.stopPropagation();
      setDim(ad.id, true);
      if (State.lockedDim) {
        renderDimInfo(dimMap.get(State.lockedDim) || { id: State.lockedDim, label: ad.label });
      } else {
        renderInfo(null);
      }
      updateDimTop();
      styleAll();
      kickSim(0.32);
    });

  dimHitSel.on("mouseenter", dimEnter).on("mouseleave", dimLeave)
    .on("click", (event, ad) => {
      event.stopPropagation();
      setDim(ad.id, true);
      if (State.lockedDim) {
        renderDimInfo(dimMap.get(State.lockedDim) || { id: State.lockedDim, label: ad.label });
      } else {
        renderInfo(null);
      }
      updateDimTop();
      styleAll();
      kickSim(0.32);
    });

  // Dimension hover ring: map pointer to nearest anchor within annulus.
  function dimArcFromPointer(p) {
    const dx = p[0] - cx();
    const dy = p[1] - cy();
    const dist = Math.hypot(dx, dy);
    const inner = R() * CONFIG.dimHoverInnerFactor;
    const outer = R() * CONFIG.dimHoverOuterFactor;
    if (dist < inner || dist > outer) return null;
    const ang = Math.atan2(dy, dx); // -pi..pi
    let best = null;
    let bestAbs = Infinity;
    for (const a of A) {
      const d = Math.abs(angleDiff(ang, a.ang));
      if (d < bestAbs) { bestAbs = d; best = a.id; }
    }
    return best;
  }

  svg.on("mousemove", (event) => {
    const t = event.target;
    if (t && t.closest && (t.closest(".node") || t.closest(".dim") || t.closest(".dimLabel"))) {
      return;
    }
    const p = d3.pointer(event, svg.node());
    const dimId = dimArcFromPointer(p);
    if (dimId !== State.hoverDimArc) {
      State.hoverDimArc = dimId;
      setDim(dimId, false);
      updateDimTop();
      styleAll();
      kickSim(0.28);
    }
  });

  svg.on("mouseleave", () => {
    if (!State.hoverDimArc) return;
    State.hoverDimArc = null;
    setDim(null, false);
    updateDimTop();
    styleAll();
    kickSim(0.22);
  });

  /* ---------- 7.3 Data ---------- */
  // Load nodes
  const nodesRaw = Array.isArray(graphConfig?.weights) ? graphConfig.weights : [];
  const moduleStructure = await loadJsonData("moduleStructure");

  // Map thumbnails from module_structure.json
  function buildThumbMap(structure) {
    const map = new Map();
    if (!structure || !structure.modules) return map;
    for (const mod of structure.modules) {
      const modImg = mod?.image?.src || null;
      for (const ch of (mod.chapters || [])) {
        const chImg = ch?.image?.src || modImg;
        for (const l of (ch.lessons || [])) {
          const id = l.id;
          const img = l?.image?.src || l?.frame?.src || chImg || modImg || null;
          if (id && img) map.set(id, img);
        }
      }
    }
    return map;
  }
  const thumbMap = buildThumbMap(moduleStructure);

  const nodes = nodesRaw.map(d => ({...d}));
  nodes.forEach(n => {
    n.thumb = thumbMap.get(n.lesson_id) || null;

    // weights
    n.weights = {};
    THEMES.forEach(t => n.weights[t.id] = +n[t.id] || 0);
    normalizeWeights(n.weights);

    // module numeric for color scale
    n.__moduleNum = +String(n.module_id).replace(/[^\d]/g,"") || +n.module_id || 0;

    // initial position random near center
    n.x = cx() + (Math.random()-0.5) * 60;
    n.y = cy() + (Math.random()-0.5) * 60;
    n.vx = 0; n.vy = 0;

    // base jitter offsets (static)
    n.__jox = (Math.random()-0.5) * CONFIG.jitterStrength;
    n.__joy = (Math.random()-0.5) * CONFIG.jitterStrength;

    // per-node collision randomness to avoid crystalline packing
    n.__cr = 0.85 + Math.random() * 0.30;

    // size state
    n.size = 6.5;
    n.sizeTarget = 6.5;
  });

  // Normalize per-dim across nodes for better dim hover
  minMaxNormalize(nodes, THEMES);

  // Weighted barycentric "base target" within polygon for each node
  let Amap = new Map(A.map(a => [a.id, a]));
  // Base targets are barycentric positions derived from theme weights.
  function recomputeBaseTargets() {
    Amap = new Map(A.map(a => [a.id, a]));
    nodes.forEach(n => {
      let tx = cx(), ty = cy();
      for (const t of THEMES) {
        const w = n.weights[t.id] ?? 0;
        const a = Amap.get(t.id);
        tx += (a.x - cx()) * w;
        ty += (a.y - cy()) * w;
      }
      // Spread factor pushes nodes outward so the initial distribution uses more of the polygon area
      const spreadFactor = 1.18;
      n.__baseTx = cx() + (tx - cx()) * spreadFactor;
      n.__baseTy = cy() + (ty - cy()) * spreadFactor;
    });
  }
  recomputeBaseTargets();

  // Similarity precompute (normalized vector rows)
  const { W, norms } = buildWeightMatrix(nodes, THEMES, true);
  nodes.forEach((n,i) => { n.__wrow = W[i]; n.__wnorm = norms[i]; });
  const similarity = makeSimilarity();

  /* ---------- 7.4 Links ---------- */
  // Links for visual texture
  const topoLinks = buildTopologyLinks(nodes);
  const dimLinks  = buildDimTopLinks(nodes, THEMES);

  // For quick lookup by lesson id
  const nodeById = new Map(nodes.map(n => [n.lesson_id, n]));

  // Color scale by module # (prefer colors from module_structure.json)
  const moduleNums = Array.from(new Set(nodes.map(n => n.__moduleNum))).sort((a,b)=>a-b);
  const moduleMeta = new Map((moduleStructure?.modules || []).map(m => {
    const num = +String(m.id).replace(/[^\d]/g,"") || +m.id || 0;
    return [num, { title: m.title || `Module ${m.id}`, color: m.color || null }];
  }));
  const moduleColors = moduleNums.map(num => moduleMeta.get(num)?.color || "#7a86a8");
  const color = d3.scaleOrdinal(moduleNums, moduleColors);

  // Legend (module order + colors)
  const legendItems = moduleNums.map(num => ({
    id: num,
    label: moduleMeta.get(num)?.title || `Module ${num}`,
    color: color(num),
  }));
  renderLegend(legendItems);

  // Link layers
  const linkG = g.append("g").attr("class", "links");
  const topoSel = linkG.selectAll("line.topo")
    .data(topoLinks)
    .join("line")
    .attr("class", "topo")
    .attr("stroke", "rgba(232,236,255,0.07)")
    .attr("stroke-width", 1.0);

  let focusTopoSel = linkG.append("g").attr("class", "focusLinks")
    .selectAll("line.focusTopo");

  const dimSel = linkG.selectAll("line.dim")
    .data(dimLinks)
    .join("line")
    .attr("class", d => `dim dim-${d.dim}`)
    .attr("stroke", "rgba(232,236,255,0.08)")
    .attr("stroke-width", 1.0);

  /* ---------- 7.5 Nodes ---------- */
  // Node layer (hexagons)
  const nodeG = g.append("g").attr("class", "nodes");

  function hexPath(r) {
    const a = Math.PI/3;
    const pts = d3.range(6).map(i => [Math.cos(a*i)*r, Math.sin(a*i)*r]);
    return "M" + pts.map(p => p.join(",")).join("L") + "Z";
  }

  const nodesSel = nodeG.selectAll("path.node")
    .data(nodes, d => d.lesson_id)
    .join("path")
    .attr("class", "node")
    .attr("d", d => hexPath(d.size))
    .attr("fill", d => color(d.__moduleNum))
    .attr("stroke", "rgba(10,14,30,0.22)")
    .attr("stroke-width", 1.0)
    .style("cursor", "pointer");

  // White highlight ring for "same module as hovered/locked node"
  const ringSel = nodeG.selectAll("path.ring")
    .data(nodes, d => d.lesson_id)
    .join("path")
    .attr("class", "ring")
    .attr("d", d => hexPath(d.size*1.25))
    .attr("fill", "none")
    .attr("stroke", "rgba(255,255,255,0)")
    .attr("stroke-width", 1.8)
    .style("pointer-events", "none");

  // Links from the locked node to its closest neighbors by weight similarity.
  function buildFocusLinks(node) {
    if (!node) return [];
    const k = Math.max(0, Math.floor(CONFIG.focusTopoNeighbors || 0));
    if (k <= 0) return [];
    const ranked = nodes
      .filter(n => n !== node)
      .map(n => ({ source: node.lesson_id, target: n.lesson_id, score: similarity(n, node) }))
      .sort((a,b) => b.score - a.score)
      .slice(0, k);
    return ranked.map(d => ({ source: d.source, target: d.target, kind: "focus" }));
  }

  // Rebuild focus links when the locked node changes.
  function updateFocusLinks() {
    const data = State.lockedNode ? buildFocusLinks(State.lockedNode) : [];
    focusTopoSel = focusTopoSel
      .data(data, d => `${d.source}->${d.target}`)
      .join(
        enter => enter.append("line")
          .attr("class", "focusTopo")
          .attr("stroke", "rgba(255,168,64,0.22)")
          .attr("stroke-width", 1.4),
        update => update,
        exit => exit.remove()
      );
  }

  /* ---------- 7.6 Interaction: nodes ---------- */

  function showTooltip(event, d) {
    tooltip.interrupt();
    tooltip.html(buildTooltipHTML(d))
      .style("left", (event.pageX + 12) + "px")
      .style("top", (event.pageY - 12) + "px")
      .transition().duration(90)
      .style("opacity", 1);
  }

  function hideTooltip() {
    tooltip.interrupt();
    tooltip
      .transition()
      .duration(120)
      .style("opacity", 0)
      .on("end", () => {
        tooltip.style("left", "-9999px").style("top", "-9999px");
      });
  }

  function nodeEnter(event, d) {
    const p = d3.pointer(event, svg.node());
    setHoverNode(d, {x:p[0], y:p[1]});
    showTooltip(event, d);
    if (!State.lockedNode) renderInfo(d, THEMES);
    styleAll();
    kickSim(0.32);
  }

  function nodeMove(event, d) {
    const p = d3.pointer(event, svg.node());
    State.hoverPointer = {x:p[0], y:p[1]};
    showTooltip(event, d);
  }

  function nodeLeave(event, d) {
    State.hoverNode = null;
    State.hoverPointer = null;
    hideTooltip();
    styleAll();
    kickSim(0.22);
  }

  function nodePointerDown(event, d) {
    // Robust lock: pointerdown fires even when drag is attached (click can be suppressed by d3-drag).
    if (State.suppressNextClick) return;
    event.stopPropagation();
    State.clickStartedOnNode = true;

    // Always lock (do not toggle off here). Unlock by clicking the background.
    lockNode(d);
    updateFocusLinks();
    renderInfo(d, THEMES);
    showTooltip(event, d);
    updateDimTop();
    styleAll();
    kickSim(0.40);
  }

  function nodeClick(event, d) {
    // Click is best-effort (d3-drag may suppress it). Keep behavior consistent with pointerdown.
    if (State.suppressNextClick) return;
    event.stopPropagation();
    State.clickStartedOnNode = false;

    lockNode(d);
    updateFocusLinks();
    renderInfo(d, THEMES);
    showTooltip(event, d);
    updateDimTop();
    styleAll();
    kickSim(0.35);
  }

  // Click background to clear locks
  svg.on("click", (event) => {
    // Clear focus when clicking anywhere that is NOT a node or dimension control.
    if (State.clickStartedOnNode) { State.clickStartedOnNode = false; return; }
    const t = event.target;
    if (event.defaultPrevented) return;
    if (t && t.closest) {
      if (t.closest(".node")) return;
      if (t.closest(".dim")) return;
      if (t.closest(".dimLabel")) return;
    }
    if (State.lockedNode || State.lockedDim || State.activeDim) {
      clearFocus();
      renderInfo(null);
      hideTooltip();
      updateFocusLinks();
      updateDimTop();
      styleAll();
      kickSim(0.30);
    }
  });

  nodesSel.on("mouseenter", nodeEnter)
    .on("mousemove", nodeMove)
    .on("mouseleave", nodeLeave)
    .on("pointerdown", nodePointerDown)
    .on("click", nodeClick);

  /* Dragging: locks node and lets user reposition (updates weights based on position inside polygon) */
  const drag = d3.drag()
    .on("start", (event, d) => {
      /* stopPropagation handled by pointerdown */
      d.__down = { x: event.x, y: event.y, moved: false, dragging: false };
      // Do not lock on down; a pure click should lock via nodeClick.
    })
    .on("drag", (event, d) => {
      const p = d3.pointer(event, svg.node());
      const dx = p[0] - (d.__down?.x ?? p[0]);
      const dy = p[1] - (d.__down?.y ?? p[1]);
      const moved = (dx*dx + dy*dy) > 16; // 4px threshold

      if (d.__down && moved) d.__down.moved = true;
      if (d.__down && d.__down.moved && !d.__down.dragging) {
        d.__down.dragging = true;
        lockNode(d);
        updateFocusLinks();
        renderInfo(d, THEMES);
        d.fx = d.x;
        d.fy = d.y;
      }

      if (!d.__down?.dragging) return;

      d.fx = p[0];
      d.fy = p[1];

      // Update weights from dragged position (inverse-distance demo rule)
      const w = {};
      let sum = 0;
      for (const a of A) {
        const ddx = p[0] - a.x, ddy = p[1] - a.y;
        const dist = Math.max(30, Math.hypot(ddx, ddy));
        const inv = 1.0 / (dist*dist);
        w[a.id] = inv;
        sum += inv;
      }
      for (const k of Object.keys(w)) w[k] /= sum;
      d.weights = w;

      minMaxNormalize(nodes, THEMES);
      updateDimTop();
      styleAll();
      kickSim(0.55);
    })
    .on("end", (event, d) => {
      const wasDrag = !!d.__down?.dragging;
      d.__down = null;

      if (wasDrag) {
        if (!(State.lockedNode && State.lockedNode.id === d.id)) {
          d.fx = null;
          d.fy = null;
        }
        State.suppressNextClick = true;
        setTimeout(() => { State.suppressNextClick = false; }, 0);
        kickSim(0.35);
      } else {
        kickSim(0.22);
      }
    });

  nodesSel.call(drag);

  /* =========================
     8) Dimension Top Flags
     ========================= */

  function collideRadius(d) {
    const base = (d.size * 1.08 + 3.6) * CONFIG.collidePadding * (d.__cr || 1);
    if ((State.lockedDim || State.activeDim) && d.__dimTop) return base * 1.35;
    return base;
  }

  function updateDimTop() {
    nodes.forEach(n => n.__dimTop = false);
    const dim = (State.lockedDim ?? State.activeDim);
    if (!dim) return;
    const k = Math.max(1, Math.floor(CONFIG.dimTopK || 10));
    const ranked = nodes.slice().sort((a,b) => (b.wDimNorm?.[dim] ?? 0) - (a.wDimNorm?.[dim] ?? 0));
    ranked.slice(0, k).forEach(n => n.__dimTop = true);
  }
  updateDimTop();

  /* =========================
     9) Force Simulation + Field Targets
     ========================= */

  let dimBiasScale = 0.0;

  function focusDescriptor() {
    if (State.lockedNode) return { type: "node", node: State.lockedNode };
    if (State.hoverNode)  return { type: "hover", node: State.hoverNode };
    if (State.activeDim)  return { type: "dim", id: State.activeDim };
    return { type: "none" };
  }

  function computeFocusPoint(f) {
    if (f.type === "dim") {
      const a = Amap.get(f.id);
      return {x: a.x, y: a.y};
    }
    if (f.type === "node" || f.type === "hover") {
      return {x: f.node.x, y: f.node.y};
    }
    return {x: cx(), y: cy()};
  }

  function updateSizes() {
    const f = focusDescriptor();
    const fp = computeFocusPoint(f);

    nodes.forEach(n => {
      // Base size ALWAYS depends on distance to center (gives shape even in focus modes)
      const dcx = n.x - cx();
      const dcy = n.y - cy();
      const dCenter = Math.hypot(dcx, dcy);
      const u = Math.max(0, Math.min(1, dCenter / (R() * 0.98)));
      // Soften center-distance effect on dim hover; strengthen in static state.
      const basePower = (f.type === "dim") ? 1.25 : (f.type === "none" ? 1.45 : 1.15);
      const baseFall = Math.pow(u, basePower);
      // center big -> edge smaller
      const baseSizeTarget = (1.05 * (1 - baseFall) + 0.62 * baseFall) * 1.00;

      // Focus multiplier (dimension/node/hover) applied on top of baseline
      let mult = 1.0;
      const dx = n.x - fp.x;
      const dy = n.y - fp.y;
      const dist = Math.hypot(dx, dy);

      if (f.type === "none") {
        // no extra multiplier; baseline already provides shape
        mult = 1.0;
      } else {
        const inner = CONFIG.lensFocus.inner, outer = CONFIG.lensFocus.outer;
        const t1 = Math.max(0, Math.min(1, (dist - inner) / (outer - inner)));
        const fall1 = Math.pow(t1, CONFIG.lensFocus.power);
        const focusCore = (CONFIG.lensFocus.a * (1 - fall1) + CONFIG.lensFocus.b * fall1) * CONFIG.lensFocus.scale;

        // Normalize focusCore into a multiplier range ~[0.8..1.35]
        mult = 0.78 + (focusCore - 0.55) * 0.70;

        if (f.type === "dim" && n.__dimTop) mult *= 1.08;
        if ((f.type === "node" || f.type === "hover") && f.node === n) mult *= 1.18;
      }

      const sizeFocusNode = State.hoverNode || (f.type === "node" ? f.node : null);

      if ((State.lockedDim || State.activeDim) && n.__dimTop) {
        // Dim top nodes: fixed large size (ignore other sizing rules).
        n.sizeTarget = 1.85;
      } else if (State.lockedNode && n === State.lockedNode) {
        // Locked node: fixed large size (no radius-based scaling).
        n.sizeTarget = 2.20;
      } else if (State.hoverNode && n === State.hoverNode) {
        // Hovered node (even when another is locked): large size.
        n.sizeTarget = 2.20;
      } else {
        let sizeTarget = baseSizeTarget * mult;
        if (sizeFocusNode) {
          // When a node is selected, push far nodes closer to minimum size.
          const dFocus = Math.hypot(n.x - sizeFocusNode.x, n.y - sizeFocusNode.y);
          const tFocus = Math.max(0, Math.min(1, dFocus / (R() * 0.98)));
          sizeTarget *= (1 - tFocus * 0.40);
        }
        n.sizeTarget = sizeTarget;
      }

      // Smooth ease into rendered radius (scaled to pixels)
      n.size += (n.sizeTarget * 8.2 - n.size) * CONFIG.sizeEase;
    });
  }

  function styleAll() {
    // Node size & position are driven by tick. This only adjusts visual emphasis.
    const f = focusDescriptor();

    nodesSel
      .attr("stroke", d => {
        if (State.lockedNode && d === State.lockedNode) return "rgba(255,168,64,0.95)";
        if (State.hoverNode && d === State.hoverNode) return "rgba(255,255,255,0.92)";
        if (d === f.node && (f.type === "node" || f.type === "hover")) return "rgba(255,255,255,0.92)";
        return "rgba(10,14,30,0.22)";
      })
      .attr("stroke-width", d => {
        if (State.lockedNode && d === State.lockedNode) return 3.0;
        if (State.hoverNode && d === State.hoverNode) return 2.4;
        if (d === f.node && (f.type === "node" || f.type === "hover")) return 2.4;
        return 1.0;
      })
      .attr("fill-opacity", d => (State.activeDim && State.activeDim !== null) ? 0.92 : 0.92);

    // Rings: show for same-module nodes when hovering/locked
    const ref = (State.lockedNode || State.hoverNode);
    const refMod = ref ? ref.module_id : null;
    ringSel
      .attr("stroke", d => (refMod && d.module_id === refMod && d !== ref) ? "rgba(255,255,255,0.60)" : "rgba(255,255,255,0)")
      .attr("stroke-width", d => (refMod && d.module_id === refMod && d !== ref) ? 2.0 : 0);

    // Dimension text cue when locked
    anchorText
      .style("font-weight", a => (State.lockedDim && a.id === State.lockedDim) ? 800 : (((State.lockedDim || State.activeDim) && a.id === (State.lockedDim || State.activeDim)) ? 700 : 500))
      .style("fill", a => (State.lockedDim && a.id === State.lockedDim) ? "rgba(255,168,64,0.98)" : "rgba(232,236,255,0.82)")
      .style("text-decoration", a => (State.activeDim && !State.lockedDim && a.id === State.activeDim) ? "underline" : "none")
      .style("opacity", a => (State.lockedDim && a.id !== State.lockedDim) ? 0.65 : 1);
  
  // Dimension top-K highlight (on hover or lock)
  function applyDimTopHighlight() {
    const dimId = (State.lockedDim ?? State.activeDim);
    if (!dimId) {
      nodesSel.classed("dimTop", false);
      return;
    }
    const k = Math.max(1, Math.floor(CONFIG.dimTopK || 10));
    // Rank by normalized weights for stability across dimensions
    const scored = nodes
      .map(n => ({ id: n.lesson_id, w: (n.wDimNorm?.[dimId] ?? n.weights?.[dimId] ?? 0) }))
      .sort((a,b) => b.w - a.w)
      .slice(0, k);
    const top = new Set(scored.map(d => d.id));
    nodesSel.classed("dimTop", d => top.has(d.lesson_id));
  }
  applyDimTopHighlight();

}

  function updateLinks() {
    topoSel
      .attr("x1", d => nodeById.get(d.source)?.x ?? 0)
      .attr("y1", d => nodeById.get(d.source)?.y ?? 0)
      .attr("x2", d => nodeById.get(d.target)?.x ?? 0)
      .attr("y2", d => nodeById.get(d.target)?.y ?? 0);

    dimSel
      .attr("x1", d => (Amap.get(d.source)?.x ?? 0))
      .attr("y1", d => (Amap.get(d.source)?.y ?? 0))
      .attr("x2", d => (nodeById.get(d.target)?.x ?? 0))
      .attr("y2", d => (nodeById.get(d.target)?.y ?? 0))
      .attr("stroke", d => (State.activeDim === d.dim) ? "rgba(232,236,255,0.18)" : "rgba(232,236,255,0.08)")
      .attr("stroke-width", d => (State.activeDim === d.dim) ? 1.8 : 1.0);

    focusTopoSel
      .attr("x1", d => nodeById.get(d.source)?.x ?? 0)
      .attr("y1", d => nodeById.get(d.source)?.y ?? 0)
      .attr("x2", d => nodeById.get(d.target)?.x ?? 0)
      .attr("y2", d => nodeById.get(d.target)?.y ?? 0);
  }

  // Main target field: base target (weights) + drift + focus bias + similarity reflow + centroid stabilizer

function dimMoveRamp() {
  // Immediate ramp (no delay) for dimension movement.
  const t0 = State.dimActivatedAt || 0;
  if (!t0) return 1;
  const dt = performance.now() - t0;
  const x = Math.max(0, Math.min(1, dt / 700));
  return x * x * x; // ease-in cubic
}


  function applyField(alpha) {
    // ramp dim bias smoothly
    dimBiasScale += (State.dimBiasTarget - dimBiasScale) * CONFIG.dimBiasRamp;
    State.dimBiasScale = dimBiasScale;

    const f = focusDescriptor();
    const dim = (f.type === "dim") ? f.id : null;
    const ref = (f.type === "node" || f.type === "hover") ? f.node : null;
    const hasDimTop = !!(State.lockedDim || State.activeDim);

    // centroid estimate
    let mx=0, my=0;
    for (const n of nodes) { mx += n.x; my += n.y; }
    mx /= nodes.length; my /= nodes.length;

    for (const n of nodes) {
      // base target (weights-derived)
      let tx = n.__baseTx;
      let ty = n.__baseTy;

      // per-node static jitter to avoid perfect lattice
      tx += n.__jox * 55;
      ty += n.__joy * 55;

      // subtle drift: time-based swirl around center
      // wander force: tiny per-node noise that changes slowly (prevents lattices)
      const t = performance.now() * 0.00020;
      const ang = t + (n.__jox + 0.5) * 6.0;
      const wv = (t*0.55) + (n.__jox - n.__joy) * 11.0;
      tx += Math.cos(wv) * 14 * CONFIG.driftStrength;
      ty += Math.sin(wv) * 14 * CONFIG.driftStrength;
      tx += Math.cos(ang) * 32 * CONFIG.driftStrength;
      ty += Math.sin(ang) * 32 * CONFIG.driftStrength;
      // second harmonic (breaks symmetry / boundary packing)
      const ang2 = (t*1.7) + (n.__joy + 0.5) * 9.0;
      tx += Math.cos(ang2) * 18 * CONFIG.driftStrength;
      ty += Math.sin(ang2) * 18 * CONFIG.driftStrength;

      // dimension emphasis: pull high-weight toward that vertex, push low-weight away
      if (dim) {
        const a = Amap.get(dim);
        const w = n.wDimNorm?.[dim] ?? 0;
        // exponential-ish attraction: strong for high weights, push for low
        const s = (Math.pow(w, 2.1) * 1.6 - 0.6); // range ~[-0.7,1.3]
        const ramp = dimMoveRamp();
        tx += (a.x - cx()) * s * (dimBiasScale * ramp) * 0.50;
        ty += (a.y - cy()) * s * (dimBiasScale * ramp) * 0.50;
      }

      // similarity reflow around reference node
      if (ref) {
        const simv = similarity(n, ref);
        const dx = n.x - ref.x;
        const dy = n.y - ref.y;
        const dist = Math.max(1, Math.hypot(dx,dy));
        const ux = dx / dist, uy = dy / dist;

        // Pull similar nodes closer, push dissimilar outward (nonlinear falloff)
        const pull = Math.pow(simv, 2.4) * CONFIG.nodeSimStrength;
        const push = Math.pow(1 - simv, 1.8) * CONFIG.nodeRepel;

        tx += (-ux) * pull * 125 + (ux) * push * 70;
        ty += (-uy) * pull * 125 + (uy) * push * 70;
      }

      // Extra repel among top dim nodes to reduce overlap
      if (hasDimTop && n.__dimTop) {
        for (const m of nodes) {
          if (m === n || !m.__dimTop) continue;
          const dx = n.x - m.x;
          const dy = n.y - m.y;
          const dist = Math.max(1, Math.hypot(dx, dy));
          if (dist > CONFIG.dimTopRepelRadius) continue;
          const u = 1 - (dist / CONFIG.dimTopRepelRadius);
          const push = u * u * CONFIG.dimTopRepelStrength;
          tx += (dx / dist) * push * 120;
          ty += (dy / dist) * push * 120;
        }
      }

      // Light repel from hovered node when another node is locked.
      if (State.lockedNode && State.hoverNode && n !== State.hoverNode) {
        const hx = n.x - State.hoverNode.x;
        const hy = n.y - State.hoverNode.y;
        const hdist = Math.max(1, Math.hypot(hx, hy));
        const hux = hx / hdist, huy = hy / hdist;
        const repelRadius = 120;
        if (hdist < repelRadius) {
          const t = 1 - (hdist / repelRadius);
          const repel = t * t * 0.45; // light, local push
          tx += hux * repel * 120;
          ty += huy * repel * 120;
        }
      }

      // centroid tether (prevents whole map drifting away)
      tx += (cx() - mx) * CONFIG.centerTether * 300;
      ty += (cy() - my) * CONFIG.centerTether * 300;

      // outward bias: mild encouragement to use area (kept small to avoid boundary pinning)
      tx += (n.x - cx()) * (CONFIG.outwardBias * 260);
      ty += (n.y - cy()) * (CONFIG.outwardBias * 260);

      // edge band: if near boundary, bias targets slightly inward to avoid boundary 'cling'
      // compute min signed distance to safe polygon half-planes (positive inside)
      let dmin = Infinity; let nxIn = 0, nyIn = 0;
      for (const pl of planes) {
        const dEdge = pl.nx*n.x + pl.ny*n.y - pl.c0;
        if (dEdge < dmin) { dmin = dEdge; nxIn = pl.nx; nyIn = pl.ny; }
      }
      const edgeBand = 48; // px band where inward bias ramps up
      if (dmin < edgeBand) {
        const u = Math.max(0, Math.min(1, (edgeBand - dmin) / edgeBand));
        const inward = u*u * 0.22; // smooth ramp
        tx += nxIn * inward * 260;
        ty += nyIn * inward * 260;
      }

      // ease node toward target
      n.vx += (tx - n.x) * CONFIG.posEase * alpha;
      n.vy += (ty - n.y) * CONFIG.posEase * alpha;

      // hovered node gentle follow overrides other effects when not locked
      if (State.hoverNode === n && State.hoverPointer && (!State.lockedNode || State.lockedNode === n)) {
        const fx = State.hoverPointer.x;
        const fy = State.hoverPointer.y;
        n.vx += (fx - n.x) * 0.12;
        n.vy += (fy - n.y) * 0.12;
      }
    }
  }

  // D3 simulation (lightweight): we use it mainly for collision integration + smooth momentum
  let sim = null;
  
  // Keep a tiny heartbeat so drift/jitter + size easing remain perceptible even after settling.
  // Without this, the simulation cools to a stop and time-based drift appears to "turn off".
  function updateHeartbeat() {
    if (!sim) return;
    const moving = (CONFIG.driftStrength > 0) || (CONFIG.jitterStrength > 0) || (State.activeDim != null) || (State.hoverNode != null) || (State.lockedNode != null);
    sim.alphaTarget(moving ? 0.018 : 0.010);
  }
  sim = d3.forceSimulation(nodes)
    .alphaDecay(0.018)
    .velocityDecay(0.38)
    .force("collide", d3.forceCollide().radius(collideRadius).strength(CONFIG.collideStrength))
    .force("charge", d3.forceManyBody().strength(-0.9))
    .on("tick", () => {
      applyField(sim.alpha());
      updateHeartbeat();

      // integrate constraints
      nodes.forEach(n => {
        if (n.fx != null && n.fy != null) {
          n.x = n.fx; n.y = n.fy;
          n.vx *= 0.4; n.vy *= 0.4;
        }
        // hard clamp + soft barrier
        clampToPolygon(n, planes);
        softBarrier(n, planes, CONFIG.minEdgeDistance);
      });

      // visuals
      updateSizes();
      nodesSel.attr("transform", d => `translate(${d.x},${d.y})`).attr("d", d => hexPath(d.size));
      ringSel.attr("transform", d => `translate(${d.x},${d.y})`).attr("d", d => hexPath(d.size*1.25));
      updateLinks();
    });

  function kickSim(a){ if(sim){ updateHeartbeat(); sim.alpha(a).restart(); } }

  // Initial styling
  styleAll();
  let prevCx = cx();
  let prevCy = cy();

  rerenderHandler = () => {
    const dx = cx() - prevCx;
    const dy = cy() - prevCy;

    // Shift nodes to preserve visual centroid on resize.
    nodes.forEach(n => {
      n.x += dx; n.y += dy;
      if (n.fx != null) n.fx += dx;
      if (n.fy != null) n.fy += dy;
    });

    // Recompute geometry based on new size.
    A = anchors(THEMES);
    poly = polygonPoints(A);
    polySafe = insetPolygon(poly, CONFIG.insetPadding);
    planes = polygonHalfPlanes(polySafe);

    // Update static geometry
    outerPoly.attr("d", d3.line().curve(d3.curveLinearClosed)(poly));
    hoverRing
      .attr("cx", cx())
      .attr("cy", cy())
      .attr("r", R() * ((CONFIG.dimHoverInnerFactor + CONFIG.dimHoverOuterFactor) * 0.5));

    anchorG.data(A);
    anchorDot.data(A).attr("cx", d => d.x).attr("cy", d => d.y);
    anchorText.data(A)
      .attr("x", d => d.x).attr("y", d => d.y)
      .attr("dx", d => (Math.cos(d.ang) > 0 ? 10 : -10))
      .attr("dy", d => (Math.sin(d.ang) > 0 ? 14 : -8))
      .attr("text-anchor", d => (Math.cos(d.ang) > 0 ? "start" : "end"));
    dimHitSel.data(A).attr("cx", d => d.x).attr("cy", d => d.y);

    // Update base targets for new center/anchors
    recomputeBaseTargets();

    prevCx = cx();
    prevCy = cy();
    kickSim(0.35);
  };

  return {
    // Runtime-level cleanup used by integration-level destroy().
    // Stops forces and unbinds per-instance SVG handlers.
    destroy() {
      rerenderHandler = null;
      svg.on("mousemove", null).on("mouseleave", null).on("click", null);
      if (sim) {
        sim.stop();
        sim = null;
      }
      if (!svg.empty()) {
        svg.selectAll("*").interrupt();
      }
    },
  };
}

let activeInstance = null;
let createToken = 0;

/*
Host API
--------
window.createSEALessonMap(options) -> Promise<instance>

Options:
- container: string | Element (required in embedded apps)
- dataDir: base path fallback for files
- dataUrls: per-file URL overrides { graphConfig, moduleStructure }
- data: optional in-memory payloads with same keys as dataUrls
- minHeight: minimum mount height for generated svg host

Instance:
- svg: mounted svg DOM node
- config: live config object for diagnostics
- destroy(): full cleanup for React unmount/toggle transitions
*/
async function createSEALessonMap(options = {}) {
  const token = ++createToken;
  if (activeInstance && typeof activeInstance.destroy === "function") {
    activeInstance.destroy();
  }

  resetConfig();
  resetState();
  SEA_OPTIONS = {
    ...DEFAULT_SEA_OPTIONS,
    ...options,
  };
  setupMount(SEA_OPTIONS);
  renderInfoInit();
  ensureTooltip();
  info.on("click.seaGoLesson", (event) => {
    const btn = event.target?.closest?.(".go-lesson-btn");
    if (!btn) return;
    const lessonId = btn.getAttribute("data-lesson-id");
    if (!lessonId) return;
    console.log(lessonId);
  });
  initLayout();
  const runtime = await main();
  if (token !== createToken) {
    if (runtime && typeof runtime.destroy === "function") runtime.destroy();
    return {
      svg: null,
      config: CONFIG,
      destroy() {},
    };
  }

  let destroyed = false;
  const instance = {
    svg: svg.node(),
    config: CONFIG,
    // Integration-level cleanup:
    // removes listeners, tooltip, simulation and mounted svg content.
    destroy() {
      if (destroyed) return;
      destroyed = true;
      if (runtime && typeof runtime.destroy === "function") runtime.destroy();
      teardownLayout();
      teardownTooltip();
      info.on("click.seaGoLesson", null);
      if (widgetRoot && widgetRoot.parentNode) {
        widgetRoot.parentNode.removeChild(widgetRoot);
      } else if (!svg.empty()) {
        svg.selectAll("*").remove();
      }
      svg = d3.select(null);
      info = d3.select(null);
      legend = d3.select(null);
      mountEl = null;
      widgetRoot = null;
      if (activeInstance === instance) activeInstance = null;
    },
  };
  activeInstance = instance;
  return instance;
}

window.createSEALessonMap = createSEALessonMap;
