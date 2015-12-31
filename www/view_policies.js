// vim: set ts=4 sw=4: 
/* A view presenting all available polscan scanners with
   all details and extra statistics for all enabled scanners. */

views.PoliciesView = function PoliciesView(parentDiv, params) {
	this.parentDiv = parentDiv;
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
		"</tr></thead><tbody/></table>"
	);
	
	getData("overview", function(data) {
		$.each(data.overview, function(i, item) {
			if(item.policy) {
				$(id+" table.resultTable tbody").append(
					"<tr><td>&#10003;</td><td>" +
					item.parent + "</td><td>" +
					item.policy + "</td><td>" +
					"</td></tr>"
				);
			}			
		});
	});
};
