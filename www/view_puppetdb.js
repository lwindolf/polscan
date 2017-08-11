// vim: set ts=4 sw=4: 
/* Show PuppetDB node / reports statistics */

views.PuppetdbView = function PuppetdbView(parentDiv) {
	this.parentDiv = parentDiv;
	this.filterOptions = {};
	this.reports = undefined;
};

views.PuppetdbView.prototype.getHostDetails = function(params) {
	var view = this;

	getAPI("puppetdb/reports", function(data) {
		var j = 0;
		view.reports = data;
		$("<input type='button' value='Back to Host Overview' onclick='setLocationHash({view: \"puppetdb\"})'/>"+
		"<h3>Recent Reports for "+params.h+"</h3><p>Click a row for report details.</p><table id='puppetFailedTable' class='resultTable tablesorter'><thead><tr><th>Time</th><th>Applied</th><th>Restarts</th><th>Failed</th><th>Failed Restarts</th><th>Skipped</th><th>Pending</th></tr></thead><tbody>"+
		data.map(function(i) {
			j++;
			var a = 0,r = 0,f = 0,fr = 0,s = 0,p = 0;
			// Try to find metrics values
			i.metrics.data.forEach(function(d) {
				if(d.name === "change") a+=d.value;
				if(d.name === "corrective_change") a+=d.value;
				if(d.name === "failed") f+=d.value;
				if(d.name === "failed_to_restart") fr+=d.value;
				if(d.name === "restarted") r+=d.value;
				if(d.name === "skipped") s+=d.value;
				if(d.name === "scheduled") p+=d.value;
			});
			return "<tr class='reportrow' onclick='$(\"tr.reportrowresults\").hide();$(\"#reportrow"+j+"\").show();$(\"#reportrow"+j+"\").children().show()'><td>"+new Date(i.start_time).toLocaleString()+"</a></td>"+
			"<td>"+(a!==0?"<span class='compliant changes'>"+a+"</span>":"")+"</td>"+
			"<td>"+(r!==0?"<span class='compliant changes'>"+r+"</span>":"")+"</td>"+
			"<td>"+(f!==0?"<span class='FAILED'>"+f+"</span>":"")+"</td>"+
			"<td>"+(fr!==0?"<span class='FAILED'>"+fr+"</span>":"")+"</td>"+
			"<td>"+(s!==0?"<span class='WARNING'>"+s+"</span>":"")+"</td>"+
			"<td>"+(p!==0?"<span>"+p+"</span>":"")+"</td>"+
			"</tr><tr id='reportrow"+j+"' class='reportrowresults'><td style='display:none' colspan='100'><table class='resultTable'><thead><tr><th>Time</th><th>Level</th><th>Info</th></tr></thead><tbody>"+
			i.logs.data.map(function(l) {
				return "<tr><td>"+new Date(l.time).toLocaleString()+"</td><td class='"+(l.level==="err"?"FAILED":(l.level==="warning"?"WARNING":"OK"))+"'>"+
				l.level + "</td><td><b>Source:</b> " +
				l.source + "<br/><b>Message:</b> " + l.message +
				"</td></tr>";
			}).join("")+
			"</tbody></table></td></tr>";
		}).join("") + 
		"</tbody></table>").appendTo('#row2');
	}, undefined, [{ hostname: params.h }]);
}

views.PuppetdbView.prototype.update = function(params) {
	clean();
	$('#filter').hide();
	$(this.parentDiv).css('margin-left', '12px');
	if(undefined === params.h)
	        this.getOverview(params);
	else
	        this.getHostDetails(params);
}

views.PuppetdbView.prototype.getOverview = function(params) {
	var view = this;
	var type = params.type;
	if(undefined === type)
		type = "failed";

	$("#row1").html("<div id='findingsPies' class='overviewBox dark'/></div>");
	$("<div id='pieChartStatus' class='pie'>").appendTo("#findingsPies");

	getAPI("puppetdb/nodes", function(data) {
		var colors = {
			"OK"           : "#0b0",
			"changed"      : "#44c",
			"failed"       : "#f77",
			"outdated"     : "#ccf",
			"noop pending" : "#a7c"
		};
		var stats = Object.keys(colors).map(function(c) {
			return {"label":c, "value":0, "color": colors[c]};
		});
//		var stats = [
//			{"label": "OK",           "value": 0, "color": "#0b0"},
//			{"label": "changed",      "value": 0, "color": "#44c"},
//			{"label": "failed",       "value": 0, "color": "#f77"},
//			{"label": "outdated",     "value": 0, "color": "#ccf"},
//			{"label": "noop pending", "value": 0, "color": "#a7c"}
//		];
		var total = 0;
		var now = new Date();
		$.each(data, function(h, host) {
			var d = new Date(host["report_timestamp"]);
			// Apply Foreman like >85min means out-of-date
			if(undefined !== d && (now.getTime() - d.getTime() > 85*60000))
				stats[3].value++;
			else if(host["latest_report_status"] === "unchanged")
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
		$('#findingsPies').append(render('puppetdb', { "stats": stats, "total": total }));
		
		addPieChart('pieChartStatus', 'Puppet Run Status', 260, '#fff', stats);

		$("<div>Hostname <input type='text' size='40' id='host'/> <input type='button' value='Show Reports' onclick='setLocationHash({ h: $(\"#host\").val() });'/><input type='button' value='Show Facts' onclick='setLocationHash({ h: $(\"#host\").val(), view: \"puppetdb_facts\" });'/></div>"+
		"<h3>Recently "+type+" Hosts</h3><table id='puppetFailedTable' class='resultTable tablesorter'><thead><tr><th>Host</th><th>Time</th></tr></thead><tbody>"+
		data.filter(function(h) {
			return h["latest_report_status"] === type;
		}).map(function(h, host) {
			return "<tr><td><div style='width:20px;height:20px;float:left;margin-right:12px;background:#f77'/><a href='#view=puppetdb&h="+h.certname+"'>"+h.certname+"</a></td><td>"+new Date(h.report_timestamp).toLocaleString()+"</td></tr>";

		}).join("") + "</tbody></table>").appendTo('#row2');
		if(stats[type] === 0)
			$("<tr><td colspan='2'>No problems right now.</td></tr>").appendTo('#puppetFailedTable tbody');
		if(stats[type] === 50)
			$("<small>(Max. 50 Hosts are shown)</small>").appendTo('#row2');
		$("#puppetFailedTable").tablesorter({sortList: [[1,1]]});
	});

	getAPI("puppetdb/changed", function(data) {
		var max = 6;
		$("<div class='badges' style='padding:6px 24px'><b>Recently Changed Resources</b><table id='puppetChangedTable' class='resultTable tablesorter'><thead><tr><th>Resource</th><th>Count</th></tr></thead><tbody>" +
		data.sort(function(a,b) {
			if(a.successes + b.successes > 0)
				return b.successes - a.successes;
		}).map(function(i) {
			if(max <= 0)
				return;
			if(i.successes === 0)
				return "";
			max--;
			return "<tr><td><div style='width:20px;height:20px;float:left;margin-right:12px;background:#44c'/>"+i.subject.title+"</td><td>"+i.successes+"</td></tr>";

		}).join("") +
		"</tbody></table></div>").appendTo('#row1');

		max = 6;
		$("<div class='badges' style='padding:6px 24px'><b>Recently Failed Resources</b><table id='puppetChangedTable' class='resultTable tablesorter'><thead><tr><th>Resource</th><th>Count</th></tr></thead><tbody>" +
		data.sort(function(a,b) {
			if(a.failures + b.failures > 0)
				return b.failures - a.failures;
		}).map(function(i) {
			if(max <= 0)
				return;
			if(i.failures === 0)
				return "";
			max--;
			return "<tr><td><div style='width:20px;height:20px;float:left;margin-right:12px;background:#f77'/>"+i.subject.title+"</td><td>"+i.failures+"</td></tr>";

		}).join("") +
		"</tbody></table></div>").appendTo('#row1');

	});
};
