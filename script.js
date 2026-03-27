/* Combined single-file build generated from src modules */

/* ===== src/config.js ===== */
const CONFIG = {
  // Geometry
  polygonRadiusFactor: 0.29,
  insetPadding: 38,               // keeps nodes away from edges (safe polygon inset)
  minEdgeDistance: 6,             // extra margin enforced by soft barrier
  minEdgeDistanceRefRadius: 190,  // radius where minEdgeDistance is used as-is
  minEdgeDistanceScaleMin: 0.55,  // lower clamp for responsive edge margin scaling
  minEdgeDistanceScaleMax: 1.8,   // upper clamp for responsive edge margin scaling

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
const FALLBACK_MODULE_COLORS = [
  "#00C1FF",
  "#02A38A",
  "#59BA47",
  "#FBC412",
  "#E78625",
  "#E05258",
  "#1F5A95",
  "#757AF0",
  "#006AB5",
];
const GRAPH_THEME = {
  light: {
    // Ocean Mist (hardcoded single light theme)
    outerFill: "rgba(89,165,226,0.06)",
    outerStroke: "rgba(23,50,74,0.24)",
    hoverRing: "rgba(23,50,74,0.22)",
    anchorDot: "rgba(23,50,74,0.46)",
    anchorText: "rgba(23,50,74,0.88)",
    topoStroke: "rgba(23,50,74,0.10)",
    dimStroke: "rgba(23,50,74,0.12)",
    nodeStroke: "rgba(23,50,74,0.25)",
    focusStroke: "rgba(23,50,74,0.92)",
    moduleRing: "rgba(23,50,74,0.52)",
    dimLinkActive: "rgba(23,50,74,0.25)",
    dimLinkInactive: "rgba(23,50,74,0.10)",
  },
  dark: {
    outerFill: "rgba(255,255,255,0.015)",
    outerStroke: "rgba(232,236,255,0.14)",
    hoverRing: "rgba(232,236,255,0.16)",
    anchorDot: "rgba(232,236,255,0.55)",
    anchorText: "rgba(232,236,255,0.82)",
    topoStroke: "rgba(232,236,255,0.07)",
    dimStroke: "rgba(232,236,255,0.08)",
    nodeStroke: "rgba(10,14,30,0.22)",
    focusStroke: "rgba(255,255,255,0.92)",
    moduleRing: "rgba(255,255,255,0.60)",
    dimLinkActive: "rgba(232,236,255,0.18)",
    dimLinkInactive: "rgba(232,236,255,0.08)",
  },
};

const SEA_WIDGET_CSS = `
.sea-widget {
  --sea-widget-bg: #f4f8fc;
  --sea-text: #17324a;
  --sea-muted: rgba(23,50,74,0.68);
  --sea-fainter: rgba(23,50,74,0.16);
  --sea-panel-bg: rgba(255,255,255,0.86);
  --sea-viz-bg-top: rgba(89,165,226,0.10);
  --sea-viz-bg-bottom: rgba(23,50,74,0.00);
  --sea-info-lead: rgba(23,50,74,0.90);
  --sea-info-body: rgba(23,50,74,0.76);
  --sea-thumb-border: rgba(23,50,74,0.16);
  --sea-thumb-bg: rgba(89,165,226,0.10);
  --sea-placeholder: rgba(23,50,74,0.56);
  --sea-legend-item: rgba(23,50,74,0.82);
  --sea-swatch-border: rgba(23,50,74,0.24);
  --sea-tooltip-bg: rgba(255,255,255,0.98);
  --sea-tooltip-border: rgba(23,50,74,0.18);
  --sea-tooltip-text: rgba(17,34,52,0.95);
  --sea-tooltip-muted: rgba(17,34,52,0.72);
  --sea-tooltip-shadow: 0 12px 24px rgba(89,165,226,0.20);
  --sea-button-border: rgba(23,50,74,0.28);
  --sea-button-bg: rgba(89,165,226,0.14);
  --sea-button-bg-hover: rgba(89,165,226,0.22);
  --sea-button-text: #17324a;
  --sea-dim-top-stroke: rgba(23,50,74,0.90);
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  gap: 14px;
  padding: 14px;
  overflow: hidden;
  color: var(--sea-text);
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
  background: var(--sea-widget-bg);
}
.sea-widget.sea-theme-dark {
  --sea-widget-bg: #0b1020;
  --sea-text: #e8ecff;
  --sea-muted: rgba(232,236,255,0.72);
  --sea-fainter: rgba(232,236,255,0.08);
  --sea-panel-bg: rgba(255,255,255,0.02);
  --sea-viz-bg-top: rgba(255,255,255,0.02);
  --sea-viz-bg-bottom: rgba(255,255,255,0.00);
  --sea-info-lead: rgba(232,236,255,0.90);
  --sea-info-body: rgba(232,236,255,0.74);
  --sea-thumb-border: rgba(255,255,255,0.14);
  --sea-thumb-bg: rgba(255,255,255,0.05);
  --sea-placeholder: rgba(232,236,255,0.56);
  --sea-legend-item: rgba(232,236,255,0.82);
  --sea-swatch-border: rgba(255,255,255,0.18);
  --sea-tooltip-bg: rgba(10,14,28,0.92);
  --sea-tooltip-border: rgba(232,236,255,0.14);
  --sea-tooltip-text: rgba(232,236,255,0.95);
  --sea-tooltip-muted: rgba(232,236,255,0.72);
  --sea-tooltip-shadow: 0 12px 30px rgba(0,0,0,0.35);
  --sea-button-border: rgba(232,236,255,0.26);
  --sea-button-bg: rgba(232,236,255,0.08);
  --sea-button-bg-hover: rgba(232,236,255,0.14);
  --sea-button-text: rgba(232,236,255,0.95);
  --sea-dim-top-stroke: rgba(255,255,255,0.92);
}
.sea-widget, .sea-widget * { box-sizing: border-box; }
.sea-widget .sea-widget-main { flex: 1 1 auto; min-width: 620px; min-height: 0; overflow: hidden; }
.sea-widget .sea-widget-viz, .sea-widget .sea-widget-viz > svg { width: 100%; height: 100%; min-height: 520px; }
.sea-widget .sea-widget-viz > svg {
  display: block;
  background: linear-gradient(180deg, var(--sea-viz-bg-top), var(--sea-viz-bg-bottom));
  border: 1px solid var(--sea-fainter);
  border-radius: 14px;
  user-select: none;
  -webkit-user-select: none;
}
.sea-widget .sea-widget-viz, .sea-widget .sea-widget-viz * { user-select: none; -webkit-user-select: none; }
.sea-widget .sea-widget-side {
  flex: 0 0 clamp(320px, 34vw, 360px);
  width: clamp(320px, 34vw, 360px);
  max-width: clamp(320px, 34vw, 360px);
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
.sea-widget .panel { border: 1px solid var(--sea-fainter); border-radius: 12px; background: var(--sea-panel-bg); overflow: hidden; }
.sea-widget .info-panel { display: flex; flex-direction: column; flex: 1 1 clamp(320px, 56vh, 620px); min-height: 0; overflow: hidden; }
.sea-widget .info-panel .panel-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  scrollbar-gutter: stable both-edges;
  scrollbar-width: thin;
  scrollbar-color: rgba(23,50,74,0.28) transparent;
}
.sea-widget.sea-theme-dark .info-panel .panel-body { scrollbar-color: rgba(232,236,255,0.24) transparent; }
.sea-widget .info-panel .panel-body::-webkit-scrollbar { width: 8px; }
.sea-widget .info-panel .panel-body::-webkit-scrollbar-track { background: transparent; }
.sea-widget .info-panel .panel-body::-webkit-scrollbar-thumb {
  background: rgba(23,50,74,0.22);
  border-radius: 999px;
  border: 2px solid transparent;
  background-clip: content-box;
}
.sea-widget.sea-theme-dark .info-panel .panel-body::-webkit-scrollbar-thumb { background: rgba(232,236,255,0.24); }
.sea-widget .legend-panel { margin-top: 0; flex: 0 0 auto; }
.sea-widget .panel-title { padding: 10px 12px; border-bottom: 1px solid var(--sea-fainter); color: var(--sea-muted); font-size: 12px; font-weight: 650; }
.sea-widget .panel-body { padding: 12px; }
.sea-widget .empty { color: var(--sea-muted); font-size: 13px; line-height: 1.35; }
.sea-widget .k { color: var(--sea-muted); font-size: 11px; }
.sea-widget .v { color: var(--sea-text); font-size: 14px; line-height: 1.25; }
.sea-widget .row { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; margin: 8px 0; }
.sea-widget .sea-info-lesson { display: flex; flex-direction: column; gap: 8px; height: 100%; }
.sea-widget .info-media { position: relative; }
.sea-widget .info-init, .sea-widget .info-lesson-fields, .sea-widget .info-dim-fields, .sea-widget .info-module-fields { display: none; }
.sea-widget .sea-info-lesson.mode-init .info-init { display: flex; flex-direction: column; gap: 8px; }
.sea-widget .sea-info-lesson.mode-init .info-lesson-wrap { display: block; }
.sea-widget .sea-info-lesson.mode-lesson .info-lesson-fields { display: flex; flex-direction: column; gap: 8px; }
.sea-widget .sea-info-lesson.mode-lesson .info-lesson-wrap { display: block; }
.sea-widget .sea-info-lesson.mode-dim .info-dim-fields { display: flex; flex-direction: column; gap: 8px; }
.sea-widget .sea-info-lesson.mode-dim .info-lesson-wrap { display: block; }
.sea-widget .sea-info-lesson.mode-module .info-module-fields { display: flex; flex-direction: column; gap: 8px; }
.sea-widget .sea-info-lesson.mode-module .info-lesson-wrap { display: block; }
.sea-widget .info-init-title { font-size: 16px; font-weight: 700; line-height: 1.25; }
.sea-widget .info-init-lead { font-size: 14px; font-weight: 600; line-height: 1.3; color: var(--sea-info-lead); }
.sea-widget .info-init-body { font-size: 12px; line-height: 1.45; color: var(--sea-info-body); max-height: 5.8em; overflow: hidden; }
.sea-widget .info-lesson-title { font-size: 15px; font-weight: 650; line-height: 1.3; }
.sea-widget .info-thumb-wrap { margin-bottom: 2px; position: relative; border-radius: 10px; border: 1px solid var(--sea-thumb-border); background: var(--sea-thumb-bg); overflow: hidden; }
.sea-widget .info-lesson-wrap { height: clamp(118px, 18vh, 140px); }
.sea-widget .info-thumb { width: 100%; height: 100%; object-fit: cover; object-position: center center; display: block; }
.sea-widget .info-thumb-wrap.no-thumb .info-thumb { opacity: 0; }
.sea-widget .info-thumb-wrap.no-thumb::after { content: "No thumbnail"; position: absolute; inset: 0; display: grid; place-items: center; color: var(--sea-placeholder); font-size: 12px; }
.sea-widget .info-action { margin-top: 4px; }
.sea-widget .legend-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 10px; }
.sea-widget .legend-item { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--sea-legend-item); }
.sea-widget .legend-item.is-active { font-weight: 650; }
.sea-widget .swatch { width: 12px; height: 12px; flex: 0 0 12px; border-radius: 3px; border: 1px solid var(--sea-swatch-border); }
.sea-widget .sea-tooltip {
  pointer-events: none;
  position: absolute;
  z-index: 20;
  background: var(--sea-tooltip-bg);
  border: 1px solid var(--sea-tooltip-border);
  color: var(--sea-tooltip-text);
  padding: 8px 10px;
  border-radius: 10px;
  font-size: 12px;
  max-width: 340px;
  box-shadow: var(--sea-tooltip-shadow);
}
.sea-widget .sea-tooltip .t { font-weight: 650; margin-bottom: 2px; }
.sea-widget .sea-tooltip .s { color: var(--sea-tooltip-muted); line-height: 1.25; }
.sea-widget .tipRow { display: flex; gap: 10px; align-items: flex-start; }
.sea-widget .thumb { width: 54px; height: 54px; object-fit: cover; border-radius: 10px; flex: 0 0 auto; opacity: 0.95; }
.sea-widget .tipText { min-width: 0; }
.sea-widget .go-lesson-btn {
  appearance: none;
  border: 1px solid var(--sea-button-border);
  background: var(--sea-button-bg);
  color: var(--sea-button-text);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.sea-widget .go-lesson-btn:hover { background: var(--sea-button-bg-hover); }
.sea-widget .dimHit { pointer-events: all; }
.sea-widget .dimTop { stroke: var(--sea-dim-top-stroke) !important; stroke-width: 2.4px !important; }
.sea-widget .dimIconHalo { pointer-events: none; }
.sea-widget .dimIcon { pointer-events: none; }
.sea-widget.sea-widget-compact { flex-direction: column; height: auto; min-height: 0; overflow: visible; }
.sea-widget.sea-widget-compact .sea-widget-main { min-width: 0; height: auto; flex: 0 0 auto; width: 100%; max-width: 100%; }
.sea-widget.sea-widget-compact .sea-widget-viz,
.sea-widget.sea-widget-compact .sea-widget-viz > svg { min-height: clamp(260px, 52vw, 420px); height: clamp(260px, 52vw, 420px); }
.sea-widget.sea-widget-compact .sea-widget-side { flex: 0 0 auto; width: 100%; max-width: 100%; height: auto; overflow: visible; }
.sea-widget.sea-widget-compact .info-panel { flex: 0 0 auto; max-height: none; }
.sea-widget.sea-widget-compact .info-panel .panel-body { overflow: auto; }
.sea-widget.sea-widget-medium .sea-widget-viz,
.sea-widget.sea-widget-medium .sea-widget-viz > svg { min-height: clamp(360px, 64vw, 620px); height: clamp(360px, 64vw, 620px); }
.sea-widget.sea-widget-small { padding: 8px; gap: 10px; }
.sea-widget.sea-widget-small .sea-widget-viz,
.sea-widget.sea-widget-small .sea-widget-viz > svg { min-height: clamp(280px, 94vw, 420px); height: clamp(280px, 94vw, 420px); }
@media (max-width: 980px) {
  .sea-widget { flex-direction: column; height: auto; min-height: 0; overflow: visible; }
  .sea-widget .sea-widget-main { min-width: 0; height: auto; flex: 0 0 auto; width: 100%; max-width: 100%; }
  .sea-widget .sea-widget-viz,
  .sea-widget .sea-widget-viz > svg { min-height: clamp(260px, 52vw, 420px); height: clamp(260px, 52vw, 420px); }
  .sea-widget .sea-widget-side { flex: 0 0 auto; width: 100%; max-width: 100%; height: auto; overflow: visible; }
  .sea-widget .info-panel { flex: 0 0 auto; max-height: none; }
  .sea-widget .info-panel .panel-body { overflow: auto; }
}
`;

let D3 = null;
let d3LoadPromise = null;
const D3_CDN_URL = "https://d3js.org/d3.v7.min.js";

function getGlobalD3() {
  if (typeof window !== "undefined" && window.d3) return window.d3;
  if (typeof globalThis !== "undefined" && globalThis.d3) return globalThis.d3;
  return null;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

async function ensureD3(options = {}) {
  if (options.d3) {
    D3 = options.d3;
    return;
  }
  const globalD3 = getGlobalD3();
  if (globalD3) {
    D3 = globalD3;
    return;
  }
  if (options.autoLoadD3 === false) {
    throw new Error("D3 is not available. Pass options.d3 or enable autoLoadD3.");
  }
  if (!d3LoadPromise) {
    d3LoadPromise = loadScript(D3_CDN_URL);
  }
  await d3LoadPromise;
  const loaded = getGlobalD3();
  if (!loaded) throw new Error("D3 failed to initialize after script load.");
  D3 = loaded;
}

function isSelectionEmpty(sel) {
  return !sel || sel.empty();
}

let ACTIVE_GRAPH_THEME = GRAPH_THEME.light;

function normalizeTheme(theme) {
  return String(theme || "light").toLowerCase() === "dark" ? "dark" : "light";
}

function getGraphTheme(theme) {
  return GRAPH_THEME[normalizeTheme(theme)];
}

function injectWidgetStyles(root) {
  if (!root) return;
  const style = document.createElement("style");
  style.setAttribute("data-sea-widget-style", "true");
  style.textContent = SEA_WIDGET_CSS;
  root.appendChild(style);
}

/* ===== src/layout.js ===== */

let svg = null;
let mountEl = null;
let mountRoot = null;
let widgetRoot = null;
const WIDGET_MIN_HEIGHT_PX = 520;
let width = 900;
let height = 650;
let layoutBound = false;
let resizeHandler = null;
let rerenderHandler = null;
let resizeRaf = 0;
let rerenderRaf = 0;
let rerenderTimer = 0;
let rerenderLastAt = 0;
let isSmallLayoutActive = false;
let layoutMode = "wide";

function tooltipsEnabled() {
  // Disable tooltips only in extra-small/mobile mode (dimension-icon mode).
  return layoutMode !== "small";
}

function runRerenderNow() {
  if (!rerenderHandler) return;
  if (rerenderRaf) return;
  rerenderRaf = window.requestAnimationFrame(() => {
    rerenderRaf = 0;
    rerenderLastAt = performance.now();
    if (rerenderHandler) rerenderHandler();
  });
}

function scheduleRerender() {
  if (!rerenderHandler) return;
  const now = performance.now();
  const liveInterval = Math.max(16, Number(SEA_OPTIONS.resizeRerenderIntervalMs || 48));
  const settleDelay = Math.max(liveInterval, Number(SEA_OPTIONS.resizeSettleMs || 90));

  // Keep resizing visually live, but cap expensive rerenders to a safe rate.
  if ((now - rerenderLastAt) >= liveInterval) {
    runRerenderNow();
  }

  if (rerenderTimer) {
    window.clearTimeout(rerenderTimer);
    rerenderTimer = 0;
  }
  rerenderTimer = window.setTimeout(() => {
    rerenderTimer = 0;
    runRerenderNow();
  }, settleDelay);
}

function updateLayoutMode() {
  if (!widgetRoot) return;
  const bp = Number(SEA_OPTIONS.compactBreakpoint || 980);
  const smallBpRaw = Number(SEA_OPTIONS.smallBreakpoint || 520);
  const smallBp = Math.max(320, Math.min(bp - 1, smallBpRaw));
  const hysteresis = Math.max(0, Number(SEA_OPTIONS.layoutHysteresis || 24));
  const rootRect = widgetRoot.getBoundingClientRect();
  const w = rootRect.width;
  if (w <= 0) return false;

  const compactEnter = bp;
  const compactExit = bp + hysteresis;
  const smallEnter = smallBp;
  const smallExit = smallBp + hysteresis;

  const compact = (layoutMode === "wide") ? (w <= compactEnter) : (w <= compactExit);
  const small = compact && ((layoutMode === "small") ? (w <= smallExit) : (w <= smallEnter));
  const nextMode = small ? "small" : (compact ? "medium" : "wide");
  const changed = nextMode !== layoutMode;
  layoutMode = nextMode;

  widgetRoot.classList.toggle("sea-widget-compact", nextMode !== "wide");
  widgetRoot.classList.toggle("sea-widget-medium", nextMode === "medium");
  widgetRoot.classList.toggle("sea-widget-small", nextMode === "small");
  isSmallLayoutActive = (nextMode === "small");
  if (nextMode === "small" && !isSelectionEmpty(tooltip)) {
    tooltip.interrupt()
      .style("opacity", 0)
      .style("display", "none")
      .style("left", "-9999px")
      .style("top", "-9999px");
  }
  return changed;
}

function resize() {
  if (isSelectionEmpty(svg)) return false;
  const modeChanged = !!updateLayoutMode();
  const rect = svg.node().getBoundingClientRect();
  const minW = Math.max(200, Number(SEA_OPTIONS.minSimWidth || 280));
  const minH = Math.max(200, Number(SEA_OPTIONS.minSimHeight || 260));
  const nextWidth = Math.max(minW, Math.floor(rect.width));
  const nextHeight = Math.max(minH, Math.floor(rect.height));
  const changed = modeChanged || nextWidth !== width || nextHeight !== height;
  if (!changed) return false;
  width = nextWidth;
  height = nextHeight;
  svg.attr("viewBox", `0 0 ${width} ${height}`);
  return true;
}

function initLayout() {
  if (layoutBound) return;
  layoutBound = true;
  resize();
  resizeHandler = () => {
    if (resizeRaf) return;
    resizeRaf = window.requestAnimationFrame(() => {
      resizeRaf = 0;
      const changed = resize();
      if (changed) scheduleRerender();
    });
  };
  window.addEventListener("resize", resizeHandler);
}

function teardownLayout() {
  if (resizeHandler) window.removeEventListener("resize", resizeHandler);
  if (resizeRaf) {
    window.cancelAnimationFrame(resizeRaf);
    resizeRaf = 0;
  }
  if (rerenderRaf) {
    window.cancelAnimationFrame(rerenderRaf);
    rerenderRaf = 0;
  }
  if (rerenderTimer) {
    window.clearTimeout(rerenderTimer);
    rerenderTimer = 0;
  }
  resizeHandler = null;
  rerenderHandler = null;
  layoutBound = false;
  rerenderLastAt = 0;
  isSmallLayoutActive = false;
  layoutMode = "wide";
}

function resolveContainerElement(containerOption) {
  if (typeof document === "undefined") return null;
  const defaultHost = document.querySelector("#sea-viz") || document.querySelector("#viz");
  if (typeof containerOption === "string") {
    return document.querySelector(containerOption) || defaultHost || null;
  }
  if (containerOption && typeof containerOption === "object" && containerOption.nodeType === 1) {
    return containerOption;
  }
  return defaultHost || null;
}

function setupMount(options = {}) {
  const host = resolveContainerElement(options.container);
  mountEl = host || document.body;
  const useShadowDom = !!mountEl?.attachShadow;
  if (useShadowDom) {
    mountRoot = mountEl.shadowRoot || mountEl.attachShadow({ mode: "open" });
    if (mountRoot.innerHTML != null) mountRoot.innerHTML = "";
  } else {
    mountRoot = mountEl;
    if (mountRoot && mountRoot.innerHTML != null) mountRoot.innerHTML = "";
  }
  injectWidgetStyles(mountRoot);
  widgetRoot = document.createElement("div");
  const resolvedTheme = normalizeTheme(options.theme);
  widgetRoot.className = `sea-widget sea-theme-${resolvedTheme}`;
  ACTIVE_GRAPH_THEME = getGraphTheme(resolvedTheme);

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
  if (mountRoot && mountRoot.appendChild) mountRoot.appendChild(widgetRoot);

  svg = D3.select(svgNode);
  svg.style("width", "100%").style("height", "100%");
  info = D3.select(side.querySelector(".sea-info-body"));
  legend = D3.select(side.querySelector(".sea-legend-body"));

  if (mountEl.style) {
    if (!mountEl.style.width) mountEl.style.width = "100%";
    if (!mountEl.style.height) mountEl.style.height = "100%";
    if (!mountEl.style.minHeight) mountEl.style.minHeight = `${WIDGET_MIN_HEIGHT_PX}px`;
  }
}

const cx = () => width * 0.5;
const cy = () => height * 0.5;
function activePolygonRadiusFactor() {
  const base = Number(CONFIG.polygonRadiusFactor || 0.29);
  if (layoutMode === "small") {
    return Math.max(base, Number(SEA_OPTIONS.smallPolygonRadiusFactor || 0.36));
  }
  if (layoutMode === "medium") {
    return Math.max(base, Number(SEA_OPTIONS.mediumPolygonRadiusFactor || 0.41));
  }
  return base;
}
const R = () => Math.min(width, height) * activePolygonRadiusFactor();

function scaledMinEdgeDistance() {
  const base = Math.max(0, Number(CONFIG.minEdgeDistance || 0));
  if (base <= 0) return 0;
  const refRadius = Math.max(1, Number(CONFIG.minEdgeDistanceRefRadius || 190));
  const minScale = Math.max(0.05, Number(CONFIG.minEdgeDistanceScaleMin || 0.55));
  const maxScale = Math.max(minScale, Number(CONFIG.minEdgeDistanceScaleMax || 1.8));
  const rawScale = R() / refRadius;
  const scale = Math.max(minScale, Math.min(maxScale, rawScale));
  return base * scale;
}

function getViewportNodeScale() {
  const ref = Math.max(320, Number(SEA_OPTIONS.nodeScaleViewportRef || 700));
  const radiusRef = Math.max(60, Number(SEA_OPTIONS.nodeScaleRadiusRef || (ref * activePolygonRadiusFactor())));
  const minScale = Math.max(0.3, Number(SEA_OPTIONS.nodeScaleMin || 0.82));
  const maxScale = Math.max(minScale, Number(SEA_OPTIONS.nodeScaleMax || 1.26));
  const exponent = Math.max(0.3, Number(SEA_OPTIONS.nodeScaleExponent || 1.0));
  const radiusExponent = Math.max(0.3, Number(SEA_OPTIONS.nodeScaleRadiusExponent || 1.0));
  const blend = Math.max(0, Math.min(1, Number(SEA_OPTIONS.nodeScaleBlend || 0.6)));
  const viewport = Math.max(240, Math.min(width, height));
  const radius = Math.max(60, R());
  const viewportScaled = Math.pow(viewport / ref, exponent);
  const radiusScaled = Math.pow(radius / radiusRef, radiusExponent);
  const scaled = (viewportScaled * (1 - blend)) + (radiusScaled * blend);
  return Math.max(minScale, Math.min(maxScale, scaled));
}

/* ===== src/ui.js ===== */
let tooltip = null;

function ensureTooltip() {
  if (!widgetRoot || !isSelectionEmpty(tooltip)) return;
  tooltip = D3.select(widgetRoot)
    .append("div")
    .attr("class", "sea-tooltip")
    .style("display", "none")
    .style("left", "-9999px")
    .style("top", "-9999px")
    .style("opacity", 0);
}

function teardownTooltip() {
  if (!isSelectionEmpty(tooltip)) tooltip.remove();
  tooltip = null;
}

function hideTooltipNow() {
  if (isSelectionEmpty(tooltip)) return;
  tooltip.interrupt()
    .style("opacity", 0)
    .style("display", "none")
    .style("left", "-9999px")
    .style("top", "-9999px");
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

let info = null;
let legend = null;
let infoLessonRefs = null;
let warmedLogoSrc = "";
let infoRenderToken = 0;

function prewarmImage(src) {
  const url = String(src || "").trim();
  if (!url || url === warmedLogoSrc || typeof Image === "undefined") return;
  warmedLogoSrc = url;
  const probe = new Image();
  probe.decoding = "async";
  probe.src = url;
  if (typeof probe.decode === "function") {
    probe.decode().catch(() => {});
  }
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
  root.classList.toggle("mode-dim", mode === "dim");
  root.classList.toggle("mode-module", mode === "module");
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
        <div class="info-thumb-wrap info-lesson-wrap no-thumb">
          <img class="info-thumb info-lesson-thumb" alt="" />
        </div>
      </div>
      <div class="info-init">
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
      <div class="info-dim-fields">
        <div>
          <div class="k">Dimension</div>
          <div class="v js-dim-title"></div>
        </div>
        <div>
          <div class="k">Summary</div>
          <div class="v js-dim-summary"></div>
        </div>
        <div>
          <div class="k">Details</div>
          <div class="v js-dim-details"></div>
        </div>
      </div>
      <div class="info-module-fields">
        <div>
          <div class="v info-lesson-title js-module-panel-title"></div>
        </div>
        <div>
          <div class="k">Module overview</div>
          <div class="v js-module-panel-description"></div>
        </div>
      </div>
    </div>
  `);

  const host = info.node();
  const root = host.querySelector(".sea-info-lesson");
  infoLessonRefs = {
    root,
    lessonWrap: host.querySelector(".info-lesson-wrap"),
    lessonThumb: host.querySelector(".info-lesson-thumb"),
    initTitle: host.querySelector(".js-init-title"),
    initLead: host.querySelector(".js-init-lead"),
    initBody: host.querySelector(".js-init-body"),
    lessonTitle: host.querySelector(".js-lesson-title"),
    chapterTitle: host.querySelector(".js-chapter-title"),
    moduleTitle: host.querySelector(".js-module-title"),
    lessonDescription: host.querySelector(".js-lesson-description"),
    goLessonBtn: host.querySelector(".js-go-lesson"),
    dimTitle: host.querySelector(".js-dim-title"),
    dimSummary: host.querySelector(".js-dim-summary"),
    dimDetails: host.querySelector(".js-dim-details"),
    modulePanelTitle: host.querySelector(".js-module-panel-title"),
    modulePanelDescription: host.querySelector(".js-module-panel-description"),
  };
  if (infoLessonRefs.lessonThumb) {
    infoLessonRefs.lessonThumb.decoding = "async";
    infoLessonRefs.lessonThumb.loading = "eager";
  }
  return infoLessonRefs;
}

function renderInfoInit() {
  const refs = ensureLessonInfoView();
  setInfoMode(refs, "init");

  refs.initTitle.textContent = String(SEA_OPTIONS.infoInitTitle || "Sustainable Energy Academy");
  refs.initLead.textContent = String(SEA_OPTIONS.infoInitLead || "Explore the lesson map.");
  refs.initBody.textContent = String(SEA_OPTIONS.infoInitBody || "Hover or click lessons and dimensions to inspect how content clusters by policy, technology, finance, equity, data, and implementation.");

  refs.goLessonBtn.removeAttribute("data-lesson-id");
  const initImage = String(SEA_OPTIONS.logoUrl || "https://sehseadata.blob.core.windows.net/images/HeaderImages/SEA.png");
  prewarmImage(initImage);
  setThumbState(refs.lessonWrap, refs.lessonThumb, {
    src: initImage,
    alt: "Sustainable Energy Academy",
  });
}

function renderInfo(node) {
  if (!node) {
    const token = ++infoRenderToken;
    window.requestAnimationFrame(() => {
      if (token !== infoRenderToken) return;
      renderInfoInit();
    });
    return;
  }

  infoRenderToken += 1;
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
}

function renderDimInfo(dim) {
  if (!dim) {
    renderInfoInit();
    return;
  }
  infoRenderToken += 1;
  const refs = ensureLessonInfoView();
  setInfoMode(refs, "dim");
  refs.dimTitle.textContent = dim.label || dim.id || "";
  refs.dimSummary.textContent = dim.summary || "";
  refs.dimDetails.textContent = dim.details || "";
  const dimImage = String(dim.image || "").trim();
  if (dimImage) prewarmImage(dimImage);
  setThumbState(refs.lessonWrap, refs.lessonThumb, {
    src: dimImage,
    alt: dimImage ? `${refs.dimTitle.textContent} image` : "",
  });
}

function renderModuleInfo(mod) {
  if (!mod) {
    renderInfoInit();
    return;
  }
  infoRenderToken += 1;
  const refs = ensureLessonInfoView();
  setInfoMode(refs, "module");
  refs.modulePanelTitle.textContent = mod.title || `Module ${mod.id || ""}`;
  refs.modulePanelDescription.textContent = mod.description || "";
  const moduleImg = mod?.image?.src ? String(mod.image.src) : "";
  setThumbState(refs.lessonWrap, refs.lessonThumb, {
    src: moduleImg,
    alt: moduleImg ? `${refs.modulePanelTitle.textContent} image` : "",
  });
}

// Render the module legend in the right panel.
function renderLegend(items) {
  legend.html("");
  const grid = legend.append("div").attr("class", "legend-grid");
  const row = grid.selectAll("div.legend-item")
    .data(items)
    .join("div")
    .attr("class", "legend-item")
    .attr("data-module-id", d => String(d.id));
  row.append("span")
    .attr("class", "swatch")
    .style("background", d => d.color);
  row.append("span").text(d => d.label);
}

function escapeHtml(raw) {
  return String(raw || "").replace(/[&<>"']/g, (ch) => {
    if (ch === "&") return "&amp;";
    if (ch === "<") return "&lt;";
    if (ch === ">") return "&gt;";
    if (ch === "\"") return "&quot;";
    return "&#39;";
  });
}

function renderWidgetErrorState(error, fallbackTarget = null) {
  const message = String(error?.message || error || "Unknown initialization error.");
  if (!isSelectionEmpty(info)) {
    info.html(`
      <div class="empty">
        <div class="v info-lesson-title">Unable to load network visualization.</div>
        <div class="v">${escapeHtml(message)}</div>
      </div>
    `);
  }
  if (!isSelectionEmpty(legend)) legend.html("");
  if (!isSelectionEmpty(svg)) {
    svg.selectAll("*").remove();
    svg.append("text")
      .attr("x", "50%")
      .attr("y", "50%")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("fill", "rgba(180,68,68,0.9)")
      .attr("font-size", 13)
      .text("Unable to load visualization");
    return;
  }
  if (fallbackTarget && fallbackTarget.innerHTML != null) {
    fallbackTarget.innerHTML = `
      <div style="padding:12px;border:1px solid rgba(180,68,68,0.35);border-radius:10px;color:#7a1e1e;background:rgba(255,244,244,0.92);font:13px/1.35 ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">
        <div style="font-weight:650;margin-bottom:4px;">Unable to load network visualization.</div>
        <div>${escapeHtml(message)}</div>
      </div>
    `;
  }
}

function emitWidgetError(error, explicitTarget = null) {
  if (typeof CustomEvent === "undefined") return;
  const target = explicitTarget || mountEl || null;
  const payload = {
    detail: {
      message: String(error?.message || error || "Unknown initialization error."),
      error,
    },
  };
  if (target && typeof target.dispatchEvent === "function") {
    target.dispatchEvent(new CustomEvent("sea-widget:error", payload));
  } else if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
    window.dispatchEvent(new CustomEvent("sea-widget:error", payload));
  }
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
  activeModule: null,
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
      unlockNode(); // locking a dim clears node lock and any pinning
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

function lockNode(n, options = {}) {
  const pin = options.pin !== false;
  if (State.lockedNode && State.lockedNode !== n) {
    State.lockedNode.fx = null;
    State.lockedNode.fy = null;
  }
  State.lockedNode = n;
  if (pin) {
    n.fx = n.x;
    n.fy = n.y;
    n.vx = 0;
    n.vy = 0;
  } else {
    n.fx = null;
    n.fy = null;
  }
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
- Visualize all lessons as nodes inside an N-dimensional polygon (one vertex per theme).
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
  // Public API options
  dataUrls: {},
  data: {},
  lang: "",
  d3: null,
  autoLoadD3: true,
  theme: "light",
  selectedModuleId: null,

  // Internal runtime defaults (not part of public API)
  compactBreakpoint: 980,
  smallBreakpoint: 520,
  layoutHysteresis: 24,
  resizeRerenderIntervalMs: 48,
  resizeSettleMs: 90,
  resizeKickIntervalMs: 120,
  resizeKickAlpha: 0.16,
  mediumPolygonRadiusFactor: 0.41,
  smallPolygonRadiusFactor: 0.44,
  nodeSizeBasePx: 8.2,
  nodeScaleViewportRef: 700,
  nodeScaleRadiusRef: 200,
  nodeScaleMin: 0.82,
  nodeScaleMax: 1.26,
  nodeScaleExponent: 1.0,
  nodeScaleRadiusExponent: 1.0,
  nodeScaleBlend: 0.6,
  nodeScaleDimBoost: 1.08,
  minSimWidth: 280,
  minSimHeight: 260,
  dimIconDir: "",
  logoUrl: "https://sehseadata.blob.core.windows.net/images/HeaderImages/SEA.png",
  infoInitTitle: "Sustainable Energy Academy",
  infoInitLead: "Explore the lesson map.",
  infoInitBody: "Hover or click lessons and dimensions to inspect how content clusters by policy, technology, finance, equity, data, and implementation.",
};
const PUBLIC_OPTION_KEYS = new Set([
  "container",
  "dataUrls",
  "data",
  "lang",
  "d3",
  "autoLoadD3",
  "theme",
  "selectedModuleId",
]);

function normalizePublicOptions(options = {}) {
  const input = options && typeof options === "object" ? options : {};
  const normalized = {};
  const ignored = [];
  Object.keys(input).forEach((k) => {
    if (PUBLIC_OPTION_KEYS.has(k)) {
      normalized[k] = input[k];
    } else {
      ignored.push(k);
    }
  });
  if (ignored.length) {
    console.warn(`[SEA] Ignored unsupported options: ${ignored.join(", ")}`);
  }
  return normalized;
}

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

// Data lookup order is deterministic to make CMS migration straightforward:
// 1) in-memory data passed by host app (SEA_OPTIONS.data)
// 2) explicit per-file URLs (SEA_OPTIONS.dataUrls)
function resolveDataUrl(key) {
  const urls = SEA_OPTIONS.dataUrls || {};
  if (urls[key] != null && String(urls[key]).trim()) return urls[key];
  const file = DATA_FILES[key] || `${key}.json`;
  throw new Error(`[SEA] Missing data source for "${key}". Pass options.data.${key} or options.dataUrls.${key} (e.g. "${file}").`);
}

function withLangParam(url, key) {
  // Language query is only required for module metadata endpoint.
  if (key !== "moduleStructure") return url;
  const rawLang = String(SEA_OPTIONS.lang || "").trim();
  if (!rawLang) return url;
  const rawUrl = String(url || "").trim();
  if (!rawUrl) return rawUrl;
  if (/[?&]lang=/i.test(rawUrl)) return rawUrl;
  const sep = rawUrl.includes("?") ? "&" : "?";
  return `${rawUrl}${sep}lang=${encodeURIComponent(rawLang)}`;
}

async function loadJsonData(key) {
  const inline = SEA_OPTIONS.data || {};
  if (inline[key] != null) return inline[key];
  const url = withLangParam(resolveDataUrl(key), key);
  try {
    return await D3.json(url);
  } catch (err) {
    const reason = (err && err.message) ? err.message : String(err);
    throw new Error(`[SEA] Failed to load "${key}" from "${url}": ${reason}`);
  }
}

function resolveDimensionIconUrl(icon) {
  const raw = String(icon || "").trim();
  if (!raw) return "";
  if (/^(?:https?:)?\/\//i.test(raw) || raw.startsWith("data:") || raw.startsWith("blob:") || raw.startsWith("/") || raw.startsWith("./") || raw.startsWith("../")) {
    return raw;
  }
  const dir = String(SEA_OPTIONS.dimIconDir || "").trim().replace(/\/+$/, "");
  if (!dir) return raw;
  return `${dir}/${raw.replace(/^\/+/, "")}`;
}

function normalizeModuleId(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const num = +raw.replace(/[^\d]/g, "");
  if (Number.isFinite(num) && num > 0) return String(num);
  return raw;
}

function resolveEntityId(entity) {
  if (!entity || typeof entity !== "object") return null;
  const candidates = [entity.id, entity.external_id, entity.strapi_id];
  for (const value of candidates) {
    const raw = String(value ?? "").trim();
    if (raw) return raw;
  }
  return null;
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
  const graphTheme = ACTIVE_GRAPH_THEME || getGraphTheme(SEA_OPTIONS.theme);

  // Build order: geometry → anchors → data → links → nodes → interaction → simulation
  const dimMeta = { dimensions: Array.isArray(graphConfig?.dimensions) ? graphConfig.dimensions : [] };
  const THEMES = (dimMeta?.dimensions || []).map((d) => ({
    id: d.id,
    label: d.label || d.id,
    icon: resolveDimensionIconUrl(d.icon),
  }));
  const dimMap = new Map((dimMeta?.dimensions || []).map(d => [d.id, d]));

  /* ---------- 7.1 Geometry ---------- */
  let A = anchors(THEMES);
  let poly = polygonPoints(A);
  let polySafe = insetPolygon(poly, CONFIG.insetPadding);
  let planes = polygonHalfPlanes(polySafe);

  svg.selectAll("*").remove();
  const g = svg.append("g");

  const ringRadius = () => R() * ((CONFIG.dimHoverInnerFactor + CONFIG.dimHoverOuterFactor) * 0.5);

  // Outer polygon
  const outerPoly = g.append("path")
    .attr("d", D3.line().curve(D3.curveLinearClosed)(poly))
    .attr("fill", graphTheme.outerFill)
    .attr("stroke", graphTheme.outerStroke)
    .attr("stroke-width", 1.2);

  // Dimension hover band
  const hoverRing = g.append("circle")
    .attr("cx", cx())
    .attr("cy", cy())
    .attr("r", ringRadius())
    .attr("fill", "none")
    .attr("stroke", graphTheme.hoverRing)
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
    .attr("fill", graphTheme.anchorDot)
    .style("pointer-events", "none");

  function splitDimensionLabel(raw) {
    const text = String(raw || "").replace(/\s+/g, " ").trim();
    if (!text) return [""];
    const viaDelimiter = text.split(/\s+(?:&|\/)\s+/).map(s => s.trim()).filter(Boolean);
    if (viaDelimiter.length === 2) return viaDelimiter;
    if (text.length <= 22) return [text];
    const words = text.split(" ");
    let left = [];
    let right = [];
    const half = Math.ceil(words.length / 2);
    left = words.slice(0, half);
    right = words.slice(half);
    return [left.join(" "), right.join(" ")].filter(Boolean);
  }

  function clampPointToViewport(x, y, pad = 0) {
    const p = Math.max(0, Number(pad) || 0);
    return {
      x: Math.max(p, Math.min(width - p, x)),
      y: Math.max(p, Math.min(height - p, y)),
    };
  }

  function anchorLabelCenter(ad) {
    const outward = Math.max(26, Math.min(54, R() * 0.18));
    const rawX = ad.x + Math.cos(ad.ang) * outward;
    const rawY = ad.y + Math.sin(ad.ang) * outward;
    return clampPointToViewport(rawX, rawY, 28);
  }

  function dimHitRadius() {
    const factor = isSmallLayoutActive ? 0.20 : 0.24;
    return Math.max(24, Math.min(86, R() * factor));
  }

  function applyAnchorTextLayout(selection) {
    selection
      .attr("x", d => anchorLabelCenter(d).x)
      .attr("y", d => anchorLabelCenter(d).y)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .each(function(d) {
        const lines = splitDimensionLabel(d.label);
        const textSel = D3.select(this);
        textSel.selectAll("tspan").remove();
        lines.forEach((line, idx) => {
          textSel.append("tspan")
            .attr("x", anchorLabelCenter(d).x)
            .attr("dy", idx === 0 ? (lines.length > 1 ? -6 : 0) : 12)
            .text(line);
        });
      });
  }

  // Dimension label (hover/click)
  const anchorText = anchorG.append("text")
    .attr("class", "dimLabel")
    .attr("font-size", 11.5)
    .attr("fill", graphTheme.anchorText)
    .style("cursor", "pointer")
    .style("pointer-events", "all");
  applyAnchorTextLayout(anchorText);

  const anchorIconHalo = anchorG.append("circle")
    .attr("class", "dimIconHalo")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", 13)
    .attr("fill", "rgba(255,255,255,0.72)")
    .attr("stroke", graphTheme.outerStroke)
    .attr("stroke-width", 1.2)
    .style("display", "none")
    .style("opacity", 0);

  const anchorIcon = anchorG.append("image")
    .attr("class", "dimIcon")
    .attr("href", d => d.icon || "")
    .attr("width", 18)
    .attr("height", 18)
    .attr("x", d => d.x - 9)
    .attr("y", d => d.y - 9)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("filter", "grayscale(1) brightness(0.62) contrast(0.9)")
    .style("display", "none")
    .style("opacity", 0)
    .style("pointer-events", "none");

  // Placeholders avoid temporal-dead-zone errors if users hover dimensions
  // before data/nodes/simulation are fully initialized.
  let nodes = [];
  let nodesSel = D3.select(null);
  let ringSel = D3.select(null);
  let sim = null;
  let moduleMetaByKey = new Map();

  function anchorIconSize(ad) {
    const focusDim = (State.lockedDim || State.activeDim);
    if (State.lockedDim && ad.id === State.lockedDim) return 21;
    if (focusDim && ad.id === focusDim) return 20;
    return 18;
  }

  function anchorIconCenter(ad) {
    const ringRatio = ((CONFIG.dimHoverInnerFactor + CONFIG.dimHoverOuterFactor) * 0.5);
    const ratio = Math.min(CONFIG.dimHoverOuterFactor - 0.01, ringRatio + 0.11);
    const rawX = cx() + Math.cos(ad.ang) * (R() * ratio);
    const rawY = cy() + Math.sin(ad.ang) * (R() * ratio);
    const pad = anchorIconHaloRadius(ad) + 4;
    return clampPointToViewport(rawX, rawY, pad);
  }

  function anchorIconHaloRadius(ad) {
    return anchorIconSize(ad) * 0.5 + 5;
  }

  function applyAnchorLabelMode() {
    const iconMode = !!isSmallLayoutActive;
    if (!iconMode) hideDimIconTooltip();
    applyAnchorTextLayout(anchorText);
    anchorText.style("display", d => (iconMode && d.icon) ? "none" : null);
    anchorIconHalo
      .style("display", d => (iconMode && d.icon) ? null : "none")
      .style("opacity", d => {
        if (!iconMode || !d.icon) return 0;
        if (State.lockedDim && d.id !== State.lockedDim) return 0.36;
        if ((State.lockedDim || State.activeDim) && d.id === (State.lockedDim || State.activeDim)) return 0.68;
        return 0.52;
      })
      .attr("r", d => anchorIconHaloRadius(d))
      .attr("cx", d => anchorIconCenter(d).x)
      .attr("cy", d => anchorIconCenter(d).y)
      .attr("stroke", d => (State.lockedDim && d.id === State.lockedDim) ? "rgba(255,168,64,0.98)" : graphTheme.outerStroke);
    anchorIcon
      .style("display", d => (iconMode && d.icon) ? null : "none")
      .style("opacity", d => {
        if (!iconMode || !d.icon) return 0;
        if (State.lockedDim && d.id !== State.lockedDim) return 0.34;
        if ((State.lockedDim || State.activeDim) && d.id === (State.lockedDim || State.activeDim)) return 0.64;
        return 0.48;
      })
      .attr("width", d => anchorIconSize(d))
      .attr("height", d => anchorIconSize(d))
      .attr("x", d => anchorIconCenter(d).x - (anchorIconSize(d) * 0.5))
      .attr("y", d => anchorIconCenter(d).y - (anchorIconSize(d) * 0.5));
  }

  function showDimIconTooltip(event, ad) {
    if (!tooltipsEnabled()) { hideTooltipNow(); return; }
    if (!isSmallLayoutActive || !ad || isSelectionEmpty(tooltip) || !widgetRoot) return;
    const rect = widgetRoot.getBoundingClientRect();
    const tx = event.clientX - rect.left + 12;
    const ty = event.clientY - rect.top - 12;
    tooltip.interrupt();
    tooltip.html(`<div class="t">${ad.label || ad.id}</div>`)
      .style("display", "block")
      .style("left", tx + "px")
      .style("top", ty + "px")
      .style("opacity", 1);
  }

  function hideDimIconTooltip() {
    hideTooltipNow();
  }

  // Large hit target around vertex
  const dimHitSel = anchorG.append("circle")
    .attr("cx", d => d.x).attr("cy", d => d.y)
    .attr("r", dimHitRadius())
    .attr("class", "dimHit")
    .attr("fill", "transparent")
    .style("cursor", "pointer");

  function dimEnter(event, ad) { setDim(ad.id, false); showDimIconTooltip(event, ad); updateDimTop(); styleAll(); kickSim(0.32); }
  function dimLeave(event, ad) { setDim(null, false); hideDimIconTooltip(); updateDimTop(); styleAll(); kickSim(0.32); }

  anchorText.on("mouseenter", dimEnter).on("mouseleave", dimLeave)
    .on("click", (event, ad) => {
      event.stopPropagation();
      maybeExitModuleModeForNonModuleClick();
      setDim(ad.id, true);
      if (State.lockedDim) {
        renderDimInfo(dimMap.get(State.lockedDim) || { id: State.lockedDim, label: ad.label });
      } else {
        if (State.activeModule) {
          renderModuleInfo(moduleMetaByKey.get(State.activeModule) || { id: State.activeModule, title: `Module ${State.activeModule}` });
        } else {
          renderInfo(null);
        }
      }
      updateDimTop();
      styleAll();
      kickSim(0.32);
    });

  dimHitSel.on("mouseenter", dimEnter).on("mouseleave", dimLeave)
    .on("mousemove", (event, ad) => { showDimIconTooltip(event, ad); })
    .on("click", (event, ad) => {
      event.stopPropagation();
      maybeExitModuleModeForNonModuleClick();
      setDim(ad.id, true);
      showDimIconTooltip(event, ad);
      if (State.lockedDim) {
        renderDimInfo(dimMap.get(State.lockedDim) || { id: State.lockedDim, label: ad.label });
      } else {
        if (State.activeModule) {
          renderModuleInfo(moduleMetaByKey.get(State.activeModule) || { id: State.activeModule, title: `Module ${State.activeModule}` });
        } else {
          renderInfo(null);
        }
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
    const p = D3.pointer(event, svg.node());
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
          const id = resolveEntityId(l);
          const img = l?.image?.src || l?.frame?.src || chImg || modImg || null;
          if (id && img) map.set(id, img);
        }
      }
    }
    return map;
  }
  const thumbMap = buildThumbMap(moduleStructure);

  nodes = nodesRaw.map(d => ({...d}));
  nodes.forEach(n => {
    n.thumb = thumbMap.get(n.lesson_id) || null;

    // weights
    n.weights = {};
    THEMES.forEach(t => n.weights[t.id] = +n[t.id] || 0);
    normalizeWeights(n.weights);

    // module numeric for color scale
    n.__moduleNum = +String(n.module_id).replace(/[^\d]/g,"") || +n.module_id || 0;
    n.__moduleKey = normalizeModuleId(n.module_id) || String(n.__moduleNum);

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
  const moduleMetaByNum = new Map();
  moduleMetaByKey = new Map();
  (moduleStructure?.modules || []).forEach((m) => {
    const moduleId = resolveEntityId(m);
    const key = normalizeModuleId(moduleId) || String(moduleId || "");
    const num = +String(moduleId ?? "").replace(/[^\d]/g,"") || +moduleId || 0;
    const meta = {
      key,
      id: moduleId || m.id || m.external_id || m.strapi_id,
      num,
      title: m.title || `Module ${moduleId || ""}`.trim(),
      color: m.color || null,
      image: m.image || null,
      description: m.description || "",
      icon: m.icon || "",
    };
    if (num) moduleMetaByNum.set(num, meta);
    moduleMetaByKey.set(key, meta);
  });
  const moduleColors = moduleNums.map((num, idx) =>
    moduleMetaByNum.get(num)?.color || FALLBACK_MODULE_COLORS[idx % FALLBACK_MODULE_COLORS.length]
  );
  const color = D3.scaleOrdinal(moduleNums, moduleColors);

  // Legend (module order + colors)
  const legendItems = moduleNums.map(num => ({
    id: normalizeModuleId(num) || String(num),
    label: moduleMetaByNum.get(num)?.title || `Module ${num}`,
    color: color(num),
  }));
  renderLegend(legendItems);

  function activeLegendModuleKey() {
    if (State.lockedNode) return normalizeModuleId(State.lockedNode.module_id) || State.lockedNode.__moduleKey || null;
    return State.activeModule || null;
  }

  function updateLegendHighlight() {
    const activeKey = activeLegendModuleKey();
    if (isSelectionEmpty(legend)) return;
    legend.selectAll(".legend-item")
      .classed("is-active", d => !!activeKey && String(d.id) === String(activeKey))
      .style("opacity", d => {
        if (!activeKey) return 1;
        return String(d.id) === String(activeKey) ? 1 : 0.58;
      });
  }

  function setActiveModuleSelection(moduleId, options = {}) {
    const next = normalizeModuleId(moduleId);
    if (!options.force && next === State.activeModule) {
      // Idempotent guard: repeated external calls with same module id should not
      // reset node selection or overwrite the current info panel state.
      return;
    }
    State.activeModule = next || null;
    if (State.activeModule) {
      unlockNode();
      State.hoverNode = null;
      State.hoverPointer = null;
      State.lockedDim = null;
      State.activeDim = null;
      State.dimBiasTarget = 0.0;
    }
    if (options.render !== false) {
      if (State.activeModule) {
        renderModuleInfo(moduleMetaByKey.get(State.activeModule) || { id: State.activeModule, title: `Module ${State.activeModule}` });
      } else if (!State.activeModule && !State.lockedNode && !State.lockedDim && !State.activeDim) {
        renderInfo(null);
      }
    }
    styleAll();
    if (options.kick !== false) kickSim(0.18);
  }

  // Link layers
  const linkG = g.append("g").attr("class", "links");
  const topoSel = linkG.selectAll("line.topo")
    .data(topoLinks)
    .join("line")
    .attr("class", "topo")
    .attr("stroke", graphTheme.topoStroke)
    .attr("stroke-width", 1.0);

  let focusTopoSel = linkG.append("g").attr("class", "focusLinks")
    .selectAll("line.focusTopo");

  const dimSel = linkG.selectAll("line.dim")
    .data(dimLinks)
    .join("line")
    .attr("class", d => `dim dim-${d.dim}`)
    .attr("stroke", graphTheme.dimStroke)
    .attr("stroke-width", 1.0);

  /* ---------- 7.5 Nodes ---------- */
  // Node layer (hexagons)
  const nodeG = g.append("g").attr("class", "nodes");

  function hexPath(r) {
    const a = Math.PI/3;
    const pts = D3.range(6).map(i => [Math.cos(a*i)*r, Math.sin(a*i)*r]);
    return "M" + pts.map(p => p.join(",")).join("L") + "Z";
  }

  nodesSel = nodeG.selectAll("path.node")
    .data(nodes, d => d.lesson_id)
    .join("path")
    .attr("class", "node")
    .attr("d", d => hexPath(d.size))
    .attr("fill", d => color(d.__moduleNum))
    .attr("stroke", graphTheme.nodeStroke)
    .attr("stroke-width", 1.0)
    .style("cursor", "pointer");

  // White highlight ring for "same module as hovered/locked node"
  ringSel = nodeG.selectAll("path.ring")
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
    if (!tooltipsEnabled()) { hideTooltipNow(); return; }
    if (isSelectionEmpty(tooltip) || !widgetRoot) return;
    const rect = widgetRoot.getBoundingClientRect();
    const tx = event.clientX - rect.left + 12;
    const ty = event.clientY - rect.top - 12;
    tooltip.interrupt();
    tooltip.html(buildTooltipHTML(d))
      .style("display", "block")
      .style("left", tx + "px")
      .style("top", ty + "px")
      .transition().duration(90)
      .style("opacity", 1);
  }

  function hideTooltip() {
    if (!tooltipsEnabled()) { hideTooltipNow(); return; }
    if (isSelectionEmpty(tooltip)) return;
    tooltip.interrupt();
    tooltip
      .transition()
      .duration(120)
      .style("opacity", 0)
      .on("end", () => {
        tooltip.style("display", "none").style("left", "-9999px").style("top", "-9999px");
      });
  }

  function nodeModuleKey(node) {
    return normalizeModuleId(node?.module_id) || node?.__moduleKey || null;
  }

  function maybeExitModuleModeForNodeClick(node) {
    if (!State.activeModule) return false;
    const keep = nodeModuleKey(node) === State.activeModule;
    if (keep) return false;
    setActiveModuleSelection(null, { render: false, kick: false });
    return true;
  }

  function maybeExitModuleModeForNonModuleClick() {
    if (!State.activeModule) return false;
    setActiveModuleSelection(null, { render: false, kick: false });
    return true;
  }

  function nodeEnter(event, d) {
    const p = D3.pointer(event, svg.node());
    setHoverNode(d, {x:p[0], y:p[1]});
    showTooltip(event, d);
    if (!State.lockedNode && !State.activeModule) renderInfo(d);
    styleAll();
    kickSim(0.32);
  }

  function nodeMove(event, d) {
    const p = D3.pointer(event, svg.node());
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

    maybeExitModuleModeForNodeClick(d);

    // Always lock (do not toggle off here). Unlock by clicking the background.
    lockNode(d, { pin: true });
    updateFocusLinks();
    renderInfo(d);
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

    maybeExitModuleModeForNodeClick(d);

    lockNode(d, { pin: true });
    updateFocusLinks();
    renderInfo(d);
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
    const clearedModule = maybeExitModuleModeForNonModuleClick();
    if (clearedModule || State.lockedNode || State.lockedDim || State.activeDim || State.activeModule) {
      clearFocus();
      if (State.activeModule) {
        renderModuleInfo(moduleMetaByKey.get(State.activeModule) || { id: State.activeModule, title: `Module ${State.activeModule}` });
      } else {
        renderInfo(null);
      }
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
  let dragBodyUserSelect = "";
  const drag = D3.drag()
    .on("start", (event, d) => {
      /* stopPropagation handled by pointerdown */
      d.__down = { x: event.x, y: event.y, moved: false, dragging: false };
      // Do not lock on down; a pure click should lock via nodeClick.
      if (document?.body) {
        dragBodyUserSelect = document.body.style.userSelect || "";
        document.body.style.userSelect = "none";
      }
    })
    .on("drag", (event, d) => {
      const p = D3.pointer(event, svg.node());
      const dx = p[0] - (d.__down?.x ?? p[0]);
      const dy = p[1] - (d.__down?.y ?? p[1]);
      const moved = (dx*dx + dy*dy) > 16; // 4px threshold

      if (d.__down && moved) d.__down.moved = true;
      if (d.__down && d.__down.moved && !d.__down.dragging) {
        d.__down.dragging = true;
        lockNode(d, { pin: true });
        updateFocusLinks();
        renderInfo(d);
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
      if (document?.body) document.body.style.userSelect = dragBodyUserSelect;

      if (wasDrag) {
        if (State.lockedNode === d) {
          d.fx = d.x;
          d.fy = d.y;
        } else {
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
    const nodePxBase = Math.max(1, Number(SEA_OPTIONS.nodeSizeBasePx || 8.2));
    const nodeViewportScale = getViewportNodeScale() * ((f.type === "dim") ? Math.max(0.7, Number(SEA_OPTIONS.nodeScaleDimBoost || 1.08)) : 1);

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
      n.size += (n.sizeTarget * nodePxBase * nodeViewportScale - n.size) * CONFIG.sizeEase;
    });
  }

  function styleAll() {
    // Node size & position are driven by tick. This only adjusts visual emphasis.
    const f = focusDescriptor();
    const moduleKey = (State.lockedDim || State.activeDim) ? null : State.activeModule;

    nodesSel
      .attr("stroke", d => {
        if (State.lockedNode && d === State.lockedNode) return "rgba(255,168,64,0.95)";
        if (State.hoverNode && d === State.hoverNode) return graphTheme.focusStroke;
        if (moduleKey && d.__moduleKey === moduleKey) return graphTheme.focusStroke;
        if (d === f.node && (f.type === "node" || f.type === "hover")) return graphTheme.focusStroke;
        return graphTheme.nodeStroke;
      })
      .attr("stroke-width", d => {
        if (State.lockedNode && d === State.lockedNode) return 3.0;
        if (State.hoverNode && d === State.hoverNode) return 2.4;
        if (moduleKey && d.__moduleKey === moduleKey) return 2.0;
        if (d === f.node && (f.type === "node" || f.type === "hover")) return 2.4;
        return 1.0;
      })
      .attr("fill-opacity", d => {
        if (moduleKey) return d.__moduleKey === moduleKey ? 0.95 : 0.24;
        return 0.92;
      });

    // Rings: show for same-module nodes when hovering/locked
    const ref = (State.lockedNode || State.hoverNode);
    const refMod = ref ? (normalizeModuleId(ref.module_id) || ref.__moduleKey) : null;
    const ringModule = refMod || moduleKey;
    ringSel
      .attr("stroke", d => (ringModule && d.__moduleKey === ringModule && d !== ref) ? graphTheme.moduleRing : "rgba(0,0,0,0)")
      .attr("stroke-width", d => (ringModule && d.__moduleKey === ringModule && d !== ref) ? 2.0 : 0);

    // Dimension text cue when locked
    anchorText
      .style("font-weight", a => (State.lockedDim && a.id === State.lockedDim) ? 800 : (((State.lockedDim || State.activeDim) && a.id === (State.lockedDim || State.activeDim)) ? 700 : 500))
      .style("fill", a => (State.lockedDim && a.id === State.lockedDim) ? "rgba(255,168,64,0.98)" : graphTheme.anchorText)
      .style("text-decoration", a => (State.activeDim && !State.lockedDim && a.id === State.activeDim) ? "underline" : "none")
      .style("opacity", a => (State.lockedDim && a.id !== State.lockedDim) ? 0.65 : 1);
    updateLegendHighlight();
    applyAnchorLabelMode();
  
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
      .attr("stroke", d => (State.activeDim === d.dim) ? graphTheme.dimLinkActive : graphTheme.dimLinkInactive)
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
  
  // Keep a tiny heartbeat so drift/jitter + size easing remain perceptible even after settling.
  // Without this, the simulation cools to a stop and time-based drift appears to "turn off".
  function updateHeartbeat() {
    if (!sim) return;
    const moving = (CONFIG.driftStrength > 0) || (CONFIG.jitterStrength > 0) || (State.activeDim != null) || (State.hoverNode != null) || (State.lockedNode != null);
    sim.alphaTarget(moving ? 0.018 : 0.010);
  }
  let tickFailed = false;
  sim = D3.forceSimulation(nodes)
    .alphaDecay(0.018)
    .velocityDecay(0.38)
    .force("collide", D3.forceCollide().radius(collideRadius).strength(CONFIG.collideStrength))
    .force("charge", D3.forceManyBody().strength(-0.9))
    .on("tick", () => {
      if (tickFailed) return;
      try {
        applyField(sim.alpha());
        updateHeartbeat();
        const edgeMargin = scaledMinEdgeDistance();

        // integrate constraints
        nodes.forEach(n => {
          if (n.fx != null && n.fy != null) {
            n.x = n.fx; n.y = n.fy;
            n.vx *= 0.4; n.vy *= 0.4;
          }
          // hard clamp + soft barrier
          clampToPolygon(n, planes);
          softBarrier(n, planes, edgeMargin);
        });

        // visuals
        updateSizes();
        nodesSel.attr("transform", d => `translate(${d.x},${d.y})`).attr("d", d => hexPath(d.size));
        ringSel.attr("transform", d => `translate(${d.x},${d.y})`).attr("d", d => hexPath(d.size*1.25));
        updateLinks();
      } catch (err) {
        tickFailed = true;
        const error = (err instanceof Error) ? err : new Error(String(err));
        console.error("[SEA] Simulation tick failed:", error);
        emitWidgetError(error);
        if (sim) sim.stop();
      }
    });

  function kickSim(a){ if(sim){ updateHeartbeat(); sim.alpha(a).restart(); } }

  // Initial styling
  styleAll();
  if (SEA_OPTIONS.selectedModuleId != null && SEA_OPTIONS.selectedModuleId !== "") {
    setActiveModuleSelection(SEA_OPTIONS.selectedModuleId, { kick: false });
  }
  let prevCx = cx();
  let prevCy = cy();
  let prevRadius = Math.max(1, R());
  let lastResizeKickAt = 0;

  rerenderHandler = () => {
    const nextCx = cx();
    const nextCy = cy();
    const nextRadius = Math.max(1, R());
    const scaleRaw = nextRadius / Math.max(1, prevRadius);
    const scale = Math.max(0.35, Math.min(3, scaleRaw));

    // Scale around centroid to preserve relative layout across responsive size changes.
    nodes.forEach(n => {
      n.x = nextCx + (n.x - prevCx) * scale;
      n.y = nextCy + (n.y - prevCy) * scale;
      if (n.fx != null) n.fx = nextCx + (n.fx - prevCx) * scale;
      if (n.fy != null) n.fy = nextCy + (n.fy - prevCy) * scale;
    });

    // Recompute geometry based on new size.
    A = anchors(THEMES);
    poly = polygonPoints(A);
    polySafe = insetPolygon(poly, CONFIG.insetPadding);
    planes = polygonHalfPlanes(polySafe);

    // Update static geometry
    outerPoly.attr("d", D3.line().curve(D3.curveLinearClosed)(poly));
    hoverRing
      .attr("cx", cx())
      .attr("cy", cy())
      .attr("r", ringRadius());

    anchorG.data(A);
    anchorDot.data(A).attr("cx", d => d.x).attr("cy", d => d.y);
    anchorText.data(A);
    anchorIconHalo.data(A);
    anchorIcon.data(A)
      .attr("href", d => d.icon || "");
    dimHitSel.data(A)
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", dimHitRadius());
    applyAnchorLabelMode();

    // Update base targets for new center/anchors
    recomputeBaseTargets();

    prevCx = nextCx;
    prevCy = nextCy;
    prevRadius = nextRadius;
    const now = performance.now();
    const kickEvery = Math.max(16, Number(SEA_OPTIONS.resizeKickIntervalMs || 120));
    if ((now - lastResizeKickAt) >= kickEvery) {
      const alpha = Math.max(0.01, Math.min(0.6, Number(SEA_OPTIONS.resizeKickAlpha || 0.16)));
      kickSim(alpha);
      lastResizeKickAt = now;
    }
  };

  return {
    setModuleSelection(moduleId) {
      setActiveModuleSelection(moduleId);
    },
    clearModuleSelection() {
      setActiveModuleSelection(null);
    },
    getModuleSelection() {
      return State.activeModule || null;
    },
    // Runtime-level cleanup used by integration-level destroy().
    // Stops forces and unbinds per-instance SVG handlers.
    destroy() {
      rerenderHandler = null;
      svg.on("mousemove", null).on("mouseleave", null).on("click", null);
      if (document?.body) document.body.style.userSelect = dragBodyUserSelect;
      if (sim) {
        sim.stop();
        sim = null;
      }
      if (!isSelectionEmpty(svg)) {
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
- dataUrls: per-file URL overrides { graphConfig, moduleStructure }
- data: optional in-memory payloads with same keys as dataUrls
- lang: optional UI language code; appended as ?lang=<code> to moduleStructure URL fetch
- d3: optional injected D3 instance
- autoLoadD3: if true, loads D3 from the built-in CDN URL when not injected/global
- theme: "light" | "dark" (default "light")
- selectedModuleId: optional initial module selection id ("1", "2", ...)
- unsupported option keys are ignored with a console warning

Instance:
- svg: mounted svg DOM node
- config: live config object for diagnostics
- setModuleSelection(moduleId): externally trigger module mode
- clearModuleSelection(): clear externally selected module mode
- getModuleSelection(): read current external module selection
- destroy(): full cleanup for React unmount/toggle transitions

Errors:
- Promise rejects on initialization/data-load failures
- mount container dispatches CustomEvent "sea-widget:error" with { message, error } (falls back to window)
*/
async function createSEALessonMap(options = {}) {
  const token = ++createToken;
  if (activeInstance && typeof activeInstance.destroy === "function") {
    activeInstance.destroy();
  }
  const errorTarget = resolveContainerElement(options?.container);

  try {
    resetConfig();
    resetState();
    const publicOptions = normalizePublicOptions(options);
    SEA_OPTIONS = {
      ...DEFAULT_SEA_OPTIONS,
      ...publicOptions,
    };
    prewarmImage(String(SEA_OPTIONS.logoUrl || "https://sehseadata.blob.core.windows.net/images/HeaderImages/SEA.png"));
    await ensureD3(SEA_OPTIONS);
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
        setModuleSelection() {},
        clearModuleSelection() {},
        getModuleSelection() { return null; },
        destroy() {},
      };
    }

    let destroyed = false;
    const instance = {
      svg: svg.node(),
      config: CONFIG,
      setModuleSelection(moduleId) {
        if (!runtime || typeof runtime.setModuleSelection !== "function") return;
        SEA_OPTIONS.selectedModuleId = moduleId;
        runtime.setModuleSelection(moduleId);
      },
      clearModuleSelection() {
        if (!runtime || typeof runtime.clearModuleSelection !== "function") return;
        SEA_OPTIONS.selectedModuleId = null;
        runtime.clearModuleSelection();
      },
      getModuleSelection() {
        if (!runtime || typeof runtime.getModuleSelection !== "function") return null;
        return runtime.getModuleSelection();
      },
      // Integration-level cleanup:
      // removes listeners, tooltip, simulation and mounted svg content.
      destroy() {
        if (destroyed) return;
        destroyed = true;
        if (runtime && typeof runtime.destroy === "function") runtime.destroy();
        teardownLayout();
        teardownTooltip();
        info.on("click.seaGoLesson", null);
        if (mountRoot && mountRoot.innerHTML != null) {
          mountRoot.innerHTML = "";
        } else if (widgetRoot && widgetRoot.parentNode) {
          widgetRoot.parentNode.removeChild(widgetRoot);
        } else if (!isSelectionEmpty(svg)) {
          svg.selectAll("*").remove();
        }
        svg = null;
        info = null;
        legend = null;
        mountEl = null;
        mountRoot = null;
        widgetRoot = null;
        if (activeInstance === instance) activeInstance = null;
      },
    };
    activeInstance = instance;
    return instance;
  } catch (err) {
    const error = (err instanceof Error) ? err : new Error(String(err));
    console.error("[SEA] createSEALessonMap failed", {
      message: error.message,
      stack: error.stack,
      container: (typeof options?.container === "string")
        ? options.container
        : ((options?.container && options.container.tagName) ? options.container.tagName : null),
      hasDataGraphConfig: !!(options?.data && options.data.graphConfig),
      hasDataModuleStructure: !!(options?.data && options.data.moduleStructure),
      dataUrlGraphConfig: options?.dataUrls?.graphConfig || null,
      dataUrlModuleStructure: options?.dataUrls?.moduleStructure || null,
      lang: options?.lang || null,
      autoLoadD3: options?.autoLoadD3 !== false,
      hasInjectedD3: !!options?.d3,
    });
    emitWidgetError(error, errorTarget);
    renderWidgetErrorState(error, errorTarget);
    if (!isSelectionEmpty(info)) info.on("click.seaGoLesson", null);
    teardownLayout();
    teardownTooltip();
    throw error;
  }
}

if (typeof window !== "undefined") {
  window.createSEALessonMap = createSEALessonMap;
  window.setSEALessonMapModule = (moduleId) => {
    if (activeInstance && typeof activeInstance.setModuleSelection === "function") {
      activeInstance.setModuleSelection(moduleId);
    }
  };
  window.clearSEALessonMapModule = () => {
    if (activeInstance && typeof activeInstance.clearModuleSelection === "function") {
      activeInstance.clearModuleSelection();
    }
  };
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    createSEALessonMap,
    default: createSEALessonMap,
  };
}
