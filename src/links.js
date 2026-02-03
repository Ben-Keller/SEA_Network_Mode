import { CONFIG } from "./config.js";

export function buildTopologyLinks(nodes) {
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

export function buildDimTopLinks(nodes, themes) {
  const links = [];
  for (const dim of themes) {
    const ranked = nodes.slice().sort((a,b)=> (b.wDimNorm?.[dim.id] ?? 0) - (a.wDimNorm?.[dim.id] ?? 0));
    ranked.slice(0, CONFIG.dimTopK).forEach(n => {
      links.push({source: dim.id, target: n.lesson_id, kind:"dim", dim: dim.id});
    });
  }
  return links;
}
