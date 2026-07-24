"use client";

import { useState } from "react";
import type { ConfigValue } from "../config/wedding";
import { weddingConfig } from "../config/wedding";
import {
  buildWhatsAppMessage,
  buildWhatsAppUrl,
  type RsvpResponse,
} from "../utils/buildWhatsAppUrl";

export function RSVPWhatsApp({
  phone = weddingConfig.rsvpWhatsApp,
}: {
  phone?: ConfigValue;
}) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const available = phone.status === "confirmed";

  async function respond(response: RsvpResponse) {
    if (!available) return;

    const opened = window.open(
      buildWhatsAppUrl(phone.value, response, name),
      "_blank",
      "noopener,noreferrer",
    );

    if (!opened) {
      try {
        await navigator.clipboard.writeText(
          buildWhatsAppMessage(response, name),
        );
        setStatus("Mensaje copiado para enviarlo manualmente.");
      } catch {
        setStatus("No se pudo abrir WhatsApp. Inténtalo desde otro navegador.");
      }
    }
  }

  return (
    <section className="rsvp" aria-labelledby="rsvp-title">
      <h2 id="rsvp-title">¿Recorrerás el camino con nosotros?</h2>
      <label htmlFor="guest-name">Tu nombre, opcional</label>
      <input
        id="guest-name"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <div className="actions">
        <button disabled={!available} onClick={() => respond("yes")}>
          Sí, estaré allí
        </button>
        <button disabled={!available} onClick={() => respond("no")}>
          No podré acompañaros
        </button>
        <button disabled={!available} onClick={() => respond("unsure")}>
          Todavía no puedo confirmarlo
        </button>
      </div>
      {!available && (
        <p role="status">Número de WhatsApp pendiente de confirmar.</p>
      )}
      {status && <p role="status">{status}</p>}
    </section>
  );
}
