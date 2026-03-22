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
- Data source abstraction supports in-memory data or explicit URLs (CMS or local relative paths).
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
- `instance.setModuleSelection(moduleId)`: externally activate module mode
- `instance.clearModuleSelection()`: clear external module mode
- `instance.getModuleSelection()`: read active external module id (or `null`)
- `instance.destroy()`: full cleanup for unmount/toggle transitions

Important behavior:
- No auto-init in `script.js`.
- Calling `createSEALessonMap()` again destroys any prior active instance automatically.
- The runtime mounts a single self-contained widget (viz + info panel + legend) inside `options.container`.
- Global fallback helpers are also available in browser mode:
  - `window.setSEALessonMapModule(moduleId)`
  - `window.clearSEALessonMapModule()`


4. Options Reference
--------------------
`options.container`
- Type: `string | Element`
- Purpose: mount target for visualization.
- Recommendation: always pass explicit container from host app.

`options.dataUrls`
- Type: `object`
- Keys: `graphConfig`, `moduleStructure`
- Purpose: per-file URLs (typically CMS/API endpoints; local relative URLs are also valid in demo/dev).

`options.data`
- Type: `object`
- Keys: `graphConfig`, `moduleStructure`
- Purpose: pre-fetched in-memory data supplied by host app.
- Expected formats:
  - JSON keys: parsed object/array.
- Note: dimension assets (`dimensions[].icon`, `dimensions[].image`) should be provided in `graphConfig`
  so visual assets can be changed from CMS without code changes.

`options.d3`
- Type: `object | null`
- Default: `null`
- Purpose: pass an injected D3 instance from host app/bundle.

`options.autoLoadD3`
- Type: `boolean`
- Default: `true`
- Purpose: load D3 automatically when not injected/global.
- Note: the D3 script URL is internal and hardcoded (not a public option).

`options.theme`
- Type: `"light" | "dark"`
- Default: `"light"`
- Purpose: sets widget visual theme for contrast/background (light recommended on academy pages).
- Note: `lightModePreset` and other light-variant options are removed; light uses one fixed palette.

`options.selectedModuleId`
- Type: `string | number | null`
- Default: `null`
- Purpose: optional initial module mode set on first render.

Exact options object (public contract):
```js
{
  container?: string | Element,
  dataUrls?: {
    graphConfig?: string,
    moduleStructure?: string,
  },
  data?: {
    graphConfig?: object,
    moduleStructure?: object,
  },
  d3?: object | null,
  autoLoadD3?: boolean,
  theme?: "light" | "dark",
  selectedModuleId?: string | number | null,
}
```

Implementation rule for data:
- Pass either `data` (already-fetched JSON) or `dataUrls` (widget fetches URLs).
- If both are present, `data` takes priority.
- If neither is provided, initialization throws a missing-data-source error.

Public API note:
- Unsupported option keys are ignored with a console warning.
- Layout, simulation, sizing, and force internals are intentionally not exposed as public options.
- Those behaviors are controlled by built-in defaults + `graphConfig.tuning` in CMS.
- Shadow DOM mounting and scoped style injection are always enabled internally (not public options).
- Widget mount min-height is internal and fixed at `520px`.


5. Data Resolution Logic (CMS Transition)
-----------------------------------------
Data lookup order is fixed and predictable:
1. `options.data[key]`
2. `options.dataUrls[key]`
3. if neither is supplied, initialization throws a missing-data-source error

Expected keys/file names:
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

Module behavior (external trigger + in-widget interaction):
- `setModuleSelection(moduleId)` highlights lessons in that module and shows module info in the panel.
- Legend highlights the active module in module mode.
- Selecting a lesson from another module, or clicking away, clears module mode.

Highlight behavior:
- Top-K dimension nodes highlighted by normalized dimension weight.
- Locked node and hovered node use fixed-size emphasis.

Tooltip behavior by layout:
- Wide + medium layouts: lesson tooltips enabled.
- Small/mobile icon layout: tooltips disabled to avoid overlap/clutter.

Link behavior:
- Topology links: nearest neighbors by base layout target.
- Dimension links: dimension to top-K weighted nodes.
- Focus links: locked node to closest similarity neighbors.


8. Layout and Simulation Notes
------------------------------
- Uses D3 force simulation with custom field updates per tick.
- Nodes are constrained to an inset polygon via clamp + soft barrier.
- Resize preserves visual centroid by translating existing nodes before recomputing geometry.
- Responsive modes:
  - Wide: side-by-side viz + panel.
  - Compact/medium: stacked layout, full-width viz.
  - Small/mobile: stacked layout with dimension labels replaced by icons.


9. React Integration (Recommended Pattern)
------------------------------------------
Use `destroy()` in `useEffect` cleanup.

```jsx
import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { createSEALessonMap } from "@undp/sea-network-widget";

export function SeaViz({ visible }) {
  const hostRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!visible || !hostRef.current) return;

    let cancelled = false;

    createSEALessonMap({
      container: hostRef.current,
      d3,
      autoLoadD3: false,      // no CDN load when app already bundles d3
      theme: "light",          // switch to "dark" on dark pages
      dataUrls: {
        graphConfig: "/api/cms/sea/network-graph-config",
        moduleStructure: "/api/cms/sea/module-structure",
      },
      selectedModuleId: null,  // can be set initially or via setModuleSelection later
    }).then((viz) => {
      if (cancelled) {
        viz.destroy();
        return;
      }
      mapRef.current = viz;
    });

    return () => {
      cancelled = true;
      mapRef.current?.destroy();
      mapRef.current = null;
    };
  }, [visible]);

  // Example external module selector integration:
  // useEffect(() => {
  //   if (!mapRef.current) return;
  //   if (selectedModuleId) mapRef.current.setModuleSelection(selectedModuleId);
  //   else mapRef.current.clearModuleSelection();
  // }, [selectedModuleId]);

  return <div ref={hostRef} style={{ width: "100%", height: 680 }} />;
}
```

Dependency notes:
- Preferred in React/Next apps: pass bundled D3 via `options.d3` and set `autoLoadD3: false`.
- If not provided, runtime auto-loads D3 from its internal CDN URL (`autoLoadD3: true`).
- Widget CSS is injected internally and does not require host stylesheet imports.


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
- Widget mounts in Shadow DOM with scoped CSS injection by default (not configurable via options).
- Tooltip is positioned absolutely within `.sea-widget`, so it does not alter page layout/scroll.
- Theme is configurable with `options.theme` (`"light"` default, `"dark"` optional) to maintain contrast on different host backgrounds.
- Light mode uses a single hardcoded palette (Ocean Mist); dark mode is switched via `theme: "dark"`.


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
- Confirm external module trigger is wired (`setModuleSelection` / `clearModuleSelection`) from host selector.
- Confirm theme is explicitly set per host page (`light`/`dark`) instead of relying on defaults.
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
