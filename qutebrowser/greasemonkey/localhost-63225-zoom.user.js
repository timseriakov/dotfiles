// ==UserScript==
// @name         localhost-63225 zoom 110
// @namespace    local
// @version      1.0.0
// @description  Apply 110% zoom-like scaling to localhost:63225
// @match        http://localhost:63225/*
// @match        http://127.0.0.1:63225/*
// @run-at       document-start
// ==/UserScript==

(function () {
  "use strict";

  const applyZoom = () => {
    const root = document.documentElement;
    if (!root) return;

    root.style.zoom = "1.1";
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyZoom, { once: true });
  } else {
    applyZoom();
  }

  applyZoom();
})();
