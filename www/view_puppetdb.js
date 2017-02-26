// vim: set ts=4 sw=4: 
/* A view that allow to select the network view you want :-) */

views.PuppetdbView = function PuppetdbView(parentDiv) {
	this.parentDiv = parentDiv;
	this.filterOptions = {};
};

views.PuppetdbView.prototype.update = function(params) {
	var view = this;

	clean();
	$('#filter').hide();
	$(this.parentDiv).html('<div class="puppet"></div>');
	$(this.parentDiv).css('margin-left', '12px');
	getAPI("puppetdb", function(data) {
		var stats = [
			{"label": "OK",       "value": 0, "color": "#4c4"},
			{"label": "changed",  "value": 0, "color": "#44c"},
			{"label": "failed",   "value": 0, "color": "#f77"},
			{"label": "outdated", "value": 0, "color": "#ccf"}
		];
		var total = 0;
		$.each(data, function(h, host) {
			if(host["latest_report_status"] === "unchanged")
				stats[0].value++;
			if(host["latest_report_status"] === "failed")
				stats[2].value++;
			if(host["latest_report_status"] === "changed")
				stats[1].value++;
			if(host["latest_report_status"] === "null")
				stats[3].value++;

			total++;
		});
		$("<div id='findingsPies' class='overviewBox dark'>").appendTo(view.parentDiv);
		$("<div id='pieChartStatus' class='pie'>").appendTo("#findingsPies");
		$("<table class='resultsTable'><thead><tr><th>Status</th><th>Count</th></tr>"+
		stats.map(function(i) {
			return "<tr><td><div style='width:20px;height:20px;background:"+i.color+"'/>"+i.label+"</td><td>"+i.value+"</td></tr>";
		}) + "</table>").prependTo(view.parentDiv);
		
		addPieChart('pieChartStatus', 'Puppet Run Status', 260, '#fff', stats);
    });
};
