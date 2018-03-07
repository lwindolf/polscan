// vim: set ts=4 sw=4: 
// View for displaying vulnerabilities in a sortable table

views.VulnerabilitiesView = function VulnerabilitiesView(parentDiv) {
	this.parentDiv = parentDiv;
	this.filterOptions = {
		filterby: true,
		search: true
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
			console.log(e);
		}
		console.log("Table sorting done.");
		$('#loadmessage').hide();
	}, 100);
}

function addVulnResultRows(rows, offset, count, sortOrder) {
	var r = "";
	for(var i = offset; i < offset+count; i++) {
		if(rows[i])
			r += "<tr>" + rows[i] + "</tr>";
	}
	$("#resultTable tbody").append(r);
	if(offset + count < rows.length) {
		resultTableLoadTimeout = setTimeout(function() {
			$('#loadmessage i').html('Loading results ('+Math.ceil(100*offset/rows.length)+'%)...');
			addVulnResultRows(rows, offset+count, count, sortOrder);
		}, 50);
	} else {
		// Enable table sorting
		if(sortOrder != null)
			sortTable("#resultTable", sortOrder);
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

function vulnMatches(item) {
	if(params.sT &&
	  !((undefined !== item.host && item.host.indexOf(this.params.sT) != -1) ||
	    (undefined !== item.cve && item.cve.indexOf(this.params.sT) != -1) ||
	    (undefined !== item.pkg && item.pkg.indexOf(this.params.sT) != -1)))
		return false;
	if(undefined !== filteredHosts &&
       -1 == this.filteredHosts.indexOf(item.host))
		return false;
	return true;
}

function createVulnGroupTable(id, results) {

	clearTimeout(resultTableLoadTimeout);
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
	$.each(results.filter(vulnMatches, view), function( i, item ) {
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
	viewInfoAddBlock('Hosts', Object.keys(hosts).length);
	viewInfoAddBlock('Vulnerabilities', Object.keys(view.hosts).length);
	viewInfoAddBlock('Packages', Object.keys(packages).length);
	viewInfoAddBlock('CVEs', Object.keys(cves).length);
	$('#tableRow').width('100%');
	addVulnResultRows(rows.sort().reverse(), 0, 250, {sortList: [[0,1]]});
}

views.VulnerabilitiesView.prototype.update = function(params) {
	var id = this.parentDiv;

	console.log("Fetching results start (search="+params.sT+")");
	clean();

	$('#loadmessage').show();
	$('#loadmessage i').html("Fetching data...");
	getData("vulnerabilities", function(data) {
		this.params = params;
		this.filteredHosts = get_hosts_filtered(params, false);

		viewInfoReset('Vulnerabilities');

		$(id).append("<div id='tableRow' width='100%'/>");

		createVulnGroupTable('#tableRow', data.results);
	});
};
