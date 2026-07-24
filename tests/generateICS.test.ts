import { describe, expect, it, vi } from "vitest";
import { downloadICS, generateICS } from "../src/utils/generateICS";

describe("generateICS", () => {
  it("creates a standards-compatible event with escaped text", () => {
    const content = generateICS({
      title: "Gladiola & Jordi",
      start: "2027-06-21T17:00:00+02:00",
      end: "2027-06-21T23:59:00+02:00",
      location: "Lugar, dirección",
      description: "Vínculo eterno",
      url: "https://gladiolajordivinculoeterno.com/",
    });

    expect(content).toContain("BEGIN:VCALENDAR\r\n");
    expect(content).toContain("SUMMARY:Gladiola & Jordi\r\n");
    expect(content).toContain("LOCATION:Lugar\\, dirección\r\n");
    expect(content).toContain("END:VCALENDAR\r\n");
  });

  it("encodes line breaks in URLs so they cannot inject ICS properties", () => {
    const content = generateICS({
      title: "Gladiola & Jordi",
      start: "2027-06-21T17:00:00+02:00",
      end: "2027-06-21T23:59:00+02:00",
      location: "Lugar",
      description: "Vínculo eterno",
      url: "https://gladiolajordivinculoeterno.com/\r\nX-INJECTED:value",
    });

    expect(content).toContain(
      "URL:https://gladiolajordivinculoeterno.com/%0D%0AX-INJECTED:value\r\n",
    );
    expect(content).not.toContain("\r\nX-INJECTED:value\r\n");
  });

  it("keeps legal comma and semicolon characters unescaped in HTTPS URLs", () => {
    const url = "https://gladiolajordivinculoeterno.com/ruta,a;detalle?x=uno,dos;tres";
    const content = generateICS({
      title: "Gladiola & Jordi",
      start: "2027-06-21T17:00:00+02:00",
      end: "2027-06-21T23:59:00+02:00",
      location: "Lugar",
      description: "Vínculo eterno",
      url,
    });

    expect(content).toContain(`URL:${url}\r\n`);
    expect(content).not.toContain("\\,");
    expect(content).not.toContain("\\;");
  });

  it("downloads the generated event without an external service", () => {
    const createObjectURL = vi.fn(() => "blob:calendar");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);

    downloadICS({
      title: "Gladiola & Jordi",
      start: "2027-06-21T17:00:00+02:00",
      end: "2027-06-21T23:59:00+02:00",
      location: "Lugar",
      description: "Vínculo eterno",
      url: "https://gladiolajordivinculoeterno.com/",
    });

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:calendar");
  });
});
