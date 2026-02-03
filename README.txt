SEA Lesson Map — Handover Documentation
======================================

Purpose
-------
This visualization renders SEA lessons as nodes inside a multi‑dimensional polygon, with one vertex per dimension. The layout is a D3 force simulation guided by a custom target field, allowing soft clustering by weight, interactive focus on nodes or dimensions, and controlled drift for liveliness. The right panel provides lesson or dimension context, and the legend maps module colors.

Quick Start
-----------
1) Run from a local server (not file://) so JSON loads are allowed.
2) Open index.html in the browser.
3) Optional: toggle/adjust settings via the tuning panel (scripts/tuning.js).

Repository Structure
--------------------
- index.html
  Entry page. Loads D3, the main module, and the tuning panel.
- style.css
  Global styling (layout, panels, nodes, legend, tooltip).
- src/
  - main.js
    Entry module; orchestrates data load, rendering, interactions, and the simulation loop.
  - config.js
    Central numeric tuning parameters.
  - layout.js
    SVG sizing, resize handling, and center/radius helpers.
  - geometry.js
    Polygon geometry, anchor construction, and boundary constraints.
  - weights.js
    Weight normalization and similarity matrix helpers.
  - links.js
    Topology links and dimension top‑K links.
  - ui.js
    Tooltip, info panel rendering, legend rendering.
  - state.js
    Interaction state and state transition helpers.
- data/
  - sea_lesson_theme_weights.json
    Lesson nodes and dimension weights (runtime input).
  - sea_lesson_theme_weights.csv
    Source CSV (not used by runtime).
  - module_structure.json
    Module/lesson metadata and images (runtime input).
  - dimensions.json
    Dimension metadata (id, label, summary, details). Drives number of dimensions.
- assets/
  - favicon.ico
- scripts/
  - tuning.js
    Live control panel for CONFIG tuning.

Core Data Contracts
-------------------
Dimensions (data/dimensions.json)
- id: key used in node weight data
- label: displayed at each vertex and in info panel
- summary/details: shown when dimension is locked

Lesson Weights (data/sea_lesson_theme_weights.json)
- Each lesson row must include numeric values for each dimension id.
- Other fields provide display metadata (lesson_id, lesson_title, module_id, etc.).

Module Structure (data/module_structure.json)
- Provides module titles, module colors, chapter/lesson titles, and images.
- module.color is used for node color and legend swatches.

Dimension Abstraction
---------------------
The number of dimensions is not hardcoded. The system reads data/dimensions.json and uses its length to:
- Build the polygon (anchors evenly spaced around the circle)
- Read weights from nodes
- Compute similarity vectors
- Generate dimension top‑K links

Add/remove dimensions by updating dimensions.json and ensuring matching weight keys exist in the lesson data.

Rendering Pipeline (main.js)
----------------------------
Build order:
1) Geometry: anchors, polygon, safe inset, boundary planes
2) Anchors: vertex labels and hit targets
3) Data: load nodes, module metadata, and dimension metadata
4) Links: topology links + dimension top‑K links
5) Nodes: build node paths and rings
6) Interaction: hover/click/drag handlers
7) Simulation: force integration + custom field

Interaction Rules
-----------------
Node Hover
- Shows tooltip and previews node info (unless a node is locked).
- Applies a gentle mouse-follow to the hovered node.

Node Click (Lock)
- Locks the node in place immediately (fx/fy set to current position, velocity zeroed).
- Locked node uses an orange stroke and fixed large size.
- Clicking background unlocks.

Node Drag
- Dragging a node locks it and updates weights based on inverse distance to anchors.
- On drag end, if not locked, position is released.

Dimension Hover
- Hovering within the annulus ring around the polygon selects the nearest dimension.
- Dimension hover does NOT require targeting the label.
- Hover arcs are continuous (no dead zones between dimensions).
- Dimension hover uses a short ramp‑in (no delay).

Dimension Click (Lock)
- Locks the dimension without increasing attraction if it was already active via hover.
- Locked dimension label becomes orange and bold.
- Info panel shows dimension metadata from dimensions.json.
- Clicking background clears.

Sizing Rules
------------
Node sizes are computed each tick based on a baseline size (distance from center), a focus lens, and special cases:
- Baseline size depends on distance from center; in dimension mode, mid/center nodes shrink more.
- Focus lens (node or dimension) modulates sizes around the focus point.
- Locked node: fixed large size.
- Hovered node: fixed large size.
- Dimension top‑K nodes: fixed large size (ignore other rules).

Highlighting Rules
------------------
- Dimension mode highlights only the top‑K nodes by normalized weight for that dimension.
- Dim top‑K nodes get a strong stroke and are slightly repelled from each other.
- Locked node gets an orange stroke; hover uses white stroke.

Forces & Motion
---------------
- Base target is a barycentric point computed from dimension weights.
- Drift provides subtle motion to avoid static layouts.
- Dimension mode applies attraction/repulsion relative to the dimension vertex.
- Similarity reflow pulls similar nodes toward the focused node and repels dissimilar ones.
- Hovered node applies a light local repel when another node is locked.
- Boundary constraints clamp and softly push nodes inside the polygon.

Collision & Separation
----------------------
- Global collide uses a single strength (CONFIG.collideStrength).
- Dimension top‑K nodes get a larger collision radius.
- Additional custom repel keeps top‑K nodes separated in dimension mode.

Links
-----
- Topology links: each node connects to CONFIG.topoNeighbors nearest nodes (by base target distance).
- Dimension links: each dimension connects to top‑K nodes by normalized weight (visual only).
- Focus links: when a node is locked, it links to its closest neighbors by weight similarity (CONFIG.focusTopoNeighbors).

Legend & Module Colors
----------------------
- Legend items are built from module_structure.json.
- module.color is used for node fill color and legend swatches.

Resize Behavior
---------------
- On window resize, nodes are shifted by the change in center to preserve the visual centroid.
- Anchors, polygon, and boundary planes are recomputed to match the new size.

Tuning Panel
------------
The tuning panel (scripts/tuning.js) reads CONFIG from window.__SEA and allows live tuning. Typical parameters:
- polygonRadiusFactor, insetPadding, minEdgeDistance
- driftStrength, jitterStrength, centerTether, outwardBias
- collidePadding, collideStrength
- dimBiasMax, dimBiasRamp, nodeSimStrength, nodeRepel
- posEase, sizeEase
- topoNeighbors, dimTopK

Key Config Parameters (config.js)
--------------------------------
- polygonRadiusFactor
- insetPadding
- minEdgeDistance
- driftStrength
- jitterStrength
- centerTether
- outwardBias
- collidePadding
- collideStrength
- dimBiasMax
- dimBiasRamp
- nodeSimStrength
- nodeRepel
- posEase
- sizeEase
- topoNeighbors
- focusTopoNeighbors
- dimTopK
- dimHoverInnerFactor
- dimHoverOuterFactor
- dimTopRepelRadius
- dimTopRepelStrength

Build/Run Notes
---------------
- Run via a local server (not file://), to allow JSON loads.
- No build step required.
- Entry module: src/main.js
