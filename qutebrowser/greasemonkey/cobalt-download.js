// ==UserScript==
// @name         Download Media with Cobalt API
// @namespace    https://github.com/tizee/tempermonkey-download-with-cobalt
// @version      1.1
// @description  Adds a context menu item to download media from supported video sites using a direct URL.
// @author       tizee
// @match        *://*.bilibili.com/video/*
// @match        *://*.instagram.com/p/*
// @match        *://*.instagram.com/reels/*
// @match        *://*.instagram.com/reel/*
// @match        *://*.twitter.com/*/status/*
// @match        *://*.twitter.com/*/status/*/video/*
// @match        *://*.twitter.com/i/spaces/*
// @match        *://*.x.com/*/status/*
// @match        *://*.x.com/*/status/*/video/*
// @match        *://*.x.com/i/spaces/*
// @match        *://*.reddit.com/r/*/comments/*/*
// @match        *://*.soundcloud.com/*
// @match        *://*.soundcloud.app.goo.gl/*
// @match        *://*.tumblr.com/post/*
// @match        *://*.tumblr.com/*/*
// @match        *://*.tumblr.com/*/*/*
// @match        *://*.tumblr.com/blog/view/*/*
// @match        *://*.tiktok.com/*
// @match        *://*.vimeo.com/*
// @match        *://*.youtube.com/watch?*
// @match        *://*.youtu.be/*
// @match        *://*.youtube.com/shorts/*
// @match        *://*.vk.com/video*
// @match        *://*.vk.com/*?w=wall*
// @match        *://*.vk.com/clip*
// @match        *://*.vine.co/*
// @match        *://*.streamable.com/*
// @match        *://*.pinterest.com/pin/*
// @match        *://*.xiaohongshu.com/explore/*
// @grant        unsafeWindow
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    const defaultApiUrl = 'cobalt.tools';
    let apiUrl = defaultApiUrl;

    function downloadItem(targetUrl) {
        let au = apiUrl;
        if (!au.startsWith("https://") && !au.startsWith("http://")) au = `https://` + au;
        if (!au.endsWith("/")) au = au + '/';
        au = au + `?u=${encodeURIComponent(targetUrl)}`;

        console.log('Opening Cobalt download URL:', au);
        window.open(au, '_blank');
    }

    // Add download button for SoundCloud and YouTube
    if (window.location.hostname.includes('soundcloud.com')) {
        const containerSelector = ".soundActions.sc-button-toolbar .sc-button-group";

        function addCobaltButton() {
            const container = document.querySelector(containerSelector);
            const existingButton = document.getElementById('cobalt-download-btn');

            if (container && !existingButton) {
                const button = document.createElement('button');
                button.id = 'cobalt-download-btn';
                button.className = 'sc-button sc-button-medium sc-button-responsive';
                button.textContent = 'Download (Cobalt)';
                button.style.marginLeft = '5px';
                button.style.border = '1px solid #ff5500';
                button.style.color = '#ff5500';
                button.style.backgroundColor = 'transparent';

                button.onclick = function(e) {
                    e.preventDefault();
                    downloadItem(window.location.href);
                };

                container.appendChild(button);
                console.log('Added Cobalt download button');
            }
        }

        // Try to add button on page load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', addCobaltButton);
        } else {
            addCobaltButton();
        }

        // Also try periodically in case page content changes
        const interval = setInterval(() => {
            addCobaltButton();
            if (document.getElementById('cobalt-download-btn')) {
                clearInterval(interval);
            }
        }, 1000);

        // Stop trying after 10 seconds
        setTimeout(() => clearInterval(interval), 10000);
    }

})();
