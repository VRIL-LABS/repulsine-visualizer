"use client";

import { useRef, useMemo, useCallback, useEffect } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import type { HoveredPart } from "./types";

interface DiscGeometryProps {
  isExploded: boolean;
  autoRotate: boolean;
  onHover: (part: HoveredPart | null) => void;
  isDark: boolean;
}

// Build hull profile points for the Repulsine aerodynamic shell (LatheGeometry)
function buildHullPoints(): THREE.Vector2[] {
  const pts: THREE.Vector2[] = [];
  pts.push(new THREE.Vector2(0.75, 3.5));
  pts.push(new THREE.Vector2(1.5, 3.5));
  for (let i = 0; i <= 8; i++) {
    pts.push(
      new THREE.Vector2(
        1.5 + Math.sin(i * 0.2) * 2.0,
        3.5 - Math.cos(i * 0.2) * 1.0
      )
    );
  }
  pts.push(new THREE.Vector2(6.5, 1.0));
  pts.push(new THREE.Vector2(7.8, 0.5));
  pts.push(new THREE.Vector2(8.2, 0.0));
  pts.push(new THREE.Vector2(8.2, -0.5));
  pts.push(new THREE.Vector2(7.0, -1.0));
  pts.push(new THREE.Vector2(2.5, -2.5));
  return pts;
}

// Build corrugated wave-disc geometry (sinusoidal troughs in a cylinder)
function buildCorrugatedPlate(segments = 128): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(5.0, 5.0, 0.05, segments, 1);
  const pv = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pv.count; i++) {
    const x = pv.getX(i);
    const z = pv.getZ(i);
    pv.setY(
      i,
      pv.getY(i) +
        Math.sin(Math.atan2(z, x) * 24) *
          0.15 *
          (Math.sqrt(x * x + z * z) / 5.0)
    );
  }
  geo.computeVertexNormals();
  return geo;
}

export function RepulsineDisc({
  isExploded,
  autoRotate,
  onHover,
  isDark,
}: DiscGeometryProps) {
  const craftRef = useRef<THREE.Group>(null);
  const shellRef = useRef<THREE.Mesh>(null);
  const plateGroupRef = useRef<THREE.Group>(null);
  const intakeRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const pipeGroupRef = useRef<THREE.Group>(null);

  const { camera, gl } = useThree();

  // Target Y positions: [baseY, explodedY]
  const partTargets = useRef<Map<THREE.Object3D, [number, number]>>(new Map());

  const copperMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: isDark ? 0xc27c4a : 0xa0622a,
        metalness: 0.95,
        roughness: 0.3,
      }),
    [isDark]
  );

  const highlightMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x0f766e,
        metalness: 0.8,
        roughness: 0.1,
        emissive: new THREE.Color(0x0f766e),
        emissiveIntensity: 0.5,
      }),
    []
  );

  const shellMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: isDark ? 0x4a4d52 : 0x8090a8,
        metalness: 0.85,
        roughness: 0.35,
        side: THREE.DoubleSide,
      }),
    [isDark]
  );

  const coreMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: new THREE.Color(0x00aaff),
        emissiveIntensity: isDark ? 0.8 : 0.3,
      }),
    [isDark]
  );

  const hullPoints = useMemo(() => buildHullPoints(), []);
  const corrugatedGeo = useMemo(() => buildCorrugatedPlate(), []);

  // Track hovered object
  const hoveredRef = useRef<THREE.Object3D | null>(null);
  const originalMatRef = useRef<THREE.Material | THREE.Material[] | null>(null);
  // Store hovered part metadata separately for continuous screenPos updates
  const hoveredMetaRef = useRef<Omit<HoveredPart, "screenPos"> | null>(null);
  // Stable ref for onHover to avoid stale closure issues + throttle screen pos
  const onHoverRef = useRef(onHover);
  const lastScreenPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    onHoverRef.current = onHover;
  }, [onHover]);

  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  // Use a ref (not useMemo) so mutation inside the callback doesn't trigger lint warnings
  const mouseRef = useRef(new THREE.Vector2());

  const getInteractables = useCallback((): THREE.Object3D[] => {
    const list: THREE.Object3D[] = [];
    if (intakeRef.current) list.push(intakeRef.current);
    if (coreRef.current) list.push(coreRef.current);
    if (shellRef.current) list.push(shellRef.current);
    if (plateGroupRef.current)
      plateGroupRef.current.children.forEach((c) => list.push(c));
    if (pipeGroupRef.current)
      pipeGroupRef.current.children.forEach((c) => list.push(c));
    return list;
  }, []);

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.1);

    if (craftRef.current && autoRotate) {
      craftRef.current.rotation.y += 0.5 * dt;
    }
    if (shellRef.current) shellRef.current.rotation.y -= 1.0 * dt;
    if (plateGroupRef.current) plateGroupRef.current.rotation.y -= 3.0 * dt;

    // Pulse core emissive — clamp to non-negative
    if (coreRef.current) {
      const mat = coreRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = Math.max(
        0,
        (isDark ? 0.6 : 0.2) + Math.sin(clock.elapsedTime * 2.5) * 0.3
      );
    }

    // Explode/collapse lerp
    partTargets.current.forEach(([baseY, expY], obj) => {
      const target = isExploded ? expY : baseY;
      obj.position.y += (target - obj.position.y) * 0.1;
    });

    // Continuously update screenPos of the hovered object so the SVG
    // connector tracks it correctly while the craft auto-rotates or the
    // camera moves. Only trigger a state update when position changes
    // significantly (>2px) to avoid render thrashing.
    if (hoveredRef.current && hoveredMetaRef.current) {
      const worldPos = new THREE.Vector3();
      hoveredRef.current.getWorldPosition(worldPos);
      worldPos.project(camera);
      const sx = (worldPos.x * 0.5 + 0.5) * window.innerWidth;
      const sy = (worldPos.y * -0.5 + 0.5) * window.innerHeight;
      const last = lastScreenPosRef.current;
      if (!last || Math.abs(sx - last.x) > 2 || Math.abs(sy - last.y) > 2) {
        lastScreenPosRef.current = { x: sx, y: sy };
        onHoverRef.current({ ...hoveredMetaRef.current, screenPos: { x: sx, y: sy } });
      }
    }
  });

  // Register part targets after mount
  const setPartTarget = useCallback(
    (obj: THREE.Object3D | null, baseY: number, expY: number) => {
      if (obj) {
        partTargets.current.set(obj, [baseY, expY]);
        obj.position.y = baseY;
      }
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouseRef.current, camera);

      const hits = raycaster.intersectObjects(getInteractables(), false);
      if (hits.length > 0) {
        const obj = hits[0].object;
        if (hoveredRef.current !== obj) {
          // Reset previous
          if (hoveredRef.current && originalMatRef.current) {
            (hoveredRef.current as THREE.Mesh).material =
              originalMatRef.current as THREE.Material;
          }
          hoveredRef.current = obj;
          originalMatRef.current = (obj as THREE.Mesh).material;
          (obj as THREE.Mesh).material = highlightMat;

          const ud = obj.userData as {
            name: string;
            desc: string;
            v1: string;
            l1: string;
            v2: string;
            l2: string;
          };

          hoveredMetaRef.current = {
            name: ud.name ?? "Component",
            desc: ud.desc ?? "",
            v1: ud.v1 ?? "",
            l1: ud.l1 ?? "",
            v2: ud.v2 ?? "",
            l2: ud.l2 ?? "",
          };
        }
      } else {
        if (hoveredRef.current && originalMatRef.current) {
          (hoveredRef.current as THREE.Mesh).material =
            originalMatRef.current as THREE.Material;
        }
        hoveredRef.current = null;
        originalMatRef.current = null;
        hoveredMetaRef.current = null;
        lastScreenPosRef.current = null;
        onHoverRef.current(null);
      }
    },
    [camera, getInteractables, highlightMat, raycaster]
  );

  // Attach mousemove handler once via effect (not per-frame)
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener("mousemove", handlePointerMove);
    return () => {
      canvas.removeEventListener("mousemove", handlePointerMove);
    };
  }, [gl.domElement, handlePointerMove]);

  return (
    <group ref={craftRef} position={[0, 5, 0]}>
      {/* Intake cowl */}
      <mesh
        ref={intakeRef}
        rotation={[Math.PI / 2, 0, 0]}
        userData={{
          name: "Intake Cowl",
          desc: "Draws ambient air into the implosion chamber via Coandă-effect lip.",
          v1: "1.2 atm",
          l1: "Intake Prs",
          v2: "14 m/s",
          l2: "Flow Rate",
        }}
        castShadow
        onUpdate={(self) => setPartTarget(self, 3.5, 8.0)}
      >
        <torusGeometry args={[1.6, 0.25, 16, 64]} />
        <primitive object={copperMat} attach="material" />
      </mesh>

      {/* Implosion core */}
      <mesh
        ref={coreRef}
        userData={{
          name: "Suction Core",
          desc: "Primary cycloidal implosion zone — lowest pressure in the device.",
          v1: "−18 °C",
          l1: "Core Temp",
          v2: "0.15 atm",
          l2: "Pressure",
        }}
        onUpdate={(self) => setPartTarget(self, 0, 0)}
      >
        <sphereGeometry args={[0.8, 32, 32]} />
        <primitive object={coreMat} attach="material" />
      </mesh>

      {/* Aerodynamic Coandă hull */}
      <mesh
        ref={shellRef}
        userData={{
          name: "Coandă Hull",
          desc: "LatheGeometry shell maintains laminar low-pressure lift via Coandă-effect curvature.",
          v1: "12 000",
          l1: "RPM",
          v2: "1.4 kg",
          l2: "Lift",
        }}
        castShadow
        onUpdate={(self) => setPartTarget(self, 0, 4.5)}
      >
        <latheGeometry args={[hullPoints, 64]} />
        <primitive object={shellMat} attach="material" />
        {/* Wire overlay */}
        <mesh>
          <latheGeometry args={[hullPoints, 64]} />
          <meshBasicMaterial
            color={0x111111}
            wireframe
            transparent
            opacity={0.15}
          />
        </mesh>
      </mesh>

      {/* Corrugated wave-disc turbine plates */}
      <group
        ref={plateGroupRef}
        onUpdate={(self) => setPartTarget(self, 0.7, -3.0)}
      >
        {[0, 1, 2].map((j) => (
          <mesh
            key={j}
            geometry={corrugatedGeo}
            position={[0, j * 0.45, 0]}
            userData={{
              name: "Corrugated Wave-Disc",
              desc: "Sinusoidal troughs mimic trout-gill dynamics to induce logarithmic spiral fluid flow.",
              v1: "Copper",
              l1: "Material",
              v2: "Cycloidal",
              l2: "Flow Pattern",
            }}
            castShadow
          >
            <primitive object={copperMat} attach="material" />
          </mesh>
        ))}
      </group>

      {/* Capillary whorl (16-bundle copper pipes) */}
      <group
        ref={pipeGroupRef}
        onUpdate={(self) => setPartTarget(self, 2.2, -6.0)}
      >
        {Array.from({ length: 16 }, (_, i) => {
          const angle = (i / 16) * Math.PI * 2;
          const br = 0.35;
          return (
            <mesh
              key={i}
              rotation={[Math.PI / 2, 0, 0]}
              position={[0, Math.sin(angle) * br, 0]}
              userData={{
                name: "Capillary Whorl",
                desc: "Dense bundle of 16 copper tubes wrapping the chamber in centripetal vector.",
                v1: "16",
                l1: "Tube Count",
                v2: "Centripetal",
                l2: "Flow Vector",
              }}
            >
              <torusGeometry
                args={[4.4 + Math.cos(angle) * br, 0.04, 8, 64]}
              />
              <primitive object={copperMat} attach="material" />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}
