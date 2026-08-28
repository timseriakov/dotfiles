// ==UserScript==
// @name         Hide Reactor Yandex ad
// @namespace    local
// @version      1.0
// @description  Удаляет рекламный блок после пагинации на joy.reactor.cc
// @match        https://joy.reactor.cc/*
// @grant        none
// @run-at       document-end
// @noframes
// ==/UserScript==

(function () {
  "use strict";

  const AD_ID = "yandex_rtb_R-A-12631514-1";
  const removeAd = () => document.getElementById(AD_ID)?.remove();

  removeAd();
  new MutationObserver(removeAd).observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
