import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, "..");
const clientRoot = path.join(projectRoot, "dist", "client");
const serverEntry = path.join(projectRoot, "dist", "server", "index.js");

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

function headersFromIncoming(request) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) headers.set(name, value.join(", "));
    else if (value !== undefined) headers.set(name, value);
  }
  return headers;
}

function staticPathFromRequest(request) {
  const pathname = decodeURIComponent(new URL(request.url).pathname);
  const relativePath = pathname.replace(/^\/+/, "");
  const candidate = path.resolve(clientRoot, relativePath);
  return candidate === clientRoot || candidate.startsWith(`${clientRoot}${path.sep}`) ? candidate : null;
}

async function serveStatic(request) {
  const filePath = staticPathFromRequest(request);
  if (!filePath) return new Response("Not found", { status: 404 });
  try {
    const file = await readFile(filePath);
    return new Response(file, {
      headers: { "content-type": MIME_TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

async function sendResponse(response, incoming, outgoing) {
  outgoing.statusCode = response.status;
  response.headers.forEach((value, key) => outgoing.setHeader(key, value));
  if (incoming.method === "HEAD") {
    outgoing.end();
    return;
  }
  outgoing.end(Buffer.from(await response.arrayBuffer()));
}

function requestBody(request) {
  return ["GET", "HEAD"].includes(request.method) ? undefined : request;
}

export async function startAppServer() {
  const { default: app } = await import(new URL(`file://${serverEntry.replaceAll("\\", "/")}`).href);
  const server = createServer(async (incoming, outgoing) => {
    try {
      const protocol = incoming.headers.host?.includes(":") ? "http" : "http";
      const requestUrl = `${protocol}://${incoming.headers.host ?? "127.0.0.1"}${incoming.url ?? "/"}`;
      const request = new Request(requestUrl, {
        method: incoming.method ?? "GET",
        headers: headersFromIncoming(incoming),
        body: requestBody(incoming),
        duplex: "half",
      });

      const staticResponse = await serveStatic(request);
      if (staticResponse.status !== 404) {
        await sendResponse(staticResponse, incoming, outgoing);
        return;
      }

      const response = await app.fetch(request, {
        ASSETS: { fetch: serveStatic },
      }, {
        waitUntil() {},
        passThroughOnException() {},
      });
      await sendResponse(response, incoming, outgoing);
    } catch (error) {
      console.error("Series Scout local server error", error);
      outgoing.statusCode = 500;
      outgoing.end("Series Scout failed to render this page.");
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Unable to determine local server port");
  return { server, url: `http://127.0.0.1:${address.port}/` };
}
