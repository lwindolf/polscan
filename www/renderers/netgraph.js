// vim: set ts=4 sw=4: 
/* A view visualizing active network connections using 
   a WebGL d3 force layout. */

renderers.netgraph = function netgraphRenderer() {};

renderers.netgraph.prototype.prepareData = function (data) {
	var selectedHosts = {};
	var selectedEdges = {};
	var graph = {};
	graph.nodes = [];
	graph.edges = [];

	$('#loadmessage').show();
	$('#loadmessage i').html("Loading...");

	var i = 0, overflow = 0;
	var hostLimit = 5000;

	// Filter hosts a 2nd time to drop all without connections
	var hostsWithConnections = {};
	$.each(data.results, function(i, item) {
		hostsWithConnections[item.host] = 1;
	});

	$.each(hostsWithConnections, function(host) {
		if(i < hostLimit) {
			var resolved = resolveIp(host);
			var hostData = { name: resolved, connCount:0 };
			selectedHosts[resolved] = graph.nodes.length;
			graph.nodes.push(hostData);
			i+=1;
		} else {
			overflow = 1;
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
	graph.nodes = graph.nodes.filter(function(node) {
		if (node.connCount === 0 || node.connCount > 50) {
			selectedHosts[node.name] = undefined;
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
	graph.edges = graph.edges.filter(function(edge) {
		return (edge.source >= 0 && edge.target >= 0);
	});

	if(overflow)
		$('#loadmessage i').html("Only displaying the first "+graph.nodes.length+" of "+Object.keys(hostsWithConnections).length+" hosts in this filter/selection. Please choose a smaller group!");
	else
		$('#loadmessage').hide();

	return graph;
};

renderers.netgraph.prototype.render = function(id, data, params) {

	$(id).append('<div id="netgraph" height="auto"/>');

	var graph = this.prepareData(data);
	var color = d3.scale.category20();
	var width = $(id).parent().width()
	var height = $(window).height()-$(id).offset().top;

	// Derived from https://bl.ocks.org/iros/36a18c646f3b3b5b9001ad758bfd8a08#file-index-html
	var renderer = new PIXI.autoDetectRenderer(width, height, {
		antialias: true,
		backgroundColor : 0
	});
	$(id)[0].appendChild(renderer.view);
	d3.select(id).call(d3.behavior.zoom().scaleExtent([0.1, 8]).on("zoom", zoom))

	var stage = new PIXI.Container();

	function zoom() {
		graphics.position.x = d3.event.translate[0];
		graphics.position.y = d3.event.translate[1];
		graphics.scale.x = d3.event.scale;
		graphics.scale.y = d3.event.scale;
		force.tick();
		renderer.render(stage);
	}
			
	// create the root of the scene graph
	var stage = new PIXI.Container();
	var graphics = new PIXI.Graphics();
/*	graphics.updateCircle = function(newx,newy) {
	  drawNode(d, newx, newy, r, fill);    
	}
*/
    function drawNode(d,x,y,r,fill) {
      if (typeof fill === "string") {
        fill = parseInt(fill.substring(1), 16);
      }

/*		var t = new PIXI.Text(d.name);
		t.x = x + Math.floor(r*1.5);
		t.y = y;
		stage.addChild(t); */

      graphics.lineStyle(0);
      graphics.beginFill(fill, 1);
      graphics.drawCircle(x,y,r);
      graphics.endFill();
      graphics.interactive = true;
      graphics.buttonMode = true;
      graphics.hitArea = new PIXI.Circle(x,y,r);
/*      graphics.click = function(e) {
        this.alpha = 0.5;
		safety = 0;
        force.start();
      }*/
    }

    function drawEdge(d, x1,y1,x2,y2, width) {
      graphics.lineStyle(width, 0xbbbbbb);
      graphics.beginFill(0xffffff, 0.5);
      graphics.moveTo(x1,y1);
      graphics.lineTo(x2,y2);
      graphics.endFill();
    }

	var safety = 0;
    var force = d3.layout.force()
      .charge(-800)
      .linkDistance(50)
      .size([width, height])
	  .nodes(graph.nodes)
	  .links(graph.edges)
	  .start();

	while(force.alpha() > 0.01) { // You'll want to try out different, "small" values for this
		force.tick();
		if(safety++ > 200) {
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
			Math.sqrt(d.value) || 1);
		});

		force.nodes().forEach(function(d){
		  drawNode(d, d.x, d.y, 10, color(d.group));  
		});
		stage.addChild(graphics);
	});

	animate();

	var g_TICK = 80; // 1000/80 = ~12 frames per second
	var g_Time = 0;

	function animate() {
		// Limit to the frame rate
		var timeNow = (new Date()).getTime();
		var timeDiff = timeNow - g_Time;
		if (timeDiff < g_TICK)
			return;

		g_Time = timeNow;

		renderer.render(stage);
		requestAnimationFrame(animate);
	}
};
