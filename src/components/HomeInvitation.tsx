"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useAudio } from "../hooks/useAudio";
import { useDeviceCapabilities } from "../hooks/useDeviceCapabilities";
import { useReducedMotion } from "../hooks/useReducedMotion";
import type {
  PortalMode,
  PortalVisualState,
} from "./PortalCanvas";

const PortalStage = dynamic(
  () => import("./PortalStage").then((module) => module.PortalStage),
  {
    ssr: false,
    loading: () => <div className="ritual-portal-placeholder" aria-hidden="true" />,
  },
);

const CHAPTERS = [
  {
    id: "breath",
    start: 0.01,
    end: 0.24,
    line: "Sigue la luz",
    detail: "El camino recuerda tus pasos.",
  },
  {
    id: "forest",
    start: 0.22,
    end: 0.47,
    line: "El bosque se aparta",
    detail: "Algo antiguo comienza a despertar.",
  },
  {
    id: "portal",
    start: 0.45,
    end: 0.7,
    line: "El umbral te reconoce",
    detail: "Acércate. La puerta está escuchando.",
  },
] as const;

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function chapterOpacity(progress: number, start: number, end: number) {
  const fade = Math.min(0.065, (end - start) / 3);
  return clamp(
    Math.min((progress - start) / fade, (end - progress) / fade),
  );
}

function getPortalState(progress: number): PortalVisualState {
  if (progress >= 0.78) return "open";
  if (progress >= 0.5) return "awake";
  if (progress >= 0.22) return "waiting";
  return "distant";
}

function getPortalMode(progress: number): PortalMode {
  if (progress >= 0.78) return "opening";
  if (progress >= 0.42) return "approach";
  return "discovery";
}

function SoundIcon({ enabled }: { enabled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 9.4v5.2h3.7l4.8 4V5.4l-4.8 4H4Z" />
      {enabled ? (
        <>
          <path d="M16 8.1a5.5 5.5 0 0 1 0 7.8" />
          <path d="M18.8 5.4a9.3 9.3 0 0 1 0 13.2" />
        </>
      ) : (
        <path d="m16.2 9.1 4.7 4.7m0-4.7-4.7 4.7" />
      )}
    </svg>
  );
}

export function HomeInvitation() {
  const audio = useAudio();
  const motion = useReducedMotion();
  const tier = useDeviceCapabilities(motion.reducedMotion);
  const journeyRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const [started, setStarted] = useState(false);
  const [progress, setProgress] = useState(0);

  const updateProgress = useCallback(() => {
    rafRef.current = null;
    const journey = journeyRef.current;
    if (!journey || !started) return;

    const travel = Math.max(1, journey.offsetHeight - window.innerHeight);
    const next = clamp((window.scrollY - journey.offsetTop) / travel);
    setProgress((current) =>
      Math.abs(current - next) < 0.001 ? current : next,
    );
  }, [started]);

  useEffect(() => {
    if (!started) return;

    const requestUpdate = () => {
      if (rafRef.current === null) {
        rafRef.current = window.requestAnimationFrame(updateProgress);
      }
    };

    updateProgress();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
    };
  }, [started, updateProgress]);

  useEffect(() => {
    if (!started && window.scrollY !== 0) window.scrollTo(0, 0);
  }, [started]);

  const begin = (withMusic: boolean) => {
    if (withMusic) void audio.start();
    setStarted(true);
    window.sessionStorage.setItem(
      "el-camino-audio-preference",
      withMusic ? "on" : "off",
    );
  };

  const portalState = getPortalState(progress);
  const portalMode = getPortalMode(progress);
  const revealOpacity = clamp((progress - 0.7) / 0.2);
  const sceneStyle = useMemo(
    () =>
      ({
        "--ritual-progress": progress,
        "--reveal-opacity": revealOpacity,
      }) as CSSProperties,
    [progress, revealOpacity],
  );

  return (
    <div
      className="scroll-invitation"
      data-started={started ? "true" : "false"}
      data-reduced-motion={motion.reducedMotion ? "true" : "false"}
    >
      <div ref={journeyRef} className="ritual-journey">
        <div className="ritual-sticky" style={sceneStyle}>
          <div className="ritual-backdrop" aria-hidden="true">
            <div className="ritual-mountains" />
            <div className="ritual-forest ritual-forest-far" />
            <div className="ritual-forest ritual-forest-near" />
            <div className="ritual-vignette" />
          </div>

          <div className="ritual-particles" aria-hidden="true">
            {Array.from({ length: 22 }, (_, index) => (
              <span
                key={index}
                style={
                  {
                    "--spark-index": index,
                    "--spark-x": `${(index * 47) % 101}%`,
                    "--spark-y": `${(index * 71) % 97}%`,
                    "--spark-size": `${1 + (index % 3)}px`,
                  } as CSSProperties
                }
              />
            ))}
          </div>

          <div className="ritual-portal-wrap" aria-hidden={!started}>
            <PortalStage
              state={portalState}
              mode={portalMode}
              progress={progress}
              variant="artwork"
              reducedMotion={motion.reducedMotion}
              tier={tier}
              label="Portal ceremonial que se abre al avanzar por el camino"
            />
          </div>

          <div className="ritual-frame" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>

          <section
            className="ritual-seal"
            aria-labelledby="ritual-seal-title"
            aria-hidden={started}
          >
            <div className="ritual-seal-mark" aria-hidden="true">
              <span className="ritual-seal-ring" />
              <span className="ritual-seal-ring ritual-seal-ring-inner" />
              <strong>G&amp;J</strong>
            </div>
            <p>Gladiola &amp; Jordi</p>
            <h1 id="ritual-seal-title">La invitación está sellada</h1>
            <div className="ritual-entry-actions">
              <button
                className="ritual-open-button"
                type="button"
                onClick={() => begin(true)}
              >
                Comenzar el camino
              </button>
              <button
                className="ritual-silent-button"
                type="button"
                onClick={() => begin(false)}
              >
                Entrar sin música
              </button>
              <a className="ritual-gate-link" href="/experiencia">
                Ir directamente a la puerta
                <span aria-hidden="true">→</span>
              </a>
            </div>
            <small>
              Recorre el camino o entra directamente con la palabra secreta
            </small>
          </section>

          <div className="ritual-narrative" aria-live="polite">
            {CHAPTERS.map((chapter, index) => {
              const opacity = chapterOpacity(
                progress,
                chapter.start,
                chapter.end,
              );
              return (
                <section
                  className="ritual-chapter"
                  data-chapter={chapter.id}
                  key={chapter.id}
                  aria-hidden={!started || opacity < 0.08}
                  style={
                    {
                      "--chapter-opacity": opacity,
                      "--chapter-shift": `${(1 - opacity) * 24}px`,
                    } as CSSProperties
                  }
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h2>{chapter.line}</h2>
                  <p>{chapter.detail}</p>
                </section>
              );
            })}

            <section
              className="ritual-reveal"
              aria-hidden={!started || revealOpacity < 0.12}
            >
              <p className="ritual-couple">Gladiola &amp; Jordi</p>
              <h2>
                El Camino
                <span>Secreto</span>
              </h2>
              <p className="ritual-coming-soon">COMING SOON</p>
              <a className="ritual-cross-link" href="/experiencia">
                Cruzar el umbral
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12h13m-5-5 5 5-5 5" />
                </svg>
              </a>
            </section>
          </div>

          {started ? (
            <>
              <div className="ritual-tools" aria-label="Controles de la experiencia">
                <button
                  type="button"
                  aria-label={audio.enabled ? "Silenciar música" : "Activar música"}
                  aria-pressed={audio.enabled}
                  onClick={() =>
                    audio.enabled ? audio.mute() : void audio.start()
                  }
                >
                  <SoundIcon enabled={audio.enabled} />
                </button>
                <button
                  type="button"
                  aria-label="Movimiento"
                  aria-pressed={motion.reducedMotion}
                  onClick={() =>
                    motion.setReducedMotion(!motion.reducedMotion)
                  }
                >
                  <span aria-hidden="true">≈</span>
                </button>
              </div>

              <div className="ritual-progress" aria-hidden="true">
                <span
                  style={{ transform: `scaleY(${Math.max(0.015, progress)})` }}
                />
              </div>

              <p
                className="ritual-scroll-hint"
                data-hidden={progress > 0.08 ? "true" : "false"}
              >
                Desliza para despertar el camino
                <span aria-hidden="true">↓</span>
              </p>
            </>
          ) : null}

          {!audio.available ? (
            <p className="ritual-audio-error" role="status">
              La música no pudo iniciarse. El camino continúa en silencio.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
