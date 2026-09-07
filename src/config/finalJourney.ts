import type { JourneyButtonSurface } from "../types/journey";

export type FinalJourneyScene = {
  order: number;
  id: string;
  title: string;
  videoPath: string;
  frozenFramePath: string;
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

export const finalJourneyScenes: FinalJourneyScene[] = [
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
      { id: "rsvp", visible_label: "INSCRIBIR MI RESPUESTA", action: "open_rsvp" },
    ],
  },
];

export const finalJourneyByOrder = new Map(finalJourneyScenes.map((scene) => [scene.order, scene]));
