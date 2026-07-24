export type PerformanceTier = "high" | "medium" | "low";

export interface PerformanceSignals {
  reducedMotion: boolean;
  deviceMemory?: number;
  hardwareConcurrency?: number;
  saveData?: boolean;
}

export function selectPerformanceTier(
  signals: PerformanceSignals,
): PerformanceTier {
  if (
    signals.reducedMotion ||
    signals.saveData ||
    (signals.deviceMemory !== undefined && signals.deviceMemory <= 2) ||
    (signals.hardwareConcurrency !== undefined &&
      signals.hardwareConcurrency <= 2)
  ) {
    return "low";
  }

  if (
    (signals.deviceMemory !== undefined && signals.deviceMemory <= 4) ||
    (signals.hardwareConcurrency !== undefined &&
      signals.hardwareConcurrency <= 4)
  ) {
    return "medium";
  }

  return "high";
}
