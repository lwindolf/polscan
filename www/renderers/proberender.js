// vim: set ts=4 sw=4: 
/* Generic helper to render probe info into a table */

/* Compute probe result severity */
function probeResultApplySeverity(str, severity) {
	if(undefined !== severity) {
		if('critical' in severity && str.match("("+severity.critical+")"))
			return "<span class='FAILED'>"+str+"</span>";
		if('warning' in severity && str.match("("+severity.warning+")"))
			return "<span class='WARNING'>"+str+"</span>";
	}
	return str;
}

/* Split and format a probe result */
function probeRenderResult(probeResult) {

	if(undefined === probeResult['render'])
		return probeResult.stdout;

    try {
		if(probeResult['render']['type'] === 'table') {
			var result = "<div style='overflow:scroll;width:100%'><table class='probes'><tbody>";
			var columnSplit = new RegExp(probeResult['render']['split']);
			var lines = probeResult.stdout.split(/\n/);
			lines.forEach(function(l) {
				result += "<tr><td>";
				result += l.split(columnSplit)
                           .map(function(str) {
								return probeResultApplySeverity(str, probeResult['render']['severity']);
							})
                           .join("</td><td>");
				result += "</td></tr>";
			});
			result += "</tbody></table></div>";
			return result;
		}
		if(probeResult['render']['type'] === 'lines') {
			return probeResult.stdout
                   .split(/\n/)
                   .map(function(str) {
						return probeResultApplySeverity(str, probeResult['render']['severity']);
					})
                   .join('<br/>');
        }
	} catch(e) {
		console.log(e);
		return "Rendering error!";
	}
}

/* Render a probe result into a target table and add a header */
function probeRenderAsRow(id, probe, res) {
	var label  = "#probe_label_" +toId(probe);
	var result = "#probe_result_"+toId(probe);

	if(0 === res.stdout.length) {
		$(label).remove();
		$(result).remove();
		return;
	}

	if(!$("#"+id+" .probes").length)
		$('#'+id+' tbody').prepend("<tr class='probes'><th>Live Probes: </th></tr>");
	if(!$(result).length)
		$('#'+id+' .probes').after("<tr id='probe_result_"+toId(probe)+"'>");

	// Add a result row
	var rendered = "<td style='overflow-x:auto' class='"+probe+"'><b>"+(res["name"]?res["name"]:probe)+"</b><br/>"+probeRenderResult(res)+"</td>";
	$(result).html(rendered);

	// Add label to header
	var severity = '';

	if(-1 !== rendered.indexOf('WARNING'))
		severity = 'WARNING';
	if(-1 !== rendered.indexOf('FAILED'))
		severity = 'FAILED';

	if(!$(label).length) {
		$('#'+id+' tr.probes th').append("<span id='probe_label_"+toId(probe)+"' class='probe_label "+severity+"'>"+probe+"</span>");

		// Initially hide probe results without severity or of type server
		if(severity === '' && res['type'] != 'service') {
			$(result).hide();
			$(label).addClass('hidden');
			$(label).click(function() {
				$(label).removeClass('hidden');
				$(label).addClass('shown');
				$(result).show();
			});
		} else {
			$(label).addClass('shown');
		}
	}

	// Show probe results without severity or of type server
	if(severity !== '') {
		$(label).removeClass('hidden');
		$(label).addClass('shown');
	}

	// Ensure tables overflow correctly
	$('#'+id+' table.probes').parent().width($('#'+id).parent().width());

	// FIXME: Sort result table alphabetically and by severity
}
