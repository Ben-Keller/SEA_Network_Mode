export const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

export function buildTooltipHTML(d) {
  const img = d.thumb ? `<img class="thumb" src="${d.thumb}" alt=""/>` : ``;
  return `
    <div class="tipRow">${img}<div class="tipText">
      <div class="t">${d.lesson_id} — ${d.lesson_title || "(untitled)"}</div>
      <div class="s">Module ${d.module_id}: ${d.module_title || ""}<br/>${d.chapter_title || ""}</div>
    </div></div>
  `;
}

const info = d3.select("#info");
export function renderInfo(node, themes) {
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
        <div class="v">${themes.map(t => `${t.id}: ${(node.weights?.[t.id] ?? 0).toFixed(2)}`).join(" · ")}</div>
      </div>
    </div>
    <div>
      <div class="k">Description</div>
      <div class="v">${node.lesson_description || ""}</div>
    </div>
  `);
}

export function renderDimInfo(dim) {
  if (!dim) {
    info.html(`<div class="empty">Hover a node to preview. Click to lock selection.</div>`);
    return;
  }
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
export function renderLegend(items) {
  const legend = d3.select("#legend");
  if (legend.empty()) return;
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
