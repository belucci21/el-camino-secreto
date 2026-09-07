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
    calendarStart: confirmed("2027-05-29T18:30:00+02:00"),
    calendarEnd: confirmed("2027-05-30T01:00:00+02:00"),
    ceremonyTime: confirmed("18:30 h · Puntualidad (entrada por el claustro)"),
    ceremonyVenue: confirmed("Basílica de la Purísima Concepción"),
    ceremonyAddress: confirmed("Carrer de Roger de Llúria, 70 · Eixample, 08009 Barcelona"),
    celebrationTime: confirmed("Tras la ceremonia"),
    celebrationVenue: confirmed("Castillo Jalpí"),
    celebrationAddress: confirmed("Castell Jalpí s/n, 08358 Arenys de Munt (Barcelona)"),
    venue: confirmed("Basílica de la Purísima Concepción"),
    address: confirmed("Carrer de Roger de Llúria, 70 · Eixample, 08009 Barcelona"),
    mapsUrl: confirmed(
      "https://www.google.com/maps/search/?api=1&query=Castell%20Jalp%C3%AD%2C%20Arenys%20de%20Munt%2C%20Barcelona",
    ),
  },
  dressCode: confirmed("Formal elegante"),
  transport: confirmed(
    "Consulta las rutas hacia Barcelona y Arenys de Munt desde la sección «Cómo llegar».",
  ),
  accommodation: pending(),
  gifts: pending(),
  contactPhone: pending(),
  rsvpWhatsApp: pending("Número pendiente de confirmar"),
  finalMessage: confirmed(
    "Lo más valioso para nosotros es compartir este día contigo. Gracias por ser parte de nuestro viaje.",
  ),
} as const;
