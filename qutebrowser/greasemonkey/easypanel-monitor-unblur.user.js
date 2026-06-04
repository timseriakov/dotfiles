// ==UserScript==
// @name         Easypanel Monitor Unblur
// @namespace    qutebrowser
// @version      1.0.0
// @description  Убирает blur и скрывает покупку лицензии на странице Easypanel monitor.
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
  const BUY_LICENSE_SELECTOR = [
    'a[href="/buy-license"]',
    'a[href^="/buy-license?"]',
    'a[href^="/buy-license#"]',
    'a[href*="/buy-license"]',
  ].join(",");
  const LICENSE_NOTICE_SELECTOR = [
    '[role="alert"]',
    '[data-status="warning"]',
    '[class*="chakra-alert" i]',
    '[class*="alert" i]',
    '[class*="toast" i]',
  ].join(",");
  const SUPPORT_LINK_SELECTOR = [
    'a[href*="canny"]',
    'a[href*="changelog"]',
    'a[href*="discord"]',
    'a[href*="docs"]',
    'a[href*="documentation"]',
    'a[href*="feedback"]',
    'a[href*="docs.easypanel.io"]',
    'a[href*="discord.gg/easypanel"]',
    'a[href*="discord.com/invite/easypanel"]',
    'a[href*="easypanel.canny.io"]',
    'a[href*="feedback.easypanel.io"]',
    'a[href*="changelog.easypanel.io"]',
    'a[href*="easypanel.io/changelog"]',
  ].join(",");
  const SIDEBAR_SUPPORT_DIVIDER_SELECTOR = [
    "div.border-b.border-sidebar-border.my-4",
    'div[class*="border-sidebar-border"][class*="my-4"]',
  ].join(",");
  const SUPPORT_LINK_MATCHERS = [
    (url) => /docs?|documentation/i.test(`${url.hostname}${url.pathname}`),
    (url) => /discord/i.test(`${url.hostname}${url.pathname}`),
    (url) => /feedback/i.test(`${url.hostname}${url.pathname}`),
    (url) => /changelog/i.test(`${url.hostname}${url.pathname}`),
    (url) => /canny/i.test(`${url.hostname}${url.pathname}`),
    (url) => url.hostname === "docs.easypanel.io",
    (url) =>
      url.hostname === "discord.gg" && url.pathname.includes("easypanel"),
    (url) =>
      url.hostname === "discord.com" && url.pathname.includes("easypanel"),
    (url) => url.hostname === "easypanel.canny.io",
    (url) => url.hostname === "feedback.easypanel.io",
    (url) => url.hostname === "changelog.easypanel.io",
    (url) =>
      url.hostname === "easypanel.io" && url.pathname.includes("changelog"),
  ];

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

      html body a[href="/buy-license"],
      html body a[href^="/buy-license?"],
      html body a[href^="/buy-license#"],
      html body a[href*="/buy-license"] {
        display: none !important;
        visibility: hidden !important;
      }

      html body [role="alert"]:has(a[href="/buy-license"]),
      html body [role="alert"]:has(a[href^="/buy-license?"]),
      html body [role="alert"]:has(a[href^="/buy-license#"]),
      html body [role="alert"]:has(a[href*="/buy-license"]),
      html body [data-status="warning"]:has(a[href="/buy-license"]),
      html body [data-status="warning"]:has(a[href^="/buy-license?"]),
      html body [data-status="warning"]:has(a[href^="/buy-license#"]),
      html body [data-status="warning"]:has(a[href*="/buy-license"]),
      html body [class*="alert" i]:has(a[href="/buy-license"]),
      html body [class*="alert" i]:has(a[href^="/buy-license?"]),
      html body [class*="alert" i]:has(a[href^="/buy-license#"]),
      html body [class*="alert" i]:has(a[href*="/buy-license"]) {
        display: none !important;
        visibility: hidden !important;
      }

      html body [role="alert"],
      html body [data-status="warning"],
      html body [class*="chakra-alert" i] {
        display: none !important;
        visibility: hidden !important;
      }

      html body a[href*="docs.easypanel.io"],
      html body a[href*="canny"],
      html body a[href*="changelog"],
      html body a[href*="discord"],
      html body a[href*="docs"],
      html body a[href*="documentation"],
      html body a[href*="feedback"],
      html body a[href*="discord.gg/easypanel"],
      html body a[href*="discord.com/invite/easypanel"],
      html body a[href*="easypanel.canny.io"],
      html body a[href*="feedback.easypanel.io"],
      html body a[href*="changelog.easypanel.io"],
      html body a[href*="easypanel.io/changelog"] {
        display: none !important;
        visibility: hidden !important;
      }

      html body div.border-b.border-sidebar-border.my-4,
      html body div[class*="border-sidebar-border"][class*="my-4"] {
        display: none !important;
        visibility: hidden !important;
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

  function isBuyLicenseLink(element) {
    if (!(element instanceof HTMLAnchorElement)) return false;

    const href = element.getAttribute("href");
    if (!href) return false;

    try {
      const url = new URL(href, window.location.href);
      return url.pathname.replace(/\/$/, "") === "/buy-license";
    } catch (_) {
      return href.includes("/buy-license");
    }
  }

  function hideBuyLicenseLink(element) {
    if (!isBuyLicenseLink(element)) return;

    hideLicenseNoticeForLink(element);
    element.style.setProperty("display", "none", "important");
    element.style.setProperty("visibility", "hidden", "important");
  }

  function isSupportLink(element) {
    if (!(element instanceof HTMLAnchorElement)) return false;

    const href = element.getAttribute("href");
    if (!href) return false;

    try {
      const url = new URL(href, window.location.href);
      return SUPPORT_LINK_MATCHERS.some((matches) => matches(url));
    } catch (_) {
      return /docs?|documentation|discord|feedback|changelog|canny/i.test(href);
    }
  }

  function countSupportLinks(element) {
    return Array.from(element.querySelectorAll("a")).filter(isSupportLink)
      .length;
  }

  function isDividerElement(element) {
    if (!(element instanceof HTMLElement)) return false;

    const textLength = (element.textContent || "").trim().length;
    const className = String(element.className || "");
    const role = element.getAttribute("role");
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const hasDividerClass = /divider|separator|hr|border/i.test(className);
    const hasBorder =
      style.borderTopStyle !== "none" || style.borderBottomStyle !== "none";
    const isThin = rect.height <= 4 || parseFloat(style.height || "0") <= 4;
    const isWideEnough = rect.width >= 24 || element.offsetWidth >= 24;

    return (
      element.tagName === "HR" ||
      role === "separator" ||
      (textLength === 0 &&
        isThin &&
        isWideEnough &&
        (hasBorder || hasDividerClass))
    );
  }

  function hideNearbySupportDivider(block) {
    if (!(block instanceof HTMLElement)) return;

    const siblings = [
      block.previousElementSibling,
      block.nextElementSibling,
      block.parentElement && block.parentElement.previousElementSibling,
      block.parentElement && block.parentElement.nextElementSibling,
    ];

    siblings.forEach((sibling) => {
      if (isDividerElement(sibling)) {
        hideElement(sibling);
      }
    });
  }

  function hideSidebarSupportDividers(root) {
    const scanRoot = root instanceof Element ? root : document;

    if (
      scanRoot instanceof HTMLElement &&
      scanRoot.matches(SIDEBAR_SUPPORT_DIVIDER_SELECTOR)
    ) {
      hideElement(scanRoot);
    }

    scanRoot
      .querySelectorAll(SIDEBAR_SUPPORT_DIVIDER_SELECTOR)
      .forEach(hideElement);
  }

  function hideSupportBlockForLink(link) {
    if (!(link instanceof HTMLElement)) return;

    let candidate = link.parentElement;
    for (let depth = 0; candidate && depth < 7; depth += 1) {
      const supportLinks = countSupportLinks(candidate);
      const allLinks = candidate.querySelectorAll("a").length;
      const textLength = (candidate.textContent || "").trim().length;

      if (supportLinks >= 2 && allLinks <= 8 && textLength < 700) {
        hideNearbySupportDivider(candidate);
        hideElement(candidate);
        return;
      }

      candidate = candidate.parentElement;
    }

    hideElement(link);
  }

  function hideSupportLink(element) {
    if (!isSupportLink(element)) return;

    hideSupportBlockForLink(element);
    hideElement(element);
  }

  function hideElement(element) {
    if (!(element instanceof HTMLElement)) return;

    element.style.setProperty("display", "none", "important");
    element.style.setProperty("visibility", "hidden", "important");
  }

  function hideLicenseNoticeForLink(link) {
    if (!(link instanceof HTMLElement)) return;

    const notice = link.closest(LICENSE_NOTICE_SELECTOR);
    if (notice instanceof HTMLElement) {
      hideElement(notice);
      return;
    }

    let candidate = link.parentElement;
    for (let depth = 0; candidate && depth < 5; depth += 1) {
      const links = candidate.querySelectorAll("a").length;
      const buttons = candidate.querySelectorAll("button").length;
      const textLength = (candidate.textContent || "").trim().length;

      if (links <= 2 && buttons <= 2 && textLength > 0 && textLength < 300) {
        hideElement(candidate);
        return;
      }

      candidate = candidate.parentElement;
    }
  }

  function hideLicenseNotices(root) {
    const scanRoot = root instanceof Element ? root : document;

    if (
      scanRoot instanceof HTMLElement &&
      scanRoot.matches(LICENSE_NOTICE_SELECTOR)
    ) {
      hideElement(scanRoot);
    }

    scanRoot.querySelectorAll(LICENSE_NOTICE_SELECTOR).forEach(hideElement);
  }

  function cleanupBlur(root) {
    injectStyle();

    const scanRoot = root instanceof Element ? root : document;
    if (scanRoot instanceof HTMLElement) {
      unlockElement(scanRoot);
    }

    scanRoot.querySelectorAll(BLUR_SELECTOR).forEach(unlockElement);
    scanRoot.querySelectorAll(BUY_LICENSE_SELECTOR).forEach(hideBuyLicenseLink);
    scanRoot.querySelectorAll(SUPPORT_LINK_SELECTOR).forEach(hideSupportLink);
    hideSidebarSupportDividers(scanRoot);
    hideLicenseNotices(scanRoot);

    if (scanRoot instanceof HTMLAnchorElement) {
      hideBuyLicenseLink(scanRoot);
      hideSupportLink(scanRoot);
    }
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
      attributeFilter: ["style", "href"],
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
