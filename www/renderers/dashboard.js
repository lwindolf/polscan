// vim: set ts=4 sw=4: 
// The overview...

renderers.dashboard = function dashboardRenderer() { };

renderers.dashboard.prototype.addTopChanges = function(changes, type) {
	if(undefined === changes[type])
		return;

	$('#topChanges').append(render('dashboard_top_changes', {
		changes: Object.keys(changes[type]).map(function(name, index) {
					return { "id": name, "name": name.replace('---', ': '), "severity": type, "count": changes[type][name] };
			    }).sort(function(a,b) {
					return b.count-a.count;
				}).splice(0,4)
	}));
};

renderers.dashboard.prototype.render = function(id, data, params) {
	var r = this;

	$(id).append('<div id="dashboard"><div id="overviewCalendar"/><div id="topChangesBox"><h3>Top Changes</h3><div id="topChanges"></div></div><div id="overviewHistogram"/></div>');

	getData("overview", function(data) {
			addCalendar("#overviewCalendar", data.date);
			createHistogram("#overviewHistogram", 'all');
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

			$("<div id='policies'><h3>Findings / Changes per Policy</h3><table class='resultTable tablesorter' id='findingsPerPolicy'><thead><tr><th>Group</th><th>Policy</th><th>Problems</th><th>Diff</th><th>Warnings</th><th>Diff</th><th class='trend'>Trend</th></tr></thead><tbody></tbody></table></div>").appendTo("#dashboard");

			getData("histogram", function(data) {
				var changes = { 'ok': {}, 'failed': {}, 'warning': {}};

				// Avoid showing trend chart for small data set
				if(data.histogram[0].FAILED.length < 5) {
					$('#histogramChart').parent().hide();
					$('#policies .trend').hide();
				}

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
							tmp += '<span title="Total problems found" severity="failed">'+failed+'</span>';
						else if(warning == 0)
							tmp += '<span title="Policy is compliant" severity="ok"/>';
						tmp += '</td><td class="policy">';
						diff = failed - failed2;
						if(!isNaN(diff) && diff != 0) {
							tmp += '<span filter="'+(diff>0?'new':'solved')+'---' + policy + '" title="Total change problems">+' + Math.abs(diff) + '</span>';
							if(diff > 0) {
								changes.failed[group+'---'+policy] = Math.abs(diff);
							} else {
								changes.ok[group+'---'+policy] = Math.abs(diff);
							}
						}
						tmp += '</td><td class="policy" '+pf+'>';
						if(warning > 0)
							tmp += '<span title="Total warnings seen" severity="'+(warning>0?"warning":"ok")+'">' + warning + '</span>';
						tmp += '</td><td class="policy">';
						diff = warning - warning2;
						if(!isNaN(diff) && diff != 0) {
							tmp += '<span filter="'+(diff>0?'new':'solved')+'---' + policy + '" title="Total change warnings">+' + Math.abs(diff) + '</span>';
							if(diff > 0) {
								changes.warning[group+'---'+policy] = Math.abs(diff);
							} else {
								changes.ok[group+'---'+policy] = Math.abs(diff);
							}
						}
						tmp += '</td>';
						if(data.histogram[0].FAILED.length >= 5) {
							tmp += '<td class="trend"><div class="inlinesparkline_'+group+'___'+policy.replace(/[^a-zA-Z]/g, '')+'"/></td>';
							tmp += '</tr>';
						}
						$("#findingsPerPolicy").append(tmp);
						$('.inlinesparkline_'+group+'___'+policy.replace(/[^a-zA-Z]/g, '')).sparkline(item.WARNING.map(function(count, i) {
							return item.FAILED[i] + ":" + count;
						}), {
							type: 'bar',
							barSpacing: 0,
							stackedBarColor: [ '#f77', '#eecc00'	 ]
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
};
