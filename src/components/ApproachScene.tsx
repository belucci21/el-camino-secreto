"use client";

import { useEffect, useRef, useState } from "react";
import { experienceConfig } from "../config/experience";
import type { PerformanceTier } from "../utils/performanceTier";
import { PortalStage } from "./PortalStage";

interface ApproachSceneProps {
  reducedMotion: boolean;
  tier?: PerformanceTier;
  onFinished: () => void;
}

export function ApproachScene({
  reducedMotion,
  tier = "medium",
  onFinished,
}: ApproachSceneProps) {
  const [hasArrived, setHasArrived] = useState(reducedMotion);
  const arrived = reducedMotion || hasArrived;
  const continueButtonRef = useRef<HTMLButtonElement>(null);
  const wasArrived = useRef(arrived);

  useEffect(() => {
    if (reducedMotion) return;

    const timer = window.setTimeout(
      () => setHasArrived(true),
      experienceConfig.approachDurationMs,
    );
    return () => window.clearTimeout(timer);
  }, [reducedMotion]);

  useEffect(() => {
    if (arrived && !wasArrived.current) {
      continueButtonRef.current?.focus();
    }
    wasArrived.current = arrived;
  }, [arrived]);

  return (
    <section
      className={`scene approach${arrived ? " is-arrived" : ""}`}
      aria-labelledby="approach-title"
    >
      <PortalStage
        state={arrived ? "waiting" : "distant"}
        mode="approach"
        reducedMotion={reducedMotion}
        tier={tier}
      />
      <p className="approach-status" role="status" aria-live="polite">
        {arrived ? "La puerta está lista." : "La puerta se aproxima."}
      </p>
      {arrived ? (
        <>
          <h2 id="approach-title">
            Solo quienes conocen la palabra podrán entrar.
          </h2>
          <button
            key="continue"
            ref={continueButtonRef}
            onClick={onFinished}
          >
            Acércate
          </button>
        </>
      ) : (
        <>
          <p id="approach-title">La puerta despierta entre la niebla.</p>
          <button key="skip" onClick={() => setHasArrived(true)}>
            Saltar aproximación
          </button>
        </>
      )}
    </section>
  );
}
