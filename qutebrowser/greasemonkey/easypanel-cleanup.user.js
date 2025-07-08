// ==UserScript==
// @name         EasyPanel Cleanup v1.8
// @namespace    https://yyhtbv.easypanel.host
// @version      1.8
// @description  Hide license alerts and buttons in EasyPanel UI
// @author       You
// @match        *://*.easypanel.host/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  function hideLicenseButton() {
    document.querySelectorAll('a[href="/buy-license"]').forEach((el) => {
      el.style.display = "none";
    });
  }

  function hideLicenseAlert() {
    document.querySelectorAll(".chakra-alert.css-ercdzk").forEach((el) => {
      if (
        el.textContent.includes(
          "Advanced monitoring is available only if you have a license",
        )
      ) {
        el.style.display = "none";
      }
    });
  }

  function patch() {
    hideLicenseButton();
    hideLicenseAlert();
  }

  const interval = setInterval(() => {
    if (document.querySelector("#root")) {
      patch();
      clearInterval(interval);
    }
  }, 300);

  const observer = new MutationObserver(patch);
  observer.observe(document.body, { childList: true, subtree: true });
})();
