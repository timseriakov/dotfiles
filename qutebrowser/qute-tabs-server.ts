const CDP_URL = process.env.QUTE_CDP_URL ?? "http://127.0.0.1:9223";
const HOST = process.env.QUTE_TABS_HOST ?? "127.0.0.1";
const PORT = Number(process.env.QUTE_TABS_PORT ?? "1932");
const LIVE_TABS_PATH =
  process.env.QUTE_TABS_JSON ??
  `${process.env.HOME}/Library/Application Support/qutebrowser/glance-tabs.json`;

type Tab = {
  id: string;
  title: string;
  url: string;
  faviconUrl: string;
  pinned?: boolean;
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
};

type LiveTab = { title?: unknown; url?: unknown; pinned?: unknown };

const json = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });

const isCdpTab = (tab: CdpTab): tab is CdpTab & { url: string } =>
  tab.type === "page" && typeof tab.url === "string" && tab.url !== "";

const isLiveTab = (tab: unknown): tab is LiveTab & { url: string } =>
  typeof tab === "object" &&
  tab !== null &&
  "url" in tab &&
  typeof tab.url === "string" &&
  tab.url !== "";

const normalizeCdpTab = (tab: CdpTab & { url: string }): Tab => ({
  id: typeof tab.id === "string" ? tab.id : tab.url,
  title: typeof tab.title === "string" && tab.title ? tab.title : tab.url,
  url: tab.url,
  faviconUrl: typeof tab.faviconUrl === "string" ? tab.faviconUrl : "",
});

const readLiveWindows = async (): Promise<WindowGroup[] | undefined> => {
  const file = Bun.file(LIVE_TABS_PATH);
  if (!(await file.exists())) return undefined;

  const raw = await file.json();
  if (
    typeof raw !== "object" ||
    raw === null ||
    !("windows" in raw) ||
    !Array.isArray(raw.windows)
  ) {
    return undefined;
  }

  const windows = raw.windows.map((window, index) => {
    const source = typeof window === "object" && window !== null ? window : {};
    const tabs =
      "tabs" in source && Array.isArray(source.tabs) ? source.tabs : [];
    const parsedTabs = tabs.filter(isLiveTab).map((tab) => ({
      id: tab.url,
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
    if (pathname !== "/tabs") return json({ error: "not found" }, 404);

    try {
      const res = await fetch(`${CDP_URL}/json`);
      if (!res.ok) throw new Error(`CDP ${res.status}`);

      const tabs = ((await res.json()) as CdpTab[])
        .filter(isCdpTab)
        .map(normalizeCdpTab);
      const windows = (await readLiveWindows()) ?? [
        { index: 1, active: true, count: tabs.length, tabs },
      ];

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
