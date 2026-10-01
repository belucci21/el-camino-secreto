const spreadsheetId = "1LNQX9coVc9r-EzbsMKlqDcyFlKqYCKBLi-RL4KtV55Y";
const reply = (body: object, status: number) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const allowedOrigins = new Set(["https://gladiolajordivinculoeterno.com", "https://www.gladiolajordivinculoeterno.com"]);
  if (process.env.NODE_ENV !== "production") allowedOrigins.add(new URL(request.url).origin);
  if (!origin || !allowedOrigins.has(origin)) return reply({ ok: false }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return reply({ ok: false }, 415);
  const raw = await request.text();
  if (raw.length > 12000) return reply({ ok: false }, 413);
  let data: Record<string, unknown>;
  try { data = JSON.parse(raw); } catch { return reply({ ok: false }, 400); }
  if (!data || typeof data !== "object" || !/^[\da-f-]{36}$/i.test(String(data.id ?? ""))) return reply({ ok: false }, 400);
  const text = (key: string, max: number) => typeof data[key] === "string" && (data[key] as string).length <= max;
  let values: Record<string, unknown>;
  if (data.kind === "rsvp") {
    if (!text("name", 160) || !(data.name as string).trim() || !["yes", "no"].includes(String(data.attendance)) ||
        !/^[0-5]$/.test(String(data.companions)) || !text("allergies", 1000) || !text("menu", 80) || !text("message", 2000)) return reply({ ok: false }, 400);
    values = Object.fromEntries(["name", "attendance", "companions", "allergies", "menu", "message"].map(key => [key, data[key]]));
  } else if (data.kind === "song") {
    if (!text("song", 500) || !(data.song as string).trim()) return reply({ ok: false }, 400);
    values = { song: (data.song as string).trim() };
  } else return reply({ ok: false }, 400);

  const endpoint = process.env.JOURNEY_SHEETS_ENDPOINT;
  const secret = process.env.JOURNEY_SHEETS_SECRET;
  if (!endpoint || !secret || !/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(endpoint)) {
    return reply({ ok: false, error: "La recepción de respuestas todavía no está configurada." }, 503);
  }
  try {
    const upstream = await fetch(endpoint, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spreadsheetId, secret, id: data.id, kind: data.kind, ...values }),
      signal: AbortSignal.timeout(15000),
    });
    const result = await upstream.json();
    if (!upstream.ok || result.ok !== true || result.id !== data.id) return reply({ ok: false }, 502);
    return reply({ ok: true }, 200);
  } catch { return reply({ ok: false }, 502); }
}
