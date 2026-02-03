export const CONFIG = {
  // Geometry
  polygonRadiusFactor: 0.29,
  insetPadding: 38,               // keeps nodes away from edges (safe polygon inset)
  minEdgeDistance: 6,             // extra margin enforced by soft barrier

  // Motion
  driftStrength: 0.074,           // subtle always-on drift (increase slightly if desired)
  jitterStrength: 0.78,           // per-node static jitter prevents honeycomb settling
  centerTether: 0.003,
  outwardBias: 0.001,             // pushes nodes away from center (balanced by barrier)
                                  // keeps centroid near center without over-regularizing

  // Collision
  collidePadding: 0.89,           // collision radius multiplier padding
  collideStrength: 0.02,

  // Focus forces (dimension/node)
  dimBiasMax: 1.69,               // max scaling when a dim is active
  dimBiasRamp: 0.2,               // ramp speed to avoid impulses
  nodeSimStrength: 0.72,          // similarity pull/push intensity
  nodeRepel: 0.96,                // repel for dissimilar nodes under focus

  // Animation
  sizeEase: 0.06,                 // smoothing for size changes
  posEase: 0.085,                 // smoothing for target position changes

  // Sizing lens (distance-based)
  lensNone:   { inner: 0,   outer: 0,   power: 1.05, a: 1.20, b: 0.70, scale: 1.05 },
  lensFocus:  { inner: 85,  outer: 280, power: 2.35, a: 1.65, b: 0.55, scale: 0.92 },

  // Links
  topoNeighbors: 2,
  focusTopoNeighbors: 10,
  dimTopK: 10,

  // Dimension hover band (annulus around vertices)
  dimHoverInnerFactor: 0.92,
  dimHoverOuterFactor: 1.20,

  // Extra separation for top dim nodes
  dimTopRepelRadius: 90,
  dimTopRepelStrength: 0.35,
};
