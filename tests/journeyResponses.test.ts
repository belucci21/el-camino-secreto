import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "../app/api/responses/route";

const id = "868c967e-b46b-4e7e-b032-bff1934c6063";
const rsvp = { id, kind: "rsvp", name: "Invitado", attendance: "yes", companions: "1", allergies: "", menu: "Vegetariano", message: "" };
const request = (body: object, origin = "https://gladiolajordivinculoeterno.com") => new Request("https://gladiolajordivinculoeterno.com/api/responses", {
  method: "POST", headers: { origin, "Content-Type": "application/json" }, body: JSON.stringify(body),
});
beforeEach(() => { vi.stubEnv("JOURNEY_SHEETS_ENDPOINT", ""); vi.stubEnv("JOURNEY_SHEETS_SECRET", ""); });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("confirmed spreadsheet delivery", () => {
  it("never pretends an unconfigured sheet has received a response", async () => {
    const result = await POST(request(rsvp));
    expect(result.status).toBe(503);
    expect((await result.json()).ok).toBe(false);
  });
  it("rejects foreign-origin and malformed submissions", async () => {
    expect((await POST(request(rsvp, "https://other.example"))).status).toBe(403);
    expect((await POST(request({...rsvp,name:""}))).status).toBe(400);
    expect((await POST(request({...rsvp,kind:"delete"}))).status).toBe(400);
    expect((await POST(request({id,kind:"song",song:" "}))).status).toBe(400);
  });
  it.each([rsvp, { id, kind: "song", song: "Nuestra canción" }])("uses the private proxy and requires a matching receipt for $kind", async (body) => {
    vi.stubEnv("JOURNEY_SHEETS_ENDPOINT", "https://script.google.com/macros/s/example/exec");
    vi.stubEnv("JOURNEY_SHEETS_SECRET", "test-secret-not-real");
    const send = vi.fn().mockResolvedValue(Response.json({ok:true,id}));
    vi.stubGlobal("fetch", send);
    const result = await POST(request(body));
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({ok:true});
    const sent = JSON.parse(send.mock.calls[0][1].body);
    expect(sent).toMatchObject({...body,spreadsheetId:"1LNQX9coVc9r-EzbsMKlqDcyFlKqYCKBLi-RL4KtV55Y"});
    expect(sent.secret).toBe("test-secret-not-real");
    send.mockResolvedValue(Response.json({ok:true,id:"wrong"}));
    expect((await POST(request(body))).status).toBe(502);
    send.mockRejectedValue(new Error("offline"));
    expect((await POST(request(body))).status).toBe(502);
  });
});
