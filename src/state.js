import { CONFIG } from "./config.js";

export const State = {
  dimActivatedAt: 0,
  // focus: dimension or node
  activeDim: null,
  lockedDim: null,
  hoverNode: null,
  lockedNode: null,
  hoverPointer: null,      // {x,y} for gentle follow
  suppressNextClick: false,
  clickStartedOnNode: false,
  hoverDimArc: null,       // dimension id selected via hover ring

  // smooth ramp for dim emphasis
  dimBiasScale: 0.0,
  dimBiasTarget: 0.0,
};

export function clearFocus() {
  if (State.lockedNode) {
    State.lockedNode.fx = null;
    State.lockedNode.fy = null;
  }
  State.activeDim = null;
  State.dimActivatedAt = performance.now();
  State.lockedDim = null;
  State.dimActivatedAt = performance.now();
  State.hoverNode = null;
  State.lockedNode = null;
  State.hoverPointer = null;
}

export function setDim(dimId, lock=false) {
  const prevDim = (State.lockedDim ?? State.activeDim);
  const wasLocked = (State.lockedDim === dimId);

  if (lock && dimId && prevDim === dimId && !wasLocked) {
    // Lock the currently-hovered dim without changing strength or restart.
    State.lockedDim = dimId;
    State.activeDim = dimId;
    State.dimBiasTarget = State.dimBiasScale;
    return;
  }

  if (lock) {
    if (State.lockedDim === dimId) {
      State.lockedDim = null;
      State.activeDim = null;
    } else {
      State.lockedDim = dimId;
      State.activeDim = dimId;
      State.lockedNode = null; // locking a dim clears node lock
    }
  } else {
    if (State.lockedDim) return;
    State.activeDim = dimId;
  }
  if ((State.lockedDim ?? State.activeDim) !== prevDim) {
    State.dimActivatedAt = performance.now();
  }
  State.dimBiasTarget = State.activeDim ? CONFIG.dimBiasMax : 0.0;
}

export function setHoverNode(n, pointer=null) {
  State.hoverNode = n;
  State.hoverPointer = pointer;
}

export function lockNode(n) {
  State.lockedNode = n;
  n.fx = n.x;
  n.fy = n.y;
  n.vx = 0;
  n.vy = 0;
  State.hoverNode = null;
  State.hoverPointer = null;
  State.lockedDim = null;
  State.activeDim = null;
  State.dimBiasTarget = 0.0;
}

export function unlockNode() {
  if (State.lockedNode) { State.lockedNode.fx = null; State.lockedNode.fy = null; }
  State.lockedNode = null;
}
