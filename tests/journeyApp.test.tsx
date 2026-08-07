import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JourneyApp } from "../src/components/JourneyApp";

vi.mock("gsap", () => ({
  default: {
    context: (callback: () => void) => {
      callback();
      return { revert: vi.fn() };
    },
    set: vi.fn(),
    fromTo: vi.fn(),
    to: vi.fn(),
    timeline: vi.fn(() => {
      const timeline = {
        fromTo: vi.fn(() => timeline),
        kill: vi.fn(),
      };
      return timeline;
    }),
  },
}));

vi.mock("howler", () => ({
  Howl: vi.fn(() => ({
    play: vi.fn(),
    pause: vi.fn(),
    playing: vi.fn(() => false),
    volume: vi.fn(),
  })),
  Howler: { volume: vi.fn() },
}));

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("JourneyApp", () => {
  it("uses the numbered motion asset while preserving the approved image as its copy layer", () => {
    render(<JourneyApp initialStep={4} />);

    const video = screen.getByTestId("journey-motion-video");
    const source = video.querySelector("source");
    const sceneImage = screen.getByRole("img", { name: /LA PUERTA SECRETA/i });

    expect(video).toHaveAttribute("autoplay");
    expect(video).toHaveProperty("muted", true);
    expect(video).toHaveAttribute("playsinline");
    expect(source).toHaveAttribute("src", "/journey-video/4.mp4");
    expect(sceneImage).toHaveAttribute("src", "/journey-hd/4.webp");
  });

  it("plays the opening once and keeps the final chapters on their motion assets", () => {
    const { unmount } = render(<JourneyApp initialStep={5} />);

    expect(screen.getByTestId("journey-motion-video")).not.toHaveAttribute("loop");

    unmount();
    render(<JourneyApp initialStep={8} />);
    expect(screen.getByTestId("journey-motion-video")).toBeInTheDocument();
    expect(screen.getByTestId("journey-motion-video").querySelector("source"))
      .toHaveAttribute("src", "/journey-video/8.mp4");
  });

  it("removes moving video when the visitor requests reduced motion", async () => {
    const user = userEvent.setup();
    render(<JourneyApp initialStep={3} />);

    expect(screen.getByTestId("journey-motion-video")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reducir movimiento" }));
    expect(screen.queryByTestId("journey-motion-video")).not.toBeInTheDocument();
  });

  it("keeps the active scene eager and provides a 2x source for high-density screens", () => {
    render(<JourneyApp initialStep={5} />);

    const sceneImage = screen.getByRole("img", {
      name: /LA RESPUESTA CORRECTA/i,
    });

    expect(sceneImage).toHaveAttribute("loading", "eager");
    expect(sceneImage).toHaveAttribute("src", "/journey-hd/5.webp");
    expect(sceneImage).toHaveAttribute("srcset", "/journey-hd/5.webp 2x");
  });

  it("starts the approved journey from the home cover", async () => {
    const user = userEvent.setup();
    render(<JourneyApp initialStep={2} />);

    expect(
      screen.getByRole("region", { name: /Paso 2 de 11/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "COMENZAR EL CAMINO" }));
    expect(
      screen.getByRole("region", { name: /Paso 3 de 11/i }),
    ).toBeInTheDocument();
  });

  it("keeps the secret door in the 1–11 flow and accepts amigo", async () => {
    const user = userEvent.setup();
    render(<JourneyApp initialStep={4} />);

    await user.click(screen.getByRole("button", { name: "DESCIFRAR LA PALABRA" }));
    await user.type(screen.getByLabelText("Di la palabra y entra"), "amigo");
    await user.click(screen.getByRole("button", { name: /Abrir la puerta/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("region", { name: /Paso 5 de 11/i }),
      ).toBeInTheDocument();
    });
  });

  it("renders every referenced surface on the information scene as a semantic button", () => {
    render(<JourneyApp initialStep={10} />);

    const expectedButtons = [
      "Activar música",
      "CAPÍTULOS",
      "CEREMONIA",
      "CELEBRACIÓN",
      "DRESS CODE",
      "CÓMO LLEGAR",
      "VER UBICACIÓN",
      "CONFIRMAR MI ASISTENCIA",
      "PISTA: ESCUCHA, OBSERVA Y RECUERDA",
    ];

    expectedButtons.forEach((name) => {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    });
  });

  it("reveals the confirmed ceremony details from the reference artwork", async () => {
    const user = userEvent.setup();
    render(<JourneyApp initialStep={10} />);

    await user.click(screen.getByRole("button", { name: "CEREMONIA" }));

    const dialog = screen.getByRole("dialog", { name: "Ceremonia" });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent(/Sábado 29 de mayo de 2027/i);
    expect(dialog).toHaveTextContent(/Iglesia de San Martín de Tours/i);
    expect(dialog).toHaveTextContent(/C\/ Mayor, 1 · 28013 Madrid/i);
  });

  it("opens chapter navigation without leaving the home journey", async () => {
    const user = userEvent.setup();
    render(<JourneyApp initialStep={3} />);

    await user.click(screen.getByRole("button", { name: "CAPÍTULOS" }));
    expect(screen.getByRole("dialog", { name: "Capítulos" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /11.*EL COFRE DEL TESORO/i }));
    expect(
      screen.getByRole("region", { name: /Paso 11 de 11/i }),
    ).toBeInTheDocument();
  });
});
