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
};

// The September 30 delivery is one complete, ordered film. Its numbered
// media, voice tracks, stills, chapter names and interactive surfaces live here.
const deliveredScenes: DeliveredScene[] = [
  { order: 1, id: "opening", stem: "01-opening", title: "El camino comienza aquí", surfaces: [...controls(), { id: "start_journey", visible_label: "COMENZAR EL CAMINO", action: "go_to_step", destination_order: 2 }] },
  { order: 2, id: "invitation", stem: "02-invitation", title: "Gladiola & Jordi", surfaces: [...controls(), { id: "start_journey", visible_label: "COMENZAR EL CAMINO", action: "go_to_step", destination_order: 3 }] },
  { order: 3, id: "journey-begins", stem: "03-journey-begins", title: "El viaje comienza", surfaces: [...controls(), continueTo(4)] },
  { order: 4, id: "secret-door", stem: "04-secret-door", title: "La puerta secreta", surfaces: [...controls(), { id: "decode_word", visible_label: "DESCIFRAR LA PALABRA", action: "open_secret_word_input" }, { id: "hint", visible_label: "¿ESTÁS PERDIDO?", action: "reveal_hint" }] },
  { order: 5, id: "open-door", stem: "05-open-door", title: "La respuesta correcta", surfaces: [...controls(), continueTo(6)] },
  { order: 6, id: "save-date", stem: "06-save-date", title: "Reserva la fecha", surfaces: [...controls(), { id: "save_date", visible_label: "Guardar en el calendario", action: "download_calendar_event" }, continueTo(7)] },
  { order: 7, id: "two-souls", stem: "07-two-souls", title: "El viaje de dos almas", surfaces: [...controls(), continueTo(8)] },
  { order: 8, id: "ceremony", stem: "08-ceremony", title: "La ceremonia", surfaces: [...controls(), { id: "ceremony_map", visible_label: "VER EN GOOGLE MAPS", action: "open_ceremony_map" }, continueTo(9)] },
  { order: 9, id: "celebration", stem: "09-journey-information", title: "Celebración en Castell Jalpí", surfaces: [...controls(), { id: "celebration_map", visible_label: "VER EN GOOGLE MAPS", action: "open_map" }, continueTo(10)] },
  { order: 10, id: "treasure", stem: "10-treasure", title: "El cofre del tesoro", surfaces: [...controls(), continueTo(11)] },
  { order: 11, id: "dress-code", stem: "11-dress-code", title: "Código de vestimenta", surfaces: [...controls(), continueTo(12)] },
  { order: 12, id: "rsvp", stem: "12-rsvp", title: "Confirmación de asistencia", rsvpArtworkPath: "/journey-final/12-rsvp-form.png", surfaces: [...controls(), { id: "rsvp", visible_label: "CONFIRMAR MI ASISTENCIA", action: "open_rsvp", destination_order: 13 }] },
  { order: 13, id: "gratitude", stem: "13-gratitude", title: "Gracias por caminar con nosotros", surfaces: [...controls(), continueTo(14)] },
  { order: 14, id: "details", stem: "14-details", title: "Un detalle del camino", detailArtwork: {
    music: "/journey-final/14-music.png",
    song: "/journey-final/14-song.png",
    thanks: "/journey-final/14-song-thanks.png",
    memories: "/journey-final/14-memories.png",
    contact: "/journey-final/14-contact.png",
  }, surfaces: [...controls(), { id: "music_joy", visible_label: "MÚSICA Y ALEGRÍA", action: "open_music_prompt" }, { id: "lasting_memories", visible_label: "RECUERDOS PARA SIEMPRE", action: "open_memories" }, { id: "contact", visible_label: "CONTACTO", action: "open_contact" }, continueTo(15)] },
  { order: 15, id: "important-details", stem: "15-important-details", title: "Detalles importantes", surfaces: [...controls(), continueTo(16)] },
  { order: 16, id: "final-thanks", stem: "16-final-thanks", title: "Gracias por ser parte del vínculo eterno", holdFrameAt: 15.3, surfaces: [...controls()] },
];

// Voice start/end measured from the delivered audio. The continuous ambient
// Howl is never paused when a scene changes; it only ducks while words sound.
const narrationWindows: Record<number, readonly (readonly [number, number])[]> = {
  1: [[4.38, 20.42]], 2: [[1.53, 18.04]], 3: [[3.32, 7.84]],
  4: [[2.31, 15.65]], 5: [[2.84, 11.62]], 6: [[1.76, 14.71]],
  7: [[5.75, 29.22]], 8: [[3.65, 23.77]], 9: [[3.03, 21.25]],
  10: [[1.32, 18.19]], 11: [], 12: [[3.19, 7.73]], 13: [],
  14: [], 15: [], 16: [[1.56, 14.51]],
};

export const finalJourneyScenes: FinalJourneyScene[] = deliveredScenes.map(({ stem, ...scene }) => {
  const hasNarration = narrationWindows[scene.order].length > 0;
  return {
    ...scene,
    videoPath: `/journey-final/${stem}.mp4`,
    frozenFramePath: `/journey-final/${stem}-final.png`,
    firstFramePath: `/journey-final/${stem}-first.png`,
    hasNarration,
    narrationPath: hasNarration ? `/journey-final/${stem}-voice.${scene.order === 12 ? "m4a" : "mp3"}` : undefined,
    interactionReadyAt: 0,
    narrationWindows: narrationWindows[scene.order],
  };
});

export const finalJourneyByOrder = new Map(finalJourneyScenes.map((scene) => [scene.order, scene]));
