// vim: set ts=4 sw=4: 
/* A view visualizing distribution of inventory over host groups.
   Represents inventory type items as color coded bars inside
   host boxes. Suitable for mapping out inventory where each
   host has less than 5 findings */

views.InventoryView = function InventoryView(parentDiv, params) {
	this.parentDiv = parentDiv;
	this.filterOptions = {
		inventory: true,
		groupbyhg: true,
		filterby: true,
		search: true
	};
	this.legendColorIndex = {};
	this.legendSelection = [];
};

/* Smart legend sorting by trying to extract leading float
   numbers (e.g. versions) from legend string. Falls back
   to string sort if extraction fails. */
views.InventoryView.prototype.legendSort = function(a, b) {
	var aNr = a.match(/^(\d+(\.\d+)?)/);
	var bNr = b.match(/^(\d+(\.\d+)?)/);

	if(aNr == null || bNr == null)
		return a>b;

	return aNr[1] - bNr[1];
}

views.InventoryView.prototype.selectLegendItem = function(e) {
	var view = e.data;
    var li;
	$.each(e.target.className.split(/\s+/), function(i, item) {
			if(item.indexOf("legendIndex") == 0)
				li = item.substring(11);
	});
	if(!li) {
		console.log("Error: could not find legend index!");
		return;
	}

	if (!e.ctrlKey)
		view.legendSelection = [];
	view.legendSelection.push(li);

	// Hide all
	$('#inventoryMap div.hostMapBox').hide();
	$('#legend .legendItem').css('background', '#ccc');

	// Selectively show stuff
	$.each(view.legendSelection, function(i, li) {
		$('#legend .legendIndex'+li).css("background", color(li));
		$('#inventoryMap div.hostMapBox td.legendIndex'+li).show();
		$('#inventoryMap div.hostMapBox td.legendIndex'+li).parents().show();
	});
	$('#inventoryMap tr.hostMapGroup').each(function() {
		console.log("row visible count=");
		if($(this).find('table:visible').length == 0)
			$(this).hide();
		else
			$(this).children().show();
	});
}

views.InventoryView.prototype.update = function(params) {
	if(params.iT === undefined) {
		params.iT = 'Network active TCP services';
		setLocationHash(params);
		return;
	}
	if(!params.gT)
		params.gT = "Primary-Network";

	clean();
	$(this.parentDiv).append('<div id="legend" title="Click to filter a legend item. Hold Ctrl and click to multi-select."><b>Legend</b></div><table id="inventoryMap" class="resultTable tablesorter"><thead><tr><th>Group</th><th>Results</th></tr></thead></table>');

	var filteredHosts = get_hosts_filtered(params, true)
	var view = this;

	getData("inventory "+params.iT, function(data) {
			var legend = [];
			var pcolor = [];

			$.each(data.results, function (i, f) {
					if(-1 == filteredHosts.indexOf(f.host))
						return;

					var values = f.values.split(/ /).filter(function(i) {
						return i != '';
					});

					// Update legend
					$.each(values, function(i, c) {
						if(-1 !== legend.indexOf(c))
							return;
						view.legendColorIndex[c] = legend.length;
						legend.push(c);
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
							content += "<td style='border:0;padding:1px;height:10px' class='legendIndex"+view.legendColorIndex[values[p]]+"'></td>";
						content += "</tr></table>";
					}
					content = "<div class='hostMapBox KNOWN' title='"+f.host+" "+(values.length > 0?values.join(","):"")+"' onclick='setLocationHash({view:\"netmap\",h:\""+f.host+"\"});'>" + content + "</div>";
					$('#' + groupClassName + ' .boxes').append(content);
			});

			// Determine which palette to use (shaded for numeric values)
			// and high contrast for non-numeric values
			var numeric = 1;
			for(var l in legend) {
				if(!legend[l].match(/^[0-9]+$/))
					numeric = 0;
			}

			// Create colors for numeric legend by title
			// and for non-numeric legends by index
			var sortedLegend = legend.sort(view.legendSort);
			var lastElem = sortedLegend[sortedLegend.length-1];
			for(var l in sortedLegend) {
				var name = legend[l];
				$('#legend').append("<span class='legendItem legendIndex"+view.legendColorIndex[name]+"' title='"+name+"'>"+name+"</span>");
				if(numeric) {
						if(0 != name)
							$('.legendIndex'+view.legendColorIndex[name]).css("background", "rgb("+Math.ceil(153-(153*name/lastElem))+", "+Math.ceil(255-(255*name/lastElem))+", 102)");
						else
							$('.legendIndex'+view.legendColorIndex[name]).css("background", "white");
				} else {
					$('.legendIndex'+view.legendColorIndex[name]).css("background", color(view.legendColorIndex[name]));
				}
			}

			$("#inventoryMap").tablesorter({sortList: [[0,0]]});
			$("#legend .legendItem").on("click", view, view.selectLegendItem);
	});
};
