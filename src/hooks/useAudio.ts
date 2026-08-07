"use client";

import { useCallback, useRef, useState } from "react";
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
      volume: volume * 0.48,
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
  const [enabled, setEnabled] = useState(false);
  const [available, setAvailable] = useState(true);
  const [volume, setVolumeState] = useState(0.65);

  const stop = useCallback(() => {
    try {
      tracksRef.current?.ambient.pause();
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

  const start = useCallback(async () => {
    try {
      if (typeof window === "undefined") {
        throw new Error("Audio unavailable");
      }

      tracksRef.current ??= createTracks(volume);
      Howler.volume(volume);
      const ambient = tracksRef.current.ambient;
      if (!ambient.playing()) ambient.play();
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

    try {
      Howler.volume(next);
      tracksRef.current?.ambient.volume(next * 0.48);
      tracksRef.current?.unlock.volume(next * 0.72);
      tracksRef.current?.opening.volume(next * 0.82);
    } catch {
      setAvailable(false);
    }
  }, []);

  const mute = useCallback(() => {
    setEnabled(false);
    stop();
  }, [stop]);

  const playCue = useCallback(
    (cue: AudioCue) => {
      if (!enabled) return;

      try {
        tracksRef.current?.[cue].play();
      } catch {
        setAvailable(false);
      }
    },
    [enabled],
  );

  return { enabled, available, volume, setVolume, start, mute, playCue };
}
