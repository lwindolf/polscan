// vim: set ts=4 sw=4: 
/* A HTML renderer using a mix of table and map, to visualize a
   distribution of findings over host groups. Represents hosts 
   as color coded boxes according to maximum finding severity */

renderers.hostmap = function hostmapRenderer() { };

renderers.hostmap.prototype.tooltip = function(container, event) {
	var host = $(container).attr('host');
	var details = "";
	var okFound = false;
	var cache = resultCache[$('#findingsGroup').val().replace('-', '_')];

	if(!cache)
		console.log("Fatal: no cache for "+$('#findingsGroup').val());
	else
		$.each(cache.results, function(i, item) {
			if(item.host == host) {
				if(item.severity == "OK") {
					okFound = true;
				} else {
					details += "<tr>";
				if(item.group)
					details += "<td class='group'>" + item.group + "</td>";
					details += "<td class='policy "+item.severity+"'>" + item.policy + "</td><td class='message'>" + ((item.message.length>100)?item.message.substring(0,100)+" [...]":item.message) + "</td></tr>";
				}
			}
		});
	if(details == "")
		if(okFound)
			details = "<br/><br/>No problematic findings here.";
		else
			details = "<br/><br/>No findings at all. This usually means the policies of this group don't apply to this host.";

	return '<b>'+host+'</b><table class="resultTable">'+details+'</table>';
}

renderers.hostmap.prototype.render = function(id, results, params) {
	var r = this;
	this.topFindings = {};
	this.legendColorIndex = {};
    this.legendSelection = [];

	$(id).append('<div id="legend" title="Click to filter a legend item. Hold Ctrl and click to multi-select."><b>Legend</b></div><table id="hostmap" class="resultTable tablesorter"><thead><tr><th>Group</th><th>C</th><th>W</th><th>Nr</th></tr></thead></table><div id="selectedGroup"/>');

	var findingsByHost = new Array();

	// Instead of complex counting we make strings with the first char
	// of all findings severities by host e.g. "FFOOOOOOFWOOOO" for
	// 3 times failed and 1 warning
	$.each(results, function(i, item) {
		findingsByHost[item.host] += item.severity.substring(0,1);
		if('OK' !== item.severity) {
			var topKey = item.severity+":::"+(item.group?item.group:data.group)+':::'+item.policy;
			if(undefined === r.topFindings[topKey]) {
				var i = Object.keys(r.topFindings).length;
				r.legendColorIndex[i] = i;
				r.topFindings[topKey] = 0;
			}
			r.topFindings[topKey]++;
		}
	});

	for(host in findingsByHost) {
		var value = findingsByHost[host];
		var html = "<div host='"+host+"' class='hostMapBox ";
		var count;

		if(!value)
			value = "";
		if(-1 != value.indexOf('F')) {
			count = (value.match(/F/g) || []).length;
			html += "FAILED bcf"+((count>10)?10:count);
		} else if(-1 != value.indexOf('W')) {
			count = (value.match(/W/g) || []).length;
			html += "WARNING bcw"+((count>10)?10:count);
		} else if(-1 != value.indexOf('O')) {
			html += "OK";
		} else {
			html += "NORESULTS";
		}
		html += "' onclick='setLocationHash({ view: \"ScanResults\", r: \"table\", fG: \"all\", sT: \""+host+"\"}, true)'>&nbsp;</div> ";
		var groupName = getGroupByHost(params.gT, host);
		var groupClassName = groupName.replace(/[\.#\/]/g, "_");
		if($('#hostmap').find('#'+groupClassName).length == 0)
			$('#hostmap').append('<tr class="hostMapGroup" id="'+groupClassName+'"><td class="boxesBox"><span class="groupName">'+groupName+'</span><span class="boxes"/></td><td class="fcount"/><td class="wcount"/><td class="count"/></tr>');
		$('#' + groupClassName + ' .boxes').append(html);
	}

	$('#hostmap tr').each(function(t) {
		var count;

		$(this).find('.count').html($(this).find('.boxes .hostMapBox').length);
		$(this).find('.fcount').html($(this).find('.boxes .hostMapBox.FAILED').length);
		$(this).find('.wcount').html($(this).find('.boxes .hostMapBox.WARNING').length);
	});

	//FIXME: legend is a view property and does not belong to the renderer!
    // Create colors for numeric legend by title
    // and for non-numeric legends by index
	var numeric = 0;
    var lastElem = r.topFindings[r.topFindings.length-1];
	var i = 0;
	Object.keys(r.topFindings).sort(function(a,b) {
		if((-1 !== a.indexOf('FAILED')  && -1 !== b.indexOf('FAILED')) || 
		   (-1 !== a.indexOf('WARNING') && -1 !== b.indexOf('WARNING')))
			return r.topFindings[b] - r.topFindings[a];
		if(-1 !== a.indexOf('FAILED'))
			return -1;
		return 1;
	}).forEach(function(name) {
        var count = r.topFindings[name];
		var tmp = name.split(/:::/);
		var colorClass = tmp[0];
        $('#legend').append("<span class='legendItem legendIndex"+i+"' title='"+tmp[1]+" - "+tmp[2]+"'>"+tmp[1]+' - '+tmp[2]+" ("+count+")</span>");
        $('.legendIndex'+i).addClass(colorClass);
		i++;
    });

	installTooltip('.hostMapBox', this.tooltip);
    $("#hostmap").tablesorter({sortList: [[1,1],[2,1],[3,1],[0,0]]});
};
