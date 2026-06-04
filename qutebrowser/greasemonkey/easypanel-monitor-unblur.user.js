// ==UserScript==
// @name         Easypanel Monitor Unblur
// @namespace    qutebrowser
// @version      1.0.0
// @description  Убирает inline blur на странице Easypanel monitor.
// @author       tim
// @match        https://mjdgme.easypanel.host/monitor*
// @run-at       document-start
// @noframes
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const STYLE_ID = "easypanel-monitor-unblur-style";
  const BLUR_SELECTOR = [
    '[style*="blur"]',
    '[style*="filter: blur"]',
    '[style*="filter:blur"]',
    '[style*="filter: `blur"]',
  ].join(",");

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      html body [style*="blur"],
      html body [style*="filter: blur"],
      html body [style*="filter:blur"] {
        filter: none !important;
        -webkit-filter: none !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        pointer-events: auto !important;
        -webkit-user-select: auto !important;
        user-select: auto !important;
      }
    `;

    const target = document.head || document.documentElement;
    if (target) {
      target.appendChild(style);
    }
  }

  function hasBlur(value) {
    return typeof value === "string" && value.toLowerCase().includes("blur");
  }

  function unlockElement(element) {
    if (!(element instanceof HTMLElement)) return;

    const style = element.style;
    const filter = style.getPropertyValue("filter");
    const webkitFilter = style.getPropertyValue("-webkit-filter");
    const backdropFilter = style.getPropertyValue("backdrop-filter");
    const webkitBackdropFilter = style.getPropertyValue(
      "-webkit-backdrop-filter",
    );

    if (hasBlur(filter) || hasBlur(webkitFilter)) {
      style.setProperty("filter", "none", "important");
      style.setProperty("-webkit-filter", "none", "important");
    }

    if (hasBlur(backdropFilter) || hasBlur(webkitBackdropFilter)) {
      style.setProperty("backdrop-filter", "none", "important");
      style.setProperty("-webkit-backdrop-filter", "none", "important");
    }

    if (style.getPropertyValue("pointer-events") === "none") {
      style.setProperty("pointer-events", "auto", "important");
    }

    if (style.getPropertyValue("user-select") === "none") {
      style.setProperty("user-select", "auto", "important");
      style.setProperty("-webkit-user-select", "auto", "important");
    }
  }

  function cleanupBlur(root) {
    injectStyle();

    const scanRoot = root instanceof Element ? root : document;
    if (scanRoot instanceof HTMLElement) {
      unlockElement(scanRoot);
    }

    scanRoot.querySelectorAll(BLUR_SELECTOR).forEach(unlockElement);
  }

  let scheduled = false;

  function scheduleCleanup(root) {
    if (scheduled) return;

    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      cleanupBlur(root);
    });
  }

  function startObserver() {
    if (!document.documentElement) return;

    cleanupBlur(document);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "attributes") {
          scheduleCleanup(mutation.target);
          return;
        }

        for (const node of mutation.addedNodes) {
          if (node instanceof Element) {
            scheduleCleanup(node);
            return;
          }
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style"],
      childList: true,
      subtree: true,
    });
  }

  injectStyle();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startObserver, {
      once: true,
    });
  } else {
    startObserver();
  }
})();
