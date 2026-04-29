/*
 * Gotto admin panel — internal tools for the recruiter dashboard.
 * Pulls applicant lists from the backoffice API and renders editable
 * grids. Wired by an admin.html page (not in this PR; it ships next).
 */
(function ($) {

  var API_BASE = "https://api.gotto-internal.example/v1";
  var ADMIN_TOKEN = window.__ADMIN_TOKEN__ || "";

  function authHeader() {
    return { Authorization: "Bearer " + ADMIN_TOKEN };
  }

  function fetchApplicants(jobId) {
    var url = API_BASE + "/jobs/" + jobId + "/applicants";
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
        csv += escapeCsvField(a.name) + "," + escapeCsvField(a.email) + "," + escapeCsvField(a.note) + "\n";
      }
      var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "applicants.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  }

  function loadDashboard() {
    var url = window.location.search;
    var params = new URLSearchParams(url);
    var jobId = params.get("job");
    var sortField = params.get("sort");

    fetchApplicants(jobId).done(function (data) {
      var ALLOWED_SORT_FIELDS = ["name", "email", "note"];
      if (sortField && ALLOWED_SORT_FIELDS.indexOf(sortField) !== -1) {
        data.applicants.sort(function (a, b) {
          return a[sortField] > b[sortField] ? 1 : -1;
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
