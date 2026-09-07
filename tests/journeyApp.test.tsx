import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
  Howl: vi.fn(function MockHowl() {
    return {
      play: vi.fn(),
      pause: vi.fn(),
      playing: vi.fn(() => false),
      volume: vi.fn(),
      fade: vi.fn(),
      unload: vi.fn(),
    };
  }),
  Howler: { volume: vi.fn() },
}));

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("JourneyApp", () => {
  it("does not offer entry buttons before their client handlers are ready", () => {
    const document = new DOMParser().parseFromString(renderToString(<JourneyApp />), "text/html");
    document.querySelectorAll(".journey-entry-gate button").forEach((button) => {
      expect(button.hasAttribute("disabled")).toBe(true);
    });
  });
  it("continues from RSVP through the treasure to the final chapter", async () => {
    const user = userEvent.setup();
    render(<JourneyApp initialStep={11} />);
    fireEvent.ended(screen.getByTestId("journey-motion-video"));
    await user.click(screen.getByRole("button", { name: "INSCRIBIR MI RESPUESTA" }));
    await user.type(screen.getByLabelText("Nombre"), "Invitado de prueba");
    await user.click(screen.getByLabelText(/Sí, caminaré/));
    await user.click(screen.getByRole("button", { name: "Inscribir mi respuesta" }));
    expect(JSON.parse(localStorage.getItem("gj-rsvp-draft")!)).toEqual({ name: "Invitado de prueba", attendance: "yes" });
    await user.click(screen.getByRole("button", { name: "Continuar al cofre" }));
    expect(screen.getByRole("region", { name: /Paso 12 de 13/ })).toBeInTheDocument();
    fireEvent.ended(screen.getByTestId("journey-motion-video"));
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    expect(screen.getByRole("region", { name: /Paso 13 de 13/ })).toBeInTheDocument();
  });
  it("waits for a mobile-safe gesture and starts the journey with music", async () => {
    const user = userEvent.setup();
    render(<JourneyApp />);

    expect(screen.getByRole("dialog", { name: "Comenzar la experiencia" })).toBeInTheDocument();
    expect(screen.queryByTestId("journey-motion-video")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Entrar con m.sica/i }));

    expect(screen.queryByRole("dialog", { name: "Comenzar la experiencia" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Desactivar m.sica/i })).toBeInTheDocument();
    expect(screen.getByTestId("journey-motion-video")).toHaveProperty("muted", false);
  });

  it("uses the definitive film and its exact frozen frame for the secret door", () => {
    render(<JourneyApp initialStep={4} />);

    const video = screen.getByTestId("journey-motion-video");
    const media = video.closest(".journey-scene-media");
    const source = video.querySelector("source");
    const sceneImage = screen.getByRole("img", { name: /La puerta secreta/i });

    expect(video).toHaveAttribute("autoplay");
    expect(video).toHaveProperty("muted", true);
    expect(video).toHaveAttribute("playsinline");
    expect(video).not.toHaveAttribute("poster");
    expect(source).toHaveAttribute("src", "/journey-final/04-secret-door.mp4");
    expect(sceneImage).toHaveAttribute("src", "/journey-final/04-secret-door-final.png");
    expect(media).toHaveAttribute("data-media-phase", "motion");

    fireEvent.ended(video);

    expect(media).toHaveAttribute("data-media-phase", "interactive");
    expect(screen.queryByTestId("journey-motion-video")).not.toBeInTheDocument();
  });

  it("does not offer a control that bypasses a scene film before it ends", () => {
    render(<JourneyApp initialStep={4} />);

    fireEvent.canPlay(screen.getByTestId("journey-motion-video"));

    expect(screen.queryByRole("button", { name: "Mostrar pantalla interactiva" })).not.toBeInTheDocument();
  });

  it("does not replay a chapter film after it has already resolved to its image", () => {
    const { rerender } = render(<JourneyApp initialStep={4} />);
    fireEvent.ended(screen.getByTestId("journey-motion-video"));

    rerender(<JourneyApp initialStep={4} />);

    expect(screen.queryByTestId("journey-motion-video")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: /LA PUERTA SECRETA/i })).toBeInTheDocument();
  });

  it("plays the opening once and keeps the definitive chapter films in order", () => {
    const { unmount } = render(<JourneyApp initialStep={5} />);

    expect(screen.getByTestId("journey-motion-video")).not.toHaveAttribute("loop");

    unmount();
    render(<JourneyApp initialStep={10} />);
    expect(screen.getByTestId("journey-motion-video")).toBeInTheDocument();
    expect(screen.getByTestId("journey-motion-video").querySelector("source"))
      .toHaveAttribute("src", "/journey-final/10-dress-code.mp4");
  });

  it("removes moving video when the visitor requests reduced motion", async () => {
    const user = userEvent.setup();
    render(<JourneyApp initialStep={3} />);

    expect(screen.getByTestId("journey-motion-video")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reducir movimiento" }));
    expect(screen.queryByTestId("journey-motion-video")).not.toBeInTheDocument();
  });

  it("keeps the final frozen frame eager and preserves its original file", () => {
    render(<JourneyApp initialStep={5} />);

    const sceneImage = screen.getByRole("img", {
      name: /La respuesta correcta/i,
    });

    expect(sceneImage).toHaveAttribute("loading", "eager");
    expect(sceneImage).toHaveAttribute("src", "/journey-final/05-open-door-final.png");
    expect(sceneImage).not.toHaveAttribute("srcset");
  });

  it("starts the approved journey from the home cover", async () => {
    const user = userEvent.setup();
    render(<JourneyApp initialStep={2} />);

    expect(
      screen.getByRole("region", { name: /Paso 2 de 13/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "COMENZAR EL CAMINO" }));
    expect(
      screen.getByRole("region", { name: /Paso 3 de 13/i }),
    ).toBeInTheDocument();
  });

  it("renders the current scene action as a visible in-frame control", () => {
    render(<JourneyApp initialStep={1} />);

    expect(screen.getByRole("button", { name: "COMENZAR EL CAMINO" }))
      .toHaveClass("journey-primary-action");
  });

  it("keeps the secret door in the 1–13 flow and accepts amigo", async () => {
    const user = userEvent.setup();
    render(<JourneyApp initialStep={4} />);

    await user.click(screen.getByRole("button", { name: "DESCIFRAR LA PALABRA" }));
    await user.type(screen.getByLabelText("Di la palabra y entra"), "amigo");
    await user.click(screen.getByRole("button", { name: /Abrir la puerta/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("region", { name: /Paso 5 de 13/i }),
      ).toBeInTheDocument();
    });
  });

  it("renders the dress-code and RSVP scenes as semantic controls", () => {
    const { unmount } = render(<JourneyApp initialStep={10} />);

    const expectedButtons = [
      "Activar música",
      "CAPÍTULOS",
      "CÓDIGO DE VESTIMENTA",
      "Continuar",
    ];

    expectedButtons.forEach((name) => {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    });

    unmount();
    render(<JourneyApp initialStep={11} />);
    expect(screen.getByRole("button", { name: "INSCRIBIR MI RESPUESTA" })).toBeInTheDocument();
  });

  it("reveals the defined dress code from the final reference artwork", async () => {
    const user = userEvent.setup();
    render(<JourneyApp initialStep={10} />);

    await user.click(screen.getByRole("button", { name: "CÓDIGO DE VESTIMENTA" }));

    const dialog = screen.getByRole("dialog", { name: "Código de vestimenta" });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent(/Formal elegante/i);
  });

  it("opens chapter navigation without leaving the home journey", async () => {
    const user = userEvent.setup();
    render(<JourneyApp initialStep={3} />);

    await user.click(screen.getByRole("button", { name: "CAPÍTULOS" }));
    expect(screen.getByRole("dialog", { name: "Capítulos" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /11.*CONFIRMA TU ASISTENCIA/i }));
    expect(
      screen.getByRole("region", { name: /Paso 11 de 13/i }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("journey-motion-video")).not.toBeInTheDocument();
  });

  it("keeps scene two on screen when the visitor scrolls or swipes", () => {
    const { container } = render(<JourneyApp initialStep={2} />);
    const stage = container.querySelector(".journey-shell");

    fireEvent.wheel(stage!, { deltaY: 96 });
    fireEvent.pointerDown(stage!, { clientX: 240, clientY: 650 });
    fireEvent.pointerUp(stage!, { clientX: 240, clientY: 520 });

    expect(screen.getByRole("region", { name: /Paso 2 de 13/i })).toBeInTheDocument();
  });

  it("uses the supplied scene-eleven RSVP background and attendance artwork", async () => {
    const user = userEvent.setup();
    render(<JourneyApp initialStep={11} />);

    await user.click(screen.getByRole("button", { name: "INSCRIBIR MI RESPUESTA" }));

    expect(screen.getByTestId("journey-rsvp-background").querySelector("source")).toHaveAttribute(
      "src",
      "/journey-final/11-rsvp-background.mp4",
    );
    expect(screen.getByRole("img", { name: "Arte de asistencia" })).toHaveAttribute(
      "src",
      "/journey-final/11-rsvp-panel.png",
    );
  });

  it("keeps RSVP artwork available without its looping background in reduced-motion mode", async () => {
    const user = userEvent.setup();
    render(<JourneyApp initialStep={11} />);

    await user.click(screen.getByRole("button", { name: "Reducir movimiento" }));
    await user.click(screen.getByRole("button", { name: "INSCRIBIR MI RESPUESTA" }));

    expect(screen.queryByTestId("journey-rsvp-background")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Arte de asistencia" })).toBeInTheDocument();
  });
});
