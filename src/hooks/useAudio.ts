"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Howl, Howler } from "howler";
import { useVisibilityPause } from "./useVisibilityPause";

export type AudioCue = "unlock" | "opening";

type AudioTracks = {
  ambient: Howl;
  unlock: Howl;
  opening: Howl;
};

function createTracks(volume: number): AudioTracks {
  return {
    ambient: new Howl({
      // The final 4-minute track is preferred; the WAV remains a safe local fallback.
      src: ["/audio/ambient-final.mp3", "/audio/ambient-loop.wav"],
      loop: true,
      // Use a GainNode mixer: iOS HTMLMediaElement volume is not software
      // controllable and a second native audio stream can interrupt video audio.
      volume: volume * 0.72,
      html5: false,
    }),
    unlock: new Howl({
      src: ["/audio/unlock-chime.wav"],
      volume: volume * 0.72,
      html5: false,
    }),
    opening: new Howl({
      src: ["/audio/portal-opening.wav"],
      volume: volume * 0.82,
      html5: false,
    }),
  };
}

export function useAudio() {
  const tracksRef = useRef<AudioTracks | null>(null);
  const narrationTracksRef = useRef<Map<string, Howl>>(new Map());
  const activeNarrationRef = useRef<{ path: string; track: Howl } | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [available, setAvailable] = useState(true);
  const [volume, setVolumeState] = useState(0.65);
  const narrationRef = useRef(false);
  const volumeRef = useRef(volume);
  const ambientLevelRef = useRef(volume * 0.72);
  const enabledRef = useRef(false);

  const stop = useCallback(() => {
    try {
      if (tracksRef.current) Object.values(tracksRef.current).forEach((track) => track.pause());
      activeNarrationRef.current?.track.pause();
    } catch {
      // Browsers may reject audio operations as their lifecycle changes.
    }
  }, []);

  const ensureContinuity = useCallback(async () => {
    if (!enabledRef.current || document.hidden) return;

    // Safari on iOS can interrupt the Web Audio context when one native
    // video-with-audio is replaced by the next. Howler still reports the
    // ambient Howl as playing, so resume the context itself without touching
    // the Howl/playhead. Only call play when the track was genuinely paused.
    try {
      if (Howler.ctx && Howler.ctx.state !== "running") {
        await Howler.ctx.resume();
      }
    } catch {
      // A later media or user-gesture event gets another recovery attempt.
    }

    try {
      const ambient = tracksRef.current?.ambient;
      if (ambient && !ambient.playing()) ambient.play();
    } catch {
      // Browsers may reject audio operations as their lifecycle changes.
    }
  }, []);

  const resume = useCallback(() => {
    void ensureContinuity();
  }, [ensureContinuity]);

  useVisibilityPause(stop, resume);

  useEffect(() => () => {
    if (tracksRef.current) Object.values(tracksRef.current).forEach((track) => track.unload());
    narrationTracksRef.current.forEach((track) => track.unload());
    narrationTracksRef.current.clear();
    activeNarrationRef.current = null;
    tracksRef.current = null;
  }, []);

  const getNarrationTrack = useCallback((path: string) => {
    const existing = narrationTracksRef.current.get(path);
    if (existing) return existing;

    const track = new Howl({
      src: [path],
      preload: true,
      volume: 1,
      // Music and narration must share one software mixer. Keeping both out
      // of HTMLMediaElement audio prevents iOS from changing audio sessions
      // when the muted scene video is replaced.
      html5: false,
    });
    narrationTracksRef.current.set(path, track);
    return track;
  }, []);

  const preloadNarration = useCallback((paths: readonly string[]) => {
    try {
      paths.forEach((path) => {
        if (path) getNarrationTrack(path);
      });
    } catch {
      setAvailable(false);
    }
  }, [getNarrationTrack]);

  const syncNarration = useCallback((path: string | undefined, time: number, shouldPlay: boolean) => {
    try {
      const active = activeNarrationRef.current;
      if (!path || !enabledRef.current || document.hidden || !shouldPlay) {
        if (active?.track.playing()) active.track.pause();
        return;
      }

      const track = getNarrationTrack(path);
      if (active && active.path !== path) {
        if (active.track.playing()) active.track.pause();
      }
      activeNarrationRef.current = { path, track };
      void ensureContinuity();

      const target = Math.max(0, time);
      if (!track.playing()) {
        track.seek(target);
        track.play();
        return;
      }

      const current = track.seek();
      if (typeof current === "number" && Math.abs(current - target) > 0.35) {
        track.seek(target);
      }
    } catch {
      setAvailable(false);
    }
  }, [ensureContinuity, getNarrationTrack]);

  const setNarrationActive = useCallback((active: boolean) => {
    if (narrationRef.current === active) return;
    narrationRef.current = active;
    const target = volumeRef.current * (active ? 0.56 : 0.72);
    const ambient = tracksRef.current?.ambient;
    if (ambient) {
      const current = ambient.volume();
      if (enabledRef.current && !document.hidden) ambient.fade(typeof current === "number" ? current : ambientLevelRef.current, target, 450);
      else ambient.volume(target);
    }
    ambientLevelRef.current = target;
  }, []);

  const start = useCallback(async () => {
    try {
      if (typeof window === "undefined") {
        throw new Error("Audio unavailable");
      }

      tracksRef.current ??= createTracks(volume);
      Howler.volume(1);
      const ambient = tracksRef.current.ambient;
      ambientLevelRef.current = volume * (narrationRef.current ? 0.56 : 0.72);
      ambient.volume(ambientLevelRef.current);
      if (!ambient.playing()) ambient.play();
      enabledRef.current = true;
      setEnabled(true);
      setAvailable(true);
    } catch {
      setAvailable(false);
      setEnabled(false);
    }
  }, [volume]);

  const setVolume = useCallback((value: number) => {
    const next = Math.min(1, Math.max(0, value));
    setVolumeState(next);
    volumeRef.current = next;

    try {
      Howler.volume(1);
      ambientLevelRef.current = next * (narrationRef.current ? 0.56 : 0.72);
      tracksRef.current?.ambient.volume(ambientLevelRef.current);
      tracksRef.current?.unlock.volume(next * 0.72);
      tracksRef.current?.opening.volume(next * 0.82);
    } catch {
      setAvailable(false);
    }
  }, []);

  const mute = useCallback(() => {
    enabledRef.current = false;
    setEnabled(false);
    stop();
  }, [stop]);

  const playCue = useCallback(
    (cue: AudioCue) => {
      if (!enabledRef.current || document.hidden) return;

      try {
        tracksRef.current?.[cue].play();
      } catch {
        setAvailable(false);
      }
    },
    [],
  );

  return {
    enabled, available, volume, setVolume, start, mute, playCue,
    setNarrationActive, ensureContinuity, preloadNarration, syncNarration,
  };
}
