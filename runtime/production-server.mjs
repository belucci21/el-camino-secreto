import { join } from "node:path";
import { startProdServer } from "vinext/server/prod-server";
import { createMediaRequestHandler } from "./media-delivery.mjs";

const outDir = join(import.meta.dirname, "..", "dist");
const { server } = await startProdServer({
  port: Number.parseInt(process.env.PORT ?? "3000", 10),
  host: process.env.HOST ?? "0.0.0.0",
  outDir,
});

// Preserve vinext's existing SSR/API handlers; only the shipped media paths
// bypass its generic static response, which lacks iPhone byte-range support.
const applicationHandlers = server.listeners("request");
server.removeAllListeners("request");
server.on("request", createMediaRequestHandler(join(outDir, "client"), (req, res) => {
  for (const handler of applicationHandlers) handler.call(server, req, res);
}));
