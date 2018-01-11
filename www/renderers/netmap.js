// vim: set ts=4 sw=4: 
/* A view visualizing distribution of findings over host groups.
   Represents hosts as color coded boxes according to maximum
   finding severity */

renderers.netmap = function netmapRenderer() {
	this.netMapData = {};
	this.previousNode = undefined;
};

function lookupIp(ip) {
	$.getJSON('http://ipinfo.io/'+ip, function(data){
		alert("IP: "+data.ip+
		      "\nName: "+data.hostname+
		      "\nCity: "+data.city+
		      "\nRegion: "+data.region+
		      "\nCountry: "+data.country+
		      "\nOrg: "+data.org+
		      "\nPostal: "+data.postal
		);
	})
}

var viewBoxX = 0;
var viewBoxY = 0;

renderers.netmap.prototype.updateGraph = function() {
	$('#netmap').empty();

	var width = $('#netmap').width();
	var	height = $('#netmap').height();
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

	var g = new dagreD3.graphlib.Graph()
				.setGraph({ "rankdir": "LR", "ranksep": 75, "nodesep": 12, "marginx": 20, "marginy": 20, "align": "DL" })
				.setDefaultEdgeLabel(function() { return {}; });

	$.each(this.netMapData.nodes, function(i, n) {
		var props = { "label": n.label, "labelType": "html", "class": n.class };
		if(undefined !== n.class && 0 === n.class.indexOf('local'))
			props.width = 100;
		g.setNode(i, props);
	});

	$.each(this.netMapData.links, function(i, l) {
		if(l.source === undefined || l.target === undefined)
			return;
		var props = { lineInterpolate: 'basis' };
//		if(l.weigth)
//			props.style = "stroke-width: "+Math.ceil(Math.log10(l.weigth))+"px";
//			props.style = "stroke: #f66; stroke-width: 3px; stroke-dasharray: 5, 5;";
 		if(l.source === 0)
			props.style = "display:none";
 		if(l.dPort && l.dPort !== "high") {
			props.label = (l.dPort.match(/^[0-9]/)?":":"")+l.dPort;
			props.labelpos = 'r';
			props.labeloffset = 5;
		}
		g.setEdge(l.source, l.target, props);
	});

	var render = new dagreD3.render();
	render(nodeArea, g);

	var xCenterOffset = (svg.attr("width") - g.graph().width) / 2;
	nodeArea.attr('transform', 'translate(' + xCenterOffset + ',40)');
	overlayMonitoring();
}

renderers.netmap.prototype.addGraphNode = function(service, direction) {
	var view = this;
	var d = this.netMapData;

	if(service[direction].length > 0) {
		var remote = service[direction].join(",") + direction;
		var nId = d.nodes.length;
		var tmp = "";
		$.each(service[direction], function(i, name) {
			if (i < 6) {
				if (name.match(/^(10\.|172\.|192\.)/))
					tmp += name+"<br/> ";
				else if (name.match(/^[0-9]/))
					tmp += '<a class="resolve" href="javascript:lookupIp(\''+name+'\')" title="Click to resolve IP">'+name+"</a><br/> ";
				else {
					tmp += "<a ";
					if(name == view.previousNode)
						console.log("prev="+name);
					if(name == view.previousNode)
						tmp += "class='previousNode' ";
					tmp += "class='host_"+name.replace(/[.\-]/g,'_')+"' href='javascript:changeLocationHash({pN:\""+view.currentNode+"\",h:\""+name+"\"});'>"+name+"</a><br/> ";
				}
			}
			if (i == 6)
				tmp += "<span style='color:#444; font-size:small'>("+(service[direction].length - 6)+" more ...)</span>";
		});

		d.nodes.push({
			"label": tmp
		});
		if(direction === 'in')
			d.links.push({source: d.nodeToId[service.service], target: nId, dPort: service.outPorts[0], weigth: service[direction].length});
		else
			d.links.push({target: d.nodeToId[service.service], source: nId, dPort: service.port, weigth: service[direction].length});
	} else {
		if(direction !== 'in')
			d.links.push({source: 0, target: d.nodeToId[service.service], class: "null", weigth: 0});
	}
}

renderers.netmap.prototype.resized = function(renderer) {
	// Ensure tables overflow correctly
	$('#inventoryTable table.probes').parent().width($('#inventoryTable').parent().width());

	// Redraw graph
	renderer.updateGraph();
}

renderers.netmap.prototype.monitoringCb = function(e) {
        $('.liveLabel.Monitoring').addClass('OK');
}

renderers.netmap.prototype.monitoringErrorCb = function(e) {
	$('.liveLabel.Monitoring').addClass('FAILED');
	$('.liveLabel.Monitoring').prop('title', 'Failed: '+e);
}

renderers.netmap.prototype.probeErrorCb = function(e) {
	$('.liveLabel.Probes').addClass('FAILED');
	$('.liveLabel.Probes').prop('title', 'Failed: '+e);
}

/* render probe results in inventory table */
renderers.netmap.prototype.probeResultCb = function(probe, host, res) {

	// Do not render netstat table in inventory bar
	if(probe !== "netstat")
		probeRenderAsRow("inventoryTable", probe, res);

	$('.liveLabel.Probes').addClass('OK');
}

/* render connections into connection graph */
renderers.netmap.prototype.probeConnectionsResultCb = function(probe, host, res) {
	var listen_port_to_program = {};
	var connection_ids = {};
	var r = view.current.renderer;

	// Filter LISTEN and localhost inter-connections and prepare a list
	// of LISTEN ports to determine connection direction
	var filtered = res.stdout.split(/\n+/).filter(function(l) {
		var line=l.split(/\s+/);
		if(line.length < 6)
			return false;
		// FIXME: IPv6 local IPs
		if(line[3].indexOf('127') === 0 &&
		   line[4].indexOf('127') === 0)
			return false;
		if(line[5] === 'LISTEN') {
			if(undefined !== line[6])
				listen_port_to_program[line[3].split(/:+/)[1]] = line[6].split(/\//)[1];
			return false;
		}
		return line[0].indexOf('tcp') === 0;

	});

	r.addConnections(filtered.map(function(l) {
		var a = l.split(/\s+/);
		var hostRe = /^(.+):[^:]+$/;
		var portRe = /.+:([^:]+)$/;
		var ln  = a[3].replace(hostRe, "$1");
		var ltn = a[3].replace(portRe, "$1");
		var rn  = a[4].replace(hostRe, "$1");
		var rtn = a[4].replace(portRe, "$1");
		var scope = a[6].replace(/[\/0-9]+/, "");

		// fuzzy logic: collapse client ports
		if(ltn > 1024 && undefined === listen_port_to_program[ltn])
			ltn = 'high';
		else
			direction = 'in';

		if(rtn > 1024)
			rtn = 'high';

		// Add process info to TIME_WAIT listings
		if(scope === '-' && listen_port_to_program[ltn] !== undefined)
			scope = listen_port_to_program[ltn];

		return {
			"scope" : scope,
			"ln"    : ln,
			"ltn"   : ltn,
			"rn"    : rn,
			"rtn"   : rtn,
			dir   : (listen_port_to_program[ltn] !== undefined?"in":"out"),
			cnt   : 1
		};
	}).reduce(function(list, l) {
		// reduce duplicate edges
		var key = JSON.stringify(l);
		if (connection_ids[key] === undefined) {
			connection_ids[key] = l;
			list.push(l);
		} else {
			connection_ids[key].cnt++;
		}

		return list;
	}, []), listen_port_to_program);

	updateMonitoring(host, "inventoryTable", false, r.monitoringCb, r.monitoringErrorCb);
}

/* probe node infos using the probe API */
renderers.netmap.prototype.overlayLive = function(host, forced = false) {
	var r = this;

	if(!isLive() && false === forced) {
		$('#row1').append('<div class="live"><input type="button" value="Switch To Live Mode"/></div>');
		$('#row1 .live input').click(function() {
			r.overlayLive(host, true);
		});
		return;
	}

	$('#errors').hide();
	$('#row1 .live').remove();
	$('#row1').append('<div class="live">Live: <span class="liveLabel Monitoring">Monitoring</span> <span class="liveLabel Probes">Probes</span></div>');

	var p = new ProbeAPI();
	/* Start default probing */
	p.start(host, r.probeResultCb, r.probeErrorCb);

	/* Also start full connection probe explicitely */
	p.probe('netstat-a', r.probeConnectionsResultCb, r.probeErrorCb);
};

renderers.netmap.prototype.addConnections = function(c, listen_ports) {
	var r = this;
	var d = this.netMapData = {
		nodeToId: [],
		nodes: [{label: "", class: 'null'}],
		links: []
	};

	var portToProgram = new Array();
	var connByService = new Array();

	$('#netMapTable tbody').empty();

	$.each(c, function(i, item) {
		// Resolve program for close-wait, time-wait listings
		if(item.scope !== "-" && !(item.ltn in portToProgram))
			portToProgram[item.ltn] = item.scope;
		if(item.scope === "-" && (item.ltn in portToProgram))
			item.scope = portToProgram[item.ltn];

		// Reduce connections to per service connections with ids like
		//   high:::java:::high
		//   high:::apache2:::80
		//   ...
		id = item.ltn+":::"+item.scope+":::"+item.rtn;
		var s;
		if(item.scope !== "-")
			s = item.scope;
		else
			return; 	// displaying unknown procs is just useless

		if(!(id in connByService))
			connByService[id] = { service: s, "port": item.ltn, in: [], out: [], outPorts: [] };

		var resolvedRemote = resolveIp(item.rn);
		if(item.dir === 'in') {
			connByService[id].out.push(resolvedRemote);
		} else {
			connByService[id].in.push(resolvedRemote);
			connByService[id].outPorts.push(item.rtn);
		}

		var remoteName;
		if(resolvedRemote.match(/^(10\.|172\.|192\.)/))
			remoteName = resolvedRemote;
		else if(resolvedRemote.match(/^[0-9]/))
			remoteName = '<a class="resolve" href="javascript:lookupIp(\''+resolvedRemote+'\')" title="Click to resolve IP">'+resolvedRemote+'</a>';
		else
			remoteName = '<a class="host_'+resolvedRemote.replace(/[.\-]/g,'_')+'" href="#view=Network&r=netmap&h='+resolvedRemote+'">'+resolvedRemote+'</a>';

		$('#netMapTable tbody').append('<tr>'+
			'<td>'+item.scope+'</td>' +
			'<td>'+item.ln+'</td>' +
			'<td>'+item.ltn+'</td>' +
			'<td>'+remoteName+'</td>' +
			'<td>'+item.rtn+'</td>' +
			'<td>'+item.dir+'</td>' +
			'<td>'+item.cnt+'</td>' +
		'</tr>');
	});

	// We need a fake node to connect as input for programs without
	// incoming connections to force the program nodes to the 2nd rank
	// we will hide this node and its links using CSS
	$.each(Object.keys(connByService).sort(), function(i, id) {
		var program = connByService[id].service;

		if(!(program in d.nodeToId)) {
			var nId = d.nodes.length;
			d.nodeToId[program] = nId;
			d.nodes.push({"label": program, class: 'local'});
		}
		r.addGraphNode(connByService[id], "in");
		r.addGraphNode(connByService[id], "out");
	});

	// Finally ensure all services are visible (even those without connections)
	// This is to avoid them staying invisible and to have a place to add 
	// service type probe results
	if(undefined !== listen_ports)
		$.each(listen_ports, function(port, program) {
			if(!(program in d.nodeToId)) {
				var nId = d.nodes.length;
				d.nodeToId[program] = nId;
				d.nodes.push({"label": program, class: 'local_unused'});

				var service = { service: program, "port": port, in: [], out: [], outPorts: [] };
				r.addGraphNode(service, "in");
				r.addGraphNode(service, "out");
			}
		});

	r.updateGraph();

	$("#netMapTable").tablesorter({sortList: [[1,1],[2,1],[3,1]]});
}

renderers.netmap.prototype.addHost = function() {
	var view = this;
	var host = this.currentNode;

	console.log("addHostToNetGraph "+host);

	// get connections for this host
	getData("netedge "+this.neType, function(data) {
		var filtered = data.results.filter(function(item) {
			return item.host === host;
		});

		if(filtered.length === 0)
			error("Sorry! No connection data available for "+host+" on this day.");
		else
			view.addConnections(filtered);

		// Present network inventory
		// FIXME: rather have a getInventories() method
		getData("overview", function(data) {
			$.each(data.overview, function(i, v) {
				if(v.inventory && 0 === v.inventory.indexOf("Network")) {
					getData("inventory "+v.inventory, function(data) {
						var invValue;
						$.each(data.results, function(i, item) {
							if(item.host === host) {
								invValue = item.values;
								return;
							}
						});
						if(invValue !== '')
							$('#tr_ninv').after("<tr><td><b>"+v.inventory.replace("Network ", "")+"</b><br/> "+invValue+"</td></tr>");
					});
				}
			});
		});

		view.overlayLive(host);
	});
}

renderers.netmap.prototype.render = function(id, data, params) {
	var r = this;

	$('#row2').html('<div style="height:'+$(window).height()+'px;">'+
					'<div class="split split-horizontal" id="netmap" style="border:1px solid #aaa;background:white;"/>' +
	                '<div class="split split-horizontal" id="inv"><table id="inventoryTable" class="resultTable tablesorter"><tbody><tr id="tr_ninv"><th>Network Inventory</th></tr></tbody></table></div>'+
					'</div>'+
	                '<table id="netMapTable" class="resultTable tablesorter"><thead><tr><th>Scope</th><th>Local Name</th><th>Local Transport</th><th>Remote Name</th><th>Remote Transport</th><th>In/Out</th><th>Count</th></tr></thead><tbody/></table>'
	);

	Split(['#netmap', '#inv'], {
		sizes: [75, 25],
		minSize: [200, 200],
		onDragEnd: function() {
			r.resized(r);
		}
    });

	$(window).resize(function() {
		r.resized(r);
	});

	this.previousNode = params.pN;
	this.currentNode = params.h;
	this.neType = params.nt;
	this.addHost();
};
