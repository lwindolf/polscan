// vim: set ts=4 sw=4:

// Returns array of known inventories
function getInventoryTypes() {
	var results = [];
	var data = getCachedData("overview");
	$.each(data.overview, function(i, item) {
		if(item.inventory)
			results.push(item.inventory);
	});
	return results;
}

// Add all inventory type names to a <select>
function loadInventoryTypes(id, selected) {
	var options = [];

	$.each(getInventoryTypes(), function(i, inventory) {
		options.push('<option value="'+inventory+'">'+inventory+'</option>');
	});

	$('#'+id).append(options.sort().join(''));
	$('#'+id+" option[value='"+selected+"']").attr('selected', true);
}

// Add all netedge type names to a <select>
function loadNetedgeTypes(id, selected) {
	var options = [];
	getData("overview", function(data) {
		$.each(data.overview, function(i, item) {
			if(item.netedge) {
				options.push('<option value="'+item.netedge+'">'+item.netedge+'</option>');
			}
		});
		$('#'+id).append(options.sort().join(''));
		$('#'+id+" option[value='"+selected+"']").attr('selected', true);
	});
}

// Add all findings group names to a <select>
function loadFindingGroups(id, selected) {
	var options = [
		'<option value="all">&lt;All></option>',
		'<option value="new">&lt;New></option>',
		'<option value="solved">&lt;Solved></option>'
	];
	getData("overview", function(data) {
		$.each(data.overview, function(i, item) {
			if(item.group) {
				options.push('<option value="'+item.group+'">'+item.group+'</option>');
			}
		});
		$('#'+id).append(options.sort().join(''));
		$('#'+id+" option[value='"+selected+"']").attr('selected', true);
	});
}

// FIXME: change to renderer only and connect as onChange
function applyRendererSettings(date) {
	var o = view.current.filterOptions;
	var params = {};
	if(!o)
		o = {};

	if(o.inventory)
		params.iT = $('#inventoryType').val();
	if(o.findings)
		params.fG = $('#findingsGroup').val();
	if(o.groupbyid)
		params.gI = $('#groupById').val();
	if(o.groupbyhg)
		params.gT = $('#hostmapGroupType').val();
	if(o.filterby) {
		params.fT = $('#hostmapFilterType').val();
		params.fV = $('#hostmapFilterValue').val();
	}
	if(o.host)
		params.h = $('#selectedHost').val();
	if(o.nt)
		params.nt = $('#netedgeType').val();

	changeLocationHash(params);
}

function loadRendererSettings(id, params, o) {
	if(!$('#rendererSettings').length)
		$(id).prepend('<div id="rendererSettings">');
	var fbox = $('#rendererSettings');

	fbox.empty().show();

	if(o.inventory)
		fbox.append('<span class="label">Type</span> <select id="inventoryType"></select> ');
	if(o.nt)
		fbox.append('<span class="label">Type</span> <select id="netedgeType"></select> ');
	if(o.findings)
		fbox.append('<span class="label">Findings</span> <select id="findingsGroup"></select> ');

	if(o.groupbyid && params.r === 'table') {
		fbox.append('<span class="label">Group Hosts By</span> <select id="groupById"><option name="none"></option></select> ');
		if(params.gI && params.gI != '')
			$('#groupById').append('<option name="'+params.gI+'" selected>'+params.gI+'</option>');
	}
	if(o.groupbyhg && -1 !== ['hostmap', 'treemap', 'netgraph'].indexOf(params.r))
		fbox.append('<span class="label">Group Hosts by</span> <select id="hostmapGroupType"></select> ');

	if(o.host) {
		fbox.append('<hr/>Host <input type="text" value="'+(params.h !== undefined?params.h:'')+'" list="availableHosts" id="selectedHost"/>' +	
				' <datalist id="availableHosts"/>');
		getData("hosts", function(data) {
			$.each(data.results, function(host) {
				$('#availableHosts').append('<option value="'+host+'">');
			});
		});
	}

	getData('host_groups', function(data) {
		try {
			if(o.inventory)
				loadInventoryTypes('inventoryType', params.iT);
			if(o.nt)
				loadNetedgeTypes('netedgeType', params.nt);
			if(o.findings)
				loadFindingGroups('findingsGroup', params.fG);
			if(o.groupbyhg)
				loadHostGroupTypes(resultCache['host_groups'].results, 'hostmapGroupType', params.gT, true);
		} catch(e) {
			error("Loading some host group definitions failed! ("+e+")");
		}
		$('#hostmapFilterType').change(function() {
			loadHostGroupValues(resultCache['host_groups'].results, 'hostmapFilterValue', $('#hostmapFilterType').val(), undefined, true);
		});
	});

	// FIXME
//	$('.filterGo').click(function() {
//		applyFilterSettings();
//	});
}
