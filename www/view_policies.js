// vim: set ts=4 sw=4: 
/* A view presenting all available polscan scanners with
   all details and extra statistics for all enabled scanners. */

views.PoliciesView = function PoliciesView(parentDiv, params) {
	this.parentDiv = parentDiv;
	this.filterOptions = {};
};

views.PoliciesView.prototype.update = function(params) {
	var id = this.parentDiv;

	$(id).html(
		"<h2>All Available Policy Scanners</h2>" +
		"<table class='resultTable tablesorter'>" +
		"<thead><tr>" +
		"<th>Enabled</th>" +
		"<th>Group</th>" +
		"<th>Policy</th>" +
		"<th>Details</th>" +
		"<th>Tags</th>" +
		"</tr></thead><tbody/></table>"
	);
	
	getData("overview", function(data) {
		$.each(data.overview, function(i, item) {
			if(item.policy) {
				var solution = "";
				var references = "";

				if(item.solution_cmd && item.solution_cmd !== "")
					solution += " <span class='solution_title'>Quick Fix</span><pre class='solution'>" + item.solution_cmd + "</pre>";
				if(item.solution && item.solution !== "")
					solution += " <span class='solution_title'>Solution</span><p>" + item.solution + "</p>";
				if(item.references) {
					$.each(item.references, function(i, link) {
						if(link === "")
							return;
						references += "<a href='"+link+"'>"+link+"</a><br/>";
					});
				}

				$(id+" table.resultTable tbody").append(
					"<tr><td>&#10003;</td><td>" +
					item.parent + "</td><td>" +
					item.policy + "</td><td>" +
					item.description + solution + 
					(references !== ''?"<span class='solution_title'>References</span> <p>"+references+"</p>":'') +
"</td><td>" +
					(item.tags?item.tags.join(' '):'') +
					"</td></tr>"
				);
			}			
		});
	});
};
