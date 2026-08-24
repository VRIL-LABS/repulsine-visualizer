---
name: gsap
description: Motion design and animation expert using GSAP for performant timelines, easing, scroll-driven motion, and imperative animation in React or vanilla JavaScript applications.
---

# GSAP

Use this skill whenever the work involves high-performance motion, timeline sequencing, scroll-driven animation, morphs, tweens, or physics-inspired movement in a web app.

## Core patterns

- Prefer `gsap.timeline()` to coordinate multiple animations across elements.
- Use `gsap.to()`, `gsap.from()`, and `gsap.fromTo()` for explicit transforms and opacity work.
- Keep animation in transforms and opacity when possible; avoid animating layout-affecting properties on every frame.
- Use `stagger`, `ease`, `duration`, `repeat`, `yoyo`, and `overwrite: 'auto'` to keep motion expressive but controlled.
- Clean up timeline instances and scroll-trigger listeners on unmount.

## React integration

- Use refs to target DOM nodes and mount a `gsap.context()` or timeline in a `useEffect`.
- Prefer one timeline per component or section, and avoid creating new tweens on every render.
- Reuse stable refs and animation configuration objects to reduce unnecessary re-creation.
- Wrap any scroll-driven behavior in ScrollTrigger with a cleanup path.

## Performance rules

- Animate transforms, opacity, scale, rotation, and filter values instead of layout width/height.
- Avoid long-running per-frame DOM reads inside animation loops.
- For complex scenes, split motion into layered timelines rather than one monolithic animation.

## Example

```tsx
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function Hero() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: 'top center',
          end: 'bottom center',
          scrub: 1,
        },
      });

      tl.from('.title', { y: 80, opacity: 0, duration: 1 })
        .from('.subtitle', { y: 40, opacity: 0, duration: 0.7 }, '-=0.4');
    }, root);

    return () => ctx.revert();
  }, []);

  return <div ref={root}>...</div>;
}
```

## When to use GSAP

- User asks for choreographed motion, from subtle UI transitions to cinematic hero scenes.
- The animation needs scrubbed scroll timing, loops, or complex sequencing.
- The scene needs precise timeline control beyond basic CSS transitions.
