"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from "./SaucerButton.module.css";

interface SaucerButtonProps {
  onEngage: () => void;
}

type SceneState = "idle" | "hover" | "charge";

export function SaucerButton({ onEngage }: SaucerButtonProps) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const tiltBodyRef = useRef<HTMLDivElement>(null);
  const saucerRef = useRef<HTMLButtonElement>(null);
  const sShineRef = useRef<HTMLDivElement>(null);
  const sUndersideRef = useRef<HTMLDivElement>(null);
  const fieldShellRef = useRef<HTMLDivElement>(null);
  const forceRingRef = useRef<HTMLDivElement>(null);
  const shadowUmbraRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);

  const [sceneState, setSceneState] = useState<SceneState>("idle");
  const chargingRef = useRef(false);
  const chargeLevelRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);
  const lastRotXRef = useRef(0);
  const lastRotYRef = useRef(0);
  const engagedRef = useRef(false);

  const clamp = (v: number, lo: number, hi: number) =>
    Math.min(hi, Math.max(lo, v));

  const setUnderside = useCallback(() => {
    const u = clamp(
      Math.max(-lastRotXRef.current / 18, chargeLevelRef.current * 0.52),
      0,
      1,
    );
    if (sUndersideRef.current) {
      sUndersideRef.current.style.opacity = u.toFixed(3);
      sUndersideRef.current.style.transform = `translateZ(28px) translateY(${(-(-lastRotXRef.current / 18) * 18).toFixed(1)}px) scale(${(0.9 + u * 0.12).toFixed(3)})`;
    }
  }, []);

  const applyTilt = useCallback(
    (e: PointerEvent) => {
      const scene = sceneRef.current;
      const tiltBody = tiltBodyRef.current;
      const saucer = saucerRef.current;
      const sShine = sShineRef.current;
      if (!scene || !tiltBody || !saucer || !sShine) return;

      const r = scene.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const nx = clamp((e.clientX - cx) / (r.width / 2), -1, 1);
      const ny = clamp((e.clientY - cy) / (r.height / 2), -1, 1);
      lastRotYRef.current = nx * 18;
      lastRotXRef.current = ny * 20;
      tiltBody.style.transform = `rotateX(${lastRotXRef.current.toFixed(2)}deg) rotateY(${lastRotYRef.current.toFixed(2)}deg)`;

      const sr = saucer.getBoundingClientRect();
      const mx = ((e.clientX - sr.left) / sr.width) * 100;
      const my = ((e.clientY - sr.top) / sr.height) * 100;
      sShine.style.setProperty(
        "--mx",
        `${clamp(mx, 0, 100).toFixed(1)}%`,
      );
      sShine.style.setProperty(
        "--my",
        `${clamp(my, 0, 100).toFixed(1)}%`,
      );
      setUnderside();
    },
    [setUnderside],
  );

  const resetTilt = useCallback(() => {
    lastRotXRef.current = 0;
    lastRotYRef.current = 0;
    if (tiltBodyRef.current)
      tiltBodyRef.current.style.transform =
        "rotateX(0deg) rotateY(0deg)";
    if (sShineRef.current) {
      sShineRef.current.style.setProperty("--mx", "50%");
      sShineRef.current.style.setProperty("--my", "50%");
    }
    setUnderside();
  }, [setUnderside]);

  // Stable ref so tickCharge can schedule itself without a self-reference TDZ issue
  const tickChargeRef = useRef<(() => void) | null>(null);

  const tickCharge = useCallback(() => {
    const charging = chargingRef.current;
    chargeLevelRef.current = charging
      ? Math.min(chargeLevelRef.current + 0.011, 1)
      : Math.max(chargeLevelRef.current - 0.014, 0);

    const c = chargeLevelRef.current;

    if (fieldShellRef.current) {
      const shellOpacity = c < 0.08 ? 0 : ((c - 0.08) / 0.92) * 0.98;
      const shellScale = c < 0.08 ? 0.01 : 0.18 + c * 2.72;
      fieldShellRef.current.style.opacity = shellOpacity.toFixed(3);
      fieldShellRef.current.style.transform = `translate(-50%,-50%) scale(${shellScale.toFixed(3)}) translateY(${(-8 - c * 50).toFixed(1)}px)`;
    }
    if (forceRingRef.current) {
      forceRingRef.current.style.opacity = (
        c < 0.1 ? 0 : 0.75 + ((c - 0.1) / 0.9) * 0.25
      ).toFixed(3);
      forceRingRef.current.style.transform = `translate(-50%,-50%) translateY(${(14 + c * 30).toFixed(1)}px) scale(${(0.92 + c * 0.4).toFixed(3)})`;
    }
    if (saucerRef.current) {
      const liftPx =
        c < 0.45 ? -(c / 0.45) * 22 : -22 - ((c - 0.45) / 0.55) * 77;
      saucerRef.current.style.transform = `translateY(${liftPx.toFixed(2)}px)`;
    }
    if (shadowUmbraRef.current) {
      shadowUmbraRef.current.style.transform = `translate(-50%,-50%) translateY(${(168 + c * 112).toFixed(1)}px) scale(${(1 + c * 0.55).toFixed(3)})`;
      shadowUmbraRef.current.style.filter = `blur(${(12 + c * 22).toFixed(1)}px)`;
      shadowUmbraRef.current.style.opacity = (0.3 - c * 0.18).toFixed(3);
    }
    setUnderside();

    if (captionRef.current) {
      if (c > 0.985) {
        captionRef.current.textContent =
          "Thule Triebwerk engaged — field threshold breached";
        if (!engagedRef.current) {
          engagedRef.current = true;
          // Trigger navigation after a brief pause
          setTimeout(() => onEngage(), 600);
        }
      } else if (charging) {
        captionRef.current.textContent = `Charging Vril capacitors… ${Math.round(c * 100)}%`;
      } else if (c < 0.02) {
        captionRef.current.textContent =
          "Hover · tilt to reveal Triebwerk · click to charge";
      } else {
        captionRef.current.textContent = `Discharge… ${Math.round(c * 100)}%`;
      }
    }

    if (charging || c > 0.005) {
      rafIdRef.current = requestAnimationFrame(() => tickChargeRef.current?.());
    } else {
      rafIdRef.current = null;
      resetTilt();
    }
  }, [setUnderside, resetTilt, onEngage]);

  // Sync the ref after render so the RAF loop always uses the latest closure
  useEffect(() => {
    tickChargeRef.current = tickCharge;
  }, [tickCharge]);

  const toggleCharge = useCallback(() => {
    chargingRef.current = !chargingRef.current;
    setSceneState(chargingRef.current ? "charge" : "hover");
    if (!rafIdRef.current && tickChargeRef.current)
      rafIdRef.current = requestAnimationFrame(tickChargeRef.current);
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    const saucer = saucerRef.current;
    if (!scene || !saucer) return;

    const handlePointerEnter = () => {
      if (!chargingRef.current && chargeLevelRef.current < 0.02)
        setSceneState("hover");
    };
    const handlePointerMove = (e: PointerEvent) => applyTilt(e);
    const handlePointerLeave = () => {
      resetTilt();
      if (!chargingRef.current && chargeLevelRef.current < 0.02)
        setSceneState("idle");
    };
    const handlePointerDown = (e: PointerEvent) => {
      e.preventDefault();
      toggleCharge();
    };

    scene.addEventListener("pointerenter", handlePointerEnter);
    scene.addEventListener("pointermove", handlePointerMove);
    scene.addEventListener("pointerleave", handlePointerLeave);
    saucer.addEventListener("pointerdown", handlePointerDown);

    resetTilt();

    return () => {
      scene.removeEventListener("pointerenter", handlePointerEnter);
      scene.removeEventListener("pointermove", handlePointerMove);
      scene.removeEventListener("pointerleave", handlePointerLeave);
      saucer.removeEventListener("pointerdown", handlePointerDown);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [applyTilt, resetTilt, toggleCharge]);

  return (
    <main className={styles.stage}>
      <section
        className={styles.panel}
        aria-label="Repulsine launch control"
      >
        <div className={styles.panelTag}>
          Vril Interface · Haunebu Hull · Dome + Disc + Triebwerk
        </div>

        <div
          ref={sceneRef}
          className={`${styles.scene} ${styles[`scene--${sceneState}`]}`}
          data-state={sceneState}
        >
          {/* 2D underlay */}
          <div className={styles.underlay} aria-hidden="true">
            <div className={styles.aura} />
            <div className={styles.well} />
            <div ref={fieldShellRef} className={styles.fieldShell} />
            <div ref={forceRingRef} className={styles.forceRing} />
            <div ref={shadowUmbraRef} className={styles.shadowUmbra} />
          </div>

          {/* 3D tilt stack */}
          <div className={styles.tiltStage}>
            <div ref={tiltBodyRef} className={styles.tiltBody}>
              <button
                ref={saucerRef}
                className={styles.saucer}
                aria-label="Engage Haunebu launch sequence"
                onClick={(e) => {
                  // Handle keyboard activation (Enter/Space); pointer already handled by pointerdown
                  if (e.detail === 0) toggleCharge();
                }}
              >
                <div className={styles.sDisc} />
                <div className={styles.sEquator} />
                <div className={styles.sDome} />
                <div className={styles.sDomeRim} />
                <div className={styles.sBelly} />
                <div className={styles.sRingA} />
                <div className={styles.sRingB} />
                <div className={styles.sSeams} />
                <div className={styles.sApertures} />
                <div
                  ref={sShineRef}
                  className={styles.sShine}
                  style={
                    { "--mx": "50%", "--my": "50%" } as React.CSSProperties
                  }
                />
                <svg
                  className={styles.engageSvg}
                  viewBox="0 0 480 300"
                  aria-hidden="true"
                >
                  <defs>
                    <radialGradient
                      id="engageGrad"
                      cx="50%"
                      cy="50%"
                      r="60%"
                    >
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="28%" stopColor="#fafcff" />
                      <stop offset="68%" stopColor="#dce8f2" />
                      <stop offset="100%" stopColor="#c4d2de" />
                    </radialGradient>
                    <path
                      id="engageArc"
                      d="M 116 192 A 124 28 0 0 0 364 192"
                    />
                  </defs>
                  <text
                    className={styles.engageText}
                    fill="url(#engageGrad)"
                  >
                    <textPath
                      href="#engageArc"
                      startOffset="50%"
                      textAnchor="middle"
                    >
                      ENGAGE
                    </textPath>
                  </text>
                </svg>
              </button>

              <div
                ref={sUndersideRef}
                className={styles.undersideVeil}
              />
            </div>
          </div>

          <div ref={captionRef} className={styles.caption}>
            Hover · tilt to reveal Triebwerk · click to charge
          </div>
        </div>

        <div className={styles.panelNote}>
          Haunebu Coanda Hull · Thule Triebwerk · Pass 2M
        </div>
      </section>
    </main>
  );
}
