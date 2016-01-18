// vim: set ts=4 sw=4: 
/* A view visualizing active network connections using 
   network inventory. */

views.NetworkView = function NetworkView(parentDiv, params) {
	this.parentDiv = parentDiv;
};

function loadResolve() {
	hostByIp = {};

console.log("Resolving hosts...");
                                        hostByIp = new Array();
                                        getData("Network", function(data) {
                                                $.each(data.results, function(i, item) {
                                                        if(item.policy == "Connections") {
                                                                var connections = item.message.split(/ /);
                                                                for(var c in connections) {
                                                                        var fields = connections[c].split(/:/);
                                                                        hostByIp[fields[1]] = item.host;
                                                                }
                                                        }
                                                });
                                        });

}

                     var hostByIp;
                     function resolveIp(ip) {

                                if(hostByIp[ip])
                                        return hostByIp[ip];
                                return ip;
                     }


views.NetworkView.prototype.update = function(params) {

	clean();
	$('#loadmessage').show();
	$('#loadmessage i').html("Loading...");
	$(this.parentDiv).append('<div id="inventoryNav"/><div id="netgraph"/>'); //<div id="legend"><b>Legend</b></div><table id="inventoryMap" class="resultTable tablesorter"><thead><tr><th>Group</th><th>Results</th></tr></thead></table>');

	addFilterSettings('#inventoryNav', params, function() {
		setLocationHash({
			view: 'network',
		});
	});

	var filteredHosts = get_hosts_filtered(params);

var diameter = $(window).height(),
    radius = diameter / 2,
    innerRadius = radius - 100;
var cluster = d3.layout.cluster()
    .size([360, innerRadius])
    .sort(null)
    .value(function(d) { return d.size; });
var bundle = d3.layout.bundle();
var line = d3.svg.line.radial()
    .interpolate("bundle")
    .tension(.85)
    .radius(function(d) { return d.y; })
    .angle(function(d) { return d.x / 180 * Math.PI; });
var svg = d3.select("#netgraph").append("svg")
    .attr("width", diameter)
    .attr("height", diameter)
  .append("g")
    .attr("transform", "translate(" + radius + "," + radius + ")");
var link = svg.append("g").selectAll(".link"),
    node = svg.append("g").selectAll(".node");

loadResolve();

  var classes = [];
  var prevHost = "";
	var i = 0, overflow = 0;
	var selectedHosts = {};
	var hostLimit = 150;
	$.each(filteredHosts, function(h, host) {
		if(i < hostLimit) {
			// Reverse hostname to allow DNS grouping
			var reversed = host.split(/\./).reverse().join('.');
			var hostData = {name: reversed, size:1, imports:[]};
			classes.push(hostData);
			selectedHosts[host] = hostData;
			i+=1;
		} else {
			overflow = 1;
		}
	});
	classes.push({name: 'Unknown', size:1, imports:[]});

	if(overflow)
		$('#loadmessage i').html("Only displaying "+hostLimit+"/"+filteredHosts.length+" hosts. Please click a host name to further filter...");
	else
		$('#loadmessage').hide();

        getData("Network", function(netdata) {
		$.each(selectedHosts, function(host, hostData) {
		        // get connections for these hosts
			var connections = [];
			$.each(netdata.results, function(i, item) {
				if(item.host == host && item.policy == "Connections") {
				var m = item.message.split(/ /);
				for(var c in m) {
					var fields = m[c].split(/:/);
					if(fields[5]) {
						var resolved=resolveIp(fields[3]);
						if(resolved.match(/^[0-9]/))
							resolved="Unknown";
						if(resolved in selectedHosts) {
							//console.log("conn "+ host+ " <-> "+fields[3]+" ("+resolved+")");
							hostData.imports.push(resolved.split(/\./).reverse().join('.'));
						}
					}
				}
				}
			});
			hostData.size = hostData.imports.length*30 + 1;
		});


  var nodes = cluster.nodes(packageHierarchy(classes)),
      links = packageImports(nodes);
  link = link
      .data(bundle(links))
    .enter().append("path")
      .each(function(d) { d.source = d[0], d.target = d[d.length - 1]; })
      .attr("class", "link")
      .attr("d", line);
  node = node
      .data(nodes.filter(function(n) { return !n.children; }))
    .enter().append("text")
      .attr("class", "node")
      .attr("dy", ".31em")
      .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
      .style("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
      .text(function(d) { return d.key; })
      .on("mouseover", mouseovered)
      .on("mouseout", mouseouted);
});
	
function mouseovered(d) {
console.log("mouse over");
  node
      .each(function(n) { n.target = n.source = false; });
  link
      .classed("link--target", function(l) { if (l.target === d) return l.source.source = true; })
      .classed("link--source", function(l) { if (l.source === d) return l.target.target = true; })
    .filter(function(l) { return l.target === d || l.source === d; })
      .each(function() { this.parentNode.appendChild(this); });
  node
      .classed("node--target", function(n) { return n.target; })
      .classed("node--source", function(n) { return n.source; });
}
function mouseouted(d) {
  link
      .classed("link--target", false)
      .classed("link--source", false);
  node
      .classed("node--target", false)
      .classed("node--source", false);
}
d3.select(self.frameElement).style("height", diameter + "px");
// Lazily construct the package hierarchy from class names.
function packageHierarchy(classes) {
  var map = {};
  function find(name, data) {
    var node = map[name], i;
    if (!node) {
      node = map[name] = data || {name: name, children: []};
      if (name.length) {
        node.parent = find(name.substring(0, i = name.lastIndexOf(".")));
        node.parent.children.push(node);
        node.key = name.substring(i + 1);
      }
    }
    return node;
  }
  classes.forEach(function(d) {
    find(d.name, d);
  });
  return map[""];
}
// Return a list of imports for the given array of nodes.
function packageImports(nodes) {
  var map = {},
      imports = [];
  // Compute a map from name to node.
  nodes.forEach(function(d) {
    map[d.name] = d;
  });
  // For each import, construct a link from the source to target node.
  nodes.forEach(function(d) {
    if (d.imports) d.imports.forEach(function(i) {
      imports.push({source: map[d.name], target: map[i]});
    });
  });
  return imports;
}

/*

	getData("inventory "+params.iT, function(data) {
			var legendIndex = {};
			var legend = [];
			var pcolor = [];

			$.each(data.results, function (i, f) {
					if(-1 == filteredHosts.indexOf(f.host))
						return;

					var values = f.values.split(/ /).filter(function(i) {
						return i != '';
					});

					// Update legend
					$.each(values, function(i, c) {
						if(-1 !== legend.indexOf(c))
							return;
						legendIndex[c] = legend.length;
						legend.push(c);
					});

					// Add host to group
					var groupName = getGroupByHost(params.gT, f.host);
					var groupClassName = groupName.replace(/[\.#\/]/g, "_");
					if($('#inventoryMap').find('#'+groupClassName).length == 0)
						$('#inventoryMap').append('<tr class="hostMapGroup" id="'+groupClassName+'"><td><span class="groupName">'+groupName+'</span></td><td><span class="boxes"/></td></tr>');

					var content = '';
					if(values.length > 0) {
						content += "<table style='border:0' cellspacing='0' cellpadding='1px' width='100%'><tr>";
						for(var p in values)
							content += "<td style='border:0;padding:1px;height:10px' class='legendIndex"+legendIndex[values[p]]+"'></td>";
						content += "</tr></table>";
					}
					content = "<div class='hostMapBox KNOWN' title='"+f.host+" "+(values.length > 0?values.join(","):"")+"' onclick='setLocationHash({view:\"netmap\",h:\""+f.host+"\"});'>" + content + "</div>";
					$('#' + groupClassName + ' .boxes').append(content);
			});

			// Determine which palette to use (shaded for numeric values)
			// and high contrast for non-numeric values
			var numeric = 1;
			for(var l in legend) {
				if(!legend[l].match(/^[0-9]+$/))
					numeric = 0;
			}

			// Create colors for numeric legend by title
			// and for non-numeric legends by index
			var lastElem = legend.sort(legendSort)[legend.length-1];
			for(var l in legend.sort(legendSort)) {
				var name = legend[l];
				$('#legend').append("<span class='legendItem legendIndex"+legendIndex[name]+"' title='"+name+"'>"+name+"</span>");
				if(numeric) {
						if(0 != name)
							$('.legendIndex'+legendIndex[name]).css("background", "rgb("+Math.ceil(153-(153*name/lastElem))+", "+Math.ceil(255-(255*name/lastElem))+", 102)");
						else
							$('.legendIndex'+legendIndex[name]).css("background", "white");
				} else {
					$('.legendIndex'+legendIndex[name]).css("background", color(legendIndex[name]));
				}
			}

			$("#inventoryMap").tablesorter({sortList: [[0,0]]});
	});
*/
};
