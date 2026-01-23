// ==UserScript==
// @name         GoCat Sidebar Remover
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Удаляет боковую панель на сайте gocat.dev
// @author       You
// @match        https://www.gocat.dev/*
// @match        https://gocat.dev/*
// @include      https://www.gocat.dev/*
// @include      https://gocat.dev/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
  "use strict";

  function addStyles() {
    const css = `
            aside.sidebar { display: none !important; }
            .content { 
                width: 100% !important; 
                max-width: 100% !important; 
                flex: 1 !important; 
                margin: 0 !important; 
            }
        `;

    const style = document.createElement("style");
    style.type = "text/css";

    if (style.styleSheet) {
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }

    const target = document.head || document.documentElement;
    if (target) {
      target.appendChild(style);
      console.log("[GoCat Remover] CSS Injected");
    } else {
      setTimeout(addStyles, 0);
    }
  }

  function removeSidebar() {
    const sidebar = document.querySelector("aside.sidebar");
    if (sidebar) {
      sidebar.remove();
      console.log("[GoCat Remover] Sidebar removed");
    }
  }

  addStyles();
  removeSidebar();

  const observer = new MutationObserver((mutations) => {
    if (document.querySelector("aside.sidebar")) {
      removeSidebar();
    }
  });

  if (document.documentElement) {
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  } else {
    window.addEventListener("DOMContentLoaded", () => {
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    });
  }

  window.addEventListener("DOMContentLoaded", removeSidebar);
  window.addEventListener("load", removeSidebar);
})();
