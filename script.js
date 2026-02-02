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

/* =========================
   1) Configuration & Themes
   ========================= */

const THEMES = [
  { id: "policy",          label: "Policy & Governance" },
  { id: "technology",      label: "Technology & Systems" },
  { id: "finance",         label: "Finance & Markets" },
  { id: "equity",          label: "Equity & Social Impact" },
  { id: "data",            label: "Data / Digital / Modeling" },
  { id: "implementation",  label: "Implementation & Practice" },
];

const CONFIG = {
  // Geometry
  polygonRadiusFactor: 0.29,
  insetPadding: 38,               // keeps nodes away from edges (safe polygon inset)
  minEdgeDistance: 20,            // extra margin enforced by soft barrier

  // Motion
  driftStrength: 0.074,           // subtle always-on drift (increase slightly if desired)
  jitterStrength: 0.78,           // per-node static jitter prevents honeycomb settling
  centerTether: 0.003,
  outwardBias: 0.001,           // pushes nodes away from center (balanced by barrier)
            // keeps centroid near center without over-regularizing

  // Collision
  collidePadding: 0.89,           // collision radius multiplier padding
  collideStrength: 0.02,

  // Focus forces (dimension/node)
  dimBiasMax: 1.69,               // max scaling when a dim is active
  dimBiasRamp: 0.2,              // ramp speed to avoid impulses
  nodeSimStrength: 0.72,          // similarity pull/push intensity
  nodeRepel: 0.96,                // repel for dissimilar nodes under focus

  // Animation
  sizeEase: 0.06,                 // smoothing for size changes
  posEase: 0.085,                  // smoothing for target position changes

  // Sizing lens (distance-based)
  lensNone:   { inner: 0,   outer: 0,   power: 1.05, a: 1.20, b: 0.70, scale: 1.05 },
  lensFocus:  { inner: 85,  outer: 280, power: 2.35, a: 1.65, b: 0.55, scale: 0.92 },

  // Links
  topoNeighbors: 2,
  dimTopK: 10,
};

/* =========================
   2) Canvas & Layout Helpers
   ========================= */

const svg = d3.select("#viz");
let width = 900, height = 650;

function resize() {
  const rect = svg.node().getBoundingClientRect();
  width  = Math.max(640, Math.floor(rect.width));
  height = Math.max(520, Math.floor(rect.height));
  svg.attr("viewBox", `0 0 ${width} ${height}`);
}
resize();

window.addEventListener("resize", () => {
  resize();
  if (window.__rerender) window.__rerender();
});

const cx = () => width * 0.5;
const cy = () => height * 0.5;
const R  = () => Math.min(width, height) * CONFIG.polygonRadiusFactor;

/* Tooltip */
const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

function buildTooltipHTML(d) {
  const img = d.thumb ? `<img class="thumb" src="${d.thumb}" alt=""/>` : ``;
  return `
    <div class="tipRow">${img}<div class="tipText">
      <div class="t">${d.lesson_id} — ${d.lesson_title || "(untitled)"}</div>
      <div class="s">Module ${d.module_id}: ${d.module_title || ""}<br/>${d.chapter_title || ""}</div>
    </div></div>
  `;
}

/* Info panel */
const info = d3.select("#info");
function renderInfo(node) {
  if (!node) {
    info.html(`<div class="empty">Hover a node to preview. Click to lock selection.</div>`);
    return;
  }
  info.html(`
    <div class="row">
      <div>
        <div class="k">Lesson</div>
        <div class="v">${node.lesson_id}</div>
      </div>
      <div style="text-align:right">
        <div class="k">Module</div>
        <div class="v">${node.module_id}</div>
      </div>
    </div>
    <div>
      <div class="k">Title</div>
      <div class="v">${node.lesson_title || "(untitled)"}</div>
    </div>
    <div class="row">
      <div>
        <div class="k">Chapter</div>
        <div class="v">${node.chapter_title || ""}</div>
      </div>
      <div style="text-align:right">
        <div class="k">Theme weights</div>
        <div class="v">${THEMES.map(t => `${t.id}: ${(node.weights?.[t.id] ?? 0).toFixed(2)}`).join(" · ")}</div>
      </div>
    </div>
    <div>
      <div class="k">Description</div>
      <div class="v">${node.lesson_description || ""}</div>
    </div>
  `);
}

/* =========================
   3) Geometry: Polygon + Constraint
   ========================= */

function anchors() {
  const n = THEMES.length;
  return THEMES.map((d, i) => {
    const ang = (-Math.PI / 2) + (i * 2 * Math.PI / n);
    return { ...d, ang, x: cx() + Math.cos(ang) * R(), y: cy() + Math.sin(ang) * R() };
  });
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

function softBarrier(node, planes, margin) {
  // Adds an inward velocity component if close to boundary, asymptotically approaching edge
  for (const pl of planes) {
    const d = pl.nx*node.x + pl.ny*node.y - pl.c0; // positive inside
    const dd = d - margin;
    if (dd < 0) {
      const push = (-dd) * 0.10; // soft strength
      node.vx += push * pl.nx;
      node.vy += push * pl.ny;

      // cancel outward normal velocity to prevent ricochet
      const vn = node.vx*pl.nx + node.vy*pl.ny;
      if (vn < 0) {
        node.vx -= vn * pl.nx;
        node.vy -= vn * pl.ny;
      }
    }
  }
}

/* =========================
   4) Weights: Normalize + Similarity
   ========================= */

function normalizeWeights(w) {
  // normalize sum to 1, avoid degenerate 0
  const keys = Object.keys(w);
  const s = keys.reduce((a,k) => a + Math.max(0, +w[k] || 0), 0);
  if (s <= 0) {
    const u = 1 / keys.length;
    keys.forEach(k => w[k] = u);
  } else {
    keys.forEach(k => w[k] = Math.max(0, +w[k] || 0) / s);
  }
}

function minMaxNormalize(nodes) {
  // Optional: normalize weights per dimension across nodes for more consistent dim hover behavior
  const mins = {}; const maxs = {};
  THEMES.forEach(t => { mins[t.id]=Infinity; maxs[t.id]=-Infinity; });
  nodes.forEach(n => {
    THEMES.forEach(t => {
      const v = n.weights[t.id] ?? 0;
      if (v < mins[t.id]) mins[t.id]=v;
      if (v > maxs[t.id]) maxs[t.id]=v;
    });
  });
  nodes.forEach(n => {
    n.wDimNorm = {};
    THEMES.forEach(t => {
      const lo = mins[t.id], hi = maxs[t.id];
      const v = n.weights[t.id] ?? 0;
      n.wDimNorm[t.id] = (hi > lo) ? ((v - lo) / (hi - lo)) : 0.5;
    });
  });
}

function dot(a,b){ let s=0; for(let i=0;i<a.length;i++) s += a[i]*b[i]; return s; }

function buildWeightMatrix(nodes, useNorm=true) {
  const W = nodes.map(n => {
    const row = [];
    for (const d of THEMES) row.push(useNorm ? (n.wDimNorm?.[d.id] ?? 0) : (n.weights?.[d.id] ?? 0));
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

/* =========================
   5) Links: Topology + Dim-to-TopK (visual only)
   ========================= */

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

function buildDimTopLinks(nodes) {
  const links = [];
  for (const dim of THEMES) {
    const ranked = nodes.slice().sort((a,b)=> (b.wDimNorm?.[dim.id] ?? 0) - (a.wDimNorm?.[dim.id] ?? 0));
    ranked.slice(0, CONFIG.dimTopK).forEach(n => {
      links.push({source: dim.id, target: n.lesson_id, kind:"dim", dim: dim.id});
    });
  }
  return links;
}

/* =========================
   6) State Machine
   ========================= */

const State = {
  dimActivatedAt: 0,
  // focus: dimension or node
  activeDim: null,
  lockedDim: null,
  hoverNode: null,
  lockedNode: null,
  hoverPointer: null,      // {x,y} for gentle follow
  suppressNextClick: false,

  // smooth ramp for dim emphasis
  dimBiasScale: 0.0,
  dimBiasTarget: 0.0,
};

function clearFocus() {
  State.activeDim = null;
  State.dimActivatedAt = performance.now();
  State.lockedDim = null;
  State.dimActivatedAt = performance.now();
  State.hoverNode = null;
  State.lockedNode = null;
  State.hoverPointer = null;
}

function setDim(dimId, lock=false) {
  
  State.dimActivatedAt = performance.now();
const prevDim = (State.lockedDim ?? State.activeDim);

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

/* =========================
   7) Main: Load Data + Build Scene
   ========================= */

async function main() {
  const A = anchors();
  const poly = polygonPoints(A);
  const polySafe = insetPolygon(poly, CONFIG.insetPadding);
  const planes = polygonHalfPlanes(polySafe);

  svg.selectAll("*").remove();
  const g = svg.append("g");

  // Outer polygon
  g.append("path")
    .attr("d", d3.line().curve(d3.curveLinearClosed)(poly))
    .attr("fill", "rgba(255,255,255,0.015)")
    .attr("stroke", "rgba(232,236,255,0.14)")
    .attr("stroke-width", 1.2);

  // Theme anchors
  const anchorG = g.selectAll(".anchor")
    .data(A)
    .join("g")
    .attr("class", "anchor");

  anchorG.append("circle")
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
    .attr("r", 72)
    .attr("class", "dimHit")
    .attr("fill", "transparent")
    .style("cursor", "pointer");

  function dimEnter(event, ad) { setDim(ad.id, false); updateDimTop(); styleAll(); kickSim(0.32); }
  function dimLeave(event, ad) { setDim(null, false); updateDimTop(); styleAll(); kickSim(0.32); }

  anchorText.on("mouseenter", dimEnter).on("mouseleave", dimLeave)
    .on("click", (event, ad) => { event.stopPropagation(); setDim(ad.id, true); updateDimTop(); styleAll(); kickSim(0.32); });

  dimHitSel.on("mouseenter", dimEnter).on("mouseleave", dimLeave)
    .on("click", (event, ad) => { event.stopPropagation(); setDim(ad.id, true); updateDimTop(); styleAll(); kickSim(0.32); });

  // Load nodes
  const nodesRaw = await d3.json("sea_lesson_theme_weights.json");
  const moduleStructure = await d3.json("module_structure.json");

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
  minMaxNormalize(nodes);

  // Weighted barycentric "base target" within polygon for each node
  const Amap = new Map(A.map(a => [a.id, a]));
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

  // Similarity precompute (normalized vector rows)
  const { W, norms } = buildWeightMatrix(nodes, true);
  nodes.forEach((n,i) => { n.__wrow = W[i]; n.__wnorm = norms[i]; });
  const similarity = makeSimilarity();

  // Links for visual texture
  const topoLinks = buildTopologyLinks(nodes);
  const dimLinks  = buildDimTopLinks(nodes);

  // For quick lookup by lesson id
  const nodeById = new Map(nodes.map(n => [n.lesson_id, n]));

  // Color scale by module #
  const moduleNums = Array.from(new Set(nodes.map(n => n.__moduleNum))).sort((a,b)=>a-b);
  const color = d3.scaleOrdinal(moduleNums, d3.schemeTableau10.concat(d3.schemeSet3));

  // Link layers
  const linkG = g.append("g").attr("class", "links");
  const topoSel = linkG.selectAll("line.topo")
    .data(topoLinks)
    .join("line")
    .attr("class", "topo")
    .attr("stroke", "rgba(232,236,255,0.07)")
    .attr("stroke-width", 1.0);

  const dimSel = linkG.selectAll("line.dim")
    .data(dimLinks)
    .join("line")
    .attr("class", d => `dim dim-${d.dim}`)
    .attr("stroke", "rgba(232,236,255,0.08)")
    .attr("stroke-width", 1.0);

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

  /* ---------- Interaction: nodes ---------- */

  function showTooltip(event, d) {
    tooltip.html(buildTooltipHTML(d))
      .style("left", (event.pageX + 12) + "px")
      .style("top", (event.pageY - 12) + "px")
      .transition().duration(90)
      .style("opacity", 1);
  }

  function hideTooltip() {
    tooltip.transition().duration(120).style("opacity", 0);
  }

  function nodeEnter(event, d) {
    const p = d3.pointer(event, svg.node());
    setHoverNode(d, {x:p[0], y:p[1]});
    showTooltip(event, d);
    if (!State.lockedNode) renderInfo(d);
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
    if (!State.lockedNode) renderInfo(null);
    styleAll();
    kickSim(0.22);
  }

  function nodePointerDown(event, d) {
    // Robust lock: pointerdown fires even when drag is attached (click can be suppressed by d3-drag).
    if (State.suppressNextClick) return;
    event.stopPropagation();

    // Always lock (do not toggle off here). Unlock by clicking the background.
    lockNode(d);
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

    lockNode(d);
    renderInfo(d);
    showTooltip(event, d);
    updateDimTop();
    styleAll();
    kickSim(0.35);
  }

  // Click background to clear locks
  svg.on("click", (event) => {
    // Clear focus when clicking anywhere that is NOT a node or dimension control.
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
        renderInfo(d);
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

      minMaxNormalize(nodes);
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

  function updateDimTop() {
    nodes.forEach(n => n.__dimTop = false);
    const dim = State.activeDim;
    if (!dim) return;
    const ranked = nodes.slice().sort((a,b) => (b.wDimNorm?.[dim] ?? 0) - (a.wDimNorm?.[dim] ?? 0));
    ranked.slice(0, 10).forEach(n => n.__dimTop = true);
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
      const baseFall = Math.pow(u, 1.15);
      // center big -> edge smaller
      const baseSizeTarget = (1.12 * (1 - baseFall) + 0.68 * baseFall) * 1.00;

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
        mult = 0.80 + (focusCore - 0.55) * 0.75;

        if (f.type === "dim" && n.__dimTop) mult *= 1.08;
        if ((f.type === "node" || f.type === "hover") && f.node === n) mult *= 1.18;
      }

      n.sizeTarget = baseSizeTarget * mult;

      // Smooth ease into rendered radius (scaled to pixels)
      n.size += (n.sizeTarget * 8.2 - n.size) * CONFIG.sizeEase;
    });
  }

  function styleAll() {
    // Node size & position are driven by tick. This only adjusts visual emphasis.
    const f = focusDescriptor();

    nodesSel
      .attr("stroke", d => (d === f.node && (f.type === "node" || f.type === "hover")) ? "rgba(255,255,255,0.92)" : "rgba(10,14,30,0.22)")
      .attr("stroke-width", d => (d === f.node && (f.type === "node" || f.type === "hover")) ? 2.4 : 1.0)
      .attr("fill-opacity", d => (State.activeDim && State.activeDim !== null) ? 0.92 : 0.92);

    // Rings: show for same-module nodes when hovering/locked
    const ref = (State.lockedNode || State.hoverNode);
    const refMod = ref ? ref.module_id : null;
    ringSel
      .attr("stroke", d => (refMod && d.module_id === refMod && d !== ref) ? "rgba(255,255,255,0.60)" : "rgba(255,255,255,0)")
      .attr("stroke-width", d => (refMod && d.module_id === refMod && d !== ref) ? 2.0 : 0);

    // Dimension text cue when locked
    anchorText
      .style("font-weight", a => ((State.lockedDim || State.activeDim) && a.id === (State.lockedDim || State.activeDim)) ? 700 : 500)
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
      .map(n => ({ id: n.id, w: (n.wDimNorm?.[dimId] ?? n.weights?.[dimId] ?? 0) }))
      .sort((a,b) => b.w - a.w)
      .slice(0, k);
    const top = new Set(scored.map(d => d.id));
    nodesSel.classed("dimTop", d => top.has(d.id));
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
  }

  // Main target field: base target (weights) + drift + focus bias + similarity reflow + centroid stabilizer

function dimMoveRamp() {
  // Slow ramp-in so size/highlight reads first; positions follow smoothly.
  const t0 = State.dimActivatedAt || 0;
  if (!t0) return 1;
  const dt = performance.now() - t0;
  // No movement for ~350ms
  if (dt < 350) return 0;
  // 0..1 over ~900ms after the hold, with a gentle ease-in
  const x = Math.max(0, Math.min(1, (dt - 350) / 900));
  return x * x * x; // ease-in cubic
}


  function applyField(alpha) {
    // ramp dim bias smoothly
    dimBiasScale += (State.dimBiasTarget - dimBiasScale) * CONFIG.dimBiasRamp;

    const f = focusDescriptor();
    const dim = (f.type === "dim") ? f.id : null;
    const ref = (f.type === "node" || f.type === "hover") ? f.node : null;

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
        tx += (a.x - cx()) * s * dimBiasScale * 0.50;
        ty += (a.y - cy()) * s * (dimBiasScale * dimMoveRamp()) * 0.50;
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
sim = d3.forceSimulation(nodes)
    .alphaDecay(0.018)
    .velocityDecay(0.38)
    .force("collide", d3.forceCollide().radius(d => (d.size*1.08 + 3.6) * CONFIG.collidePadding * (d.__cr || 1)).strength(CONFIG.collideStrength))
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
  // DEV: expose live config for tuning panel
  window.__SEA = { CONFIG, kick: (a=0.55) => kickSim(a), setConfig: (patch) => {
    Object.assign(CONFIG, patch||{});
    if (sim) {
      sim.force("collide")
        .strength(CONFIG.collideStrength)
        .radius(d => (d.size*1.08 + 3.6) * CONFIG.collidePadding * (d.__cr || 1));
      updateHeartbeat();
    }
  } };

  window.__rerender = () => { /* reserved for future: rebuild on resize */ };
}

/* Entry */
main().catch(err => console.error(err));
