"use client";

import type { PerformanceTier } from "../utils/performanceTier";
import type { CSSProperties } from "react";
import { useWebGLAvailable } from "../hooks/useWebGLAvailable";
import {
  PortalCanvas,
  type PortalMode,
  type PortalVisualState,
} from "./PortalCanvas";

interface PortalStageProps {
  state: PortalVisualState;
  mode: PortalMode;
  progress?: number;
  variant?: "artwork" | "portal" | "atmosphere";
  reducedMotion?: boolean;
  tier?: PerformanceTier;
  label?: string;
}

function CinematicPortalArtwork({
  state,
  mode,
  progress,
  reducedMotion,
  use3d,
}: {
  state: PortalVisualState;
  mode: PortalMode;
  progress: number;
  reducedMotion: boolean;
  use3d: boolean;
}) {
  return (
    <div
      className="portal-artwork"
      data-state={state}
      data-mode={mode}
      style={{ "--portal-progress": progress } as CSSProperties}
      aria-hidden="true"
    >
      <div className="portal-artwork-scene portal-artwork-open" />
      <div className="portal-artwork-scene portal-artwork-closed" />
      <div className="portal-artwork-depth" />
      <div className="portal-artwork-beam door-light" />
      <div className="portal-artwork-leaves">
        <div
          className="portal-artwork-leaf portal-artwork-leaf-left"
          data-hinge="left"
        />
        <div
          className="portal-artwork-leaf portal-artwork-leaf-right"
          data-hinge="right"
        />
      </div>
      <div className="portal-artwork-mist" />
      {use3d ? (
        <PortalCanvas
          state={state}
          mode={mode}
          progress={progress}
          variant="atmosphere"
          reducedMotion={reducedMotion}
        />
      ) : null}
    </div>
  );
}

export function PortalFallback({
  state,
  mode = "gate",
  progress = 0,
}: {
  state: PortalVisualState;
  mode?: PortalMode;
  progress?: number;
}) {
  const runes = Array.from({ length: 18 }, (_, index) => index);
  return (
    <div
      className="portal-fallback"
      data-state={state}
      data-mode={mode}
      style={{ "--portal-progress": progress } as CSSProperties}
      aria-hidden="true"
    >
      <div className="portal-ornament portal-ornament-top" />
      <div className="portal-arch-shell">
        <div className="portal-column portal-column-left" />
        <div className="portal-column portal-column-right" />
        <div className="portal-arch-ring" />
        <div className="portal-door-leaf portal-door-left" />
        <div className="door-light portal-light-core" />
        <div className="portal-door-leaf portal-door-right" />
        <div className="portal-runes">
          {runes.map((rune) => (
            <span key={rune} style={{ "--rune-index": rune } as CSSProperties} />
          ))}
        </div>
      </div>
      <div className="portal-reflection" />
    </div>
  );
}

export function PortalStage({
  state,
  mode,
  progress = 0,
  variant = "artwork",
  reducedMotion = false,
  tier = "medium",
  label = "Portal ceremonial de Gladiola y Jordi",
}: PortalStageProps) {
  const webgl = useWebGLAvailable();
  const use3d = webgl && tier !== "low" && !reducedMotion;

  return (
    <div
      className="portal-stage"
      data-portal-state={state}
      data-portal-mode={mode}
      data-portal-variant={variant}
      data-portal-renderer={use3d ? "webgl" : "fallback"}
      style={{ "--portal-progress": progress } as CSSProperties}
      role="img"
      aria-label={label}
    >
      {variant === "artwork" ? (
        <CinematicPortalArtwork
          state={state}
          mode={mode}
          progress={progress}
          reducedMotion={reducedMotion}
          use3d={use3d}
        />
      ) : use3d ? (
        <PortalCanvas
          state={state}
          mode={mode}
          progress={progress}
          variant={variant}
          reducedMotion={reducedMotion}
        />
      ) : variant === "atmosphere" ? (
        <div className="portal-atmosphere-fallback" aria-hidden="true" />
      ) : (
        <PortalFallback state={state} mode={mode} progress={progress} />
      )}
    </div>
  );
}
