// vim: set ts=4 sw=4: 
/* A view visualizing distribution of inventory over host groups.
   Represents inventory type items as color coded bars inside
   host boxes. Suitable for mapping out inventory where each
   host has less than 5 findings */

function Inventory() {
	this.name = 'Inventory';
	this.renderers = ['itable', 'hostmap', 'treemap'];
	this.defaultRenderer = 'hostmap';
	this.filterOptions = {
		inventory: true,
		groupbyhg: true,
		filterby: true,
		search: true,
		copyHosts: true
	};
	this.legendColorIndex;
	this.legendSelection;
};

Inventory.prototype = Object.create(PolscanView.prototype);

// Result filter method
Inventory.prototype.resultsFilter = function(item) {
	if(this.filteredHosts !== undefined &&
           -1 == this.filteredHosts.indexOf(item.host))
		return false;
	return true;
}

/* Smart legend sorting by trying to extract leading float
   numbers (e.g. versions) from legend string. Falls back
   to string sort if extraction fails. */
Inventory.prototype.legendSort = function(a, b) {
	var aNr = a.match(/^(\d+(\.\d+)?)/);
	var bNr = b.match(/^(\d+(\.\d+)?)/);

	if(aNr == null || bNr == null)
		return a>b;

	return aNr[1] - bNr[1];
}

Inventory.prototype.selectLegendItem = function(e) {
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
}

// Provide a menu of all inventories
Inventory.prototype.inventory_list = function() {
	$(this.parentDiv).append('<div id="group_list"/>');
	getData("overview", function(data) {
		$.each(data.overview.sort(function(a,b) {
			if(!a.inventory || !b.inventory)
				return 0;
			return a.inventory.localeCompare(b.inventory);
		}), function(i, d) {
			if(!d.inventory)
				return;
			$('#group_list').append(render('inventory_list_item', d));
		});
	});
}

Inventory.prototype.addLegend = function(results) {
	var view = this;
	var legendCount = {};
	var legend = [];
	var pcolor = [];

	$.each(results, function (i, f) {
			var values = f.values.split(/ /).filter(function(i) {
				return i != '';
			});

			// Update legend
			$.each(values, function(i, c) {
				if(undefined === legendCount[c])
					legendCount[c] = 0;
				legendCount[c]++;

				if(-1 !== legend.indexOf(c))
					return;
				view.legendColorIndex[c] = legend.length;
				legend.push(c);
			});
	});

console.log(legendCount);
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
		$('#legend').append("<span class='legendItem legendIndex"+view.legendColorIndex[name]+"' title='"+name+"'>"+name+" ("+legendCount[name]+")</span>");
		if(numeric) {
				if(0 != name)
					$('.legendIndex'+view.legendColorIndex[name]).css("background", "rgb("+Math.ceil(153-(153*name/lastElem))+", "+Math.ceil(255-(255*name/lastElem))+", 102)");
				else
					$('.legendIndex'+view.legendColorIndex[name]).css("background", "white");
		} else {
	        $('#legend .legendIndex'+view.legendColorIndex[name]).css("border-left", "16px solid "+color(view.legendColorIndex[name]));
		}
	}

	$("#legend .legendItem").on("click", view, view.selectLegendItem);
}

Inventory.prototype.update = function(params) {
	var view = this;

	if(!params.iT) {
		params.iT = $('#inventoryType').val();
		setLocationHash(params);
	}
	if(!params.gT) {
		params.gT = "Domain";
		setLocationHash(params);
	}

	getData("inventory "+params.iT, function(data) {
		view.filteredHosts = get_hosts_filtered(params, true);
		view.legendColorIndex = {};
		view.legendSelection = [];

		$(view.parentDiv).append("<div class='split split-horizontal' id='render'/>");
		$(view.parentDiv).append('<div class="split split-horizontal" id="legend" title="Click to filter a legend item. Hold Ctrl and click to multi-select."><b>Legend</b></div>');
		Split(['#render', '#legend'], {
			sizes: [75, 25],
			minSize: [200, 200]
		});

		var results = data.results.filter(view.resultsFilter, view);
		view.addLegend(results);
		view.render('#render', {
			results: results,
			legend: {
				type      : 'color',
				colors    : view.legendColorIndex,
				selection : view.legendSelection
			}
		}, params);
		view.addInfoBlock('Hosts',    view.filteredHosts.length);
	});
};
