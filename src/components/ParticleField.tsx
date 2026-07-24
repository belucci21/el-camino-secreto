"use client";

import { useEffect, useRef } from "react";
import type { PerformanceTier } from "../utils/performanceTier";

export function ParticleField({ tier }: { tier: PerformanceTier }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (tier === "low") return;

    const canvas = ref.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    let frame = 0;
    let raf = 0;
    const count = tier === "high" ? 36 : 18;

    const draw = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      for (let index = 0; index < count; index += 1) {
        const x = (index * 97 + frame * 0.12) % canvas.width;
        const y =
          (index * 53 + Math.sin(frame / 80 + index) * 24) % canvas.height;
        context.fillStyle = "rgba(212,175,55,.55)";
        context.fillRect(x, y, 1.5, 1.5);
      }
      frame += 1;
      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, [tier]);

  return <canvas ref={ref} className="particle-field" aria-hidden="true" />;
}
