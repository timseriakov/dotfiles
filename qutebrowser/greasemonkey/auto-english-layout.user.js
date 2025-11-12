// ==UserScript==
// @name         Auto English Layout for qutebrowser
// @namespace    qutebrowser
// @version      1.0
// @description  Switch to English layout when leaving input fields (simulating insert mode leave)
// @author       You
// @match        *://*/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // Function to check if element is an input field
    function isInputElement(element) {
        if (!element) return false;

        const tagName = element.tagName.toLowerCase();
        const inputTypes = ['input', 'textarea', 'select'];
        const editableTypes = ['text', 'password', 'email', 'search', 'url', 'tel', 'number'];

        if (inputTypes.includes(tagName)) {
            if (tagName === 'input') {
                const type = (element.type || 'text').toLowerCase();
                return editableTypes.includes(type);
            }
            return true;
        }

        return element.contentEditable === 'true';
    }

    // Track when we leave input fields to switch to English
    document.addEventListener('focusout', function(event) {
        const target = event.target;

        // If we're leaving an input field, switch to English after a short delay
        if (isInputElement(target)) {
            setTimeout(function() {
                // Double-check we're not immediately focusing another input
                if (!isInputElement(document.activeElement)) {
                    // Trigger layout switch by setting a data attribute that qutebrowser can monitor
                    document.documentElement.setAttribute('data-qute-switch-layout', 'english');

                    // Remove the attribute after a short time
                    setTimeout(function() {
                        document.documentElement.removeAttribute('data-qute-switch-layout');
                    }, 100);
                }
            }, 50);
        }
    });

})();
