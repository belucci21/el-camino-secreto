export async function submitJourneyResponse(payload: Record<string, unknown>) {
  const response = await fetch("/api/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20000),
  });
  const result = await response.json();
  if (!response.ok || result.ok !== true) {
    throw new Error("No se ha podido enviar. Tus datos siguen aquí; vuelve a intentarlo.");
  }
}
