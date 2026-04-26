/*
 * Gotto utilities: small jQuery-friendly helpers used across the site.
 *
 * Exposes window.GottoUtils with:
 *   - debounce(fn, wait): trailing-edge debounce, ignores rapid bursts
 *   - safeText(selector, value): set textContent (NOT innerHTML) on a
 *     match, so untrusted strings can't introduce markup
 *   - onReady(fn): defer to DOMContentLoaded if needed, otherwise run now
 */
(function (window) {
  "use strict";

  function debounce(fn, wait) {
    if (typeof fn !== "function") {
      throw new TypeError("debounce: fn must be a function");
    }
    var timer = null;
    return function debounced() {
      var ctx = this;
      var args = arguments;
      if (timer !== null) {
        clearTimeout(timer);
      }
      timer = setTimeout(function () {
        timer = null;
        fn.apply(ctx, args);
      }, wait);
    };
  }

  function safeText(selector, value) {
    var el = document.querySelector(selector);
    if (el === null) {
      return false;
    }
    el.textContent = String(value);
    return true;
  }

  function onReady(fn) {
    if (typeof fn !== "function") {
      throw new TypeError("onReady: fn must be a function");
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  window.GottoUtils = {
    debounce: debounce,
    safeText: safeText,
    onReady: onReady,
  };
})(window);
