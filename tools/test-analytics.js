const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "analytics.js"), "utf8");

function runPage(href) {
  const storage = new Map();
  const scripts = [];
  const listeners = new Map();

  class Element {}

  const window = {
    location: new URL(href),
    localStorage: {
      getItem(key) {
        return storage.has(key) ? storage.get(key) : null;
      },
      setItem(key, value) {
        storage.set(key, String(value));
      },
      removeItem(key) {
        storage.delete(key);
      }
    }
  };

  const document = {
    querySelector() {
      return null;
    },
    createElement() {
      return {};
    },
    head: {
      appendChild(script) {
        scripts.push(script);
      }
    },
    addEventListener(type, handler) {
      listeners.set(type, handler);
    }
  };

  vm.runInNewContext(source, {
    document,
    Element,
    URL,
    URLSearchParams,
    window
  });

  return { Element, listeners, scripts, storage, window };
}

const internal = runPage("https://example.test/?qj_internal=1");
assert.equal(internal.storage.get("qj_analytics_internal"), "1");
assert.equal(internal.scripts.length, 0);

const measured = runPage("https://example.test/qj-works/");
assert.equal(measured.scripts.length, 1);
assert.match(measured.scripts[0].src, /G-TB84MESWPF/);
assert.ok(measured.listeners.has("click"));

const link = new measured.Element();
link.href = "https://coconala.com/services/4303159?ref=test";
link.textContent = "ココナラで無料見積り相談する";
link.getAttribute = () => link.href;
link.closest = () => link;
measured.listeners.get("click")({ target: link });

const event = measured.window.dataLayer
  .map((entry) => Array.from(entry))
  .find((entry) => entry[0] === "event" && entry[1] === "qj_sales_path_click");

assert.ok(event);
assert.equal(event[2].qj_destination, "coconala");
assert.equal(event[2].link_url, "https://coconala.com/services/4303159");

console.log("analytics smoke tests passed");
