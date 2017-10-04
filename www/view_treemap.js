// vim: set ts=4 sw=4: 
// View for displaying finding details in a tree map

views.TreemapView = function ResultsView(parentDiv) {
	this.parentDiv = parentDiv;
	this.filterOptions = {
		findings: true,
		groupbyid: true,
		filterby: true,
		search: true,
		copyHosts: true
	};
};

var offset = 0;

var fader = function(color) { return d3.interpolateRgb(color, "#fff")(0.3); },
    color = d3.scaleOrdinal(["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e0e0e0","#fdbf6f","#ff7f00","#cab2d6"].map(fader));
    format = d3.format(",d");

var stratify = d3.stratify()
    .parentId(function(d) { return d.id.substring(0, d.id.lastIndexOf(".")); });

function mymap(data, width, height) {

var treemap = d3.treemap()
    .size([width, height])
    .paddingInner(1)
    .paddingOuter(offset)
    .paddingTop(function(d) { return d.depth < 3 ? 19 : offset; })
    .round(true);
    
  var root = stratify(data)
      .sum(function(d) { return d.value; })
      .sort(function(a, b) { return b.height - a.height || b.value - a.value; });

  cascade(treemap(root));

  d3.select("#treemap")
    .selectAll(".node")
    .data(root.descendants())
    .enter().append("div")
      .attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--left"); })
      .attr("title", function(d) { return d.data.name + "\n" + format(d.value)+' Hosts'; })
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
            return color(d.parent.data.nr);
      })
      .each(function(d) { d.node = this; })
      .on("mouseover", hovered(true))
      .on("mouseout", hovered(false))
      .text(function(d) { return d.id.substring(d.id.lastIndexOf(".") + 1).split(/(?=[A-Z][^A-Z])/g).join("\u200b"); });
}

function cascade(root) {
  return root.eachAfter(function(d) {
    if (d.children) {
      d.heightRight = 1 + d3.max(d.children, function(c) { return c.x1 === d.x1 - offset ? c.heightRight : NaN; });
      d.heightBottom = 1 + d3.max(d.children, function(c) { return c.y1 === d.y1 - offset  ? c.heightBottom : NaN; });
    } else {
      d.heightRight =
      d.heightBottom = 0;
    }
  }).eachBefore(function(d) {
    d.x1 -= 2 * offset * d.heightRight;
    d.y1 -= 2 * offset * d.heightBottom;
  });
}

function hovered(hover) {
  return function(d) {
    d3.selectAll(d.ancestors().map(function(d) { return d.node; }))
        .classed("node--hover", hover);
  };
}
        
views.TreemapView.prototype.addHostsToMap = function(params) {
	var view = this;
	view.failed = 0;
	view.warning = 0;

	getData(params.fG, function(data) {
		var findingsByHost = new Array();
		var filteredHosts = get_hosts_filtered(params, true)

		if(undefined === filteredHosts)
			filteredHosts = Object.keys(findingsByHost);

		// Instead of complex counting we make strings with the first char
		// of all findings severities by host e.g. "FFOOOOOOFWOOOO" for
		// 3 times failed and 1 warning
		$.each(data.results, function(i, item) {
			if(-1 !== filteredHosts.indexOf(item.host)) {
				findingsByHost[item.host] += item.severity.substring(0,1);
				if('FAILED' === item.severity)
					view.failed += 1;
				if('WARNING' === item.severity)
					view.warning += 1;
			}
		});
		viewInfoReset('Scan Results');
		viewInfoAddBlock('Hosts', filteredHosts.length);
		viewInfoAddBlock('Failed', view.failed);
		viewInfoAddBlock('Warnings', view.warning);
		viewInfoAddSwitches(['results', 'hostmap', 'treemap'], 'treemap');

		var sizes = [];
        var grps = {};
		var nr = 0;
        Object.keys(findingsByHost).forEach(function(h) {
			// right now we support only subdomain prefix as 1st criteria
			// and params.gT as 2nd...
			var parent = h.split(/\./)[1];
			var group = getGroupByHost(params.gT, h);
			var key = parent +'.'+ group.replace(/\./g, "_");

			if(undefined === grps[parent])
				grps[parent] = { id: 'all.'+parent, name: parent, value: 0, cl: 0, nr:nr++ };
            if(undefined === grps[key])
				grps[key] = { id: 'all.'+key, name: group, value: 0, cl: 0 };

			if(-1 !== findingsByHost[h].indexOf('F'))
				grps[key].cl |= 2;
			if(-1 !== findingsByHost[h].indexOf('W'))
				grps[key].cl |= 1;
			if(-1 !== findingsByHost[h].indexOf('O'))
				grps[key].cl |= 4;

			grps[key].value++;
        });
		$.each(grps, function(k, v) {
			sizes.push(v);
		});

        sizes.push({ id : 'all' });
        mymap(sizes, $(window).width()-$('#menu').width(), $(window).height()-$('#results').offset().top);
	});
};


views.TreemapView.prototype.update = function(params) {
	clean();
	
	if(params.fG) {
		if(!params.gT)
			params.gT = "Domain";	// This usually does exist

		$(this.parentDiv).html('<div id="treemapContainer"><div id="treemap"/></div>');
		this.addHostsToMap(params);
	} else {
		$(this.parentDiv).append('<h2>Findings By Group</h2>');
		group_list(this.parentDiv, 'hostmap');
	}
};
