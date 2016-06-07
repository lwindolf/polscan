// vim: set ts=4 sw=4: 
/* A view visualizing service relations as a directed graph.
   with external IPs being the tree root */

views.ServicemapView = function ServicemapView(parentDiv, params) {
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
		$.each(n.ips, function(i, ip) {
			if(i < 8) {
				if (ip.match(/^(10\.|172\.|192\.)/))
					props.label += "<br/>"+ip;
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
		// FIXME: maybe enable this
		if(l.source === l.target)
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

views.ServicemapView.prototype.addUniqueEdge = function(fields, service, resolvedService) {
	var escaped = service.replace(/ /g, '');
	var escapedT = resolvedService.replace(/ /g, '');
	var ke = fields[5] + "_" + service + "_" + fields[2] + "_" + resolvedService + "_" + fields[4];
	if(!this.uniqueEdges.hasOwnProperty(ke)) {
		this.uniqueEdges[ke] = 1;
		if(fields[5] === 'out')
			this.edges.push({ direction: fields[5], source: escaped, target: escapedT, port: fields[4] });
		else
			this.edges.push({ direction: fields[5], target: escaped, source: escapedT, port: fields[2] });
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
	var host = this.currentNode;
	var d = this.netMapData = {
		nodeToId: [],
		nodes: [],
		links: []
	};

	// get connections for this host
	getData("Network", function(data) {
		var nodeportToProgram = {};
		var portToProgram = new Array();
		$.each(data.results, function(i, item) {
			if(item.policy == "Connections" && (-1 !== filteredHosts.indexOf(item.host))) {
				var connections = item.message.split(/ /);
				for(var c in connections) {
					var fields = connections[c].split(/:/);
					if(fields[5]) {
						var id, port = fields[2], program = fields[0];
						if(program === "-")
							continue;
						if(fields[5] === 'in')
							continue;
						// For now we do not visualize local connections
//						if(fields[1] == fields[3])
//							continue;
						if(!nodeportToProgram.hasOwnProperty(fields[1]+"_"+fields[2])) {
							nodeportToProgram[fields[1]+"_"+fields[2]] = program;
						}
					}
				}
			}
		});

		$.each(data.results, function(i, item) {
			if(item.policy == "Connections" && (-1 !== filteredHosts.indexOf(item.host))) {
				var connections = item.message.split(/ /);
				for(var c in connections) {
					var fields = connections[c].split(/:/);
					if(fields[5]) {
						var port = fields[2], program = fields[0];

						// For now we do not visualize local connections
//						if(fields[1] == fields[3])
//							continue;

						// Resolve program for close-wait, time-wait listings
						if(program !== "-" && !(port in portToProgram))
							portToProgram[port] = program;
						if(program === "-" && (port in portToProgram))
							program = portToProgram[port];

						// Reduce connections to service<->service connections
						if(program === "-")
							continue; 	// displaying unknown procs is just useless

						view.addUniqueService(program, port, 'local');

						var resolvedService = nodeportToProgram[fields[3]+"_"+fields[4]];
						if(resolvedService) {
								view.addUniqueEdge(fields, program, resolvedService);
						} else {
							if(fields[3].match(/^(10\.|172\.|192\.)/)) {
								view.addUniqueService('Unresolved Internal '+fields[5], undefined, 'other', fields[3]);
								view.addUniqueEdge(fields, program, 'Unresolved Internal '+fields[5]);
							} else {
								view.addUniqueService('External '+fields[5], undefined, 'other', fields[3]);
								view.addUniqueEdge(fields, program, 'External '+fields[5]);
							}
						}
					}
				}
			}
		});

		view.updateGraph();
	});
}

views.ServicemapView.prototype.update = function(params) {
	var filteredHosts = get_hosts_filtered(params, true);

	clean();
	$('#results').append('<div id="netmap" style="height:'+$(window).height()+'px;margin-bottom:12px;border:1px solid #aaa;background:white;overflow:auto"/>');
	this.addHosts(filteredHosts);
};
