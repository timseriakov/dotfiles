// ==UserScript==
// @name         Hide Reactor Yandex ad
// @namespace    local
// @version      1.0
// @description  Удаляет рекламные блоки на joy.reactor.cc
// @match        https://joy.reactor.cc/*
// @grant        none
// @run-at       document-end
// @noframes
// ==/UserScript==

(function () {
  "use strict";

  const AD_IDS = ["yandex_rtb_R-A-12631514-1", "yandex_rtb_R-A-12631514-3"];
  const removeAds = () =>
    AD_IDS.forEach((id) => document.getElementById(id)?.remove());

  removeAds();
  new MutationObserver(removeAds).observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
