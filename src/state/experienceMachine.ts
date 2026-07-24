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
  | { type: "SKIP_TO_REVEAL" }
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
    case "SECRET_ACCEPTED":
    case "REPLAY_OPENING":
      return { ...state, scene: "opening" };
    case "OPENING_FINISHED":
    case "SKIP_TO_REVEAL":
      return { ...state, scene: "revealed" };
    case "SET_REDUCED_MOTION":
      return { ...state, reducedMotion: action.value };
  }
}
