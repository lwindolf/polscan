// vim: set ts=4 sw=4:
// Renderer for displaying finding details in a sortable table
// Loads row asynchronously to allow for larger tables

renderers.table = function tableRenderer(parentDiv) {
	this.tableLoadTimeout = undefined;
};

renderers.table.prototype.filterByLegend = function(legend) {

	if(legend.selection && legend.selection.length) {
		// Hide all
		$('.resultTable tr').hide();

		// Selectively show stuff
		$.each(legend.selection, function(i, li) {

			$('.resultTable tr[data-legend-index='+li+']').show();
			$('.resultTable tr[data-legend-index='+li+']').children().show();
		});
	} else {
		// Show all
		$('.resultTable tr').show();
	}
};

renderers.table.prototype.sortTable = function(id, sortOrder) {
	$('#loadmessage i').html('Sorting results...');
	console.log("Table setup done.");
	this.tableLoadTimeout = setTimeout(function() {
		try {
			$(id).tablesorter(sortOrder);
		} catch(e) {
		}
		console.log("Table sorting done.");
		$('#loadmessage').hide();
	}, 100);
};

renderers.table.prototype.addResultRows = function(name, rows, offset, count, sortOrder) {
	var renderer = this;
	var r = "";
	for(var i = offset; i < offset+count; i++) {
		if(rows[i])
			r += "<tr>" + rows[i] + "</tr>";
	}
	$("#resultTable"+name+" tbody").append(r);
	if(offset + count < rows.length) {
		resultTableLoadTimeout = setTimeout(function() {
			$('#loadmessage i').html('Loading results ('+Math.ceil(100*offset/rows.length)+'%)...');
			renderer.addResultRows(name, rows, offset+count, count, sortOrder);
		}, 100);
	} else {
		// Enable table sorting
		if(sortOrder != null)
			this.sortTable("#resultTable"+name, sortOrder);

		// Enable clicking
		$("#resultTable"+name+" .group").click(function() {
			setLocationHash({ fG: $(this).html()}, true);
		});
		$("#resultTable"+name+" .policy").click(function() {
			setLocationHash({ fG: name, sT: $(this).html()}, true);
		});
		$("#resultTable"+name+" .host").click(function() {
			setLocationHash({ fG: name, sT: $(this).html()}, true);
		});
	}
};

renderers.table.prototype.createGroupTable = function(id, data, params) {

	clearTimeout(this.tableLoadTimeout);
	$('#loadmessage').show();
	$('.resultTable').empty();
	$('.resultTable').remove();
	$("<table id='resultTable"+params.fG+"' class='resultTable tablesorter'>")
	.html("<thead><tr><th>"+params.gI+"</th><th>Count</th><th>Hosts</th></thead><tbody/>")
	.appendTo(id);

	console.log("Grouping hosts by '"+params.gI+"'");
	var hosts = [];
	var values = [];
	$.each(data.results, function( i, item ) {
			// 3 supported split types and priority:
			//
			// 1.) Explicit field separator
			//     (if first character after : is not a space)
			//     in this case we split on this character.
			//
			// 2.) Fuzzy split on commatas
			//     (if first character after : is a space and string has commatas)
			//
			// 3.) Fuzyy split on white spaces
			//     (default)
			var listStr = item.message.substring(params.gI.length + 2);
			var splitMarker = item.message.substring(params.gI.length + 2)[0];
			var list;

			console.log(">>>"+splitMarker+"<<<");
			if(splitMarker !== ' ')
				list = listStr.split(splitMarker);
			else if(listStr.indexOf(',') != -1)
				list = listStr.split(/\s*,\s*/);
			else
				list = listStr.split(/\s+/);

			for(var key in list) {
				if(list[key] == "")
					continue;
				if(values[list[key]] === undefined)
					values[list[key]] = 1;

				if(hosts[list[key]] === undefined)
					hosts[list[key]] = [];
				hosts[list[key]].push(item.host);
			}
	});
	console.log("Parsing done.");

	var rows = new Array(250);
	for(var key in values) {
		var hostlinks = "";
		for(var h in hosts[key])
			hostlinks += "<a href='javascript:setLocationHash({ fG: \"all\", sT: \""+hosts[key][h]+"\"}, true);' class='host'>"+hosts[key][h]+"</a> ";
		rows.push('<td class="groupByValue">' + key + '</td>' +
				'<td class="count">' + hosts[key].length + '</td>' +
				'<td class="hosts">' + hostlinks + '</td>');
		// Avoid OOM
		if(rows.length >= 250) {
			this.addResultRows(params.fG, rows, 0, 500, null);
			rows = new Array(250);
		}
	}
	this.sortTable("#resultTable"+params.fG, {sortList: [[1,1]]});
};

renderers.table.prototype.createResultTable = function(id, data, params) {
	var group = '';
	var name = params.fG;

	if(!name)
		name = 'all';

	if (name == 'all' || name == 'new' || name == 'solved')
		group = '<th>Group</th>';

	clearTimeout(this.tableLoadTimeout);
	$('#loadmessage').show();
	$("<table id='resultTable"+name+"' class='resultTable tablesorter'>")
		.html("<thead><tr><th>Host</th>"+group+"<th>Policy</th><th title='Severity'>&nbsp;</th><th>Details</th></thead>")
		.appendTo(id);
	$('<tbody>').appendTo('#resultTable'+name);

	groupBy = [];
	var rows = "";
	var visibleHosts = [];
	$.each(data.results, function( i, item ) {
		var severity = 0;

		if(item.severity == 'FAILED') {
			severity = 2;
		}
		if(item.severity == 'WARNING') {
			severity = 1;
		}
		visibleHosts[item.host] = 1;

		if(0 !== severity)
			rows += '<tr data-legend-index="'+data.legend.idToIndex[item.severity+":::"+(item.group?item.group:params.fG) + ":::" + item.policy]+'">';
		else
			rows += '<tr>';

        rows += '<td class="host">' + item.host + '</td>';
		if(item.group)
			rows += '<td class="group">' + item.group + '</td>';
		rows +=
			'<td class="policy">' + item.policy + '</td>' +
			'<td class="severity '+item.severity+'">'+severity+'</td>' +
			'<td class="message">' + item.message + '</td></tr>';

		// Fill array of possible groupings
		//
		// A group is indicated by a colon in the detail message
		// followed by any whitespace or comma separated list.
		var pos = item.message.indexOf(':');
		if(pos != -1) {
			var groupByStr = item.message.substring(0, pos);
			if(groupBy[groupByStr] === undefined) {
				groupBy[groupByStr] = 1;
			} else {
				groupBy[groupByStr]++;
			}
		}
	});
	console.log("Parsing done.");
	this.addResultRows(name, rows.split(/<tr>/), 0, 100, {sortList: [[2,1],[0,0]]});

	if(groupBy.length >= 0) {
		var groupingEnabled = false;
		for(var key in groupBy) {
			if(groupBy[key] > 3 && key.length > 3) {
				groupingEnabled = true;
				$('#groupById').append("<option>"+key+"</option>");
			}
		}
		if(groupingEnabled)
			$('#groupById').removeAttr('disabled');
	}
};

renderers.table.prototype.render = function(id, data, params) {
	if(!params.gI)
		this.createResultTable(id, data, params);
	else
		this.createGroupTable(id, data, params);
};
