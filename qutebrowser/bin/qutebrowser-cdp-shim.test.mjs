#!/usr/bin/env node
import http from "node:http";
import net from "node:net";
import test from "node:test";
import assert from "node:assert/strict";
import { WebSocket, WebSocketServer } from "ws";
import {
  browserSetDownloadBehaviorResponse,
  isBrowserSetDownloadBehaviorMessage,
  rewriteVersionPayload,
  startShim,
} from "./qutebrowser-cdp-shim.mjs";

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve(server.address()));
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

function closeWebSocketServer(wss) {
  for (const socket of wss.clients) {
    socket.terminate();
  }
  return new Promise((resolve, reject) => {
    wss.close((error) => (error ? reject(error) : resolve()));
  });
}

function waitForMessage(socket) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("timed out waiting for websocket message")),
      2000,
    );
    socket.once("message", (data) => {
      clearTimeout(timeout);
      resolve(data.toString());
    });
    socket.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

async function createFakeUpstream({ delayVersion = 0, delayUpgrade = 0 } = {}) {
  const activeSockets = new Set();
  const server = http.createServer((req, res) => {
    if (!req.url?.startsWith("/json/version")) {
      res.writeHead(404).end();
      return;
    }
    const respond = () => {
      const address = server.address();
      res.setHeader("content-type", "application/json");
      res.end(
        JSON.stringify({
          Browser: "fake",
          webSocketDebuggerUrl: `ws://127.0.0.1:${address.port}/devtools/browser/fake`,
        }),
      );
    };
    if (delayVersion) {
      setTimeout(respond, delayVersion);
    } else {
      respond();
    }
  });
  const wss = new WebSocketServer({ noServer: true });
  server.on("upgrade", (req, socket, head) => {
    setTimeout(() => {
      if (!socket.destroyed) {
        wss.handleUpgrade(req, socket, head, (client) =>
          wss.emit("connection", client, req),
        );
      }
    }, delayUpgrade);
  });
  wss.on("connection", (socket) => {
    activeSockets.add(socket);
    socket.once("close", () => activeSockets.delete(socket));
    socket.on("message", (data, binary) => socket.send(data, { binary }));
  });
  const address = await listen(server);
  return {
    address,
    get activeWebSocketConnections() {
      return activeSockets.size;
    },
    server,
    wss,
  };
}

test("intercepts only Browser.setDownloadBehavior requests", () => {
  assert.equal(
    isBrowserSetDownloadBehaviorMessage(
      Buffer.from(
        JSON.stringify({
          id: 7,
          method: "Browser.setDownloadBehavior",
          params: {},
        }),
      ),
    ),
    true,
  );
  assert.equal(
    isBrowserSetDownloadBehaviorMessage(
      JSON.stringify({ id: 7, method: "Browser.getVersion" }),
    ),
    false,
  );
  assert.equal(isBrowserSetDownloadBehaviorMessage("not json"), false);
});

test("returns an empty CDP success response for Playwright download setup", () => {
  assert.deepEqual(
    JSON.parse(
      browserSetDownloadBehaviorResponse(
        JSON.stringify({ id: 42, method: "Browser.setDownloadBehavior" }),
      ),
    ),
    { id: 42, result: {} },
  );
});

test("rewrites browser websocket URL to the shim origin", () => {
  assert.deepEqual(
    rewriteVersionPayload(
      {
        Browser: "qutebrowser/3.6.3",
        webSocketDebuggerUrl: "ws://127.0.0.1:9223/devtools/browser/abc",
      },
      "http://127.0.0.1:9225",
    ),
    {
      Browser: "qutebrowser/3.6.3",
      webSocketDebuggerUrl: "ws://127.0.0.1:9225/devtools/browser/abc",
    },
  );
});

test("rewrites both version endpoint paths and proxies websocket messages", async (t) => {
  const upstream = await createFakeUpstream();
  const shim = await startShim({
    listenHost: "127.0.0.1",
    listenPort: 0,
    upstreamUrl: `http://127.0.0.1:${upstream.address.port}`,
  });
  const shimAddress = shim.server.address();
  let client;
  t.after(async () => {
    client?.terminate();
    await closeWebSocketServer(shim.wss);
    await close(shim.server);
    await closeWebSocketServer(upstream.wss);
    await close(upstream.server);
  });

  for (const path of ["/json/version", "/json/version/"]) {
    const response = await fetch(`http://127.0.0.1:${shimAddress.port}${path}`);
    const version = await response.json();
    assert.equal(
      version.webSocketDebuggerUrl,
      `ws://127.0.0.1:${shimAddress.port}/devtools/browser/fake`,
    );
  }

  const version = await fetch(
    `http://127.0.0.1:${shimAddress.port}/json/version`,
  ).then((response) => response.json());
  client = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    client.once("open", resolve);
    client.once("error", reject);
  });

  client.send(
    Buffer.from(
      JSON.stringify({ id: 1, method: "Browser.setDownloadBehavior" }),
    ),
  );
  assert.deepEqual(JSON.parse(await waitForMessage(client)), {
    id: 1,
    result: {},
  });

  client.send(JSON.stringify({ id: 2, method: "Browser.getVersion" }));
  assert.deepEqual(JSON.parse(await waitForMessage(client)), {
    id: 2,
    method: "Browser.getVersion",
  });
  assert.equal(upstream.activeWebSocketConnections, 1);
});

test("closes an upstream socket when the downstream upgrade disconnects early", async (t) => {
  const upstream = await createFakeUpstream({ delayUpgrade: 100 });
  const shim = await startShim({
    listenHost: "127.0.0.1",
    listenPort: 0,
    upstreamUrl: `http://127.0.0.1:${upstream.address.port}`,
  });
  const shimAddress = shim.server.address();
  t.after(async () => {
    await closeWebSocketServer(shim.wss);
    await close(shim.server);
    await closeWebSocketServer(upstream.wss);
    await close(upstream.server);
  });

  const socket = net.connect(shimAddress.port, "127.0.0.1");
  await new Promise((resolve, reject) => {
    socket.once("connect", resolve);
    socket.once("error", reject);
  });
  socket.write(
    `GET /devtools/browser/fake HTTP/1.1\r\nHost: 127.0.0.1:${shimAddress.port}\r\n` +
      "Connection: Upgrade\r\nUpgrade: websocket\r\n\r\n",
  );
  socket.destroy();
  await new Promise((resolve) => setTimeout(resolve, 250));
  assert.equal(upstream.activeWebSocketConnections, 0);
});
