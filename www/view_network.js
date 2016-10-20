// vim: set ts=4 sw=4: 
/* A view visualizing active network connections using 
   network inventory. */

views.NetworkView = function NetworkView(parentDiv, params) {
	this.parentDiv = parentDiv;
	this.filterOptions = {
		filterby: true,
		search: true,
		nt: true
	};
};

views.NetworkView.prototype.update = function(params) {
	if(!("nt" in params)) {
		setLocationHash({
			nt: params.nt?params.nt:'TCP connection'
		});
		return;
	}
		
	this.neType = params.nt;
		
	clean();
	$('#loadmessage').show();
	$('#loadmessage i').html("Loading...");
	$(this.parentDiv).append('<div id="networkSelectedName"><i>Hover over names to view FQDNs and click to see connection details.</i></div><div id="netgraph"/>');

	var filteredHosts = get_hosts_filtered(params, true);

// FIXME: link to mbostock example id
var diameter = $(window).height(),
    radius = diameter / 2,
    innerRadius = radius - 150;
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

  var classes = [];
  var prevHost = "";
	var i = 0, overflow = 0;
	var selectedHosts = {};
	var hostLimit = 200;
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

	// Add two Unresolved and NotShown hosts where we can put all unresolvable connections
	selectedHosts['Unresolved_Internal'] = {name: 'Unresolved_Internal', size:1, imports:[]};
	selectedHosts['Unresolved_External'] = {name: 'Unresolved_External', size:1, imports:[]};
	selectedHosts['Not_Shown'] = {name: 'Not_Shown', size:1, imports:[]};
	classes.push(selectedHosts['Unresolved_Internal']);
	classes.push(selectedHosts['Unresolved_External']);
	classes.push(selectedHosts['Not_Shown']);

	if(overflow)
		$('#loadmessage i').html("Only displaying the first "+hostLimit+" of "+filteredHosts.length+" hosts in this filter/selection. Please choose a smaller group!");
	else
		$('#loadmessage').hide();

	getData("netedge "+this.neType, function(data) {
		$.each(selectedHosts, function(host, hostData) {
		    // get connections for these hosts
			var connections = [];
			$.each(data.results, function(i, item) {
				if(item.host == host) {
					var resolved=resolveIp(item.rn);
					if(resolved.match(/^[0-9]/)) {
						if(resolved.match(/^(172|196|10)\./))
							resolved="Unresolved_Internal";
						else
							resolved="Unresolved_External";
					} else {
						if(!(resolved in selectedHosts)) {
							if(classes.length < hostLimit) {
								// We can add one more...
								selectedHosts[resolved]={name: resolved.split(/\./).reverse().join('.'), size:1, imports:[]};
								classes.push(selectedHosts[resolved]);
							} else {
								resolved="Not_Shown";
							}
						}
					}

					if(resolved in selectedHosts)
						hostData.imports.push(resolved.split(/\./).reverse().join('.'));
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
      .on("click", clicked)
      .on("mouseover", mouseovered)
      .on("mouseout", mouseouted);
});

function clicked(d) {
	setLocationHash({
	    view: 'netmap',
		h: d.name.split('.').reverse().join('.')
	});
}
	
function mouseovered(d) {
  $('#networkSelectedName').html(d.name.split('.').reverse().join('.'));
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
};
