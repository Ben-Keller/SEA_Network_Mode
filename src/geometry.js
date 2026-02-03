import { cx, cy, R } from "./layout.js";

export function anchors(themes) {
  const n = themes.length;
  return themes.map((d, i) => {
    const ang = (-Math.PI / 2) + (i * 2 * Math.PI / n);
    return { ...d, ang, x: cx() + Math.cos(ang) * R(), y: cy() + Math.sin(ang) * R() };
  });
}

export function angleDiff(a, b) {
  const d = a - b;
  return Math.atan2(Math.sin(d), Math.cos(d));
}

export function polygonPoints(A) {
  return A.map(a => [a.x, a.y]);
}

// Inset polygon by moving each vertex toward center (simple, robust enough for demo)
export function insetPolygon(poly, pad) {
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
export function polygonHalfPlanes(poly) {
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
export function clampToPolygon(p, planes) {
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
export function softBarrier(node, planes, margin) {
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
