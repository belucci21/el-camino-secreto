"use client";

import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  experienceReducer,
  initialExperienceState,
} from "../state/experienceMachine";
import { experienceConfig } from "../config/experience";
import { useAudio } from "../hooks/useAudio";
import { useDeviceCapabilities } from "../hooks/useDeviceCapabilities";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { AccessibilityControls } from "./AccessibilityControls";
import { ApproachScene } from "./ApproachScene";
import { DiscoveryScene } from "./DiscoveryScene";
import { DoorOpeningSequence } from "./DoorOpeningSequence";
import { ErrorBoundary } from "./ErrorBoundary";
import { ExperienceLoader } from "./ExperienceLoader";
import { FinalMessage } from "./FinalMessage";
import { InvitationReveal } from "./InvitationReveal";
import { SecretWordGate } from "./SecretWordGate";
import { SoundGate } from "./SoundGate";

const sceneAnnouncements = {
  loading: "El camino está despertando",
  threshold: "Umbral de entrada",
  discovery: "Descubrimiento del camino",
  approach: "Aproximación a la puerta",
  gate: "Palabra del camino",
  opening: "Apertura de la puerta",
  revealed: "Invitación revelada",
} as const;

export function ExperienceApp() {
  const [state, dispatch] = useReducer(
    experienceReducer,
    initialExperienceState,
  );
  const motion = useReducedMotion();
  const audio = useAudio();
  const tier = useDeviceCapabilities(motion.reducedMotion);
  const [online, setOnline] = useState(true);
  const focusTargetRef = useRef<HTMLParagraphElement>(null);
  const previousSceneRef = useRef(state.scene);
  const recognitionTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => dispatch({ type: "READY" }), 350);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(
    () => () => {
      if (recognitionTimerRef.current !== null) {
        window.clearTimeout(recognitionTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (
      state.scene !== "loading" &&
      state.scene !== previousSceneRef.current
    ) {
      focusTargetRef.current?.focus();
    }
    previousSceneRef.current = state.scene;
  }, [state.scene]);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const enter = useCallback(
    (soundEnabled: boolean) => {
      if (soundEnabled) void audio.start();
      dispatch({ type: "ENTER", soundEnabled });
    },
    [audio],
  );

  const acceptSecret = () => {
    audio.playCue("unlock");
    recognitionTimerRef.current = window.setTimeout(
      () => {
        recognitionTimerRef.current = null;
        audio.playCue("opening");
        dispatch({ type: "SECRET_ACCEPTED" });
      },
      motion.reducedMotion ? 180 : experienceConfig.recognitionDurationMs,
    );
  };

  const canSkipMotion =
    state.scene === "threshold" ||
    state.scene === "discovery" ||
    state.scene === "approach";
  const canSkipOpening = state.scene === "opening";
  const skipLabel = canSkipMotion
    ? "Ir a la palabra"
    : canSkipOpening
      ? "Terminar apertura"
      : undefined;
  const skipAction = canSkipMotion
    ? () => dispatch({ type: "SKIP_TO_GATE" })
    : canSkipOpening
      ? () => dispatch({ type: "SKIP_OPENING" })
      : undefined;

  return (
    <ErrorBoundary>
      <div
        className="experience"
        data-reduced-motion={motion.reducedMotion ? "true" : "false"}
        data-performance-tier={tier}
      >
        <p
          ref={focusTargetRef}
          className="scene-focus-target"
          data-testid="scene-focus-target"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          tabIndex={-1}
        >
          {sceneAnnouncements[state.scene]}
        </p>
        {!online && (
          <p className="connection-status" role="status">
            Sin conexión. El camino continúa con los recursos disponibles.
          </p>
        )}
        {state.scene !== "loading" && (
          <AccessibilityControls
            reducedMotion={motion.reducedMotion}
            soundEnabled={audio.enabled}
            volume={audio.volume}
            onToggleMotion={() =>
              motion.setReducedMotion(!motion.reducedMotion)
            }
            onToggleSound={() =>
              audio.enabled ? audio.mute() : void audio.start()
            }
            onVolumeChange={audio.setVolume}
            skipLabel={skipLabel}
            onSkip={skipAction}
          />
        )}
        {state.scene === "loading" && <ExperienceLoader />}
        {state.scene === "threshold" && (
          <SoundGate
            reducedMotion={motion.reducedMotion}
            onEnter={enter}
            onToggleReducedMotion={() =>
              motion.setReducedMotion(!motion.reducedMotion)
            }
            onSkipMotion={() => dispatch({ type: "SKIP_TO_GATE" })}
          />
        )}
        {state.scene === "discovery" && (
          <DiscoveryScene
            tier={tier}
            onDiscover={() => dispatch({ type: "DISCOVER" })}
          />
        )}
        {state.scene === "approach" && (
          <ApproachScene
            reducedMotion={motion.reducedMotion}
            tier={tier}
            onFinished={() => dispatch({ type: "APPROACH_FINISHED" })}
          />
        )}
        {state.scene === "gate" && (
          <SecretWordGate onAccepted={acceptSecret} />
        )}
        {state.scene === "opening" && (
          <DoorOpeningSequence
            reducedMotion={motion.reducedMotion}
            tier={tier}
            onFinished={() => dispatch({ type: "OPENING_FINISHED" })}
          />
        )}
        {state.scene === "revealed" && (
          <>
            <InvitationReveal />
            <FinalMessage
              onReplay={() => dispatch({ type: "REPLAY_OPENING" })}
            />
          </>
        )}
      </div>
    </ErrorBoundary>
  );
}
