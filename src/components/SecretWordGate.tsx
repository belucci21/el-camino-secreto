"use client";

import { useState, type FormEvent } from "react";
import { experienceConfig } from "../config/experience";
import { validateSecretWord } from "../utils/secretWord";
import { PortalStage } from "./PortalStage";

interface SecretWordGateProps {
  validate?: (value: string) => Promise<boolean>;
  onAccepted: () => void;
}

export function SecretWordGate({
  validate = validateSecretWord,
  onAccepted,
}: SecretWordGateProps) {
  const [value, setValue] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const reaction =
    attempts === 0
      ? "waiting"
      : (["warning", "flicker", "resonance"] as const)[
          (attempts - 1) % 3
        ];

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!value.trim()) {
      setMessage("La puerta espera una palabra.");
      return;
    }

    setBusy(true);
    let accepted: boolean;
    try {
      accepted = await validate(value);
    } catch {
      setMessage("La puerta no puede escuchar ahora. Inténtalo de nuevo.");
      return;
    } finally {
      setBusy(false);
    }

    if (accepted) {
      (document.activeElement as HTMLElement | null)?.blur();
      onAccepted();
      return;
    }

    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    setMessage(
      experienceConfig.incorrectMessages[
        (nextAttempts - 1) % experienceConfig.incorrectMessages.length
      ],
    );
  }

  return (
    <section
      className="scene gate"
      aria-labelledby="gate-title"
      data-attempt={attempts}
      data-reaction={reaction}
      data-testid="secret-gate"
    >
      <PortalStage
        key={attempts}
        state={attempts > 0 ? "wrong" : "waiting"}
        mode="gate"
      />
      <form className="stone-form" onSubmit={submit}>
        <h2 id="gate-title">La piedra escucha una sola palabra.</h2>
        <p>
          Escríbela como si la estuvieras pronunciando ante el umbral. Si es la
          correcta, la puerta responderá.
        </p>
        <label htmlFor="secret-word">Palabra del camino</label>
        <input
          id="secret-word"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Pronuncia la palabra"
          autoComplete="off"
          spellCheck={false}
        />
        <button disabled={busy} type="submit">
          {busy ? "Escuchando…" : "Despertar la puerta"}
        </button>
        <p
          key={`feedback-${attempts}`}
          data-testid="secret-feedback"
          role="status"
          aria-live="polite"
        >
          {message}
        </p>
        {attempts >= 3 && (
          <p
            className="secret-hint"
            data-testid="secret-hint"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <strong>Pista:</strong> {experienceConfig.hint}
          </p>
        )}
      </form>
    </section>
  );
}
