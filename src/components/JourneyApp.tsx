"use client";

import gsap from "gsap";
import {
  type CSSProperties,
  type FormEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import referenceJson from "../content/journey-reference.json";
import { journeyHotspots } from "../config/journeyInteractions";
import { weddingConfig } from "../config/wedding";
import { useAudio } from "../hooks/useAudio";
import { useReducedMotion } from "../hooks/useReducedMotion";
import type {
  JourneyButtonSurface,
  JourneyReference,
  JourneyScene,
} from "../types/journey";
import { validateSecretWord } from "../utils/secretWord";
import { JourneyDialog } from "./JourneyDialog";

const reference = referenceJson as JourneyReference;
const scenes = [...reference.scenes].sort((a, b) => a.order - b.order);

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
    body: "El lugar y la hora definitivos se revelarán aquí cuando Gladiola y Jordi confirmen todos los detalles.",
  },
  reception: {
    title: "Recepción",
    body: "Este tramo del viaje está reservado para los datos finales de la recepción.",
  },
  celebration: {
    title: "Celebración",
    body: "Música, brindis y una noche para recordar. Los detalles definitivos llegarán muy pronto.",
  },
  dress_code: {
    title: "Código de vestimenta",
    body: "Elegante y natural. La indicación definitiva permanece como placeholder hasta la confirmación de los novios.",
  },
  directions: {
    title: "Cómo llegar",
    body: "Las rutas y recomendaciones de transporte se añadirán cuando la ubicación quede confirmada.",
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
    body: "La información definitiva de la lista de deseos se publicará en este cofre cuando esté confirmada.",
  },
  special_message: {
    title: "Mensaje especial",
    body: "Gracias por caminar con nosotros. Vuestra presencia es el regalo más valioso de este viaje.",
  },
  important_details: {
    title: "Detalles importantes",
    body: "Aquí aparecerán recomendaciones, horarios y cualquier información adicional para disfrutar al máximo del día.",
  },
};

function chapterName(scene: JourneyScene) {
  return (
    scene.visible_copy.find(
      (line) =>
        line.length > 7 &&
        !line.includes("MÚSICA") &&
        !line.includes("CAPÍTULOS") &&
        !line.startsWith("CAPÍTULO") &&
        !line.startsWith("PASO"),
    ) ?? `Paso ${scene.order}`
  );
}

function buttonLabel(surface: JourneyButtonSurface, audioEnabled: boolean) {
  if (surface.id === "music_toggle") {
    return audioEnabled ? "Desactivar música" : "Activar música";
  }
  return surface.visible_label;
}

export function JourneyApp({ initialStep = 1 }: { initialStep?: number }) {
  const [step, setStep] = useState(Math.min(11, Math.max(1, initialStep)));
  const [dialog, setDialog] = useState<DialogState>(null);
  const [secretWord, setSecretWord] = useState("");
  const [secretStatus, setSecretStatus] = useState<"idle" | "checking" | "wrong">("idle");
  const [loaderProgress, setLoaderProgress] = useState(8);
  const [rsvpSaved, setRsvpSaved] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const wheelLock = useRef(false);
  const scene = scenes[step - 1];
  const audio = useAudio();
  const { reducedMotion, setReducedMotion } = useReducedMotion();
  const imagePath = `${reference.experience_contract.asset_base_path}/${scene.asset.filename}`;
  const hotspots = useMemo(() => journeyHotspots[step] ?? {}, [step]);

  const goToStep = useCallback(
    (nextStep: number) => {
      setDialog(null);
      setStep(Math.min(scenes.length, Math.max(1, nextStep)));
    },
    [],
  );

  useEffect(() => {
    const next = scenes.slice(step, step + 2);
    next.forEach((item) => {
      const image = new window.Image();
      image.src = `${reference.experience_contract.asset_base_path}/${item.asset.filename}`;
    });
  }, [step]);

  useEffect(() => {
    if (step !== 1) return;

    const startedAt = window.performance.now();
    const timer = window.setInterval(() => {
      const elapsed = window.performance.now() - startedAt;
      const progress = Math.min(100, 8 + elapsed / 14);
      setLoaderProgress(progress);
      if (progress >= 100) {
        window.clearInterval(timer);
        window.setTimeout(() => goToStep(2), reducedMotion ? 80 : 380);
      }
    }, 40);

    return () => window.clearInterval(timer);
  }, [goToStep, reducedMotion, step]);

  useLayoutEffect(() => {
    const visual = visualRef.current;
    if (!visual) return;

    if (reducedMotion) {
      gsap.set(visual, { autoAlpha: 1, scale: 1, y: 0, filter: "brightness(1)" });
      return;
    }

    const context = gsap.context(() => {
      gsap.fromTo(
        visual,
        {
          autoAlpha: 0,
          scale: step === 5 ? 1.045 : 1.018,
          y: step === 5 ? 12 : 20,
          filter: "brightness(.68)",
        },
        {
          autoAlpha: 1,
          scale: 1,
          y: 0,
          filter: "brightness(1)",
          duration: step === 5 ? 1.55 : 0.9,
          ease: step === 5 ? "power3.inOut" : "power2.out",
        },
      );

      if (step === 5) {
        gsap.fromTo(
          ".journey-threshold-flare",
          { opacity: 0.95, scale: 0.4 },
          { opacity: 0, scale: 2.2, duration: 2, ease: "power2.out" },
        );
      }
    }, stageRef);

    return () => context.revert();
  }, [reducedMotion, step]);

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (reducedMotion || !visualRef.current || event.pointerType === "touch") return;
      const rect = event.currentTarget.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      gsap.to(visualRef.current, {
        x: x * -8,
        y: y * -6,
        scale: 1.012,
        duration: 0.8,
        ease: "power2.out",
        overwrite: true,
      });
    },
    [reducedMotion],
  );

  const resetParallax = useCallback(() => {
    if (!visualRef.current || reducedMotion) return;
    gsap.to(visualRef.current, {
      x: 0,
      y: 0,
      scale: 1,
      duration: 0.8,
      ease: "power2.out",
      overwrite: true,
    });
  }, [reducedMotion]);

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
          openMessage("save_date");
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

  const onWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      if (step !== 2 || event.deltaY < 48 || wheelLock.current) return;
      wheelLock.current = true;
      goToStep(3);
      window.setTimeout(() => {
        wheelLock.current = false;
      }, 800);
    },
    [goToStep, step],
  );

  const hotspotButtons = useMemo(
    () =>
      scene.button_surfaces.map((surface) => {
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
            <span className="sr-only">{buttonLabel(surface, audio.enabled)}</span>
            {surface.id === "music_toggle" && audio.enabled && (
              <span className="journey-audio-live" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            )}
          </button>
        );
      }),
    [audio.enabled, handleSurface, hotspots, scene.button_surfaces, step],
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
        onPointerDown={(event) => {
          pointerStart.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerUp={(event) => {
          if (step !== 2 || !pointerStart.current) return;
          const distanceY = pointerStart.current.y - event.clientY;
          const distanceX = pointerStart.current.x - event.clientX;
          if (distanceY > 45 || distanceX > 65) goToStep(3);
          pointerStart.current = null;
        }}
        onPointerMove={onPointerMove}
        onPointerLeave={resetParallax}
        onWheel={onWheel}
      >
        <div className="journey-scene-visual" ref={visualRef}>
          {/* The portrait artwork is already authored at its exact delivery dimensions. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="journey-scene-image"
            src={imagePath}
            alt={`${reference.couple}. ${scene.visible_copy.slice(1, 6).join(". ")}`}
            draggable={false}
            width={scene.asset.width}
            height={scene.asset.height}
            loading={step <= 2 ? "eager" : "lazy"}
            fetchPriority={step <= 2 ? "high" : "auto"}
          />
        </div>
        <div className="journey-vignette" aria-hidden="true" />
        <div className="journey-grain" aria-hidden="true" />
        {step === 5 && <div className="journey-threshold-flare" aria-hidden="true" />}
        <div className="journey-hotspots">{hotspotButtons}</div>

        {step === 1 && (
          <div className="journey-loader" aria-live="polite">
            <span style={{ width: `${loaderProgress}%` }} />
            <p>{Math.round(loaderProgress)}%</p>
          </div>
        )}

        <button
          className="journey-motion-control"
          type="button"
          aria-label={reducedMotion ? "Activar movimiento" : "Reducir movimiento"}
          onClick={() => setReducedMotion(!reducedMotion)}
        >
          {reducedMotion ? "Movimiento reducido" : "Movimiento"}
        </button>

        <p className="sr-only" aria-live="polite">
          {`Paso ${step}: ${scene.visible_copy.join(". ")}`}
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
                onClick={() => goToStep(item.order)}
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
        <JourneyDialog title="Confirma tu asistencia" eyebrow="El Libro del Vínculo Eterno" onClose={() => setDialog(null)}>
          {rsvpSaved ? (
            <>
              <p className="journey-dialog-copy">
                Tu respuesta se ha guardado en este dispositivo. El envío definitivo se activará
                cuando los novios confirmen el canal de RSVP.
              </p>
              <button className="journey-dialog-primary" type="button" onClick={() => goToStep(11)}>
                Continuar al cofre
              </button>
            </>
          ) : (
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
          )}
        </JourneyDialog>
      )}

      {dialog?.kind === "complete" && (
        <JourneyDialog title="El viaje apenas comienza" eyebrow="Gladiola & Jordi" onClose={() => setDialog(null)}>
          <p className="journey-dialog-copy">
            Gracias por recorrer este camino. Los próximos capítulos aparecerán aquí muy pronto.
          </p>
          <button className="journey-dialog-primary" type="button" onClick={() => goToStep(2)}>
            Recorrer de nuevo
          </button>
        </JourneyDialog>
      )}
    </main>
  );
}
