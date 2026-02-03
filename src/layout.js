import { CONFIG } from "./config.js";

export const svg = d3.select("#viz");
let width = 900;
let height = 650;

export function resize() {
  const rect = svg.node().getBoundingClientRect();
  width = Math.max(640, Math.floor(rect.width));
  height = Math.max(520, Math.floor(rect.height));
  svg.attr("viewBox", `0 0 ${width} ${height}`);
}

export function initLayout() {
  resize();
  window.addEventListener("resize", () => {
    resize();
    if (window.__rerender) window.__rerender();
  });
}

export const cx = () => width * 0.5;
export const cy = () => height * 0.5;
export const R = () => Math.min(width, height) * CONFIG.polygonRadiusFactor;

export function getSize() {
  return { width, height };
}
