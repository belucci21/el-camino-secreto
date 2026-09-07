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
      // Stream the long track through the media element for reliable mobile playback.
      volume: volume * 0.72,
      html5: true,
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
    } catch {
      // Browsers may reject audio operations as their lifecycle changes.
    }
  }, []);

  const resume = useCallback(() => {
    if (!enabled) return;

    try {
      const ambient = tracksRef.current?.ambient;
      if (ambient && !ambient.playing()) ambient.play();
    } catch {
      // Browsers may reject audio operations as their lifecycle changes.
    }
  }, [enabled]);

  useVisibilityPause(stop, resume);

  useEffect(() => () => {
    if (tracksRef.current) Object.values(tracksRef.current).forEach((track) => track.unload());
    tracksRef.current = null;
  }, []);

  const setNarrationActive = useCallback((active: boolean) => {
    if (narrationRef.current === active) return;
    narrationRef.current = active;
    const target = volumeRef.current * (active ? 0.32 : 0.72);
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
      ambientLevelRef.current = volume * (narrationRef.current ? 0.32 : 0.72);
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
      ambientLevelRef.current = next * (narrationRef.current ? 0.32 : 0.72);
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

  return { enabled, available, volume, setVolume, start, mute, playCue, setNarrationActive };
}
