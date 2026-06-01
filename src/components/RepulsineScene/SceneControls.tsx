"use client";

import React, { useState, useMemo } from "react";

interface SceneControlsProps {
  isDark: boolean;
  azimuthAngle: number;
  zoomPercent: number;
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
  azimuthAngle,
  zoomPercent,
  onResetView,
}: SceneControlsProps) {
  const [showCompass, setShowCompass] = useState(true);

  const accent = "#0f766e";
  const textMain = isDark ? "#f5f5f5" : "#171717";
  const textMuted = isDark ? "#a3a3a3" : "#525252";
  const surfaceColor = isDark
    ? "rgba(23,23,23,0.85)"
    : "rgba(255,255,255,0.85)";
  const borderColor = isDark
    ? "rgba(64,64,64,0.8)"
    : "rgba(229,229,229,0.8)";

  // Compass needle rotation (convert azimuth radians to degrees)
  const compassDeg = useMemo(() => {
    return (azimuthAngle * 180) / Math.PI;
  }, [azimuthAngle]);

  // Spiral path for zoom indicator
  const spiralPath = useMemo(() => buildSpiralPath(zoomPercent, 36), [zoomPercent]);

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
        bottom: "80px",
        right: "24px",
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
          /* Compass SVG — rotates with camera azimuth */
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
            {/* Outer ring */}
            <circle cx="12" cy="12" r="10" stroke={textMuted} strokeWidth="1.2" fill="none" />
            {/* North pointer */}
            <polygon points="12,3 10,12 14,12" fill={accent} />
            {/* South pointer */}
            <polygon points="12,21 10,12 14,12" fill={textMuted} opacity="0.5" />
            {/* Center dot */}
            <circle cx="12" cy="12" r="1.5" fill={accent} />
          </svg>
        ) : (
          /* Zoom spiral SVG */
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path
              d={spiralPath}
              stroke={accent}
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
            />
            <text
              x="18"
              y="37"
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
