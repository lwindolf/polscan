// vim: set ts=4 sw=4: 
/* A HTML renderer using a mix of table and map, to visualize a
   distribution of findings over host groups. Represents hosts 
   as color coded boxes according to maximum finding severity */

renderers.hostmap = function hostmapRenderer() { };

renderers.hostmap.prototype.tooltip = function(container, event, data) {
	var host = $(container).attr('host');
	var details = "";
	var okFound = false;

	$.each(data.results, function(i, item) {
		if(item.host === host) {
			if(item.severity && item.severity === "OK") {
				okFound = true;
			}
			if(item.group && item.policy) {
				details += "<tr>";
				details += "<td class='group'>" + item.group + "</td>";
				details += "<td class='policy "+item.severity+"'>" + item.policy + "</td><td class='message'>" + ((item.message.length>100)?item.message.substring(0,100)+" [...]":item.message) + "</td>";
				details += "</tr>";
			} else {
				if(item.values) {
					var tmp = item.values.split(/ /);
					for(var v in tmp)
						if(tmp[v] !== '')
							details += "<tr><td style='border-left: 24px solid "+view.current.getLegendColorByValue(tmp[v])+"'>"+tmp[v]+"</td></tr>";
				}
			}
		}
	});
	if(details == "")
		if(okFound)
			details = "<br/><br/>No problematic findings here.";
		else
			details = "<br/><br/>No findings at all. This usually means the policies of this group don't apply to this host.";

	return '<b>'+host+'</b><table class="resultTable">'+details+'</table>';
};

renderers.hostmap.prototype.hideUnusedTableElements = function(legend) {

	// Hide empty host groups rows
	$('#hostmap tr.hostMapGroup').each(function() {
		if(($(this).find('table:visible').length == 0) &&
		   ($(this).find('.boxes:visible').length == 0))
			$(this).hide();
		else
			$(this).children().show();
	});

	// Update counters
	$('#hostmap tbody tr').each(function(t) {
		var count;

		$(this).find('.count').html($(this).find('.boxes .hostMapBox:visible').length);
		$(this).find('.fcount').html($(this).find('.boxes .hostMapBox.FAILED:visible').length);
		$(this).find('.wcount').html($(this).find('.boxes .hostMapBox.WARNING:visible').length);
	});

	// Hide columns not matching the data source
	if(undefined === legend.colors) {
	    $('#hostmap .fcount').hide();
	    $('#hostmap .wcount').hide();
	    $('#hostmap .boxes:empty').parent().parent().hide();
	}
}

renderers.hostmap.prototype.filterByLegend = function(legend) {

	if(legend.selection && legend.selection.length) {
		// Hide all
		$('#hostmap .hostMapBox').hide();

		// Selectively show stuff
		$.each(legend.selection, function(i, index) {
			var li = legend.order[index];
			$('#hostmap .legendIndex'+li).show();
			$('#hostmap .legendIndex'+li).parents().show();
		});
	} else {
		// Show all
		$('#hostmap tr.hostMapGroup').show();
	}

	this.hideUnusedTableElements(legend);
};

renderers.hostmap.prototype.render = function(id, data, params) {
	var r = this;

	$(id).append('<table id="hostmap" class="resultTable tablesorter"><thead>'+
				 '<tr><th>Group</th>'+
				 ('color' !== data.legend.type?'<th class="fcount">C</th><th class="wcount">W</th>':'')+
				 '<th>Nr</th></tr></thead></table><div id="selectedGroup"/>');

	var findingsByHost = [];

	$.each(data.results, function(i, item) {
		if(undefined !== data.legend.colors)
			// Instead of complex counting we make strings with the first char
			// of all findings severities by host e.g. "FFOOOOOOFWOOOO" for
			// 3 times failed and 1 warning
			findingsByHost[item.host] += item.severity.substring(0,1);
		else
			findingsByHost[item.host] = item.values; // Overwrite as inventory should be 1:1
	});

	for(var host in findingsByHost) {
		var value = findingsByHost[host];
		var html = "";
		var count;

		if(undefined !== data.legend.colors) {
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
			html += "' onclick='setLocationHash({ view: \"ScanResults\", r: \"table\", fG: \"all\", sT: \""+host+"\"}, true)'><span class='legendIndexFIXME'>&nbsp;</span></div> ";
		} else {
			var values = value.split(/ /).filter(function(i) {
				return i != '';
			});
			if(values.length > 0) {
				html += "<table host='"+host+"' class='hostMapBox' style='border:0' cellspacing='0' cellpadding='1px' width='100%'><tr>";
				for(var p in values.sort())
					html += "<td style='background:"+view.current.getLegendColorByValue(values[p])+";border:0;padding:1px;height:10px' class='legendIndex"+data.legend.colorIndex[values[p]]+"'></td>";
				html += "</tr></table>";
			}

		}
		var groupName = getGroupByHost(params.gT, host);
		var groupClassName = groupName.replace(/[\.#\/]/g, "_");
		if($('#hostmap').find('#'+groupClassName).length == 0)
			$('#hostmap').append('<tr class="hostMapGroup" id="'+groupClassName+'"><td class="boxesBox"><span class="groupName">'+groupName+'</span><span class="boxes"/></td>'+
								 '<td class="fcount"/><td class="wcount"/>'+
								 '<td class="count"/></tr>');
		$('#' + groupClassName + ' .boxes').append(html);
	}

	this.filterByLegend(data.legend);
	installTooltip('.hostMapBox', this.tooltip, data);
	        
	$("#hostmap").tablesorter({sortList: [[1,1],[2,1],[3,1],[0,0]]});
};
