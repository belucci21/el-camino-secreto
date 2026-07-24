import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccessibilityControls } from "../src/components/AccessibilityControls";
import { AncientDoor } from "../src/components/AncientDoor";
import { ApproachScene } from "../src/components/ApproachScene";
import { DiscoveryScene } from "../src/components/DiscoveryScene";
import { ExperienceLoader } from "../src/components/ExperienceLoader";
import { SoundGate } from "../src/components/SoundGate";
import { experienceConfig } from "../src/config/experience";

afterEach(cleanup);

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
