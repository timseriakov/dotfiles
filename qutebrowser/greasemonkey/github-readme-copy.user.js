// ==UserScript==
// @name         GitHub README Copy Source
// @namespace    qutebrowser
// @version      1.4
// @description  Add a Copy button next to README.md in the repo file list to copy the raw markdown.
// @match        https://github.com/*/*
// @match        https://github.com/*/*/tree/*
// @include      https://github.com/*/*
// @include      https://github.com/*/*/tree/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const BUTTON_ATTR = "data-readme-copy-button";
  const COPY_LABEL = "Copy";
  const COPIED_LABEL = "Copied";
  const ERROR_LABEL = "Failed";
  const BUTTON_TIMEOUT_MS = 1800;
  const LOG_PREFIX = "[github-readme-copy]";
  const DEBUG = false;

  const debugLog = (...args) => {
    if (!DEBUG) {
      return;
    }
    console.log(LOG_PREFIX, ...args);
  };

  let observer;
  let scheduled;

  const buildBlobPlainUrlFromBlob = (blobHref) => {
    const url = new URL(blobHref, location.origin);
    url.searchParams.set("plain", "1");
    return url.toString();
  };

  const buildRawCdnUrlFromBlob = (blobHref) => {
    const url = new URL(blobHref, location.origin);
    const parts = url.pathname.split("/");

    // ['', owner, repo, 'blob', ref, ...path]
    if (parts.length < 6 || parts[3] !== "blob") {
      throw new Error(`Unexpected blob URL path: ${url.pathname}`);
    }

    const owner = parts[1];
    const repo = parts[2];
    const ref = parts[4];
    const filePath = parts.slice(5).join("/");
    return `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${filePath}`;
  };

  const parseBlobPlainHtml = (html) => {
    const doc = new DOMParser().parseFromString(html, "text/html");

    // Newer GitHub: plain view often contains a single <pre>.
    const pre = doc.querySelector("pre");
    if (pre && typeof pre.textContent === "string") {
      return pre.textContent;
    }

    // Older GitHub: code cells.
    const cells = doc.querySelectorAll(
      "td.blob-code-inner, td.blob-code, td[data-testid='code-cell']",
    );
    if (cells && cells.length > 0) {
      const lines = [];
      cells.forEach((el) => {
        lines.push(el.textContent || "");
      });
      return lines.join("\n");
    }

    // Last resort: GitHub sometimes renders a single text container.
    const container = doc.querySelector(
      "[data-testid='blob-viewer'], [data-testid='blob-wrapper'], #blob-wrapper",
    );
    if (container && typeof container.textContent === "string") {
      const text = container.textContent.trim();
      if (text) {
        return text;
      }
    }

    return null;
  };

  const fetchSourceFromBlob = async (blobHref) => {
    // 1) Same-origin blob plain view first (no CORS, works for private repos).
    const blobPlainUrl = buildBlobPlainUrlFromBlob(blobHref);
    try {
      const resp = await fetch(blobPlainUrl, {
        credentials: "include",
        redirect: "follow",
      });

      if (resp.ok) {
        const html = await resp.text();
        const parsed = parseBlobPlainHtml(html);
        if (typeof parsed === "string" && parsed.length > 0) {
          return parsed;
        }
        // If parsing fails, fall through to raw-cdn.
      }
    } catch (e) {
      debugLog("blob plain fetch failed", e);
    }

    // 2) Raw CDN fallback (public repos). Avoid credentials=include to satisfy CORS.
    const rawUrl = buildRawCdnUrlFromBlob(blobHref);
    const resp2 = await fetch(rawUrl, {
      credentials: "omit",
      redirect: "follow",
    });
    if (!resp2.ok) {
      throw new Error(`HTTP ${resp2.status} for ${rawUrl}`);
    }
    return await resp2.text();
  };

  const copyToClipboard = async (text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch (e) {
        // Fall through to execCommand.
        debugLog("clipboard API rejected, falling back", e);
      }
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-1000px";
    textarea.style.left = "-1000px";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    document.body.appendChild(textarea);

    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);

    if (!ok) {
      throw new Error("execCommand(copy) failed");
    }
  };

  const resetButtonLabel = (button, originalTitle) => {
    if (button._labelResetId) {
      clearTimeout(button._labelResetId);
    }
    button._labelResetId = setTimeout(() => {
      button.setAttribute("title", originalTitle);
      button.setAttribute("aria-label", "Copy README markdown source");
      button._labelResetId = null;
    }, BUTTON_TIMEOUT_MS);
  };

  const handleClick = (el, blobHref) => {
    if (el.getAttribute("data-busy") === "1") {
      return;
    }

    const originalTitle = el.getAttribute("title") || "Copy README.md";
    el.setAttribute("data-busy", "1");
    el.setAttribute("aria-disabled", "true");
    el.setAttribute("title", "Copying...");
    el.setAttribute("aria-label", "Copying README markdown source");

    fetchSourceFromBlob(blobHref)
      .then((text) => copyToClipboard(text))
      .then(() => {
        el.setAttribute("title", COPIED_LABEL);
        el.setAttribute("aria-label", "Copied README markdown source");
        resetButtonLabel(el, originalTitle);
      })
      .catch((err) => {
        debugLog("copy failed", err);
        el.setAttribute("title", ERROR_LABEL);
        el.setAttribute("aria-label", "Failed to copy README markdown source");
        resetButtonLabel(el, originalTitle);
      })
      .finally(() => {
        el.removeAttribute("data-busy");
        el.removeAttribute("aria-disabled");
      });
  };

  const getContainer = () =>
    document.querySelector("#repo-content-pjax-container") || document;

  const matchesReadme = (link) => {
    const label = link.textContent ? link.textContent.trim().toLowerCase() : "";
    if (label === "readme.md") {
      return true;
    }

    try {
      const url = new URL(link.href, location.origin);
      const p = url.pathname.toLowerCase();
      if (!p.endsWith("/readme.md")) {
        return false;
      }

      // Only treat blob/raw links as README files (avoid sidebar "Readme" items, etc).
      return p.includes("/blob/") || p.includes("/raw/");
    } catch {
      return false;
    }
  };

  const ensureStyles = () => {
    if (document.querySelector('style[data-readme-copy-style="1"]')) {
      return;
    }
    const style = document.createElement("style");
    style.setAttribute("data-readme-copy-style", "1");
    style.textContent = `
      a[${BUTTON_ATTR}] {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 26px;
        height: 22px;
        padding: 0;
        margin-left: 6px;
        flex: none !important;
        opacity: 1 !important;
        visibility: visible !important;
        line-height: 1;
      }
      a[${BUTTON_ATTR}] svg {
        fill: currentColor;
        width: 14px;
        height: 14px;
        display: block;
      }
      a[${BUTTON_ATTR}][aria-disabled="true"] {
        opacity: 0.6 !important;
        cursor: progress;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  };

  const forceOverflowVisible = (el) => {
    if (!(el instanceof HTMLElement)) {
      return;
    }
    el.style.overflow = "visible";
    el.style.overflowX = "visible";
    el.style.overflowY = "visible";
  };

  const pickNameHost = (_row, link) => {
    // GitHub directory table wraps filenames in these containers.
    const host =
      link.closest(".react-directory-truncate") ||
      link.closest(".react-directory-filename-cell") ||
      link.closest(".Truncate, .Truncate-text, .css-truncate") ||
      link.parentElement;

    if (!host) {
      return link.parentElement;
    }

    // GitHub uses `.overflow-hidden` around the name; override for this row.
    forceOverflowVisible(host);
    forceOverflowVisible(host.parentElement);
    const overflowHidden = host.closest(".overflow-hidden");
    if (overflowHidden) {
      forceOverflowVisible(overflowHidden);
    }

    return host;
  };

  const createCopyIcon = () => {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 16 16");
    svg.setAttribute("width", "14");
    svg.setAttribute("height", "14");
    svg.setAttribute("aria-hidden", "true");

    const path = document.createElementNS(svgNS, "path");
    // Octicon copy (MIT) - common GitHub-style copy icon.
    path.setAttribute(
      "d",
      "M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Zm5-5C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z",
    );
    svg.appendChild(path);
    return svg;
  };

  const findReadmeInRow = (row) => {
    const links = row.querySelectorAll("a[href]");
    for (const el of links) {
      const a = /** @type {HTMLAnchorElement} */ (el);
      if (!matchesReadme(a)) {
        continue;
      }
      return a;
    }
    return null;
  };

  const pickPrimaryReadmeLink = (row) => {
    // GitHub directory listing renders two name cells (small + large screen).
    // Prefer the large-screen cell so the button isn't inserted into a hidden column.
    const large = row.querySelector(
      "td.react-directory-row-name-cell-large-screen a[href].Link--primary",
    );
    if (large && matchesReadme(/** @type {HTMLAnchorElement} */ (large))) {
      return /** @type {HTMLAnchorElement} */ (large);
    }

    const small = row.querySelector(
      "td.react-directory-row-name-cell-small-screen a[href].Link--primary",
    );
    if (small && matchesReadme(/** @type {HTMLAnchorElement} */ (small))) {
      return /** @type {HTMLAnchorElement} */ (small);
    }

    return findReadmeInRow(row);
  };

  const ensureButton = (row, link) => {
    ensureStyles();

    let btn = row.querySelector(`a[${BUTTON_ATTR}]`);
    const isNew = !btn;

    if (!btn) {
      btn = document.createElement("a");
      btn.setAttribute(BUTTON_ATTR, "1");
      btn.setAttribute("href", "#");
      btn.setAttribute("role", "button");
      btn.setAttribute("tabindex", "0");
      btn.setAttribute("aria-label", "Copy README markdown source");
      btn.setAttribute("title", "Copy README.md");
      btn.className = "btn btn-sm";
      btn.appendChild(createCopyIcon());
      btn.style.flex = "none";
      btn.style.position = "relative";
      btn.style.zIndex = "2";

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleClick(btn, link.href);
      });

      btn.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " ") {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        handleClick(btn, link.href);
      });
    }

    const host = pickNameHost(row, link);
    const moved = btn.parentElement !== host || btn.previousSibling !== link;
    if (moved) {
      link.insertAdjacentElement("afterend", btn);
    }

    return isNew || moved;
  };

  const scanForReadmes = () => {
    const container = getContainer();

    let seenReadme = 0;
    let injected = 0;

    // Prefer scanning directory rows rather than all anchors (GitHub page has lots of links).
    const rows = container.querySelectorAll(
      'tr.react-directory-row, div.Box-row, [role="row"]',
    );
    rows.forEach((row) => {
      const a = pickPrimaryReadmeLink(row);
      if (!a) {
        return;
      }
      seenReadme += 1;
      if (ensureButton(row, a)) {
        injected += 1;
      }
    });

    debugLog(`scan rows: README seen=${seenReadme} injected=${injected}`);
  };

  const ensure = () => {
    if (scheduled) {
      cancelAnimationFrame(scheduled);
    }
    scheduled = requestAnimationFrame(() => {
      try {
        scanForReadmes();
      } catch (e) {
        debugLog("scan failed", e);
      }
      scheduled = null;
    });
  };

  const attachObserver = () => {
    const target =
      document.querySelector("#repo-content-pjax-container") ||
      document.querySelector("[data-pjax-container]") ||
      document.body;
    if (!target) {
      return;
    }
    if (observer) {
      observer.disconnect();
    }
    observer = new MutationObserver(ensure);
    observer.observe(target, { childList: true, subtree: true });
  };

  const onNavigation = () => {
    ensure();
    attachObserver();
  };

  document.addEventListener("pjax:end", onNavigation);
  document.addEventListener("turbo:load", onNavigation);

  debugLog("loaded", location.href);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onNavigation);
  } else {
    onNavigation();
  }

  window.addEventListener("load", onNavigation);
  setTimeout(onNavigation, 1500);
})();
