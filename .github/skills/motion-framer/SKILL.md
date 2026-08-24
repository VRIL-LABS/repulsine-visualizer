---
name: motion-framer
description: Framer Motion expert for layout transitions, shared element animations, AnimatePresence flows, and performant React UI choreography.
---

# Motion + Framer Motion

Use this skill for interactive React-driven motion design and layout animations where the goal is smooth, expressive transitions with solid accessibility and clean code organization.

## Core capabilities

- `motion` primitives: `motion.div`, `motion.section`, `motion.button`, etc.
- `layout` prop for animating element positions and sizes smoothly.
- `AnimatePresence` for enter/exit transitions.
- `layoutId` for shared-element transitions between screens or cards.
- `variants` for state-driven animation orchestration.
- `useReducedMotion` and motion preference awareness.

## Patterns to prefer

- Use `layout` when elements reorder, expand, collapse, or change size in place.
- Use `layoutId` to morph matching elements between two views without manual tween math.
- Pair `AnimatePresence` with keyed children for deterministic enter/exit changes.
- Prefer `transition` configs with spring or gentle easing for smoothness.
- Keep animation logic in declarative component props instead of imperative DOM mutation when possible.

## Shared-element transitions

```tsx
import { AnimatePresence, motion } from 'framer-motion';

export function GalleryItem({ active, item }) {
  return (
    <AnimatePresence mode="wait">
      {active ? (
        <motion.div
          key={item.id}
          layoutId={item.id}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        />
      ) : null}
    </AnimatePresence>
  );
}
```

## Layout animation pattern

```tsx
<motion.div
  layout
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -12 }}
  transition={{ layout: { type: 'spring', stiffness: 200, damping: 28 } }}
/>
```

## Rules

- Do not fight the browser layout engine with manual top/left transforms when a layout animation will do the job.
- Keep animations deterministic and avoid heavy `whileHover` or `whileTap` logic on dozens of nodes in a list.
- Respect reduced-motion preferences for non-essential movement.
- For lists, use stable keys and avoid reordering the list during animation unless the layout transition is intentional.

## When to use Framer Motion

- User wants animated page transitions, cards, modals, drawers, or navigation state changes.
- The design needs `layout` prop transitions, exit animations, or shared-element motion.
- The UI needs declarative, composable animations in React without using imperative animation libraries.
