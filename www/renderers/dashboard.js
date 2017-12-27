// vim: set ts=4 sw=4: 
// The overview...

renderers.dashboard = function dashboardRenderer() { };

renderers.dashboard.prototype.addTopChanges = function(changes, type) {
	var results = [];
        var sortbar = [];

	$.each(changes[type], function(name, count) {
		sortbar.push({ "name": name, "count": count });
        });
	$.each(sortbar.sort(function(a,b) {
		return b.count-a.count;
	}), function(i,item) {
		if(results.length < 3)
			results.push("<div>"+item.name+" <b>(+"+item.count+")</b></div>");
	});
	if(results.length != -1)
		$('#topChanges').append("<div class='changeList'><div class='changeItems "+type.toUpperCase()+"'>"+results.join('')+"</div></div>");
};

renderers.dashboard.prototype.render = function(id, data, params) {
	var r = this;

	$(this.parentDiv).addClass('dashboard');

	getData("overview", function(data) {
			$("#row1").append("<div class='chart'><span id='overviewCalendar'/></div>");
			addCalendar("#overviewCalendar", data.date);
			$("#loadmessage").hide();

			var groupFailed = [];
			var groupWarning = [];
			var pieGroupHosts = [];
			$.each(data.overview, function(i, item) {
				if(item.group) {
					var compliant = 1;
					var tmp = '<span class="name">' +
					item.group +
					'</span>';
					if(item.FAILED > 0) {
						groupFailed.push({
							"label": item.group,
							"value": item.FAILED,
							"color": "#ff0000"
							});
						compliant = 0;
						tmp += ' <span class="FAILED problems" title="Total failures found">' +
						item.FAILED +
						'</span>';
					}
					if(item.WARNING > 0) {
						groupWarning.push({
							"label": item.group,
							"value": item.WARNING,
							"color": "#ee0"
							});
						compliant = 0;
						tmp += ' <span class="WARNING problems" title="Total warnings seen">' +
						item.WARNING +
						'</span>';
					}
					if(compliant) {
						tmp += ' <span class="compliant problems" title="100% compliance for this group">compliant</span>';
					}
				}
			});


/*			$("<div id='findingsPies' class='overviewBox dark'>").appendTo("#row1");
			$("<div id='pieChartFailed' class='pie'>").appendTo("#findingsPies");
			$("<div id='pieChartWarning' class='pie'>").appendTo("#findingsPies");
			addPieChart('pieChartFailed', 'Problems', 260, '#fff', groupFailed);
			addPieChart('pieChartWarning', 'Warnings', 260, '#777' ,groupWarning);
*/
			$( "<div id='topChangesBox'>" ).appendTo("#row2");
			$( "<h3>Top Changes</h3><div id='topChanges'></div>").appendTo("#topChangesBox");

			$( "<div id='policies'>" ).appendTo("#row2");
			$( "<h3>Findings / Changes per Policy</h3><table class='resultTable tablesorter' id='findingsPerPolicy'><thead><tr><th>Group</th><th>Policy</th><th>Problems</th><th>Change</th><th>Warnings</th><th>Change</th><th colspan='2'>Trend</th></tr></thead><tbody></tbody></table>").appendTo("#policies");

			getData("histogram", function(data) {
				var changes = { 'ok': {}, 'failed': {}, 'warning': {}};

				// Avoid showing trend chart for small data set
				if(data.histogram[0].FAILED.length < 5)
					$('#histogramChart').parent().hide();

				if(data.histogram[0].FAILED.length < 2)
					$('#topChangesBox').hide();

				$.each(data.histogram, function(i, item ) {
					if(-1 != item.id.indexOf(":::")) {
						var compliant = 1;
						var group, policy, failed, failed2, warning, warning2, diff;
						try {
							group = item.id.split(/:::/)[0];
							policy = item.id.split(/:::/)[1];
							failed = item.FAILED[item.FAILED.length-1];
							failed2 = item.FAILED[item.FAILED.length-2];
							warning = item.WARNING[item.WARNING.length-1];
							warning2 = item.WARNING[item.WARNING.length-2];
						} catch(e) {
							console.log("Failed to get values for "+item.id+" Exception:"+e);
						}
						var pf = 'filter="' + group + '---' + policy + '"';
						var tmp = '<tr><td class="group" title="'+item.description+'" filter="' + group + '">' + group + '</td><td class="policy" '+pf+'>' + (policy?policy:"") + '</td>';
						tmp += '<td class="policy" '+pf+'>';
						if(failed > 0)
							tmp += '<span class="FAILED problems" title="Total failures found">' + failed + '</span>';
						else
							tmp += '<span title="Total failures found">0</span>';
						tmp += '</td><td class="change">';
						diff = failed - failed2;
						if(diff != 0) {
							tmp += '<span class="'+(diff>0?"FAILED":"compliant")+' changes" filter="'+(diff>0?'new':'solved')+'---' + policy + '" title="Total change problems">+' + Math.abs(diff) + '</span>';
							if(diff > 0) {
								changes.failed[group+'---'+policy] = Math.abs(diff);
							} else {
								changes.ok[group+'---'+policy] = Math.abs(diff);
							}
						}
						tmp += '</td><td class="policy" '+pf+'>';
						if(warning > 0)
							tmp += '<span class="WARNING problems" title="Total warnings seen">' + warning + '</span>';
						else
							tmp += '<span title="Total warnings found">0</span>';
						tmp += '</td><td class="change">';
						diff = warning - warning2;
						if(diff != 0) {
							tmp += '<span class="'+(diff>0?"WARNING":"compliant")+' changes" filter="'+(diff>0?'new':'solved')+'---' + policy + '" title="Total change warnings">+' + Math.abs(diff) + '</span>';
							if(diff > 0) {
								changes.warning[group+'---'+policy] = Math.abs(diff);
							} else {
								changes.ok[group+'---'+policy] = Math.abs(diff);
							}
						}
						tmp += '</td>';
						tmp += '<td><div class="inlinesparkline_f'+group+'___'+policy.replace(/[^a-zA-Z]/g, '')+'"/></td>';
						tmp += '<td><div class="inlinesparkline_w'+group+'___'+policy.replace(/[^a-zA-Z]/g, '')+'"/></td>';
						tmp += '</tr>';
						$("#findingsPerPolicy").append(tmp);
						$('.inlinesparkline_w'+group+'___'+policy.replace(/[^a-zA-Z]/g, '')).sparkline(item.WARNING, {
							type: 'line',
							lineColor: '#a0a000',
							fillColor: '#ffff00'
						});
						$('.inlinesparkline_f'+group+'___'+policy.replace(/[^a-zA-Z]/g, '')).sparkline(item.FAILED, {
							type: 'line',
							lineColor: '#ff0000',
							fillColor: '#ffa0a0'
						});
					}
				});
				$("#findingsPerPolicy").tablesorter({sortList: [[3,1],[2,1],[5,1],[4,1]]});

				r.addTopChanges(changes, 'failed');
				r.addTopChanges(changes, 'warning');
				r.addTopChanges(changes, 'ok');

				$("#findingsPerPolicy .group").click(function() {
					setLocationHash({
					    fG: $(this).attr('filter'),
   						view: 'ScanResults',
						r: 'table'
					});
				});
				$("#findingsPerPolicy .policy").click(function() {
					var fields = $(this).attr('filter').split(/---/);
					setLocationHash({
						fG: fields[0],
						sT: fields[1],
						view: 'ScanResults',
						r: 'table'
					});
				});
				$("#findingsPerPolicy .change").click(function() {
					var fields = $(this).find('.changes').attr('filter').split(/---/);
					setLocationHash({
						fG: fields[0],
						sT: fields[1],
						view: 'ScanResults',
						r: 'table'
					});
				});
			});
		});
	createHistogram('#row1', 'all');
};
