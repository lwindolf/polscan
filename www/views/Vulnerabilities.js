// vim: set ts=4 sw=4: 
// View for displaying vulnerabilities in a sortable table

function Vulnerabilities() {
	this.name = 'Vulnerabilities';
	this.filterOptions = {
		filterby: true,
		search: true
	};
}

Vulnerabilities.prototype = Object.create(PolscanView.prototype);

Vulnerabilities.prototype.vulnFilter = function(item) {
	if(this.params.sT &&
	  !((undefined !== item.host && item.host.indexOf(this.params.sT) != -1) ||
	    (undefined !== item.pkg  &&  item.pkg.indexOf(this.params.sT) != -1)))
		return false;
	if(undefined !== this.filteredHosts &&
       -1 == this.filteredHosts.indexOf(item.host))
		return false;
	return true;
}

Vulnerabilities.prototype.update = function(params) {
	var view = this;
	view.params = params;

	getData("vulnerabilities", function(data) {
		view.filteredHosts = get_hosts_filtered(params, false);
		var cves = {};
		var packages = {};
		var hosts = {}
		var values = new Array(1000);
		view.hosts = {};

		var results = data.results.filter(view.vulnFilter, view)
		$.each(results, function(i, item) {
	        var key = item.cve+"___"+item.pkg;
			if(values[key] === undefined)
				values[key] = item;
			if(view.hosts[key] === undefined)
				view.hosts[key] = new Array();
			view.hosts[key].push(item.host);
			packages[item.pkg] = 1;
			cves[item.cve] = 1;
			hosts[item.host] = 1;
		});

		view.addRenderers(['vtable', 'treemap'], 'vtable');

		view.addInfoBlock('Hosts', Object.keys(hosts).length);
		view.addInfoBlock('Vulnerabilities', Object.keys(view.hosts).length);
		view.addInfoBlock('Packages', Object.keys(packages).length);
		view.addInfoBlock('CVEs', Object.keys(cves).length);

		$(view.parentDiv).append("<div id='tableRow' width='100%'/>");
		view.render('#tableRow', results, view.params);
	});
};
