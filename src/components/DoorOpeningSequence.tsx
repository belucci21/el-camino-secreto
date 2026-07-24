"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { experienceConfig } from "../config/experience";
import { AncientDoor } from "./AncientDoor";

interface DoorOpeningSequenceProps {
  reducedMotion: boolean;
  onFinished: () => void;
}

export function DoorOpeningSequence({
  reducedMotion,
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
            { opacity: 0.2, scaleY: 0.05 },
            { opacity: 1, scaleY: 1, duration: 2.8, ease: "power2.inOut" },
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
      <AncientDoor state={reducedMotion || opened ? "open" : "awake"} />
      <p className="opening-copy">El umbral te reconoce.</p>
      <button className="skip-opening" onClick={finish}>
        Saltar apertura
      </button>
    </section>
  );
}
