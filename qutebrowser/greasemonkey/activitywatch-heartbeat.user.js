// ==UserScript==
// @name         ActivityWatch Heartbeat for qutebrowser
// @namespace    https://github.com/timhq/dotfiles
// @version      4.0.1
// @description  Sends 5s heartbeats with URL, title, and timestamp to ActivityWatch; hooks history and visibility to track active tabs. Enabled by default. Automatically detects and blocks tracking in private/incognito windows.
// @match        *://*/*
// @run-at       document-start
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// @connect      127.0.0.1
// @connect      localhost
// ==/UserScript==

(function () {
  "use strict";

  // Prevent double-injection in rare cases (e.g., bfcache restores).
  if (window.__awHeartbeatInstalled__) return;
  window.__awHeartbeatInstalled__ = true;

  // OPT-OUT SYSTEM: Tracking ENABLED by default, can be disabled manually
  // To disable tracking: Space+ad
  // To re-enable: Space+ae
  //
  // Private mode: In private windows, press Space+ad once per session
  // The flag will be stored in sessionStorage (doesn't persist after close)
  const TRACKING_DISABLED_KEY = "__qute_aw_tracking_disabled__";

  let trackingDisabled = false;
  try {
    // Check both localStorage (persistent) and sessionStorage (session-only)
    trackingDisabled =
      localStorage.getItem(TRACKING_DISABLED_KEY) === "1" ||
      sessionStorage.getItem(TRACKING_DISABLED_KEY) === "1";
  } catch (e) {
    // localStorage blocked entirely - likely private mode, don't track
    console.debug("[aw-heartbeat] Storage blocked, likely private mode");
    return;
  }

  if (trackingDisabled) {
    console.debug("[aw-heartbeat] Tracking manually disabled");
    return;
  }

  console.debug("[aw-heartbeat] Tracking active");

  // PRIVACY: Detect private/incognito mode in qutebrowser
  // Uses navigator.storage.persist() - most reliable for QtWebEngine/Chromium
  let isPrivateMode = false;

  // Method 1: Storage Persistence API (primary detection for QtWebEngine)
  // In private/incognito mode, persist() ALWAYS returns false because
  // temporary profile cannot guarantee persistent storage
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage
      .persist()
      .then((persistent) => {
        if (!persistent) {
          // Additional check: in normal mode, persist might be false but can be requested
          // In private mode, it's ALWAYS false and cannot be changed
          navigator.storage.persisted().then((isPersisted) => {
            if (!isPersisted) {
              isPrivateMode = true;
              console.debug(
                "[aw-heartbeat] Private mode detected via storage.persist()",
              );
            }
          });
        }
      })
      .catch(() => {
        // API not available or blocked - might be private mode
        isPrivateMode = true;
        console.debug(
          "[aw-heartbeat] Private mode detected (storage API blocked)",
        );
      });
  }

  // Method 2: Service Worker registration (backup detection)
  // Service Workers are restricted or unavailable in private mode
  if ("serviceWorker" in navigator) {
    // Try to register empty service worker - will fail in private mode
    navigator.serviceWorker.register("data:text/javascript,").catch((error) => {
      if (error.name === "SecurityError" || error.message.includes("private")) {
        isPrivateMode = true;
        console.debug("[aw-heartbeat] Private mode detected via ServiceWorker");
      }
    });
  }

  // Method 3: IndexedDB quota check (additional verification)
  if (navigator.storage && navigator.storage.estimate) {
    navigator.storage.estimate().then((estimate) => {
      // Private mode typically has very limited quota (0 or < 10MB)
      if (estimate.usage === 0 && estimate.quota < 10000000) {
        isPrivateMode = true;
        console.debug("[aw-heartbeat] Private mode detected via quota");
      }
    });
  }

  if (isPrivateMode) {
    console.debug("[aw-heartbeat] Private mode confirmed, marking heartbeats");
  }

  // Configuration
  const ENDPOINT = "http://127.0.0.1:8437/heartbeat";
  const HEARTBEAT_MS = 5000; // 5 seconds
  const BACKOFF_BASE_MS = 60 * 1000; // 1 minute initial
  const BACKOFF_MAX_MS = 5 * 60 * 1000; // cap at 5 minutes

  // Internal state
  let lastUrl = location.href;
  let beatTimer = null;
  // Throttling state
  let lastSentTime = 0;
  let throttleTimer = null;

  // Guard: only operate on http/https pages.
  function isHttpLike() {
    return location.protocol === "http:" || location.protocol === "https:";
  }

  /**
   * sendHeartbeat
   * - Sends a POST request with current URL, title, and ISO timestamp.
   * - Uses fetch with keepalive: true so the request survives navigations.
   * - Uses mode: 'no-cors' to avoid CORS preflight when talking to localhost.
   * - Silently ignores errors; this is best-effort tracking.
   */
  function sendHeartbeat() {
    // Throttling to prevent infinite loops
    const now = Date.now();
    if (now - lastSentTime < 2000) {
      if (!throttleTimer) {
        throttleTimer = setTimeout(
          () => {
            throttleTimer = null;
            sendHeartbeat();
          },
          2000 - (now - lastSentTime),
        );
      }
      return;
    }
    if (throttleTimer) {
      clearTimeout(throttleTimer);
      throttleTimer = null;
    }
    lastSentTime = now;

    if (!isHttpLike()) return;

    const payload = {
      url: location.href,
      title: document.title || "",
      ts: new Date().toISOString(),
    };

    const body = JSON.stringify(payload);

    // If this origin is in backoff window, just queue and return.
    if (shouldBackoff()) {
      enqueue(payload);
      debug("backoff active; queued only");
      return;
    }

    // Optional console debug: set localStorage.aw_debug = '1' to enable
    try {
      if (localStorage.getItem("aw_debug") === "1") {
        // Keep it concise to avoid noise

        console.debug("[aw-heartbeat]", payload);
      }
    } catch (_) {
      /* ignore */
    }

    postHeartbeat(payload).catch((err) => {
      // Likely blocked by CSP/network/runtime — enqueue for later flush.
      enqueue(payload);
      noteBackoff("post-error");
      debug("enqueue (post error)", err && "" + err);
    });
  }

  // Simple queue in localStorage to avoid losing events on restrictive CSP pages.
  const QUEUE_KEY = "__awHeartbeatQueue__";

  function enqueue(p) {
    try {
      const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
      q.push(p);
      // Cap the queue to avoid unbounded growth
      if (q.length > 200) q.splice(0, q.length - 200);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
    } catch (_) {
      /* ignore */
    }
  }

  function tryFlushQueue() {
    if (shouldBackoff()) return; // don't thrash during backoff
    let q = [];
    try {
      q = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    } catch (_) {
      q = [];
    }
    if (!q.length) return;
    // Try to send oldest first; stop on first failure to keep order
    const rest = [];
    const sendOne = (p) => postHeartbeat(p);
    let sent = 0;
    const attempt = q.reduce(
      (prev, p) =>
        prev.then(() =>
          sendOne(p)
            .then(() => {
              sent += 1;
            })
            .catch(() => {
              rest.push(p);
            }),
        ),
      Promise.resolve(),
    );
    attempt.finally(() => {
      if (rest.length) debug("flush incomplete, left:", rest.length);
      if (sent) debug("flushed", sent, "queued events");
      try {
        localStorage.setItem(QUEUE_KEY, JSON.stringify(rest));
      } catch (_) {
        /* ignore */
      }
    });
  }

  // Per-origin backoff control (due to CSP blocks etc.)
  function backoffKey() {
    try {
      return "__awHB_backoff__:" + location.origin;
    } catch (_) {
      return "__awHB_backoff__:global";
    }
  }
  function shouldBackoff() {
    try {
      const raw = localStorage.getItem(backoffKey());
      if (!raw) return false;
      const o = JSON.parse(raw);
      return typeof o.until === "number" && Date.now() < o.until;
    } catch (_) {
      return false;
    }
  }
  function noteBackoff(reason) {
    try {
      const k = backoffKey();
      const now = Date.now();
      let delay = BACKOFF_BASE_MS;
      const cur = JSON.parse(localStorage.getItem(k) || "null");
      if (cur && typeof cur.delay === "number") {
        delay = Math.min(
          Math.max(cur.delay * 2, BACKOFF_BASE_MS),
          BACKOFF_MAX_MS,
        );
      }
      const until = now + delay;
      localStorage.setItem(
        k,
        JSON.stringify({ until, delay, reason: String(reason || "") }),
      );
      debug("backoff set", delay + "ms", "reason=", reason);
    } catch (_) {
      /* ignore */
    }
  }

  function postHeartbeat(payload) {
    const body = JSON.stringify(payload);
    const headers = isPrivateMode
      ? {
          "Content-Type": "application/json",
          "X-Private-Window": "1",
        }
      : { "Content-Type": "application/json" };

    const gmXhr =
      typeof GM_xmlhttpRequest === "function"
        ? GM_xmlhttpRequest
        : typeof GM === "object" &&
            GM &&
            typeof GM.xmlHttpRequest === "function"
          ? GM.xmlHttpRequest.bind(GM)
          : null;

    // Prefer userscript transport: bypasses page CSP and works on locked-down sites.
    if (gmXhr) {
      return new Promise((resolve, reject) => {
        gmXhr({
          method: "POST",
          url: ENDPOINT,
          headers,
          data: body,
          timeout: 5000,
          onload: (resp) => {
            if (resp.status >= 200 && resp.status < 300) {
              resolve();
              return;
            }
            reject(new Error("http " + resp.status));
          },
          onerror: () => reject(new Error("gm-xhr-error")),
          ontimeout: () => reject(new Error("gm-xhr-timeout")),
        });
      });
    }

    // Fallback for environments without GM_xmlhttpRequest.
    return fetch(ENDPOINT, {
      method: "POST",
      headers,
      body,
      keepalive: true,
      mode: "no-cors",
      cache: "no-store",
      credentials: "omit",
    }).catch(() => {
      // Last-resort fallback for unload/navigation races.
      if (navigator.sendBeacon) {
        const ok = navigator.sendBeacon(
          ENDPOINT,
          new Blob([body], { type: "application/json" }),
        );
        if (ok) return;
      }
      throw new Error("fetch-and-beacon-failed");
    });
  }

  /**
   * startBeating
   * - Starts a 5s interval to send heartbeats while the tab is visible.
   * - Stops the interval when the tab becomes hidden.
   * - Also triggers an immediate heartbeat upon becoming visible.
   */
  function startBeating() {
    function ensureInterval() {
      if (document.visibilityState === "visible") {
        if (!beatTimer) {
          // Send immediately when becoming visible.
          sendHeartbeat();
          // Also try to flush any queued events from pages where CSP blocked us
          tryFlushQueue();
          beatTimer = setInterval(sendHeartbeat, HEARTBEAT_MS);
        }
      } else {
        if (beatTimer) {
          clearInterval(beatTimer);
          beatTimer = null;
        }
      }
    }

    // Start/stop on visibility changes.
    document.addEventListener("visibilitychange", ensureInterval, {
      passive: true,
    });

    // Kick off once at startup.
    ensureInterval();

    // On pageshow (e.g., bfcache), re-evaluate and send a heartbeat.
    window.addEventListener("pageshow", ensureInterval, { passive: true });
  }

  /**
   * hookHistory
   * - Hooks pushState/replaceState to detect SPA URL changes.
   * - Listens to popstate for back/forward navigations.
   * - When URL changes, sends a heartbeat immediately.
   */
  function hookHistory() {
    const origPushState = history.pushState;
    const origReplaceState = history.replaceState;

    function onUrlMaybeChanged() {
      const current = location.href;
      if (current !== lastUrl) {
        lastUrl = current;
        if (isHttpLike()) {
          sendHeartbeat();
        }
      }
    }

    try {
      history.pushState = function (...args) {
        const ret = origPushState.apply(this, args);
        onUrlMaybeChanged();
        return ret;
      };
    } catch (_) {
      // If hooking fails, ignore silently.
    }

    try {
      history.replaceState = function (...args) {
        const ret = origReplaceState.apply(this, args);
        onUrlMaybeChanged();
        return ret;
      };
    } catch (_) {
      // If hooking fails, ignore silently.
    }

    window.addEventListener("popstate", onUrlMaybeChanged, { passive: true });
    // If you want to catch hash-only changes as well, uncomment:
    // window.addEventListener('hashchange', onUrlMaybeChanged, { passive: true });
  }

  // Initialize early at document-start
  if (isHttpLike()) {
    hookHistory();
    startBeating();
    // Mark backoff quickly on CSP violation events
    document.addEventListener(
      "securitypolicyviolation",
      () => noteBackoff("spv"),
      { passive: true },
    );
    // Also send one as soon as script runs if visible (document-start).
    if (document.visibilityState === "visible") {
      sendHeartbeat();
      tryFlushQueue();
    }
  }
})();

function debug() {
  try {
    if (localStorage.getItem("aw_debug") === "1") {
      console.debug("[aw-heartbeat]", ...arguments);
    }
  } catch (_) {
    /* ignore */
  }
}
