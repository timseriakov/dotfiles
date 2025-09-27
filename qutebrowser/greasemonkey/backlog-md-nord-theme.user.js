// ==UserScript==
// @name         Backlog.md Nord Theme
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Apply Nord color scheme to Backlog.md application
// @author       You
// @match        http://localhost:6420/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Nord Color Palette
    const nord = {
        // Polar Night
        nord0: '#2e3440',   // darkest
        nord1: '#3b4252',   // dark
        nord2: '#434c5e',   // medium dark
        nord3: '#4c566a',   // medium

        // Snow Storm
        nord4: '#d8dee9',   // medium light
        nord5: '#e5e9f0',   // light
        nord6: '#eceff4',   // lightest

        // Frost
        nord7: '#8fbcbb',   // frost cyan
        nord8: '#88c0d0',   // frost blue
        nord9: '#81a1c1',   // frost darker blue
        nord10: '#5e81ac', // frost darkest blue

        // Aurora
        nord11: '#bf616a', // red
        nord12: '#d08770', // orange
        nord13: '#ebcb8b', // yellow
        nord14: '#a3be8c', // green
        nord15: '#b48ead'  // purple
    };

    // Apply Nord theme styles immediately for localhost:6420
    function applyNordTheme() {
        console.log('Nord theme script loading...', window.location.href);

        const style = document.createElement('style');
        style.id = 'nord-theme-override';
        style.textContent = `
            /* Root variables override */
            :root {
                --nord-bg-primary: ${nord.nord0};
                --nord-bg-secondary: ${nord.nord1};
                --nord-bg-tertiary: ${nord.nord2};
                --nord-border: ${nord.nord3};
                --nord-text-primary: ${nord.nord6};
                --nord-text-secondary: ${nord.nord5};
                --nord-text-muted: ${nord.nord4};
                --nord-accent: ${nord.nord10};
                --nord-accent-hover: ${nord.nord9};
                --nord-success: ${nord.nord14};
                --nord-warning: ${nord.nord13};
                --nord-error: ${nord.nord11};
                --nord-info: ${nord.nord8};
            }

            /* Force Nord theme on body and main containers with maximum specificity */
            html body,
            html #root,
            html [class*="bg-gray-50"],
            html [class*="bg-white"],
            body {
                background-color: var(--nord-bg-primary) !important;
                color: var(--nord-text-primary) !important;
            }

            /* Dark mode backgrounds */
            [class*="bg-gray-900"],
            [class*="bg-gray-800"] {
                background-color: var(--nord-bg-secondary) !important;
            }

            [class*="bg-gray-700"] {
                background-color: var(--nord-bg-tertiary) !important;
            }

            /* Borders */
            [class*="border-gray-200"],
            [class*="border-gray-300"] {
                border-color: var(--nord-border) !important;
            }

            [class*="border-gray-600"],
            [class*="border-gray-700"] {
                border-color: var(--nord-border) !important;
            }

            /* Text colors */
            [class*="text-gray-900"],
            [class*="text-gray-100"] {
                color: var(--nord-text-primary) !important;
            }

            [class*="text-gray-600"],
            [class*="text-gray-400"] {
                color: var(--nord-text-secondary) !important;
            }

            [class*="text-gray-500"] {
                color: var(--nord-text-muted) !important;
            }

            /* Blue accent colors - keep as Nord frost blue */
            [class*="bg-blue-50"],
            [class*="bg-blue-100"] {
                background-color: ${nord.nord10}33 !important; /* 20% opacity */
            }

            [class*="bg-blue-500"],
            [class*="bg-blue-600"] {
                background-color: var(--nord-accent) !important;
            }

            [class*="text-blue-700"],
            [class*="text-blue-400"] {
                color: var(--nord-accent) !important;
            }

            [class*="text-blue-600"],
            [class*="text-blue-800"] {
                color: var(--nord-accent-hover) !important;
            }

            /* Status colors */
            [class*="bg-red-100"] {
                background-color: ${nord.nord11}33 !important;
            }

            [class*="text-red-800"] {
                color: var(--nord-error) !important;
            }

            [class*="bg-green-100"] {
                background-color: ${nord.nord14}33 !important;
            }

            [class*="text-green-800"] {
                color: var(--nord-success) !important;
            }

            [class*="bg-yellow-100"] {
                background-color: ${nord.nord13}33 !important;
            }

            [class*="text-yellow-800"] {
                color: var(--nord-warning) !important;
            }

            /* Hover states */
            [class*="hover\\:bg-gray-100"]:hover,
            [class*="hover\\:bg-gray-50"]:hover {
                background-color: var(--nord-bg-tertiary) !important;
            }

            [class*="hover\\:bg-gray-800"]:hover,
            [class*="hover\\:bg-gray-700"]:hover {
                background-color: var(--nord-border) !important;
            }

            [class*="hover\\:bg-blue-600"]:hover {
                background-color: var(--nord-accent-hover) !important;
            }

            [class*="hover\\:text-gray-900"]:hover,
            [class*="hover\\:text-gray-100"]:hover {
                color: var(--nord-text-primary) !important;
            }

            [class*="hover\\:text-gray-600"]:hover,
            [class*="hover\\:text-gray-300"]:hover {
                color: var(--nord-text-secondary) !important;
            }

            /* Focus states */
            [class*="focus\\:ring-stone-500"]:focus,
            [class*="focus\\:ring-stone-400"]:focus,
            [class*="focus\\:ring-blue-400"]:focus {
                --tw-ring-color: var(--nord-accent) !important;
            }

            /* Input fields */
            input, select, textarea {
                background-color: var(--nord-bg-secondary) !important;
                border-color: var(--nord-border) !important;
                color: var(--nord-text-primary) !important;
            }

            input::placeholder {
                color: var(--nord-text-muted) !important;
            }

            /* Buttons */
            button {
                transition: all 0.2s ease !important;
            }

            /* Sidebar specific */
            nav[class*="bg-gray"] {
                background-color: var(--nord-bg-secondary) !important;
            }

            /* Main content area */
            main {
                background-color: var(--nord-bg-primary) !important;
            }

            /* Cards and containers */
            [class*="bg-white"][class*="border"] {
                background-color: var(--nord-bg-secondary) !important;
                border-color: var(--nord-border) !important;
            }

            /* Task cards hover effect */
            [class*="hover\\:bg-gray-50"]:hover {
                background-color: var(--nord-bg-tertiary) !important;
            }

            /* Stone/neutral colors - map to Nord equivalents */
            [class*="text-stone-600"],
            [class*="text-stone-400"] {
                color: var(--nord-text-muted) !important;
            }

            [class*="hover\\:text-stone-700"]:hover,
            [class*="hover\\:text-stone-300"]:hover {
                color: var(--nord-text-secondary) !important;
            }

            /* SVG icons inherit text color */
            svg {
                color: inherit !important;
            }

            /* Markdown editor theme override */
            .wmde-markdown-var[data-color-mode*="dark"],
            .wmde-markdown[data-color-mode*="dark"] {
                --color-canvas-default: var(--nord-bg-secondary) !important;
                --color-canvas-subtle: var(--nord-bg-tertiary) !important;
                --color-fg-default: var(--nord-text-primary) !important;
                --color-fg-muted: var(--nord-text-muted) !important;
                --color-border-default: var(--nord-border) !important;
                --color-accent-fg: var(--nord-accent) !important;
                --color-prettylights-syntax-comment: var(--nord-text-muted) !important;
                --color-prettylights-syntax-constant: ${nord.nord9} !important;
                --color-prettylights-syntax-string: var(--nord-success) !important;
                --color-prettylights-syntax-keyword: var(--nord-warning) !important;
                --color-prettylights-syntax-entity: var(--nord-error) !important;
                --color-prettylights-syntax-variable: ${nord.nord8} !important;
            }
        `;

        // Remove existing style if present
        const existingStyle = document.getElementById('nord-theme-override');
        if (existingStyle) {
            existingStyle.remove();
        }

        document.head.appendChild(style);
        console.log('Nord theme CSS injected successfully!');

        // Add a visible indicator that the script is working
        setTimeout(() => {
            const indicator = document.createElement('div');
            indicator.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: ${nord.nord8};
                color: ${nord.nord0};
                padding: 5px 10px;
                border-radius: 5px;
                font-family: monospace;
                font-size: 12px;
                z-index: 9999;
                opacity: 0.8;
            `;
            indicator.textContent = 'Nord Theme Active';
            document.body.appendChild(indicator);

            // Remove indicator after 3 seconds
            setTimeout(() => {
                indicator.remove();
            }, 3000);
        }, 1000);
    }

    // Apply theme when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyNordTheme);
    } else {
        applyNordTheme();
    }

    // Also apply theme when new content is loaded (for SPA navigation)
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Check if significant content was added
                const hasSignificantChanges = Array.from(mutation.addedNodes).some(node =>
                    node.nodeType === Node.ELEMENT_NODE &&
                    (node.classList?.length > 0 || node.children?.length > 0)
                );

                if (hasSignificantChanges) {
                    setTimeout(applyNordTheme, 100); // Small delay to ensure content is rendered
                }
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})();
