"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { experienceConfig } from "../config/experience";
import type { PerformanceTier } from "../utils/performanceTier";
import { PortalStage } from "./PortalStage";

interface DoorOpeningSequenceProps {
  reducedMotion: boolean;
  tier?: PerformanceTier;
  onFinished: () => void;
}

export function DoorOpeningSequence({
  reducedMotion,
  tier = "medium",
  onFinished,
}: DoorOpeningSequenceProps) {
  const [opened, setOpened] = useState(reducedMotion);
  const rootRef = useRef<HTMLElement>(null);
  const animationRef = useRef<ReturnType<typeof gsap.fromTo> | null>(null);
  const frameRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const finishedRef = useRef(false);

  const cancelScheduledWork = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const animation = animationRef.current;
    animationRef.current = null;
    try {
      animation?.kill();
    } catch {
      // Visual enhancement failures must not block navigation.
    }
  }, []);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;

    try {
      cancelScheduledWork();
    } finally {
      onFinished();
    }
  }, [cancelScheduledWork, onFinished]);

  useEffect(() => {
    finishedRef.current = false;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      setOpened(true);
    });

    if (!reducedMotion) {
      try {
        const doorLight = rootRef.current?.querySelector(".door-light");
        if (doorLight) {
          animationRef.current = gsap.fromTo(
            doorLight,
            { opacity: 0.18, scaleY: 0.08, filter: "blur(8px)" },
            {
              opacity: 1,
              scaleY: 1.08,
              filter: "blur(0px)",
              duration: 3.8,
              ease: "power2.inOut",
            },
          );
        }
      } catch {
        animationRef.current = null;
      }
    }

    timerRef.current = window.setTimeout(
      finish,
      reducedMotion ? 450 : experienceConfig.openingDurationMs,
    );

    return cancelScheduledWork;
  }, [cancelScheduledWork, finish, reducedMotion]);

  return (
    <section
      ref={rootRef}
      className="scene opening"
      aria-label="La puerta se abre"
    >
      <PortalStage
        state={reducedMotion || opened ? "open" : "awake"}
        mode="opening"
        reducedMotion={reducedMotion}
        tier={tier}
      />
      <p className="opening-copy">El umbral se abre. La luz cruza el bosque.</p>
      <button className="skip-opening" onClick={finish}>
        Saltar apertura
      </button>
    </section>
  );
}
