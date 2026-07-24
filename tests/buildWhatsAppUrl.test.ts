import { describe, expect, it } from "vitest";
import {
  buildWhatsAppMessage,
  buildWhatsAppUrl,
} from "../src/utils/buildWhatsAppUrl";

describe("WhatsApp RSVP", () => {
  it("includes the optional guest name without storing it", () => {
    expect(buildWhatsAppMessage("yes", "Ana")).toBe(
      "Hola, Gladiola y Jordi. Soy Ana. Confirmo que recorreré el camino con vosotros.",
    );
  });

  it("builds a properly encoded wa.me URL", () => {
    const url = buildWhatsAppUrl("34600111222", "no", "");

    expect(url).toContain("https://wa.me/34600111222?text=");
    expect(decodeURIComponent(url)).toContain(
      "Lamentablemente no podré acompañaros.",
    );
  });
});
