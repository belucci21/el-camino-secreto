import { describe, expect, it } from "vitest";
import {
  experienceReducer,
  initialExperienceState,
} from "../src/state/experienceMachine";

describe("experienceReducer", () => {
  it("starts in loading", () => {
    expect(initialExperienceState.scene).toBe("loading");
  });

  it("moves through the discovery route", () => {
    const threshold = experienceReducer(initialExperienceState, { type: "READY" });
    const discovery = experienceReducer(threshold, {
      type: "ENTER",
      soundEnabled: false,
    });
    const approach = experienceReducer(discovery, { type: "DISCOVER" });
    const gate = experienceReducer(approach, { type: "APPROACH_FINISHED" });
    expect([threshold.scene, discovery.scene, approach.scene, gate.scene]).toEqual([
      "threshold",
      "discovery",
      "approach",
      "gate",
    ]);
  });

  it("can skip directly to the revealed invitation", () => {
    expect(
      experienceReducer(initialExperienceState, { type: "SKIP_TO_REVEAL" }).scene,
    ).toBe("revealed");
  });

  it("replays the door opening without losing preferences", () => {
    const state = {
      ...initialExperienceState,
      scene: "revealed" as const,
      soundEnabled: true,
      reducedMotion: true,
    };
    const replayed = experienceReducer(state, { type: "REPLAY_OPENING" });
    expect(replayed).toMatchObject({
      scene: "opening",
      soundEnabled: true,
      reducedMotion: true,
    });
  });
});
