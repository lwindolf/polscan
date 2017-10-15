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

renderers.hostmap.prototype.changeVisibility = function(data) {
return;
	// Hide all
	$('#hostmap div.hostMapBox').hide();

	// Selectively show stuff
	$.each(data.legend.selection, function(i, li) {
		$('#legend .legendIndex'+li).css("background", color(li));
		$('#hostmap div.hostMapBox td.legendIndex'+li).show();
		$('#hostmap div.hostMapBox td.legendIndex'+li).parents().show();
	});
	$('#hostmap tr.hostMapGroup').each(function() {
		if($(this).find('table:visible').length == 0)
			$(this).hide();
		else
			$(this).children().show();
	});
}

renderers.hostmap.prototype.render = function(id, data, params) {
	var r = this;

	$(id).append('<table id="hostmap" class="resultTable tablesorter"><thead>'+
				 '<tr><th>Group</th>'+
				 ('color' !== data.legend.type?'<th>C</th><th>W</th>':'')+
				 '<th>Nr</th></tr></thead></table><div id="selectedGroup"/>');

	var findingsByHost = new Array();

	$.each(data.results, function(i, item) {
		if('policy' === data.legend.type)
			// Instead of complex counting we make strings with the first char
			// of all findings severities by host e.g. "FFOOOOOOFWOOOO" for
			// 3 times failed and 1 warning
			findingsByHost[item.host] += item.severity.substring(0,1);

		if('color' === data.legend.type)
			findingsByHost[item.host] = item.values; // Overwrite as inventory should be 1:1
	});

	for(host in findingsByHost) {
		var value = findingsByHost[host];
		var html = "";
		var count;

		if('policy' === data.legend.type) {
			html = "<div host='"+host+"' class='hostMapBox ";
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
		}
		if('color' === data.legend.type) {
			var values = value.split(/ /).filter(function(i) {
				return i != '';
			});
			if(values.length > 0) {
				html += "<table class='hostMapBox' style='border:0' cellspacing='0' cellpadding='1px' width='100%'><tr>";
				for(var p in values.sort())
					html += "<td style='background:"+color(data.legend.colors[values[p]])+";border:0;padding:1px;height:10px' class='legendIndex"+data.legend.colors[values[p]]+"'></td>";
				html += "</tr></table>";
			}

		}
		var groupName = getGroupByHost(params.gT, host);
		var groupClassName = groupName.replace(/[\.#\/]/g, "_");
		if($('#hostmap').find('#'+groupClassName).length == 0)
			$('#hostmap').append('<tr class="hostMapGroup" id="'+groupClassName+'"><td class="boxesBox"><span class="groupName">'+groupName+'</span><span class="boxes"/></td>'+
								 ('color' !== data.legend.type?'<td class="fcount"/><td class="wcount"/>':'')+
								 '<td class="count"/></tr>');
		$('#' + groupClassName + ' .boxes').append(html);
	}

	$('#hostmap tr').each(function(t) {
		var count;

		$(this).find('.count').html($(this).find('.boxes .hostMapBox').length);
		$(this).find('.fcount').html($(this).find('.boxes .hostMapBox.FAILED').length);
		$(this).find('.wcount').html($(this).find('.boxes .hostMapBox.WARNING').length);
	});

	this.changeVisibility(data);
	installTooltip('.hostMapBox', this.tooltip);

	if('color' === data.legend.type)
	    $("#hostmap").tablesorter({sortList: [[1,1],[0,0]]});
	else
	    $("#hostmap").tablesorter({sortList: [[1,1],[2,1],[3,1],[0,0]]});
};
