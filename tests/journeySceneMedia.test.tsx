import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JourneySceneMedia } from "../src/components/JourneySceneMedia";
import { finalJourneyScenes } from "../src/config/finalJourney";

const props = {
  sceneOrder: 12, title: "Confirmación de asistencia", couple: "Gladiola & Jordi",
  videoPath: "/journey-final/12-rsvp.mp4", frozenFramePath: "/journey-final/12-rsvp-final.png",
  narrationPath: "/journey-final/12-rsvp-voice.m4a",
  firstFramePath: "/journey-final/12-rsvp-first.png",
  holdFrameAt: 25.866667, hasNarration: true, audioEnabled: true, paused: false,
  interactionReadyAt: 16.433333, narrationWindows: [[0.414, 18.005], [22.862, 40.472]] as [number, number][],
  reducedMotion: false, motionEnabled: true, onMotionComplete: vi.fn(),
  onNarrationChange: vi.fn(), onNarrationSync: vi.fn(), onPlaybackStart: vi.fn(), onSceneReady: vi.fn(), priority: false,
};
beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.clearAllMocks(); });

describe("cinematic scene playback", () => {
  it("does not pause or restart the film when the music button changes audio state", () => {
    const { rerender } = render(<JourneySceneMedia {...props} />);
    const video = screen.getByTestId("journey-motion-video") as HTMLVideoElement;
    video.currentTime = 8;
    fireEvent.playing(video);
    vi.mocked(HTMLMediaElement.prototype.pause).mockClear();
    vi.mocked(HTMLMediaElement.prototype.play).mockClear();
    rerender(<JourneySceneMedia {...props} audioEnabled={false} />);
    expect(HTMLMediaElement.prototype.pause).not.toHaveBeenCalled();
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    expect(screen.getByTestId("journey-motion-video")).toBe(video);
    expect(video.currentTime).toBe(8);
  });
  it("reveals a progressing Safari video even when its frame callback is delayed", () => {
    Object.defineProperty(HTMLVideoElement.prototype, "requestVideoFrameCallback", { configurable: true, value: vi.fn(() => 1) });
    Object.defineProperty(HTMLVideoElement.prototype, "cancelVideoFrameCallback", { configurable: true, value: vi.fn() });
    try {
      const { container, unmount } = render(<JourneySceneMedia {...props} />);
      const video = screen.getByTestId("journey-motion-video") as HTMLVideoElement;
      Object.defineProperty(video, "readyState", { value: 2 });
      fireEvent.playing(video);
      video.currentTime = 0.2;
      fireEvent.timeUpdate(video);
      expect(container.querySelector(".journey-scene-media")).toHaveAttribute("data-video-ready", "true");
      expect(props.onSceneReady).toHaveBeenCalledWith(12, false);
      unmount();
    } finally {
      Reflect.deleteProperty(HTMLVideoElement.prototype, "requestVideoFrameCallback");
      Reflect.deleteProperty(HTMLVideoElement.prototype, "cancelVideoFrameCallback");
    }
  });
  it("keeps immediate actions available even before the first video event", () => {
    const { container } = render(<JourneySceneMedia {...props} interactionReadyAt={0} />);
    expect(container.querySelector(".journey-scene-media")).toHaveAttribute("data-media-phase", "interactive");
  });
  it("asks the ambient soundtrack to recover when each new film starts", () => {
    render(<JourneySceneMedia {...props} />);

    fireEvent.playing(screen.getByTestId("journey-motion-video"));

    expect(props.onPlaybackStart).toHaveBeenCalledOnce();
  });
  it("waits for a presented frame before dissolving the outgoing image", () => {
    let present: VideoFrameRequestCallback | undefined;
    Object.defineProperty(HTMLVideoElement.prototype, "requestVideoFrameCallback", {
      configurable: true, value: (callback: VideoFrameRequestCallback) => { present = callback; return 1; },
    });
    Object.defineProperty(HTMLVideoElement.prototype, "cancelVideoFrameCallback", { configurable: true, value: vi.fn() });
    try {
      const { container, unmount } = render(<JourneySceneMedia {...props} />);
      fireEvent.playing(screen.getByTestId("journey-motion-video"));
      expect(container.querySelector(".journey-scene-media")).toHaveAttribute("data-video-ready", "false");
      expect(props.onSceneReady).not.toHaveBeenCalled();
      expect(present).toBeDefined();
      act(() => present!(0, { mediaTime: 0 } as VideoFrameCallbackMetadata));
      expect(props.onSceneReady).toHaveBeenCalledWith(12, false);
      expect(container.querySelector(".journey-scene-media")).toHaveAttribute("data-video-ready", "true");
      unmount();
    } finally {
      Reflect.deleteProperty(HTMLVideoElement.prototype, "requestVideoFrameCallback");
      Reflect.deleteProperty(HTMLVideoElement.prototype, "cancelVideoFrameCallback");
    }
  });
  it.each(finalJourneyScenes)("unlocks scene $order while its film still runs", (scene) => {
    const { container } = render(<JourneySceneMedia {...props} {...scene} />);
    const video = screen.getByTestId("journey-motion-video") as HTMLVideoElement;
    video.currentTime = scene.interactionReadyAt + 0.01;
    fireEvent.timeUpdate(video);
    expect(container.querySelector(".journey-scene-media")).toHaveAttribute("data-media-phase", "interactive");
    expect(video).toBeInTheDocument();
    expect(container.querySelector(".journey-scene-media")).toHaveAttribute("data-visual-phase", "motion");
  });
  it("reveals controls without replacing a moving frame with the final still", () => {
    const { container } = render(<JourneySceneMedia {...props} />);
    const video = screen.getByTestId("journey-motion-video") as HTMLVideoElement;
    video.currentTime = 16.5;
    fireEvent.timeUpdate(video);
    expect(container.querySelector(".journey-scene-media")).toHaveAttribute("data-media-phase", "interactive");
    expect(video).toBeInTheDocument();
    expect(container.querySelector(".journey-scene-media")).toHaveAttribute("data-visual-phase", "motion");
    expect(props.onMotionComplete).not.toHaveBeenCalled();
  });
  it("restores the music during the long pause between narration sections", () => {
    render(<JourneySceneMedia {...props} />);
    const video = screen.getByTestId("journey-motion-video") as HTMLVideoElement;
    video.currentTime = 12;
    fireEvent.playing(video);
    fireEvent.timeUpdate(video);
    expect(props.onNarrationChange).toHaveBeenLastCalledWith(true);
    video.currentTime = 20;
    fireEvent.timeUpdate(video);
    expect(props.onNarrationChange).toHaveBeenLastCalledWith(false);
    video.currentTime = 24;
    fireEvent.timeUpdate(video);
    expect(props.onNarrationChange).toHaveBeenLastCalledWith(true);
  });
  it("keeps native media muted and sends synchronized voice timing to the shared mixer", () => {
    render(<JourneySceneMedia {...props} />);
    const video = screen.getByTestId("journey-motion-video") as HTMLVideoElement;
    video.currentTime = 3.25;

    expect(video).toHaveProperty("muted", true);
    fireEvent.playing(video);
    expect(props.onNarrationSync).toHaveBeenLastCalledWith(props.narrationPath, 3.25, true);
    fireEvent.pause(video);
    expect(props.onNarrationSync).toHaveBeenLastCalledWith(props.narrationPath, 3.25, false);
  });
  it("holds the first frame until the film actually plays", () => {
    const { container } = render(<JourneySceneMedia {...props} />);
    const media = container.querySelector(".journey-scene-media");
    expect(container.querySelector(".journey-scene-image")).toHaveAttribute("src", props.firstFramePath);
    expect(media).toHaveAttribute("data-video-ready", "false");
    fireEvent.loadedData(screen.getByTestId("journey-motion-video"));
    expect(media).toHaveAttribute("data-video-ready", "false");
    fireEvent.playing(screen.getByTestId("journey-motion-video"));
    expect(media).toHaveAttribute("data-video-ready", "true");
    expect(container.querySelector(".journey-scene-image")).toHaveAttribute("src", props.firstFramePath);
    fireEvent.ended(screen.getByTestId("journey-motion-video"));
    expect(container.querySelector(".journey-scene-image")).toHaveAttribute("src", props.frozenFramePath);
  });
  it("covers the source's black tail without cutting off its voice", () => {
    const { container } = render(<JourneySceneMedia {...props} />);
    const video = screen.getByTestId("journey-motion-video") as HTMLVideoElement;
    video.currentTime = 26;
    fireEvent.timeUpdate(video);
    expect(container.querySelector(".journey-scene-media")).toHaveAttribute("data-hold-frame", "true");
    expect(props.onMotionComplete).not.toHaveBeenCalled();
    expect(video).toBeInTheDocument();
    fireEvent.ended(video);
    expect(props.onMotionComplete).toHaveBeenCalledWith(12);
  });
  it("keeps narration in reduced motion but never replays a visited chapter", () => {
    const { rerender, container } = render(<JourneySceneMedia {...props} reducedMotion />);
    expect(screen.queryByTestId("journey-motion-video")).not.toBeInTheDocument();
    expect(container.querySelector("audio")).toHaveAttribute("src", props.narrationPath);
    rerender(<JourneySceneMedia {...props} reducedMotion motionEnabled={false} />);
    expect(container.querySelector("audio")).not.toBeInTheDocument();
  });
  it("pauses narration with a dialog and resumes at the same playhead", () => {
    const { rerender } = render(<JourneySceneMedia {...props} />);
    const video = screen.getByTestId("journey-motion-video") as HTMLVideoElement;
    video.currentTime = 8;
    vi.mocked(HTMLMediaElement.prototype.pause).mockClear();
    rerender(<JourneySceneMedia {...props} paused />);
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    expect(video.currentTime).toBe(8);
    rerender(<JourneySceneMedia {...props} />);
    expect(video.currentTime).toBe(8);
  });
  it("does not flash a black tail on browsers without frame callbacks", () => {
    const { container } = render(<JourneySceneMedia {...props} />);
    const video = screen.getByTestId("journey-motion-video") as HTMLVideoElement;
    video.currentTime = 25.7;
    fireEvent.timeUpdate(video);
    expect(container.querySelector(".journey-scene-media")).toHaveAttribute("data-hold-frame", "true");
  });
  it("provides a gesture-based recovery when a browser blocks playback", async () => {
    vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValueOnce(new DOMException("Blocked", "NotAllowedError"));
    render(<JourneySceneMedia {...props} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Reanudar escena" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Reanudar escena" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Reanudar escena" })).not.toBeInTheDocument());
  });
});
