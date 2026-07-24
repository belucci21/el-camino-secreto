import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAudio } from "../src/hooks/useAudio";
import { useDeviceCapabilities } from "../src/hooks/useDeviceCapabilities";
import { useReducedMotion } from "../src/hooks/useReducedMotion";
import { useVisibilityPause } from "../src/hooks/useVisibilityPause";

afterEach(() => {
  vi.unstubAllGlobals();
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: false,
  });
});

describe("browser capability hooks", () => {
  it("allows an explicit reduced-motion override", () => {
    const { result } = renderHook(() => useReducedMotion());

    act(() => result.current.setReducedMotion(true));

    expect(result.current.reducedMotion).toBe(true);
  });

  it("pauses work when the document becomes hidden", () => {
    const onHidden = vi.fn();
    renderHook(() => useVisibilityPause(onHidden));
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });

    document.dispatchEvent(new Event("visibilitychange"));

    expect(onHidden).toHaveBeenCalledOnce();
  });

  it("selects a tier from browser capability signals", () => {
    Object.defineProperty(navigator, "deviceMemory", {
      configurable: true,
      value: 8,
    });
    Object.defineProperty(navigator, "hardwareConcurrency", {
      configurable: true,
      value: 8,
    });

    const { result } = renderHook(() => useDeviceCapabilities(false));

    expect(result.current).toBe("high");
  });

  it("uses a conservative tier when browser hints are unavailable", () => {
    vi.stubGlobal("navigator", undefined);

    const { result } = renderHook(() => useDeviceCapabilities(false));

    expect(result.current).toBe("medium");
  });
});

describe("useAudio", () => {
  function installAudioContext() {
    const gain = {
      gain: {
        value: 0,
        setTargetAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };
    const oscillator = {
      type: "sine",
      frequency: { value: 0 },
      connect: vi.fn(),
      start: vi.fn(),
    };
    const resume = vi.fn(async () => undefined);
    const suspend = vi.fn(async () => undefined);
    const constructor = vi.fn(
      class TestAudioContext {
        currentTime = 0;
        destination = {};
        resume = resume;
        suspend = suspend;
        createGain = vi.fn(() => gain);
        createOscillator = vi.fn(() => oscillator);
      },
    );
    vi.stubGlobal("AudioContext", constructor);

    return { constructor, gain, oscillator, resume, suspend };
  }

  it("starts audio only after the explicit start action", async () => {
    const audio = installAudioContext();

    const { result } = renderHook(() => useAudio());
    expect(result.current.enabled).toBe(false);
    expect(audio.constructor).not.toHaveBeenCalled();

    await act(async () => result.current.start());

    expect(result.current.enabled).toBe(true);
    expect(audio.constructor).toHaveBeenCalledOnce();
    expect(audio.oscillator.start).toHaveBeenCalledOnce();
  });

  it("supports clamped volume changes", async () => {
    const audio = installAudioContext();
    const { result } = renderHook(() => useAudio());
    await act(async () => result.current.start());

    act(() => result.current.setVolume(0.4));

    expect(result.current.volume).toBe(0.4);
    expect(audio.gain.gain.setTargetAtTime).toHaveBeenCalledWith(
      0.008,
      0,
      0.08,
    );

    act(() => result.current.setVolume(2));
    expect(result.current.volume).toBe(1);
  });

  it("fails silently when browser audio is unavailable", async () => {
    vi.stubGlobal("AudioContext", undefined);
    vi.stubGlobal("webkitAudioContext", undefined);
    const { result } = renderHook(() => useAudio());

    await expect(
      act(async () => {
        await result.current.start();
      }),
    ).resolves.toBeUndefined();

    expect(result.current.available).toBe(false);
    expect(result.current.enabled).toBe(false);
  });

  it("pauses active audio when the page becomes hidden", async () => {
    const audio = installAudioContext();
    const { result } = renderHook(() => useAudio());
    await act(async () => result.current.start());
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });

    document.dispatchEvent(new Event("visibilitychange"));

    expect(audio.suspend).toHaveBeenCalledOnce();
  });

  it("resumes user-enabled audio when the page becomes visible again", async () => {
    const audio = installAudioContext();
    const { result } = renderHook(() => useAudio());
    await act(async () => result.current.start());
    audio.resume.mockClear();

    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));

    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(audio.suspend).toHaveBeenCalledOnce();
    expect(audio.resume).toHaveBeenCalledOnce();
    expect(result.current.enabled).toBe(true);
  });

  it("does not resume audio after the user mutes it", async () => {
    const audio = installAudioContext();
    const { result } = renderHook(() => useAudio());
    await act(async () => result.current.start());
    act(() => result.current.mute());
    audio.resume.mockClear();

    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(audio.resume).not.toHaveBeenCalled();
    expect(result.current.enabled).toBe(false);
  });
});
