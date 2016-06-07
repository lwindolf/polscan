// vim: set ts=4 sw=4: 
/* A view visualizing service relations as a directed graph.
   with external IPs being the tree root */

views.ServicemapView = function ServicemapView(parentDiv, params) {
	this.parentDiv = parentDiv;
	this.filterOptions = {
                filterby: true,
                search: true
	};
	this.netMapData = {};
};

views.ServicemapView.prototype.updateGraph = function(services, connections) {
	var nid = {};
	var width = $('#netmap').width();
	var height = $('#netmap').height();
    var svg = d3.select("#netmap").append("svg")
        .attr("width", width)
        .attr("height", height);


	var nodeArea = svg.append('g').classed('node-area', true);

	var g = new dagreD3.graphlib.Graph()
				.setGraph({ "rankdir": "LR", "ranksep": 75, "nodesep": 12, "marginx": 20, "marginy": 20, "align": "DL" })
				.setDefaultEdgeLabel(function() { return {}; });

	$.each(services, function(i, n) {
		if(n.service in nid)
			return;
		if(n.used === 0)
			return;

		var props = { "label": n.service, "labelType": "html", "class": n.class };
		g.setNode(i, props);
		nid[n.service] = i;
	});

	$.each(connections, function(i, l) {
		if(l.source === undefined || l.target === undefined)
			return;
		if(l.source === l.target)
			return;
		console.log("connections.push("+JSON.stringify(l));
		var props = { lineInterpolate: 'basis' };
		if("high" !== l.port)
			props.label = l.port;
		g.setEdge(nid[l.source], nid[l.target], props);
	});

	var render = new dagreD3.render();
	render(nodeArea, g);

	var xCenterOffset = (svg.attr("width") - g.graph().width) / 2;
	svg.attr("height", g.graph().height + 40);
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
		var services = {};
		var edges = [];
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
						if(fields[1] == fields[3])
							continue;
						if(!nodeportToProgram.hasOwnProperty(fields[1]+"_"+fields[2])) {
							nodeportToProgram[fields[1]+"_"+fields[2]] = program;
						}
					}
				}
			}
		});

		$.each(data.results, function(i, item) {
			var cunique = {};
			var count = 0;
			if(item.policy == "Connections" && (-1 !== filteredHosts.indexOf(item.host))) {
				var connections = item.message.split(/ /);
				for(var c in connections) {
					var fields = connections[c].split(/:/);
					if(fields[5]) {
						var id, port = fields[2], program = fields[0];

						// For now we do not visualize local connections
						if(fields[1] == fields[3])
							continue;

						// Resolve program for close-wait, time-wait listings
						if(program !== "-" && !(port in portToProgram))
							portToProgram[port] = program;
						if(program === "-" && (port in portToProgram))
							program = portToProgram[port];

						// Reduce connections to service<->service connections
						id = program+":::"+port;
						var s;
						if(program !== "-")
							s = program;
						else
							continue; 	// displaying unknown procs is just useless
						if(!services.hasOwnProperty(id))
							services[id] = { service: s, "port": port, "class": "local" };
//						else if (!name.match(/^(10\.|172\.|192\.)/))

						var resolvedService = nodeportToProgram[fields[3]+"_"+fields[4]];
						if(resolvedService) {
							if(fields[5] === 'out') {
								ke = 'out'+s+'_'+resolvedService+'_'+fields[4];
								e = { source: s, target: resolvedService, port: fields[4] };
							} else {
								ke = 'in'+s+'_'+resolvedService+'_'+port;
								e = { target: s, source: resolvedService, port: port };
							}
							if(!cunique.hasOwnProperty(ke)) {
								cunique[ke] = 1;
								edges.push(e);
								count++;
console.log("Adding "+ke+" ("+count+"/250)");
							} else {
//console.log("Skipping "+e+" ("+count+"/250)");
}
						} else {
//							console.log("unresolved: "+fields[3]+":"+fields[4]);
						}
					}
				}
				if(count > 250)
					return;
			}
		});

		view.updateGraph(services, edges);
	});
}

views.ServicemapView.prototype.update = function(params) {
	var filteredHosts = get_hosts_filtered(params, true);

	clean();
	$('#results').append('<div id="netmap" style="height:'+$(window).height()+'px;margin-bottom:12px;border:1px solid #aaa;background:white;overflow:auto"/>');
	this.addHosts(filteredHosts);
};
