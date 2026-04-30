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
              + encodeURIComponent(term);

    return $.ajax({
      url: url,
      method: "GET",
      headers: { "X-API-Key": API_KEY },
      success: function (data) {
        callback(data);
      },
      error: function (jqXHR, textStatus) {
        if (textStatus !== "abort") {
          renderResults([]);
        }
      }
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
    var eqIndex = hash.indexOf("=");
    var key = eqIndex === -1 ? hash : hash.slice(0, eqIndex);
    if (key == "search") {
      var term = eqIndex === -1 ? "" : decodeURIComponent(hash.slice(eqIndex + 1));
      var input = document.querySelector(".job-search-input");
      if (input) input.value = term;
      // Render the typed term back into the page so users see the
      // current query above the results.
      var queryLabel = document.querySelector("#current-query");
      if (queryLabel) queryLabel.textContent = term;
      runSearch(term);
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
        if (data && Array.isArray(data.results)) {
          renderResults(data.results);
        }
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
