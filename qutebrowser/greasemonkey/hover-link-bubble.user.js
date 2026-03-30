// ==UserScript==
// @name         Hover Link Bubble
// @namespace    qutebrowser
// @version      1.0.0
// @description  Show a Helium-like bubble with link URL when hovering over links.
// @author       tim
// @match        *://*/*
// @run-at       document-end
// @grant        GM_getValue
// @grant        GM_setValue
// @noframes
// ==/UserScript==

(function () {
  "use strict";

  const TEST_MODE = window.__QUTE_HOVER_BUBBLE_TEST__ === true;

  const CONFIG = {
    hoverBubbleEnabled: true,
    hoverBubblePadding: "4px 8px",
    hoverBubbleBorderRadius: "6px",
    hoverBubbleFontSize: "12px",
    hoverBubbleMaxWidthPx: 600,
    hoverBubbleMarginBottom: "8px",
    hoverBubbleMarginLeft: "8px",
  };

  const state = {
    hoverBubbleActive: false,
    hoveredLink: null,
    hoveredUrl: null,
  };

  let ui = null;

  const testApi = TEST_MODE ? buildTestApi() : null;
  if (TEST_MODE) {
    window.__quteHoverBubbleTest = testApi;
  }

  try {
    attachListeners();
  } catch (err) {
    console.error(
      "[Hover Link Bubble] Critical failure in attachListeners:",
      err,
    );
  }

  function attachListeners() {
    const safeAdd = (target, type, fn, capture) => {
      try {
        target.addEventListener(type, fn, capture);
      } catch (e) {
        console.error(`[Hover Link Bubble] Failed to add ${type} listener:`, e);
      }
    };

    safeAdd(document, "mouseover", onLinkMouseover, true);
    safeAdd(document, "mouseout", onLinkMouseout, true);
    safeAdd(document, "focusin", onLinkFocusin, true);
    safeAdd(document, "focusout", onLinkFocusout, true);
    safeAdd(document, "dragstart", onDragstart, true);
    safeAdd(window, "blur", onBlur, true);
    safeAdd(document, "visibilitychange", onVisibilityChange, true);
    safeAdd(window, "scroll", onScrollOrResize, true);
    safeAdd(window, "resize", onScrollOrResize, true);
  }

  function findNearestLink(node) {
    if (!node) {
      return null;
    }
    if (node.nodeType === Node.ELEMENT_NODE && node.nodeName === "A") {
      return node;
    }
    if (typeof node.closest === "function") {
      return node.closest("a[href]");
    }
    let current = node;
    while (current && current !== document) {
      if (current.nodeType === Node.ELEMENT_NODE && current.nodeName === "A") {
        return current;
      }
      current = current.parentNode;
    }
    return null;
  }

  function isValidLinkUrl(href) {
    if (!href || typeof href !== "string") {
      return false;
    }
    const trimmed = href.trim();
    if (!trimmed) {
      return false;
    }
    if (trimmed.startsWith("#") || trimmed === "#") {
      return false;
    }
    if (trimmed.toLowerCase().startsWith("javascript:")) {
      return false;
    }
    return true;
  }

  function onLinkMouseover(e) {
    if (!CONFIG.hoverBubbleEnabled) {
      return;
    }
    const target = e && e.target;
    if (!target) {
      return;
    }
    const link = findNearestLink(target);
    if (!link) {
      return;
    }
    const href = link.getAttribute && link.getAttribute("href");
    if (!isValidLinkUrl(href)) {
      return;
    }
    state.hoveredLink = link;
    state.hoveredUrl = href;
    showHoverBubble(href);
  }

  function onLinkMouseout(e) {
    if (!CONFIG.hoverBubbleEnabled) {
      return;
    }
    const target = e && e.relatedTarget;
    const link = findNearestLink(target);
    if (link && link === state.hoveredLink) {
      return;
    }
    hideHoverBubble();
  }

  function onLinkFocusin(e) {
    if (!CONFIG.hoverBubbleEnabled) {
      return;
    }
    const target = e && e.target;
    if (!target) {
      return;
    }
    const link = findNearestLink(target);
    if (!link) {
      return;
    }
    const href = link.getAttribute && link.getAttribute("href");
    if (!isValidLinkUrl(href)) {
      return;
    }
    state.hoveredLink = link;
    state.hoveredUrl = href;
    showHoverBubble(href);
  }

  function onLinkFocusout(e) {
    if (!CONFIG.hoverBubbleEnabled) {
      return;
    }
    const target = e && e.relatedTarget;
    const link = findNearestLink(target);
    if (link && link === state.hoveredLink) {
      return;
    }
    hideHoverBubble();
  }

  function onDragstart() {
    if (!CONFIG.hoverBubbleEnabled) {
      return;
    }
    hideHoverBubble();
  }

  function showHoverBubble(url) {
    if (!url) {
      return;
    }
    ensureHoverBubbleUi();
    if (!ui || !ui.hoverBubble || !ui.hoverBubbleContent) {
      return;
    }
    state.hoverBubbleActive = true;
    ui.hoverBubbleContent.textContent = url;
    ui.hoverBubble.dataset.theme = resolveTooltipTheme();
    ui.hoverBubble.dataset.open = "1";
  }

  function hideHoverBubble() {
    if (!state.hoverBubbleActive) {
      return;
    }
    state.hoverBubbleActive = false;
    state.hoveredLink = null;
    state.hoveredUrl = null;
    if (ui && ui.hoverBubble) {
      ui.hoverBubble.dataset.open = "0";
    }
  }

  function ensureHoverBubbleUi() {
    if (ui && ui.hoverBubble) {
      return;
    }
    ensureUi();
  }

  function onBlur() {
    hideHoverBubble();
  }

  function onVisibilityChange() {
    if (document.visibilityState !== "visible") {
      hideHoverBubble();
    }
  }

  function onScrollOrResize() {
    hideHoverBubble();
  }

  function ensureUi() {
    if (ui) {
      return;
    }

    const host = document.createElement("div");
    host.setAttribute("data-qute-hover-bubble", "1");
    host.style.position = "fixed";
    host.style.left = "0";
    host.style.top = "0";
    host.style.width = "0";
    host.style.height = "0";
    host.style.zIndex = "2147483646";

    const shadow = host.attachShadow({ mode: TEST_MODE ? "open" : "closed" });
    const style = document.createElement("style");
    style.textContent = buildBubbleCss();

    const hoverBubble = document.createElement("div");
    hoverBubble.className = "HoverBubble";
    hoverBubble.dataset.open = "0";
    hoverBubble.dataset.theme = resolveTooltipTheme();

    const hoverBubbleContent = document.createElement("div");
    hoverBubbleContent.className = "HoverBubbleContent";

    hoverBubble.appendChild(hoverBubbleContent);
    shadow.appendChild(style);
    shadow.appendChild(hoverBubble);
    (document.documentElement || document.body).appendChild(host);

    ui = { host, shadow, hoverBubble, hoverBubbleContent };
  }

  function buildBubbleCss() {
    return `
      :host {
        all: initial;
      }

      .HoverBubble {
        position: fixed;
        bottom: ${CONFIG.hoverBubbleMarginBottom};
        left: ${CONFIG.hoverBubbleMarginLeft};
        max-width: min(${CONFIG.hoverBubbleMaxWidthPx}px, calc(100vw - ${CONFIG.hoverBubbleMarginLeft} * 2));
        padding: ${CONFIG.hoverBubblePadding};
        border-radius: ${CONFIG.hoverBubbleBorderRadius};
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: ${CONFIG.hoverBubbleFontSize};
        font-weight: 450;
        line-height: 1.2;
        color: var(--qute-hb-fg);
        background: var(--qute-hb-bg);
        border: 1px solid var(--qute-hb-border);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 1px 4px rgba(0, 0, 0, 0.1);
        opacity: 0;
        transform: translateY(4px);
        transition: opacity 120ms ease, transform 120ms ease;
        pointer-events: none;
        z-index: 2147483646;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .HoverBubble[data-open="1"] {
        opacity: 1;
        transform: translateY(0);
      }

      .HoverBubble[data-theme="light"] {
        --qute-hb-fg: #374151;
        --qute-hb-bg: #ffffff;
        --qute-hb-border: rgba(0, 0, 0, 0.08);
      }

      .HoverBubble[data-theme="dark"] {
        --qute-hb-fg: rgba(255, 255, 255, 0.75);
        --qute-hb-bg: #1c1c1c;
        --qute-hb-border: rgba(255, 255, 255, 0.1);
      }

      .HoverBubbleContent {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    `;
  }

  function resolveTooltipTheme() {
    const styleTarget = document.documentElement || document.body;
    if (styleTarget && typeof window.getComputedStyle === "function") {
      try {
        const styleCandidates = [document.body, document.documentElement];
        for (const candidate of styleCandidates) {
          if (!candidate) {
            continue;
          }
          const candidateStyle = window.getComputedStyle(candidate);
          const bg =
            candidateStyle && typeof candidateStyle.backgroundColor === "string"
              ? candidateStyle.backgroundColor
              : "";
          const rgba = parseRgba(bg);
          if (!rgba || rgba.a <= 0.01) {
            continue;
          }
          const luminance =
            (0.2126 * rgba.r + 0.7152 * rgba.g + 0.0722 * rgba.b) / 255;
          return luminance < 0.5 ? "dark" : "light";
        }

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

  function parseRgba(colorStr) {
    if (!colorStr || typeof colorStr !== "string") {
      return null;
    }
    const match = colorStr.match(
      /^rgba?\s*\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*\)\s*/i,
    );
    if (!match || match.length < 5) {
      return null;
    }
    return {
      r: parseInt(match[1], 10) || 0,
      g: parseInt(match[2], 10) || 0,
      b: parseInt(match[3], 10) || 0,
      a: parseFloat(match[4]) || 1,
    };
  }

  function buildTestApi() {
    const api = {
      reset: () => {
        hideHoverBubble();
        state.hoveredLink = null;
        state.hoveredUrl = null;
      },
      getHoverBubbleState: () => {
        return {
          active: state.hoverBubbleActive,
          hoveredUrl: state.hoveredUrl,
          open: ui && ui.hoverBubble ? ui.hoverBubble.dataset.open : "0",
          theme: ui && ui.hoverBubble ? ui.hoverBubble.dataset.theme : null,
          text:
            ui && ui.hoverBubbleContent
              ? ui.hoverBubbleContent.textContent
              : "",
        };
      },
      triggerHoverBubble: (url) => {
        if (!url) {
          return;
        }
        state.hoveredUrl = url;
        showHoverBubble(url);
      },
      setConfig: (key, value) => {
        if (key in CONFIG) {
          CONFIG[key] = value;
        }
      },
      getConfig: () => {
        return { ...CONFIG };
      },
      getUi: () => ui,
    };
    return api;
  }
})();
