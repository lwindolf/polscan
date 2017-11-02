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
	this.firstHost = undefined;
}

Network.prototype = Object.create(PolscanView.prototype);

// Result filter method
Network.prototype.resultsFilter = function(item) {
	// Validate input
	if(item.ln === '' || item.ltn === '' || item.rn === '' || item.rtn === '')
		return false;

	if(undefined === this.firstHost)
		this.firstHost = item.host;

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
	view.neType = 'TCP connection';

	if(!("nt" in params) || (params.nt === "")) {
		setLocationHash({
			nt: params.nt?params.nt:'TCP connection'
		});
		return;
	}

	getData("netedge "+this.neType, function(data) {
		view.params = params;
		view.filteredHosts = get_hosts_filtered(params, false);

		var results = data.results.filter(view.resultsFilter, view);
		if(undefined === view.params.h) {
			setLocationHash({h:view.firstHost, nt: params.nt});
			return;
		}

		$(view.parentDiv).append("<div id='render'></div>");
		view.render('#render', { results: results }, view.params);
		view.addInfoBlock('Hosts', view.filteredHosts.length);
		// Maybe add connections info block
	});
};
