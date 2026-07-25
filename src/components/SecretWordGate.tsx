"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import { experienceConfig } from "../config/experience";
import { validateSecretWord } from "../utils/secretWord";
import { PortalStage } from "./PortalStage";

interface SecretWordGateProps {
  validate?: (value: string) => Promise<boolean>;
  onAccepted: () => void;
}

type GatePhase = "waiting" | "typing" | "wrong" | "accepted";

export function SecretWordGate({
  validate = validateSecretWord,
  onAccepted,
}: SecretWordGateProps) {
  const [value, setValue] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<GatePhase>("waiting");
  const reaction =
    attempts === 0
      ? "waiting"
      : (["warning", "flicker", "resonance"] as const)[
          (attempts - 1) % 3
        ];
  const portalState =
    phase === "typing" || phase === "accepted"
      ? "awake"
      : phase === "wrong"
        ? "wrong"
        : "waiting";
  const typedProgress = Math.min(value.trim().length / 5, 1);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!value.trim()) {
      setPhase("waiting");
      setMessage("La puerta espera una palabra.");
      return;
    }

    setBusy(true);
    let accepted: boolean;
    try {
      accepted = await validate(value);
    } catch {
      setPhase("wrong");
      setMessage("La puerta no puede escuchar ahora. Inténtalo de nuevo.");
      return;
    } finally {
      setBusy(false);
    }

    if (accepted) {
      (document.activeElement as HTMLElement | null)?.blur();
      setPhase("accepted");
      setMessage("La palabra ha sido reconocida.");
      onAccepted();
      return;
    }

    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    setPhase("wrong");
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
      data-phase={phase}
      data-testid="secret-gate"
      style={{ "--typed-progress": typedProgress } as CSSProperties}
    >
      <div className="gate-portal-stage">
        <PortalStage
          key={attempts}
          state={portalState}
          mode="gate"
          label="Puerta ceremonial esperando la palabra del camino"
        />
        <div className="gate-rune-orbit" aria-hidden="true">
          {Array.from({ length: 12 }, (_, index) => (
            <span
              key={index}
              style={{ "--rune-index": index } as CSSProperties}
            />
          ))}
        </div>
        <div className="gate-recognition-mark" aria-hidden="true">
          G&amp;J
        </div>
      </div>
      <form
        className="stone-form secret-pedestal"
        data-phase={phase}
        onSubmit={submit}
      >
        <span className="pedestal-kicker">El umbral escucha</span>
        <h2 id="gate-title">La puerta reconoce una sola palabra.</h2>
        <p>
          Pronúnciala ante la piedra. Si es la correcta, el camino se abrirá.
        </p>
        <div className="secret-entry-row">
          <div className="secret-field-shell">
            <label htmlFor="secret-word">Palabra del camino</label>
            <input
              id="secret-word"
              value={value}
              onChange={(event) => {
                const nextValue = event.target.value;
                setValue(nextValue);
                if (phase !== "accepted") {
                  setPhase(nextValue.trim() ? "typing" : "waiting");
                  setMessage("");
                }
              }}
              placeholder="Escribe la palabra"
              autoComplete="off"
              spellCheck={false}
              disabled={phase === "accepted"}
              aria-describedby="secret-feedback"
            />
            <span className="secret-rune-meter" aria-hidden="true">
              {Array.from({ length: 5 }, (_, index) => (
                <i key={index} />
              ))}
            </span>
          </div>
          <button
            disabled={busy || phase === "accepted"}
            type="submit"
          >
            {phase === "accepted"
              ? "Palabra reconocida"
              : busy
                ? "Escuchando…"
                : "Despertar la puerta"}
          </button>
        </div>
        <p
          id="secret-feedback"
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
