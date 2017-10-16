// vim: set ts=4 sw=4: 
// Renderer for displaying finding details in a sortable table
// Loads row asynchronously to allow for larger tables

renderers.itable = function itableRenderer(parentDiv) { 
	this.tableLoadTimeout = undefined;
};

renderers.itable.prototype.sortTable = function(id, sortOrder) {
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
}

renderers.itable.prototype.addResultRows = function(name, rows, offset, count, sortOrder) {
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
}

renderers.itable.prototype.createGroupTable = function(id, data, params) {

	clearTimeout(this.tableLoadTimeout);
	$('#loadmessage').show();
	$('.resultTable').empty();
	$('.resultTable').remove();
	$("<table id='resultTable"+params.gT+"' class='resultTable tablesorter'>")
	.html("<thead><tr><th>"+params.gT+"</th><th>"+params.iT+"</th></thead><tbody/>")
	.appendTo(id);

	console.log("Grouping hosts by '"+params.gT+"'");
	var groups = {};
	var groups_host_count = {};
	$.each(data.results, function( i, item ) {
			var groupName = getGroupByHost(params.gT, item.host);
			var groupClassName = groupName.replace(/[\.#\/]/g, "_");

			if(undefined === groups[groupName]) {
				groups[groupName] = {};
				groups_host_count[groupName] = 0;
			}
			groups_host_count[groupName]++;

			$.each(item.values.split(/ /), function(i, value) {
				if(value === "")
					return;
				if(groups[groupName][value] === undefined)
					groups[groupName][value] = 0;

				groups[groupName][value]++;
			});
	});
	console.log("Parsing done.");

	var rows = new Array(250);
	for(var group in groups) {
		rows.push('<td class="groupByValue">' + group + '</td>' +
				'<td class="count">' + Object.keys(groups[group]).join(' ') + '</td>');
		// Avoid OOM
		if(rows.length >= 250) {
			this.addResultRows(params.gT, rows, 0, 500, null);
			rows = new Array(250);
		}
	}
	this.sortTable("#resultTable"+params.gT, {sortList: [[0,0]]});
}

renderers.itable.prototype.render = function(id, data, params) {
	if(!params.gT)
		params.gT = 'Subdomain-Prefix';

	// FIXME: dirty legend avoidance hack
	$('#legend').hide();
	this.createGroupTable('#row2', data, params);
}
