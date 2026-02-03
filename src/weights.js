export function normalizeWeights(w) {
  let s = 0;
  for (const k of Object.keys(w)) s += w[k];
  if (s <= 1e-8) {
    const n = Object.keys(w).length || 1;
    for (const k of Object.keys(w)) w[k] = 1/n;
  } else {
    for (const k of Object.keys(w)) w[k] /= s;
  }
}

export function minMaxNormalize(nodes, themes) {
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

export function dot(a,b){ let s=0; for(let i=0;i<a.length;i++) s += a[i]*b[i]; return s; }

export function buildWeightMatrix(nodes, themes, useNorm=true) {
  const W = nodes.map(n => {
    const row = [];
    for (const d of themes) row.push(useNorm ? (n.wDimNorm?.[d.id] ?? 0) : (n.weights?.[d.id] ?? 0));
    return row;
  });
  const norms = W.map(r => r.reduce((s,v) => s + v*v, 0));
  return { W, norms };
}

export function makeSimilarity() {
  // Gaussian kernel on squared Euclidean distance in weight space
  const sigma = 0.044;
  return (n, h) => {
    const d2 = n.__wnorm + h.__wnorm - 2 * dot(n.__wrow, h.__wrow);
    const sim = Math.exp(-d2 / sigma);
    return Math.max(0, Math.min(1, sim));
  };
}
