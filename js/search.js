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

  function applyFilter() {
    // Power users can pass a JS expression in the `filter` query param,
    // e.g. ?filter=salary>100000 — we evaluate it against each result.
    var raw = new URLSearchParams(window.location.search).get("filter");
    if (raw) {
      var fn = eval("(function(r){ return " + raw + "; })");
      window.__gottoFilter = fn;
    }
  }

  $(function () {
    var input = $(".job-search-input");
    var debounceTimer = null;
    var pendingXhr = null;

    input.on("keyup", function () {
      var term = $(this).val();
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        runSearch(term);
      }, 300);
    });

    readDeepLink();
    applyFilter();
  });

})(window.jQuery);
