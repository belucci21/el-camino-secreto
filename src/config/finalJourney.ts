import type { JourneyButtonSurface } from "../types/journey";

export type FinalJourneyScene = {
  order: number;
  id: string;
  title: string;
  videoPath: string;
  frozenFramePath: string;
  firstFramePath: string;
  hasNarration: boolean;
  interactionReadyAt: number;
  narrationWindows: readonly (readonly [number, number])[];
  /** Last visible source frame; the original audio continues over this still. */
  holdFrameAt?: number;
  rsvpMedia?: {
    backgroundVideoPath: string;
    attendanceArtworkPath: string;
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

const deliveredScenes: Omit<FinalJourneyScene, "firstFramePath" | "hasNarration" | "interactionReadyAt" | "narrationWindows">[] = [
  {
    order: 1,
    id: "opening",
    title: "El camino comienza aquí",
    videoPath: "/journey-final/01-opening.mp4",
    frozenFramePath: "/journey-final/01-opening-final.png",
    surfaces: [...controls(), { id: "start_journey", visible_label: "COMENZAR EL CAMINO", action: "go_to_step", destination_order: 2 }],
  },
  {
    order: 2,
    id: "invitation",
    title: "Gladiola & Jordi",
    videoPath: "/journey-final/02-invitation.mp4",
    frozenFramePath: "/journey-final/02-invitation-final.png",
    surfaces: [...controls(), { id: "start_journey", visible_label: "COMENZAR EL CAMINO", action: "go_to_step", destination_order: 3 }],
  },
  {
    order: 3,
    id: "journey-begins",
    title: "El viaje comienza",
    videoPath: "/journey-final/03-journey-begins.mp4",
    frozenFramePath: "/journey-final/03-journey-begins-final.png",
    surfaces: [...controls(), continueTo(4)],
  },
  {
    order: 4,
    id: "secret-door",
    title: "La puerta secreta",
    videoPath: "/journey-final/04-secret-door.mp4",
    frozenFramePath: "/journey-final/04-secret-door-final.png",
    surfaces: [
      ...controls(),
      { id: "decode_word", visible_label: "DESCIFRAR LA PALABRA", action: "open_secret_word_input" },
      { id: "hint", visible_label: "PISTA: ESCUCHA, OBSERVA Y RECUERDA", action: "reveal_hint" },
    ],
  },
  {
    order: 5,
    id: "open-door",
    title: "La respuesta correcta",
    videoPath: "/journey-final/05-open-door.mp4",
    frozenFramePath: "/journey-final/05-open-door-final.png",
    surfaces: [...controls(), continueTo(6)],
  },
  {
    order: 6,
    id: "save-date",
    title: "Reserva la fecha",
    videoPath: "/journey-final/06-save-date.mp4",
    frozenFramePath: "/journey-final/06-save-date-final.png",
    surfaces: [
      ...controls(),
      { id: "save_date", visible_label: "GUARDA LA FECHA", action: "download_calendar_event" },
      continueTo(7),
    ],
  },
  {
    order: 7,
    id: "two-souls",
    title: "El viaje de dos almas",
    videoPath: "/journey-final/07-two-souls.mp4",
    frozenFramePath: "/journey-final/07-two-souls-final.png",
    surfaces: [...controls(), continueTo(8)],
  },
  {
    order: 8,
    id: "ceremony",
    title: "La gran celebración",
    videoPath: "/journey-final/08-ceremony.mp4",
    frozenFramePath: "/journey-final/08-ceremony-final.png",
    surfaces: [...controls(), continueTo(9)],
  },
  {
    order: 9,
    id: "journey-information",
    title: "Información del viaje",
    videoPath: "/journey-final/09-journey-information.mp4",
    frozenFramePath: "/journey-final/09-journey-information-final.png",
    surfaces: [
      ...controls(),
      { id: "location", visible_label: "VER UBICACIÓN", action: "open_map" },
      continueTo(10),
    ],
  },
  {
    order: 10,
    id: "dress-code",
    title: "Código de vestimenta",
    videoPath: "/journey-final/10-dress-code.mp4",
    frozenFramePath: "/journey-final/10-dress-code-final.png",
    surfaces: [
      ...controls(),
      { id: "dress_code", visible_label: "CÓDIGO DE VESTIMENTA", action: "open_dress_code" },
      continueTo(11),
    ],
  },
  {
    order: 11,
    id: "rsvp",
    title: "Confirma tu asistencia",
    videoPath: "/journey-final/11-rsvp.mp4",
    frozenFramePath: "/journey-final/11-rsvp-final.png",
    rsvpMedia: {
      backgroundVideoPath: "/journey-final/11-rsvp-background.mp4",
      attendanceArtworkPath: "/journey-final/11-rsvp-panel.png",
    },
    surfaces: [
      ...controls(),
      { id: "rsvp", visible_label: "INSCRIBIR MI RESPUESTA", action: "open_rsvp", destination_order: 12 },
    ],
  },
];

// Measured on the delivered films: the final composition settles before the container ends.
// Showing controls must not stop the soundtrack. Long speech pauses restore the music;
// short breaths remain inside each window to avoid pumping the mix.
const timing: Record<number, Pick<FinalJourneyScene, "interactionReadyAt" | "narrationWindows">> = {
  1: { interactionReadyAt: 19.6, narrationWindows: [[1.413, 18.592]] },
  2: { interactionReadyAt: 20, narrationWindows: [[0, 19.967]] },
  3: { interactionReadyAt: 14.734, narrationWindows: [[3.711, 10.138]] },
  4: { interactionReadyAt: 7.4, narrationWindows: [[0, 15.971]] },
  5: { interactionReadyAt: 10, narrationWindows: [[1.213, 10.581]] },
  6: { interactionReadyAt: 10.867, narrationWindows: [[0.779, 12.806]] },
  7: { interactionReadyAt: 9.267, narrationWindows: [[0.692, 25.371]] },
  8: { interactionReadyAt: 11.967, narrationWindows: [[0.419, 1.196], [2.267, 23.526]] },
  9: { interactionReadyAt: 8.167, narrationWindows: [[0, 22.616]] },
  10: { interactionReadyAt: 11.934, narrationWindows: [] },
  11: { interactionReadyAt: 10.367, narrationWindows: [] },
  12: { interactionReadyAt: 16.434, narrationWindows: [[0.415, 18.006], [22.862, 40.472]] },
  13: { interactionReadyAt: 16.834, narrationWindows: [[2.875, 15.626], [22.863, 40.472]] },
};

// The supplied MP4s already contain the synchronized voice. 10 and 11 have silent audio tracks.
export const finalJourneyScenes: FinalJourneyScene[] = [...deliveredScenes, {
  order: 12, id: "treasure", title: "El cofre del tesoro",
  videoPath: "/journey-final/12-treasure.mp4",
  frozenFramePath: "/journey-final/12-treasure-final.png",
  holdFrameAt: 776 / 30,
  surfaces: [...controls(), continueTo(13)],
}, {
  order: 13, id: "eternal-bond", title: "Un vínculo eterno",
  videoPath: "/journey-final/13-eternal-bond.mp4",
  frozenFramePath: "/journey-final/13-eternal-bond-final.png",
  holdFrameAt: 597 / 30,
  surfaces: [...controls(), { id: "finish", visible_label: "Ver capítulos", action: "open_chapters" as const }],
}].map((scene) => ({
  ...scene,
  ...timing[scene.order],
  firstFramePath: scene.videoPath.replace(/\.mp4$/, "-first.png"),
  hasNarration: scene.order !== 10 && scene.order !== 11,
}));

export const finalJourneyByOrder = new Map(finalJourneyScenes.map((scene) => [scene.order, scene]));
