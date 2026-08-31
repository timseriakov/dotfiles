import { existsSync } from "node:fs";

const CDP_URL = process.env.QUTE_CDP_URL ?? "http://127.0.0.1:9223";
const HOST = process.env.QUTE_TABS_HOST ?? "127.0.0.1";
const PORT = Number(process.env.QUTE_TABS_PORT ?? "1932");
const PUBLIC_URL = process.env.QUTE_TABS_PUBLIC_URL ?? `http://${HOST}:${PORT}`;
const LIVE_TABS_PATH =
  process.env.QUTE_TABS_JSON ??
  `${process.env.HOME}/Library/Application Support/qutebrowser/glance-tabs.json`;
const PREVIEW_LIMIT = Number(process.env.QUTE_PREVIEW_LIMIT ?? "8");
const PREVIEW_MAX_AGE_MS = Number(
  process.env.QUTE_PREVIEW_MAX_AGE_MS ?? "120000",
);

type Tab = {
  id: string;
  title: string;
  url: string;
  faviconUrl: string;
  pinned?: boolean;
  screenshotUrl?: string;
};
type WindowGroup = {
  index: number;
  active: boolean;
  count: number;
  tabs: Tab[];
};
type CdpTab = {
  id?: unknown;
  type?: unknown;
  title?: unknown;
  url?: unknown;
  faviconUrl?: unknown;
  webSocketDebuggerUrl?: unknown;
};
type LiveTab = { title?: unknown; url?: unknown; pinned?: unknown };
type ScreenshotCache = { at: number; bytes: Uint8Array };
type CdpResult = { data?: unknown };
type CdpMessage = { id?: unknown; result?: unknown; error?: unknown };

const screenshots = new Map<string, ScreenshotCache>();
const failedScreenshots = new Map<string, number>();
const pendingScreenshots = new Set<string>();
let screenshotQueue = Promise.resolve();

const isLiveTab = (tab: unknown): tab is LiveTab & { url: string } =>
  typeof tab === "object" &&
  tab !== null &&
  "url" in tab &&
  typeof tab.url === "string" &&
  tab.url.length > 0;

const isCdpPage = (
  tab: unknown,
): tab is CdpTab & { type: "page"; url: string } =>
  typeof tab === "object" &&
  tab !== null &&
  "type" in tab &&
  tab.type === "page" &&
  "url" in tab &&
  typeof tab.url === "string" &&
  tab.url.length > 0;

const tabFromCdp = (tab: CdpTab & { type: "page"; url: string }): Tab => ({
  id: typeof tab.id === "string" ? tab.id : "",
  title: typeof tab.title === "string" && tab.title ? tab.title : tab.url,
  url: tab.url,
  faviconUrl: typeof tab.faviconUrl === "string" ? tab.faviconUrl : "",
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

const parseCdpMessage = (data: string): CdpMessage => {
  const message = JSON.parse(data) as unknown;
  return typeof message === "object" && message !== null ? message : {};
};

const cdpCall = (
  wsUrl: string,
  method: string,
  params: Record<string, unknown> = {},
) =>
  new Promise<unknown>((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const id = 1;
    const timer = setTimeout(() => {
      ws.close();
      reject(new Error(`timeout ${method}`));
    }, 5000);

    ws.addEventListener("open", () =>
      ws.send(JSON.stringify({ id, method, params })),
    );
    ws.addEventListener("message", (event) => {
      const message = parseCdpMessage(String(event.data));
      if (message.id !== id) return;
      clearTimeout(timer);
      ws.close();
      message.error
        ? reject(new Error(JSON.stringify(message.error)))
        : resolve(message.result);
    });
    ws.addEventListener("error", () => {
      clearTimeout(timer);
      reject(new Error(`websocket failed ${method}`));
    });
  });

const captureScreenshot = async (
  tab: CdpTab & { type: "page"; url: string },
) => {
  if (typeof tab.webSocketDebuggerUrl !== "string") return "";

  const cached = screenshots.get(tab.url);
  if (cached && Date.now() - cached.at < PREVIEW_MAX_AGE_MS)
    return `${PUBLIC_URL}/screenshot/${encodeURIComponent(tab.url)}`;

  const result = await cdpCall(
    tab.webSocketDebuggerUrl,
    "Page.captureScreenshot",
    {
      format: "jpeg",
      quality: 35,
      captureBeyondViewport: false,
    },
  );
  if (
    typeof result !== "object" ||
    result === null ||
    !("data" in result) ||
    typeof result.data !== "string"
  )
    return "";

  screenshots.set(tab.url, {
    at: Date.now(),
    bytes: Buffer.from(result.data, "base64"),
  });
  return `${PUBLIC_URL}/screenshot/${encodeURIComponent(tab.url)}`;
};

const addCachedScreenshots = (tabs: Tab[]) => {
  for (const tab of tabs) {
    const cached = screenshots.get(tab.url);
    if (cached && Date.now() - cached.at < PREVIEW_MAX_AGE_MS)
      tab.screenshotUrl = `${PUBLIC_URL}/screenshot/${encodeURIComponent(tab.url)}`;
  }
};

const refreshScreenshots = (
  cdpTabs: (CdpTab & { type: "page"; url: string })[],
) => {
  for (const cdpTab of cdpTabs
    .filter((tab) => {
      const failedAt = failedScreenshots.get(tab.url) ?? 0;
      return Date.now() - failedAt >= PREVIEW_MAX_AGE_MS;
    })
    .slice(0, PREVIEW_LIMIT)) {
    if (screenshots.has(cdpTab.url) || pendingScreenshots.has(cdpTab.url))
      continue;
    pendingScreenshots.add(cdpTab.url);
    screenshotQueue = screenshotQueue
      .then(() => captureScreenshot(cdpTab))
      .catch((error) => {
        failedScreenshots.set(cdpTab.url, Date.now());
        console.error(`screenshot failed for ${cdpTab.url}: ${error}`);
      })
      .finally(() => pendingScreenshots.delete(cdpTab.url));
  }
};

const readLiveWindows = async (): Promise<WindowGroup[] | undefined> => {
  if (!existsSync(LIVE_TABS_PATH)) return undefined;

  const raw = await Bun.file(LIVE_TABS_PATH).json();
  if (
    typeof raw !== "object" ||
    raw === null ||
    !("windows" in raw) ||
    !Array.isArray(raw.windows)
  )
    return undefined;

  const windows = raw.windows.map((window, index) => {
    const source = typeof window === "object" && window !== null ? window : {};
    const tabs =
      "tabs" in source && Array.isArray(source.tabs) ? source.tabs : [];
    const parsedTabs = tabs.filter(isLiveTab).map((tab) => ({
      id: "",
      title: typeof tab.title === "string" && tab.title ? tab.title : tab.url,
      url: tab.url,
      faviconUrl: "",
      pinned: "pinned" in tab && tab.pinned === true,
    }));
    return {
      index:
        "index" in source && typeof source.index === "number"
          ? source.index
          : index + 1,
      active: "active" in source && source.active === true,
      tabs: parsedTabs,
      count: parsedTabs.length,
    };
  });

  return windows.some((window) => window.count > 0) ? windows : undefined;
};

Bun.serve({
  hostname: HOST,
  port: PORT,
  async fetch(req) {
    const { pathname } = new URL(req.url);

    if (pathname === "/health") return json({ ok: true });
    if (pathname.startsWith("/screenshot/")) {
      const cached = screenshots.get(
        decodeURIComponent(pathname.slice("/screenshot/".length)),
      );
      return cached
        ? new Response(cached.bytes, {
            headers: {
              "content-type": "image/jpeg",
              "cache-control": "public, max-age=120",
            },
          })
        : new Response("not found", { status: 404 });
    }
    if (pathname !== "/tabs") return json({ error: "not found" }, 404);

    try {
      const res = await fetch(`${CDP_URL}/json`);
      if (!res.ok) throw new Error(`CDP ${res.status}`);

      const rawTabs = await res.json();
      const cdpTabs = (Array.isArray(rawTabs) ? rawTabs : []).filter(isCdpPage);
      const tabs = cdpTabs.map(tabFromCdp);
      const windows = (await readLiveWindows()) ?? [
        { index: 1, active: true, count: tabs.length, tabs },
      ];
      const groupedTabs = windows.flatMap((window) => window.tabs);
      addCachedScreenshots([...tabs, ...groupedTabs]);
      refreshScreenshots(cdpTabs);

      return json({
        tabs,
        windows,
        count: tabs.length,
        windowCount: windows.length,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      return json(
        {
          tabs: [],
          windows: [],
          count: 0,
          windowCount: 0,
          error: String(error),
        },
        502,
      );
    }
  },
});

console.log(`qute-tabs-server listening on http://${HOST}:${PORT}/tabs`);
