---
name: react-three-fiber
description: React Three Fiber expert for building performant 3D scenes, camera controls, materials, geometries, lighting, and post-processing in React applications.
---

# React Three Fiber

Use this skill when building or modifying interactive 3D scenes in React using `@react-three/fiber`, usually alongside `three`, `@react-three/drei`, and optionally `@react-three/postprocessing`.

## Core principles

- Build the 3D scene as a declarative component tree under a single `<Canvas />`.
- Use `useFrame` for animation loops and `useThree` to access the camera, renderer, and scene.
- Memoize geometry and materials when they are stable across renders.
- Prefer `InstancedMesh`, `useMemo`, and `useRef` to avoid repeated object allocations.
- Keep camera and orbit control logic stable so the scene does not re-render excessively.

## Scene setup

- Configure `Canvas` with the right `camera`, `dpr`, `shadows`, and `gl` settings.
- Set a proper `near` and `far` plane to avoid clipping artifacts.
- If the camera starts in a partially enclosed room, ensure the default view is aligned with the open side or opening in the environment mesh.

## Performance and correctness

- Use `frameloop` and `dpr` settings to stay within GPU budget.
- Avoid recreating large arrays or geometry in each animation frame.
- Keep `OrbitControls` damping and limits consistent with the scene scale.
- Consider `side={THREE.DoubleSide}` on decorative shells when the camera must see inside a room or enclosure.

## Common patterns

```tsx
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';

function RotatingCube() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.75;
    }
  });

  return (
    <mesh ref={ref}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#67e8f9" />
    </mesh>
  );
}

export function Scene() {
  return (
    <Canvas camera={{ position: [0, 1.5, 4], fov: 45 }}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[2, 3, 2]} intensity={1.4} />
      <RotatingCube />
      <Environment preset="studio" />
      <OrbitControls enablePan={false} minDistance={2} maxDistance={8} />
    </Canvas>
  );
}
```

## When to use R3F

- User wants a React-based canvas with meshes, lighting, cameras, or interactive 3D scenes.
- The work needs data-driven props and state control over 3D objects without writing raw WebGL imperative code.
- The scene includes custom geometry, particles, orbit controls, or post-processing.
