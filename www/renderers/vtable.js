// vim: set ts=4 sw=4: 
// Renderer for displaying vulnerability details in a sortable table
// Loads row asynchronously to allow for larger tables

renderers.vtable = function tableRenderer(parentDiv) { 
	this.tableLoadTimeout = undefined;
};

renderers.vtable.prototype.sortTable = function(id, sortOrder) {
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

renderers.vtable.prototype.addResultRows = function(name, rows, offset, count, sortOrder) {
	var renderer = this;
	var r = "";
	for(var i = offset; i < offset+count; i++) {
		if(rows[i])
			r += "<tr>" + rows[i] + "</tr>";
	}
	$("#resultTable tbody").append(r);
	if(offset + count < rows.length) {
		resultTableLoadTimeout = setTimeout(function() {
			$('#loadmessage i').html('Loading results ('+Math.ceil(100*offset/rows.length)+'%)...');
			renderer.addResultRows(name, rows, offset+count, count, sortOrder);
		}, 50);
	} else {
		// Enable table sorting
		if(sortOrder != null)
			this.sortTable("#resultTable", sortOrder);
		else
			$('#loadmessage').hide();

		// Enable clicking
		var view = this;
		$("#resultTable .hosts a").click(function() {
			var key = $(this).attr('id').replace("vuln_","");
			$('#copyHostList').remove();
			$('#filter').append('<textarea id="copyHostList">'+view.hosts[key]+'</textarea>');
			return false;
		});
	}
}

renderers.vtable.prototype.render = function(id, data, params) {

	clearTimeout(this.tableLoadTimeout);
	$('#loadmessage').show();
	$('.resultTable').empty();
	$('.resultTable').remove();
	$("<table id='resultTable' class='resultTable tablesorter' width='100%'>")
	.html("<thead><tr><th>Vulnerability</th><th>Package</th><th>Severity</th><th>Host Count</th><th>Hosts</th></thead><tbody/>")
	.appendTo(id);

	console.log("Grouping hosts by vulnerability");
	$('#loadmessage i').html("Grouping by CVE...");
	var view = this;
	var cves = {};
	var packages = {};
    var hosts = {}
	var values = new Array(1000);
	view.hosts = {};
	$.each(data.results, function( i, item ) {
	        var key = item.cve+"___"+item.pkg;
		if(values[key] === undefined)
			values[key] = item;
		if(view.hosts[key] === undefined)
			view.hosts[key] = new Array();
		view.hosts[key].push(item.host);
		packages[item.pkg] = 1;
		cves[item.cve] = 1;
		hosts[item.host] = 1;
	});
	console.log("Parsing done.");

	var rows = new Array(250);
	for(var key in values) {
		rows.push('<td class="vulnerability"><a href="https://cve.mitre.org/cgi-bin/cvename.cgi?name='+values[key].cve+'">'+ values[key].cve +'</a></td>' +
				'<td class="pkg"><a href="javascript:setLocationHash({ sT: \''+values[key].pkg+'\'}, true);">' + values[key].pkg + '</a></td>' +
				'<td>' + values[key].tags + '</td>' +
				'<td>' + view.hosts[key].length + '</td>' +
				'<td class="hosts"><a href="" id="vuln_'+key+'">Show List</a></td>');
	}
	this.addResultRows(id, rows.sort().reverse(), 0, 250, {sortList: [[0,1]]});
}
