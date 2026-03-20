// ==UserScript==
// @name         Translate Selection Tooltip (Local Daemon)
// @namespace    qutebrowser
// @version      1.0.0
// @description  Translate selected text to Russian via localhost daemon and show a safe tooltip.
// @author       tim
// @match        *://*/*
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @connect      127.0.0.1
// @connect      localhost
// @noframes
// ==/UserScript==

(function () {
  "use strict";

  const TEST_MODE = window.__QUTE_TRANSLATE_TEST__ === true;

  const CONFIG = {
    endpointUrl: "http://127.0.0.1:38123/translate",
    targetLang: "ru",
    requestTimeoutMs: 45000,
    debounceMs: 320,
    loadingDelayMs: 120,
    escCooldownMs: 800,
    errorAutoHideMs: 6000,

    maxChars: 1200,
    contextEnabledDefault: false,
    contextMaxChars: 2000,
    contextMaxTextCharsToInclude: 220,
    contextAllowlistDefault: [],

    cacheMaxEntries: 80,
    cacheTtlMs: 20 * 60 * 1000,

    viewportMarginPx: 8,
    tooltipMaxHeightPx: 260,
    tooltipGapPx: 8,
    arrowWidthPx: 16,
    arrowHeightPx: 8,
  };

  const STORAGE_KEYS = {
    disabledHosts: "quteTranslateSelectionTooltip.disabledHosts",
    contextEnabled: "quteTranslateSelectionTooltip.contextEnabled",
    contextAllowlist: "quteTranslateSelectionTooltip.contextAllowlist",
  };

  const DENY_SUBSTRINGS = [
    "accounts.",
    "account.",
    "mail.",
    "login",
    "signin",
    "sign-in",
    "auth",
    "bank",
    "paypal",
    "stripe",
    "admin",
  ];

  const UI_STRINGS = {
    loading: "Translating...",
    errorGeneric: "Translation failed",
    errorBusy: "Translator busy",
    errorRateLimited: "Too many requests",
    errorTimeout: "Timeout",
    errorUnauthorized: "Daemon rejected request",
    errorTooLarge: "Selection too large",
    errorParse: "Bad daemon response",
    errorOffline: "Daemon not reachable",
  };

  if (!TEST_MODE) {
    if (window.top !== window.self) {
      return;
    }
    if (!isHttpOrHttps(location.protocol)) {
      return;
    }
    if (isLocationDenied(location.hostname, location.pathname)) {
      return;
    }
  }

  const state = {
    suppressUntilTs: 0,
    lastSnapshot: null,
    debounceTimer: null,

    activeKey: null,
    activeRequestId: null,
    activeAbort: null,

    loadingTimer: null,
    errorHideTimer: null,

    lastMouse: { x: 0, y: 0 },
  };

  let requestCounter = 0;
  const cache = new LruTtlCache(CONFIG.cacheMaxEntries, CONFIG.cacheTtlMs);
  const inFlight = new Map();
  let transport = gmTransport;

  let ui = null;

  const testApi = TEST_MODE ? buildTestApi() : null;
  if (TEST_MODE) {
    window.__quteTranslateSelectionTooltipTest = testApi;
  }

  if (!TEST_MODE && typeof GM_xmlhttpRequest !== "function") {
    return;
  }

  attachListeners();

  function attachListeners() {
    document.addEventListener("mouseup", onMouseup, true);
    document.addEventListener("mousedown", onMousedown, true);
    document.addEventListener("keydown", onKeydown, true);
    window.addEventListener("blur", onBlur, true);
    document.addEventListener("visibilitychange", onVisibilityChange, true);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize, true);
  }

  function onMouseup(e) {
    if (state.suppressUntilTs && Date.now() < state.suppressUntilTs) {
      return;
    }
    if (e && typeof e.clientX === "number" && typeof e.clientY === "number") {
      state.lastMouse = { x: e.clientX, y: e.clientY };
    }

    const snapshot = snapshotSelection(e);
    state.lastSnapshot = snapshot;

    if (state.debounceTimer) {
      clearTimeout(state.debounceTimer);
    }
    state.debounceTimer = setTimeout(() => {
      state.debounceTimer = null;
      void handleSnapshot(state.lastSnapshot);
    }, CONFIG.debounceMs);
  }

  function onMousedown(e) {
    if (!isTooltipVisible()) {
      return;
    }

    const path = typeof e.composedPath === "function" ? e.composedPath() : [];
    if (ui && path.includes(ui.host)) {
      return;
    }
    hideTooltip("outside");
  }

  function onKeydown(e) {
    if (!isTooltipVisible()) {
      return;
    }
    if (!e || e.key !== "Escape") {
      return;
    }

    hideTooltip("esc");
    state.suppressUntilTs = Date.now() + CONFIG.escCooldownMs;
    e.preventDefault();
    e.stopPropagation();
  }

  function onBlur() {
    hideTooltip("blur");
  }

  function onVisibilityChange() {
    if (document.visibilityState !== "visible") {
      hideTooltip("visibility");
    }
  }

  function onScrollOrResize() {
    hideTooltip("viewport");
  }

  async function handleSnapshot(snapshot) {
    if (!snapshot) {
      hideTooltip("empty");
      return;
    }

    const locationDenied = !TEST_MODE
      ? isLocationDenied(location.hostname, location.pathname)
      : false;
    if (locationDenied) {
      hideTooltip("denied");
      return;
    }

    if (snapshot.isEditable) {
      hideTooltip("editable");
      return;
    }

    const normalized = normalizeSelectionText(snapshot.rawText);
    const decision = shouldTranslateNormalized(normalized);
    if (!decision.ok) {
      hideTooltip(decision.reason);
      return;
    }

    const contextPolicy = getContextPolicy();
    const context = contextPolicy.enabled
      ? buildContext(snapshot, normalized, contextPolicy)
      : "";

    const key = await buildCacheKey(CONFIG.targetLang, normalized, context);

    if (state.activeKey === key && isTooltipVisible()) {
      return;
    }

    const cached = cache.get(key);
    if (typeof cached === "string" && cached.length > 0) {
      if (
        state.activeKey &&
        state.activeKey !== key &&
        typeof state.activeAbort === "function"
      ) {
        abortActiveRequest();
      }
      state.activeAbort = null;
      state.activeKey = key;
      state.activeRequestId = null;
      showTooltip({
        mode: "success",
        text: cached,
        anchor: snapshot.anchor,
        requestId: null,
        key,
      });
      return;
    }

    const inFlightEntry = inFlight.get(key);
    const requestId =
      inFlightEntry &&
      typeof inFlightEntry.requestId === "string" &&
      inFlightEntry.requestId
        ? inFlightEntry.requestId
        : snapshot.requestId || makeRequestId();

    if (
      state.activeKey &&
      state.activeKey !== key &&
      typeof state.activeAbort === "function"
    ) {
      abortActiveRequest();
    }
    state.activeAbort = null;
    state.activeKey = key;
    state.activeRequestId = requestId;

    scheduleLoadingTooltip(snapshot.anchor, requestId, key);

    if (inFlightEntry && inFlightEntry.promise) {
      if (typeof inFlightEntry.abort === "function") {
        state.activeAbort = inFlightEntry.abort;
      }
      try {
        const result = await inFlightEntry.promise;
        applyTranslationResult({
          requestId,
          key,
          anchor: snapshot.anchor,
          result,
        });
      } catch (err) {
        applyTranslationError({ requestId, key, anchor: snapshot.anchor, err });
      }
      return;
    }

    const payload = {
      requestId,
      text: normalized,
      targetLang: CONFIG.targetLang,
    };
    if (context) {
      payload.context = context;
    }

    const { promise, abort } = transport({
      url: CONFIG.endpointUrl,
      json: payload,
      timeoutMs: CONFIG.requestTimeoutMs,
    });

    if (typeof abort === "function") {
      state.activeAbort = abort;
    }

    inFlight.set(key, { promise, abort, requestId });

    try {
      const result = await promise;
      inFlight.delete(key);
      if (
        result &&
        typeof result.translation === "string" &&
        result.translation
      ) {
        cache.set(key, result.translation);
      }
      applyTranslationResult({
        requestId,
        key,
        anchor: snapshot.anchor,
        result,
      });
    } catch (err) {
      inFlight.delete(key);
      applyTranslationError({ requestId, key, anchor: snapshot.anchor, err });
    }
  }

  function scheduleLoadingTooltip(anchor, requestId, key) {
    clearTimer("loading");
    state.loadingTimer = setTimeout(() => {
      state.loadingTimer = null;
      if (!isActiveRequest(requestId, key)) {
        return;
      }
      showTooltip({
        mode: "loading",
        text: UI_STRINGS.loading,
        anchor,
        requestId,
        key,
      });
    }, CONFIG.loadingDelayMs);
  }

  function applyTranslationResult({ requestId, key, anchor, result }) {
    clearTimer("loading");
    if (!isActiveRequest(requestId, key)) {
      return;
    }

    if (
      result &&
      typeof result.requestId === "string" &&
      result.requestId &&
      result.requestId !== requestId
    ) {
      return;
    }

    if (
      result &&
      typeof result.translation === "string" &&
      result.translation
    ) {
      showTooltip({
        mode: "success",
        text: result.translation,
        anchor,
        requestId,
        key,
      });
      return;
    }

    const code = result && typeof result.code === "string" ? result.code : null;
    showErrorTooltip({ requestId, key, anchor, code });
  }

  function applyTranslationError({ requestId, key, anchor, err }) {
    clearTimer("loading");
    if (!isActiveRequest(requestId, key)) {
      return;
    }

    const code = err && typeof err.code === "string" ? err.code : null;
    showErrorTooltip({ requestId, key, anchor, code });
  }

  function showErrorTooltip({ requestId, key, anchor, code }) {
    const msg = mapErrorCodeToMessage(code);
    showTooltip({ mode: "error", text: msg, anchor, requestId, key });

    clearTimer("errorHide");
    state.errorHideTimer = setTimeout(() => {
      state.errorHideTimer = null;
      if (isActiveRequest(requestId, key) && isTooltipVisible()) {
        hideTooltip("error-timeout");
      }
    }, CONFIG.errorAutoHideMs);
  }

  function mapErrorCodeToMessage(code) {
    switch (code) {
      case "unauthorized":
        return UI_STRINGS.errorUnauthorized;
      case "too_large":
        return UI_STRINGS.errorTooLarge;
      case "rate_limited":
        return UI_STRINGS.errorRateLimited;
      case "busy":
        return UI_STRINGS.errorBusy;
      case "timeout":
        return UI_STRINGS.errorTimeout;
      case "parse_error":
      case "empty_translation":
      case "invalid_response":
        return UI_STRINGS.errorParse;
      case "network_error":
        return UI_STRINGS.errorOffline;
      default:
        return UI_STRINGS.errorGeneric;
    }
  }

  function isActiveRequest(requestId, key) {
    return state.activeRequestId === requestId && state.activeKey === key;
  }

  function snapshotSelection(e) {
    const sel = window.getSelection ? window.getSelection() : null;
    if (!sel || sel.rangeCount === 0) {
      return null;
    }

    const rawText = typeof sel.toString === "function" ? sel.toString() : "";
    if (!rawText) {
      return null;
    }

    const requestId = makeRequestId();
    const anchor = buildAnchorFromSelection(sel, e);
    const isEditable = isEditableEventOrSelection(e, sel);
    const contextText = captureContextText(sel, isEditable);

    return {
      requestId,
      rawText,
      anchor,
      isEditable,
      contextText,
      mouse: {
        x: e && typeof e.clientX === "number" ? e.clientX : state.lastMouse.x,
        y: e && typeof e.clientY === "number" ? e.clientY : state.lastMouse.y,
      },
    };
  }

  function buildAnchorFromSelection(sel, e) {
    let rect = null;
    try {
      const range = sel.getRangeAt(0);
      if (range && typeof range.getBoundingClientRect === "function") {
        const r = range.getBoundingClientRect();
        rect = rectToPlain(r);
      }
    } catch {
      rect = null;
    }

    const mouse = {
      x: e && typeof e.clientX === "number" ? e.clientX : state.lastMouse.x,
      y: e && typeof e.clientY === "number" ? e.clientY : state.lastMouse.y,
    };

    if (!rect || !isUsableRect(rect)) {
      rect = {
        left: mouse.x,
        right: mouse.x,
        top: mouse.y,
        bottom: mouse.y,
        width: 0,
        height: 0,
      };
    }

    return { rect, mouse };
  }

  function rectToPlain(r) {
    if (!r) {
      return null;
    }
    const left = numOrZero(r.left);
    const top = numOrZero(r.top);
    const width = numOrZero(r.width);
    const height = numOrZero(r.height);
    return {
      left,
      top,
      width,
      height,
      right: left + width,
      bottom: top + height,
    };
  }

  function isUsableRect(r) {
    if (!r) {
      return false;
    }
    if (
      (r.width === 0 && r.height === 0) ||
      (r.left === 0 && r.top === 0 && r.right === 0 && r.bottom === 0)
    ) {
      return false;
    }
    return isFiniteNumber(r.left) && isFiniteNumber(r.top);
  }

  function isEditableEventOrSelection(e, sel) {
    const t = e && e.target ? e.target : null;
    if (isEditableElement(t)) {
      return true;
    }

    const nodes = [];
    try {
      if (sel.anchorNode) {
        nodes.push(sel.anchorNode);
      }
      if (sel.focusNode && sel.focusNode !== sel.anchorNode) {
        nodes.push(sel.focusNode);
      }
    } catch {}
    for (const n of nodes) {
      const el =
        n && n.nodeType === 1
          ? n
          : n && n.parentElement
            ? n.parentElement
            : null;
      if (isEditableElement(el)) {
        return true;
      }
    }

    return false;
  }

  function isEditableElement(el) {
    if (!el) {
      return false;
    }
    const elem = el;
    if (typeof elem.isContentEditable === "boolean" && elem.isContentEditable) {
      return true;
    }
    if (elem.closest) {
      const hit = elem.closest(
        "input, textarea, select, [contenteditable=''], [contenteditable='true'], [contenteditable='plaintext-only']",
      );
      if (hit) {
        return true;
      }
      const input = elem.closest("input");
      if (input && input.getAttribute) {
        const type = (input.getAttribute("type") || "").toLowerCase();
        if (type === "password") {
          return true;
        }
      }
    }
    return false;
  }

  function normalizeSelectionText(text) {
    if (typeof text !== "string") {
      return "";
    }

    let t = text;
    t = t.replace(/\r\n/g, "\n");
    t = t.replace(/\u00A0/g, " ");
    t = t.replace(/[\u200B\u200C\u200D\uFEFF]/g, "");
    try {
      t = t.normalize("NFC");
    } catch {}
    t = t.trim();
    t = t.replace(/[\t\f\v ]+/g, " ");
    t = t.replace(/\n{3,}/g, "\n\n");
    return t;
  }

  function shouldTranslateNormalized(text) {
    if (!text) {
      return { ok: false, reason: "empty" };
    }
    if (text.length <= 1) {
      return { ok: false, reason: "too-short" };
    }
    if (text.length > CONFIG.maxChars) {
      return { ok: false, reason: "too-large" };
    }

    const compact = text.replace(/\s+/g, "");
    if (!compact) {
      return { ok: false, reason: "whitespace" };
    }

    if (/^[\d\s+\-*/=().,:%]+$/.test(text)) {
      return { ok: false, reason: "numbers" };
    }

    if (/^[\s\p{P}\p{S}]+$/u.test(text)) {
      return { ok: false, reason: "punct" };
    }

    if (isProbablyUrlEmailPath(text)) {
      return { ok: false, reason: "url-email-path" };
    }

    if (isCodeLike(text)) {
      return { ok: false, reason: "code-like" };
    }

    if (isProbablyAlreadyRussian(text)) {
      return { ok: false, reason: "already-ru" };
    }

    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 1) {
      const w = words[0];
      if (w.length >= 2 && w.length <= 3) {
        return { ok: false, reason: "short-word" };
      }
    }

    return { ok: true };
  }

  function isProbablyUrlEmailPath(text) {
    const t = text.trim();
    if (/^https?:\/\//i.test(t) || /^www\./i.test(t)) {
      return true;
    }
    if (/\S+@\S+\.[A-Za-z]{2,}/.test(t)) {
      return true;
    }
    if (/^~\//.test(t) || /^\//.test(t)) {
      return true;
    }
    if (/^[A-Za-z]:\\/.test(t)) {
      return true;
    }
    if (/\b(src|lib|dist|node_modules|Users)\/[\w.-]+/i.test(t)) {
      return true;
    }
    if (
      /\b[\w.-]+\.(ts|tsx|js|jsx|py|go|rs|java|c|cpp|h|md|json|yaml|yml|toml)\b/i.test(
        t,
      )
    ) {
      return true;
    }
    return false;
  }

  function isCodeLike(text) {
    const t = text.trim();
    if (
      /^(npm|pnpm|yarn|git|brew|sudo|docker|kubectl|python|node)\s/i.test(t)
    ) {
      return true;
    }
    if (/[;{}<>]/.test(t)) {
      return true;
    }
    if (/\b(--\w+|-[a-zA-Z])\b/.test(t)) {
      return true;
    }
    if (/\b[A-Za-z_][A-Za-z0-9_]*\([^)]*\)/.test(t)) {
      return true;
    }
    if (/\b[A-Za-z_][A-Za-z0-9_]*\s*=\s*[^=]/.test(t)) {
      return true;
    }
    if (/\b(Save|Cancel|OK|Close)\b/.test(t) && t.length <= 24) {
      return true;
    }
    return false;
  }

  function isProbablyAlreadyRussian(text) {
    const cyr = (text.match(/[\u0400-\u04FF]/g) || []).length;
    const lat = (text.match(/[A-Za-z]/g) || []).length;
    if (cyr === 0) {
      return false;
    }
    if (lat > 0) {
      return false;
    }
    return cyr >= 4;
  }

  function getContextPolicy() {
    const enabled = getStoredBool(
      STORAGE_KEYS.contextEnabled,
      CONFIG.contextEnabledDefault,
    );
    const allowlist = getStoredStringArray(
      STORAGE_KEYS.contextAllowlist,
      CONFIG.contextAllowlistDefault,
    );

    const host = (
      location && location.hostname ? location.hostname : ""
    ).toLowerCase();
    const allowedByHost = allowlist.some(
      (h) => typeof h === "string" && h.toLowerCase() === host,
    );
    return { enabled: !!enabled && allowedByHost, allowlist };
  }

  function buildContext(snapshot, normalizedText, contextPolicy) {
    if (!contextPolicy || !contextPolicy.enabled) {
      return "";
    }
    if (normalizedText.length > CONFIG.contextMaxTextCharsToInclude) {
      return "";
    }

    const ctx =
      snapshot && typeof snapshot.contextText === "string"
        ? snapshot.contextText
        : "";
    if (!ctx) {
      return "";
    }
    if (ctx.length > CONFIG.contextMaxChars) {
      return ctx.slice(0, CONFIG.contextMaxChars);
    }
    return ctx;
  }

  function captureContextText(sel, isEditable) {
    if (isEditable || !sel || sel.rangeCount === 0) {
      return "";
    }
    let root = null;
    try {
      const range = sel.getRangeAt(0);
      const node = range.commonAncestorContainer;
      root =
        node && node.nodeType === 1
          ? node
          : node && node.parentElement
            ? node.parentElement
            : null;
    } catch {
      root = null;
    }
    if (!root || !(root instanceof Element) || isEditableElement(root)) {
      return "";
    }

    const candidate = pickContextContainer(root);
    if (!candidate || isEditableElement(candidate)) {
      return "";
    }
    const raw =
      typeof candidate.innerText === "string"
        ? candidate.innerText
        : candidate.textContent;
    if (typeof raw !== "string") {
      return "";
    }
    return normalizeSelectionText(raw);
  }

  function pickContextContainer(fromEl) {
    const preferred = fromEl.closest(
      "p, li, dd, dt, blockquote, pre, article, section, main, td, th",
    );
    if (preferred) {
      return preferred;
    }
    const div = fromEl.closest("div");
    return div || fromEl;
  }

  async function buildCacheKey(targetLang, normalizedText, context) {
    let key = `${targetLang}|${normalizedText}`;
    if (context) {
      const ctxHash = await hashTextForKey(context);
      key += `|ctx=${ctxHash}`;
    }
    return key;
  }

  async function hashTextForKey(text) {
    try {
      if (
        window.crypto &&
        window.crypto.subtle &&
        typeof window.crypto.subtle.digest === "function"
      ) {
        const enc = new TextEncoder();
        const buf = await window.crypto.subtle.digest(
          "SHA-256",
          enc.encode(text),
        );
        return base64UrlFromBytes(new Uint8Array(buf));
      }
    } catch {}
    return fnv1a32Hex(text);
  }

  function base64UrlFromBytes(bytes) {
    let bin = "";
    for (let i = 0; i < bytes.length; i += 1) {
      bin += String.fromCharCode(bytes[i]);
    }
    const b64 = btoa(bin);
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function fnv1a32Hex(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i += 1) {
      h ^= str.charCodeAt(i);
      h = (h * 0x01000193) >>> 0;
    }
    return h.toString(16).padStart(8, "0");
  }

  function makeRequestId() {
    requestCounter += 1;
    const rand = Math.random().toString(36).slice(2, 10);
    const id = `${Date.now()}-${requestCounter}-${rand}`;
    const safe = id.replace(/[^A-Za-z0-9._-]/g, "-");
    return safe.length > 128 ? safe.slice(0, 128) : safe;
  }

  function showTooltip({ mode, text, anchor, requestId, key }) {
    ensureUi();
    clearTimer("errorHide");
    clearTimer("loading");

    ui.popup.dataset.theme = resolveTooltipTheme();
    ui.popup.dataset.mode = mode;
    ui.content.textContent = String(text || "");

    ui.popup.dataset.open = "1";
    ui.popup.style.left = "0px";
    ui.popup.style.top = "0px";

    requestAnimationFrame(() => {
      if (!ui || ui.popup.dataset.open !== "1") {
        return;
      }
      if (requestId && key && !isActiveRequest(requestId, key)) {
        return;
      }
      positionTooltip(anchor);
      ui.popup.dataset.open = "1";
    });
  }

  function positionTooltip(anchor) {
    ensureUi();
    const rect = anchor && anchor.rect ? anchor.rect : null;
    const viewportW = window.innerWidth || 0;
    const viewportH = window.innerHeight || 0;
    const margin = CONFIG.viewportMarginPx;

    const popupRect = ui.popup.getBoundingClientRect();
    const tooltipW = popupRect.width;
    const tooltipH = popupRect.height;
    const gap = CONFIG.tooltipGapPx;
    const arrowH = CONFIG.arrowHeightPx;

    const anchorLeft = rect ? rect.left : 0;
    const anchorRight = rect ? rect.right : 0;
    const anchorTop = rect ? rect.top : 0;
    const anchorBottom = rect ? rect.bottom : 0;
    const anchorX = (anchorLeft + anchorRight) / 2;

    let placement = "top";
    let top = anchorTop - tooltipH - gap - arrowH;
    if (top < margin) {
      placement = "bottom";
      top = anchorBottom + gap + arrowH;
    }

    top = clamp(top, margin, Math.max(margin, viewportH - margin - tooltipH));

    let left = anchorX - tooltipW / 2;
    left = clamp(left, margin, Math.max(margin, viewportW - margin - tooltipW));

    ui.popup.style.left = `${Math.round(left)}px`;
    ui.popup.style.top = `${Math.round(top)}px`;
    ui.popup.dataset.placement = placement;

    const arrowLeft = clamp(
      anchorX - left - CONFIG.arrowWidthPx / 2,
      10,
      Math.max(10, tooltipW - 10 - CONFIG.arrowWidthPx),
    );
    ui.popup.style.setProperty(
      "--qute-tts-arrow-left",
      `${Math.round(arrowLeft)}px`,
    );
    ui.popup.style.setProperty(
      "--qute-tts-origin-x",
      `${Math.round(arrowLeft + CONFIG.arrowWidthPx / 2)}px`,
    );
    ui.popup.style.setProperty(
      "--qute-tts-origin-y",
      placement === "top" ? "100%" : "0%",
    );
  }

  function hideTooltip(reason) {
    clearTimer("loading");
    clearTimer("errorHide");
    abortActiveRequest();
    state.activeAbort = null;
    state.activeRequestId = null;
    state.activeKey = null;

    if (!ui) {
      return;
    }
    ui.popup.dataset.open = "0";
    ui.popup.dataset.mode = "hidden";
    ui.content.textContent = "";
    ui.popup.dataset.lastHide = String(reason || "");
  }

  function isTooltipVisible() {
    return !!(ui && ui.popup && ui.popup.dataset.open === "1");
  }

  function abortActiveRequest() {
    const activeKey = state.activeKey;
    const activeAbort = state.activeAbort;
    if (activeKey) {
      const entry = inFlight.get(activeKey);
      if (entry && (!activeAbort || entry.abort === activeAbort)) {
        inFlight.delete(activeKey);
      }
    }
    if (typeof activeAbort === "function") {
      try {
        activeAbort();
      } catch {}
    }
  }

  function ensureUi() {
    if (ui) {
      return;
    }

    const host = document.createElement("div");
    host.setAttribute("data-qute-translate-selection-tooltip", "1");
    host.style.position = "fixed";
    host.style.left = "0";
    host.style.top = "0";
    host.style.width = "0";
    host.style.height = "0";
    host.style.zIndex = "2147483647";

    const shadow = host.attachShadow({ mode: TEST_MODE ? "open" : "closed" });
    const style = document.createElement("style");
    style.textContent = buildTooltipCss();

    const popup = document.createElement("div");
    popup.className = "Popup";
    popup.setAttribute("role", "tooltip");
    popup.dataset.open = "0";
    popup.dataset.mode = "hidden";
    popup.dataset.placement = "top";
    popup.dataset.theme = resolveTooltipTheme();

    const content = document.createElement("div");
    content.className = "Content";
    content.textContent = "";

    const arrow = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    arrow.setAttribute("class", "Arrow");
    arrow.setAttribute("viewBox", "0 0 16 8");
    arrow.setAttribute("width", String(CONFIG.arrowWidthPx));
    arrow.setAttribute("height", String(CONFIG.arrowHeightPx));
    arrow.setAttribute("aria-hidden", "true");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M8 0L16 8H0L8 0Z");
    path.setAttribute("class", "ArrowPath");
    arrow.appendChild(path);

    popup.appendChild(content);
    popup.appendChild(arrow);
    shadow.appendChild(style);
    shadow.appendChild(popup);
    (document.documentElement || document.body).appendChild(host);

    ui = { host, shadow, popup, content };
  }

  function buildTooltipCss() {
    const maxH = `${CONFIG.tooltipMaxHeightPx}px`;
    return `
      :host {
        all: initial;
      }

      .Popup {
        position: fixed;
        left: 0;
        top: 0;
        max-width: min(560px, calc(100vw - ${CONFIG.viewportMarginPx * 2}px));
        max-height: ${maxH};
        overflow: auto;
        box-sizing: border-box;
        padding: 0.25rem 0.5rem;
        border-radius: 0.375rem;
        font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 0.875rem;
        line-height: 1.25;
        letter-spacing: 0;
        color: var(--qute-tts-fg, #111827);
        background: var(--qute-tts-bg, #ffffff);
        border: 1px solid var(--qute-tts-border, rgba(17, 24, 39, 0.18));
        box-shadow:
          0 10px 30px rgba(17, 24, 39, 0.14),
          0 2px 10px rgba(17, 24, 39, 0.10);
        opacity: 0;
        transform: translateY(2px) scale(0.96);
        transform-origin: var(--qute-tts-origin-x, 50%) var(--qute-tts-origin-y, 100%);
        transition: opacity 150ms ease, transform 150ms ease;
        pointer-events: auto;
        z-index: 2147483647;
        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;
        word-break: break-word;
        overflow-wrap: anywhere;
      }

      .Popup[data-open="1"] {
        opacity: 1;
        transform: translateY(0) scale(1);
      }

      .Popup[data-mode="loading"] {
        color: var(--qute-tts-loading, rgba(17, 24, 39, 0.78));
      }

      .Popup[data-mode="error"] {
        color: var(--qute-tts-error, #991b1b);
        border-color: var(--qute-tts-error-border, rgba(153, 27, 27, 0.25));
      }

      .Content {
        white-space: pre-wrap;
      }

      .Arrow {
        position: absolute;
        left: var(--qute-tts-arrow-left, 18px);
        width: ${CONFIG.arrowWidthPx}px;
        height: ${CONFIG.arrowHeightPx}px;
        overflow: visible;
      }

      .ArrowPath {
        fill: var(--qute-tts-bg, #ffffff);
        stroke: var(--qute-tts-border, rgba(17, 24, 39, 0.18));
        stroke-width: 1;
        vector-effect: non-scaling-stroke;
      }

      .Popup[data-theme="light"] {
        --qute-tts-fg: #111827;
        --qute-tts-bg: #ffffff;
        --qute-tts-border: rgba(17, 24, 39, 0.18);
        --qute-tts-loading: rgba(17, 24, 39, 0.78);
        --qute-tts-error: #991b1b;
        --qute-tts-error-border: rgba(153, 27, 27, 0.25);
      }

      .Popup[data-theme="dark"] {
        --qute-tts-fg: rgba(255, 255, 255, 0.92);
        --qute-tts-bg: #0b0f17;
        --qute-tts-border: rgba(255, 255, 255, 0.14);
        --qute-tts-loading: rgba(255, 255, 255, 0.72);
        --qute-tts-error: #fecaca;
        --qute-tts-error-border: rgba(254, 202, 202, 0.22);
      }

      .Popup[data-placement="top"] .Arrow {
        bottom: -${CONFIG.arrowHeightPx - 1}px;
      }

      .Popup[data-placement="bottom"] .Arrow {
        top: -${CONFIG.arrowHeightPx - 1}px;
        transform: rotate(180deg);
        transform-origin: 50% 50%;
      }

      .Popup[data-theme="dark"] {
        box-shadow:
          0 14px 38px rgba(0, 0, 0, 0.45),
          0 2px 10px rgba(0, 0, 0, 0.32);
      }

      @media (prefers-color-scheme: dark) {
        .Popup[data-theme="light"] {
          box-shadow:
            0 10px 30px rgba(17, 24, 39, 0.14),
            0 2px 10px rgba(17, 24, 39, 0.10);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .Popup {
          transition: none;
        }
      }
    `;
  }

  function clearTimer(which) {
    if (which === "loading" && state.loadingTimer) {
      clearTimeout(state.loadingTimer);
      state.loadingTimer = null;
    }
    if (which === "errorHide" && state.errorHideTimer) {
      clearTimeout(state.errorHideTimer);
      state.errorHideTimer = null;
    }
  }

  function resolveTooltipTheme() {
    const styleTarget = document.documentElement || document.body;
    if (styleTarget && typeof window.getComputedStyle === "function") {
      try {
        const rootStyle = window.getComputedStyle(styleTarget);
        const colorScheme = (
          rootStyle && typeof rootStyle.colorScheme === "string"
            ? rootStyle.colorScheme
            : ""
        )
          .toLowerCase()
          .trim();
        if (colorScheme.includes("dark")) {
          return "dark";
        }
        if (colorScheme.includes("light")) {
          return "light";
        }

        const bodyStyle = window.getComputedStyle(document.body || styleTarget);
        const bg =
          bodyStyle && typeof bodyStyle.backgroundColor === "string"
            ? bodyStyle.backgroundColor
            : "";
        if (bg) {
          const rgb = parseRgb(bg);
          if (rgb) {
            const luminance =
              (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
            return luminance < 0.5 ? "dark" : "light";
          }
        }
      } catch {}
    }

    try {
      if (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      ) {
        return "dark";
      }
    } catch {}

    return "light";
  }

  function parseRgb(value) {
    const m = value.match(
      /^rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})(?:[\s,\/]+[0-9.]+)?\s*\)$/i,
    );
    if (!m) {
      return null;
    }
    const r = Number(m[1]);
    const g = Number(m[2]);
    const b = Number(m[3]);
    if (!isFiniteNumber(r) || !isFiniteNumber(g) || !isFiniteNumber(b)) {
      return null;
    }
    return {
      r: clamp(r, 0, 255),
      g: clamp(g, 0, 255),
      b: clamp(b, 0, 255),
    };
  }

  function gmTransport({ url, json, timeoutMs }) {
    const body = JSON.stringify(json);

    let abortFn = null;
    const promise = new Promise((resolve, reject) => {
      try {
        const req = GM_xmlhttpRequest({
          method: "POST",
          url,
          data: body,
          headers: {
            "Content-Type": "application/json",
            "X-Qute-Translate": "1",
          },
          timeout: timeoutMs,
          onload: (resp) => {
            try {
              const parsed = parseDaemonResponse(resp);
              resolve(parsed);
            } catch (err) {
              reject({ code: "parse_error", err });
            }
          },
          onerror: () => {
            reject({ code: "network_error" });
          },
          ontimeout: () => {
            reject({ code: "timeout" });
          },
        });
        abortFn =
          req && typeof req.abort === "function" ? () => req.abort() : null;
      } catch (err) {
        reject({ code: "network_error", err });
      }
    });

    return {
      promise,
      abort: abortFn,
    };
  }

  function parseDaemonResponse(resp) {
    const status = resp && typeof resp.status === "number" ? resp.status : 0;
    const text =
      resp && typeof resp.responseText === "string" ? resp.responseText : "";
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!data || typeof data !== "object") {
      return { code: "parse_error", status };
    }
    if (status >= 200 && status < 300) {
      if (typeof data.translation === "string") {
        return {
          translation: data.translation,
          requestId: data.requestId || null,
        };
      }
      return { code: "parse_error", requestId: data.requestId || null };
    }

    const code = typeof data.code === "string" ? data.code : null;
    return {
      code: code || httpStatusToCode(status),
      requestId: data.requestId || null,
      status,
    };
  }

  function httpStatusToCode(status) {
    if (status === 401) {
      return "unauthorized";
    }
    if (status === 413) {
      return "too_large";
    }
    if (status === 429) {
      return "rate_limited";
    }
    if (status === 503) {
      return "busy";
    }
    if (status === 504) {
      return "timeout";
    }
    return "opencode_error";
  }

  function isLocationDenied(hostname, pathname) {
    const host = String(hostname || "").toLowerCase();
    const path = String(pathname || "").toLowerCase();
    const disabledHosts = getStoredStringArray(STORAGE_KEYS.disabledHosts, []);
    if (
      disabledHosts.some(
        (h) => typeof h === "string" && h.toLowerCase() === host,
      )
    ) {
      return true;
    }
    const hay = `${host}${path}`;
    return DENY_SUBSTRINGS.some((s) => hay.includes(s));
  }

  function isHttpOrHttps(protocol) {
    return protocol === "http:" || protocol === "https:";
  }

  function getStoredBool(key, defaultValue) {
    const raw = getStoredValue(key);
    if (typeof raw === "boolean") {
      return raw;
    }
    if (typeof raw === "string") {
      if (raw === "true") {
        return true;
      }
      if (raw === "false") {
        return false;
      }
    }
    return defaultValue;
  }

  function getStoredStringArray(key, defaultValue) {
    const raw = getStoredValue(key);
    if (Array.isArray(raw)) {
      return raw.filter((x) => typeof x === "string");
    }
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter((x) => typeof x === "string");
        }
      } catch {}
    }
    return defaultValue;
  }

  function getStoredValue(key) {
    try {
      if (typeof GM_getValue === "function") {
        return GM_getValue(key);
      }
    } catch {}
    try {
      const v = window.localStorage ? window.localStorage.getItem(key) : null;
      return v;
    } catch {
      return null;
    }
  }

  function clamp(n, min, max) {
    if (n < min) {
      return min;
    }
    if (n > max) {
      return max;
    }
    return n;
  }

  function numOrZero(v) {
    return typeof v === "number" && isFinite(v) ? v : 0;
  }

  function isFiniteNumber(v) {
    return typeof v === "number" && isFinite(v);
  }

  function buildTestApi() {
    const api = {
      reset: () => {
        hideTooltip("test-reset");
        cache.clear();
        inFlight.clear();
        state.suppressUntilTs = 0;
        state.lastSnapshot = null;
      },
      normalize: (t) => normalizeSelectionText(t),
      shouldTranslate: (t) =>
        shouldTranslateNormalized(normalizeSelectionText(t)),
      setTransport: (fn) => {
        transport = normalizeTransport(fn);
      },
      setDisabledHosts: (hosts) => {
        setStoredValue(
          STORAGE_KEYS.disabledHosts,
          Array.isArray(hosts) ? hosts : [],
        );
      },
      setContextPolicy: ({ enabled, allowlist }) => {
        setStoredValue(STORAGE_KEYS.contextEnabled, !!enabled);
        setStoredValue(
          STORAGE_KEYS.contextAllowlist,
          Array.isArray(allowlist) ? allowlist : [],
        );
      },
      show: async ({ text, rect, mouse }) => {
        const snapshot = {
          requestId: makeRequestId(),
          rawText: String(text || ""),
          anchor: {
            rect:
              rect && typeof rect === "object"
                ? rect
                : {
                    left: 10,
                    top: 10,
                    right: 10,
                    bottom: 10,
                    width: 0,
                    height: 0,
                  },
            mouse:
              mouse && typeof mouse === "object" ? mouse : { x: 10, y: 10 },
          },
          isEditable: false,
          mouse: mouse && typeof mouse === "object" ? mouse : { x: 10, y: 10 },
        };
        await handleSnapshot(snapshot);
      },
      runDebounceNow: async () => {
        if (state.debounceTimer) {
          clearTimeout(state.debounceTimer);
          state.debounceTimer = null;
          await handleSnapshot(state.lastSnapshot);
        }
      },
      getState: () => {
        return {
          visible: isTooltipVisible(),
          mode: ui ? ui.popup.dataset.mode : "hidden",
          text: ui ? ui.content.textContent : "",
          activeKey: state.activeKey,
          activeRequestId: state.activeRequestId,
        };
      },
      getUi: () => ui,
    };
    return api;
  }

  function normalizeTransport(fn) {
    return ({ url, json, timeoutMs }) => {
      const out = fn({ url, json, timeoutMs });
      if (
        out &&
        typeof out === "object" &&
        out.promise &&
        typeof out.promise.then === "function"
      ) {
        return out;
      }
      if (out && typeof out.then === "function") {
        return { promise: out, abort: null };
      }
      return { promise: Promise.resolve(out), abort: null };
    };
  }

  function setStoredValue(key, value) {
    try {
      if (typeof GM_setValue === "function") {
        GM_setValue(key, value);
        return;
      }
    } catch {}
    try {
      if (!window.localStorage) {
        return;
      }
      if (typeof value === "string") {
        window.localStorage.setItem(key, value);
        return;
      }
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }

  function LruTtlCache(maxEntries, ttlMs) {
    this._max = maxEntries;
    this._ttl = ttlMs;
    this._map = new Map();
  }
  LruTtlCache.prototype.get = function (key) {
    const now = Date.now();
    const hit = this._map.get(key);
    if (!hit) {
      return null;
    }
    if (hit.expiresAt <= now) {
      this._map.delete(key);
      return null;
    }
    this._map.delete(key);
    this._map.set(key, hit);
    return hit.value;
  };
  LruTtlCache.prototype.set = function (key, value) {
    const now = Date.now();
    this._map.delete(key);
    this._map.set(key, { value, expiresAt: now + this._ttl });
    while (this._map.size > this._max) {
      const first = this._map.keys().next();
      if (first && !first.done) {
        this._map.delete(first.value);
      } else {
        break;
      }
    }
  };
  LruTtlCache.prototype.clear = function () {
    this._map.clear();
  };
})();
