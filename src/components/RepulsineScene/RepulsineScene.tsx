"use client";

import { Suspense, useRef, useState, useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import { Environment } from "./Environment";
import { RepulsineDisc } from "./DiscGeometry";
import { VortexParticles } from "./VortexParticles";
import { TelemetryUI } from "./TelemetryUI";
import { CycloidalVortexWidget } from "./CycloidalVortexWidget";
import type { HoveredPart } from "./types";

interface RepulsineSceneProps {
  onBack: () => void;
}

/** Returns true when the browser supports WebGL. */
function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

/** Detect mobile/tablet devices to reduce GPU load. */
function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod|Android/i.test(ua) ||
    (navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua));
}

// Stable offset vector – avoids re-creating a new object every render
const CHROMATIC_OFFSET = new THREE.Vector2(0.0018, 0.0018);

export function RepulsineScene({ onBack }: RepulsineSceneProps) {
  const [autoRotate, setAutoRotate] = useState(true);
  const [isExploded, setIsExploded] = useState(false);
  const [theme, setTheme] = useState<"auto" | "dark" | "light">("dark");
  const [hoveredPart, setHoveredPart] = useState<HoveredPart | null>(null);
  const [webglSupported] = useState<boolean>(() =>
    typeof window !== "undefined" ? isWebGLAvailable() : true
  );
  const isMobile = useMemo(() => isMobileDevice(), []);
  const themes: Array<"auto" | "dark" | "light"> = ["dark", "light", "auto"];
  const themeIdx = useRef(0);

  const isDark =
    theme === "dark" ||
    (theme === "auto" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const bgColor = isDark ? "#020507" : "#f0f4f8";

  const cycleTheme = () => {
    themeIdx.current = (themeIdx.current + 1) % themes.length;
    setTheme(themes[themeIdx.current]);
  };

  // Prevent scroll on this page
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  if (!webglSupported) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: bgColor,
          color: isDark ? "#f5f5f5" : "#171717",
          fontFamily: "system-ui, sans-serif",
          gap: "16px",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: "18px", fontWeight: 600 }}>WebGL not available</p>
        <p style={{ fontSize: "14px", color: isDark ? "#a3a3a3" : "#525252", maxWidth: "360px" }}>
          Your browser or device does not support WebGL, which is required for
          the 3D Repulsine visualizer. Try updating your browser or enabling
          hardware acceleration.
        </p>
        <button
          onClick={onBack}
          style={{
            marginTop: "8px",
            padding: "10px 24px",
            borderRadius: "6px",
            border: "1px solid #0f766e",
            background: "transparent",
            color: "#0f766e",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: bgColor,
        transition: "background 0.4s ease",
      }}
    >
      {/* R3F Canvas */}
      <Canvas
        gl={{
          antialias: !isMobile,
          alpha: false,
          powerPreference: isMobile ? "low-power" : "high-performance",
          // Keep depth occlusion; disable stencil on mobile to save VRAM
          ...(isMobile ? { depth: true, stencil: false } : {}),
        }}
        // Lock mobile DPR to 1 to reduce iPad Safari GPU memory pressure
        dpr={isMobile ? 1 : [1, 2]}
        camera={{ position: [0, 18, 45], fov: 40 }}
        shadows={!isMobile}
        style={{ position: "absolute", inset: 0 }}
        onCreated={({ gl }) => {
          if (!isMobile) {
            gl.shadowMap.enabled = true;
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
          }
        }}
      >
        <color attach="background" args={[bgColor]} />
        <fogExp2 attach="fog" args={[bgColor, isDark ? 0.016 : 0.022]} />

        <Suspense fallback={null}>
          <Environment isDark={isDark} isMobile={isMobile} />
          <RepulsineDisc
            isExploded={isExploded}
            autoRotate={autoRotate}
            onHover={setHoveredPart}
            isDark={isDark}
            isMobile={isMobile}
          />
          <VortexParticles isDark={isDark} isMobile={isMobile} />

          {/* Volumetric light cone — faux godray from ceiling hatch */}
          {isDark && (
            <mesh position={[0, 36, 0]}>
              <coneGeometry args={[18, 68, isMobile ? 16 : 32, 1, true]} />
              <meshBasicMaterial
                color={0xb8d4e8}
                transparent
                opacity={0.035}
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          )}

          {/* Post-processing: disabled on mobile to prevent Safari GPU crash */}
          {!isMobile && (
            <EffectComposer>
              <Bloom
                luminanceThreshold={isDark ? 0.4 : 0.75}
                luminanceSmoothing={0.35}
                intensity={isDark ? 2.2 : 0.7}
                radius={0.9}
                blendFunction={BlendFunction.ADD}
              />
              <ChromaticAberration
                offset={CHROMATIC_OFFSET}
                blendFunction={BlendFunction.NORMAL}
                radialModulation={false}
                modulationOffset={0.5}
              />
            </EffectComposer>
          )}
        </Suspense>

        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={15}
          maxDistance={80}
          maxPolarAngle={Math.PI * 0.62}
        />
      </Canvas>

      {/* UI Overlay */}
      <TelemetryUI
        onBack={onBack}
        autoRotate={autoRotate}
        isExploded={isExploded}
        theme={theme}
        hoveredPart={hoveredPart}
        onToggleRotate={() => setAutoRotate((v) => !v)}
        onToggleExplode={() => setIsExploded((v) => !v)}
        onCycleTheme={cycleTheme}
        isDark={isDark}
      />

      {/* Cycloidal Vortex Verification widget */}
      <CycloidalVortexWidget isDark={isDark} />
    </div>
  );
}
