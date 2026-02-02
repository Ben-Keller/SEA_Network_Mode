SEA Lesson Map — D3 demo (v15)

Fixes:
- Dimension hover no longer explodes / throws nodes:
  * added smooth ramp (dimBiasScale) for the dimension bias force
  * damp node velocities on dim enter/leave
  * bind hover handlers only to the intended dimension hit targets (circle.dimHit + label text)

- Hovered node cannot drift off the mouse:
  * when nothing is locked, hovered node is temporarily pinned with fx/fy and gently follows pointer (lerp),
    overriding other effects without hard snapping
  * released on mouseleave

Run:
python -m http.server 8000
Open http://localhost:8000
