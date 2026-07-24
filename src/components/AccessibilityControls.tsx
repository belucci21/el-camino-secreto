"use client";

interface AccessibilityControlsProps {
  reducedMotion: boolean;
  soundEnabled: boolean;
  volume: number;
  onToggleMotion: () => void;
  onToggleSound: () => void;
  onVolumeChange: (value: number) => void;
  onSkip: () => void;
}

export function AccessibilityControls(props: AccessibilityControlsProps) {
  return (
    <nav className="accessibility-controls" aria-label="Controles de experiencia">
      <button aria-pressed={props.reducedMotion} onClick={props.onToggleMotion}>
        Movimiento
      </button>
      <button aria-pressed={props.soundEnabled} onClick={props.onToggleSound}>
        Sonido
      </button>
      <label>
        <span>Volumen</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={props.volume}
          onChange={(event) => props.onVolumeChange(Number(event.target.value))}
        />
      </label>
      <button onClick={props.onSkip}>Saltar experiencia</button>
    </nav>
  );
}
