import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JourneyApp } from "../src/components/JourneyApp";
import { submitJourneyResponse } from "../src/utils/submitJourneyResponse";

vi.mock("../src/utils/submitJourneyResponse", () => ({ submitJourneyResponse: vi.fn() }));

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
      stop: vi.fn(),
      playing: vi.fn(() => false),
      seek: vi.fn(() => 0),
      state: vi.fn(() => "loaded"),
      volume: vi.fn(),
      fade: vi.fn(),
      unload: vi.fn(),
    };
  }),
  Howler: { volume: vi.fn() },
}));

beforeEach(() => {
  vi.mocked(submitJourneyResponse).mockReset().mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe("JourneyApp", () => {
  it("retains failed RSVP data and only confirms after a successful retry", async () => {
    vi.mocked(submitJourneyResponse).mockRejectedValueOnce(new Error("offline"));
    const user = userEvent.setup();
    render(<JourneyApp initialStep={11} />);
    await user.click(screen.getByRole("button", { name: "CONFIRMAR MI ASISTENCIA", exact: true }));
    await user.type(screen.getByLabelText("Nombre completo"), "Invitado prueba");
    await user.click(screen.getByLabelText(/Sí, no me lo pierdo/));
    await user.click(screen.getByRole("button", { name: "Confirmar mi asistencia", exact: true }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No se ha podido enviar");
    expect(screen.getByLabelText("Nombre completo")).toHaveValue("Invitado prueba");
    expect(screen.queryByText(/Tu respuesta se ha enviado/)).not.toBeInTheDocument();
    const firstId = vi.mocked(submitJourneyResponse).mock.calls[0][0].id;
    await user.click(screen.getByRole("button", { name: "Confirmar mi asistencia", exact: true }));
    expect(await screen.findByText(/Tu respuesta se ha enviado/)).toBeInTheDocument();
    expect(vi.mocked(submitJourneyResponse).mock.calls[1][0].id).toBe(firstId);
  });
  it("keeps the song form on delivery failure instead of showing thanks", async () => {
    vi.mocked(submitJourneyResponse).mockRejectedValueOnce(new Error("offline"));
    const user = userEvent.setup();
    render(<JourneyApp initialStep={13} />);
    await user.click(screen.getByRole("button", { name: "MÚSICA Y ALEGRÍA" }));
    await user.click(screen.getByRole("button", { name: "Continuar para sugerir una canción" }));
    await user.type(screen.getByLabelText("¿Qué canción no puede faltar?"), "Canción de prueba");
    await user.click(screen.getByRole("button", { name: "Enviar mi canción" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Tu canción sigue aquí");
    expect(screen.queryByRole("dialog", { name: "Canción enviada" })).not.toBeInTheDocument();
  });
  it("does not offer entry buttons before their client handlers are ready", () => {
    const document = new DOMParser().parseFromString(renderToString(<JourneyApp />), "text/html");
    document.querySelectorAll(".journey-entry-gate button").forEach((button) => {
      expect(button.hasAttribute("disabled")).toBe(true);
    });
  });
  it("continues from RSVP through the gratitude and final details", async () => {
    const user = userEvent.setup();
    render(<JourneyApp initialStep={11} />);
    fireEvent.ended(screen.getByTestId("journey-motion-video"));
    await user.click(screen.getByRole("button", { name: "CONFIRMAR MI ASISTENCIA" }));
    await user.type(screen.getByLabelText("Nombre completo"), "Invitado de prueba");
    await user.click(screen.getByLabelText(/Sí, no me lo pierdo/));
    await user.click(screen.getByRole("button", { name: "Confirmar mi asistencia", exact: true }));
    expect(submitJourneyResponse).toHaveBeenCalledWith(expect.objectContaining({ kind: "rsvp", name: "Invitado de prueba", attendance: "yes" }));
    expect(screen.getByText(/Tu respuesta se ha enviado/)).toBeInTheDocument();
    expect(screen.queryByText("Enviar por WhatsApp")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continuar el camino" }));
    expect(screen.getByRole("region", { name: /Paso 12 de 15/ })).toBeInTheDocument();
    fireEvent.ended(screen.getByTestId("journey-motion-video"));
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    expect(screen.getByRole("region", { name: /Paso 13 de 15/ })).toBeInTheDocument();
  });
  it("waits for a mobile-safe gesture and starts the journey with music", async () => {
    const user = userEvent.setup();
    render(<JourneyApp />);

    expect(screen.getByRole("dialog", { name: "Comenzar la experiencia" })).toBeInTheDocument();
    expect(screen.queryByTestId("journey-motion-video")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Entrar con m.sica/i }));

    expect(screen.queryByRole("dialog", { name: "Comenzar la experiencia" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Desactivar m.sica/i })).toBeInTheDocument();
    expect(screen.getByTestId("journey-motion-video")).toHaveProperty("muted", true);
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
    expect(sceneImage).toHaveAttribute("src", "/journey-final/04-secret-door-first.png");
    expect(media).toHaveAttribute("data-media-phase", "interactive");

    fireEvent.ended(video);

    expect(media).toHaveAttribute("data-media-phase", "interactive");
    expect(sceneImage).toHaveAttribute("src", "/journey-final/04-secret-door-final.png");
    expect(screen.queryByTestId("journey-motion-video")).not.toBeInTheDocument();
  });

  it("lets the visitor use a visible scene action while its film is still moving", async () => {
    const user = userEvent.setup();
    const { container } = render(<JourneyApp initialStep={4} />);
    const video = screen.getByTestId("journey-motion-video") as HTMLVideoElement;
    const media = container.querySelector(".journey-scene-media");

    video.currentTime = 0.11;
    fireEvent.timeUpdate(video);

    expect(media).toHaveAttribute("data-media-phase", "interactive");
    expect(media).toHaveAttribute("data-visual-phase", "motion");
    expect(video).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "DESCIFRAR LA PALABRA" }));

    expect(screen.getByRole("dialog", { name: "La palabra del umbral" })).toBeInTheDocument();
    expect(screen.getByTestId("journey-motion-video")).toBeInTheDocument();
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
    render(<JourneyApp initialStep={9} />);
    expect(screen.getByTestId("journey-motion-video")).toBeInTheDocument();
    expect(screen.getByTestId("journey-motion-video").querySelector("source"))
      .toHaveAttribute("src", "/journey-final/10-treasure.mp4");
  });

  it("removes moving video when the visitor requests reduced motion", async () => {
    const user = userEvent.setup();
    render(<JourneyApp initialStep={3} />);

    expect(screen.getByTestId("journey-motion-video")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reducir movimiento" }));
    expect(screen.queryByTestId("journey-motion-video")).not.toBeInTheDocument();
  });

  it("keeps the unified scene's first frame eager and switches to its exact final frame", () => {
    render(<JourneyApp initialStep={5} />);

    const sceneImage = screen.getByRole("img", {
      name: /La puerta a lo eterno/i,
    });

    expect(sceneImage).toHaveAttribute("loading", "eager");
    expect(sceneImage).toHaveAttribute("src", "/journey-final/05-06-unified-first.png");
    expect(sceneImage).not.toHaveAttribute("srcset");
    expect(screen.getByRole("button", { name: "Continuar" })).toHaveAttribute("data-shimmer", "false");
    fireEvent.ended(screen.getByTestId("journey-motion-video"));
    expect(sceneImage).toHaveAttribute("src", "/journey-final/05-06-unified-final.png");
    expect(screen.getByRole("button", { name: "Continuar" })).toHaveAttribute("data-shimmer", "true");
  });

  it("starts the approved journey from the home cover", async () => {
    const user = userEvent.setup();
    render(<JourneyApp initialStep={2} />);

    expect(
      screen.getByRole("region", { name: /Paso 2 de 15/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "COMENZAR EL CAMINO" }));
    expect(
      screen.getByRole("region", { name: /Paso 3 de 15/i }),
    ).toBeInTheDocument();
  });

  it("renders the current scene action as a visible in-frame control", () => {
    render(<JourneyApp initialStep={1} />);

    expect(screen.getByRole("button", { name: "COMENZAR EL CAMINO" }))
      .toHaveClass("journey-primary-action");
  });

  it("keeps utility controls visibly discoverable on hover without restoring a filled overlay", () => {
    const styles = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");

    expect(styles).toMatch(/\.journey-hotspot\[data-control="true"\]:hover\s*\{[^}]*background:\s*transparent/s);
    expect(styles).toMatch(/\.journey-hotspot\[data-control="true"\]:hover\s*\{[^}]*box-shadow:\s*none/s);
  });

  it("keeps the scene three and four primary actions accessible inside their approved hotspots", () => {
    const { unmount } = render(<JourneyApp initialStep={3} />);

    const sceneThreeAction = screen.getByRole("button", { name: "Continuar" });
    expect(sceneThreeAction).not.toHaveClass("journey-primary-action--visible");
    expect(sceneThreeAction.querySelector(".sr-only")).toHaveTextContent("Continuar");
    for (const name of ["Activar música", "CAPÍTULOS"]) {
      expect(screen.getByRole("button", { name })).not.toHaveClass("journey-hotspot--rendered");
    }
    expect(sceneThreeAction).toHaveStyle({
      "--hotspot-x": "12%",
      "--hotspot-y": "87%",
      "--hotspot-width": "76%",
      "--hotspot-height": "10%",
    });

    unmount();
    render(<JourneyApp initialStep={4} />);

    const sceneFourAction = screen.getByRole("button", { name: "DESCIFRAR LA PALABRA" });
    expect(sceneFourAction.querySelector(".sr-only")?.textContent).toBe("DESCIFRAR LA PALABRA");
    expect(sceneFourAction).toHaveStyle({
      "--hotspot-x": "20%",
      "--hotspot-y": "79%",
      "--hotspot-width": "60%",
      "--hotspot-height": "7%",
    });

    const riddle = screen.getByRole("button", { name: "¿ESTÁS PERDIDO?" });
    expect(riddle).not.toHaveAttribute("data-display-label");
    expect(riddle.querySelector(".journey-hotspot-label")).toBeNull();
  });

  it("decodes the incoming poster before replacing the scene without a video readback", async () => {
    let decode: (() => void) | undefined;
    const NativeImage = window.Image;
    vi.stubGlobal("Image", class extends NativeImage {
      constructor() {
        super();
        this.decode = () => new Promise<void>(resolve => { decode = resolve; });
      }
    });
    const readback = vi.spyOn(HTMLCanvasElement.prototype, "getContext");
    const user = userEvent.setup();
    const { container } = render(<JourneyApp initialStep={2} />);
    const outgoing = screen.getByTestId("journey-motion-video");
    Object.defineProperties(outgoing, {
      readyState: { value: 2 }, videoWidth: { value: 720 }, videoHeight: { value: 1280 },
    });
    fireEvent.playing(outgoing);
    await user.click(screen.getByRole("button", { name: "COMENZAR EL CAMINO" }));
    expect(screen.getByRole("region", { name: /Paso 2 de 15/ })).toBeInTheDocument();
    await act(async () => { decode!(); });
    expect(screen.getByRole("region", { name: /Paso 3 de 15/ })).toBeInTheDocument();
    expect(readback).not.toHaveBeenCalled();
    expect(container.querySelectorAll("video")).toHaveLength(1);
    expect(container.querySelector(".journey-navigation-frame")).toBeNull();
  });

  it("keeps the music label state-neutral and reveals the clue from the lost button", async () => {
    const user = userEvent.setup();
    render(<JourneyApp initialStep={4} />);

    const music = screen.getByRole("button", { name: "Activar música" });
    expect(music).toHaveAttribute("data-surface", "music_toggle");
    expect(music.querySelector(".journey-audio-off-mask")).toBeNull();
    expect(music.querySelector(".journey-audio-label")).toBeNull();
    expect(music.querySelector(".journey-audio-status")).toBeNull();

    await user.click(music);
    const activeMusic = await screen.findByRole("button", { name: "Desactivar música" });
    expect(activeMusic.querySelector(".journey-audio-off-mask")).toBeNull();
    expect(activeMusic.querySelector(".journey-audio-status")).toBeNull();

    await user.click(screen.getByRole("button", { name: "¿ESTÁS PERDIDO?" }));

    const dialog = screen.getByRole("dialog", { name: "Pista del camino" });
    expect(dialog).toHaveTextContent("Di la palabra amigo.");
  });

  it("keeps the secret door before the unified scene and accepts amigo", async () => {
    const user = userEvent.setup();
    render(<JourneyApp initialStep={4} />);

    await user.click(screen.getByRole("button", { name: "DESCIFRAR LA PALABRA" }));
    await user.type(screen.getByLabelText("Di la palabra y entra"), "amigo");
    await user.click(screen.getByRole("button", { name: /Abrir la puerta/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("region", { name: /Paso 5 de 15/i }),
      ).toBeInTheDocument();
    });
  });

  it("connects amigo directly to the unified clip and uses one Continue into two souls", async () => {
    const user = userEvent.setup();
    render(<JourneyApp initialStep={4} />);

    await user.click(screen.getByRole("button", { name: "DESCIFRAR LA PALABRA" }));
    await user.type(screen.getByLabelText("Di la palabra y entra"), "amigo");
    await user.click(screen.getByRole("button", { name: /Abrir la puerta/i }));

    await waitFor(() => expect(screen.getByRole("region", { name: /Paso 5 de 15/i })).toBeInTheDocument());
    const unifiedVideo = screen.getByTestId("journey-motion-video");
    expect(unifiedVideo.querySelector("source")).toHaveAttribute("src", "/journey-final/05-06-unified-web.mp4");
    expect(screen.getByRole("img", { name: /La puerta a lo eterno/i })).toHaveAttribute("src", "/journey-final/05-06-unified-first.png");

    fireEvent.ended(unifiedVideo);
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    expect(screen.getByRole("region", { name: /Paso 6 de 15/i })).toBeInTheDocument();
    expect(screen.getByTestId("journey-motion-video").querySelector("source")).toHaveAttribute("src", "/journey-final/07-two-souls-clean.mp4");
  });

  it("holds the two-souls note until touched, then plays the chapel card before Continue becomes active", async () => {
    const user = userEvent.setup();
    render(<JourneyApp initialStep={6} />);

    fireEvent.ended(screen.getByTestId("journey-motion-video"));
    expect(screen.getByRole("region", { name: /Paso 6 de 15/i })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /El viaje de dos almas/i })).toHaveAttribute("src", "/journey-final/07-two-souls-897-final.png");

    await user.click(screen.getByRole("button", { name: "Continuar" }));
    expect(screen.getByRole("region", { name: /Paso 7 de 15/i })).toBeInTheDocument();
    const reveal = screen.getByTestId("journey-motion-video");
    expect(reveal.querySelector("source")).toHaveAttribute("src", "/journey-final/08-ceremony.mp4");
    expect(screen.getByRole("img", { name: /La ceremonia/i })).toHaveAttribute("src", "/journey-final/08-ceremony-first.png");
    expect(reveal.parentElement).toHaveAttribute("data-media-phase", "motion");
    reveal.currentTime = 6.8;
    fireEvent.timeUpdate(reveal);
    expect(reveal.parentElement).toHaveAttribute("data-media-phase", "interactive");
    fireEvent.ended(reveal);
    expect(screen.getByRole("region", { name: /Paso 7 de 15/i })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /La ceremonia/i })).toHaveAttribute("src", "/journey-final/08-ceremony-final.png");

    await user.click(screen.getByRole("button", { name: "Continuar" }));
    expect(screen.getByRole("region", { name: /Paso 8 de 15/i })).toBeInTheDocument();
  });

  it("renders the dress-code and RSVP scenes as semantic controls", () => {
    const { unmount } = render(<JourneyApp initialStep={10} />);

    const expectedButtons = [
      "Activar música",
      "CAPÍTULOS",
      "Continuar",
    ];

    expectedButtons.forEach((name) => {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    });

    unmount();
    render(<JourneyApp initialStep={11} />);
    expect(screen.getByRole("button", { name: "CONFIRMAR MI ASISTENCIA" })).toBeInTheDocument();
  });

  it("keeps the delivered dress-code film before RSVP", () => {
    render(<JourneyApp initialStep={10} />);
    expect(screen.getByRole("img", { name: /Código de vestimenta/i })).toHaveAttribute("src", "/journey-final/11-dress-code-first.png");
    expect(screen.getByRole("button", { name: "Continuar" })).toBeInTheDocument();
  });

  it("opens chapter navigation without leaving the home journey", async () => {
    const user = userEvent.setup();
    render(<JourneyApp initialStep={3} />);

    await user.click(screen.getByRole("button", { name: "CAPÍTULOS" }));
    expect(screen.getByRole("dialog", { name: "Capítulos" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /11.*CONFIRMACIÓN DE ASISTENCIA/i }));
    expect(
      screen.getByRole("region", { name: /Paso 11 de 15/i }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("journey-motion-video")).not.toBeInTheDocument();
  });

  it("keeps the current chapter visible until the requested still is decoded", async () => {
    let finishDecode!: () => void;
    const pending = new Promise<void>((resolve) => { finishDecode = resolve; });
    vi.stubGlobal("Image", vi.fn(function () {
      const image = document.createElement("img");
      image.decode = () => image.src.includes("12-rsvp-final") ? pending : Promise.resolve();
      return image;
    }));
    const user = userEvent.setup();
    render(<JourneyApp initialStep={3} />);
    await user.click(screen.getByRole("button", { name: "CAPÍTULOS" }));
    await user.click(screen.getByRole("button", { name: /11.*CONFIRMACIÓN DE ASISTENCIA/i }));
    expect(screen.getByRole("region", { name: /Paso 3 de 15/i })).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Capítulos" })).toBeInTheDocument();
    await act(async () => finishDecode());
    expect(screen.getByRole("region", { name: /Paso 11 de 15/i })).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Capítulos" })).not.toBeInTheDocument();
  });

  it("keeps scene two on screen when the visitor scrolls or swipes", () => {
    const { container } = render(<JourneyApp initialStep={2} />);
    const stage = container.querySelector(".journey-shell");

    fireEvent.wheel(stage!, { deltaY: 96 });
    fireEvent.pointerDown(stage!, { clientX: 240, clientY: 650 });
    fireEvent.pointerUp(stage!, { clientX: 240, clientY: 520 });

    expect(screen.getByRole("region", { name: /Paso 2 de 15/i })).toBeInTheDocument();
  });

  it("uses the supplied scene-twelve RSVP artwork", async () => {
    const user = userEvent.setup();
    render(<JourneyApp initialStep={11} />);

    await user.click(screen.getByRole("button", { name: "CONFIRMAR MI ASISTENCIA" }));
    expect(document.querySelector(".journey-rsvp-decor")).toHaveAttribute("src", "/journey-final/12-rsvp-form.png");
    expect(screen.getByLabelText("Menú preferido")).toBeInTheDocument();
  });

  it("keeps RSVP form available without movement in reduced-motion mode", async () => {
    const user = userEvent.setup();
    render(<JourneyApp initialStep={11} />);

    await user.click(screen.getByRole("button", { name: "Reducir movimiento" }));
    await user.click(screen.getByRole("button", { name: "CONFIRMAR MI ASISTENCIA" }));

    expect(screen.queryByTestId("journey-motion-video")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Nombre completo")).toBeInTheDocument();
  });

  it("makes the three delivered detail cards and the final chapter reachable", async () => {
    const user = userEvent.setup();
    render(<JourneyApp initialStep={13} />);

    await user.click(screen.getByRole("button", { name: "MÚSICA Y ALEGRÍA" }));
    expect(screen.getByRole("dialog", { name: "Música y alegría" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continuar para sugerir una canción" }));
    await user.type(screen.getByLabelText("¿Qué canción no puede faltar?"), "Nuestra canción");
    await user.click(screen.getByRole("button", { name: "Enviar mi canción" }));
    expect(submitJourneyResponse).toHaveBeenCalledWith(expect.objectContaining({kind: "song", song: "Nuestra canción"}));
    expect(screen.getByRole("dialog", { name: "Canción enviada" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Volver al camino" }));

    await user.click(screen.getByRole("button", { name: "RECUERDOS PARA SIEMPRE" }));
    expect(screen.getByRole("link", { name: "Abrir la carpeta de fotos y vídeos" })).toHaveAttribute("href", "https://drive.google.com/drive/folders/1shPcfW-dD8DOlALLBiaFFCnfimcQKxxT");
    await user.click(screen.getByRole("button", { name: "Cerrar" }));

    await user.click(screen.getByRole("button", { name: "CONTACTO" }));
    expect(screen.getByRole("dialog", { name: "Contacto" }).querySelector("img")).toHaveAttribute("src", "/journey-final/14-contact-v2.jpg");
    expect(screen.getByRole("link", { name: "Escribir correo a Gladiola y Jordi" })).toHaveAttribute("href", "mailto:vinculoglayjor@gmail.com");
    expect(screen.getByRole("link", { name: "Escribir por WhatsApp a Gladiola y Jordi" })).toHaveAttribute("href", expect.stringContaining("wa.me/34641300670"));
    expect(screen.getByRole("link", { name: "Abrir el canal de YouTube para ver la boda en vivo" })).toHaveAttribute("href", "https://www.youtube.com/@elviajedelvinculo");
    await user.click(screen.getByRole("button", { name: "Cerrar" }));

    await user.click(screen.getByRole("button", { name: "Continuar" }));
    expect(screen.getByRole("region", { name: /Paso 14 de 15/ })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    expect(screen.getByRole("region", { name: /Paso 15 de 15/ })).toBeInTheDocument();
  });
});
