// vim: set ts=4 sw=4: 
// The overview...

views.OverviewView = function OverviewView(parentDiv, params) {
	this.parentDiv = parentDiv;
};

function addPieChart(id, title, size, pColor, data) {
	return new d3pie(id, {
		"header": {
			"title": {
				"text": title,
				"color": "#fff",
			},
		},
		"size": {
			"canvasWidth": size*0.8,
			"canvasHeight": size,
			"pieOuterRadius": "90%"
		},
			"data": {
			"sortOrder": "value-desc",
			"content": data,
		},
		"tooltips": {
			"enabled": true,
			"type": "placeholder",
			"string": "{label}: \n{value}, {percentage}%"
		},
		"labels": {
			"outer": {
				"format": "none"
			},
			"inner": {
				"format": "label-percentage2",
				"hideWhenLessThanPercentage": 8
			},
			"mainLabel": {
				"fontSize": 16,
				"color": "black"
			},
			"percentage": {
				"color": pColor,
				"decimalPlaces": 0
			},
			"value": {
				"color": "#adadad",
				"fontSize": 10
			}
		},
		'callbacks': {
			'onClickSegment': function(segment) {
				setLocationHash({ fG: segment.data.label});
			}
		}
	});
}

views.OverviewView.prototype.addTopChanges = function(changes, type) {
	var results = [];
        var sortbar = [];

	$.each(changes[type], function(name, count) {
		sortbar.push({ "name": name, "count": count });
        });
	$.each(sortbar.sort(function(a,b) {
		return b["count"]-a["count"];
	}), function(i,item) {
		if(results.length < 3)
			results.push("<div>"+item["name"] + " <b>(+"+item["count"]+")</b></div>");
	});
	if(results.length != -1)
		$('#topChanges').append("<div class='changeList'><div class='changeItems "+type.toUpperCase()+"'>"+results.join('')+"</div></div>");
}

views.OverviewView.prototype.update = function(params) {
	var view = this;

	clean();
	$(this.parentDiv).css('margin-left:0;');
	$("<div id='overviewBoxContainer'>").appendTo(this.parentDiv);
	$("<div id='col2'>").appendTo("#overviewBoxContainer");
	$("<div id='col1'>").appendTo("#overviewBoxContainer");

	getData("overview", function(data) {
			$("#row1").append("<div class='chart'><span id='overviewCalendar'/></div>");
			addCalendar("#overviewCalendar", data.date);
			createBadges('#row1', data.FAILED, data.WARNING, 'Overview', data.hostCount);
			$("#loadmessage").hide();

			var groupFailed = new Array();
			var groupWarning = new Array();
			var pieGroupHosts = new Array();
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
						tmp += ' <span class="FAILED" title="Total failures found">' +
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
						tmp += ' <span class="WARNING" title="Total warnings seen">' +
						item.WARNING +
						'</span>'
					}
					if(compliant) {
						tmp += ' <span class="compliant" title="100% compliance for this group">compliant</span>';
					}
				}
			});

			$("<div id='findingsPies' class='overviewBox dark'>").appendTo("#row1");
			$("<div id='pieChartFailed' class='pie'>").appendTo("#findingsPies");
			$("<div id='pieChartWarning' class='pie'>").appendTo("#findingsPies");
			addPieChart('pieChartFailed', 'Problems', 260, '#fff', groupFailed);
			addPieChart('pieChartWarning', 'Warnings', 260, '#777' ,groupWarning);
			// FIXME: addPieChart('pieChartHosts', 'Warnings', 260, pieGroupHosts);

			$( "<div id='topChangesBox' class='overviewBox'>" ).appendTo( "#row2" )
			$( "<h3>Top Changes</h3><div id='topChanges'></div>").appendTo("#topChangesBox")

			$( "<div id='policies' class='overviewBox'>" ).appendTo( "#row2" )
			$( "<h3>Findings / Changes per Policy</h3><table class='resultTable tablesorter' id='findingsPerPolicy'><thead><tr><th>Group</th><th>Policy</th><th>Problems</th><th>Change</th><th>Warnings</th><th>Change</th></tr></thead><tbody></tbody></table>").appendTo("#policies")

			getData("histogram", function(data) {
				var changes = { 'ok': {}, 'failed': {}, 'warning': {}};
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
							tmp += '<span class="FAILED" title="Total failures found">' + failed + '</span>';
						else
							tmp += '<span title="Total failures found">0</span>';
						tmp += '</td><td class="change">';
						diff = failed - failed2;
						if(diff != 0) {
							tmp += '<span class="'+(diff>0?"FAILED":"compliant")+' changes" filter="'+(diff>0?'new':'solved')+'---' + policy + '" title="Total change problems">+' + Math.abs(diff) + '</span>';
							if(diff > 0) {
								changes['failed'][group+'---'+policy] = Math.abs(diff);
							} else {
								changes['ok'][group+'---'+policy] = Math.abs(diff);
							}
						}
						tmp += '</td><td class="policy" '+pf+'>';
						if(warning > 0)
							tmp += '<span class="WARNING" title="Total warnings seen">' + warning + '</span>';
						else
							tmp += '<span title="Total warnings found">0</span>';
						tmp += '</td><td class="change">';
						diff = warning - warning2;
						if(diff != 0) {
							tmp += '<span class="'+(diff>0?"WARNING":"compliant")+' changes" filter="'+(diff>0?'new':'solved')+'---' + policy + '" title="Total change warnings">+' + Math.abs(diff) + '</span>';
							if(diff > 0) {
								changes['warning'][group+'---'+policy] = Math.abs(diff);
							} else {
								changes['ok'][group+'---'+policy] = Math.abs(diff);
							}
						}
						tmp += '</td>';
						tmp += '</tr>';
						$("#findingsPerPolicy").append(tmp);
					}
				});
				$("#findingsPerPolicy").tablesorter({sortList: [[3,1],[2,1],[5,1],[4,1]]});

				view.addTopChanges(changes, 'failed');
				view.addTopChanges(changes, 'warning');
				view.addTopChanges(changes, 'ok');

				$("#findingsPerPolicy .group").click(function() {
					setLocationHash({
					    fG: $(this).attr('filter'),
   						view: 'results'
					});
				});
				$("#findingsPerPolicy .policy").click(function() {
					var fields = $(this).attr('filter').split(/---/);
					setLocationHash({
						fG: fields[0],
						sT: fields[1],
						view: 'results'
					});
				});
				$("#findingsPerPolicy .change").click(function() {
					var fields = $(this).find('.changes').attr('filter').split(/---/);
					setLocationHash({
						fG: fields[0],
						sT: fields[1],
						view: 'results'
					});
				});
			});
		});
	createHistogram('#row1', 'all');
};
