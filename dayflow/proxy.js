#!/usr/bin/env bun

const PORT = 58371;
const UPSTREAM = "https://router.hwqtpa.easypanel.host/v1/chat/completions";
const PATH = "/v1/chat/completions";

const server = Bun.serve({
  hostname: "127.0.0.1",
  port: PORT,
  async fetch(request) {
    if (request.method !== "POST" || new URL(request.url).pathname !== PATH) {
      return new Response("Not found", { status: 404 });
    }

    try {
      const body = await request.json();
      body.stream = false;

      const headers = {
        "content-type": "application/json",
        accept: "application/json",
      };
      const authorization = request.headers.get("authorization");
      if (authorization) headers.authorization = authorization;

      const response = await fetch(UPSTREAM, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      return new Response(response.body, {
        status: response.status,
        headers: {
          "content-type": response.headers.get("content-type") ?? "application/json",
        },
      });
    } catch (error) {
      return Response.json({ error: String(error) }, { status: 502 });
    }
  },
});

console.log(`Dayflow proxy: http://${server.hostname}:${server.port}/v1`);
