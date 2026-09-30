#!/usr/bin/env node
/**
 * Minimal CDP compatibility shim for tools that use Playwright against qutebrowser.
 *
 * qutebrowser/QtWebEngine exposes useful CDP on 127.0.0.1:9223, but Playwright's
 * connectOverCDP sends Browser.setDownloadBehavior during initialization. QtWebEngine
 * rejects that browser-context command, so this shim returns an empty success for
 * exactly that method and proxies everything else unchanged.
 */
import http from "node:http";
import { WebSocket, WebSocketServer } from "ws";

const upstream = new URL(
  process.env.QUTEBROWSER_CDP_UPSTREAM ?? "http://127.0.0.1:9223",
);
const host = process.env.QUTEBROWSER_CDP_SHIM_HOST ?? "127.0.0.1";
const port = Number(process.env.QUTEBROWSER_CDP_SHIM_PORT ?? 9225);
const debug = process.env.QUTEBROWSER_CDP_SHIM_DEBUG === "1";

function cdpMessageText(raw) {
  if (typeof raw === "string") {
    return raw;
  }
  if (Buffer.isBuffer(raw)) {
    return raw.toString("utf8");
  }
  if (raw instanceof ArrayBuffer) {
    return Buffer.from(raw).toString("utf8");
  }
  return Buffer.concat(raw).toString("utf8");
}

function cdpMethod(raw) {
  try {
    return JSON.parse(cdpMessageText(raw)).method;
  } catch {
    return undefined;
  }
}

export function isBrowserSetDownloadBehaviorMessage(raw) {
  try {
    const message = JSON.parse(cdpMessageText(raw));
    return (
      Number.isInteger(message?.id) &&
      message?.method === "Browser.setDownloadBehavior"
    );
  } catch {
    return false;
  }
}

export function browserSetDownloadBehaviorResponse(raw) {
  const { id } = JSON.parse(cdpMessageText(raw));
  return JSON.stringify({ id, result: {} });
}

export function rewriteVersionPayload(payload, publicBaseUrl) {
  const rewritten = { ...payload };
  if (typeof rewritten.webSocketDebuggerUrl === "string") {
    const upstreamWs = new URL(rewritten.webSocketDebuggerUrl);
    const publicBase = new URL(publicBaseUrl);
    upstreamWs.protocol = publicBase.protocol === "https:" ? "wss:" : "ws:";
    upstreamWs.host = publicBase.host;
    rewritten.webSocketDebuggerUrl = upstreamWs.toString();
  }
  return rewritten;
}

function upstreamHttpUrl(path, upstreamUrl = upstream) {
  const url = new URL(upstreamUrl);
  url.pathname = path;
  url.search = "";
  return url;
}

function handleHttp(upstreamUrl) {
  return (req, res) => {
    try {
      const path = new URL(
        req.url ?? "/",
        `http://${req.headers.host ?? `${host}:${port}`}`,
      ).pathname;
      if (debug) {
        console.error("http", path);
      }
      const upstreamRequest = http.request(
        upstreamHttpUrl(path, upstreamUrl),
        (upstreamResponse) => {
          const chunks = [];
          upstreamResponse.on("data", (chunk) => chunks.push(chunk));
          upstreamResponse.on("end", () => {
            let body = Buffer.concat(chunks).toString("utf8");
            if (
              (path === "/json/version" || path === "/json/version/") &&
              upstreamResponse.statusCode === 200
            ) {
              const publicBase = `http://${req.headers.host ?? `${host}:${port}`}`;
              body = JSON.stringify(
                rewriteVersionPayload(JSON.parse(body), publicBase),
              );
            }
            res.writeHead(upstreamResponse.statusCode ?? 502, {
              "content-type":
                upstreamResponse.headers["content-type"] ?? "application/json",
            });
            res.end(body);
          });
        },
      );
      upstreamRequest.on("error", () => {
        if (!res.headersSent) {
          res.writeHead(502, { "content-type": "application/json" });
        }
        res.end(JSON.stringify({ error: "upstream unavailable" }));
      });
      upstreamRequest.end();
    } catch (error) {
      res.writeHead(500, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    }
  };
}

async function browserWebSocketUrl(upstreamUrl = upstream) {
  const response = await fetch(upstreamHttpUrl("/json/version", upstreamUrl));
  if (!response.ok) {
    throw new Error(`upstream /json/version returned ${response.status}`);
  }
  const version = await response.json();
  if (typeof version.webSocketDebuggerUrl !== "string") {
    throw new Error("upstream /json/version has no webSocketDebuggerUrl");
  }
  return version.webSocketDebuggerUrl;
}

function closeWebSocket(socket) {
  if (!socket || socket.readyState === WebSocket.CLOSED) {
    return;
  }
  if (socket.readyState === WebSocket.OPEN) {
    socket.close();
  } else {
    socket.terminate();
  }
}

function pipeWebSocket(client, upstreamSocket) {
  client.on("message", (raw, binary) => {
    if (debug) {
      console.error("client -> upstream", cdpMethod(raw) ?? "<response>");
    }
    if (isBrowserSetDownloadBehaviorMessage(raw)) {
      client.send(browserSetDownloadBehaviorResponse(raw));
      return;
    }
    if (upstreamSocket.readyState === WebSocket.OPEN) {
      upstreamSocket.send(raw, { binary });
    }
  });

  upstreamSocket.on("message", (raw, binary) => {
    if (debug) {
      console.error("upstream -> client", cdpMethod(raw) ?? "<response>");
    }
    if (client.readyState === WebSocket.OPEN) {
      client.send(raw, { binary });
    }
  });

  let closed = false;
  const closeBoth = () => {
    if (closed) {
      return;
    }
    closed = true;
    closeWebSocket(client);
    closeWebSocket(upstreamSocket);
  };
  client.on("close", closeBoth);
  client.on("error", closeBoth);
  upstreamSocket.on("close", closeBoth);
  upstreamSocket.on("error", closeBoth);
}

export async function startShim({
  listenHost = host,
  listenPort = port,
  upstreamUrl = upstream,
} = {}) {
  const server = http.createServer(handleHttp(upstreamUrl));
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", async (req, socket, head) => {
    if (debug) {
      console.error("upgrade", req.url);
    }

    let upstreamSocket;
    let handedOff = false;
    const closePendingUpstream = () => {
      if (!handedOff) {
        closeWebSocket(upstreamSocket);
      }
    };
    socket.on("close", closePendingUpstream);
    socket.on("error", closePendingUpstream);

    try {
      const webSocketUrl = await browserWebSocketUrl(upstreamUrl);
      if (socket.destroyed || socket.writableEnded) {
        closePendingUpstream();
        return;
      }

      upstreamSocket = new WebSocket(webSocketUrl);
      upstreamSocket.once("open", () => {
        if (socket.destroyed || socket.writableEnded) {
          closeWebSocket(upstreamSocket);
          return;
        }
        wss.handleUpgrade(req, socket, head, (client) => {
          if (socket.destroyed || socket.writableEnded) {
            client.terminate();
            closeWebSocket(upstreamSocket);
            return;
          }
          handedOff = true;
          socket.removeListener("close", closePendingUpstream);
          socket.removeListener("error", closePendingUpstream);
          pipeWebSocket(client, upstreamSocket);
        });
      });
      upstreamSocket.once("error", (error) => {
        if (!handedOff) {
          socket.removeListener("close", closePendingUpstream);
          socket.removeListener("error", closePendingUpstream);
          if (!socket.destroyed) {
            socket.destroy(error);
          }
        }
      });
      upstreamSocket.once("close", () => {
        if (!handedOff) {
          socket.removeListener("close", closePendingUpstream);
          socket.removeListener("error", closePendingUpstream);
          if (!socket.destroyed) {
            socket.destroy();
          }
        }
      });
    } catch (error) {
      socket.removeListener("close", closePendingUpstream);
      socket.removeListener("error", closePendingUpstream);
      if (!socket.destroyed) {
        socket.destroy(error instanceof Error ? error : undefined);
      }
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(listenPort, listenHost, resolve);
  });

  return { server, wss };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { server } = await startShim();
  const address = server.address();
  const actualPort =
    typeof address === "object" && address ? address.port : port;
  console.error(
    `qutebrowser CDP shim listening on http://${host}:${actualPort} -> ${upstream.href}`,
  );
}
