export interface CalendarEvent {
  title: string;
  start: string;
  end: string;
  location: string;
  description: string;
  url: string;
}

const escapeICS = (value: string) =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\r?\n/g, "\\n");

const toUtcStamp = (value: string) =>
  new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

export function generateICS(event: CalendarEvent): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//El Camino Secreto//ES",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:gladiola-jordi-${toUtcStamp(event.start)}@gladiolajordivinculoeterno.com`,
    `DTSTAMP:${toUtcStamp(new Date().toISOString())}`,
    `DTSTART:${toUtcStamp(event.start)}`,
    `DTEND:${toUtcStamp(event.end)}`,
    `SUMMARY:${escapeICS(event.title)}`,
    `DESCRIPTION:${escapeICS(event.description)}`,
    `LOCATION:${escapeICS(event.location)}`,
    `URL:${escapeICS(event.url)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

export function downloadICS(event: CalendarEvent): void {
  const blob = new Blob([generateICS(event)], {
    type: "text/calendar;charset=utf-8",
  });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = "gladiola-y-jordi.ics";
  anchor.click();
  URL.revokeObjectURL(href);
}
