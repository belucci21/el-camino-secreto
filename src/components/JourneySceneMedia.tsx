"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type JourneySceneMediaProps = {
  sceneOrder: number;
  title: string;
  videoPath: string;
  frozenFramePath: string;
  firstFramePath: string;
  previousFramePath?: string;
  holdFrameAt?: number;
  hasNarration: boolean;
  audioEnabled: boolean;
  paused: boolean;
  couple: string;
  reducedMotion: boolean;
  motionEnabled: boolean;
  onMotionComplete: (sceneOrder: number) => void;
  onNarrationChange: (active: boolean) => void;
  onSceneReady: (sceneOrder: number, final: boolean) => void;
  priority: boolean;
};

export function JourneySceneMedia({
  sceneOrder, title, videoPath, frozenFramePath, firstFramePath, previousFramePath,
  holdFrameAt, hasNarration, audioEnabled, paused, couple, reducedMotion,
  motionEnabled, onMotionComplete, onNarrationChange, onSceneReady, priority,
}: JourneySceneMediaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const playhead = useRef(0);
  const completed = useRef(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [holdingFrame, setHoldingFrame] = useState(false);
  const [needsGesture, setNeedsGesture] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const playbackActive = motionEnabled && !videoEnded && (!reducedMotion || (audioEnabled && hasNarration));
  const motionActive = playbackActive && !reducedMotion;

  const completeMotion = useCallback(() => {
    if (completed.current) return;
    completed.current = true;
    setVideoEnded(true);
    onNarrationChange(false);
    onSceneReady(sceneOrder, true);
    onMotionComplete(sceneOrder);
  }, [onMotionComplete, onNarrationChange, onSceneReady, sceneOrder]);

  const play = useCallback(() => {
    const media = videoRef.current ?? audioRef.current;
    if (!media || paused || document.hidden) return;
    void media.play().then(() => setNeedsGesture(false)).catch((error: DOMException) => {
      if (error.name !== "AbortError") setNeedsGesture(true);
    });
  }, [paused]);

  const revealMotion = useCallback(() => {
    setVideoReady(true);
    setNeedsGesture(false);
    onSceneReady(sceneOrder, reducedMotion);
    onNarrationChange(audioEnabled && hasNarration);
  }, [audioEnabled, hasNarration, onNarrationChange, onSceneReady, reducedMotion, sceneOrder]);

  const trackProgress = useCallback(() => {
    const media = videoRef.current ?? audioRef.current;
    if (!media) return;
    playhead.current = media.currentTime;
    const fallbackLead = videoRef.current?.requestVideoFrameCallback ? 0 : 0.25;
    if (holdFrameAt !== undefined && media.currentTime >= holdFrameAt - fallbackLead) {
      setHoldingFrame(true);
      onSceneReady(sceneOrder, true);
    }
  }, [holdFrameAt, onSceneReady, sceneOrder]);

  useEffect(() => {
    if (!playbackActive) {
      onNarrationChange(false);
      onSceneReady(sceneOrder, true);
      return;
    }
    const media = videoRef.current ?? audioRef.current;
    if (!media) return;
    const syncPlayback = () => {
      if (document.hidden || paused) {
        media.pause();
        onNarrationChange(false);
      } else {
        play();
        onNarrationChange(audioEnabled && hasNarration && !media.paused);
      }
    };
    syncPlayback();
    document.addEventListener("visibilitychange", syncPlayback);
    return () => {
      playhead.current = media.currentTime;
      media.pause();
      onNarrationChange(false);
      document.removeEventListener("visibilitychange", syncPlayback);
    };
  }, [audioEnabled, hasNarration, onNarrationChange, onSceneReady, paused, play, playbackActive, reducedMotion, sceneOrder]);

  // rVFC covers the first black frame precisely; timeupdate is the older-browser fallback.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || holdFrameAt === undefined || !video.requestVideoFrameCallback) return;
    let callbackId: number;
    const frame = (_now: number, metadata: VideoFrameCallbackMetadata) => {
      if (metadata.mediaTime >= holdFrameAt) {
        setHoldingFrame(true);
        onSceneReady(sceneOrder, true);
      } else callbackId = video.requestVideoFrameCallback(frame);
    };
    callbackId = video.requestVideoFrameCallback(frame);
    return () => video.cancelVideoFrameCallback(callbackId);
  }, [holdFrameAt, motionActive, onSceneReady, sceneOrder]);

  const mediaEvents = {
    onPlaying: revealMotion,
    onTimeUpdate: trackProgress,
    onLoadedMetadata: () => {
      const media = videoRef.current ?? audioRef.current;
      if (media && playhead.current > 0) media.currentTime = playhead.current;
    },
    onPause: () => onNarrationChange(false),
    onWaiting: () => onNarrationChange(false),
    onEnded: completeMotion,
    onError: () => { setMediaError(true); completeMotion(); },
  };

  return (
    <div className="journey-scene-media" data-has-video={motionActive}
      data-video-ready={videoReady} data-video-ended={videoEnded}
      data-hold-frame={holdingFrame} data-media-phase={playbackActive ? "motion" : "interactive"}
      data-opening={sceneOrder === 5}>
      {motionActive && (
        <video ref={videoRef} className="journey-scene-video" data-testid="journey-motion-video"
          aria-hidden="true" autoPlay muted={!audioEnabled} playsInline loop={false}
          preload="auto" width={720} height={1280} {...mediaEvents}>
          <source src={videoPath} type="video/mp4" />
        </video>
      )}
      {playbackActive && reducedMotion && (
        <audio ref={audioRef} src={videoPath} autoPlay preload="auto" {...mediaEvents} />
      )}
      {/* The film and its still use identical dimensions: no reframe at the end. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="journey-scene-image" src={frozenFramePath} alt={`${couple}. ${title}`}
        draggable={false} width={720} height={1280} loading="eager" decoding="async"
        fetchPriority={priority ? "high" : "auto"} />
      {motionActive && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="journey-scene-transition" src={previousFramePath ?? firstFramePath}
          alt="" aria-hidden="true" width={720} height={1280} />
      )}
      {needsGesture && playbackActive && (
        <button className="journey-media-retry" type="button" onClick={play}>Reanudar escena</button>
      )}
      {mediaError && <p className="journey-media-notice" role="status">No se pudo cargar el vídeo. Puedes continuar desde su imagen final.</p>}
    </div>
  );
}
