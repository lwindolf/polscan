// vim: set ts=4 sw=4: 
// Polscan view base object
//
// A polscan view presents one type of data (e.g. scan results or inventories)
// and allows to filter by data type specific filter options and to switch 
// between different data type specific renderers
//
// PolscanView is both a view singleton and factory for views and renderers

function PolscanView(div) {
	this.current = undefined;
	this.viewName = undefined;		// Name of active view impl.
	this.rendererName = undefined;  // Name of active renderer impl.
	this.parentDiv = div;
	this.filterOptions = { };
}

// Generic host list method extracts name of filtered hosts from the column
// of a result table (which needs to have a column with class 'host' set) or
// a host map (which needs to have div's with class 'hostMapBox'
PolscanView.prototype.onCopyHosts = function() {
	$('#hostlist').html('<textarea id="copyHostList">');

	// Variant 1: result table
	var hosts = $('.host:visible').map(function() {
		return $(this).html();
	}).get();

	// Variant 2: a host map
	if(0 === hosts.length)
		hosts = $('div.hostMapBox:visible').map(function() {
			if($(this).hasClass('UNKNOWN'))
				return;
			if($(this).hasClass('OK'))
				return;
			return $(this).attr('host')
		}).get();

	$('#hostlist textarea').html(Array.from(new Set(hosts)).join('\n'));
	$('#hostlist').show();
}

// Info blocks are basically numbers with a name to be found at the
// top of the screen to the right of the view name
PolscanView.prototype.addInfoBlock = function(name, value) {
	var color = "";
	if('Failed' === name || 'Vulnerabilities' === name)
		color = "style='color:#f77'";
	if('Warnings' === name)
		color = "style='color:#dd7'";
	$('#viewinfo').append("<span class='block'><span "+color+" class='count'>"+value+"</span><br/>"+name+"</span>");
}

// Reset the view info header. To be called on view changes
PolscanView.prototype.resetInfo = function() {
	$('#viewinfo').html('<span class="block name">'+this.name+'</span><div class="switches"/>');
}

// Add renderer switches to the view info header. These are icons
// floating to the right of the info header
PolscanView.prototype.addRenderers = function() {
	var params = getParams();

	// Do not show switches if there is only one renderer
	if(this.current.renderers.length <= 1)
		return;

	$.each(this.current.renderers, function(i, r) {
		$('#viewinfo .switches').append("<span class='switch switch_"+r+"'><img src='img/"+r+"_icon.png'/></span>");
		if(view.rendererName === r)
			$('.switch_'+r).addClass("current");

		$('.switch_'+r).click(function() {
			var params = getParams();
			params.r = r;
			setLocationHash(params);
		});
	});
}

PolscanView.prototype.ajaxError = function(j, x, e) {
	console.log("Failed to load script dependency! ("+e+")");
	error("Failed to load script dependency! ("+e+")");
}

// Render data using a named renderer into an element given by id
// and passes the given params along
PolscanView.prototype.render = function(id, data, params) {
	var view = this;
	var rName = params.r;
	if(undefined === rName || '' === rName)
		rName = view.defaultRenderer;

	if(undefined !== renderers[rName]) {
		var renderer = new renderers[rName]();
		renderer.render(id, data, params);
		loadRendererSettings('#legend', params, view.filterOptions);
		return;
	}

	// We need to load the renderer first...
	$.getScript("renderers/"+rName+".js")
	.done(function(s, t) {
		// Call ourselves again to run the renderer
		view.render(id, data, params);
	})
	.fail(view.ajaxError);
}

PolscanView.prototype.getName = function() {
	return view.viewName;
}
PolscanView.prototype.getRendererName = function() {
	return view.rendererName;
}

PolscanView.prototype.setContainer = function(div) {
	this.parentDiv = div;
}

PolscanView.prototype.load = function(name, params) {
	var view = this;

	$.getScript("views/"+name+".js")
	.done(function(s, t) {
		try {
			view.current = new window[name]();
			view.viewName = name;
			if(undefined === params.r || '' === params.r)
				view.rendererName = view.current.defaultRenderer;
			else
				view.rendererName = params.r;

			$('#results').html('<div id="errors"/><div id="row1"></div><div id="loadmessage"><i>Loading ...</i></div><div id="row2"/>');
			$('#errors').hide();
			$('#loadmessage').hide();

			view.current.setContainer('#results');
			view.current.resetInfo();
			view.addRenderers();

			loadFilterSettings(params, view.current.filterOptions);
			view.current.update(params);
		} catch(e) {
			view.ajaxError(undefined, undefined, e);
		}
	})
	.fail(view.ajaxError);
}

