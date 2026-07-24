import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import gsap from "gsap";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApproachScene } from "../src/components/ApproachScene";
import { DoorOpeningSequence } from "../src/components/DoorOpeningSequence";
import { SecretWordGate } from "../src/components/SecretWordGate";
import { experienceConfig } from "../src/config/experience";

vi.mock("gsap", () => ({
  default: {
    fromTo: vi.fn(() => ({ kill: vi.fn() })),
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe("SecretWordGate", () => {
  it("rotates every incorrect message while keeping the hint persistent", async () => {
    const user = userEvent.setup();
    render(<SecretWordGate validate={async () => false} onAccepted={vi.fn()} />);
    const input = screen.getByLabelText("Palabra del camino");
    const expectedMessages = [
      ...experienceConfig.incorrectMessages,
      experienceConfig.incorrectMessages[0],
    ];

    for (const [index, expectedMessage] of expectedMessages.entries()) {
      await user.clear(input);
      await user.type(input, `fallo${index + 1}`);
      await user.keyboard("{Enter}");

      expect(screen.getByTestId("secret-feedback")).toHaveTextContent(
        expectedMessage,
      );
      expect(screen.getByTestId("secret-gate")).toHaveAttribute(
        "data-attempt",
        String(index + 1),
      );
      expect(screen.getByTestId("secret-gate")).toHaveAttribute(
        "data-reaction",
        ["warning", "flicker", "resonance"][index % 3],
      );

      if (index >= 2) {
        expect(screen.getByTestId("secret-hint")).toHaveTextContent(
          experienceConfig.hint,
        );
      } else {
        expect(screen.queryByTestId("secret-hint")).toBeNull();
      }
    }
  });

  it("announces the persistent hint through its own polite live region", async () => {
    const user = userEvent.setup();
    render(<SecretWordGate validate={async () => false} onAccepted={vi.fn()} />);
    const input = screen.getByLabelText("Palabra del camino");

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      await user.clear(input);
      await user.type(input, `fallo${attempt}`);
      await user.keyboard("{Enter}");
    }

    const hint = screen.getByTestId("secret-hint");
    expect(hint).toHaveAttribute("role", "status");
    expect(hint).toHaveAttribute("aria-live", "polite");
    expect(hint).toHaveAttribute("aria-atomic", "true");
    expect(hint).toHaveTextContent(experienceConfig.hint);
  });

  it("remounts the wrong-door reaction on every failed attempt", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <SecretWordGate validate={async () => false} onAccepted={vi.fn()} />,
    );
    const input = screen.getByLabelText("Palabra del camino");

    await user.type(input, "fallo uno");
    await user.keyboard("{Enter}");
    const firstReaction = container.querySelector("[data-state='wrong']");

    await user.clear(input);
    await user.type(input, "fallo dos");
    await user.keyboard("{Enter}");
    const secondReaction = container.querySelector("[data-state='wrong']");

    expect(firstReaction).not.toBe(secondReaction);
  });

  it("announces the hint after the third incorrect attempt", async () => {
    const user = userEvent.setup();
    render(<SecretWordGate validate={async () => false} onAccepted={vi.fn()} />);
    const input = screen.getByLabelText("Palabra del camino");
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await user.clear(input);
      await user.type(input, `fallo${attempt}`);
      await user.click(
        screen.getByRole("button", { name: "Despertar la puerta" }),
      );
    }
    expect(screen.getByTestId("secret-hint")).toHaveTextContent(
      "Es una palabra que une a quienes comparten el camino.",
    );
  });

  it("keeps accepting attempts after revealing the hint", async () => {
    const user = userEvent.setup();
    const validate = vi.fn(async () => false);
    render(<SecretWordGate validate={validate} onAccepted={vi.fn()} />);
    const input = screen.getByLabelText("Palabra del camino");

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await user.clear(input);
      await user.type(input, `fallo${attempt}`);
      await user.click(
        screen.getByRole("button", { name: "Despertar la puerta" }),
      );
    }

    expect(validate).toHaveBeenCalledTimes(5);
    expect(screen.getByTestId("secret-hint")).toHaveTextContent(
      "Es una palabra que une a quienes comparten el camino.",
    );
  });

  it("announces validation messages through a polite live region", async () => {
    const user = userEvent.setup();
    render(<SecretWordGate validate={async () => false} onAccepted={vi.fn()} />);

    await user.click(
      screen.getByRole("button", { name: "Despertar la puerta" }),
    );

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent("La puerta espera una palabra.");
  });

  it("calls onAccepted and releases keyboard focus when validation succeeds", async () => {
    const user = userEvent.setup();
    const onAccepted = vi.fn();
    render(<SecretWordGate validate={async () => true} onAccepted={onAccepted} />);
    const input = screen.getByLabelText("Palabra del camino");
    await user.type(input, "respuesta");
    await user.keyboard("{Enter}");
    expect(onAccepted).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(document.body);
  });

  it("recovers from validation errors and permits another attempt", async () => {
    const user = userEvent.setup();
    const validate = vi
      .fn<(value: string) => Promise<boolean>>()
      .mockRejectedValueOnce(new Error("validation unavailable"))
      .mockResolvedValueOnce(true);
    const onAccepted = vi.fn();
    render(<SecretWordGate validate={validate} onAccepted={onAccepted} />);
    await user.type(screen.getByLabelText("Palabra del camino"), "respuesta");
    const submitButton = screen.getByRole("button", {
      name: "Despertar la puerta",
    });

    await user.click(submitButton);

    expect(
      await screen.findByText(
        "La puerta no puede escuchar ahora. Inténtalo de nuevo.",
      ),
    ).toBeVisible();
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);
    expect(validate).toHaveBeenCalledTimes(2);
    expect(onAccepted).toHaveBeenCalledOnce();
  });
});

describe("DoorOpeningSequence", () => {
  it("finishes immediately through its skip control", async () => {
    const user = userEvent.setup();
    const onFinished = vi.fn();
    render(
      <DoorOpeningSequence reducedMotion={false} onFinished={onFinished} />,
    );
    await user.click(
      screen.getByRole("button", { name: "Saltar apertura" }),
    );
    expect(onFinished).toHaveBeenCalledOnce();
  });

  it("does not finish a second time after a skipped opening", () => {
    vi.useFakeTimers();
    const onFinished = vi.fn();
    render(
      <DoorOpeningSequence reducedMotion={false} onFinished={onFinished} />,
    );

    screen.getByRole("button", { name: "Saltar apertura" }).click();
    act(() => {
      vi.advanceTimersByTime(experienceConfig.openingDurationMs);
    });

    expect(onFinished).toHaveBeenCalledOnce();
  });

  it.each([
    { reducedMotion: true, duration: 450 },
    { reducedMotion: false, duration: experienceConfig.openingDurationMs },
  ])(
    "finishes after $duration ms when reducedMotion is $reducedMotion",
    ({ reducedMotion, duration }) => {
      vi.useFakeTimers();
      const onFinished = vi.fn();
      render(
        <DoorOpeningSequence
          reducedMotion={reducedMotion}
          onFinished={onFinished}
        />,
      );

      act(() => {
        vi.advanceTimersByTime(duration - 1);
      });
      expect(onFinished).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(onFinished).toHaveBeenCalledOnce();
    },
  );

  it("still completes if the GSAP animation cannot start", () => {
    vi.useFakeTimers();
    vi.mocked(gsap.fromTo).mockImplementationOnce(() => {
      throw new Error("animation unavailable");
    });
    const onFinished = vi.fn();

    render(
      <DoorOpeningSequence reducedMotion={false} onFinished={onFinished} />,
    );
    act(() => {
      vi.advanceTimersByTime(experienceConfig.openingDurationMs);
    });

    expect(onFinished).toHaveBeenCalledOnce();
  });

  it("still finishes when GSAP cleanup throws", () => {
    const kill = vi
      .fn()
      .mockImplementationOnce(() => {
        throw new Error("animation cleanup unavailable");
      })
      .mockImplementation(() => undefined);
    vi.mocked(gsap.fromTo).mockReturnValueOnce({ kill } as never);
    const onFinished = vi.fn();
    const suppressExpectedError = (event: ErrorEvent) => event.preventDefault();
    window.addEventListener("error", suppressExpectedError);

    try {
      render(
        <DoorOpeningSequence reducedMotion={false} onFinished={onFinished} />,
      );
      screen.getByRole("button", { name: "Saltar apertura" }).click();
      expect(onFinished).toHaveBeenCalledOnce();
    } finally {
      window.removeEventListener("error", suppressExpectedError);
    }
  });

  it("scopes each GSAP animation to its own door light", () => {
    vi.mocked(gsap.fromTo).mockClear();
    const { container } = render(
      <>
        <DoorOpeningSequence reducedMotion={false} onFinished={vi.fn()} />
        <DoorOpeningSequence reducedMotion={false} onFinished={vi.fn()} />
      </>,
    );
    const openingScenes = container.querySelectorAll(".opening");

    expect(gsap.fromTo).toHaveBeenCalledTimes(2);
    expect(vi.mocked(gsap.fromTo).mock.calls[0][0]).toBe(
      openingScenes[0].querySelector(".door-light"),
    );
    expect(vi.mocked(gsap.fromTo).mock.calls[1][0]).toBe(
      openingScenes[1].querySelector(".door-light"),
    );
  });

  it("cancels its timer and animation when unmounted", () => {
    vi.useFakeTimers();
    const kill = vi.fn();
    vi.mocked(gsap.fromTo).mockReturnValueOnce({ kill } as never);
    const onFinished = vi.fn();

    const { unmount } = render(
      <DoorOpeningSequence reducedMotion={false} onFinished={onFinished} />,
    );
    unmount();
    act(() => {
      vi.runAllTimers();
    });

    expect(kill).toHaveBeenCalledOnce();
    expect(onFinished).not.toHaveBeenCalled();
  });
});

it("allows the approach animation to be skipped", async () => {
  const user = userEvent.setup();
  render(<ApproachScene reducedMotion={false} onFinished={vi.fn()} />);
  await user.click(
    screen.getByRole("button", { name: "Saltar aproximación" }),
  );
  expect(screen.getByRole("button", { name: "Acércate" })).toBeVisible();
});
