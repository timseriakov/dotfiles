// ==UserScript==
// @name         Download Media with Cobalt API
// @namespace    https://github.com/tizee/tempermonkey-download-with-cobalt
// @version      1.1
// @description  Adds a context menu item to download media from supported video sites using a direct URL.
// @author       tizee
// @match        *://*.bilibili.com/video/*
// @match        *://*.instagram.com/p/*
// @match        *://*.instagram.com/reels/*
// @match        *://*.instagram.com/reel/*
// @match        *://*.twitter.com/*/status/*
// @match        *://*.twitter.com/*/status/*/video/*
// @match        *://*.twitter.com/i/spaces/*
// @match        *://*.x.com/*/status/*
// @match        *://*.x.com/*/status/*/video/*
// @match        *://*.x.com/i/spaces/*
// @match        *://*.reddit.com/r/*/comments/*/*
// @match        *://*.soundcloud.com/*
// @match        *://*.soundcloud.app.goo.gl/*
// @match        *://*.tumblr.com/post/*
// @match        *://*.tumblr.com/*/*
// @match        *://*.tumblr.com/*/*/*
// @match        *://*.tumblr.com/blog/view/*/*
// @match        *://*.tiktok.com/*
// @match        *://*.vimeo.com/*
// @match        *://*.vk.com/video*
// @match        *://*.vk.com/*?w=wall*
// @match        *://*.vk.com/clip*
// @match        *://*.vine.co/*
// @match        *://*.streamable.com/*
// @match        *://*.pinterest.com/pin/*
// @match        *://*.xiaohongshu.com/explore/*
// @grant        unsafeWindow
// @license      MIT
// ==/UserScript==

(function () {
  "use strict";

  const defaultApiUrl = "cobalt.tools";
  let apiUrl = defaultApiUrl;

  function downloadItem(targetUrl) {
    let au = apiUrl;
    if (!au.startsWith("https://") && !au.startsWith("http://"))
      au = `https://` + au;
    if (!au.endsWith("/")) au = au + "/";
    au = au + `?u=${encodeURIComponent(targetUrl)}`;

    console.log("Opening Cobalt download URL:", au);
    window.open(au, "_blank");
  }

  // Universal download button creator
  function createDownloadButton(containerId = "cobalt-download-btn") {
    const button = document.createElement("button");
    button.id = containerId;
    button.textContent = "Download";
    button.style.cssText = `
            margin-left: 5px;
            padding: 8px 12px;
            background: #333;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        `;

    button.onclick = function (e) {
      e.preventDefault();
      downloadItem(window.location.href);
    };

    return button;
  }

  // Add download buttons for different sites
  function addUniversalDownloadButton() {
    const hostname = window.location.hostname;
    let selectors = [];

    // Site-specific selectors
    if (hostname.includes("soundcloud.com")) {
      selectors = [".soundActions.sc-button-toolbar .sc-button-group"];
    } else if (hostname.includes("twitter.com") || hostname.includes("x.com")) {
      selectors = ['[role="group"]', '[data-testid="tweet"]'];
    } else if (hostname.includes("instagram.com")) {
      selectors = ['[role="button"]', "section"];
    } else if (hostname.includes("tiktok.com")) {
      selectors = [
        '[data-e2e="browse-video-desc"]',
        '[data-e2e="video-detail"]',
      ];
    } else if (hostname.includes("reddit.com")) {
      selectors = ['[data-click-id="comments"]', ".Post"];
    } else {
      // Generic fallback - try to find common button containers
      selectors = ["nav", "header", ".toolbar", ".controls", ".actions"];
    }

    // Try each selector
    for (const selector of selectors) {
      const container = document.querySelector(selector);
      const existingButton = document.getElementById("cobalt-download-btn");

      if (container && !existingButton) {
        const button = createDownloadButton();
        container.appendChild(button);
        console.log(
          `Added Cobalt download button to ${hostname} using selector: ${selector}`,
        );
        return; // Exit after first successful placement
      }
    }
  }

  // Universal initialization
  function initDownloadButton() {
    // Try to add button on page load
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", addUniversalDownloadButton);
    } else {
      addUniversalDownloadButton();
    }

    // Also try periodically in case page content changes (for SPAs)
    const interval = setInterval(() => {
      if (!document.getElementById("cobalt-download-btn")) {
        addUniversalDownloadButton();
      }
    }, 2000);

    // Stop trying after 30 seconds
    setTimeout(() => clearInterval(interval), 30000);
  }

  // Initialize for all supported sites
  initDownloadButton();
})();
