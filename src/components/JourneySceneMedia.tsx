"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { JourneyScene } from "../types/journey";

type JourneySceneMediaProps = {
  scene: JourneyScene;
  imagePath: string;
  couple: string;
  reducedMotion: boolean;
  motionEnabled: boolean;
  onMotionComplete: (sceneOrder: number) => void;
  priority: boolean;
};

export function JourneySceneMedia({
  scene,
  imagePath,
  couple,
  reducedMotion,
  motionEnabled,
  onMotionComplete,
  priority,
}: JourneySceneMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const motionAsset = reducedMotion || !motionEnabled ? undefined : scene.motion_asset;

  const completeMotion = useCallback(() => {
    videoRef.current?.pause();
    setVideoEnded(true);
    onMotionComplete(scene.order);
  }, [onMotionComplete, scene.order]);

  const revealMotion = useCallback(() => {
    setVideoReady(true);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const pauseWhenHidden = () => {
      if (document.hidden) {
        video.pause();
      } else if (!videoEnded) {
        void video.play().catch(() => undefined);
      }
    };

    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () => document.removeEventListener("visibilitychange", pauseWhenHidden);
  }, [motionAsset?.public_asset_path, videoEnded]);

  useEffect(() => {
    if (!motionAsset || !videoReady || videoEnded) return;

    // Each clip introduces the next chapter, then yields to the exact interactive
    // artwork before a visitor can mistake the cinematic phase for a dead end.
    const timer = window.setTimeout(completeMotion, 7000);
    return () => window.clearTimeout(timer);
  }, [completeMotion, motionAsset, videoEnded, videoReady]);

  return (
    <div
      className="journey-scene-media"
      data-has-video={Boolean(motionAsset)}
      data-video-ready={videoReady}
      data-video-ended={videoEnded}
      data-media-phase={motionAsset && !videoEnded ? "motion" : "interactive"}
      data-opening={scene.order === 5}
    >
      {motionAsset && (
        <video
          ref={videoRef}
          className="journey-scene-video"
          data-testid="journey-motion-video"
          aria-hidden="true"
          autoPlay
          muted
          playsInline
          loop={false}
          preload={priority || scene.order === 4 || scene.order === 5 ? "auto" : "metadata"}
          width={motionAsset.width}
          height={motionAsset.height}
          onCanPlay={revealMotion}
          onLoadedData={revealMotion}
          onPlaying={revealMotion}
          onEnded={completeMotion}
          onError={completeMotion}
        >
          <source src={motionAsset.public_asset_path} type="video/mp4" />
        </video>
      )}

      {/* The approved artwork remains the exact interface/copy layer over the living scene. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="journey-scene-image"
        src={imagePath}
        alt={`${couple}. ${scene.visible_copy.slice(1, 6).join(". ")}`}
        draggable={false}
        width={scene.asset.width}
        height={scene.asset.height}
        loading="eager"
        decoding="async"
        srcSet={`${imagePath} 2x`}
        fetchPriority={priority ? "high" : "auto"}
      />

      {motionAsset && videoReady && !videoEnded && (
        <button
          className="journey-skip-motion"
          type="button"
          onClick={completeMotion}
          aria-label="Mostrar pantalla interactiva"
        >
          Entrar en la escena
          <span aria-hidden="true">→</span>
        </button>
      )}
    </div>
  );
}
