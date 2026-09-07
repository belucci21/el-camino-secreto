"use client";

import { useEffect, type ReactNode } from "react";

type JourneyDialogProps = {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  variant?: "default" | "rsvp";
};

export function JourneyDialog({
  title,
  eyebrow,
  children,
  onClose,
  wide = false,
  variant = "default",
}: JourneyDialogProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="journey-dialog-layer" role="presentation" onMouseDown={onClose}>
      <section
        aria-modal="true"
        className="journey-dialog"
        data-wide={wide}
        data-variant={variant}
        role="dialog"
        aria-labelledby="journey-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="journey-dialog-ornament" aria-hidden="true">
          <span />
          <b>✦</b>
          <span />
        </div>
        {eyebrow && <p className="journey-dialog-eyebrow">{eyebrow}</p>}
        <h2 id="journey-dialog-title">{title}</h2>
        <button className="journey-dialog-close" type="button" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
        {children}
      </section>
    </div>
  );
}
