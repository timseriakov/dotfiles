// ==UserScript==
// @name         Inline Translate to Russian (Toggle)
// @namespace    https://github.com/timhq/dotfiles
// @version      0.1.0
// @description  Toggle full-page inline translation EN/auto -> RU without proxy, using Google translate endpoint. Press F3 to toggle.
// @author       tim
// @match        *://*/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const TARGET_LANG = 'ru';
  const SOURCE_LANG = 'auto';
  const ENDPOINT = 'https://translate.googleapis.com/translate_a/single';

  const state = {
    translated: false,
    originals: new WeakMap(), // node -> original text
    nodes: [],
    busy: false,
  };

  function isSkippable(node) {
    if (!node || !node.parentElement) return true;
    const pe = node.parentElement;
    // Skip in these tags
    const tag = pe.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'IFRAME') return true;
    if (tag === 'CODE' || tag === 'PRE' || tag === 'KBD' || tag === 'SAMP' || tag === 'VAR') return true;
    // Attributes that commonly disable translation
    if (pe.getAttribute('translate') === 'no') return true;
    if (pe.classList && pe.classList.contains('notranslate')) return true;
    if (pe.closest('[data-no-translate], [data-translate="no"]')) return true;
    // Ignore tiny/whitespace-only nodes
    const t = node.nodeValue;
    if (!t) return true;
    const s = t.trim();
    if (s.length < 2) return true;
    // Mostly punctuation/numbers
    if (/^[\d\s\.,;:!\-—_+*=()\[\]{}<>"'`~|\/\\]+$/.test(s)) return true;
    return false;
  }

  function collectTextNodes(root) {
    state.nodes = [];
    const tw = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT, null);
    let n;
    while ((n = tw.nextNode())) {
      if (!isSkippable(n)) state.nodes.push(n);
    }
    return state.nodes;
  }

  async function translateChunk(texts) {
    const q = texts.join('\n\u200b\n'); // separator unlikely to appear
    const url = `${ENDPOINT}?client=gtx&sl=${SOURCE_LANG}&tl=${TARGET_LANG}&dt=t&q=${encodeURIComponent(q)}`;
    const res = await fetch(url);
    const data = await res.json();
    let acc = '';
    if (Array.isArray(data) && Array.isArray(data[0])) {
      for (const seg of data[0]) if (seg && seg[0]) acc += seg[0];
    }
    return acc.split('\n\u200b\n');
  }

  async function applyTranslation() {
    if (state.busy) return;
    state.busy = true;
    try {
      // Remove blockers that prevent Google/proxy from translating; also helps our inline approach
      document.querySelectorAll('meta[name="google"][content="notranslate"]').forEach(m => m.remove());
      document.querySelectorAll('.notranslate').forEach(el => el.classList.remove('notranslate'));
      document.querySelectorAll('[translate="no"]').forEach(el => el.removeAttribute('translate'));

      const nodes = collectTextNodes(document.body);
      const BATCH = 40; // ~40 nodes per request
      for (let i = 0; i < nodes.length; i += BATCH) {
        const batch = nodes.slice(i, i + BATCH);
        const originals = batch.map(n => n.nodeValue);
        const translated = await translateChunk(originals);
        for (let j = 0; j < batch.length; j++) {
          const node = batch[j];
          if (!state.originals.has(node)) state.originals.set(node, originals[j]);
          node.nodeValue = translated[j] ?? originals[j];
        }
      }
      state.translated = true;
      showBadge('RU');
    } catch (e) {
      console.error('[inline-translate-ru] translate failed', e);
    } finally {
      state.busy = false;
    }
  }

  function restoreOriginal() {
    for (const node of state.nodes) {
      const orig = state.originals.get(node);
      if (orig != null) node.nodeValue = orig;
    }
    state.translated = false;
    showBadge('EN');
  }

  function showBadge(text) {
    try {
      let b = document.getElementById('__inline_ru_badge');
      if (!b) {
        b = document.createElement('div');
        b.id = '__inline_ru_badge';
        b.style.cssText = 'position:fixed;top:6px;right:6px;z-index:2147483647;background:#2c3e50;color:#ecf0f1;padding:2px 6px;border-radius:6px;font:12px/1 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;opacity:.85;';
        document.documentElement.appendChild(b);
      }
      b.textContent = text;
      b.style.display = 'block';
      clearTimeout(b._t);
      b._t = setTimeout(() => (b.style.display = 'none'), 1500);
    } catch {}
  }

  async function toggle() {
    if (state.translated) restoreOriginal();
    else await applyTranslation();
  }

  window.__inline_ru_toggle__ = toggle;

  // Hotkey: F3 to toggle
  function onKey(e) {
    if (e.key === 'F3') {
      e.preventDefault();
      e.stopPropagation();
      toggle();
    }
  }
  document.addEventListener('keydown', onKey, true);

  console.log('[inline-translate-ru] ready: F3 toggles RU translation');
})();
