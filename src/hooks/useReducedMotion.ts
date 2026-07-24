"use client";

import { useEffect, useState } from "react";

export function useReducedMotion() {
  const [system, setSystem] = useState(false);
  const [override, setOverride] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystem(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return {
    reducedMotion: override ?? system,
    setReducedMotion: setOverride,
  };
}
