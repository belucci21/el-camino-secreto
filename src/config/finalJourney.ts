import type { JourneyButtonSurface } from "../types/journey";

export type FinalJourneyScene = {
  order: number;
  id: string;
  title: string;
  videoPath: string;
  frozenFramePath: string;
  firstFramePath: string;
  hasNarration: boolean;
  narrationPath?: string;
  interactionReadyAt: number;
  narrationWindows: readonly (readonly [number, number])[];
  holdFrameAt?: number;
  aspectRatio?: number;
  // Most controls are printed in the film; these are absent from the artwork
  // and must be drawn by the application, not just transparent hit targets.
  renderedControls?: string[];
  rsvpArtworkPath?: string;
  detailArtwork?: {
    music: string;
    song: string;
    thanks: string;
    memories: string;
    contact: string;
  };
  surfaces: JourneyButtonSurface[];
};

const controls = (): JourneyButtonSurface[] => [
  { id: "music_toggle", visible_label: "MÚSICA", action: "toggle_music" },
  { id: "chapters_menu", visible_label: "CAPÍTULOS", action: "open_chapters" },
];

const continueTo = (destination_order: number): JourneyButtonSurface => ({
  id: "continue",
  visible_label: "Continuar",
  action: "go_to_step",
  destination_order,
});

type DeliveredScene = Omit<FinalJourneyScene, "videoPath" | "frozenFramePath" | "firstFramePath" | "hasNarration" | "narrationPath" | "interactionReadyAt" | "narrationWindows"> & {
  stem: string;
  videoPath?: string;
  frozenFramePath?: string;
  interactionReadyAt?: number;
};

// The September 30 delivery is one complete, ordered film. Its numbered
// media, voice tracks, stills, chapter names and interactive surfaces live here.
const deliveredScenes: DeliveredScene[] = [
  { order: 1, id: "opening", stem: "01-opening", title: "El camino comienza aquí", surfaces: [...controls(), { id: "start_journey", visible_label: "COMENZAR EL CAMINO", action: "go_to_step", destination_order: 2 }] },
  { order: 2, id: "invitation", stem: "02-invitation", title: "Gladiola & Jordi", surfaces: [...controls(), { id: "start_journey", visible_label: "COMENZAR EL CAMINO", action: "go_to_step", destination_order: 3 }] },
  // The final two encoded frames omit the printed controls. Hold the last
  // complete delivered frame instead of drawing replacement buttons over it.
  { order: 3, id: "journey-begins", stem: "03-journey-begins", title: "El viaje comienza", frozenFramePath: "/journey-final/03-journey-begins-interactive.png", holdFrameAt: 9.8, surfaces: [...controls(), continueTo(4)] },
  { order: 4, id: "secret-door", stem: "04-secret-door", title: "La puerta secreta", surfaces: [...controls(), { id: "decode_word", visible_label: "DESCIFRAR LA PALABRA", action: "open_secret_word_input" }, { id: "hint", visible_label: "¿ESTÁS PERDIDO?", action: "reveal_hint" }] },
  // Drive delivery UNIFICACION ESC 5 Y 6 is one approved film: the opening
  // door continues straight into the save-the-date reveal, with one CTA only.
  { order: 5, id: "open-door-date", stem: "05-06-unified", videoPath: "/journey-final/05-06-unified-web.mp4", title: "La puerta a lo eterno", frozenFramePath: "/journey-final/05-06-unified-final.png", holdFrameAt: 28.8, surfaces: [...controls(), continueTo(6)] },
  // The source film contains a single chapel frame after the last note frame.
  // Hold the note until its Continue is touched instead of revealing that cut.
  { order: 6, id: "two-souls", stem: "07-two-souls", title: "El viaje de dos almas", frozenFramePath: "/journey-final/07-two-souls-897-final.png", holdFrameAt: 29.6, surfaces: [...controls(), continueTo(7)] },
  // The ceremony card now enters automatically. Its printed Continue appears
  // after the card, so the hit targets become available at that point.
  { order: 7, id: "ceremony", stem: "08-ceremony", title: "La ceremonia", interactionReadyAt: 6.7, surfaces: [...controls(), { id: "ceremony_map", visible_label: "VER EN GOOGLE MAPS", action: "open_ceremony_map" }, continueTo(8)] },
  { order: 8, id: "celebration", stem: "09-journey-information", title: "Celebración en Castell Jalpí", surfaces: [...controls(), { id: "celebration_map", visible_label: "VER EN GOOGLE MAPS", action: "open_map" }, continueTo(9)] },
  { order: 9, id: "treasure", stem: "10-treasure", title: "El cofre del tesoro", surfaces: [...controls(), continueTo(10)] },
  { order: 10, id: "dress-code", stem: "11-dress-code", title: "Código de vestimenta", surfaces: [...controls(), continueTo(11)] },
  { order: 11, id: "rsvp", stem: "12-rsvp", title: "Confirmación de asistencia", rsvpArtworkPath: "/journey-final/12-rsvp-form.png", surfaces: [...controls(), { id: "rsvp", visible_label: "CONFIRMAR MI ASISTENCIA", action: "open_rsvp", destination_order: 12 }] },
  { order: 12, id: "gratitude", stem: "13-gratitude", title: "Gracias por caminar con nosotros", surfaces: [...controls(), continueTo(13)] },
  { order: 13, id: "details", stem: "14-details", title: "Un detalle del camino", detailArtwork: {
    music: "/journey-final/14-music.png",
    song: "/journey-final/14-song.png",
    thanks: "/journey-final/14-song-thanks.png",
    memories: "/journey-final/14-memories.png",
    contact: "/journey-final/14-contact-v2.jpg",
  }, surfaces: [...controls(), { id: "music_joy", visible_label: "MÚSICA Y ALEGRÍA", action: "open_music_prompt" }, { id: "lasting_memories", visible_label: "RECUERDOS PARA SIEMPRE", action: "open_memories" }, { id: "contact", visible_label: "CONTACTO", action: "open_contact" }, continueTo(14)] },
  { order: 14, id: "important-details", stem: "15-important-details-v2", title: "Detalles importantes", aspectRatio: 1080 / 2230, renderedControls: ["music_toggle", "chapters_menu"], surfaces: [...controls(), continueTo(15)] },
  { order: 15, id: "final-thanks", stem: "16-final-thanks-v2", title: "Gracias por ser parte del vínculo eterno", renderedControls: ["music_toggle", "chapters_menu"], surfaces: [...controls()] },
];

// Voice start/end measured from the delivered audio. The continuous ambient
// Howl is never paused when a scene changes; it only ducks while words sound.
const narrationWindows: Record<number, readonly (readonly [number, number])[]> = {
  1: [[4.38, 20.42]], 2: [[1.53, 18.04]], 3: [[3.32, 7.84]],
  4: [[2.31, 15.65]],
  5: [[2.821565, 7.552948], [8.203605, 11.63907], [14.592313, 16.737528], [17.056757, 19.411814], [20.000794, 27.684104]],
  6: [[5.75, 29.22]], 7: [[3.65, 23.77]], 8: [[3.03, 21.25]],
  9: [[1.32, 18.19]], 10: [], 11: [[3.19, 7.73]], 12: [],
  13: [], 14: [], 15: [[1.56, 15.31]],
};

export const finalJourneyScenes: FinalJourneyScene[] = deliveredScenes.map(({ stem, videoPath, frozenFramePath, ...scene }) => {
  const hasNarration = narrationWindows[scene.order].length > 0;
  return {
    ...scene,
    videoPath: videoPath ?? `/journey-final/${stem}.mp4`,
    frozenFramePath: frozenFramePath ?? `/journey-final/${stem}-final.png`,
    firstFramePath: `/journey-final/${stem}-first.png`,
    hasNarration,
    narrationPath: hasNarration ? `/journey-final/${stem}-voice.${stem === "12-rsvp" ? "m4a" : "mp3"}` : undefined,
    interactionReadyAt: scene.interactionReadyAt ?? 0,
    narrationWindows: narrationWindows[scene.order],
  };
});

export const finalJourneyByOrder = new Map(finalJourneyScenes.map((scene) => [scene.order, scene]));
