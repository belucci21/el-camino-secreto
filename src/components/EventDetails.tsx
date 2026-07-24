import { weddingConfig } from "../config/wedding";

const rows = [
  ["Fecha", weddingConfig.event.date],
  ["Ceremonia", weddingConfig.event.ceremonyTime],
  ["Celebración", weddingConfig.event.celebrationTime],
  ["Lugar", weddingConfig.event.venue],
  ["Dirección", weddingConfig.event.address],
  ["Vestimenta", weddingConfig.dressCode],
  ["Transporte", weddingConfig.transport],
  ["Alojamiento", weddingConfig.accommodation],
] as const;

export function EventDetails() {
  return (
    <dl className="event-details">
      {rows.map(([label, field]) => (
        <div key={label} data-status={field.status}>
          <dt>{label}</dt>
          <dd>{field.value}</dd>
        </div>
      ))}
      {weddingConfig.event.mapsUrl.status === "confirmed" && (
        <a href={weddingConfig.event.mapsUrl.value}>Abrir ubicación</a>
      )}
    </dl>
  );
}
