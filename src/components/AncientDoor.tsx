export function AncientDoor({
  state,
}: {
  state: "distant" | "waiting" | "wrong" | "awake" | "open";
}) {
  return (
    <div className="ancient-door" data-state={state} aria-hidden="true">
      <div className="door-arch">
        <div className="door-leaf door-left" />
        <div className="door-light" />
        <div className="door-leaf door-right" />
      </div>
    </div>
  );
}
