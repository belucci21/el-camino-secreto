export type ConfigValue = {
  value: string;
  status: "confirmed" | "placeholder";
};

const pending = (value = "Pendiente de confirmar"): ConfigValue => ({
  value,
  status: "placeholder",
});

export const weddingConfig = {
  siteUrl: {
    value: "https://gladiolajordivinculoeterno.com/",
    status: "confirmed",
  } satisfies ConfigValue,
  couple: {
    firstPerson: "Gladiola",
    secondPerson: "Jordi",
  },
  event: {
    date: pending(),
    calendarStart: pending("Inicio ISO pendiente de confirmar"),
    calendarEnd: pending("Fin ISO pendiente de confirmar"),
    ceremonyTime: pending(),
    celebrationTime: pending(),
    venue: pending(),
    address: pending(),
    mapsUrl: pending("Ubicación pendiente de confirmar"),
  },
  dressCode: pending(),
  transport: pending(),
  accommodation: pending(),
  gifts: pending(),
  contactPhone: pending(),
  rsvpWhatsApp: pending("Número pendiente de confirmar"),
  finalMessage: pending("Mensaje final pendiente de confirmar"),
} as const;
