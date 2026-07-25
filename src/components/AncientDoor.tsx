import { PortalFallback } from "./PortalStage";
import type { PortalVisualState } from "./PortalCanvas";

export function AncientDoor({ state }: { state: PortalVisualState }) {
  return (
    <div className="ancient-door" data-state={state}>
      <PortalFallback state={state} />
    </div>
  );
}
