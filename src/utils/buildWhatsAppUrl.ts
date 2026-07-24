export type RsvpResponse = "yes" | "no" | "unsure";

const responses: Record<RsvpResponse, string> = {
  yes: "Confirmo que recorreré el camino con vosotros.",
  no: "Lamentablemente no podré acompañaros.",
  unsure: "Todavía no puedo confirmar mi asistencia.",
};

export function buildWhatsAppMessage(
  response: RsvpResponse,
  guestName: string,
): string {
  const name = guestName.trim();
  const introduction = name ? `Soy ${name}. ` : "";

  return `Hola, Gladiola y Jordi. ${introduction}${responses[response]}`;
}

export function buildWhatsAppUrl(
  phone: string,
  response: RsvpResponse,
  guestName: string,
): string {
  const digits = phone.replace(/\D/g, "");

  return `https://wa.me/${digits}?text=${encodeURIComponent(
    buildWhatsAppMessage(response, guestName),
  )}`;
}
