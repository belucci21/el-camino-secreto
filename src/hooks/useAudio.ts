"use client";

import { useCallback, useRef, useState } from "react";
import { useVisibilityPause } from "./useVisibilityPause";

type WindowWithWebkitAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export function useAudio() {
  const contextRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [available, setAvailable] = useState(true);
  const [volume, setVolumeState] = useState(0.65);

  const stop = useCallback(() => {
    try {
      void contextRef.current?.suspend().catch(() => undefined);
    } catch {
      // Browsers may reject audio operations as their lifecycle changes.
    }
  }, []);

  useVisibilityPause(stop);

  const start = useCallback(async () => {
    try {
      if (typeof window === "undefined") {
        throw new Error("AudioContext unavailable");
      }

      const AudioContextClass =
        window.AudioContext ||
        (window as WindowWithWebkitAudio).webkitAudioContext;
      if (!AudioContextClass) throw new Error("AudioContext unavailable");

      contextRef.current ??= new AudioContextClass();
      if (!gainRef.current) {
        const context = contextRef.current;
        const gain = context.createGain();
        const oscillator = context.createOscillator();
        oscillator.type = "sine";
        oscillator.frequency.value = 78;
        gain.gain.value = volume * 0.02;
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start();
        gainRef.current = gain;
      }

      await contextRef.current.resume();
      setEnabled(true);
    } catch {
      setAvailable(false);
      setEnabled(false);
    }
  }, [volume]);

  const setVolume = useCallback((value: number) => {
    const next = Math.min(1, Math.max(0, value));
    setVolumeState(next);
    const context = contextRef.current;
    gainRef.current?.gain.setTargetAtTime(
      next * 0.02,
      context?.currentTime ?? 0,
      0.08,
    );
  }, []);

  const mute = useCallback(() => {
    setEnabled(false);
    stop();
  }, [stop]);

  return { enabled, available, volume, setVolume, start, mute };
}
