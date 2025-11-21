// ==UserScript==
// @name         ActivityWatch Heartbeat for qutebrowser
// @namespace    https://github.com/timhq/dotfiles
// @version      1.1.0
// @description  Sends 5s heartbeats with URL, title, and timestamp to ActivityWatch; hooks history and visibility to track active tabs. Disabled in private/incognito mode.
// @match        *://*/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // Prevent double-injection in rare cases (e.g., bfcache restores).
  if (window.__awHeartbeatInstalled__) return;
  window.__awHeartbeatInstalled__ = true;

  // Exit early if in private/incognito mode
  // Detection: try to detect private mode through synchronous heuristics
  function isPrivateMode() {
    // Method 1: Check if localStorage throws an exception when accessed
    // In qutebrowser private mode, localStorage typically throws SecurityError
    try {
      const testKey = '__awPrivateTest__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
    } catch (e) {
      // localStorage access failed - likely private mode
      return true;
    }

    // Method 2: Check for indexedDB.databases (not available in some private modes)
    // Some browsers don't expose this API in private mode
    if (window.indexedDB && typeof window.indexedDB.databases === 'undefined') {
      return true;
    }

    // Method 3: Try to open IndexedDB connection
    // In some private modes, this fails immediately
    try {
      const openRequest = window.indexedDB.open('__awPrivateTest__');
      if (!openRequest) {
        return true;
      }
    } catch (e) {
      return true;
    }

    return false;
  }

  if (isPrivateMode()) {
    console.debug('[aw-heartbeat] Private mode detected, not tracking');
    return;
  }

  // Configuration
  const ENDPOINT = 'http://127.0.0.1:8437/heartbeat';
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
    return location.protocol === 'http:' || location.protocol === 'https:';
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
        throttleTimer = setTimeout(() => {
          throttleTimer = null;
          sendHeartbeat();
        }, 2000 - (now - lastSentTime));
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
      title: document.title || '',
      ts: new Date().toISOString(),
    };

    const body = JSON.stringify(payload);

    // If this origin is in backoff window, just queue and return.
    if (shouldBackoff()) {
      enqueue(payload);
      debug('backoff active; queued only');
      return;
    }

    // Optional console debug: set localStorage.aw_debug = '1' to enable
    try {
      if (localStorage.getItem('aw_debug') === '1') {
        // Keep it concise to avoid noise
        // eslint-disable-next-line no-console
        console.debug('[aw-heartbeat]', payload);
      }
    } catch (_) { /* ignore */ }

    try {
      // Keep requests lightweight to avoid CORS preflight; server should accept plain JSON bytes.
      // no-cors means the response is opaque, but the request will be sent.
      fetch(ENDPOINT, {
        method: 'POST',
        body,
        keepalive: true,
        mode: 'no-cors',
        cache: 'no-store',
        credentials: 'omit',
      }).catch((err) => {
        // Likely blocked by CSP or network error — enqueue for later flush.
        enqueue(payload);
        noteBackoff('fetch-error');
        debug('enqueue (fetch error)', err && ('' + err));
      });
    } catch (e) {
      // Fallback to sendBeacon if fetch fails synchronously.
      try {
        if (navigator.sendBeacon) {
          const blob = new Blob([body], { type: 'text/plain' });
          const ok = navigator.sendBeacon(ENDPOINT, blob);
          if (!ok) {
            enqueue(payload);
            noteBackoff('beacon-false');
            debug('enqueue (beacon false)');
          }
        }
      } catch (_) {
        enqueue(payload);
        noteBackoff('beacon-throw');
      }
    }
  }

  // Simple queue in localStorage to avoid losing events on restrictive CSP pages.
  const QUEUE_KEY = '__awHeartbeatQueue__';

  function enqueue(p) {
    try {
      const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
      q.push(p);
      // Cap the queue to avoid unbounded growth
      if (q.length > 200) q.splice(0, q.length - 200);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
    } catch (_) { /* ignore */ }
  }

  function tryFlushQueue() {
    if (shouldBackoff()) return; // don't thrash during backoff
    let q = [];
    try {
      q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    } catch (_) {
      q = [];
    }
    if (!q.length) return;
    // Try to send oldest first; stop on first failure to keep order
    const rest = [];
    const sendOne = (p) => fetch(ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(p),
      keepalive: true,
      mode: 'no-cors',
      cache: 'no-store',
      credentials: 'omit',
    });
    let sent = 0;
    const attempt = q.reduce((prev, p) => prev.then(() =>
      sendOne(p).then(() => { sent += 1; }).catch(() => { rest.push(p); })
    ), Promise.resolve());
    attempt.finally(() => {
      if (rest.length) debug('flush incomplete, left:', rest.length);
      if (sent) debug('flushed', sent, 'queued events');
      try { localStorage.setItem(QUEUE_KEY, JSON.stringify(rest)); } catch (_) { /* ignore */ }
    });
  }

  // Per-origin backoff control (due to CSP blocks etc.)
  function backoffKey() {
    try { return '__awHB_backoff__:' + location.origin; } catch (_) { return '__awHB_backoff__:global'; }
  }
  function shouldBackoff() {
    try {
      const raw = localStorage.getItem(backoffKey());
      if (!raw) return false;
      const o = JSON.parse(raw);
      return typeof o.until === 'number' && Date.now() < o.until;
    } catch (_) { return false; }
  }
  function noteBackoff(reason) {
    try {
      const k = backoffKey();
      const now = Date.now();
      let delay = BACKOFF_BASE_MS;
      const cur = JSON.parse(localStorage.getItem(k) || 'null');
      if (cur && typeof cur.delay === 'number') {
        delay = Math.min(Math.max(cur.delay * 2, BACKOFF_BASE_MS), BACKOFF_MAX_MS);
      }
      const until = now + delay;
      localStorage.setItem(k, JSON.stringify({ until, delay, reason: String(reason || '') }));
      debug('backoff set', delay + 'ms', 'reason=', reason);
    } catch (_) { /* ignore */ }
  }

  /**
   * startBeating
   * - Starts a 5s interval to send heartbeats while the tab is visible.
   * - Stops the interval when the tab becomes hidden.
   * - Also triggers an immediate heartbeat upon becoming visible.
   */
  function startBeating() {
    function ensureInterval() {
      if (document.visibilityState === 'visible') {
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
    document.addEventListener('visibilitychange', ensureInterval, { passive: true });

    // Kick off once at startup.
    ensureInterval();

    // On pageshow (e.g., bfcache), re-evaluate and send a heartbeat.
    window.addEventListener('pageshow', ensureInterval, { passive: true });
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

    window.addEventListener('popstate', onUrlMaybeChanged, { passive: true });
    // If you want to catch hash-only changes as well, uncomment:
    // window.addEventListener('hashchange', onUrlMaybeChanged, { passive: true });
  }

  // Initialize early at document-start
  if (isHttpLike()) {
    hookHistory();
    startBeating();
    // Mark backoff quickly on CSP violation events
    document.addEventListener('securitypolicyviolation', () => noteBackoff('spv'), { passive: true });
    // Also send one as soon as script runs if visible (document-start).
    if (document.visibilityState === 'visible') {
      sendHeartbeat();
      tryFlushQueue();
    }
  }
})();

function debug() {
  try {
    if (localStorage.getItem('aw_debug') === '1') {
      // eslint-disable-next-line no-console
      console.debug('[aw-heartbeat]', ...arguments);
    }
  } catch (_) { /* ignore */ }
}
