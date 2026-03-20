import assert from "node:assert/strict";
import test from "node:test";
import {
  createDaemon,
  extractTranslation,
  TokenBucket,
  MAX_TEXT_CHARS,
} from "./translate-selection-daemon";

const HOST = "127.0.0.1";

const withDaemon = async (options, fn) => {
  const daemon = createDaemon({ port: 0, ...options });
  const port = await daemon.listen();
  try {
    await fn(port);
  } finally {
    await daemon.close();
  }
};

test("extractTranslation picks last marker pair", () => {
  const output =
    "BEGIN_TRANSLATION one END_TRANSLATION junk BEGIN_TRANSLATION two END_TRANSLATION";
  const result = extractTranslation(output);
  assert.equal(result, "two");
});

test("extractTranslation throws on missing markers", () => {
  assert.throws(() => extractTranslation("no markers"), {
    code: "parse_error",
  });
});

test("health endpoint responds ok", async () => {
  await withDaemon({}, async (port) => {
    const res = await fetch(`http://${HOST}:${port}/health`);
    assert.equal(await res.text(), "ok");
  });
});

test("preflight returns CORS headers", async () => {
  const origin = "https://mastra.ai";
  await withDaemon({}, async (port) => {
    const res = await fetch(`http://${HOST}:${port}/translate`, {
      method: "OPTIONS",
      headers: {
        Origin: origin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type,x-qute-translate",
      },
    });

    assert.ok(res.status === 204 || res.status === 200);
    assert.equal(res.headers.get("access-control-allow-origin"), origin);

    const vary = res.headers.get("vary");
    const varyValues = vary?.split(",").map((v) => v.trim().toLowerCase());
    assert.ok(varyValues?.includes("origin"));

    const allowMethods = res.headers.get("access-control-allow-methods");
    assert.ok(allowMethods?.includes("POST"));
    assert.ok(allowMethods?.includes("OPTIONS"));

    const allowHeaders = res.headers.get("access-control-allow-headers");
    const allowHeaderValues = allowHeaders
      ?.split(",")
      .map((v) => v.trim().toLowerCase());
    assert.ok(allowHeaderValues?.includes("content-type"));
    assert.ok(allowHeaderValues?.includes("x-qute-translate"));

    assert.equal(res.headers.get("access-control-max-age"), "600");
  });
});

test("rejects missing header", async () => {
  await withDaemon({}, async (port) => {
    const res = await fetch(`http://${HOST}:${port}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: "abc", targetLang: "ru", text: "hi" }),
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.code, "unauthorized");
  });
});

test("rejects too long text", async () => {
  await withDaemon({ runOpencode: async () => "ok" }, async (port) => {
    const res = await fetch(`http://${HOST}:${port}/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Qute-Translate": "1",
      },
      body: JSON.stringify({
        requestId: "abc",
        targetLang: "ru",
        text: "x".repeat(MAX_TEXT_CHARS + 1),
      }),
    });
    assert.equal(res.status, 413);
    const body = await res.json();
    assert.equal(body.code, "too_large");
  });
});

test("POST errors include CORS headers when origin set", async () => {
  const origin = "https://mastra.ai";
  await withDaemon({}, async (port) => {
    const res = await fetch(`http://${HOST}:${port}/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: origin,
      },
      body: JSON.stringify({ requestId: "abc", targetLang: "ru", text: "hi" }),
    });

    assert.equal(res.status, 401);
    assert.equal(res.headers.get("access-control-allow-origin"), origin);
    const vary = res.headers.get("vary");
    const varyValues = vary?.split(",").map((v) => v.trim().toLowerCase());
    assert.ok(varyValues?.includes("origin"));
  });
});

test("successful translation uses runner", async () => {
  await withDaemon({ runOpencode: async () => "привет" }, async (port) => {
    const res = await fetch(`http://${HOST}:${port}/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Qute-Translate": "1",
      },
      body: JSON.stringify({ requestId: "abc", targetLang: "ru", text: "hi" }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.translation, "привет");
  });
});

test("POST success includes CORS headers when origin set", async () => {
  const origin = "https://mastra.ai";
  await withDaemon({ runOpencode: async () => "ok" }, async (port) => {
    const res = await fetch(`http://${HOST}:${port}/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Qute-Translate": "1",
        Origin: origin,
      },
      body: JSON.stringify({ requestId: "abc", targetLang: "ru", text: "hi" }),
    });

    assert.equal(res.status, 200);
    assert.equal(res.headers.get("access-control-allow-origin"), origin);
    const vary = res.headers.get("vary");
    const varyValues = vary?.split(",").map((v) => v.trim().toLowerCase());
    assert.ok(varyValues?.includes("origin"));
  });
});

test("busy when another request in flight", async () => {
  let release;
  const runner = () =>
    new Promise((resolve) => {
      release = resolve;
    });
  await withDaemon({ runOpencode: runner }, async (port) => {
    const first = fetch(`http://${HOST}:${port}/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Qute-Translate": "1",
      },
      body: JSON.stringify({ requestId: "one", targetLang: "ru", text: "hi" }),
    });

    const second = await fetch(`http://${HOST}:${port}/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Qute-Translate": "1",
      },
      body: JSON.stringify({ requestId: "two", targetLang: "ru", text: "hi" }),
    });
    assert.equal(second.status, 503);
    const body = await second.json();
    assert.equal(body.code, "busy");
    release("done");
    await first;
  });
});

test("rate limit triggers", async () => {
  const limiter = new TokenBucket({ capacity: 1, refillPerMinute: 0 });
  await withDaemon(
    { rateLimiter: limiter, runOpencode: async () => "ok" },
    async (port) => {
      const okRes = await fetch(`http://${HOST}:${port}/translate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Qute-Translate": "1",
        },
        body: JSON.stringify({
          requestId: "one",
          targetLang: "ru",
          text: "hi",
        }),
      });
      assert.equal(okRes.status, 200);

      const limited = await fetch(`http://${HOST}:${port}/translate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Qute-Translate": "1",
        },
        body: JSON.stringify({
          requestId: "two",
          targetLang: "ru",
          text: "hi",
        }),
      });
      assert.equal(limited.status, 429);
      const body = await limited.json();
      assert.equal(body.code, "rate_limited");
    },
  );
});

test("runner timeout returns 504", async () => {
  const never = () => new Promise(() => {});
  await withDaemon({ runOpencode: never, timeoutMs: 50 }, async (port) => {
    const res = await fetch(`http://${HOST}:${port}/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Qute-Translate": "1",
      },
      body: JSON.stringify({ requestId: "abc", targetLang: "ru", text: "hi" }),
    });
    assert.equal(res.status, 504);
    const body = await res.json();
    assert.equal(body.code, "timeout");
  });
});

test("parse_error surfaced when runner throws", async () => {
  const runner = () => {
    const err = new Error("no markers");
    err.code = "parse_error";
    throw err;
  };
  await withDaemon({ runOpencode: runner }, async (port) => {
    const res = await fetch(`http://${HOST}:${port}/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Qute-Translate": "1",
      },
      body: JSON.stringify({ requestId: "abc", targetLang: "ru", text: "hi" }),
    });
    assert.equal(res.status, 502);
    const body = await res.json();
    assert.equal(body.code, "parse_error");
  });
});
