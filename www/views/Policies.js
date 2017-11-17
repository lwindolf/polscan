// vim: set ts=4 sw=4: 
/* A view presenting all available polscan scanners with
   all details and extra statistics for all enabled scanners. */

function Policies() {
	this.name = 'Policies';
	this.renderers = ['ptable'];
	this.defaultRenderer = 'ptable';
	this.filterOptions = {};
}

Policies.prototype = Object.create(PolscanView.prototype);

Policies.prototype.update = function(params) {
	var view = this;

	$("#filter").hide();

	getData("policies", function(data) {
		var totalCount = 0;
		var enabledCount = 0;

		$.each(data.results, function(i,item) {
			if(item.policy) {
				totalCount++;
				if(item.enabled)
					enabledCount++;
			}
		});

		view.addInfoBlock('Policies', totalCount);
		view.addInfoBlock('Enabled', enabledCount);
		view.render(view.parentDiv, data, params);
	});
};
