// ==UserScript==
// @name         Translate Selection Tooltip
// @namespace    https://github.com/timhq/dotfiles
// @version      1.0.0
// @description  Translate selected text and show in tooltip with Google Translate API
// @author       tim
// @match        *://*/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // Configuration
  const TRANSLATE_URL = "https://translate.googleapis.com/translate_a/single";
  const TARGET_LANG = "ru"; // Default target language
  const SOURCE_LANG = "auto"; // Auto-detect source language

  // Styles
  const styles = `
        .translate-tooltip {
            position: absolute;
            background: #2c3e50;
            color: #ecf0f1;
            padding: 12px;
            border-radius: 8px;
            font-size: 14px;
            line-height: 1.4;
            max-width: 600px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            border: 1px solid #34495e;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            word-wrap: break-word;
            opacity: 0;
            transform: translateY(-10px);
            transition: opacity 0.3s ease, transform 0.3s ease;
        }

        .translate-tooltip.show {
            opacity: 1;
            transform: translateY(0);
        }

        .translate-tooltip .source-text {
            color: #bdc3c7;
            font-size: 12px;
            margin-bottom: 8px;
            font-style: italic;
        }

        .translate-tooltip .translation {
            color: #fff;
            font-weight: 500;
        }


        .translate-sidebar {
            position: fixed;
            top: 0;
            right: -320px;
            width: 300px;
            height: 100vh;
            background: #34495e;
            z-index: 9999;
            transition: right 0.3s ease;
            overflow-y: auto;
            border-left: 1px solid #2c3e50;
        }

        .translate-sidebar.open {
            right: 0;
        }

        .translate-sidebar-header {
            padding: 15px;
            background: #2c3e50;
            color: #ecf0f1;
            font-weight: bold;
            border-bottom: 1px solid #34495e;
        }

        .translate-sidebar-item {
            padding: 12px 15px;
            border-bottom: 1px solid #3a4f63;
            cursor: pointer;
        }

        .translate-sidebar-item .original {
            font-size: 12px;
            color: #bdc3c7;
            margin-bottom: 5px;
        }

        .translate-sidebar-item .translation {
            color: #ecf0f1;
            font-size: 13px;
        }

        .translate-sidebar-item:hover {
            background: #3a4f63;
        }

    `;

  // Add styles to page
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);

  // State
  let currentTooltip = null;
  let translationHistory = JSON.parse(
    localStorage.getItem("translationHistory") || "[]",
  );
  let sidebarOpen = false;

  // Create sidebar
  const sidebar = document.createElement("div");
  sidebar.className = "translate-sidebar";
  sidebar.innerHTML = `
        <div class="translate-sidebar-header">
            Translation History
            <button id="clear-history-btn" style="float: right; background: none; border: none; color: #ecf0f1; cursor: pointer;">Clear</button>
        </div>
        <div class="translate-sidebar-content"></div>
    `;
  document.body.appendChild(sidebar);

  // Add event listener for clear button
  document
    .getElementById("clear-history-btn")
    .addEventListener("click", clearHistory);

  // Functions
  function toggleSidebar() {
    sidebarOpen = !sidebarOpen;
    sidebar.classList.toggle("open", sidebarOpen);
    if (sidebarOpen) {
      updateSidebar();
    }
  }

  function closeSidebar() {
    sidebarOpen = false;
    sidebar.classList.remove("open");
  }

  function updateSidebar() {
    const content = sidebar.querySelector(".translate-sidebar-content");
    content.innerHTML = "";

    translationHistory
      .slice(-20)
      .reverse()
      .forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "translate-sidebar-item";
        div.innerHTML = `
                <div class="original">${item.source}</div>
                <div class="translation">${item.translation}</div>
            `;
        content.appendChild(div);
      });
  }

  function clearHistory() {
    translationHistory = [];
    localStorage.setItem("translationHistory", "[]");
    updateSidebar();
  }

  function removeTooltip() {
    if (currentTooltip) {
      currentTooltip.remove();
      currentTooltip = null;
    }
  }

  async function translateText(
    text,
    sourceLang = SOURCE_LANG,
    targetLang = TARGET_LANG,
  ) {
    try {
      const url = `${TRANSLATE_URL}?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data && data[0]) {
        // Combine all translation segments
        let fullTranslation = "";
        for (let i = 0; i < data[0].length; i++) {
          if (data[0][i] && data[0][i][0]) {
            fullTranslation += data[0][i][0];
          }
        }
        return fullTranslation || "Translation failed";
      }

      throw new Error("Translation failed");
    } catch (error) {
      console.error("Translation error:", error);
      return "Translation error";
    }
  }

  function showTooltip(text, translation, x, y) {
    removeTooltip();

    const tooltip = document.createElement("div");
    tooltip.className = "translate-tooltip";
    tooltip.innerHTML = `
            <div class="translation">${translation}</div>
        `;

    // Position tooltip
    tooltip.style.left = x + "px";
    tooltip.style.top = y - 80 + "px";

    document.body.appendChild(tooltip);
    currentTooltip = tooltip;

    // Show with animation
    setTimeout(() => tooltip.classList.add("show"), 10);

    // Adjust position if tooltip goes off screen
    const rect = tooltip.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      tooltip.style.left = window.innerWidth - rect.width - 10 + "px";
    }
    if (rect.top < 0) {
      tooltip.style.top = y + 20 + "px";
    }

    // Tooltip stays open until manually closed

    // Save to history
    const historyItem = {
      source: text,
      translation: translation,
      timestamp: new Date().toISOString(),
    };
    translationHistory.push(historyItem);

    // Keep only last 100 items
    if (translationHistory.length > 100) {
      translationHistory = translationHistory.slice(-100);
    }

    localStorage.setItem(
      "translationHistory",
      JSON.stringify(translationHistory),
    );
  }

  // Event listeners
  document.addEventListener("mouseup", async (e) => {
    // Don't translate if clicking on sidebar
    if (sidebar.contains(e.target)) {
      return;
    }

    // Small delay to ensure selection is finalized
    setTimeout(async () => {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();

      if (
        selectedText &&
        selectedText.length > 1 &&
        selectedText.length < 1000
      ) {
        // Check if it's not all numbers or single characters
        if (
          !/^[\d\s\.\,\-\+\=]+$/.test(selectedText) &&
          selectedText.length > 2
        ) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();

          const translation = await translateText(selectedText);

          if (translation && translation !== selectedText) {
            showTooltip(
              selectedText,
              translation,
              rect.left + rect.width / 2,
              rect.top + window.scrollY,
            );
          }
        }
      }
    }, 100);
  });

  // Close sidebar on click outside
  document.addEventListener("mousedown", (e) => {
    // Close tooltip if clicking elsewhere
    if (currentTooltip && !currentTooltip.contains(e.target)) {
      removeTooltip();
    }

    // Close sidebar if clicking outside
    if (sidebarOpen && !sidebar.contains(e.target)) {
      closeSidebar();
    }
  });

  // Keyboard shortcuts handler
  function handleKeyPress(e) {
    // ESC - close sidebar and tooltip
    if (
      e.key === "Escape" ||
      e.keyCode === 27 ||
      e.which === 27 ||
      e.code === "Escape"
    ) {
      let actionTaken = false;

      if (sidebarOpen) {
        closeSidebar();
        actionTaken = true;
      }
      if (currentTooltip) {
        removeTooltip();
        actionTaken = true;
      }

      if (actionTaken) {
        e.preventDefault();
        e.stopPropagation();
      }
    }

    // F2 - toggle translation sidebar (simple key)
    if (e.key === "F2" || e.keyCode === 113) {
      e.preventDefault();
      e.stopPropagation();
      toggleSidebar();
    }

    // Ctrl+T - toggle translation sidebar (alternative)
    if (e.ctrlKey && (e.key === "t" || e.key === "T" || e.keyCode === 84)) {
      e.preventDefault();
      e.stopPropagation();
      toggleSidebar();
    }
  }

  // Try multiple event listeners for qutebrowser compatibility
  document.addEventListener("keydown", handleKeyPress, true);
  document.addEventListener("keyup", handleKeyPress, false);
  window.addEventListener("keydown", handleKeyPress, true);

  // Remove tooltip on scroll
  document.addEventListener("scroll", () => {
    if (currentTooltip) {
      removeTooltip();
    }
  });
})();
