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
