// ==UserScript==
// @name        Wikiwand Redirect
// @namespace   https://github.com/tim-soft
// @version     1.1.0
// @description Redirect Wikipedia to Wikiwand
// @author      Tim
// @match       *://*.wikipedia.org/wiki/*
// @match       *://*.wikipedia.org/w/index.php*
// @run-at      document-start
// @grant       none
// ==/UserScript==

(function () {
  "use strict";

  const url = new URL(location.href);
  const hostnameMatch = url.hostname.match(/^([a-z0-9-]+)\.wikipedia\.org$/i);
  if (!hostnameMatch) return;

  const lang = hostnameMatch[1];

  // Пропускаем служебные страницы (например, редактирование, история),
  // но разрешаем редирект для просмотра.
  const action = url.searchParams.get("action");
  if (action && action !== "view") return;

  let article = null;

  if (url.pathname.startsWith("/wiki/")) {
    // Классический URL: /wiki/Article_Name
    article = url.pathname.substring(6);
  } else if (url.pathname === "/w/index.php" && url.searchParams.has("title")) {
    // Альтернативный URL: /w/index.php?title=Article_Name
    article = url.searchParams.get("title");
  }

  if (article) {
    const newUrl = `https://www.wikiwand.com/${lang}/${article}${url.hash}`;
    location.replace(newUrl);
  }
})();
