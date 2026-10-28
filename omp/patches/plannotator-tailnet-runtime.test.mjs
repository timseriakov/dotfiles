import assert from "node:assert/strict";
import { test } from "node:test";
import {
  openPlannotatorBrowser,
  plannotatorTailnetAnnouncement,
  plannotatorTailnetUrl,
  preparePlannotatorTailnet,
  publishPlannotatorTailnet,
} from "./plannotator-tailnet-runtime.mjs";

const ok = (stdout = "") => ({ status: 0, stdout, stderr: "" });
const status = (host = "pmx.example.ts.net") =>
  JSON.stringify({ Self: { DNSName: `${host}.` } });
const route = (port, proxy) =>
  JSON.stringify({
    Web: {
      [`pmx.example.ts.net:${port}`]: { Handlers: { "/": { Proxy: proxy } } },
    },
  });
const deps = (run, extra = {}) => ({
  run,
  serveStatusProxy: (_json, port) => {
    const entry = JSON.parse(_json)?.Web?.[`pmx.example.ts.net:${port}`];
    return entry
      ? { state: "mapped", proxy: entry.Handlers["/"].Proxy }
      : { state: "free" };
  },
  buildServeArgs: (port) => [
    "serve",
    "--bg",
    `--https=${port}`,
    `http://127.0.0.1:${port}`,
  ],
  buildServeOffArgs: (port) => ["serve", `--https=${port}`, "off"],
  cliTimeout: 3000,
  serveTimeout: 10000,
  describeFailure: (result) =>
    result.error?.message ?? result.stderr ?? "Tailscale unavailable",
  marker: "x-plannotator-server",
  ...extra,
});

test("uses current MagicDNS name and assigned dynamic port while preserving URL parts", () => {
  const prepared = preparePlannotatorTailnet({
    run: () => ok(status("new-name.tail.ts.net")),
    parseStatusDnsName: (output) =>
      JSON.parse(output).Self.DNSName.replace(/\.$/, ""),
    cliTimeout: 3000,
    describeFailure: () => "offline",
  });
  assert.equal(
    plannotatorTailnetUrl(
      "http://localhost:49123/review?q=1#top",
      prepared.host,
      49123,
    ),
    "https://new-name.tail.ts.net:49123/review?q=1#top",
  );
});

test("unavailable Tailscale stays local with a diagnostic", async () => {
  const prepared = preparePlannotatorTailnet({
    run: () => ({ status: 1, stdout: "", stderr: "offline" }),
    parseStatusDnsName: () => undefined,
    cliTimeout: 1,
    describeFailure: () => "offline",
  });
  const result = await publishPlannotatorTailnet(
    prepared,
    49123,
    "http://localhost:49123",
    deps(() => ok()),
  );
  assert.equal(result.url, undefined);
  assert.equal(result.localUrl, "http://localhost:49123");
  assert.match(result.diagnostic, /offline/);
});

test("foreign route is not replaced or removed", async () => {
  const port = 49124;
  const calls = [];
  const run = (args) => {
    calls.push(args);
    return ok(route(port, "http://127.0.0.1:60000"));
  };
  const result = await publishPlannotatorTailnet(
    { host: "pmx.example.ts.net" },
    port,
    `http://localhost:${port}`,
    deps(run),
  );
  result.cleanup();
  assert.match(result.diagnostic, /already owned/);
  assert.equal(calls.length, 1);
});

test("failed HTTP probe cleans up only a route this process installed", async () => {
  const port = 49125;
  let owned = false;
  const removed = [];
  const run = (args) => {
    if (args[0] === "serve" && args[1] === "status")
      return ok(owned ? route(port, `http://127.0.0.1:${port}`) : "{}");
    if (args[0] === "serve" && args.at(-1) === `http://127.0.0.1:${port}`) {
      owned = true;
      return ok();
    }
    if (args.at(-1) === "off") {
      removed.push(port);
      owned = false;
      return ok();
    }
    throw new Error(`unexpected tailscale args ${args}`);
  };
  const result = await publishPlannotatorTailnet(
    { host: "pmx.example.ts.net" },
    port,
    `http://localhost:${port}`,
    deps(run, {
      request: async () => ({ status: 502, headers: new Headers() }),
    }),
  );
  assert.match(result.diagnostic, /HTTPS probe failed/);
  assert.deepEqual(removed, [port]);
});

test("cleanup is idempotent and does not remove a route replaced by someone else", async () => {
  const port = 49126;
  let proxy;
  const removed = [];
  const run = (args) => {
    if (args[0] === "serve" && args[1] === "status")
      return ok(proxy ? route(port, proxy) : "{}");
    if (args.at(-1) === `http://127.0.0.1:${port}`) {
      proxy = `http://127.0.0.1:${port}`;
      return ok();
    }
    if (args.at(-1) === "off") {
      removed.push(port);
      proxy = undefined;
      return ok();
    }
    throw new Error(`unexpected tailscale args ${args}`);
  };
  const result = await publishPlannotatorTailnet(
    { host: "pmx.example.ts.net" },
    port,
    `http://localhost:${port}`,
    deps(run, {
      request: async () => ({
        status: 200,
        headers: new Headers({ "x-plannotator-server": "1" }),
      }),
    }),
  );
  proxy = "http://127.0.0.1:53723";
  result.cleanup();
  result.cleanup();
  assert.deepEqual(removed, []);
});

test("announcement is explicit about checked HTTPS or local fallback", () => {
  assert.match(
    plannotatorTailnetAnnouncement({ localUrl: "http://localhost:49127" }),
    /Verified Tailscale HTTPS/,
  );
  assert.match(
    plannotatorTailnetAnnouncement({
      localUrl: "http://localhost:49127",
      tailnetDiagnostic: "offline",
    }),
    /offline.*http:\/\/localhost:49127/,
  );
});

test("Plannotator system opener bypasses Glimpse and keeps URL intact", async () => {
  const calls = [];
  const child = {
    once(event, callback) {
      if (event === "spawn") callback();
      return this;
    },
    unref() {},
  };
  const result = await openPlannotatorBrowser(
    "https://pmx.example.ts.net:49128/review?q=1#top",
    {
      resolveBrowserIntent: () => ({ kind: "default" }),
      browserNoneReason: () => "disabled",
      spawnBrowser: (...args) => {
        calls.push(args);
        return child;
      },
      platform: "darwin",
    },
  );
  assert.deepEqual(result, { opened: true });
  assert.equal(calls[0][0], "open");
  assert.equal(
    calls[0][1][0],
    "https://pmx.example.ts.net:49128/review?q=1#top",
  );
});
