// vim: set ts=4 sw=4: 
// View for displaying network topologies based on edge types

function Network() {
	this.name = 'Network';
	this.renderers = ['netrad', 'netmap'];
	this.defaultRenderer = 'netmap';
	this.filterOptions = {
		host: true,
		nt: true
	};
}

Network.prototype = Object.create(PolscanView.prototype);

// Result filter method
Network.prototype.resultsFilter = function(item) {
	// Validate input
	if(item.ln === '' || item.ltn === '' || item.rn === '' || item.rtn === '')
		return false;

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
};

Network.prototype.update = function(params) {
	var view = this;
	view.neType = 'TCP connection'

	getData("netedge "+this.neType, function(data) {
		view.failed = 0;
		view.warning = 0;
		view.hostCount = 0;
		view.params = params;
		view.filteredHosts = get_hosts_filtered(params, false);

		$(view.parentDiv).append("<div id='render'></div>");

		var results = data.results.filter(view.resultsFilter, view);
		view.render('#render', { results: results }, view.params);
		view.addInfoBlock('Hosts',    view.filteredHosts.length);
		// Maybe add connections info block
	});
};
