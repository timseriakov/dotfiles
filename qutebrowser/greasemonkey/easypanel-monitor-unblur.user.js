// ==UserScript==
// @name         Easypanel Hide License Upsells
// @namespace    qutebrowser
// @version      2.0.0
// @description  Скрывает баннер мониторинга и кнопку покупки лицензии Easypanel.
// @author       tim
// @match        https://easypanel.host/*
// @match        https://*.easypanel.host/*
// @run-at       document-start
// @noframes
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  function start() {
    const root = document.documentElement;
    if (!root) return;

    const style = document.createElement("style");
    style.textContent = 'a[href*="/buy-license"] { display: none !important; }';
    root.append(style);

    function hideUpsells() {
      root.querySelectorAll("a, button, [role='button']").forEach((element) => {
        const text = element.textContent.trim().replace(/\s+/g, " ");
        if (text.toLowerCase() === "buy license") {
          element.style.setProperty("display", "none", "important");
        }
      });

      const notices = [
        ...root.querySelectorAll(
          "div, section, [role='alert'], [data-status='warning']",
        ),
      ].filter((element) => {
        const text = element.textContent.trim().replace(/\s+/g, " ");
        return (
          text.length < 300 &&
          /advanced monitoring is available only if you have a license/i.test(
            text,
          ) &&
          /buy license/i.test(text)
        );
      });

      notices
        .filter(
          (element) =>
            !notices.some(
              (other) => element !== other && other.contains(element),
            ),
        )
        .forEach((notice) =>
          notice.style.setProperty("display", "none", "important"),
        );
    }

    let scheduled = false;
    const observer = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      setTimeout(() => {
        scheduled = false;
        hideUpsells();
      }, 50);
    });

    hideUpsells();
    observer.observe(root, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  }

  if (document.documentElement) {
    start();
  } else {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  }
})();
