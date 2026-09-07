import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JourneySceneMedia } from "../src/components/JourneySceneMedia";

const props = {
  sceneOrder: 12, title: "El cofre del tesoro", couple: "Gladiola & Jordi",
  videoPath: "/journey-final/12-treasure.mp4", frozenFramePath: "/journey-final/12-treasure-final.png",
  firstFramePath: "/journey-final/12-treasure-first.png", previousFramePath: "/journey-final/11-rsvp-final.png",
  holdFrameAt: 25.866667, hasNarration: true, audioEnabled: true, paused: false,
  reducedMotion: false, motionEnabled: true, onMotionComplete: vi.fn(),
  onNarrationChange: vi.fn(), onSceneReady: vi.fn(), priority: false,
};
beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.clearAllMocks(); });

describe("cinematic scene playback", () => {
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
