// vim: set ts=4 sw=4: 
/* A view visualizing service relations as a directed graph.
   with external IPs being the tree root */

views.ServicemapView = function ServicemapView(parentDiv) {
	this.parentDiv = parentDiv;
	this.filterOptions = {
                filterby: true,
                search: true
	};
	this.edges = [];
	this.services = {};
	this.uniqueEdges = {};
};

views.ServicemapView.prototype.updateGraph = function() {
	var width = $('#netmap').width();
	var height = $('#netmap').height();
    var svg = d3.select("#netmap").append("svg")
        .attr("width", width)
        .attr("height", height);


	var nodeArea = svg.append('g').classed('node-area', true);

	var g = new dagreD3.graphlib.Graph()
				.setGraph({ "rankdir": "LR", "ranksep": 75, "nodesep": 12, "marginx": 20, "marginy": 20, "align": "DL" })
				.setDefaultEdgeLabel(function() { return {}; });

	$.each(this.services, function(i, n) {
		var props = { "label": n.service, "labelType": "html", "class": n.class };
		$.each($.unique(n.ips), function(i, ip) {
			if(i < 8) {
				if (ip.match(/^(10\.|172\.|192\.)/))
					props.label += "<br/>"+resolveIp(ip);
				else
					props.label += '<br/><a class="resolve" href="javascript:lookupIp(\''+ip+'\')" title="Click to resolve IP">'+ip+"</a> ";
			}

			if(i == 8)
				props.label += "<br/><span style='color:#444; font-size:small'>("+(n.ips.length - 8)+" more ...)</span>";
		});
		g.setNode(i, props);
	});

	$.each(this.edges, function(i, l) {
		if(l.source === undefined || l.target === undefined)
			return;
		var props = { lineInterpolate: 'basis' };
		if("high" !== l.port)
			props.label = l.port;
		g.setEdge(l.source, l.target, props);
	});

	var render = new dagreD3.render();
	render(nodeArea, g);

	var xCenterOffset = (svg.attr("width") - g.graph().width) / 2;
	svg.attr("height", g.graph().height + 40);
}

views.ServicemapView.prototype.addUniqueEdge = function(e, service, resolvedService) {
	var escaped = service.replace(/ /g, '');
	var escapedT = resolvedService.replace(/ /g, '');
	var ke = e.dir + "_" + service + "_" + e.rn + "_" + resolvedService + "_" + e.rtn;
	if(!this.uniqueEdges.hasOwnProperty(ke)) {
		this.uniqueEdges[ke] = 1;
		if(e.dir === 'out')
			this.edges.push({ direction: e.dir, source: escaped, target: escapedT, port: e.rtn });
		else
			this.edges.push({ direction: e.dir, target: escaped, source: escapedT, port: e.ltn });
	}
}

views.ServicemapView.prototype.addUniqueService = function(program, port, c, ip) {
	// FIXME: really safe hash keys!
	var escaped = program.replace(/ /g, '');
	if(!this.services.hasOwnProperty(escaped))
		this.services[escaped] = { "service": program, "port": port, "class": c, "ips": [] };

	if(ip)
		this.services[escaped]['ips'].push(ip);
}

views.ServicemapView.prototype.addHosts = function(filteredHosts) {
	var view = this;
	this.edges = [];
	this.services = {};
	this.uniqueEdges = {};

	// get connections for this host
	getData("netedge TCP connection", function(data) {
		var nodeportToProgram = {};
		var portToProgram = new Array();
		$.each(data.results, function(i, item) {
			if(undefined === filteredHosts ||
			   -1 !== filteredHosts.indexOf(item.host)) {
				var id, port = item.ltn, program = item.scope;
				if(program === "-")
					return;
				if(item.dir === 'in')
					return;
				if(!nodeportToProgram.hasOwnProperty(item.ln+"_"+item.ltn)) {
					nodeportToProgram[item.ln+"_"+item.ltn] = program;
				}
			}
		});

		$.each(data.results, function(i, item) {
			if(undefined === filteredHosts ||
			   -1 !== filteredHosts.indexOf(item.host)) {
				var port = item.ltn, program = item.scope;

				// Resolve program for close-wait, time-wait listings
				if(program !== "-" && !(port in portToProgram))
					portToProgram[port] = program;
				if(program === "-" && (port in portToProgram))
					program = portToProgram[port];

				// Reduce connections to service<->service connections
				if(program === "-")
					return; 	// displaying unknown procs is just useless

				view.addUniqueService(program, port, 'local');

				var resolvedService = nodeportToProgram[item.rn+"_"+item.rtn];
				if(resolvedService) {
						view.addUniqueEdge(item, program, resolvedService);
				} else {
				    // FIXME: private net match
					if(item.rn.match(/^(10\.|172\.|192\.)/)) {
						view.addUniqueService('Internal '+item.dir, undefined, 'other', item.rn);
						view.addUniqueEdge(item, program, 'Internal '+item.dir);
					} else {
						view.addUniqueService('External '+item.dir, undefined, 'other', item.rn);
						view.addUniqueEdge(item, program, 'External '+item.dir);
					}
				}
			}
		});

		view.updateGraph();
		if(isLive())
			overlayMonitoring(undefined, undefined, false);
	});
}

views.ServicemapView.prototype.update = function(params) {
	var filteredHosts = get_hosts_filtered(params, true);

	clean();
	$('#results').append('<div id="netmap" style="height:'+$(window).height()+'px;margin-bottom:12px;border:1px solid #aaa;background:white;overflow:auto"/>');
	this.addHosts(filteredHosts);
};
