// vim: set ts=4 sw=4: 
// View for displaying finding details in a sortable table

views.ResultsView = function ResultsView(parentDiv, params) {
	this.parentDiv = parentDiv;
};

function createGroupTable(params, id, results) {
	var filteredHosts = get_hosts_filtered(params)

	$('.resultTable').empty();
	$('.resultTable').remove();
	$("<table id='resultTable"+params.fG+"' class='resultTable tablesorter'>")
	.html("<thead><tr><th>"+params.gI+"</th><th>Count</th><th>Hosts</th></thead>")
	.appendTo(id);
	$('<tbody id="groupedData">').appendTo('#resultTable'+params.fG);

	console.log("Grouping hosts by '"+params.gI+"'");
	console.time("grouping");
	var hosts = new Array();
	var values = new Array();
	$.each(results, function( i, item ) {
			if(item.message.indexOf(params.gI) == -1)
				return;

			if(params.sT &&
			  !((item.host.indexOf(params.sT) != -1) ||
				(item.policy.indexOf(params.sT) != -1) ||
				(item.message.indexOf(params.sT) != -1)))
				return;

			if(-1 == filteredHosts.indexOf(item.host))
				return;

			// Split message after colon by commata (if there is at 
			// least one or by spaces...
			var listStr = item.message.substring(params.gI.length + 2);
			var list;

			if(listStr.indexOf(',') != -1)
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
	console.timeEnd("grouping");

	console.time("table");
	console.time("tablebuild");
	var rows = new Array(250);
	for(var key in values) {
		var hostlinks = "";
		for(var h in hosts[key])
			hostlinks += "<a href='javascript:setLocationHash({ fG: \"all\", sT: \""+hosts[key][h]+"\"}, true);'>"+hosts[key][h]+"</a> ";
		rows.push('<tr><td class="groupByValue">' + key + '</td>' +
				'<td class="count">' + hosts[key].length + '</td>' +
				'<td class="hosts">' + hostlinks + '</td></tr>');
		// Avoid OOM
		if(rows.length >= 250) {
			document.getElementById('groupedData').innerHTML += rows.join(" ");
			rows = new Array(250);
		}
	}
	document.getElementById('groupedData').innerHTML += rows.join(" ");
	console.timeEnd("tablebuild");
	console.timeEnd("table");

	console.time("sorting");
	$("#resultTable"+params.fG).tablesorter({sortList: [[1,1]]});
	console.timeEnd("sorting");
}

var resultTableLoadTimeout;

function addResultRows(id, rows, offset, count) {
	var r = "";
	for(var i = offset; i < offset+count; i++) {
		if(rows[i])
			r += "<tr>" + rows[i];
	}
	$(id+" tbody").append(r);
	if(offset + count < rows.length) {
		resultTableLoadTimeout = setTimeout(function() {
			$('#loadmessage i').html('Loading results ('+Math.ceil(100*offset/rows.length)+'%)...');
			addResultRows(id, rows, offset+count, count);
		}, 100);
	} else {
		// Enable table sorting
		$('#loadmessage i').html('Sorting results...');
		console.log("Table setup done.");
		resultTableLoadTimeout = setTimeout(function() {
			$(id).tablesorter({sortList: [[2,1],[0,0]]});
			console.log("Table sorting done.");
			$('#loadmessage').hide();
		}, 100);
	}
}

function createResultTable(params, id, data) {
	var filteredHosts = get_hosts_filtered(params)
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
	warning = 0;
	failed = 0;
	$.each(data, function( i, item ) {
			var severity = 0;

			if(!params.sT && item.severity == 'OK')
				return;

			if(-1 == filteredHosts.indexOf(item.host))
				return;

			if(params.sT &&
				!((item.host.indexOf(params.sT) != -1) ||
				(item.policy.indexOf(params.sT) != -1) ||
				(item.message.indexOf(params.sT) != -1)))
				return;

			if(item.severity == 'FAILED') {
				failed++;
				severity = 2;
			}
			if(item.severity == 'WARNING') {
				warning++;
				severity = 1;
			}

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
	console.log("Parsing done");
	addResultRows("#resultTable"+name, rows.split(/<tr>/), 0, 100);

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

views.ResultsView.prototype.update = function(params) {
	var id = this.parentDiv;

	console.log("Loading results start (search="+params.sT+")");
	clean();

	getData(params.fG, function(data) {
			$(id).append("<div id='badgeRow'/><div id='tableRow'/>");

			addFilterSettings('#tableRow', params, function() {
					setLocationHash({ sT: $('#search').val(), gI: $('#groupById').val() });
					});

			if(!params.gI)
				createResultTable(params, '#tableRow', data.results);
			else
				createGroupTable(params, '#tableRow', data.results);

			var badgeTitle;
			if(params.sT)
				badgeTitle = "<small>Filter</small><br/> " + params.sT;
			else if(params.fG)
				badgeTitle = "<small>Group</small><br/> " + params.fG;
			else
				badgeTitle = "Overall";

			createBadges('#badgeRow', failed, warning, badgeTitle);
			createHistogram('#badgeRow', params.fG, params.sT);
	});
};
