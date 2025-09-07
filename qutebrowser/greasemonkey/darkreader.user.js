// ==UserScript==
// @name         Dark Reader (Unofficial)
// @icon         https://darkreader.org/images/darkreader-icon-256x256.png
// @namespace    DarkReader
// @description  Inverts the brightness of pages to reduce eye strain
// @version      4.7.15
// @author       https://github.com/darkreader/darkreader#contributors
// @homepageURL  https://darkreader.org/ | https://github.com/darkreader/darkreader
// @run-at       document-start
// @grant        none
// @include      http*
// NOTE: Local @require was removed because qutebrowser started downloading
// the file instead of injecting it. We now toggle a robust engine-level
// user stylesheet via userscript (Space u m).
// @noframes
// ==/UserScript==

// This script loads the Dark Reader API (@require) and applies the theme
// only when explicitly enabled via the toggle command (localStorage flag).
// It also reacts to runtime storage changes and ensures fetch method is set.

(function () {
    var FALLBACK_STYLE_ID = 'dr-fallback-style';

    function applyFallback(flag) {
        try {
            var el = document.getElementById(FALLBACK_STYLE_ID);
            if (flag) {
                if (!el) {
                    el = document.createElement('style');
                    el.id = FALLBACK_STYLE_ID;
                    el.type = 'text/css';
                    el.textContent = [
                        'html { background: #111 !important; }',
                        'html, body, iframe, img, video, canvas, svg, picture, object, embed {',
                        '  background-color: transparent !important;',
                        '}',
                        'html { filter: invert(0.9) hue-rotate(180deg) contrast(0.95) !important; }',
                        'img, video, picture, canvas, svg, object, embed { filter: invert(1) hue-rotate(180deg) contrast(1.05) !important; }',
                    ].join('\n');
                    (document.head || document.documentElement).appendChild(el);
                }
            } else if (el) {
                el.parentNode && el.parentNode.removeChild(el);
            }
        } catch (e) {
            console.error('[DarkReader userscript] fallback failed', e);
        }
    }

    function apply(flag) {
        try {
            if (typeof DarkReader === 'undefined') return;
            if (typeof DarkReader.setFetchMethod === 'function') {
                // Required on some sites so DR can fetch stylesheets
                DarkReader.setFetchMethod(window.fetch.bind(window));
            }
            if (flag) {
                DarkReader.enable({ brightness: 100, contrast: 100, sepia: 0 });
            } else {
                DarkReader.disable();
            }
        } catch (e) {
            console.error('[DarkReader userscript] apply failed', e);
        }
    }

    function init() {
        var enabled = localStorage.getItem('darkreader-enabled') === 'true';
        if (typeof DarkReader !== 'undefined') {
            apply(enabled);
        } else {
            applyFallback(enabled);
        }
    }

    // Initial run
    init();

    // React to changes made by the qutebrowser userscript without reload
    window.addEventListener('storage', function (e) {
        if (e && e.key === 'darkreader-enabled') {
            init();
        }
    });
})();
