# Repulsine Visualizer

> A real-time 3D aerodynamics visualization of Viktor Schauberger's **Repulsine** vortex implosion disc — built as a Vercel-ready Next.js 16 application.

![Repulsine Visualizer](https://img.shields.io/badge/Three.js-r169-black?logo=threedotjs) ![R3F](https://img.shields.io/badge/React%20Three%20Fiber-v8-blue) ![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js) ![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)

## Overview

The app begins with a neumorphic **Haunebu saucer button** (light-mode). Clicking *ENGAGE* charges the Vril capacitors and transitions to a full-screen **3D Repulsine scene** featuring:

- **Coandă Hull** — LatheGeometry aerodynamic shell, auto-rotating with differential shell spin
- **Corrugated Wave-Disc Turbine** — 3 sinusoidal copper plates mimicking Schauberger's trout-gill dynamics
- **Implosion Core** — Glowing suction zone with animated emissive pulse
- **Capillary Whorl** — 16-bundle copper tube ring in centripetal vector
- **Intake Cowl** — Torus intake ring at 1.2 atm
- **Vortex Streamlines** — 30 logarithmic-spiral gust trails (zero-CPU: static geometry, animated via `dashOffset`)
- **Telemetry HUD** — Hover any component to reveal live metrics + SVG connector line
- **Exploded View** — Smooth Y-axis lerp separating all components
- **Post-Processing** — Bloom + Chromatic Aberration via `@react-three/postprocessing`
- **Theme Toggle** — Dark (bunker) / Light / Auto

## Physics

The visualization demonstrates Schauberger's core principles:

| Principle | Visualization |
|---|---|
| Logarithmic spiral channels `r = a·e^(b·θ)` | 30 spiral gust lines tightening toward core |
| Conservation of angular momentum | Angular velocity increases as radius decreases |
| Coandă effect | LatheGeometry hull curvature maintains laminar flow |
| Bernoulli pressure differential | Pressure gradient: high at rim → vacuum at core |
| Counter-rotating discs | Shell rotates opposite to corrugated plates |
| Cycloidal implosion flow | Gust radius decreases as `Math.pow(1 - t, 1.5)` |

## Stack

| Layer | Library |
|---|---|
| Framework | Next.js 16 (App Router) |
| 3D Renderer | Three.js r169 + WebGLRenderer |
| React Integration | React Three Fiber v8 |
| Helpers | @react-three/drei |
| Post-Processing | @react-three/postprocessing (Bloom + ChromaticAberration) |
| UI | Inline styles + CSS Modules |
| Fonts | Orbitron + Inter (Google Fonts) |
| Deployment | Vercel |

## Getting Started

```bash
npm install --legacy-peer-deps
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

Configured for Vercel via `vercel.json`. Deploy with:

```bash
npx vercel --prod
```

## Source Files

The `source/` directory contains the original HTML prototypes:
- `source/3d-visualization/` — 13 iterations of the Three.js visualization (v1–v11)
- `source/buttons/` — Final neumorphic button iterations (pass 2m is the canonical version)

## Credits

Visualization inspired by Viktor Schauberger's Repulsine patents (AT146,141, AT196,680), what is likely the Thule Triebwerk patent ([DE19915730A1](https://patents.google.com/patent/DE19915730A1/en)), and Callum Coats' *Living Energies*.  <br />

## License

*Copyright (c) 2026 VLABS, LLC. All rights reserved.* <br>
*[VRIL LABS Open Source License v1.0](https://github.com/VRIL-LABS/vril-zip/blob/main/LICENSE) — https://vril.li/license*.

---

<div align="center">
  <sub>Built by <strong>VRIL LABS</strong> · Ancient Knowledge · Future Technology</sub>
</div>

