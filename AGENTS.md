<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Developer tooling

## Screenshot the 3D visualizer

`scripts/screenshot-visualizer.mjs` captures the `/visualizer` page with
headless Chrome (DevTools Protocol, software WebGL via SwiftShader) — no extra
npm dependencies. Use it to verify the 3D scene actually renders, since the
WebGL canvas only paints after the scene loads and plain `--screenshot` flags
usually fire too early.

```bash
# Terminal 1 — serve the production build
npm run build && npx next start -p 3200

# Terminal 2 — capture (defaults: http://localhost:3200/visualizer -> /tmp/visualizer.png)
node scripts/screenshot-visualizer.mjs --out /tmp/vis.png
node scripts/screenshot-visualizer.mjs --theme light --out /tmp/vis-light.png
```

Options: `--url`, `--out`, `--wait` (ms before capture, default 15000),
`--width`/`--height`, `--theme dark|light`, `--cdp-port`. Set `CHROME_BIN` to
use a different browser binary (e.g. `chromium`).

## 3D scene invariants (do not regress)

The `/visualizer` arena (`src/components/RepulsineScene/`) is an enclosed
chamber. To keep the default camera view unobstructed:

- The camera must stay **inside** the arena: OrbitControls `maxDistance` (60)
  must remain below the inner wall radius (~61.5).
- The wall's entrance wedge (`CylinderGeometry` theta arc `0.15π..1.85π`) is
  centred on the +Z axis — keep it aligned with the default camera azimuth (0°).
- Wall ribs are skipped inside that entrance wedge so none can block the view.
