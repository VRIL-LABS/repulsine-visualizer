"use client";

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface VortexParticlesProps {
  isDark: boolean;
}

const GUST_COUNT = 30;
const POINTS_PER_GUST = 50;

export function VortexParticles({ isDark }: VortexParticlesProps) {
  const windGroupRef = useRef<THREE.Group>(null);
  const windMatRef = useRef<THREE.LineDashedMaterial>(null);

  // Build static gust geometry once — no CPU work per frame
  const gustLines = useMemo(() => {
    const lines: THREE.Line[] = [];
    const mat = new THREE.LineDashedMaterial({
      color: isDark ? 0x00ffff : 0x0f766e,
      linewidth: 1,
      dashSize: 3.0,
      gapSize: 6.0,
      transparent: true,
      opacity: isDark ? 0.5 : 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    for (let i = 0; i < GUST_COUNT; i++) {
      const pts: THREE.Vector3[] = [];
      const startAngle =
        (i / GUST_COUNT) * Math.PI * 2 + (Math.random() * 0.5 - 0.25);
      const radiusTop = Math.random() * 4 + 4;
      const radiusBottom = 0.2;
      const heightTop = 15 + Math.random() * 5;
      const heightBottom = -4.9;

      for (let j = 0; j <= POINTS_PER_GUST; j++) {
        const t = j / POINTS_PER_GUST;
        // Cycloidal: radius decreases as it spirals into the core
        const r = radiusTop * Math.pow(1 - t, 1.5) + radiusBottom;
        const y = heightTop * (1 - t) + heightBottom * t;
        // Logarithmic spiral: angular velocity increases toward center
        // (conservation of angular momentum: ω = L / (m·r²))
        const theta = startAngle + t * Math.PI * 6;
        pts.push(
          new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r)
        );
      }

      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(geo, mat);
      line.computeLineDistances();
      lines.push(line);
    }

    return lines;
  }, [isDark]);

  // Grab material reference from the first line
  const matRef = useMemo(
    () => (gustLines.length > 0 ? (gustLines[0].material as THREE.LineDashedMaterial) : null),
    [gustLines]
  );

  useFrame((_, delta) => {
    // Zero-CPU animation: spin the group and offset the dash texture
    if (windGroupRef.current) {
      windGroupRef.current.rotation.y += 1.5 * delta;
    }
    if (matRef) {
      matRef.dashOffset -= 15.0 * delta;
    }
  });

  return (
    <group ref={windGroupRef}>
      {gustLines.map((line, i) => (
        <primitive key={i} object={line} />
      ))}
    </group>
  );
}
