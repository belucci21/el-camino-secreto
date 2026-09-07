"use client";

import {
  type CSSProperties,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { finalJourneyScenes, type FinalJourneyScene } from "../config/finalJourney";
import { journeyHotspots } from "../config/journeyInteractions";
import { weddingConfig } from "../config/wedding";
import { useAudio } from "../hooks/useAudio";
import { useReducedMotion } from "../hooks/useReducedMotion";
import type { JourneyButtonSurface } from "../types/journey";
import { downloadICS } from "../utils/generateICS";
import { validateSecretWord } from "../utils/secretWord";
import { JourneyDialog } from "./JourneyDialog";
import { JourneySceneMedia } from "./JourneySceneMedia";

const scenes = finalJourneyScenes;
const couple = "Gladiola & Jordi";
// The server renders inert entry controls; hydration enables their real handlers.
const subscribeToClient = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

type DialogState =
  | { kind: "chapters" }
  | { kind: "secret" }
  | { kind: "message"; title: string; eyebrow?: string; body: string }
  | { kind: "rsvp" }
  | { kind: "complete" }
  | null;

const detailCopy: Record<string, { title: string; body: string }> = {
  ceremony: {
    title: "Ceremonia",
    body: `${weddingConfig.event.date.value} · ${weddingConfig.event.ceremonyTime.value}. ${weddingConfig.event.ceremonyVenue.value}, ${weddingConfig.event.ceremonyAddress.value}.`,
  },
  reception: {
    title: "Recepción",
    body: `${weddingConfig.event.celebrationTime.value}. ${weddingConfig.event.celebrationVenue.value}, ${weddingConfig.event.celebrationAddress.value}.`,
  },
  celebration: {
    title: "Celebración",
    body: `${weddingConfig.event.date.value} · ${weddingConfig.event.celebrationTime.value}. ${weddingConfig.event.celebrationVenue.value}, ${weddingConfig.event.celebrationAddress.value}.`,
  },
  dress_code: {
    title: "Código de vestimenta",
    body: weddingConfig.dressCode.value,
  },
  directions: {
    title: "Cómo llegar",
    body: `Ceremonia: ${weddingConfig.event.ceremonyAddress.value}. Celebración: ${weddingConfig.event.celebrationAddress.value}.`,
  },
  magic_ceremony: {
    title: "Ceremonia mágica",
    body: "El primer capítulo de la celebración: un instante creado para compartir promesas, emoción y luz.",
  },
  dinner_toast: {
    title: "Cena y brindis",
    body: "Una mesa compartida, historias que se cruzan y un brindis por el camino que comienza.",
  },
  music_joy: {
    title: "Música y alegría",
    body: "La banda sonora de una noche que seguirá viva mucho después de que se apaguen las luces.",
  },
  lasting_memories: {
    title: "Recuerdos para siempre",
    body: "Cada invitado formará parte de la historia y de los recuerdos que guardaremos para siempre.",
  },
  gift_list: {
    title: "Lista de regalos",
    body: "Nuestra lista de deseos para construir juntos nuestro futuro. Lo más valioso para nosotros es compartir este día contigo.",
  },
  special_message: {
    title: "Mensaje especial",
    body: weddingConfig.finalMessage.value,
  },
  important_details: {
    title: "Detalles importantes",
    body: `${weddingConfig.event.date.value}. Ceremonia a las ${weddingConfig.event.ceremonyTime.value}; celebración a las ${weddingConfig.event.celebrationTime.value}. ${weddingConfig.dressCode.value}.`,
  },
};

function chapterName(scene: FinalJourneyScene) {
  return scene.title;
}

function buttonLabel(surface: JourneyButtonSurface, audioEnabled: boolean) {
  if (surface.id === "music_toggle") {
    return audioEnabled ? "Desactivar música" : "Activar música";
  }
  return surface.visible_label;
}

export function JourneyApp({ initialStep = 1 }: { initialStep?: number }) {
  const entryReady = useSyncExternalStore(subscribeToClient, clientReady, serverReady);
  const [step, setStep] = useState(Math.min(scenes.length, Math.max(1, initialStep)));
  const [experienceStarted, setExperienceStarted] = useState(initialStep !== 1);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [secretWord, setSecretWord] = useState("");
  const [secretStatus, setSecretStatus] = useState<"idle" | "checking" | "wrong">("idle");
  const [rsvpSaved, setRsvpSaved] = useState(false);
  const [playedMotionSteps, setPlayedMotionSteps] = useState<Set<number>>(() => new Set());
  const stageRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const scene = scenes[step - 1];
  const audio = useAudio();
  const { reducedMotion, setReducedMotion } = useReducedMotion();
  const [previousFramePath, setPreviousFramePath] = useState<string>();
  const [imagePath, setImagePath] = useState(scene.frozenFramePath);
  const sceneReady = useCallback((order: number) => {
    const current = scenes[order - 1];
    setImagePath(current.frozenFramePath);
  }, []);
  const hotspots = useMemo(() => journeyHotspots[step] ?? {}, [step]);
  const primarySurface = useMemo(
    () => scene.surfaces.find((surface) => ["start_journey", "continue", "decode_word", "rsvp", "finish"].includes(surface.id)),
    [scene.surfaces],
  );

  const goToStep = useCallback(
    (nextStep: number, showFrozenFrame = false) => {
      const boundedStep = Math.min(scenes.length, Math.max(1, nextStep));
      setDialog(null);
      if (showFrozenFrame) {
        setPlayedMotionSteps((current) => new Set(current).add(boundedStep));
      }
      setPreviousFramePath(showFrozenFrame ? undefined : scene.frozenFramePath);
      setStep(boundedStep);
    },
    [scene.frozenFramePath],
  );

  const markMotionComplete = useCallback((sceneOrder: number) => {
    setPlayedMotionSteps((current) => {
      if (current.has(sceneOrder)) return current;
      const next = new Set(current);
      next.add(sceneOrder);
      return next;
    });
  }, []);

  useEffect(() => {
    const next = scenes.slice(step, step + 2);
    next.forEach((item) => {
      const image = new window.Image();
      image.src = item.frozenFramePath;
      void image.decode?.().catch(() => undefined);
      const firstFrame = new window.Image();
      firstFrame.src = item.firstFramePath;

      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = item.videoPath;
    });
  }, [step]);

  const startWithMusic = useCallback(async () => {
    await audio.start();
    setExperienceStarted(true);
  }, [audio]);

  const startWithoutMusic = useCallback(() => {
    setExperienceStarted(true);
  }, []);

  const openMessage = useCallback((id: string) => {
    const content = detailCopy[id] ?? {
      title: "Pista del camino",
      body: "Escucha, observa y recuerda. La respuesta ya ha aparecido ante ti.",
    };
    setDialog({ kind: "message", ...content });
  }, []);

  const toggleMusic = useCallback(async () => {
    if (audio.enabled) {
      audio.mute();
    } else {
      await audio.start();
    }
  }, [audio]);

  const handleSurface = useCallback(
    async (surface: JourneyButtonSurface) => {
      switch (surface.action) {
        case "toggle_music":
          await toggleMusic();
          break;
        case "open_chapters":
          setDialog({ kind: "chapters" });
          break;
        case "go_to_step":
          goToStep(surface.destination_order ?? step + 1);
          break;
        case "open_secret_word_input":
          setSecretStatus("idle");
          setDialog({ kind: "secret" });
          break;
        case "reveal_hint":
        case "replay_clue":
          openMessage("hint");
          break;
        case "download_calendar_event":
          try {
            downloadICS({
              title: `Boda de ${weddingConfig.couple.firstPerson} y ${weddingConfig.couple.secondPerson}`,
              start: weddingConfig.event.calendarStart.value,
              end: weddingConfig.event.calendarEnd.value,
              location: `${weddingConfig.event.ceremonyVenue.value}, ${weddingConfig.event.ceremonyAddress.value}`,
              description: `Ceremonia a las ${weddingConfig.event.ceremonyTime.value}. Celebración a las ${weddingConfig.event.celebrationTime.value} en ${weddingConfig.event.celebrationVenue.value}.`,
              url: weddingConfig.siteUrl.value,
            });
          } catch {
            setDialog({
              kind: "message",
              eyebrow: "Reserva la fecha",
              title: weddingConfig.event.date.value,
              body: `Ceremonia a las ${weddingConfig.event.ceremonyTime.value}. Celebración a las ${weddingConfig.event.celebrationTime.value}.`,
            });
          }
          break;
        case "open_event_detail":
        case "open_dress_code":
        case "open_directions":
        case "open_celebration_detail":
        case "open_gift_list":
        case "open_special_message":
        case "open_important_details":
          openMessage(surface.id);
          break;
        case "open_map":
          if (weddingConfig.event.mapsUrl.status === "confirmed") {
            window.open(weddingConfig.event.mapsUrl.value, "_blank", "noopener,noreferrer");
          } else {
            setDialog({
              kind: "message",
              eyebrow: "Próximamente",
              title: "Ubicación",
              body: "El mapa se activará aquí cuando la ubicación definitiva quede confirmada.",
            });
          }
          break;
        case "open_rsvp":
          setDialog({ kind: "rsvp" });
          break;
        case "complete_or_replay_journey":
          setDialog({ kind: "complete" });
          break;
      }
    },
    [goToStep, openMessage, step, toggleMusic],
  );

  const submitSecret = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSecretStatus("checking");
      const valid = await validateSecretWord(secretWord);
      if (!valid) {
        setSecretStatus("wrong");
        return;
      }
      audio.playCue("unlock");
      window.setTimeout(() => audio.playCue("opening"), 380);
      goToStep(5);
    },
    [audio, goToStep, secretWord],
  );

  const submitRsvp = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const payload = {
        name: String(form.get("name") ?? ""),
        attendance: String(form.get("attendance") ?? ""),
      };
      window.localStorage.setItem("gj-rsvp-draft", JSON.stringify(payload));
      setRsvpSaved(true);
    },
    [],
  );

  const hotspotButtons = useMemo(
    () =>
      scene.surfaces.map((surface) => {
        if (surface.id === primarySurface?.id) return null;
        const bounds = hotspots[surface.id];
        if (!bounds) return null;
        const style = {
          "--hotspot-x": `${bounds.x}%`,
          "--hotspot-y": `${bounds.y}%`,
          "--hotspot-width": `${bounds.width}%`,
          "--hotspot-height": `${bounds.height}%`,
          "--hotspot-radius": `${bounds.radius ?? 2}rem`,
        } as CSSProperties;

        return (
          <button
            className="journey-hotspot"
            data-control={surface.id === "music_toggle" || surface.id === "chapters_menu"}
            data-action={surface.action}
            key={`${step}-${surface.id}`}
            style={style}
            type="button"
            aria-label={buttonLabel(surface, audio.enabled)}
            onClick={() => void handleSurface(surface)}
          >
            <span className={surface.id === "music_toggle" || surface.id === "chapters_menu" ? "journey-hotspot-label" : "sr-only"}>
              {surface.id === "music_toggle" ? "Música" : buttonLabel(surface, audio.enabled)}
            </span>
            {surface.id === "music_toggle" && audio.enabled && (
              <>
                <span className="journey-audio-live" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <span className="journey-audio-status" aria-hidden="true">ON</span>
              </>
            )}
          </button>
        );
      }),
    [audio.enabled, handleSurface, hotspots, primarySurface?.id, scene.surfaces, step],
  );

  return (
    <main
      className="journey-app"
      id="main-content"
      data-step={step}
      data-reduced-motion={reducedMotion}
    >
      <div className="journey-backdrop" aria-hidden="true">
        {/* The accepted artwork must be served byte-for-byte without an image optimizer. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imagePath} alt="" />
      </div>
      <div className="journey-ambient-glow" aria-hidden="true" />

      <section
        className="journey-shell"
        aria-label={`Paso ${step} de ${scenes.length}: ${chapterName(scene)}`}
        ref={stageRef}
      >
        <div className="journey-scene-extension" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imagePath} alt="" />
        </div>
        <div className="journey-reference-frame">
          <div className="journey-reference-plane" ref={visualRef}>
            <div className="journey-scene-visual">
              <JourneySceneMedia
                key={scene.order}
                sceneOrder={scene.order}
                title={scene.title}
                videoPath={scene.videoPath}
                frozenFramePath={scene.frozenFramePath}
                firstFramePath={scene.firstFramePath}
                previousFramePath={previousFramePath}
                holdFrameAt={scene.holdFrameAt}
                hasNarration={scene.hasNarration}
                interactionReadyAt={scene.interactionReadyAt}
                narrationWindows={scene.narrationWindows}
                audioEnabled={audio.enabled}
                paused={dialog !== null}
                onNarrationChange={audio.setNarrationActive}
                onSceneReady={sceneReady}
                couple={couple}
                reducedMotion={reducedMotion}
                motionEnabled={experienceStarted && !playedMotionSteps.has(step)}
                onMotionComplete={markMotionComplete}
                priority={step <= 2}
              />
            </div>
            <div className="journey-hotspots">{hotspotButtons}</div>
            {primarySurface && (
              <button
                className="journey-primary-action"
                type="button"
                onClick={() => void handleSurface(primarySurface)}
              >
                <span>{primarySurface.visible_label}</span>
                <b aria-hidden="true">→</b>
              </button>
            )}
          </div>
        </div>
        <div className="journey-vignette" aria-hidden="true" />
        <div className="journey-grain" aria-hidden="true" />


        {!experienceStarted && (
          <div
            className="journey-entry-gate"
            role="dialog"
            aria-modal="true"
            aria-label="Comenzar la experiencia"
          >
            <div className="journey-entry-gate__content">
              <p>Gladiola &amp; Jordi</p>
              <h1>{"El camino comienza aqu\u00ed"}</h1>
              <button type="button" disabled={!entryReady} onClick={() => void startWithMusic()}>
                <span aria-hidden="true">{"\u266a"}</span>
                {"Entrar con m\u00fasica"}
              </button>
              <button type="button" disabled={!entryReady} className="journey-entry-gate__silent" onClick={startWithoutMusic}>
                Continuar sin sonido
              </button>
            </div>
          </div>
        )}

        {experienceStarted && (
          <button
            className="journey-motion-control"
            type="button"
            aria-label={reducedMotion ? "Activar movimiento" : "Reducir movimiento"}
            onClick={() => setReducedMotion(!reducedMotion)}
          >
            {reducedMotion ? "Movimiento reducido" : "Movimiento"}
          </button>
        )}

        <p className="sr-only" aria-live="polite">
          {`Paso ${step}: ${scene.title}`}
        </p>
      </section>

      {dialog?.kind === "chapters" && (
        <JourneyDialog title="Capítulos" eyebrow="El Camino Secreto" onClose={() => setDialog(null)} wide>
          <nav className="journey-chapters" aria-label="Navegación por capítulos">
            {scenes.slice(1).map((item) => (
              <button
                key={item.id}
                type="button"
                data-current={item.order === step}
                onClick={() => goToStep(item.order, true)}
              >
                <span>{String(item.order).padStart(2, "0")}</span>
                {chapterName(item)}
              </button>
            ))}
          </nav>
        </JourneyDialog>
      )}

      {dialog?.kind === "secret" && (
        <JourneyDialog title="La palabra del umbral" eyebrow="El acertijo" onClose={() => setDialog(null)}>
          <p className="journey-dialog-copy">
            Hay puertas que solo se abren para quienes recuerdan la palabra correcta.
          </p>
          <form className="journey-secret-form" onSubmit={submitSecret}>
            <label htmlFor="secret-word">Di la palabra y entra</label>
            <input
              autoFocus
              autoComplete="off"
              id="secret-word"
              name="secret-word"
              value={secretWord}
              onChange={(event) => {
                setSecretWord(event.target.value);
                setSecretStatus("idle");
              }}
              aria-invalid={secretStatus === "wrong"}
            />
            {secretStatus === "wrong" && (
              <p role="alert">El bosque permanece en silencio. Escucha, observa y recuerda.</p>
            )}
            <button type="submit" disabled={secretStatus === "checking" || !secretWord.trim()}>
              {secretStatus === "checking" ? "El umbral escucha…" : "Abrir la puerta"}
              <span aria-hidden="true">→</span>
            </button>
          </form>
        </JourneyDialog>
      )}

      {dialog?.kind === "message" && (
        <JourneyDialog
          title={dialog.title}
          eyebrow={dialog.eyebrow ?? "Un detalle del camino"}
          onClose={() => setDialog(null)}
        >
          <p className="journey-dialog-copy">{dialog.body}</p>
          <button className="journey-dialog-primary" type="button" onClick={() => setDialog(null)}>
            Volver al camino
          </button>
        </JourneyDialog>
      )}

      {dialog?.kind === "rsvp" && (
        <JourneyDialog
          title="Confirma tu asistencia"
          eyebrow="El Libro del Vínculo Eterno"
          onClose={() => setDialog(null)}
          variant="rsvp"
        >
          {rsvpSaved ? (
            <>
              <p className="journey-dialog-copy">
                Tu respuesta se ha guardado en este dispositivo. El envío definitivo se activará
                cuando los novios confirmen el canal de RSVP.
              </p>
              <button className="journey-dialog-primary" type="button" onClick={() => goToStep(primarySurface?.destination_order ?? step + 1)}>
                Continuar al cofre
              </button>
            </>
          ) : (
            <div className="journey-rsvp-artwork">
              {!reducedMotion && (
                <video
                  aria-hidden="true"
                  autoPlay
                  className="journey-rsvp-artwork__background"
                  data-testid="journey-rsvp-background"
                  loop
                  muted
                  playsInline
                  preload="metadata"
                >
                  <source src={scene.rsvpMedia?.backgroundVideoPath} type="video/mp4" />
                </video>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="Arte de asistencia"
                className="journey-rsvp-artwork__panel"
                src={scene.rsvpMedia?.attendanceArtworkPath}
              />
              <form className="journey-rsvp-form" onSubmit={submitRsvp}>
                <label htmlFor="guest-name">Nombre</label>
                <input id="guest-name" name="name" required />
                <fieldset>
                  <legend>¿Nos acompañas?</legend>
                  <label>
                    <input type="radio" name="attendance" value="yes" required /> Sí, caminaré con
                    vosotros
                  </label>
                  <label>
                    <input type="radio" name="attendance" value="no" /> No podré acompañaros
                  </label>
                </fieldset>
                <button type="submit">Inscribir mi respuesta</button>
              </form>
            </div>
          )}
          {!rsvpSaved && (
            <button className="journey-dialog-secondary" type="button" onClick={() => goToStep(primarySurface?.destination_order ?? step + 1)}>
              Continuar al cofre sin responder
            </button>
          )}
        </JourneyDialog>
      )}

      {dialog?.kind === "complete" && (
        <JourneyDialog title="El viaje apenas comienza" eyebrow="Gladiola & Jordi" onClose={() => setDialog(null)}>
          <p className="journey-dialog-copy">
            Gracias por recorrer este camino y formar parte de nuestra historia.
          </p>
          <button className="journey-dialog-primary" type="button" onClick={() => goToStep(2)}>
            Recorrer de nuevo
          </button>
        </JourneyDialog>
      )}
    </main>
  );
}
