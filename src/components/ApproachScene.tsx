"use client";

import { useEffect, useState } from "react";
import { experienceConfig } from "../config/experience";
import { AncientDoor } from "./AncientDoor";

interface ApproachSceneProps {
  reducedMotion: boolean;
  onFinished: () => void;
}

export function ApproachScene({
  reducedMotion,
  onFinished,
}: ApproachSceneProps) {
  const [arrived, setArrived] = useState(reducedMotion);

  useEffect(() => {
    if (reducedMotion) return;

    const timer = window.setTimeout(
      () => setArrived(true),
      experienceConfig.approachDurationMs,
    );
    return () => window.clearTimeout(timer);
  }, [reducedMotion]);

  return (
    <section
      className={`scene approach${arrived ? " is-arrived" : ""}`}
      aria-labelledby="approach-title"
    >
      <AncientDoor state={arrived ? "waiting" : "distant"} />
      {arrived ? (
        <>
          <h2 id="approach-title">
            Solo quienes conocen la palabra podrán entrar.
          </h2>
          <button onClick={onFinished}>Acércate</button>
        </>
      ) : (
        <>
          <p id="approach-title">La puerta despierta entre la niebla.</p>
          <button onClick={() => setArrived(true)}>Saltar aproximación</button>
        </>
      )}
    </section>
  );
}
