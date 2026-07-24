"use client";

import { useMemo } from "react";
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
  return useMemo(() => {
    if (typeof navigator === "undefined") {
      return reducedMotion ? "low" : "medium";
    }

    const browser = navigator as NavigatorWithHints;
    return selectPerformanceTier({
      reducedMotion,
      deviceMemory: browser.deviceMemory,
      hardwareConcurrency: browser.hardwareConcurrency,
      saveData: browser.connection?.saveData,
    });
  }, [reducedMotion]);
}
