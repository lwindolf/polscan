// vim: set ts=4 sw=4: 
/* A view visualizing active network connections using 
   a Pixi.js WebGL accelerated fixed d3 force layout. */

renderers.netgraph = function netgraphRenderer() {};

renderers.netgraph.prototype.prepareData = function (data, params) {
	var selectedHosts = {};
	var selectedEdges = {};
	var graph = {};
	graph.nodes = [];
	graph.edges = [];

	$('#loadmessage').show();
	$('#loadmessage i').html("Loading...");

	var i = 0, overflowDrop = 0;
	var connCountDrop = 0;
	var noConnDrop = 0;
	var hostLimit = 5000;
	var groups = [];

	// Filter hosts a 2nd time to drop all without connections
	var hostsWithConnections = {};
	$.each(data.results, function(i, item) {
		hostsWithConnections[item.host] = 1;
	});

	$.each(hostsWithConnections, function(host) {
		if(i < hostLimit) {
			var resolved = resolveIp(host);
			var group = getGroupByHost(params.gT, resolved);
			var groupId = groups.indexOf(group);
			if(-1 === groupId) {
				groups.push(group);
				groupId = groups.length;
			}
			var hostData = { name: resolved, connCount:0, group: groupId };
			selectedHosts[resolved] = graph.nodes.length;
			graph.nodes.push(hostData);
			i+=1;
		} else {
			overflowDrop++;
		}
	});

	$.each(data.results, function(i, item) {
	    // get connections for all filtered hosts
		if(undefined === selectedHosts[item.host])
			return;

		var edge;
		var ln = item.host;
		var rn = resolveIp(item.rn);
		if (ln.localeCompare(rn))
			edge = ln + '-' + rn;
		else
			edge = rn + '-' + ln;

		if(undefined === selectedEdges[edge] &&
		   undefined !== selectedHosts[rn]) {
			// FIXME: ad-hoc create nodes for IPs
			graph.edges.push({
				ln: ln,
				rn: rn,
				count: 1	// FIXME: do really counts here
			});
			selectedEdges[edge] = 1;
			graph.nodes[selectedHosts[ln]].connCount++;
			graph.nodes[selectedHosts[rn]].connCount++;
		}		
	});

	// Finally cleanup hosts that:
	// - have to many connections (global connectivity e.g. monitoring
	//   or automation agents with persistent connections)
	// - have no connections
	var maxConnLimit = Math.max(hostLimit/100, Math.floor(graph.nodes.length/100));
	graph.nodes = graph.nodes.filter(function(node) {
		if (node.connCount === 0 || node.connCount > maxConnLimit) {
			selectedHosts[node.name] = undefined;
			if(node.connCount > 0)
				connCountDrop++;
			else
				noConnDrop++;
			return false;
		}
		return true;
	});

	// Make sure node indizes are correct
	$.each(graph.edges, function(i, edge) {
		edge.source = graph.nodes.findIndex(function(n) {
			return n.name === edge.ln;
		});
		edge.target = graph.nodes.findIndex(function(n) {
			return n.name === edge.rn;
		});
	});

 	// And connections of deleted nodes are gone
	var connectedNodes = {};
	graph.edges = graph.edges.filter(function(edge) {
		var valid = (edge.source >= 0 && edge.target >= 0);
		if(valid) {
			connectedNodes[edge.source] = 1;
			connectedNodes[edge.target] = 1;
		}
		return valid;
	});

	// Finally drop all nodes that have no connections
	// (caused by them having only some connections to
	//  other hosts that were dropped due to connCount limit)
	graph.nodes = graph.nodes.filter(function(node, i) {
		if (connectedNodes[i] === undefined) {
			connCountDrop++;
			return false;
		}
		return true;
	});

	// FIXME: duplicated from above!
	// Make sure node indizes are still correct
	$.each(graph.edges, function(i, edge) {
		edge.source = graph.nodes.findIndex(function(n) {
			return n.name === edge.ln;
		});
		edge.target = graph.nodes.findIndex(function(n) {
			return n.name === edge.rn;
		});
	});

	if(overflowDrop || connCountDrop)
		$('#loadmessage i').html("Only displaying the "+graph.nodes.length+
		                         " of "+Object.keys(hostsWithConnections).length+
		                         " hosts with connections in this filter/selection.<br/>"+
		                         (overflowDrop?overflowDrop+" hosts dropped because of max host limit ("+hostLimit+")<br/>":"")+
		                         (connCountDrop?connCountDrop+" hosts dropped to reduce cardinality (connection count limit "+maxConnLimit+")<br/>":"")+
		                         "Please filter to a smaller group!");
	else if(graph.nodes.length === 0)
		$('#loadmessage i').html("Sorry no connections found!");
	else
		$('#loadmessage').hide();

	return graph;
};

renderers.netgraph.prototype.render = function(id, data, params) {
	var graph = this.prepareData(data, params);
	var color = d3.scale.category20();
	var width = $(id).parent().width()
	var height = $(window).height()-$(id).offset().top;

	// Derived from https://bl.ocks.org/iros/36a18c646f3b3b5b9001ad758bfd8a08#file-index-html
	var renderer = new PIXI.autoDetectRenderer(width, height, {
		antialias: true,
		backgroundColor: 0,
	});
	$(id)[0].appendChild(renderer.view);
	d3.select(id).call(d3.behavior.zoom().scaleExtent([0.1, 5]).on("zoom", zoom))
	d3.behavior.zoom().scale(0.1)

	// create the root of the scene graph
	var stage = new PIXI.Container();
	var graphics = new PIXI.Graphics();
	stage.interactiveChildren = false;
	stage.addChild(graphics);

	function zoom() {
		graphics.position.x = d3.event.translate[0];
		graphics.position.y = d3.event.translate[1];
		graphics.scale.x = d3.event.scale;
		graphics.scale.y = d3.event.scale;
		force.tick();
		renderer.render(stage);
	}		

    function drawEdge(d, x1, y1, x2, y2, width) {
      graphics.lineStyle(width, 0xbbbbbb);
      graphics.beginFill(0xffffff, 0.5);
      graphics.moveTo(x1,y1);
      graphics.lineTo(x2,y2);
      graphics.endFill();
    }

	var safety = 0;
    var force = d3.layout.force()
      .charge(-800)
      .linkDistance(100)
      .size([width, height])
	  .nodes(graph.nodes)
	  .links(graph.edges)
      .alpha(0.3)
	  .start();

	while(force.alpha() > 0.01) { // You'll want to try out different, "small" values for this
		force.tick();
		if(safety++ > 250) {
		  break;// Avoids infinite looping in case this solution was a bad idea
		}
	}

	force.on("tick", function(d) {
		graphics.clear();

		force.links().forEach(function(d) {
		  drawEdge(d, d.source.x,
			d.source.y,
			d.target.x,
			d.target.y,
			1); //Math.sqrt(d.value) || 1);
		});

		force.nodes().forEach(function(d){
			var fill = parseInt(color(d.group).substring(1), 16);
			graphics.beginFill(fill, 1);
			graphics.drawCircle(d.x, d.y, 10);
		    graphics.endFill();
		});
	});

	animate();
	force.stop();

	var g_TICK = 40; // 1000/40 = ~6 frames per second
	var g_Time = 0;

	function animate() {
		// Limit to the frame rate
		var timeNow = (new Date()).getTime();
		var timeDiff = timeNow - g_Time;
		if (timeDiff < g_TICK)
			return;

		g_Time = timeNow;

		force.tick();
		renderer.render(stage);
		requestAnimationFrame(animate);
	}
};
