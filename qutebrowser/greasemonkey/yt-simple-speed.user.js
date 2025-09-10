// ==UserScript==
// @name         YouTube Simple Speed Control
// @namespace    qutebrowser
// @version      1.0
// @description  Simple [-] 1.25x [+] buttons for YouTube
// @match        https://www.youtube.com/watch*
// @match        https://youtube.com/watch*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    function waitForVideo() {
        const video = document.querySelector('video');
        if (video && !document.getElementById('speed-control-simple')) {
            addSpeedControl(video);
        } else {
            setTimeout(waitForVideo, 1000);
        }
    }

    function addSpeedControl(video) {
        // Find like button container
        const likeButton = document.querySelector('#top-level-buttons-computed') ||
                          document.querySelector('.ytd-menu-renderer') ||
                          document.querySelector('#actions');

        if (!likeButton) {
            setTimeout(() => addSpeedControl(video), 1000);
            return;
        }

        // Create control div
        const control = document.createElement('div');
        control.id = 'speed-control-simple';
        control.style.cssText = `
            display: flex;
            align-items: center;
            gap: 6px;
            margin-right: 12px;
            background: rgba(0,0,0,0.1);
            padding: 4px 8px;
            border-radius: 18px;
            font-family: Roboto, Arial, sans-serif;
            font-size: 14px;
            color: var(--yt-spec-text-primary);
        `;

        // Minus button
        const minusBtn = document.createElement('button');
        minusBtn.textContent = '−';
        minusBtn.style.cssText = `
            background: none;
            border: 1px solid var(--yt-spec-outline);
            color: var(--yt-spec-text-primary);
            width: 40px;
            height: 40px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 22px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 8px;
        `;

        // Speed display
        const speedDisplay = document.createElement('span');
        speedDisplay.style.cssText = `
            min-width: 40px;
            text-align: center;
            font-weight: 500;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 4px;
        `;

        speedDisplay.onclick = () => {
            video.playbackRate = 1.0;
            updateDisplay();
        };

        // Plus button
        const plusBtn = document.createElement('button');
        plusBtn.textContent = '+';
        plusBtn.style.cssText = `
            background: none;
            border: 1px solid var(--yt-spec-outline);
            color: var(--yt-spec-text-primary);
            width: 40px;
            height: 40px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 22px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 8px;
        `;

        function updateDisplay() {
            speedDisplay.textContent = video.playbackRate.toFixed(2) + 'x';
        }

        minusBtn.onclick = () => {
            video.playbackRate = Math.max(0.25, video.playbackRate - 0.25);
            updateDisplay();
        };

        plusBtn.onclick = () => {
            video.playbackRate = Math.min(4.0, video.playbackRate + 0.25);
            updateDisplay();
        };

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.key === '-') {
                e.preventDefault();
                video.playbackRate = Math.max(0.25, video.playbackRate - 0.25);
                updateDisplay();
            } else if (e.key === '+' || e.key === '=') {
                e.preventDefault();
                video.playbackRate = Math.min(4.0, video.playbackRate + 0.25);
                updateDisplay();
            }
        });

        control.appendChild(minusBtn);
        control.appendChild(speedDisplay);
        control.appendChild(plusBtn);

        // Insert before like button
        likeButton.parentNode.insertBefore(control, likeButton);

        updateDisplay();
        video.addEventListener('ratechange', updateDisplay);
    }

    // Start when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForVideo);
    } else {
        waitForVideo();
    }

    // Handle YouTube navigation
    let currentUrl = location.href;
    new MutationObserver(() => {
        if (location.href !== currentUrl) {
            currentUrl = location.href;
            const existing = document.getElementById('speed-control-simple');
            if (existing) existing.remove();
            setTimeout(waitForVideo, 1000);
        }
    }).observe(document, { subtree: true, childList: true });
})();
