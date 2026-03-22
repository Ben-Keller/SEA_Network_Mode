SEA Lesson Map - Full Handover Documentation
============================================

1. What This Is
---------------
This project provides an embeddable D3 visualization of SEA lesson data as a force-directed map inside a dimension polygon.

Primary goals:
- Embed inside another application (React page is the target integration).
- Support clean mount/unmount cycles (including UI toggles between this view and another interface).
- Allow data source migration from local files to CMS endpoints with minimal integration changes.
- Minimize host-app integration surface (self-contained styles, tooltip containment, dependency flexibility).

Current implementation status:
- Single runtime script (`script.js`).
- Single graph data config (`data/sea_network_graph_config.json`) containing dimensions, lesson weights, and tuning.
- Lifecycle-safe API with explicit `create` and `destroy`.
- Data source abstraction supports in-memory data, CMS URLs, or local fallback files.
- Styles are widget-scoped (`.sea-widget ...`) to avoid host-app CSS bleed.
- Tooltip is rendered inside the widget container (not attached to `body`).
- D3 can be injected from host bundle or auto-loaded by the widget.


2. Repository Layout
--------------------
- `index.html`
  Minimal demo host (visualization-only shell).
- `script.js`
  Full runtime (data loading, layout, simulation, rendering, interactions, lifecycle).
- `data/sea_network_graph_config.json`
  Combined graph config: dimensions + lesson weights + tuning values.
- `data/module_structure.json`
  Module metadata, colors, and image mapping data.


3. Runtime API (Vendor Integration Contract)
--------------------------------------------
Entrypoint:
- `createSEALessonMap(options) -> Promise<instance>` (npm import)
- `window.createSEALessonMap(options) -> Promise<instance>` (browser global fallback)

Instance shape:
- `instance.svg`: mounted SVG DOM node
- `instance.config`: live config object used by runtime
- `instance.destroy()`: full cleanup for unmount/toggle transitions

Important behavior:
- No auto-init in `script.js`.
- Calling `createSEALessonMap()` again destroys any prior active instance automatically.
- The runtime mounts a single self-contained widget (viz + info panel + legend) inside `options.container`.


4. Options Reference
--------------------
`options.container`
- Type: `string | Element`
- Purpose: mount target for visualization.
- Recommendation: always pass explicit container from host app.

`options.dataDir`
- Type: `string`
- Default: `"data"`
- Purpose: fallback base path for local files.

`options.dataUrls`
- Type: `object`
- Keys: `graphConfig`, `moduleStructure`
- Purpose: per-file URL overrides (typically CMS/API endpoints).

`options.data`
- Type: `object`
- Keys: `graphConfig`, `moduleStructure`
- Purpose: pre-fetched in-memory data supplied by host app.
- Expected formats:
  - JSON keys: parsed object/array.
- Note: dimension assets (`dimensions[].icon`, `dimensions[].image`) should be provided in `graphConfig`
  so visual assets can be changed from CMS without code changes.

`options.minHeight`
- Type: `number`
- Default: `520`
- Purpose: minimum mount height for generated/mounted visualization host.

`options.d3`
- Type: `object | null`
- Default: `null`
- Purpose: pass an injected D3 instance from host app/bundle.

`options.autoLoadD3`
- Type: `boolean`
- Default: `true`
- Purpose: load D3 automatically when not injected/global.

`options.d3Url`
- Type: `string`
- Default: `"https://d3js.org/d3.v7.min.js"`
- Purpose: source URL for D3 when `autoLoadD3` is enabled.

`options.useShadowDom`
- Type: `boolean`
- Default: `true`
- Purpose: mount widget in a Shadow DOM root for stronger CSS isolation from host app.

`options.injectStyles`
- Type: `boolean`
- Default: `true`
- Purpose: inject built-in scoped widget CSS automatically.

`options.styles`
- Type: `string`
- Default: `""` (uses built-in CSS)
- Purpose: provide a custom CSS string (used when `injectStyles` is enabled).

`options.theme`
- Type: `"light" | "dark"`
- Default: `"light"`
- Purpose: sets widget visual theme for contrast/background (light recommended on academy pages).

`options.lightModePreset`
- Type: `"1"` ... `"10"`
- Default: `"1"`
- Purpose: selects one of 10 light-theme color presets (background/border/label treatment).

`options.compactBreakpoint`
- Type: `number`
- Default: `980`
- Purpose: switches widget to stacked/compact layout when container width is at or below this value.

`options.minSimWidth`, `options.minSimHeight`
- Type: `number`
- Defaults: `280`, `260`
- Purpose: minimum internal simulation viewport size for narrow embeds.

`options.logoUrl`
- Type: `string`
- Default: `"https://sehseadata.blob.core.windows.net/images/HeaderImages/SEA.png"`
- Purpose: logo used in the info panel reset/init state.

`options.infoInitTitle`
- Type: `string`
- Default: `"Sustainable Energy Academy"`
- Purpose: init-state heading in the info panel.

`options.infoInitLead`
- Type: `string`
- Default: `"Explore the lesson map."`
- Purpose: short init-state lead line in the info panel.

`options.infoInitBody`
- Type: `string`
- Default: descriptive onboarding text in the info panel.
- Purpose: longer init-state description text.


5. Data Resolution Logic (CMS Transition)
-----------------------------------------
Data lookup order is fixed and predictable:
1. `options.data[key]`
2. `options.dataUrls[key]`
3. `options.dataDir + default filename`

Default file map:
- `graphConfig -> sea_network_graph_config.json`
- `moduleStructure -> module_structure.json`

Implication:
- Vendor can move to CMS by only supplying `dataUrls` or `data`.
- Visualization logic does not need to change when backend source changes.


6. Data Schemas
---------------
6.1 `graphConfig` payload (`data/sea_network_graph_config.json`)
- Root:
  - `dimensions`: array of dimension metadata
  - `weights`: array of lesson rows
  - `tuning`: object of runtime tuning values (supports nested objects)
- `dimensions[]` item:
  - `id` (string, required): weight key used in lesson records.
  - `label` (string, recommended): anchor label.
  - `icon` (string, recommended): dimension icon URL/path (used in small/mobile icon mode).
  - `image` (string, optional): dimension image URL/path shown in the info panel.
  - `summary` (string, optional): shown in dimension info state.
  - `details` (string, optional): shown in dimension info state.

6.2 `graphConfig.weights[]` payload
- Required fields:
  - `lesson_id`
  - `module_id`
  - dimension weight keys matching all `dimensions[].id` values.
- Optional display fields:
  - `lesson_title`, `module_title`, `chapter_title`, `lesson_description`, etc.

6.3 `moduleStructure` payload (`data/module_structure.json`)
- Root includes `modules` array.
- Used for:
  - legend labels and colors
  - lesson thumbnail resolution
- Module color source of truth:
  - `module.color`
- If `module.color` is missing, runtime uses a deterministic fallback palette.

6.4 `graphConfig.tuning` payload
- JSON object keyed by config names.
- Supports nested tuning via nested objects.
  - Example: `"lensFocus": { "power": 2.35 }`
- Unknown keys are ignored with console warning.


7. Interaction and Behavior Rules
---------------------------------
Node behavior:
- Hover: tooltip + hover highlight + focus behavior.
- Click: lock node, pin at current position.
- Drag: updates node weights using anchor-distance rule.

Dimension behavior:
- Hover in annulus band: dimension focus by nearest anchor.
- Click: lock dimension (without re-boosting when already focused via hover).
- Locked dimension label: orange and bold.

Highlight behavior:
- Top-K dimension nodes highlighted by normalized dimension weight.
- Locked node and hovered node use fixed-size emphasis.

Link behavior:
- Topology links: nearest neighbors by base layout target.
- Dimension links: dimension to top-K weighted nodes.
- Focus links: locked node to closest similarity neighbors.


8. Layout and Simulation Notes
------------------------------
- Uses D3 force simulation with custom field updates per tick.
- Nodes are constrained to an inset polygon via clamp + soft barrier.
- Resize preserves visual centroid by translating existing nodes before recomputing geometry.


9. React Integration (Recommended Pattern)
------------------------------------------
Use `destroy()` in `useEffect` cleanup.

```jsx
import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { createSEALessonMap } from "@undp/sea-network-widget";

export function SeaViz({ visible }) {
  const hostRef = useRef(null);

  useEffect(() => {
    if (!visible || !hostRef.current) return;

    let instance;
    let cancelled = false;

    createSEALessonMap({
      container: hostRef.current,
      d3,
      autoLoadD3: false,
      useShadowDom: true,
      injectStyles: true,
      dataUrls: {
        graphConfig: "/api/cms/sea/network-graph-config",
        moduleStructure: "/api/cms/sea/module-structure",
      },
      minHeight: 520,
    }).then((viz) => {
      if (cancelled) {
        viz.destroy();
        return;
      }
      instance = viz;
    });

    return () => {
      cancelled = true;
      instance?.destroy();
    };
  }, [visible]);

  return <div ref={hostRef} style={{ width: "100%", height: 680 }} />;
}
```

Dependency notes:
- Preferred in React/Next apps: pass bundled D3 via `options.d3` and set `autoLoadD3: false`.
- If not provided, runtime can auto-load D3 from `options.d3Url` (`autoLoadD3: true`).
- CSS is injected by the widget (`injectStyles: true`), so no global stylesheet import is required.


10. Lifecycle / Cleanup Semantics
---------------------------------
`destroy()` performs:
- stop simulation
- unbind SVG event handlers
- remove tooltip node
- remove/clear mounted SVG content
- remove global resize listener for this instance
- release instance references

This is required for toggle flows and route transitions.


11. Styling and Host App Expectations
-------------------------------------
- Host container should provide explicit width/height.
- Runtime sets SVG to 100% width/height within container.
- Default integration uses Shadow DOM (`useShadowDom: true`) + scoped CSS injection.
- Widget CSS is scoped under `.sea-widget`, so it should not affect host page styles when Shadow DOM is disabled.
- Tooltip is positioned absolutely within `.sea-widget`, so it does not alter page layout/scroll.


12. Tuning Guide
----------------
Edit `data/sea_network_graph_config.json` (`tuning` object) to adjust behavior without code changes.

Typical keys:
- Geometry: `polygonRadiusFactor`, `insetPadding`, `minEdgeDistance`
- Motion: `driftStrength`, `jitterStrength`, `centerTether`, `outwardBias`
- Collision: `collidePadding`, `collideStrength`
- Focus: `dimBiasMax`, `dimBiasRamp`, `nodeSimStrength`, `nodeRepel`
- Lens: `lensFocus.inner`, `lensFocus.outer`, `lensFocus.power`
- Highlight/links: `dimTopK`, `topoNeighbors`, `focusTopoNeighbors`


13. Deployment Notes
--------------------
- Must be served over HTTP(S), not `file://`.
- Ensure CMS endpoints send JSON with appropriate CORS headers.
- Ensure endpoint auth context is available to host app before initialization if needed.


14. Troubleshooting
-------------------
Blank visualization:
- Verify `container` exists and has non-zero size.
- Check network for data URL failures.

No data / partial render:
- Confirm dimension IDs match keys in weights records.
- Confirm `weights` payload is an array.

Toggle leaks / duplicated behavior:
- Ensure integration always calls `destroy()` in cleanup.

Unexpected config:
- Check `sea_network_graph_config.json` tuning keys for typos.
- Unknown keys are ignored by design.


15. Vendor Handoff Checklist
----------------------------
- Confirm host app can call `createSEALessonMap` (via npm import or global fallback).
- Confirm mount/unmount path calls `destroy()`.
- Confirm CMS endpoints configured for `graphConfig` and `moduleStructure`.
- Confirm one successful mount with visible data and interactions.
- Confirm toggle away/toggle back does not duplicate listeners or instances.


16. NPM Package Handoff
-----------------------
- Package manifest: `package.json`
- Entry points:
  - CommonJS: `script.js`
  - ESM: `index.mjs`
- To create a distributable tarball for vendor testing:
  - `npm pack`
- To consume in app code:
  - `import { createSEALessonMap } from "@undp/sea-network-widget"`
