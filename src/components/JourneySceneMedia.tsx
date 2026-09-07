"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type JourneySceneMediaProps = {
  sceneOrder: number;
  title: string;
  videoPath: string;
  frozenFramePath: string;
  couple: string;
  reducedMotion: boolean;
  motionEnabled: boolean;
  onMotionComplete: (sceneOrder: number) => void;
  priority: boolean;
};

export function JourneySceneMedia({
  sceneOrder,
  title,
  videoPath,
  frozenFramePath,
  couple,
  reducedMotion,
  motionEnabled,
  onMotionComplete,
  priority,
}: JourneySceneMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const motionActive = !reducedMotion && motionEnabled;

  const completeMotion = useCallback(() => {
    setVideoEnded(true);
    onMotionComplete(sceneOrder);
  }, [onMotionComplete, sceneOrder]);

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
  }, [motionActive, videoEnded]);

  return (
    <div
      className="journey-scene-media"
      data-has-video={motionActive}
      data-video-ready={videoReady}
      data-video-ended={videoEnded}
      data-media-phase={motionActive && !videoEnded ? "motion" : "interactive"}
      data-opening={sceneOrder === 5}
    >
      {motionActive && !videoEnded && (
        <video
          ref={videoRef}
          className="journey-scene-video"
          data-testid="journey-motion-video"
          aria-hidden="true"
          autoPlay
          muted
          playsInline
          loop={false}
          preload={priority || sceneOrder === 4 || sceneOrder === 5 ? "auto" : "metadata"}
          width={720}
          height={1280}
          onCanPlay={revealMotion}
          onLoadedData={revealMotion}
          onPlaying={revealMotion}
          onEnded={completeMotion}
          onError={completeMotion}
        >
          <source src={videoPath} type="video/mp4" />
        </video>
      )}

      {/* A final decoded frame provides the static state for reduced motion, chapters, and video errors. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="journey-scene-image"
        src={frozenFramePath}
        alt={`${couple}. ${title}`}
        draggable={false}
        width={720}
        height={1280}
        loading="eager"
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
      />

    </div>
  );
}
