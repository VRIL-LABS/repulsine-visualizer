"use client";

import { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Environment as IBLEnvironment, Lightformer } from "@react-three/drei";

interface EnvironmentProps {
  isDark: boolean;
  isMobile?: boolean;
}

export function Environment({ isDark, isMobile = false }: EnvironmentProps) {
  // Steel-gilded underground bunker profile — flared dome ceiling with thick walls
  const bunkerPoints = [
    new THREE.Vector2(0, -5),
    new THREE.Vector2(40, -5),
    new THREE.Vector2(40, 0),
    new THREE.Vector2(42, 2),
    new THREE.Vector2(42, 38),
    new THREE.Vector2(40, 42),
    new THREE.Vector2(36, 52),
    new THREE.Vector2(28, 64),
    new THREE.Vector2(16, 74),
    new THREE.Vector2(0, 78),
  ];

  const industrialColor = isDark ? 0x24323f : 0xd8e4ec;
  const ringColor = isDark ? 0x0f766e : 0x0b5c56;

  // Memoize ring geometry and material to prevent GPU leaks on re-render
  const { ringLines, ringMat } = useMemo(() => {
    const mat = new THREE.LineDashedMaterial({
      color: ringColor,
      linewidth: 1,
      dashSize: 0.5,
      gapSize: 2.5,
      transparent: true,
      opacity: 0.18,
    });

    const lines: THREE.Line[] = [];
    const ringCount = isMobile ? 4 : 6;
    const pointCount = isMobile ? 40 : 64;
    for (let i = 0; i < ringCount; i++) {
      const r = 5 + i * 6;
      const curve = new THREE.EllipseCurve(0, 0, r, r, 0, Math.PI * 2, false, 0);
      const points = curve.getPoints(pointCount);
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geo, mat);
      line.computeLineDistances();
      line.rotation.x = -Math.PI / 2;
      line.position.y = -4.85;
      lines.push(line);
    }
    return { ringLines: lines, ringMat: mat };
  }, [isMobile, ringColor]);

  // Dispose GPU resources when replaced or unmounted
  useEffect(() => {
    return () => {
      ringLines.forEach((l) => l.geometry.dispose());
      ringMat.dispose();
    };
  }, [ringLines, ringMat]);

  // Animate by rotating the rings group
  const ringsGroupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ringsGroupRef.current) {
      ringsGroupRef.current.rotation.y += 0.4 * delta;
    }
  });

  // Steel wall panels — vertical ribs lining the bunker walls
  const ribCount = isMobile ? 12 : 24;
  const ribGeo = useMemo(() => new THREE.BoxGeometry(0.3, 40, 1.5), []);

  // Ceiling hatch ring — large industrial accent near the dome apex
  const hatchRingGeo = useMemo(
    () => new THREE.TorusGeometry(6, 0.35, isMobile ? 8 : 16, isMobile ? 32 : 64),
    [isMobile],
  );

  return (
    <group>
      {/* Bunker walls — dark steel with high metalness */}
      <mesh receiveShadow={!isMobile}>
        <latheGeometry args={[bunkerPoints, isMobile ? 20 : 48]} />
        <meshStandardMaterial
          color={industrialColor}
          roughness={isDark ? 0.65 : 0.85}
          metalness={isDark ? 0.45 : 0.2}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Steel rivet / panel ribs along bunker wall */}
      {!isMobile &&
        Array.from({ length: ribCount }, (_, i) => {
          const angle = (i / ribCount) * Math.PI * 2;
          const wallR = 39.5;
          return (
            <mesh
              key={`rib-${i}`}
              geometry={ribGeo}
              position={[Math.cos(angle) * wallR, 16, Math.sin(angle) * wallR]}
              rotation={[0, -angle + Math.PI / 2, 0]}
              receiveShadow
            >
              <meshStandardMaterial
                color={isDark ? 0x18222d : 0xc4cdd8}
                roughness={0.6}
                metalness={0.7}
              />
            </mesh>
          );
        })}

      {/* Floor — polished concrete / steel plate */}
      <mesh receiveShadow={!isMobile} rotation={[-Math.PI / 2, 0, 0]} position={[0, -4.9, 0]}>
        <circleGeometry args={[42, isMobile ? 32 : 64]} />
        <meshStandardMaterial
          color={isDark ? 0x1c2731 : 0xc8d5e2}
          roughness={isDark ? 0.55 : 0.7}
          metalness={isDark ? 0.35 : 0.1}
        />
      </mesh>

      {/* Inner floor accent ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4.88, 0]}>
        <ringGeometry args={[14, 15, isMobile ? 32 : 64]} />
        <meshStandardMaterial
          color={isDark ? 0x0f766e : 0x0b5c56}
          roughness={0.4}
          metalness={0.6}
          emissive={new THREE.Color(isDark ? 0x0f766e : 0x0b5c56)}
          emissiveIntensity={isDark ? 0.15 : 0.05}
        />
      </mesh>

      {/* Ceiling hatch ring — industrial overhead detail */}
      <mesh
        geometry={hatchRingGeo}
        position={[0, 72, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial
          color={isDark ? 0x181f28 : 0xb8c4d0}
          roughness={0.45}
          metalness={0.8}
        />
      </mesh>

      {/* Telemetry rings */}
      <group ref={ringsGroupRef}>
        {ringLines.map((line, i) => (
          <primitive key={i} object={line} />
        ))}
      </group>

      {/* ─── Lighting: soft studio-style fill for an underground chamber ─── */}

      {/*
        Image-based lighting (IBL) — procedurally generated from Lightformers,
        no network HDR fetch required. Metallic PBR surfaces (the craft hull,
        copper plates) need an environment to reflect; without this they render
        near-black regardless of direct lights. Re-mounted on theme change via
        `key` so the captured cube map matches the current palette.
      */}
      <IBLEnvironment
        key={isDark ? "ibl-dark" : "ibl-light"}
        resolution={isMobile ? 128 : 256}
        frames={1}
        environmentIntensity={isDark ? 0.45 : 0.7}
      >
        {/* Base reflection colour — keeps metals from reflecting pure black */}
        <color attach="background" args={[isDark ? "#0d1620" : "#aebccb"]} />
        {/* Soft overhead key — large disc, the dominant fill */}
        <Lightformer
          form="circle"
          intensity={isDark ? 2.4 : 2.2}
          position={[0, 14, 0]}
          rotation-x={Math.PI / 2}
          scale={16}
          color="#dce8f4"
        />
        {/* Cool side wrap */}
        <Lightformer
          form="rect"
          intensity={isDark ? 1.0 : 1.2}
          position={[-12, 5, -8]}
          rotation-y={Math.PI / 4}
          scale={[8, 12, 1]}
          color="#41607a"
        />
        {/* Teal Vril rim */}
        <Lightformer
          form="rect"
          intensity={isDark ? 0.9 : 1.0}
          position={[12, 4, 9]}
          rotation-y={-Math.PI / 4}
          scale={[8, 12, 1]}
          color="#1f5a52"
        />
      </IBLEnvironment>

      {/* Ambient base — soft, even fill so nothing falls to pure black */}
      <ambientLight intensity={isDark ? 0.65 : 0.6} />

      {/* Key directional — broad, soft primary light (replaces harsh hotspot) */}
      <directionalLight
        position={[10, 26, 14]}
        intensity={isDark ? 1.2 : 0.6}
        color={isDark ? 0xdce8f4 : 0xffffff}
      />

      {/* Overhead spot — wide & fully soft, a gentle wash from the ceiling hatch
          rather than a tight spotlight cone */}
      <spotLight
        position={[0, 68, 0]}
        target-position={[0, 0, 0]}
        intensity={isDark ? 2.4 : 0.8}
        angle={Math.PI / 3}
        penumbra={1}
        decay={1.6}
        distance={140}
        color={isDark ? 0xd4e0ec : 0xffffff}
        castShadow={!isMobile}
        shadow-mapSize={[isMobile ? 512 : 2048, isMobile ? 512 : 2048]}
        shadow-bias={-0.0002}
      />

      {/* Secondary overhead fill — offset to soften the central highlight */}
      <spotLight
        position={[10, 50, 16]}
        intensity={isDark ? 1.0 : 0.4}
        angle={Math.PI / 3.2}
        penumbra={1}
        decay={1.8}
        distance={100}
        color={isDark ? 0xb0c8e0 : 0xffeedd}
        castShadow={false}
      />

      {/* Teal accent — Vril energy glow from behind the device */}
      <pointLight
        position={[-18, 8, -18]}
        color={0x0f766e}
        intensity={isDark ? 2.6 : 0.6}
        distance={60}
        decay={2}
      />

      {/* Warm accent — subtle amber industrial lamp, opposite side */}
      <pointLight
        position={[22, 12, 18]}
        color={isDark ? 0xffc25c : 0xffeedd}
        intensity={isDark ? 1.2 : 0.4}
        distance={50}
        decay={2}
      />

      {/* Dim rim light from below — reflected glow off the steel floor */}
      <pointLight
        position={[0, -3, 0]}
        color={isDark ? 0x0a2520 : 0xd0e0dd}
        intensity={isDark ? 0.5 : 0.1}
        distance={30}
        decay={2}
      />

      {/* Hemisphere light — sky/ground colour separation for ambient fill */}
      <hemisphereLight
        color={isDark ? 0x2a3f52 : 0xf0f4f8}
        groundColor={isDark ? 0x0a1018 : 0xd0d8e0}
        intensity={isDark ? 0.9 : 0.5}
      />
    </group>
  );
}
