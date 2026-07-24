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
        Calendario, ubicación y WhatsApp se activarán al confirmar los datos.
      </p>
    </footer>
  );
}
