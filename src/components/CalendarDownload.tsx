"use client";

import { weddingConfig } from "../config/wedding";
import { downloadICS } from "../utils/generateICS";

export function CalendarDownload() {
  const available =
    weddingConfig.event.calendarStart.status === "confirmed" &&
    weddingConfig.event.calendarEnd.status === "confirmed" &&
    weddingConfig.event.venue.status === "confirmed" &&
    weddingConfig.event.address.status === "confirmed" &&
    weddingConfig.siteUrl.status === "confirmed";

  return (
    <button
      disabled={!available}
      type="button"
      onClick={() => {
        if (!available) return;

        downloadICS({
          title: `Boda de ${weddingConfig.couple.firstPerson} y ${weddingConfig.couple.secondPerson}`,
          start: weddingConfig.event.calendarStart.value,
          end: weddingConfig.event.calendarEnd.value,
          location: `${weddingConfig.event.venue.value}, ${weddingConfig.event.address.value}`,
          description: `Celebración del vínculo eterno de ${weddingConfig.couple.firstPerson} y ${weddingConfig.couple.secondPerson}.`,
          url: weddingConfig.siteUrl.value,
        });
      }}
    >
      Añadir la fecha al calendario
    </button>
  );
}
