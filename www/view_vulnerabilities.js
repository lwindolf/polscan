// vim: set ts=4 sw=4: 
// View for displaying vulnerabilities in a sortable table

views.VulnerabilitiesView = function VulnerabilitiesView(parentDiv) {
	this.parentDiv = parentDiv;
	this.filterOptions = {
		//filterby: true,
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
		}, 250);
	} else {
		// Enable table sorting
		if(sortOrder != null)
			sortTable("#resultTable", sortOrder);

		// Enable clicking
		$("#resultTable .host").click(function() {
			setLocationHash({ sT: $(this).html()}, true);
		});
	    $('#resultTable a.more').click(function(event){
    	    event.preventDefault();
   		    $(this).hide().prev().hide();
   		    $(this).next().show();        
   		});
	}
}

function vulnMatches(item) {
	if(params.sT &&
	  !((undefined !== item.host && item.host.indexOf(this.params.sT) != -1) ||
	    (undefined !== item.pkg && item.pkg.indexOf(this.params.sT) != -1)))
		return false;
//	if(-1 == this.filteredHosts.indexOf(item.host))
//		return false;
	return true;
}

function createVulnGroupTable(id, results) {

	clearTimeout(resultTableLoadTimeout);
	$('#loadmessage').show();
	$('.resultTable').empty();
	$('.resultTable').remove();
	$("<table id='resultTable' class='resultTable tablesorter'>")
	.html("<thead><tr><th>Vulnerability</th><th>Package</th><th>Severity</th><th>Count</th><th>Hosts</th></thead><tbody/>")
	.appendTo(id);

	console.log("Grouping hosts by vulnerability");
	var hosts = new Array();
	var values = new Array();
	var view = this;
	$.each(results.filter(vulnMatches, view), function( i, item ) {
        var key = item.cve+"___"+item.pkg;
		if(values[key] === undefined)
			values[key] = item;
		if(hosts[key] === undefined)
			hosts[key] = new Array();
		hosts[key].push(item.host);
	});
	view.hostCount = Object.keys(hosts).length;
	console.log("Parsing done.");

	var rows = new Array(250);
	for(var key in values) {
		var hostlinks = "";
		var i = 0;
		for(var h in hosts[key]) {
			if(i++ == 15) {
				hostlinks += ' <a href="#" class="more">...</a><span style="display:none">';
			}
			hostlinks += "<a href='javascript:setLocationHash({ sT: \""+hosts[key][h]+"\"}, true);' class='host'>"+hosts[key][h]+"</a> ";
		}
		if(i >= 15)
			hostlinks += '</span>';

		rows.push('<td class="vulnerability"><a href="https://cve.mitre.org/cgi-bin/cvename.cgi?name='+values[key].cve+'">'+ values[key].cve +'</a></td>' +
				'<td class="pkg"><a href="javascript:setLocationHash({ sT: \''+values[key].pkg+'\'}, true);">' + values[key].pkg + '</a></td>' +
				'<td class="tags">' + values[key].tags + '</td>' +
				'<td class="count">' + hosts[key].length + '</td>' +
				'<td class="hosts">' + hostlinks + '</td>');
		// Avoid OOM
		if(rows.length >= 250) {
			addVulnResultRows(rows, 0, 250, null);
			rows = new Array(250);
		}
	}
	sortTable("#resultTable", {sortList: [[0,1]]});
}

views.VulnerabilitiesView.prototype.update = function(params) {
	var id = this.parentDiv;

	console.log("Loading results start (search="+params.sT+")");
	clean();

	getData("vulnerabilities", function(data) {
		this.hostCount = 0;
		this.params = params;
		this.filteredHosts = get_hosts_filtered(params, false);

		$(id).append("<div id='tableRow'/>");

		createVulnGroupTable('#tableRow', data.results);
	});
};
