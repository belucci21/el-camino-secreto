"use client";

import { useState } from "react";
import { weddingConfig } from "../config/wedding";
import { downloadICS } from "../utils/generateICS";

function validHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function CalendarDownload() {
  const [downloadFailed, setDownloadFailed] = useState(false);
  const available =
    weddingConfig.event.calendarStart.status === "confirmed" &&
    weddingConfig.event.calendarEnd.status === "confirmed" &&
    weddingConfig.event.venue.status === "confirmed" &&
    weddingConfig.event.address.status === "confirmed" &&
    weddingConfig.siteUrl.status === "confirmed";

  function download() {
    if (!available) return;

    try {
      downloadICS({
        title: `Boda de ${weddingConfig.couple.firstPerson} y ${weddingConfig.couple.secondPerson}`,
        start: weddingConfig.event.calendarStart.value,
        end: weddingConfig.event.calendarEnd.value,
        location: `${weddingConfig.event.venue.value}, ${weddingConfig.event.address.value}`,
        description: `Celebración del vínculo eterno de ${weddingConfig.couple.firstPerson} y ${weddingConfig.couple.secondPerson}.`,
        url: weddingConfig.siteUrl.value,
      });
      setDownloadFailed(false);
    } catch {
      setDownloadFailed(true);
    }
  }

  return (
    <>
      <button disabled={!available} type="button" onClick={download}>
        Añadir la fecha al calendario
      </button>
      {downloadFailed && (
        <section className="calendar-fallback" aria-labelledby="calendar-fallback-title">
          <p role="status">
            No se pudo descargar el calendario. Puedes guardar estos datos
            manualmente.
          </p>
          <h3 id="calendar-fallback-title">Guardar los datos manualmente</h3>
          <dl>
            {weddingConfig.event.date.status === "confirmed" && (
              <div>
                <dt>Fecha</dt>
                <dd>{weddingConfig.event.date.value}</dd>
              </div>
            )}
            <div>
              <dt>Horario</dt>
              <dd>
                {weddingConfig.event.calendarStart.value} –{" "}
                {weddingConfig.event.calendarEnd.value}
              </dd>
            </div>
            <div>
              <dt>Lugar</dt>
              <dd>{weddingConfig.event.venue.value}</dd>
            </div>
            <div>
              <dt>Dirección</dt>
              <dd>{weddingConfig.event.address.value}</dd>
            </div>
            {validHttpUrl(weddingConfig.siteUrl.value) && (
              <div>
                <dt>Invitación</dt>
                <dd>
                  <a href={weddingConfig.siteUrl.value}>Abrir invitación</a>
                </dd>
              </div>
            )}
          </dl>
        </section>
      )}
    </>
  );
}
