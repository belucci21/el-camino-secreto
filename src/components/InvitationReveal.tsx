import { weddingConfig } from "../config/wedding";
import { EventDetails } from "./EventDetails";
import { RSVPWhatsApp } from "./RSVPWhatsApp";

export function InvitationReveal() {
  return (
    <section className="scene revealed" aria-labelledby="invitation-title">
      <div className="revealed-aura" aria-hidden="true" />
      <p>El camino te ha traído hasta aquí.</p>
      <h2 id="invitation-title">
        {weddingConfig.couple.firstPerson} y{" "}
        {weddingConfig.couple.secondPerson}
      </h2>
      <p>Te invitan a celebrar su vínculo eterno.</p>
      <EventDetails />
      <RSVPWhatsApp />
    </section>
  );
}
