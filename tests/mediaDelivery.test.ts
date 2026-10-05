// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer, type Server } from "node:http";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createMediaRequestHandler } from "../runtime/media-delivery.mjs";

describe("iPhone production media delivery", () => {
  let directory: string;
  let server: Server;
  let origin: string;
  beforeAll(async () => {
    directory = await mkdtemp(join(tmpdir(), "journey-media-test-"));
    await mkdir(join(directory, "journey-final"));
    await mkdir(join(directory, "audio"));
    await writeFile(join(directory, "journey-final", "door.mp4"), "0123456789");
    await writeFile(join(directory, "audio", "ambient.mp3"), "0123456789");
    server = createServer(createMediaRequestHandler(directory, (_req, res) => {
      res.writeHead(404); res.end("application fallback");
    }));
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw Error("No test address");
    origin = `http://127.0.0.1:${address.port}`;
  });
  afterAll(async () => {
    if (server) await new Promise<void>(resolve => server.close(() => resolve()));
    if (directory) await rm(directory, { recursive: true, force: true });
  });

  it("serves Safari's initial two-byte probe as partial video, not an entire generic file", async () => {
    const response = await fetch(`${origin}/journey-final/door.mp4`, { headers: { Range: "bytes=0-1" } });
    expect(response.status).toBe(206);
    expect(response.headers.get("content-type")).toBe("video/mp4");
    expect(response.headers.get("accept-ranges")).toBe("bytes");
    expect(response.headers.get("content-range")).toBe("bytes 0-1/10");
    expect(response.headers.get("content-length")).toBe("2");
    expect(await response.text()).toBe("01");
  });
  it.each([ ["bytes=8-", "89"], ["bytes=-2", "89"], ["bytes=8-99", "89"] ])("handles valid range %s", async (range, body) => {
    const response = await fetch(`${origin}/journey-final/door.mp4`, { headers: { Range: range } });
    expect(response.status).toBe(206);
    expect(response.headers.get("content-range")).toBe("bytes 8-9/10");
    expect(await response.text()).toBe(body);
  });
  it("returns 416 for an unsatisfiable range", async () => {
    const response = await fetch(`${origin}/journey-final/door.mp4`, { headers: { Range: "bytes=10-" } });
    expect(response.status).toBe(416);
    expect(response.headers.get("content-range")).toBe("bytes */10");
  });
  it("supports full GET and HEAD with the exact size", async () => {
    const get = await fetch(`${origin}/journey-final/door.mp4`);
    expect(get.status).toBe(200);
    expect(await get.text()).toBe("0123456789");
    const head = await fetch(`${origin}/journey-final/door.mp4`, { method: "HEAD" });
    expect(head.status).toBe(200);
    expect(head.headers.get("content-length")).toBe("10");
    expect(await head.text()).toBe("");
  });
  it("serves music with its audio type and byte ranges", async () => {
    const response = await fetch(`${origin}/audio/ambient.mp3`, { headers: { Range: "bytes=0-1" } });
    expect(response.status).toBe(206);
    expect(response.headers.get("content-type")).toBe("audio/mpeg");
    expect(await response.text()).toBe("01");
  });
  it("honors If-Range without delivering a fragment from a changed file", async () => {
    const head = await fetch(`${origin}/journey-final/door.mp4`, { method: "HEAD" });
    const etag = head.headers.get("etag")!;
    const same = await fetch(`${origin}/journey-final/door.mp4`, { headers: { Range: "bytes=0-1", "If-Range": etag } });
    expect(same.status).toBe(206);
    expect(await same.text()).toBe("01");
    const changed = await fetch(`${origin}/journey-final/door.mp4`, { headers: { Range: "bytes=0-1", "If-Range": '"old"' } });
    expect(changed.status).toBe(200);
    expect(await changed.text()).toBe("0123456789");
  });
  it.each(["/api/attendance", "/journey-final/%2e%2e%2fprivate.mp4", "/journey-final/missing.mp4"]) ("does not expose files or intercept application routes: %s", async path => {
    const response = await fetch(`${origin}${path}`);
    expect(response.status).toBe(404);
    expect(await response.text()).toBe("application fallback");
  });
});
