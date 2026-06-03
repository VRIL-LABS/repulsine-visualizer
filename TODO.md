# Responsive Design TODO

Best next steps for achieving optimal responsive website functionality across all viewport sizes — covering both the **Initial Button Page** (`SaucerButton`) and the **Repulsine Visualizer Page** (`RepulsineScene` / `TelemetryUI`).

> Researched against 2026 web-platform standards: CSS Container Queries, dynamic viewport units (`dvh`/`svh`), CSS `clamp()` fluid scales, Pointer Events API, and Three.js / React Three Fiber responsive patterns.

---

## 1. Replace Fixed Pixel Dimensions with Fluid Sizing

**Affects:** Both pages  
**Priority:** High

The `SaucerButton` panel, scene, tilt stage, and saucer button all use hard-coded pixel values (`940px`, `840px`, `700px`, `540px`, `410px`, etc.). On small viewports these overflow and break layout.

**Actions:**
- Swap fixed widths to `min(NNpx, NNvw)` or `clamp()` expressions:
  ```css
  /* e.g. tiltStage */
  width: clamp(280px, 72vw, 540px);
  height: clamp(280px, 72vw, 540px);
  ```
- Reduce `saucer` diameter proportionally using a CSS custom property:
  ```css
  :root { --saucer-size: clamp(220px, 55vw, 410px); }
  .saucer { width: var(--saucer-size); height: var(--saucer-size); }
  ```
- Derive all ring (`sRingA`, `sRingB`, etc.) `inset` values from the same custom property so the disc always looks correct at every size.
- Replace `min-height: 740px` on `.panel` with `min-height: fit-content` + generous `padding-block`.

---

## 2. Adopt `100dvh` for Full-Bleed Layouts

**Affects:** Both pages  
**Priority:** High

Mobile browsers show/hide their toolbar as the user scrolls. Using `100vh` (static) causes the stage to be taller than the visible area, producing a scroll bar or cut-off saucer.

**Actions:**
- Replace every `height: 100%` / `height: 100vh` at the root level with `height: 100dvh` (dynamic viewport height):
  ```css
  .stage { height: 100dvh; }
  ```
- Use `min-height: 100svh` as a safe floor so content is never shorter than the smallest possible viewport.
- In `globals.css` set `html, body { height: 100dvh; }` and remove the Tailwind `h-full` class workaround.

---

## 3. Introduce CSS Container Queries for the Panel Card

**Affects:** Button page  
**Priority:** Medium

The `.panel` card contains the saucer scene, caption, and tag labels. When embedded in different layout contexts (e.g. a future split-screen or modal), it should reflow based on its own size, not the viewport.

**Actions:**
- Add `container-type: inline-size` to `.panel`.
- Write `@container` rules that:
  - Shrink `padding` and `border-radius` for narrow containers (< 480px).
  - Stack the `panelTag` and `panelNote` labels vertically when the panel is narrow.
  - Scale the scene height proportionally via a container-query-aware custom property.

---

## 4. Fluid Typography & Spacing Design Tokens

**Affects:** Both pages  
**Priority:** Medium

All font sizes and spacing are currently fixed `px` or `em` values scattered across the CSS module. Centralising them as fluid tokens ensures consistent scaling.

**Actions:**
- Add a shared `tokens.css` (or extend `globals.css`) with fluid custom properties:
  ```css
  :root {
    --text-xs:   clamp(0.6875rem, 0.62rem + 0.35vw, 0.75rem);  /* ~11–12px */
    --text-sm:   clamp(0.75rem,   0.68rem + 0.38vw, 0.875rem); /* ~12–14px */
    --text-base: clamp(0.875rem,  0.80rem + 0.42vw, 1rem);     /* ~14–16px */
    --space-xs:  clamp(0.5rem,    0.4rem  + 0.5vw,  0.75rem);
    --space-sm:  clamp(0.75rem,   0.6rem  + 0.75vw, 1.25rem);
    --space-md:  clamp(1.25rem,   1rem    + 1.25vw, 2rem);
  }
  ```
- Replace all `font-size`, `letter-spacing`, `padding`, `gap` literals in both CSS modules with token references.
- Use `font-size: var(--text-xs)` for `.panelTag`, `.panelNote`, `.caption`.

---

## 5. Three.js / React Three Fiber Renderer Responsiveness

**Affects:** Visualizer page  
**Priority:** High

The `RepulsineScene` Three.js canvas does not currently respond to `ResizeObserver` events. On orientation change or window resize, the camera aspect ratio and renderer pixel buffer fall out of sync.

**Actions:**
- In `RepulsineScene.tsx`, attach a `ResizeObserver` to the canvas container (or use `@react-three/fiber`'s built-in `resize` prop):
  ```tsx
  // React Three Fiber handles resize automatically when you pass the
  // canvas as a child of a container with a defined CSS size.
  <Canvas style={{ width: "100%", height: "100%" }} resize={{ scroll: false }}>
  ```
- Clamp `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))` to protect low-powered mobile GPUs.
- Update `camera.aspect` and call `camera.updateProjectionMatrix()` inside the resize handler.
- Reduce geometry complexity (`segments`, `particle count`) below a `matchMedia("(max-width: 768px)")` breakpoint to maintain 60 fps on mobile.

---

## 6. Touch & Pointer Event Handling for the Saucer Button

**Affects:** Button page  
**Priority:** High

The saucer button already uses the Pointer Events API (`pointerenter`, `pointermove`, `pointerleave`). However, mobile Safari and Chrome do not fire `pointerenter` on tap without an explicit `touch-action` declaration, and the tilt interaction depends on pointer position which maps poorly to touch.

**Actions:**
- Add `touch-action: none` to `.scene` to suppress native scroll/pinch interference:
  ```css
  .scene { touch-action: none; }
  ```
- Clamp the saucer scene dimensions so the entire button is reachable with a thumb without scrolling.
- On small viewports (< 480px), disable the tilt effect (`BASE_TILT_X` stays constant, `applyTilt` is a no-op) to avoid disorienting rotations on a small screen.
- Increase the effective tap target: wrap the `<button>` in a `<div>` with `padding: 16px` (or use `outline-offset`) so the 48 × 48 px minimum tap target rule (WCAG / Google Material 3) is satisfied even when the saucer is scaled down.

---

## 7. Responsive TelemetryUI Overlay (Visualizer Page)

**Affects:** Visualizer page  
**Priority:** Medium

`TelemetryUI` is laid out with `position: fixed` and hardcoded `padding: 24px`, `left: 80px`, `width: 280px`, etc. On narrow screens these panels overflow or occlude the 3D model.

**Actions:**
- Wrap all panel measurements in `clamp()` or `min()`:
  - `padding: clamp(12px, 3vw, 24px)`
  - Telemetry panel: `width: min(280px, 88vw)`, `left: clamp(12px, 4vw, 80px)`
- On viewports narrower than `600px`:
  - Collapse the top-right controls (`Theme`, `Auto-Rotate`, `Exploded View`) behind a single icon button, opening a drawer.
  - Move the telemetry detail panel to the bottom of the screen as a bottom sheet.
  - Hide the physics legend or reduce it to colour swatches only.
- Implement the above with a `useMediaQuery("(max-width: 600px)")` hook (or a CSS container query on the UI layer div).

---

## 8. Add `<meta name="viewport">` Safeguards

**Affects:** Both pages  
**Priority:** Low (already partially present via Next.js defaults)

**Actions:**
- Confirm `layout.tsx` exports a `viewport` metadata object (Next.js 14+ App Router pattern):
  ```tsx
  export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1, // prevent double-tap zoom on 3D canvas
    userScalable: false,
  };
  ```
- `maximumScale: 1` / `userScalable: false` is acceptable here because the interactive 3D canvas already provides pinch-zoom through OrbitControls; it prevents the OS zoom from fighting Three.js camera zoom.

---

## 9. Accessibility & Contrast at All Sizes

**Affects:** Both pages  
**Priority:** Medium

Neumorphic UIs rely on subtle shadow contrast which can fall below WCAG AA (4.5 : 1 for normal text) on high-brightness screens and is invisible to users who prefer high contrast.

**Actions:**
- Audit `.panelTag`, `.panelNote`, `.caption` text against their backgrounds using the WebAIM Contrast Checker; increase opacity or darken colour tokens as needed.
- Add a `@media (prefers-contrast: more)` block that:
  - Replaces soft box-shadows with 1–2 px solid borders.
  - Boosts text opacity to `1.0`.
- Ensure the `VrilLabsLogo` fill colour (`rgba(88,103,118,0.64)`) meets contrast requirements against the panel background; provide a fallback of `#586776` (fully opaque) inside the high-contrast media query.
- Add `@media (prefers-color-scheme: dark)` variants for the button-page panel: invert shadow directions and swap gradient stops.

---

## 10. Layout Testing Matrix

Before shipping any responsive changes, validate against:

| Viewport | Device Class | Key Checks |
|---|---|---|
| 320 × 568 px | iPhone SE (portrait) | Saucer fully visible, no horizontal scroll, caption readable |
| 390 × 844 px | iPhone 14 (portrait) | Saucer centred, tap target ≥ 48 px, `dvh` fills screen |
| 768 × 1024 px | iPad (portrait) | Panel card centred, no overflow |
| 1024 × 768 px | iPad (landscape) | Visualizer overlay not clipped |
| 1440 × 900 px | Desktop | Max-width cap respected, no stretching |
| 2560 × 1440 px | 4K desktop | No blurry assets, SVG logo crisp |

Use Chrome DevTools Device Mode, BrowserStack, or [Responsively App](https://responsively.app/) for systematic cross-device testing.
