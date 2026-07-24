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

  it("escapes line breaks in URLs so they cannot inject ICS properties", () => {
    const content = generateICS({
      title: "Gladiola & Jordi",
      start: "2027-06-21T17:00:00+02:00",
      end: "2027-06-21T23:59:00+02:00",
      location: "Lugar",
      description: "Vínculo eterno",
      url: "https://gladiolajordivinculoeterno.com/\r\nX-INJECTED:value",
    });

    expect(content).toContain(
      "URL:https://gladiolajordivinculoeterno.com/\\nX-INJECTED:value\r\n",
    );
    expect(content).not.toContain("\r\nX-INJECTED:value\r\n");
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
