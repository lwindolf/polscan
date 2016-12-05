// vim: set ts=4 sw=4: 
/* A view visualizing distribution of findings over host groups.
   Represents hosts as color coded boxes according to maximum
   finding severity */

views.NetmapView = function NetmapView(parentDiv, params) {
	this.parentDiv = parentDiv;
	this.filterOptions = {
		host: true,
		nt: true
	};
	this.netMapData = {};
	this.previousNode;
};

// FIXME: scope
var viewBoxX, viewBoxY;

function lookupIp(ip) {
	console.log("Resolving "+ip);
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
				.setGraph({ "rankdir": "LR", "ranksep": 75, "nodesep": 12, "marginx": 20, "marginy": 20, "align": "DL" })
				.setDefaultEdgeLabel(function() { return {}; });

	$.each(this.netMapData.nodes, function(i, n) {
		var props = { "label": n.label, "labelType": "html", "class": n.class };
		if(n.class === 'local')
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
	svg.attr("height", g.graph().height + 40);
}

views.NetmapView.prototype.addGraphNode = function(service, direction) {
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
					tmp += "href='#view=netmap&pN="+view.currentNode+"&h="+name+"'>"+name+"</a><br/> ";
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

views.NetmapView.prototype.addHost = function() {
	var view = this;
	var host = this.currentNode;
	var found = false;
	var d = this.netMapData = {
		nodeToId: [],
		nodes: [],
		links: []
	};

	console.log("addHostToNetGraph "+host);

	// get connections for this host
	getData("netedge "+this.neType, function(data) {
		var portToProgram = new Array();
		var connByService = new Array();
		$.each(data.results, function(i, item) {
			if(item.host == host) {
				found = true;

				if(item.ln === '' || item.ltn === '' || item.rn === '' || item.rtn === '')
					return;

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
					remoteName = '<a href="#view=netmap&h='+resolvedRemote+'">'+resolvedRemote+'</a>';

				$('#netMapTable tbody').append('<tr>'+
					'<td>'+item.scope+'</td>' +
					'<td>'+item.ln+'</td>' +
					'<td>'+item.ltn+'</td>' +
					'<td>'+remoteName+'</td>' +
					'<td>'+item.rtn+'</td>' +
					'<td>'+item.dir+'</td>' +
					'<td>'+item.cnt+'</td>' +
				'</tr>');
			}
		});

		if(found) {
			// We need a fake node to connect as input for programs without
			// incoming connections to force the program nodes to the 2nd rank
			// we will hide this node and its links using CSS
			//
			// Node id is 0
			d.nodes.push({"label": "", class: 'null'});

			for(var id in connByService) {
				var program = connByService[id].service;

				if(!(program in d.nodeToId)) {
					var nId = d.nodes.length;
					d.nodeToId[program] = nId;
					d.nodes.push({"label": program, class: 'local'});
				}
				view.addGraphNode(connByService[id], "in");
				view.addGraphNode(connByService[id], "out");
			}

			view.updateGraph();

			$("#netMapTable").tablesorter({sortList: [[1,1],[2,1],[3,1]]});
		} else {
			error("Sorry! No connection data available for "+host+" on this day.");
		}

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
						$('#inventoryTable').append("<tr><td><b>"+v.inventory.replace("Network ", "")+"</b><br/> "+invValue+"</td></tr>");
					});
				}
			});
		});
	});
}

views.NetmapView.prototype.update = function(params) {
	if(!("h" in params) || !("nt" in params)) {
		setLocationHash({
			h: params.h?params.h:Object.keys(hosts)[0],
			nt: params.nt?params.nt:'TCP connection'
		});
		return;
	}

	clean();
	$('#results').append('<table border="0" cellspacing="0" cellpadding="0" style="width:100%" height="'+$(window).height()+'px"><tr><td valign="top" width="100%"><div id="netmap" style="height:'+$(window).height()+'px;width:100%;margin-bottom:12px;border:1px solid #aaa;background:white;overflow:auto"/></td>' +
	                     '</td><td valign="top"><table id="inventoryTable" class="resultTable tablesorter" style="width:300px"><thead><tr><th>Network Inventory</th></tr></thead><tbody/></table></td></tr></table>'+
	                     '<table id="netMapTable" class="resultTable tablesorter"><thead><tr><th>Scope</th><th>Local Name</th><th>Local Transport</th><th>Remote Name</th><th>Remote Transport</th><th>In/Out</th><th>Count</th></tr></thead><tbody/></table>'
);
	this.previousNode = params.pN;
	this.currentNode = params.h;
	this.neType = params.nt;
	this.addHost();
//	this.addInventory("Network");
};
