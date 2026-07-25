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

  it("skips motion only as far as the required secret-word gate", () => {
    expect(
      experienceReducer(initialExperienceState, { type: "SKIP_TO_GATE" }).scene,
    ).toBe("gate");
  });

  it("cannot skip the opening before the secret word has been accepted", () => {
    const gate = {
      ...initialExperienceState,
      scene: "gate" as const,
    };
    expect(experienceReducer(gate, { type: "SKIP_OPENING" }).scene).toBe("gate");

    const opening = experienceReducer(gate, { type: "SECRET_ACCEPTED" });
    expect(experienceReducer(opening, { type: "SKIP_OPENING" }).scene).toBe(
      "revealed",
    );
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
