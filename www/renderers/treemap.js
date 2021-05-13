// vim: set ts=4 sw=4:
// 3d.js based renderer for displaying finding details in a tree map

renderers.treemap = function treemapRenderer() {
    var fader = function(color) { return d3.interpolateRgb(color, "#fff")(0.8); };

    this.offset = 0;
    this.color = d3.scaleOrdinal(["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e0e0e0","#fdbf6f","#ff7f00","#cab2d6"].map(fader));
};

// FIXME: global id helper should not be here
var count = 0;

function Id(id) {
    this.id = id;
    this.href = new URL(`#${id}`, location) + "";
}

Id.prototype.toString = function() {
    return "url(" + this.href + ")";
};

function newId() {
    return new Id("O-" + (name == null ? "" : name + "-") + ++count);
}

renderers.treemap.prototype.createMap = function(data, width, height) {
    const format = d3.format(",d");
    var treemap = d3.treemap()
	.tile(d3.treemapSquarify)
	.size([width, height])
	.padding(1)
	.round(true)

    const root = d3.hierarchy(data)
	.sum(d => d.value)
	.sort((a, b) => b.value - a.value);

    treemap(root);

    const svg = d3.select("#treemap").append("svg")
        .attr("viewBox", [0, 0, width, height])
        .style("font", "10px sans-serif")
        .style("position", "relative")
        .style("width", width + "px")
        .style("height", height + "px")
        .append("g")
        .attr("transform", "translate(-.5,-.5)");

    const leaf = svg.selectAll("g")
        .data(root.leaves())
        .join("g")
        .attr("class", "cell")
        .attr("transform", d => `translate(${d.x0},${d.y0})`);

    leaf.append("rect")
	.attr("id", d => (d.leafUid = newId("leaf")))
	.attr("width", d => d.x1 - d.x0)
	.attr("height", d => d.y1 - d.y0)
	.style("fill", function(d) {
	    if('all' === d.name)
		return '#aaa';
	    if(1 === d.depth)
	        return '#777';
	    if(undefined !== d.color) {
	    console.log("color! "+d.color);
	        return d.color;
	        }
	    return 'white';
	    //return d3.interpolateRgb(color(d.parent.name), "#fff")(0.8);
	});

    leaf.append("clipPath")
	.attr("id", d => (d.clipUid = newId("clip")))
	.append("use")
	.attr("xlink:href", d => d.leafUid.href);

    leaf.append("text")
	.attr("clip-path", d => d.clipUid)
	.selectAll("tspan")
	.data(d => d.data.name.split(/(?=[A-Z][a-z])|\s+/g).concat(format(d.value)))
	.join("tspan")
	.attr("x", 3)
	.attr("y", (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`)
	.attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
	.text(d => d);
};

renderers.treemap.prototype.hovered = function(hover) {
  return function(d) {
    d3.selectAll(d.ancestors().map(function(d) { return d.node; }))
        .classed("node--hover", hover);
  };
};

renderers.treemap.prototype.isNumeric = function(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
};

renderers.treemap.prototype.render = function(id, data, params) {
	var r = this;
	var nr = 0;

	$(id).append('<div id="treemapContainer"><div id="treemap"/></div>');

	var filteredHosts = get_hosts_filtered(params, true);
	var findingsByHost = [];
// FIXME
data.legend.selectedValue = Object.keys(data.legend.colorIndex)[0];
console.log(data.legend.selectedValue);
	// Instead of complex counting we make strings with the first char
	// of all findings severities by host e.g. "FFOOOOOOFWOOOO" for
	// 3 times failed and 1 warning
	$.each(data.results, function(i, item) {
		// For policy findings
		if(undefined !== item.severity)
			findingsByHost[item.host] += item.severity.substring(0,1);
		// For vulnerabilities
		if(undefined !== item.cve) {
			if(undefined === findingsByHost[item.host])
				findingsByHost[item.host] = 0;
			findingsByHost[item.host] ++;
		}
		// For inventories
		if(undefined !== item.values) {
			if(-1 !== item.values.indexOf(data.legend.selectedValue))
				findingsByHost[item.host] = "inventory";
			else
				findingsByHost[item.host] = undefined;
		}
	});
console.log(findingsByHost);
	var nodeByName = {};
	var tree = {
		name: "all",
		children: []
	};
	Object.keys(filteredHosts).forEach(function(i) {
		// right now we support only subdomain prefix as 1st criteria
		// and params.gT as 2nd...
		var h = filteredHosts[i];
		var parent = h.split(/\./)[1].replace(/[0-9]+/g, "");
		var group = getGroupByHost(params.gT, h);
		var key = parent+':::'+group;

		if(undefined === nodeByName[parent]) {
			nodeByName[parent] = { name: parent, children: [], value: 0, cl: 0, nr:nr++ };
			tree.children.push(nodeByName[parent]);
		}
		if(undefined === nodeByName[key]) {
			nodeByName[key] = { name: group.replace(new RegExp("^"+parent+"_"), ''), value: 0, cl: 0, parent: nodeByName[parent] };
			nodeByName[parent].children.push(nodeByName[key]);
		}

		if(undefined !== findingsByHost[h]) {
			if(r.isNumeric(findingsByHost[h])) {
				// Vulnerabilities are always bad -> so set to 2 for FAILED
				nodeByName[key].cl |= 2;
			} else {
				// Scan Results
				if(-1 !== findingsByHost[h].indexOf('F'))
					nodeByName[key].cl |= 2;
				if(-1 !== findingsByHost[h].indexOf('W'))
					nodeByName[key].cl |= 1;
				if(-1 !== findingsByHost[h].indexOf('O'))
					nodeByName[key].cl |= 4;

				// Inventories
				if("inventory" === findingsByHost[h])
					nodeByName[key].cl |= 1;
			}
		}
		nodeByName[key].value++;
        });

	$.each(nodeByName, function(name, v) {
		// Perform color mapping
		if(undefined === data.legend.colors) {
			if(1 === v.cl)
				v.color = color(data.legend.colorIndex[data.legend.selectedValue]);
		} else {
			// For policies
			var cl_to_legend_color_name = {
				1: 'WARNING',
				2: 'FAILED',
				4: 'OK'
			};
			$.each([1,4,2], function(nr, i) {
				if(i === (v.cl & i))
					v.color = data.legend.colors[data.legend.colorIndex[cl_to_legend_color_name[i]]];
			});
		}
	});

    this.createMap(tree, $(id).width(), $(window).height()-$('#results').offset().top);
};
