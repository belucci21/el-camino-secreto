import { act, renderHook, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAudio } from "../src/hooks/useAudio";
import { useDeviceCapabilities } from "../src/hooks/useDeviceCapabilities";
import { useReducedMotion } from "../src/hooks/useReducedMotion";
import { useVisibilityPause } from "../src/hooks/useVisibilityPause";

const howlerMock = vi.hoisted(() => {
  const instances: Array<{
    options: { src: string[]; loop?: boolean; volume?: number };
    play: ReturnType<typeof vi.fn>;
    pause: ReturnType<typeof vi.fn>;
    playing: ReturnType<typeof vi.fn>;
    volume: ReturnType<typeof vi.fn>;
  }> = [];
  const Howler = { volume: vi.fn() };
  const Howl = vi.fn(function MockHowl(options) {
    let isPlaying = false;
    const instance = {
      options,
      play: vi.fn(() => {
        isPlaying = true;
        return 1;
      }),
      pause: vi.fn(() => {
        isPlaying = false;
      }),
      playing: vi.fn(() => isPlaying),
      volume: vi.fn(),
    };
    instances.push(instance);
    return instance;
  });

  return { instances, Howl, Howler };
});

vi.mock("howler", () => ({
  Howl: howlerMock.Howl,
  Howler: howlerMock.Howler,
}));

afterEach(() => {
  vi.unstubAllGlobals();
  howlerMock.instances.length = 0;
  howlerMock.Howl.mockClear();
  howlerMock.Howler.volume.mockClear();
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

  it("keeps the server and hydration tier deterministic across browser hints", () => {
    function TierProbe() {
      const tier = useDeviceCapabilities(false);
      return <div data-performance-tier={tier} />;
    }

    vi.stubGlobal("navigator", {
      deviceMemory: 8,
      hardwareConcurrency: 8,
      connection: { saveData: false },
    });
    const highMarkup = renderToString(<TierProbe />);

    vi.stubGlobal("navigator", {
      deviceMemory: 1,
      hardwareConcurrency: 1,
      connection: { saveData: true },
    });
    const lowMarkup = renderToString(<TierProbe />);

    expect(highMarkup).toContain('data-performance-tier="medium"');
    expect(lowMarkup).toBe(highMarkup);
  });

  it("selects a tier from browser capability signals after mounting", async () => {
    Object.defineProperty(navigator, "deviceMemory", {
      configurable: true,
      value: 8,
    });
    Object.defineProperty(navigator, "hardwareConcurrency", {
      configurable: true,
      value: 8,
    });

    const { result } = renderHook(() => useDeviceCapabilities(false));

    await waitFor(() => expect(result.current).toBe("high"));
  });

  it("uses a conservative tier when browser hints are unavailable", () => {
    vi.stubGlobal("navigator", undefined);

    const { result } = renderHook(() => useDeviceCapabilities(false));

    expect(result.current).toBe("medium");
  });

  it("updates the tier when reduced motion changes", async () => {
    Object.defineProperty(navigator, "deviceMemory", {
      configurable: true,
      value: 8,
    });
    Object.defineProperty(navigator, "hardwareConcurrency", {
      configurable: true,
      value: 8,
    });
    const { result, rerender } = renderHook(
      ({ reducedMotion }) => useDeviceCapabilities(reducedMotion),
      { initialProps: { reducedMotion: false } },
    );
    await waitFor(() => expect(result.current).toBe("high"));

    rerender({ reducedMotion: true });

    await waitFor(() => expect(result.current).toBe("low"));
  });
});

describe("useAudio", () => {
  it("starts audio only after the explicit start action", async () => {
    const { result } = renderHook(() => useAudio());
    expect(result.current.enabled).toBe(false);
    expect(howlerMock.Howl).not.toHaveBeenCalled();

    await act(async () => result.current.start());

    expect(result.current.enabled).toBe(true);
    expect(howlerMock.Howl).toHaveBeenCalledTimes(3);
    expect(howlerMock.instances[0].options.src).toEqual([
      "/audio/ambient-final.mp3",
      "/audio/ambient-loop.wav",
    ]);
    expect(howlerMock.instances[0].play).toHaveBeenCalledOnce();
  });

  it("supports clamped volume changes", async () => {
    const { result } = renderHook(() => useAudio());
    await act(async () => result.current.start());

    act(() => result.current.setVolume(0.4));

    expect(result.current.volume).toBe(0.4);
    expect(howlerMock.Howler.volume).toHaveBeenCalledWith(0.4);
    expect(howlerMock.instances[0].volume).toHaveBeenCalledWith(0.288);
    expect(howlerMock.instances[1].volume).toHaveBeenCalledWith(0.288);
    expect(howlerMock.instances[2].volume).toHaveBeenCalledWith(0.328);

    act(() => result.current.setVolume(2));
    expect(result.current.volume).toBe(1);
    expect(howlerMock.Howler.volume).toHaveBeenCalledWith(1);
  });

  it("fails silently when Howler cannot start", async () => {
    howlerMock.Howl.mockImplementationOnce(() => {
      throw new Error("audio unavailable");
    });
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
    const { result } = renderHook(() => useAudio());
    await act(async () => result.current.start());
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });

    document.dispatchEvent(new Event("visibilitychange"));

    expect(howlerMock.instances[0].pause).toHaveBeenCalledOnce();
  });

  it("resumes user-enabled audio when the page becomes visible again", async () => {
    const { result } = renderHook(() => useAudio());
    await act(async () => result.current.start());
    howlerMock.instances[0].play.mockClear();

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

    expect(howlerMock.instances[0].pause).toHaveBeenCalledOnce();
    expect(howlerMock.instances[0].play).toHaveBeenCalledOnce();
    expect(result.current.enabled).toBe(true);
  });

  it("does not resume audio after the user mutes it", async () => {
    const { result } = renderHook(() => useAudio());
    await act(async () => result.current.start());
    act(() => result.current.mute());
    howlerMock.instances[0].play.mockClear();

    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(howlerMock.instances[0].play).not.toHaveBeenCalled();
    expect(result.current.enabled).toBe(false);
  });

  it("plays cinematic cues only after audio is enabled", async () => {
    const { result } = renderHook(() => useAudio());

    act(() => result.current.playCue("unlock"));
    expect(howlerMock.instances).toHaveLength(0);

    await act(async () => result.current.start());
    act(() => result.current.playCue("unlock"));
    act(() => result.current.playCue("opening"));

    expect(howlerMock.instances[1].play).toHaveBeenCalledOnce();
    expect(howlerMock.instances[2].play).toHaveBeenCalledOnce();
  });
});
