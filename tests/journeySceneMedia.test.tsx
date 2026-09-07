import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JourneySceneMedia } from "../src/components/JourneySceneMedia";
import { finalJourneyScenes } from "../src/config/finalJourney";

const props = {
  sceneOrder: 12, title: "El cofre del tesoro", couple: "Gladiola & Jordi",
  videoPath: "/journey-final/12-treasure.mp4", frozenFramePath: "/journey-final/12-treasure-final.png",
  firstFramePath: "/journey-final/12-treasure-first.png", previousFramePath: "/journey-final/11-rsvp-final.png",
  holdFrameAt: 25.866667, hasNarration: true, audioEnabled: true, paused: false,
  interactionReadyAt: 16.433333, narrationWindows: [[0.414, 18.005], [22.862, 40.472]] as [number, number][],
  reducedMotion: false, motionEnabled: true, onMotionComplete: vi.fn(),
  onNarrationChange: vi.fn(), onSceneReady: vi.fn(), priority: false,
};
beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.clearAllMocks(); });

describe("cinematic scene playback", () => {
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
      expect(present).toBeDefined();
      unmount();
    } finally {
      Reflect.deleteProperty(HTMLVideoElement.prototype, "requestVideoFrameCallback");
      Reflect.deleteProperty(HTMLVideoElement.prototype, "cancelVideoFrameCallback");
    }
  });
  it.each(finalJourneyScenes)("unlocks scene $order at its measured visual endpoint, not at file end", (scene) => {
    const { container } = render(<JourneySceneMedia {...props} {...scene} />);
    const video = screen.getByTestId("journey-motion-video") as HTMLVideoElement;
    video.currentTime = scene.interactionReadyAt - 0.1;
    fireEvent.timeUpdate(video);
    expect(container.querySelector(".journey-scene-media")).toHaveAttribute("data-media-phase", "motion");
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
  it("lets the original synchronized soundtrack follow the user's sound choice", () => {
    const { rerender } = render(<JourneySceneMedia {...props} />);
    const video = screen.getByTestId("journey-motion-video");
    expect(video).toHaveProperty("muted", false);
    rerender(<JourneySceneMedia {...props} audioEnabled={false} />);
    expect(video).toHaveProperty("muted", true);
  });
  it("holds the outgoing frame until the next film actually plays", () => {
    const { container } = render(<JourneySceneMedia {...props} />);
    const media = container.querySelector(".journey-scene-media");
    expect(container.querySelector(".journey-scene-transition")).toHaveAttribute("src", props.previousFramePath);
    expect(media).toHaveAttribute("data-video-ready", "false");
    fireEvent.loadedData(screen.getByTestId("journey-motion-video"));
    expect(media).toHaveAttribute("data-video-ready", "false");
    fireEvent.playing(screen.getByTestId("journey-motion-video"));
    expect(media).toHaveAttribute("data-video-ready", "true");
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
    expect(container.querySelector("audio")).toHaveAttribute("src", props.videoPath);
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
