// vim: set ts=4 sw=4: 
/* A view visualizing distribution of findings over host groups.
   Represents hosts as color coded boxes according to maximum
   finding severity */

views.NetmapView = function NetmapView(parentDiv, params) {
	this.parentDiv = parentDiv;
	this.filterOptions = {
		host: true
	};
	this.netMapData = {};
};

// FIXME: scope
var viewBoxX, viewBoxY;

views.NetmapView.prototype.updateGraph = function() {
	var width = $('#netmap').width();
	var	height = $('#netmap').height();
    var svg = d3.select("#netmap").append("svg")
        .attr("width", width)
        .attr("height", height);


	// Allow panning as suggested in by dersinces (CC BY-SA 3.0) in
	// http://stackoverflow.com/questions/20099299/implement-panning-while-keeping-nodes-draggable-in-d3-force-layout
/*	var drag = d3.behavior.drag();
	drag.on('drag', function() {
	    viewBoxX -= d3.event.dx;
	    viewBoxY -= d3.event.dy;
	    svg.select('g.node-area').attr('transform', 'translate(' + (-viewBoxX) + ',' + (-viewBoxY) + ')');
	});
	svg.append('rect')
	  .classed('bg', true)
	  .attr('stroke', 'transparent')
	  .attr('fill', 'transparent')
	  .attr('x', 0)
	  .attr('y', 0)
	  .attr('width', width)
	  .attr('height', height)
	  .call(drag);
*/
	var nodeArea = svg.append('g').classed('node-area', true);

	var g = new dagreD3.graphlib.Graph()
				.setGraph({ "rankdir": "LR", "nodesep": 25 })
				.setDefaultEdgeLabel(function() { return {}; });

	$.each(this.netMapData.nodes, function(i, n) {
		g.setNode(i, { "label": n.label, "class": "abc", "labelType": "html" });
	});
	$.each(this.netMapData.links, function(i, l) {
		if(l.source && l.target)
			g.setEdge(l.source, l.target);
	});

	var render = new dagreD3.render();
	render(nodeArea, g);

	var xCenterOffset = (svg.attr("width") - g.graph().width) / 2;
	nodeArea.attr("transform", "translate(" + xCenterOffset + ", 20)");
	svg.attr("height", g.graph().height + 40);
}

views.NetmapView.prototype.addGraphNode = function(data, direction, program, count) {
	var d = this.netMapData;

	if(data[direction].length > 0) {
		var remote = data[direction].join(",") + direction;
		if(!d.nodeToId[remote]) {
			var nId = d.nodes.length;
			var tmp = "";
			$.each(data[direction], function(i, name) {
				if (i < 6)
					tmp += "<a href='#view=netmap&h="+name+"'>"+name+"</a><br/> ";
				if (i == 6)
					tmp += "<span style='color:#444; font-size:small'>("+(data[direction].length - 6)+" more ...)</span>";
			});

			d.nodeToId[remote] = nId;
			d.nodes.push({
				"label": tmp
			});
		}
		if(direction === 'in')
			d.links.push({source: d.nodeToId[program], target: nId, "count": count});
		else
			d.links.push({target: d.nodeToId[program], source: nId, "count": count});
	}
}

views.NetmapView.prototype.addHost = function(host) {
	var view = this;
	var d = this.netMapData = {
		nodeToId: [],
		nodes: [],
		links: []
	};

	console.log("addHostToNetGraph "+host);

	// get connections for this host
	getData("Network", function(data) {
		var portToProgram = new Array();
		var connByService = new Array();
		$.each(data.results, function(i, item) {
			if(item.host == host && item.policy == "Connections") {
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

						// Reduce connections to per service connections with ids like
						//   high:::java:::high
						//   high:::apache2:::80
						//   ...
						id = port+":::"+program+":::"+fields[4];
						var s;
						if(program !== "-")
							s = program;
						else
							s = "???";
//						if(port !== "high")
//							s += ":" + port;

						if(!(id in connByService))
							connByService[id] = { service: s, in: [], out: [] };

						var resolvedRemote = resolveIp(fields[3]);
						if(fields[5] === 'in')
							connByService[id].out.push(resolvedRemote);
						else
							connByService[id].in.push(resolvedRemote);

						$('#netMapTable tbody').append('<tr>'+
							'<td>'+fields[0]+'</td>' +
							'<td>'+fields[1]+'</td>' +
							'<td>'+fields[2]+'</td>' +
							'<td>'+(resolvedRemote.match(/^[0-9]/)?resolvedRemote:'<a href="#view=netmap&h='+resolvedRemote+'">'+resolvedRemote+'</a>')+'</td>' +
							'<td>'+fields[4]+'</td>' +
							'<td>'+fields[5]+'</td>' +
							'<td>'+fields[6]+'</td>' +
							'</tr>');
					}
				}
			}
		});

		for(var id in connByService) {
			var program = connByService[id].service;

			if(!(program in d.nodeToId)) {
				var nId = d.nodes.length;
				d.nodeToId[program] = nId;
				d.nodes.push({"label": program, class: 'local'});
			}
			view.addGraphNode(connByService[id], "in", program);
			view.addGraphNode(connByService[id], "out", program);
		}

		view.updateGraph();

		$("#netMapTable").tablesorter({sortList: [[1,1],[2,1],[3,1]]});
	});
}

views.NetmapView.prototype.update = function(params) {
	clean();
	$('#results').append('<div id="netmap" style="height:'+$(window).height()*2/3+'px;margin-bottom:12px;border:1px solid #aaa;background:white;overflow:auto"/><div id="selectedGroup"/><table id="netMapTable" class="resultTable tablesorter"><thead><tr><th>Program</th><th>Local IP</th><th>Local Port</th><th>Remote Host/IP</th><th>Remote Port</th><th>In/Out</th><th>Count</th></tr></thead><tbody/></table></div>');
	if(params.h)
		this.addHost(params.h);
};
