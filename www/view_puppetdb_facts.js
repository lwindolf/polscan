// vim: set ts=4 sw=4: 
/* Show PuppetDB fact details / statistics */

views.Puppetdb_factsView = function Puppetdb_factsView(parentDiv) {
	this.parentDiv = parentDiv;
	this.filterOptions = {};
};

views.Puppetdb_factsView.prototype.getFactDetails = function(params) {
	var view = this;

	getAPI("puppetdb/node_facts", function(data) {
		var j = 0;
console.log(JSON.stringify(data));
		$("<input type='button' value='Back to Overview' onclick='setLocationHash({view: \"puppetdb\"})'/>"+
		"<h3>Latest Facts for "+params.h+"</h3><p>Click a row for report details.</p><table width='100%' class='resultTable tablesorter'><thead><tr><th>Fact Name</th><th>Fact Value</th></thead><tbody>"+
		data.map(function(i) {
			return "<tr class='factrow'>"+
			"<td>"+i.path.join("::")+"</td>"+
			"<td><span style='overflow:auto;width:90%;'>"+i.value+"</span></td>";
		}).join("") + 
		"</tbody></table>").appendTo('#row2');
	}, undefined, [{ hostname: params.h }]);
}

views.Puppetdb_factsView.prototype.update = function(params) {
	clean();
	$('#filter').hide();
	$(this.parentDiv).css('margin-left', '12px');
	this.getFactDetails(params);
}
