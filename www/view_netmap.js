// vim: set ts=4 sw=4: 
/* A view visualizing distribution of findings over host groups.
   Represents hosts as color coded boxes according to maximum
   finding severity */

views.NetmapView = function NetmapView(parentDiv, params) {
	this.parentDiv = parentDiv;
};

function getAlignmentBounds(vs, c) {
    var os = c.offsets;
    if (c.axis === 'x') {
        var x = vs[os[0].node].x;
        c.bounds = new cola.vpsc.Rectangle(x, x, 
            Math.min.apply(Math, os.map(function (o) { return vs[o.node].bounds.y - 20; })),
            Math.max.apply(Math, os.map(function (o) { return vs[o.node].bounds.Y + 20; })));
    } else {
        var y = vs[os[0].node].y;
        c.bounds = new cola.vpsc.Rectangle(
            Math.min.apply(Math, os.map(function (o) { return vs[o.node].bounds.x - 20; })),
            Math.max.apply(Math, os.map(function (o) { return vs[o.node].bounds.X + 20; })),
            y, y);
    }
    return c.bounds;
}

var netMapData;
var viewBoxX, viewBoxY;

function updateNetMapGraph() {
	var width = $('#netmap').width();
	var	height = $('#netmap').height();

    var d3cola = cola.d3adaptor()
        .flowLayout("x", Math.min(300,$(window).width()/3))
        .linkDistance(200)
		.convergenceThreshold(0.1)
        .avoidOverlaps(true)
        .handleDisconnected(false)
        .size([width, height]);

    var svg = d3.select("#netmap").append("svg")
        .attr("width", width)
        .attr("height", height);


	// Allow panning as suggested in by dersinces (CC BY-SA 3.0) in
	// http://stackoverflow.com/questions/20099299/implement-panning-while-keeping-nodes-draggable-in-d3-force-layout
	var drag = d3.behavior.drag();
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

	var nodeArea = svg.append('g').classed('node-area', true);

	svg.append('svg:defs').append('svg:marker').attr('id', 'end-arrow').attr('viewBox', '0 -5 10 10').attr('refX', 5).attr('markerWidth', 9).attr('markerHeight', 6).attr('orient', 'auto').append('svg:path').attr('d', 'M0,-5L10,0L0,5L2,0').attr('stroke-width', '0px').attr('fill', '#000');

    graph = netMapData;

        graph.nodes.forEach(function (v) {
            v.width = 200;
			if(v.height === undefined)
				v.height = 40;
        })
        d3cola
            .nodes(graph.nodes)
            .links(graph.links)
			.groups(graph.groups)
			.constraints(graph.constraints)
            .start(10,0,0)

        var group = nodeArea.selectAll(".group")
            .data(graph.groups)
          .enter().append("rect")
            .attr("rx", 8).attr("ry", 8)
            .attr("class", "group")
            .style("fill", function (d, i) { if (i != 0) return color(i); else return '#fff' });

        var link = nodeArea.selectAll(".link")
            .data(graph.links)
          .enter().append("line")
            .attr("class", "link-line");

        var guideline = nodeArea.selectAll(".guideline")
            .data(graph.constraints.filter(function (c) { return c.type === 'alignment' }))
          .enter().append("line")
            .attr("class", "guideline")
            .attr("stroke-dasharray", "5,5");

        var pad = 5;
        var node = nodeArea.selectAll(".node")
            .data(graph.nodes)
			.attr("class", "node")
			.enter().append("g")
			.each(function(d) {
				// Prepare host name links for all non-IPs
				var html;
				$.each(d.name.split(","), function(i, h) {
					if(html)
						html += "<br/>";
					else
						html = "";
					if(-1 === h.search(/^[0-9]/) && d.type != "local")
						html += "<a href='#view=netmap&h="+h+"'>"+h+"</a>";
					else
						html += h;
				});
				d3.select(this)
				.append("foreignObject")
	            .attr("x", function (d) { return -d.width/2 + pad; })
   		        .attr("y", function (d) { return -d.height/2 + pad; })
   		        .attr("width", function (d) { return d.width - 2 * pad; })
   		        .attr("height", function (d) { return d.height - 2 * pad; })
				.attr("class", "nodes")
				.append("xhtml:body")
				.html(html);
			})
            .call(d3cola.drag);

/*
        var label = nodeArea.selectAll(".label")
            .data(graph.nodes)
           .enter().append("text")
            .attr("class", "label")
            .text(function (d) { return d.name; })
            .call(d3cola.drag);

*/

        node.append("title")
            .text(function (d) { return d.name; });

        d3cola.on("tick", function () {
		    node.each(function (d) {
                    d.bounds.setXCentre(d.x);
                    d.bounds.setYCentre(d.y);
                    d.innerBounds = d.bounds.inflate(-0);
                });

			node.attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });
			//	nodeArea.selectAll(".link-label").attr("transform", function (d) { return "translate(" + d.source.x + "," + (d.source.y+d.target.y)/2 + ")"; });

			link.each(function (d) {
				cola.vpsc.makeEdgeBetween(d, d.source.innerBounds, d.target.innerBounds, 5);
			});
	    	link.attr("x1", function (d) {
				return d.sourceIntersection.x;
			}).attr("y1", function (d) {
				return d.sourceIntersection.y;
			}).attr("x2", function (d) {
				return d.arrowStart.x;
			}).attr("y2", function (d) {
				return d.arrowStart.y;
			});
            
            group.attr("x", function (d) { return d.bounds.x; })
                .attr("y", function (d) { return d.bounds.y; })
                .attr("width", function (d) { return d.bounds.width(); })
                .attr("height", function (d) { return d.bounds.height(); });

            guideline
                .attr("x1", function (d) { return getAlignmentBounds(graph.nodes, d).x; })
                .attr("y1", function (d) {
                    return d.bounds.y;
                })
                .attr("x2", function (d) { return d.bounds.X; })
                .attr("y2", function (d) {
                    return d.bounds.Y;
                });

/*            label.attr("x", function (d) { return d.x -d.width/2 + pad; })
                 .attr("y", function (d) {
                     var h = this.getBBox().height;
                     return d.y + h/4;
                 });*/
        });
}

function addNetGraphNode(data, direction, program) {
	if(data[direction].length > 0) {
		var remote = data[direction].join(",") + direction;
		if(!nodeToId[remote]) {
			nodeToId[remote] = netMapData.nodes.length;
			netMapData.groups[direction == 'in'?3:2].leaves.push(nodeToId[remote]);
			netMapData.constraints[direction == 'out'?2:1].offsets.push({node: nodeToId[remote], offset:0});
			netMapData.nodes.push({
				name: data[direction].join(","),
				height: 40*Math.min(5, data[direction].length)
			});
		}
		if(direction === 'in')
			netMapData.links.push({source: nodeToId[program], target: nodeToId[remote]});
		else
			netMapData.links.push({target: nodeToId[program], source: nodeToId[remote]});
	}
}

var nodeToId;
function addHostToNetGraph(host) {
	console.log("addHostToNetGraph "+host);
				var portToProgram = new Array();
				var connByService = new Array();
				nodeToId = new Array();
				netMapData = {
					nodes: [],
					links: [],
				    constraints: [
						{ type: "alignment", axis: "x", offsets: [] },
						{ type: "alignment", axis: "x", offsets: [] },
						{ type: "alignment", axis: "x", offsets: [] }
					],
					groups: [
						{ leaves: [0], groups: [] },	// root (child groups are added on demand)
						{ leaves: [] }, // local node group
						{ leaves: [] }, // group for remote nodes connecting from
						{ leaves: [] }	// group for remote nodes connecting to
					]
				};
				// get connections for this host
				getData("Network", function(data) {
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
									if(port !== "high")
											s += ":" + port;

									if(!(id in connByService))
										connByService[id] = { service: s, in: [], out: [] };

									if(fields[5] === 'in')
										connByService[id].out.push(resolveIp(fields[3]));
									else
										connByService[id].in.push(resolveIp(fields[3]));

									$('#netMapTable tbody').append('<tr><td>'+host+'</td><td>'+fields.join('</td><td>')+'</td></tr>');
								}
							}
						}
					});

					for(var id in connByService) {
						var tmp = id.split(/:::/);
						var program = connByService[id].service;
						var lPort = tmp[0];
						var rPort = tmp[2];

						if(!(program in nodeToId)) {
							nodeToId[program] = netMapData.nodes.length;
							netMapData.groups[1].leaves.push(nodeToId[program]);
							netMapData.constraints[0].offsets.push({node: nodeToId[program], offset:0});
							netMapData.nodes.push({name: program, type: 'local'});
						}
						addNetGraphNode(connByService[id], "in", program);
						addNetGraphNode(connByService[id], "out", program);
					}

					if(netMapData.groups[3].leaves.length > 0)
						netMapData.groups[0].groups.push(3);
					else
						netMapData.groups.splice(3,3);
					if(netMapData.groups[2].leaves.length > 0)
						netMapData.groups[0].groups.push(2);
					else
						netMapData.groups.splice(2,2);
					if(netMapData.groups[1].leaves.length > 0)
						netMapData.groups[0].groups.push(1);
					else
						netMapData.groups.splice(1,1);

					if(netMapData.constraints[2].offsets.length == 0)
						delete netMapData.constraints.splice(2,2);
					if(netMapData.constraints[1].offsets.length == 0)
						delete netMapData.constraints.splice(1,1);
					if(netMapData.constraints[0].offsets.length == 0)
						delete netMapData.constraints.splice(0,0);

					updateNetMapGraph();
				});
}

views.NetmapView.prototype.update = function(params) {
	clean();
	$('#results').append('<div class="overviewBox"><div id="netMapNav"/></div>');
	addFilterSettings('#netMapNav', params, function() {
		setLocationHash({
			view: 'netmap',
			h: $('#selectedHost').val()
		});
	});

	$('#results .overviewBox').append('<div id="netmap" style="height:800px;margin-bottom:12px;border:1px solid #aaa;"/><div id="selectedGroup"/><table id="netMapTable" class="resultTable"><thead><tr><th>Host</th><th>Program</th><th>Local IP</th><th>Local Port</th><th>Remote IP</th><th>Remote Port</th><th>In/Out</th><th>Count</th></tr></thead><tbody/></table></div>');
	if(params.h)
		addHostToNetGraph(params.h);
};
