import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = path.resolve(
  __dirname,
  "..",
  "translate-selection-tooltip.user.js",
);

const SCRIPT_SOURCE = await fs.readFile(SCRIPT_PATH, "utf8");

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function wait(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function rect(left = 20, top = 20, width = 40, height = 12) {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
  };
}

function setupWindow(window) {
  window.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
  window.cancelAnimationFrame = (id) => clearTimeout(id);
  window.btoa = (value) => Buffer.from(value, "binary").toString("base64");
  window.crypto = {
    subtle: {
      digest: async (_algorithm, data) => {
        const view = data instanceof Uint8Array ? data : new Uint8Array(data);
        const out = new Uint8Array(32);
        for (let i = 0; i < view.length; i += 1) {
          out[i % out.length] = (out[i % out.length] + view[i] + i) % 256;
        }
        return out.buffer;
      },
    },
  };
}

function createDom({ url = "https://example.com/", testMode = true } = {}) {
  const dom = new JSDOM(
    "<!doctype html><html><body><div id='root'>Hello</div></body></html>",
    {
      url,
      pretendToBeVisual: true,
      runScripts: "dangerously",
    },
  );
  const { window } = dom;
  setupWindow(window);
  if (testMode) {
    window.__QUTE_TRANSLATE_TEST__ = true;
  }
  return dom;
}

function loadScript(dom, globals = {}) {
  const { window } = dom;
  Object.assign(window, globals);
  window.eval(SCRIPT_SOURCE);
  return window;
}

function stubSelection(
  window,
  { text, target = window.document.body, anchorRect = rect() },
) {
  const textNode =
    target.firstChild ||
    target.appendChild(window.document.createTextNode(text));
  window.getSelection = () => ({
    rangeCount: 1,
    toString: () => text,
    getRangeAt: () => ({
      commonAncestorContainer: textNode,
      getBoundingClientRect: () => anchorRect,
    }),
    anchorNode: textNode,
    focusNode: textNode,
  });
}

test("normalizes whitespace, NBSP, and zero-width chars", async () => {
  const dom = createDom();
  const window = loadScript(dom);
  const api = window.__quteTranslateSelectionTooltipTest;

  const normalized = api.normalize("\u00A0 Hello\u200B   world\r\n");
  assert.equal(normalized, "Hello world");

  dom.window.close();
});

test("renders daemon output as plain text only", async () => {
  const dom = createDom();
  const window = loadScript(dom);
  const api = window.__quteTranslateSelectionTooltipTest;

  api.setTransport(({ json }) => ({
    requestId: json.requestId,
    translation: "<img src=x onerror=alert(1)>translated",
  }));

  await api.show({ text: "Hello world", rect: rect() });
  await wait(5);

  const state = api.getState();
  const ui = api.getUi();
  assert.equal(state.mode, "success");
  assert.equal(state.text, "<img src=x onerror=alert(1)>translated");
  assert.equal(ui.content.querySelector("img"), null);

  dom.window.close();
});

test("dedupes repeated normalized selections", async () => {
  const dom = createDom();
  const window = loadScript(dom);
  const api = window.__quteTranslateSelectionTooltipTest;
  let calls = 0;

  api.setTransport(({ json }) => {
    calls += 1;
    return { requestId: json.requestId, translation: "Привет мир" };
  });

  await api.show({ text: "Hello   world", rect: rect() });
  await wait(5);
  await api.show({ text: "  Hello world\n", rect: rect() });
  await wait(5);

  assert.equal(calls, 1);
  assert.equal(api.getState().text, "Привет мир");

  dom.window.close();
});

test("aborted in-flight requests are evicted and can be retried", async () => {
  const dom = createDom();
  const window = loadScript(dom);
  const api = window.__quteTranslateSelectionTooltipTest;
  let calls = 0;
  const pending = [];

  api.setTransport(({ json }) => {
    calls += 1;
    const job = deferred();
    pending.push({ job, requestId: json.requestId });
    return {
      promise: job.promise,
      abort: () => {},
    };
  });

  void api.show({ text: "Hello world", rect: rect() });
  await wait(5);
  api.reset();
  void api.show({ text: "Hello world", rect: rect() });
  await wait(5);

  assert.equal(calls, 2);
  pending[1].job.resolve({
    requestId: pending[1].requestId,
    translation: "Привет",
  });
  await wait(5);
  assert.equal(api.getState().text, "Привет");

  dom.window.close();
});

test("ignores stale responses and keeps latest translation", async () => {
  const dom = createDom();
  const window = loadScript(dom);
  const api = window.__quteTranslateSelectionTooltipTest;
  const pending = new Map();

  api.setTransport(({ json }) => {
    const job = deferred();
    pending.set(json.text, { job, requestId: json.requestId });
    return job.promise;
  });

  const first = api.show({ text: "Hello world", rect: rect(20, 20) });
  await wait(5);
  const second = api.show({ text: "Good night", rect: rect(20, 60) });
  await wait(5);

  pending.get("Good night").job.resolve({
    requestId: pending.get("Good night").requestId,
    translation: "Спокойной ночи",
  });
  await second;

  pending.get("Hello world").job.resolve({
    requestId: pending.get("Hello world").requestId,
    translation: "Привет мир",
  });
  await first;
  await wait(5);

  assert.equal(api.getState().mode, "success");
  assert.equal(api.getState().text, "Спокойной ночи");

  dom.window.close();
});

test("does not dispatch on denylisted hosts at runtime", async () => {
  const dom = createDom({
    url: "https://accounts.example.com/",
    testMode: false,
  });
  const window = loadScript(dom, {
    GM_xmlhttpRequest: () => {
      throw new Error("transport should not be called");
    },
  });
  let calls = 0;
  window.GM_xmlhttpRequest = () => {
    calls += 1;
    return { abort() {} };
  };

  stubSelection(window, {
    text: "Hello world",
    target: window.document.getElementById("root"),
  });
  window.document.getElementById("root").dispatchEvent(
    new window.MouseEvent("mouseup", {
      bubbles: true,
      clientX: 40,
      clientY: 40,
    }),
  );
  await wait(380);

  assert.equal(calls, 0);
  dom.window.close();
});

test("does not send already-Russian selections to backend at runtime", async () => {
  const dom = createDom({ url: "https://example.com/", testMode: false });
  let calls = 0;
  const window = loadScript(dom, {
    GM_xmlhttpRequest: () => {
      calls += 1;
      return { abort() {} };
    },
  });

  stubSelection(window, {
    text: "Привет мир",
    target: window.document.getElementById("root"),
  });
  window.document.getElementById("root").dispatchEvent(
    new window.MouseEvent("mouseup", {
      bubbles: true,
      clientX: 50,
      clientY: 50,
    }),
  );
  await wait(380);

  assert.equal(calls, 0);
  dom.window.close();
});

test("runtime path keeps context disabled by default", async () => {
  const dom = createDom({ url: "https://example.com/", testMode: false });
  let payload = null;
  const window = loadScript(dom, {
    GM_xmlhttpRequest: (options) => {
      payload = JSON.parse(options.data);
      setTimeout(() => {
        options.onload({
          status: 200,
          responseText: JSON.stringify({
            requestId: payload.requestId,
            translation: "Привет мир",
          }),
        });
      }, 0);
      return { abort() {} };
    },
  });

  stubSelection(window, {
    text: "Hello world",
    target: window.document.getElementById("root"),
  });
  window.document.getElementById("root").dispatchEvent(
    new window.MouseEvent("mouseup", {
      bubbles: true,
      clientX: 40,
      clientY: 40,
    }),
  );
  await wait(380);

  assert.ok(payload);
  assert.equal("context" in payload, false);
  dom.window.close();
});

test("selection snapshot survives selection clearing before debounce fires", async () => {
  const dom = createDom({ url: "https://example.com/", testMode: false });
  let payload = null;
  const window = loadScript(dom, {
    GM_xmlhttpRequest: (options) => {
      payload = JSON.parse(options.data);
      setTimeout(() => {
        options.onload({
          status: 200,
          responseText: JSON.stringify({
            requestId: payload.requestId,
            translation: "Привет мир",
          }),
        });
      }, 0);
      return { abort() {} };
    },
  });

  const target = window.document.getElementById("root");
  stubSelection(window, { text: "Hello world", target });
  target.dispatchEvent(
    new window.MouseEvent("mouseup", {
      bubbles: true,
      clientX: 40,
      clientY: 40,
    }),
  );
  window.getSelection = () => ({
    rangeCount: 0,
    toString: () => "",
  });
  await wait(380);

  assert.ok(payload);
  assert.equal(payload.text, "Hello world");
  dom.window.close();
});

test("blur hides an open tooltip", async () => {
  const dom = createDom();
  const window = loadScript(dom);
  const api = window.__quteTranslateSelectionTooltipTest;

  api.setTransport(({ json }) => ({
    requestId: json.requestId,
    translation: "Привет мир",
  }));

  await api.show({ text: "Hello world", rect: rect() });
  await wait(5);
  window.dispatchEvent(new window.Event("blur"));
  await wait(5);

  assert.equal(api.getState().visible, false);
  dom.window.close();
});

test("visibilitychange hides an open tooltip", async () => {
  const dom = createDom();
  const window = loadScript(dom);
  const api = window.__quteTranslateSelectionTooltipTest;

  api.setTransport(({ json }) => ({
    requestId: json.requestId,
    translation: "Привет мир",
  }));

  await api.show({ text: "Hello world", rect: rect() });
  await wait(5);
  Object.defineProperty(window.document, "visibilityState", {
    configurable: true,
    value: "hidden",
  });
  window.document.dispatchEvent(new window.Event("visibilitychange"));
  await wait(5);

  assert.equal(api.getState().visible, false);
  dom.window.close();
});

test("scroll and resize hide an open tooltip", async () => {
  const dom = createDom();
  const window = loadScript(dom);
  const api = window.__quteTranslateSelectionTooltipTest;

  api.setTransport(({ json }) => ({
    requestId: json.requestId,
    translation: "Привет мир",
  }));

  await api.show({ text: "Hello world", rect: rect() });
  await wait(5);
  window.dispatchEvent(new window.Event("scroll"));
  await wait(5);
  assert.equal(api.getState().visible, false);

  await api.show({ text: "Hello world", rect: rect() });
  await wait(5);
  window.dispatchEvent(new window.Event("resize"));
  await wait(5);

  assert.equal(api.getState().visible, false);
  dom.window.close();
});

test("cache hit does not show loading flicker", async () => {
  const dom = createDom();
  const window = loadScript(dom);
  const api = window.__quteTranslateSelectionTooltipTest;

  api.setTransport(
    ({ json }) =>
      new Promise((resolve) => {
        setTimeout(() => {
          resolve({ requestId: json.requestId, translation: "Привет мир" });
        }, 0);
      }),
  );

  await api.show({ text: "Hello world", rect: rect() });
  await wait(5);
  assert.equal(api.getState().mode, "success");

  await api.show({ text: "Hello world", rect: rect() });
  assert.equal(api.getState().mode, "success");
  assert.equal(api.getState().text, "Привет мир");

  dom.window.close();
});

test("Escape closes active tooltip and starts cooldown", async () => {
  const dom = createDom({ url: "https://example.com/", testMode: false });
  let calls = 0;
  const window = loadScript(dom, {
    GM_xmlhttpRequest: (options) => {
      calls += 1;
      setTimeout(() => {
        options.onload({
          status: 200,
          responseText: JSON.stringify({
            requestId: JSON.parse(options.data).requestId,
            translation: "Привет мир",
          }),
        });
      }, 0);
      return { abort() {} };
    },
  });

  const target = window.document.getElementById("root");
  stubSelection(window, { text: "Hello world", target });
  target.dispatchEvent(
    new window.MouseEvent("mouseup", {
      bubbles: true,
      clientX: 60,
      clientY: 60,
    }),
  );
  await wait(380);

  window.document.dispatchEvent(
    new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );

  stubSelection(window, { text: "Hello world", target });
  target.dispatchEvent(
    new window.MouseEvent("mouseup", {
      bubbles: true,
      clientX: 60,
      clientY: 60,
    }),
  );
  await wait(380);

  assert.equal(calls, 1);
  dom.window.close();
});
