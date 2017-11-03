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
	this.legend = {
		colorIndex  : {},
        multiSelect : false     // maybe this should be true for heatmaps
	};
}

Inventory.prototype = Object.create(PolscanView.prototype);

// Result filter method
Inventory.prototype.resultsFilter = function(item) {
	if(this.filteredHosts !== undefined &&
           -1 == this.filteredHosts.indexOf(item.host))
		return false;
	return true;
};

/* Smart legend sorting by trying to extract leading float
   numbers (e.g. versions) from legend string. Falls back
   to string sort if extraction fails. */
Inventory.prototype.legendSort = function(a, b) {
	var aNr = a.match(/^(\d+(\.\d+)?)/);
	var bNr = b.match(/^(\d+(\.\d+)?)/);

	if(aNr == null || bNr == null)
		return a>b;

	return aNr[1] - bNr[1];
};

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
				view.legend.colorIndex[c] = legend.length;
				legend.push(c);
			});
	});

	// Determine which palette to use (shaded for numeric values)
	// and high contrast for non-numeric values
	var numeric = 1;
	for(var l in legend) {
		if(!legend[l].match(/^[0-9]+$/))
			numeric = 0;
	}
	
	if(numeric)
	    view.legend.colors = [];

	// Create colors for numeric legend by title
	// and for non-numeric legends by index
	var sortedLegend = legend.sort(view.legendSort);
	var lastElem = sortedLegend[sortedLegend.length-1];
	for(l in sortedLegend) {
		var name = legend[l];
		var colorIndex;
		if(numeric) {
	        // Create ad-hoc gradient
			if(0 != name)
		        view.legend.colors[colorIndex] = "rgb("+Math.ceil(153-(153*name/lastElem))+", "+Math.ceil(255-(255*name/lastElem))+", 102)";
			else
				view.legend.colors[colorIndex] = "white";
	        colorIndex = view.legend.colorIndex[name];
		} else {
	        colorIndex = view.legend.colorIndex[name];
		}
		view.addLegendItem(name, legendCount[name], colorIndex);
	}

	$("#legend .legendItem").on("click", view, view.selectLegendItem);
};

Inventory.prototype.update = function(params) {
	var view = this;

	if(!params.iT) {
		params.iT = getInventoryTypes()[0];
		setLocationHash(params);
		return;
	}
	if(!params.gT) {
		params.gT = "Domain";
		setLocationHash(params);
		return;
	}

	getData("inventory "+params.iT, function(data) {
		view.filteredHosts = get_hosts_filtered(params, true);

		$(view.parentDiv).append('<div class="split split-horizontal" id="legend" title="Click to filter a legend item. Hold Ctrl and click to multi-select."><b>Legend</b></div>');
		$(view.parentDiv).append("<div class='split split-horizontal' id='render'/>");
		Split(['#render', '#legend'], {
			sizes: [75, 25],
			minSize: [200, 200]
		});

		var results = data.results.filter(view.resultsFilter, view);
		view.addLegend(results);
		view.render('#render', {
			results : results,
			legend  : view.legend
		}, params);
		view.addInfoBlock('Hosts',    view.filteredHosts.length);
	});
};
