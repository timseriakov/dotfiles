// ==UserScript==
// @name         Qute Smart Dark (per-site)
// @namespace    qutebrowser
// @description  Per-site dark filter with light-page detection and live toggle via localStorage
// @version      0.1.0
// @author       tim
// @run-at       document-start
// @grant        none
// @include      http*
// @noframes
// ==/UserScript==

(function () {
  const STYLE_ID = 'qute-smart-dark-style';

  function lin(x) {
    x = Math.max(0, Math.min(1, x));
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  }

  function luminanceFromCSSColor(css) {
    if (!css) return 1;
    const m = css.match(/rgba?\(([^)]+)\)/);
    if (!m) return 1;
    const p = m[1].split(/\s*,\s*/).map(Number);
    const r = (p[0] || 255) / 255,
      g = (p[1] || 255) / 255,
      b = (p[2] || 255) / 255,
      a = p[3] == null ? 1 : +p[3];
    // If fully transparent, assume light background behind
    if (a === 0) return 1;
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  }

  function pageIsDark() {
    try {
      const doc = document;
      const body = doc.body || doc.documentElement;
      const stBody = body ? getComputedStyle(body) : null;
      const stHtml = getComputedStyle(doc.documentElement);
      const bg = (stBody && stBody.backgroundColor) || stHtml.backgroundColor || 'rgb(255,255,255)';
      const fg = (stBody && stBody.color) || stHtml.color || 'rgb(0,0,0)';
      const bgL = luminanceFromCSSColor(bg);
      const fgL = luminanceFromCSSColor(fg);
      // Dark page: dark background and relatively lighter text
      return bgL < 0.25 && fgL > 0.6;
    } catch (e) {
      return false;
    }
  }

  function addStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.type = 'text/css';
    el.textContent = [
      'html { background:#111 !important; ',
      ' filter: invert(0.90) hue-rotate(180deg) contrast(0.95) !important; }',
      'img,video,picture,canvas,svg,object,embed {',
      ' filter: invert(1) hue-rotate(180deg) contrast(1.05) !important;',
      ' background: transparent !important; }',
    ].join('\n');
    (document.head || document.documentElement).appendChild(el);
  }

  function removeStyle() {
    const el = document.getElementById(STYLE_ID);
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function apply() {
    const enabled = localStorage.getItem('qute-smart-dark') === 'on';
    if (enabled && !pageIsDark()) addStyle();
    else removeStyle();
  }

  // Initial apply as early as possible
  apply();
  // Re-evaluate after DOM is ready to catch styles applied later
  document.addEventListener('DOMContentLoaded', apply, { once: true });
  setTimeout(apply, 500);
  setTimeout(apply, 2000);

  // Live toggle via localStorage updates
  window.addEventListener('storage', function (e) {
    if (e && e.key === 'qute-smart-dark') apply();
  });
})();
