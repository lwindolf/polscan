// vim: set ts=4 sw=4: 
// 3d.js based renderer for displaying finding details in a tree map

renderers.treemap = function treemapRenderer() {
	var fader = function(color) { return d3.interpolateRgb(color, "#fff")(0.8); };

	this.offset = 0;
    this.color = d3.scale.ordinal(["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e0e0e0","#fdbf6f","#ff7f00","#cab2d6"].map(fader));
};

renderers.treemap.prototype.createMap = function(data, width, height) {
	var renderer = this;
	    var paddingAllowance = 1;
	var treemap = d3.layout.treemap()
        .size([width, height])
        .padding([18, 0, 0, 0])
        .value(function(d) {
            return d.value;
        });

    var svg = d3.select("#treemap").append("svg")
        .style("position", "relative")
        .style("width", width + "px")
        .style("height", height + "px")
        .append("g")
        .attr("transform", "translate(-.5,-.5)");

	      var cell = svg.data([data]).selectAll("g")
            .data(treemap)
            .enter().append("g")
            .attr("class", "cell")
            .attr("transform", function(d) {
                return "translate(" + d.x + "," + d.y + ")";
            });

        cell.append("rect")
            .attr("width", function(d) {
                return d.dx;
            })
            .attr("height", function(d) {
                return d.dy;
            })
            .style("fill", function(d) {
                if('all' === d.name)
        			return '#aaa';
                if(1 === d.depth)
        			return '#777';
				if(undefined !== d.color)
					return d.color;
				return 'white';
				//return d3.interpolateRgb(color(d.parent.name), "#fff")(0.8);
            });

        if (window['isIE']) { // IE sucks so you have to manually truncate the labels here
            cell.append("text")
                .attr("class", "foreignObject")
                .attr("transform", "translate(3, 13)")
                .text(function(d) {
                    return (d.dy < 16 ? "" : d.name);
                })
                .filter(function(d) {
                    d.tw = this.getComputedTextLength();
                    return d.dx < d.tw;
                })
                .each(function(d) { // ridiculous routine where we test to see if label is short enough to fit
                    var proposedLabel = d.name;
                    var proposedLabelArray = proposedLabel.split('');
                    while (d.tw > d.dx && proposedLabelArray.length) {
                        // pull out 3 chars at a time to speed things up (one at a time is too slow)
                        proposedLabelArray.pop(); proposedLabelArray.pop(); proposedLabelArray.pop();
                        if (proposedLabelArray.length===0) {
                            proposedLabel = "";
                        } else {
                            proposedLabel = proposedLabelArray.join('') + "..."; // manually truncate with ellipsis
                        }
                        d3.select(this).text(proposedLabel);
                        d.tw = this.getComputedTextLength();
                    }
                });
        } else {
            // normal browsers use these labels; using foreignObject inside SVG allows use of wrapping text inside
            // divs rather than less-flexible svg-text labels
            cell.append("foreignObject")
				.attr("class", function(d) {
					return "foreignObject depth"+d.depth;
				})
                .attr("width", function(d) {
                    return d.dx - paddingAllowance;
                })
                .attr("height", function(d) {
                    return Math.max(d.dy - paddingAllowance, 0);
                })
                .append("xhtml:body")
                .attr("class", "labelbody")
                .append("div")
                .attr("class", "label")
                .text(function(d) {
                    return d.name;
                })
                .attr("text-anchor", "middle")
        }
      /*.each(function(d) { d.node = this; })
      .on("mouseover", renderer.hovered(true))
      .on("mouseout", renderer.hovered(false))
      .text(function(d) { return d.id.substring(d.id.lastIndexOf(".") + 1).split(/(?=[A-Z][^A-Z])/g).join("\u200b"); });
	*/
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
	var sizes = [];
    var grps = {};
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
