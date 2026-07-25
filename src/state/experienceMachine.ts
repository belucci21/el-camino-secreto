export type ExperienceScene =
  | "loading"
  | "threshold"
  | "discovery"
  | "approach"
  | "gate"
  | "opening"
  | "revealed";

export interface ExperienceState {
  scene: ExperienceScene;
  soundEnabled: boolean;
  reducedMotion: boolean;
}

export type ExperienceAction =
  | { type: "READY" }
  | { type: "ENTER"; soundEnabled: boolean }
  | { type: "DISCOVER" }
  | { type: "APPROACH_FINISHED" }
  | { type: "SECRET_ACCEPTED" }
  | { type: "OPENING_FINISHED" }
  | { type: "SET_REDUCED_MOTION"; value: boolean }
  | { type: "SKIP_TO_GATE" }
  | { type: "SKIP_OPENING" }
  | { type: "REPLAY_OPENING" };

export const initialExperienceState: ExperienceState = {
  scene: "loading",
  soundEnabled: false,
  reducedMotion: false,
};

export function experienceReducer(
  state: ExperienceState,
  action: ExperienceAction,
): ExperienceState {
  switch (action.type) {
    case "READY":
      return { ...state, scene: "threshold" };
    case "ENTER":
      return { ...state, scene: "discovery", soundEnabled: action.soundEnabled };
    case "DISCOVER":
      return { ...state, scene: "approach" };
    case "APPROACH_FINISHED":
      return { ...state, scene: "gate" };
    case "SKIP_TO_GATE":
      if (
        state.scene === "loading" ||
        state.scene === "threshold" ||
        state.scene === "discovery" ||
        state.scene === "approach"
      ) {
        return { ...state, scene: "gate" };
      }
      return state;
    case "SECRET_ACCEPTED":
    case "REPLAY_OPENING":
      return { ...state, scene: "opening" };
    case "OPENING_FINISHED":
      return { ...state, scene: "revealed" };
    case "SKIP_OPENING":
      return state.scene === "opening"
        ? { ...state, scene: "revealed" }
        : state;
    case "SET_REDUCED_MOTION":
      return { ...state, reducedMotion: action.value };
  }
}
