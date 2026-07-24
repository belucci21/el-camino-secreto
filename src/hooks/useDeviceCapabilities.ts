"use client";

import { useEffect, useState } from "react";
import {
  selectPerformanceTier,
  type PerformanceTier,
} from "../utils/performanceTier";

type NavigatorWithHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

export function useDeviceCapabilities(
  reducedMotion: boolean,
): PerformanceTier {
  const [tier, setTier] = useState<PerformanceTier>(
    reducedMotion ? "low" : "medium",
  );

  useEffect(() => {
    if (reducedMotion) return;

    let active = true;
    queueMicrotask(() => {
      if (!active) return;

      if (typeof navigator === "undefined") {
        setTier("medium");
        return;
      }

      const browser = navigator as NavigatorWithHints;
      setTier(
        selectPerformanceTier({
          reducedMotion: false,
          deviceMemory: browser.deviceMemory,
          hardwareConcurrency: browser.hardwareConcurrency,
          saveData: browser.connection?.saveData,
        }),
      );
    });

    return () => {
      active = false;
    };
  }, [reducedMotion]);

  return reducedMotion ? "low" : tier;
}
