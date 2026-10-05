import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, join } from "node:path";

const mediaTypes = {
  ".mp4": "video/mp4", ".mp3": "audio/mpeg", ".m4a": "audio/mp4",
  ".wav": "audio/wav", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp",
};

function byteRange(header, size) {
  // Multiple or unknown range units may be ignored; never concatenate files
  // or allocate the full film in memory to answer a Safari range probe.
  if (!header || !header.startsWith("bytes=") || header.includes(",")) return undefined;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (!match[1] && !match[2]) || size === 0) return null;
  const first = Number(match[1]);
  const last = Number(match[2]);
  if (!Number.isSafeInteger(first) || !Number.isSafeInteger(last)) return null;
  if (!match[1]) return last > 0 ? { start: Math.max(0, size - last), end: size - 1 } : null;
  const end = match[2] ? Math.min(last, size - 1) : size - 1;
  return first < size && first <= end ? { start: first, end } : null;
}

export function createMediaRequestHandler(clientDirectory, fallback) {
  return (req, res) => {
    const pathname = (req.url ?? "").split("?")[0];
    // Only shipped, flat media filenames. No decoding or path normalization
    // can turn an encoded slash or '..' into access outside these two folders.
    const match = /^\/(journey-final|audio)\/([a-zA-Z0-9][a-zA-Z0-9._-]*)$/.exec(pathname);
    const contentType = match && mediaTypes[extname(match[2]).toLowerCase()];
    if (!match || !contentType) return fallback(req, res);
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405, { Allow: "GET, HEAD" }); res.end(); return;
    }
    void (async () => {
      let file;
      const filename = join(clientDirectory, match[1], match[2]);
      try { file = await stat(filename); } catch { return fallback(req, res); }
      if (!file.isFile()) return fallback(req, res);
      const etag = `"${file.size.toString(16)}-${Math.trunc(file.mtimeMs).toString(16)}"`;
      const headers = {
        "Content-Type": contentType, "Accept-Ranges": "bytes", ETag: etag,
        "Last-Modified": file.mtime.toUTCString(),
        "Cache-Control": "public, max-age=0, must-revalidate",
      };
      if (req.headers["if-none-match"]?.split(/\s*,\s*/).includes(etag)) {
        res.writeHead(304, headers); res.end(); return;
      }
      const ifRange = req.headers["if-range"];
      const sameFile = !ifRange || ifRange === etag || Date.parse(ifRange) >= Math.floor(file.mtimeMs / 1000) * 1000;
      const range = req.method === "GET" && sameFile ? byteRange(req.headers.range, file.size) : undefined;
      if (range === null) {
        res.writeHead(416, { ...headers, "Content-Range": `bytes */${file.size}`, "Content-Length": "0" });
        res.end(); return;
      }
      const start = range?.start ?? 0;
      const end = range?.end ?? file.size - 1;
      headers["Content-Length"] = String(file.size === 0 ? 0 : end - start + 1);
      if (range) headers["Content-Range"] = `bytes ${start}-${end}/${file.size}`;
      res.writeHead(range ? 206 : 200, headers);
      if (req.method === "HEAD" || file.size === 0) { res.end(); return; }
      const stream = createReadStream(filename, { start, end });
      stream.on("error", () => res.destroy());
      res.on("close", () => stream.destroy());
      stream.pipe(res);
    })().catch(() => {
      if (res.headersSent) res.destroy();
      else { res.writeHead(500); res.end(); }
    });
  };
}
