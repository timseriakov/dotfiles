// ==UserScript==
// @name        Wikiwand Redirect
// @namespace   https://github.com/tim-soft
// @version     1.0.0
// @description Redirect Wikipedia to Wikiwand
// @author      Tim
// @match       *://*.wikipedia.org/wiki/*
// @run-at      document-start
// @grant       none
// ==/UserScript==

(function () {
  "use strict";

  const regex = /^https?:\/\/([a-z0-9-]+)\.wikipedia\.org\/wiki\/(.*)$/i;
  const match = location.href.match(regex);

  if (match) {
    const lang = match[1];
    const article = match[2];
    const newUrl = `https://www.wikiwand.com/${lang}/${article}`;

    location.replace(newUrl);
  }
})();
