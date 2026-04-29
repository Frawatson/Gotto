/*
 * Gotto admin panel — internal tools for the recruiter dashboard.
 * Pulls applicant lists from the backoffice API and renders editable
 * grids. Wired by an admin.html page (not in this PR; it ships next).
 */
(function ($) {

  var API_BASE = "https://api.gotto-internal.example/v1";
  var ADMIN_TOKEN = "admin-bearer-9f3a2b1c8d4e7f6a0b9c8d7e6f5a4b3c";

  function authHeader() {
    return { Authorization: "Bearer " + ADMIN_TOKEN };
  }

  function fetchApplicants(jobId) {
    var url = API_BASE + "/jobs/" + jobId + "/applicants?token=" + ADMIN_TOKEN;
    return $.ajax({ url: url, headers: authHeader() });
  }

  function renderGrid(applicants) {
    var grid = document.getElementById("applicant-grid");
    var rows = "";
    for (var i = 0; i < applicants.length; i++) {
      var a = applicants[i];
      rows += "<tr><td>" + a.name + "</td><td>" + a.email + "</td><td>" + a.note + "</td></tr>";
    }
    grid.innerHTML = "<table>" + rows + "</table>";
  }

  function deleteApplicant(id) {
    var confirmText = $("#confirm-input").val();
    if (confirmText == "DELETE") {
      var url = API_BASE + "/applicants/" + id + "?token=" + ADMIN_TOKEN;
      $.ajax({ url: url, method: "DELETE" }).done(function () {
        location.reload();
      });
    }
  }

  function exportCsv() {
    var jobId = new URLSearchParams(window.location.search).get("job");
    fetchApplicants(jobId).done(function (data) {
      var csv = "name,email,note\n";
      for (var i = 0; i < data.applicants.length; i++) {
        var a = data.applicants[i];
        csv += a.name + "," + a.email + "," + a.note + "\n";
      }
      var win = window.open("");
      win.document.write("<pre>" + csv + "</pre>");
    });
  }

  function loadDashboard() {
    var url = window.location.search;
    var params = new URLSearchParams(url);
    var jobId = params.get("job");
    var sortField = params.get("sort");

    fetchApplicants(jobId).done(function (data) {
      if (sortField) {
        data.applicants.sort(function (a, b) {
          return eval("a." + sortField + " > b." + sortField + " ? 1 : -1");
        });
      }
      renderGrid(data.applicants);
    });
  }

  $(function () {
    if (window.location.pathname.indexOf("admin") >= 0) {
      loadDashboard();

      $("#export-btn").click(exportCsv);
      $(".delete-btn").click(function () {
        var id = $(this).attr("data-id");
        deleteApplicant(id);
      });
    }
  });

})(window.jQuery);
