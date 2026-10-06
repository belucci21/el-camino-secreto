"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

type JourneyPhotoZoomProps = {
  src: string;
  onClose: () => void;
};

export function JourneyPhotoZoom({ src, onClose }: JourneyPhotoZoomProps) {
  const [zoom, setZoom] = useState(1);
  const closeRef = useRef<HTMLButtonElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const zoomAnchor = useRef<{ x: number; y: number } | null>(null);

  const changeZoom = (next: number) => {
    const viewport = viewportRef.current;
    const image = imageRef.current;
    if (viewport && image) {
      const frame = viewport.getBoundingClientRect();
      const picture = image.getBoundingClientRect();
      if (picture.width > 0 && picture.height > 0) {
        zoomAnchor.current = {
          x: (frame.left + viewport.clientWidth / 2 - picture.left) / picture.width,
          y: (frame.top + viewport.clientHeight / 2 - picture.top) / picture.height,
        };
      }
    }
    setZoom(next);
  };

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const image = imageRef.current;
    const anchor = zoomAnchor.current;
    if (!viewport || !image || !anchor) return;
    const frame = viewport.getBoundingClientRect();
    const picture = image.getBoundingClientRect();
    viewport.scrollLeft += picture.left - frame.left + anchor.x * picture.width - viewport.clientWidth / 2;
    viewport.scrollTop += picture.top - frame.top + anchor.y * picture.height - viewport.clientHeight / 2;
    zoomAnchor.current = null;
  }, [zoom]);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  return (
    <div className="journey-photo-zoom-layer">
      <section className="journey-photo-zoom" role="dialog" aria-modal="true" aria-labelledby="journey-photo-zoom-title">
        <header className="journey-photo-zoom__toolbar">
          <h2 id="journey-photo-zoom-title">Detalles importantes</h2>
          <div className="journey-photo-zoom__controls" aria-label="Ampliación de imagen">
            <button type="button" aria-label="Reducir imagen" disabled={zoom === 1} onClick={() => changeZoom(Math.max(1, zoom - 0.5))}>−</button>
            <output aria-live="polite">{Math.round(zoom * 100)} %</output>
            <button type="button" aria-label="Ampliar imagen" disabled={zoom === 3} onClick={() => changeZoom(Math.min(3, zoom + 0.5))}>+</button>
          </div>
          <button ref={closeRef} className="journey-photo-zoom__close" type="button" aria-label="Cerrar imagen ampliada" onClick={onClose}>×</button>
        </header>
        <div ref={viewportRef} className="journey-photo-zoom__viewport" tabIndex={0} aria-label="Imagen ampliada; desliza para explorarla">
          {/* The approved still is served unchanged at its full resolution. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={imageRef} src={src} alt="Detalles importantes de la boda de Gladiola y Jordi" width={1080} height={1920}
            draggable={false} style={{ width: `${zoom * 100}%`, maxWidth: `${zoom * 600}px` }} />
        </div>
        <p className="journey-photo-zoom__hint">Usa + para acercar y desliza la imagen para leerla.</p>
      </section>
    </div>
  );
}
