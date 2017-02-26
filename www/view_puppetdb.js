// vim: set ts=4 sw=4: 
/* Show PuppetDB node / reports statistics */

views.PuppetdbView = function PuppetdbView(parentDiv) {
	this.parentDiv = parentDiv;
	this.filterOptions = {};
};

views.PuppetdbView.prototype.update = function(params) {
	var view = this;

	clean();
	$('#filter').hide();
	$(this.parentDiv).css('margin-left', '12px');
	$("#row1").html("<div id='findingsPies' class='overviewBox dark'/></div>");
	$("<div id='pieChartStatus' class='pie'>").appendTo("#findingsPies");

	getAPI("puppetdb/nodes", function(data) {
		var stats = [
			{"label": "OK",           "value": 0, "color": "#0b0"},
			{"label": "changed",      "value": 0, "color": "#44c"},
			{"label": "failed",       "value": 0, "color": "#f77"},
			{"label": "outdated",     "value": 0, "color": "#ccf"},
			{"label": "noop pending", "value": 0, "color": "#a7c"},
		];
		var total = 0;
		var now = new Date();
		$.each(data, function(h, host) {
			var d = new Date(host["report_timestamp"]);
			// Apply Foreman like >85min means out-of-date
			if(undefined !== d && (now.getTime() - d.getTime() > 85*60000))
				stats[3].value++;
			if(host["latest_report_status"] === "unchanged")
				stats[0].value++;
			if(host["latest_report_status"] === "failed")
				stats[2].value++;
			if(host["latest_report_status"] === "changed")
				stats[1].value++;
			if(host["latest_report_status"] === "null")
				stats[3].value++;
			if(host["latest_report_noop_pending"] === "true")
				stats[4].value++;

			total++;
		});
		$("<table id='puppetStatusTable' class='resultTable' style='margin-top:24px;float:right;margin-left:64px'><thead><tr><th>Status</th><th>Count</th></tr></thead><tbody>"+
		stats.map(function(i) {
			return "<tr><td><div style='width:20px;height:20px;float:left;margin-right:12px;background:"+i.color+"'/>"+i.label+"</td><td>"+i.value+"</td></tr>";
		}).join("") + "</tbody></table>").appendTo('#findingsPies');
		$('.puppetStatusTable tbody').append('<tr><td><b>Total Hosts</b></td><td>'+total+'</td></tr>');
		
		addPieChart('pieChartStatus', 'Puppet Run Status', 260, '#fff', stats);
    });

	getAPI("puppetdb/nodes_failed", function(data) {
		$("<h3>Recently Failed Hosts</h3><table id='puppetFailedTable' class='resultTable tablesorter'><thead><tr><th>Host</th><th>Time</th></tr></thead><tbody>"+
		data.map(function(i) {
			return "<tr><td><div style='width:20px;height:20px;float:left;margin-right:12px;background:#f77'/>"+i.certname+"</td><td>"+new Date(i.report_timestamp).toLocaleString()+"</td></tr>";
		}).join("") + "</tbody></table>").appendTo('#row2');
		if(data.length === 0)
			$("<<tr><td colspan='2'>No problems right now.</td></tr>").appendTo('#puppetFailedTable tbody');
		if(data.length === 50)
			$("<small>(Max. 50 Hosts are shown)</small>").appendTo('#row2');
	    $("#puppetFailedTable").tablesorter({sortList: [[1,1]]});
	});
};
