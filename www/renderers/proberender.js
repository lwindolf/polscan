// vim: set ts=4 sw=4: 
/* Generic helper to render probe info */

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
	if(0 === res.stdout.length)
		return;

	if(!$("#"+id+" .probes").length)
			$('#'+id+' tbody').prepend("<tr class='probes'><th>Live Probes: </th></tr>");

	// Add a result row
	var rendered = "<tr id='probe_result_"+toId(probe)+"'><td style='overflow-x:auto' class='"+probe+"'><b>"+(res["name"]?res["name"]:probe)+"</b><br/>"+probeRenderResult(res)+"</td></tr>";
	$('#'+id+' tr.probes').after(rendered);

	// Add label to header
	var severity = '';

	if(-1 !== rendered.indexOf('WARNING'))
		severity = 'WARNING';
	if(-1 !== rendered.indexOf('FAILED'))
		severity = 'FAILED';

	$('#'+id+' tr.probes th').append("<span id='probe_label_"+toId(probe)+"' class='probe_label "+severity+"'>"+probe+"</span>");

	// Hide probe results without severity or of type server
	if(severity === '' && res['type'] != 'service') {
		$('#probe_result_'+toId(probe)).hide();
		$('#probe_label_'+toId(probe)).addClass('hidden');
		$('#probe_label_'+toId(probe)).click(function() {
			$('#probe_label_'+toId(probe)).removeClass('hidden');
			$('#probe_label_'+toId(probe)).addClass('shown');
			$('#probe_result_'+toId(probe)).show();
		});
	} else {
		$('#probe_label_'+toId(probe)).addClass('shown');
	}

	// Ensure tables overflow correctly
	$('#'+id+' table.probes').parent().width($('#'+id).parent().width());

	// FIXME: Sort result table alphabetically and by severity
}
