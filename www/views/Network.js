// vim: set ts=4 sw=4: 
// View for displaying network topologies based on edge types

function Network() {
	this.name = 'Network';
	this.renderers = ['netrad', 'netmap', 'netgraph'];
	this.defaultRenderer = 'netrad';
	this.firstHost = undefined;

	var params = getParams();
	if('netmap' === params.r) {
		this.filterOptions = {
			host: true,
			nt: true
		};
	}
	if('netrad' === params.r) {
		this.filterOptions = {
			filterby: true,
			search: true,
			nt: true
		};
	}
	if('netgraph' === params.r) {
		this.filterOptions = {
			filterby: true,
			groupbyhg: true,
			search: true,
			nt: true
		};
	}
}

Network.prototype = Object.create(PolscanView.prototype);

// Result filter method
Network.prototype.resultsFilter = function(item) {
	// Validate input
	if(item.ln === '' || item.ltn === '' || item.rn === '' || item.rtn === '')
		return false;

	if(undefined === this.firstHost)
		this.firstHost = item.host;

	if(this.params.sT && !(item.host.indexOf(this.params.sT) != -1))
		return false;

	if(this.filteredHosts !== undefined &&
           -1 == this.filteredHosts.indexOf(item.host))
		return false;
	return true;
};

Network.prototype.update = function(params) {
	var view = this;

	if(!("nt" in params) || (params.nt === "")) {
		changeLocationHash({
			nt: params.nt?params.nt:'TCP connection'
		});
		return;
	}
	if(params.r === 'netmap' && undefined === params.h) {
		setLocationHash({h:view.firstHost, nt: params.nt});
		return;
	}

	getData("netedge "+params.nt, function(data) {
		view.params = params;
		view.filteredHosts = get_hosts_filtered(params, false);

		var results = data.results.filter(view.resultsFilter, view);

		$(view.parentDiv).append("<div id='legend'/>"+
		                         "<div id='render'/>");

		$('#render').addClass("split split-horizontal");
		$('#legend').addClass("split split-horizontal");
		Split(['#legend', '#render'], {
			sizes: [20, 80],
			minSize: [200, 200]
		});

		view.render('#render', { results: results }, view.params);
		if(params.r !== 'netmap')
			view.addInfoBlock('Hosts', view.filteredHosts.length);
		// Maybe add connections info block
	});
};
