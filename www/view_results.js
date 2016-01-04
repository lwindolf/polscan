// vim: set ts=4 sw=4: 
// View for displaying finding details in a sortable table

views.ResultsView = function ResultsView(parentDiv, params) {
	this.parentDiv = parentDiv;
};

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
