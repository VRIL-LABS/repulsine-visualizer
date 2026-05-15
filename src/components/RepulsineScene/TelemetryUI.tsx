"use client";

import React, { useRef, useEffect } from "react";
import type { HoveredPart } from "./types";

interface TelemetryUIProps {
  onBack: () => void;
  autoRotate: boolean;
  isExploded: boolean;
  theme: "auto" | "dark" | "light";
  hoveredPart: HoveredPart | null;
  onToggleRotate: () => void;
  onToggleExplode: () => void;
  onCycleTheme: () => void;
  isDark: boolean;
}

const accent = "#0f766e";
const accentGlow = "rgba(15,118,110,0.15)";

export function TelemetryUI({
  onBack,
  autoRotate,
  isExploded,
  theme,
  hoveredPart,
  onToggleRotate,
  onToggleExplode,
  onCycleTheme,
  isDark,
}: TelemetryUIProps) {
  const svgLineRef = useRef<SVGLineElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const textMain = isDark ? "#f5f5f5" : "#171717";
  const textMuted = isDark ? "#a3a3a3" : "#525252";
  const surfaceColor = isDark
    ? "rgba(23,23,23,0.85)"
    : "rgba(255,255,255,0.85)";
  const borderColor = isDark
    ? "rgba(64,64,64,0.8)"
    : "rgba(229,229,229,0.8)";

  // Update SVG connector line when hovered part changes
  useEffect(() => {
    const line = svgLineRef.current;
    const panel = panelRef.current;
    if (!line) return;

    if (!hoveredPart?.screenPos) {
      line.setAttribute("opacity", "0");
      return;
    }

    line.setAttribute("x1", String(hoveredPart.screenPos.x));
    line.setAttribute("y1", String(hoveredPart.screenPos.y));

    if (panel) {
      const rect = panel.getBoundingClientRect();
      line.setAttribute("x2", String(rect.left - 5));
      line.setAttribute("y2", String(rect.top + 24));
    }

    line.setAttribute("opacity", "1");
  }, [hoveredPart]);

  const btnStyle: React.CSSProperties = {
    background: surfaceColor,
    border: `1px solid ${borderColor}`,
    color: textMain,
    padding: "8px 16px",
    borderRadius: "4px",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "12px",
    fontWeight: 500,
    backdropFilter: "blur(12px)",
    transition: "all 0.2s ease",
    WebkitBackdropFilter: "blur(12px)",
  };

  const activeBtnStyle: React.CSSProperties = {
    ...btnStyle,
    background: borderColor,
    borderColor: accent,
    color: accent,
  };

  const themeLabel = { auto: "Auto", dark: "Dark", light: "Light" }[theme];

  return (
    <>
      {/* SVG connector overlay */}
      <svg
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          pointerEvents: "none",
          zIndex: 20,
        }}
      >
        <line
          ref={svgLineRef}
          x1="0" y1="0" x2="0" y2="0"
          stroke={accent}
          strokeWidth="1.5"
          strokeDasharray="4 4"
          opacity="0"
        />
      </svg>

      {/* UI layer */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 10,
          pointerEvents: "none",
          padding: "24px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            pointerEvents: "none",
          }}
        >
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); onBack(); }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: textMuted,
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: 500,
              transition: "color 0.2s ease",
              cursor: "pointer",
              pointerEvents: "auto",
              width: "fit-content",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = accent)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = textMuted)
            }
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back
          </a>

          <div style={{ display: "flex", flexDirection: "column", pointerEvents: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <h1
                style={{
                  color: textMain,
                  fontSize: "24px",
                  fontWeight: 600,
                  margin: 0,
                  letterSpacing: "-0.5px",
                  fontFamily: "var(--font-inter, system-ui, sans-serif)",
                }}
              >
                Schauberger Repulsine
              </h1>
              <span
                style={{
                  background: accentGlow,
                  color: accent,
                  border: `1px solid ${accent}`,
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Live Telemetry
              </span>
            </div>
            <p
              style={{
                color: textMuted,
                fontSize: "13px",
                margin: "4px 0 0 0",
                fontWeight: 400,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Implosion Dynamics &amp; Vortex Physics
            </p>
          </div>
        </div>

        {/* Controls (top-right) */}
        <div
          style={{
            position: "absolute",
            top: "24px",
            right: "24px",
            display: "flex",
            gap: "8px",
            pointerEvents: "auto",
          }}
        >
          <button
            style={btnStyle}
            onClick={onCycleTheme}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = borderColor)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = surfaceColor)
            }
          >
            Theme: {themeLabel}
          </button>
          <button
            style={autoRotate ? activeBtnStyle : btnStyle}
            onClick={onToggleRotate}
          >
            Auto-Rotate
          </button>
          <button
            style={isExploded ? activeBtnStyle : btnStyle}
            onClick={onToggleExplode}
          >
            Exploded View
          </button>
        </div>

        {/* Telemetry panel (hovers near hovered part) */}
        {hoveredPart && (
          <div
            ref={panelRef}
            style={{
              position: "absolute",
              top: "25%",
              left: "80px",
              background: surfaceColor,
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: `1px solid ${borderColor}`,
              padding: "16px 20px",
              borderRadius: "8px",
              pointerEvents: "none",
              width: "280px",
              opacity: hoveredPart ? 1 : 0,
              transition: "opacity 0.3s ease",
              boxShadow: isDark
                ? "0 8px 32px rgba(0,0,0,0.5)"
                : "0 8px 32px rgba(0,0,0,0.12)",
            }}
          >
            <h2
              style={{
                margin: "0 0 8px 0",
                fontSize: "14px",
                fontWeight: 700,
                textTransform: "uppercase",
                color: textMain,
                letterSpacing: "0.05em",
              }}
            >
              {hoveredPart.name}
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: "13px",
                color: textMuted,
                lineHeight: 1.5,
              }}
            >
              {hoveredPart.desc}
            </p>
            <div
              style={{
                display: "flex",
                gap: "24px",
                marginTop: "16px",
                borderTop: `1px solid ${borderColor}`,
                paddingTop: "16px",
              }}
            >
              {[
                { val: hoveredPart.v1, lbl: hoveredPart.l1 },
                { val: hoveredPart.v2, lbl: hoveredPart.l2 },
              ].map(({ val, lbl }) => (
                <div key={lbl} style={{ display: "flex", flexDirection: "column" }}>
                  <span
                    style={{
                      fontSize: "22px",
                      fontWeight: 700,
                      color: accent,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {val}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      textTransform: "uppercase",
                      color: textMuted,
                      marginTop: "4px",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {lbl}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Physics legend (bottom) */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
            pointerEvents: "none",
          }}
        >
          {[
            { label: "Centripetal Flow", color: "#00ffff" },
            { label: "Vortex Core", color: "#0f766e" },
            { label: "Pressure Gradient", color: "#ffc25c" },
            { label: "Wave-Disc Turbine", color: "#c27c4a" },
          ].map(({ label, color }) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "11px",
                color: textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: color,
                  boxShadow: `0 0 6px ${color}`,
                }}
              />
              {label}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
