"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

interface SceneControlsProps {
  isDark: boolean;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  defaultCameraDistance: number;
  onResetView: () => void;
}

/**
 * Generates an SVG spiral path for the zoom indicator.
 * At 0% shows no spiral; at 100% shows the full spiral.
 */
function buildSpiralPath(percent: number, size: number): string {
  if (percent <= 0) return "";
  const cx = size / 2;
  const cy = size / 2;
  const maxTurns = 3;
  const maxRadius = size * 0.4;
  const totalPoints = 120;
  const activePoints = Math.max(2, Math.round((percent / 100) * totalPoints));

  const points: string[] = [];
  for (let i = 0; i < activePoints; i++) {
    const t = i / (totalPoints - 1);
    const angle = t * maxTurns * Math.PI * 2;
    const r = t * maxRadius;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    points.push(i === 0 ? `M${x},${y}` : `L${x},${y}`);
  }
  return points.join(" ");
}

export function SceneControls({
  isDark,
  controlsRef,
  defaultCameraDistance,
  onResetView,
}: SceneControlsProps) {
  const [showCompass, setShowCompass] = useState(true);
  const [cameraHeadingDeg, setCameraHeadingDeg] = useState(0);
  const [zoomPercent, setZoomPercent] = useState(() => {
    const min = 16;
    const max = 60;
    const pct = Math.round(((max - defaultCameraDistance) / (max - min)) * 100);
    return Math.max(0, Math.min(100, pct));
  });
  const rafPending = useRef(false);
  const cameraHeadingVector = useRef(new THREE.Vector3());

  const getCameraHeadingDeg = useCallback((controls: OrbitControlsImpl) => {
    const forward = cameraHeadingVector.current.set(0, 0, -1).applyQuaternion(controls.object.quaternion);
    const heading = Math.atan2(forward.x, forward.z);
    return ((heading * 180) / Math.PI + 360) % 360;
  }, []);

  // Subscribe to OrbitControls change events directly (avoids re-rendering parent)
  const updateFromControls = useCallback(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    setCameraHeadingDeg(getCameraHeadingDeg(controls));

    const dist = controls.object.position.distanceTo(controls.target);
    const min = controls.minDistance;
    const max = controls.maxDistance;
    const pct = Math.round(((max - dist) / (max - min)) * 100);
    setZoomPercent(Math.max(0, Math.min(100, pct)));
    rafPending.current = false;
  }, [controlsRef, getCameraHeadingDeg]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const handleChange = () => {
      // Throttle to one update per animation frame
      if (!rafPending.current) {
        rafPending.current = true;
        requestAnimationFrame(updateFromControls);
      }
    };

    controls.addEventListener("change", handleChange);
    // Initialize values on mount
    updateFromControls();

    return () => {
      controls.removeEventListener("change", handleChange);
    };
  }, [controlsRef, updateFromControls]);

  const accent = "#0f766e";
  const textMain = isDark ? "#f5f5f5" : "#171717";
  const textMuted = isDark ? "#a3a3a3" : "#525252";
  const surfaceColor = isDark
    ? "rgba(23,23,23,0.85)"
    : "rgba(255,255,255,0.85)";
  const borderColor = isDark
    ? "rgba(64,64,64,0.8)"
    : "rgba(229,229,229,0.8)";

  // Compass needle rotation tracks the camera-facing direction, not the orbit angle.
  const compassDeg = useMemo(() => cameraHeadingDeg, [cameraHeadingDeg]);

  // Spiral path for zoom indicator
  const spiralPath = useMemo(() => buildSpiralPath(zoomPercent, 36), [zoomPercent]);
  const zoomRadius = 11;
  const zoomCircumference = 2 * Math.PI * zoomRadius;
  const zoomDashOffset = zoomCircumference * (1 - zoomPercent / 100);

  const btnBase: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    background: surfaceColor,
    border: `1px solid ${borderColor}`,
    borderRadius: "50%",
    cursor: "pointer",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    transition: "all 0.2s ease",
    padding: 0,
  };

  return (
    <div
      style={{
        position: "fixed",
        right: "24px",
        top: "50%",
        transform: "translateY(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
        zIndex: 15,
        pointerEvents: "auto",
      }}
    >
      {/* Compass / Zoom toggle indicator */}
      <button
        style={btnBase}
        onClick={() => setShowCompass((v) => !v)}
        title={showCompass ? "Compass (tap for Zoom)" : "Zoom (tap for Compass)"}
        aria-label={showCompass ? "Compass indicator" : "Zoom indicator"}
      >
        {showCompass ? (
          /* Compass SVG — rotates to match the camera-facing direction */
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            style={{
              transform: `rotate(${-compassDeg}deg)`,
              transition: "transform 0.15s ease-out",
            }}
          >
            <circle cx="12" cy="12" r="10" stroke={textMuted} strokeWidth="1.2" fill="none" />
            <path d="M12 2.5v5.2M12 16.3v5.2M2.5 12h5.2M16.3 12h5.2" stroke={textMuted} strokeOpacity="0.7" strokeWidth="0.8" />
            <polygon points="12,3 10,12 14,12" fill={accent} />
            <polygon points="12,21 10,12 14,12" fill={textMuted} opacity="0.45" />
            <circle cx="12" cy="12" r="1.5" fill={accent} />
          </svg>
        ) : (
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle
              cx="18"
              cy="18"
              r={zoomRadius}
              stroke={textMuted}
              strokeOpacity="0.4"
              strokeWidth="1.2"
              fill="none"
            />
            <circle
              cx="18"
              cy="18"
              r={zoomRadius}
              stroke={accent}
              strokeWidth="2.2"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={zoomCircumference}
              strokeDashoffset={zoomDashOffset}
              transform="rotate(-90 18 18)"
            />
            <path
              d={spiralPath}
              stroke={accent}
              strokeOpacity="0.8"
              strokeWidth="1.3"
              strokeLinecap="round"
              fill="none"
              transform="translate(0 2)"
            />
            <text
              x="18"
              y="21"
              textAnchor="middle"
              fontSize="7"
              fill={textMuted}
              fontFamily="system-ui, sans-serif"
              fontWeight="600"
            >
              {zoomPercent}%
            </text>
          </svg>
        )}
      </button>

      {/* Reset View button */}
      <button
        style={btnBase}
        onClick={onResetView}
        title="Reset View"
        aria-label="Reset camera view"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke={textMain}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Crosshair / reset icon */}
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="3" x2="12" y2="6" />
          <line x1="12" y1="18" x2="12" y2="21" />
          <line x1="3" y1="12" x2="6" y2="12" />
          <line x1="18" y1="12" x2="21" y2="12" />
        </svg>
      </button>
    </div>
  );
}
