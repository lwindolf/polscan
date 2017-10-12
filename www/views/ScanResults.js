// vim: set ts=4 sw=4: 
// View for displaying finding details by group

function ScanResults() {
	this.name = 'Scan Results';
	this.renderers = ['table', 'hostmap', 'treemap'];
	this.defaultRenderer = 'table';
	this.filterOptions = {
		findings:  true,
		groupbyid: true,
		filterby:  true,
		search:    true,
		copyHosts: true
	}
}

ScanResults.prototype = Object.create(PolscanView.prototype);

// Result filter method
ScanResults.prototype.resultsFilter = function(item) {
	if(this.params.gI !== undefined && item.message.indexOf(this.params.gI) == -1)
		return false;
	if(this.params.sT !== undefined && item.severity == 'OK')
		return false;

	if(this.params.sT &&
	  !((   item.host.indexOf(this.params.sT) != -1) ||
	    ( item.policy.indexOf(this.params.sT) != -1) ||
	    (item.message.indexOf(this.params.sT) != -1)))
		return false;

	if(this.filteredHosts !== undefined &&
           -1 == this.filteredHosts.indexOf(item.host))
		return false;
	return true;
}

ScanResults.prototype.addLegend = function(results) {
	view.topFindings = {};
	view.legendColorIndex = {};
	view.legendSelection = [];

	$.each(results, function(i, item) {
		if('OK' === item.severity)
			return;
		if('FAILED' == item.severity)
			view.failed++;
		if('WARNING' == item.severity)
			view.warning++;

		// Legend counting
		var topKey = item.severity+":::"+(item.group?item.group:data.group)+':::'+item.policy;
		if(undefined === view.topFindings[topKey]) {
			var i = Object.keys(view.topFindings).length;
			view.legendColorIndex[i] = i;
			view.topFindings[topKey] = 0;
		}
		view.topFindings[topKey]++;
	});

	// Create colors for numeric legend by title
	// and for non-numeric legends by index
	var numeric = 0;
	var lastElem = view.topFindings[view.topFindings.length-1];
	var i = 0;
	Object.keys(view.topFindings).sort(function(a,b) {
		if((-1 !== a.indexOf('FAILED')  && -1 !== b.indexOf('FAILED')) || 
		   (-1 !== a.indexOf('WARNING') && -1 !== b.indexOf('WARNING')))
			return view.topFindings[b] - view.topFindings[a];
		if(-1 !== a.indexOf('FAILED'))
			return -1;
		return 1;
	}).forEach(function(name) {
	    var count = view.topFindings[name];
		var tmp = name.split(/:::/);
		var colorClass = tmp[0];
	    $('#legend').append("<span class='legendItem legendIndex"+i+"' title='"+tmp[1]+" - "+tmp[2]+"'>"+tmp[1]+' - '+tmp[2]+" ("+count+")</span>");
	    $('.legendIndex'+i).addClass(colorClass);
		i++;
	});
}

ScanResults.prototype.update = function(params) {
	var view = this;

	if(!params.fG)
        params.fG = 'new';
	if(!params.gT)
		params.gT = "Domain";	// This usually does exist

	getData(params.fG, function(data) {
		view.failed = 0;
		view.warning = 0;
		view.hostCount = 0;
		view.params = params;
		view.filteredHosts = get_hosts_filtered(params, false);

		$(view.parentDiv).append("<div class='split split-horizontal' id='render'><div id='histogramRow'/><div id='tableRow'/></div>");
		$(view.parentDiv).append('<div class="split split-horizontal" id="legend" title="Click to filter a legend item. Hold Ctrl and click to multi-select."><b>Legend</b></div>');
		Split(['#render', '#legend'], {
			sizes: [75, 25],
			minSize: [200, 200]
		});

		var results = data.results.filter(view.resultsFilter, view)
		view.render('#tableRow', results, view.params);
		view.addLegend(results);

		view.addInfoBlock('Hosts',    view.filteredHosts.length);
		view.addInfoBlock('Failed',   view.failed);
		view.addInfoBlock('Warnings', view.warning);

		// FIXME: view.addHistogram
		createHistogram('#histogramRow', params.fG, params.sT);
	});
};
