/**
 * Phusion Passenger entry point for cPanel hosting on unconquered.co.ke
 *
 * Passenger looks for this file at the application root and starts it as the
 * Node.js app process. It passes the PORT via process.env.PORT and handles
 * reverse-proxying from 80/443 automatically.
 *
 * Build first:  npm run build
 * Then upload:  the entire project folder (minus node_modules) to cPanel,
 *               run `npm install --omit=dev` on the server, then
 *               point Passenger's "Application startup file" to app.js
 */

// Load .env.production at runtime (Passenger doesn't read .env automatically)
import { config } from "dotenv";
config({ path: new URL(".env.production", import.meta.url).pathname });

// The Nitro node-server preset outputs to .output/server/index.mjs
// That file exports a default fetch handler that we wrap into an http server.
const { default: handler } = await import("./.output/server/index.mjs");

import http from "http";

const PORT = parseInt(process.env.PORT || "3000", 10);
const HOST = process.env.HOST || "0.0.0.0";

const server = http.createServer(async (req, res) => {
  // Convert Node.js IncomingMessage → Web API Request
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "unconquered.co.ke";
  const url = `${protocol}://${host}${req.url}`;

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined;

  const webReq = new Request(url, {
    method: req.method,
    headers: req.headers,
    body: body && req.method !== "GET" && req.method !== "HEAD" ? body : undefined,
    // @ts-ignore — Node 18+ fetch requires duplex for streaming bodies
    duplex: body ? "half" : undefined,
  });

  try {
    const webRes = await handler.fetch(webReq, process.env, {});

    res.statusCode = webRes.status;
    webRes.headers.forEach((value, key) => res.setHeader(key, value));

    const resBody = await webRes.arrayBuffer();
    res.end(Buffer.from(resBody));
  } catch (err) {
    console.error("[OnlineSoko] Unhandled server error:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain");
    res.end("Internal Server Error");
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[OnlineSoko] Server running on http://${HOST}:${PORT}`);
  console.log(`[OnlineSoko] Production domain: https://unconquered.co.ke`);
});

// Graceful shutdown for Passenger's restart signals
process.on("SIGTERM", () => server.close(() => process.exit(0)));
process.on("SIGINT", () => server.close(() => process.exit(0)));
