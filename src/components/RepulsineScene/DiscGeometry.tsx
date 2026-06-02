"use client";

import { useRef, useMemo, useCallback, useEffect } from "react";
import * as THREE from "three";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import type { HoveredPart } from "./types";

interface DiscGeometryProps {
  isExploded: boolean;
  autoRotate: boolean;
  onHover: (part: HoveredPart | null) => void;
  isDark: boolean;
  isMobile?: boolean;
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
function buildCorrugatedPlate(segments: number): THREE.BufferGeometry {
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
  isMobile = false,
}: DiscGeometryProps) {
  const craftRef = useRef<THREE.Group>(null);
  const shellRef = useRef<THREE.Mesh>(null);
  const plateGroupRef = useRef<THREE.Group>(null);
  const intakeRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const pipeGroupRef = useRef<THREE.Group>(null);

  const { camera } = useThree();

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
  const hullSegments = isMobile ? 40 : 64;
  const torusSegments = isMobile ? 40 : 64;
  const pipeCount = isMobile ? 10 : 16;
  const corrugatedGeo = useMemo(
    () => buildCorrugatedPlate(isMobile ? 80 : 128),
    [isMobile]
  );

  useEffect(() => {
    return () => {
      corrugatedGeo.dispose();
    };
  }, [corrugatedGeo]);

  // Track hovered object
  const hoveredRef = useRef<THREE.Mesh | null>(null);
  const originalMatRef = useRef<THREE.Material | THREE.Material[] | null>(null);
  // Store hovered part metadata separately for continuous screenPos updates
  const hoveredMetaRef = useRef<Omit<HoveredPart, "screenPos"> | null>(null);
  // Stable ref for onHover to avoid stale closure issues + throttle screen pos
  const onHoverRef = useRef(onHover);
  const lastScreenPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    onHoverRef.current = onHover;
  }, [onHover]);

  // Apply the teal highlight material to a part and capture its metadata.
  const applyHighlight = useCallback(
    (obj: THREE.Mesh) => {
      if (hoveredRef.current === obj) return;
      // Restore a previously highlighted part first
      if (hoveredRef.current && originalMatRef.current) {
        hoveredRef.current.material = originalMatRef.current;
      }
      hoveredRef.current = obj;
      originalMatRef.current = obj.material;
      obj.material = highlightMat;
      // Reset throttle so the connector snaps to the new part immediately
      lastScreenPosRef.current = null;

      const ud = obj.userData as {
        name?: string;
        desc?: string;
        v1?: string;
        l1?: string;
        v2?: string;
        l2?: string;
      };
      hoveredMetaRef.current = {
        name: ud.name ?? "Component",
        desc: ud.desc ?? "",
        v1: ud.v1 ?? "",
        l1: ud.l1 ?? "",
        v2: ud.v2 ?? "",
        l2: ud.l2 ?? "",
      };
    },
    [highlightMat],
  );

  // Remove the highlight and hide the telemetry panel.
  const clearHighlight = useCallback(() => {
    if (hoveredRef.current && originalMatRef.current) {
      hoveredRef.current.material = originalMatRef.current;
    }
    hoveredRef.current = null;
    originalMatRef.current = null;
    hoveredMetaRef.current = null;
    lastScreenPosRef.current = null;
    onHoverRef.current(null);
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

  // ─── Pointer interaction (R3F events) ───
  // Hover (mouse) shows the component panel; tap (touch/pen) toggles it so
  // the labels work on both desktop and mobile. Using R3F's event system
  // guarantees reliable enter/leave handling (no "stuck" highlight when the
  // cursor leaves the canvas) and unified touch support.
  const handlePointerOver = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (e.pointerType !== "mouse") return; // touch handled on tap
      e.stopPropagation();
      applyHighlight(e.object as THREE.Mesh);
    },
    [applyHighlight],
  );

  const handlePointerOut = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (e.pointerType !== "mouse") return;
      e.stopPropagation();
      if (hoveredRef.current === e.object) clearHighlight();
    },
    [clearHighlight],
  );

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (e.pointerType === "mouse") return; // mouse uses hover
      e.stopPropagation();
      // Tap toggles the selected part on touch devices
      if (hoveredRef.current === e.object) {
        clearHighlight();
      } else {
        applyHighlight(e.object as THREE.Mesh);
      }
    },
    [applyHighlight, clearHighlight],
  );

  // Tapping/clicking empty space dismisses the active selection
  const handlePointerMissed = useCallback(() => {
    if (hoveredRef.current) clearHighlight();
  }, [clearHighlight]);

  const interactionHandlers = useMemo(
    () => ({
      onPointerOver: handlePointerOver,
      onPointerOut: handlePointerOut,
      onPointerDown: handlePointerDown,
    }),
    [handlePointerOver, handlePointerOut, handlePointerDown],
  );

  return (
    <group ref={craftRef} position={[0, 5, 0]} onPointerMissed={handlePointerMissed}>
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
        castShadow={!isMobile}
        onUpdate={(self) => setPartTarget(self, 3.5, 8.0)}
        {...interactionHandlers}
      >
        <torusGeometry args={[1.6, 0.25, isMobile ? 10 : 16, torusSegments]} />
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
        {...interactionHandlers}
      >
        <sphereGeometry args={[0.8, isMobile ? 20 : 32, isMobile ? 16 : 32]} />
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
        castShadow={!isMobile}
        onUpdate={(self) => setPartTarget(self, 0, 4.5)}
        {...interactionHandlers}
      >
        <latheGeometry args={[hullPoints, hullSegments]} />
        <primitive object={shellMat} attach="material" />
        {/* Wire overlay — excluded from raycasting so it doesn't steal hover */}
        <mesh raycast={() => null}>
          <latheGeometry args={[hullPoints, hullSegments]} />
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
            castShadow={!isMobile}
            {...interactionHandlers}
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
        {Array.from({ length: pipeCount }, (_, i) => {
          const angle = (i / pipeCount) * Math.PI * 2;
          const br = 0.35;
          return (
            <mesh
              key={i}
              rotation={[Math.PI / 2, 0, 0]}
              position={[0, Math.sin(angle) * br, 0]}
              userData={{
                name: "Capillary Whorl",
                desc: `Dense bundle of ${pipeCount} copper tubes wrapping the chamber in centripetal vector.`,
                v1: String(pipeCount),
                l1: "Tube Count",
                v2: "Centripetal",
                l2: "Flow Vector",
              }}
              {...interactionHandlers}
            >
              <torusGeometry
                args={[4.4 + Math.cos(angle) * br, 0.04, isMobile ? 6 : 8, torusSegments]}
              />
              <primitive object={copperMat} attach="material" />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}
