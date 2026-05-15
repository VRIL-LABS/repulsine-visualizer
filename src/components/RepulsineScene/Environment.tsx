"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface EnvironmentProps {
  isDark: boolean;
}

export function Environment({ isDark }: EnvironmentProps) {
  const ringMatRef = useRef<THREE.LineDashedMaterial>(null);

  const bunkerPoints = [
    new THREE.Vector2(0, -5),
    new THREE.Vector2(40, -5),
    new THREE.Vector2(38, 0),
    new THREE.Vector2(38, 50),
    new THREE.Vector2(30, 80),
    new THREE.Vector2(0, 80),
  ];

  const industrialColor = isDark ? 0x06090c : 0xd8e4ec;
  const ringColor = isDark ? 0x0f766e : 0x0b5c56;

  // Telemetry floor rings
  const ringLines: THREE.Line[] = [];
  const ringMat = new THREE.LineDashedMaterial({
    color: ringColor,
    linewidth: 1,
    dashSize: 0.5,
    gapSize: 2.5,
    transparent: true,
    opacity: 0.2,
  });

  for (let i = 0; i < 6; i++) {
    const r = 5 + i * 6;
    const curve = new THREE.EllipseCurve(0, 0, r, r, 0, Math.PI * 2, false, 0);
    const points = curve.getPoints(64);
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geo, ringMat);
    line.computeLineDistances();
    line.rotation.x = -Math.PI / 2;
    line.position.y = -4.85;
    ringLines.push(line);
  }

  useFrame((_, delta) => {
    if (ringMatRef.current) {
      ringMatRef.current.dashOffset += 10.0 * delta;
    }
  });

  return (
    <group>
      {/* Bunker walls */}
      <mesh receiveShadow>
        <latheGeometry args={[bunkerPoints, 32]} />
        <meshStandardMaterial
          color={industrialColor}
          roughness={0.9}
          metalness={0.2}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Floor */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -4.9, 0]}>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial
          color={isDark ? 0x0a0d10 : 0xc8d5e2}
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {/* Telemetry rings */}
      {ringLines.map((line, i) => (
        <primitive key={i} object={line} />
      ))}

      {/* Animated ring material ref hack — attach to first ring */}
      {ringLines[0] && (
        <primitive
          object={ringLines[0].material}
          ref={ringMatRef}
        />
      )}

      {/* Lighting */}
      <ambientLight intensity={isDark ? 0.15 : 0.6} />
      <spotLight
        position={[0, 45, 0]}
        intensity={isDark ? 2.5 : 1.0}
        angle={Math.PI / 6}
        penumbra={0.8}
        decay={1}
        distance={100}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight
        position={[-20, 10, -20]}
        color={0x0f766e}
        intensity={isDark ? 2.0 : 0.5}
        distance={70}
      />
      <pointLight
        position={[20, 5, 15]}
        color={isDark ? 0xffc25c : 0xffeedd}
        intensity={isDark ? 0.8 : 0.3}
        distance={50}
      />
    </group>
  );
}
