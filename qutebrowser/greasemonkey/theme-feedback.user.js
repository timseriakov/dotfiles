// ==UserScript==
// @name         Theme Feedback Notification
// @namespace    qutebrowser
// @version      1.4.0
// @description  Show a notification bubble when switching dark/light mode, styled like hover-link-bubble.
// @author       tim
// @match        *://*/*
// @run-at       document-end
// @noframes
// ==/UserScript==

(function () {
  "use strict";

  let ui = null;
  let hideTimeout = null;
  const HOST_SELECTOR = '[data-qute-theme-feedback="1"]';
  const HANDLER_KEY = "__quteThemeFeedbackHandler";

  function ensureUi() {
    if (ui && ui.host?.isConnected && ui.bubble?.isConnected) return ui;

    const hosts = Array.from(document.querySelectorAll(HOST_SELECTOR));
    let host = hosts[0] || null;

    for (const extraHost of hosts.slice(1)) {
      extraHost.remove();
    }

    if (host?.shadowRoot) {
      const bubble = host.shadowRoot.querySelector(".Bubble");
      if (bubble) {
        ui = { host, bubble };
        return ui;
      }
      host.remove();
      host = null;
    }

    host = document.createElement("div");
    host.setAttribute("data-qute-theme-feedback", "1");
    host.style.position = "fixed";
    host.style.left = "0";
    host.style.top = "0";
    host.style.width = "0";
    host.style.height = "0";
    host.style.zIndex = "2147483646";

    const shadow = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = `
      :host { all: initial; }
      .Bubble {
        position: fixed;
        bottom: 8px;
        right: 8px;
        padding: 4px 8px;
        border-radius: 6px;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 12px;
        font-weight: 450;
        line-height: 1.2;
        color: var(--qute-hb-fg);
        background: var(--qute-hb-bg);
        border: 1px solid var(--qute-hb-border);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 1px 4px rgba(0, 0, 0, 0.1);
        opacity: 0;
        transform: translateY(4px);
        transition: opacity 120ms ease, transform 120ms ease;
        z-index: 2147483646;
      }
      .Bubble.show {
        opacity: 1;
        transform: translateY(0);
      }
      .Bubble[data-theme="light"] {
        --qute-hb-fg: #374151;
        --qute-hb-bg: #ffffff;
        --qute-hb-border: rgba(0, 0, 0, 0.08);
      }
      .Bubble[data-theme="dark"] {
        --qute-hb-fg: rgba(255, 255, 255, 0.75);
        --qute-hb-bg: #1c1c1c;
        --qute-hb-border: rgba(255, 255, 255, 0.1);
      }
    `;

    const bubble = document.createElement("div");
    bubble.className = "Bubble";
    bubble.dataset.theme = resolveTooltipTheme();

    shadow.appendChild(style);
    shadow.appendChild(bubble);
    document.documentElement.appendChild(host);

    ui = { host, bubble };
    return ui;
  }

  function resolveTooltipTheme() {
    const styleTarget = document.documentElement || document.body;
    if (styleTarget && typeof window.getComputedStyle === "function") {
      try {
        const rootStyle = window.getComputedStyle(styleTarget);
        const bg = rootStyle.backgroundColor;
        const match = bg.match(/^rgba?\s*\(\s*(\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
          const luminance =
            (0.2126 * parseInt(match[1]) +
              0.7152 * parseInt(match[2]) +
              0.0722 * parseInt(match[3])) /
            255;
          return luminance < 0.5 ? "dark" : "light";
        }
      } catch {}
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function showNotification(mode) {
    const currentUi = ensureUi();
    currentUi.bubble.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
    currentUi.bubble.dataset.theme = resolveTooltipTheme();
    currentUi.bubble.classList.add("show");

    if (hideTimeout) clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
      if (!currentUi.host.isConnected || !currentUi.bubble.isConnected) return;
      currentUi.bubble.classList.remove("show");
      hideTimeout = null;
    }, 3000);
  }

  const previousHandler = document[HANDLER_KEY];
  if (previousHandler) {
    document.removeEventListener("qute-theme-changed", previousHandler);
  }

  const handler = (e) => {
    showNotification(e.detail.mode);
  };

  document.addEventListener("qute-theme-changed", handler);
  document[HANDLER_KEY] = handler;
})();
