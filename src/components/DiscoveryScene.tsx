"use client";

import { useRef, type PointerEvent } from "react";
import type { PerformanceTier } from "../utils/performanceTier";
import { ForestLayers } from "./ForestLayers";
import { ParticleField } from "./ParticleField";

interface DiscoverySceneProps {
  tier: PerformanceTier;
  onDiscover: () => void;
}

export function DiscoveryScene({
  tier,
  onDiscover,
}: DiscoverySceneProps) {
  const ref = useRef<HTMLElement>(null);

  function move(event: PointerEvent<HTMLElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    ref.current?.style.setProperty("--look-x", `${x * 12}px`);
    ref.current?.style.setProperty("--look-y", `${y * 8}px`);
  }

  return (
    <section
      ref={ref}
      className="scene discovery"
      aria-labelledby="discovery-title"
      onPointerMove={tier === "low" ? undefined : move}
    >
      <ForestLayers />
      <ParticleField tier={tier} />
      <div className="scene-copy">
        <h2 id="discovery-title">
          Hay puertas que solo aparecen ante quienes fueron llamados.
        </h2>
        <button onClick={onDiscover}>Descubrir el camino</button>
      </div>
    </section>
  );
}
