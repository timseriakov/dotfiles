import {
  buildServeArgs,
  buildServeOffArgs,
  describeTailscaleFailure,
  parseTailscaleStatusDnsName,
  runTailscale,
  serveStatusProxy,
  TAILSCALE_CLI_TIMEOUT_MS,
  TAILSCALE_SERVE_TIMEOUT_MS,
} from "./generated/tailscale.ts";
import { PLANNOTATOR_SERVER_HEADER } from "./generated/plannotator-server-marker.ts";
import {
  browserNoneReason,
  resolveBrowserIntent,
} from "./generated/browser-intent.ts";
import {
  openPlannotatorBrowser as openBrowser,
  preparePlannotatorTailnet as prepare,
  publishPlannotatorTailnet as publish,
} from "./plannotator-tailnet-runtime.mjs";

const dependencies = {
  run: runTailscale,
  parseStatusDnsName: parseTailscaleStatusDnsName,
  serveStatusProxy,
  buildServeArgs,
  buildServeOffArgs,
  cliTimeout: TAILSCALE_CLI_TIMEOUT_MS,
  serveTimeout: TAILSCALE_SERVE_TIMEOUT_MS,
  describeFailure: describeTailscaleFailure,
  marker: PLANNOTATOR_SERVER_HEADER,
};

export function preparePlannotatorTailnet() {
  return prepare(dependencies);
}

export function publishPlannotatorTailnet(setup, port, localUrl) {
  return publish(setup, port, localUrl, dependencies);
}

export function openPlannotatorBrowser(url) {
  return openBrowser(url, { resolveBrowserIntent, browserNoneReason });
}
