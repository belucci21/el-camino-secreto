import { weddingConfig } from "../config/wedding";
import { EventDetails } from "./EventDetails";

export function StaticFallback() {
  return (
    <section className="static-fallback">
      <h2>
        {weddingConfig.couple.firstPerson} y{" "}
        {weddingConfig.couple.secondPerson}
      </h2>
      <p>Te invitan a celebrar su vínculo eterno.</p>
      <EventDetails />
    </section>
  );
}
