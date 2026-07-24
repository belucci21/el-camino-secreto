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
  const animationRef = useRef<ReturnType<typeof gsap.fromTo> | null>(null);
  const frameRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const finishedRef = useRef(false);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    animationRef.current?.kill();
    animationRef.current = null;
    onFinished();
  }, [onFinished]);

  useEffect(() => {
    finishedRef.current = false;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      setOpened(true);
    });

    if (!reducedMotion) {
      try {
        animationRef.current = gsap.fromTo(
          ".opening .door-light",
          { opacity: 0.2, scaleY: 0.05 },
          { opacity: 1, scaleY: 1, duration: 2.8, ease: "power2.inOut" },
        );
      } catch {
        animationRef.current = null;
      }
    }

    timerRef.current = window.setTimeout(
      finish,
      reducedMotion ? 450 : experienceConfig.openingDurationMs,
    );

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      animationRef.current?.kill();
      animationRef.current = null;
    };
  }, [finish, reducedMotion]);

  return (
    <section className="scene opening" aria-label="La puerta se abre">
      <AncientDoor state={reducedMotion || opened ? "open" : "awake"} />
      <p className="opening-copy">El umbral te reconoce.</p>
      <button className="skip-opening" onClick={finish}>
        Saltar apertura
      </button>
    </section>
  );
}
