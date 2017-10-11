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

		$(view.parentDiv).append("<div id='histogramRow'/><div id='tableRow'/>");

		view.addRenderers(['table', 'hostmap', 'treemap'], 'table');

		var results = data.results.filter(view.resultsFilter, view)
		view.render('#tableRow', results, view.params);

		$.each(results, function(i, item) {
			if('FAILED' == item.severity)
				view.failed++;
			if('WARNING' == item.severity)
				view.warning++;
		});
		view.addInfoBlock('Hosts',    view.filteredHosts.length);
		view.addInfoBlock('Failed',   view.failed);
		view.addInfoBlock('Warnings', view.warning);

		// FIXME: view.addHistogram
		createHistogram('#histogramRow', params.fG, params.sT);
	});
};
