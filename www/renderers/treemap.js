// vim: set ts=4 sw=4: 
// 3d.js based renderer for displaying finding details in a tree map

renderers.treemap = function treemapRenderer() {
	var fader = function(color) { return d3.interpolateRgb(color, "#fff")(0.3); };

	this.offset = 0;
    this.color = d3.scaleOrdinal(["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e0e0e0","#fdbf6f","#ff7f00","#cab2d6"].map(fader));
    this.format = d3.format(",d");

	this.stratify = d3.stratify().parentId(function(d) {
		return d.id.substring(0, d.id.lastIndexOf("."));
	});
};

renderers.treemap.prototype.createMap = function(data, width, height) {
	var renderer = this;
	var treemap = d3.treemap()
		.size([width, height])
		.paddingInner(1)
		.paddingOuter(renderer.offset)
		.paddingTop(function(d) { return d.depth < 3 ? 19 : renderer.offset; })
		.round(true);
    
	var root = this.stratify(data)
	  .sum(function(d) { return d.value; })
	  .sort(function(a, b) { return b.height - a.height || b.value - a.value; });

	this.cascade(treemap(root));

	d3.select("#treemap")
    .selectAll(".node")
    .data(root.descendants())
    .enter().append("div")
      .attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--left"); })
      .attr("title", function(d) { return d.data.name + "\n" + renderer.format(d.value)+' Hosts'; })
      .style("left", function(d) { return d.x0 + "px"; })
      .style("top", function(d) { return d.y0 + "px"; })
      .style("width", function(d) { return d.x1 - d.x0 + "px"; })
      .style("height", function(d) { return d.y1 - d.y0 + "px"; })
      .style("background", function(d) {
            if(null === d.parent)
                return '#ccc';
            if(1 === d.depth)
                return '#777';
            if(undefined !== d.data) {
				if(2 === (d.data.cl & 2))
	                return '#f00';
				if(1 === (d.data.cl & 1))
	                return '#ff0';
				if(4 === (d.data.cl & 4))
	                return '#0f0';
			}
            return renderer.color(d.parent.data.nr);
      })
      .each(function(d) { d.node = this; })
      .on("mouseover", renderer.hovered(true))
      .on("mouseout", renderer.hovered(false))
      .text(function(d) { return d.id.substring(d.id.lastIndexOf(".") + 1).split(/(?=[A-Z][^A-Z])/g).join("\u200b"); });
}

renderers.treemap.prototype.cascade = function(root) {
  var r = this;

  return root.eachAfter(function(d) {
    if (d.children) {
      d.heightRight = 1 + d3.max(d.children, function(c) { return c.x1 === d.x1 - r.offset ? c.heightRight : NaN; });
      d.heightBottom = 1 + d3.max(d.children, function(c) { return c.y1 === d.y1 - r.offset  ? c.heightBottom : NaN; });
    } else {
      d.heightRight =
      d.heightBottom = 0;
    }
  }).eachBefore(function(d) {
    d.x1 -= 2 * r.offset * d.heightRight;
    d.y1 -= 2 * r.offset * d.heightBottom;
  });
}

renderers.treemap.prototype.hovered = function(hover) {
  return function(d) {
    d3.selectAll(d.ancestors().map(function(d) { return d.node; }))
        .classed("node--hover", hover);
  };
}

renderers.treemap.prototype.isNumeric = function(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}
        
renderers.treemap.prototype.render = function(id, data, params) {
	var r = this;
	var sizes = [];
    var grps = {};
	var nr = 0;

	$(id).append('<div id="treemapContainer"><div id="treemap"/></div>');

	var filteredHosts = get_hosts_filtered(params, true);
	var findingsByHost = new Array();

	// Instead of complex counting we make strings with the first char
	// of all findings severities by host e.g. "FFOOOOOOFWOOOO" for
	// 3 times failed and 1 warning
	$.each(data.results, function(i, item) {
		// For policy findings
		if(undefined !== item.severity) 
			findingsByHost[item.host] += item.severity.substring(0,1);
		if(undefined !== item.cve) {
			if(undefined === findingsByHost[item.host])
				findingsByHost[item.host] = 0;
			findingsByHost[item.host] ++;
		}
	});

    Object.keys(filteredHosts).forEach(function(i) {
		// right now we support only subdomain prefix as 1st criteria
		// and params.gT as 2nd...
		var h = filteredHosts[i];
		var parent = h.split(/\./)[1];
		var group = getGroupByHost(params.gT, h);
		var key = parent +'.'+ group.replace(/\./g, "_");

		if(undefined === grps[parent])
			grps[parent] = { id: 'all.'+parent, name: parent, value: 0, cl: 0, nr:nr++ };
        if(undefined === grps[key])
			grps[key] = { id: 'all.'+key, name: group, value: 0, cl: 0 };

		if(undefined !== findingsByHost[h]) {
			if(r.isNumeric(findingsByHost[h])) {
					grps[key].cl |= 2;
			} else {
				if(-1 !== findingsByHost[h].indexOf('F'))
					grps[key].cl |= 2;
				if(-1 !== findingsByHost[h].indexOf('W'))
					grps[key].cl |= 1;
				if(-1 !== findingsByHost[h].indexOf('O'))
					grps[key].cl |= 4;
			}
		}
		grps[key].value++;
    });
	$.each(grps, function(k, v) {
		sizes.push(v);
	});

    sizes.push({ id : 'all' });
    this.createMap(sizes, $(id).width(), $(window).height()-$('#results').offset().top);
};
