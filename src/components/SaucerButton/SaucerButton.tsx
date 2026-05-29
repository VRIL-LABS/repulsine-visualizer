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
  const fieldShellRef = useRef<HTMLDivElement>(null);
  const forceRingRef = useRef<HTMLDivElement>(null);
  const bioHaloRef = useRef<HTMLDivElement>(null);
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

  const applyTilt = useCallback(
    (e: PointerEvent) => {
      const tiltBody = tiltBodyRef.current;
      const saucer = saucerRef.current;
      const scene = sceneRef.current;
      if (!tiltBody || !saucer || !scene) return;

      const r = tiltBody.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const nx = clamp((e.clientX - cx) / (r.width / 2), -1, 1);
      const ny = clamp((e.clientY - cy) / (r.height / 2), -1, 1);

      lastRotYRef.current = nx * 14;
      lastRotXRef.current = ny * 14;
      tiltBody.style.transform = `rotateX(${lastRotXRef.current.toFixed(2)}deg) rotateY(${lastRotYRef.current.toFixed(2)}deg)`;

      // Specular shine follows cursor
      const mx = ((e.clientX - r.left) / r.width) * 100;
      const my = ((e.clientY - r.top) / r.height) * 100;
      saucer.style.setProperty("--mx", `${clamp(mx, 0, 100).toFixed(1)}%`);
      saucer.style.setProperty("--my", `${clamp(my, 0, 100).toFixed(1)}%`);

      // Back-tilt flag: mouse above center reveals underside
      scene.dataset.back = lastRotXRef.current < -3 ? "1" : "0";
    },
    [],
  );

  const resetTilt = useCallback(() => {
    lastRotXRef.current = 0;
    lastRotYRef.current = 0;
    if (tiltBodyRef.current)
      tiltBodyRef.current.style.transform = "rotateX(0deg) rotateY(0deg)";
    if (saucerRef.current) {
      saucerRef.current.style.setProperty("--mx", "50%");
      saucerRef.current.style.setProperty("--my", "50%");
    }
    if (sceneRef.current) sceneRef.current.dataset.back = "0";
  }, []);

  // Stable ref so tickCharge can schedule itself without a self-reference TDZ issue
  const tickChargeRef = useRef<(() => void) | null>(null);

  const tickCharge = useCallback(() => {
    const charging = chargingRef.current;
    chargeLevelRef.current = charging
      ? Math.min(chargeLevelRef.current + 0.007, 1)
      : Math.max(chargeLevelRef.current - 0.009, 0);

    const c = chargeLevelRef.current;

    // Field shell: grows from tiny to 1.6× hull size
    if (fieldShellRef.current) {
      const shellScale = 0.42 + c * 1.92;
      const shellOpacity = c < 0.05 ? 0 : 0.1 + c * 0.88;
      const shellY = -10 - c * 44;
      fieldShellRef.current.style.transform = `translate(-50%,-50%) scale(${shellScale.toFixed(3)}) translateY(${shellY.toFixed(1)}px)`;
      fieldShellRef.current.style.opacity = shellOpacity.toFixed(3);
    }

    // Force ring expands outward during charge
    if (forceRingRef.current) {
      const frScale = 1 + c * 0.28;
      const frY = 20 + c * 22;
      const frOp = charging ? 0.84 + c * 0.16 : 0;
      forceRingRef.current.style.transform = `translate(-50%,-50%) translateY(${frY.toFixed(1)}px) scale(${frScale.toFixed(3)})`;
      forceRingRef.current.style.opacity = frOp.toFixed(3);
      forceRingRef.current.style.filter = c > 0.6 ? `blur(${(c * 3).toFixed(1)}px)` : "none";
    }

    // Bio halo rotates and blooms
    if (bioHaloRef.current) {
      const bhScale = 0.94 + c * 0.52;
      const bhRot = c * 54;
      const bhOp = c < 0.1 ? 0 : c * 0.92;
      bioHaloRef.current.style.transform = `translate(-50%,-50%) scale(${bhScale.toFixed(3)}) rotate(${bhRot.toFixed(1)}deg)`;
      bioHaloRef.current.style.opacity = bhOp.toFixed(3);
    }

    // Saucer vertical lift — dramatic after 50% charge
    if (saucerRef.current) {
      const liftPx = c < 0.5
        ? -(c / 0.5) * 22
        : -22 - ((c - 0.5) / 0.5) * 77;
      saucerRef.current.style.transform = `translateY(${liftPx.toFixed(1)}px)`;
    }

    // Shadow stretches down and diffuses as craft rises
    if (shadowUmbraRef.current) {
      const shadowY = 156 + c * 96;
      const shadowSc = 1 + c * 0.46;
      const shadowOp = 0.28 + c * 0.42;
      const shadowBl = 12 + c * 18;
      shadowUmbraRef.current.style.transform = `translate(-50%,-50%) translateY(${shadowY.toFixed(1)}px) scale(${shadowSc.toFixed(3)})`;
      shadowUmbraRef.current.style.opacity = shadowOp.toFixed(3);
      shadowUmbraRef.current.style.filter = `blur(${shadowBl.toFixed(1)}px)`;
    }

    // Caption update
    if (captionRef.current) {
      if (c > 0.985) {
        captionRef.current.textContent =
          "Thule Triebwerk engaged — field threshold breached";
        if (!engagedRef.current) {
          engagedRef.current = true;
          setTimeout(() => onEngage(), 600);
        }
      } else if (c > 0 && charging) {
        captionRef.current.textContent = `Charging Vril capacitors… ${Math.round(c * 100)}%`;
      } else if (!charging && c < 0.05) {
        captionRef.current.textContent =
          "Hover the craft field · click to charge";
      } else if (!charging) {
        captionRef.current.textContent = `Discharge… ${Math.round(c * 100)}%`;
      }
    }

    if (c > 0 || charging) {
      rafIdRef.current = requestAnimationFrame(() => tickChargeRef.current?.());
    } else {
      rafIdRef.current = null;
      if (saucerRef.current) saucerRef.current.style.transform = "";
      if (shadowUmbraRef.current) {
        shadowUmbraRef.current.style.transform = "translate(-50%,-50%) translateY(156px) scale(1)";
        shadowUmbraRef.current.style.opacity = "0.28";
        shadowUmbraRef.current.style.filter = "blur(12px)";
      }
      if (forceRingRef.current) {
        forceRingRef.current.style.removeProperty("transform");
        forceRingRef.current.style.removeProperty("opacity");
        forceRingRef.current.style.removeProperty("filter");
      }
      if (captionRef.current) {
        captionRef.current.textContent = "Hover the craft field · click to charge";
      }
      resetTilt();
    }
  }, [resetTilt, onEngage]);

  // Sync the ref after render so the RAF loop always uses the latest closure
  useEffect(() => {
    tickChargeRef.current = tickCharge;
  }, [tickCharge]);

  const startCharge = useCallback(() => {
    chargingRef.current = true;
    setSceneState("charge");
    if (!rafIdRef.current && tickChargeRef.current)
      rafIdRef.current = requestAnimationFrame(tickChargeRef.current);
  }, []);

  const stopCharge = useCallback(() => {
    chargingRef.current = false;
    setSceneState(chargeLevelRef.current > 0.02 ? "hover" : "idle");
    if (!rafIdRef.current && chargeLevelRef.current > 0 && tickChargeRef.current)
      rafIdRef.current = requestAnimationFrame(tickChargeRef.current);
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const handlePointerEnter = () => {
      if (!chargingRef.current && chargeLevelRef.current < 0.02)
        setSceneState("hover");
    };
    const handlePointerMove = (e: PointerEvent) => {
      applyTilt(e);
      if (!chargingRef.current && chargeLevelRef.current < 0.02)
        setSceneState("hover");
    };
    const handlePointerLeave = () => {
      resetTilt();
      if (!chargingRef.current) stopCharge();
      if (!chargingRef.current && chargeLevelRef.current < 0.02)
        setSceneState("idle");
    };
    const handleClick = () => {
      if (!chargingRef.current) {
        startCharge();
      } else {
        stopCharge();
      }
    };

    scene.addEventListener("pointerenter", handlePointerEnter);
    scene.addEventListener("pointermove", handlePointerMove);
    scene.addEventListener("pointerleave", handlePointerLeave);
    scene.addEventListener("click", handleClick);

    resetTilt();

    return () => {
      scene.removeEventListener("pointerenter", handlePointerEnter);
      scene.removeEventListener("pointermove", handlePointerMove);
      scene.removeEventListener("pointerleave", handlePointerLeave);
      scene.removeEventListener("click", handleClick);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [applyTilt, resetTilt, startCharge, stopCharge]);

  return (
    <main className={styles.stage}>
      <section
        className={styles.panel}
        aria-label="Repulsine launch control"
      >
        <div className={styles.panelTag}>
          Vril Interface · Haunebu Hull · Pass 2G
        </div>

        <div
          ref={sceneRef}
          className={styles.scene}
          data-state={sceneState}
        >
          {/* 2D underlay */}
          <div className={styles.underlay} aria-hidden="true">
            <div className={styles.aura} />
            <div className={styles.well} />
            <div ref={fieldShellRef} className={styles.fieldShell} />
            <div ref={forceRingRef} className={styles.forceRing} />
            <div ref={bioHaloRef} className={styles.bioHalo} />
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
                  // Handle keyboard activation (Enter/Space); stop propagation
                  // to prevent the scene click listener from firing too.
                  if (e.detail === 0) {
                    e.stopPropagation();
                    if (!chargingRef.current) startCharge();
                    else stopCharge();
                  }
                }}
              >
                <div className={styles.sUnderside} />
                <div className={styles.sMain} />
                <div className={styles.sBelly} />
                <div className={styles.sRim} />
                <div className={styles.sRingA} />
                <div className={styles.sRingB} />
                <div className={styles.sSeams} />
                <div className={styles.sApertures} />
                <div className={styles.sVeins} />
                <div className={styles.sCore} />
                <div
                  className={styles.sShine}
                  style={
                    { "--mx": "50%", "--my": "50%" } as React.CSSProperties
                  }
                />
                <div className={styles.sBursts} />
                <svg
                  className={styles.engageSvg}
                  viewBox="0 0 410 240"
                  aria-hidden="true"
                >
                  <defs>
                    <radialGradient
                      id="engageGrad"
                      cx="50%"
                      cy="50%"
                      r="62%"
                    >
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="32%" stopColor="#fbfdff" />
                      <stop offset="72%" stopColor="#e4ebf2" />
                      <stop offset="100%" stopColor="#ccd6df" />
                    </radialGradient>
                    <path
                      id="engageArc"
                      d="M 106 152 A 99 24 0 0 0 304 152"
                    />
                  </defs>
                  <text
                    className={`${styles.engageText} ${styles.engageHighlight}`}
                  >
                    <textPath
                      href="#engageArc"
                      startOffset="50%"
                      textAnchor="middle"
                    >
                      ENGAGE
                    </textPath>
                  </text>
                  <text
                    className={styles.engageText}
                    style={{ opacity: 0.92 }}
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
            </div>
          </div>

          <div ref={captionRef} className={styles.caption}>
            Hover the craft field · click to charge
          </div>
        </div>

        <div className={styles.panelNote}>
          Haunebu Coanda Hull · Thule Triebwerk · Pass 2G
        </div>
      </section>
    </main>
  );
}
