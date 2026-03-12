SEA Lesson Map - Full Handover Documentation
============================================

1. What This Is
---------------
This project provides an embeddable D3 visualization of SEA lesson data as a force-directed map inside a dimension polygon.

Primary goals:
- Embed inside another application (React page is the target integration).
- Support clean mount/unmount cycles (including UI toggles between this view and another interface).
- Allow data source migration from local files to CMS endpoints with minimal integration changes.

Current implementation status:
- Single runtime script (`script.js`).
- Single graph data config (`data/sea_network_graph_config.json`) containing dimensions, lesson weights, and tuning.
- Lifecycle-safe API with explicit `create` and `destroy`.
- Data source abstraction supports in-memory data, CMS URLs, or local fallback files.


2. Repository Layout
--------------------
- `index.html`
  Minimal demo host (visualization-only shell).
- `style.css`
  Minimal visualization and tooltip styles.
- `script.js`
  Full runtime (data loading, layout, simulation, rendering, interactions, lifecycle).
- `data/sea_network_graph_config.json`
  Combined graph config: dimensions + lesson weights + tuning values.
- `data/module_structure.json`
  Module metadata, colors, and image mapping data.


3. Runtime API (Vendor Integration Contract)
--------------------------------------------
Global entrypoint:
- `window.createSEALessonMap(options) -> Promise<instance>`

Instance shape:
- `instance.svg`: mounted SVG DOM node
- `instance.config`: live config object used by runtime
- `instance.destroy()`: full cleanup for unmount/toggle transitions

Important behavior:
- No auto-init in `script.js`.
- Calling `createSEALessonMap()` again destroys any prior active instance automatically.


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

`options.minHeight`
- Type: `number`
- Default: `520`
- Purpose: minimum mount height for generated/mounted visualization host.


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

export function SeaViz({ visible }) {
  const hostRef = useRef(null);

  useEffect(() => {
    if (!visible || !hostRef.current || !window.createSEALessonMap) return;

    let instance;
    let cancelled = false;

    window.createSEALessonMap({
      container: hostRef.current,
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
- Tooltip uses `position:absolute` on `body`; ensure host stacking context does not hide it.


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
- Confirm host app can call `window.createSEALessonMap`.
- Confirm mount/unmount path calls `destroy()`.
- Confirm CMS endpoints configured for `graphConfig` and `moduleStructure`.
- Confirm one successful mount with visible data and interactions.
- Confirm toggle away/toggle back does not duplicate listeners or instances.
