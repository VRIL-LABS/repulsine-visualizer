"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";

interface CycloidalVortexWidgetProps {
  isDark: boolean;
}

/**
 * Cycloidal Vortex Verification widget — displays real-time simulated
 * Repulsine implosion physics: centripetal velocity, core pressure,
 * vortex temperature, and a cycloidal flow pattern visualisation.
 *
 * Data is derived from simplified Schauberger implosion vortex equations:
 *   v(r) = Γ / (2πr)  — irrotational vortex (potential flow)
 *   P(r) = P_∞ − ρΓ² / (8π²r²)  — Bernoulli pressure in vortex
 *   T(r) = T_∞ − (v² / 2cₚ)  — adiabatic cooling in centripetal flow
 */

// Physical constants — stable across renders, kept outside the component
const GAMMA = 12.0; // circulation strength (m²/s)
const RHO = 1.225; // air density (kg/m³)
const CP = 1005; // specific heat capacity (J/kg·K)
const R_CORE = 0.08; // core radius (m)

export function CycloidalVortexWidget({ isDark }: CycloidalVortexWidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const [isExpanded, setIsExpanded] = useState(false);

  // Displayed telemetry values — updated from the animation loop at ~10 Hz
  // to avoid excessive React re-renders while keeping readings live.
  const [telemetry, setTelemetry] = useState({
    rpm: "0",
    pressure: "1.013",
    velocity: "0.0",
    temperature: "20.0",
  });

  // Internal simulation state — mutated in rAF, never read during render
  const simRef = useRef({
    time: 0,
    rpm: 0,
    targetRpm: 8400,
    pressure: 1.013,
    temperature: 20.0,
    velocity: 0,
    phase: 0,
    lastDisplayUpdate: 0,
  });

  const accent = isDark ? "#0f766e" : "#0b5c56";
  const accentLight = isDark ? "rgba(15,118,110,0.15)" : "rgba(11,92,86,0.1)";
  const textMain = isDark ? "#f5f5f5" : "#171717";
  const textMuted = isDark ? "#a3a3a3" : "#525252";
  const surfaceBg = isDark
    ? "rgba(8,12,18,0.92)"
    : "rgba(255,255,255,0.88)";
  const borderClr = isDark
    ? "rgba(64,64,64,0.7)"
    : "rgba(229,229,229,0.8)";

  // Draw the cycloidal vortex flow pattern on canvas
  const drawVortex = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;
      const maxR = Math.min(cx, cy) - 4;

      // Background ring guides
      for (let i = 1; i <= 4; i++) {
        const r = (i / 4) * maxR;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = isDark
          ? `rgba(15,118,110,${0.08 + i * 0.02})`
          : `rgba(11,92,86,${0.06 + i * 0.015})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Cycloidal streamlines — logarithmic spiral paths
      const streamCount = 6;
      for (let s = 0; s < streamCount; s++) {
        const baseAngle = (s / streamCount) * Math.PI * 2 + t * 0.8;
        ctx.beginPath();

        const pts = 80;
        for (let j = 0; j <= pts; j++) {
          const frac = j / pts;
          // Logarithmic spiral: r = a * e^(b*θ)
          const theta = baseAngle + frac * Math.PI * 4;
          const r = maxR * (1 - frac * 0.92) * (0.95 + 0.05 * Math.sin(theta * 3 + t));
          const x = cx + Math.cos(theta) * r;
          const y = cy + Math.sin(theta) * r;

          if (j === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        const alpha = isDark ? 0.55 : 0.45;
        const hue = s % 2 === 0 ? "0,255,255" : "57,223,200";
        ctx.strokeStyle = `rgba(${hue},${alpha})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // Pressure gradient — radial colour fill (low pressure = teal at core)
      const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, maxR * 0.6);
      grad.addColorStop(0, isDark ? "rgba(0,255,255,0.18)" : "rgba(15,118,110,0.12)");
      grad.addColorStop(0.5, isDark ? "rgba(15,118,110,0.06)" : "rgba(15,118,110,0.04)");
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, maxR * 0.6, 0, Math.PI * 2);
      ctx.fill();

      // Core — pulsing bright dot
      const pulse = 0.7 + 0.3 * Math.sin(t * 3);
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 6);
      coreGrad.addColorStop(0, `rgba(0,255,255,${(0.9 * pulse).toFixed(2)})`);
      coreGrad.addColorStop(0.5, `rgba(15,118,110,${(0.4 * pulse).toFixed(2)})`);
      coreGrad.addColorStop(1, "transparent");
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();

      // Particle dots along streamlines
      for (let s = 0; s < streamCount; s++) {
        const baseAngle = (s / streamCount) * Math.PI * 2 + t * 0.8;
        // Place 3 particles per stream at different spiral positions
        for (let p = 0; p < 3; p++) {
          const frac = ((t * 0.3 + p * 0.33 + s * 0.1) % 1);
          const theta = baseAngle + frac * Math.PI * 4;
          const r = maxR * (1 - frac * 0.92);
          const x = cx + Math.cos(theta) * r;
          const y = cy + Math.sin(theta) * r;
          const dotR = 1.5 + (1 - frac) * 1.5;

          ctx.beginPath();
          ctx.arc(x, y, dotR, 0, Math.PI * 2);
          ctx.fillStyle = isDark
            ? `rgba(0,255,255,${(0.7 - frac * 0.4).toFixed(2)})`
            : `rgba(15,118,110,${(0.6 - frac * 0.3).toFixed(2)})`;
          ctx.fill();
        }
      }
    },
    [isDark],
  );

  // Animation loop — updates physics sim + canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // HiDPI setup
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = isExpanded ? 180 : 120;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const sim = simRef.current;

      sim.time += dt;
      // RPM ramps up smoothly
      sim.rpm += (sim.targetRpm - sim.rpm) * dt * 0.5;

      // Derive physics from rpm
      const omega = (sim.rpm / 60) * Math.PI * 2; // rad/s
      const effectiveGamma = GAMMA * (sim.rpm / 12000);
      // Tangential velocity at reference radius
      sim.velocity = effectiveGamma / (2 * Math.PI * R_CORE * 3);
      // Bernoulli pressure drop
      const pressureDrop =
        (RHO * effectiveGamma * effectiveGamma) /
        (8 * Math.PI * Math.PI * R_CORE * R_CORE);
      sim.pressure = Math.max(0.01, 1.013 - pressureDrop / 101325);
      // Adiabatic cooling
      sim.temperature = 20 - (sim.velocity * sim.velocity) / (2 * CP) * 10;

      sim.phase += omega * dt * 0.001;

      // Oscillate target RPM gently for liveliness
      sim.targetRpm =
        8400 + 1200 * Math.sin(sim.time * 0.15) + 600 * Math.sin(sim.time * 0.37);

      drawVortex(ctx, size, size, sim.time);

      // Push telemetry to React state at ~10 Hz (every ~100ms)
      if (now - sim.lastDisplayUpdate > 100) {
        sim.lastDisplayUpdate = now;
        setTelemetry({
          rpm: Math.round(sim.rpm).toLocaleString(),
          pressure: sim.pressure.toFixed(3),
          velocity: sim.velocity.toFixed(1),
          temperature: sim.temperature.toFixed(1),
        });
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isDark, isExpanded, drawVortex, setTelemetry]);

  const telemetryItems = [
    {
      label: "RPM",
      value: telemetry.rpm,
      unit: "",
    },
    {
      label: "Core Prs",
      value: telemetry.pressure,
      unit: "atm",
    },
    {
      label: "Velocity",
      value: telemetry.velocity,
      unit: "m/s",
    },
    {
      label: "Core Temp",
      value: telemetry.temperature,
      unit: "°C",
    },
  ];

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 15,
        pointerEvents: "auto",
        width: isExpanded ? "280px" : "200px",
        background: surfaceBg,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: `1px solid ${borderClr}`,
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: isDark
          ? "0 8px 32px rgba(0,0,0,0.6), 0 0 1px rgba(15,118,110,0.3)"
          : "0 8px 32px rgba(0,0,0,0.12)",
        transition: "width 0.3s ease, box-shadow 0.3s ease",
        cursor: "pointer",
        userSelect: "none",
      }}
      onClick={() => setIsExpanded((v) => !v)}
      role="button"
      tabIndex={0}
      aria-label="Cyloid Vortex Verification panel — click to expand"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIsExpanded((v) => !v);
        }
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "10px 14px 6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#00ffaa",
              boxShadow: "0 0 6px #00ffaa",
              animation: "pulse 2s ease-in-out infinite",
            }}
          />
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: accent,
            }}
          >
            Cyloid Vortex
          </span>
        </div>
        <span
          style={{
            fontSize: "9px",
            color: textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {isExpanded ? "▾ Collapse" : "▸ Expand"}
        </span>
      </div>

      {/* Vortex canvas */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: isExpanded ? "4px 14px 8px" : "2px 14px 6px",
          transition: "padding 0.3s ease",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            borderRadius: "8px",
            border: `1px solid ${isDark ? "rgba(15,118,110,0.2)" : "rgba(11,92,86,0.1)"}`,
          }}
        />
      </div>

      {/* Telemetry readouts */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "2px 8px",
          padding: "4px 14px 12px",
        }}
      >
        {telemetryItems.map(({ label, value, unit }) => (
          <div
            key={label}
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "3px 0",
            }}
          >
            <span
              style={{
                fontSize: "9px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: textMuted,
                lineHeight: 1.2,
              }}
            >
              {label}
            </span>
            <span
              style={{
                fontSize: isExpanded ? "15px" : "13px",
                fontWeight: 700,
                color: accent,
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1.3,
                transition: "font-size 0.3s ease",
              }}
            >
              {value}
              {unit && (
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 400,
                    color: textMuted,
                    marginLeft: "2px",
                  }}
                >
                  {unit}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Expanded: additional physics info */}
      {isExpanded && (
        <div
          style={{
            padding: "8px 14px 14px",
            borderTop: `1px solid ${borderClr}`,
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "10px",
              color: textMuted,
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: textMain }}>Irrotational vortex model</strong>{" "}
            — Centripetal flow follows v(r) = Γ/2πr with Bernoulli pressure
            distribution. Core temperature drops via adiabatic cooling as
            kinetic energy concentrates inward.
          </p>
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "4px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "9px",
                color: textMuted,
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#00ffff",
                  boxShadow: "0 0 4px #00ffff",
                }}
              />
              Streamlines
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "9px",
                color: textMuted,
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: accent,
                  boxShadow: `0 0 4px ${accent}`,
                }}
              />
              Pressure
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "9px",
                color: textMuted,
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: accentLight,
                  border: `1px solid ${accent}`,
                }}
              />
              Core
            </div>
          </div>
        </div>
      )}

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
