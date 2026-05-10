// ==UserScript==
// @name         Hide localhost update banner
// @namespace    local
// @version      1.0
// @description  Скрывает баннер обновления на localhost
// @match        http://localhost/*
// @match        http://localhost:*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  function hideBanner() {
    const headers = [...document.querySelectorAll("h4")];
    const target = headers.find(
      (h) => h.textContent.trim() === "Update available",
    );
    if (!target) return;

    const banner = target.closest(
      ".bg-card.border.border-border.rounded-lg.shadow-xl.p-4",
    );
    if (banner) {
      banner.style.display = "none";
    }
  }

  hideBanner();

  const observer = new MutationObserver(hideBanner);
  observer.observe(document.body, { childList: true, subtree: true });
})();
