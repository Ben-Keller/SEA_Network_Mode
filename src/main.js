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

import { CONFIG } from "./config.js";
import { svg, initLayout, cx, cy, R } from "./layout.js";
import { tooltip, buildTooltipHTML, renderInfo, renderDimInfo, renderLegend } from "./ui.js";
import { anchors, angleDiff, polygonPoints, insetPolygon, polygonHalfPlanes, clampToPolygon, softBarrier } from "./geometry.js";
import { normalizeWeights, minMaxNormalize, buildWeightMatrix, makeSimilarity } from "./weights.js";
import { buildTopologyLinks, buildDimTopLinks } from "./links.js";
import { State, clearFocus, setDim, setHoverNode, lockNode } from "./state.js";

initLayout();

/* =========================
   7) Main: Load Data + Build Scene
   ========================= */

async function main() {
  // Build order: geometry → anchors → data → links → nodes → interaction → simulation
  const dimMeta = await d3.json("data/dimensions.json");
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
  const nodesRaw = await d3.json("data/sea_lesson_theme_weights.json");
  const moduleStructure = await d3.json("data/module_structure.json");

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
    if (!State.lockedNode) renderInfo(null);
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
  // DEV: expose live config for tuning panel
  window.__SEA = { CONFIG, kick: (a=0.55) => kickSim(a), setConfig: (patch) => {
    Object.assign(CONFIG, patch||{});
    if (sim) {
      sim.force("collide")
        .strength(CONFIG.collideStrength)
        .radius(collideRadius);
      updateHeartbeat();
    }
  }, __prevCx: cx(), __prevCy: cy() };

  window.__rerender = () => {
    const prevCx = window.__SEA?.__prevCx ?? cx();
    const prevCy = window.__SEA?.__prevCy ?? cy();
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

    if (window.__SEA) {
      window.__SEA.__prevCx = cx();
      window.__SEA.__prevCy = cy();
    }
    kickSim(0.35);
  };
}

/* Entry */
main().catch(err => console.error(err));
