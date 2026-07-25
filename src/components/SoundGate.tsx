"use client";

interface SoundGateProps {
  reducedMotion: boolean;
  onEnter: (soundEnabled: boolean) => void;
  onToggleReducedMotion: () => void;
  onSkipMotion: () => void;
}

export function SoundGate({
  reducedMotion,
  onEnter,
  onToggleReducedMotion,
  onSkipMotion,
}: SoundGateProps) {
  return (
    <section className="scene threshold" aria-labelledby="threshold-title">
      <div className="threshold-mark" aria-hidden="true">
        G&amp;J
      </div>
      <h2 id="threshold-title">Hay puertas que no aparecen en ningún mapa.</h2>
      <p>Si has llegado hasta aquí, el camino ya te reconoce.</p>
      <div className="actions">
        <button onClick={() => onEnter(true)}>Entrar con música</button>
        <button onClick={() => onEnter(false)}>Entrar en silencio</button>
        <button aria-pressed={reducedMotion} onClick={onToggleReducedMotion}>
          {reducedMotion ? "Restaurar movimiento" : "Reducir movimiento"}
        </button>
        <button onClick={onSkipMotion}>Continuar sin animación</button>
      </div>
    </section>
  );
}
