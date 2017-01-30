// vim: set ts=4 sw=4: 
// View for displaying finding details in a sortable table

views.ResultsView = function ResultsView(parentDiv) {
	this.parentDiv = parentDiv;
	this.filterOptions = {
		findings: true,
		groupbyid: true,
		filterby: true,
		search: true,
		copyHosts: true
	};
};

var resultTableLoadTimeout;

function sortTable(id, sortOrder) {
	$('#loadmessage i').html('Sorting results...');
	console.log("Table setup done.");
	resultTableLoadTimeout = setTimeout(function() {
		try {
			$(id).tablesorter(sortOrder);
		} catch(e) {
		}
		console.log("Table sorting done.");
		$('#loadmessage').hide();
	}, 100);
}

function addResultRows(name, rows, offset, count, sortOrder) {
	var r = "";
	for(var i = offset; i < offset+count; i++) {
		if(rows[i])
			r += "<tr>" + rows[i] + "</tr>";
	}
	$("#resultTable"+name+" tbody").append(r);
	if(offset + count < rows.length) {
		resultTableLoadTimeout = setTimeout(function() {
			$('#loadmessage i').html('Loading results ('+Math.ceil(100*offset/rows.length)+'%)...');
			addResultRows(name, rows, offset+count, count, sortOrder);
		}, 100);
	} else {
		// Enable table sorting
		if(sortOrder != null)
			sortTable("#resultTable"+name, sortOrder);

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
}

function itemMatches(item) {
	if(this.params.gI !== undefined && item.message.indexOf(this.params.gI) == -1)
		return false;
	if(this.params.sT !== undefined && item.severity == 'OK')
		return false;

	if(params.sT &&
	  !((item.host.indexOf(this.params.sT) != -1) ||
	    (item.policy.indexOf(this.params.sT) != -1) ||
	    (item.message.indexOf(this.params.sT) != -1)))
		return false;

	if(-1 == this.filteredHosts.indexOf(item.host))
		return false;
	return true;
}

function createGroupTable(id, results) {

	clearTimeout(resultTableLoadTimeout);
	$('#loadmessage').show();
	$('.resultTable').empty();
	$('.resultTable').remove();
	$("<table id='resultTable"+this.params.fG+"' class='resultTable tablesorter'>")
	.html("<thead><tr><th>"+this.params.gI+"</th><th>Count</th><th>Hosts</th></thead><tbody/>")
	.appendTo(id);

	console.log("Grouping hosts by '"+this.params.gI+"'");
	var hosts = new Array();
	var values = new Array();
	var view = this;
	$.each(results.filter(itemMatches, view), function( i, item ) {
			if(item.severity == 'FAILED')
				view.failed++;
			else if(item.severity == 'WARNING')
				view.warning++;

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
					hosts[list[key]] = new Array();
				hosts[list[key]].push(item.host);
			}
	});
	view.hostCount = Object.keys(hosts).length;
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
			console.log("addResultRows()");
			addResultRows(params.fG, rows, 0, 500, null);
			rows = new Array(250);
		}
	}
	sortTable("#resultTable"+params.fG, {sortList: [[1,1]]});
}

function createResultTable(id, data) {
	var group = '';
	var name = params.fG;

	if(!name)
		name = 'all';

	if (name == 'all' || name == 'new' || name == 'solved')
		group = '<th>Group</th>';

	clearTimeout(resultTableLoadTimeout);
	$('#loadmessage').show();
	$("<table id='resultTable"+name+"' class='resultTable tablesorter'>")
		.html("<thead><tr><th>Host</th>"+group+"<th>Policy</th><th title='Severity'>&nbsp;</th><th>Details</th></thead>")
		.appendTo(id);
	$('<tbody>').appendTo('#resultTable'+name);

	groupBy = new Array();
	var rows = "";
	var view = this;
	var visibleHosts = new Array();
	$.each(data.filter(itemMatches, view), function( i, item ) {
		var severity = 0;

		if(item.severity == 'FAILED') {
			view.failed++;
			severity = 2;
		}
		if(item.severity == 'WARNING') {
			view.warning++;
			severity = 1;
		}
		visibleHosts[item.host] = 1;

		rows += '<tr><td class="host">' + item.host + '</td>';
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
	view.hostCount = Object.keys(visibleHosts).length;
	console.log("Parsing done");
	addResultRows(name, rows.split(/<tr>/), 0, 100, {sortList: [[2,1],[0,0]]});

	if(groupBy.length >= 0) {
		var groupingEnabled = false;
		for(key in groupBy) {
			if(groupBy[key] > 3 && key.length > 3) {
				groupingEnabled = true;
				$('#groupById').append("<option>"+key+"</option>");
			}
		}
		if(groupingEnabled)
			$('#groupById').removeAttr('disabled');
	}
}

views.ResultsView.prototype.update = function(params) {
	var id = this.parentDiv;

	console.log("Loading results start (group="+params.fG+" search="+params.sT+")");
	clean();

	getData(params.fG, function(data) {
		this.failed = 0;
		this.warning = 0;
		this.hostCount = 0;
		this.params = params;
		this.filteredHosts = get_hosts_filtered(params, false);

		$(id).append("<div id='badgeRow'/><div id='tableRow'/>");

		if(!params.gI)
			createResultTable('#tableRow', data.results);
		else
			createGroupTable('#tableRow', data.results);

		var badgeTitle;
		if(params.sT)
			badgeTitle = "<small>Filter</small><br/> " + params.sT;
		else if(params.fG)
			badgeTitle = "<small>Group</small><br/> " + params.fG;
		else
			badgeTitle = "Overall";

		createBadges('#badgeRow', this.failed, this.warning, badgeTitle, this.hostCount);
		createHistogram('#badgeRow', params.fG, params.sT);
	});
};
