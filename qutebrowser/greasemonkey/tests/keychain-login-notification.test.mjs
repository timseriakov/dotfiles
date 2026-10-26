import assert from "node:assert/strict";
import fsSync from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { execFileSync, spawn } from "node:child_process";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "userscripts",
  "keychain-login",
);
const SCRIPT_SOURCE = await fs.readFile(SCRIPT_PATH, "utf8");
const start = SCRIPT_SOURCE.indexOf("    // Page notification\n");
const end = SCRIPT_SOURCE.indexOf("    return filled;", start);
assert.notEqual(start, -1, "notification code is present in keychain-login");
assert.notEqual(end, -1, "notification block has its expected end marker");
const notificationCode = SCRIPT_SOURCE.slice(start, end);

function renderNotification(
  dom,
  { hasUsername, password, hasOtp, filled, username, errorMessage = "" },
) {
  const { window } = dom;
  const timers = [];
  const render = new Function(
    "window",
    "document",
    "setTimeout",
    "service",
    "label",
    "hasUsername",
    "password",
    "hasOtp",
    "filled",
    "username",
    "errorMessage",
    `${notificationCode}\nreturn { notificationHost, notification, notificationStyle };`,
  );
  const ui = render(
    window,
    window.document,
    (callback, delay) => {
      timers.push({ callback, delay });
    },
    "Example Service",
    "Example Label",
    hasUsername,
    password,
    hasOtp,
    filled,
    username,
    errorMessage,
  );
  return { ...ui, timers };
}

test("keychain notifications render in themed shadow bubbles and clean up after six seconds", () => {
  const cases = [
    {
      name: "success",
      background: "rgb(255, 255, 255)",
      inputs: {
        hasUsername: true,
        password: "secret",
        hasOtp: false,
        filled: 2,
        username: "alice",
      },
      text: "🔐 Apple Passwords: aliceExample Service • Example Label",
      theme: "light",
    },
    {
      name: "partial",
      background: "rgb(20, 20, 20)",
      inputs: {
        hasUsername: true,
        password: "secret",
        hasOtp: false,
        filled: 1,
        username: "alice",
      },
      text: "⚠️ Filled fields: 1 of 2",
      theme: "dark",
    },
    {
      name: "error",
      background: "rgb(20, 20, 20)",
      inputs: {
        hasUsername: true,
        password: "secret",
        hasOtp: false,
        filled: 0,
        username: "alice",
      },
      text: "❌ Input fields not found on page",
      theme: "dark",
    },
  ];

  for (const { name, background, inputs, text, theme } of cases) {
    const dom = new JSDOM("<!doctype html><html><body></body></html>", {
      pretendToBeVisual: true,
      runScripts: "dangerously",
    });
    const { document } = dom.window;
    document.documentElement.style.backgroundColor = background;

    const legacy = document.createElement("div");
    legacy.setAttribute("data-qute-keychain-login-notification", "1");
    legacy.textContent = "🔐 Apple Passwords: previous";
    document.body.appendChild(legacy);

    const { notificationHost, notification, notificationStyle, timers } =
      renderNotification(dom, inputs);
    assert.equal(
      legacy.isConnected,
      false,
      `${name}: removes an older password toast`,
    );
    assert.equal(
      notification.textContent,
      text,
      `${name}: keeps its existing message`,
    );
    assert.equal(
      notification.dataset.theme,
      theme,
      `${name}: detects the page theme`,
    );
    assert.equal(
      notification.style.background,
      "",
      `${name}: has no outcome-color background`,
    );
    assert.equal(
      notification.style.color,
      "",
      `${name}: uses theme text color`,
    );
    assert.equal(
      notificationHost.shadowRoot.querySelector(".Bubble"),
      notification,
    );
    assert.match(notificationStyle.textContent, /bottom:\s*8px/);
    assert.match(notificationStyle.textContent, /right:\s*8px/);
    assert.match(notificationStyle.textContent, /padding:\s*4px 8px/);
    assert.match(notificationStyle.textContent, /border-radius:\s*6px/);
    assert.match(notificationStyle.textContent, /font-size:\s*12px/);
    assert.match(notificationStyle.textContent, /font-weight:\s*450/);
    assert.match(notificationStyle.textContent, /line-height:\s*1\.2/);
    assert.match(
      notificationStyle.textContent,
      /transition: opacity 120ms ease, transform 120ms ease/,
    );
    assert.match(notificationStyle.textContent, /--qute-hb-bg: #ffffff/);
    assert.match(notificationStyle.textContent, /--qute-hb-bg: #1c1c1c/);
    assert.equal(timers.length, 1, `${name}: schedules one cleanup`);
    assert.equal(
      timers[0].delay,
      6000,
      `${name}: retains the six-second timeout`,
    );

    const replacement = renderNotification(dom, inputs);
    assert.equal(
      document.querySelectorAll('[data-qute-keychain-login-notification="1"]')
        .length,
      1,
    );
    assert.equal(
      notificationHost.isConnected,
      false,
      `${name}: deduplicates the previous toast`,
    );
    replacement.timers[0].callback();
    assert.equal(
      replacement.notificationHost.isConnected,
      false,
      `${name}: removes the toast on timeout`,
    );
    dom.window.close();
  }
});

test("apw no-record status exits successfully and injects the themed toast", async (t) => {
  const tempDir = fsSync.mkdtempSync(
    path.join(os.tmpdir(), "keychain-login-test-"),
  );
  t.after(() => fsSync.rmSync(tempDir, { recursive: true, force: true }));

  const fifo = path.join(tempDir, "qute-fifo");
  const generatedJs = path.join(tempDir, "generated.js");
  const apw = path.join(tempDir, "apw");
  const bashEnv = path.join(tempDir, "bash-env");
  fsSync.writeFileSync(
    apw,
    '#!/bin/sh\nprintf \'%s\\n\' \'{"status":3,"error":"No results found"}\'\n',
  );
  fsSync.chmodSync(apw, 0o755);
  fsSync.writeFileSync(
    bashEnv,
    "mktemp() { printf '%s\\n' \"$KEYCHAIN_TEST_JS_PATH\"; }\nrm() { :; }\n",
  );

  execFileSync("mkfifo", [fifo]);

  const fifoKeeper = fsSync.openSync(fifo, "r+");
  const fifoOutputPromise = new Promise((resolve, reject) => {
    let output = "";
    const stream = fsSync.createReadStream(fifo, { encoding: "utf8" });
    stream.on("data", (chunk) => (output += chunk));
    stream.once("error", reject);
    stream.once("end", () => resolve(output));
  });
  const result = await new Promise((resolve, reject) => {
    const child = spawn(SCRIPT_PATH, [], {
      env: {
        ...process.env,
        APW_BIN: apw,
        BASH_ENV: bashEnv,
        KEYCHAIN_TEST_JS_PATH: generatedJs,
        QUTE_FIFO: fifo,
        QUTE_URL: "https://example.com/login",
      },
    });
    let stderr = "";
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.once("error", reject);
    child.once("close", (status) => resolve({ status, stderr }));
  });
  assert.equal(result.status, 0, result.stderr);
  fsSync.closeSync(fifoKeeper);
  const fifoOutput = await fifoOutputPromise;

  assert.match(fifoOutput, /^jseval --quiet --file /m);
  assert.doesNotMatch(fifoOutput, /message-error/);
  const generated = fsSync.readFileSync(generatedJs, "utf8");
  assert.match(
    generated,
    /const errorMessage = "\\u274c No Apple Passwords records for example\.com";/,
  );

  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    pretendToBeVisual: true,
    runScripts: "dangerously",
    url: "https://example.com/login",
  });
  await new Promise((resolve) => {
    if (dom.window.document.readyState !== "loading") resolve();
    else
      dom.window.document.addEventListener("DOMContentLoaded", resolve, {
        once: true,
      });
  });
  dom.window.eval(generated);
  const toast = dom.window.document.querySelector(
    '[data-qute-keychain-login-notification="1"]',
  );
  assert.equal(
    toast.shadowRoot.querySelector(".Bubble").textContent,
    "❌ No Apple Passwords records for example.com",
  );
});
