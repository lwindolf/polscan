// vim: set ts=4 sw=4: 
// View for displaying finding details by group

function ScanResults() {
	this.name = 'Scan Results';
	this.filterOptions = {
		findings:  true,
		groupbyid: true,
		filterby:  true,
		search:    true,
		copyHosts: true
	}
}

ScanResults.prototype = Object.create(PolscanView.prototype);

ScanResults.prototype.update = function(params) {
	var view = this;

	console.log("Loading results start (group="+params.fG+" search="+params.sT+")");

	if(params.fG) {
		if(!params.gT)
			params.gT = "Domain";	// This usually does exist

		$(this.parentDiv).append('<div id="legend" title="Click to filter a legend item. Hold Ctrl and click to multi-select."><b>Legend</b></div><table id="hostmap" class="resultTable tablesorter"><thead><tr><th>Group</th><th>C</th><th>W</th><th>Nr</th></tr></thead></table><div id="selectedGroup"/>');
	} else {
        params.fG = 'new';
		setLocationHash(params);
	}

	getData(params.fG, function(data) {
		view.failed = 0;
		view.warning = 0;
		view.hostCount = 0;
		view.params = params;
		view.filteredHosts = get_hosts_filtered(params, false);

		$(view.parentDiv).append("<div id='histogramRow'/><div id='tableRow'/>");

/*
		if(!params.gI)
			createResultTable('#tableRow', data.results);
		else
			createGroupTable('#tableRow', data.results);
*/
		view.addInfoBlock('Hosts',    view.hostCount);
		view.addInfoBlock('Failed',   view.failed);
		view.addInfoBlock('Warnings', view.warning);
		view.addRenderers(['table', 'hostmap', 'treemap'], 'table');

		// FIXME: view.addHistogram
		createHistogram('#histogramRow', params.fG, params.sT);
	});
};
