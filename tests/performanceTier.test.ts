import { describe, expect, it } from "vitest";
import { selectPerformanceTier } from "../src/utils/performanceTier";

describe("selectPerformanceTier", () => {
  it("uses low mode for reduced motion", () => {
    expect(
      selectPerformanceTier({
        reducedMotion: true,
        deviceMemory: 8,
        hardwareConcurrency: 8,
        saveData: false,
      }),
    ).toBe("low");
  });

  it("uses medium mode for constrained devices", () => {
    expect(
      selectPerformanceTier({
        reducedMotion: false,
        deviceMemory: 4,
        hardwareConcurrency: 4,
        saveData: false,
      }),
    ).toBe("medium");
  });

  it("uses high mode only with comfortable signals", () => {
    expect(
      selectPerformanceTier({
        reducedMotion: false,
        deviceMemory: 8,
        hardwareConcurrency: 8,
        saveData: false,
      }),
    ).toBe("high");
  });
});
