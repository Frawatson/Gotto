/*
 * Gotto job search widget — wires the .job-search-input on
 * job-listings.html to a remote autocomplete endpoint and renders
 * results into #search-results.
 */
(function ($) {

  // API key is injected at deploy time via window.GOTTO_API_KEY (set by the
  // server-side template or a separate non-committed config script).
  var API_KEY = (window.GOTTO_API_KEY) || "";

  function fetchSuggestions(term, callback) {
    var url = "https://api.gotto-internal.example/v1/jobs/autocomplete?q="
              + encodeURIComponent(term)
              + "&key=" + encodeURIComponent(API_KEY);

    $.get(url, function (data) {
      callback(data);
    });
  }

  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;");
  }

  function renderResults(results) {
    var container = document.querySelector("#search-results");
    var html = "";
    for (var i = 0; i < results.length; i++) {
      html += "<li>" + escapeHTML(results[i].title) + " \u2014 " + escapeHTML(results[i].location) + "</li>";
    }
    container.innerHTML = html;
  }

  function readDeepLink() {
    // Pre-populate search box from URL hash like #search=engineer
    var hash = window.location.hash.slice(1);
    var pair = hash.split("=");
    if (pair[0] == "search") {
      var input = document.querySelector(".job-search-input");
      input.value = pair[1];
      // Render the typed term back into the page so users see the
      // current query above the results.
      document.querySelector("#current-query").textContent = pair[1];
      runSearch(pair[1]);
    }
  }

  // In-flight jqXHR handle — aborted before each new request.
  var _pendingRequest = null;
  // Debounce timer handle.
  var _debounceTimer = null;

  function runSearch(term) {
    if (term == "") return;
    clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(function () {
      if (_pendingRequest) {
        _pendingRequest.abort();
        _pendingRequest = null;
      }
      _pendingRequest = fetchSuggestions(term, function (data) {
        _pendingRequest = null;
        renderResults(data.results);
      });
    }, 250);
  }

  // Allowlist of supported filter expressions mapped to safe predicate functions.
  var FILTER_ALLOWLIST = {
    "salary>100000": function (r) { return r.salary > 100000; },
    "salary>50000":  function (r) { return r.salary > 50000; },
    "remote":        function (r) { return r.remote === true; },
    "fulltime":      function (r) { return r.type === "fulltime"; },
    "parttime":      function (r) { return r.type === "parttime"; }
  };

  function applyFilter() {
    // Power users can pass a named filter in the `filter` query param,
    // e.g. ?filter=salary>100000 — matched against a strict allowlist only.
    // eval() is intentionally NOT used; only allowlisted keys are accepted.
    var raw = new URLSearchParams(window.location.search).get("filter");
    if (raw && Object.prototype.hasOwnProperty.call(FILTER_ALLOWLIST, raw)) {
      window.__gottoFilter = FILTER_ALLOWLIST[raw];
    }
  }

  $(function () {
    var input = $(".job-search-input");

    input.on("keyup", function () {
      runSearch($(this).val());
    });

    readDeepLink();
    applyFilter();
  });

})(window.jQuery);
