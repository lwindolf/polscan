// vim: set ts=4 sw=4: 
// The Dashboard...

function Dashboard() {
	this.name = 'Dashboard';
	this.renderers = ['dashboard'];
	this.defaultRenderer = 'dashboard';
	this.filterOptions = {};
}

Dashboard.prototype = Object.create(PolscanView.prototype);

Dashboard.prototype.update = function(params) {
	var view = this;

	$("#filter").hide();

	getData("overview", function(data) {
		view.addInfoBlock('Hosts', data.hostCount);
		view.addInfoBlock('Failed', data.FAILED);
		view.addInfoBlock('Warnings', data.WARNING);
		view.render(view.parentDiv, data, params);
	});
};
