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
		$(id).html('<div id="filter">');
		addFilterSettings('#filter', params, function() {
			setLocationHash({ sT: $('#search').val(), gI: $('#groupById').val() });
		});

		if(!params.gI)
			createResultTable(params, id, data.results);
		else
			createGroupTable(params, id, data.results);

		var badgeTitle;
		if(!params.fG || params.fG == "all") {
			if(params.sT)
				badgeTitle = "<small>Filter</small><br/> " + params.sT;
			else
				badgeTitle = "Overall";
		} else {
			badgeTitle = "<small>Group</small><br/> " + params.fG;
		}
	
		createBadges('#row1', failed, warning, badgeTitle);
		createHistogram(params.sT?params.sT:params.fG);
	});
};
