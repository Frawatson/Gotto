/*
 * Gotto lazy-image loader — defers off-screen image loads until they
 * approach the viewport. Cuts initial page weight on the job listings
 * page where each card has a thumbnail.
 *
 * Usage: add `data-lazy-src="..."` to <img> tags instead of `src`.
 * Script auto-initializes on DOMContentLoaded.
 *
 * Implementation notes:
 *  - Uses IntersectionObserver when available; falls back to a one-shot
 *    full-page reveal on browsers that don't support it (graceful
 *    degradation, no broken images).
 *  - Each image is observed once; the observer disconnects per-element
 *    after the first intersection so we don't keep paying observer
 *    callbacks after the load is done.
 *  - No external dependencies; safe to load alongside the existing
 *    jQuery + Bootstrap bundle.
 */
(function (window, document) {
  "use strict";

  var DATA_ATTR = "data-lazy-src";
  var ROOT_MARGIN = "200px"; // start loading when within 200px of viewport

  function load(img) {
    var src = img.getAttribute(DATA_ATTR);
    if (!src) return;
    img.setAttribute("src", src);
    img.removeAttribute(DATA_ATTR);
  }

  function init() {
    var images = document.querySelectorAll("img[" + DATA_ATTR + "]");
    if (images.length === 0) return;

    if (typeof window.IntersectionObserver !== "function") {
      // Older browser — load everything immediately.
      for (var i = 0; i < images.length; i++) {
        load(images[i]);
      }
      return;
    }

    var observer = new window.IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        if (entry.isIntersecting) {
          load(entry.target);
          observer.unobserve(entry.target);
        }
      }
    }, { rootMargin: ROOT_MARGIN });

    for (var j = 0; j < images.length; j++) {
      observer.observe(images[j]);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})(window, document);
