export type ConfigValue = {
  value: string;
  status: "confirmed" | "placeholder";
};

const pending = (value = "Pendiente de confirmar"): ConfigValue => ({
  value,
  status: "placeholder",
});

const confirmed = (value: string): ConfigValue => ({
  value,
  status: "confirmed",
});

export const weddingConfig = {
  siteUrl: confirmed("https://gladiolajordivinculoeterno.com/"),
  couple: {
    firstPerson: "Gladiola",
    secondPerson: "Jordi",
  },
  event: {
    date: confirmed("Sábado 29 de mayo de 2027"),
    calendarStart: confirmed("2027-05-29T17:00:00+02:00"),
    calendarEnd: confirmed("2027-05-30T01:00:00+02:00"),
    ceremonyTime: confirmed("17:00 h"),
    ceremonyVenue: confirmed("Iglesia de San Martín de Tours"),
    ceremonyAddress: confirmed("C/ Mayor, 1 · 28013 Madrid"),
    celebrationTime: confirmed("19:30 h"),
    celebrationVenue: confirmed("Castillo de Viñuelas"),
    celebrationAddress: confirmed("Ctra. de M-106, Km 2 · Tres Cantos, Madrid"),
    venue: confirmed("Iglesia de San Martín de Tours"),
    address: confirmed("C/ Mayor, 1 · 28013 Madrid"),
    mapsUrl: confirmed(
      "https://www.google.com/maps/search/?api=1&query=Castillo%20de%20Vi%C3%B1uelas%2C%20Tres%20Cantos%2C%20Madrid",
    ),
  },
  dressCode: confirmed("Etiqueta · tonos elegantes y naturales"),
  transport: confirmed(
    "Consulta las rutas hacia Madrid y Tres Cantos desde la sección «Cómo llegar».",
  ),
  accommodation: pending(),
  gifts: pending(),
  contactPhone: pending(),
  rsvpWhatsApp: pending("Número pendiente de confirmar"),
  finalMessage: confirmed(
    "Lo más valioso para nosotros es compartir este día contigo. Gracias por ser parte de nuestro viaje.",
  ),
} as const;
