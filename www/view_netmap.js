// vim: set ts=4 sw=4: 
/* A view visualizing distribution of inventory over host groups.
   Represents inventory type items as color coded bars inside
   host boxes. Suitable for mapping out inventory where each
   host has less than 5 findings */

// FIXME: refactor name "netmap"
views.NetmapView = function NetmapView(parentDiv, params) {
	this.parentDiv = parentDiv;
};

/* Smart legend sorting by trying to extract leading float
   numbers (e.g. versions) from legend string. Falls back
   to string sort if extraction fails. */
function legendSort(a, b) {
	var aNr = a.match(/^(\d+(\.\d+)?)/);
	var bNr = b.match(/^(\d+(\.\d+)?)/);

	if(aNr == null || bNr == null)
		return a>b;

	return aNr[1] - bNr[1];
}

views.NetmapView.prototype.update = function(params) {
	if(params.iT === undefined) {
		params.iT = 'Network active TCP services';
		setLocationHash(params);
		return;
	}
	if(!params.gT)
		params.gT = "Primary-Network";

	var filteredHosts = get_hosts_filtered(params)

		$('.overviewBox').append('<div id="legend"><b>Legend</b></div><table id="inventoryMap" class="resultTable tablesorter"><thead><tr><th>Group</th><th>Results</th></tr></thead></table>');

	getData("inventory "+params.iT, function(data) {
			var pcolor = [];
			var legend = [];

			$.each(data.results, function (i, f) {
					if(-1 == filteredHosts.indexOf(f.host))
						return;

					var values = f.values.split(/ /).filter(function(i) {
						return i != '';
					});

					// Update legend
					$.each(values, function(i, c) {
						if(!pcolor[c]) {
							pcolor[c] = color(Object.keys(pcolor).length);
							legend.push(c);
						}
					});

					// Add host to group
					var groupName = getGroupByHost(params.gT, f.host);
					var groupClassName = groupName.replace(/[\.#\/]/g, "_");
					if($('#inventoryMap').find('#'+groupClassName).length == 0)
						$('#inventoryMap').append('<tr class="hostMapGroup" id="'+groupClassName+'"><td><span class="groupName">'+groupName+'</span></td><td><span class="boxes"/></td></tr>');

					var content = '';
					if(values.length > 0) {
						content += "<table style='border:0' cellspacing='0' cellpadding='1px' width='100%'><tr>";
						for(var p in values)
							content += "<td style='border:0;padding:1px;height:10px;background:"+pcolor[values[p]]+"'></td>";;
						content += "</tr></table>";
					}
					content = "<div class='hostMapBox KNOWN' title='"+f.host+" "+(values.length > 0?values.join(","):"")+"' onclick='setLocationHash({view:\"netmap\",h:\""+f.host+"\"});'>" + content + "</div>";
					$('#' + groupClassName + ' .boxes').append(content);
			});

			for(var l in legend.sort(legendSort)) {
				var c = legend[l];
				$('#legend').append("<span class='legendItem' title='"+c+"' style='background:"+pcolor[c]+"'>"+c+"</span>");
			}

			$("#netBlockList").tablesorter({sortList: [[0,1]]});
	});
};
