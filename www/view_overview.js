// vim: set ts=4 sw=4: 
// The overview...

views.OverviewView = function OverviewView(parentDiv, params) {
	this.parentDiv = parentDiv;
};

views.OverviewView.prototype.update = function(params) {
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

			$( "<div id='policies' class='overviewBox'>" ).appendTo( "#row2" )
			$( "<h3>Findings / Changes per Policy</h3><table class='resultTable tablesorter' id='findingsPerPolicy'><thead><tr><th>Group</th><th>Policy</th><th>Problems</th><th>Change</th><th>Warnings</th><th>Change</th></tr></thead><tbody></tbody></table>").appendTo("#policies")

			getData("histogram", function(data) {
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
						var tmp = '<tr><td class="group" title="'+item.description+'" filter="' + group + '">' + group + '</td><td class="policy" filter="' + group + '---' + policy + '">' + (policy?policy:"") + '</td>';
						tmp += '<td>';
						if(failed > 0)
							tmp += '<span class="FAILED" title="Total failures found">' + failed + '</span>';
						else
							tmp += '<span title="Total failures found">0</span>';
						tmp += '</td><td class="change">';
						diff = failed - failed2;
						if(diff != 0)
							tmp += '<span class="'+(diff>0?"FAILED":"compliant")+' changes" filter="'+(diff>0?'new':'solved')+'---' + policy + '" title="Total change problems">+' + Math.abs(diff) + '</span>';
						tmp += '</td><td>';
						if(warning > 0)
							tmp += '<span class="WARNING" title="Total warnings seen">' + warning + '</span>';
						else
							tmp += '<span title="Total warnings found">0</span>';
						tmp += '</td><td class="change">';
						diff = warning - warning2;
						if(diff != 0)
							tmp += '<span class="'+(diff>0?"WARNING":"compliant")+' changes" filter="'+(diff>0?'new':'solved')+'---' + policy + '" title="Total change warnings">+' + Math.abs(diff) + '</span>';
						tmp += '</td>';
						tmp += '</tr>';
						$("#findingsPerPolicy").append(tmp);
					}
				});
				$("#findingsPerPolicy").tablesorter({sortList: [[3,1],[2,1],[5,1],[4,1]]});

				$("#findingsPerPolicy .group").click(function() {
					setLocationHash({ fG: $(this).attr('filter') });
				});
				$("#findingsPerPolicy .policy").click(function() {
					var fields = $(this).attr('filter').split(/---/);
					setLocationHash({
						fG: fields[0],
						sT: fields[1]
					});
				});
				$("#findingsPerPolicy .change").click(function() {
					var fields = $(this).find('.changes').attr('filter').split(/---/);
					setLocationHash({
						fG: fields[0],
						sT: fields[1]
					});
				});
			});
		});
	createHistogram('#row1', 'all');
};
