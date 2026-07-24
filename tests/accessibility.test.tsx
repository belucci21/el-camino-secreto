import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccessibilityControls } from "../src/components/AccessibilityControls";
import { AncientDoor } from "../src/components/AncientDoor";
import { ApproachScene } from "../src/components/ApproachScene";
import { CalendarDownload } from "../src/components/CalendarDownload";
import { DiscoveryScene } from "../src/components/DiscoveryScene";
import { ErrorBoundary } from "../src/components/ErrorBoundary";
import { EventDetails } from "../src/components/EventDetails";
import { ExperienceApp } from "../src/components/ExperienceApp";
import { ExperienceLoader } from "../src/components/ExperienceLoader";
import { FinalMessage } from "../src/components/FinalMessage";
import { InvitationReveal } from "../src/components/InvitationReveal";
import { RSVPWhatsApp } from "../src/components/RSVPWhatsApp";
import { SoundGate } from "../src/components/SoundGate";
import { experienceConfig } from "../src/config/experience";
import { weddingConfig } from "../src/config/wedding";
import * as generateICS from "../src/utils/generateICS";

afterEach(() => {
  cleanup();
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value: true,
  });
});

async function tabTo(
  user: ReturnType<typeof userEvent.setup>,
  element: HTMLElement,
) {
  for (let step = 0; step < 40 && document.activeElement !== element; step += 1) {
    await user.tab();
  }
  expect(element).toHaveFocus();
}

describe("SoundGate", () => {
  it("offers sound, silence, reduced motion and skip actions", async () => {
    const user = userEvent.setup();
    const onEnter = vi.fn();
    const onToggleReducedMotion = vi.fn();
    const onSkip = vi.fn();

    render(
      <SoundGate
        reducedMotion={false}
        onEnter={onEnter}
        onToggleReducedMotion={onToggleReducedMotion}
        onSkip={onSkip}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Entrar con sonido" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Entrar en silencio" }),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Entrar en silencio" }));
    expect(onEnter).toHaveBeenCalledWith(false);

    const motionButton = screen.getByRole("button", {
      name: "Reducir movimiento",
    });
    motionButton.focus();
    await user.keyboard("{Enter}");
    expect(onToggleReducedMotion).toHaveBeenCalledOnce();

    const skipButton = screen.getByRole("button", {
      name: "Saltar a la invitación",
    });
    skipButton.focus();
    await user.keyboard(" ");
    expect(onSkip).toHaveBeenCalledOnce();
  });
});

it("exposes accessible persistent controls including volume", async () => {
  const user = userEvent.setup();
  const onToggleSound = vi.fn();
  const onVolumeChange = vi.fn();

  render(
    <AccessibilityControls
      reducedMotion={false}
      soundEnabled={false}
      volume={0.65}
      onToggleMotion={vi.fn()}
      onToggleSound={onToggleSound}
      onVolumeChange={onVolumeChange}
      onSkip={vi.fn()}
    />,
  );

  expect(
    screen.getByRole("navigation", { name: "Controles de experiencia" }),
  ).toBeVisible();
  const volume = screen.getByRole("slider", { name: "Volumen" });
  fireEvent.change(volume, { target: { value: "0.4" } });
  expect(onVolumeChange).toHaveBeenCalledWith(0.4);

  const soundButton = screen.getByRole("button", { name: "Sonido" });
  soundButton.focus();
  await user.keyboard("{Enter}");
  expect(onToggleSound).toHaveBeenCalledOnce();
});

it("renders a lightweight loading message", () => {
  render(<ExperienceLoader />);
  expect(screen.getByText("El camino está despertando.")).toBeVisible();
});

it("keeps discovery actionable without animation", async () => {
  const user = userEvent.setup();
  const onDiscover = vi.fn();
  const requestAnimationFrame = vi.spyOn(window, "requestAnimationFrame");

  const { container } = render(
    <DiscoveryScene tier="low" onDiscover={onDiscover} />,
  );

  expect(container.querySelector("canvas")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  expect(requestAnimationFrame).not.toHaveBeenCalled();
  const scene = container.querySelector<HTMLElement>(".discovery");
  expect(scene).not.toBeNull();
  fireEvent.pointerMove(scene as HTMLElement, { clientX: 50, clientY: 50 });
  expect(scene?.style.getPropertyValue("--look-x")).toBe("");

  const discoverButton = screen.getByRole("button", {
    name: "Descubrir el camino",
  });
  discoverButton.focus();
  await user.keyboard("{Enter}");
  expect(onDiscover).toHaveBeenCalledOnce();

  requestAnimationFrame.mockRestore();
});

it("exposes the door state as deterministic markup", () => {
  const { container } = render(<AncientDoor state="wrong" />);
  expect(container.querySelector("[data-state='wrong']")).toBeInTheDocument();
});

it("lets reduced-motion visitors continue through the approach immediately", async () => {
  const user = userEvent.setup();
  const onFinished = vi.fn();

  render(<ApproachScene reducedMotion onFinished={onFinished} />);

  expect(screen.getByText("Solo quienes conocen la palabra podrán entrar.")).toBeVisible();
  const continueButton = screen.getByRole("button", { name: "Acércate" });
  continueButton.focus();
  await user.keyboard("{Enter}");
  expect(onFinished).toHaveBeenCalledOnce();
});

it("arrives immediately when reduced motion is enabled while mounted", () => {
  vi.useFakeTimers();

  try {
    const onFinished = vi.fn();
    const { rerender } = render(
      <ApproachScene reducedMotion={false} onFinished={onFinished} />,
    );

    expect(
      screen.getByRole("button", { name: "Saltar aproximación" }),
    ).toBeVisible();

    rerender(<ApproachScene reducedMotion onFinished={onFinished} />);

    expect(
      screen.getByRole("button", { name: "Acércate" }),
    ).toBeVisible();
  } finally {
    vi.useRealTimers();
  }
});

it("exposes arrival updates through a polite live status", () => {
  vi.useFakeTimers();

  try {
    const onFinished = vi.fn();
    const { rerender } = render(
      <ApproachScene reducedMotion={false} onFinished={onFinished} />,
    );

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent("La puerta se aproxima.");

    rerender(<ApproachScene reducedMotion onFinished={onFinished} />);

    expect(status).toHaveTextContent("La puerta está lista.");
  } finally {
    vi.useRealTimers();
  }
});

it("moves focus to the continue action after automatic arrival", () => {
  vi.useFakeTimers();

  try {
    render(<ApproachScene reducedMotion={false} onFinished={vi.fn()} />);
    const skipButton = screen.getByRole("button", {
      name: "Saltar aproximación",
    });
    skipButton.focus();
    expect(skipButton).toHaveFocus();

    act(() => {
      vi.advanceTimersByTime(experienceConfig.approachDurationMs);
    });

    const continueButton = screen.getByRole("button", { name: "Acércate" });
    expect(continueButton).not.toBe(skipButton);
    expect(continueButton).toHaveFocus();
  } finally {
    vi.useRealTimers();
  }
});

it("preserves external focus when reduced motion starts at arrival", () => {
  const sentinel = document.createElement("button");
  document.body.append(sentinel);
  sentinel.focus();

  try {
    render(<ApproachScene reducedMotion onFinished={vi.fn()} />);
    expect(sentinel).toHaveFocus();
  } finally {
    sentinel.remove();
  }
});

it("labels unconfirmed event values without fake links", () => {
  render(<EventDetails />);
  expect(screen.getAllByText("Pendiente de confirmar").length).toBeGreaterThan(0);
  expect(screen.queryByRole("link", { name: "Abrir ubicación" })).toBeNull();
});

it("renders every configurable event-detail field", () => {
  render(<EventDetails />);

  for (const label of [
    "Fecha",
    "Ceremonia",
    "Celebración",
    "Lugar",
    "Dirección",
    "Vestimenta",
    "Transporte",
    "Alojamiento",
    "Regalos",
    "Teléfono de contacto",
  ]) {
    expect(screen.getByText(label, { selector: "dt" })).toBeVisible();
  }
});

it("keeps a confirmed map link inside a valid detail group", () => {
  const originalMapsUrl = { ...weddingConfig.event.mapsUrl };

  try {
    Object.assign(weddingConfig.event.mapsUrl, {
      value: "https://maps.example.test/location",
      status: "confirmed",
    });
    const { container } = render(<EventDetails />);
    const link = screen.getByRole("link", { name: "Abrir ubicación" });

    expect(link.closest("dd")).not.toBeNull();
    expect(container.querySelector("dl > a")).toBeNull();
  } finally {
    Object.assign(weddingConfig.event.mapsUrl, originalMapsUrl);
  }
});

it("disables RSVP until the WhatsApp number is confirmed", () => {
  render(<RSVPWhatsApp />);
  expect(screen.getByRole("button", { name: "Sí, estaré allí" })).toBeDisabled();
  expect(
    screen.getByText("Número de WhatsApp pendiente de confirmar."),
  ).toBeVisible();
});

it("copies the RSVP message when WhatsApp cannot open", async () => {
  const user = userEvent.setup();
  const writeText = vi.fn(async () => undefined);
  const open = vi.spyOn(window, "open").mockReturnValue(null);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
  render(
    <RSVPWhatsApp
      phone={{ value: "34600111222", status: "confirmed" }}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Sí, estaré allí" }));
  expect(writeText).toHaveBeenCalledOnce();
  expect(
    screen.getByText("Mensaje copiado para enviarlo manualmente."),
  ).toBeVisible();
  open.mockRestore();
});

it("secures a successfully opened WhatsApp window without copying", async () => {
  const user = userEvent.setup();
  const writeText = vi.fn(async () => undefined);
  const opened = { opener: window } as unknown as Window;
  const open = vi.spyOn(window, "open").mockReturnValue(opened);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });

  try {
    render(
      <RSVPWhatsApp
        phone={{ value: "34600111222", status: "confirmed" }}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Sí, estaré allí" }));

    expect(open).toHaveBeenCalledWith(expect.any(String), "_blank");
    expect(opened.opener).toBeNull();
    expect(writeText).not.toHaveBeenCalled();
    expect(
      screen.queryByText("Mensaje copiado para enviarlo manualmente."),
    ).toBeNull();
  } finally {
    open.mockRestore();
  }
});

it("does not create a false calendar event from placeholders", () => {
  render(<CalendarDownload />);
  expect(
    screen.getByRole("button", { name: "Añadir la fecha al calendario" }),
  ).toBeDisabled();
});

it("keeps the canonical wedding site URL in configuration", () => {
  expect(weddingConfig.siteUrl).toEqual({
    value: "https://gladiolajordivinculoeterno.com/",
    status: "confirmed",
  });
});

it("uses only a confirmed configured URL for calendar downloads", async () => {
  const user = userEvent.setup();
  const requiredFields = [
    weddingConfig.event.calendarStart,
    weddingConfig.event.calendarEnd,
    weddingConfig.event.venue,
    weddingConfig.event.address,
  ];
  const originalFields = requiredFields.map((field) => ({ ...field }));
  const originalSiteUrl = { ...weddingConfig.siteUrl };
  const download = vi
    .spyOn(generateICS, "downloadICS")
    .mockImplementation(() => undefined);

  try {
    Object.assign(weddingConfig.event.calendarStart, {
      value: "2027-06-12T15:00:00Z",
      status: "confirmed",
    });
    Object.assign(weddingConfig.event.calendarEnd, {
      value: "2027-06-13T00:00:00Z",
      status: "confirmed",
    });
    Object.assign(weddingConfig.event.venue, {
      value: "El claro",
      status: "confirmed",
    });
    Object.assign(weddingConfig.event.address, {
      value: "Camino del bosque",
      status: "confirmed",
    });
    Object.assign(weddingConfig.siteUrl, {
      value: "https://example.test/invitacion",
      status: "placeholder",
    });

    const { rerender } = render(<CalendarDownload />);
    const calendarButton = screen.getByRole("button", {
      name: "Añadir la fecha al calendario",
    });
    expect(calendarButton).toBeDisabled();

    Object.assign(weddingConfig.siteUrl, { status: "confirmed" });
    rerender(<CalendarDownload />);
    await user.click(calendarButton);

    expect(download).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://example.test/invitacion",
      }),
    );
  } finally {
    requiredFields.forEach((field, index) => {
      Object.assign(field, originalFields[index]);
    });
    Object.assign(weddingConfig.siteUrl, originalSiteUrl);
    download.mockRestore();
  }
});

it("recovers from a calendar download failure with manual details", async () => {
  const user = userEvent.setup();
  const requiredFields = [
    weddingConfig.event.date,
    weddingConfig.event.calendarStart,
    weddingConfig.event.calendarEnd,
    weddingConfig.event.venue,
    weddingConfig.event.address,
  ];
  const originalFields = requiredFields.map((field) => ({ ...field }));
  const originalSiteUrl = { ...weddingConfig.siteUrl };
  const download = vi
    .spyOn(generateICS, "downloadICS")
    .mockImplementation(() => {
      throw new Error("downloads blocked");
    });

  try {
    Object.assign(weddingConfig.event.date, {
      value: "12 de junio de 2027",
      status: "confirmed",
    });
    Object.assign(weddingConfig.event.calendarStart, {
      value: "2027-06-12T15:00:00Z",
      status: "confirmed",
    });
    Object.assign(weddingConfig.event.calendarEnd, {
      value: "2027-06-13T00:00:00Z",
      status: "confirmed",
    });
    Object.assign(weddingConfig.event.venue, {
      value: "El claro",
      status: "confirmed",
    });
    Object.assign(weddingConfig.event.address, {
      value: "Camino del bosque",
      status: "confirmed",
    });
    Object.assign(weddingConfig.siteUrl, {
      value: "https://example.test/invitacion",
      status: "confirmed",
    });

    render(<CalendarDownload />);
    await user.click(
      screen.getByRole("button", { name: "Añadir la fecha al calendario" }),
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "No se pudo descargar el calendario.",
    );
    expect(screen.getByText("Guardar los datos manualmente")).toBeVisible();
    expect(screen.getByText("12 de junio de 2027")).toBeVisible();
    expect(
      screen.getByText("2027-06-12T15:00:00Z – 2027-06-13T00:00:00Z"),
    ).toBeVisible();
    expect(screen.getByText("El claro")).toBeVisible();
    expect(screen.getByText("Camino del bosque")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Abrir invitación" }),
    ).toHaveAttribute("href", "https://example.test/invitacion");
  } finally {
    requiredFields.forEach((field, index) => {
      Object.assign(field, originalFields[index]);
    });
    Object.assign(weddingConfig.siteUrl, originalSiteUrl);
    download.mockRestore();
  }
});

it("reveals the couple and configurable details", () => {
  render(<InvitationReveal />);
  expect(
    screen.getByRole("heading", { name: "Gladiola y Jordi" }),
  ).toBeVisible();
});

it("replays the opening from the final message", async () => {
  const user = userEvent.setup();
  const onReplay = vi.fn();
  render(<FinalMessage onReplay={onReplay} />);
  await user.click(
    screen.getByRole("button", { name: "Volver a ver la apertura" }),
  );
  expect(onReplay).toHaveBeenCalledOnce();
});

it("renders the final message as an honest placeholder", () => {
  render(<FinalMessage onReplay={vi.fn()} />);

  expect(weddingConfig.finalMessage).toEqual({
    value: "Mensaje final pendiente de confirmar",
    status: "placeholder",
  });
  expect(
    screen.getByText("Mensaje final pendiente de confirmar"),
  ).toBeVisible();
});

it("recovers to the static invitation when a scene crashes", () => {
  const consoleError = vi
    .spyOn(console, "error")
    .mockImplementation(() => undefined);
  function BrokenScene(): never {
    throw new Error("scene failed");
  }
  render(
    <ErrorBoundary>
      <BrokenScene />
    </ErrorBoundary>,
  );
  expect(
    screen.getByRole("heading", { name: "Gladiola y Jordi" }),
  ).toBeVisible();
  consoleError.mockRestore();
});

it("allows a keyboard user to skip to the invitation", async () => {
  const user = userEvent.setup();
  render(<ExperienceApp />);
  await user.click(
    await screen.findByRole("button", { name: "Saltar a la invitación" }),
  );
  expect(
    screen.getByRole("heading", { name: "Gladiola y Jordi" }),
  ).toBeVisible();
});

it("lets a keyboard user skip without a click and focuses the revealed scene", async () => {
  const user = userEvent.setup();
  render(<ExperienceApp />);
  const skip = await screen.findByRole("button", {
    name: "Saltar a la invitación",
  });

  await tabTo(user, skip);
  await user.keyboard("{Enter}");

  expect(
    screen.getByRole("heading", { name: "Gladiola y Jordi" }),
  ).toBeVisible();
  expect(screen.getByTestId("scene-focus-target")).toHaveFocus();
  expect(screen.getByTestId("scene-focus-target")).toHaveTextContent(
    "Invitación revelada",
  );
});

it("supports the complete Enter and Tab journey through reveal and replay", async () => {
  const originalMatchMedia = window.matchMedia;
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => true,
    }),
  });

  try {
    const user = userEvent.setup();
    render(<ExperienceApp />);

    const silence = await screen.findByRole("button", {
      name: "Entrar en silencio",
    });
    expect(screen.getByTestId("scene-focus-target")).toHaveFocus();
    expect(screen.getByTestId("scene-focus-target")).toHaveTextContent(
      "Umbral de entrada",
    );
    await tabTo(user, silence);
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("scene-focus-target")).toHaveFocus();
    expect(screen.getByTestId("scene-focus-target")).toHaveTextContent(
      "Descubrimiento del camino",
    );

    const discover = await screen.findByRole("button", {
      name: "Descubrir el camino",
    });
    await tabTo(user, discover);
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("scene-focus-target")).toHaveFocus();
    expect(screen.getByTestId("scene-focus-target")).toHaveTextContent(
      "Aproximación a la puerta",
    );

    const approach = await screen.findByRole("button", { name: "Acércate" });
    await tabTo(user, approach);
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("scene-focus-target")).toHaveFocus();
    expect(screen.getByTestId("scene-focus-target")).toHaveTextContent(
      "Palabra del camino",
    );

    const secretWord = await screen.findByRole("textbox", {
      name: "Palabra del camino",
    });
    await tabTo(user, secretWord);
    await user.type(secretWord, "amigo");
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("scene-focus-target")).toHaveFocus();
    expect(screen.getByTestId("scene-focus-target")).toHaveTextContent(
      "Apertura de la puerta",
    );

    const skipOpening = await screen.findByRole("button", {
      name: "Saltar apertura",
    });
    await tabTo(user, skipOpening);
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("scene-focus-target")).toHaveFocus();
    expect(screen.getByTestId("scene-focus-target")).toHaveTextContent(
      "Invitación revelada",
    );

    const replay = screen.getByRole("button", {
      name: "Volver a ver la apertura",
    });
    await tabTo(user, replay);
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("scene-focus-target")).toHaveFocus();
    expect(screen.getByTestId("scene-focus-target")).toHaveTextContent(
      "Apertura de la puerta",
    );
  } finally {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: originalMatchMedia,
    });
  }
});

it("lets a reduced-motion keyboard user reach the secret word field", async () => {
  const originalMatchMedia = window.matchMedia;
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => true,
    }),
  });

  try {
    const user = userEvent.setup();
    render(<ExperienceApp />);

    const silence = await screen.findByRole("button", {
      name: "Entrar en silencio",
    });
    await tabTo(user, silence);
    await user.keyboard("{Enter}");

    const discover = await screen.findByRole("button", {
      name: "Descubrir el camino",
    });
    await tabTo(user, discover);
    await user.keyboard("{Enter}");

    const approach = await screen.findByRole("button", { name: "Acércate" });
    await tabTo(user, approach);
    await user.keyboard("{Enter}");

    const secretWord = await screen.findByRole("textbox", {
      name: "Palabra del camino",
    });
    await tabTo(user, secretWord);
  } finally {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: originalMatchMedia,
    });
  }
});

it("announces offline mode without blocking the experience", async () => {
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value: false,
  });
  render(<ExperienceApp />);
  expect(
    await screen.findByText(
      "Sin conexión. El camino continúa con los recursos disponibles.",
    ),
  ).toBeVisible();
});

it("exposes an explicit reduced-motion preference to CSS", async () => {
  const user = userEvent.setup();
  const { container } = render(<ExperienceApp />);
  const motionButton = await screen.findByRole("button", {
    name: "Movimiento",
  });

  expect(
    container.querySelector("[data-reduced-motion='false']"),
  ).toBeInTheDocument();
  expect(
    container.querySelector("[data-performance-tier='high']"),
  ).toBeInTheDocument();

  await user.click(motionButton);

  expect(
    container.querySelector("[data-reduced-motion='true']"),
  ).toBeInTheDocument();
  expect(
    container.querySelector("[data-performance-tier='low']"),
  ).toBeInTheDocument();
});

it("keeps initial markup deterministic while offline", () => {
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value: false,
  });

  const markup = renderToString(<ExperienceApp />);

  expect(markup).not.toContain(
    "Sin conexión. El camino continúa con los recursos disponibles.",
  );
});
