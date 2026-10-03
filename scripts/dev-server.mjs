import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import transcriptHandler from "../api/transcript.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT || 4173);
const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

async function serveStatic(pathname, response) {
  let target;
  if (pathname === "/" || pathname === "/index.html") {
    target = path.join(ROOT, "public", "index.html");
  } else if (pathname === "/data/lessons.json") {
    target = path.join(ROOT, "data", "lessons.json");
  } else if (pathname.startsWith("/src/") || pathname.startsWith("/")) {
    const base = pathname.startsWith("/src/") ? path.join(ROOT, "src") : path.join(ROOT, "public");
    const relative = decodeURIComponent(pathname.replace(/^\/(?:src\/)?/, ""));
    target = path.resolve(base, relative);
    if (!target.startsWith(`${base}${path.sep}`)) return false;
  } else {
    return false;
  }

  try {
    const body = await readFile(target);
    response.writeHead(200, {
      "Content-Type": MIME_TYPES[path.extname(target)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store"
    });
    response.end(body);
    return true;
  } catch {
    return false;
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${HOST}:${PORT}`);
  if (url.pathname === "/api/transcript") {
    const adapter = {
      setHeader(name, value) { response.setHeader(name, value); },
      status(statusCode) { response.statusCode = statusCode; return this; },
      json(body) { response.end(JSON.stringify(body)); return this; }
    };
    await transcriptHandler(request, adapter);
    return;
  }

  if (await serveStatic(url.pathname, response)) return;
  response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Not found");
});

server.listen(PORT, HOST, () => {
  console.log(`Dynamic English Player running at http://${HOST}:${PORT}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}