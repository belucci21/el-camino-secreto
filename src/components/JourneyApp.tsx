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
import { useDialogViewport } from "../hooks/useDialogViewport";
import { submitJourneyResponse } from "../utils/submitJourneyResponse";
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
  | { kind: "detail"; panel: "music" | "song" | "thanks" | "memories" | "contact" }
  | { kind: "complete" }
  | null;

type RsvpDraft = {
  name: string;
  attendance: string;
  companions: string;
  allergies: string;
  menu: string;
  message: string;
};

function whatsappHref(message: string) {
  return `https://wa.me/${weddingConfig.rsvpWhatsApp.value.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
}

const detailCopy: Record<string, { title: string; body: string }> = {
  hint: {
    title: "Pista del camino",
    body: "Di la palabra amigo.",
  },
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
  const [rsvpDraft, setRsvpDraft] = useState<RsvpDraft | null>(null);
  const [song, setSong] = useState("");
  const [submissionPending, setSubmissionPending] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const rsvpId = useRef<string>("");
  const songId = useRef<string>("");
  useDialogViewport(dialog !== null);
  const [playedMotionSteps, setPlayedMotionSteps] = useState<Set<number>>(() => new Set());
  const [activatedMotionSteps, setActivatedMotionSteps] = useState<Set<number>>(() => new Set());
  const stageRef = useRef<HTMLDivElement>(null);
  const navigationRef = useRef(0);
  const navigationBusyRef = useRef(false);
  const activeStepRef = useRef(step);
  const scene = scenes[step - 1];
  const audio = useAudio();
  const { ensureContinuity, preloadNarration, syncNarration } = audio;
  const { reducedMotion, setReducedMotion } = useReducedMotion();
  const [imagePath, setImagePath] = useState(scene.frozenFramePath);
  const [backgroundBefore, setBackgroundBefore] = useState(scene.frozenFramePath);
  const backgroundRef = useRef(scene.frozenFramePath);
  const sceneReady = useCallback((order: number, final: boolean) => {
    if (order !== activeStepRef.current) return;
    const current = scenes[order - 1];
    const next = final ? current.frozenFramePath : current.firstFramePath;
    if (backgroundRef.current === next) return;
    setBackgroundBefore(backgroundRef.current);
    backgroundRef.current = next;
    setImagePath(next);
  }, []);
  const hotspots = useMemo(() => journeyHotspots[step] ?? {}, [step]);
  const primarySurface = useMemo(
    () => scene.surfaces.find((surface) => ["start_journey", "continue", "decode_word", "rsvp", "finish"].includes(surface.id)),
    [scene.surfaces],
  );
  const primaryBounds = primarySurface ? hotspots[primarySurface.id] : undefined;
  const renderPrimary = primarySurface && scene.renderedControls?.includes(primarySurface.id);
  const primaryStyle = primaryBounds
    ? {
        "--hotspot-x": `${primaryBounds.x}%`,
        "--hotspot-y": `${primaryBounds.y}%`,
        "--hotspot-width": `${primaryBounds.width}%`,
        "--hotspot-height": `${primaryBounds.height}%`,
        "--hotspot-radius": `${primaryBounds.radius ?? 2}rem`,
      } as CSSProperties
    : undefined;

  const goToStep = useCallback(
    async (nextStep: number, showFrozenFrame = false) => {
      if (navigationBusyRef.current) return;
      navigationBusyRef.current = true;
      // Keep the already-running ambient track alive while iOS swaps the
      // native video element for the next scene. This never resets its seek.
      void ensureContinuity();
      const boundedStep = Math.min(scenes.length, Math.max(1, nextStep));
      const navigation = ++navigationRef.current;
      // Keep the current scene running while decoding the incoming poster.
      // Never read back the native video into a canvas: on iOS that stalls the
      // tap and dissolving it over a second film produces a double-image flash.
      const nextScene = scenes[boundedStep - 1];
      const frozen = showFrozenFrame || reducedMotion || playedMotionSteps.has(boundedStep);
      const frame = new window.Image();
      frame.src = frozen ? nextScene.frozenFramePath : nextScene.firstFramePath;
      try { await frame.decode?.(); } catch { /* A failed poster must not block navigation. */ }
      if (navigation !== navigationRef.current) return;
      setDialog(null);
      if (showFrozenFrame) {
        setPlayedMotionSteps((current) => new Set(current).add(boundedStep));
      }
      activeStepRef.current = boundedStep;
      sceneReady(boundedStep, frozen);
      setStep(boundedStep);
      navigationBusyRef.current = false;
    },
    [ensureContinuity, playedMotionSteps, reducedMotion, sceneReady],
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
    const next = scenes.slice(step - 1, step + 2);
    preloadNarration(next.flatMap((item) => item.narrationPath ? [item.narrationPath] : []));
    next.forEach((item) => {
      const image = new window.Image();
      image.src = item.frozenFramePath;
      void image.decode?.().catch(() => undefined);
      const firstFrame = new window.Image();
      firstFrame.src = item.firstFramePath;
      void firstFrame.decode?.().catch(() => undefined);

    });
  }, [preloadNarration, step]);

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
          if (surface.id === "continue" && scene.revealOnContinue && !playedMotionSteps.has(step)) {
            if (!activatedMotionSteps.has(step)) {
              setActivatedMotionSteps((current) => new Set(current).add(step));
              // A silent reduced-motion visit has no media to finish naturally.
              if (reducedMotion && !audio.enabled) markMotionComplete(step);
            }
            break;
          }
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
          setSubmissionError("");
          setDialog({ kind: "rsvp" });
          break;
        case "open_music_prompt":
          setSubmissionError("");
          setDialog({ kind: "detail", panel: "music" });
          break;
        case "open_memories":
          setDialog({ kind: "detail", panel: "memories" });
          break;
        case "open_contact":
          setDialog({ kind: "detail", panel: "contact" });
          break;
        case "open_ceremony_map":
          window.open(weddingConfig.event.ceremonyMapsUrl.value, "_blank", "noopener,noreferrer");
          break;
        case "complete_or_replay_journey":
          setDialog({ kind: "complete" });
          break;
      }
    },
    [activatedMotionSteps, audio.enabled, goToStep, markMotionComplete, openMessage, playedMotionSteps, reducedMotion, scene.revealOnContinue, step, toggleMusic],
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
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (submissionPending) return;
      const form = new FormData(event.currentTarget);
      const payload: RsvpDraft = {
        name: String(form.get("name") ?? ""),
        attendance: String(form.get("attendance") ?? ""),
        companions: String(form.get("companions") ?? "0"),
        allergies: String(form.get("allergies") ?? ""),
        menu: String(form.get("menu") ?? ""),
        message: String(form.get("message") ?? ""),
      };
      setRsvpDraft(payload);
      setSubmissionPending(true);
      setSubmissionError("");
      rsvpId.current ||= crypto.randomUUID();
      try {
        await submitJourneyResponse({ kind: "rsvp", id: rsvpId.current, ...payload });
        setRsvpSaved(true);
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      } catch {
        setSubmissionError("No se ha podido enviar. Tus datos siguen aquí; vuelve a intentarlo.");
      } finally { setSubmissionPending(false); }
    },
    [submissionPending],
  );

  const submitSong = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!song.trim() || submissionPending) return;
    setSubmissionPending(true);
    setSubmissionError("");
    songId.current ||= crypto.randomUUID();
    try {
      await submitJourneyResponse({ kind: "song", id: songId.current, song: song.trim() });
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      setDialog(current => current?.kind === "detail" && current.panel === "song" ? { kind: "detail", panel: "thanks" } : current);
    } catch {
      setSubmissionError("No se ha podido enviar. Tu canción sigue aquí; vuelve a intentarlo.");
    } finally { setSubmissionPending(false); }
  };

  const hotspotButtons = scene.surfaces.map((surface) => {
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
            className={`journey-hotspot${scene.renderedControls?.includes(surface.id) ? " journey-hotspot--rendered" : ""}`}
            data-control={surface.id === "music_toggle" || surface.id === "chapters_menu"}
            data-action={surface.action}
            data-surface={surface.id}
            key={`${step}-${surface.id}`}
            style={style}
            type="button"
            aria-label={buttonLabel(surface, audio.enabled)}
            onClick={() => void handleSurface(surface)}
          >
            <span className="sr-only">
              {surface.id === "music_toggle" ? "Música" : buttonLabel(surface, audio.enabled)}
            </span>
            {scene.renderedControls?.includes(surface.id) && (
              <span className="journey-rendered-control" aria-hidden="true">
                {surface.id === "music_toggle" ? <span className="journey-rendered-icon">♪</span> : (
                  <svg className="journey-rendered-icon" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M16 8C12 5 7 5 3 6v20c4-1 9-1 13 2 4-3 9-3 13-2V6c-4-1-9-1-13 2Zm0 0v20" />
                  </svg>
                )}
                <span className="journey-rendered-label">{surface.visible_label}</span>
              </span>
            )}
            {surface.id === "save_date" && (
              <span className="journey-save-date-label" aria-hidden="true">Guardar fecha</span>
            )}
            {surface.id === "music_toggle" && audio.enabled && (
              <span className="journey-audio-live" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            )}
          </button>
        );
      });

  const awaitingSceneReveal = !!scene.revealOnContinue && !activatedMotionSteps.has(step) && !playedMotionSteps.has(step);
  const sceneRevealPlaying = !!scene.revealOnContinue && activatedMotionSteps.has(step) && !playedMotionSteps.has(step);

  return (
    <main
      className="journey-app"
      id="main-content"
      data-step={step}
      data-scene={scene.id}
      data-reduced-motion={reducedMotion}
    >
      <div className="journey-backdrop" aria-hidden="true">
        {/* The accepted artwork must be served byte-for-byte without an image optimizer. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={backgroundBefore} alt="" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={imagePath} src={imagePath} alt="" />
      </div>
      <div className="journey-ambient-glow" aria-hidden="true" />

      <section
        className="journey-shell"
        aria-label={`Paso ${step} de ${scenes.length}: ${chapterName(scene)}`}
        ref={stageRef}
      >
        <div className="journey-scene-extension" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={backgroundBefore} alt="" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img key={imagePath} src={imagePath} alt="" />
        </div>
        <div className="journey-reference-frame" style={{ "--journey-ratio": scene.aspectRatio ?? 9 / 16 } as CSSProperties}>
          <div className="journey-reference-plane">
            <div className="journey-scene-visual">
              <JourneySceneMedia
                key={scene.order}
                sceneOrder={scene.order}
                title={scene.title}
                videoPath={scene.videoPath}
                frozenFramePath={scene.frozenFramePath}
                firstFramePath={scene.firstFramePath}
                holdFrameAt={scene.holdFrameAt}
                hasNarration={scene.hasNarration}
                narrationPath={scene.narrationPath}
                interactionReadyAt={scene.interactionReadyAt}
                narrationWindows={scene.narrationWindows}
                audioEnabled={audio.enabled}
                paused={dialog !== null}
                onNarrationChange={audio.setNarrationActive}
                onNarrationSync={syncNarration}
                onPlaybackStart={ensureContinuity}
                onSceneReady={sceneReady}
                couple={couple}
                reducedMotion={reducedMotion}
                motionEnabled={experienceStarted && !playedMotionSteps.has(step) && !awaitingSceneReveal}
                awaitingStart={awaitingSceneReveal}
                onMotionComplete={markMotionComplete}
                priority={step <= 2}
              />
            </div>
            <div className="journey-hotspots">{hotspotButtons}</div>
            {primarySurface && primaryBounds && (
              <button
                className={`journey-primary-action${renderPrimary ? " journey-primary-action--visible" : ""}`}
                data-shimmer={step === 5 && (playedMotionSteps.has(5) || reducedMotion)}
                style={primaryStyle}
                type="button"
                disabled={sceneRevealPlaying}
                onClick={() => void handleSurface(primarySurface)}
              >
                <span className={renderPrimary ? "" : "sr-only"}>{primarySurface.visible_label}</span>
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
        <JourneyDialog title="Capítulos" eyebrow="El vínculo eterno" onClose={() => setDialog(null)} wide>
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
              autoComplete="off"
              autoCapitalize="none"
              enterKeyHint="go"
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="journey-rsvp-decor" src={scene.rsvpArtworkPath} alt="" aria-hidden="true" />
          {rsvpSaved && rsvpDraft ? (
            <>
              <p className="journey-dialog-copy" role="status">
                ¡Gracias! Tu respuesta se ha enviado a Gladiola y Jordi.
              </p>
              <button className="journey-dialog-secondary" type="button" onClick={() => setRsvpSaved(false)}>
                Editar respuesta
              </button>
              <button className="journey-dialog-secondary" type="button" onClick={() => goToStep(12)}>
                Continuar el camino
              </button>
            </>
          ) : (
            <form className="journey-rsvp-form-final" onSubmit={submitRsvp}>
              <p>Confirma antes del {weddingConfig.rsvpDeadline.value}.</p>
              <label htmlFor="guest-name">Nombre completo</label>
              <input id="guest-name" name="name" defaultValue={rsvpDraft?.name} autoComplete="name" required />
              <fieldset>
                <legend>¿Asistirás?</legend>
                <label><input type="radio" name="attendance" value="yes" defaultChecked={rsvpDraft?.attendance === "yes"} required /> Sí, no me lo pierdo</label>
                <label><input type="radio" name="attendance" value="no" defaultChecked={rsvpDraft?.attendance === "no"} /> No podré asistir</label>
              </fieldset>
              <label htmlFor="guest-companions">Número de acompañantes</label>
              <select id="guest-companions" name="companions" defaultValue={rsvpDraft?.companions ?? "0"}>
                {[0, 1, 2, 3, 4, 5].map((count) => <option key={count} value={count}>{count}</option>)}
              </select>
              <label htmlFor="guest-allergies">Alergias o restricciones alimentarias</label>
              <textarea id="guest-allergies" name="allergies" defaultValue={rsvpDraft?.allergies} rows={2} />
              <label htmlFor="guest-menu">Menú preferido</label>
              <select id="guest-menu" name="menu" defaultValue={rsvpDraft?.menu ?? ""}>
                <option value="">Selecciona una opción</option>
                <option value="Carne">Carne</option>
                <option value="Pescado">Pescado</option>
                <option value="Vegetariano">Vegetariano</option>
              </select>
              <label htmlFor="guest-message">Déjanos un mensaje</label>
              <textarea id="guest-message" name="message" defaultValue={rsvpDraft?.message} rows={2} />
              {submissionError && <p role="alert">{submissionError}</p>}
              <button type="submit" disabled={submissionPending}>{submissionPending ? "Enviando…" : "Confirmar mi asistencia"}</button>
            </form>
          )}
          {!rsvpSaved && (
            <button className="journey-dialog-secondary" type="button" onClick={() => goToStep(12)}>
              Continuar sin responder
            </button>
          )}
        </JourneyDialog>
      )}

      {dialog?.kind === "detail" && scene.detailArtwork && (
        <div className="journey-detail-layer" role="presentation" onMouseDown={() => setDialog(null)}>
          <section className="journey-detail-panel" role="dialog" aria-modal="true" aria-label={
            dialog.panel === "music" ? "Música y alegría" : dialog.panel === "song" ? "Sugiere una canción" : dialog.panel === "thanks" ? "Canción enviada" : dialog.panel === "memories" ? "Recuerdos para siempre" : "Contacto"
          } onMouseDown={(event) => event.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={scene.detailArtwork[dialog.panel]} alt="" aria-hidden="true" />
            <button className="journey-detail-close" type="button" aria-label="Cerrar" onClick={() => setDialog(null)}>×</button>
            {dialog.panel === "music" && (
              <button className="journey-detail-hotspot journey-detail-hotspot--bottom" type="button" onClick={() => setDialog({ kind: "detail", panel: "song" })}>
                <span className="sr-only">Continuar para sugerir una canción</span>
              </button>
            )}
            {dialog.panel === "song" && (
              <form className="journey-song-form" onSubmit={submitSong}>
                <label className="sr-only" htmlFor="journey-song">¿Qué canción no puede faltar?</label>
                <input id="journey-song" value={song} onChange={(event) => { setSong(event.target.value); setSubmissionError(""); }} placeholder="Escribe tu canción aquí..." maxLength={500} enterKeyHint="send" required />
                <button type="submit" disabled={submissionPending}><span className="sr-only">Enviar mi canción</span></button>
                {submissionPending && <p className="journey-song-status" role="status">Enviando…</p>}
                {submissionError && <p className="journey-song-error" role="alert">{submissionError}</p>}
              </form>
            )}
            {dialog.panel === "thanks" && (
              <>
                <p className="sr-only" role="status">¡Gracias! Tu canción se ha enviado y forma parte de nuestra banda sonora.</p>
                <button className="journey-detail-hotspot journey-detail-hotspot--bottom" type="button" onClick={() => setDialog(null)}><span className="sr-only">Volver al camino</span></button>
              </>
            )}
            {dialog.panel === "memories" && (
              <a className="journey-detail-hotspot journey-detail-hotspot--bottom" href="https://drive.google.com/drive/folders/1shPcfW-dD8DOlALLBiaFFCnfimcQKxxT" target="_blank" rel="noopener noreferrer">
                <span className="sr-only">Abrir la carpeta de fotos y vídeos</span>
              </a>
            )}
            {dialog.panel === "contact" && (
              <>
                <a className="journey-detail-hotspot journey-detail-hotspot--email" href={`mailto:${weddingConfig.contactEmail.value}`}><span className="sr-only">Escribir correo a Gladiola y Jordi</span></a>
                <a className="journey-detail-hotspot journey-detail-hotspot--whatsapp" href={whatsappHref("Hola, Gladiola y Jordi.")} target="_blank" rel="noopener noreferrer"><span className="sr-only">Escribir por WhatsApp a Gladiola y Jordi</span></a>
                <a className="journey-detail-hotspot journey-detail-hotspot--youtube" href="https://www.youtube.com/@elviajedelvinculo" target="_blank" rel="noopener noreferrer"><span className="sr-only">Abrir el canal de YouTube para ver la boda en vivo</span></a>
                <button className="journey-detail-hotspot journey-detail-hotspot--bottom" type="button" onClick={() => setDialog(null)}><span className="sr-only">Volver al camino</span></button>
              </>
            )}
          </section>
        </div>
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
