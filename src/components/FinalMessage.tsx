import { weddingConfig } from "../config/wedding";
import { CalendarDownload } from "./CalendarDownload";

export function FinalMessage({ onReplay }: { onReplay: () => void }) {
  return (
    <footer className="final-message">
      <p>Hay historias que comienzan con una puerta.</p>
      <p>{weddingConfig.finalMessage.value}</p>
      <button onClick={onReplay}>Volver a ver la apertura</button>
      <CalendarDownload />
      <p role="status">
        El calendario y la ubicación ya están disponibles. La respuesta de asistencia se guarda en este dispositivo.
      </p>
    </footer>
  );
}
