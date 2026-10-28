// omp-plannotator-tailnet-runtime-v1
import { spawn } from "node:child_process";

const expectedProxy = (port) => `http://127.0.0.1:${port}`;

function routeState(run, port, dependencies) {
  const result = run(["serve", "status", "--json"], dependencies.cliTimeout);
  if (result.error || result.status !== 0)
    return { error: dependencies.describeFailure(result) };
  const state = dependencies.serveStatusProxy(result.stdout, port);
  return state.state === "malformed"
    ? { error: "Tailscale Serve returned unrecognized route status." }
    : state;
}

function ownsRoute(run, port, dependencies) {
  const state = routeState(run, port, dependencies);
  return state.state === "mapped" && state.proxy === expectedProxy(port);
}

export function preparePlannotatorTailnet(dependencies) {
  const result = dependencies.run(
    ["status", "--json"],
    dependencies.cliTimeout,
  );
  if (result.error || result.status !== 0) {
    return {
      host: undefined,
      diagnostic: dependencies.describeFailure(result),
    };
  }
  const host = dependencies.parseStatusDnsName(result.stdout);
  return host
    ? { host, diagnostic: undefined }
    : {
        host: undefined,
        diagnostic:
          "Tailscale did not report a MagicDNS hostname suitable for HTTPS.",
      };
}

export function plannotatorTailnetUrl(localUrl, host, port) {
  const url = new URL(localUrl);
  url.protocol = "https:";
  url.hostname = host;
  url.port = String(port);
  return url.toString();
}

export async function publishPlannotatorTailnet(
  setup,
  port,
  localUrl,
  dependencies,
) {
  const {
    run,
    request = fetch,
    buildServeArgs,
    buildServeOffArgs,
    serveTimeout,
    marker,
  } = dependencies;
  const fallback = (diagnostic) => ({
    url: undefined,
    localUrl,
    diagnostic,
    cleanup() {},
  });
  if (!setup.host)
    return fallback(setup.diagnostic ?? "Tailscale MagicDNS is unavailable.");

  const before = routeState(run, port, dependencies);
  if (before.error) return fallback(before.error);
  if (before.state === "mapped")
    return fallback(
      `Tailscale HTTPS port ${port} is already owned by another route.`,
    );

  const published = run(buildServeArgs(port), serveTimeout);
  if (published.error || published.status !== 0)
    return fallback(dependencies.describeFailure(published));
  if (!ownsRoute(run, port, dependencies)) {
    return fallback(
      `Could not verify ownership of Tailscale HTTPS port ${port}; it was left untouched.`,
    );
  }

  const removeOwnedRoute = () => {
    if (!ownsRoute(run, port, dependencies)) return;
    const removed = run(buildServeOffArgs(port), serveTimeout);
    if (removed.error || removed.status !== 0) {
      console.error(
        `[plannotator] Could not remove owned Tailscale route on port ${port}: ${dependencies.describeFailure(removed)}`,
      );
    }
  };
  let url;
  try {
    url = plannotatorTailnetUrl(localUrl, setup.host, port);
    const probeUrl = new URL(url);
    probeUrl.pathname = "/";
    probeUrl.search = "";
    probeUrl.hash = "";
    const response = await request(probeUrl, {
      redirect: "manual",
      signal: AbortSignal.timeout(5000),
    });
    if (response.status !== 200 || response.headers.get(marker) === null) {
      removeOwnedRoute();
      return fallback(
        `HTTPS probe failed for port ${port}: expected Plannotator HTTP 200 response.`,
      );
    }
  } catch (error) {
    removeOwnedRoute();
    return fallback(
      `HTTPS probe failed for port ${port}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  let cleaned = false;
  return {
    url,
    localUrl,
    diagnostic: undefined,
    cleanup() {
      if (cleaned) return;
      cleaned = true;
      removeOwnedRoute();
    },
  };
}

export function plannotatorTailnetAnnouncement(access) {
  if (!access?.localUrl) return "";
  return access.tailnetDiagnostic
    ? ` Tailscale HTTPS unavailable: ${access.tailnetDiagnostic}. Local URL: ${access.localUrl}.`
    : ` Verified Tailscale HTTPS. Local URL: ${access.localUrl}.`;
}

export async function openPlannotatorBrowser(
  url,
  {
    resolveBrowserIntent,
    browserNoneReason,
    spawnBrowser = spawn,
    platform = process.platform,
  },
) {
  const intent = resolveBrowserIntent(process.env);
  if (intent.kind === "none")
    return { opened: false, notOpening: browserNoneReason(intent), url };
  const command =
    platform === "darwin"
      ? "open"
      : platform === "win32"
        ? "cmd.exe"
        : "xdg-open";
  const args = platform === "win32" ? ["/c", "start", "", url] : [url];
  try {
    const child = spawnBrowser(command, args, {
      detached: true,
      stdio: "ignore",
    });
    const error = await new Promise((resolve) => {
      child.once("spawn", () => resolve(undefined));
      child.once("error", resolve);
    });
    if (error) return { opened: false };
    child.unref();
    return { opened: true };
  } catch {
    return { opened: false };
  }
}
